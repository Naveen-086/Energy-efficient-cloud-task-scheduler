from django.db import models
from django.contrib.auth.models import User


class EnergyPredictionModel(models.Model):
    MODEL_TYPES = [
        ('linear_regression', 'Linear Regression'),
        ('random_forest', 'Random Forest'),
        ('neural_network', 'Neural Network'),
    ]
    
    name = models.CharField(max_length=50, choices=MODEL_TYPES, unique=True)
    r2_score = models.FloatField(default=0.0)
    rmse = models.FloatField(default=0.0)
    mae = models.FloatField(default=0.0)
    mse = models.FloatField(default=0.0)
    is_best = models.BooleanField(default=False)
    model_file_path = models.CharField(max_length=255, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-r2_score']
    
    def __str__(self):
        return f"{self.get_name_display()} - R²: {self.r2_score:.4f}"


class PredictionHistory(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True)
    model_used = models.CharField(max_length=50)
    cpu_usage = models.FloatField()
    memory_usage = models.FloatField()
    network_traffic = models.FloatField()
    task_priority = models.IntegerField()
    predicted_energy = models.FloatField()
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Prediction: {self.predicted_energy:.2f} - {self.created_at}"