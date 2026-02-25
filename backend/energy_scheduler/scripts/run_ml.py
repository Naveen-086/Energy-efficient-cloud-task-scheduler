r"""
Run ML training and predictions without starting the frontend.
Usage (from project root):
    cd "C:/Users/91967/Downloads/energy-consumption(1)/project"
    ./.venv/Scripts/Activate.ps1
    cd backend/energy_scheduler
    python scripts/run_ml.py

This script sets up Django, runs training (using synthetic data by default), prints results,
and makes a sample prediction using the best model.
"""
import os
import json
import sys

try:
    import django
except ModuleNotFoundError as e:
    print("Missing required Python packages. Make sure you activated the project's virtual environment (.venv) before running this script.")
    print("From project root run:\n  .\\.venv\\Scripts\\Activate.ps1\nThen re-run this script.")
    raise

# Ensure the parent of the `energy_scheduler` package is on sys.path so imports work
# This allows running the script from the `scripts/` folder or the project root.
current_dir = os.path.dirname(os.path.abspath(__file__))
# Directory that contains the Django project package (this folder contains the `energy_scheduler` package dir)
django_project_dir = os.path.abspath(os.path.join(current_dir, '..'))
if django_project_dir not in sys.path:
    sys.path.insert(0, django_project_dir)

# Set Django settings module and initialize
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'energy_scheduler.settings')
django.setup()

from ml_app.ml_models import EnergyPredictionModels


def main():
    print("Starting ML runner...")
    trainer = EnergyPredictionModels()

    # Train models (this will use synthetic data per the project's current configuration)
    print("Training models (this may take a few moments)...")
    results = trainer.train_all_models()

    print('\nTraining results:')
    print(json.dumps(results, indent=2))

    best = trainer.best_model_name
    print(f"\nBest model: {best}")

    # Sample prediction (use the frontend feature names: CPU_Usage, Memory_Usage, Network_Traffic, Task_Priority)
    sample_features = {
        'CPU_Usage': 50.0,
        'Memory_Usage': 60.0,
        'Network_Traffic': 100.0,
        'Task_Priority': 2
    }

    print('\nMaking a sample prediction with the best model...')
    try:
        pred = trainer.predict(best, sample_features)
        print(f"Prediction (seconds): {pred}")
    except Exception as e:
        print(f"Prediction failed: {e}")

    print('\nModels and artifacts saved to:')
    print(os.path.join(os.path.dirname(os.path.dirname(__file__)), 'ml_models'))


if __name__ == '__main__':
    main()
