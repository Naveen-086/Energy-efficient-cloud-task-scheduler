import React, { useState } from 'react';
import { Calculator, Zap, TrendingUp, AlertCircle, CheckCircle } from 'lucide-react';

interface PredictionResult {
  prediction: number;
  model_used: string;
  features: { [key: string]: number };
}

const PredictionForm: React.FC = () => {
  const [features, setFeatures] = useState({
    CPU_Usage: 50,
    Memory_Usage: 60,
    Network_Traffic: 100,
    Task_Priority: 3
  });
  const [selectedModel, setSelectedModel] = useState('random_forest');
  const [prediction, setPrediction] = useState<PredictionResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const modelOptions = [
    { value: 'linear_regression', label: 'Linear Regression', color: 'blue' },
    { value: 'random_forest', label: 'Random Forest', color: 'green' },
    { value: 'neural_network', label: 'Neural Network', color: 'purple' }
  ];

  const handlePredict = async () => {
    setLoading(true);
    setError('');
    
    try {
      const response = await fetch('http://localhost:8000/api/predict/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: selectedModel,
          features: features
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        setPrediction(data);
      } else {
        setError(data.message || 'Prediction failed');
      }
    } catch (err) {
      setError('Network error. Please check if the backend server is running.');
    } finally {
      setLoading(false);
    }
  };

  const getEnergyLevel = (prediction: number) => {
    if (prediction < 50) return { level: 'Low', color: 'green', icon: CheckCircle };
    if (prediction < 150) return { level: 'Medium', color: 'yellow', icon: AlertCircle };
    return { level: 'High', color: 'red', icon: AlertCircle };
  };

  return (
    <div className="space-y-8">
      <div className="bg-white/10 backdrop-blur-sm rounded-xl p-8 border border-white/20">
        <div className="flex items-center gap-3 mb-6">
          <Calculator className="h-6 w-6 text-blue-400" />
          <h3 className="text-xl font-semibold text-white">Energy Consumption Prediction</h3>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Input Form */}
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Select ML Model
              </label>
              <div className="grid grid-cols-1 gap-2">
                {modelOptions.map((option) => (
                  <label
                    key={option.value}
                    className={`flex items-center p-3 rounded-lg cursor-pointer border transition-all duration-200 ${
                      selectedModel === option.value
                        ? `bg-${option.color}-500/20 border-${option.color}-400`
                        : 'bg-black/20 border-gray-600 hover:border-gray-500'
                    }`}
                  >
                    <input
                      type="radio"
                      name="model"
                      value={option.value}
                      checked={selectedModel === option.value}
                      onChange={(e) => setSelectedModel(e.target.value)}
                      className="sr-only"
                    />
                    <div className={`w-4 h-4 rounded-full border-2 mr-3 ${
                      selectedModel === option.value
                        ? `bg-${option.color}-500 border-${option.color}-500`
                        : 'border-gray-400'
                    }`}>
                      {selectedModel === option.value && (
                        <div className="w-2 h-2 rounded-full bg-white m-0.5" />
                      )}
                    </div>
                    <span className="text-white font-medium">{option.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  CPU Usage (%)
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={features.CPU_Usage}
                  onChange={(e) => setFeatures({...features, CPU_Usage: Number(e.target.value)})}
                  className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
                />
                <div className="flex justify-between text-xs text-gray-400 mt-1">
                  <span>0%</span>
                  <span className="text-blue-400 font-semibold">{features.CPU_Usage}%</span>
                  <span>100%</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Memory Usage (%)
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={features.Memory_Usage}
                  onChange={(e) => setFeatures({...features, Memory_Usage: Number(e.target.value)})}
                  className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
                />
                <div className="flex justify-between text-xs text-gray-400 mt-1">
                  <span>0%</span>
                  <span className="text-green-400 font-semibold">{features.Memory_Usage}%</span>
                  <span>100%</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Network Traffic (MB/s)
                </label>
                <input
                  type="range"
                  min="0"
                  max="1000"
                  value={features.Network_Traffic}
                  onChange={(e) => setFeatures({...features, Network_Traffic: Number(e.target.value)})}
                  className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
                />
                <div className="flex justify-between text-xs text-gray-400 mt-1">
                  <span>0 MB/s</span>
                  <span className="text-purple-400 font-semibold">{features.Network_Traffic} MB/s</span>
                  <span>1000 MB/s</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Task Priority
                </label>
                <select
                  value={features.Task_Priority}
                  onChange={(e) => setFeatures({...features, Task_Priority: Number(e.target.value)})}
                  className="w-full px-3 py-2 bg-black/30 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value={1}>1 - Low Priority</option>
                  <option value={2}>2 - Below Normal</option>
                  <option value={3}>3 - Normal</option>
                  <option value={4}>4 - High Priority</option>
                  <option value={5}>5 - Critical</option>
                </select>
              </div>
            </div>

            <button
              onClick={handlePredict}
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 rounded-lg font-semibold hover:from-blue-600 hover:to-purple-700 transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                <>
                  <TrendingUp className="h-5 w-5" />
                  Predict Energy Consumption
                </>
              )}
            </button>
          </div>

          {/* Results */}
          <div className="space-y-6">
            {error && (
              <div className="bg-red-500/20 border border-red-400 rounded-lg p-4 flex items-center gap-3">
                <AlertCircle className="h-5 w-5 text-red-400" />
                <p className="text-red-300">{error}</p>
              </div>
            )}

            {prediction && (
              <div className="space-y-4">
                <div className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-400/30 rounded-xl p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <Zap className="h-6 w-6 text-yellow-400" />
                    <h4 className="text-lg font-semibold text-white">Prediction Result</h4>
                  </div>
                  
                  <div className="text-center mb-4">
                    <p className="text-4xl font-bold text-white mb-2">
                      {prediction.prediction.toFixed(2)}
                    </p>
                    <p className="text-gray-400">Seconds (Execution Time)</p>
                  </div>

                  {(() => {
                    const { level, color, icon: Icon } = getEnergyLevel(prediction.prediction);
                    return (
                      <div className={`flex items-center justify-center gap-2 bg-${color}-500/20 border border-${color}-400 rounded-lg p-3`}>
                        <Icon className={`h-5 w-5 text-${color}-400`} />
                        <span className={`text-${color}-300 font-medium`}>
                          {level} Energy Consumption
                        </span>
                      </div>
                    );
                  })()}
                </div>

                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                  <h4 className="text-white font-semibold mb-4">Prediction Details</h4>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Model Used:</span>
                      <span className="text-white font-medium">
                        {modelOptions.find(m => m.value === prediction.model_used)?.label}
                      </span>
                    </div>
                    
                    <div className="border-t border-gray-600 pt-3">
                      <p className="text-gray-400 text-sm mb-2">Input Parameters:</p>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-400">CPU:</span>
                          <span className="text-blue-400">{prediction.features.CPU_Usage}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Memory:</span>
                          <span className="text-green-400">{prediction.features.Memory_Usage}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Network:</span>
                          <span className="text-purple-400">{prediction.features.Network_Traffic} MB/s</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Priority:</span>
                          <span className="text-yellow-400">{prediction.features.Task_Priority}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
              <h4 className="text-white font-semibold mb-4">Optimization Tips</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>• <strong className="text-blue-400">Lower CPU usage</strong> typically results in reduced energy consumption</li>
                <li>• <strong className="text-green-400">Balanced memory usage</strong> helps maintain optimal performance</li>
                <li>• <strong className="text-purple-400">Minimize network traffic</strong> when possible to save energy</li>
                <li>• <strong className="text-yellow-400">Task priority</strong> affects scheduling and energy allocation</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PredictionForm;