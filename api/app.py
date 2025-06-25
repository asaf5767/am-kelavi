import os
import sys
from flask import Flask, send_from_directory
from flask_cors import CORS

# Add the current directory to Python path for imports
sys.path.insert(0, os.path.dirname(__file__))

from routes.user import user_bp
from routes.sheets import sheets_bp
from routes.ai import ai_bp
from models.user import db

def create_app():
    app = Flask(__name__)
    app.config['SECRET_KEY'] = 'asdf#FGSgvasgf$5$WGT'
    
    # Enable CORS for all routes
    CORS(app)
    
    # Register blueprints
    app.register_blueprint(user_bp, url_prefix='/api')
    app.register_blueprint(sheets_bp, url_prefix='/api')
    app.register_blueprint(ai_bp, url_prefix='/api/ai')
    
    # Database configuration
    app.config['SQLALCHEMY_DATABASE_URI'] = f"sqlite:///{os.path.join(os.path.dirname(__file__), 'database', 'app.db')}"
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    db.init_app(app)
    
    with app.app_context():
        db.create_all()
    
    @app.route('/health')
    def health_check():
        return {'status': 'healthy', 'message': 'API is running'}, 200
    
    return app

app = create_app()

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)