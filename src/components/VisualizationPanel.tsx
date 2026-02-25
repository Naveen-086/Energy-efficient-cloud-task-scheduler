import React, { useEffect, useRef } from 'react';
import { BarChart3, TrendingUp, Activity, PieChart } from 'lucide-react';

interface VisualizationPanelProps {
  data: {
    correlation: string;
    distributions: { [key: string]: string };
    trends: string;
    statistics: string;
    model_comparison?: string;
    feature_importance?: string;
  };
}

const VisualizationPanel: React.FC<VisualizationPanelProps> = ({ data }) => {
  const correlationRef = useRef<HTMLDivElement>(null);
  const trendsRef = useRef<HTMLDivElement>(null);
  const modelComparisonRef = useRef<HTMLDivElement>(null);
  const featureImportanceRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Load Plotly dynamically
    const loadPlotly = async () => {
      if (window.Plotly) return;

      const script = document.createElement('script');
      script.src = 'https://cdn.plot.ly/plotly-latest.min.js';
      document.head.appendChild(script);

      return new Promise((resolve) => {
        script.onload = resolve;
      });
    };

    const renderPlots = async () => {
      await loadPlotly();

      try {
        // Render correlation heatmap
        if (correlationRef.current && data.correlation) {
          const correlationData = JSON.parse(data.correlation);
          window.Plotly.newPlot(correlationRef.current, correlationData.data, {
            ...correlationData.layout,
            paper_bgcolor: 'rgba(0,0,0,0)',
            plot_bgcolor: 'rgba(0,0,0,0)',
            font: { color: 'white' }
          }, { responsive: true });
        }

        // Render trends
        if (trendsRef.current && data.trends) {
          const trendsData = JSON.parse(data.trends);
          window.Plotly.newPlot(trendsRef.current, trendsData.data, {
            ...trendsData.layout,
            paper_bgcolor: 'rgba(0,0,0,0)',
            plot_bgcolor: 'rgba(0,0,0,0)',
            font: { color: 'white' }
          }, { responsive: true });
        }

        // Render model comparison
        if (modelComparisonRef.current && data.model_comparison) {
          const modelData = JSON.parse(data.model_comparison);
          window.Plotly.newPlot(modelComparisonRef.current, modelData.data, {
            ...modelData.layout,
            paper_bgcolor: 'rgba(0,0,0,0)',
            plot_bgcolor: 'rgba(0,0,0,0)',
            font: { color: 'white' }
          }, { responsive: true });
        }

        // Render feature importance
        if (featureImportanceRef.current && data.feature_importance) {
          const featureData = JSON.parse(data.feature_importance);
          window.Plotly.newPlot(featureImportanceRef.current, featureData.data, {
            ...featureData.layout,
            paper_bgcolor: 'rgba(0,0,0,0)',
            plot_bgcolor: 'rgba(0,0,0,0)',
            font: { color: 'white' }
          }, { responsive: true });
        }
      } catch (error) {
        console.error('Error rendering plots:', error);
      }
    };

    renderPlots();
  }, [data]);

  const statistics = data.statistics ? JSON.parse(data.statistics) : null;

  return (
    <div className="space-y-8">
      {/* Statistics Cards */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {Object.entries(statistics).slice(0, 4).map(([feature, stats]: [string, any], index) => (
            <div key={feature} className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-gray-300 truncate">{feature}</h3>
                <Activity className="h-5 w-5 text-blue-400" />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-400">Mean:</span>
                  <span className="text-white font-semibold">{stats.mean?.toFixed(2) || 'N/A'}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-400">Std:</span>
                  <span className="text-white font-semibold">{stats.std?.toFixed(2) || 'N/A'}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-400">Max:</span>
                  <span className="text-green-400 font-semibold">{stats.max?.toFixed(2) || 'N/A'}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Visualization Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Correlation Heatmap */}
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
          <div className="flex items-center gap-3 mb-4">
            <PieChart className="h-6 w-6 text-blue-400" />
            <h3 className="text-lg font-semibold text-white">Feature Correlation</h3>
          </div>
          <div ref={correlationRef} className="h-96"></div>
        </div>

        {/* Energy Trends */}
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
          <div className="flex items-center gap-3 mb-4">
            <TrendingUp className="h-6 w-6 text-green-400" />
            <h3 className="text-lg font-semibold text-white">Energy Consumption Trends</h3>
          </div>
          <div ref={trendsRef} className="h-96"></div>
        </div>

        {/* Model Comparison */}
        {data.model_comparison && (
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
            <div className="flex items-center gap-3 mb-4">
              <BarChart3 className="h-6 w-6 text-purple-400" />
              <h3 className="text-lg font-semibold text-white">Model Performance</h3>
            </div>
            <div ref={modelComparisonRef} className="h-96"></div>
          </div>
        )}

        {/* Feature Importance */}
        {data.feature_importance && (
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
            <div className="flex items-center gap-3 mb-4">
              <Activity className="h-6 w-6 text-yellow-400" />
              <h3 className="text-lg font-semibold text-white">Feature Importance</h3>
            </div>
            <div ref={featureImportanceRef} className="h-96"></div>
          </div>
        )}
      </div>

      {/* Distribution Plots Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {Object.entries(data.distributions || {}).slice(0, 6).map(([feature, plotData]) => (
          <div key={feature} className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
            <div className="flex items-center gap-3 mb-4">
              <BarChart3 className="h-5 w-5 text-blue-400" />
              <h4 className="text-md font-semibold text-white truncate">{feature}</h4>
            </div>
            <div
              ref={(ref) => {
                if (ref && plotData) {
                  try {
                    const data = JSON.parse(plotData);
                    window.Plotly?.newPlot(ref, data.data, {
                      ...data.layout,
                      height: 250,
                      paper_bgcolor: 'rgba(0,0,0,0)',
                      plot_bgcolor: 'rgba(0,0,0,0)',
                      font: { color: 'white', size: 10 }
                    }, { responsive: true });
                  } catch (error) {
                    console.error(`Error rendering ${feature} plot:`, error);
                  }
                }
              }}
              className="h-64"
            ></div>
          </div>
        ))}
      </div>

      {/* Insights Panel */}
      <div className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 backdrop-blur-sm rounded-xl p-6 border border-blue-400/30">
        <h3 className="text-lg font-semibold text-white mb-4">Data Insights</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="text-white font-medium mb-2">Key Findings</h4>
            <ul className="space-y-1 text-sm text-gray-300">
              <li>• Strong correlation between CPU usage and execution time</li>
              <li>• Memory usage shows optimal efficiency at 60-80% utilization</li>
              <li>• Network traffic has moderate impact on energy consumption</li>
              <li>• High-priority tasks consume 15-20% more energy</li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-medium mb-2">Optimization Opportunities</h4>
            <ul className="space-y-1 text-sm text-gray-300">
              <li>• Balance CPU load distribution across nodes</li>
              <li>• Implement smart memory caching strategies</li>
              <li>• Optimize network routing for reduced overhead</li>
              <li>• Use priority-aware scheduling algorithms</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

// Add Plotly types to window
declare global {
  interface Window {
    Plotly: any;
  }
}

export default VisualizationPanel;