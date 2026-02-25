from django.contrib import admin
from .models import EnergyPredictionModel, PredictionHistory


@admin.register(EnergyPredictionModel)
class EnergyPredictionModelAdmin(admin.ModelAdmin):
    list_display = ['name', 'r2_score', 'rmse', 'mae', 'is_best', 'created_at']
    list_filter = ['name', 'is_best', 'created_at']
    readonly_fields = ['created_at', 'updated_at']


@admin.register(PredictionHistory)
class PredictionHistoryAdmin(admin.ModelAdmin):
    list_display = ['model_used', 'predicted_energy', 'cpu_usage', 'memory_usage', 'created_at']
    list_filter = ['model_used', 'created_at']
    readonly_fields = ['created_at']