from flask_sqlalchemy import SQLAlchemy
db = SQLAlchemy()
from datetime import datetime

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    name = db.Column(db.String(100), nullable=False)
    age = db.Column(db.Integer, nullable=False)
    role = db.Column(db.String(20), default='user')  # 'user' o 'admin'
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    purchases = db.relationship('Purchase', backref='user', lazy=True)

class Movie(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    synopsis = db.Column(db.Text)
    duration = db.Column(db.Integer, nullable=False)  # en minutos
    rating = db.Column(db.String(10), nullable=False)  # G, PG, PG-13, R, etc.
    genre = db.Column(db.String(100))
    is_active = db.Column(db.Boolean, default=True)
    functions = db.relationship('Function', backref='movie', lazy=True)

class Room(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50), nullable=False)
    capacity = db.Column(db.Integer, nullable=False)
    room_type = db.Column(db.String(50))  # 2D, 3D, IMAX, etc.
    functions = db.relationship('Function', backref='room', lazy=True)

class Function(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    movie_id = db.Column(db.Integer, db.ForeignKey('movie.id'), nullable=False)
    room_id = db.Column(db.Integer, db.ForeignKey('room.id'), nullable=False)
    datetime = db.Column(db.DateTime, nullable=False)
    price = db.Column(db.Float, nullable=False)
    available_seats = db.Column(db.Integer, nullable=False)
    reservations = db.relationship('SeatReservation', backref='function', lazy=True)

class SeatReservation(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    function_id = db.Column(db.Integer, db.ForeignKey('function.id'), nullable=False)
    seat_number = db.Column(db.String(10), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'))
    status = db.Column(db.String(20), default='reserved')  # reserved, purchased
    reserved_at = db.Column(db.DateTime, default=datetime.utcnow)
    expires_at = db.Column(db.DateTime)

class Purchase(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    function_id = db.Column(db.Integer, db.ForeignKey('function.id'), nullable=False)
    seats = db.Column(db.Text, nullable=False)  # JSON string con asientos
    total_amount = db.Column(db.Float, nullable=False)
    purchase_date = db.Column(db.DateTime, default=datetime.utcnow)
    ticket_code = db.Column(db.String(100), unique=True, nullable=False)
    qr_code = db.Column(db.Text)

class ActivityLog(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'))
    action = db.Column(db.String(100), nullable=False)
    details = db.Column(db.Text)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)
    ip_address = db.Column(db.String(45))

class SystemConfig(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    key = db.Column(db.String(100), unique=True, nullable=False)
    value = db.Column(db.Text, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow)