"""
Service per generazione PDF contratti, merge template, hash e firma digitale.
Usa WeasyPrint per PDF generation e signature_pad.js per firma lato client.
"""

import hashlib
import json
import os
import re
import uuid
from datetime import datetime

from weasyprint import HTML, CSS

from app import db
from app.models import (
    AdminContract, Club, ContractTemplate,
    ContractDocument, ContractSignature
)


class ContractDocumentService:

    UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), 'uploads', 'contracts')

    @classmethod
    def _ensure_upload_dir(cls):
        os.makedirs(cls.UPLOAD_DIR, exist_ok=True)

    # ------------------------------------------------------------------
    # Merge context
    # ------------------------------------------------------------------

    @classmethod
    def build_merge_context(cls, contract, club):
        """Costruisce dizionario con tutti i merge fields."""

        def fmt_date(d):
            if not d:
                return ''
            if isinstance(d, str):
                try:
                    d = datetime.fromisoformat(d).date()
                except Exception:
                    return d
            return d.strftime('%d/%m/%Y')

        def fmt_currency(val):
            if val is None:
                return ''
            return f"\u20ac {val:,.2f}".replace(',', 'X').replace('.', ',').replace('X', '.')

        addons_list = contract.addons or []
        addons_text = ', '.join(
            f"{a.get('name', '')} ({fmt_currency(a.get('price', 0))})"
            for a in addons_list
        ) if addons_list else 'Nessuno'

        return {
            # Club
            'club': {
                'nome': club.nome or '',
                'email': club.email or '',
                'indirizzo_sede_legale': club.indirizzo_sede_legale or '',
                'referente_nome': club.referente_nome or '',
                'referente_cognome': club.referente_cognome or '',
                'referente_ruolo': club.referente_ruolo or '',
                'partita_iva': club.partita_iva or '',
                'codice_fiscale': club.codice_fiscale or '',
                'telefono': club.telefono or '',
            },
            # Contract
            'contract': {
                'plan_type': contract.plan_type or '',
                'plan_price': fmt_currency(contract.plan_price),
                'total_value': fmt_currency(contract.total_value),
                'vat_rate': f"{contract.vat_rate or 22}%",
                'vat_amount': fmt_currency(contract.vat_amount),
                'total_value_with_vat': fmt_currency(contract.total_value_with_vat),
                'start_date': fmt_date(contract.start_date),
                'end_date': fmt_date(contract.end_date),
                'payment_terms': contract.payment_terms or '',
                'addons': addons_text,
                'status': contract.status or '',
            },
            # Utilities
            'data_odierna': datetime.now().strftime('%d/%m/%Y'),
            'anno_corrente': str(datetime.now().year),
        }

    # ------------------------------------------------------------------
    # Template rendering
    # ------------------------------------------------------------------

    @staticmethod
    def render_template(template_html, context):
        """
        Sostituisce variabili {{variabile}} con dot-notation.
        Pattern identico a email_service.py.
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

        pattern = r'\{\{\s*([^}]+)\s*\}\}'
        return re.sub(pattern, replace_var, template_html)

    # ------------------------------------------------------------------
    # PDF generation
    # ------------------------------------------------------------------

    @classmethod
    def generate_pdf(cls, html_content, css_content=None):
        """Genera PDF bytes da HTML + CSS opzionale."""
        stylesheets = []
        if css_content:
            stylesheets.append(CSS(string=css_content))
        return HTML(string=html_content).write_pdf(stylesheets=stylesheets or None)

    # ------------------------------------------------------------------
    # Hash
    # ------------------------------------------------------------------

    @staticmethod
    def compute_hash(pdf_bytes):
        return hashlib.sha256(pdf_bytes).hexdigest()

    # ------------------------------------------------------------------
    # Save PDF to disk
    # ------------------------------------------------------------------

    @classmethod
    def save_pdf(cls, pdf_bytes, filename=None):
        """Salva PDF in uploads/contracts/, ritorna URL relativo."""
        cls._ensure_upload_dir()
        if not filename:
            filename = f"contract_{uuid.uuid4().hex[:12]}.pdf"
        filepath = os.path.join(cls.UPLOAD_DIR, filename)
        with open(filepath, 'wb') as f:
            f.write(pdf_bytes)
        return f'/uploads/contracts/{filename}'

    # ------------------------------------------------------------------
    # Pipeline: genera documento contratto
    # ------------------------------------------------------------------

    @classmethod
    def generate_contract_document(cls, contract_id, template_id, created_by):
        """Pipeline completa: template + merge + PDF + save + crea record."""
        contract = AdminContract.query.get(contract_id)
        if not contract:
            raise ValueError('Contratto non trovato')

        template = ContractTemplate.query.get(template_id)
        if not template:
            raise ValueError('Template non trovato')

        club = Club.query.get(contract.club_id)
        if not club:
            raise ValueError('Club non trovato')

        # Build context & render
        context = cls.build_merge_context(contract, club)
        rendered_html = cls.render_template(template.corpo_html, context)

        # Wrap in full HTML document
        full_html = f"""<!DOCTYPE html>
<html><head><meta charset="utf-8">
<style>{template.stile_css or ''}</style>
</head><body>{rendered_html}</body></html>"""

        # Generate PDF
        pdf_bytes = cls.generate_pdf(full_html)
        pdf_hash = cls.compute_hash(pdf_bytes)

        # Versione incrementale
        last_doc = ContractDocument.query.filter_by(
            contract_id=contract_id
        ).order_by(ContractDocument.versione.desc()).first()
        versione = (last_doc.versione + 1) if last_doc else 1

        # File name & save
        safe_club = re.sub(r'[^a-zA-Z0-9_-]', '_', club.nome)[:30]
        filename = f"contratto_{safe_club}_v{versione}_{uuid.uuid4().hex[:8]}.pdf"
        file_url = cls.save_pdf(pdf_bytes, filename)

        # Create record
        token = uuid.uuid4().hex
        doc = ContractDocument(
            contract_id=contract_id,
            template_id=template_id,
            versione=versione,
            token=token,
            file_url=file_url,
            file_name=filename,
            file_size=len(pdf_bytes),
            document_hash=pdf_hash,
            status='draft',
            html_snapshot=full_html,
            merge_data_snapshot=json.dumps(context, ensure_ascii=False),
            created_by=created_by
        )
        db.session.add(doc)
        db.session.commit()

        return doc

    # ------------------------------------------------------------------
    # Genera PDF firmato
    # ------------------------------------------------------------------

    @classmethod
    def generate_signed_pdf(cls, document_id, signature_data):
        """
        Prende html_snapshot, appende blocco firma, ri-genera PDF.
        signature_data: {signer_name, signer_email, signer_role, signature_image, ip_address}
        """
        doc = ContractDocument.query.get(document_id)
        if not doc:
            raise ValueError('Documento non trovato')

        html_snapshot = doc.html_snapshot
        if not html_snapshot:
            raise ValueError('HTML snapshot non disponibile')

        # Build firma block
        now = datetime.utcnow()
        signature_block = f"""
<div style="margin-top:40px; padding:30px; border-top:2px solid #333; page-break-inside:avoid;">
  <h3 style="margin:0 0 20px 0; font-size:16px;">Firma Digitale</h3>
  <div style="display:flex; gap:40px; align-items:flex-end;">
    <div>
      <img src="{signature_data.get('signature_image', '')}" style="max-width:300px; max-height:120px; border-bottom:1px solid #333;" />
      <div style="margin-top:8px; font-size:13px; color:#333;">
        <strong>{signature_data.get('signer_name', '')}</strong><br/>
        {signature_data.get('signer_role', '')}<br/>
        {signature_data.get('signer_email', '')}
      </div>
    </div>
    <div style="font-size:11px; color:#666;">
      <div>Data: {now.strftime('%d/%m/%Y %H:%M:%S')} UTC</div>
      <div>IP: {signature_data.get('ip_address', 'N/A')}</div>
      <div>Hash documento: {doc.document_hash}</div>
    </div>
  </div>
</div>
"""
        # Insert before </body>
        if '</body>' in html_snapshot:
            signed_html = html_snapshot.replace('</body>', signature_block + '</body>')
        else:
            signed_html = html_snapshot + signature_block

        # Generate signed PDF
        pdf_bytes = cls.generate_pdf(signed_html)
        pdf_hash = cls.compute_hash(pdf_bytes)

        # Save with _signed suffix
        base_name = os.path.splitext(doc.file_name or 'contract')[0]
        signed_filename = f"{base_name}_signed.pdf"
        signed_url = cls.save_pdf(pdf_bytes, signed_filename)

        return signed_url, pdf_hash, len(pdf_bytes)
