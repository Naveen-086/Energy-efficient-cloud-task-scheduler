import React from 'react';
import { TrendingUp, Award, Target, Activity } from 'lucide-react';

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

interface ModelMetricsProps {
  results: ModelResults;
}

const ModelMetrics: React.FC<ModelMetricsProps> = ({ results }) => {
  const modelNames = {
    linear_regression: 'Linear Regression',
    random_forest: 'Random Forest',
    neural_network: 'Neural Network'
  };

  const getMetricIcon = (metric: string) => {
    switch (metric) {
      case 'r2': return TrendingUp;
      case 'rmse': return Target;
      case 'mae': return Activity;
      default: return Award;
    }
  };

  const getMetricColor = (metric: string) => {
    switch (metric) {
      case 'r2': return 'text-green-400';
      case 'rmse': return 'text-blue-400';
      case 'mae': return 'text-purple-400';
      default: return 'text-yellow-400';
    }
  };

  const getMetricLabel = (metric: string) => {
    switch (metric) {
      case 'r2': return 'R² Score';
      case 'rmse': return 'RMSE';
      case 'mae': return 'MAE';
      case 'mse': return 'MSE';
      default: return metric.toUpperCase();
    }
  };

  const bestModel = Object.entries(results).reduce((best, [name, metrics]) => 
    metrics.r2 > best[1].r2 ? [name, metrics] : best
  );

  return (
    <div className="space-y-6">
      {/* Performance Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {['r2', 'rmse', 'mae', 'mse'].map((metric) => {
          const Icon = getMetricIcon(metric);
          const colorClass = getMetricColor(metric);
          const label = getMetricLabel(metric);
          
          // Calculate average across all models
          let avgValue: number;
          let displayValue: string;
          
          if (metric === 'rmse' || metric === 'mae' || metric === 'mse') {
            const percentageKey = `${metric}_percentage` as keyof typeof results[string];
            const hasPercentage = Object.values(results).every(model => percentageKey in model);
            
            if (hasPercentage) {
              avgValue = Object.values(results).reduce((sum, model) => sum + (model[percentageKey] as number || 0), 0) / Object.keys(results).length;
              displayValue = `${avgValue.toFixed(2)}%`;
            } else {
              avgValue = Object.values(results).reduce((sum, model) => sum + model[metric as keyof typeof model], 0) / Object.keys(results).length;
              displayValue = avgValue.toFixed(4);
            }
          } else {
            avgValue = Object.values(results).reduce((sum, model) => sum + model[metric as keyof typeof model], 0) / Object.keys(results).length;
            displayValue = metric === 'r2' ? `${(avgValue * 100).toFixed(1)}%` : avgValue.toFixed(4);
          }
          
          return (
            <div key={metric} className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-gray-400">{label}</span>
                <Icon className={`h-4 w-4 ${colorClass}`} />
              </div>
              <p className="text-lg font-bold text-white">
                {displayValue}
              </p>
              <p className="text-xs text-gray-500">Average</p>
            </div>
          );
        })}
      </div>

      {/* Detailed Metrics Table */}
      <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20 overflow-x-auto">
        <h3 className="text-lg font-semibold text-white mb-4">Detailed Performance Metrics</h3>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-600">
                <th className="text-left py-3 px-4 text-gray-300 font-medium">Model</th>
                <th className="text-center py-3 px-4 text-gray-300 font-medium">R² Score</th>
                <th className="text-center py-3 px-4 text-gray-300 font-medium">RMSE</th>
                <th className="text-center py-3 px-4 text-gray-300 font-medium">MAE</th>
                <th className="text-center py-3 px-4 text-gray-300 font-medium">MSE</th>
                <th className="text-center py-3 px-4 text-gray-300 font-medium">Rank</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(results)
                .sort(([,a], [,b]) => b.r2 - a.r2)
                .map(([modelKey, metrics], index) => {
                const isTop = modelKey === bestModel[0];
                return (
                  <tr 
                    key={modelKey}
                    className={`border-b border-gray-700 hover:bg-white/5 transition-colors ${
                      isTop ? 'bg-gradient-to-r from-green-500/10 to-blue-500/10' : ''
                    }`}
                  >
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        {isTop && <Award className="h-4 w-4 text-yellow-400" />}
                        <span className="text-white font-medium">
                          {modelNames[modelKey as keyof typeof modelNames]}
                        </span>
                      </div>
                    </td>
                    <td className="text-center py-4 px-4">
                      <span className="text-green-400 font-semibold">
                        {(metrics.r2 * 100).toFixed(2)}%
                      </span>
                    </td>
                    <td className="text-center py-4 px-4">
                      <span className="text-blue-400 font-semibold">
                        {metrics.rmse_percentage ? `${metrics.rmse_percentage.toFixed(2)}%` : metrics.rmse.toFixed(4)}
                      </span>
                    </td>
                    <td className="text-center py-4 px-4">
                      <span className="text-purple-400 font-semibold">
                        {metrics.mae_percentage ? `${metrics.mae_percentage.toFixed(2)}%` : metrics.mae.toFixed(4)}
                      </span>
                    </td>
                    <td className="text-center py-4 px-4">
                      <span className="text-yellow-400 font-semibold">
                        {metrics.mse_percentage ? `${metrics.mse_percentage.toFixed(2)}%` : metrics.mse.toFixed(4)}
                      </span>
                    </td>
                    <td className="text-center py-4 px-4">
                      <div className={`inline-flex items-center justify-center w-8 h-8 rounded-full ${
                        index === 0 ? 'bg-yellow-500/20 text-yellow-400' :
                        index === 1 ? 'bg-gray-500/20 text-gray-400' :
                        'bg-orange-500/20 text-orange-400'
                      }`}>
                        <span className="font-bold text-sm">{index + 1}</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Performance Insights */}
      <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 backdrop-blur-sm rounded-xl p-6 border border-purple-400/30">
        <h3 className="text-lg font-semibold text-white mb-4">Performance Analysis</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <h4 className="text-purple-300 font-medium">Best Overall</h4>
            <p className="text-white text-lg font-semibold">
              {modelNames[bestModel[0] as keyof typeof modelNames]}
            </p>
            <p className="text-purple-200 text-sm">
              Achieved {(bestModel[1].r2 * 100).toFixed(1)}% accuracy
            </p>
          </div>
          
          <div className="space-y-2">
            <h4 className="text-purple-300 font-medium">Lowest Error</h4>
            <p className="text-white text-lg font-semibold">
              {(() => {
                const lowestRmseModel = Object.entries(results).reduce(([bestName, bestMetrics], [name, metrics]) => 
                  metrics.rmse < bestMetrics.rmse ? [name, metrics] : [bestName, bestMetrics]
                );
                return modelNames[lowestRmseModel[0] as keyof typeof modelNames];
              })()}
            </p>
            <p className="text-purple-200 text-sm">
              RMSE: {(() => {
                const minMetrics = Object.values(results).reduce((min, m) => m.rmse < min.rmse ? m : min);
                return minMetrics.rmse_percentage 
                  ? `${minMetrics.rmse_percentage.toFixed(2)}% of range`
                  : minMetrics.rmse.toFixed(4);
              })()}
            </p>
          </div>
          
          <div className="space-y-2">
            <h4 className="text-purple-300 font-medium">Recommendation</h4>
            <p className="text-white text-lg font-semibold">
              {bestModel[1].r2 > 0.8 ? 'Production Ready' : 'Needs Improvement'}
            </p>
            <p className="text-purple-200 text-sm">
              {bestModel[1].r2 > 0.8 
                ? 'Models show excellent performance' 
                : 'Consider feature engineering'
              }
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModelMetrics;