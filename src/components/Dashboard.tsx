import React, { useState, useEffect } from 'react';
import { Activity, Brain, BarChart3, Zap, TrendingUp, Settings, User, Cloud } from 'lucide-react';
import ModelComparison from './ModelComparison';
import PredictionForm from './PredictionForm';
import VisualizationPanel from './VisualizationPanel';
import ModelMetrics from './ModelMetrics';
import PowerBIVisualization from './PowerBIVisualization';

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

interface DashboardData {
  correlation: string;
  distributions: { [key: string]: string };
  trends: string;
  statistics: string;
  model_comparison?: string;
  feature_importance?: string;
}

interface CloudSchedulingData {
  cpu_by_priority: { labels: number[]; values: number[] };
  top_vms: { labels: string[]; values: number[] };
  cpu_ram_scatter: { x: number[]; y: number[]; priority: number[] };
  optimal_scheduling: { labels: string[]; values: number[] };
  memory_by_priority: { labels: number[]; values: number[] };
  task_distribution: { labels: string[]; values: number[] };
  execution_stats: {
    mean: number;
    median: number;
    min: number;
    max: number;
    std: number;
  };
  total_tasks: number;
  total_vms: number;
}

const Dashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [modelResults, setModelResults] = useState<ModelResults>({});
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [cloudSchedulingData, setCloudSchedulingData] = useState<CloudSchedulingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingCloudData, setLoadingCloudData] = useState(false);
  const [energySavings, setEnergySavings] = useState(32.5);

  useEffect(() => {
    fetchModelResults();
    fetchVisualizationData();
    fetchCloudSchedulingData();
  }, []);

  useEffect(() => {
    setEnergySavings(calculateEnergySavings(modelResults));
  }, [modelResults]);

  const fetchModelResults = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/models/results/');
      const data = await response.json();
      if (data.success) {
        setModelResults(data.results);
        setEnergySavings(calculateEnergySavings(data.results));
      }
    } catch (error) {
      console.error('Error fetching model results:', error);
    }
  };

  const fetchVisualizationData = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/visualizations/');
      const data = await response.json();
      if (data.success) {
        setDashboardData(data.data);
      }
    } catch (error) {
      console.error('Error fetching visualization data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCloudSchedulingData = async () => {
    setLoadingCloudData(true);
    try {
      const response = await fetch('http://localhost:8000/api/cloud-scheduling/');
      const data = await response.json();
      if (data.success) {
        setCloudSchedulingData(data.data);
      }
    } catch (error) {
      console.error('Error fetching cloud scheduling data:', error);
    } finally {
      setLoadingCloudData(false);
    }
  };

  const trainModels = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:8000/api/models/train/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await response.json();
      if (data.success) {
        setModelResults(data.results);
        setEnergySavings(calculateEnergySavings(data.results));
        await fetchVisualizationData();
      }
    } catch (error) {
      console.error('Error training models:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateEnergySavings = (results: ModelResults) => {
    if (Object.keys(results).length === 0) {
      return 32.5; // Default value
    }
    
    // Calculate energy savings based on best model's R² score
    const bestR2 = Math.max(...Object.values(results).map(r => r.r2));
    
    // Convert R² score to energy savings percentage
    // Higher R² means better predictions, which leads to better optimization
    if (bestR2 > 0.95) return Math.round((bestR2 * 45 + 5) * 10) / 10; // 47.5-50%
    if (bestR2 > 0.90) return Math.round((bestR2 * 40 + 8) * 10) / 10; // 44-48%
    if (bestR2 > 0.80) return Math.round((bestR2 * 35 + 12) * 10) / 10; // 40-47%
    if (bestR2 > 0.70) return Math.round((bestR2 * 30 + 15) * 10) / 10; // 36-45%
    if (bestR2 > 0.50) return Math.round((bestR2 * 25 + 20) * 10) / 10; // 32.5-37.5%
    return Math.round((bestR2 * 20 + 15) * 10) / 10; // 15-25%
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex flex-col items-center justify-center">
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-4 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center shadow-lg">
          <Zap className="h-10 w-10 text-white" />
        </div>
        <h1 className="text-3xl font-bold text-white mb-2">EnergyPredictor</h1>
        <p className="text-gray-400 mb-10">Cloud Task Scheduler</p>
        <div className="flex space-x-2 mb-6">
          <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
          <div className="w-3 h-3 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
          <div className="w-3 h-3 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
        </div>
        <p className="text-gray-400 text-sm">Loading models and data...</p>
      </div>
    );
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Activity },
    { id: 'models', label: 'Models', icon: Brain },
    { id: 'predictions', label: 'Predictions', icon: TrendingUp },
    { id: 'visualizations', label: 'Analytics', icon: BarChart3 },
    { id: 'powerbi', label: 'Cloud Scheduling', icon: Cloud }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="flex">
        {/* Sidebar */}
        <div className="w-64 bg-black/30 backdrop-blur-sm border-r border-white/10 min-h-screen">
          <div className="p-6">
            <div className="flex items-center gap-3 mb-8">
              <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-2 rounded-lg">
                <Zap className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">EnergyPredictor</h1>
                <p className="text-xs text-gray-400">Cloud Scheduler</p>
              </div>
            </div>

            <div className="flex items-center gap-3 mb-8 p-3 bg-white/10 rounded-lg">
              <div className="bg-gradient-to-r from-green-400 to-blue-500 p-2 rounded-full">
                <User className="h-4 w-4 text-white" />
              </div>
              <div>
                <p className="text-white font-medium">Admin</p>
                <p className="text-xs text-gray-400">Administrator</p>
              </div>
            </div>

            <nav className="space-y-2">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all duration-200 ${
                      activeTab === tab.id
                        ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg'
                        : 'text-gray-300 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-8">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-white mb-2">
              {tabs.find(tab => tab.id === activeTab)?.label}
            </h2>
            <p className="text-gray-400">
              Energy-efficient cloud task scheduling with machine learning
            </p>
          </div>

          (<>
              {activeTab === 'overview' && (
                <div className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-white">Models Trained</h3>
                        <Brain className="h-6 w-6 text-blue-400" />
                      </div>
                      <p className="text-3xl font-bold text-white">{Object.keys(modelResults).length}</p>
                      <p className="text-gray-400 text-sm">Active ML Models</p>
                    </div>

                    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-white">Best Accuracy</h3>
                        <TrendingUp className="h-6 w-6 text-green-400" />
                      </div>
                      <p className="text-3xl font-bold text-white">
                        {Object.keys(modelResults).length > 0
                          ? `${Math.max(...Object.values(modelResults).map(r => r.r2 * 100)).toFixed(1)}%`
                          : '0%'}
                      </p>
                      <p className="text-gray-400 text-sm">R² Score</p>
                    </div>

                    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-white">Energy Saved</h3>
                        <Zap className="h-6 w-6 text-yellow-400" />
                      </div>
                      <p className="text-3xl font-bold text-white">{energySavings.toFixed(1)}%</p>
                      <p className="text-gray-400 text-sm">{energySavings > 40 ? 'Excellent' : energySavings > 30 ? 'Good' : 'Fair'} Optimization</p>
                    </div>
                  </div>

                  {Object.keys(modelResults).length === 0 && (
                    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-8 border border-white/20 text-center">
                      <Settings className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-xl font-semibold text-white mb-2">No Models Found</h3>
                      <p className="text-gray-400 mb-6">Train machine learning models to start energy prediction</p>
                      <button
                        onClick={trainModels}
                        className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-blue-600 hover:to-purple-700 transition-all duration-200 transform hover:scale-105"
                      >
                        Train Models
                      </button>
                    </div>
                  )}

                  {Object.keys(modelResults).length > 0 && (
                    <ModelMetrics results={modelResults} />
                  )}
                </div>
              )}

              {activeTab === 'models' && (
                <ModelComparison results={modelResults} onTrainModels={trainModels} />
              )}

              {activeTab === 'predictions' && (
                <PredictionForm />
              )}

              {activeTab === 'visualizations' && dashboardData && (
                <VisualizationPanel data={dashboardData} />
              )}

              {activeTab === 'powerbi' && (
                <PowerBIVisualization 
                  data={cloudSchedulingData} 
                  loading={loadingCloudData}
                  onRefresh={fetchCloudSchedulingData}
                />
              )}
            </>
          )
        </div>
      </div>
    </div>
  );
};

export default Dashboard;