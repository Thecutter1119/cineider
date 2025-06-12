
from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_mail import Mail
from flask_cors import CORS
from config import Config
from models import db
from routes.routes import main, cleanup_expired_reservations
from utils.extensions import mail
import threading

app = Flask(__name__)
app.config.from_object(Config)
CORS(main, origins=["http://localhost:5173"], supports_credentials=True)
app.register_blueprint(main)

db.init_app(app)
mail.init_app(app)

def start_background_tasks():
    thread = threading.Thread(target=cleanup_expired_reservations, args=(app,))
    thread.daemon = True
    thread.start()


start_background_tasks()


if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(debug=True)
