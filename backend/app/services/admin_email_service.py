import imaplib
import smtplib
import email
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.image import MIMEImage
from email.header import decode_header
from email.utils import parseaddr, formataddr, formatdate
import os
import base64
import time
import threading
import re
from datetime import datetime


IMAP_HOST = 'imaps.aruba.it'
IMAP_PORT = 993
SMTP_HOST = 'smtps.aruba.it'
SMTP_PORT = 465
TIMEOUT = 30

ACCOUNTS = [
    {'key': 'hello', 'email': 'hello@pitchpartner.it', 'label': 'Email Generale', 'type': 'shared', 'sender_name': 'Pitch Partner'},
    {'key': 'sales', 'email': 'sales@pitchpartner.it', 'label': 'Email Vendite', 'type': 'shared', 'sender_name': 'Pitch Partner Sales'},
    {'key': 'support', 'email': 'support@pitchpartner.it', 'label': 'Email Supporto', 'type': 'shared', 'sender_name': 'Pitch Partner Support'},
    {'key': 'notifications', 'email': 'notifications@pitchpartner.it', 'label': 'Notifiche Sistema', 'type': 'shared', 'sender_name': 'Pitch Partner Notifications'},
    {'key': 'g.ferretti', 'email': 'g.ferretti@pitchpartner.it', 'label': 'Gabriele Ferretti', 'type': 'personal', 'sender_name': 'Gabriele Ferretti - Pitch Partner'},
    {'key': 'm.volpara', 'email': 'm.volpara@pitchpartner.it', 'label': 'Matteo Volpara', 'type': 'personal', 'sender_name': 'Matteo Volpara - Pitch Partner'},
    {'key': 's.formaggio', 'email': 's.formaggio@pitchpartner.it', 'label': 'Simone Formaggio', 'type': 'personal', 'sender_name': 'Simone Formaggio - Pitch Partner'},
]

ACCOUNT_MAP = {a['key']: a for a in ACCOUNTS}


class AdminEmailService:
    _cache = {}
    _cache_lock = threading.Lock()
    _CACHE_TTL = 120  # 2 minutes
    _LOGO_BASE64 = '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' 

    # ------------------------------------------------------------------ accounts
    @staticmethod
    def get_accounts():
        return ACCOUNTS

    @staticmethod
    def get_account(key):
        return ACCOUNT_MAP.get(key)

    # ------------------------------------------------------------------ cache
    @classmethod
    def _cache_get(cls, cache_key):
        with cls._cache_lock:
            entry = cls._cache.get(cache_key)
            if entry and (time.time() - entry['ts']) < cls._CACHE_TTL:
                return entry['data']
            return None

    @classmethod
    def _cache_set(cls, cache_key, data):
        with cls._cache_lock:
            cls._cache[cache_key] = {'data': data, 'ts': time.time()}

    @classmethod
    def _cache_invalidate(cls, prefix=''):
        with cls._cache_lock:
            if prefix:
                keys_to_del = [k for k in cls._cache if k.startswith(prefix)]
                for k in keys_to_del:
                    del cls._cache[k]
            else:
                cls._cache.clear()

    # ------------------------------------------------------------------ IMAP
    @staticmethod
    def _connect_imap(account_key):
        account = ACCOUNT_MAP.get(account_key)
        if not account:
            raise ValueError(f'Account {account_key} non trovato')
        password = os.getenv('ARUBA_EMAIL_PASSWORD', '')
        conn = imaplib.IMAP4_SSL(IMAP_HOST, IMAP_PORT, timeout=TIMEOUT)
        conn.login(account['email'], password)
        return conn

    SENT_FOLDER = 'INBOX.Sent'

    @staticmethod
    def _detect_sent_folder(conn):
        """Detect sent folder name - Aruba uses INBOX.Sent."""
        status, folders = conn.list()
        if status != 'OK':
            return 'INBOX.Sent'
        for f in folders:
            decoded = f.decode('utf-8', errors='replace') if isinstance(f, bytes) else str(f)
            lower = decoded.lower()
            if 'inbox.sent' in lower:
                return 'INBOX.Sent'
            if '\\sent' in lower:
                # Extract folder name from flags
                match = re.search(r'"\."\s+(.+)$', decoded)
                if match:
                    return match.group(1).strip('"')
        return 'INBOX.Sent'

    # ------------------------------------------------------------------ decode helpers
    @staticmethod
    def _decode_header_value(raw):
        if raw is None:
            return ''
        parts = decode_header(raw)
        result = []
        for data, charset in parts:
            if isinstance(data, bytes):
                result.append(data.decode(charset or 'utf-8', errors='replace'))
            else:
                result.append(str(data))
        return ' '.join(result)

    @classmethod
    def _parse_email_message(cls, msg_data, uid):
        """Parse a full MIME message into a dict."""
        if isinstance(msg_data, bytes):
            msg = email.message_from_bytes(msg_data)
        else:
            msg = msg_data

        # Headers
        subject = cls._decode_header_value(msg.get('Subject', ''))
        from_raw = msg.get('From', '')
        to_raw = msg.get('To', '')
        cc_raw = msg.get('Cc', '')
        date_raw = msg.get('Date', '')
        message_id = msg.get('Message-ID', '')

        from_name, from_email = parseaddr(from_raw)
        from_name = cls._decode_header_value(from_name) if from_name else from_email

        # Parse date
        date_parsed = None
        if date_raw:
            try:
                date_tuple = email.utils.parsedate_to_datetime(date_raw)
                date_parsed = date_tuple.isoformat()
            except Exception:
                date_parsed = date_raw

        # Body and attachments
        body_text = ''
        body_html = ''
        attachments = []

        if msg.is_multipart():
            for part in msg.walk():
                content_type = part.get_content_type()
                content_disposition = str(part.get('Content-Disposition', ''))

                if 'attachment' in content_disposition:
                    filename = part.get_filename()
                    if filename:
                        filename = cls._decode_header_value(filename)
                        size = len(part.get_payload(decode=True) or b'')
                        attachments.append({
                            'filename': filename,
                            'content_type': content_type,
                            'size': size
                        })
                elif content_type == 'text/plain' and not body_text:
                    payload = part.get_payload(decode=True)
                    if payload:
                        charset = part.get_content_charset() or 'utf-8'
                        body_text = payload.decode(charset, errors='replace')
                elif content_type == 'text/html' and not body_html:
                    payload = part.get_payload(decode=True)
                    if payload:
                        charset = part.get_content_charset() or 'utf-8'
                        body_html = payload.decode(charset, errors='replace')
        else:
            content_type = msg.get_content_type()
            payload = msg.get_payload(decode=True)
            if payload:
                charset = msg.get_content_charset() or 'utf-8'
                decoded = payload.decode(charset, errors='replace')
                if content_type == 'text/html':
                    body_html = decoded
                else:
                    body_text = decoded

        # Flags
        flags_str = ''
        seen = False

        return {
            'uid': str(uid),
            'message_id': message_id,
            'subject': subject,
            'from_name': from_name,
            'from_email': from_email,
            'to': cls._decode_header_value(to_raw),
            'cc': cls._decode_header_value(cc_raw),
            'date': date_parsed,
            'body_text': body_text,
            'body_html': body_html,
            'attachments': attachments,
            'seen': seen,
            'has_attachments': len(attachments) > 0
        }

    # ------------------------------------------------------------------ fetch emails
    @classmethod
    def fetch_emails(cls, account_key, folder='INBOX', page=1, per_page=20, search_query=None, force_refresh=False):
        cache_key = f'list:{account_key}:{folder}:{page}:{per_page}:{search_query or ""}'
        if not force_refresh:
            cached = cls._cache_get(cache_key)
            if cached:
                return cached

        conn = cls._connect_imap(account_key)
        try:
            status, _ = conn.select(folder, readonly=True)
            if status != 'OK':
                return {'emails': [], 'total': 0, 'page': page, 'pages': 0}

            # Search
            if search_query:
                criteria = f'(OR SUBJECT "{search_query}" FROM "{search_query}")'
                status, data = conn.uid('search', None, criteria)
            else:
                status, data = conn.uid('search', None, 'ALL')

            if status != 'OK' or not data[0]:
                return {'emails': [], 'total': 0, 'page': page, 'pages': 0}

            uid_list = data[0].split()
            uid_list.reverse()  # newest first
            total = len(uid_list)
            pages = (total + per_page - 1) // per_page

            # Paginate
            start = (page - 1) * per_page
            end = start + per_page
            page_uids = uid_list[start:end]

            if not page_uids:
                return {'emails': [], 'total': total, 'page': page, 'pages': pages}

            # Fetch headers for page
            uid_str = b','.join(page_uids)
            status, msg_data = conn.uid('fetch', uid_str, '(UID FLAGS BODY.PEEK[HEADER] RFC822.SIZE)')

            emails = []
            for i in range(0, len(msg_data)):
                item = msg_data[i]
                if isinstance(item, tuple) and len(item) >= 2:
                    header_data = item[1]
                    meta_line = item[0].decode('utf-8', errors='replace') if isinstance(item[0], bytes) else str(item[0])

                    # Extract UID from response
                    uid_match = re.search(r'UID (\d+)', meta_line)
                    uid = uid_match.group(1) if uid_match else '0'

                    # Extract flags
                    flags_match = re.search(r'FLAGS \(([^)]*)\)', meta_line)
                    flags = flags_match.group(1) if flags_match else ''
                    seen = '\\Seen' in flags

                    # Extract size
                    size_match = re.search(r'RFC822\.SIZE (\d+)', meta_line)
                    size = int(size_match.group(1)) if size_match else 0

                    # Parse header
                    msg = email.message_from_bytes(header_data) if isinstance(header_data, bytes) else email.message_from_string(header_data)
                    subject = cls._decode_header_value(msg.get('Subject', ''))
                    from_raw = msg.get('From', '')
                    from_name, from_addr = parseaddr(from_raw)
                    from_name = cls._decode_header_value(from_name) if from_name else from_addr
                    date_raw = msg.get('Date', '')

                    date_parsed = None
                    if date_raw:
                        try:
                            date_parsed = email.utils.parsedate_to_datetime(date_raw).isoformat()
                        except Exception:
                            date_parsed = date_raw

                    # Check for attachments via Content-Type header
                    content_type = msg.get('Content-Type', '')
                    has_attachments = 'multipart/mixed' in content_type.lower()

                    emails.append({
                        'uid': uid,
                        'subject': subject,
                        'from_name': from_name,
                        'from_email': from_addr,
                        'date': date_parsed,
                        'seen': seen,
                        'size': size,
                        'has_attachments': has_attachments
                    })

            result = {'emails': emails, 'total': total, 'page': page, 'pages': pages}
            cls._cache_set(cache_key, result)
            return result
        finally:
            try:
                conn.close()
                conn.logout()
            except Exception:
                pass

    # ------------------------------------------------------------------ fetch detail
    @classmethod
    def fetch_email_detail(cls, account_key, uid, folder='INBOX'):
        conn = cls._connect_imap(account_key)
        try:
            conn.select(folder)
            status, msg_data = conn.uid('fetch', str(uid).encode(), '(UID FLAGS RFC822)')
            if status != 'OK' or not msg_data or not msg_data[0]:
                return None

            raw_email = None
            flags = ''
            for item in msg_data:
                if isinstance(item, tuple) and len(item) >= 2:
                    raw_email = item[1]
                    meta = item[0].decode('utf-8', errors='replace') if isinstance(item[0], bytes) else str(item[0])
                    flags_match = re.search(r'FLAGS \(([^)]*)\)', meta)
                    flags = flags_match.group(1) if flags_match else ''
                    break

            if not raw_email:
                return None

            result = cls._parse_email_message(raw_email, uid)
            result['seen'] = '\\Seen' in flags

            # Mark as read
            conn.uid('store', str(uid).encode(), '+FLAGS', '(\\Seen)')

            # Invalidate cache for this account
            cls._cache_invalidate(f'list:{account_key}:')
            cls._cache_invalidate('unread:')

            return result
        finally:
            try:
                conn.close()
                conn.logout()
            except Exception:
                pass

    # ------------------------------------------------------------------ download attachment
    @classmethod
    def download_attachment(cls, account_key, uid, filename, folder='INBOX'):
        conn = cls._connect_imap(account_key)
        try:
            conn.select(folder, readonly=True)
            status, msg_data = conn.uid('fetch', str(uid).encode(), '(RFC822)')
            if status != 'OK' or not msg_data or not msg_data[0]:
                return None

            raw_email = None
            for item in msg_data:
                if isinstance(item, tuple) and len(item) >= 2:
                    raw_email = item[1]
                    break

            if not raw_email:
                return None

            msg = email.message_from_bytes(raw_email)
            for part in msg.walk():
                if part.get_content_disposition() == 'attachment' or 'attachment' in str(part.get('Content-Disposition', '')):
                    part_filename = part.get_filename()
                    if part_filename:
                        part_filename = cls._decode_header_value(part_filename)
                        if part_filename == filename:
                            data = part.get_payload(decode=True)
                            content_type = part.get_content_type()
                            return {
                                'data': data,
                                'content_type': content_type,
                                'filename': filename
                            }
            return None
        finally:
            try:
                conn.close()
                conn.logout()
            except Exception:
                pass

    # ------------------------------------------------------------------ send email
    @classmethod
    def send_email(cls, account_key, to, subject, body_html, cc=None, bcc=None):
        account = ACCOUNT_MAP.get(account_key)
        if not account:
            raise ValueError(f'Account {account_key} non trovato')

        password = os.getenv('ARUBA_EMAIL_PASSWORD', '')

        # Build message: related > alternative + inline image
        msg = MIMEMultipart('related')
        msg['From'] = formataddr((account['sender_name'], account['email']))
        msg['To'] = to
        if cc:
            msg['Cc'] = cc
        msg['Subject'] = subject
        msg['Date'] = formatdate(localtime=True)

        # Wrap body in branded template
        branded_html = cls._wrap_branded_template(body_html, account['sender_name'], account['email'])

        # Alternative part (plain + html)
        msg_alternative = MIMEMultipart('alternative')
        text_body = re.sub(r'<[^>]+>', '', body_html)
        msg_alternative.attach(MIMEText(text_body, 'plain', 'utf-8'))
        msg_alternative.attach(MIMEText(branded_html, 'html', 'utf-8'))
        msg.attach(msg_alternative)

        # Inline logo image
        logo_data = base64.b64decode(cls._LOGO_BASE64)
        logo_img = MIMEImage(logo_data, _subtype='png')
        logo_img.add_header('Content-ID', '<logo_pp>')
        logo_img.add_header('Content-Disposition', 'inline', filename='logo.png')
        msg.attach(logo_img)

        # Build recipient list
        recipients = [addr.strip() for addr in to.split(',')]
        if cc:
            recipients += [addr.strip() for addr in cc.split(',')]
        if bcc:
            recipients += [addr.strip() for addr in bcc.split(',')]

        # Send via SMTP SSL
        with smtplib.SMTP_SSL(SMTP_HOST, SMTP_PORT, timeout=TIMEOUT) as server:
            server.login(account['email'], password)
            server.send_message(msg, to_addrs=recipients)

        # Save to Sent folder via IMAP
        try:
            conn = cls._connect_imap(account_key)
            sent_folder = cls._detect_sent_folder(conn)
            conn.append(sent_folder, '\\Seen', None, msg.as_bytes())
            conn.logout()
        except Exception:
            pass  # Non-critical if saving to Sent fails

        # Invalidate caches
        cls._cache_invalidate(f'list:{account_key}:')
        cls._cache_invalidate('unread:')

        return True

    # ------------------------------------------------------------------ unread counts
    @classmethod
    def get_unread_counts(cls, force_refresh=False):
        cache_key = 'unread:all'
        if not force_refresh:
            cached = cls._cache_get(cache_key)
            if cached:
                return cached

        counts = {}
        for account in ACCOUNTS:
            try:
                conn = cls._connect_imap(account['key'])
                conn.select('INBOX', readonly=True)
                status, data = conn.uid('search', None, 'UNSEEN')
                if status == 'OK' and data[0]:
                    counts[account['key']] = len(data[0].split())
                else:
                    counts[account['key']] = 0
                conn.close()
                conn.logout()
            except Exception:
                counts[account['key']] = 0

        cls._cache_set(cache_key, counts)
        return counts

    # ------------------------------------------------------------------ mark as read
    @classmethod
    def mark_as_read(cls, account_key, uid, folder='INBOX'):
        conn = cls._connect_imap(account_key)
        try:
            conn.select(folder)
            conn.uid('store', str(uid).encode(), '+FLAGS', '(\\Seen)')
            cls._cache_invalidate(f'list:{account_key}:')
            cls._cache_invalidate('unread:')
            return True
        finally:
            try:
                conn.close()
                conn.logout()
            except Exception:
                pass

    # ------------------------------------------------------------------ delete email
    @classmethod
    def delete_email(cls, account_key, uid, folder='INBOX'):
        conn = cls._connect_imap(account_key)
        try:
            conn.select(folder)
            conn.uid('store', str(uid).encode(), '+FLAGS', '(\\Deleted)')
            conn.expunge()
            cls._cache_invalidate(f'list:{account_key}:')
            cls._cache_invalidate('unread:')
            return True
        finally:
            try:
                conn.close()
                conn.logout()
            except Exception:
                pass

    # ------------------------------------------------------------------ branded template
    @staticmethod
    def _wrap_branded_template(body_html, sender_name='Pitch Partner', sender_email=''):
        year = datetime.now().year
        return f'''<!DOCTYPE html>
<html lang="it" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="x-apple-disable-message-reformatting">
  <title>Pitch Partner</title>
  <!--[if mso]>
  <noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript>
  <![endif]-->
  <style>
    * {{ margin: 0; padding: 0; }}
    body, table, td, a {{ -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }}
    table, td {{ mso-table-lspace: 0pt; mso-table-rspace: 0pt; }}
    img {{ -ms-interpolation-mode: bicubic; border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; }}
    body {{ width: 100% !important; height: 100% !important; margin: 0 !important; padding: 0 !important; }}
    a[x-apple-data-detectors] {{ color: inherit !important; text-decoration: none !important; font-size: inherit !important; font-family: inherit !important; font-weight: inherit !important; line-height: inherit !important; }}
    @media only screen and (max-width: 620px) {{
      .email-container {{ width: 100% !important; max-width: 100% !important; }}
      .fluid {{ max-width: 100% !important; height: auto !important; }}
      .stack-column {{ display: block !important; width: 100% !important; max-width: 100% !important; }}
      .body-content {{ padding: 24px 20px !important; }}
      .header-td {{ padding: 20px 20px !important; }}
      .footer-td {{ padding: 20px !important; }}
    }}
  </style>
</head>
<body style="margin:0;padding:0;word-spacing:normal;background-color:#F0F2F5;">
  <div role="article" aria-roledescription="email" lang="it" style="text-size-adjust:100%;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;background-color:#F0F2F5;">

    <!-- Outer Table -->
    <table role="presentation" style="width:100%;border:none;border-spacing:0;background-color:#F0F2F5;">
      <tr>
        <td align="center" style="padding:32px 16px;">

          <!-- Email Container -->
          <table role="presentation" class="email-container" style="width:600px;max-width:600px;border:none;border-spacing:0;text-align:left;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">

            <!-- Top accent line -->
            <tr>
              <td style="height:4px;background:linear-gradient(90deg,#000000 0%,#1F2937 50%,#374151 100%);border-radius:12px 12px 0 0;font-size:0;line-height:0;">
                &nbsp;
              </td>
            </tr>

            <!-- Header -->
            <tr>
              <td class="header-td" style="background-color:#000000;padding:28px 36px;text-align:center;">
                <img src="cid:logo_pp" alt="Pitch Partner" style="width:180px;height:auto;display:inline-block;" width="180">
              </td>
            </tr>

            <!-- Body -->
            <tr>
              <td class="body-content" style="background-color:#FFFFFF;padding:28px 36px 32px 36px;font-size:15px;line-height:1.7;color:#374151;">
                {body_html}
              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td class="footer-td" style="background-color:#F9FAFB;padding:28px 36px;border-top:1px solid #E5E7EB;text-align:center;border-radius:0 0 12px 12px;">
                <div style="font-size:16px;font-weight:700;color:#000000;margin-bottom:8px;">
                  Your Sponsorship Game Changer
                </div>
                <div style="margin-bottom:16px;">
                  <a href="https://www.pitchpartner.it" style="font-size:13px;color:#4F46E5;text-decoration:none;font-weight:500;">www.pitchpartner.it</a>
                </div>
                <div style="height:1px;background-color:#E5E7EB;margin-bottom:16px;"></div>
                <div style="font-size:11px;color:#9CA3AF;margin-bottom:10px;">
                  &copy; PitchPartner {year}
                </div>
                <div style="font-size:11px;color:#9CA3AF;">
                  Quest&rsquo;email &egrave; un errore? Segnalalo a <a href="mailto:support@pitchpartner.it" style="color:#4F46E5;text-decoration:none;">support@pitchpartner.it</a>
                </div>
              </td>
            </tr>

          </table>
          <!-- /Email Container -->

        </td>
      </tr>
    </table>
    <!-- /Outer Table -->

  </div>
</body>
</html>'''
