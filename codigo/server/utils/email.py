from flask_mail import Message, Mail
from flask import current_app
from utils.extensions import mail

def send_email(to_email, subject, body, attachment=None):
    """Envía correos automáticos (REQ6)"""
    try:
        msg = Message(subject=subject, recipients=[to_email], body=body)
        if attachment:
            msg.attach(attachment['filename'], attachment['content_type'], attachment['data'])
        mail.send(msg)
        return True
    except Exception as e:
        print(f"Error sending email: {e}")
        return False