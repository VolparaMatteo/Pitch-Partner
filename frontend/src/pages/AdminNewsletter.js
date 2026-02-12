import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAuth } from '../utils/auth';
import { adminNewsletterAPI, adminEmailAPI } from '../services/api';
import '../styles/template-style.css';

import {
  HiOutlineMegaphone,
  HiOutlineUserGroup,
  HiOutlinePaperAirplane,
  HiOutlineEnvelope,
  HiOutlinePlus,
  HiOutlineTrash,
  HiOutlinePencilSquare,
  HiOutlineXMark,
  HiOutlineChevronLeft,
  HiOutlineChevronRight,
  HiOutlineMagnifyingGlass,
  HiOutlineEye
} from 'react-icons/hi2';

const STATUS_MAP = {
  bozza:   { label: 'Bozza',    cls: 'tp-badge tp-badge-neutral' },
  in_invio:{ label: 'In Invio', cls: 'tp-badge tp-badge-warning' },
  inviata: { label: 'Inviata',  cls: 'tp-badge tp-badge-success' },
  errore:  { label: 'Errore',   cls: 'tp-badge tp-badge-danger' },
};

function AdminNewsletter() {
  const navigate = useNavigate();
  const { user } = getAuth();

  const [activeTab, setActiveTab] = useState('gruppi');

  // Groups
  const [groups, setGroups] = useState([]);
  const [loadingGroups, setLoadingGroups] = useState(false);
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [editingGroup, setEditingGroup] = useState(null);
  const [groupForm, setGroupForm] = useState({ nome: '', descrizione: '', colore: '#6B7280' });

  // Group detail
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [groupDetail, setGroupDetail] = useState(null);
  const [recipientsPage, setRecipientsPage] = useState(1);
  const [recipientsData, setRecipientsData] = useState(null);
  const [recipientSearch, setRecipientSearch] = useState('');
  const [newRecipientsText, setNewRecipientsText] = useState('');
  const [addingRecipients, setAddingRecipients] = useState(false);

  // Campaigns
  const [campaigns, setCampaigns] = useState([]);
  const [campaignsPage, setCampaignsPage] = useState(1);
  const [campaignsPages, setCampaignsPages] = useState(0);
  const [loadingCampaigns, setLoadingCampaigns] = useState(false);
  const [showCampaignModal, setShowCampaignModal] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState(null);
  const [campaignForm, setCampaignForm] = useState({
    titolo: '', oggetto: '', corpo_html: '', account_key: '', group_ids: []
  });
  const [showCampaignDetail, setShowCampaignDetail] = useState(null);
  const [sendingCampaign, setSendingCampaign] = useState(false);

  // Email accounts
  const [emailAccounts, setEmailAccounts] = useState([]);

  useEffect(() => {
    if (!user || user.role !== 'admin') { navigate('/admin/login'); return; }
    fetchAccounts();
  }, [user, navigate]);

  useEffect(() => {
    if (activeTab === 'gruppi') fetchGroups();
    if (activeTab === 'campagne') fetchCampaigns();
  }, [activeTab]);

  // ------------------------------------------------------------------ Fetchers
  const fetchAccounts = async () => {
    try { const res = await adminEmailAPI.getAccounts(); setEmailAccounts(res.data.accounts || []); } catch (e) { console.error(e); }
  };
  const fetchGroups = async () => {
    setLoadingGroups(true);
    try { const res = await adminNewsletterAPI.getGroups(); setGroups(res.data.groups || []); } catch (e) { console.error(e); }
    setLoadingGroups(false);
  };
  const fetchGroupDetail = async (groupId) => {
    try { const res = await adminNewsletterAPI.getGroup(groupId); setGroupDetail(res.data); } catch (e) { console.error(e); }
  };
  const fetchRecipients = useCallback(async (groupId, page = 1, search = '') => {
    try { const res = await adminNewsletterAPI.getRecipients(groupId, { page, per_page: 50, search: search || undefined }); setRecipientsData(res.data); } catch (e) { console.error(e); }
  }, []);
  useEffect(() => {
    if (selectedGroup) fetchRecipients(selectedGroup, recipientsPage, recipientSearch);
  }, [selectedGroup, recipientsPage, recipientSearch, fetchRecipients]);
  const fetchCampaigns = async (page = 1) => {
    setLoadingCampaigns(true);
    try {
      const res = await adminNewsletterAPI.getCampaigns({ page, per_page: 20 });
      setCampaigns(res.data.campaigns || []);
      setCampaignsPages(res.data.pages || 0);
      setCampaignsPage(res.data.page || 1);
    } catch (e) { console.error(e); }
    setLoadingCampaigns(false);
  };

  // ------------------------------------------------------------------ Group actions
  const openGroupModal = (group = null) => {
    if (group) { setEditingGroup(group); setGroupForm({ nome: group.nome, descrizione: group.descrizione || '', colore: group.colore || '#6B7280' }); }
    else { setEditingGroup(null); setGroupForm({ nome: '', descrizione: '', colore: '#6B7280' }); }
    setShowGroupModal(true);
  };
  const saveGroup = async () => {
    if (!groupForm.nome.trim()) return;
    try {
      if (editingGroup) await adminNewsletterAPI.updateGroup(editingGroup.id, groupForm);
      else await adminNewsletterAPI.createGroup(groupForm);
      setShowGroupModal(false); fetchGroups();    } catch (e) { console.error(e); }
  };
  const deleteGroup = async (groupId) => {
    if (!window.confirm('Eliminare questo gruppo e tutti i suoi destinatari?')) return;
    try {
      await adminNewsletterAPI.deleteGroup(groupId); fetchGroups();      if (selectedGroup === groupId) { setSelectedGroup(null); setGroupDetail(null); }
    } catch (e) { console.error(e); }
  };
  const openGroupDetail = (group) => {
    setSelectedGroup(group.id); setRecipientsPage(1); setRecipientSearch(''); fetchGroupDetail(group.id);
  };

  // ------------------------------------------------------------------ Recipient actions
  const parseRecipientsText = (text) => {
    return text.split('\n').filter(l => l.trim()).map(line => {
      line = line.trim();
      const match = line.match(/^(.+?)\s*<(.+?)>$/);
      if (match) return { nome: match[1].trim(), email: match[2].trim() };
      return { email: line, nome: '' };
    }).filter(r => r.email);
  };
  const addRecipients = async () => {
    if (!newRecipientsText.trim() || !selectedGroup) return;
    setAddingRecipients(true);
    try {
      const recipients = parseRecipientsText(newRecipientsText);
      if (recipients.length === 0) return;
      const res = await adminNewsletterAPI.addRecipients(selectedGroup, recipients);
      setNewRecipientsText('');
      fetchRecipients(selectedGroup, recipientsPage, recipientSearch);
      fetchGroupDetail(selectedGroup); fetchGroups();      alert(`Aggiunti: ${res.data.added}, Duplicati saltati: ${res.data.skipped}`);
    } catch (e) { console.error(e); }
    setAddingRecipients(false);
  };
  const removeRecipient = async (recipientId) => {
    try {
      await adminNewsletterAPI.removeRecipient(recipientId);
      fetchRecipients(selectedGroup, recipientsPage, recipientSearch);
      fetchGroupDetail(selectedGroup); fetchGroups();    } catch (e) { console.error(e); }
  };

  // ------------------------------------------------------------------ Campaign actions
  const openCampaignModal = (campaign = null) => {
    if (campaign) {
      setEditingCampaign(campaign);
      setCampaignForm({ titolo: campaign.titolo, oggetto: campaign.oggetto, corpo_html: campaign.corpo_html, account_key: campaign.account_key, group_ids: campaign.group_ids || [] });
    } else {
      setEditingCampaign(null);
      setCampaignForm({ titolo: '', oggetto: '', corpo_html: '', account_key: '', group_ids: [] });
    }
    setShowCampaignModal(true);
  };
  const saveCampaign = async () => {
    if (!campaignForm.titolo.trim() || !campaignForm.oggetto.trim() || !campaignForm.corpo_html.trim() || !campaignForm.account_key) return;
    try {
      if (editingCampaign) await adminNewsletterAPI.updateCampaign(editingCampaign.id, campaignForm);
      else await adminNewsletterAPI.createCampaign(campaignForm);
      setShowCampaignModal(false); fetchCampaigns(campaignsPage);    } catch (e) { console.error(e); }
  };
  const deleteCampaign = async (campaignId) => {
    if (!window.confirm('Eliminare questa campagna?')) return;
    try { await adminNewsletterAPI.deleteCampaign(campaignId); fetchCampaigns(campaignsPage); } catch (e) { console.error(e); }
  };
  const sendCampaign = async (campaign) => {
    const selectedGroupNames = campaign.groups?.map(g => g.nome).join(', ') || '';
    const accountInfo = emailAccounts.find(a => a.key === campaign.account_key);
    const accountEmail = accountInfo?.email || campaign.account_key;
    if (!window.confirm(`Stai per inviare la campagna "${campaign.titolo}" da ${accountEmail} ai gruppi: ${selectedGroupNames}.\n\nConfermi l'invio?`)) return;
    setSendingCampaign(campaign.id);
    try { await adminNewsletterAPI.sendCampaign(campaign.id); fetchCampaigns(campaignsPage); }
    catch (e) { console.error(e); alert('Errore durante l\'invio: ' + (e.response?.data?.error || e.message)); }
    setSendingCampaign(false);
  };
  const toggleGroupInCampaign = (groupId) => {
    setCampaignForm(prev => ({
      ...prev, group_ids: prev.group_ids.includes(groupId) ? prev.group_ids.filter(id => id !== groupId) : [...prev.group_ids, groupId]
    }));
  };
  const estimatedRecipients = () => {
    if (!campaignForm.group_ids.length) return 0;
    return groups.filter(g => campaignForm.group_ids.includes(g.id)).reduce((sum, g) => sum + (g.recipients_count || 0), 0);
  };

  // ================================================================== RENDER
  return (
    <div className="tp-page-container">
      {/* Page Header */}
      <div className="tp-page-header">
        <div>
          <h1 className="tp-page-title">
            <HiOutlineMegaphone size={24} style={{ marginRight: '10px', verticalAlign: 'middle' }} />
            Newsletter
          </h1>
          <p className="tp-page-subtitle">Gestisci gruppi e invii massivi</p>
        </div>
      </div>

      {/* Main Card with Tabs */}
      <div className="tp-card">
        {/* Tab bar */}
        <div style={{ display: 'flex', gap: '8px', padding: '16px 24px', borderBottom: '1px solid #E5E7EB', background: '#FAFAFA' }}>
          {[
            { key: 'gruppi', label: 'Gruppi', icon: HiOutlineUserGroup },
            { key: 'campagne', label: 'Campagne', icon: HiOutlinePaperAirplane },
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <button key={tab.key}
                onClick={() => { setActiveTab(tab.key); setSelectedGroup(null); setGroupDetail(null); }}
                style={{
                  display: 'flex', alignItems: 'center', gap: '8px',
                  padding: '10px 20px', borderRadius: '8px', border: 'none',
                  background: activeTab === tab.key ? '#1A1A1A' : 'transparent',
                  color: activeTab === tab.key ? '#FFFFFF' : '#6B7280',
                  fontSize: '14px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s'
                }}
              >
                <Icon size={14} /> {tab.label}
              </button>
            );
          })}
        </div>

        <div className="tp-card-body">
          {activeTab === 'gruppi' && (selectedGroup ? renderGroupDetail() : renderGroupsList())}
          {activeTab === 'campagne' && renderCampaignsTab()}
        </div>
      </div>

      {/* Modals */}
      {renderGroupModal()}
      {renderCampaignModal()}
      {renderCampaignDetailModal()}
    </div>
  );

  // ================================================================== Groups List
  function renderGroupsList() {
    return (
      <>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#1F2937', margin: 0 }}>Gruppi Destinatari</h3>
          <button className="tp-btn tp-btn-primary" onClick={() => openGroupModal()}>
            <HiOutlinePlus size={15} /> Nuovo Gruppo
          </button>
        </div>

        {loadingGroups ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: '#9CA3AF' }}>
            <p style={{ fontSize: '13px' }}>Caricamento...</p>
          </div>
        ) : groups.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <HiOutlineUserGroup size={40} style={{ color: '#D1D5DB', marginBottom: '12px' }} />
            <h3 style={{ color: '#6B7280', fontWeight: 600, margin: '0 0 4px', fontSize: '15px' }}>Nessun gruppo</h3>
            <p style={{ color: '#9CA3AF', fontSize: '13px', margin: 0 }}>Crea il primo gruppo per iniziare</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
            {groups.map(group => (
              <div key={group.id}
                onClick={() => openGroupDetail(group)}
                style={{
                  background: '#fff', borderRadius: '12px', padding: '20px',
                  border: '1px solid #E5E7EB', cursor: 'pointer',
                  borderLeft: `4px solid ${group.colore || '#6B7280'}`,
                  transition: 'all 0.15s ease'
                }}
                onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)'; e.currentTarget.style.borderColor = '#D1D5DB'; }}
                onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.borderColor = '#E5E7EB'; e.currentTarget.style.borderLeftColor = group.colore || '#6B7280'; }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, color: '#1F2937', fontSize: '15px', marginBottom: '4px' }}>{group.nome}</div>
                    {group.descrizione && (
                      <div style={{ fontSize: '13px', color: '#6B7280', marginBottom: '10px', lineHeight: 1.4 }}>{group.descrizione}</div>
                    )}
                    <span className="tp-badge tp-badge-neutral">
                      <HiOutlineUserGroup size={13} style={{ marginRight: '4px' }} />
                      {group.recipients_count} destinatari
                    </span>
                  </div>
                  <div className="tp-table-actions">
                    <button className="tp-btn-icon tp-btn-icon-edit"
                      onClick={(e) => { e.stopPropagation(); openGroupModal(group); }} title="Modifica">
                      <HiOutlinePencilSquare />
                    </button>
                    <button className="tp-btn-icon tp-btn-icon-delete"
                      onClick={(e) => { e.stopPropagation(); deleteGroup(group.id); }} title="Elimina">
                      <HiOutlineTrash />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </>
    );
  }

  // ================================================================== Group Detail
  function renderGroupDetail() {
    const group = groupDetail;
    return (
      <>
        {/* Back + title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
          <button className="tp-btn tp-btn-outline tp-btn-sm"
            onClick={() => { setSelectedGroup(null); setGroupDetail(null); }}>
            <HiOutlineChevronLeft size={14} /> Indietro
          </button>
          {group && (
            <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#1F2937', margin: 0 }}>
              <span style={{ color: group.colore || '#6B7280', marginRight: '6px' }}>&#9679;</span>
              {group.nome}
              <span style={{ color: '#9CA3AF', fontWeight: 400, fontSize: '13px', marginLeft: '8px' }}>
                ({group.recipients?.length || 0} destinatari)
              </span>
            </h3>
          )}
        </div>

        {/* Add recipients card */}
        <div style={{
          background: '#F9FAFB', borderRadius: '12px', padding: '20px',
          border: '1px solid #E5E7EB', marginBottom: '20px'
        }}>
          <div style={{ fontSize: '14px', fontWeight: 600, color: '#374151', marginBottom: '8px' }}>Aggiungi Destinatari</div>
          <div style={{ fontSize: '12px', color: '#6B7280', marginBottom: '10px' }}>
            Inserisci un destinatario per riga. Formato: <code style={{ background: '#E5E7EB', padding: '1px 4px', borderRadius: '3px', fontSize: '12px' }}>email@esempio.it</code> oppure <code style={{ background: '#E5E7EB', padding: '1px 4px', borderRadius: '3px', fontSize: '12px' }}>Nome Cognome &lt;email@esempio.it&gt;</code>
          </div>
          <textarea
            className="tp-form-textarea"
            value={newRecipientsText}
            onChange={e => setNewRecipientsText(e.target.value)}
            placeholder={"mario.rossi@email.it\nLuca Bianchi <luca@email.it>"}
            rows={4}
            style={{ fontFamily: 'monospace', marginBottom: '10px' }}
          />
          <button className="tp-btn tp-btn-primary tp-btn-sm"
            onClick={addRecipients}
            disabled={addingRecipients || !newRecipientsText.trim()}
            style={{ opacity: addingRecipients || !newRecipientsText.trim() ? 0.5 : 1 }}>
            <HiOutlinePlus size={14} /> {addingRecipients ? 'Aggiungendo...' : 'Aggiungi'}
          </button>
        </div>

        {/* Recipients list card */}
        <div style={{
          background: '#fff', borderRadius: '12px',
          border: '1px solid #E5E7EB', overflow: 'hidden'
        }}>
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '16px 20px', borderBottom: '1px solid #E5E7EB'
          }}>
            <span style={{ fontSize: '14px', fontWeight: 600, color: '#374151' }}>Destinatari</span>
            <div style={{ position: 'relative' }}>
              <HiOutlineMagnifyingGlass size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }} />
              <input type="text" placeholder="Cerca..."
                className="tp-form-input"
                value={recipientSearch}
                onChange={e => { setRecipientSearch(e.target.value); setRecipientsPage(1); }}
                style={{ height: '36px', paddingLeft: '32px', width: '220px' }}
              />
            </div>
          </div>

          {recipientsData?.recipients?.length > 0 ? (
            <>
              <div style={{ maxHeight: '450px', overflowY: 'auto' }}>
                {recipientsData.recipients.map(r => (
                  <div key={r.id} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '12px 20px', borderBottom: '1px solid #F3F4F6',
                    transition: 'background 0.1s ease'
                  }}
                    onMouseEnter={e => e.currentTarget.style.background = '#F9FAFB'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <div>
                      <div style={{ fontSize: '14px', color: '#1F2937', fontWeight: 500 }}>{r.email}</div>
                      {r.nome && <div style={{ fontSize: '12px', color: '#9CA3AF' }}>{r.nome}</div>}
                    </div>
                    <button className="tp-btn-icon tp-btn-icon-delete"
                      onClick={() => removeRecipient(r.id)} title="Rimuovi"
                      style={{ width: '30px', height: '30px' }}>
                      <HiOutlineTrash size={13} />
                    </button>
                  </div>
                ))}
              </div>
              {recipientsData.pages > 1 && (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '12px', padding: '16px' }}>
                  <button className="tp-btn tp-btn-outline tp-btn-sm"
                    onClick={() => setRecipientsPage(p => Math.max(1, p - 1))}
                    disabled={recipientsPage <= 1} style={{ padding: '0 10px' }}>
                    <HiOutlineChevronLeft size={14} />
                  </button>
                  <span style={{ fontSize: '12px', color: '#6B7280' }}>{recipientsPage} / {recipientsData.pages}</span>
                  <button className="tp-btn tp-btn-outline tp-btn-sm"
                    onClick={() => setRecipientsPage(p => Math.min(recipientsData.pages, p + 1))}
                    disabled={recipientsPage >= recipientsData.pages} style={{ padding: '0 10px' }}>
                    <HiOutlineChevronRight size={14} />
                  </button>
                </div>
              )}
            </>
          ) : (
            <div style={{ textAlign: 'center', padding: '40px 20px' }}>
              <HiOutlineEnvelope size={32} style={{ color: '#D1D5DB', marginBottom: '8px' }} />
              <p style={{ color: '#9CA3AF', fontSize: '13px', margin: 0 }}>Nessun destinatario</p>
            </div>
          )}
        </div>
      </>
    );
  }

  // ================================================================== Campaigns Tab
  function renderCampaignsTab() {
    return (
      <>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#1F2937', margin: 0 }}>Campagne Email</h3>
          <button className="tp-btn tp-btn-primary" onClick={() => openCampaignModal()}>
            <HiOutlinePlus size={15} /> Nuova Campagna
          </button>
        </div>

        {loadingCampaigns ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: '#9CA3AF' }}>
            <p style={{ fontSize: '13px' }}>Caricamento...</p>
          </div>
        ) : campaigns.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <HiOutlinePaperAirplane size={40} style={{ color: '#D1D5DB', marginBottom: '12px' }} />
            <h3 style={{ color: '#6B7280', fontWeight: 600, margin: '0 0 4px', fontSize: '15px' }}>Nessuna campagna</h3>
            <p style={{ color: '#9CA3AF', fontSize: '13px', margin: 0 }}>Crea la prima campagna per iniziare</p>
          </div>
        ) : (
          <>
            <div className="tp-table-wrapper">
              <table className="tp-table">
                <thead>
                  <tr>
                    <th>Titolo</th>
                    <th>Account</th>
                    <th>Gruppi</th>
                    <th>Status</th>
                    <th>Destinatari</th>
                    <th>Data</th>
                    <th style={{ textAlign: 'right' }}>Azioni</th>
                  </tr>
                </thead>
                <tbody>
                  {campaigns.map(c => {
                    const statusInfo = STATUS_MAP[c.status] || STATUS_MAP.bozza;
                    const account = emailAccounts.find(a => a.key === c.account_key);
                    return (
                      <tr key={c.id}>
                        <td>
                          <span style={{ fontWeight: 600, color: '#1F2937' }}>{c.titolo}</span>
                        </td>
                        <td style={{ fontSize: '13px', color: '#6B7280' }}>
                          {account?.label || c.account_key}
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                            {c.groups?.map(g => (
                              <span key={g.id} style={{
                                background: g.colore || '#6B7280', color: '#fff',
                                padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 500
                              }}>{g.nome}</span>
                            ))}
                          </div>
                        </td>
                        <td>
                          <span className={statusInfo.cls}>{statusInfo.label}</span>
                        </td>
                        <td style={{ fontSize: '13px', color: '#6B7280' }}>
                          {c.status !== 'bozza' ? `${c.inviati_ok}/${c.totale_destinatari}` : '—'}
                        </td>
                        <td style={{ fontSize: '13px', color: '#9CA3AF' }}>
                          {c.sent_at ? new Date(c.sent_at).toLocaleDateString('it-IT') : new Date(c.created_at).toLocaleDateString('it-IT')}
                        </td>
                        <td>
                          <div className="tp-table-actions" style={{ justifyContent: 'flex-end' }}>
                            <button className="tp-btn-icon tp-btn-icon-view"
                              onClick={() => setShowCampaignDetail(c)} title="Dettaglio">
                              <HiOutlineEye />
                            </button>
                            {c.status === 'bozza' && (
                              <>
                                <button className="tp-btn-icon tp-btn-icon-edit"
                                  onClick={() => openCampaignModal(c)} title="Modifica">
                                  <HiOutlinePencilSquare />
                                </button>
                                <button className="tp-btn-icon tp-btn-icon-restore"
                                  onClick={() => sendCampaign(c)}
                                  disabled={sendingCampaign === c.id} title="Invia">
                                  <HiOutlinePaperAirplane />
                                </button>
                                <button className="tp-btn-icon tp-btn-icon-delete"
                                  onClick={() => deleteCampaign(c.id)} title="Elimina">
                                  <HiOutlineTrash />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {campaignsPages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '12px', padding: '20px 0' }}>
                <button
                  disabled={campaignsPage <= 1} onClick={() => fetchCampaigns(campaignsPage - 1)}
                  style={{
                    width: '32px', height: '32px', borderRadius: '8px',
                    border: '1px solid #E5E7EB', background: '#fff',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: campaignsPage <= 1 ? 'default' : 'pointer',
                    opacity: campaignsPage <= 1 ? 0.4 : 1, color: '#374151'
                  }}>
                  <HiOutlineChevronLeft size={14} />
                </button>
                <span style={{ fontSize: '12px', color: '#6B7280' }}>{campaignsPage} / {campaignsPages}</span>
                <button
                  disabled={campaignsPage >= campaignsPages} onClick={() => fetchCampaigns(campaignsPage + 1)}
                  style={{
                    width: '32px', height: '32px', borderRadius: '8px',
                    border: '1px solid #E5E7EB', background: '#fff',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: campaignsPage >= campaignsPages ? 'default' : 'pointer',
                    opacity: campaignsPage >= campaignsPages ? 0.4 : 1, color: '#374151'
                  }}>
                  <HiOutlineChevronRight size={14} />
                </button>
              </div>
            )}
          </>
        )}
      </>
    );
  }

  // ================================================================== Group Modal
  function renderGroupModal() {
    if (!showGroupModal) return null;
    return (
      <div style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 1000, padding: '20px'
      }} onClick={() => setShowGroupModal(false)}>
        <div onClick={e => e.stopPropagation()} style={{
          background: '#fff', borderRadius: '16px', width: '100%',
          maxWidth: '480px', overflow: 'hidden',
          boxShadow: '0 20px 60px rgba(0,0,0,0.2)'
        }}>
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '20px 24px', borderBottom: '1px solid #E5E7EB'
          }}>
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#1F2937' }}>
              {editingGroup ? 'Modifica Gruppo' : 'Nuovo Gruppo'}
            </h3>
            <button onClick={() => setShowGroupModal(false)} style={{
              width: '32px', height: '32px', borderRadius: '8px', border: 'none',
              background: '#F3F4F6', display: 'flex', alignItems: 'center',
              justifyContent: 'center', cursor: 'pointer', color: '#6B7280'
            }}><HiOutlineXMark size={18} /></button>
          </div>

          <div style={{ padding: '24px' }}>
            <div className="tp-form-group" style={{ marginBottom: '16px' }}>
              <label className="tp-form-label">Nome <span className="required">*</span></label>
              <input type="text" className="tp-form-input" value={groupForm.nome}
                onChange={e => setGroupForm(p => ({ ...p, nome: e.target.value }))}
                placeholder="Nome del gruppo" />
            </div>
            <div className="tp-form-group" style={{ marginBottom: '16px' }}>
              <label className="tp-form-label">Descrizione</label>
              <textarea className="tp-form-textarea" value={groupForm.descrizione}
                onChange={e => setGroupForm(p => ({ ...p, descrizione: e.target.value }))}
                rows={2} placeholder="Descrizione opzionale" />
            </div>
            <div className="tp-form-group" style={{ marginBottom: '24px' }}>
              <label className="tp-form-label">Colore</label>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <input type="color" value={groupForm.colore}
                  onChange={e => setGroupForm(p => ({ ...p, colore: e.target.value }))}
                  style={{ width: '40px', height: '40px', border: '1px solid #E5E7EB', borderRadius: '8px', cursor: 'pointer', padding: '2px' }} />
                <span style={{ fontSize: '13px', color: '#6B7280' }}>{groupForm.colore}</span>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button className="tp-btn tp-btn-outline" onClick={() => setShowGroupModal(false)}>Annulla</button>
              <button className="tp-btn tp-btn-primary" onClick={saveGroup}>{editingGroup ? 'Salva' : 'Crea Gruppo'}</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ================================================================== Campaign Modal
  function renderCampaignModal() {
    if (!showCampaignModal) return null;
    return (
      <div style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 1000, padding: '20px'
      }} onClick={() => setShowCampaignModal(false)}>
        <div onClick={e => e.stopPropagation()} style={{
          background: '#fff', borderRadius: '16px', width: '100%',
          maxWidth: '640px', maxHeight: '90vh', overflow: 'auto',
          boxShadow: '0 20px 60px rgba(0,0,0,0.2)'
        }}>
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '20px 24px', borderBottom: '1px solid #E5E7EB'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <HiOutlinePaperAirplane size={20} style={{ color: '#1F2937' }} />
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#1F2937' }}>
                {editingCampaign ? 'Modifica Campagna' : 'Nuova Campagna'}
              </h3>
            </div>
            <button onClick={() => setShowCampaignModal(false)} style={{
              width: '32px', height: '32px', borderRadius: '8px', border: 'none',
              background: '#F3F4F6', display: 'flex', alignItems: 'center',
              justifyContent: 'center', cursor: 'pointer', color: '#6B7280'
            }}><HiOutlineXMark size={18} /></button>
          </div>

          <div style={{ padding: '24px' }}>
            <div className="tp-form-group" style={{ marginBottom: '16px' }}>
              <label className="tp-form-label">Titolo (interno) <span className="required">*</span></label>
              <input type="text" className="tp-form-input" value={campaignForm.titolo}
                onChange={e => setCampaignForm(p => ({ ...p, titolo: e.target.value }))}
                placeholder="Es. Newsletter Febbraio 2026" />
            </div>
            <div className="tp-form-group" style={{ marginBottom: '16px' }}>
              <label className="tp-form-label">Oggetto Email <span className="required">*</span></label>
              <input type="text" className="tp-form-input" value={campaignForm.oggetto}
                onChange={e => setCampaignForm(p => ({ ...p, oggetto: e.target.value }))}
                placeholder="Subject che vedrà il destinatario" />
            </div>
            <div className="tp-form-group" style={{ marginBottom: '16px' }}>
              <label className="tp-form-label">Account Mittente <span className="required">*</span></label>
              <select className="tp-form-input" value={campaignForm.account_key}
                onChange={e => setCampaignForm(p => ({ ...p, account_key: e.target.value }))}>
                <option value="">Seleziona account...</option>
                {emailAccounts.map(a => (
                  <option key={a.key} value={a.key}>{a.label} ({a.email})</option>
                ))}
              </select>
            </div>
            <div className="tp-form-group" style={{ marginBottom: '16px' }}>
              <label className="tp-form-label">Gruppi Destinatari</label>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {groups.map(g => {
                  const selected = campaignForm.group_ids.includes(g.id);
                  return (
                    <button key={g.id} onClick={() => toggleGroupInCampaign(g.id)} style={{
                      background: selected ? (g.colore || '#6B7280') : '#fff',
                      color: selected ? '#fff' : '#374151',
                      border: selected ? `2px solid ${g.colore || '#6B7280'}` : '2px solid #E5E7EB',
                      borderRadius: '8px', padding: '6px 14px', cursor: 'pointer', fontSize: '13px',
                      fontWeight: selected ? 600 : 400, transition: 'all 0.15s'
                    }}>
                      {g.nome} ({g.recipients_count})
                    </button>
                  );
                })}
              </div>
              {campaignForm.group_ids.length > 0 && (
                <div style={{ marginTop: '8px', fontSize: '13px', color: '#16A34A', fontWeight: 500 }}>
                  ~ {estimatedRecipients()} destinatari stimati (prima della deduplica)
                </div>
              )}
            </div>
            <div className="tp-form-group" style={{ marginBottom: '24px' }}>
              <label className="tp-form-label">Corpo Email (HTML) <span className="required">*</span></label>
              <textarea className="tp-form-textarea" value={campaignForm.corpo_html}
                onChange={e => setCampaignForm(p => ({ ...p, corpo_html: e.target.value }))}
                rows={10} placeholder={"<p>Gentile destinatario,</p>\n<p>...</p>"}
                style={{ fontFamily: 'monospace' }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button className="tp-btn tp-btn-outline" onClick={() => setShowCampaignModal(false)}>Annulla</button>
              <button className="tp-btn tp-btn-primary" onClick={saveCampaign}>
                <HiOutlinePaperAirplane size={14} />
                {editingCampaign ? 'Salva' : 'Crea Bozza'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ================================================================== Campaign Detail Modal
  function renderCampaignDetailModal() {
    const c = showCampaignDetail;
    if (!c) return null;
    const statusInfo = STATUS_MAP[c.status] || STATUS_MAP.bozza;
    const account = emailAccounts.find(a => a.key === c.account_key);
    return (
      <div style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 1000, padding: '20px'
      }} onClick={() => setShowCampaignDetail(null)}>
        <div onClick={e => e.stopPropagation()} style={{
          background: '#fff', borderRadius: '16px', width: '100%',
          maxWidth: '600px', maxHeight: '90vh', display: 'flex',
          flexDirection: 'column', overflow: 'hidden',
          boxShadow: '0 20px 60px rgba(0,0,0,0.2)'
        }}>
          {/* Header */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '20px 24px', borderBottom: '1px solid #E5E7EB', flexShrink: 0
          }}>
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#1F2937' }}>Dettaglio Campagna</h3>
            <button onClick={() => setShowCampaignDetail(null)} style={{
              width: '32px', height: '32px', borderRadius: '8px', border: 'none',
              background: '#F3F4F6', display: 'flex', alignItems: 'center',
              justifyContent: 'center', cursor: 'pointer', color: '#6B7280'
            }}><HiOutlineXMark size={18} /></button>
          </div>

          {/* Body */}
          <div style={{ flex: 1, padding: '24px', overflow: 'auto' }}>
            <div style={{ display: 'grid', gap: '16px' }}>
              <div>
                <div style={{ fontSize: '12px', fontWeight: 600, color: '#9CA3AF', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Titolo</div>
                <div style={{ fontSize: '15px', fontWeight: 600, color: '#1F2937' }}>{c.titolo}</div>
              </div>
              <div>
                <div style={{ fontSize: '12px', fontWeight: 600, color: '#9CA3AF', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Oggetto</div>
                <div style={{ fontSize: '14px', color: '#374151' }}>{c.oggetto}</div>
              </div>
              <div>
                <div style={{ fontSize: '12px', fontWeight: 600, color: '#9CA3AF', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Account Mittente</div>
                <div style={{ fontSize: '14px', color: '#374151' }}>{account?.label || c.account_key} ({account?.email})</div>
              </div>
              <div>
                <div style={{ fontSize: '12px', fontWeight: 600, color: '#9CA3AF', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Stato</div>
                <span className={statusInfo.cls}>{statusInfo.label}</span>
              </div>
              <div>
                <div style={{ fontSize: '12px', fontWeight: 600, color: '#9CA3AF', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Gruppi</div>
                <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                  {c.groups?.map(g => (
                    <span key={g.id} style={{
                      background: g.colore || '#6B7280', color: '#fff',
                      padding: '3px 10px', borderRadius: '4px', fontSize: '12px', fontWeight: 500
                    }}>{g.nome}</span>
                  ))}
                </div>
              </div>
              {c.status !== 'bozza' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                  <div style={{ background: '#F9FAFB', borderRadius: '10px', padding: '16px', textAlign: 'center', border: '1px solid #E5E7EB' }}>
                    <div style={{ fontSize: '24px', fontWeight: 700, color: '#1F2937' }}>{c.totale_destinatari}</div>
                    <div style={{ fontSize: '12px', color: '#9CA3AF', marginTop: '2px' }}>Totale</div>
                  </div>
                  <div style={{ background: '#F0FDF4', borderRadius: '10px', padding: '16px', textAlign: 'center', border: '1px solid #BBF7D0' }}>
                    <div style={{ fontSize: '24px', fontWeight: 700, color: '#16A34A' }}>{c.inviati_ok}</div>
                    <div style={{ fontSize: '12px', color: '#6B7280', marginTop: '2px' }}>Inviati OK</div>
                  </div>
                  <div style={{ background: '#FEF2F2', borderRadius: '10px', padding: '16px', textAlign: 'center', border: '1px solid #FECACA' }}>
                    <div style={{ fontSize: '24px', fontWeight: 700, color: '#DC2626' }}>{c.inviati_errore}</div>
                    <div style={{ fontSize: '12px', color: '#6B7280', marginTop: '2px' }}>Errori</div>
                  </div>
                </div>
              )}
              {c.sent_at && (
                <div>
                  <div style={{ fontSize: '12px', fontWeight: 600, color: '#9CA3AF', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Data Invio</div>
                  <div style={{ fontSize: '14px', color: '#374151' }}>{new Date(c.sent_at).toLocaleString('it-IT')}</div>
                </div>
              )}
              <div>
                <div style={{ fontSize: '12px', fontWeight: 600, color: '#9CA3AF', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Anteprima Corpo</div>
                <div style={{
                  background: '#FAFAFA', borderRadius: '8px', padding: '16px',
                  border: '1px solid #E5E7EB', maxHeight: '200px', overflowY: 'auto',
                  fontSize: '14px', lineHeight: 1.6, color: '#374151'
                }} dangerouslySetInnerHTML={{ __html: c.corpo_html }} />
              </div>
            </div>
          </div>

          {/* Footer */}
          <div style={{
            padding: '16px 24px', borderTop: '1px solid #E5E7EB',
            display: 'flex', justifyContent: 'flex-end', flexShrink: 0
          }}>
            <button className="tp-btn tp-btn-outline" onClick={() => setShowCampaignDetail(null)}>Chiudi</button>
          </div>
        </div>
      </div>
    );
  }
}

export default AdminNewsletter;
