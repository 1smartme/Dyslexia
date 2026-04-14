import os
import pickle

import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import GradientBoostingClassifier
from sklearn.impute import SimpleImputer
from sklearn.metrics import (
    accuracy_score,
    balanced_accuracy_score,
    classification_report,
    confusion_matrix,
    f1_score,
    roc_auc_score,
)
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
    pos, neg = int(y.sum()), int((y == 0).sum())
    print(f"Dataset: {len(df)} rows | positive={pos} negative={neg} (target={TARGET_COL})")

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

    y_train_pred = pipeline.predict(X_train)
    y_pred = pipeline.predict(X_test)
    train_acc = accuracy_score(y_train, y_train_pred)
    val_acc = accuracy_score(y_test, y_pred)
    val_balanced_acc = balanced_accuracy_score(y_test, y_pred)
    val_macro_f1 = f1_score(y_test, y_pred, average="macro", zero_division=0)
    cm = confusion_matrix(y_test, y_pred)
    val_roc = None
    if y_test.nunique() > 1 and hasattr(pipeline, "predict_proba"):
        y_prob = pipeline.predict_proba(X_test)[:, 1]
        val_roc = float(roc_auc_score(y_test, y_prob))

    print()
    print("=" * 52)
    print(" MODEL METRICS (Gradient Boosting on session features)")
    print("=" * 52)
    print(f"  Train rows:     {len(y_train)}")
    print(f"  Validate rows: {len(y_test)}")
    print(f"  Accuracy (train):       {train_acc * 100:6.2f}%  ({train_acc:.4f})")
    print(f"  Accuracy (validation):  {val_acc * 100:6.2f}%  ({val_acc:.4f})")
    print(f"  Balanced acc (val):     {val_balanced_acc * 100:6.2f}%  ({val_balanced_acc:.4f})")
    print(f"  Macro F1 (val):         {val_macro_f1:6.4f}")
    if val_roc is not None:
        print(f"  ROC-AUC (val):          {val_roc:6.4f}")
    else:
        print("  ROC-AUC (val):          n/a (single class in validation split)")
    if cm.shape == (2, 2):
        tn, fp, fn, tp = cm.ravel()
        print(f"  Confusion [tn fp; fn tp]:  [{tn:4d} {fp:4d}]  [{fn:4d} {tp:4d}]")
    else:
        print(f"  Confusion matrix:\n{cm}")
    if X_train is X_test:
        print("  Note: train == val split (small data); metrics are in-sample on full CSV.")
    print("=" * 52)
    print()

    print("Validation classification report:")
    print(classification_report(y_test, y_pred, zero_division=0))
    print("Validation confusion matrix (full):")
    print(cm)

    os.makedirs(os.path.dirname(MODEL_PATH), exist_ok=True)
    with open(MODEL_PATH, "wb") as f:
        pickle.dump(pipeline, f)

    print(f"Model trained and saved at: {MODEL_PATH}")


if __name__ == "__main__":
    main()
