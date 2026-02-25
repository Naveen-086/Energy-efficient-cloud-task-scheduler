from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
import json
import os
from django.conf import settings

from .ml_models import EnergyPredictionModels
from .data_visualizer import DataVisualizer
from .models import EnergyPredictionModel, PredictionHistory


@api_view(['GET'])
def health_check(request):
    """Health check endpoint"""
    model_dir = os.path.join(settings.BASE_DIR, 'ml_models')
    models_exist = {
        'linear_regression': os.path.exists(os.path.join(model_dir, 'linear_regression_model.pkl')),
        'random_forest': os.path.exists(os.path.join(model_dir, 'random_forest_model.pkl')),
        'neural_network': os.path.exists(os.path.join(model_dir, 'neural_network_model.h5')),
    }
    
    return Response({
        'success': True,
        'message': 'Django API is running',
        'models_available': models_exist,
        'database_ready': True
    })


@api_view(['POST'])
def train_models(request):
    """Train all ML models"""
    try:
        print("🚀 Starting model training...")
        model_trainer = EnergyPredictionModels()
        results = model_trainer.train_all_models()
        
        # Save results to database
        for model_name, metrics in results.items():
            model_obj, created = EnergyPredictionModel.objects.update_or_create(
                name=model_name,
                defaults={
                    'r2_score': metrics['r2'],
                    'rmse': metrics['rmse'],
                    'mae': metrics['mae'],
                    'mse': metrics['mse'],
                    'is_best': model_name == model_trainer.best_model_name
                }
            )
            print(f"{'Created' if created else 'Updated'} {model_name} in database")
        
        return Response({
            'success': True,
            'message': 'Models trained successfully',
            'results': results,
            'best_model': model_trainer.best_model_name
        })
        
    except Exception as e:
        print(f"❌ Error training models: {str(e)}")
        return Response({
            'success': False,
            'message': f'Error training models: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
def get_model_results(request):
    """Get model training results"""
    try:
        # Always use file system to get latest results with all fields including percentages
        results_path = os.path.join(settings.BASE_DIR, 'ml_models', 'model_results.json')
        if os.path.exists(results_path):
            with open(results_path, 'r') as f:
                data = json.load(f)
                return Response({
                    'success': True,
                    'results': data['results']
                })
        
        # Fallback to database if file doesn't exist
        models = EnergyPredictionModel.objects.all()
        if models.exists():
            results = {}
            for model in models:
                results[model.name] = {
                    'r2': model.r2_score,
                    'rmse': model.rmse,
                    'mae': model.mae,
                    'mse': model.mse,
                    'is_best': model.is_best
                }
            
            return Response({
                'success': True,
                'results': results
            })
        
        return Response({
            'success': True,
            'results': {},
            'message': 'No trained models found. Please train models first.'
        })
        
    except Exception as e:
        return Response({
            'success': False,
            'message': f'Error retrieving model results: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
def predict_energy(request):
    """Predict energy consumption for given task parameters"""
    try:
        data = request.data
        model_name = data.get('model', 'random_forest')
        features = data.get('features', {})
        
        # Validate features
        required_features = ['CPU_Usage', 'Memory_Usage', 'Network_Traffic', 'Task_Priority']
        for feature in required_features:
            if feature not in features:
                return Response({
                    'success': False,
                    'message': f'Missing required feature: {feature}'
                }, status=status.HTTP_400_BAD_REQUEST)
        
        # Load feature columns from model metadata
        import json
        results_path = os.path.join(settings.BASE_DIR, 'ml_models', 'model_results.json')
        feature_columns = None
        
        if os.path.exists(results_path):
            try:
                with open(results_path, 'r') as f:
                    data = json.load(f)
                    feature_columns = data.get('feature_columns', [])
            except:
                pass
        
        # Default feature mapping if metadata not available
        if not feature_columns:
            feature_columns = ['CPU_Usage (%)', 'RAM_Usage (MB)', 'Disk_IO (MB/s)', 'Network_IO (MB/s)', 'Priority', 'VM_ID']
        
        # Map frontend feature names to model feature names
        # Since we're using synthetic data, map to the synthetic column names
        feature_mapping = {
            'CPU_Usage': features['CPU_Usage'],
            'Memory_Usage': features['Memory_Usage'],  
            'Network_Traffic': features['Network_Traffic'],
            'Task_Priority': features['Task_Priority'],
            # Also support the CSV column names for backward compatibility
            'CPU_Usage (%)': features['CPU_Usage'],
            'RAM_Usage (MB)': features['Memory_Usage'],  
            'Disk_IO (MB/s)': features.get('Disk_IO', 50.0),
            'Network_IO (MB/s)': features['Network_Traffic'],
            'Priority': features['Task_Priority'],
            'VM_ID': features.get('VM_ID', 0.5)
        }
        
        # Create mapped features dictionary using only the columns the model was trained on
        mapped_features = {}
        for col in feature_columns:
            if col in feature_mapping:
                mapped_features[col] = feature_mapping[col]
            else:
                # Provide sensible defaults for any missing columns
                default_values = {
                    'CPU_Usage': 50.0,
                    'Memory_Usage': 60.0,
                    'Network_Traffic': 100.0,
                    'Task_Priority': 2,
                    'CPU_Usage (%)': 50.0,
                    'RAM_Usage (MB)': 512.0,
                    'Disk_IO (MB/s)': 100.0,
                    'Network_IO (MB/s)': 100.0,
                    'Priority': 2,
                    'VM_ID': 0.5
                }
                mapped_features[col] = default_values.get(col, 0.5)
        
        # Make prediction
        model_trainer = EnergyPredictionModels()
        prediction = model_trainer.predict(model_name, mapped_features)
        
        # Save prediction to history
        PredictionHistory.objects.create(
            model_used=model_name,
            cpu_usage=features['CPU_Usage'],
            memory_usage=features['Memory_Usage'],
            network_traffic=features['Network_Traffic'],
            task_priority=features['Task_Priority'],
            predicted_energy=prediction
        )
        
        return Response({
            'success': True,
            'prediction': prediction,
            'model_used': model_name,
            'features': features,
            'message': f'Energy consumption predicted: {prediction:.2f} seconds'
        })
        
    except Exception as e:
        print(f"❌ Prediction error: {str(e)}")
        return Response({
            'success': False,
            'message': f'Prediction error: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
def get_visualizations(request):
    """Get visualization data for dashboard"""
    try:
        visualizer = DataVisualizer()
        dashboard_data = visualizer.generate_comprehensive_dashboard()
        
        return Response({
            'success': True,
            'data': dashboard_data
        })
        
    except Exception as e:
        print(f"❌ Visualization error: {str(e)}")
        return Response({
            'success': False,
            'message': f'Visualization error: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
def get_prediction_history(request):
    """Get prediction history"""
    try:
        history = PredictionHistory.objects.all()[:50]  # Last 50 predictions
        
        history_data = []
        for pred in history:
            history_data.append({
                'id': pred.id,
                'model_used': pred.model_used,
                'cpu_usage': pred.cpu_usage,
                'memory_usage': pred.memory_usage,
                'network_traffic': pred.network_traffic,
                'task_priority': pred.task_priority,
                'predicted_energy': pred.predicted_energy,
                'created_at': pred.created_at.isoformat()
            })
        
        return Response({
            'success': True,
            'history': history_data
        })
        
    except Exception as e:
        return Response({
            'success': False,
            'message': f'Error retrieving history: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
def get_cloud_scheduling_data(request):
    """Get cloud scheduling data for Power BI-style visualizations"""
    try:
        import pandas as pd
        
        # Load cloud scheduling data
        data_path = os.path.join(settings.BASE_DIR.parent, 'data', 'cloudscheduling_cleaned.csv')
        df = pd.read_csv(data_path)
        
        # Prepare data for each visualization
        
        # 1. Average CPU Usage by Priority (Column Chart)
        cpu_by_priority = df.groupby('Priority')['CPU_Usage (%)'].mean().reset_index()
        cpu_by_priority_data = {
            'labels': cpu_by_priority['Priority'].tolist(),
            'values': cpu_by_priority['CPU_Usage (%)'].tolist()
        }
        
        # 2. Top 10 VMs by Execution Time (Bar Chart)
        top_vms = df.groupby('VM_ID')['Execution_Time (s)'].mean().nlargest(10).reset_index()
        top_vms_data = {
            'labels': [f"VM_{int(vm)}" for vm in top_vms['VM_ID'].tolist()],
            'values': top_vms['Execution_Time (s)'].tolist()
        }
        
        # 3. CPU vs RAM Usage (Scatter Chart) - sample 500 points for performance
        scatter_sample = df.sample(min(500, len(df)))
        cpu_ram_data = {
            'x': scatter_sample['RAM_Usage (MB)'].tolist(),
            'y': scatter_sample['CPU_Usage (%)'].tolist(),
            'priority': scatter_sample['Priority'].tolist()
        }
        
        # 4. Optimal vs Non-Optimal Scheduling (Donut Chart)
        target_counts = df['Target (Optimal Scheduling)'].value_counts()
        optimal_data = {
            'labels': ['Optimal', 'Non-Optimal'],
            'values': [
                int(target_counts.get(1, 0)),
                int(target_counts.get(0, 0))
            ]
        }
        
        # 5. Additional: Memory Usage by Priority
        memory_by_priority = df.groupby('Priority')['RAM_Usage (MB)'].mean().reset_index()
        memory_by_priority_data = {
            'labels': memory_by_priority['Priority'].tolist(),
            'values': memory_by_priority['RAM_Usage (MB)'].tolist()
        }
        
        # 6. Task Distribution by Priority
        task_distribution = df['Priority'].value_counts().sort_index()
        task_distribution_data = {
            'labels': [f"Priority {p}" for p in task_distribution.index.tolist()],
            'values': task_distribution.values.tolist()
        }
        
        # 7. Execution Time Distribution
        execution_stats = {
            'mean': float(df['Execution_Time (s)'].mean()),
            'median': float(df['Execution_Time (s)'].median()),
            'min': float(df['Execution_Time (s)'].min()),
            'max': float(df['Execution_Time (s)'].max()),
            'std': float(df['Execution_Time (s)'].std())
        }
        
        return Response({
            'success': True,
            'data': {
                'cpu_by_priority': cpu_by_priority_data,
                'top_vms': top_vms_data,
                'cpu_ram_scatter': cpu_ram_data,
                'optimal_scheduling': optimal_data,
                'memory_by_priority': memory_by_priority_data,
                'task_distribution': task_distribution_data,
                'execution_stats': execution_stats,
                'total_tasks': len(df),
                'total_vms': int(df['VM_ID'].nunique())
            }
        })
        
    except Exception as e:
        print(f"❌ Cloud scheduling data error: {str(e)}")
        return Response({
            'success': False,
            'message': f'Error retrieving cloud scheduling data: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)