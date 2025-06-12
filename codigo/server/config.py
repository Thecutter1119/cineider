
class Config:
    SECRET_KEY = 'cineider-secret-key-2025'
    SQLALCHEMY_DATABASE_URI = 'sqlite:///cineider.db'
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    # Configuración de correo
    MAIL_SERVER = 'smtp.gmail.com'
    MAIL_PORT = 587
    MAIL_USE_TLS = True
    MAIL_USERNAME = 'manuel.umana@correounivalle.edu.co'
    MAIL_PASSWORD = 'gcwv ntby rugb cfng'
    MAIL_DEFAULT_SENDER = ('Cineider Films', 'manuel.umana@correounivalle.edu.co')
