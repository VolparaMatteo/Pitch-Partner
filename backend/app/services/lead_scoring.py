"""
Lead Scoring Service
Calculates a 0-100 score for leads based on 5 categories:
- Profilo Completo (default 15pt max)
- Potenziale Deal (default 25pt max)
- Engagement (default 25pt max)
- Pipeline (default 25pt max)
- Contatti (default 10pt max)

Weights can be customized per club via LeadScoreConfig.
"""

from datetime import datetime, timedelta

# Default configuration values
DEFAULT_WEIGHTS = {
    'profile': 15,
    'deal': 25,
    'engagement': 25,
    'pipeline': 25,
    'contacts': 10
}

DEFAULT_THRESHOLDS = {
    'cold': 33,
    'warm': 66
}


def _score_profile(lead, max_points=15):
    """Profilo Completo - calculates raw score out of 15, then scales to max_points"""
    score = 0
    # Basic fields (2pt each)
    if _get(lead, 'email'):
        score += 2
    if _get(lead, 'telefono'):
        score += 2
    if _get(lead, 'partita_iva'):
        score += 2
    # 1pt fields
    if _get(lead, 'sito_web'):
        score += 1
    if _get(lead, 'indirizzo_sede'):
        score += 1
    # Referente fields (1pt each)
    if _get(lead, 'referente_nome'):
        score += 1
    if _get(lead, 'referente_cognome'):
        score += 1
    if _get(lead, 'referente_ruolo'):
        score += 1
    if _get(lead, 'referente_contatto'):
        score += 1
    # Logo (1pt)
    if _get(lead, 'logo_url'):
        score += 1
    # Social media (2pt - at least one present)
    socials = ['facebook', 'instagram', 'tiktok', 'linkedin', 'twitter']
    if any(_get(lead, s) for s in socials):
        score += 2
    # Scale to max_points
    raw_score = min(score, 15)
    return round(raw_score * max_points / 15)


def _score_deal(lead, max_points=25):
    """Potenziale Deal - calculates raw score out of 25, then scales to max_points"""
    score = 0
    # Valore stimato (max 17pt)
    valore = _get(lead, 'valore_stimato') or 0
    if valore >= 500000:
        score += 17
    elif valore >= 200000:
        score += 13
    elif valore >= 50000:
        score += 8
    elif valore > 0:
        score += 4

    # Probabilita (max 8pt)
    prob = _get(lead, 'probabilita_chiusura') or 0
    score += min(round(prob * 0.08), 8)

    # Scale to max_points
    raw_score = min(score, 25)
    return round(raw_score * max_points / 25)


def _score_engagement(activities, max_points=25):
    """Engagement - calculates raw score out of 25, then scales to max_points"""
    score = 0
    count = len(activities) if activities else 0

    # Activity count (max 17pt)
    if count > 10:
        score += 17
    elif count >= 6:
        score += 13
    elif count >= 3:
        score += 8
    elif count >= 1:
        score += 4

    # Recency (max 8pt)
    if activities:
        now = datetime.utcnow()
        dates = []
        for a in activities:
            d = _get(a, 'data_attivita')
            if d:
                if isinstance(d, str):
                    try:
                        d = datetime.fromisoformat(d.replace('Z', '+00:00')).replace(tzinfo=None)
                    except (ValueError, AttributeError):
                        continue
                dates.append(d)

        if dates:
            latest = max(dates)
            days_ago = (now - latest).days
            if days_ago < 7:
                score += 8
            elif days_ago < 14:
                score += 6
            elif days_ago < 30:
                score += 3
            elif days_ago < 60:
                score += 1

    # Scale to max_points
    raw_score = min(score, 25)
    return round(raw_score * max_points / 25)


def _score_pipeline(lead, max_points=25):
    """Pipeline - calculates raw score out of 25, then scales to max_points"""
    status_scores = {
        'nuovo': 0,
        'contattato': 5,
        'in_trattativa': 10,
        'proposta_inviata': 15,
        'negoziazione': 20,
        'vinto': 25,
        'perso': 0,
    }
    status = _get(lead, 'status') or 'nuovo'
    raw_score = status_scores.get(status, 0)
    return round(raw_score * max_points / 25)


def _score_contacts(contacts_count, max_points=10):
    """Contatti - calculates raw score out of 10, then scales to max_points"""
    if contacts_count >= 4:
        raw_score = 10
    elif contacts_count == 3:
        raw_score = 7
    elif contacts_count == 2:
        raw_score = 5
    elif contacts_count == 1:
        raw_score = 2
    else:
        raw_score = 0
    return round(raw_score * max_points / 10)


def _get_label(score, threshold_cold=33, threshold_warm=66):
    """Temperature label from score using configurable thresholds."""
    if score <= threshold_cold:
        return 'FREDDO'
    elif score <= threshold_warm:
        return 'TIEPIDO'
    else:
        return 'CALDO'


def _get(obj, attr):
    """Get attribute from ORM object or dict."""
    if isinstance(obj, dict):
        return obj.get(attr)
    return getattr(obj, attr, None)


def calculate_lead_score(lead, activities=None, contacts_count=0, config=None):
    """
    Calculate lead score.

    Args:
        lead: Lead ORM object or dict
        activities: list of LeadActivity ORM objects or dicts
        contacts_count: number of ContactPerson records for the lead
        config: LeadScoreConfig object or dict with custom weights/thresholds

    Returns:
        dict with score, label, breakdown
    """
    if activities is None:
        activities = []

    # Get weights from config or use defaults
    if config:
        weights = {
            'profile': _get(config, 'weight_profile') or DEFAULT_WEIGHTS['profile'],
            'deal': _get(config, 'weight_deal') or DEFAULT_WEIGHTS['deal'],
            'engagement': _get(config, 'weight_engagement') or DEFAULT_WEIGHTS['engagement'],
            'pipeline': _get(config, 'weight_pipeline') or DEFAULT_WEIGHTS['pipeline'],
            'contacts': _get(config, 'weight_contacts') or DEFAULT_WEIGHTS['contacts']
        }
        threshold_cold = _get(config, 'threshold_cold') or DEFAULT_THRESHOLDS['cold']
        threshold_warm = _get(config, 'threshold_warm') or DEFAULT_THRESHOLDS['warm']
    else:
        weights = DEFAULT_WEIGHTS.copy()
        threshold_cold = DEFAULT_THRESHOLDS['cold']
        threshold_warm = DEFAULT_THRESHOLDS['warm']

    profile = _score_profile(lead, weights['profile'])
    deal = _score_deal(lead, weights['deal'])
    engagement = _score_engagement(activities, weights['engagement'])
    pipeline = _score_pipeline(lead, weights['pipeline'])
    contacts = _score_contacts(contacts_count, weights['contacts'])

    total = profile + deal + engagement + pipeline + contacts
    total = min(total, 100)

    return {
        'score': total,
        'label': _get_label(total, threshold_cold, threshold_warm),
        'breakdown': {
            'profile': {'score': profile, 'max': weights['profile']},
            'deal': {'score': deal, 'max': weights['deal']},
            'engagement': {'score': engagement, 'max': weights['engagement']},
            'pipeline': {'score': pipeline, 'max': weights['pipeline']},
            'contacts': {'score': contacts, 'max': weights['contacts']},
        },
        'thresholds': {
            'cold': threshold_cold,
            'warm': threshold_warm
        }
    }
