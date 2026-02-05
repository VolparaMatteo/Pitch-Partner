from app import db
from datetime import datetime, timedelta
from werkzeug.security import generate_password_hash, check_password_hash
import uuid


class Admin(db.Model):
    __tablename__ = 'admins'

    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)

    # Profilo
    nome = db.Column(db.String(80), nullable=False)
    cognome = db.Column(db.String(80), nullable=False)
    avatar = db.Column(db.String(500), nullable=True)  # URL immagine profilo

    # Tracking
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    last_login = db.Column(db.DateTime, nullable=True)
    is_active = db.Column(db.Boolean, default=True)

    def set_password(self, password):
        self.password_hash = generate_password_hash(password, method='pbkdf2:sha256')

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

    @property
    def full_name(self):
        return f"{self.nome} {self.cognome}"


class Club(db.Model):
    __tablename__ = 'clubs'

    id = db.Column(db.Integer, primary_key=True)

    # Dati anagrafici
    nome = db.Column(db.String(200), nullable=False)
    tipologia = db.Column(db.String(100), nullable=False)  # calcio, volley, basket, ecc.
    logo_url = db.Column(db.String(500))
    codice_fiscale = db.Column(db.String(50))  # Supports international Tax IDs
    partita_iva = db.Column(db.String(50))  # Supports international VAT numbers
    numero_affiliazione = db.Column(db.String(50))

    # Contatti
    indirizzo_sede_legale = db.Column(db.String(300))
    indirizzo_sede_operativa = db.Column(db.String(300))
    email = db.Column(db.String(120), unique=True, nullable=False)
    telefono = db.Column(db.String(20))
    sito_web = db.Column(db.String(200))

    # Referente
    referente_nome = db.Column(db.String(100))
    referente_cognome = db.Column(db.String(100))
    referente_ruolo = db.Column(db.String(100))
    referente_contatto = db.Column(db.String(100))

    # Informazioni operative
    numero_tesserati = db.Column(db.Integer)
    categoria_campionato = db.Column(db.String(200))

    # Social
    facebook = db.Column(db.String(200))
    instagram = db.Column(db.String(200))
    tiktok = db.Column(db.String(200))
    pubblico_medio = db.Column(db.Integer)

    # Autenticazione
    password_hash = db.Column(db.String(255), nullable=True)
    activation_token = db.Column(db.String(100), unique=True, nullable=True)
    activation_token_expires = db.Column(db.DateTime, nullable=True)
    is_activated = db.Column(db.Boolean, default=False)
    activated_at = db.Column(db.DateTime, nullable=True)

    # Abbonamento
    nome_abbonamento = db.Column(db.String(100))
    costo_abbonamento = db.Column(db.Float)
    tipologia_abbonamento = db.Column(db.String(20))  # mensile, trimestrale, annuale
    data_scadenza_licenza = db.Column(db.DateTime)
    account_attivo = db.Column(db.Boolean, default=True)

    # Brand / Personalizzazione Proposte
    brand_colore_primario = db.Column(db.String(20), default='#1A1A1A')
    brand_colore_secondario = db.Column(db.String(20), default='#85FF00')
    brand_colore_accento = db.Column(db.String(20), default='#3B82F6')
    brand_font = db.Column(db.String(100), default='Inter')
    brand_stile_proposta = db.Column(db.String(50), default='modern')  # modern, classic, minimal, bold
    brand_logo_chiaro = db.Column(db.String(500))  # logo per sfondi scuri
    brand_sfondo_header = db.Column(db.String(500))  # immagine sfondo header proposta
    brand_footer_text = db.Column(db.Text)  # testo personalizzato footer

    # Metadata
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relazioni
    sponsors = db.relationship('Sponsor', backref='club', lazy=True, cascade='all, delete-orphan')
    pagamenti = db.relationship('Pagamento', backref='club', lazy=True, cascade='all, delete-orphan')
    fatture = db.relationship('Fattura', backref='club', lazy=True, cascade='all, delete-orphan')

    def set_password(self, password):
        self.password_hash = generate_password_hash(password, method='pbkdf2:sha256')

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

    def is_licenza_valida(self):
        if not self.data_scadenza_licenza:
            return True
        return datetime.utcnow() < self.data_scadenza_licenza

    def generate_activation_token(self, days=7):
        """Genera un token di attivazione univoco con scadenza"""
        self.activation_token = str(uuid.uuid4())
        self.activation_token_expires = datetime.utcnow() + timedelta(days=days)
        return self.activation_token

    def is_activation_token_valid(self):
        """Verifica se il token di attivazione è ancora valido"""
        if not self.activation_token or not self.activation_token_expires:
            return False
        return datetime.utcnow() < self.activation_token_expires

    def activate(self):
        """Attiva il club invalidando il token"""
        self.activation_token = None
        self.activation_token_expires = None
        self.is_activated = True
        self.activated_at = datetime.utcnow()


# ==================== CLUB USER SYSTEM ====================
class ClubUser(db.Model):
    """Utenti del club - sistema multi-utente"""
    __tablename__ = 'club_users'

    id = db.Column(db.Integer, primary_key=True)
    club_id = db.Column(db.Integer, db.ForeignKey('clubs.id'), nullable=False)

    # Credenziali
    email = db.Column(db.String(120), nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)

    # Profilo
    nome = db.Column(db.String(100), nullable=False)
    cognome = db.Column(db.String(100), nullable=False)
    avatar_url = db.Column(db.String(500))

    # Ruolo e permessi
    ruolo = db.Column(db.String(50), default='amministratore')  # amministratore, manager, operatore, ecc.
    is_active = db.Column(db.Boolean, default=True)

    # Metadata
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    last_login = db.Column(db.DateTime)

    # Relazione
    club = db.relationship('Club', backref=db.backref('users', lazy=True, cascade='all, delete-orphan'))

    # Unique constraint: email unica per club
    __table_args__ = (
        db.UniqueConstraint('club_id', 'email', name='uq_club_user_email'),
    )

    def set_password(self, password):
        self.password_hash = generate_password_hash(password, method='pbkdf2:sha256')

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

    @property
    def full_name(self):
        return f"{self.nome} {self.cognome}"

    def to_dict(self):
        return {
            'id': self.id,
            'club_id': self.club_id,
            'email': self.email,
            'nome': self.nome,
            'cognome': self.cognome,
            'full_name': self.full_name,
            'avatar_url': self.avatar_url,
            'ruolo': self.ruolo,
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'last_login': self.last_login.isoformat() if self.last_login else None
        }


# ==================== SPONSOR ACCOUNT SYSTEM ====================
# SponsorAccount: Account globale dello sponsor (credenziali, dati aziendali)
# Sponsor: Relazione tra SponsorAccount e Club (membership)
# SponsorInvitation: Sistema di inviti per i club

class SponsorAccount(db.Model):
    """Account globale dello sponsor - può essere collegato a più club"""
    __tablename__ = 'sponsor_accounts'

    id = db.Column(db.Integer, primary_key=True)

    # Credenziali (gestite dallo sponsor, non dal club)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    email_verificata = db.Column(db.Boolean, default=False)

    # Dati aziendali globali
    ragione_sociale = db.Column(db.String(200), nullable=False)
    partita_iva = db.Column(db.String(50))
    codice_fiscale = db.Column(db.String(50))
    settore_merceologico = db.Column(db.String(200))
    logo_url = db.Column(db.String(500))

    # Contatti aziendali
    indirizzo_sede = db.Column(db.String(300))
    telefono = db.Column(db.String(20))
    sito_web = db.Column(db.String(200))

    # Social Media
    facebook = db.Column(db.String(255))
    instagram = db.Column(db.String(255))
    tiktok = db.Column(db.String(255))
    linkedin = db.Column(db.String(255))
    twitter = db.Column(db.String(255))

    # Account status
    account_attivo = db.Column(db.Boolean, default=True)
    ultimo_accesso = db.Column(db.DateTime)

    # Metadata
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relazioni
    club_memberships = db.relationship('Sponsor', backref='sponsor_account', lazy=True)

    def set_password(self, password):
        self.password_hash = generate_password_hash(password, method='pbkdf2:sha256')

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

    def get_active_clubs(self):
        """Ritorna tutti i club attivi dove lo sponsor è membro"""
        return [m for m in self.club_memberships if m.membership_status == 'active']


class SponsorInvitation(db.Model):
    """Invito da un club per uno sponsor a unirsi all'ecosistema"""
    __tablename__ = 'sponsor_invitations'

    id = db.Column(db.Integer, primary_key=True)
    club_id = db.Column(db.Integer, db.ForeignKey('clubs.id'), nullable=False)

    # Token univoco per il link di invito
    token = db.Column(db.String(100), unique=True, nullable=False)

    # Email suggerita dal club (opzionale - lo sponsor può cambiarla)
    email_suggerita = db.Column(db.String(120))

    # Dati pre-compilati dal club
    ragione_sociale_suggerita = db.Column(db.String(200))
    settore_suggerito = db.Column(db.String(200))
    note_club = db.Column(db.Text)  # Note interne del club

    # Status dell'invito
    status = db.Column(db.String(50), default='pending')  # pending, accepted, expired, cancelled

    # Scadenza
    expires_at = db.Column(db.DateTime, nullable=False)

    # Quando accettato
    accepted_at = db.Column(db.DateTime)
    accepted_by_account_id = db.Column(db.Integer, db.ForeignKey('sponsor_accounts.id'), nullable=True)
    sponsor_membership_id = db.Column(db.Integer, db.ForeignKey('sponsors.id'), nullable=True)

    # Metadata
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Relazioni
    club = db.relationship('Club', backref='sponsor_invitations')
    accepted_by_account = db.relationship('SponsorAccount', backref='accepted_invitations')

    def is_expired(self):
        return datetime.utcnow() > self.expires_at

    def is_valid(self):
        return self.status == 'pending' and not self.is_expired()


class Sponsor(db.Model):
    """Membership: Relazione tra SponsorAccount e Club"""
    __tablename__ = 'sponsors'

    id = db.Column(db.Integer, primary_key=True)
    club_id = db.Column(db.Integer, db.ForeignKey('clubs.id'), nullable=False)

    # Link all'account globale (nullable per backward compatibility)
    sponsor_account_id = db.Column(db.Integer, db.ForeignKey('sponsor_accounts.id'), nullable=True)

    # Status della membership
    membership_status = db.Column(db.String(50), default='pending')  # pending, active, inactive, suspended

    # Dati aziendali
    ragione_sociale = db.Column(db.String(200), nullable=False)
    partita_iva = db.Column(db.String(50))  # Supports international VAT numbers
    codice_fiscale = db.Column(db.String(50))  # Supports international Tax IDs
    settore_merceologico = db.Column(db.String(200))
    logo_url = db.Column(db.String(500))

    # Contatti
    indirizzo_sede = db.Column(db.String(300))
    email = db.Column(db.String(120), nullable=True)  # Nullable - sponsor imposta email via invito
    telefono = db.Column(db.String(20))
    sito_web = db.Column(db.String(200))

    # Social Media
    facebook = db.Column(db.String(255))
    instagram = db.Column(db.String(255))
    tiktok = db.Column(db.String(255))
    linkedin = db.Column(db.String(255))
    twitter = db.Column(db.String(255))

    # Referente
    referente_nome = db.Column(db.String(100))
    referente_cognome = db.Column(db.String(100))
    referente_ruolo = db.Column(db.String(100))
    referente_contatto = db.Column(db.String(100))

    # Autenticazione LEGACY (per backward compatibility - nuovi sponsor usano SponsorAccount)
    password_hash = db.Column(db.String(255), nullable=True)  # Nullable per nuovi sponsor
    account_attivo = db.Column(db.Boolean, default=True)

    # Dati membership (specifici per la relazione club-sponsor)
    data_adesione = db.Column(db.DateTime)  # Quando lo sponsor ha accettato l'invito
    ruolo_sponsorship = db.Column(db.String(100))  # Main Sponsor, Premium Partner, etc.
    note_interne_club = db.Column(db.Text)  # Note visibili solo al club

    # Metadata
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Origine da Lead (se convertito)
    from_lead_id = db.Column(db.Integer, db.ForeignKey('leads.id'), nullable=True)
    data_conversione_lead = db.Column(db.DateTime, nullable=True)

    # Collegamento all'invito originale
    from_invitation_id = db.Column(db.Integer, db.ForeignKey('sponsor_invitations.id'), nullable=True)

    # Relazioni
    contracts = db.relationship('HeadOfTerms', backref='sponsor', lazy=True, cascade='all, delete-orphan')
    documents = db.relationship('Document', backref='sponsor', lazy=True, cascade='all, delete-orphan')
    media = db.relationship('Media', backref='sponsor', lazy=True, cascade='all, delete-orphan')
    activities = db.relationship('SponsorActivity', backref='sponsor', lazy=True, cascade='all, delete-orphan')
    contacts = db.relationship('ContactPerson', backref='sponsor_rel', lazy=True, cascade='all, delete-orphan', foreign_keys='ContactPerson.sponsor_id')
    notes = db.relationship('Note', backref='sponsor_rel', lazy=True, cascade='all, delete-orphan', foreign_keys='Note.sponsor_id')
    origin_lead = db.relationship('Lead', foreign_keys=[from_lead_id], backref='converted_to_sponsor')
    origin_invitation = db.relationship('SponsorInvitation', foreign_keys=[from_invitation_id], backref='created_membership')

    # LEGACY methods (per backward compatibility)
    def set_password(self, password):
        """LEGACY: Usato solo per sponsor vecchi senza SponsorAccount"""
        self.password_hash = generate_password_hash(password, method='pbkdf2:sha256')

    def check_password(self, password):
        """LEGACY: Usato solo per sponsor vecchi senza SponsorAccount"""
        if not self.password_hash:
            return False
        return check_password_hash(self.password_hash, password)

    def is_legacy_sponsor(self):
        """Ritorna True se lo sponsor usa il vecchio sistema (no SponsorAccount)"""
        return self.sponsor_account_id is None

    def get_display_name(self):
        """Ritorna il nome da visualizzare (da account globale o locale)"""
        if self.sponsor_account:
            return self.sponsor_account.ragione_sociale
        return self.ragione_sociale

    def get_email(self):
        """Ritorna l'email (da account globale o locale)"""
        if self.sponsor_account:
            return self.sponsor_account.email
        return self.email

    def get_logo(self):
        """Ritorna il logo (da account globale o locale)"""
        if self.sponsor_account and self.sponsor_account.logo_url:
            return self.sponsor_account.logo_url
        return self.logo_url


class SponsorActivity(db.Model):
    """Log delle attività/interazioni con lo sponsor"""
    __tablename__ = 'sponsor_activities'

    id = db.Column(db.Integer, primary_key=True)
    sponsor_id = db.Column(db.Integer, db.ForeignKey('sponsors.id'), nullable=False)
    club_id = db.Column(db.Integer, db.ForeignKey('clubs.id'), nullable=False)

    # Tipo di attività
    tipo = db.Column(db.String(50), nullable=False)  # chiamata, meeting, email, nota, altro

    # Dettagli
    titolo = db.Column(db.String(200), nullable=False)
    descrizione = db.Column(db.Text)
    data_attivita = db.Column(db.DateTime, nullable=False)

    # Contatto coinvolto (opzionale)
    contatto_nome = db.Column(db.String(100))

    # Esito/Risultato (opzionale)
    esito = db.Column(db.String(100))  # positivo, negativo, neutro, da_seguire

    # Promemoria follow-up (opzionale)
    data_followup = db.Column(db.DateTime)
    followup_completato = db.Column(db.Boolean, default=False)

    # Chi ha creato l'attività
    creato_da = db.Column(db.String(100))

    # Metadata
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class Lead(db.Model):
    """Lead/Prospect - Potenziali sponsor nel funnel di vendita"""
    __tablename__ = 'leads'

    id = db.Column(db.Integer, primary_key=True)
    club_id = db.Column(db.Integer, db.ForeignKey('clubs.id'), nullable=False)

    # Dati aziendali
    ragione_sociale = db.Column(db.String(200), nullable=False)
    partita_iva = db.Column(db.String(50))  # Supports international VAT numbers
    codice_fiscale = db.Column(db.String(50))  # Supports international Tax IDs
    settore_merceologico = db.Column(db.String(200))
    logo_url = db.Column(db.String(500))

    # Contatti
    indirizzo_sede = db.Column(db.String(300))
    email = db.Column(db.String(120))
    telefono = db.Column(db.String(20))
    sito_web = db.Column(db.String(200))

    # Social Media
    facebook = db.Column(db.String(255))
    instagram = db.Column(db.String(255))
    tiktok = db.Column(db.String(255))
    linkedin = db.Column(db.String(255))
    twitter = db.Column(db.String(255))

    # Referente
    referente_nome = db.Column(db.String(100))
    referente_cognome = db.Column(db.String(100))
    referente_ruolo = db.Column(db.String(100))
    referente_contatto = db.Column(db.String(100))

    # Pipeline Status
    # Stati: nuovo, contattato, in_trattativa, proposta_inviata, negoziazione, vinto, perso
    status = db.Column(db.String(50), default='nuovo', nullable=False)

    # Valore potenziale stimato
    valore_stimato = db.Column(db.Float, default=0)

    # Probabilità di chiusura (0-100)
    probabilita_chiusura = db.Column(db.Integer, default=0)

    # Fonte del lead (come ci hanno conosciuto)
    fonte = db.Column(db.String(100))  # referral, evento, social, cold_call, website, altro

    # Note interne
    note = db.Column(db.Text)

    # Motivo perdita (se status = perso)
    motivo_perdita = db.Column(db.String(200))

    # Data prossimo contatto
    data_prossimo_contatto = db.Column(db.DateTime)

    # Priorità (1=bassa, 2=media, 3=alta)
    priorita = db.Column(db.Integer, default=2)

    # Conversione a Sponsor
    convertito = db.Column(db.Boolean, default=False)
    sponsor_id = db.Column(db.Integer, db.ForeignKey('sponsors.id'), nullable=True)
    data_conversione = db.Column(db.DateTime, nullable=True)

    # Metadata
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relazioni
    club = db.relationship('Club', backref=db.backref('leads', lazy=True, cascade='all, delete-orphan'))
    sponsor = db.relationship('Sponsor', backref=db.backref('lead_history', uselist=False), foreign_keys=[sponsor_id])
    activities = db.relationship('LeadActivity', backref='lead', lazy=True, cascade='all, delete-orphan')
    contacts = db.relationship('ContactPerson', backref='lead', lazy=True, cascade='all, delete-orphan', foreign_keys='ContactPerson.lead_id')
    notes = db.relationship('Note', backref='lead', lazy=True, cascade='all, delete-orphan', foreign_keys='Note.lead_id')
    tags = db.relationship('Tag', secondary='lead_tags', back_populates='leads')
    stage_history = db.relationship('LeadStageHistory', backref='lead', lazy=True, cascade='all, delete-orphan')
    products = db.relationship('LeadProduct', backref='lead', lazy=True, cascade='all, delete-orphan')
    documents = db.relationship('LeadDocument', backref='lead', lazy=True, cascade='all, delete-orphan')
    asset_interests = db.relationship('InventoryAsset', secondary='lead_asset_interests', backref='interested_leads')


# Tabella associativa per gli asset a cui il lead è interessato
lead_asset_interests = db.Table('lead_asset_interests',
    db.Column('lead_id', db.Integer, db.ForeignKey('leads.id'), primary_key=True),
    db.Column('asset_id', db.Integer, db.ForeignKey('inventory_assets.id'), primary_key=True),
    db.Column('created_at', db.DateTime, default=datetime.utcnow)
)


class LeadActivity(db.Model):
    """Log delle attività/interazioni con il lead"""
    __tablename__ = 'lead_activities'

    id = db.Column(db.Integer, primary_key=True)
    lead_id = db.Column(db.Integer, db.ForeignKey('leads.id'), nullable=False)
    club_id = db.Column(db.Integer, db.ForeignKey('clubs.id'), nullable=False)

    # Tipo di attività
    tipo = db.Column(db.String(50), nullable=False)  # chiamata, meeting, email, nota, proposta, altro

    # Dettagli
    titolo = db.Column(db.String(200), nullable=False)
    descrizione = db.Column(db.Text)
    data_attivita = db.Column(db.DateTime, nullable=False)

    # Contatto coinvolto (opzionale)
    contatto_nome = db.Column(db.String(100))

    # Esito/Risultato (opzionale)
    esito = db.Column(db.String(100))  # positivo, negativo, neutro, da_seguire

    # Cambio di status (se l'attività ha cambiato lo status del lead)
    nuovo_status = db.Column(db.String(50))

    # Promemoria follow-up (opzionale)
    data_followup = db.Column(db.DateTime)
    followup_completato = db.Column(db.Boolean, default=False)

    # Chi ha creato l'attività
    creato_da = db.Column(db.String(100))

    # Metadata
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class LeadStageHistory(db.Model):
    """Storico passaggi di fase del lead"""
    __tablename__ = 'lead_stage_history'

    id = db.Column(db.Integer, primary_key=True)
    lead_id = db.Column(db.Integer, db.ForeignKey('leads.id'), nullable=False)
    club_id = db.Column(db.Integer, db.ForeignKey('clubs.id'), nullable=False)
    from_status = db.Column(db.String(50), nullable=True)   # null per creazione
    to_status = db.Column(db.String(50), nullable=False)
    valore_al_momento = db.Column(db.Float, default=0)
    probabilita_al_momento = db.Column(db.Integer, default=0)
    changed_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)


class LeadProduct(db.Model):
    """Prodotto/pacchetto associato al deal di un lead"""
    __tablename__ = 'lead_products'

    id = db.Column(db.Integer, primary_key=True)
    lead_id = db.Column(db.Integer, db.ForeignKey('leads.id'), nullable=False)
    club_id = db.Column(db.Integer, db.ForeignKey('clubs.id'), nullable=False)

    # Collegamento a inventario (opzionale - può essere un prodotto custom)
    asset_id = db.Column(db.Integer, db.ForeignKey('inventory_assets.id'), nullable=True)
    right_id = db.Column(db.Integer, db.ForeignKey('rights.id'), nullable=True)

    # Dettagli prodotto
    tipo = db.Column(db.String(20), nullable=False, default='custom')  # asset, right, custom
    nome = db.Column(db.String(200), nullable=False)
    descrizione = db.Column(db.Text)

    # Pricing
    quantita = db.Column(db.Integer, default=1)
    prezzo_unitario = db.Column(db.Float, default=0)
    sconto_percentuale = db.Column(db.Float, default=0)
    prezzo_totale = db.Column(db.Float, default=0)

    note = db.Column(db.Text)

    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class LeadDocument(db.Model):
    """Documento/allegato associato a un lead"""
    __tablename__ = 'lead_documents'

    id = db.Column(db.Integer, primary_key=True)
    lead_id = db.Column(db.Integer, db.ForeignKey('leads.id'), nullable=False)
    club_id = db.Column(db.Integer, db.ForeignKey('clubs.id'), nullable=False)

    nome = db.Column(db.String(200), nullable=False)
    categoria = db.Column(db.String(50), nullable=False, default='altro')
    # categorie: proposta, presentazione, brochure, contratto_draft, report, corrispondenza, altro
    file_url = db.Column(db.String(500), nullable=False)
    file_size = db.Column(db.Integer)          # bytes
    file_type = db.Column(db.String(50))       # pdf, docx, xlsx, pptx, etc.
    descrizione = db.Column(db.Text)

    created_at = db.Column(db.DateTime, default=datetime.utcnow)


class LeadScoreConfig(db.Model):
    """Configurazione pesi algoritmo Lead Score per club"""
    __tablename__ = 'lead_score_configs'

    id = db.Column(db.Integer, primary_key=True)
    club_id = db.Column(db.Integer, db.ForeignKey('clubs.id'), unique=True, nullable=False)

    # Pesi categorie (devono sommare a 100)
    weight_profile = db.Column(db.Integer, default=15)
    weight_deal = db.Column(db.Integer, default=25)
    weight_engagement = db.Column(db.Integer, default=25)
    weight_pipeline = db.Column(db.Integer, default=25)
    weight_contacts = db.Column(db.Integer, default=10)

    # Soglie temperatura
    threshold_cold = db.Column(db.Integer, default=33)
    threshold_warm = db.Column(db.Integer, default=66)

    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relazione
    club = db.relationship('Club', backref=db.backref('lead_score_config', uselist=False))


class ContactPerson(db.Model):
    """Persona di contatto per Lead o Sponsor"""
    __tablename__ = 'contact_persons'

    id = db.Column(db.Integer, primary_key=True)
    club_id = db.Column(db.Integer, db.ForeignKey('clubs.id'), nullable=False)
    lead_id = db.Column(db.Integer, db.ForeignKey('leads.id'), nullable=True)
    sponsor_id = db.Column(db.Integer, db.ForeignKey('sponsors.id'), nullable=True)

    nome = db.Column(db.String(100), nullable=False)
    cognome = db.Column(db.String(100), nullable=False)
    ruolo = db.Column(db.String(150))           # ruolo aziendale libero
    email = db.Column(db.String(120))
    telefono = db.Column(db.String(30))
    ruolo_decisionale = db.Column(db.String(50))  # decisore|influencer|utente|campione|bloccante
    linkedin = db.Column(db.String(255))
    note = db.Column(db.Text)
    is_referente_principale = db.Column(db.Boolean, default=False)

    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class Note(db.Model):
    """Nota con timestamp per Lead o Sponsor"""
    __tablename__ = 'crm_notes'

    id = db.Column(db.Integer, primary_key=True)
    club_id = db.Column(db.Integer, db.ForeignKey('clubs.id'), nullable=False)
    lead_id = db.Column(db.Integer, db.ForeignKey('leads.id'), nullable=True)
    sponsor_id = db.Column(db.Integer, db.ForeignKey('sponsors.id'), nullable=True)

    contenuto = db.Column(db.Text, nullable=False)
    tipo = db.Column(db.String(50), default='generale')  # generale|strategia|feedback|follow_up|interno

    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


lead_tags = db.Table('lead_tags',
    db.Column('lead_id', db.Integer, db.ForeignKey('leads.id'), primary_key=True),
    db.Column('tag_id', db.Integer, db.ForeignKey('tags.id'), primary_key=True)
)


class Tag(db.Model):
    """Tag libero per segmentare i lead"""
    __tablename__ = 'tags'

    id = db.Column(db.Integer, primary_key=True)
    club_id = db.Column(db.Integer, db.ForeignKey('clubs.id'), nullable=False)
    nome = db.Column(db.String(100), nullable=False)
    colore = db.Column(db.String(7), default='#6366F1')  # hex color

    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    leads = db.relationship('Lead', secondary=lead_tags, back_populates='tags')


class Pagamento(db.Model):
    __tablename__ = 'pagamenti'

    id = db.Column(db.Integer, primary_key=True)
    club_id = db.Column(db.Integer, db.ForeignKey('clubs.id'), nullable=False)

    importo = db.Column(db.Float, nullable=False)
    data_pagamento = db.Column(db.DateTime, nullable=False)
    descrizione = db.Column(db.Text)
    metodo_pagamento = db.Column(db.String(100))  # bonifico, carta, contanti, ecc.

    created_at = db.Column(db.DateTime, default=datetime.utcnow)


class Fattura(db.Model):
    __tablename__ = 'fatture'

    id = db.Column(db.Integer, primary_key=True)
    club_id = db.Column(db.Integer, db.ForeignKey('clubs.id'), nullable=False)

    numero_fattura = db.Column(db.String(50), nullable=False)
    data_fattura = db.Column(db.DateTime, nullable=False)
    importo = db.Column(db.Float, nullable=False)
    file_url = db.Column(db.String(500))  # percorso file PDF fattura
    note = db.Column(db.Text)

    created_at = db.Column(db.DateTime, default=datetime.utcnow)


class HeadOfTerms(db.Model):
    __tablename__ = 'head_of_terms'

    id = db.Column(db.Integer, primary_key=True)
    club_id = db.Column(db.Integer, db.ForeignKey('clubs.id'), nullable=False)
    sponsor_id = db.Column(db.Integer, db.ForeignKey('sponsors.id'), nullable=False)

    # Dati contratto
    nome_contratto = db.Column(db.String(200), nullable=False)
    compenso = db.Column(db.Float, nullable=False)
    data_inizio = db.Column(db.DateTime, nullable=False)
    data_fine = db.Column(db.DateTime, nullable=False)
    descrizione = db.Column(db.Text)

    # File allegato (contratto firmato PDF)
    file_contratto_url = db.Column(db.String(500))

    # Status
    status = db.Column(db.String(50), default='bozza')  # bozza, attivo, scaduto

    # Metadata
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relazioni
    assets = db.relationship('Asset', backref='contract', lazy=True, cascade='all, delete-orphan')
    checklists = db.relationship('Checklist', backref='contract', lazy=True, cascade='all, delete-orphan')


class Asset(db.Model):
    __tablename__ = 'assets'

    id = db.Column(db.Integer, primary_key=True)
    head_of_terms_id = db.Column(db.Integer, db.ForeignKey('head_of_terms.id'), nullable=False)

    # Dati asset
    categoria = db.Column(db.String(100), nullable=False)  # LED, Social Media, Hospitality, Biglietti, Branding, etc.
    nome = db.Column(db.String(200), nullable=False)
    descrizione = db.Column(db.Text)
    quantita_totale = db.Column(db.Integer, nullable=True)  # Opzionale
    quantita_utilizzata = db.Column(db.Integer, default=0)
    valore = db.Column(db.Float)

    # Status
    status = db.Column(db.String(50), default='da_consegnare')  # da_consegnare, in_corso, completato

    # Metadata
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class Checklist(db.Model):
    __tablename__ = 'checklists'

    id = db.Column(db.Integer, primary_key=True)
    head_of_terms_id = db.Column(db.Integer, db.ForeignKey('head_of_terms.id'), nullable=False)
    asset_id = db.Column(db.Integer, db.ForeignKey('assets.id'), nullable=True)  # opzionale, se collegato a un asset

    # Dati task
    titolo = db.Column(db.String(200), nullable=False)
    descrizione = db.Column(db.Text)
    priorita = db.Column(db.String(50), default='media')  # bassa, media, alta
    assegnato_a = db.Column(db.String(50), nullable=False)  # club, sponsor
    scadenza = db.Column(db.Date, nullable=True)  # data di scadenza opzionale

    # Completamento
    completato = db.Column(db.Boolean, default=False)
    completato_da = db.Column(db.String(100))  # username/email di chi ha completato
    completato_il = db.Column(db.DateTime)
    note = db.Column(db.Text)

    # Creazione
    creato_da = db.Column(db.String(50))  # club, sponsor
    creato_da_user = db.Column(db.String(100))  # email/username di chi ha creato

    # Metadata
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class Document(db.Model):
    __tablename__ = 'documents'

    id = db.Column(db.Integer, primary_key=True)
    club_id = db.Column(db.Integer, db.ForeignKey('clubs.id'), nullable=False)
    sponsor_id = db.Column(db.Integer, db.ForeignKey('sponsors.id'), nullable=False)

    # Dati documento
    categoria = db.Column(db.String(100), nullable=False)  # brand_guidelines, led_graphics, contratto, altro
    nome = db.Column(db.String(200), nullable=False)
    file_url = db.Column(db.String(500), nullable=False)
    file_size = db.Column(db.Integer)  # in bytes
    file_type = db.Column(db.String(50))  # pdf, docx, etc.
    descrizione = db.Column(db.Text)

    # Caricamento
    caricato_da = db.Column(db.String(50), nullable=False)  # club, sponsor
    caricato_da_user = db.Column(db.String(100))  # email/username

    # Metadata
    created_at = db.Column(db.DateTime, default=datetime.utcnow)


class SponsorDriveFile(db.Model):
    """File nel drive condiviso tra club e sponsor - può essere collegato a contratti, attivazioni, asset"""
    __tablename__ = 'sponsor_drive_files'

    id = db.Column(db.Integer, primary_key=True)
    club_id = db.Column(db.Integer, db.ForeignKey('clubs.id'), nullable=False)
    sponsor_id = db.Column(db.Integer, db.ForeignKey('sponsors.id'), nullable=False)

    # Dati file
    nome = db.Column(db.String(300), nullable=False)
    file_url = db.Column(db.String(500), nullable=False)
    file_size = db.Column(db.Integer)  # bytes
    file_type = db.Column(db.String(100))  # mime type: application/pdf, image/png, etc.
    estensione = db.Column(db.String(20))  # pdf, docx, png, jpg, etc.
    descrizione = db.Column(db.Text)

    # Categoria/tipo file
    categoria = db.Column(db.String(100), default='altro')
    # Categorie: contratto, fattura, brand_guidelines, materiale_grafico, foto_attivazione,
    # report, presentazione, corrispondenza, altro

    # Cartella virtuale (per organizzazione gerarchica)
    cartella = db.Column(db.String(500), default='/')  # Es: "/Contratti/2024", "/Attivazioni/Serie A"

    # Tags per ricerca (JSON array)
    tags = db.Column(db.Text)  # JSON array: ["importante", "da_approvare", "finale"]

    # Collegamenti opzionali a entità
    contract_id = db.Column(db.Integer, db.ForeignKey('head_of_terms.id'), nullable=True)
    activation_id = db.Column(db.Integer, db.ForeignKey('activations.id'), nullable=True)
    event_activation_id = db.Column(db.Integer, db.ForeignKey('event_asset_activations.id'), nullable=True)
    inventory_asset_id = db.Column(db.Integer, db.ForeignKey('inventory_assets.id'), nullable=True)

    # Chi ha caricato
    caricato_da = db.Column(db.String(50), nullable=False)  # 'club' o 'sponsor'
    caricato_da_nome = db.Column(db.String(200))

    # Visibilità
    visibile_sponsor = db.Column(db.Boolean, default=True)  # Sponsor può vedere questo file
    visibile_club = db.Column(db.Boolean, default=True)  # Club può vedere questo file

    # Stato
    stato = db.Column(db.String(50), default='attivo')  # attivo, archiviato, cestinato

    # Preview (per immagini)
    thumbnail_url = db.Column(db.String(500))

    # Metadata
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relazioni
    club = db.relationship('Club', backref='sponsor_drive_files')
    sponsor = db.relationship('Sponsor', backref='drive_files')
    contract = db.relationship('HeadOfTerms', backref='drive_files')
    activation = db.relationship('Activation', backref='drive_files')
    event_activation = db.relationship('EventAssetActivation', backref='drive_files')
    inventory_asset = db.relationship('InventoryAsset', backref='drive_files')


class Media(db.Model):
    __tablename__ = 'media'

    id = db.Column(db.Integer, primary_key=True)
    club_id = db.Column(db.Integer, db.ForeignKey('clubs.id'), nullable=False)
    sponsor_id = db.Column(db.Integer, db.ForeignKey('sponsors.id'), nullable=False)

    # Dati media
    tipo = db.Column(db.String(50), nullable=False)  # immagine, video, pdf
    nome = db.Column(db.String(200), nullable=False)
    file_url = db.Column(db.String(500), nullable=False)
    thumbnail_url = db.Column(db.String(500))
    file_size = db.Column(db.Integer)
    tags = db.Column(db.String(500))  # tags separati da virgola
    descrizione = db.Column(db.Text)

    # Caricamento
    caricato_da = db.Column(db.String(50), nullable=False)  # club, sponsor
    caricato_da_user = db.Column(db.String(100))

    # Metadata
    created_at = db.Column(db.DateTime, default=datetime.utcnow)


class Message(db.Model):
    __tablename__ = 'messages'

    id = db.Column(db.Integer, primary_key=True)

    # Relazione Club-Sponsor
    club_id = db.Column(db.Integer, db.ForeignKey('clubs.id'), nullable=False)
    sponsor_id = db.Column(db.Integer, db.ForeignKey('sponsors.id'), nullable=False)

    # Mittente
    sender_type = db.Column(db.String(20), nullable=False)  # 'club' o 'sponsor'
    sender_id = db.Column(db.Integer, nullable=False)
    sender_name = db.Column(db.String(200), nullable=False)  # Nome club o ragione sociale sponsor

    # Contesto (opzionale - per chat legate a contratti specifici o marketplace)
    contract_id = db.Column(db.Integer, db.ForeignKey('head_of_terms.id'), nullable=True)
    context_type = db.Column(db.String(50))  # 'contract', 'marketplace_opportunity', etc.
    context_id = db.Column(db.Integer)  # ID dell'oggetto di contesto

    # Contenuto messaggio
    testo = db.Column(db.Text, nullable=False)

    # Metadata
    letto = db.Column(db.Boolean, default=False)
    data_invio = db.Column(db.DateTime, default=datetime.utcnow)
    data_lettura = db.Column(db.DateTime, nullable=True)

    # Allegati
    attachment_url = db.Column(db.String(500))
    attachment_type = db.Column(db.String(50))  # image, video, document
    attachment_name = db.Column(db.String(200))

    # Metadata
    created_at = db.Column(db.DateTime, default=datetime.utcnow)


class Match(db.Model):
    __tablename__ = 'matches'

    id = db.Column(db.Integer, primary_key=True)
    club_id = db.Column(db.Integer, db.ForeignKey('clubs.id'), nullable=False)

    # Info partita
    data_ora = db.Column(db.DateTime, nullable=False)
    avversario = db.Column(db.String(200), nullable=False)
    competizione = db.Column(db.String(100))  # Campionato, Coppa, etc.
    luogo = db.Column(db.String(20), default='casa')  # casa, trasferta
    stadio = db.Column(db.String(200))

    # Risultato (opzionale, dopo la partita)
    risultato_casa = db.Column(db.Integer)
    risultato_trasferta = db.Column(db.Integer)
    status = db.Column(db.String(50), default='programmata')  # programmata, in_corso, conclusa, annullata

    # Metadata
    note = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relazioni
    activations = db.relationship('Activation', backref='match', lazy=True, cascade='all, delete-orphan')
    box_invites = db.relationship('BoxInvite', backref='match', lazy=True, cascade='all, delete-orphan')


class Activation(db.Model):
    __tablename__ = 'activations'

    id = db.Column(db.Integer, primary_key=True)
    match_id = db.Column(db.Integer, db.ForeignKey('matches.id'), nullable=False)
    contract_id = db.Column(db.Integer, db.ForeignKey('head_of_terms.id'), nullable=False)

    # Legacy - asset custom (deprecato, mantenuto per retrocompatibilità)
    asset_id = db.Column(db.Integer, db.ForeignKey('assets.id'), nullable=True)

    # NUOVO: Link a inventario tramite allocazione
    allocation_id = db.Column(db.Integer, db.ForeignKey('asset_allocations.id'), nullable=True)
    inventory_asset_id = db.Column(db.Integer, db.ForeignKey('inventory_assets.id'), nullable=True)

    # Dettagli attivazione
    tipo = db.Column(db.String(100), nullable=False)  # LED, Social, Hospitality, etc.
    descrizione = db.Column(db.Text)
    quantita_utilizzata = db.Column(db.Integer, nullable=True)  # Quantità asset utilizzata in questa attivazione

    # Planning
    stato = db.Column(db.String(50), default='pianificata')  # pianificata, confermata, eseguita, annullata
    responsabile = db.Column(db.String(200))

    # Esecuzione
    eseguita = db.Column(db.Boolean, default=False)
    eseguita_da = db.Column(db.String(100))
    eseguita_il = db.Column(db.DateTime)
    note_esecuzione = db.Column(db.Text)

    # Files/Prove
    foto_attivazione = db.Column(db.String(500))  # URL foto della attivazione
    report_url = db.Column(db.String(500))

    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relazioni
    allocation = db.relationship('AssetAllocation', backref='activations')
    inventory_asset = db.relationship('InventoryAsset', backref='activations')


class Event(db.Model):
    __tablename__ = 'events'

    id = db.Column(db.Integer, primary_key=True)
    club_id = db.Column(db.Integer, db.ForeignKey('clubs.id'), nullable=False)
    sponsor_id = db.Column(db.Integer, db.ForeignKey('sponsors.id'), nullable=True)
    contract_id = db.Column(db.Integer, db.ForeignKey('head_of_terms.id'), nullable=True)

    # Info evento
    titolo = db.Column(db.String(200), nullable=False)
    tipo = db.Column(db.String(100))  # ufficio_stampa, presentazione_commerciale, evento_brand, conferenza_stampa, inaugurazione, altro
    data_ora_inizio = db.Column(db.DateTime, nullable=False)
    data_ora_fine = db.Column(db.DateTime)

    # Luogo
    luogo = db.Column(db.String(300))
    indirizzo = db.Column(db.String(500))
    online = db.Column(db.Boolean, default=False)
    link_meeting = db.Column(db.String(500))  # Zoom, Teams, etc.

    # Dettagli
    descrizione = db.Column(db.Text)
    agenda = db.Column(db.Text)

    # Visibilità e creatore
    visibile_a = db.Column(db.String(50), default='tutti')  # tutti, solo_sponsor, solo_club, privato
    creato_da_tipo = db.Column(db.String(20), nullable=False)  # club, sponsor
    creato_da_id = db.Column(db.Integer, nullable=False)
    creato_da_nome = db.Column(db.String(200))

    # Status
    status = db.Column(db.String(50), default='programmato')  # programmato, confermato, in_corso, concluso, annullato

    # Files (JSON arrays)
    materiali_url = db.Column(db.Text)  # JSON array di file URLs
    foto_evento = db.Column(db.Text)  # JSON array

    # Form di iscrizione personalizzato (JSON)
    # Schema: [{"type": "text", "label": "Nome Azienda", "required": true, "placeholder": "..."}]
    registration_form_schema = db.Column(db.Text)  # JSON array con definizione campi form
    richiede_iscrizione = db.Column(db.Boolean, default=False)  # Se true, sponsor devono iscriversi
    max_iscrizioni = db.Column(db.Integer)  # Limite partecipanti (opzionale)

    # Metadata
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relazioni
    participants = db.relationship('EventParticipant', backref='event', lazy=True, cascade='all, delete-orphan')
    invitations = db.relationship('EventInvitation', backref='event', lazy=True, cascade='all, delete-orphan')
    registrations = db.relationship('EventRegistrationForm', backref='event', lazy=True, cascade='all, delete-orphan')


class EventParticipant(db.Model):
    __tablename__ = 'event_participants'

    id = db.Column(db.Integer, primary_key=True)
    event_id = db.Column(db.Integer, db.ForeignKey('events.id'), nullable=False)

    # Partecipante
    user_type = db.Column(db.String(20))  # club, sponsor
    user_id = db.Column(db.Integer)
    nome = db.Column(db.String(200), nullable=False)
    email = db.Column(db.String(200), nullable=False)

    # Status
    invitato = db.Column(db.Boolean, default=True)
    confermato = db.Column(db.Boolean, default=False)
    presente = db.Column(db.Boolean, default=False)

    # Metadata
    ruolo = db.Column(db.String(100))  # organizzatore, relatore, partecipante
    note = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)


class EventInvitation(db.Model):
    """Inviti degli sponsor agli eventi"""
    __tablename__ = 'event_invitations'

    id = db.Column(db.Integer, primary_key=True)
    event_id = db.Column(db.Integer, db.ForeignKey('events.id'), nullable=False)
    sponsor_id = db.Column(db.Integer, db.ForeignKey('sponsors.id'), nullable=False)

    # Status invito
    invitato_il = db.Column(db.DateTime, default=datetime.utcnow)
    visualizzato = db.Column(db.Boolean, default=False)
    visualizzato_il = db.Column(db.DateTime)

    # Relazioni
    sponsor = db.relationship('Sponsor', backref='event_invitations')

    # Constraint unicità
    __table_args__ = (
        db.UniqueConstraint('event_id', 'sponsor_id', name='unique_event_sponsor_invitation'),
    )


class EventRegistrationForm(db.Model):
    """Iscrizioni sponsor agli eventi con form personalizzato"""
    __tablename__ = 'event_registration_forms'

    id = db.Column(db.Integer, primary_key=True)
    event_id = db.Column(db.Integer, db.ForeignKey('events.id'), nullable=False)
    sponsor_id = db.Column(db.Integer, db.ForeignKey('sponsors.id'), nullable=True)  # NULL per iscrizioni pubbliche

    # Dati iscrizione (JSON con valori campi form personalizzato)
    # Es: {"nome_referente": "Mario Rossi", "telefono": "+39...", "note": "..."}
    form_data = db.Column(db.Text, nullable=False)  # JSON object con risposte

    # Status
    status = db.Column(db.String(50), default='registrato')  # registrato, confermato, cancellato, presente
    confermato = db.Column(db.Boolean, default=False)
    presente = db.Column(db.Boolean, default=False)

    # Note aggiuntive
    note_club = db.Column(db.Text)  # Note del club sulla registrazione
    note_sponsor = db.Column(db.Text)  # Note dello sponsor

    # Metadata
    registrato_il = db.Column(db.DateTime, default=datetime.utcnow)
    confermato_il = db.Column(db.DateTime)
    cancellato_il = db.Column(db.DateTime)

    # Relazioni
    sponsor = db.relationship('Sponsor', backref='event_registrations')

    # Constraint unicità
    __table_args__ = (
        db.UniqueConstraint('event_id', 'sponsor_id', name='unique_event_sponsor_registration'),
    )


class EventAssetActivation(db.Model):
    """Attivazioni asset inventario per eventi - permette di allocare asset
    dall'inventario a eventi associati a sponsor e contratti"""
    __tablename__ = 'event_asset_activations'

    id = db.Column(db.Integer, primary_key=True)
    event_id = db.Column(db.Integer, db.ForeignKey('events.id'), nullable=False)
    contract_id = db.Column(db.Integer, db.ForeignKey('head_of_terms.id'), nullable=False)

    # Link a inventario tramite allocazione
    allocation_id = db.Column(db.Integer, db.ForeignKey('asset_allocations.id'), nullable=True)
    inventory_asset_id = db.Column(db.Integer, db.ForeignKey('inventory_assets.id'), nullable=True)

    # Dettagli attivazione
    tipo = db.Column(db.String(100), nullable=False)  # LED, Banner, Hospitality, etc.
    descrizione = db.Column(db.Text)
    quantita_utilizzata = db.Column(db.Integer, nullable=True)

    # Planning
    stato = db.Column(db.String(50), default='pianificata')  # pianificata, confermata, eseguita, annullata
    responsabile = db.Column(db.String(200))

    # Esecuzione
    eseguita = db.Column(db.Boolean, default=False)
    eseguita_da = db.Column(db.String(100))
    eseguita_il = db.Column(db.DateTime)
    note_esecuzione = db.Column(db.Text)

    # Files/Prove
    foto_attivazione = db.Column(db.String(500))
    report_url = db.Column(db.String(500))

    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relazioni
    event = db.relationship('Event', backref='asset_activations')
    contract = db.relationship('HeadOfTerms', backref='event_asset_activations')
    allocation = db.relationship('AssetAllocation', backref='event_activations')
    inventory_asset = db.relationship('InventoryAsset', backref='event_activations')

    # Constraint unicità - un asset può essere attivato una sola volta per evento
    __table_args__ = (
        db.UniqueConstraint('event_id', 'allocation_id', name='unique_event_allocation'),
    )


class BusinessBox(db.Model):
    __tablename__ = 'business_boxes'

    id = db.Column(db.Integer, primary_key=True)
    club_id = db.Column(db.Integer, db.ForeignKey('clubs.id'), nullable=False)
    contract_id = db.Column(db.Integer, db.ForeignKey('head_of_terms.id'), nullable=True)
    sponsor_id = db.Column(db.Integer, db.ForeignKey('sponsors.id'), nullable=True)

    # Info box
    nome = db.Column(db.String(200), nullable=False)  # es. "Skybox Premium", "Box VIP Area A"
    settore = db.Column(db.String(100))
    numero_posti = db.Column(db.Integer, nullable=False)

    # Servizi inclusi
    catering = db.Column(db.Boolean, default=False)
    parcheggio = db.Column(db.Boolean, default=False)
    meet_and_greet = db.Column(db.Boolean, default=False)
    merchandising = db.Column(db.Boolean, default=False)

    # Tipo
    tipo = db.Column(db.String(50), default='stagionale')  # stagionale, per_partita

    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Relazioni
    invites = db.relationship('BoxInvite', backref='business_box', lazy=True, cascade='all, delete-orphan')


class BoxInvite(db.Model):
    __tablename__ = 'box_invites'

    id = db.Column(db.Integer, primary_key=True)
    business_box_id = db.Column(db.Integer, db.ForeignKey('business_boxes.id'), nullable=False)
    match_id = db.Column(db.Integer, db.ForeignKey('matches.id'), nullable=False)
    sponsor_id = db.Column(db.Integer, db.ForeignKey('sponsors.id'), nullable=False)

    # Dati ospite
    nome = db.Column(db.String(200), nullable=False)
    cognome = db.Column(db.String(200), nullable=False)
    email = db.Column(db.String(200), nullable=False)
    telefono = db.Column(db.String(20))
    azienda = db.Column(db.String(200))
    ruolo = db.Column(db.String(200))

    # Ticketing
    codice_invito = db.Column(db.String(50), unique=True, nullable=False)  # UUID
    qr_code_url = db.Column(db.String(500))  # Path al QR code generato

    # Status
    status = db.Column(db.String(50), default='inviato')  # inviato, confermato, rifiutato, check_in, no_show
    inviato_il = db.Column(db.DateTime)
    confermato_il = db.Column(db.DateTime)
    check_in_il = db.Column(db.DateTime)

    # Note e preferenze
    note_ospite = db.Column(db.Text)  # Es. restrizioni alimentari
    note_sponsor = db.Column(db.Text)  # Note private sponsor
    vip = db.Column(db.Boolean, default=False)  # Flag ospite VIP

    # Servizi richiesti
    parcheggio_richiesto = db.Column(db.Boolean, default=False)
    badge_nome = db.Column(db.String(200))  # Nome da stampare su badge

    created_at = db.Column(db.DateTime, default=datetime.utcnow)


# ==================== SPONSOR NETWORK MODELS ====================

class SponsorProfile(db.Model):
    """Profilo pubblico sponsor visibile agli altri sponsor per networking e co-marketing"""
    __tablename__ = 'sponsor_profiles'

    id = db.Column(db.Integer, primary_key=True)
    sponsor_id = db.Column(db.Integer, db.ForeignKey('sponsors.id'), unique=True, nullable=False)

    # Informazioni pubbliche
    descrizione_pubblica = db.Column(db.Text)  # Descrizione azienda per altri sponsor
    dimensione_azienda = db.Column(db.String(50))  # PMI, Grande Impresa, Startup, Multinazionale
    target_audience = db.Column(db.String(200))  # B2B, B2C, B2B2C
    anno_fondazione = db.Column(db.Integer)

    # Interessi co-marketing (checkboxes)
    interesse_eventi_congiunti = db.Column(db.Boolean, default=False)
    interesse_campagne_social = db.Column(db.Boolean, default=False)
    interesse_promo_incrociate = db.Column(db.Boolean, default=False)
    interesse_merchandising = db.Column(db.Boolean, default=False)
    interesse_altro = db.Column(db.String(500))  # Testo libero per altri interessi

    # Visibilità e privacy
    visibile_rete_sponsor = db.Column(db.Boolean, default=True)  # Opt-in/out dalla directory
    permetti_messaggi = db.Column(db.Boolean, default=True)  # Permetti messaggi da altri sponsor

    # Media pubblici (URLs a immagini/video nel repository)
    media_pubblici = db.Column(db.JSON)  # Array di file URLs

    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relazione
    sponsor = db.relationship('Sponsor', backref='public_profile', uselist=False)


class SponsorMessage(db.Model):
    """Messaggi diretti tra sponsor per networking e discussioni partnership"""
    __tablename__ = 'sponsor_messages'

    id = db.Column(db.Integer, primary_key=True)
    sender_sponsor_id = db.Column(db.Integer, db.ForeignKey('sponsors.id'), nullable=False)
    receiver_sponsor_id = db.Column(db.Integer, db.ForeignKey('sponsors.id'), nullable=False)
    club_id = db.Column(db.Integer, db.ForeignKey('clubs.id'), nullable=False)  # Per tracking club

    testo = db.Column(db.Text, nullable=False)
    letto = db.Column(db.Boolean, default=False)
    data_lettura = db.Column(db.DateTime)

    # Collegamento a proposta partnership (opzionale)
    partnership_proposal_id = db.Column(db.Integer, db.ForeignKey('partnership_proposals.id'))

    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Relazioni
    sender = db.relationship('Sponsor', foreign_keys=[sender_sponsor_id], backref='sent_sponsor_messages')
    receiver = db.relationship('Sponsor', foreign_keys=[receiver_sponsor_id], backref='received_sponsor_messages')
    club = db.relationship('Club', backref='sponsor_network_messages')


class PartnershipProposal(db.Model):
    """Proposte di partnership strutturate tra sponsor"""
    __tablename__ = 'partnership_proposals'

    id = db.Column(db.Integer, primary_key=True)
    club_id = db.Column(db.Integer, db.ForeignKey('clubs.id'), nullable=False)

    # Sponsor coinvolti
    proposer_sponsor_id = db.Column(db.Integer, db.ForeignKey('sponsors.id'), nullable=False)
    target_sponsor_id = db.Column(db.Integer, db.ForeignKey('sponsors.id'), nullable=False)

    # Dettagli proposta
    tipo = db.Column(db.String(100), nullable=False)  # evento_congiunto, campagna_social, promo_incrociata, merchandising, altro
    titolo = db.Column(db.String(200), nullable=False)
    descrizione = db.Column(db.Text)
    budget_stimato = db.Column(db.Numeric(10, 2))
    data_inizio = db.Column(db.Date)
    data_fine = db.Column(db.Date)

    # Documenti allegati (opzionale)
    documento_url = db.Column(db.String(500))

    # Status workflow
    status = db.Column(db.String(50), default='pending')  # pending, accepted, rejected, withdrawn

    # Risposta del target sponsor
    risposta_note = db.Column(db.Text)  # Note nella risposta
    risposta_data = db.Column(db.DateTime)

    # Flag: club è stato notificato del contatto
    club_notificato_contatto = db.Column(db.Boolean, default=False)

    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relazioni
    club = db.relationship('Club', backref='partnership_proposals')
    proposer = db.relationship('Sponsor', foreign_keys=[proposer_sponsor_id], backref='sent_proposals')
    target = db.relationship('Sponsor', foreign_keys=[target_sponsor_id], backref='received_proposals')


class Partnership(db.Model):
    """Partnership attive confermate tra sponsor"""
    __tablename__ = 'partnerships'

    id = db.Column(db.Integer, primary_key=True)
    club_id = db.Column(db.Integer, db.ForeignKey('clubs.id'), nullable=False)

    # Sponsor coinvolti
    sponsor_1_id = db.Column(db.Integer, db.ForeignKey('sponsors.id'), nullable=False)
    sponsor_2_id = db.Column(db.Integer, db.ForeignKey('sponsors.id'), nullable=False)

    # Link a proposta (se creata dal sistema proposte)
    proposal_id = db.Column(db.Integer, db.ForeignKey('partnership_proposals.id'))

    # Dettagli partnership
    tipo = db.Column(db.String(100), nullable=False)
    titolo = db.Column(db.String(200), nullable=False)
    descrizione = db.Column(db.Text)

    data_inizio = db.Column(db.Date)
    data_fine = db.Column(db.Date)
    status = db.Column(db.String(50), default='attiva')  # attiva, completata, annullata

    # Visibilità
    visibile_pubblico = db.Column(db.Boolean, default=True)  # Visibile nelle schede sponsor pubbliche

    # Tracking club
    club_notificato = db.Column(db.Boolean, default=False)  # Club informato della partnership
    club_notificato_data = db.Column(db.DateTime)

    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relazioni
    club = db.relationship('Club', backref='partnerships')
    sponsor_1 = db.relationship('Sponsor', foreign_keys=[sponsor_1_id], backref='partnerships_as_sponsor_1')
    sponsor_2 = db.relationship('Sponsor', foreign_keys=[sponsor_2_id], backref='partnerships_as_sponsor_2')
    proposal = db.relationship('PartnershipProposal', backref='partnership', uselist=False)


# ==================== PRESS AREA MODELS ====================

class PressPublication(db.Model):
    """Pubblicazioni press area - post social stile Instagram da club e sponsor"""
    __tablename__ = 'press_publications'

    id = db.Column(db.Integer, primary_key=True)

    # Autore (può essere club O sponsor)
    author_type = db.Column(db.String(20), nullable=False)  # 'club' o 'sponsor'
    author_id = db.Column(db.Integer, nullable=False)  # ID del club o sponsor
    author_name = db.Column(db.String(200), nullable=False)  # Nome denormalizzato per performance

    # Deprecato ma mantenuto per backward compatibility
    club_id = db.Column(db.Integer, db.ForeignKey('clubs.id'), nullable=True)
    sponsor_id = db.Column(db.Integer, db.ForeignKey('sponsors.id'), nullable=True)

    # Contenuto
    tipo = db.Column(db.String(50), nullable=False)  # comunicato, tv, social, articolo, video, photo, evento
    titolo = db.Column(db.String(200), nullable=False)
    sottotitolo = db.Column(db.String(300))
    testo = db.Column(db.Text, nullable=False)

    # Metadata
    data_pubblicazione = db.Column(db.DateTime, nullable=False)
    fonte_testata = db.Column(db.String(200))  # "La Gazzetta", "Corriere", etc
    link_esterno = db.Column(db.String(500))
    categoria = db.Column(db.String(50))  # partita, evento, generale, partnership

    # Media
    media_urls = db.Column(db.JSON)  # Array di URL immagini/video
    documento_pdf_url = db.Column(db.String(500))

    # Social Features
    hashtags = db.Column(db.JSON)  # Array di hashtags es: ['sponsorizzazione', 'partnership']
    mentioned_user_ids = db.Column(db.JSON)  # Array di {type: 'club'/'sponsor', id: X, name: 'Nome'}

    # Visibilità NUOVA - Pitch Community
    visibility = db.Column(db.String(20), default='interna')  # 'interna' o 'community'
    # interna = solo club + suoi sponsor
    # community = TUTTI i club e sponsor della piattaforma Pitch Partner

    # Visibilità (deprecato per sponsor post - sempre visibile a tutti)
    visibile_tutti_sponsor = db.Column(db.Boolean, default=True)
    visibile_solo_attivi = db.Column(db.Boolean, default=False)
    sponsor_ids = db.Column(db.JSON)  # Array di sponsor_id specifici (se visibile_tutti = False)

    # Collegamenti
    contract_id = db.Column(db.Integer, db.ForeignKey('head_of_terms.id'))  # Opzionale
    tagged_sponsor_ids = db.Column(db.JSON)  # Array di sponsor menzionati (DEPRECATO - usare mentioned_user_ids)

    # Stats
    visualizzazioni_count = db.Column(db.Integer, default=0)
    likes_count = db.Column(db.Integer, default=0)  # Cache per performance

    # Creazione
    creato_da_user_id = db.Column(db.Integer)  # Deprecato - usare author_id
    creato_da_nome = db.Column(db.String(200))  # Deprecato - usare author_name
    pubblicato = db.Column(db.Boolean, default=True)  # false = bozza

    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relazioni
    club = db.relationship('Club', backref='press_publications', foreign_keys=[club_id])
    sponsor = db.relationship('Sponsor', backref='press_publications', foreign_keys=[sponsor_id])
    contract = db.relationship('HeadOfTerms', backref='press_publications')
    # Note: backref già definiti nelle altre classi (PressReaction, PressComment, PressView)


class PressReaction(db.Model):
    """Reazioni (like) alle pubblicazioni press area - da club e sponsor"""
    __tablename__ = 'press_reactions'

    id = db.Column(db.Integer, primary_key=True)
    publication_id = db.Column(db.Integer, db.ForeignKey('press_publications.id'), nullable=False)

    # Utente che ha messo like (club o sponsor)
    user_type = db.Column(db.String(20), nullable=False)  # 'club' o 'sponsor'
    user_id = db.Column(db.Integer, nullable=False)  # ID del club o sponsor
    user_name = db.Column(db.String(200))  # Nome denormalizzato

    # Deprecato ma mantenuto per backward compatibility
    sponsor_id = db.Column(db.Integer, db.ForeignKey('sponsors.id'), nullable=True)
    club_id = db.Column(db.Integer, db.ForeignKey('clubs.id'), nullable=True)

    tipo_reazione = db.Column(db.String(20), nullable=False, default='like')  # Solo 'like' per semplificare

    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Relazioni
    sponsor = db.relationship('Sponsor', backref='press_reactions', foreign_keys=[sponsor_id])
    club_rel = db.relationship('Club', backref='press_reactions', foreign_keys=[club_id])

    # Constraint: un utente può dare solo una reazione per pubblicazione
    __table_args__ = (
        db.UniqueConstraint('publication_id', 'user_type', 'user_id', name='unique_reaction_per_user'),
    )


class PressComment(db.Model):
    """Commenti sponsor/club alle pubblicazioni press area"""
    __tablename__ = 'press_comments'

    id = db.Column(db.Integer, primary_key=True)
    publication_id = db.Column(db.Integer, db.ForeignKey('press_publications.id'), nullable=False)

    # Autore (sponsor o club)
    user_type = db.Column(db.String(20), nullable=False)  # 'sponsor', 'club'
    user_id = db.Column(db.Integer, nullable=False)
    user_name = db.Column(db.String(200), nullable=False)

    # Contenuto
    testo = db.Column(db.Text, nullable=False)

    # Thread (per reply ai commenti)
    parent_comment_id = db.Column(db.Integer, db.ForeignKey('press_comments.id'))

    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relazioni
    publication = db.relationship('PressPublication', backref='comments')
    replies = db.relationship('PressComment', backref=db.backref('parent', remote_side=[id]))


class PressView(db.Model):
    """Tracking visualizzazioni pubblicazioni da sponsor"""
    __tablename__ = 'press_views'

    id = db.Column(db.Integer, primary_key=True)
    publication_id = db.Column(db.Integer, db.ForeignKey('press_publications.id'), nullable=False)
    sponsor_id = db.Column(db.Integer, db.ForeignKey('sponsors.id'), nullable=False)

    visualizzato_il = db.Column(db.DateTime, default=datetime.utcnow)

    # Relazioni
    publication = db.relationship('PressPublication', backref='views')
    sponsor = db.relationship('Sponsor', backref='press_views')


# ==================== BEST PRACTICE EVENTS MODELS ====================

class BestPracticeEvent(db.Model):
    """Eventi, webinar e seminari best practice (gestiti da Admin)"""
    __tablename__ = 'best_practice_events'

    id = db.Column(db.Integer, primary_key=True)

    # Contenuto
    tipo = db.Column(db.String(50), nullable=False)  # webinar, seminario, workshop, conferenza
    titolo = db.Column(db.String(200), nullable=False)
    descrizione = db.Column(db.Text, nullable=False)

    # Data e ora
    data_evento = db.Column(db.DateTime, nullable=False)
    durata_minuti = db.Column(db.Integer, default=60)

    # Location & Link
    location_fisica = db.Column(db.String(300))  # opzionale
    link_webinar = db.Column(db.String(500))  # Zoom, Teams, etc

    # Speaker
    speakers = db.Column(db.JSON)  # Array: [{nome, ruolo, bio, foto_url}]

    # Target audience
    visibile_sponsor = db.Column(db.Boolean, default=True)
    visibile_club = db.Column(db.Boolean, default=True)
    solo_premium = db.Column(db.Boolean, default=False)

    # Categorie e tags
    categoria = db.Column(db.String(100))  # marketing, digital, legal, finance
    tags = db.Column(db.JSON)  # Array: ["ROI", "Analytics", "Social Media"]

    # Materiali
    agenda_url = db.Column(db.String(500))
    materiali_urls = db.Column(db.JSON)  # Array di URL (PDF, slides, etc)

    # Impostazioni
    max_partecipanti = db.Column(db.Integer)  # null = illimitato
    richiedi_conferma = db.Column(db.Boolean, default=True)
    abilita_qna = db.Column(db.Boolean, default=True)
    registra_evento = db.Column(db.Boolean, default=True)
    recording_url = db.Column(db.String(500))

    # Status
    status = db.Column(db.String(50), default='bozza')  # bozza, pubblicato, in_corso, completato, cancellato
    pubblicato = db.Column(db.Boolean, default=False)

    # Note
    note_partecipanti = db.Column(db.Text)

    # Metadata
    creato_da_admin_id = db.Column(db.Integer, db.ForeignKey('admins.id'))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relazioni
    admin = db.relationship('Admin', backref='best_practice_events')


class EventRegistration(db.Model):
    """Iscrizioni agli eventi best practice"""
    __tablename__ = 'event_registrations'

    id = db.Column(db.Integer, primary_key=True)
    event_id = db.Column(db.Integer, db.ForeignKey('best_practice_events.id'), nullable=False)

    # Partecipante (polymorphic)
    user_type = db.Column(db.String(20), nullable=False)  # 'sponsor', 'club'
    user_id = db.Column(db.Integer, nullable=False)
    user_name = db.Column(db.String(200))
    user_email = db.Column(db.String(200))

    # Status
    status = db.Column(db.String(50), default='registrato')  # registrato, confermato, presente, assente, cancellato
    ha_partecipato = db.Column(db.Boolean, default=False)

    # Engagement
    minuti_partecipazione = db.Column(db.Integer)  # tracking tempo presenza
    domande_qna = db.Column(db.JSON)  # Array di ID domande fatte
    materiali_scaricati = db.Column(db.JSON)  # Array di materiali scaricati

    # Feedback
    rating = db.Column(db.Integer)  # 1-5
    feedback_testo = db.Column(db.Text)

    # Metadata
    registrato_il = db.Column(db.DateTime, default=datetime.utcnow)
    confermato_il = db.Column(db.DateTime)
    cancellato_il = db.Column(db.DateTime)

    # Relazioni
    event = db.relationship('BestPracticeEvent', backref='registrations')

    # Constraint unicità
    __table_args__ = (
        db.UniqueConstraint('event_id', 'user_type', 'user_id', name='unique_event_registration'),
    )


class EventQuestion(db.Model):
    """Domande Q&A durante eventi live"""
    __tablename__ = 'event_questions'

    id = db.Column(db.Integer, primary_key=True)
    event_id = db.Column(db.Integer, db.ForeignKey('best_practice_events.id'), nullable=False)

    # Autore
    user_type = db.Column(db.String(20), nullable=False)  # 'sponsor', 'club'
    user_id = db.Column(db.Integer, nullable=False)
    user_name = db.Column(db.String(200))

    # Contenuto
    domanda = db.Column(db.Text, nullable=False)
    risposta = db.Column(db.Text)  # risposta speaker/admin
    risposto_da = db.Column(db.String(200))

    # Engagement
    upvotes = db.Column(db.Integer, default=0)
    upvoted_by = db.Column(db.JSON)  # Array di {user_type, user_id}

    # Status
    moderato = db.Column(db.Boolean, default=True)
    risposto = db.Column(db.Boolean, default=False)

    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    risposto_il = db.Column(db.DateTime)

    # Relazioni
    event = db.relationship('BestPracticeEvent', backref='questions')


# ============================================
# PORTALE DI RISORSE (RESOURCES PORTAL)
# ============================================

class ResourceCategory(db.Model):
    __tablename__ = 'resource_categories'

    id = db.Column(db.Integer, primary_key=True)
    nome = db.Column(db.String(100), nullable=False, unique=True)
    slug = db.Column(db.String(100), nullable=False, unique=True)
    descrizione = db.Column(db.Text)
    icona = db.Column(db.String(50))  # emoji o nome icona
    parent_id = db.Column(db.Integer, db.ForeignKey('resource_categories.id'))  # per gerarchia
    ordine = db.Column(db.Integer, default=0)
    attiva = db.Column(db.Boolean, default=True)

    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Relazioni
    children = db.relationship('ResourceCategory', backref=db.backref('parent', remote_side=[id]))
    resources = db.relationship('Resource', backref='category', lazy=True)


class Resource(db.Model):
    __tablename__ = 'resources'

    id = db.Column(db.Integer, primary_key=True)

    # Metadata base
    titolo = db.Column(db.String(300), nullable=False)
    slug = db.Column(db.String(300), nullable=False, unique=True)
    descrizione = db.Column(db.Text)
    tipo_risorsa = db.Column(db.String(50), nullable=False)  # ricerca, case-study, guida, template, video, articolo, whitepaper, toolkit

    # Categorizzazione
    category_id = db.Column(db.Integer, db.ForeignKey('resource_categories.id'), nullable=False)
    tags = db.Column(db.JSON)  # array di tag
    settori = db.Column(db.JSON)  # settori di interesse

    # Contenuto
    file_url = db.Column(db.String(500))  # URL file caricato
    file_tipo = db.Column(db.String(50))  # pdf, docx, xlsx, mp4, etc.
    file_size_kb = db.Column(db.Integer)
    link_esterno = db.Column(db.String(500))  # alternative a file_url
    anteprima_url = db.Column(db.String(500))  # thumbnail/cover image

    # Autore/Fonte
    autore = db.Column(db.String(200))
    fonte = db.Column(db.String(200))
    data_pubblicazione = db.Column(db.Date)

    # Access Control
    visibilita = db.Column(db.String(20), default='public')  # public, sponsor-only, club-only, premium, admin-only
    richiede_registrazione = db.Column(db.Boolean, default=False)

    # Stats (denormalizzati per performance)
    views_count = db.Column(db.Integer, default=0)
    downloads_count = db.Column(db.Integer, default=0)
    bookmarks_count = db.Column(db.Integer, default=0)
    avg_rating = db.Column(db.Float, default=0.0)
    reviews_count = db.Column(db.Integer, default=0)

    # Featured & Highlights
    in_evidenza = db.Column(db.Boolean, default=False)
    consigliata = db.Column(db.Boolean, default=False)

    # Status
    pubblicata = db.Column(db.Boolean, default=True)
    moderata = db.Column(db.Boolean, default=True)

    # Metadata
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    created_by_admin_id = db.Column(db.Integer, db.ForeignKey('admins.id'))

    # Relazioni
    reviews = db.relationship('ResourceReview', backref='resource', lazy=True, cascade='all, delete-orphan')
    bookmarks = db.relationship('ResourceBookmark', backref='resource', lazy=True, cascade='all, delete-orphan')
    views = db.relationship('ResourceView', backref='resource', lazy=True, cascade='all, delete-orphan')


class ResourceReview(db.Model):
    __tablename__ = 'resource_reviews'

    id = db.Column(db.Integer, primary_key=True)
    resource_id = db.Column(db.Integer, db.ForeignKey('resources.id'), nullable=False)

    # Autore (polymorphic: club o sponsor)
    user_type = db.Column(db.String(20), nullable=False)  # 'club' o 'sponsor'
    user_id = db.Column(db.Integer, nullable=False)

    # Review
    rating = db.Column(db.Integer, nullable=False)  # 1-5
    titolo = db.Column(db.String(200))
    commento = db.Column(db.Text)

    # Utilità
    helpful_count = db.Column(db.Integer, default=0)
    helpful_by = db.Column(db.JSON)  # array di {user_type, user_id}

    # Moderazione
    approvata = db.Column(db.Boolean, default=True)
    moderata = db.Column(db.Boolean, default=True)
    motivo_rifiuto = db.Column(db.String(500))

    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class ResourceBookmark(db.Model):
    __tablename__ = 'resource_bookmarks'

    id = db.Column(db.Integer, primary_key=True)
    resource_id = db.Column(db.Integer, db.ForeignKey('resources.id'), nullable=False)

    # Utente (polymorphic: club o sponsor)
    user_type = db.Column(db.String(20), nullable=False)  # 'club' o 'sponsor'
    user_id = db.Column(db.Integer, nullable=False)

    # Organizzazione
    collection_id = db.Column(db.Integer, db.ForeignKey('resource_collections.id'))
    note_personali = db.Column(db.Text)

    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Unique constraint: un utente può salvare una risorsa una sola volta
    __table_args__ = (
        db.UniqueConstraint('resource_id', 'user_type', 'user_id', name='unique_bookmark'),
    )


class ResourceCollection(db.Model):
    __tablename__ = 'resource_collections'

    id = db.Column(db.Integer, primary_key=True)

    # Proprietario (polymorphic: club, sponsor, o admin)
    owner_type = db.Column(db.String(20), nullable=False)  # 'club', 'sponsor', 'admin'
    owner_id = db.Column(db.Integer, nullable=False)

    # Dettagli collezione
    nome = db.Column(db.String(200), nullable=False)
    descrizione = db.Column(db.Text)
    icona = db.Column(db.String(50))

    # Visibilità (per collezioni curate da admin)
    pubblica = db.Column(db.Boolean, default=False)  # se admin crea collezioni pubbliche/curate

    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relazioni
    bookmarks = db.relationship('ResourceBookmark', backref='collection', lazy=True)


class ResourceView(db.Model):
    __tablename__ = 'resource_views'

    id = db.Column(db.Integer, primary_key=True)
    resource_id = db.Column(db.Integer, db.ForeignKey('resources.id'), nullable=False)

    # Utente (polymorphic: club o sponsor, nullable per anonimi)
    user_type = db.Column(db.String(20))  # 'club' o 'sponsor'
    user_id = db.Column(db.Integer)

    # Tracking
    tipo_azione = db.Column(db.String(20), nullable=False)  # 'view', 'download'
    ip_address = db.Column(db.String(45))
    user_agent = db.Column(db.String(500))

    created_at = db.Column(db.DateTime, default=datetime.utcnow)


# ============================================
# PROJECT MANAGEMENT MODELS
# ============================================

class Project(db.Model):
    __tablename__ = 'projects'

    id = db.Column(db.Integer, primary_key=True)
    contract_id = db.Column(db.Integer, db.ForeignKey('head_of_terms.id'), nullable=True)  # Nullable per progetti condivisi
    club_id = db.Column(db.Integer, db.ForeignKey('clubs.id'), nullable=False)
    sponsor_id = db.Column(db.Integer, db.ForeignKey('sponsors.id'), nullable=True)  # Nullable per progetti condivisi con tutti
    titolo = db.Column(db.String(255), nullable=False)
    descrizione = db.Column(db.Text)
    stato = db.Column(db.String(20), default='pianificazione')  # pianificazione, in_corso, in_pausa, completato, archiviato
    data_inizio = db.Column(db.Date)
    data_fine = db.Column(db.Date)
    priorita = db.Column(db.String(10), default='media')  # bassa, media, alta, urgente
    progresso_percentuale = db.Column(db.Integer, default=0)  # 0-100
    budget_allocato = db.Column(db.Numeric(10, 2))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    archived_at = db.Column(db.DateTime)

    # Relationships
    contract = db.relationship('HeadOfTerms', backref='projects')
    club = db.relationship('Club', backref='projects')
    sponsor = db.relationship('Sponsor', backref='projects')
    milestones = db.relationship('ProjectMilestone', backref='project', lazy='dynamic', cascade='all, delete-orphan')
    tasks = db.relationship('ProjectTask', backref='project', lazy='dynamic', cascade='all, delete-orphan')
    updates = db.relationship('ProjectUpdate', backref='project', lazy='dynamic', cascade='all, delete-orphan')

    def to_dict(self):
        return {
            'id': self.id,
            'contract_id': self.contract_id,
            'club_id': self.club_id,
            'sponsor_id': self.sponsor_id,
            'club': {'id': self.club.id, 'nome': self.club.nome} if self.club else None,
            'sponsor': {'id': self.sponsor.id, 'nome_azienda': self.sponsor.nome_azienda} if self.sponsor else None,
            'titolo': self.titolo,
            'descrizione': self.descrizione,
            'stato': self.stato,
            'data_inizio': self.data_inizio.isoformat() if self.data_inizio else None,
            'data_fine': self.data_fine.isoformat() if self.data_fine else None,
            'priorita': self.priorita,
            'progresso_percentuale': self.progresso_percentuale,
            'budget_allocato': float(self.budget_allocato) if self.budget_allocato else None,
            'milestones_count': self.milestones.count(),
            'milestones_completati': self.milestones.filter_by(stato='completato').count(),
            'tasks_count': self.tasks.count(),
            'tasks_completati': self.tasks.filter_by(stato='completato').count(),
            'updates_count': self.updates.count(),
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat(),
            'archived_at': self.archived_at.isoformat() if self.archived_at else None
        }

    def to_dict_detailed(self):
        data = self.to_dict()
        data['milestones'] = [m.to_dict() for m in self.milestones.order_by(ProjectMilestone.ordine).all()]
        data['tasks'] = [t.to_dict() for t in self.tasks.order_by(ProjectTask.created_at.desc()).limit(20).all()]
        data['recent_updates'] = [u.to_dict() for u in self.updates.order_by(ProjectUpdate.created_at.desc()).limit(10).all()]
        return data

    def calculate_progress(self):
        total_tasks = self.tasks.count()
        if total_tasks == 0:
            return 0
        completed_tasks = self.tasks.filter_by(stato='completato').count()
        return int((completed_tasks / total_tasks) * 100)

    def update_progress(self):
        self.progresso_percentuale = self.calculate_progress()
        db.session.commit()


class ProjectMilestone(db.Model):
    __tablename__ = 'project_milestones'

    id = db.Column(db.Integer, primary_key=True)
    project_id = db.Column(db.Integer, db.ForeignKey('projects.id'), nullable=False)
    titolo = db.Column(db.String(255), nullable=False)
    descrizione = db.Column(db.Text)
    data_scadenza = db.Column(db.Date, nullable=False)
    stato = db.Column(db.String(20), default='da_iniziare')  # da_iniziare, in_corso, completato, in_ritardo
    completato_il = db.Column(db.DateTime)
    ordine = db.Column(db.Integer, default=0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'project_id': self.project_id,
            'titolo': self.titolo,
            'descrizione': self.descrizione,
            'data_scadenza': self.data_scadenza.isoformat(),
            'stato': self.stato,
            'completato_il': self.completato_il.isoformat() if self.completato_il else None,
            'ordine': self.ordine,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat(),
            'is_late': self.is_late()
        }

    def is_late(self):
        if self.stato == 'completato':
            return False
        from datetime import date
        return date.today() > self.data_scadenza

    def mark_completed(self):
        self.stato = 'completato'
        self.completato_il = datetime.utcnow()
        db.session.commit()


class ProjectTask(db.Model):
    __tablename__ = 'project_tasks'

    id = db.Column(db.Integer, primary_key=True)
    project_id = db.Column(db.Integer, db.ForeignKey('projects.id'), nullable=False)
    milestone_id = db.Column(db.Integer, db.ForeignKey('project_milestones.id'))
    titolo = db.Column(db.String(255), nullable=False)
    descrizione = db.Column(db.Text)

    # Polymorphic assignment
    assegnato_a_type = db.Column(db.String(20))  # 'club' o 'sponsor'
    assegnato_a_id = db.Column(db.Integer)

    # Polymorphic creator
    creato_da_type = db.Column(db.String(20), nullable=False)  # 'club', 'sponsor', 'admin'
    creato_da_id = db.Column(db.Integer, nullable=False)

    priorita = db.Column(db.String(10), default='media')  # bassa, media, alta, urgente
    stato = db.Column(db.String(20), default='da_fare')  # da_fare, in_corso, in_revisione, completato, bloccato
    data_scadenza = db.Column(db.DateTime)
    completato_il = db.Column(db.DateTime)
    tempo_stimato = db.Column(db.Integer)  # ore
    tags = db.Column(db.String(500))  # comma-separated
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    milestone = db.relationship('ProjectMilestone', backref='tasks')
    comments = db.relationship('TaskComment', backref='task', lazy='dynamic', cascade='all, delete-orphan')

    def to_dict(self):
        return {
            'id': self.id,
            'project_id': self.project_id,
            'milestone_id': self.milestone_id,
            'milestone': {'id': self.milestone.id, 'titolo': self.milestone.titolo} if self.milestone else None,
            'titolo': self.titolo,
            'descrizione': self.descrizione,
            'assegnato_a': {
                'type': self.assegnato_a_type,
                'id': self.assegnato_a_id,
                'nome': self.get_assignee_name()
            } if self.assegnato_a_type else None,
            'creato_da': {
                'type': self.creato_da_type,
                'id': self.creato_da_id,
                'nome': self.get_creator_name()
            },
            'priorita': self.priorita,
            'stato': self.stato,
            'data_scadenza': self.data_scadenza.isoformat() if self.data_scadenza else None,
            'completato_il': self.completato_il.isoformat() if self.completato_il else None,
            'tempo_stimato': self.tempo_stimato,
            'tags': self.tags.split(',') if self.tags else [],
            'comments_count': self.comments.count(),
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat(),
            'is_late': self.is_late()
        }

    def get_assignee_name(self):
        if not self.assegnato_a_type:
            return None
        if self.assegnato_a_type == 'club':
            club = Club.query.get(self.assegnato_a_id)
            return club.nome if club else 'Unknown'
        elif self.assegnato_a_type == 'sponsor':
            sponsor = Sponsor.query.get(self.assegnato_a_id)
            return sponsor.nome_azienda if sponsor else 'Unknown'
        return None

    def get_creator_name(self):
        if self.creato_da_type == 'club':
            club = Club.query.get(self.creato_da_id)
            return club.nome if club else 'Unknown'
        elif self.creato_da_type == 'sponsor':
            sponsor = Sponsor.query.get(self.creato_da_id)
            return sponsor.nome_azienda if sponsor else 'Unknown'
        elif self.creato_da_type == 'admin':
            admin = Admin.query.get(self.creato_da_id)
            return admin.username if admin else 'Unknown'
        return 'Unknown'

    def is_late(self):
        if self.stato == 'completato' or not self.data_scadenza:
            return False
        return datetime.utcnow() > self.data_scadenza

    def mark_completed(self):
        self.stato = 'completato'
        self.completato_il = datetime.utcnow()
        db.session.commit()
        self.project.update_progress()


class ProjectUpdate(db.Model):
    __tablename__ = 'project_updates'

    id = db.Column(db.Integer, primary_key=True)
    project_id = db.Column(db.Integer, db.ForeignKey('projects.id'), nullable=False)

    # Polymorphic author (solo Club e Admin possono postare)
    autore_type = db.Column(db.String(20), nullable=False)  # 'club' o 'admin'
    autore_id = db.Column(db.Integer, nullable=False)

    titolo = db.Column(db.String(255), nullable=False)
    contenuto = db.Column(db.Text, nullable=False)
    tipo_update = db.Column(db.String(50), default='news')  # news, milestone_completato, task_completato, cambio_stato, alert, documento
    allegati_urls = db.Column(db.Text)  # JSON array di URL
    visibilita = db.Column(db.String(20), default='sponsor_only')  # sponsor_only, team_only, pubblico
    pin_in_alto = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        import json
        return {
            'id': self.id,
            'project_id': self.project_id,
            'autore': {
                'type': self.autore_type,
                'id': self.autore_id,
                'nome': self.get_author_name()
            },
            'titolo': self.titolo,
            'contenuto': self.contenuto,
            'tipo_update': self.tipo_update,
            'allegati_urls': json.loads(self.allegati_urls) if self.allegati_urls else [],
            'visibilita': self.visibilita,
            'pin_in_alto': self.pin_in_alto,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        }

    def get_author_name(self):
        if self.autore_type == 'club':
            club = Club.query.get(self.autore_id)
            return club.nome if club else 'Unknown'
        elif self.autore_type == 'admin':
            admin = Admin.query.get(self.autore_id)
            return admin.username if admin else 'Unknown'
        return 'Unknown'


class TaskComment(db.Model):
    __tablename__ = 'task_comments'

    id = db.Column(db.Integer, primary_key=True)
    task_id = db.Column(db.Integer, db.ForeignKey('project_tasks.id'), nullable=False)

    # Polymorphic author
    autore_type = db.Column(db.String(20), nullable=False)  # 'club', 'sponsor', 'admin'
    autore_id = db.Column(db.Integer, nullable=False)

    contenuto = db.Column(db.Text, nullable=False)
    allegati_urls = db.Column(db.Text)  # JSON array
    parent_comment_id = db.Column(db.Integer, db.ForeignKey('task_comments.id'))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Self-referential relationship
    replies = db.relationship('TaskComment', backref=db.backref('parent', remote_side=[id]), lazy='dynamic')

    def to_dict(self):
        import json
        return {
            'id': self.id,
            'task_id': self.task_id,
            'autore': {
                'type': self.autore_type,
                'id': self.autore_id,
                'nome': self.get_author_name()
            },
            'contenuto': self.contenuto,
            'allegati_urls': json.loads(self.allegati_urls) if self.allegati_urls else [],
            'parent_comment_id': self.parent_comment_id,
            'replies_count': self.replies.count(),
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        }

    def to_dict_with_replies(self):
        data = self.to_dict()
        data['replies'] = [r.to_dict() for r in self.replies.order_by(TaskComment.created_at).all()]
        return data

    def get_author_name(self):
        if self.autore_type == 'club':
            club = Club.query.get(self.autore_id)
            return club.nome if club else 'Unknown'
        elif self.autore_type == 'sponsor':
            sponsor = Sponsor.query.get(self.autore_id)
            return sponsor.nome_azienda if sponsor else 'Unknown'
        elif self.autore_type == 'admin':
            admin = Admin.query.get(self.autore_id)
            return admin.username if admin else 'Unknown'
        return 'Unknown'


class Notification(db.Model):
    __tablename__ = 'notifications'

    id = db.Column(db.Integer, primary_key=True)

    # Polymorphic recipient
    user_type = db.Column(db.String(50), nullable=False)  # 'club' o 'sponsor'
    user_id = db.Column(db.Integer, nullable=False)

    tipo = db.Column(db.String(100), nullable=False)  # project_update, task_assegnato, task_completato, milestone_raggiunto, scadenza_imminente, commento, menzione, cambio_stato
    titolo = db.Column(db.String(200), nullable=False)
    messaggio = db.Column(db.Text, nullable=False)
    link = db.Column(db.String(500))  # deep link alla risorsa

    # Riferimento oggetto che ha generato notifica
    oggetto_type = db.Column(db.String(50))  # 'project', 'task', 'milestone', 'update'
    oggetto_id = db.Column(db.Integer)
    priorita = db.Column(db.String(10), default='normale')  # bassa, normale, alta, urgente

    letta = db.Column(db.Boolean, default=False)
    letta_il = db.Column(db.DateTime)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'destinatario': {'type': self.user_type, 'id': self.user_id},
            'tipo': self.tipo,
            'titolo': self.titolo,
            'messaggio': self.messaggio,
            'link_url': self.link,
            'oggetto': {'type': self.oggetto_type, 'id': self.oggetto_id} if self.oggetto_type else None,
            'priorita': self.priorita,
            'letta': self.letta,
            'letta_il': self.letta_il.isoformat() if self.letta_il else None,
            'created_at': self.created_at.isoformat(),
            'time_ago': self.get_time_ago()
        }

    def mark_read(self):
        self.letta = True
        self.letta_il = datetime.utcnow()
        db.session.commit()

    def get_time_ago(self):
        delta = datetime.utcnow() - self.created_at
        if delta.days > 30:
            return f"{delta.days // 30} mesi fa"
        elif delta.days > 0:
            return f"{delta.days} giorni fa"
        elif delta.seconds > 3600:
            return f"{delta.seconds // 3600} ore fa"
        elif delta.seconds > 60:
            return f"{delta.seconds // 60} minuti fa"
        else:
            return "Ora"

    @staticmethod
    def create_notification(user_type, user_id, tipo, titolo, messaggio, **kwargs):
        notification = Notification(
            user_type=user_type,
            user_id=user_id,
            tipo=tipo,
            titolo=titolo,
            messaggio=messaggio,
            link=kwargs.get('link_url'),
            oggetto_type=kwargs.get('oggetto_type'),
            oggetto_id=kwargs.get('oggetto_id'),
            priorita=kwargs.get('priorita', 'normale')
        )
        db.session.add(notification)
        db.session.commit()
        return notification


# ============================================================================
# BUDGET & FINANCIAL MANAGEMENT MODELS
# ============================================================================

class Budget(db.Model):
    """Budget principale per contratto - separato per Club e Sponsor"""
    __tablename__ = 'budgets'

    id = db.Column(db.Integer, primary_key=True)
    contract_id = db.Column(db.Integer, db.ForeignKey('head_of_terms.id'), nullable=False)

    # Owner del budget (club o sponsor)
    owner_type = db.Column(db.String(50), nullable=False)  # 'club' o 'sponsor'
    owner_id = db.Column(db.Integer, nullable=False)  # ID del club o sponsor

    anno_fiscale = db.Column(db.Integer, nullable=False)  # 2024, 2025

    # Importi
    importo_totale = db.Column(db.Numeric(10, 2), nullable=False)  # Budget totale
    importo_speso = db.Column(db.Numeric(10, 2), default=0)  # Quanto già speso
    importo_rimanente = db.Column(db.Numeric(10, 2))  # Auto-calcolato

    valuta = db.Column(db.String(3), default='EUR')  # EUR, USD, GBP

    note = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    contract = db.relationship('HeadOfTerms', backref='budgets')
    categories = db.relationship('BudgetCategory', backref='budget', lazy='dynamic', cascade='all, delete-orphan')
    expenses = db.relationship('Expense', backref='budget', lazy='dynamic', cascade='all, delete-orphan')
    payments = db.relationship('Payment', backref='budget', lazy='dynamic', cascade='all, delete-orphan')
    documents = db.relationship('FinancialDocument', backref='budget', lazy='dynamic', cascade='all, delete-orphan')
    alerts = db.relationship('BudgetAlert', backref='budget', lazy='dynamic', cascade='all, delete-orphan')

    def calculate_remaining(self):
        """Calcola importo rimanente"""
        self.importo_rimanente = self.importo_totale - self.importo_speso
        return self.importo_rimanente

    def get_percentage_used(self):
        """Percentuale budget utilizzato"""
        if self.importo_totale == 0:
            return 0
        return float((self.importo_speso / self.importo_totale) * 100)

    def update_spent_amount(self):
        """Ricalcola importo speso dalle expense"""
        total_spent = db.session.query(db.func.sum(Expense.importo)).filter(
            Expense.budget_id == self.id,
            Expense.stato == 'pagato'
        ).scalar() or 0
        self.importo_speso = total_spent
        self.calculate_remaining()
        db.session.commit()


class BudgetCategory(db.Model):
    """Categorie di spesa per organizzare il budget"""
    __tablename__ = 'budget_categories'

    id = db.Column(db.Integer, primary_key=True)
    budget_id = db.Column(db.Integer, db.ForeignKey('budgets.id'), nullable=False)

    nome = db.Column(db.String(200), nullable=False)  # "Attivazioni Match", "Eventi", "Produzione"
    descrizione = db.Column(db.Text)

    importo_allocato = db.Column(db.Numeric(10, 2), nullable=False)
    importo_speso = db.Column(db.Numeric(10, 2), default=0)

    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    expenses = db.relationship('Expense', backref='category', lazy='dynamic')

    def get_percentage_used(self):
        """Percentuale categoria utilizzata"""
        if self.importo_allocato == 0:
            return 0
        return float((self.importo_speso / self.importo_allocato) * 100)

    def update_spent_amount(self):
        """Ricalcola importo speso"""
        total_spent = db.session.query(db.func.sum(Expense.importo)).filter(
            Expense.category_id == self.id,
            Expense.stato == 'pagato'
        ).scalar() or 0
        self.importo_speso = total_spent
        db.session.commit()


class Expense(db.Model):
    """Singola spesa registrata"""
    __tablename__ = 'expenses'

    id = db.Column(db.Integer, primary_key=True)
    budget_id = db.Column(db.Integer, db.ForeignKey('budgets.id'), nullable=False)
    category_id = db.Column(db.Integer, db.ForeignKey('budget_categories.id'))

    # Collegamenti opzionali a entità esistenti
    project_id = db.Column(db.Integer, db.ForeignKey('projects.id'))
    activation_id = db.Column(db.Integer, db.ForeignKey('activations.id'))
    event_id = db.Column(db.Integer, db.ForeignKey('events.id'))

    descrizione = db.Column(db.String(500), nullable=False)
    importo = db.Column(db.Numeric(10, 2), nullable=False)
    data_spesa = db.Column(db.Date, nullable=False)

    tipo_spesa = db.Column(db.String(50), default='effettivo')  # 'preventivo', 'effettivo', 'fatturato'
    stato = db.Column(db.String(50), default='in_sospeso')  # 'in_sospeso', 'approvato', 'rifiutato', 'pagato'

    # Documenti allegati
    fattura_url = db.Column(db.String(500))
    ricevuta_url = db.Column(db.String(500))

    # Tracking creazione e approvazione
    creato_da_type = db.Column(db.String(50), nullable=False)  # 'club', 'sponsor'
    creato_da_id = db.Column(db.Integer, nullable=False)

    approvato_da_type = db.Column(db.String(50))
    approvato_da_id = db.Column(db.Integer)
    approvato_il = db.Column(db.DateTime)

    note = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    project = db.relationship('Project', backref='expenses')

    def approve(self, approver_type, approver_id):
        """Approva la spesa"""
        self.stato = 'approvato'
        self.approvato_da_type = approver_type
        self.approvato_da_id = approver_id
        self.approvato_il = datetime.utcnow()
        db.session.commit()

    def mark_paid(self):
        """Segna come pagata e aggiorna budget"""
        self.stato = 'pagato'
        db.session.commit()
        # Aggiorna importo speso nel budget
        self.budget.update_spent_amount()
        if self.category_id:
            self.category.update_spent_amount()


class Payment(db.Model):
    """Pagamenti pianificati ed effettuati tra Club e Sponsor"""
    __tablename__ = 'payments'

    id = db.Column(db.Integer, primary_key=True)
    budget_id = db.Column(db.Integer, db.ForeignKey('budgets.id'), nullable=False)
    contract_id = db.Column(db.Integer, db.ForeignKey('head_of_terms.id'), nullable=False)

    tipo = db.Column(db.String(50), nullable=False)  # 'rata', 'acconto', 'saldo', 'bonus'
    importo = db.Column(db.Numeric(10, 2), nullable=False)

    # Date
    data_prevista = db.Column(db.Date, nullable=False)  # Quando deve essere pagato
    data_effettiva = db.Column(db.Date)  # Quando è stato effettivamente pagato

    stato = db.Column(db.String(50), default='pianificato')  # 'pianificato', 'in_corso', 'completato', 'in_ritardo', 'annullato'
    metodo_pagamento = db.Column(db.String(100))  # 'bonifico', 'assegno', 'carta'

    # Documenti
    ricevuta_url = db.Column(db.String(500))
    contratto_riferimento = db.Column(db.String(200))

    # Tracking mittente/destinatario
    inviato_da_type = db.Column(db.String(50))  # 'club', 'sponsor'
    inviato_da_id = db.Column(db.Integer)
    ricevuto_da_type = db.Column(db.String(50))  # 'club', 'sponsor'
    ricevuto_da_id = db.Column(db.Integer)

    note = db.Column(db.Text)
    notifica_inviata = db.Column(db.Boolean, default=False)  # Per reminder scadenza

    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    contract = db.relationship('HeadOfTerms', backref='payments')

    def mark_completed(self, data_pagamento=None):
        """Segna pagamento come completato"""
        self.stato = 'completato'
        self.data_effettiva = data_pagamento or datetime.utcnow().date()
        db.session.commit()

    def check_if_late(self):
        """Verifica se pagamento è in ritardo"""
        if self.stato == 'pianificato' and datetime.utcnow().date() > self.data_prevista:
            self.stato = 'in_ritardo'
            db.session.commit()
            return True
        return False


class FinancialDocument(db.Model):
    """Documenti finanziari: fatture, ricevute, contratti"""
    __tablename__ = 'financial_documents'

    id = db.Column(db.Integer, primary_key=True)
    budget_id = db.Column(db.Integer, db.ForeignKey('budgets.id'), nullable=False)
    expense_id = db.Column(db.Integer, db.ForeignKey('expenses.id'))
    payment_id = db.Column(db.Integer, db.ForeignKey('payments.id'))

    tipo = db.Column(db.String(50), nullable=False)  # 'fattura', 'ricevuta', 'contratto', 'preventivo', 'nota_credito'
    numero_documento = db.Column(db.String(100))

    data_emissione = db.Column(db.Date, nullable=False)
    data_scadenza = db.Column(db.Date)

    # File
    file_url = db.Column(db.String(500), nullable=False)
    file_size = db.Column(db.Integer)  # Bytes
    file_type = db.Column(db.String(50))  # 'application/pdf', 'image/jpeg'

    # Importi
    importo = db.Column(db.Numeric(10, 2), nullable=False)
    iva_percentuale = db.Column(db.Numeric(5, 2))  # 22.00
    importo_totale = db.Column(db.Numeric(10, 2))  # Importo + IVA

    # Parti
    emesso_da = db.Column(db.String(200))
    emesso_a = db.Column(db.String(200))

    stato = db.Column(db.String(50), default='emessa')  # 'bozza', 'emessa', 'pagata', 'scaduta', 'annullata'

    note = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    expense = db.relationship('Expense', backref='documents')
    payment = db.relationship('Payment', backref='documents')

    def calculate_total(self):
        """Calcola importo totale con IVA"""
        if self.iva_percentuale:
            iva_amount = self.importo * (self.iva_percentuale / 100)
            self.importo_totale = self.importo + iva_amount
        else:
            self.importo_totale = self.importo
        return self.importo_totale


class BudgetAlert(db.Model):
    """Alert automatici per budget e pagamenti"""
    __tablename__ = 'budget_alerts'

    id = db.Column(db.Integer, primary_key=True)
    budget_id = db.Column(db.Integer, db.ForeignKey('budgets.id'), nullable=False)
    category_id = db.Column(db.Integer, db.ForeignKey('budget_categories.id'))

    tipo = db.Column(db.String(50), nullable=False)  # 'soglia_superata', 'pagamento_scadenza', 'budget_esaurito'
    soglia_percentuale = db.Column(db.Integer)  # 75, 90, 100

    attivo = db.Column(db.Boolean, default=True)
    notifica_inviata = db.Column(db.Boolean, default=False)
    data_ultima_notifica = db.Column(db.DateTime)

    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def check_and_notify(self):
        """Verifica condizione e invia notifica se necessario"""
        if not self.attivo or self.notifica_inviata:
            return False

        budget = self.budget
        percentage_used = budget.get_percentage_used()

        if percentage_used >= self.soglia_percentuale:
            # Invia notifica
            Notification.create_notification(
                user_type=budget.owner_type,
                user_id=budget.owner_id,
                tipo='budget_alert',
                titolo=f'Alert Budget: {self.soglia_percentuale}% utilizzato',
                messaggio=f'Il budget ha raggiunto il {percentage_used:.1f}% di utilizzo.',
                link_url=f'/{budget.owner_type}/budgets/{budget.id}',
                priorita='alta' if self.soglia_percentuale >= 90 else 'normale'
            )

            self.notifica_inviata = True
            self.data_ultima_notifica = datetime.utcnow()
            db.session.commit()
            return True

        return False


# ============================================================================
# MARKETPLACE DELLE OPPORTUNITÀ MODELS
# ============================================================================

class MarketplaceOpportunity(db.Model):
    """Opportunità pubblicata nel marketplace (da club o sponsor)"""
    __tablename__ = 'marketplace_opportunities'

    id = db.Column(db.Integer, primary_key=True)

    # Creator (chi pubblica l'opportunità)
    creator_type = db.Column(db.String(50), nullable=False)  # 'club' o 'sponsor'
    creator_id = db.Column(db.Integer, nullable=False)  # ID del club o sponsor

    # Info base
    titolo = db.Column(db.String(200), nullable=False)
    descrizione = db.Column(db.Text, nullable=False)

    # Classificazione
    tipo_opportunita = db.Column(db.String(100), nullable=False)
    # evento_speciale, campagna_promozionale, progetto_csr, attivazione_speciale, co_branding, altro
    categoria = db.Column(db.String(100))  # sport, sociale, business, entertainment, digital

    # Budget e asset
    budget_richiesto = db.Column(db.Numeric(10, 2))
    asset_richiesti = db.Column(db.JSON)  # List of objects: [{"categoria": "...", "descrizione": "..."}]
    asset_forniti = db.Column(db.JSON)    # List of objects: [{"categoria": "...", "descrizione": "..."}]
    numero_sponsor_cercati = db.Column(db.Integer, default=1)

    # Timeline e location
    data_inizio = db.Column(db.Date)
    data_fine = db.Column(db.Date)
    location = db.Column(db.String(200))  # Indirizzo formattato completo
    location_city = db.Column(db.String(100))  # Città
    location_province = db.Column(db.String(100))  # Provincia
    location_region = db.Column(db.String(100))  # Regione
    location_country = db.Column(db.String(100), default='Italia')  # Paese
    location_lat = db.Column(db.Float)  # Latitudine
    location_lng = db.Column(db.Float)  # Longitudine

    # Target e visibilità
    target_audience = db.Column(db.JSON)  # {age_range: '18-35', interests: [...], ...}
    visibilita = db.Column(db.String(50), default='pubblica')  # pubblica, solo_network, privata

    # Stati
    stato = db.Column(db.String(50), default='bozza')  # bozza, pubblicata, in_corso, completata, annullata
    deadline_candidature = db.Column(db.DateTime)

    # Metrics
    views_count = db.Column(db.Integer, default=0)
    applications_count = db.Column(db.Integer, default=0)

    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    pubblicata_at = db.Column(db.DateTime)

    # Relationships
    applications = db.relationship('OpportunityApplication', backref='opportunity', lazy=True, cascade='all, delete-orphan')
    collaborations = db.relationship('OpportunityCollaboration', backref='opportunity', lazy=True, cascade='all, delete-orphan')
    assets = db.relationship('OpportunityAsset', backref='opportunity', lazy=True, cascade='all, delete-orphan')
    messages = db.relationship('OpportunityMessage', backref='opportunity', lazy=True, cascade='all, delete-orphan')
    reviews = db.relationship('OpportunityReview', backref='opportunity', lazy=True, cascade='all, delete-orphan')

    def increment_views(self):
        """Incrementa contatore visualizzazioni"""
        self.views_count += 1
        db.session.commit()

    def get_creator_name(self):
        """Restituisce nome del creator"""
        if self.creator_type == 'club':
            club = Club.query.get(self.creator_id)
            return club.nome if club else 'Club sconosciuto'
        elif self.creator_type == 'sponsor':
            sponsor = Sponsor.query.get(self.creator_id)
            return sponsor.ragione_sociale if sponsor else 'Sponsor sconosciuto'
        return 'Sconosciuto'

    def get_spots_remaining(self):
        """Calcola posti sponsor rimanenti"""
        accepted_count = OpportunityCollaboration.query.filter_by(
            opportunity_id=self.id,
            stato='attiva'
        ).count()
        num_cercati = self.numero_sponsor_cercati or 1
        return max(0, num_cercati - accepted_count)

    def is_deadline_passed(self):
        """Verifica se deadline candidature è passata"""
        if not self.deadline_candidature:
            return False
        return datetime.utcnow() > self.deadline_candidature

    def can_apply(self):
        """Verifica se è possibile candidarsi"""
        return (
            self.stato == 'pubblicata' and
            not self.is_deadline_passed() and
            self.get_spots_remaining() > 0
        )

    def to_dict(self):
        """Serializza per API"""
        return {
            'id': self.id,
            'creator_type': self.creator_type,
            'creator_id': self.creator_id,
            'creator_name': self.get_creator_name(),
            'titolo': self.titolo,
            'descrizione': self.descrizione,
            'tipo_opportunita': self.tipo_opportunita,
            'categoria': self.categoria,
            'budget_richiesto': float(self.budget_richiesto) if self.budget_richiesto else None,
            'asset_richiesti': self.asset_richiesti,
            'asset_forniti': self.asset_forniti,
            'numero_sponsor_cercati': self.numero_sponsor_cercati,
            'spots_remaining': self.get_spots_remaining(),
            'data_inizio': self.data_inizio.isoformat() if self.data_inizio else None,
            'data_fine': self.data_fine.isoformat() if self.data_fine else None,
            'location': self.location,
            'location_city': self.location_city,
            'location_province': self.location_province,
            'location_region': self.location_region,
            'location_country': self.location_country,
            'location_lat': self.location_lat,
            'location_lng': self.location_lng,
            'target_audience': self.target_audience,
            'visibilita': self.visibilita,
            'stato': self.stato,
            'deadline_candidature': self.deadline_candidature.isoformat() if self.deadline_candidature else None,
            'can_apply': self.can_apply(),
            'views_count': self.views_count,
            'applications_count': self.applications_count,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        }


class OpportunityApplication(db.Model):
    """Candidatura di uno sponsor a un'opportunità"""
    __tablename__ = 'opportunity_applications'

    id = db.Column(db.Integer, primary_key=True)
    opportunity_id = db.Column(db.Integer, db.ForeignKey('marketplace_opportunities.id'), nullable=False)

    # Candidato (sempre sponsor)
    applicant_type = db.Column(db.String(50), default='sponsor')
    applicant_id = db.Column(db.Integer, nullable=False)  # sponsor_id

    # Proposta
    messaggio_candidatura = db.Column(db.Text)
    proposta_budget = db.Column(db.Numeric(10, 2))
    asset_offerti = db.Column(db.JSON)  # {led: {quantity: 2, value: 5000}, ...}

    # Stati
    stato = db.Column(db.String(50), default='in_attesa')  # in_attesa, accettata, rifiutata, ritirata

    # Review
    reviewed_at = db.Column(db.DateTime)
    reviewed_by_type = db.Column(db.String(50))  # 'club' o 'sponsor' (owner opportunità)
    reviewed_by_id = db.Column(db.Integer)
    motivo_rifiuto = db.Column(db.Text)

    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def get_applicant_name(self):
        """Restituisce nome del candidato"""
        if self.applicant_type == 'sponsor':
            sponsor = Sponsor.query.get(self.applicant_id)
            return sponsor.ragione_sociale if sponsor else 'Sponsor sconosciuto'
        return 'Sconosciuto'

    def accept(self, reviewer_type, reviewer_id):
        """Accetta candidatura e crea collaborazione"""
        self.stato = 'accettata'
        self.reviewed_at = datetime.utcnow()
        self.reviewed_by_type = reviewer_type
        self.reviewed_by_id = reviewer_id

        # Crea collaborazione
        collaboration = OpportunityCollaboration(
            opportunity_id=self.opportunity_id,
            ruolo='co_sponsor',
            budget_confermato=self.proposta_budget,
            asset_confermati=self.asset_offerti,
            stato='attiva'
        )

        if self.applicant_type == 'sponsor':
            collaboration.sponsor_id = self.applicant_id
        elif self.applicant_type == 'club':
            collaboration.club_id = self.applicant_id

        db.session.add(collaboration)

        # Incrementa counter
        opp = self.opportunity
        opp.applications_count = OpportunityApplication.query.filter_by(
            opportunity_id=self.opportunity_id,
            stato='accettata'
        ).count() + 1

        db.session.commit()
        return collaboration

    def reject(self, reviewer_type, reviewer_id, motivo=None):
        """Rifiuta candidatura"""
        self.stato = 'rifiutata'
        self.reviewed_at = datetime.utcnow()
        self.reviewed_by_type = reviewer_type
        self.reviewed_by_id = reviewer_id
        self.motivo_rifiuto = motivo
        db.session.commit()

    def withdraw(self):
        """Ritira candidatura"""
        if self.stato == 'in_attesa':
            self.stato = 'ritirata'
            db.session.commit()
            return True
        return False

    def to_dict(self):
        """Serializza per API"""
        return {
            'id': self.id,
            'opportunity_id': self.opportunity_id,
            'opportunity': self.opportunity.to_dict() if self.opportunity else None,
            'applicant_type': self.applicant_type,
            'applicant_id': self.applicant_id,
            'applicant_name': self.get_applicant_name(),
            'messaggio_candidatura': self.messaggio_candidatura,
            'proposta_budget': float(self.proposta_budget) if self.proposta_budget else None,
            'asset_offerti': self.asset_offerti,
            'stato': self.stato,
            'reviewed_at': self.reviewed_at.isoformat() if self.reviewed_at else None,
            'motivo_rifiuto': self.motivo_rifiuto,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        }


class OpportunityCollaboration(db.Model):
    """Collaborazione attiva tra sponsor/club e opportunità"""
    __tablename__ = 'opportunity_collaborations'

    id = db.Column(db.Integer, primary_key=True)
    opportunity_id = db.Column(db.Integer, db.ForeignKey('marketplace_opportunities.id'), nullable=False)
    
    # Partecipante (Sponsor o Club)
    sponsor_id = db.Column(db.Integer, db.ForeignKey('sponsors.id'), nullable=True)
    club_id = db.Column(db.Integer, db.ForeignKey('clubs.id'), nullable=True)

    # Ruolo e condizioni
    ruolo = db.Column(db.String(100))  # co_sponsor_principale, co_sponsor_secondario, fornitore_asset
    budget_confermato = db.Column(db.Numeric(10, 2))
    asset_confermati = db.Column(db.JSON)

    # Contratto
    contratto_firmato = db.Column(db.Boolean, default=False)
    documento_contratto_url = db.Column(db.String(500))
    data_firma_contratto = db.Column(db.DateTime)

    # Stati
    stato = db.Column(db.String(50), default='attiva')  # attiva, completata, annullata

    # Timeline
    data_inizio = db.Column(db.Date)
    data_fine = db.Column(db.Date)

    # Performance metrics
    performance_metrics = db.Column(db.JSON)  # {impressions: 10000, engagement: 500, ...}

    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    completata_at = db.Column(db.DateTime)

    # Relationships
    sponsor = db.relationship('Sponsor', backref='marketplace_collaborations')
    club = db.relationship('Club', backref='marketplace_collaborations')

    def complete(self):
        """Completa collaborazione"""
        self.stato = 'completata'
        self.completata_at = datetime.utcnow()
        db.session.commit()

    def cancel(self):
        """Annulla collaborazione"""
        self.stato = 'annullata'
        db.session.commit()

    def to_dict(self):
        """Serializza per API"""
        data = {
            'id': self.id,
            'opportunity_id': self.opportunity_id,
            'ruolo': self.ruolo,
            'budget_confermato': float(self.budget_confermato) if self.budget_confermato else None,
            'asset_confermati': self.asset_confermati,
            'contratto_firmato': self.contratto_firmato,
            'documento_contratto_url': self.documento_contratto_url,
            'stato': self.stato,
            'data_inizio': self.data_inizio.isoformat() if self.data_inizio else None,
            'data_fine': self.data_fine.isoformat() if self.data_fine else None,
            'performance_metrics': self.performance_metrics,
            'created_at': self.created_at.isoformat(),
            'completata_at': self.completata_at.isoformat() if self.completata_at else None
        }
        
        if self.sponsor_id:
            data['participant_type'] = 'sponsor'
            data['participant_id'] = self.sponsor_id
            data['participant_name'] = self.sponsor.ragione_sociale if self.sponsor else None
        elif self.club_id:
            data['participant_type'] = 'club'
            data['participant_id'] = self.club_id
            data['participant_name'] = self.club.nome if self.club else None
            
        return data


class OpportunityAsset(db.Model):
    """Asset richiesti/offerti per opportunità"""
    __tablename__ = 'opportunity_assets'

    id = db.Column(db.Integer, primary_key=True)
    opportunity_id = db.Column(db.Integer, db.ForeignKey('marketplace_opportunities.id'), nullable=False)

    # Asset info
    tipo_asset = db.Column(db.String(100), nullable=False)  # led_board, social_media, hospitality, branding, altro
    nome = db.Column(db.String(200))
    descrizione = db.Column(db.Text)
    quantita = db.Column(db.Integer, default=1)
    valore_stimato = db.Column(db.Numeric(10, 2))

    # Stati
    stato = db.Column(db.String(50), default='richiesto')  # richiesto, offerto, assegnato
    sponsor_fornitore_id = db.Column(db.Integer, db.ForeignKey('sponsors.id'))

    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    assegnato_at = db.Column(db.DateTime)

    # Relationships
    sponsor_fornitore = db.relationship('Sponsor', backref='asset_forniti')

    def assign_to_sponsor(self, sponsor_id):
        """Assegna asset a sponsor"""
        self.sponsor_fornitore_id = sponsor_id
        self.stato = 'assegnato'
        self.assegnato_at = datetime.utcnow()
        db.session.commit()

    def to_dict(self):
        """Serializza per API"""
        return {
            'id': self.id,
            'opportunity_id': self.opportunity_id,
            'tipo_asset': self.tipo_asset,
            'nome': self.nome,
            'descrizione': self.descrizione,
            'quantita': self.quantita,
            'valore_stimato': float(self.valore_stimato) if self.valore_stimato else None,
            'stato': self.stato,
            'sponsor_fornitore_id': self.sponsor_fornitore_id,
            'sponsor_fornitore_name': self.sponsor_fornitore.ragione_sociale if self.sponsor_fornitore else None,
            'created_at': self.created_at.isoformat()
        }


class OpportunityMessage(db.Model):
    """Messaggi relativi a opportunità"""
    __tablename__ = 'opportunity_messages'

    id = db.Column(db.Integer, primary_key=True)
    opportunity_id = db.Column(db.Integer, db.ForeignKey('marketplace_opportunities.id'), nullable=False)

    # Sender e receiver
    sender_type = db.Column(db.String(50), nullable=False)  # 'club' o 'sponsor'
    sender_id = db.Column(db.Integer, nullable=False)
    receiver_type = db.Column(db.String(50))
    receiver_id = db.Column(db.Integer)

    # Messaggio
    messaggio = db.Column(db.Text, nullable=False)
    tipo = db.Column(db.String(50), default='messaggio')  # messaggio, proposta, contratto, alert

    # Allegati
    allegato_url = db.Column(db.String(500))

    # Stati
    letto = db.Column(db.Boolean, default=False)
    letto_at = db.Column(db.DateTime)

    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def mark_as_read(self):
        """Segna come letto"""
        self.letto = True
        self.letto_at = datetime.utcnow()
        db.session.commit()

    def get_sender_name(self):
        """Restituisce nome mittente"""
        if self.sender_type == 'club':
            club = Club.query.get(self.sender_id)
            return club.nome if club else 'Club sconosciuto'
        elif self.sender_type == 'sponsor':
            sponsor = Sponsor.query.get(self.sender_id)
            return sponsor.ragione_sociale if sponsor else 'Sponsor sconosciuto'
        return 'Sconosciuto'

    def to_dict(self):
        """Serializza per API"""
        return {
            'id': self.id,
            'opportunity_id': self.opportunity_id,
            'sender_type': self.sender_type,
            'sender_id': self.sender_id,
            'sender_name': self.get_sender_name(),
            'receiver_type': self.receiver_type,
            'receiver_id': self.receiver_id,
            'messaggio': self.messaggio,
            'tipo': self.tipo,
            'allegato_url': self.allegato_url,
            'letto': self.letto,
            'letto_at': self.letto_at.isoformat() if self.letto_at else None,
            'created_at': self.created_at.isoformat()
        }


class OpportunityReview(db.Model):
    """Recensioni post-collaborazione"""
    __tablename__ = 'opportunity_reviews'

    id = db.Column(db.Integer, primary_key=True)
    opportunity_id = db.Column(db.Integer, db.ForeignKey('marketplace_opportunities.id'), nullable=False)
    collaboration_id = db.Column(db.Integer, db.ForeignKey('opportunity_collaborations.id'))

    # Reviewer (chi lascia recensione)
    reviewer_type = db.Column(db.String(50), nullable=False)  # 'club' o 'sponsor'
    reviewer_id = db.Column(db.Integer, nullable=False)

    # Reviewee (chi riceve recensione)
    reviewee_type = db.Column(db.String(50), nullable=False)
    reviewee_id = db.Column(db.Integer, nullable=False)

    # Review
    rating = db.Column(db.Integer, nullable=False)  # 1-5
    feedback = db.Column(db.Text)

    # Categorie rating
    rating_comunicazione = db.Column(db.Integer)  # 1-5
    rating_professionalita = db.Column(db.Integer)  # 1-5
    rating_rispetto_tempistiche = db.Column(db.Integer)  # 1-5

    # Visibilità
    pubblico = db.Column(db.Boolean, default=True)

    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Relationships
    collaboration = db.relationship('OpportunityCollaboration', backref='reviews')

    def get_reviewer_name(self):
        """Restituisce nome reviewer"""
        if self.reviewer_type == 'club':
            club = Club.query.get(self.reviewer_id)
            return club.nome if club else 'Club sconosciuto'
        elif self.reviewer_type == 'sponsor':
            sponsor = Sponsor.query.get(self.reviewer_id)
            return sponsor.ragione_sociale if sponsor else 'Sponsor sconosciuto'
        return 'Sconosciuto'

    def to_dict(self):
        """Serializza per API"""
        return {
            'id': self.id,
            'opportunity_id': self.opportunity_id,
            'collaboration_id': self.collaboration_id,
            'reviewer_type': self.reviewer_type,
            'reviewer_id': self.reviewer_id,
            'reviewer_name': self.get_reviewer_name(),
            'reviewee_type': self.reviewee_type,
            'reviewee_id': self.reviewee_id,
            'rating': self.rating,
            'feedback': self.feedback,
            'rating_comunicazione': self.rating_comunicazione,
            'rating_professionalita': self.rating_professionalita,
            'rating_rispetto_tempistiche': self.rating_rispetto_tempistiche,
            'pubblico': self.pubblico,
            'created_at': self.created_at.isoformat()
        }


class OpportunityInvite(db.Model):
    """Inviti diretti a partecipare a un'opportunità"""
    __tablename__ = 'opportunity_invites'

    id = db.Column(db.Integer, primary_key=True)
    opportunity_id = db.Column(db.Integer, db.ForeignKey('marketplace_opportunities.id'), nullable=False)

    # Mittente (chi invia l'invito - owner dell'opportunità)
    sender_type = db.Column(db.String(50), nullable=False)  # 'club' o 'sponsor'
    sender_id = db.Column(db.Integer, nullable=False)

    # Destinatario (chi riceve l'invito)
    recipient_type = db.Column(db.String(50), nullable=False)  # 'club' o 'sponsor'
    recipient_id = db.Column(db.Integer, nullable=False)

    # Contenuto invito
    messaggio = db.Column(db.Text)  # Messaggio personalizzato opzionale

    # Stati: pending, accepted, declined
    stato = db.Column(db.String(50), default='pending')

    # Tracking
    viewed_at = db.Column(db.DateTime)  # Quando il destinatario ha visto l'invito
    responded_at = db.Column(db.DateTime)  # Quando ha risposto

    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    opportunity = db.relationship('MarketplaceOpportunity', backref='invites')

    def get_sender_name(self):
        """Restituisce nome del mittente"""
        if self.sender_type == 'club':
            club = Club.query.get(self.sender_id)
            return club.nome if club else 'Club sconosciuto'
        elif self.sender_type == 'sponsor':
            sponsor = Sponsor.query.get(self.sender_id)
            return sponsor.ragione_sociale if sponsor else 'Sponsor sconosciuto'
        return 'Sconosciuto'

    def get_sender_logo(self):
        """Restituisce logo del mittente"""
        if self.sender_type == 'club':
            club = Club.query.get(self.sender_id)
            return club.logo_url if club else None
        elif self.sender_type == 'sponsor':
            sponsor = Sponsor.query.get(self.sender_id)
            return sponsor.logo_url if sponsor else None
        return None

    def get_recipient_name(self):
        """Restituisce nome del destinatario"""
        if self.recipient_type == 'club':
            club = Club.query.get(self.recipient_id)
            return club.nome if club else 'Club sconosciuto'
        elif self.recipient_type == 'sponsor':
            sponsor = Sponsor.query.get(self.recipient_id)
            return sponsor.ragione_sociale if sponsor else 'Sponsor sconosciuto'
        return 'Sconosciuto'

    def get_recipient_logo(self):
        """Restituisce logo del destinatario"""
        if self.recipient_type == 'club':
            club = Club.query.get(self.recipient_id)
            return club.logo_url if club else None
        elif self.recipient_type == 'sponsor':
            sponsor = Sponsor.query.get(self.recipient_id)
            return sponsor.logo_url if sponsor else None
        return None

    def mark_as_viewed(self):
        """Segna come visualizzato"""
        if not self.viewed_at:
            self.viewed_at = datetime.utcnow()
            db.session.commit()

    def accept(self):
        """Accetta l'invito"""
        self.stato = 'accepted'
        self.responded_at = datetime.utcnow()
        db.session.commit()

    def decline(self):
        """Rifiuta l'invito"""
        self.stato = 'declined'
        self.responded_at = datetime.utcnow()
        db.session.commit()

    def to_dict(self):
        """Serializza per API"""
        return {
            'id': self.id,
            'opportunity_id': self.opportunity_id,
            'opportunity': self.opportunity.to_dict() if self.opportunity else None,
            'sender_type': self.sender_type,
            'sender_id': self.sender_id,
            'sender_name': self.get_sender_name(),
            'sender_logo': self.get_sender_logo(),
            'recipient_type': self.recipient_type,
            'recipient_id': self.recipient_id,
            'recipient_name': self.get_recipient_name(),
            'recipient_logo': self.get_recipient_logo(),
            'messaggio': self.messaggio,
            'stato': self.stato,
            'viewed_at': self.viewed_at.isoformat() if self.viewed_at else None,
            'responded_at': self.responded_at.isoformat() if self.responded_at else None,
            'created_at': self.created_at.isoformat()
        }


# ==================== AUTOMAZIONI ====================

class Automation(db.Model):
    """Automazione configurata dal club"""
    __tablename__ = 'automations'

    id = db.Column(db.Integer, primary_key=True)
    club_id = db.Column(db.Integer, db.ForeignKey('clubs.id'), nullable=False)

    # Info base
    nome = db.Column(db.String(200), nullable=False)
    descrizione = db.Column(db.Text)
    abilitata = db.Column(db.Boolean, default=True)

    # Trigger configuration
    trigger_type = db.Column(db.String(100), nullable=False)  # lead_created, contract_expiring, scheduled, etc.
    trigger_config = db.Column(db.JSON)  # {days_before: 7, status: 'nuovo', cron: '0 9 * * *'}

    # Steps (azioni da eseguire)
    steps = db.Column(db.JSON)  # [{type, config, order, delay_minutes}]

    # Scheduling
    last_run = db.Column(db.DateTime)
    next_run = db.Column(db.DateTime)

    # Stats
    executions_count = db.Column(db.Integer, default=0)
    last_status = db.Column(db.String(50))  # success, failed, partial

    # Metadata
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relazioni
    club = db.relationship('Club', backref='automations')
    executions = db.relationship('AutomationExecution', backref='automation', cascade='all, delete-orphan', lazy='dynamic')

    def to_dict(self):
        return {
            'id': self.id,
            'club_id': self.club_id,
            'nome': self.nome,
            'descrizione': self.descrizione,
            'abilitata': self.abilitata,
            'trigger_type': self.trigger_type,
            'trigger_config': self.trigger_config,
            'steps': self.steps,
            'last_run': self.last_run.isoformat() if self.last_run else None,
            'next_run': self.next_run.isoformat() if self.next_run else None,
            'executions_count': self.executions_count,
            'last_status': self.last_status,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }


class AutomationExecution(db.Model):
    """Log di esecuzione di un'automazione"""
    __tablename__ = 'automation_executions'

    id = db.Column(db.Integer, primary_key=True)
    automation_id = db.Column(db.Integer, db.ForeignKey('automations.id'), nullable=False)

    # Status
    status = db.Column(db.String(50), default='running')  # running, completed, failed, partial

    # Trigger data (cosa ha triggerato l'automazione)
    trigger_data = db.Column(db.JSON)  # {entity_type: 'lead', entity_id: 123, ...}

    # Timing
    started_at = db.Column(db.DateTime, default=datetime.utcnow)
    completed_at = db.Column(db.DateTime)

    # Error info
    error_message = db.Column(db.Text)

    # Relazioni
    step_executions = db.relationship('AutomationStepExecution', backref='execution', cascade='all, delete-orphan', lazy='dynamic')

    def to_dict(self):
        return {
            'id': self.id,
            'automation_id': self.automation_id,
            'status': self.status,
            'trigger_data': self.trigger_data,
            'started_at': self.started_at.isoformat() if self.started_at else None,
            'completed_at': self.completed_at.isoformat() if self.completed_at else None,
            'error_message': self.error_message,
            'steps': [s.to_dict() for s in self.step_executions.order_by(AutomationStepExecution.step_index).all()]
        }


class AutomationStepExecution(db.Model):
    """Log di esecuzione di un singolo step"""
    __tablename__ = 'automation_step_executions'

    id = db.Column(db.Integer, primary_key=True)
    execution_id = db.Column(db.Integer, db.ForeignKey('automation_executions.id'), nullable=False)

    # Step info
    step_index = db.Column(db.Integer, nullable=False)
    step_type = db.Column(db.String(100), nullable=False)  # send_notification, send_email, etc.

    # Status
    status = db.Column(db.String(50), default='pending')  # pending, running, completed, failed, skipped

    # Data
    input_data = db.Column(db.JSON)  # Config dello step
    output_data = db.Column(db.JSON)  # Risultato esecuzione

    # Timing
    started_at = db.Column(db.DateTime)
    completed_at = db.Column(db.DateTime)
    scheduled_for = db.Column(db.DateTime)  # Per step con delay

    # Error
    error_message = db.Column(db.Text)

    def to_dict(self):
        return {
            'id': self.id,
            'step_index': self.step_index,
            'step_type': self.step_type,
            'status': self.status,
            'input_data': self.input_data,
            'output_data': self.output_data,
            'started_at': self.started_at.isoformat() if self.started_at else None,
            'completed_at': self.completed_at.isoformat() if self.completed_at else None,
            'scheduled_for': self.scheduled_for.isoformat() if self.scheduled_for else None,
            'error_message': self.error_message
        }


class EmailTemplate(db.Model):
    """Template email per automazioni"""
    __tablename__ = 'email_templates'

    id = db.Column(db.Integer, primary_key=True)
    club_id = db.Column(db.Integer, db.ForeignKey('clubs.id'), nullable=False)

    nome = db.Column(db.String(200), nullable=False)
    oggetto = db.Column(db.String(500), nullable=False)
    corpo_html = db.Column(db.Text, nullable=False)
    corpo_text = db.Column(db.Text)  # Versione plain text

    # Variabili disponibili per questo template
    variabili_disponibili = db.Column(db.JSON)  # ['{{lead.nome}}', '{{sponsor.email}}']

    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relazioni
    club = db.relationship('Club', backref='email_templates')

    def to_dict(self):
        return {
            'id': self.id,
            'club_id': self.club_id,
            'nome': self.nome,
            'oggetto': self.oggetto,
            'corpo_html': self.corpo_html,
            'corpo_text': self.corpo_text,
            'variabili_disponibili': self.variabili_disponibili,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }


class SMTPConfiguration(db.Model):
    """Configurazione SMTP per invio email"""
    __tablename__ = 'smtp_configurations'

    id = db.Column(db.Integer, primary_key=True)
    club_id = db.Column(db.Integer, db.ForeignKey('clubs.id'), nullable=False, unique=True)

    # Server settings
    host = db.Column(db.String(200), nullable=False)
    port = db.Column(db.Integer, default=587)
    username = db.Column(db.String(200), nullable=False)
    password_encrypted = db.Column(db.String(500), nullable=False)  # Criptata
    use_tls = db.Column(db.Boolean, default=True)

    # Sender info
    from_email = db.Column(db.String(200), nullable=False)
    from_name = db.Column(db.String(200))

    # Verification
    verified = db.Column(db.Boolean, default=False)
    verified_at = db.Column(db.DateTime)

    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relazioni
    club = db.relationship('Club', backref='smtp_config', uselist=False)

    def to_dict(self):
        return {
            'id': self.id,
            'club_id': self.club_id,
            'host': self.host,
            'port': self.port,
            'username': self.username,
            'use_tls': self.use_tls,
            'from_email': self.from_email,
            'from_name': self.from_name,
            'verified': self.verified,
            'verified_at': self.verified_at.isoformat() if self.verified_at else None,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }


# =============================================================================
# INVENTORY MANAGEMENT SYSTEM
# Sistema di gestione inventario asset sponsorizzazione
# =============================================================================

class InventoryCategory(db.Model):
    """Categorie di asset (LED, Jersey, Digital, Hospitality, etc.)"""
    __tablename__ = 'inventory_categories'

    id = db.Column(db.Integer, primary_key=True)
    club_id = db.Column(db.Integer, db.ForeignKey('clubs.id'), nullable=False)

    # Dati categoria
    nome = db.Column(db.String(100), nullable=False)
    codice = db.Column(db.String(50), nullable=False)  # led, jersey, digital, hospitality, etc.
    descrizione = db.Column(db.Text)
    icona = db.Column(db.String(50))  # icon name (faLed, faTshirt, etc.)
    colore = db.Column(db.String(20))  # hex color for UI
    ordine = db.Column(db.Integer, default=0)  # per ordinamento UI

    # Settings
    attivo = db.Column(db.Boolean, default=True)

    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relazioni
    club = db.relationship('Club', backref='inventory_categories')
    assets = db.relationship('InventoryAsset', backref='category', lazy=True, cascade='all, delete-orphan')

    def to_dict(self):
        return {
            'id': self.id,
            'club_id': self.club_id,
            'nome': self.nome,
            'codice': self.codice,
            'descrizione': self.descrizione,
            'icona': self.icona,
            'colore': self.colore,
            'ordine': self.ordine,
            'attivo': self.attivo,
            'assets_count': len(self.assets) if self.assets else 0,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }


class InventoryAsset(db.Model):
    """Asset singolo nel catalogo inventario del club"""
    __tablename__ = 'inventory_assets'

    id = db.Column(db.Integer, primary_key=True)
    club_id = db.Column(db.Integer, db.ForeignKey('clubs.id'), nullable=False)
    category_id = db.Column(db.Integer, db.ForeignKey('inventory_categories.id'), nullable=False)

    # Identificazione
    nome = db.Column(db.String(200), nullable=False)
    descrizione = db.Column(db.Text)
    descrizione_breve = db.Column(db.String(300))

    # Tipo asset
    tipo = db.Column(db.String(50), nullable=False)  # fisico, digitale, esperienza, misto

    # Dettagli fisici (se applicabile)
    posizione = db.Column(db.String(200))  # "Lato campo ovest", "Manica destra", etc.
    dimensioni = db.Column(db.String(100))  # "6m x 1m", "10cm x 5cm", etc.
    specifiche_tecniche = db.Column(db.Text)  # JSON con specifiche

    # Immagini
    immagine_principale = db.Column(db.String(500))
    immagini_gallery = db.Column(db.Text)  # JSON array di URLs

    # Disponibilità
    disponibile = db.Column(db.Boolean, default=True)
    quantita_totale = db.Column(db.Integer, default=1)  # 1 per asset unici, N per multiple unità
    quantita_disponibile = db.Column(db.Integer, default=1)

    # Pricing base
    prezzo_listino = db.Column(db.Float)  # Prezzo base di listino
    prezzo_minimo = db.Column(db.Float)  # Floor price
    valuta = db.Column(db.String(3), default='EUR')

    # Categorie merceologiche escluse (per gestione esclusività)
    categorie_escluse = db.Column(db.Text)  # JSON array: ["bevande", "automotive"]

    # Visibilità
    visibile_marketplace = db.Column(db.Boolean, default=True)
    in_evidenza = db.Column(db.Boolean, default=False)

    # Metadata
    tags = db.Column(db.String(500))  # tags separati da virgola
    note_interne = db.Column(db.Text)
    ordine = db.Column(db.Integer, default=0)
    attivo = db.Column(db.Boolean, default=True)

    # Archiviazione
    archiviato = db.Column(db.Boolean, default=False)
    data_archiviazione = db.Column(db.DateTime)
    motivo_archiviazione = db.Column(db.Text)

    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relazioni
    club = db.relationship('Club', backref='inventory_assets')
    pricing_tiers = db.relationship('AssetPricingTier', backref='asset', lazy=True, cascade='all, delete-orphan')
    availabilities = db.relationship('AssetAvailability', backref='asset', lazy=True, cascade='all, delete-orphan')
    allocations = db.relationship('AssetAllocation', backref='asset', lazy=True, cascade='all, delete-orphan')

    def to_dict(self, include_pricing=False, include_availability=False):
        import json

        # Parse JSON fields
        specifiche = None
        if self.specifiche_tecniche:
            try:
                specifiche = json.loads(self.specifiche_tecniche) if isinstance(self.specifiche_tecniche, str) else self.specifiche_tecniche
            except:
                specifiche = self.specifiche_tecniche

        gallery = None
        if self.immagini_gallery:
            try:
                gallery = json.loads(self.immagini_gallery) if isinstance(self.immagini_gallery, str) else self.immagini_gallery
            except:
                gallery = self.immagini_gallery

        categorie_escl = None
        if self.categorie_escluse:
            try:
                categorie_escl = json.loads(self.categorie_escluse) if isinstance(self.categorie_escluse, str) else self.categorie_escluse
            except:
                categorie_escl = self.categorie_escluse

        data = {
            'id': self.id,
            'club_id': self.club_id,
            'category_id': self.category_id,
            'category': self.category.to_dict() if self.category else None,
            'nome': self.nome,
            'descrizione': self.descrizione,
            'descrizione_breve': self.descrizione_breve,
            'tipo': self.tipo,
            'posizione': self.posizione,
            'dimensioni': self.dimensioni,
            'specifiche_tecniche': specifiche,
            'immagine_principale': self.immagine_principale,
            'immagini_gallery': gallery,
            'disponibile': self.disponibile,
            'quantita_totale': self.quantita_totale,
            'quantita_disponibile': self.quantita_disponibile,
            'prezzo_listino': self.prezzo_listino,
            'prezzo_minimo': self.prezzo_minimo,
            'valuta': self.valuta,
            'categorie_escluse': categorie_escl,
            'visibile_marketplace': self.visibile_marketplace,
            'in_evidenza': self.in_evidenza,
            'tags': self.tags,
            'note_interne': self.note_interne,
            'ordine': self.ordine,
            'attivo': self.attivo,
            'archiviato': self.archiviato,
            'data_archiviazione': self.data_archiviazione.isoformat() if self.data_archiviazione else None,
            'motivo_archiviazione': self.motivo_archiviazione,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
        if include_pricing and self.pricing_tiers:
            data['pricing_tiers'] = [t.to_dict() for t in self.pricing_tiers]
        if include_availability and self.availabilities:
            data['availabilities'] = [a.to_dict() for a in self.availabilities]
        return data


class AssetPricingTier(db.Model):
    """Livelli di prezzo per asset (partita normale, derby, Champions, etc.)"""
    __tablename__ = 'asset_pricing_tiers'

    id = db.Column(db.Integer, primary_key=True)
    asset_id = db.Column(db.Integer, db.ForeignKey('inventory_assets.id'), nullable=False)

    # Identificazione tier
    nome = db.Column(db.String(100), nullable=False)  # "Partita Standard", "Derby", "Champions League"
    descrizione = db.Column(db.Text)

    # Pricing
    prezzo = db.Column(db.Float, nullable=False)
    prezzo_scontato = db.Column(db.Float)  # Per promozioni
    valuta = db.Column(db.String(3), default='EUR')

    # Durata (se applicabile)
    durata_tipo = db.Column(db.String(50))  # partita, stagione, mese, anno
    durata_valore = db.Column(db.Integer)  # numero di unità

    # Condizioni
    minimo_partite = db.Column(db.Integer)  # Minimo partite per questo tier
    massimo_partite = db.Column(db.Integer)

    attivo = db.Column(db.Boolean, default=True)
    ordine = db.Column(db.Integer, default=0)

    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'asset_id': self.asset_id,
            'nome': self.nome,
            'descrizione': self.descrizione,
            'prezzo': self.prezzo,
            'prezzo_scontato': self.prezzo_scontato,
            'valuta': self.valuta,
            'durata_tipo': self.durata_tipo,
            'durata_valore': self.durata_valore,
            'minimo_partite': self.minimo_partite,
            'massimo_partite': self.massimo_partite,
            'attivo': self.attivo,
            'ordine': self.ordine
        }


class AssetAvailability(db.Model):
    """Disponibilità asset per stagione/periodo"""
    __tablename__ = 'asset_availabilities'

    id = db.Column(db.Integer, primary_key=True)
    asset_id = db.Column(db.Integer, db.ForeignKey('inventory_assets.id'), nullable=False)
    club_id = db.Column(db.Integer, db.ForeignKey('clubs.id'), nullable=False)

    # Periodo
    stagione = db.Column(db.String(20), nullable=False)  # "2024-2025"
    data_inizio = db.Column(db.Date, nullable=False)
    data_fine = db.Column(db.Date, nullable=False)

    # Disponibilità
    disponibile = db.Column(db.Boolean, default=True)
    quantita_disponibile = db.Column(db.Integer, default=1)
    quantita_allocata = db.Column(db.Integer, default=0)

    # Pricing stagionale (override)
    prezzo_stagionale = db.Column(db.Float)

    # Note
    note = db.Column(db.Text)

    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'asset_id': self.asset_id,
            'club_id': self.club_id,
            'stagione': self.stagione,
            'data_inizio': self.data_inizio.isoformat() if self.data_inizio else None,
            'data_fine': self.data_fine.isoformat() if self.data_fine else None,
            'disponibile': self.disponibile,
            'quantita_disponibile': self.quantita_disponibile,
            'quantita_allocata': self.quantita_allocata,
            'quantita_libera': self.quantita_disponibile - self.quantita_allocata,
            'prezzo_stagionale': self.prezzo_stagionale,
            'note': self.note
        }


class AssetAllocation(db.Model):
    """Allocazione asset a sponsor/contratti"""
    __tablename__ = 'asset_allocations'

    id = db.Column(db.Integer, primary_key=True)
    asset_id = db.Column(db.Integer, db.ForeignKey('inventory_assets.id'), nullable=False)
    club_id = db.Column(db.Integer, db.ForeignKey('clubs.id'), nullable=False)

    # Link a contratto (opzionale)
    contract_id = db.Column(db.Integer, db.ForeignKey('head_of_terms.id'), nullable=True)
    sponsor_id = db.Column(db.Integer, db.ForeignKey('sponsors.id'), nullable=True)

    # Periodo allocazione
    stagione = db.Column(db.String(20))
    data_inizio = db.Column(db.Date, nullable=False)
    data_fine = db.Column(db.Date, nullable=False)

    # Dettagli
    quantita = db.Column(db.Integer, default=1)
    prezzo_concordato = db.Column(db.Float)
    note = db.Column(db.Text)

    # Esclusività
    esclusivita_categoria = db.Column(db.Boolean, default=False)
    categoria_merceologica = db.Column(db.String(100))  # bevande, automotive, etc.

    # Status
    status = db.Column(db.String(50), default='attiva')  # attiva, conclusa, annullata

    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relazioni
    contract = db.relationship('HeadOfTerms', backref='asset_allocations')
    sponsor = db.relationship('Sponsor', backref='asset_allocations')

    def to_dict(self):
        return {
            'id': self.id,
            'asset_id': self.asset_id,
            'asset': self.asset.to_dict() if self.asset else None,
            'club_id': self.club_id,
            'contract_id': self.contract_id,
            'contract': {
                'id': self.contract.id,
                'nome': self.contract.nome_contratto
            } if self.contract else None,
            'sponsor_id': self.sponsor_id,
            'sponsor': {
                'id': self.sponsor.id,
                'nome': self.sponsor.ragione_sociale
            } if self.sponsor else None,
            'stagione': self.stagione,
            'data_inizio': self.data_inizio.isoformat() if self.data_inizio else None,
            'data_fine': self.data_fine.isoformat() if self.data_fine else None,
            'quantita': self.quantita,
            'prezzo_concordato': self.prezzo_concordato,
            'esclusivita_categoria': self.esclusivita_categoria,
            'categoria_merceologica': self.categoria_merceologica,
            'status': self.status,
            'note': self.note
        }


class PackageLevel(db.Model):
    """Livelli di sponsorizzazione per i package (Main, Official, Premium, Standard)"""
    __tablename__ = 'package_levels'

    id = db.Column(db.Integer, primary_key=True)
    club_id = db.Column(db.Integer, db.ForeignKey('clubs.id'), nullable=False)

    codice = db.Column(db.String(50), nullable=False)  # main, official, premium, standard
    nome = db.Column(db.String(100), nullable=False)  # Main Sponsor, Official Partner, etc.
    descrizione = db.Column(db.Text)
    colore = db.Column(db.String(20), default='#3B82F6')  # hex color
    ordine = db.Column(db.Integer, default=0)
    attivo = db.Column(db.Boolean, default=True)

    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relazioni
    club = db.relationship('Club', backref='package_levels')

    def to_dict(self):
        return {
            'id': self.id,
            'club_id': self.club_id,
            'codice': self.codice,
            'nome': self.nome,
            'descrizione': self.descrizione,
            'colore': self.colore,
            'ordine': self.ordine,
            'attivo': self.attivo
        }


class AssetPackage(db.Model):
    """Package predefiniti di asset"""
    __tablename__ = 'asset_packages'

    id = db.Column(db.Integer, primary_key=True)
    club_id = db.Column(db.Integer, db.ForeignKey('clubs.id'), nullable=False)

    # Info package
    nome = db.Column(db.String(200), nullable=False)
    codice = db.Column(db.String(50), nullable=False)  # gold, silver, bronze, custom
    descrizione = db.Column(db.Text)
    descrizione_breve = db.Column(db.String(300))

    # Livello
    livello = db.Column(db.String(50))  # main, official, premium, standard
    ordine = db.Column(db.Integer, default=0)

    # Pricing package
    prezzo_listino = db.Column(db.Float)
    prezzo_scontato = db.Column(db.Float)
    sconto_percentuale = db.Column(db.Float)  # % sconto rispetto a somma singoli
    valuta = db.Column(db.String(3), default='EUR')

    # Immagini
    immagine = db.Column(db.String(500))
    colore = db.Column(db.String(20))  # hex color

    # Visibilità
    attivo = db.Column(db.Boolean, default=True)
    visibile_marketplace = db.Column(db.Boolean, default=True)
    in_evidenza = db.Column(db.Boolean, default=False)

    # Condizioni
    disponibile_da = db.Column(db.Date)
    disponibile_fino = db.Column(db.Date)
    max_vendite = db.Column(db.Integer)  # Limite vendite
    vendite_attuali = db.Column(db.Integer, default=0)

    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relazioni
    club = db.relationship('Club', backref='asset_packages')
    items = db.relationship('AssetPackageItem', backref='package', lazy=True, cascade='all, delete-orphan')

    def to_dict(self, include_items=True):
        data = {
            'id': self.id,
            'club_id': self.club_id,
            'nome': self.nome,
            'codice': self.codice,
            'descrizione': self.descrizione,
            'descrizione_breve': self.descrizione_breve,
            'livello': self.livello,
            'ordine': self.ordine,
            'prezzo_listino': self.prezzo_listino,
            'prezzo_scontato': self.prezzo_scontato,
            'sconto_percentuale': self.sconto_percentuale,
            'valuta': self.valuta,
            'immagine': self.immagine,
            'colore': self.colore,
            'attivo': self.attivo,
            'visibile_marketplace': self.visibile_marketplace,
            'in_evidenza': self.in_evidenza,
            'disponibile_da': self.disponibile_da.isoformat() if self.disponibile_da else None,
            'disponibile_fino': self.disponibile_fino.isoformat() if self.disponibile_fino else None,
            'max_vendite': self.max_vendite,
            'vendite_attuali': self.vendite_attuali,
            'disponibile': self.max_vendite is None or self.vendite_attuali < self.max_vendite,
            'items_count': len(self.items) if self.items else 0
        }
        if include_items and self.items:
            data['items'] = [i.to_dict() for i in self.items]
            # Calcola valore totale items
            data['valore_singoli'] = sum(i.asset.prezzo_listino or 0 for i in self.items if i.asset)
        return data


class AssetPackageItem(db.Model):
    """Item singolo all'interno di un package"""
    __tablename__ = 'asset_package_items'

    id = db.Column(db.Integer, primary_key=True)
    package_id = db.Column(db.Integer, db.ForeignKey('asset_packages.id'), nullable=False)
    asset_id = db.Column(db.Integer, db.ForeignKey('inventory_assets.id'), nullable=False)

    # Quantità inclusa nel package
    quantita = db.Column(db.Integer, default=1)

    # Override pricing (opzionale)
    prezzo_override = db.Column(db.Float)

    # Note specifiche
    note = db.Column(db.Text)
    ordine = db.Column(db.Integer, default=0)

    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Relazioni
    asset = db.relationship('InventoryAsset', backref='package_items')

    def to_dict(self):
        return {
            'id': self.id,
            'package_id': self.package_id,
            'asset_id': self.asset_id,
            'asset': self.asset.to_dict() if self.asset else None,
            'quantita': self.quantita,
            'prezzo_override': self.prezzo_override,
            'note': self.note,
            'ordine': self.ordine
        }


class CategoryExclusivity(db.Model):
    """Gestione esclusività per categoria merceologica"""
    __tablename__ = 'category_exclusivities'

    id = db.Column(db.Integer, primary_key=True)
    club_id = db.Column(db.Integer, db.ForeignKey('clubs.id'), nullable=False)

    # Categoria merceologica
    categoria_merceologica = db.Column(db.String(100), nullable=False)  # bevande, automotive, tech, banking...
    nome_display = db.Column(db.String(200))  # "Bevande e Soft Drinks"
    descrizione = db.Column(db.Text)

    # Sponsor assegnato (se esclusività attiva)
    sponsor_id = db.Column(db.Integer, db.ForeignKey('sponsors.id'), nullable=True)
    contract_id = db.Column(db.Integer, db.ForeignKey('head_of_terms.id'), nullable=True)

    # Periodo esclusività
    data_inizio = db.Column(db.Date)
    data_fine = db.Column(db.Date)
    stagione = db.Column(db.String(20))

    # Valore esclusività
    valore = db.Column(db.Float)

    # Status
    attiva = db.Column(db.Boolean, default=False)  # True se assegnata a sponsor

    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relazioni
    club = db.relationship('Club', backref='category_exclusivities')
    sponsor = db.relationship('Sponsor', backref='exclusivities')
    contract = db.relationship('HeadOfTerms', backref='exclusivities')

    def to_dict(self):
        return {
            'id': self.id,
            'club_id': self.club_id,
            'categoria_merceologica': self.categoria_merceologica,
            'nome_display': self.nome_display,
            'descrizione': self.descrizione,
            'sponsor_id': self.sponsor_id,
            'sponsor': {
                'id': self.sponsor.id,
                'nome': self.sponsor.ragione_sociale
            } if self.sponsor else None,
            'contract_id': self.contract_id,
            'data_inizio': self.data_inizio.isoformat() if self.data_inizio else None,
            'data_fine': self.data_fine.isoformat() if self.data_fine else None,
            'stagione': self.stagione,
            'valore': self.valore,
            'attiva': self.attiva,
            'disponibile': not self.attiva
        }


# =============================================================================
# RIGHTS MANAGEMENT SYSTEM
# Sistema completo per la gestione dei diritti di sponsorizzazione
# =============================================================================

class RightCategory(db.Model):
    """Categorie di diritti (Naming, Kit, Digital, Broadcast, Hospitality, etc.)"""
    __tablename__ = 'right_categories'

    id = db.Column(db.Integer, primary_key=True)
    club_id = db.Column(db.Integer, db.ForeignKey('clubs.id'), nullable=False)

    # Identificazione
    codice = db.Column(db.String(50), nullable=False)  # naming, kit, digital, broadcast, hospitality, activation, ip
    nome = db.Column(db.String(200), nullable=False)
    descrizione = db.Column(db.Text)
    descrizione_breve = db.Column(db.String(300))

    # Visual
    icona = db.Column(db.String(50))  # nome icona (es. "building", "shirt", "globe")
    colore = db.Column(db.String(20))  # hex color
    immagine = db.Column(db.String(500))

    # Ordinamento e stato
    ordine = db.Column(db.Integer, default=0)
    attivo = db.Column(db.Boolean, default=True)

    # Configurazione categoria
    esclusivita_default = db.Column(db.Boolean, default=True)  # Se i diritti sono esclusivi di default
    richiede_approvazione = db.Column(db.Boolean, default=False)
    max_sponsor_categoria = db.Column(db.Integer, default=1)  # Numero max sponsor per categoria

    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relazioni
    club = db.relationship('Club', backref='right_categories')
    rights = db.relationship('Right', backref='category', lazy=True, cascade='all, delete-orphan')

    def to_dict(self, include_rights=False, include_stats=False):
        data = {
            'id': self.id,
            'club_id': self.club_id,
            'codice': self.codice,
            'nome': self.nome,
            'descrizione': self.descrizione,
            'descrizione_breve': self.descrizione_breve,
            'icona': self.icona,
            'colore': self.colore,
            'immagine': self.immagine,
            'ordine': self.ordine,
            'attivo': self.attivo,
            'esclusivita_default': self.esclusivita_default,
            'richiede_approvazione': self.richiede_approvazione,
            'max_sponsor_categoria': self.max_sponsor_categoria,
            'rights_count': len(self.rights) if self.rights else 0
        }
        if include_rights and self.rights:
            data['rights'] = [r.to_dict() for r in self.rights if r.attivo]
        if include_stats:
            active_rights = [r for r in self.rights if r.attivo] if self.rights else []
            allocated = sum(1 for r in active_rights if r.allocations and any(a.status == 'attiva' for a in r.allocations))
            data['stats'] = {
                'totale': len(active_rights),
                'allocati': allocated,
                'disponibili': len(active_rights) - allocated
            }
        return data


class Right(db.Model):
    """Diritto singolo nel catalogo"""
    __tablename__ = 'rights'

    id = db.Column(db.Integer, primary_key=True)
    club_id = db.Column(db.Integer, db.ForeignKey('clubs.id'), nullable=False)
    category_id = db.Column(db.Integer, db.ForeignKey('right_categories.id'), nullable=False)

    # Identificazione
    codice = db.Column(db.String(50), nullable=False)  # unique per club
    nome = db.Column(db.String(300), nullable=False)
    descrizione = db.Column(db.Text)
    descrizione_breve = db.Column(db.String(500))

    # Tipo specifico di diritto
    tipo = db.Column(db.String(100))  # naming_stadio, naming_centro, maglia_gara, maglia_allenamento, led_fisso, led_rotativo, etc.
    sottotipo = db.Column(db.String(100))  # ulteriore specificazione

    # Dettagli fisici/tecnici
    posizione = db.Column(db.String(300))  # "Fronte maglia", "Manica destra", "LED Curva Nord"
    dimensioni = db.Column(db.String(100))  # "20cm x 10cm", "6m x 1m"
    specifiche_tecniche = db.Column(db.Text)  # JSON con specifiche dettagliate

    # Media
    immagine_principale = db.Column(db.String(500))
    immagini_gallery = db.Column(db.Text)  # JSON array di URLs
    video_presentazione = db.Column(db.String(500))
    documento_specifiche = db.Column(db.String(500))  # PDF con specifiche

    # ==================== ESCLUSIVITÀ ====================
    esclusivo = db.Column(db.Boolean, default=True)  # Se il diritto è esclusivo
    esclusivita_settoriale = db.Column(db.Boolean, default=True)  # Esclusività per settore merceologico
    settori_esclusi = db.Column(db.Text)  # JSON array settori che non possono acquistare
    max_allocazioni = db.Column(db.Integer, default=1)  # Numero max di allocazioni contemporanee

    # ==================== TERRITORIO ====================
    territorio_disponibile = db.Column(db.String(50), default='world')  # world, europe, italy, region
    territori_inclusi = db.Column(db.Text)  # JSON array: ["IT", "FR", "ES"] o ["Lombardia", "Piemonte"]
    territori_esclusi = db.Column(db.Text)  # JSON array territori non disponibili

    # ==================== DURATA ====================
    durata_minima_mesi = db.Column(db.Integer)  # Durata minima contratto
    durata_massima_mesi = db.Column(db.Integer)  # Durata massima
    rinnovo_automatico = db.Column(db.Boolean, default=False)
    preavviso_disdetta_giorni = db.Column(db.Integer, default=90)

    # ==================== SUBLICENZA ====================
    sublicenziabile = db.Column(db.Boolean, default=False)
    condizioni_sublicenza = db.Column(db.Text)  # Condizioni per sublicenza
    percentuale_sublicenza = db.Column(db.Float)  # % club su sublicenza

    # ==================== PRICING ====================
    prezzo_listino = db.Column(db.Float)
    prezzo_minimo = db.Column(db.Float)  # Floor price
    valuta = db.Column(db.String(3), default='EUR')
    prezzo_per = db.Column(db.String(50), default='stagione')  # stagione, anno, mese, partita

    # Sconti per durata
    sconto_biennale = db.Column(db.Float)  # % sconto per 2 anni
    sconto_triennale = db.Column(db.Float)  # % sconto per 3+ anni

    # ==================== VISIBILITÀ E STATO ====================
    disponibile = db.Column(db.Boolean, default=True)
    visibile_marketplace = db.Column(db.Boolean, default=True)
    in_evidenza = db.Column(db.Boolean, default=False)
    riservato = db.Column(db.Boolean, default=False)  # Solo su invito

    # Status
    status = db.Column(db.String(50), default='disponibile')  # disponibile, allocato, riservato, sospeso
    attivo = db.Column(db.Boolean, default=True)

    # Ordinamento
    ordine = db.Column(db.Integer, default=0)
    priorita = db.Column(db.Integer, default=0)  # Per ordinamento in offerte

    # Metadata
    tags = db.Column(db.String(500))
    note_interne = db.Column(db.Text)

    # Stagione corrente
    stagione_corrente = db.Column(db.String(20))  # "2024-2025"

    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relazioni
    club = db.relationship('Club', backref='rights')
    allocations = db.relationship('RightAllocation', backref='right', lazy=True, cascade='all, delete-orphan')
    pricing_tiers = db.relationship('RightPricingTier', backref='right', lazy=True, cascade='all, delete-orphan')
    availabilities = db.relationship('RightAvailability', backref='right', lazy=True, cascade='all, delete-orphan')

    def to_dict(self, include_category=True, include_allocations=False, include_pricing=False):
        data = {
            'id': self.id,
            'club_id': self.club_id,
            'category_id': self.category_id,
            'codice': self.codice,
            'nome': self.nome,
            'descrizione': self.descrizione,
            'descrizione_breve': self.descrizione_breve,
            'tipo': self.tipo,
            'sottotipo': self.sottotipo,
            'posizione': self.posizione,
            'dimensioni': self.dimensioni,
            'specifiche_tecniche': self.specifiche_tecniche,
            'immagine_principale': self.immagine_principale,
            'immagini_gallery': self.immagini_gallery,
            'video_presentazione': self.video_presentazione,
            'documento_specifiche': self.documento_specifiche,
            # Esclusività
            'esclusivo': self.esclusivo,
            'esclusivita_settoriale': self.esclusivita_settoriale,
            'settori_esclusi': self.settori_esclusi,
            'max_allocazioni': self.max_allocazioni,
            # Territorio
            'territorio_disponibile': self.territorio_disponibile,
            'territori_inclusi': self.territori_inclusi,
            'territori_esclusi': self.territori_esclusi,
            # Durata
            'durata_minima_mesi': self.durata_minima_mesi,
            'durata_massima_mesi': self.durata_massima_mesi,
            'rinnovo_automatico': self.rinnovo_automatico,
            'preavviso_disdetta_giorni': self.preavviso_disdetta_giorni,
            # Sublicenza
            'sublicenziabile': self.sublicenziabile,
            'condizioni_sublicenza': self.condizioni_sublicenza,
            'percentuale_sublicenza': self.percentuale_sublicenza,
            # Pricing
            'prezzo_listino': self.prezzo_listino,
            'prezzo_minimo': self.prezzo_minimo,
            'valuta': self.valuta,
            'prezzo_per': self.prezzo_per,
            'sconto_biennale': self.sconto_biennale,
            'sconto_triennale': self.sconto_triennale,
            # Visibilità
            'disponibile': self.disponibile,
            'visibile_marketplace': self.visibile_marketplace,
            'in_evidenza': self.in_evidenza,
            'riservato': self.riservato,
            'status': self.status,
            'attivo': self.attivo,
            'ordine': self.ordine,
            'priorita': self.priorita,
            'tags': self.tags,
            'stagione_corrente': self.stagione_corrente,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
        if include_category and self.category:
            data['category'] = {
                'id': self.category.id,
                'codice': self.category.codice,
                'nome': self.category.nome,
                'icona': self.category.icona,
                'colore': self.category.colore
            }
        if include_allocations and self.allocations:
            data['allocations'] = [a.to_dict() for a in self.allocations]
            data['allocazioni_attive'] = sum(1 for a in self.allocations if a.status == 'attiva')
        if include_pricing and self.pricing_tiers:
            data['pricing_tiers'] = [p.to_dict() for p in self.pricing_tiers]
        return data


class RightPricingTier(db.Model):
    """Tier di prezzo per diritti (partita standard, derby, Champions, etc.)"""
    __tablename__ = 'right_pricing_tiers'

    id = db.Column(db.Integer, primary_key=True)
    right_id = db.Column(db.Integer, db.ForeignKey('rights.id'), nullable=False)

    # Identificazione tier
    nome = db.Column(db.String(100), nullable=False)
    codice = db.Column(db.String(50), nullable=False)  # standard, derby, champions, finale
    descrizione = db.Column(db.Text)

    # Pricing
    prezzo = db.Column(db.Float, nullable=False)
    prezzo_scontato = db.Column(db.Float)
    valuta = db.Column(db.String(3), default='EUR')

    # Moltiplicatore rispetto a prezzo base
    moltiplicatore = db.Column(db.Float, default=1.0)  # 1.5x per derby, 2x per Champions

    # Condizioni applicazione
    competizioni = db.Column(db.Text)  # JSON: ["Serie A", "Champions League"]
    partite_specifiche = db.Column(db.Text)  # JSON: ["Derby", "Finale"]
    date_range = db.Column(db.Text)  # JSON: {"da": "2024-12-20", "a": "2025-01-05"}

    attivo = db.Column(db.Boolean, default=True)
    ordine = db.Column(db.Integer, default=0)

    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'right_id': self.right_id,
            'nome': self.nome,
            'codice': self.codice,
            'descrizione': self.descrizione,
            'prezzo': self.prezzo,
            'prezzo_scontato': self.prezzo_scontato,
            'valuta': self.valuta,
            'moltiplicatore': self.moltiplicatore,
            'competizioni': self.competizioni,
            'partite_specifiche': self.partite_specifiche,
            'date_range': self.date_range,
            'attivo': self.attivo,
            'ordine': self.ordine
        }


class RightAvailability(db.Model):
    """Disponibilità diritto per stagione/periodo"""
    __tablename__ = 'right_availabilities'

    id = db.Column(db.Integer, primary_key=True)
    right_id = db.Column(db.Integer, db.ForeignKey('rights.id'), nullable=False)
    club_id = db.Column(db.Integer, db.ForeignKey('clubs.id'), nullable=False)

    # Periodo
    stagione = db.Column(db.String(20), nullable=False)  # "2024-2025"
    data_inizio = db.Column(db.Date, nullable=False)
    data_fine = db.Column(db.Date, nullable=False)

    # Disponibilità
    disponibile = db.Column(db.Boolean, default=True)
    note = db.Column(db.Text)

    # Override pricing stagionale
    prezzo_stagionale = db.Column(db.Float)

    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'right_id': self.right_id,
            'club_id': self.club_id,
            'stagione': self.stagione,
            'data_inizio': self.data_inizio.isoformat() if self.data_inizio else None,
            'data_fine': self.data_fine.isoformat() if self.data_fine else None,
            'disponibile': self.disponibile,
            'prezzo_stagionale': self.prezzo_stagionale,
            'note': self.note
        }


class RightAllocation(db.Model):
    """Allocazione diritto a sponsor/contratto"""
    __tablename__ = 'right_allocations'

    id = db.Column(db.Integer, primary_key=True)
    right_id = db.Column(db.Integer, db.ForeignKey('rights.id'), nullable=False)
    club_id = db.Column(db.Integer, db.ForeignKey('clubs.id'), nullable=False)

    # Link a contratto e sponsor
    contract_id = db.Column(db.Integer, db.ForeignKey('head_of_terms.id'), nullable=True)
    sponsor_id = db.Column(db.Integer, db.ForeignKey('sponsors.id'), nullable=True)

    # Periodo allocazione
    stagione = db.Column(db.String(20))
    data_inizio = db.Column(db.Date, nullable=False)
    data_fine = db.Column(db.Date, nullable=False)

    # ==================== TERRITORIO ALLOCATO ====================
    territorio = db.Column(db.String(50), default='world')  # world, europe, italy, region
    territori_specifici = db.Column(db.Text)  # JSON array: ["IT", "FR"]

    # ==================== ESCLUSIVITÀ ====================
    esclusivita_settoriale = db.Column(db.Boolean, default=True)
    settore_merceologico = db.Column(db.String(100))  # bevande, automotive, tech, banking
    sottosettore = db.Column(db.String(100))  # soft_drinks, energy_drinks

    # ==================== SUBLICENZA ====================
    sublicenza_concessa = db.Column(db.Boolean, default=False)
    sublicenziatari = db.Column(db.Text)  # JSON array di sponsor sublicenziatari
    condizioni_sublicenza_specifiche = db.Column(db.Text)

    # ==================== PRICING ====================
    prezzo_concordato = db.Column(db.Float)
    valuta = db.Column(db.String(3), default='EUR')
    modalita_pagamento = db.Column(db.String(100))  # unica_soluzione, rate_trimestrali, rate_mensili
    note_pagamento = db.Column(db.Text)

    # ==================== STATUS ====================
    status = db.Column(db.String(50), default='attiva')  # bozza, in_approvazione, attiva, sospesa, conclusa, annullata

    # ==================== RINNOVO ====================
    rinnovo_automatico = db.Column(db.Boolean, default=False)
    data_preavviso_scadenza = db.Column(db.Date)
    preavviso_inviato = db.Column(db.Boolean, default=False)

    # Note
    note = db.Column(db.Text)
    note_interne = db.Column(db.Text)

    # Approvazione
    approvato_da = db.Column(db.String(100))
    data_approvazione = db.Column(db.DateTime)

    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    created_by = db.Column(db.String(100))

    # Relazioni
    club = db.relationship('Club', backref='right_allocations')
    contract = db.relationship('HeadOfTerms', backref='right_allocations')
    sponsor = db.relationship('Sponsor', backref='right_allocations')

    def to_dict(self, include_right=True, include_sponsor=True):
        data = {
            'id': self.id,
            'right_id': self.right_id,
            'club_id': self.club_id,
            'contract_id': self.contract_id,
            'sponsor_id': self.sponsor_id,
            'stagione': self.stagione,
            'data_inizio': self.data_inizio.isoformat() if self.data_inizio else None,
            'data_fine': self.data_fine.isoformat() if self.data_fine else None,
            # Territorio
            'territorio': self.territorio,
            'territori_specifici': self.territori_specifici,
            # Esclusività
            'esclusivita_settoriale': self.esclusivita_settoriale,
            'settore_merceologico': self.settore_merceologico,
            'sottosettore': self.sottosettore,
            # Sublicenza
            'sublicenza_concessa': self.sublicenza_concessa,
            'sublicenziatari': self.sublicenziatari,
            # Pricing
            'prezzo_concordato': self.prezzo_concordato,
            'valuta': self.valuta,
            'modalita_pagamento': self.modalita_pagamento,
            # Status
            'status': self.status,
            'rinnovo_automatico': self.rinnovo_automatico,
            'note': self.note,
            'approvato_da': self.approvato_da,
            'data_approvazione': self.data_approvazione.isoformat() if self.data_approvazione else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
        if include_right and self.right:
            data['right'] = {
                'id': self.right.id,
                'codice': self.right.codice,
                'nome': self.right.nome,
                'tipo': self.right.tipo,
                'categoria': self.right.category.nome if self.right.category else None,
                'immagine': self.right.immagine_principale
            }
        if include_sponsor and self.sponsor:
            data['sponsor'] = {
                'id': self.sponsor.id,
                'nome': self.sponsor.ragione_sociale,
                'logo': self.sponsor.logo_url,
                'settore': self.sponsor.settore_merceologico
            }
        if self.contract:
            data['contract'] = {
                'id': self.contract.id,
                'nome': self.contract.nome_contratto
            }
        return data


class SectorExclusivity(db.Model):
    """Gestione esclusività per settore merceologico a livello globale club"""
    __tablename__ = 'sector_exclusivities'

    id = db.Column(db.Integer, primary_key=True)
    club_id = db.Column(db.Integer, db.ForeignKey('clubs.id'), nullable=False)

    # Settore merceologico
    settore_codice = db.Column(db.String(50), nullable=False)  # bevande, automotive, tech, banking, insurance, energy, food, fashion, telecom
    settore_nome = db.Column(db.String(200), nullable=False)
    descrizione = db.Column(db.Text)
    icona = db.Column(db.String(50))
    colore = db.Column(db.String(20))

    # Sottosettori (opzionale)
    sottosettori = db.Column(db.Text)  # JSON: [{"codice": "soft_drinks", "nome": "Soft Drinks"}, ...]

    # Sponsor assegnato (se esclusività attiva)
    sponsor_id = db.Column(db.Integer, db.ForeignKey('sponsors.id'), nullable=True)
    contract_id = db.Column(db.Integer, db.ForeignKey('head_of_terms.id'), nullable=True)

    # Periodo esclusività
    stagione = db.Column(db.String(20))
    data_inizio = db.Column(db.Date)
    data_fine = db.Column(db.Date)

    # Territorio esclusività
    territorio = db.Column(db.String(50), default='world')
    territori_specifici = db.Column(db.Text)

    # Valore esclusività
    valore = db.Column(db.Float)
    valuta = db.Column(db.String(3), default='EUR')

    # Status
    status = db.Column(db.String(50), default='disponibile')  # disponibile, allocata, riservata
    attiva = db.Column(db.Boolean, default=False)

    # Note
    note = db.Column(db.Text)

    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relazioni
    club = db.relationship('Club', backref='sector_exclusivities')
    sponsor = db.relationship('Sponsor', backref='sector_exclusivities')
    contract = db.relationship('HeadOfTerms', backref='sector_exclusivities')

    def to_dict(self, include_sponsor=True):
        data = {
            'id': self.id,
            'club_id': self.club_id,
            'settore_codice': self.settore_codice,
            'settore_nome': self.settore_nome,
            'descrizione': self.descrizione,
            'icona': self.icona,
            'colore': self.colore,
            'sottosettori': self.sottosettori,
            'sponsor_id': self.sponsor_id,
            'contract_id': self.contract_id,
            'stagione': self.stagione,
            'data_inizio': self.data_inizio.isoformat() if self.data_inizio else None,
            'data_fine': self.data_fine.isoformat() if self.data_fine else None,
            'territorio': self.territorio,
            'territori_specifici': self.territori_specifici,
            'valore': self.valore,
            'valuta': self.valuta,
            'status': self.status,
            'attiva': self.attiva,
            'disponibile': not self.attiva,
            'note': self.note
        }
        if include_sponsor and self.sponsor:
            data['sponsor'] = {
                'id': self.sponsor.id,
                'nome': self.sponsor.ragione_sociale,
                'logo': self.sponsor.logo_url
            }
        if self.contract:
            data['contract'] = {
                'id': self.contract.id,
                'nome': self.contract.nome_contratto
            }
        return data


class RightConflict(db.Model):
    """Conflitti rilevati tra allocazioni di diritti"""
    __tablename__ = 'right_conflicts'

    id = db.Column(db.Integer, primary_key=True)
    club_id = db.Column(db.Integer, db.ForeignKey('clubs.id'), nullable=False)

    # Tipo conflitto
    tipo_conflitto = db.Column(db.String(50), nullable=False)  # settore, territorio, esclusivita, sovrapposizione

    # Entità coinvolte
    right_id = db.Column(db.Integer, db.ForeignKey('rights.id'), nullable=True)
    allocation_id_1 = db.Column(db.Integer, db.ForeignKey('right_allocations.id'), nullable=True)
    allocation_id_2 = db.Column(db.Integer, db.ForeignKey('right_allocations.id'), nullable=True)
    sector_exclusivity_id = db.Column(db.Integer, db.ForeignKey('sector_exclusivities.id'), nullable=True)

    # Sponsor coinvolti
    sponsor_id_1 = db.Column(db.Integer, db.ForeignKey('sponsors.id'), nullable=True)
    sponsor_id_2 = db.Column(db.Integer, db.ForeignKey('sponsors.id'), nullable=True)

    # Dettagli conflitto
    descrizione = db.Column(db.Text, nullable=False)
    dettagli = db.Column(db.Text)  # JSON con dettagli tecnici

    # Severità
    severita = db.Column(db.String(20), default='warning')  # info, warning, critical, blocking

    # Periodo conflitto
    data_inizio_conflitto = db.Column(db.Date)
    data_fine_conflitto = db.Column(db.Date)

    # Status
    status = db.Column(db.String(50), default='aperto')  # aperto, in_revisione, risolto, ignorato
    risoluzione = db.Column(db.Text)
    risolto_da = db.Column(db.String(100))
    data_risoluzione = db.Column(db.DateTime)

    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relazioni
    club = db.relationship('Club', backref='right_conflicts')
    right = db.relationship('Right', backref='conflicts')
    sponsor_1 = db.relationship('Sponsor', foreign_keys=[sponsor_id_1], backref='conflicts_as_sponsor_1')
    sponsor_2 = db.relationship('Sponsor', foreign_keys=[sponsor_id_2], backref='conflicts_as_sponsor_2')

    def to_dict(self):
        return {
            'id': self.id,
            'club_id': self.club_id,
            'tipo_conflitto': self.tipo_conflitto,
            'right_id': self.right_id,
            'right': {
                'id': self.right.id,
                'nome': self.right.nome,
                'codice': self.right.codice
            } if self.right else None,
            'allocation_id_1': self.allocation_id_1,
            'allocation_id_2': self.allocation_id_2,
            'sector_exclusivity_id': self.sector_exclusivity_id,
            'sponsor_1': {
                'id': self.sponsor_1.id,
                'nome': self.sponsor_1.ragione_sociale
            } if self.sponsor_1 else None,
            'sponsor_2': {
                'id': self.sponsor_2.id,
                'nome': self.sponsor_2.ragione_sociale
            } if self.sponsor_2 else None,
            'descrizione': self.descrizione,
            'dettagli': self.dettagli,
            'severita': self.severita,
            'data_inizio_conflitto': self.data_inizio_conflitto.isoformat() if self.data_inizio_conflitto else None,
            'data_fine_conflitto': self.data_fine_conflitto.isoformat() if self.data_fine_conflitto else None,
            'status': self.status,
            'risoluzione': self.risoluzione,
            'risolto_da': self.risolto_da,
            'data_risoluzione': self.data_risoluzione.isoformat() if self.data_risoluzione else None,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }


class RightPackage(db.Model):
    """Package di diritti predefiniti"""
    __tablename__ = 'right_packages'

    id = db.Column(db.Integer, primary_key=True)
    club_id = db.Column(db.Integer, db.ForeignKey('clubs.id'), nullable=False)

    # Info package
    codice = db.Column(db.String(50), nullable=False)  # title_sponsor, main_sponsor, official_partner, premium_partner, supplier
    nome = db.Column(db.String(200), nullable=False)
    descrizione = db.Column(db.Text)
    descrizione_breve = db.Column(db.String(300))

    # Livello (per ordinamento e gerarchia)
    livello = db.Column(db.Integer, default=0)  # 0 = più alto (Title), 5 = più basso (Supplier)
    ordine = db.Column(db.Integer, default=0)

    # Visual
    colore = db.Column(db.String(20))
    icona = db.Column(db.String(50))
    immagine = db.Column(db.String(500))
    badge_url = db.Column(db.String(500))  # Badge "Official Partner" etc.

    # Pricing
    prezzo_listino = db.Column(db.Float)
    prezzo_minimo = db.Column(db.Float)
    prezzo_scontato = db.Column(db.Float)
    sconto_percentuale = db.Column(db.Float)
    valuta = db.Column(db.String(3), default='EUR')

    # Condizioni
    esclusivo = db.Column(db.Boolean, default=True)  # Solo 1 sponsor può avere questo package
    max_vendite = db.Column(db.Integer, default=1)
    vendite_attuali = db.Column(db.Integer, default=0)

    # Durata default
    durata_default_mesi = db.Column(db.Integer, default=12)

    # Visibilità
    attivo = db.Column(db.Boolean, default=True)
    visibile_marketplace = db.Column(db.Boolean, default=True)
    in_evidenza = db.Column(db.Boolean, default=False)

    # Stagione
    stagione = db.Column(db.String(20))
    disponibile_da = db.Column(db.Date)
    disponibile_fino = db.Column(db.Date)

    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relazioni
    club = db.relationship('Club', backref='right_packages')
    items = db.relationship('RightPackageItem', backref='package', lazy=True, cascade='all, delete-orphan')

    def to_dict(self, include_items=True, include_stats=False):
        data = {
            'id': self.id,
            'club_id': self.club_id,
            'codice': self.codice,
            'nome': self.nome,
            'descrizione': self.descrizione,
            'descrizione_breve': self.descrizione_breve,
            'livello': self.livello,
            'ordine': self.ordine,
            'colore': self.colore,
            'icona': self.icona,
            'immagine': self.immagine,
            'badge_url': self.badge_url,
            'prezzo_listino': self.prezzo_listino,
            'prezzo_minimo': self.prezzo_minimo,
            'prezzo_scontato': self.prezzo_scontato,
            'sconto_percentuale': self.sconto_percentuale,
            'valuta': self.valuta,
            'esclusivo': self.esclusivo,
            'max_vendite': self.max_vendite,
            'vendite_attuali': self.vendite_attuali,
            'disponibile': self.max_vendite is None or self.vendite_attuali < self.max_vendite,
            'durata_default_mesi': self.durata_default_mesi,
            'attivo': self.attivo,
            'visibile_marketplace': self.visibile_marketplace,
            'in_evidenza': self.in_evidenza,
            'stagione': self.stagione,
            'disponibile_da': self.disponibile_da.isoformat() if self.disponibile_da else None,
            'disponibile_fino': self.disponibile_fino.isoformat() if self.disponibile_fino else None,
            'items_count': len(self.items) if self.items else 0
        }
        if include_items and self.items:
            data['items'] = [i.to_dict() for i in sorted(self.items, key=lambda x: x.ordine)]
            # Calcola valore totale items
            data['valore_singoli'] = sum(
                i.right.prezzo_listino or 0 for i in self.items if i.right and i.right.prezzo_listino
            )
        return data


class RightPackageItem(db.Model):
    """Item singolo in un package di diritti"""
    __tablename__ = 'right_package_items'

    id = db.Column(db.Integer, primary_key=True)
    package_id = db.Column(db.Integer, db.ForeignKey('right_packages.id'), nullable=False)
    right_id = db.Column(db.Integer, db.ForeignKey('rights.id'), nullable=False)

    # Quantità (per diritti multipli)
    quantita = db.Column(db.Integer, default=1)

    # Configurazione specifica nel package
    incluso = db.Column(db.Boolean, default=True)  # Se è incluso o opzionale
    opzionale = db.Column(db.Boolean, default=False)
    prezzo_aggiuntivo = db.Column(db.Float)  # Se opzionale, prezzo extra

    # Note
    note = db.Column(db.Text)
    condizioni_specifiche = db.Column(db.Text)

    ordine = db.Column(db.Integer, default=0)

    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Relazioni
    right = db.relationship('Right', backref='package_items')

    def to_dict(self, include_right=True):
        data = {
            'id': self.id,
            'package_id': self.package_id,
            'right_id': self.right_id,
            'quantita': self.quantita,
            'incluso': self.incluso,
            'opzionale': self.opzionale,
            'prezzo_aggiuntivo': self.prezzo_aggiuntivo,
            'note': self.note,
            'condizioni_specifiche': self.condizioni_specifiche,
            'ordine': self.ordine
        }
        if include_right and self.right:
            data['right'] = self.right.to_dict(include_category=True)
        return data


# =============================================================================
# PROPOSAL BUILDER - Sistema di creazione proposte commerciali
# =============================================================================

class ProposalTemplate(db.Model):
    """Template riutilizzabili per proposte commerciali"""
    __tablename__ = 'proposal_templates'

    id = db.Column(db.Integer, primary_key=True)
    club_id = db.Column(db.Integer, db.ForeignKey('clubs.id'), nullable=False)

    # Identificazione
    nome = db.Column(db.String(200), nullable=False)
    descrizione = db.Column(db.Text)
    codice = db.Column(db.String(50))  # TMPL-001

    # Tipologia
    tipologia = db.Column(db.String(50))  # main_sponsor, official_partner, technical, media, etc.
    target_settore = db.Column(db.String(100))  # Settore merceologico target

    # Contenuto template
    intestazione = db.Column(db.Text)  # Testo introduttivo
    descrizione_club = db.Column(db.Text)  # Presentazione club
    proposta_valore = db.Column(db.Text)  # Value proposition
    termini_standard = db.Column(db.Text)  # Termini e condizioni
    note_legali = db.Column(db.Text)  # Note legali
    footer = db.Column(db.Text)  # Footer proposta

    # Stile e branding
    colore_primario = db.Column(db.String(7), default='#1A1A1A')
    colore_secondario = db.Column(db.String(7), default='#85FF00')
    logo_header = db.Column(db.String(500))
    sfondo_copertina = db.Column(db.String(500))

    # Sezioni predefinite (JSON array)
    sezioni_default = db.Column(db.Text)  # JSON: ["intro", "club", "assets", "rights", "pricing", "terms"]

    # Asset/Rights predefiniti (JSON)
    items_default = db.Column(db.Text)  # JSON array di item_id e tipo

    # Pricing
    valore_minimo = db.Column(db.Float)
    valore_massimo = db.Column(db.Float)
    durata_default = db.Column(db.Integer)  # In mesi

    # Status
    attivo = db.Column(db.Boolean, default=True)
    uso_interno = db.Column(db.Boolean, default=False)  # Solo per uso interno

    # Stats
    utilizzi = db.Column(db.Integer, default=0)

    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    created_by = db.Column(db.String(100))

    # Relazioni
    club = db.relationship('Club', backref='proposal_templates')

    def to_dict(self, include_items=False):
        import json
        data = {
            'id': self.id,
            'club_id': self.club_id,
            'nome': self.nome,
            'descrizione': self.descrizione,
            'codice': self.codice,
            'tipologia': self.tipologia,
            'target_settore': self.target_settore,
            'intestazione': self.intestazione,
            'descrizione_club': self.descrizione_club,
            'proposta_valore': self.proposta_valore,
            'termini_standard': self.termini_standard,
            'note_legali': self.note_legali,
            'footer': self.footer,
            'colore_primario': self.colore_primario,
            'colore_secondario': self.colore_secondario,
            'logo_header': self.logo_header,
            'sfondo_copertina': self.sfondo_copertina,
            'sezioni_default': json.loads(self.sezioni_default) if self.sezioni_default else [],
            'items_default': json.loads(self.items_default) if self.items_default else [],
            'valore_minimo': self.valore_minimo,
            'valore_massimo': self.valore_massimo,
            'durata_default': self.durata_default,
            'attivo': self.attivo,
            'uso_interno': self.uso_interno,
            'utilizzi': self.utilizzi,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'created_by': self.created_by
        }
        return data


class Proposal(db.Model):
    """Proposta commerciale per sponsor"""
    __tablename__ = 'proposals'

    id = db.Column(db.Integer, primary_key=True)
    club_id = db.Column(db.Integer, db.ForeignKey('clubs.id'), nullable=False)
    template_id = db.Column(db.Integer, db.ForeignKey('proposal_templates.id'))
    lead_id = db.Column(db.Integer, db.ForeignKey('leads.id'))  # Se collegata a lead
    sponsor_id = db.Column(db.Integer, db.ForeignKey('sponsors.id'))  # Se sponsor esistente

    # Identificazione
    codice = db.Column(db.String(50), unique=True)  # PROP-2024-001
    titolo = db.Column(db.String(300), nullable=False)
    sottotitolo = db.Column(db.String(300))

    # Destinatario
    destinatario_azienda = db.Column(db.String(200))
    destinatario_nome = db.Column(db.String(100))
    destinatario_ruolo = db.Column(db.String(100))
    destinatario_email = db.Column(db.String(120))
    destinatario_telefono = db.Column(db.String(30))
    settore_merceologico = db.Column(db.String(100))

    # Status workflow
    stato = db.Column(db.String(30), default='bozza')  # bozza, inviata, visualizzata, in_trattativa, accettata, rifiutata, scaduta
    priorita = db.Column(db.String(20), default='media')  # bassa, media, alta, urgente

    # Contenuto
    messaggio_introduttivo = db.Column(db.Text)
    descrizione_opportunita = db.Column(db.Text)
    proposta_valore = db.Column(db.Text)
    termini_condizioni = db.Column(db.Text)
    note_interne = db.Column(db.Text)  # Non visibili al destinatario

    # Pricing
    valore_totale = db.Column(db.Float, default=0)
    valuta = db.Column(db.String(3), default='EUR')
    sconto_percentuale = db.Column(db.Float, default=0)
    sconto_valore = db.Column(db.Float, default=0)
    valore_finale = db.Column(db.Float, default=0)

    # Modalità pagamento
    modalita_pagamento = db.Column(db.String(100))  # unica_soluzione, rate, milestone
    numero_rate = db.Column(db.Integer)
    dettaglio_pagamento = db.Column(db.Text)  # JSON con dettagli rate

    # Durata partnership
    durata_mesi = db.Column(db.Integer)
    data_inizio_proposta = db.Column(db.Date)
    data_fine_proposta = db.Column(db.Date)
    stagioni = db.Column(db.String(100))  # es. "2024/25, 2025/26"

    # Scadenza proposta
    data_scadenza = db.Column(db.DateTime)
    giorni_validita = db.Column(db.Integer, default=30)

    # Versioning
    versione_corrente = db.Column(db.Integer, default=1)

    # Link condivisione
    link_condivisione = db.Column(db.String(100))  # UUID per link pubblico
    link_attivo = db.Column(db.Boolean, default=True)
    richiede_password = db.Column(db.Boolean, default=False)
    password_hash = db.Column(db.String(255))

    # Branding
    colore_primario = db.Column(db.String(7))
    colore_secondario = db.Column(db.String(7))
    logo_header = db.Column(db.String(500))
    sfondo_copertina = db.Column(db.String(500))

    # Tracking
    visualizzazioni = db.Column(db.Integer, default=0)
    ultima_visualizzazione = db.Column(db.DateTime)
    tempo_visualizzazione_totale = db.Column(db.Integer, default=0)  # In secondi
    download_pdf = db.Column(db.Integer, default=0)

    # Date workflow
    data_invio = db.Column(db.DateTime)
    data_prima_visualizzazione = db.Column(db.DateTime)
    data_risposta = db.Column(db.DateTime)
    data_accettazione = db.Column(db.DateTime)
    data_rifiuto = db.Column(db.DateTime)

    # Motivo rifiuto
    motivo_rifiuto = db.Column(db.Text)
    feedback_cliente = db.Column(db.Text)

    # Conversione
    convertita_in_contratto = db.Column(db.Boolean, default=False)
    contratto_id = db.Column(db.Integer, db.ForeignKey('head_of_terms.id'))

    # Metadata
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    created_by = db.Column(db.String(100))
    assigned_to = db.Column(db.String(100))  # Commercial responsabile

    # Relazioni
    club = db.relationship('Club', backref='proposals')
    template = db.relationship('ProposalTemplate', backref='proposals')
    lead = db.relationship('Lead', backref='proposals')
    sponsor = db.relationship('Sponsor', backref='proposals')
    items = db.relationship('ProposalItem', backref='proposal', lazy='dynamic', cascade='all, delete-orphan')
    versions = db.relationship('ProposalVersion', backref='proposal', lazy='dynamic', cascade='all, delete-orphan')
    tracking = db.relationship('ProposalTracking', backref='proposal', lazy='dynamic', cascade='all, delete-orphan')
    comments = db.relationship('ProposalComment', backref='proposal', lazy='dynamic', cascade='all, delete-orphan')

    def generate_codice(self, club_id):
        """Genera codice univoco per la proposta"""
        import datetime
        year = datetime.datetime.now().year
        count = Proposal.query.filter_by(club_id=club_id).count() + 1
        return f"PROP-{year}-{count:04d}"

    def generate_link(self):
        """Genera link di condivisione univoco"""
        import uuid
        self.link_condivisione = str(uuid.uuid4())[:12]
        return self.link_condivisione

    def calcola_totali(self):
        """Calcola i totali della proposta"""
        totale = sum(item.valore_totale or 0 for item in self.items)
        self.valore_totale = totale
        if self.sconto_percentuale:
            self.sconto_valore = totale * (self.sconto_percentuale / 100)
        self.valore_finale = totale - (self.sconto_valore or 0)
        return self.valore_finale

    def to_dict(self, include_items=False, include_tracking=False):
        data = {
            'id': self.id,
            'club_id': self.club_id,
            'template_id': self.template_id,
            'lead_id': self.lead_id,
            'sponsor_id': self.sponsor_id,
            'codice': self.codice,
            'titolo': self.titolo,
            'sottotitolo': self.sottotitolo,
            'destinatario_azienda': self.destinatario_azienda,
            'destinatario_nome': self.destinatario_nome,
            'destinatario_ruolo': self.destinatario_ruolo,
            'destinatario_email': self.destinatario_email,
            'destinatario_telefono': self.destinatario_telefono,
            'settore_merceologico': self.settore_merceologico,
            'stato': self.stato,
            'priorita': self.priorita,
            'messaggio_introduttivo': self.messaggio_introduttivo,
            'descrizione_opportunita': self.descrizione_opportunita,
            'proposta_valore': self.proposta_valore,
            'termini_condizioni': self.termini_condizioni,
            'note_interne': self.note_interne,
            'valore_totale': self.valore_totale,
            'valuta': self.valuta,
            'sconto_percentuale': self.sconto_percentuale,
            'sconto_valore': self.sconto_valore,
            'valore_finale': self.valore_finale,
            'modalita_pagamento': self.modalita_pagamento,
            'numero_rate': self.numero_rate,
            'durata_mesi': self.durata_mesi,
            'data_inizio_proposta': self.data_inizio_proposta.isoformat() if self.data_inizio_proposta else None,
            'data_fine_proposta': self.data_fine_proposta.isoformat() if self.data_fine_proposta else None,
            'stagioni': self.stagioni,
            'data_scadenza': self.data_scadenza.isoformat() if self.data_scadenza else None,
            'giorni_validita': self.giorni_validita,
            'versione_corrente': self.versione_corrente,
            'link_condivisione': self.link_condivisione,
            'link_attivo': self.link_attivo,
            'colore_primario': self.colore_primario,
            'colore_secondario': self.colore_secondario,
            'logo_header': self.logo_header,
            'sfondo_copertina': self.sfondo_copertina,
            'visualizzazioni': self.visualizzazioni,
            'ultima_visualizzazione': self.ultima_visualizzazione.isoformat() if self.ultima_visualizzazione else None,
            'tempo_visualizzazione_totale': self.tempo_visualizzazione_totale,
            'download_pdf': self.download_pdf,
            'data_invio': self.data_invio.isoformat() if self.data_invio else None,
            'data_prima_visualizzazione': self.data_prima_visualizzazione.isoformat() if self.data_prima_visualizzazione else None,
            'data_risposta': self.data_risposta.isoformat() if self.data_risposta else None,
            'data_accettazione': self.data_accettazione.isoformat() if self.data_accettazione else None,
            'data_rifiuto': self.data_rifiuto.isoformat() if self.data_rifiuto else None,
            'motivo_rifiuto': self.motivo_rifiuto,
            'feedback_cliente': self.feedback_cliente,
            'convertita_in_contratto': self.convertita_in_contratto,
            'contratto_id': self.contratto_id,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'created_by': self.created_by,
            'assigned_to': self.assigned_to
        }

        if include_items:
            data['items'] = [item.to_dict() for item in self.items.order_by(ProposalItem.ordine)]
            data['items_count'] = self.items.count()

        if include_tracking:
            data['tracking_events'] = [t.to_dict() for t in self.tracking.order_by(ProposalTracking.created_at.desc()).limit(20)]

        if self.lead:
            contact_name = ' '.join(filter(None, [self.lead.referente_nome, self.lead.referente_cognome]))
            data['lead'] = {'id': self.lead.id, 'ragione_sociale': self.lead.ragione_sociale, 'contatto_nome': contact_name}
        if self.sponsor:
            data['sponsor'] = {'id': self.sponsor.id, 'ragione_sociale': self.sponsor.ragione_sociale}
        if self.template:
            data['template'] = {'id': self.template.id, 'nome': self.template.nome}

        return data


class ProposalItem(db.Model):
    """Item incluso nella proposta (asset o diritto)"""
    __tablename__ = 'proposal_items'

    id = db.Column(db.Integer, primary_key=True)
    proposal_id = db.Column(db.Integer, db.ForeignKey('proposals.id'), nullable=False)

    # Tipo item
    tipo = db.Column(db.String(20), nullable=False)  # asset, right, package, custom

    # Riferimento (uno dei seguenti)
    asset_id = db.Column(db.Integer, db.ForeignKey('inventory_assets.id'))
    right_id = db.Column(db.Integer, db.ForeignKey('rights.id'))
    asset_package_id = db.Column(db.Integer, db.ForeignKey('asset_packages.id'))
    right_package_id = db.Column(db.Integer, db.ForeignKey('right_packages.id'))

    # Oppure item custom
    nome_custom = db.Column(db.String(200))
    descrizione_custom = db.Column(db.Text)
    categoria_custom = db.Column(db.String(100))

    # Dettagli inclusi
    nome_display = db.Column(db.String(200))  # Nome mostrato nella proposta
    descrizione_display = db.Column(db.Text)  # Descrizione mostrata

    # Quantità
    quantita = db.Column(db.Integer, default=1)
    unita_misura = db.Column(db.String(50))  # pezzi, partite, mesi, etc.

    # Pricing
    prezzo_unitario = db.Column(db.Float)
    prezzo_listino = db.Column(db.Float)  # Prezzo originale
    sconto_percentuale = db.Column(db.Float, default=0)
    sconto_valore = db.Column(db.Float, default=0)
    valore_totale = db.Column(db.Float)

    # Pricing tier applicato
    pricing_tier = db.Column(db.String(50))  # standard, premium, derby, champions

    # Disponibilità
    disponibile = db.Column(db.Boolean, default=True)
    note_disponibilita = db.Column(db.Text)

    # Periodo
    data_inizio = db.Column(db.Date)
    data_fine = db.Column(db.Date)

    # Opzionale
    opzionale = db.Column(db.Boolean, default=False)  # Se è un'opzione aggiuntiva
    selezionato = db.Column(db.Boolean, default=True)  # Se è selezionato dal cliente

    # Esclusività
    esclusivo = db.Column(db.Boolean, default=False)
    settore_esclusivita = db.Column(db.String(100))
    territorio_esclusivita = db.Column(db.String(100))

    # Ordine e raggruppamento
    ordine = db.Column(db.Integer, default=0)
    gruppo = db.Column(db.String(100))  # Per raggruppare items (es. "Visibilità Stadio")

    # Note
    note = db.Column(db.Text)
    condizioni_speciali = db.Column(db.Text)

    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Relazioni
    asset = db.relationship('InventoryAsset', backref='proposal_items')
    right = db.relationship('Right', backref='proposal_items')

    def calcola_valore(self):
        """Calcola il valore totale dell'item"""
        base = (self.prezzo_unitario or 0) * (self.quantita or 1)
        if self.sconto_percentuale:
            self.sconto_valore = base * (self.sconto_percentuale / 100)
        self.valore_totale = base - (self.sconto_valore or 0)
        return self.valore_totale

    def to_dict(self):
        data = {
            'id': self.id,
            'proposal_id': self.proposal_id,
            'tipo': self.tipo,
            'asset_id': self.asset_id,
            'right_id': self.right_id,
            'asset_package_id': self.asset_package_id,
            'right_package_id': self.right_package_id,
            'nome_custom': self.nome_custom,
            'descrizione_custom': self.descrizione_custom,
            'categoria_custom': self.categoria_custom,
            'nome_display': self.nome_display,
            'descrizione_display': self.descrizione_display,
            'quantita': self.quantita,
            'unita_misura': self.unita_misura,
            'prezzo_unitario': self.prezzo_unitario,
            'prezzo_listino': self.prezzo_listino,
            'sconto_percentuale': self.sconto_percentuale,
            'sconto_valore': self.sconto_valore,
            'valore_totale': self.valore_totale,
            'pricing_tier': self.pricing_tier,
            'disponibile': self.disponibile,
            'note_disponibilita': self.note_disponibilita,
            'data_inizio': self.data_inizio.isoformat() if self.data_inizio else None,
            'data_fine': self.data_fine.isoformat() if self.data_fine else None,
            'opzionale': self.opzionale,
            'selezionato': self.selezionato,
            'esclusivo': self.esclusivo,
            'settore_esclusivita': self.settore_esclusivita,
            'territorio_esclusivita': self.territorio_esclusivita,
            'ordine': self.ordine,
            'gruppo': self.gruppo,
            'note': self.note,
            'condizioni_speciali': self.condizioni_speciali
        }

        # Include dettagli asset/right se presenti
        if self.asset:
            data['asset'] = {
                'id': self.asset.id,
                'nome': self.asset.nome,
                'categoria': self.asset.category.nome if self.asset.category else None,
                'immagine': self.asset.immagine_principale
            }
        if self.right:
            data['right'] = {
                'id': self.right.id,
                'nome': self.right.nome,
                'categoria': self.right.categoria.nome if self.right.categoria else None
            }

        return data


class ProposalVersion(db.Model):
    """Versione storica della proposta"""
    __tablename__ = 'proposal_versions'

    id = db.Column(db.Integer, primary_key=True)
    proposal_id = db.Column(db.Integer, db.ForeignKey('proposals.id'), nullable=False)

    versione = db.Column(db.Integer, nullable=False)

    # Snapshot contenuto
    titolo = db.Column(db.String(300))
    contenuto_json = db.Column(db.Text)  # JSON completo della proposta
    items_json = db.Column(db.Text)  # JSON degli items

    # Pricing snapshot
    valore_totale = db.Column(db.Float)
    valore_finale = db.Column(db.Float)

    # Motivo modifica
    note_modifica = db.Column(db.Text)
    tipo_modifica = db.Column(db.String(50))  # pricing, items, contenuto, tutto

    # Chi ha creato la versione
    created_by = db.Column(db.String(100))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        import json
        return {
            'id': self.id,
            'proposal_id': self.proposal_id,
            'versione': self.versione,
            'titolo': self.titolo,
            'contenuto': json.loads(self.contenuto_json) if self.contenuto_json else None,
            'items': json.loads(self.items_json) if self.items_json else None,
            'valore_totale': self.valore_totale,
            'valore_finale': self.valore_finale,
            'note_modifica': self.note_modifica,
            'tipo_modifica': self.tipo_modifica,
            'created_by': self.created_by,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }


class ProposalTracking(db.Model):
    """Tracking visualizzazioni e interazioni con la proposta"""
    __tablename__ = 'proposal_tracking'

    id = db.Column(db.Integer, primary_key=True)
    proposal_id = db.Column(db.Integer, db.ForeignKey('proposals.id'), nullable=False)

    # Tipo evento
    evento = db.Column(db.String(50), nullable=False)  # view, download, link_click, section_view, time_spent

    # Dettagli
    sezione = db.Column(db.String(100))  # Se evento su sezione specifica
    dettaglio = db.Column(db.Text)  # JSON con dettagli aggiuntivi
    durata_secondi = db.Column(db.Integer)  # Tempo su sezione/pagina

    # Info visitatore
    ip_address = db.Column(db.String(50))
    user_agent = db.Column(db.String(500))
    device_type = db.Column(db.String(20))  # desktop, mobile, tablet
    browser = db.Column(db.String(50))
    os = db.Column(db.String(50))
    paese = db.Column(db.String(50))
    citta = db.Column(db.String(100))

    # Referrer
    referrer = db.Column(db.String(500))
    utm_source = db.Column(db.String(100))
    utm_medium = db.Column(db.String(100))
    utm_campaign = db.Column(db.String(100))

    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'proposal_id': self.proposal_id,
            'evento': self.evento,
            'sezione': self.sezione,
            'dettaglio': self.dettaglio,
            'durata_secondi': self.durata_secondi,
            'device_type': self.device_type,
            'browser': self.browser,
            'paese': self.paese,
            'citta': self.citta,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }


class ProposalComment(db.Model):
    """Commenti interni sulla proposta"""
    __tablename__ = 'proposal_comments'

    id = db.Column(db.Integer, primary_key=True)
    proposal_id = db.Column(db.Integer, db.ForeignKey('proposals.id'), nullable=False)
    parent_id = db.Column(db.Integer, db.ForeignKey('proposal_comments.id'))  # Per thread

    # Autore
    autore_tipo = db.Column(db.String(20))  # club, admin
    autore_nome = db.Column(db.String(100))

    # Contenuto
    contenuto = db.Column(db.Text, nullable=False)

    # Tipo commento
    tipo = db.Column(db.String(30), default='nota')  # nota, domanda, approvazione, modifica_richiesta

    # Menzioni
    menzioni = db.Column(db.Text)  # JSON array di nomi menzionati

    # Status
    risolto = db.Column(db.Boolean, default=False)

    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relazioni
    replies = db.relationship('ProposalComment', backref=db.backref('parent', remote_side=[id]), lazy='dynamic')

    def to_dict(self, include_replies=False):
        import json
        data = {
            'id': self.id,
            'proposal_id': self.proposal_id,
            'parent_id': self.parent_id,
            'autore_tipo': self.autore_tipo,
            'autore_nome': self.autore_nome,
            'contenuto': self.contenuto,
            'tipo': self.tipo,
            'menzioni': json.loads(self.menzioni) if self.menzioni else [],
            'risolto': self.risolto,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
        if include_replies:
            data['replies'] = [r.to_dict() for r in self.replies]
        return data


class CalendarEvent(db.Model):
    """Eventi/task/appuntamenti calendario CRM"""
    __tablename__ = 'calendar_events'

    id = db.Column(db.Integer, primary_key=True)
    club_id = db.Column(db.Integer, db.ForeignKey('clubs.id'), nullable=False)
    tipo = db.Column(db.String(50), nullable=False)       # 'appuntamento', 'task', 'promemoria'
    titolo = db.Column(db.String(200), nullable=False)
    descrizione = db.Column(db.Text)
    data_inizio = db.Column(db.DateTime, nullable=False)
    data_fine = db.Column(db.DateTime)
    tutto_il_giorno = db.Column(db.Boolean, default=False)
    priorita = db.Column(db.Integer, default=2)            # 1=bassa, 2=media, 3=alta
    colore = db.Column(db.String(7))                       # hex es. '#6366F1'
    completato = db.Column(db.Boolean, default=False)
    data_completamento = db.Column(db.DateTime)
    lead_id = db.Column(db.Integer, db.ForeignKey('leads.id'), nullable=True)
    sponsor_id = db.Column(db.Integer, db.ForeignKey('sponsors.id'), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    club = db.relationship('Club', backref='calendar_events')
    lead = db.relationship('Lead', backref='calendar_events')
    sponsor = db.relationship('Sponsor', backref='calendar_events')

    def to_dict(self):
        return {
            'id': self.id,
            'club_id': self.club_id,
            'tipo': self.tipo,
            'titolo': self.titolo,
            'descrizione': self.descrizione,
            'data_inizio': self.data_inizio.isoformat() if self.data_inizio else None,
            'data_fine': self.data_fine.isoformat() if self.data_fine else None,
            'tutto_il_giorno': self.tutto_il_giorno,
            'priorita': self.priorita,
            'colore': self.colore,
            'completato': self.completato,
            'data_completamento': self.data_completamento.isoformat() if self.data_completamento else None,
            'lead_id': self.lead_id,
            'lead_nome': self.lead.ragione_sociale if self.lead else None,
            'sponsor_id': self.sponsor_id,
            'sponsor_nome': self.sponsor.ragione_sociale if self.sponsor else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }


# Tabella associativa per relazione many-to-many Catalog-InventoryAsset
catalog_assets = db.Table('catalog_assets',
    db.Column('catalog_id', db.Integer, db.ForeignKey('catalogs.id'), primary_key=True),
    db.Column('asset_id', db.Integer, db.ForeignKey('inventory_assets.id'), primary_key=True),
    db.Column('ordine', db.Integer, default=0)  # Ordine dell'asset nel catalogo
)


class Catalog(db.Model):
    """Catalogo personalizzato di asset da condividere"""
    __tablename__ = 'catalogs'

    id = db.Column(db.Integer, primary_key=True)
    club_id = db.Column(db.Integer, db.ForeignKey('clubs.id'), nullable=False)

    # Identificazione
    nome = db.Column(db.String(200), nullable=False)
    descrizione = db.Column(db.Text)

    # Token per link pubblico
    public_token = db.Column(db.String(64), unique=True, nullable=False)

    # Personalizzazione
    logo_url = db.Column(db.String(500))  # Override del logo club
    colore_primario = db.Column(db.String(20))  # Override colore primario
    colore_secondario = db.Column(db.String(20))  # Override colore secondario
    immagine_copertina = db.Column(db.String(500))  # Immagine header/copertina

    # Layout Builder - JSON con struttura sezioni e stili globali
    layout_json = db.Column(db.Text)  # JSON con la struttura delle sezioni

    # Opzioni visualizzazione
    mostra_prezzi = db.Column(db.Boolean, default=True)
    mostra_disponibilita = db.Column(db.Boolean, default=True)
    messaggio_benvenuto = db.Column(db.Text)  # Messaggio introduttivo
    messaggio_footer = db.Column(db.Text)  # Messaggio in fondo

    # Contatto
    email_contatto = db.Column(db.String(120))
    telefono_contatto = db.Column(db.String(20))

    # Status
    attivo = db.Column(db.Boolean, default=True)
    data_scadenza = db.Column(db.DateTime)  # Opzionale: link scade dopo questa data

    # Statistiche
    visualizzazioni = db.Column(db.Integer, default=0)
    ultimo_accesso = db.Column(db.DateTime)

    # Metadata
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relazioni
    club = db.relationship('Club', backref='catalogs')
    assets = db.relationship('InventoryAsset', secondary=catalog_assets,
                            backref=db.backref('catalogs', lazy='dynamic'))

    def to_dict(self, include_assets=False):
        data = {
            'id': self.id,
            'club_id': self.club_id,
            'nome': self.nome,
            'descrizione': self.descrizione,
            'public_token': self.public_token,
            'logo_url': self.logo_url,
            'colore_primario': self.colore_primario,
            'colore_secondario': self.colore_secondario,
            'immagine_copertina': self.immagine_copertina,
            'layout_json': self.layout_json,
            'mostra_prezzi': self.mostra_prezzi,
            'mostra_disponibilita': self.mostra_disponibilita,
            'messaggio_benvenuto': self.messaggio_benvenuto,
            'messaggio_footer': self.messaggio_footer,
            'email_contatto': self.email_contatto,
            'telefono_contatto': self.telefono_contatto,
            'attivo': self.attivo,
            'data_scadenza': self.data_scadenza.isoformat() if self.data_scadenza else None,
            'visualizzazioni': self.visualizzazioni,
            'ultimo_accesso': self.ultimo_accesso.isoformat() if self.ultimo_accesso else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'num_assets': len(self.assets)
        }
        if include_assets:
            data['assets'] = [{
                'id': a.id,
                'codice': a.codice,
                'nome': a.nome,
                'descrizione': a.descrizione,
                'descrizione_breve': a.descrizione_breve,
                'tipo': a.tipo,
                'posizione': a.posizione,
                'dimensioni': a.dimensioni,
                'immagine_principale': a.immagine_principale,
                'prezzo_listino': a.prezzo_listino,
                'valuta': a.valuta,
                'disponibile': a.disponibile,
                'quantita_disponibile': a.quantita_disponibile,
                'category_name': a.category.nome if a.category else None
            } for a in self.assets]
        return data


# ==================== ADMIN CRM/ERP SYSTEM ====================
# Sistema completo per gestione licenze, CRM, e analytics

class SubscriptionPlan(db.Model):
    """Piani di abbonamento disponibili per i club"""
    __tablename__ = 'subscription_plans'

    id = db.Column(db.Integer, primary_key=True)

    # Info piano
    nome = db.Column(db.String(100), nullable=False)  # Starter, Professional, Enterprise
    codice = db.Column(db.String(50), unique=True, nullable=False)  # starter, pro, enterprise
    descrizione = db.Column(db.Text)

    # Pricing
    prezzo_mensile = db.Column(db.Float, default=0)
    prezzo_trimestrale = db.Column(db.Float, default=0)
    prezzo_annuale = db.Column(db.Float, default=0)

    # Features (JSON)
    features = db.Column(db.Text)  # JSON: {"feature1": true, "feature2": false, ...}
    features_list = db.Column(db.Text)  # JSON array: ["Feature 1", "Feature 2", ...]

    # Limiti
    max_sponsors = db.Column(db.Integer, default=-1)  # -1 = illimitato
    max_contracts = db.Column(db.Integer, default=-1)
    max_users = db.Column(db.Integer, default=1)
    max_storage_gb = db.Column(db.Float, default=5)
    max_proposals = db.Column(db.Integer, default=-1)
    max_catalogs = db.Column(db.Integer, default=-1)

    # Trial
    giorni_trial = db.Column(db.Integer, default=14)
    trial_disponibile = db.Column(db.Boolean, default=True)

    # Status
    attivo = db.Column(db.Boolean, default=True)
    visibile_pubblico = db.Column(db.Boolean, default=True)
    ordine_display = db.Column(db.Integer, default=0)  # Per ordinamento UI

    # Highlight
    is_popular = db.Column(db.Boolean, default=False)  # Badge "Più popolare"
    colore_badge = db.Column(db.String(20), default='#85FF00')

    # Metadata
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    subscriptions = db.relationship('Subscription', backref='plan', lazy=True)

    def get_price_for_cycle(self, cycle):
        """Ritorna il prezzo per il ciclo specificato"""
        if cycle == 'monthly':
            return self.prezzo_mensile
        elif cycle == 'quarterly':
            return self.prezzo_trimestrale
        elif cycle == 'annual':
            return self.prezzo_annuale
        return self.prezzo_mensile

    def to_dict(self):
        import json
        return {
            'id': self.id,
            'nome': self.nome,
            'codice': self.codice,
            'descrizione': self.descrizione,
            'prezzo_mensile': self.prezzo_mensile,
            'prezzo_trimestrale': self.prezzo_trimestrale,
            'prezzo_annuale': self.prezzo_annuale,
            'features': json.loads(self.features) if self.features else {},
            'features_list': json.loads(self.features_list) if self.features_list else [],
            'max_sponsors': self.max_sponsors,
            'max_contracts': self.max_contracts,
            'max_users': self.max_users,
            'max_storage_gb': self.max_storage_gb,
            'giorni_trial': self.giorni_trial,
            'trial_disponibile': self.trial_disponibile,
            'attivo': self.attivo,
            'is_popular': self.is_popular,
            'colore_badge': self.colore_badge,
            'subscribers_count': len([s for s in self.subscriptions if s.status == 'active'])
        }


class Subscription(db.Model):
    """Abbonamento attivo di un club"""
    __tablename__ = 'subscriptions'

    id = db.Column(db.Integer, primary_key=True)
    club_id = db.Column(db.Integer, db.ForeignKey('clubs.id'), nullable=False)
    plan_id = db.Column(db.Integer, db.ForeignKey('subscription_plans.id'), nullable=False)

    # Ciclo di fatturazione
    billing_cycle = db.Column(db.String(20), default='monthly')  # monthly, quarterly, annual
    data_inizio = db.Column(db.DateTime, nullable=False)
    data_fine = db.Column(db.DateTime, nullable=False)
    data_prossimo_rinnovo = db.Column(db.DateTime)

    # Status
    status = db.Column(db.String(50), default='active')  # trial, active, past_due, cancelled, expired, suspended
    auto_renew = db.Column(db.Boolean, default=True)

    # Trial
    is_trial = db.Column(db.Boolean, default=False)
    trial_ends_at = db.Column(db.DateTime)
    trial_converted = db.Column(db.Boolean, default=False)

    # Pricing applicato (può differire dal piano per sconti)
    prezzo_concordato = db.Column(db.Float)
    sconto_percentuale = db.Column(db.Float, default=0)
    codice_sconto = db.Column(db.String(50))

    # Cancellation
    cancelled_at = db.Column(db.DateTime)
    cancellation_reason = db.Column(db.Text)
    cancellation_feedback = db.Column(db.Text)

    # Grace period (dopo scadenza)
    grace_period_days = db.Column(db.Integer, default=7)
    grace_period_ends = db.Column(db.DateTime)

    # Payment info
    payment_method = db.Column(db.String(50))  # card, bank_transfer, paypal
    last_payment_date = db.Column(db.DateTime)
    last_payment_amount = db.Column(db.Float)
    failed_payment_count = db.Column(db.Integer, default=0)

    # Notes
    note_interne = db.Column(db.Text)

    # Metadata
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    club = db.relationship('Club', backref='subscriptions')
    events = db.relationship('SubscriptionEvent', backref='subscription', lazy=True, cascade='all, delete-orphan')

    def is_active(self):
        """Verifica se l'abbonamento è attivo"""
        now = datetime.utcnow()
        if self.status in ['active', 'trial']:
            return self.data_fine >= now
        if self.status == 'past_due' and self.grace_period_ends:
            return self.grace_period_ends >= now
        return False

    def days_until_expiry(self):
        """Giorni rimanenti"""
        if not self.data_fine:
            return None
        delta = self.data_fine - datetime.utcnow()
        return delta.days

    def to_dict(self):
        return {
            'id': self.id,
            'club_id': self.club_id,
            'club_nome': self.club.nome if self.club else None,
            'plan_id': self.plan_id,
            'plan_nome': self.plan.nome if self.plan else None,
            'plan_codice': self.plan.codice if self.plan else None,
            'billing_cycle': self.billing_cycle,
            'data_inizio': self.data_inizio.isoformat() if self.data_inizio else None,
            'data_fine': self.data_fine.isoformat() if self.data_fine else None,
            'data_prossimo_rinnovo': self.data_prossimo_rinnovo.isoformat() if self.data_prossimo_rinnovo else None,
            'status': self.status,
            'auto_renew': self.auto_renew,
            'is_trial': self.is_trial,
            'trial_ends_at': self.trial_ends_at.isoformat() if self.trial_ends_at else None,
            'prezzo_concordato': self.prezzo_concordato,
            'sconto_percentuale': self.sconto_percentuale,
            'days_until_expiry': self.days_until_expiry(),
            'is_active': self.is_active(),
            'cancelled_at': self.cancelled_at.isoformat() if self.cancelled_at else None,
            'cancellation_reason': self.cancellation_reason,
            'grace_period_ends': self.grace_period_ends.isoformat() if self.grace_period_ends else None,
            'failed_payment_count': self.failed_payment_count,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }


class SubscriptionEvent(db.Model):
    """Storico eventi abbonamento (audit trail)"""
    __tablename__ = 'subscription_events'

    id = db.Column(db.Integer, primary_key=True)
    subscription_id = db.Column(db.Integer, db.ForeignKey('subscriptions.id'), nullable=False)

    # Evento
    evento = db.Column(db.String(50), nullable=False)
    # Tipi: created, activated, renewed, upgraded, downgraded, cancelled, expired,
    #       reactivated, payment_failed, payment_success, trial_started, trial_ended,
    #       grace_period_started, suspended

    # Dettagli cambio piano
    old_plan_id = db.Column(db.Integer, db.ForeignKey('subscription_plans.id'))
    new_plan_id = db.Column(db.Integer, db.ForeignKey('subscription_plans.id'))
    old_price = db.Column(db.Float)
    new_price = db.Column(db.Float)

    # Chi ha fatto l'azione
    triggered_by = db.Column(db.String(50))  # system, admin, club
    admin_id = db.Column(db.Integer, db.ForeignKey('admins.id'))

    # Dettagli aggiuntivi
    note = db.Column(db.Text)
    metadata_json = db.Column(db.Text)  # JSON con dati extra

    # Timestamp
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'subscription_id': self.subscription_id,
            'evento': self.evento,
            'old_plan_id': self.old_plan_id,
            'new_plan_id': self.new_plan_id,
            'old_price': self.old_price,
            'new_price': self.new_price,
            'triggered_by': self.triggered_by,
            'note': self.note,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }


class CRMLead(db.Model):
    """Lead CRM Admin - potenziali club clienti"""
    __tablename__ = 'crm_leads'

    id = db.Column(db.Integer, primary_key=True)

    # Info club potenziale
    nome_club = db.Column(db.String(200), nullable=False)
    tipologia_sport = db.Column(db.String(100))
    logo_url = db.Column(db.String(500))
    citta = db.Column(db.String(100))
    provincia = db.Column(db.String(10))
    regione = db.Column(db.String(100))
    paese = db.Column(db.String(100), default='Italia')
    sito_web = db.Column(db.String(300))

    # Contatti (legacy)
    email = db.Column(db.String(200))
    telefono = db.Column(db.String(50))

    # Referente Principale
    contatto_nome = db.Column(db.String(100))
    contatto_cognome = db.Column(db.String(100))
    contatto_ruolo = db.Column(db.String(100))
    contatto_email = db.Column(db.String(200))
    contatto_telefono = db.Column(db.String(50))

    # Contatti Aggiuntivi (JSON)
    contatti_aggiuntivi = db.Column(db.Text)

    # Referente (legacy - keep for backward compatibility)
    referente_nome = db.Column(db.String(200))
    referente_ruolo = db.Column(db.String(100))
    referente_email = db.Column(db.String(200))
    referente_telefono = db.Column(db.String(50))

    # Pipeline
    stage = db.Column(db.String(50), default='nuovo')
    # Stages: nuovo, contattato, qualificato, demo, proposta, negoziazione, vinto, perso

    # Valutazione
    valore_stimato = db.Column(db.Float, default=0)  # Valore annuo stimato
    probabilita = db.Column(db.Integer, default=10)  # 0-100%
    piano_interesse = db.Column(db.String(50))  # starter, pro, enterprise

    # Lead Scoring
    score = db.Column(db.Integer, default=0)  # 0-100
    score_breakdown = db.Column(db.Text)  # JSON con dettaglio score
    temperatura = db.Column(db.String(20), default='cold')  # cold, warm, hot

    # Fonte acquisizione
    fonte = db.Column(db.String(100))  # website, referral, evento, cold_call, partner, social, altro
    campagna = db.Column(db.String(200))
    referral_da = db.Column(db.String(200))  # Chi ha referenziato

    # Info aziendali
    numero_tesserati = db.Column(db.Integer)
    categoria_campionato = db.Column(db.String(200))
    budget_sponsorship = db.Column(db.Float)  # Budget annuo sponsorship gestito
    num_sponsor_attuali = db.Column(db.Integer)

    # Competitor
    usa_competitor = db.Column(db.Boolean, default=False)
    competitor_nome = db.Column(db.String(200))

    # Timeline
    data_primo_contatto = db.Column(db.DateTime)
    data_ultima_attivita = db.Column(db.DateTime)
    data_prossima_azione = db.Column(db.DateTime)
    prossima_azione = db.Column(db.String(200))

    # Esito (se chiuso)
    data_chiusura = db.Column(db.DateTime)
    motivo_perdita = db.Column(db.Text)
    competitor_scelto = db.Column(db.String(200))
    feedback_perdita = db.Column(db.Text)

    # Conversione
    converted_to_club_id = db.Column(db.Integer, db.ForeignKey('clubs.id'))
    converted_at = db.Column(db.DateTime)

    # Note
    note = db.Column(db.Text)
    tags = db.Column(db.String(500))  # Comma-separated tags

    # Metadata
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    activities = db.relationship('CRMLeadActivity', backref='crm_lead', lazy=True, cascade='all, delete-orphan')
    converted_club = db.relationship('Club', backref='crm_source_lead', foreign_keys=[converted_to_club_id])

    def update_score(self):
        """Calcola score automatico basato su criteri"""
        score = 0
        breakdown = {}

        # Email fornita (+10)
        if self.email:
            score += 10
            breakdown['email'] = 10

        # Telefono fornito (+10)
        if self.telefono:
            score += 10
            breakdown['telefono'] = 10

        # Referente con ruolo (+15)
        if self.referente_nome and self.referente_ruolo:
            score += 15
            breakdown['referente'] = 15

        # Budget sponsorship > 50k (+20)
        if self.budget_sponsorship and self.budget_sponsorship > 50000:
            score += 20
            breakdown['budget_alto'] = 20
        elif self.budget_sponsorship and self.budget_sponsorship > 20000:
            score += 10
            breakdown['budget_medio'] = 10

        # Numero sponsor attuali > 5 (+15)
        if self.num_sponsor_attuali and self.num_sponsor_attuali > 5:
            score += 15
            breakdown['sponsor_multipli'] = 15

        # Fonte referral (+20)
        if self.fonte == 'referral':
            score += 20
            breakdown['referral'] = 20

        # Stage avanzato
        stage_scores = {
            'qualificato': 10,
            'demo': 20,
            'proposta': 30,
            'negoziazione': 40
        }
        if self.stage in stage_scores:
            score += stage_scores[self.stage]
            breakdown['stage'] = stage_scores[self.stage]

        self.score = min(score, 100)
        import json
        self.score_breakdown = json.dumps(breakdown)

        # Update temperatura
        if self.score >= 70:
            self.temperatura = 'hot'
        elif self.score >= 40:
            self.temperatura = 'warm'
        else:
            self.temperatura = 'cold'

    def to_dict(self):
        import json
        return {
            'id': self.id,
            'nome_club': self.nome_club,
            'tipologia_sport': self.tipologia_sport,
            'citta': self.citta,
            'regione': self.regione,
            'provincia': self.provincia,
            'logo_url': self.logo_url,
            'email': self.email,
            'telefono': self.telefono,
            'sito_web': self.sito_web,
            'contatto_nome': self.contatto_nome,
            'contatto_cognome': self.contatto_cognome,
            'contatto_ruolo': self.contatto_ruolo,
            'contatto_email': self.contatto_email,
            'contatto_telefono': self.contatto_telefono,
            'contatti_aggiuntivi': self.contatti_aggiuntivi,
            'referente_nome': self.referente_nome,
            'referente_ruolo': self.referente_ruolo,
            'referente_email': self.referente_email,
            'referente_telefono': self.referente_telefono,
            'stage': self.stage,
            'valore_stimato': self.valore_stimato,
            'probabilita': self.probabilita,
            'piano_interesse': self.piano_interesse,
            'score': self.score,
            'score_breakdown': json.loads(self.score_breakdown) if self.score_breakdown else {},
            'temperatura': self.temperatura,
            'fonte': self.fonte,
            'campagna': self.campagna,
            'numero_tesserati': self.numero_tesserati,
            'budget_sponsorship': self.budget_sponsorship,
            'num_sponsor_attuali': self.num_sponsor_attuali,
            'usa_competitor': self.usa_competitor,
            'competitor_nome': self.competitor_nome,
            'data_primo_contatto': self.data_primo_contatto.isoformat() if self.data_primo_contatto else None,
            'data_ultima_attivita': self.data_ultima_attivita.isoformat() if self.data_ultima_attivita else None,
            'data_prossima_azione': self.data_prossima_azione.isoformat() if self.data_prossima_azione else None,
            'prossima_azione': self.prossima_azione,
            'data_chiusura': self.data_chiusura.isoformat() if self.data_chiusura else None,
            'motivo_perdita': self.motivo_perdita,
            'converted_to_club_id': self.converted_to_club_id,
            'note': self.note,
            'tags': self.tags.split(',') if self.tags else [],
            'activities_count': len(self.activities),
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }


class CRMLeadActivity(db.Model):
    """Attività/interazioni con un CRM lead (admin)"""
    __tablename__ = 'crm_lead_activities'

    id = db.Column(db.Integer, primary_key=True)
    lead_id = db.Column(db.Integer, db.ForeignKey('crm_leads.id'), nullable=False)

    # Tipo attività
    tipo = db.Column(db.String(50), nullable=False)
    # Tipi: call, email, meeting, demo, note, proposal_sent, follow_up, task, stage_change

    # Dettagli
    titolo = db.Column(db.String(200))
    descrizione = db.Column(db.Text)

    # Per email
    email_subject = db.Column(db.String(300))
    email_body = db.Column(db.Text)

    # Per chiamate/meeting
    durata_minuti = db.Column(db.Integer)
    esito = db.Column(db.String(100))  # positivo, neutro, negativo, no_risposta

    # Schedulazione
    data_schedulata = db.Column(db.DateTime)
    completata = db.Column(db.Boolean, default=False)
    data_completamento = db.Column(db.DateTime)

    # Stage change tracking
    old_stage = db.Column(db.String(50))
    new_stage = db.Column(db.String(50))

    # Chi ha fatto l'attività
    admin_id = db.Column(db.Integer, db.ForeignKey('admins.id'))

    # Metadata
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'lead_id': self.lead_id,
            'tipo': self.tipo,
            'titolo': self.titolo,
            'descrizione': self.descrizione,
            'durata_minuti': self.durata_minuti,
            'esito': self.esito,
            'data_schedulata': self.data_schedulata.isoformat() if self.data_schedulata else None,
            'completata': self.completata,
            'old_stage': self.old_stage,
            'new_stage': self.new_stage,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }


class AuditLog(db.Model):
    """Log di tutte le azioni admin per audit trail"""
    __tablename__ = 'audit_logs'

    id = db.Column(db.Integer, primary_key=True)
    admin_id = db.Column(db.Integer, db.ForeignKey('admins.id'))

    # Azione
    azione = db.Column(db.String(100), nullable=False)
    # Azioni: create, update, delete, login, logout, export, view, approve, reject, etc.

    # Entità coinvolta
    entita = db.Column(db.String(100))  # club, subscription, lead, payment, invoice, etc.
    entita_id = db.Column(db.Integer)
    entita_nome = db.Column(db.String(200))  # Nome leggibile (es. nome club)

    # Dettagli
    dettagli = db.Column(db.Text)  # JSON con old/new values o altri dati

    # Request info
    ip_address = db.Column(db.String(50))
    user_agent = db.Column(db.String(500))

    # Timestamp
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Relationship
    admin = db.relationship('Admin', backref='audit_logs')

    def to_dict(self):
        import json
        return {
            'id': self.id,
            'admin_id': self.admin_id,
            'admin_username': self.admin.username if self.admin else None,
            'azione': self.azione,
            'entita': self.entita,
            'entita_id': self.entita_id,
            'entita_nome': self.entita_nome,
            'dettagli': json.loads(self.dettagli) if self.dettagli else None,
            'ip_address': self.ip_address,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }


class AdminEmailTemplate(db.Model):
    """Template email per comunicazioni admin"""
    __tablename__ = 'admin_email_templates'

    id = db.Column(db.Integer, primary_key=True)

    # Identificazione
    codice = db.Column(db.String(100), unique=True, nullable=False)
    # Codici: welcome, trial_ending_7d, trial_ending_1d, license_expiring_30d,
    #         license_expiring_7d, license_expired, payment_failed, renewal_success,
    #         lead_welcome, demo_scheduled, proposal_sent

    nome = db.Column(db.String(200), nullable=False)
    descrizione = db.Column(db.Text)
    categoria = db.Column(db.String(50))  # subscription, lead, notification, marketing

    # Contenuto
    oggetto = db.Column(db.String(300), nullable=False)
    corpo_html = db.Column(db.Text, nullable=False)
    corpo_text = db.Column(db.Text)  # Versione plain text

    # Variabili disponibili (per documentazione)
    variabili = db.Column(db.Text)  # JSON: ["{{club_nome}}", "{{data_scadenza}}", ...]

    # Status
    attivo = db.Column(db.Boolean, default=True)

    # Automazione
    trigger_automatico = db.Column(db.Boolean, default=False)
    trigger_evento = db.Column(db.String(100))  # Evento che scatena l'invio
    trigger_giorni = db.Column(db.Integer)  # Giorni prima/dopo evento

    # Metadata
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        import json
        return {
            'id': self.id,
            'codice': self.codice,
            'nome': self.nome,
            'descrizione': self.descrizione,
            'categoria': self.categoria,
            'oggetto': self.oggetto,
            'corpo_html': self.corpo_html,
            'corpo_text': self.corpo_text,
            'variabili': json.loads(self.variabili) if self.variabili else [],
            'attivo': self.attivo,
            'trigger_automatico': self.trigger_automatico,
            'trigger_evento': self.trigger_evento,
            'trigger_giorni': self.trigger_giorni,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }


class EmailLog(db.Model):
    """Log email inviate"""
    __tablename__ = 'email_logs'

    id = db.Column(db.Integer, primary_key=True)

    # Destinatario
    destinatario_tipo = db.Column(db.String(50))  # club, lead, sponsor
    destinatario_id = db.Column(db.Integer)
    destinatario_email = db.Column(db.String(200), nullable=False)
    destinatario_nome = db.Column(db.String(200))

    # Email
    template_id = db.Column(db.Integer, db.ForeignKey('admin_email_templates.id'))
    oggetto = db.Column(db.String(300), nullable=False)
    corpo = db.Column(db.Text)

    # Status
    status = db.Column(db.String(50), default='sent')  # queued, sent, delivered, opened, clicked, bounced, failed

    # Tracking
    aperta = db.Column(db.Boolean, default=False)
    data_apertura = db.Column(db.DateTime)
    click_count = db.Column(db.Integer, default=0)

    # Errori
    errore = db.Column(db.Text)

    # Metadata
    inviata_da = db.Column(db.String(50))  # system, admin
    admin_id = db.Column(db.Integer, db.ForeignKey('admins.id'))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Relationships
    template = db.relationship('AdminEmailTemplate', backref='logs')

    def to_dict(self):
        return {
            'id': self.id,
            'destinatario_tipo': self.destinatario_tipo,
            'destinatario_email': self.destinatario_email,
            'destinatario_nome': self.destinatario_nome,
            'template_id': self.template_id,
            'template_nome': self.template.nome if self.template else None,
            'oggetto': self.oggetto,
            'status': self.status,
            'aperta': self.aperta,
            'data_apertura': self.data_apertura.isoformat() if self.data_apertura else None,
            'click_count': self.click_count,
            'errore': self.errore,
            'inviata_da': self.inviata_da,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }


class PlatformMetrics(db.Model):
    """Metriche giornaliere della piattaforma per analytics"""
    __tablename__ = 'platform_metrics'

    id = db.Column(db.Integer, primary_key=True)
    data = db.Column(db.Date, unique=True, nullable=False)

    # Club metrics
    total_clubs = db.Column(db.Integer, default=0)
    active_clubs = db.Column(db.Integer, default=0)
    new_clubs = db.Column(db.Integer, default=0)
    churned_clubs = db.Column(db.Integer, default=0)

    # Trial metrics
    active_trials = db.Column(db.Integer, default=0)
    trials_converted = db.Column(db.Integer, default=0)
    trials_expired = db.Column(db.Integer, default=0)

    # Revenue metrics
    mrr = db.Column(db.Float, default=0)
    arr = db.Column(db.Float, default=0)
    new_mrr = db.Column(db.Float, default=0)
    expansion_mrr = db.Column(db.Float, default=0)
    churned_mrr = db.Column(db.Float, default=0)

    # Sponsor metrics
    total_sponsors = db.Column(db.Integer, default=0)
    active_sponsors = db.Column(db.Integer, default=0)

    # Contract metrics
    total_contracts = db.Column(db.Integer, default=0)
    active_contracts = db.Column(db.Integer, default=0)
    total_contract_value = db.Column(db.Float, default=0)

    # Lead metrics
    total_leads = db.Column(db.Integer, default=0)
    new_leads = db.Column(db.Integer, default=0)
    converted_leads = db.Column(db.Integer, default=0)
    pipeline_value = db.Column(db.Float, default=0)

    # Engagement metrics
    daily_active_users = db.Column(db.Integer, default=0)

    # Metadata
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'data': self.data.isoformat() if self.data else None,
            'total_clubs': self.total_clubs,
            'active_clubs': self.active_clubs,
            'new_clubs': self.new_clubs,
            'churned_clubs': self.churned_clubs,
            'active_trials': self.active_trials,
            'trials_converted': self.trials_converted,
            'mrr': self.mrr,
            'arr': self.arr,
            'new_mrr': self.new_mrr,
            'expansion_mrr': self.expansion_mrr,
            'churned_mrr': self.churned_mrr,
            'total_sponsors': self.total_sponsors,
            'total_contracts': self.total_contracts,
            'total_contract_value': self.total_contract_value,
            'total_leads': self.total_leads,
            'new_leads': self.new_leads,
            'converted_leads': self.converted_leads,
            'pipeline_value': self.pipeline_value
        }


# ==================== CLUB BILLING & ACTIVITY SYSTEM ====================
# Sistema di fatturazione e attività per i club (usa Subscription esistente)

class ClubInvoice(db.Model):
    """Fatture emesse ai club per gli abbonamenti"""
    __tablename__ = 'club_invoices'

    id = db.Column(db.Integer, primary_key=True)
    club_id = db.Column(db.Integer, db.ForeignKey('clubs.id'), nullable=False)
    subscription_id = db.Column(db.Integer, db.ForeignKey('subscriptions.id'), nullable=True)

    # Numero fattura
    invoice_number = db.Column(db.String(50), unique=True, nullable=False)

    # Date
    issue_date = db.Column(db.DateTime, default=datetime.utcnow)
    due_date = db.Column(db.DateTime)

    # Importi
    subtotal = db.Column(db.Float, default=0)
    tax_rate = db.Column(db.Float, default=22)  # IVA 22%
    tax_amount = db.Column(db.Float, default=0)
    total = db.Column(db.Float, default=0)

    # Stato pagamento
    status = db.Column(db.String(50), default='draft')  # draft, sent, paid, overdue, cancelled
    paid_at = db.Column(db.DateTime)
    payment_method = db.Column(db.String(50))  # bonifico, carta, paypal, etc.
    payment_reference = db.Column(db.String(200))  # riferimento pagamento

    # Descrizione
    description = db.Column(db.Text)
    period_start = db.Column(db.DateTime)  # Periodo di riferimento
    period_end = db.Column(db.DateTime)

    # File PDF
    pdf_url = db.Column(db.String(500))

    # Note
    notes = db.Column(db.Text)

    # Metadata
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relazione
    club = db.relationship('Club', backref=db.backref('club_invoices', lazy=True))

    def calculate_totals(self):
        """Calcola IVA e totale"""
        self.tax_amount = round(self.subtotal * (self.tax_rate / 100), 2)
        self.total = round(self.subtotal + self.tax_amount, 2)

    def is_overdue(self):
        """Verifica se la fattura è scaduta"""
        if self.status == 'paid':
            return False
        if self.due_date:
            return datetime.utcnow() > self.due_date
        return False

    def to_dict(self):
        return {
            'id': self.id,
            'club_id': self.club_id,
            'subscription_id': self.subscription_id,
            'invoice_number': self.invoice_number,
            'issue_date': self.issue_date.isoformat() if self.issue_date else None,
            'due_date': self.due_date.isoformat() if self.due_date else None,
            'subtotal': self.subtotal,
            'tax_rate': self.tax_rate,
            'tax_amount': self.tax_amount,
            'total': self.total,
            'status': self.status,
            'paid_at': self.paid_at.isoformat() if self.paid_at else None,
            'payment_method': self.payment_method,
            'payment_reference': self.payment_reference,
            'description': self.description,
            'period_start': self.period_start.isoformat() if self.period_start else None,
            'period_end': self.period_end.isoformat() if self.period_end else None,
            'pdf_url': self.pdf_url,
            'notes': self.notes,
            'is_overdue': self.is_overdue(),
            'created_at': self.created_at.isoformat() if self.created_at else None
        }


class ClubActivity(db.Model):
    """Attività/interazioni con i club (per admin)"""
    __tablename__ = 'club_activities'

    id = db.Column(db.Integer, primary_key=True)
    club_id = db.Column(db.Integer, db.ForeignKey('clubs.id'), nullable=False)

    # Tipo attività
    tipo = db.Column(db.String(50), nullable=False)  # chiamata, email, meeting, nota, fattura, supporto, altro

    # Dettagli
    descrizione = db.Column(db.Text)
    esito = db.Column(db.String(50))  # positivo, negativo, neutro, da_seguire

    # Data schedulata (per attività future)
    data_schedulata = db.Column(db.DateTime)

    # Chi ha creato
    created_by = db.Column(db.String(100))

    # Metadata
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Relazione
    club = db.relationship('Club', backref=db.backref('admin_activities', lazy=True))

    def to_dict(self):
        return {
            'id': self.id,
            'club_id': self.club_id,
            'tipo': self.tipo,
            'descrizione': self.descrizione,
            'esito': self.esito,
            'data_schedulata': self.data_schedulata.isoformat() if self.data_schedulata else None,
            'created_by': self.created_by,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }


# ==================== KPI TRACKING SYSTEM ====================

class KPIMonthlyData(db.Model):
    """Dati KPI mensili per tracking andamento"""
    __tablename__ = 'kpi_monthly_data'

    id = db.Column(db.Integer, primary_key=True)
    year = db.Column(db.Integer, nullable=False)
    month = db.Column(db.Integer, nullable=False)  # 1-12

    # Funnel Vendite (manuali)
    contacts = db.Column(db.Integer, default=0)  # Contatti qualificati
    demos = db.Column(db.Integer, default=0)  # Demo effettuate
    proposals = db.Column(db.Integer, default=0)  # Proposte inviate
    contracts = db.Column(db.Integer, default=0)  # Contratti chiusi

    # Revenue (manuali per tracking specifico)
    booking = db.Column(db.Float, default=0)  # Booking mensile
    arr_new = db.Column(db.Float, default=0)  # ARR nuovo acquisito

    # Add-on Revenue (manuali)
    addon_setup = db.Column(db.Float, default=0)  # Setup & onboarding
    addon_training = db.Column(db.Float, default=0)  # Formazione team
    addon_custom = db.Column(db.Float, default=0)  # Custom/integrazioni

    # Club per piano (manuali per tracking specifico)
    new_clubs_basic = db.Column(db.Integer, default=0)
    new_clubs_premium = db.Column(db.Integer, default=0)
    new_clubs_elite = db.Column(db.Integer, default=0)

    # Note
    notes = db.Column(db.Text)

    # Metadata
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    __table_args__ = (
        db.UniqueConstraint('year', 'month', name='uq_kpi_year_month'),
    )

    def to_dict(self):
        return {
            'id': self.id,
            'year': self.year,
            'month': self.month,
            'contacts': self.contacts,
            'demos': self.demos,
            'proposals': self.proposals,
            'contracts': self.contracts,
            'booking': self.booking,
            'arr_new': self.arr_new,
            'addon_setup': self.addon_setup,
            'addon_training': self.addon_training,
            'addon_custom': self.addon_custom,
            'new_clubs_basic': self.new_clubs_basic,
            'new_clubs_premium': self.new_clubs_premium,
            'new_clubs_elite': self.new_clubs_elite,
            'notes': self.notes,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }


class KPIMilestone(db.Model):
    """Milestone e checklist 2026"""
    __tablename__ = 'kpi_milestones'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(200), nullable=False)
    quarter = db.Column(db.String(10), nullable=False)  # Q1, Q2, Q3, Q4
    status = db.Column(db.String(50), default='not_started')  # not_started, in_progress, completed
    completion_date = db.Column(db.Date)
    owner = db.Column(db.String(100))
    notes = db.Column(db.Text)
    order = db.Column(db.Integer, default=0)

    # Metadata
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'quarter': self.quarter,
            'status': self.status,
            'completion_date': self.completion_date.isoformat() if self.completion_date else None,
            'owner': self.owner,
            'notes': self.notes,
            'order': self.order,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }


class KPIProductMetrics(db.Model):
    """Metriche prodotto mensili"""
    __tablename__ = 'kpi_product_metrics'

    id = db.Column(db.Integer, primary_key=True)
    year = db.Column(db.Integer, nullable=False)
    month = db.Column(db.Integer, nullable=False)

    # Attivazione
    avg_onboarding_days = db.Column(db.Float)  # Tempo medio onboarding
    clubs_fully_onboarded_pct = db.Column(db.Float)  # % club fully onboarded

    # Utilizzo
    avg_sponsors_per_club = db.Column(db.Float)  # Sponsor per club
    avg_assets_per_club = db.Column(db.Float)  # Asset per club
    avg_events_per_club = db.Column(db.Float)  # Eventi per club

    # Engagement Sponsor
    sponsors_with_access_pct = db.Column(db.Float)  # % sponsor con accesso attivo
    avg_monthly_sponsor_logins = db.Column(db.Float)  # Accessi mensili medi
    feature_adoption_pct = db.Column(db.Float)  # % feature adoption

    # Retention
    churn_rate = db.Column(db.Float)  # Churn %
    renewal_intention_pct = db.Column(db.Float)  # Renewal intention %
    nps_score = db.Column(db.Integer)  # NPS

    # Note
    notes = db.Column(db.Text)

    # Metadata
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    __table_args__ = (
        db.UniqueConstraint('year', 'month', name='uq_kpi_product_year_month'),
    )

    def to_dict(self):
        return {
            'id': self.id,
            'year': self.year,
            'month': self.month,
            'avg_onboarding_days': self.avg_onboarding_days,
            'clubs_fully_onboarded_pct': self.clubs_fully_onboarded_pct,
            'avg_sponsors_per_club': self.avg_sponsors_per_club,
            'avg_assets_per_club': self.avg_assets_per_club,
            'avg_events_per_club': self.avg_events_per_club,
            'sponsors_with_access_pct': self.sponsors_with_access_pct,
            'avg_monthly_sponsor_logins': self.avg_monthly_sponsor_logins,
            'feature_adoption_pct': self.feature_adoption_pct,
            'churn_rate': self.churn_rate,
            'renewal_intention_pct': self.renewal_intention_pct,
            'nps_score': self.nps_score,
            'notes': self.notes,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }


class KPICredibility(db.Model):
    """KPI Credibilità per investitori"""
    __tablename__ = 'kpi_credibility'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(200), nullable=False, unique=True)
    target = db.Column(db.String(100))
    current_value = db.Column(db.String(100))
    status = db.Column(db.String(50), default='in_progress')  # in_progress, completed, at_risk
    deadline = db.Column(db.String(50))  # Q1 2026, Q2 2026, etc.
    notes = db.Column(db.Text)
    order = db.Column(db.Integer, default=0)

    # Metadata
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'target': self.target,
            'current_value': self.current_value,
            'status': self.status,
            'deadline': self.deadline,
            'notes': self.notes,
            'order': self.order,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }


# ========================================
# ADMIN CONTRACT & INVOICING MODELS
# ========================================

class AdminContract(db.Model):
    """Contratti tra Pitch Partner e Club"""
    __tablename__ = 'admin_contracts'

    id = db.Column(db.Integer, primary_key=True)
    club_id = db.Column(db.Integer, db.ForeignKey('clubs.id'), nullable=False)

    # Piano sottoscritto
    plan_type = db.Column(db.String(50), nullable=False)  # basic, premium, elite
    plan_price = db.Column(db.Float, nullable=False)  # Prezzo annuale del piano

    # Add-ons acquistati (JSON array)
    addons = db.Column(db.JSON, default=[])  # [{"name": "Setup", "price": 2500}, ...]

    # Valore totale contratto
    total_value = db.Column(db.Float, nullable=False)  # ARR totale netto (piano + addons)

    # IVA
    vat_rate = db.Column(db.Float, default=22.0)  # Aliquota IVA %

    # Date contratto
    start_date = db.Column(db.Date, nullable=False)
    end_date = db.Column(db.Date, nullable=False)
    renewal_date = db.Column(db.Date)  # Data prossimo rinnovo

    # Stato contratto
    status = db.Column(db.String(50), default='active')  # draft, active, expired, cancelled, renewed

    # Termini di pagamento
    payment_terms = db.Column(db.String(50), default='annual')  # annual, semi_annual, quarterly, monthly
    payment_method = db.Column(db.String(50))  # bank_transfer, credit_card, sepa

    # Note e documenti
    notes = db.Column(db.Text)
    contract_document_url = db.Column(db.String(500))  # Link al documento firmato

    # Firma
    signed_by = db.Column(db.String(200))  # Nome del firmatario
    signed_date = db.Column(db.Date)

    # Metadata
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    created_by = db.Column(db.Integer)  # Admin ID che ha creato il contratto

    # Relazioni
    club = db.relationship('Club', backref=db.backref('admin_contracts', lazy='dynamic'))
    invoices = db.relationship('AdminInvoice', backref='contract', lazy='dynamic')

    @property
    def vat_amount(self):
        rate = self.vat_rate if self.vat_rate is not None else 22.0
        return round(self.total_value * (rate / 100), 2)

    @property
    def total_value_with_vat(self):
        return round(self.total_value + self.vat_amount, 2)

    def to_dict(self):
        vat_rate = self.vat_rate if self.vat_rate is not None else 22.0
        vat_amount = round(self.total_value * (vat_rate / 100), 2)
        total_with_vat = round(self.total_value + vat_amount, 2)
        return {
            'id': self.id,
            'club_id': self.club_id,
            'club_name': self.club.nome if self.club else None,
            'club_logo_url': self.club.logo_url if self.club else None,
            'plan_type': self.plan_type,
            'plan_price': self.plan_price,
            'addons': self.addons or [],
            'total_value': self.total_value,
            'vat_rate': vat_rate,
            'vat_amount': vat_amount,
            'total_value_with_vat': total_with_vat,
            'start_date': self.start_date.isoformat() if self.start_date else None,
            'end_date': self.end_date.isoformat() if self.end_date else None,
            'renewal_date': self.renewal_date.isoformat() if self.renewal_date else None,
            'status': self.status,
            'payment_terms': self.payment_terms,
            'payment_method': self.payment_method,
            'notes': self.notes,
            'contract_document_url': self.contract_document_url,
            'signed_by': self.signed_by,
            'signed_date': self.signed_date.isoformat() if self.signed_date else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'created_by': self.created_by
        }


class AdminInvoice(db.Model):
    """Fatture emesse da Pitch Partner ai Club"""
    __tablename__ = 'admin_invoices'

    id = db.Column(db.Integer, primary_key=True)
    contract_id = db.Column(db.Integer, db.ForeignKey('admin_contracts.id'), nullable=False)
    club_id = db.Column(db.Integer, db.ForeignKey('clubs.id'), nullable=False)

    # Numero fattura
    invoice_number = db.Column(db.String(50), unique=True, nullable=False)

    # Importi
    amount = db.Column(db.Float, nullable=False)  # Importo netto
    vat_rate = db.Column(db.Float, default=22.0)  # IVA %
    vat_amount = db.Column(db.Float)  # Importo IVA
    total_amount = db.Column(db.Float, nullable=False)  # Importo totale (netto + IVA)

    # Descrizione voci fattura (JSON array)
    line_items = db.Column(db.JSON, default=[])  # [{"description": "Piano Premium", "amount": 15000}, ...]

    # Date
    issue_date = db.Column(db.Date, nullable=False)  # Data emissione
    due_date = db.Column(db.Date, nullable=False)  # Data scadenza
    payment_date = db.Column(db.Date)  # Data pagamento effettivo

    # Stato pagamento
    status = db.Column(db.String(50), default='pending')  # draft, pending, paid, overdue, cancelled

    # Metodo pagamento
    payment_method = db.Column(db.String(50))  # bank_transfer, credit_card, sepa
    payment_reference = db.Column(db.String(200))  # Riferimento bonifico/transazione

    # Periodo di riferimento
    period_start = db.Column(db.Date)  # Inizio periodo fatturato
    period_end = db.Column(db.Date)  # Fine periodo fatturato

    # Note e documenti
    notes = db.Column(db.Text)
    invoice_document_url = db.Column(db.String(500))  # Link al PDF fattura

    # Metadata
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    created_by = db.Column(db.Integer)  # Admin ID

    # Relazioni
    club = db.relationship('Club', backref=db.backref('admin_invoices', lazy='dynamic'))

    def to_dict(self):
        return {
            'id': self.id,
            'contract_id': self.contract_id,
            'club_id': self.club_id,
            'club_name': self.club.nome if self.club else None,
            'invoice_number': self.invoice_number,
            'amount': self.amount,
            'vat_rate': self.vat_rate,
            'vat_amount': self.vat_amount,
            'total_amount': self.total_amount,
            'line_items': self.line_items or [],
            'issue_date': self.issue_date.isoformat() if self.issue_date else None,
            'due_date': self.due_date.isoformat() if self.due_date else None,
            'payment_date': self.payment_date.isoformat() if self.payment_date else None,
            'status': self.status,
            'payment_method': self.payment_method,
            'payment_reference': self.payment_reference,
            'period_start': self.period_start.isoformat() if self.period_start else None,
            'period_end': self.period_end.isoformat() if self.period_end else None,
            'notes': self.notes,
            'invoice_document_url': self.invoice_document_url,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'created_by': self.created_by
        }
