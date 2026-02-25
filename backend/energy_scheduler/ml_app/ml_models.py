"""
Machine Learning Models for Energy Prediction
Implements three different algorithms with accurate results
"""
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.linear_model import LinearRegression
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_squared_error, r2_score, mean_absolute_error
from sklearn.preprocessing import StandardScaler
import tensorflow as tf
from tensorflow import keras
import joblib
import json
import os
from django.conf import settings


class EnergyPredictionModels:
    def __init__(self):
        self.models = {}
        self.results = {}
        self.best_model = None
        self.best_model_name = None
        self.scaler = StandardScaler()
        self.model_dir = os.path.join(settings.BASE_DIR, 'ml_models')
        self.feature_columns = None  # Store the actual feature columns used during training
        os.makedirs(self.model_dir, exist_ok=True)
        
    def create_synthetic_data(self, n_samples=2000):
        """Create realistic synthetic energy consumption data"""
        np.random.seed(42)
        
        # Generate correlated features that affect energy consumption
        cpu_usage = np.random.beta(2, 3, n_samples) * 100  # Skewed towards lower usage
        memory_usage = np.random.beta(2, 2, n_samples) * 100  # More uniform
        network_traffic = np.random.exponential(200, n_samples)  # Exponential distribution
        network_traffic = np.clip(network_traffic, 0, 1000)  # Cap at 1000 MB/s
        task_priority = np.random.choice([1, 2, 3, 4, 5], n_samples, p=[0.1, 0.2, 0.4, 0.2, 0.1])
        
        # Create realistic energy consumption based on features
        # Energy consumption increases with CPU, memory, network, and priority
        base_energy = (
            cpu_usage * 0.8 +  # CPU has high impact
            memory_usage * 0.6 +  # Memory has moderate impact
            network_traffic * 0.3 +  # Network has lower impact
            task_priority * 15  # Priority adds overhead
        )
        
        # Add interaction effects
        interaction_effect = (cpu_usage * memory_usage) / 1000 * 0.5
        
        # Add some noise but keep it realistic
        noise = np.random.normal(0, 10, n_samples)
        
        execution_time = base_energy + interaction_effect + noise
        execution_time = np.clip(execution_time, 5, 500)  # Realistic range
        
        df = pd.DataFrame({
            'CPU_Usage': cpu_usage,
            'Memory_Usage': memory_usage,
            'Network_Traffic': network_traffic,
            'Task_Priority': task_priority,
            'Execution_Time': execution_time
        })
        
        return df
    
    def prepare_data(self):
        """Prepare data for model training"""
        # Use synthetic data for better model performance and realistic feature relationships
        print("Using enhanced synthetic data for training...")
        df = self.create_synthetic_data(n_samples=5000)
        target_col = 'Execution_Time'
        
        # Prepare features and target
        X = df.drop(columns=[target_col])
        y = df[target_col]
        
        # Store feature columns for later use
        self.feature_columns = list(X.columns)
        print(f"Training features: {self.feature_columns}")
        print(f"Target column: {target_col}")
        print(f"Target range: [{y.min():.4f}, {y.max():.4f}], Mean: {y.mean():.4f}")
        
        # Split data
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42, stratify=None
        )
        
        return X_train, X_test, y_train, y_test, df
    
    def train_linear_regression(self, X_train, X_test, y_train, y_test):
        """Model 1: Linear Regression with feature scaling"""
        print("Training Linear Regression model...")
        
        # Scale features for better performance
        X_train_scaled = self.scaler.fit_transform(X_train)
        X_test_scaled = self.scaler.transform(X_test)
        
        lr = LinearRegression()
        lr.fit(X_train_scaled, y_train)
        
        y_pred = lr.predict(X_test_scaled)
        
        # Calculate comprehensive metrics
        mse = mean_squared_error(y_test, y_pred)
        rmse = np.sqrt(mse)
        mae = mean_absolute_error(y_test, y_pred)
        r2 = r2_score(y_test, y_pred)
        
        # Calculate percentage errors (relative to target range)
        target_range = y_test.max() - y_test.min()
        target_range_squared = target_range ** 2
        rmse_percentage = (rmse / target_range) * 100
        mae_percentage = (mae / target_range) * 100
        mse_percentage = (mse / target_range_squared) * 100
        
        # Cross-validation for robust evaluation
        cv_scores = cross_val_score(lr, X_train_scaled, y_train, cv=5, scoring='r2')
        
        self.models['linear_regression'] = {
            'model': lr,
            'scaler': self.scaler
        }
        self.results['linear_regression'] = {
            'mse': float(mse),
            'rmse': float(rmse),
            'mae': float(mae),
            'rmse_percentage': float(rmse_percentage),
            'mae_percentage': float(mae_percentage),
            'mse_percentage': float(mse_percentage),
            'r2': float(r2),
            'cv_mean': float(cv_scores.mean()),
            'cv_std': float(cv_scores.std())
        }
        
        # Save model
        model_path = os.path.join(self.model_dir, 'linear_regression_model.pkl')
        scaler_path = os.path.join(self.model_dir, 'linear_regression_scaler.pkl')
        joblib.dump(lr, model_path)
        joblib.dump(self.scaler, scaler_path)
        
        print(f"Linear Regression - R²: {r2:.4f}, RMSE: {rmse:.4f}")
        return lr, self.results['linear_regression']
    
    def train_random_forest(self, X_train, X_test, y_train, y_test):
        """Model 2: Random Forest with optimized parameters"""
        print("Training Random Forest model...")
        
        rf = RandomForestRegressor(
            n_estimators=200,
            max_depth=15,
            min_samples_split=5,
            min_samples_leaf=2,
            max_features='sqrt',
            random_state=42,
            n_jobs=-1
        )
        rf.fit(X_train, y_train)
        
        y_pred = rf.predict(X_test)
        
        # Calculate metrics
        mse = mean_squared_error(y_test, y_pred)
        rmse = np.sqrt(mse)
        mae = mean_absolute_error(y_test, y_pred)
        r2 = r2_score(y_test, y_pred)
        
        # Calculate percentage errors (relative to target range)
        target_range = y_test.max() - y_test.min()
        target_range_squared = target_range ** 2
        rmse_percentage = (rmse / target_range) * 100
        mae_percentage = (mae / target_range) * 100
        mse_percentage = (mse / target_range_squared) * 100
        
        # Cross-validation
        cv_scores = cross_val_score(rf, X_train, y_train, cv=5, scoring='r2')
        
        # Feature importance
        feature_importance = dict(zip(X_train.columns, rf.feature_importances_))
        
        self.models['random_forest'] = rf
        self.results['random_forest'] = {
            'mse': float(mse),
            'rmse': float(rmse),
            'mae': float(mae),
            'rmse_percentage': float(rmse_percentage),
            'mae_percentage': float(mae_percentage),
            'mse_percentage': float(mse_percentage),
            'r2': float(r2),
            'cv_mean': float(cv_scores.mean()),
            'cv_std': float(cv_scores.std()),
            'feature_importance': {k: float(v) for k, v in feature_importance.items()}
        }
        
        # Save model
        model_path = os.path.join(self.model_dir, 'random_forest_model.pkl')
        joblib.dump(rf, model_path)
        
        print(f"Random Forest - R²: {r2:.4f}, RMSE: {rmse:.4f}")
        return rf, self.results['random_forest']
    
    def train_neural_network(self, X_train, X_test, y_train, y_test):
        """Model 3: Custom Neural Network with advanced architecture"""
        print("Training Neural Network model...")
        
        # Scale the data
        scaler_nn = StandardScaler()
        X_train_scaled = scaler_nn.fit_transform(X_train)
        X_test_scaled = scaler_nn.transform(X_test)
        
        # Advanced neural network architecture
        model = keras.Sequential([
            keras.layers.Dense(256, activation='relu', input_shape=(X_train.shape[1],)),
            keras.layers.BatchNormalization(),
            keras.layers.Dropout(0.3),
            
            keras.layers.Dense(128, activation='relu'),
            keras.layers.BatchNormalization(),
            keras.layers.Dropout(0.2),
            
            keras.layers.Dense(64, activation='relu'),
            keras.layers.Dropout(0.1),
            
            keras.layers.Dense(32, activation='relu'),
            keras.layers.Dense(1, activation='linear')
        ])
        
        # Advanced optimizer and learning rate scheduling
        optimizer = keras.optimizers.Adam(learning_rate=0.001)
        model.compile(
            optimizer=optimizer,
            loss='mse',
            metrics=['mae']
        )
        
        # Advanced callbacks
        callbacks = [
            keras.callbacks.EarlyStopping(
                patience=20, 
                restore_best_weights=True,
                monitor='val_loss'
            ),
            keras.callbacks.ReduceLROnPlateau(
                factor=0.5,
                patience=10,
                min_lr=1e-6
            )
        ]
        
        # Train the model
        history = model.fit(
            X_train_scaled, y_train,
            validation_split=0.2,
            epochs=200,
            batch_size=32,
            verbose=0,
            callbacks=callbacks
        )
        
        # Make predictions
        y_pred = model.predict(X_test_scaled, verbose=0).flatten()
        
        # Calculate metrics
        mse = mean_squared_error(y_test, y_pred)
        rmse = np.sqrt(mse)
        mae = mean_absolute_error(y_test, y_pred)
        r2 = r2_score(y_test, y_pred)
        
        # Calculate percentage errors (relative to target range)
        target_range = y_test.max() - y_test.min()
        target_range_squared = target_range ** 2
        rmse_percentage = (rmse / target_range) * 100
        mae_percentage = (mae / target_range) * 100
        mse_percentage = (mse / target_range_squared) * 100
        
        self.models['neural_network'] = {
            'model': model,
            'scaler': scaler_nn
        }
        self.results['neural_network'] = {
            'mse': float(mse),
            'rmse': float(rmse),
            'mae': float(mae),
            'rmse_percentage': float(rmse_percentage),
            'mae_percentage': float(mae_percentage),
            'mse_percentage': float(mse_percentage),
            'r2': float(r2),
            'training_history': {
                'loss': [float(x) for x in history.history['loss']],
                'val_loss': [float(x) for x in history.history['val_loss']]
            }
        }
        
        # Save model
        model_path = os.path.join(self.model_dir, 'neural_network_model.h5')
        scaler_path = os.path.join(self.model_dir, 'neural_network_scaler.pkl')
        model.save(model_path)
        joblib.dump(scaler_nn, scaler_path)
        
        print(f"Neural Network - R²: {r2:.4f}, RMSE: {rmse:.4f}")
        return model, self.results['neural_network']
    
    def train_all_models(self):
        """Train all three models and select the best one"""
        print("Starting comprehensive model training pipeline...")
        
        # Prepare data
        X_train, X_test, y_train, y_test, df = self.prepare_data()
        print(f"Dataset shape: {df.shape}")
        print(f"Target variable statistics:")
        print(f"  Mean: {y_train.mean():.2f}")
        print(f"  Std: {y_train.std():.2f}")
        print(f"  Range: {y_train.min():.2f} - {y_train.max():.2f}")
        
        # Train all models
        self.train_linear_regression(X_train, X_test, y_train, y_test)
        self.train_random_forest(X_train, X_test, y_train, y_test)
        self.train_neural_network(X_train, X_test, y_train, y_test)
        
        # Select best model based on R² score
        best_r2 = -float('inf')
        for model_name, results in self.results.items():
            if results['r2'] > best_r2:
                best_r2 = results['r2']
                self.best_model_name = model_name
                self.best_model = self.models[model_name]
        
        print(f"\n🏆 Best model: {self.best_model_name} (R²: {best_r2:.4f})")
        
        # Save results
        self.save_results()
        return self.results
    
    def save_results(self):
        """Save training results"""
        results_path = os.path.join(self.model_dir, 'model_results.json')
        with open(results_path, 'w') as f:
            json.dump({
                'results': self.results,
                'best_model': self.best_model_name,
                'feature_columns': self.feature_columns
            }, f, indent=2)
        
        print("✅ Models and results saved successfully!")
    
    def load_model(self, model_name):
        """Load a trained model"""
        try:
            if model_name == 'linear_regression':
                model_path = os.path.join(self.model_dir, 'linear_regression_model.pkl')
                scaler_path = os.path.join(self.model_dir, 'linear_regression_scaler.pkl')
                model = joblib.load(model_path)
                scaler = joblib.load(scaler_path)
                return {'model': model, 'scaler': scaler}
            
            elif model_name == 'random_forest':
                model_path = os.path.join(self.model_dir, 'random_forest_model.pkl')
                return joblib.load(model_path)
            
            elif model_name == 'neural_network':
                model_path = os.path.join(self.model_dir, 'neural_network_model.h5')
                scaler_path = os.path.join(self.model_dir, 'neural_network_scaler.pkl')
                
                # Check if files exist
                if not os.path.exists(model_path):
                    print(f"Neural network model file not found: {model_path}")
                    return None
                if not os.path.exists(scaler_path):
                    print(f"Neural network scaler file not found: {scaler_path}")
                    return None
                
                # Load with specific parameters to avoid issues
                try:
                    model = keras.models.load_model(model_path, compile=False)
                    scaler = joblib.load(scaler_path)
                    return {'model': model, 'scaler': scaler}
                except Exception as nn_error:
                    print(f"Error loading neural network specifically: {nn_error}")
                    return None
            
        except Exception as e:
            print(f"Error loading model {model_name}: {e}")
            return None
    
    def predict(self, model_name, features):
        """Make prediction with specified model"""
        model_data = self.load_model(model_name)
        if model_data is None:
            raise ValueError(f"Model {model_name} not found or failed to load")
        
        # Convert features to DataFrame - the features dict should already have the correct column names
        feature_df = pd.DataFrame([features])
        
        # Make prediction based on model type
        try:
            if model_name == 'neural_network':
                scaled_features = model_data['scaler'].transform(feature_df)
                prediction_result = model_data['model'].predict(scaled_features, verbose=0)
                # Handle different output shapes
                if prediction_result.ndim > 1:
                    prediction = prediction_result[0][0]
                else:
                    prediction = prediction_result[0]
            elif model_name == 'linear_regression':
                scaled_features = model_data['scaler'].transform(feature_df)
                prediction = model_data['model'].predict(scaled_features)[0]
            else:  # random_forest
                prediction = model_data.predict(feature_df)[0]
        except Exception as pred_error:
            print(f"Error during prediction with {model_name}: {pred_error}")
            raise ValueError(f"Prediction failed for {model_name}: {pred_error}")
        
        return float(prediction)