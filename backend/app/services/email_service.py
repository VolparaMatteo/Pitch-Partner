"""
Email Service - Gestione invio email via SMTP
"""
import smtplib
import re
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime
from app import db
from app.models import SMTPConfiguration


class EmailService:
    """Servizio per invio email via SMTP"""

    @staticmethod
    def get_smtp_config(club_id):
        """Recupera configurazione SMTP del club"""
        return SMTPConfiguration.query.filter_by(club_id=club_id).first()

    @staticmethod
    def send_email(club_id, to_email, subject, body_html, body_text=None, cc=None, bcc=None):
        """
        Invia email usando la configurazione SMTP del club

        Args:
            club_id: ID del club
            to_email: Destinatario (stringa o lista)
            subject: Oggetto email
            body_html: Corpo HTML
            body_text: Corpo plain text (opzionale)
            cc: Carbon copy (opzionale)
            bcc: Blind carbon copy (opzionale)

        Returns:
            dict: {success: bool, message: str, error: str}
        """
        config = EmailService.get_smtp_config(club_id)
        if not config:
            return {
                'success': False,
                'message': 'Configurazione SMTP non trovata',
                'error': 'smtp_not_configured'
            }

        if not config.verified:
            return {
                'success': False,
                'message': 'Configurazione SMTP non verificata',
                'error': 'smtp_not_verified'
            }

        try:
            # Crea messaggio
            msg = MIMEMultipart('alternative')
            msg['Subject'] = subject
            msg['From'] = f"{config.from_name} <{config.from_email}>" if config.from_name else config.from_email

            # Gestisci destinatari multipli
            if isinstance(to_email, list):
                msg['To'] = ', '.join(to_email)
            else:
                msg['To'] = to_email

            if cc:
                msg['Cc'] = cc if isinstance(cc, str) else ', '.join(cc)
            if bcc:
                msg['Bcc'] = bcc if isinstance(bcc, str) else ', '.join(bcc)

            # Aggiungi corpo plain text
            if body_text:
                part1 = MIMEText(body_text, 'plain', 'utf-8')
                msg.attach(part1)

            # Aggiungi corpo HTML
            part2 = MIMEText(body_html, 'html', 'utf-8')
            msg.attach(part2)

            # Connetti e invia
            if config.use_tls:
                server = smtplib.SMTP(config.host, config.port)
                server.starttls()
            else:
                server = smtplib.SMTP_SSL(config.host, config.port)

            # Decrypt password (semplice per ora, in produzione usare Fernet)
            password = EmailService._decrypt_password(config.password_encrypted)
            server.login(config.username, password)

            # Prepara lista destinatari
            all_recipients = [to_email] if isinstance(to_email, str) else to_email
            if cc:
                all_recipients.extend([cc] if isinstance(cc, str) else cc)
            if bcc:
                all_recipients.extend([bcc] if isinstance(bcc, str) else bcc)

            server.sendmail(config.from_email, all_recipients, msg.as_string())
            server.quit()

            return {
                'success': True,
                'message': f'Email inviata a {to_email}',
                'error': None
            }

        except smtplib.SMTPAuthenticationError:
            return {
                'success': False,
                'message': 'Errore autenticazione SMTP',
                'error': 'smtp_auth_error'
            }
        except smtplib.SMTPException as e:
            return {
                'success': False,
                'message': f'Errore SMTP: {str(e)}',
                'error': 'smtp_error'
            }
        except Exception as e:
            return {
                'success': False,
                'message': f'Errore invio email: {str(e)}',
                'error': 'unknown_error'
            }

    @staticmethod
    def test_connection(club_id):
        """
        Testa la connessione SMTP

        Returns:
            dict: {success: bool, message: str}
        """
        config = EmailService.get_smtp_config(club_id)
        if not config:
            return {'success': False, 'message': 'Configurazione SMTP non trovata'}

        try:
            if config.use_tls:
                server = smtplib.SMTP(config.host, config.port, timeout=10)
                server.starttls()
            else:
                server = smtplib.SMTP_SSL(config.host, config.port, timeout=10)

            password = EmailService._decrypt_password(config.password_encrypted)
            server.login(config.username, password)
            server.quit()

            # Aggiorna stato verified
            config.verified = True
            config.verified_at = datetime.utcnow()
            db.session.commit()

            return {'success': True, 'message': 'Connessione SMTP verificata con successo'}

        except smtplib.SMTPAuthenticationError:
            return {'success': False, 'message': 'Credenziali non valide'}
        except smtplib.SMTPConnectError:
            return {'success': False, 'message': 'Impossibile connettersi al server SMTP'}
        except Exception as e:
            return {'success': False, 'message': f'Errore: {str(e)}'}

    @staticmethod
    def render_template(template_str, context):
        """
        Sostituisce variabili nel template

        Args:
            template_str: Stringa con variabili {{variabile}}
            context: Dict con valori da sostituire

        Returns:
            str: Template renderizzato
        """
        def replace_var(match):
            var_path = match.group(1).strip()
            parts = var_path.split('.')

            value = context
            for part in parts:
                if isinstance(value, dict):
                    value = value.get(part, '')
                elif hasattr(value, part):
                    value = getattr(value, part, '')
                else:
                    return ''

            return str(value) if value else ''

        # Pattern per {{variabile}} o {{ variabile }}
        pattern = r'\{\{\s*([^}]+)\s*\}\}'
        return re.sub(pattern, replace_var, template_str)

    @staticmethod
    def _encrypt_password(password):
        """Cripta password (semplice base64 per ora, usare Fernet in produzione)"""
        import base64
        return base64.b64encode(password.encode()).decode()

    @staticmethod
    def _decrypt_password(encrypted):
        """Decripta password"""
        import base64
        return base64.b64decode(encrypted.encode()).decode()

    @staticmethod
    def save_smtp_config(club_id, host, port, username, password, use_tls, from_email, from_name=None):
        """
        Salva o aggiorna configurazione SMTP

        Returns:
            SMTPConfiguration
        """
        config = SMTPConfiguration.query.filter_by(club_id=club_id).first()

        if config:
            config.host = host
            config.port = port
            config.username = username
            config.password_encrypted = EmailService._encrypt_password(password)
            config.use_tls = use_tls
            config.from_email = from_email
            config.from_name = from_name
            config.verified = False  # Reset verifica
        else:
            config = SMTPConfiguration(
                club_id=club_id,
                host=host,
                port=port,
                username=username,
                password_encrypted=EmailService._encrypt_password(password),
                use_tls=use_tls,
                from_email=from_email,
                from_name=from_name
            )
            db.session.add(config)

        db.session.commit()
        return config
