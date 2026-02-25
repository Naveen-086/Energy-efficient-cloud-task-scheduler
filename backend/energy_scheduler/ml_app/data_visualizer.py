"""
Data Visualization Module for Energy Analysis
"""
import pandas as pd
import numpy as np
import plotly.express as px
import plotly.graph_objects as go
from plotly.subplots import make_subplots
import json
import os
from django.conf import settings


class DataVisualizer:
    def __init__(self):
        self.model_dir = os.path.join(settings.BASE_DIR, 'ml_models')
        
    def create_sample_data(self, n_samples=1000):
        """Create sample data for visualization"""
        np.random.seed(42)
        
        cpu_usage = np.random.beta(2, 3, n_samples) * 100
        memory_usage = np.random.beta(2, 2, n_samples) * 100
        network_traffic = np.random.exponential(200, n_samples)
        network_traffic = np.clip(network_traffic, 0, 1000)
        task_priority = np.random.choice([1, 2, 3, 4, 5], n_samples, p=[0.1, 0.2, 0.4, 0.2, 0.1])
        
        execution_time = (
            cpu_usage * 0.8 +
            memory_usage * 0.6 +
            network_traffic * 0.3 +
            task_priority * 15 +
            np.random.normal(0, 10, n_samples)
        )
        execution_time = np.clip(execution_time, 5, 500)
        
        return pd.DataFrame({
            'CPU_Usage': cpu_usage,
            'Memory_Usage': memory_usage,
            'Network_Traffic': network_traffic,
            'Task_Priority': task_priority,
            'Execution_Time': execution_time
        })
    
    def generate_correlation_analysis(self):
        """Generate correlation heatmap"""
        df = self.create_sample_data()
        correlation_matrix = df.corr()
        
        fig = px.imshow(
            correlation_matrix,
            text_auto=True,
            aspect="auto",
            title="Feature Correlation Heatmap",
            color_continuous_scale="RdBu",
            zmin=-1,
            zmax=1
        )
        
        fig.update_layout(
            title_font_size=16,
            font=dict(size=12),
            height=500
        )
        
        return fig.to_json()
    
    def generate_distribution_plots(self):
        """Generate distribution plots for all numeric features"""
        df = self.create_sample_data()
        numeric_cols = df.select_dtypes(include=[np.number]).columns
        plots_data = {}
        
        for col in numeric_cols:
            fig = px.histogram(
                df, 
                x=col, 
                nbins=30,
                title=f'Distribution of {col}',
                marginal="box",
                opacity=0.7
            )
            
            fig.update_layout(
                title_font_size=14,
                height=300,
                showlegend=False
            )
            
            plots_data[col] = fig.to_json()
        
        return plots_data
    
    def generate_energy_trends(self):
        """Generate energy consumption trends"""
        df = self.create_sample_data(2000)
        df = df.sort_values('Execution_Time').reset_index(drop=True)
        
        # Create moving average for trend
        df['Moving_Avg'] = df['Execution_Time'].rolling(window=50).mean()
        
        fig = go.Figure()
        
        fig.add_trace(go.Scatter(
            x=df.index,
            y=df['Execution_Time'],
            mode='markers',
            name='Actual Energy',
            opacity=0.6,
            marker=dict(size=3, color='lightblue')
        ))
        
        fig.add_trace(go.Scatter(
            x=df.index,
            y=df['Moving_Avg'],
            mode='lines',
            name='Trend',
            line=dict(color='red', width=2)
        ))
        
        fig.update_layout(
            title='Energy Consumption Trends',
            xaxis_title='Task Index',
            yaxis_title='Energy Consumption',
            height=400
        )
        
        return fig.to_json()
    
    def generate_feature_importance_plot(self, feature_importance):
        """Generate feature importance visualization"""
        if not feature_importance:
            return None
            
        features = list(feature_importance.keys())
        importance = list(feature_importance.values())
        
        fig = px.bar(
            x=importance, 
            y=features,
            orientation='h',
            title='Feature Importance for Energy Prediction',
            labels={'x': 'Importance Score', 'y': 'Features'},
            color=importance,
            color_continuous_scale='viridis'
        )
        
        fig.update_layout(
            title_font_size=16,
            height=400
        )
        
        return fig.to_json()
    
    def generate_model_comparison(self, model_results):
        """Generate model performance comparison"""
        if not model_results:
            return None
            
        models = list(model_results.keys())
        r2_scores = [model_results[model]['r2'] for model in models]
        rmse_scores = [model_results[model]['rmse'] for model in models]
        
        # Create subplot with secondary y-axis
        fig = make_subplots(
            rows=1, cols=2,
            subplot_titles=('R² Score Comparison', 'RMSE Comparison'),
            specs=[[{"secondary_y": False}, {"secondary_y": False}]]
        )
        
        # R² Score comparison
        fig.add_trace(
            go.Bar(
                x=models,
                y=r2_scores,
                name='R² Score',
                marker_color='lightblue'
            ),
            row=1, col=1
        )
        
        # RMSE comparison
        fig.add_trace(
            go.Bar(
                x=models,
                y=rmse_scores,
                name='RMSE',
                marker_color='lightcoral'
            ),
            row=1, col=2
        )
        
        fig.update_layout(
            title_text='Model Performance Comparison',
            height=400,
            showlegend=False
        )
        
        return fig.to_json()
    
    def generate_comprehensive_dashboard(self):
        """Generate all visualizations for dashboard"""
        dashboard_data = {
            'correlation': self.generate_correlation_analysis(),
            'distributions': self.generate_distribution_plots(),
            'trends': self.generate_energy_trends(),
            'statistics': self.create_sample_data().describe().to_json()
        }
        
        # Load model results if available
        try:
            results_path = os.path.join(self.model_dir, 'model_results.json')
            if os.path.exists(results_path):
                with open(results_path, 'r') as f:
                    model_data = json.load(f)
                    results = model_data['results']
                    
                    dashboard_data['model_comparison'] = self.generate_model_comparison(results)
                    
                    # Add feature importance if available
                    if 'random_forest' in results and 'feature_importance' in results['random_forest']:
                        dashboard_data['feature_importance'] = self.generate_feature_importance_plot(
                            results['random_forest']['feature_importance']
                        )
        except Exception as e:
            print(f"Could not load model results for visualization: {e}")
        
        return dashboard_data