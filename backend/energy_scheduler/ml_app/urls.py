from django.urls import path
from . import views

urlpatterns = [
    path('health/', views.health_check, name='health_check'),
    path('models/train/', views.train_models, name='train_models'),
    path('models/results/', views.get_model_results, name='get_model_results'),
    path('predict/', views.predict_energy, name='predict_energy'),
    path('visualizations/', views.get_visualizations, name='get_visualizations'),
    path('history/', views.get_prediction_history, name='get_prediction_history'),
    path('cloud-scheduling/', views.get_cloud_scheduling_data, name='get_cloud_scheduling_data'),
]