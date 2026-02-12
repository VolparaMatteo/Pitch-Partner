import os
import json
from datetime import datetime, timedelta

try:
    from google.oauth2.credentials import Credentials
    from google_auth_oauthlib.flow import Flow
    from googleapiclient.discovery import build
    GOOGLE_AVAILABLE = True
except ImportError:
    GOOGLE_AVAILABLE = False


class GoogleCalendarService:
    SCOPES = ['https://www.googleapis.com/auth/calendar']

    def __init__(self):
        self.client_id = os.getenv('GOOGLE_CLIENT_ID')
        self.client_secret = os.getenv('GOOGLE_CLIENT_SECRET')
        self.redirect_uri = os.getenv('GOOGLE_REDIRECT_URI', 'http://localhost:5003/api/admin/calendar/google/callback')

    @property
    def is_configured(self):
        return GOOGLE_AVAILABLE and bool(self.client_id and self.client_secret)

    def _get_flow(self):
        if not self.is_configured:
            return None
        client_config = {
            "web": {
                "client_id": self.client_id,
                "client_secret": self.client_secret,
                "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                "token_uri": "https://oauth2.googleapis.com/token",
                "redirect_uris": [self.redirect_uri]
            }
        }
        flow = Flow.from_client_config(client_config, scopes=self.SCOPES)
        flow.redirect_uri = self.redirect_uri
        return flow

    def _get_credentials(self, admin):
        if not admin.google_refresh_token or not self.is_configured:
            return None
        creds = Credentials(
            token=None,
            refresh_token=admin.google_refresh_token,
            token_uri='https://oauth2.googleapis.com/token',
            client_id=self.client_id,
            client_secret=self.client_secret,
            scopes=self.SCOPES
        )
        return creds

    def _get_service(self, admin):
        creds = self._get_credentials(admin)
        if not creds:
            return None
        return build('calendar', 'v3', credentials=creds)

    def get_auth_url(self, admin_id):
        flow = self._get_flow()
        if not flow:
            return None
        auth_url, state = flow.authorization_url(
            access_type='offline',
            include_granted_scopes='true',
            prompt='consent',
            state=str(admin_id)
        )
        return auth_url

    def handle_callback(self, admin, code):
        from app import db
        flow = self._get_flow()
        if not flow:
            return False
        try:
            flow.fetch_token(code=code)
            credentials = flow.credentials
            admin.google_refresh_token = credentials.refresh_token
            db.session.commit()
            return True
        except Exception as e:
            print(f"Google OAuth callback error: {e}")
            return False

    def is_connected(self, admin):
        return bool(admin.google_refresh_token) and self.is_configured

    def create_event(self, admin, event_data):
        service = self._get_service(admin)
        if not service:
            return None
        try:
            body = {
                'summary': event_data.get('titolo', ''),
                'description': event_data.get('descrizione', ''),
                'start': {
                    'dateTime': event_data['data_inizio'],
                    'timeZone': 'Europe/Rome',
                },
                'end': {
                    'dateTime': event_data['data_fine'],
                    'timeZone': 'Europe/Rome',
                },
            }
            if event_data.get('tutto_il_giorno'):
                body['start'] = {'date': event_data['data_inizio'][:10]}
                body['end'] = {'date': event_data['data_fine'][:10]}

            result = service.events().insert(calendarId='primary', body=body).execute()
            return result.get('id')
        except Exception as e:
            print(f"Google create event error: {e}")
            return None

    def update_event(self, admin, google_event_id, event_data):
        service = self._get_service(admin)
        if not service or not google_event_id:
            return False
        try:
            body = {
                'summary': event_data.get('titolo', ''),
                'description': event_data.get('descrizione', ''),
                'start': {
                    'dateTime': event_data['data_inizio'],
                    'timeZone': 'Europe/Rome',
                },
                'end': {
                    'dateTime': event_data['data_fine'],
                    'timeZone': 'Europe/Rome',
                },
            }
            service.events().update(calendarId='primary', eventId=google_event_id, body=body).execute()
            return True
        except Exception as e:
            print(f"Google update event error: {e}")
            return False

    def delete_event(self, admin, google_event_id):
        service = self._get_service(admin)
        if not service or not google_event_id:
            return False
        try:
            service.events().delete(calendarId='primary', eventId=google_event_id).execute()
            return True
        except Exception as e:
            print(f"Google delete event error: {e}")
            return False

    def sync_events(self, admin, start, end):
        from app import db
        from app.models import AdminCalendarEvent

        service = self._get_service(admin)
        if not service:
            return {'created': 0, 'updated': 0, 'deleted': 0}

        stats = {'created': 0, 'updated': 0, 'deleted': 0}
        try:
            events_result = service.events().list(
                calendarId='primary',
                timeMin=start.isoformat() + 'Z',
                timeMax=end.isoformat() + 'Z',
                singleEvents=True,
                orderBy='startTime',
                maxResults=250
            ).execute()
            google_events = events_result.get('items', [])

            existing_ids = {e.google_event_id: e for e in
                           AdminCalendarEvent.query.filter(
                               AdminCalendarEvent.admin_id == admin.id,
                               AdminCalendarEvent.google_event_id.isnot(None)
                           ).all()}

            for ge in google_events:
                ge_id = ge['id']
                start_dt = ge.get('start', {})
                end_dt = ge.get('end', {})

                if 'dateTime' in start_dt:
                    data_inizio = datetime.fromisoformat(start_dt['dateTime'].replace('Z', '+00:00')).replace(tzinfo=None)
                    data_fine = datetime.fromisoformat(end_dt['dateTime'].replace('Z', '+00:00')).replace(tzinfo=None)
                    tutto_il_giorno = False
                elif 'date' in start_dt:
                    data_inizio = datetime.strptime(start_dt['date'], '%Y-%m-%d')
                    data_fine = datetime.strptime(end_dt['date'], '%Y-%m-%d')
                    tutto_il_giorno = True
                else:
                    continue

                if ge_id in existing_ids:
                    ev = existing_ids[ge_id]
                    ev.titolo = ge.get('summary', 'Senza titolo')
                    ev.descrizione = ge.get('description', '')
                    ev.data_inizio = data_inizio
                    ev.data_fine = data_fine
                    ev.tutto_il_giorno = tutto_il_giorno
                    stats['updated'] += 1
                else:
                    new_event = AdminCalendarEvent(
                        admin_id=admin.id,
                        titolo=ge.get('summary', 'Senza titolo'),
                        descrizione=ge.get('description', ''),
                        tipo='appuntamento',
                        data_inizio=data_inizio,
                        data_fine=data_fine,
                        tutto_il_giorno=tutto_il_giorno,
                        google_event_id=ge_id
                    )
                    db.session.add(new_event)
                    stats['created'] += 1

            db.session.commit()
        except Exception as e:
            print(f"Google sync error: {e}")
            db.session.rollback()

        return stats

    def disconnect(self, admin):
        from app import db
        admin.google_refresh_token = None
        db.session.commit()
        return True


google_calendar_service = GoogleCalendarService()
