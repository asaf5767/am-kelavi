# Legacy entry point - redirects to new app.py structure
# This file maintains compatibility with existing Vercel deployment

import sys
import os

# Add the current directory to Python path
sys.path.insert(0, os.path.dirname(__file__))

# Import the new Flask app
from app import app

# Vercel compatibility
def handler(request):
    return app(request)

# Also make it available as app for compatibility
if __name__ == "__main__":
    app.run()