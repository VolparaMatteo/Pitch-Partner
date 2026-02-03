import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  HiOutlineDocumentDuplicate,
  HiOutlinePlus,
  HiOutlinePencil,
  HiOutlineTrash,
  HiOutlineEye,
  HiOutlineDocumentText,
  HiOutlineCheck,
  HiOutlineXMark,
  HiOutlineSparkles,
  HiOutlineSwatch,
  HiOutlinePhoto,
  HiOutlineArrowLeft
} from 'react-icons/hi2';
import api from '../services/api';

const ProposalTemplates = () => {
  const navigate = useNavigate();
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [showPreview, setShowPreview] = useState(null);

  const [formData, setFormData] = useState({
    nome: '',
    descrizione: '',
    tipologia: 'standard',
    intestazione: '',
    footer: '',
    colore_primario: '#85FF00',
    colore_secondario: '#1A1A1A',
    logo_url: '',
    copertina_url: '',
    termini_default: '',
    note_default: '',
    attivo: true
  });

  const tipologie = [
    { value: 'standard', label: 'Standard', icon: HiOutlineDocumentText },
    { value: 'premium', label: 'Premium', icon: HiOutlineSparkles },
    { value: 'evento', label: 'Evento', icon: HiOutlinePhoto },
    { value: 'partnership', label: 'Partnership', icon: HiOutlineDocumentDuplicate }
  ];

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const response = await api.get('/club/proposals/templates');
      setTemplates(response.data);
    } catch (error) {
      console.error('Error fetching templates:', error);
      // Demo data
      setTemplates([
        {
          id: 1,
          nome: 'Template Standard',
          descrizione: 'Template base per proposte commerciali',
          tipologia: 'standard',
          intestazione: 'Proposta di Partnership',
          colore_primario: '#85FF00',
          colore_secondario: '#1A1A1A',
          attivo: true,
          proposte_count: 12
        },
        {
          id: 2,
          nome: 'Template Premium',
          descrizione: 'Per proposte di alto valore con branding esclusivo',
          tipologia: 'premium',
          intestazione: 'Partnership Esclusiva',
          colore_primario: '#FFD700',
          colore_secondario: '#1A1A1A',
          attivo: true,
          proposte_count: 5
        },
        {
          id: 3,
          nome: 'Template Evento',
          descrizione: 'Specifico per sponsorizzazioni eventi',
          tipologia: 'evento',
          intestazione: 'Sponsorizzazione Evento',
          colore_primario: '#3B82F6',
          colore_secondario: '#1E3A8A',
          attivo: true,
          proposte_count: 8
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingTemplate) {
        await api.put(`/club/proposals/templates/${editingTemplate.id}`, formData);
      } else {
        await api.post('/club/proposals/templates', formData);
      }
      fetchTemplates();
      handleCloseModal();
    } catch (error) {
      console.error('Error saving template:', error);
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/club/proposals/templates/${id}`);
      fetchTemplates();
      setShowDeleteConfirm(null);
    } catch (error) {
      console.error('Error deleting template:', error);
    }
  };

  const handleEdit = (template) => {
    setEditingTemplate(template);
    setFormData({
      nome: template.nome || '',
      descrizione: template.descrizione || '',
      tipologia: template.tipologia || 'standard',
      intestazione: template.intestazione || '',
      footer: template.footer || '',
      colore_primario: template.colore_primario || '#85FF00',
      colore_secondario: template.colore_secondario || '#1A1A1A',
      logo_url: template.logo_url || '',
      copertina_url: template.copertina_url || '',
      termini_default: template.termini_default || '',
      note_default: template.note_default || '',
      attivo: template.attivo !== false
    });
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingTemplate(null);
    setFormData({
      nome: '',
      descrizione: '',
      tipologia: 'standard',
      intestazione: '',
      footer: '',
      colore_primario: '#85FF00',
      colore_secondario: '#1A1A1A',
      logo_url: '',
      copertina_url: '',
      termini_default: '',
      note_default: '',
      attivo: true
    });
  };

  const handleUseTemplate = (template) => {
    navigate('/club/proposals/new', { state: { templateId: template.id } });
  };

  const getTipologiaInfo = (tipo) => {
    return tipologie.find(t => t.value === tipo) || tipologie[0];
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#85FF00]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-100">
      {/* Header */}
      <div className="bg-[#0D0D0D] text-white">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center gap-4 mb-6">
            <button
              onClick={() => navigate('/club/proposals')}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <HiOutlineArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold">Template Proposte</h1>
              <p className="text-neutral-400 mt-1">Gestisci i template per le tue proposte commerciali</p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white/5 rounded-xl p-4">
              <div className="text-3xl font-bold text-[#85FF00]">{templates.length}</div>
              <div className="text-sm text-neutral-400">Template Totali</div>
            </div>
            <div className="bg-white/5 rounded-xl p-4">
              <div className="text-3xl font-bold text-white">
                {templates.filter(t => t.attivo).length}
              </div>
              <div className="text-sm text-neutral-400">Attivi</div>
            </div>
            <div className="bg-white/5 rounded-xl p-4">
              <div className="text-3xl font-bold text-white">
                {templates.reduce((acc, t) => acc + (t.proposte_count || 0), 0)}
              </div>
              <div className="text-sm text-neutral-400">Proposte Create</div>
            </div>
            <div className="bg-white/5 rounded-xl p-4">
              <div className="text-3xl font-bold text-white">
                {tipologie.length}
              </div>
              <div className="text-sm text-neutral-400">Tipologie</div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Actions */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-semibold text-neutral-800">I tuoi Template</h2>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[#85FF00] text-black font-medium rounded-lg hover:bg-[#70E000] transition-colors"
          >
            <HiOutlinePlus className="w-5 h-5" />
            Nuovo Template
          </button>
        </div>

        {/* Templates Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.map(template => {
            const tipologia = getTipologiaInfo(template.tipologia);
            const TipoIcon = tipologia.icon;

            return (
              <div
                key={template.id}
                className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 group"
              >
                {/* Preview Header */}
                <div
                  className="h-32 relative"
                  style={{
                    background: `linear-gradient(135deg, ${template.colore_primario} 0%, ${template.colore_secondario} 100%)`
                  }}
                >
                  <div className="absolute inset-0 bg-black/20"></div>
                  <div className="absolute bottom-4 left-4 right-4">
                    <div className="text-white font-bold text-lg drop-shadow-lg">
                      {template.intestazione || template.nome}
                    </div>
                  </div>

                  {/* Status Badge */}
                  <div className="absolute top-3 right-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      template.attivo
                        ? 'bg-green-500/90 text-white'
                        : 'bg-neutral-500/90 text-white'
                    }`}>
                      {template.attivo ? 'Attivo' : 'Inattivo'}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-5">
                  <div className="flex items-start gap-3 mb-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center"
                      style={{ backgroundColor: `${template.colore_primario}20` }}
                    >
                      <TipoIcon
                        className="w-5 h-5"
                        style={{ color: template.colore_primario }}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-neutral-800 truncate">
                        {template.nome}
                      </h3>
                      <span className="text-xs text-neutral-500 capitalize">
                        {tipologia.label}
                      </span>
                    </div>
                  </div>

                  {template.descrizione && (
                    <p className="text-sm text-neutral-600 mb-4 line-clamp-2">
                      {template.descrizione}
                    </p>
                  )}

                  {/* Stats */}
                  <div className="flex items-center gap-4 mb-4 pb-4 border-b border-neutral-100">
                    <div className="flex items-center gap-1.5 text-sm text-neutral-500">
                      <HiOutlineDocumentText className="w-4 h-4" />
                      <span>{template.proposte_count || 0} proposte</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleUseTemplate(template)}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-[#85FF00] text-black font-medium rounded-lg hover:bg-[#70E000] transition-colors text-sm"
                    >
                      <HiOutlinePlus className="w-4 h-4" />
                      Usa Template
                    </button>
                    <button
                      onClick={() => setShowPreview(template)}
                      className="p-2 text-neutral-500 hover:text-neutral-700 hover:bg-neutral-100 rounded-lg transition-colors"
                      title="Anteprima"
                    >
                      <HiOutlineEye className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleEdit(template)}
                      className="p-2 text-neutral-500 hover:text-neutral-700 hover:bg-neutral-100 rounded-lg transition-colors"
                      title="Modifica"
                    >
                      <HiOutlinePencil className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => setShowDeleteConfirm(template)}
                      className="p-2 text-neutral-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Elimina"
                    >
                      <HiOutlineTrash className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Add New Card */}
          <button
            onClick={() => setShowModal(true)}
            className="bg-white/50 border-2 border-dashed border-neutral-300 rounded-2xl min-h-[320px] flex flex-col items-center justify-center gap-3 hover:border-[#85FF00] hover:bg-[#85FF00]/5 transition-colors group"
          >
            <div className="w-16 h-16 rounded-full bg-neutral-100 flex items-center justify-center group-hover:bg-[#85FF00]/20 transition-colors">
              <HiOutlinePlus className="w-8 h-8 text-neutral-400 group-hover:text-[#85FF00] transition-colors" />
            </div>
            <span className="text-neutral-500 font-medium group-hover:text-neutral-700">
              Crea Nuovo Template
            </span>
          </button>
        </div>
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-neutral-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-neutral-800">
                  {editingTemplate ? 'Modifica Template' : 'Nuovo Template'}
                </h2>
                <button
                  onClick={handleCloseModal}
                  className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
                >
                  <HiOutlineXMark className="w-5 h-5" />
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Basic Info */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-neutral-500 uppercase tracking-wide">
                  Informazioni Base
                </h3>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Nome Template *
                  </label>
                  <input
                    type="text"
                    value={formData.nome}
                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                    className="w-full px-4 py-2.5 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-[#85FF00] focus:border-transparent"
                    placeholder="es. Template Premium"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Descrizione
                  </label>
                  <textarea
                    value={formData.descrizione}
                    onChange={(e) => setFormData({ ...formData, descrizione: e.target.value })}
                    className="w-full px-4 py-2.5 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-[#85FF00] focus:border-transparent"
                    rows="2"
                    placeholder="Breve descrizione del template..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Tipologia
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {tipologie.map(tipo => {
                      const Icon = tipo.icon;
                      return (
                        <button
                          key={tipo.value}
                          type="button"
                          onClick={() => setFormData({ ...formData, tipologia: tipo.value })}
                          className={`p-3 rounded-xl border-2 transition-all ${
                            formData.tipologia === tipo.value
                              ? 'border-[#85FF00] bg-[#85FF00]/10'
                              : 'border-neutral-200 hover:border-neutral-300'
                          }`}
                        >
                          <Icon className={`w-5 h-5 mx-auto mb-1 ${
                            formData.tipologia === tipo.value ? 'text-[#85FF00]' : 'text-neutral-400'
                          }`} />
                          <span className={`text-xs font-medium ${
                            formData.tipologia === tipo.value ? 'text-neutral-800' : 'text-neutral-500'
                          }`}>
                            {tipo.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Branding */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-neutral-500 uppercase tracking-wide flex items-center gap-2">
                  <HiOutlineSwatch className="w-4 h-4" />
                  Branding
                </h3>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">
                      Colore Primario
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={formData.colore_primario}
                        onChange={(e) => setFormData({ ...formData, colore_primario: e.target.value })}
                        className="w-12 h-10 rounded-lg cursor-pointer border-0"
                      />
                      <input
                        type="text"
                        value={formData.colore_primario}
                        onChange={(e) => setFormData({ ...formData, colore_primario: e.target.value })}
                        className="flex-1 px-3 py-2 border border-neutral-300 rounded-lg text-sm"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">
                      Colore Secondario
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={formData.colore_secondario}
                        onChange={(e) => setFormData({ ...formData, colore_secondario: e.target.value })}
                        className="w-12 h-10 rounded-lg cursor-pointer border-0"
                      />
                      <input
                        type="text"
                        value={formData.colore_secondario}
                        onChange={(e) => setFormData({ ...formData, colore_secondario: e.target.value })}
                        className="flex-1 px-3 py-2 border border-neutral-300 rounded-lg text-sm"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Intestazione Proposta
                  </label>
                  <input
                    type="text"
                    value={formData.intestazione}
                    onChange={(e) => setFormData({ ...formData, intestazione: e.target.value })}
                    className="w-full px-4 py-2.5 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-[#85FF00] focus:border-transparent"
                    placeholder="es. Proposta di Partnership Esclusiva"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Footer
                  </label>
                  <input
                    type="text"
                    value={formData.footer}
                    onChange={(e) => setFormData({ ...formData, footer: e.target.value })}
                    className="w-full px-4 py-2.5 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-[#85FF00] focus:border-transparent"
                    placeholder="es. © 2024 Club Name - Tutti i diritti riservati"
                  />
                </div>
              </div>

              {/* Default Content */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-neutral-500 uppercase tracking-wide">
                  Contenuti Predefiniti
                </h3>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Termini e Condizioni
                  </label>
                  <textarea
                    value={formData.termini_default}
                    onChange={(e) => setFormData({ ...formData, termini_default: e.target.value })}
                    className="w-full px-4 py-2.5 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-[#85FF00] focus:border-transparent"
                    rows="3"
                    placeholder="Termini standard da includere..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Note Predefinite
                  </label>
                  <textarea
                    value={formData.note_default}
                    onChange={(e) => setFormData({ ...formData, note_default: e.target.value })}
                    className="w-full px-4 py-2.5 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-[#85FF00] focus:border-transparent"
                    rows="2"
                    placeholder="Note da includere automaticamente..."
                  />
                </div>
              </div>

              {/* Status */}
              <div className="flex items-center justify-between p-4 bg-neutral-50 rounded-xl">
                <div>
                  <div className="font-medium text-neutral-800">Template Attivo</div>
                  <div className="text-sm text-neutral-500">
                    I template attivi sono disponibili per nuove proposte
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, attivo: !formData.attivo })}
                  className={`relative w-12 h-6 rounded-full transition-colors ${
                    formData.attivo ? 'bg-[#85FF00]' : 'bg-neutral-300'
                  }`}
                >
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                    formData.attivo ? 'translate-x-7' : 'translate-x-1'
                  }`} />
                </button>
              </div>

              {/* Preview */}
              <div>
                <h3 className="text-sm font-semibold text-neutral-500 uppercase tracking-wide mb-3">
                  Anteprima
                </h3>
                <div
                  className="h-24 rounded-xl relative overflow-hidden"
                  style={{
                    background: `linear-gradient(135deg, ${formData.colore_primario} 0%, ${formData.colore_secondario} 100%)`
                  }}
                >
                  <div className="absolute inset-0 bg-black/20"></div>
                  <div className="absolute bottom-4 left-4 right-4">
                    <div className="text-white font-bold drop-shadow-lg">
                      {formData.intestazione || formData.nome || 'Titolo Proposta'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t border-neutral-200">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-6 py-2.5 text-neutral-700 font-medium hover:bg-neutral-100 rounded-lg transition-colors"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-2 px-6 py-2.5 bg-[#85FF00] text-black font-medium rounded-lg hover:bg-[#70E000] transition-colors"
                >
                  <HiOutlineCheck className="w-5 h-5" />
                  {editingTemplate ? 'Salva Modifiche' : 'Crea Template'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <HiOutlineTrash className="w-6 h-6 text-red-600" />
            </div>
            <h3 className="text-lg font-bold text-center text-neutral-800 mb-2">
              Elimina Template
            </h3>
            <p className="text-center text-neutral-600 mb-6">
              Sei sicuro di voler eliminare "{showDeleteConfirm.nome}"?
              {showDeleteConfirm.proposte_count > 0 && (
                <span className="block mt-2 text-sm text-amber-600">
                  Questo template è stato usato per {showDeleteConfirm.proposte_count} proposte.
                </span>
              )}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="flex-1 px-4 py-2.5 text-neutral-700 font-medium hover:bg-neutral-100 rounded-lg transition-colors"
              >
                Annulla
              </button>
              <button
                onClick={() => handleDelete(showDeleteConfirm.id)}
                className="flex-1 px-4 py-2.5 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors"
              >
                Elimina
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full overflow-hidden">
            {/* Preview Header */}
            <div
              className="h-40 relative"
              style={{
                background: `linear-gradient(135deg, ${showPreview.colore_primario} 0%, ${showPreview.colore_secondario} 100%)`
              }}
            >
              <div className="absolute inset-0 bg-black/20"></div>
              <button
                onClick={() => setShowPreview(null)}
                className="absolute top-4 right-4 p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
              >
                <HiOutlineXMark className="w-5 h-5 text-white" />
              </button>
              <div className="absolute bottom-6 left-6 right-6">
                <div className="text-white font-bold text-xl drop-shadow-lg">
                  {showPreview.intestazione || showPreview.nome}
                </div>
                <div className="text-white/80 text-sm mt-1">
                  {getTipologiaInfo(showPreview.tipologia).label}
                </div>
              </div>
            </div>

            {/* Preview Content */}
            <div className="p-6">
              <h3 className="font-semibold text-neutral-800 mb-2">
                {showPreview.nome}
              </h3>
              {showPreview.descrizione && (
                <p className="text-neutral-600 mb-4">{showPreview.descrizione}</p>
              )}

              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm">
                  <span className="text-neutral-500 w-24">Proposte:</span>
                  <span className="font-medium">{showPreview.proposte_count || 0}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <span className="text-neutral-500 w-24">Stato:</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    showPreview.attivo
                      ? 'bg-green-100 text-green-700'
                      : 'bg-neutral-100 text-neutral-600'
                  }`}>
                    {showPreview.attivo ? 'Attivo' : 'Inattivo'}
                  </span>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-neutral-200 flex gap-3">
                <button
                  onClick={() => {
                    setShowPreview(null);
                    handleUseTemplate(showPreview);
                  }}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-[#85FF00] text-black font-medium rounded-lg hover:bg-[#70E000] transition-colors"
                >
                  <HiOutlinePlus className="w-5 h-5" />
                  Usa Questo Template
                </button>
                <button
                  onClick={() => {
                    setShowPreview(null);
                    handleEdit(showPreview);
                  }}
                  className="px-4 py-2.5 text-neutral-700 font-medium hover:bg-neutral-100 rounded-lg transition-colors"
                >
                  Modifica
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProposalTemplates;
