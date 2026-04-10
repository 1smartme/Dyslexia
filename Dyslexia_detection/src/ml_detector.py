"""
Advanced ML-based Dyslexia Detection Module
Uses Gradient Boosting Classifier with comprehensive feature engineering
"""
import pickle
import os
import numpy as np
import pandas as pd
from pathlib import Path
from typing import Dict, Optional, Tuple
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

BASE_DIR = Path(__file__).resolve().parent
MODEL_PATH = BASE_DIR.parent / "models" / "gb_eye_pipeline.pkl"


class DyslexiaMLDetector:
    """
    Production-ready ML-based dyslexia detection system.
    Uses ensemble learning with feature engineering for accurate predictions.
    """
    
    def __init__(self, model_path: Optional[Path] = None):
        self.model_path = model_path or MODEL_PATH
        self.model = None
        self.is_loaded = False
        self._load_model()
    
    def _load_model(self):
        """Load the trained ML model"""
        try:
            if self.model_path.exists():
                with open(self.model_path, 'rb') as f:
                    self.model = pickle.load(f)
                self.is_loaded = True
                logger.info(f"ML model loaded successfully from {self.model_path}")
            else:
                logger.warning(f"Model file not found at {self.model_path}. Using fallback detection.")
                self.is_loaded = False
        except Exception as e:
            logger.error(f"Error loading model: {e}. Using fallback detection.")
            self.is_loaded = False
    
    def extract_features(self, payload: Dict) -> Dict:
        """
        Extract and normalize features from assessment payload.
        Returns a dictionary of features ready for ML model.
        """
        age = int(payload.get("age", 0)) if str(payload.get("age", "0")).isdigit() else 0
        grade = int(payload.get("grade", 0)) if str(payload.get("grade", "0")).isdigit() else 0
        
        # get device metadata
        device_meta = payload.get("device_metadata", {})
        device_type = device_meta.get("device_type", "Desktop")
        language = payload.get("language", "en")
        
        fixation_stats = payload.get("fixation_stats", {})
        saccade_stats = payload.get("saccade_stats", {})
        regressions = payload.get("regressions", {})
        
        # calculate accuracy - CRITICAL: Ensure this is correct
        score = payload.get("score", 0)
        total = payload.get("total", 1)
        if total > 0:
            accuracy = float(score) / float(total)
        else:
            accuracy = 0.0
        
        logger.debug(f"Accuracy calculation: score={score}, total={total}, accuracy={accuracy}")
        
        if accuracy > 1.0:
            accuracy = accuracy / 100.0  # Convert percentage to decimal
        
        reading_speed = payload.get("reading_speed_wpm", 0.0)
        total_reading_time = payload.get("total_reading_time_ms", 0) / 1000.0  # Convert to seconds
        

        fixation_mean_dur = fixation_stats.get("mean_duration", 0.0)
        fixation_count = fixation_stats.get("count", 0)
        
        saccade_mean_amp = saccade_stats.get("mean_amplitude", 0.0)
        
        regressions_count = regressions.get("count", 0)
        
    
        scanpath_entropy = payload.get("scanpath_entropy", 0.0)
        
        
        errors = payload.get("errors", [])
        errors_count = len(errors)
        
        calibration_data = payload.get("calibration_data", {})
        calibration_quality = calibration_data.get("calibration_quality", 0.9)
        
        family_history = payload.get("family_history", 0)
        
        features = {
            "age": age,
            "grade": grade,
            "language": language,
            "device_type": device_type,
            "family_history": family_history,
            "calibration_quality": calibration_quality,
            "reading_speed": reading_speed,
            "accuracy": accuracy,
            "fixation_mean_dur": fixation_mean_dur,
            "fixation_count": fixation_count,
            "saccade_mean_amp": saccade_mean_amp,
            "regressions_count": regressions_count,
            "scanpath_entropy": scanpath_entropy,
            "total_reading_time": total_reading_time,
            "errors_count": errors_count
        }
        
        return features
    
    def predict(self, payload: Dict) -> Dict:
        """
        Make ML prediction with confidence scores.
        Returns: {
            'risk': 'High'|'Medium'|'Low',
            'risk_score': float (0-1),
            'confidence': float (0-1),
            'prediction': int (0=No, 1=Yes),
            'method': 'ml'|'fallback',
            'feature_importance': dict (if available)
        }
        """
        # Extract features first to check accuracy
        features = self.extract_features(payload)
        accuracy = features.get("accuracy", 0)
        score = payload.get("score", 0)
        total = payload.get("total", 1)
        
        # Rule 1: 0% accuracy = HIGH RISK (critical)
        if accuracy == 0.0 and score == 0:
            return {
                'risk': 'High',
                'risk_score': 0.95,  # Very high risk
                'confidence': 1.0,
                'prediction': 1,
                'method': 'hard_rule_accuracy_zero',
                'feature_importance': {},
                'features_used': features,
                'reason': 'Zero accuracy detected - all answers incorrect'
            }
        
        # Rule 2: Very low accuracy (<25%) = HIGH RISK
        if accuracy < 0.25:
            return {
                'risk': 'High',
                'risk_score': 0.85,
                'confidence': 0.95,
                'prediction': 1,
                'method': 'hard_rule_low_accuracy',
                'feature_importance': {},
                'features_used': features,
                'reason': f'Very low accuracy: {accuracy*100:.1f}%'
            }
        
        # Rule 3: Low accuracy (<50%) with high error count = HIGH RISK
        errors_count = len(payload.get("errors", []))
        if accuracy < 0.5 and errors_count >= total * 0.75:
            return {
                'risk': 'High',
                'risk_score': 0.80,
                'confidence': 0.90,
                'prediction': 1,
                'method': 'hard_rule_accuracy_errors',
                'feature_importance': {},
                'features_used': features,
                'reason': f'Low accuracy ({accuracy*100:.1f}%) with {errors_count} errors'
            }
        
        if not self.is_loaded or self.model is None:
            return self._fallback_prediction(payload)
        
        try:
            # Convert to DataFrame for model
            feature_df = pd.DataFrame([features])
            
            # Make prediction
            prediction = self.model.predict(feature_df)[0]  # 0 or 1
            probabilities = self.model.predict_proba(feature_df)[0]  # [prob_no, prob_yes]
            
            # Get confidence (probability of predicted class)
            confidence = float(probabilities[prediction])
            risk_score = float(probabilities[1])  # Probability of dyslexia
            
            # If ML says low risk but accuracy is poor, boost risk score
            if risk_score < 0.5 and accuracy < 0.5:
                # Boost risk score based on how bad accuracy is
                accuracy_penalty = (0.5 - accuracy) * 0.6  # Max 0.3 boost
                risk_score = min(risk_score + accuracy_penalty, 0.95)
                logger.info(f"Adjusted risk_score from {probabilities[1]:.3f} to {risk_score:.3f} due to low accuracy {accuracy:.3f}")
            
            # If accuracy is very low (<30%), force higher risk
            if accuracy < 0.3 and risk_score < 0.7:
                risk_score = max(risk_score, 0.75)
                logger.info(f"Forced risk_score to {risk_score:.3f} due to very low accuracy {accuracy:.3f}")
            
            # Map to risk levels
            if risk_score >= 0.7:
                risk_level = "High"
            elif risk_score >= 0.4:
                risk_level = "Medium"
            else:
                risk_level = "Low"
            
            # Get feature importance if available
            feature_importance = {}
            try:
                if hasattr(self.model.named_steps['gb'], 'feature_importances_'):
                    importances = self.model.named_steps['gb'].feature_importances_
                    if 'pre' in self.model.named_steps:
                        feature_names = self.model.named_steps['pre'].get_feature_names_out()
                    else:
                        feature_names = [f"feature_{idx}" for idx in range(len(importances))]
                    feature_importance = dict(zip(feature_names, importances.tolist()))
            except:
                pass
            
            return {
                'risk': risk_level,
                'risk_score': risk_score,
                'confidence': confidence,
                'prediction': int(prediction),
                'method': 'ml',
                'feature_importance': feature_importance,
                'features_used': features
            }
            
        except Exception as e:
            logger.error(f"Error in ML prediction: {e}")
            return self._fallback_prediction(payload)
    
    def _fallback_prediction(self, payload: Dict) -> Dict:
        """
        Fallback prediction using rule-based system when ML model is unavailable.
        This ensures the system always works even if model fails.
        """
        # Extract features
        features = self.extract_features(payload)
        
        risk_score = 0.0
        
        accuracy = features.get("accuracy", 0)
        score = payload.get("score", 0)
        total = payload.get("total", 1)
        
        # Hard rule: 0% accuracy = HIGH RISK
        if accuracy == 0.0 or score == 0:
            risk_score = 0.95
        elif accuracy < 0.25:
            risk_score = 0.85
        elif accuracy < 0.5:
            risk_score = 0.70  # Increased from 0.3
        elif accuracy < 0.75:
            risk_score = 0.45  # Increased from 0.2
        else:
            risk_score = 0.20  # Low risk for high accuracy
        
        # Only add secondary indicators if base risk from accuracy is not already high
        if risk_score < 0.8:
            fixation_dur = features.get("fixation_mean_dur", 0)
            if fixation_dur > 300:
                risk_score += 0.15
            elif fixation_dur > 250:
                risk_score += 0.10
            
            
            regressions = features.get("regressions_count", 0)
            if regressions > 5:
                risk_score += 0.15
            elif regressions > 2:
                risk_score += 0.08
            
            reading_speed = features.get("reading_speed", 0)
            if reading_speed > 0:
                if reading_speed < 100:
                    risk_score += 0.12
                elif reading_speed < 150:
                    risk_score += 0.08
            
            entropy = features.get("scanpath_entropy", 0)
            if entropy > 3.0:
                risk_score += 0.08
            
            errors_count = features.get("errors_count", 0)
            if errors_count >= total:
                risk_score += 0.10
            elif errors_count >= total * 0.75:
                risk_score += 0.08
        
        risk_score = min(risk_score, 1.0)
        
        if risk_score >= 0.7:
            risk_level = "High"
        elif risk_score >= 0.4:
            risk_level = "Medium"
        else:
            risk_level = "Low"
        
        return {
            'risk': risk_level,
            'risk_score': risk_score,
            'confidence': 0.7,  # Lower confidence for fallback
            'prediction': 1 if risk_score >= 0.5 else 0,
            'method': 'fallback',
            'feature_importance': {},
            'features_used': features
        }


_detector_instance = None

def get_detector() -> DyslexiaMLDetector:
    """Get or create the global detector instance"""
    global _detector_instance
    if _detector_instance is None:
        _detector_instance = DyslexiaMLDetector()
    return _detector_instance

