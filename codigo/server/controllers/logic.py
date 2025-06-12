from functools import wraps
from flask import request, jsonify
from datetime import datetime
import qrcode
import io
import base64
from models import db, User, Movie, Room, Function, SeatReservation, Purchase, ActivityLog, SystemConfig
from flask import session


def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            return jsonify({'error': 'Se requiere autenticación'}), 401
        return f(*args, **kwargs)
    return decorated_function

def admin_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            return jsonify({'error': 'Se requiere autenticación'}), 401
        
        user = User.query.get(session['user_id'])
        if not user or user.role != 'admin':
            return jsonify({'error': 'Se requieren permisos de administrador'}), 403
        return f(*args, **kwargs)
    return decorated_function

# Funciones auxiliares
def log_activity(user_id, action, details=None):
    """Registra actividad del usuario (REQ5)"""
    try:
        log_entry = ActivityLog(
            user_id=user_id,
            action=action,
            details=details,
            ip_address=request.remote_addr
        )
        db.session.add(log_entry)
        db.session.commit()
    except Exception as e:
        print(f"Error logging activity: {e}")


def generate_qr_code(data):
    """Genera código QR para tickets"""
    qr = qrcode.QRCode(version=1, box_size=10, border=5)
    qr.add_data(data)
    qr.make(fit=True)
    
    img = qr.make_image(fill_color="black", back_color="white")
    img_buffer = io.BytesIO()
    img.save(img_buffer, format='PNG')
    img_buffer.seek(0)
    
    return base64.b64encode(img_buffer.getvalue()).decode()

def release_expired_reservations():
    """Libera reservas expiradas automáticamente"""
    expired_reservations = SeatReservation.query.filter(
        SeatReservation.expires_at < datetime.utcnow(),
        SeatReservation.status == 'reserved'
    ).all()
    
    for reservation in expired_reservations:
        function = Function.query.get(reservation.function_id)
        function.available_seats += 1
        db.session.delete(reservation)
    
    db.session.commit()