import sys
import os

# Add the benefits-backend src directory to the Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'benefits-backend', 'src'))

# Import the Flask app from the benefits-backend
from main import app

# Vercel requires the app to be available as a callable
def handler(request):
    return app(request)

# Also make it available as app for compatibility
if __name__ == "__main__":
    app.run()