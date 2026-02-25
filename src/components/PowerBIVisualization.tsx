import React, { useEffect, useRef, useState } from 'react';
import { RefreshCw, Filter } from 'lucide-react';

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

interface PowerBIVisualizationProps {
  data: CloudSchedulingData | null;
  loading: boolean;
  onRefresh: () => void;
}

declare global {
  interface Window {
    Plotly: any;
  }
}

const PowerBIVisualization: React.FC<PowerBIVisualizationProps> = ({ data, loading, onRefresh }) => {
  const cpuPriorityRef = useRef<HTMLDivElement>(null);
  const topVmsRef = useRef<HTMLDivElement>(null);
  const scatterRef = useRef<HTMLDivElement>(null);
  const donutRef = useRef<HTMLDivElement>(null);
  const memoryPriorityRef = useRef<HTMLDivElement>(null);
  const taskDistRef = useRef<HTMLDivElement>(null);

  const [selectedPriority, setSelectedPriority] = useState<number | null>(null);
  const [plotlyLoaded, setPlotlyLoaded] = useState(false);

  useEffect(() => {
    const loadPlotly = async () => {
      if (window.Plotly) {
        setPlotlyLoaded(true);
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://cdn.plot.ly/plotly-latest.min.js';
      script.async = true;
      script.onload = () => setPlotlyLoaded(true);
      document.head.appendChild(script);
    };

    loadPlotly();
  }, []);

  useEffect(() => {
    if (!plotlyLoaded || !data || loading) return;

    renderAllCharts();
  }, [plotlyLoaded, data, loading, selectedPriority]);

  const renderAllCharts = () => {
    if (!data) return;

    // 1. CPU Usage by Priority (Column Chart)
    if (cpuPriorityRef.current) {
      const colors = ['#43D1D6', '#43C3DD', '#6A8DD6'];
      const cpuTrace = {
        x: data.cpu_by_priority.labels.map(l => `Priority ${l}`),
        y: data.cpu_by_priority.values,
        type: 'bar',
        marker: {
          color: colors,
          line: { width: 0 }
        },
        hovertemplate: '<b>%{x}</b><br>Avg CPU Usage: %{y:.2f}%<extra></extra>',
        name: 'CPU Usage'
      };

      const cpuLayout = {
        title: {
          text: '<b>Average CPU Usage by Priority</b>',
          font: { size: 18, color: '#573b92', family: 'Arial, sans-serif' }
        },
        paper_bgcolor: 'rgba(255,255,255,0.95)',
        plot_bgcolor: 'rgba(255,255,255,0.95)',
        xaxis: {
          title: '',
          showgrid: false,
          tickfont: { size: 14, color: '#333', weight: 'bold' }
        },
        yaxis: {
          title: '',
          showgrid: true,
          gridcolor: 'rgba(0,0,0,0.1)',
          tickfont: { size: 14, color: '#333', weight: 'bold' }
        },
        margin: { t: 60, b: 50, l: 60, r: 20 },
        hovermode: 'closest',
        hoverlabel: { bgcolor: '#573b92', font: { color: 'white', size: 12 } }
      };

      window.Plotly.newPlot(cpuPriorityRef.current, [cpuTrace], cpuLayout, {
        responsive: true,
        displayModeBar: true,
        modeBarButtonsToRemove: ['pan2d', 'lasso2d', 'select2d'],
        displaylogo: false
      });

      // Add click event for cross-filtering
      const cpuElement = cpuPriorityRef.current;
      (cpuElement as any).on('plotly_click', (eventData: any) => {
        const priority = data.cpu_by_priority.labels[eventData.points[0].pointIndex];
        setSelectedPriority(selectedPriority === priority ? null : priority);
      });
    }

    // 2. Top 10 VMs by Execution Time (Horizontal Bar Chart)
    if (topVmsRef.current) {
      const vmsTrace = {
        y: data.top_vms.labels,
        x: data.top_vms.values,
        type: 'bar',
        orientation: 'h',
        marker: {
          color: '#E9CF0A',
          line: { width: 0 }
        },
        hovertemplate: '<b>%{y}</b><br>Avg Execution Time: %{x:.2f}s<extra></extra>',
        name: 'Execution Time'
      };

      const vmsLayout = {
        title: {
          text: '<b>Top 10 VMs by Execution Time</b>',
          font: { size: 18, color: '#573b92', family: 'Arial, sans-serif' }
        },
        paper_bgcolor: 'rgba(255,255,255,0.95)',
        plot_bgcolor: 'rgba(255,255,255,0.95)',
        xaxis: {
          title: '',
          showgrid: true,
          gridcolor: 'rgba(0,0,0,0.1)',
          tickfont: { size: 14, color: '#C30808', weight: 'bold' }
        },
        yaxis: {
          title: '',
          showgrid: false,
          tickfont: { size: 14, color: '#E9CF0A', weight: 'bold' },
          autorange: 'reversed'
        },
        margin: { t: 60, b: 50, l: 80, r: 20 },
        hovermode: 'closest',
        hoverlabel: { bgcolor: '#573b92', font: { color: 'white', size: 12 } }
      };

      window.Plotly.newPlot(topVmsRef.current, [vmsTrace], vmsLayout, {
        responsive: true,
        displayModeBar: true,
        modeBarButtonsToRemove: ['pan2d', 'lasso2d', 'select2d'],
        displaylogo: false
      });
    }

    // 3. CPU vs RAM Usage (Scatter Plot)
    if (scatterRef.current) {
      // Filter by selected priority if applicable
      let scatterData = data.cpu_ram_scatter;
      if (selectedPriority !== null) {
        const indices = scatterData.priority
          .map((p, i) => p === selectedPriority ? i : -1)
          .filter(i => i !== -1);
        scatterData = {
          x: indices.map(i => scatterData.x[i]),
          y: indices.map(i => scatterData.y[i]),
          priority: indices.map(i => scatterData.priority[i])
        };
      }

      const scatterTrace = {
        x: scatterData.x,
        y: scatterData.y,
        mode: 'markers',
        type: 'scatter',
        marker: {
          size: 8,
          color: scatterData.priority,
          colorscale: [
            [0, '#43D1D6'],
            [0.5, '#6A8DD6'],
            [1, '#9F1ACC']
          ],
          showscale: true,
          colorbar: {
            title: 'Priority',
            titleside: 'right',
            tickmode: 'linear',
            tick0: 1,
            dtick: 1,
            tickfont: { size: 12, color: '#333' }
          },
          opacity: 0.7,
          line: { width: 1, color: 'white' }
        },
        hovertemplate: '<b>RAM:</b> %{x:.2f} MB<br><b>CPU:</b> %{y:.2f}%<br><b>Priority:</b> %{marker.color}<extra></extra>',
        name: 'Tasks'
      };

      const scatterLayout = {
        title: {
          text: `<b>CPU vs RAM Usage${selectedPriority !== null ? ` (Priority ${selectedPriority})` : ''}</b>`,
          font: { size: 18, color: '#573b92', family: 'Arial, sans-serif' }
        },
        paper_bgcolor: 'rgba(5,178,147,0.15)',
        plot_bgcolor: 'rgba(255,255,255,0.95)',
        xaxis: {
          title: '<b>RAM Usage (MB)</b>',
          showgrid: true,
          gridcolor: 'rgba(0,0,0,0.1)',
          tickfont: { size: 14, color: '#333', weight: 'bold' },
          titlefont: { size: 14, color: '#333' }
        },
        yaxis: {
          title: '<b>CPU Usage (%)</b>',
          showgrid: true,
          gridcolor: 'rgba(0,0,0,0.1)',
          tickfont: { size: 14, color: '#C60C98', weight: 'bold' },
          titlefont: { size: 14, color: '#C60C98' }
        },
        margin: { t: 60, b: 60, l: 80, r: 20 },
        hovermode: 'closest',
        hoverlabel: { bgcolor: '#573b92', font: { color: 'white', size: 12 } }
      };

      window.Plotly.newPlot(scatterRef.current, [scatterTrace], scatterLayout, {
        responsive: true,
        displayModeBar: true,
        modeBarButtonsToRemove: ['pan2d', 'lasso2d'],
        displaylogo: false
      });
    }

    // 4. Optimal vs Non-Optimal Scheduling (Donut Chart)
    if (donutRef.current) {
      const donutTrace = {
        values: data.optimal_scheduling.values,
        labels: data.optimal_scheduling.labels,
        type: 'pie',
        hole: 0.5,
        marker: {
          colors: ['#9F1ACC', '#5CFF3F'],
          line: { width: 3, color: 'white' }
        },
        textinfo: 'label+percent',
        textfont: { size: 14, color: '#08EAC8', weight: 'bold' },
        hovertemplate: '<b>%{label}</b><br>Count: %{value}<br>Percentage: %{percent}<extra></extra>',
        name: 'Scheduling'
      };

      const donutLayout = {
        title: {
          text: '<b>Optimal vs Non-Optimal Scheduling</b>',
          font: { size: 18, color: '#573b92', family: 'Arial, sans-serif' }
        },
        paper_bgcolor: 'rgba(255,255,255,0.95)',
        plot_bgcolor: 'rgba(255,255,255,0.95)',
        showlegend: true,
        legend: {
          orientation: 'v',
          x: 1,
          y: 0.5,
          font: { size: 14, color: '#160EB2', weight: 'bold' }
        },
        margin: { t: 60, b: 20, l: 20, r: 120 },
        annotations: [{
          font: { size: 20, color: '#573b92', weight: 'bold' },
          showarrow: false,
          text: `${data.total_tasks}<br>Tasks`,
          x: 0.5,
          y: 0.5
        }],
        hoverlabel: { bgcolor: '#573b92', font: { color: 'white', size: 12 } }
      };

      window.Plotly.newPlot(donutRef.current, [donutTrace], donutLayout, {
        responsive: true,
        displayModeBar: true,
        modeBarButtonsToRemove: ['pan2d', 'lasso2d', 'select2d'],
        displaylogo: false
      });
    }

    // 5. Memory Usage by Priority (Area Chart)
    if (memoryPriorityRef.current) {
      const memoryTrace = {
        x: data.memory_by_priority.labels.map(l => `Priority ${l}`),
        y: data.memory_by_priority.values,
        type: 'scatter',
        mode: 'lines',
        fill: 'tozeroy',
        line: { color: '#6A8DD6', width: 3 },
        fillcolor: 'rgba(106, 141, 214, 0.3)',
        hovertemplate: '<b>%{x}</b><br>Avg RAM Usage: %{y:.2f} MB<extra></extra>',
        name: 'Memory Usage'
      };

      const memoryLayout = {
        title: {
          text: '<b>Average Memory Usage by Priority</b>',
          font: { size: 18, color: '#573b92', family: 'Arial, sans-serif' }
        },
        paper_bgcolor: 'rgba(255,255,255,0.95)',
        plot_bgcolor: 'rgba(255,255,255,0.95)',
        xaxis: {
          title: '',
          showgrid: false,
          tickfont: { size: 14, color: '#333', weight: 'bold' }
        },
        yaxis: {
          title: '',
          showgrid: true,
          gridcolor: 'rgba(0,0,0,0.1)',
          tickfont: { size: 14, color: '#333', weight: 'bold' }
        },
        margin: { t: 60, b: 50, l: 80, r: 20 },
        hovermode: 'closest',
        hoverlabel: { bgcolor: '#573b92', font: { color: 'white', size: 12 } }
      };

      window.Plotly.newPlot(memoryPriorityRef.current, [memoryTrace], memoryLayout, {
        responsive: true,
        displayModeBar: true,
        modeBarButtonsToRemove: ['pan2d', 'lasso2d', 'select2d'],
        displaylogo: false
      });
    }

    // 6. Task Distribution by Priority (Pie Chart)
    if (taskDistRef.current) {
      const taskTrace = {
        values: data.task_distribution.values,
        labels: data.task_distribution.labels,
        type: 'pie',
        marker: {
          colors: ['#43D1D6', '#6A8DD6', '#9F1ACC', '#E9CF0A'],
          line: { width: 2, color: 'white' }
        },
        textinfo: 'label+value',
        textfont: { size: 14, color: 'white', weight: 'bold' },
        hovertemplate: '<b>%{label}</b><br>Tasks: %{value}<br>Percentage: %{percent}<extra></extra>',
        name: 'Distribution'
      };

      const taskLayout = {
        title: {
          text: '<b>Task Distribution by Priority</b>',
          font: { size: 18, color: '#573b92', family: 'Arial, sans-serif' }
        },
        paper_bgcolor: 'rgba(255,255,255,0.95)',
        plot_bgcolor: 'rgba(255,255,255,0.95)',
        showlegend: true,
        legend: {
          orientation: 'h',
          x: 0.5,
          xanchor: 'center',
          y: -0.1,
          font: { size: 12, color: '#333' }
        },
        margin: { t: 60, b: 80, l: 20, r: 20 },
        hoverlabel: { bgcolor: '#573b92', font: { color: 'white', size: 12 } }
      };

      window.Plotly.newPlot(taskDistRef.current, [taskTrace], taskLayout, {
        responsive: true,
        displayModeBar: true,
        modeBarButtonsToRemove: ['pan2d', 'lasso2d', 'select2d'],
        displaylogo: false
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-gray-300">Loading Power BI Visualizations...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-400">No cloud scheduling data available</p>
        <button 
          onClick={onRefresh}
          className="mt-4 px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
        >
          Load Data
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600/20 to-blue-600/20 rounded-xl p-6 border border-purple-500/30">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">
              CLOUD SCHEDULING ANALYTICS
            </h1>
            <p className="text-gray-400 mt-2">Interactive Power BI-style visualizations</p>
          </div>
          <div className="flex gap-3">
            {selectedPriority !== null && (
              <button
                onClick={() => setSelectedPriority(null)}
                className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 rounded-lg flex items-center gap-2 transition-colors"
              >
                <Filter className="w-4 h-4" />
                Clear Filter (Priority {selectedPriority})
              </button>
            )}
            <button
              onClick={onRefresh}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg flex items-center gap-2 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/10 rounded-xl p-6 border border-blue-500/30">
          <p className="text-sm text-gray-400">Total Tasks</p>
          <p className="text-3xl font-bold text-blue-400 mt-2">{data.total_tasks.toLocaleString()}</p>
        </div>
        <div className="bg-gradient-to-br from-purple-500/20 to-purple-600/10 rounded-xl p-6 border border-purple-500/30">
          <p className="text-sm text-gray-400">Total VMs</p>
          <p className="text-3xl font-bold text-purple-400 mt-2">{data.total_vms}</p>
        </div>
        <div className="bg-gradient-to-br from-green-500/20 to-green-600/10 rounded-xl p-6 border border-green-500/30">
          <p className="text-sm text-gray-400">Avg Execution Time</p>
          <p className="text-3xl font-bold text-green-400 mt-2">{data.execution_stats.mean.toFixed(2)}s</p>
        </div>
        <div className="bg-gradient-to-br from-orange-500/20 to-orange-600/10 rounded-xl p-6 border border-orange-500/30">
          <p className="text-sm text-gray-400">Optimal Scheduling %</p>
          <p className="text-3xl font-bold text-orange-400 mt-2">
            {((data.optimal_scheduling.values[0] / data.total_tasks) * 100).toFixed(1)}%
          </p>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* CPU Usage by Priority */}
        <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10 hover:border-white/20 transition-colors">
          <div ref={cpuPriorityRef} className="w-full h-80"></div>
        </div>

        {/* Top VMs by Execution Time */}
        <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10 hover:border-white/20 transition-colors">
          <div ref={topVmsRef} className="w-full h-80"></div>
        </div>

        {/* CPU vs RAM Scatter */}
        <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10 hover:border-white/20 transition-colors">
          <div ref={scatterRef} className="w-full h-80"></div>
        </div>

        {/* Optimal Scheduling Donut */}
        <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10 hover:border-white/20 transition-colors">
          <div ref={donutRef} className="w-full h-80"></div>
        </div>

        {/* Memory Usage by Priority */}
        <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10 hover:border-white/20 transition-colors">
          <div ref={memoryPriorityRef} className="w-full h-80"></div>
        </div>

        {/* Task Distribution */}
        <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10 hover:border-white/20 transition-colors">
          <div ref={taskDistRef} className="w-full h-80"></div>
        </div>
      </div>

      {/* Execution Stats Table */}
      <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
        <h3 className="text-xl font-bold text-white mb-4">Execution Time Statistics</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="text-center">
            <p className="text-sm text-gray-400">Mean</p>
            <p className="text-2xl font-bold text-blue-400">{data.execution_stats.mean.toFixed(2)}s</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-400">Median</p>
            <p className="text-2xl font-bold text-purple-400">{data.execution_stats.median.toFixed(2)}s</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-400">Min</p>
            <p className="text-2xl font-bold text-green-400">{data.execution_stats.min.toFixed(2)}s</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-400">Max</p>
            <p className="text-2xl font-bold text-red-400">{data.execution_stats.max.toFixed(2)}s</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-400">Std Dev</p>
            <p className="text-2xl font-bold text-orange-400">{data.execution_stats.std.toFixed(2)}s</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PowerBIVisualization;
