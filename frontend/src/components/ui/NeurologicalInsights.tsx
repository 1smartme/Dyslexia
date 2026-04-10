import React from 'react';
import { motion } from 'framer-motion';
import { Brain, AlertCircle, CheckCircle, Info, TrendingUp, Clock, Target } from 'lucide-react';
import { formatEnhancedIndicator, getEnhancedInsights, type EnhancedNeurologicalTag } from '../../services/enhancedNeurologicalService';

interface NeurologicalInsightsProps {
  indicators: string[];
  riskLevel: 'low' | 'moderate' | 'high';
  gameName: string;
  accuracy: number;
  tags?: EnhancedNeurologicalTag[];
  patterns?: {
    responseTime: 'slow' | 'normal';
    accuracy: 'low' | 'medium' | 'high';
    errorFrequency: number;
  };
  mlAnalysis?: {
    available: boolean;
    confidence: number;
    enhancedTags: number;
  };
}

const NeurologicalInsights: React.FC<NeurologicalInsightsProps> = ({
  indicators,
  riskLevel,
  gameName,
  accuracy,
  tags = [],
  patterns,
  mlAnalysis
}) => {
  const insights = getEnhancedInsights({
    dyslexiaIndicators: indicators,
    neurologicalTags: tags,
    riskLevel,
    patterns: patterns || { responseTime: 'normal', accuracy: 'medium', errorFrequency: 0 },
    mlAnalysis,
    difficulty: 2,
    performanceLabel: 'average',
    needsAssessment: riskLevel !== 'low'
  });
  
  const getRiskColor = (level: string) => {
    switch (level) {
      case 'high': return 'text-red-600 bg-red-50 border-red-200';
      case 'moderate': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      default: return 'text-green-600 bg-green-50 border-green-200';
    }
  };

  const getRiskIcon = (level: string) => {
    switch (level) {
      case 'high': return <AlertCircle className="w-4 h-4" />;
      case 'moderate': return <Info className="w-4 h-4" />;
      default: return <CheckCircle className="w-4 h-4" />;
    }
  };

  const getPatternIcon = (pattern: string) => {
    switch (pattern) {
      case 'slow': return <Clock className="w-4 h-4 text-orange-500" />;
      case 'low': return <TrendingUp className="w-4 h-4 text-red-500" />;
      default: return <Target className="w-4 h-4 text-green-500" />;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-lg border border-gray-200 p-6 space-y-6"
    >
      <div className="flex items-center space-x-2">
        <Brain className="w-5 h-5 text-purple-600" />
        <h3 className="text-lg font-semibold text-gray-900">
          Neurological Analysis - {gameName.replace('_', ' ').toUpperCase()}
        </h3>
        {mlAnalysis?.available && (
          <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full font-medium">
            ML Enhanced
          </span>
        )}
      </div>

      {/* Risk Assessment */}
      <div className={`p-4 rounded-lg border ${getRiskColor(riskLevel)}`}>
        <div className="flex items-center space-x-2 mb-2">
          {getRiskIcon(riskLevel)}
          <span className="font-medium">
            Risk Level: {riskLevel.charAt(0).toUpperCase() + riskLevel.slice(1)}
          </span>
        </div>
        <p className="text-sm">
          Based on performance patterns and response analysis (Accuracy: {accuracy.toFixed(1)}%)
        </p>
      </div>

      {/* Performance Patterns */}
      {patterns && (
        <div className="grid grid-cols-3 gap-4">
          <div className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg">
            {getPatternIcon(patterns.responseTime)}
            <div>
              <p className="text-xs text-gray-600">Response Time</p>
              <p className="font-medium capitalize">{patterns.responseTime}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg">
            {getPatternIcon(patterns.accuracy)}
            <div>
              <p className="text-xs text-gray-600">Accuracy Level</p>
              <p className="font-medium capitalize">{patterns.accuracy}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg">
            <Target className="w-4 h-4 text-blue-500" />
            <div>
              <p className="text-xs text-gray-600">Error Count</p>
              <p className="font-medium">{patterns.errorFrequency}</p>
            </div>
          </div>
        </div>
      )}

      {/* Primary Indicators */}
      {indicators.length > 0 && (
        <div>
          <h4 className="font-medium text-gray-900 mb-3">Identified Patterns</h4>
          <div className="flex flex-wrap gap-2">
            {indicators.map((indicator, index) => (
              <span
                key={index}
                className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-medium"
              >
                {formatEnhancedIndicator(indicator)}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Detailed Tags */}
      {tags.length > 0 && (
        <div>
          <h4 className="font-medium text-gray-900 mb-3">Detailed Analysis</h4>
          <div className="space-y-2">
            {tags.slice(0, 5).map((tag, index) => (
              <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <span className="text-sm font-medium">
                  {formatEnhancedIndicator(tag.tag)}
                </span>
                <div className="flex items-center space-x-2">
                  <div className="w-16 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-purple-600 h-2 rounded-full"
                      style={{ width: `${tag.confidence * 100}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-600">
                    {(tag.confidence * 100).toFixed(0)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recommendations */}
      {insights.recommendations.length > 0 && (
        <div>
          <h4 className="font-medium text-gray-900 mb-3">Recommendations</h4>
          <ul className="space-y-2">
            {insights.recommendations.slice(0, 3).map((rec, index) => (
              <li key={index} className="flex items-start space-x-2">
                <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span className="text-sm text-gray-700">{rec}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Confidence Score */}
      <div className="pt-4 border-t border-gray-200">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Analysis Confidence</span>
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium">
              {(insights.confidence * 100).toFixed(0)}%
            </span>
            {mlAnalysis?.available && (
              <span className="text-xs text-purple-600">
                (ML: {(mlAnalysis.confidence * 100).toFixed(0)}%)
              </span>
            )}
          </div>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
          <div
            className="bg-gradient-to-r from-purple-500 to-blue-500 h-2 rounded-full"
            style={{ width: `${insights.confidence * 100}%` }}
          />
        </div>
        {mlAnalysis?.available && (
          <div className="mt-2 text-xs text-gray-600">
            ML Analysis: {mlAnalysis.enhancedTags} enhanced predictions
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default NeurologicalInsights;