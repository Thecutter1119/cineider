from flask import request, jsonify, Blueprint, current_app
from models import db, User, Movie, Function, Room, SeatReservation, Purchase, ActivityLog, SystemConfig
from controllers.logic import generate_qr_code, login_required, admin_required, log_activity, release_expired_reservations
from utils.email import send_email
import json
import uuid
import threading
import time
from datetime import datetime, timedelta
from flask import Flask, session
from werkzeug.security import generate_password_hash, check_password_hash

main = Blueprint('main', __name__)
_ran_once = False

@main.route('/api/register', methods=['POST'])
# @admin_required
def create_user():
    """REQ1: Crear usuario (solo administradores)"""
    data = request.get_json()
    
    required_fields = ['email', 'password', 'name', 'age']
    if not all(field in data for field in required_fields):
        return jsonify({'error': 'Faltan campos requeridos'}), 400
    
    if User.query.filter_by(email=data['email']).first():
        return jsonify({'error': 'El correo ya está registrado'}), 400
    
    user = User(
        email=data['email'],
        password_hash=generate_password_hash(data['password']),
        name=data['name'],
        age=data['age'],
        role=data.get('role', 'user')
    )
    
    try:
        db.session.add(user)
        db.session.commit()
        
        # Enviar correo de confirmación
        send_email(
            user.email,
            'Cuenta creada en CINEIDER FILMS',
            f'Hola {user.name}, tu cuenta ha sido creada exitosamente.'
        )
        
        # log_activity(session['user_id'], 'USER_CREATED', f'Created user: {user.email}')
        
        return jsonify({'message': 'Usuario creado exitosamente', 'user_id': user.id}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Error al crear usuario'}), 500

@main.route('/api/login', methods=['POST'])
def login():
    """REQ2: Autenticación de usuarios"""
    data = request.get_json()
    
    if not data.get('email') or not data.get('password'):
        return jsonify({'error': 'Email y contraseña son requeridos'}), 400
    
    user = User.query.filter_by(email=data['email']).first()
    
    if not user or not check_password_hash(user.password_hash, data['password']):
        return jsonify({'error': 'Credenciales incorrectas'}), 401
    
    session['user_id'] = user.id
    session['user_role'] = user.role
    session['user_email'] = user.email
    session['user_name'] = user.name
    session['user_age'] = user.age
    
    log_activity(user.id, 'LOGIN', 'User logged in')
    
    return jsonify({
        'message': 'Inicio de sesión exitoso',
        'user': {
            'user_id': user.id,
            'user_name': user.name,
            'user_email': user.email,
            'user_role': user.role,
            'user_age': user.age
        }
    }), 200

@main.route('/api/logout', methods=['POST'])
@login_required
def logout():
    """Cerrar sesión"""
    user_id = session.get('user_id')
    session.clear()
    
    log_activity(user_id, 'LOGOUT', 'User logged out')
    
    return jsonify({'message': 'Sesión cerrada exitosamente'}), 200

@main.route('/api/forgot-password', methods=['POST'])
def forgot_password():
    """REQ3: Recuperación de contraseña"""
    data = request.get_json()
    email = data.get('email')
    
    if not email:
        return jsonify({'error': 'Email es requerido'}), 400
    
    user = User.query.filter_by(email=email).first()
    
    if not user:
        return jsonify({'error': 'Email no encontrado'}), 404
    
    # Generar token temporal (en producción usar JWT)
    reset_token = str(uuid.uuid4())
    
    # Enviar email con enlace de recuperación
    reset_link = f"http://localhost:5000/reset-password?token={reset_token}"
    email_sent = send_email(
        email,
        'Recuperación de contraseña - CINEIDER FILMS',
        f'Haz clic en este enlace para restablecer tu contraseña: {reset_link}\n\nEste enlace expira en 1 hora.'
    )
    
    if email_sent:
        return jsonify({'message': 'Enlace de recuperación enviado a tu correo'}), 200
    else:
        return jsonify({'error': 'Error al enviar correo'}), 500

# Endpoints de Cartelera y Funciones

@main.route('/api/movies', methods=['GET'])
def get_movies():
    """REQ10: Visualizar cartelera"""
    try:
        genre_filter = request.args.get('genre')
        rating_filter = request.args.get('rating')
        
        query = Movie.query.filter_by(is_active=True)
        
        if genre_filter:
            query = query.filter(Movie.genre.ilike(f'%{genre_filter}%'))
        if rating_filter:
            query = query.filter_by(rating=rating_filter)
        
        movies = query.all()
        
        if not movies:
            return jsonify({'message': 'Sin películas disponibles', 'movies': []}), 200
        
        movies_data = []
        for movie in movies:
            functions = Function.query.filter_by(movie_id=movie.id).all()
            movies_data.append({
                'id': movie.id,
                'title': movie.title,
                'synopsis': movie.synopsis,
                'duration': movie.duration,
                'rating': movie.rating,
                'genre': movie.genre,
                'functions': [{
                    'id': f.id,
                    'datetime': f.datetime.isoformat(),
                    'room': Room.query.get(f.room_id).name,
                    'price': f.price,
                    'available_seats': f.available_seats
                } for f in functions]
            })
        
        return jsonify({'movies': movies_data}), 200
    except Exception as e:
        return jsonify({'error': 'Error al cargar cartelera'}), 500

@main.route('/api/functions/<int:function_id>/seats', methods=['GET'])
@login_required
def get_function_seats(function_id):
    """Obtener mapa de asientos para una función"""
    function = Function.query.get_or_404(function_id)
    room = Room.query.get(function.room_id)
    
    # Obtener asientos reservados/comprados
    reserved_seats = SeatReservation.query.filter_by(function_id=function_id).all()
    reserved_seat_numbers = [r.seat_number for r in reserved_seats]
    
    return jsonify({
        'function_id': function_id,
        'room_name': room.name,
        'total_capacity': room.capacity,
        'available_seats': function.available_seats,
        'reserved_seats': reserved_seat_numbers
    }), 200

# Endpoints de Reservas y Compras

@main.route('/api/reserve-seats', methods=['POST'])
@login_required
def reserve_seats():
    """REQ9: Reservar silla"""
    data = request.get_json()
    function_id = data.get('function_id')
    seat_numbers = data.get('seats', [])
    
    if not function_id or not seat_numbers:
        return jsonify({'error': 'Función y asientos son requeridos'}), 400
    
    function = Function.query.get_or_404(function_id)
    
    # Verificar que el usuario tiene reservas para estos asientos
    user_reservations = SeatReservation.query.filter(
        SeatReservation.function_id == function_id,
        SeatReservation.user_id == session['user_id'],
        SeatReservation.status == 'reserved'
    ).all()
    
    for reservation in user_reservations:
        print(reservation)
        db.session.delete(reservation)

    db.session.commit()


    # Verificar disponibilidad
    if len(seat_numbers) > function.available_seats:
        return jsonify({'error': 'No hay suficientes asientos disponibles'}), 400
    
    # Verificar que los asientos no estén ya reservados
    existing_reservations = SeatReservation.query.filter(
        SeatReservation.function_id == function_id,
        SeatReservation.seat_number.in_(seat_numbers)
    ).all()
    
    if existing_reservations:
        return jsonify({'error': 'Algunos asientos ya están reservados'}), 400
    
    try:
        # Crear reservas temporales (10 minutos)
        expires_at = datetime.utcnow() + timedelta(minutes=10)
        
        for seat_number in seat_numbers:
            reservation = SeatReservation(
                function_id=function_id,
                seat_number=seat_number,
                user_id=session['user_id'],
                expires_at=expires_at
            )
            db.session.add(reservation)
        
        # Actualizar asientos disponibles
        function.available_seats -= len(seat_numbers)
        db.session.commit()
        
        log_activity(session['user_id'], 'SEATS_RESERVED', f'Reserved seats: {seat_numbers}')
        
        return jsonify({
            'message': 'Asientos reservados exitosamente',
            'expires_at': expires_at.isoformat(),
            'seats': seat_numbers
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Error al reservar asientos'}), 500

@main.route('/api/check-seats', methods=['POST'])
def check_seats():
    data = request.get_json()
    function_id = data.get('function_id')

    reservations = SeatReservation.query.filter(
        SeatReservation.function_id == function_id,
        SeatReservation.status.in_(['reserved', 'purchased'])
    ).all()

    # Extract only the seat numbers
    reserved_seats = [res.seat_number for res in reservations]

    return jsonify({"reserved_seats": reserved_seats}), 200



@main.route('/api/purchase-ticket', methods=['POST'])
@login_required
def purchase_ticket():
    """REQ8: Compra de ticket"""
    data = request.get_json()
    function_id = data.get('function_id')
    seats = data.get('seats', [])
    
    if not function_id or not seats:
        return jsonify({'error': 'Función y asientos son requeridos'}), 400
    
    function = Function.query.get_or_404(function_id)
    movie = Movie.query.get(function.movie_id)
    user = User.query.get(session['user_id'])
    
    # Validar edad para películas con restricción (RN-002)
    age_restricted_ratings = ['R', '+18', 'NC-17']
    if movie.rating in age_restricted_ratings and user.age < 18:
        return jsonify({'error': 'No tienes la edad mínima para esta película'}), 403
    
    # Verificar que el usuario tiene reservas para estos asientos
    user_reservations = SeatReservation.query.filter(
        SeatReservation.function_id == function_id,
        SeatReservation.user_id == session['user_id'],
        SeatReservation.seat_number.in_(seats),
        SeatReservation.status == 'reserved'
    ).all()
    
    if len(user_reservations) != len(seats):
        return jsonify({'error': 'Debes reservar los asientos antes de comprar'}), 400
    
    try:
        # Calcular total
        total_amount = function.price * len(seats)
        
        # Generar código único para el ticket
        ticket_code = str(uuid.uuid4())
        
        # Crear información del QR
        qr_data = {
            'ticket_code': ticket_code,
            'movie': movie.title,
            'function_date': function.datetime.isoformat(),
            'seats': seats,
            'room': Room.query.get(function.room_id).name
        }
        
        # Generar QR code
        qr_code_base64 = generate_qr_code(json.dumps(qr_data))
        
        # Crear compra
        purchase = Purchase(
            user_id=session['user_id'],
            function_id=function_id,
            seats=json.dumps(seats),
            total_amount=total_amount,
            ticket_code=ticket_code,
            qr_code=qr_code_base64
        )
        
        db.session.add(purchase)
        
        # Actualizar estado de reservas a comprado
        for reservation in user_reservations:
            reservation.status = 'purchased'
        
        db.session.commit()
        
        # Enviar ticket por correo (REQ11)
        email_body = f"""
        ¡Gracias por tu compra en CINEIDER FILMS!
        
        Película: {movie.title}
        Fecha y hora: {function.datetime.strftime('%d/%m/%Y %H:%M')}
        Sala: {Room.query.get(function.room_id).name}
        Asientos: {', '.join(map(str, seats))}
        Total: ${total_amount}
        
        Código del ticket: {ticket_code}
        
        Presenta este código QR en la entrada del cine.
        """
        
        send_email(user.email, 'Tu ticket de CINEIDER FILMS', email_body)
        
        log_activity(session['user_id'], 'TICKET_PURCHASED', f'Purchased ticket: {ticket_code}')
        
        return jsonify({
            'message': 'Compra realizada exitosamente',
            'ticket_code': ticket_code,
            'total_amount': total_amount,
            'qr_code': qr_code_base64
        }), 200
        
    except Exception as e:
        db.session.rollback()
        print(e)
        return jsonify({'error': 'Error al procesar la compra'}), 500

@main.route('/api/purchase-history', methods=['GET'])
@login_required
def get_purchase_history():
    """REQ12: Consultar historial de compras"""
    user_id = session['user_id']
    
    purchases = Purchase.query.filter_by(user_id=user_id).order_by(Purchase.purchase_date.desc()).all()
    
    if not purchases:
        return jsonify({'message': 'No tienes compras previas', 'purchases': []}), 200
    
    purchase_history = []
    for purchase in purchases:
        function = Function.query.get(purchase.function_id)
        movie = Movie.query.get(function.movie_id)
        room = Room.query.get(function.room_id)
        
        purchase_history.append({
            'id': purchase.id,
            'ticket_code': purchase.ticket_code,
            'movie_title': movie.title,
            'function_date': function.datetime.isoformat(),
            'room_name': room.name,
            'seats': json.loads(purchase.seats),
            'total_amount': purchase.total_amount,
            'purchase_date': purchase.purchase_date.isoformat(),
            'qr_code': purchase.qr_code
        })
    
    return jsonify({'purchases': purchase_history}), 200

# Endpoints de Administración

@main.route('/api/admin/dashboard', methods=['GET'])
@admin_required
def admin_dashboard():
    """REQ13: Visualización del Dashboard (Administrador)"""
    total_users = User.query.count()
    total_movies = Movie.query.filter_by(is_active=True).count()
    total_purchases = Purchase.query.count()
    total_revenue = db.session.query(db.func.sum(Purchase.total_amount)).scalar() or 0
    
    # Estadísticas recientes
    today = datetime.utcnow().date()
    today_purchases = Purchase.query.filter(
        db.func.date(Purchase.purchase_date) == today
    ).count()
    
    return jsonify({
        'total_users': total_users,
        'total_movies': total_movies,
        'total_purchases': total_purchases,
        'total_revenue': total_revenue,
        'today_purchases': today_purchases
    }), 200

@main.route('/api/admin/reports', methods=['POST'])
@admin_required
def generate_report():
    """REQ4: Generación de informes"""
    data = request.get_json()
    report_type = data.get('type', 'sales')
    start_date = data.get('start_date')
    end_date = data.get('end_date')
    
    try:
        if report_type == 'sales':
            query = Purchase.query
            if start_date:
                query = query.filter(Purchase.purchase_date >= datetime.fromisoformat(start_date))
            if end_date:
                query = query.filter(Purchase.purchase_date <= datetime.fromisoformat(end_date))
            
            purchases = query.all()
            
            report_data = {
                'type': 'sales',
                'total_sales': len(purchases),
                'total_revenue': sum(p.total_amount for p in purchases),
                'period': f"{start_date} to {end_date}" if start_date and end_date else "All time",
                'sales': [{
                    'date': p.purchase_date.isoformat(),
                    'amount': p.total_amount,
                    'ticket_code': p.ticket_code
                } for p in purchases]
            }
        
        elif report_type == 'attendance':
            # Reporte de asistencia por película
            movies = Movie.query.filter_by(is_active=True).all()
            attendance_data = []
            
            for movie in movies:
                functions = Function.query.filter_by(movie_id=movie.id).all()
                total_tickets = 0
                
                for function in functions:
                    tickets = Purchase.query.filter_by(function_id=function.id).count()
                    total_tickets += tickets
                
                attendance_data.append({
                    'movie': movie.title,
                    'total_tickets_sold': total_tickets
                })
            
            report_data = {
                'type': 'attendance',
                'movies': attendance_data
            }
        
        log_activity(session['user_id'], 'REPORT_GENERATED', f'Generated {report_type} report')
        
        return jsonify(report_data), 200
        
    except Exception as e:
        return jsonify({'error': 'Error al generar reporte'}), 500

@main.route('/api/admin/system-config', methods=['GET', 'POST'])
@admin_required
def system_configuration():
    """REQ7: Gestión de configuración del sistema"""
    if request.method == 'GET':
        configs = SystemConfig.query.all()
        config_dict = {config.key: config.value for config in configs}
        return jsonify(config_dict), 200
    
    elif request.method == 'POST':
        data = request.get_json()
        
        try:
            for key, value in data.items():
                config = SystemConfig.query.filter_by(key=key).first()
                if config:
                    config.value = str(value)
                    config.updated_at = datetime.utcnow()
                else:
                    config = SystemConfig(key=key, value=str(value))
                    db.session.add(config)
            
            db.session.commit()
            
            log_activity(session['user_id'], 'SYSTEM_CONFIG_UPDATED', f'Updated configs: {list(data.keys())}')
            
            return jsonify({'message': 'Configuración actualizada exitosamente'}), 200
            
        except Exception as e:
            db.session.rollback()
            return jsonify({'error': 'Error al actualizar configuración'}), 500

@main.route('/api/admin/activity-logs', methods=['GET'])
@admin_required
def get_activity_logs():
    """REQ5: Registro de actividad (consulta)"""
    logs = ActivityLog.query.order_by(ActivityLog.timestamp.desc()).limit(100).all()
    
    logs_data = []
    for log in logs:
        user = User.query.get(log.user_id) if log.user_id else None
        logs_data.append({
            'id': log.id,
            'user_email': user.email if user else 'Sistema',
            'action': log.action,
            'details': log.details,
            'timestamp': log.timestamp.isoformat(),
            'ip_address': log.ip_address
        })
    
    return jsonify({'logs': logs_data}), 200

@main.route('/api/session', methods=['GET'])
@login_required
def check_session():
    """Consultar si hay una sesión iniciada"""
    return jsonify({"menssage": "Sesión activa", 'session': session}), 200
# Endpoint para Dashboard de Usuario
@main.route('/api/user/dashboard', methods=['GET'])
@login_required
def user_dashboard():
    """REQ13: Visualización del Dashboard (Usuario)"""
    user_id = session['user_id']
    
    # Compras recientes
    recent_purchases = Purchase.query.filter_by(user_id=user_id).order_by(
        Purchase.purchase_date.desc()
    ).limit(5).all()
    
    # Películas recomendadas (simplificado)
    recommended_movies = Movie.query.filter_by(is_active=True).limit(6).all()
    
    dashboard_data = {
        'total_purchases': Purchase.query.filter_by(user_id=user_id).count(),
        'recent_purchases': [{
            'movie_title': Movie.query.get(Function.query.get(p.function_id).movie_id).title,
            'purchase_date': p.purchase_date.isoformat(),
            'total_amount': p.total_amount
        } for p in recent_purchases],
        'recommended_movies': [{
            'id': movie.id,
            'title': movie.title,
            'genre': movie.genre,
            'rating': movie.rating
        } for movie in recommended_movies]
    }
    
    return jsonify(dashboard_data), 200

# Task para limpiar reservas expiradas
def cleanup_expired_reservations(app):
    """Tarea en segundo plano para liberar reservas expiradas"""
    while True:
        try:
            with app.app_context():
                release_expired_reservations()
            time.sleep(60)  # Ejecutar cada minuto
        except Exception as e:
            print(f"Error in cleanup task: {e}")
            time.sleep(60)

# Inicialización de la base de datos
@main.before_app_request
def create_tables():
    global _ran_once
    
    if not _ran_once:
        _ran_once = True
        db.create_all()
        
        # Crear usuario administrador por defecto
        admin = User.query.filter_by(email='admin@cineider.com').first()
        if not admin:
            admin = User(
                email='admin@cineider.com',
                password_hash=generate_password_hash('admin123'),
                name='Administrador',
                age=30,
                role='admin'
            )
            db.session.add(admin)
            db.session.commit()
        # Iniciar tarea de limpieza en segundo plano
        # cleanup_thread = threading.Thread(target=cleanup_expired_reservations, daemon=True)
        # cleanup_thread.start()

# Manejo de errores
@main.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Recurso no encontrado'}), 404

@main.errorhandler(500)
def internal_error(error):
    db.session.rollback()
    return jsonify({'error': 'Error interno del servidor'}), 500

@main.errorhandler(400)
def bad_request(error):
    print(error)
    return jsonify({'error': 'Solicitud incorrecta'}), 400

# Endpoints adicionales para completar funcionalidades

@main.route('/api/movies', methods=['POST'])
@admin_required
def create_movie():
    """Crear nueva película (Administrador)"""
    data = request.get_json()
    
    required_fields = ['title', 'duration', 'rating', 'synopsis']
    if not all(field in data for field in required_fields):
        return jsonify({'error': 'Faltan campos requeridos'}), 400
    
    movie = Movie(
        title=data['title'],
        synopsis=data['synopsis'],
        duration=data['duration'],
        rating=data['rating'],
        genre=data.get('genre', ''),
        is_active=data.get('is_active', True)
    )
    
    try:
        db.session.add(movie)
        db.session.commit()
        
        log_activity(session['user_id'], 'MOVIE_CREATED', f'Created movie: {movie.title}')
        
        return jsonify({
            'message': 'Película creada exitosamente',
            'movie_id': movie.id
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Error al crear película'}), 500

@main.route('/api/rooms', methods=['POST'])
@admin_required
def create_room():
    """Crear nueva sala (Administrador)"""
    data = request.get_json()
    
    required_fields = ['name', 'capacity']
    if not all(field in data for field in required_fields):
        return jsonify({'error': 'Faltan campos requeridos'}), 400
    
    room = Room(
        name=data['name'],
        capacity=data['capacity'],
        room_type=data.get('room_type', '2D')
    )
    
    try:
        db.session.add(room)
        db.session.commit()
        
        log_activity(session['user_id'], 'ROOM_CREATED', f'Created room: {room.name}')
        
        return jsonify({
            'message': 'Sala creada exitosamente',
            'room_id': room.id
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Error al crear sala'}), 500

@main.route('/api/functions', methods=['POST'])
@admin_required
def create_function():
    """Crear nueva función (Administrador)"""
    data = request.get_json()
    
    required_fields = ['movie_id', 'room_id', 'datetime', 'price']
    if not all(field in data for field in required_fields):
        return jsonify({'error': 'Faltan campos requeridos'}), 400
    
    # Verificar que la película y sala existan
    movie = Movie.query.get(data['movie_id'])
    room = Room.query.get(data['room_id'])
    
    if not movie or not room:
        return jsonify({'error': 'Película o sala no encontrada'}), 404
    
    function = Function(
        movie_id=data['movie_id'],
        room_id=data['room_id'],
        datetime=datetime.fromisoformat(data['datetime']),
        price=data['price'],
        available_seats=room.capacity
    )
    
    try:
        db.session.add(function)
        db.session.commit()
        
        log_activity(session['user_id'], 'FUNCTION_CREATED', 
                    f'Created function for movie: {movie.title}')
        
        return jsonify({
            'message': 'Función creada exitosamente',
            'function_id': function.id
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Error al crear función'}), 500

@main.route('/api/validate-ticket', methods=['POST'])
def validate_ticket():
    """Validar ticket con código QR"""
    data = request.get_json()
    ticket_code = data.get('ticket_code')
    
    if not ticket_code:
        return jsonify({'error': 'Código de ticket requerido'}), 400
    
    purchase = Purchase.query.filter_by(ticket_code=ticket_code).first()
    
    if not purchase:
        return jsonify({'error': 'Ticket no válido'}), 404
    
    function = Function.query.get(purchase.function_id)
    movie = Movie.query.get(function.movie_id)
    room = Room.query.get(function.room_id)
    user = User.query.get(purchase.user_id)
    
    # Verificar si la función ya pasó
    if function.datetime < datetime.utcnow():
        status = 'expired'
    else:
        status = 'valid'
    
    ticket_info = {
        'ticket_code': purchase.ticket_code,
        'movie_title': movie.title,
        'function_date': function.datetime.isoformat(),
        'room_name': room.name,
        'seats': json.loads(purchase.seats),
        'user_name': user.name,
        'purchase_date': purchase.purchase_date.isoformat(),
        'status': status
    }
    
    log_activity(None, 'TICKET_VALIDATED', f'Validated ticket: {ticket_code}')
    
    return jsonify(ticket_info), 200

@main.route('/api/rooms', methods=['GET'])
def get_rooms():
    """Obtener lista de salas"""
    rooms = Room.query.all()
    
    rooms_data = [{
        'id': room.id,
        'name': room.name,
        'capacity': room.capacity,
        'room_type': room.room_type
    } for room in rooms]
    
    return jsonify({'rooms': rooms_data}), 200

@main.route('/api/functions', methods=['GET'])
def get_functions():
    """Obtener funciones disponibles"""
    movie_id = request.args.get('movie_id')
    date_filter = request.args.get('date')
    
    query = Function.query
    
    if movie_id:
        query = query.filter_by(movie_id=movie_id)
    
    if date_filter:
        date_obj = datetime.fromisoformat(date_filter).date()
        query = query.filter(db.func.date(Function.datetime) == date_obj)
    
    # Solo funciones futuras
    query = query.filter(Function.datetime > datetime.utcnow())
    
    functions = query.all()
    
    functions_data = []
    for function in functions:
        movie = Movie.query.get(function.movie_id)
        room = Room.query.get(function.room_id)
        
        functions_data.append({
            'id': function.id,
            'movie': {
                'id': movie.id,
                'title': movie.title,
                'duration': movie.duration,
                'rating': movie.rating
            },
            'room': {
                'id': room.id,
                'name': room.name,
                'capacity': room.capacity,
                'type': room.room_type
            },
            'datetime': function.datetime.isoformat(),
            'price': function.price,
            'available_seats': function.available_seats
        })
    
    return jsonify({'functions': functions_data}), 200

@main.route('/api/user/profile', methods=['GET', 'PUT'])
@login_required
def user_profile():
    """Obtener/actualizar perfil de usuario"""
    user = User.query.get(session['user_id'])
    if request.method == 'GET':
        return jsonify({
            'id': user.id,
            'name': user.name,
            'email': user.email,
            'age': user.age,
            'role': user.role,
            'created_at': user.created_at.isoformat()
        }), 200
    
    elif request.method == 'PUT':
        data = request.get_json()
        
        # Actualizar campos permitidos
        if 'name' in data:
            user.name = data['name']
        if 'age' in data:
            user.age = data['age']
        
        try:
            session['user_name'] = user.name
            session['user_age'] = user.age
            db.session.commit()
            log_activity(user.id, 'PROFILE_UPDATED', 'User updated profile')
            return jsonify({'message': 'Perfil actualizado exitosamente'}), 200
        except Exception as e:
            db.session.rollback()
            return jsonify({'error': 'Error al actualizar perfil'}), 500

@main.route('/api/help/report-issue', methods=['POST'])
@login_required
def report_issue():
    """Reportar problema (REQ7.3)"""
    data = request.get_json()
    
    issue_description = data.get('description', '')
    issue_type = data.get('type', 'general')
    
    if not issue_description:
        return jsonify({'error': 'Descripción del problema es requerida'}), 400
    
    user = User.query.get(session['user_id'])
    
    # En una implementación real, esto se guardaría en una tabla de issues
    # Por ahora lo registramos en el log de actividades
    log_activity(
        session['user_id'], 
        'ISSUE_REPORTED', 
        f'User reported issue: {issue_type} - {issue_description}'
    )
    
    # Enviar email al equipo de soporte
    support_email_body = f"""
    Usuario: {user.name} ({user.email})
    Tipo de problema: {issue_type}
    Descripción: {issue_description}
    Fecha: {datetime.utcnow().isoformat()}
    IP: {request.remote_addr}
    """
    
    send_email(
        'support@cineider.com',
        f'Reporte de problema - {issue_type}',
        support_email_body
    )
    
    return jsonify({'message': 'Problema reportado exitosamente. Te contactaremos pronto.'}), 200

@main.route('/api/admin/users', methods=['GET'])
@admin_required
def get_users():
    """Obtener lista de usuarios (Administrador)"""
    users = User.query.all()
    
    users_data = [{
        'id': user.id,
        'name': user.name,
        'email': user.email,
        'age': user.age,
        'role': user.role,
        'created_at': user.created_at.isoformat(),
        'total_purchases': Purchase.query.filter_by(user_id=user.id).count()
    } for user in users]
    
    return jsonify({'users': users_data}), 200

@main.route('/api/admin/users/<int:user_id>', methods=['PUT', 'DELETE'])
@admin_required
def manage_user(user_id):
    """Actualizar o eliminar usuario (Administrador)"""
    user = User.query.get_or_404(user_id)
    
    if request.method == 'PUT':
        data = request.get_json()
        
        if 'name' in data:
            user.name = data['name']
        if 'email' in data:
            user.email = data['email']
        if 'age' in data:
            user.age = data['age']
        if 'role' in data:
            user.role = data['role']
        
        try:
            db.session.commit()
            log_activity(session['user_id'], 'USER_UPDATED', f'Updated user: {user.email}')
            return jsonify({'message': 'Usuario actualizado exitosamente'}), 200
        except Exception as e:
            db.session.rollback()
            return jsonify({'error': 'Error al actualizar usuario'}), 500
    
    elif request.method == 'DELETE':
        try:
            # En un sistema real, consideraríamos hacer soft delete
            # para mantener integridad referencial
            db.session.delete(user)
            db.session.commit()
            
            log_activity(session['user_id'], 'USER_DELETED', f'Deleted user: {user.email}')
            return jsonify({'message': 'Usuario eliminado exitosamente'}), 200
        except Exception as e:
            db.session.rollback()
            return jsonify({'error': 'Error al eliminar usuario'}), 500

@main.route('/api/health', methods=['GET'])
def health_check():
    """Endpoint de verificación de salud del sistema"""
    try:
        # Verificar conexión a la base de datos
        db.session.execute('SELECT 1')
        
        return jsonify({
            'status': 'healthy',
            'timestamp': datetime.utcnow().isoformat(),
            'database': 'connected'
        }), 200
    except Exception as e:
        return jsonify({
            'status': 'unhealthy',
            'timestamp': datetime.utcnow().isoformat(),
            'error': str(e)
        }), 500

# Middleware para CORS (si se necesita)
# @main.after_request
# def after_request(response):
#     response.headers.add('Access-Control-Allow-Origin', '*')
#     response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
#     response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
#     return response