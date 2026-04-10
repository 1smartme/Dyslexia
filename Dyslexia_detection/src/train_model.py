import os
import pickle

import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import GradientBoostingClassifier
from sklearn.impute import SimpleImputer
from sklearn.metrics import classification_report, confusion_matrix, roc_auc_score
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sklearn.utils.class_weight import compute_sample_weight

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_PATH = os.path.join(BASE_DIR, "../data/training_from_sessions.csv")
MODEL_PATH = os.path.join(BASE_DIR, "../models/gb_eye_pipeline.pkl")
TARGET_COL = "presence_of_dyslexia"

NUMERIC_FEATURES = [
    "age",
    "grade",
    "family_history",
    "calibration_quality",
    "fixation_mean_dur",
    "fixation_count",
    "saccade_mean_amp",
    "regressions_count",
    "scanpath_entropy",
    "total_reading_time",
    "errors_count",
]
CATEGORICAL_FEATURES = ["language", "device_type"]
MODEL_FEATURES = NUMERIC_FEATURES + CATEGORICAL_FEATURES


def build_pipeline() -> Pipeline:
    numeric_pre = Pipeline(
        steps=[
            ("imputer", SimpleImputer(strategy="median")),
            ("scaler", StandardScaler()),
        ]
    )
    categorical_pre = Pipeline(
        steps=[
            ("imputer", SimpleImputer(strategy="most_frequent")),
            ("onehot", OneHotEncoder(handle_unknown="ignore")),
        ]
    )

    pre = ColumnTransformer(
        transformers=[
            ("num", numeric_pre, NUMERIC_FEATURES),
            ("cat", categorical_pre, CATEGORICAL_FEATURES),
        ]
    )

    return Pipeline(
        steps=[
            ("pre", pre),
            ("gb", GradientBoostingClassifier(n_estimators=120, learning_rate=0.08, random_state=42)),
        ]
    )


def main():
    if not os.path.exists(DATA_PATH):
        raise FileNotFoundError(f"Training data not found at: {DATA_PATH}")

    df = pd.read_csv(DATA_PATH)
    missing_cols = [col for col in MODEL_FEATURES + [TARGET_COL] if col not in df.columns]
    if missing_cols:
        raise ValueError(f"Training data is missing required columns: {missing_cols}")

    X = df[MODEL_FEATURES].copy()
    y = df[TARGET_COL].astype(int)
    pipeline = build_pipeline()

    # Use a holdout split for quick quality visibility on each retrain.
    can_stratify = y.nunique() > 1 and y.value_counts().min() >= 2 and len(df) >= 8
    if can_stratify:
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.25, random_state=42, stratify=y
        )
    else:
        X_train, X_test, y_train, y_test = X, X, y, y
        print("WARNING: Dataset too small/imbalanced for reliable stratified split; using full data for train/eval.")

    sample_weight = compute_sample_weight(class_weight="balanced", y=y_train)
    pipeline.fit(X_train, y_train, gb__sample_weight=sample_weight)

    y_pred = pipeline.predict(X_test)
    print("Validation classification report:")
    print(classification_report(y_test, y_pred, zero_division=0))
    print("Validation confusion matrix:")
    print(confusion_matrix(y_test, y_pred))

    if y_test.nunique() > 1 and hasattr(pipeline, "predict_proba"):
        y_prob = pipeline.predict_proba(X_test)[:, 1]
        print(f"Validation ROC-AUC: {roc_auc_score(y_test, y_prob):.4f}")

    os.makedirs(os.path.dirname(MODEL_PATH), exist_ok=True)
    with open(MODEL_PATH, "wb") as f:
        pickle.dump(pipeline, f)

    print(f"Model trained and saved at: {MODEL_PATH}")


if __name__ == "__main__":
    main()
