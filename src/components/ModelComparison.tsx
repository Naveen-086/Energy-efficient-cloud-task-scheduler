import React from 'react';
import { TrendingUp, Award, AlertCircle } from 'lucide-react';

interface ModelResults {
  [key: string]: {
    r2: number;
    rmse: number;
    mae: number;
    mse: number;
    rmse_percentage?: number;
    mae_percentage?: number;
    mse_percentage?: number;
  };
}

interface ModelComparisonProps {
  results: ModelResults;
  onTrainModels: () => void;
}

const ModelComparison: React.FC<ModelComparisonProps> = ({ results, onTrainModels }) => {
  const modelNames = {
    linear_regression: 'Linear Regression',
    random_forest: 'Random Forest',
    neural_network: 'Neural Network'
  };

  const getBestModel = () => {
    if (Object.keys(results).length === 0) return null;
    return Object.entries(results).reduce((best, [name, metrics]) => 
      metrics.r2 > best[1].r2 ? [name, metrics] : best
    );
  };

  const bestModel = getBestModel();

  if (Object.keys(results).length === 0) {
    return (
      <div className="bg-white/10 backdrop-blur-sm rounded-xl p-8 border border-white/20 text-center">
        <AlertCircle className="h-12 w-12 text-yellow-400 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-white mb-2">No Model Results Available</h3>
        <p className="text-gray-400 mb-6">Train the machine learning models to see performance comparison</p>
        <button
          onClick={onTrainModels}
          className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-blue-600 hover:to-purple-700 transition-all duration-200 transform hover:scale-105"
        >
          Train Models Now
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {bestModel && (
        <div className="bg-gradient-to-r from-green-500/20 to-blue-500/20 backdrop-blur-sm rounded-xl p-6 border border-green-400/30">
          <div className="flex items-center gap-3 mb-4">
            <Award className="h-6 w-6 text-green-400" />
            <h3 className="text-xl font-semibold text-white">Best Performing Model</h3>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-white">{modelNames[bestModel[0] as keyof typeof modelNames]}</p>
              <p className="text-green-400">Highest accuracy with {(bestModel[1].r2 * 100).toFixed(2)}% R² score</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-400">RMSE</p>
              <p className="text-lg font-semibold text-white">
                {bestModel[1].rmse_percentage ? `${bestModel[1].rmse_percentage.toFixed(2)}% of range` : bestModel[1].rmse.toFixed(4)}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {Object.entries(results).map(([modelKey, metrics]) => {
          const isTop = bestModel && bestModel[0] === modelKey;
          return (
            <div
              key={modelKey}
              className={`rounded-xl p-6 border backdrop-blur-sm transition-all duration-200 hover:scale-105 ${
                isTop 
                  ? 'bg-gradient-to-br from-blue-500/20 to-purple-500/20 border-blue-400/50' 
                  : 'bg-white/10 border-white/20'
              }`}
            >
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-semibold text-white">
                  {modelNames[modelKey as keyof typeof modelNames]}
                </h4>
                {isTop && <Award className="h-5 w-5 text-yellow-400" />}
              </div>

              <div className="space-y-4">
                <div className="bg-black/20 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-400">R² Score</span>
                    <TrendingUp className="h-4 w-4 text-blue-400" />
                  </div>
                  <div className="flex items-end gap-2">
                    <span className="text-2xl font-bold text-white">{(metrics.r2 * 100).toFixed(1)}%</span>
                    <div className="flex-1 bg-gray-700 rounded-full h-2 mb-1">
                      <div 
                        className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${Math.max(metrics.r2 * 100, 5)}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-black/20 rounded-lg p-3">
                    <p className="text-xs text-gray-400 mb-1">RMSE</p>
                    <p className="text-sm font-semibold text-white">
                      {metrics.rmse_percentage ? `${metrics.rmse_percentage.toFixed(2)}%` : metrics.rmse.toFixed(4)}
                    </p>
                  </div>
                  <div className="bg-black/20 rounded-lg p-3">
                    <p className="text-xs text-gray-400 mb-1">MAE</p>
                    <p className="text-sm font-semibold text-white">
                      {metrics.mae_percentage ? `${metrics.mae_percentage.toFixed(2)}%` : metrics.mae.toFixed(4)}
                    </p>
                  </div>
                </div>

                <div className="bg-black/20 rounded-lg p-3">
                  <p className="text-xs text-gray-400 mb-1">Mean Squared Error</p>
                  <p className="text-sm font-semibold text-white">
                    {metrics.mse_percentage ? `${metrics.mse_percentage.toFixed(2)}%` : metrics.mse.toFixed(4)}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
        <h3 className="text-lg font-semibold text-white mb-4">Model Performance Insights</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="text-white font-medium mb-2">Algorithm Comparison</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li>• <strong className="text-blue-400">Linear Regression:</strong> Fast, interpretable baseline model</li>
              <li>• <strong className="text-green-400">Random Forest:</strong> Robust ensemble method with feature importance</li>
              <li>• <strong className="text-purple-400">Neural Network:</strong> Deep learning with non-linear patterns</li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-medium mb-2">Metrics Explanation</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li>• <strong>R² Score:</strong> Proportion of variance explained (higher = better)</li>
              <li>• <strong>RMSE:</strong> Root Mean Square Error (lower = better)</li>
              <li>• <strong>MAE:</strong> Mean Absolute Error (lower = better)</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="flex justify-center">
        <button
          onClick={onTrainModels}
          className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-8 py-3 rounded-lg font-semibold hover:from-blue-600 hover:to-purple-700 transition-all duration-200 transform hover:scale-105 flex items-center gap-2"
        >
          <TrendingUp className="h-5 w-5" />
          Retrain Models
        </button>
      </div>
    </div>
  );
};

export default ModelComparison;