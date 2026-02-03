import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { getAuth } from '../utils/auth';
import '../styles/template-style.css';

// Icons
import {
    HiOutlineArrowLeft,
    HiOutlineCheck,
    HiOutlineInformationCircle,
    HiOutlineCurrencyEuro,
    HiOutlineGlobeAlt,
    HiOutlineShieldCheck,
    HiOutlineCalendarDays,
    HiOutlinePhoto,
    HiOutlineDocumentText,
    HiOutlineExclamationTriangle,
    HiOutlinePlus,
    HiOutlineTrash
} from 'react-icons/hi2';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5003';

function RightForm() {
    const navigate = useNavigate();
    const { id } = useParams();
    const { token } = getAuth();
    const isEdit = Boolean(id);

    // State
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [categories, setCategories] = useState([]);
    const [activeTab, setActiveTab] = useState('info');
    const [errors, setErrors] = useState({});

    // Form data
    const [formData, setFormData] = useState({
        // Info base
        category_id: '',
        codice: '',
        nome: '',
        descrizione: '',
        descrizione_breve: '',
        tipo: '',
        sottotipo: '',
        posizione: '',
        dimensioni: '',
        specifiche_tecniche: '',

        // Media
        immagine_principale: '',
        immagini_gallery: [],
        video_presentazione: '',
        documento_specifiche: '',

        // Esclusività
        esclusivo: true,
        esclusivita_settoriale: true,
        settori_esclusi: [],
        max_allocazioni: 1,

        // Territorio
        territorio_disponibile: 'world',
        territori_inclusi: [],
        territori_esclusi: [],

        // Durata
        durata_minima_mesi: 12,
        durata_massima_mesi: null,
        rinnovo_automatico: false,
        preavviso_disdetta_giorni: 90,

        // Sublicenza
        sublicenziabile: false,
        condizioni_sublicenza: '',
        percentuale_sublicenza: null,

        // Pricing
        prezzo_listino: '',
        prezzo_minimo: '',
        valuta: 'EUR',
        prezzo_per: 'stagione',
        sconto_biennale: null,
        sconto_triennale: null,

        // Visibilità
        disponibile: true,
        visibile_marketplace: true,
        in_evidenza: false,
        riservato: false,

        // Altro
        ordine: 0,
        priorita: 0,
        tags: '',
        note_interne: '',
        stagione_corrente: ''
    });

    // Pricing tiers
    const [pricingTiers, setPricingTiers] = useState([]);

    // Fetch data on load
    useEffect(() => {
        fetchCategories();
        if (isEdit) {
            fetchRight();
        }
    }, [id]);

    const fetchCategories = async () => {
        try {
            const response = await axios.get(`${API_URL}/api/club/rights/categories`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setCategories(response.data || []);
        } catch (err) {
            console.error('Error fetching categories:', err);
            // Demo categories
            setCategories([
                { id: 1, codice: 'naming', nome: 'Naming Rights', colore: '#6366F1' },
                { id: 2, codice: 'kit', nome: 'Kit Rights', colore: '#EC4899' },
                { id: 3, codice: 'digital', nome: 'Digital Rights', colore: '#3B82F6' },
                { id: 4, codice: 'broadcast', nome: 'Broadcast Rights', colore: '#F59E0B' },
                { id: 5, codice: 'hospitality', nome: 'Hospitality Rights', colore: '#10B981' },
                { id: 6, codice: 'activation', nome: 'Activation Rights', colore: '#8B5CF6' },
                { id: 7, codice: 'ip', nome: 'IP Rights', colore: '#EF4444' }
            ]);
        }
    };

    const fetchRight = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`${API_URL}/api/club/rights/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const right = response.data;

            setFormData({
                ...formData,
                ...right,
                immagini_gallery: right.immagini_gallery ? JSON.parse(right.immagini_gallery) : [],
                settori_esclusi: right.settori_esclusi ? JSON.parse(right.settori_esclusi) : [],
                territori_inclusi: right.territori_inclusi ? JSON.parse(right.territori_inclusi) : [],
                territori_esclusi: right.territori_esclusi ? JSON.parse(right.territori_esclusi) : []
            });

            if (right.pricing_tiers) {
                setPricingTiers(right.pricing_tiers);
            }
        } catch (err) {
            console.error('Error fetching right:', err);
        } finally {
            setLoading(false);
        }
    };

    // Handle form changes
    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
        // Clear error
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: null }));
        }
    };

    const handleNumberChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value === '' ? null : parseFloat(value)
        }));
    };

    // Validate form
    const validate = () => {
        const newErrors = {};

        if (!formData.category_id) newErrors.category_id = 'Seleziona una categoria';
        if (!formData.codice) newErrors.codice = 'Inserisci un codice';
        if (!formData.nome) newErrors.nome = 'Inserisci un nome';

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // Submit form
    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validate()) {
            setActiveTab('info');
            return;
        }

        try {
            setSaving(true);

            const payload = {
                ...formData,
                prezzo_listino: formData.prezzo_listino ? parseFloat(formData.prezzo_listino) : null,
                prezzo_minimo: formData.prezzo_minimo ? parseFloat(formData.prezzo_minimo) : null,
                category_id: parseInt(formData.category_id)
            };

            if (isEdit) {
                await axios.put(`${API_URL}/api/club/rights/${id}`, payload, {
                    headers: { Authorization: `Bearer ${token}` }
                });
            } else {
                await axios.post(`${API_URL}/api/club/rights`, payload, {
                    headers: { Authorization: `Bearer ${token}` }
                });
            }

            navigate('/club/rights');
        } catch (err) {
            console.error('Error saving right:', err);
            if (err.response?.data?.error) {
                alert(err.response.data.error);
            }
        } finally {
            setSaving(false);
        }
    };

    // Pricing tier management
    const addPricingTier = () => {
        setPricingTiers([...pricingTiers, {
            id: null,
            nome: '',
            codice: '',
            prezzo: '',
            moltiplicatore: 1.0,
            descrizione: ''
        }]);
    };

    const updatePricingTier = (index, field, value) => {
        const updated = [...pricingTiers];
        updated[index][field] = value;
        setPricingTiers(updated);
    };

    const removePricingTier = (index) => {
        setPricingTiers(pricingTiers.filter((_, i) => i !== index));
    };

    // Territory options
    const territoryOptions = [
        { value: 'world', label: 'Mondiale' },
        { value: 'europe', label: 'Europa' },
        { value: 'italy', label: 'Italia' },
        { value: 'region', label: 'Regionale' }
    ];

    // Price per options
    const pricePerOptions = [
        { value: 'stagione', label: 'Per Stagione' },
        { value: 'anno', label: 'Per Anno' },
        { value: 'mese', label: 'Per Mese' },
        { value: 'partita', label: 'Per Partita' },
        { value: 'evento', label: 'Per Evento' }
    ];

    // Sector options
    const sectorOptions = [
        'bevande', 'automotive', 'tech', 'banking', 'insurance',
        'energy', 'food', 'fashion', 'telecom', 'betting', 'airlines',
        'healthcare', 'retail', 'crypto', 'luxury'
    ];

    // Tabs
    const tabs = [
        { id: 'info', label: 'Informazioni', icon: HiOutlineInformationCircle },
        { id: 'pricing', label: 'Pricing', icon: HiOutlineCurrencyEuro },
        { id: 'exclusivity', label: 'Esclusività', icon: HiOutlineShieldCheck },
        { id: 'territory', label: 'Territorio', icon: HiOutlineGlobeAlt },
        { id: 'duration', label: 'Durata', icon: HiOutlineCalendarDays },
        { id: 'media', label: 'Media', icon: HiOutlinePhoto }
    ];

    if (loading) {
        return (
            <div className="page-container">
                <div className="loading-container">
                    <div className="spinner"></div>
                    <p>Caricamento...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="page-container">
            {/* Header */}
            <div className="page-header">
                <div className="header-content">
                    <div className="header-left">
                        <button className="btn-back" onClick={() => navigate('/club/rights')}>
                            <HiOutlineArrowLeft size={20} />
                        </button>
                        <div>
                            <h1 className="page-title">
                                {isEdit ? 'Modifica Diritto' : 'Nuovo Diritto'}
                            </h1>
                            <p className="page-subtitle">
                                {isEdit ? `Modifica ${formData.nome}` : 'Crea un nuovo diritto di sponsorizzazione'}
                            </p>
                        </div>
                    </div>
                    <div className="header-actions">
                        <button className="btn btn-outline" onClick={() => navigate('/club/rights')}>
                            Annulla
                        </button>
                        <button className="btn btn-primary" onClick={handleSubmit} disabled={saving}>
                            {saving ? 'Salvataggio...' : (
                                <>
                                    <HiOutlineCheck size={18} />
                                    {isEdit ? 'Salva Modifiche' : 'Crea Diritto'}
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit}>
                <div className="form-layout">
                    {/* Sidebar Tabs */}
                    <div className="form-sidebar">
                        <nav className="form-nav">
                            {tabs.map(tab => {
                                const Icon = tab.icon;
                                return (
                                    <button
                                        key={tab.id}
                                        type="button"
                                        className={`nav-item ${activeTab === tab.id ? 'active' : ''}`}
                                        onClick={() => setActiveTab(tab.id)}
                                    >
                                        <Icon size={18} />
                                        <span>{tab.label}</span>
                                    </button>
                                );
                            })}
                        </nav>
                    </div>

                    {/* Form Content */}
                    <div className="form-content">
                        {/* Info Tab */}
                        {activeTab === 'info' && (
                            <div className="form-section">
                                <h2 className="section-title">Informazioni Base</h2>

                                <div className="form-row">
                                    <div className="form-group">
                                        <label className="form-label required">Categoria</label>
                                        <select
                                            name="category_id"
                                            value={formData.category_id}
                                            onChange={handleChange}
                                            className={`form-select ${errors.category_id ? 'error' : ''}`}
                                        >
                                            <option value="">Seleziona categoria...</option>
                                            {categories.map(cat => (
                                                <option key={cat.id} value={cat.id}>{cat.nome}</option>
                                            ))}
                                        </select>
                                        {errors.category_id && <span className="error-text">{errors.category_id}</span>}
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label required">Codice</label>
                                        <input
                                            type="text"
                                            name="codice"
                                            value={formData.codice}
                                            onChange={handleChange}
                                            className={`form-input ${errors.codice ? 'error' : ''}`}
                                            placeholder="es. KIT-001"
                                        />
                                        {errors.codice && <span className="error-text">{errors.codice}</span>}
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label className="form-label required">Nome</label>
                                    <input
                                        type="text"
                                        name="nome"
                                        value={formData.nome}
                                        onChange={handleChange}
                                        className={`form-input ${errors.nome ? 'error' : ''}`}
                                        placeholder="es. Main Sponsor Maglia Gara"
                                    />
                                    {errors.nome && <span className="error-text">{errors.nome}</span>}
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Descrizione Breve</label>
                                    <input
                                        type="text"
                                        name="descrizione_breve"
                                        value={formData.descrizione_breve}
                                        onChange={handleChange}
                                        className="form-input"
                                        placeholder="Una riga di descrizione..."
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Descrizione Completa</label>
                                    <textarea
                                        name="descrizione"
                                        value={formData.descrizione}
                                        onChange={handleChange}
                                        className="form-textarea"
                                        rows={4}
                                        placeholder="Descrizione dettagliata del diritto..."
                                    />
                                </div>

                                <div className="form-row">
                                    <div className="form-group">
                                        <label className="form-label">Tipo</label>
                                        <input
                                            type="text"
                                            name="tipo"
                                            value={formData.tipo}
                                            onChange={handleChange}
                                            className="form-input"
                                            placeholder="es. maglia_gara"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Sottotipo</label>
                                        <input
                                            type="text"
                                            name="sottotipo"
                                            value={formData.sottotipo}
                                            onChange={handleChange}
                                            className="form-input"
                                            placeholder="es. fronte_centrale"
                                        />
                                    </div>
                                </div>

                                <div className="form-row">
                                    <div className="form-group">
                                        <label className="form-label">Posizione</label>
                                        <input
                                            type="text"
                                            name="posizione"
                                            value={formData.posizione}
                                            onChange={handleChange}
                                            className="form-input"
                                            placeholder="es. Fronte maglia - Centro"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Dimensioni</label>
                                        <input
                                            type="text"
                                            name="dimensioni"
                                            value={formData.dimensioni}
                                            onChange={handleChange}
                                            className="form-input"
                                            placeholder="es. 20cm x 10cm"
                                        />
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Tags</label>
                                    <input
                                        type="text"
                                        name="tags"
                                        value={formData.tags}
                                        onChange={handleChange}
                                        className="form-input"
                                        placeholder="tag1, tag2, tag3"
                                    />
                                    <span className="form-hint">Separati da virgola</span>
                                </div>

                                <div className="form-row checkboxes">
                                    <label className="checkbox-label">
                                        <input
                                            type="checkbox"
                                            name="disponibile"
                                            checked={formData.disponibile}
                                            onChange={handleChange}
                                        />
                                        <span>Disponibile</span>
                                    </label>
                                    <label className="checkbox-label">
                                        <input
                                            type="checkbox"
                                            name="visibile_marketplace"
                                            checked={formData.visibile_marketplace}
                                            onChange={handleChange}
                                        />
                                        <span>Visibile nel Marketplace</span>
                                    </label>
                                    <label className="checkbox-label">
                                        <input
                                            type="checkbox"
                                            name="in_evidenza"
                                            checked={formData.in_evidenza}
                                            onChange={handleChange}
                                        />
                                        <span>In Evidenza</span>
                                    </label>
                                    <label className="checkbox-label">
                                        <input
                                            type="checkbox"
                                            name="riservato"
                                            checked={formData.riservato}
                                            onChange={handleChange}
                                        />
                                        <span>Riservato (solo su invito)</span>
                                    </label>
                                </div>
                            </div>
                        )}

                        {/* Pricing Tab */}
                        {activeTab === 'pricing' && (
                            <div className="form-section">
                                <h2 className="section-title">Pricing</h2>

                                <div className="form-row">
                                    <div className="form-group">
                                        <label className="form-label">Prezzo di Listino</label>
                                        <div className="input-with-addon">
                                            <input
                                                type="number"
                                                name="prezzo_listino"
                                                value={formData.prezzo_listino}
                                                onChange={handleNumberChange}
                                                className="form-input"
                                                placeholder="0"
                                                min="0"
                                                step="1000"
                                            />
                                            <span className="input-addon">€</span>
                                        </div>
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Prezzo Minimo (Floor)</label>
                                        <div className="input-with-addon">
                                            <input
                                                type="number"
                                                name="prezzo_minimo"
                                                value={formData.prezzo_minimo}
                                                onChange={handleNumberChange}
                                                className="form-input"
                                                placeholder="0"
                                                min="0"
                                                step="1000"
                                            />
                                            <span className="input-addon">€</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="form-row">
                                    <div className="form-group">
                                        <label className="form-label">Valuta</label>
                                        <select
                                            name="valuta"
                                            value={formData.valuta}
                                            onChange={handleChange}
                                            className="form-select"
                                        >
                                            <option value="EUR">EUR (€)</option>
                                            <option value="USD">USD ($)</option>
                                            <option value="GBP">GBP (£)</option>
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Prezzo Per</label>
                                        <select
                                            name="prezzo_per"
                                            value={formData.prezzo_per}
                                            onChange={handleChange}
                                            className="form-select"
                                        >
                                            {pricePerOptions.map(opt => (
                                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="form-row">
                                    <div className="form-group">
                                        <label className="form-label">Sconto Biennale (%)</label>
                                        <div className="input-with-addon">
                                            <input
                                                type="number"
                                                name="sconto_biennale"
                                                value={formData.sconto_biennale || ''}
                                                onChange={handleNumberChange}
                                                className="form-input"
                                                placeholder="0"
                                                min="0"
                                                max="100"
                                            />
                                            <span className="input-addon">%</span>
                                        </div>
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Sconto Triennale (%)</label>
                                        <div className="input-with-addon">
                                            <input
                                                type="number"
                                                name="sconto_triennale"
                                                value={formData.sconto_triennale || ''}
                                                onChange={handleNumberChange}
                                                className="form-input"
                                                placeholder="0"
                                                min="0"
                                                max="100"
                                            />
                                            <span className="input-addon">%</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Pricing Tiers */}
                                <div className="subsection">
                                    <div className="subsection-header">
                                        <h3>Tier di Prezzo</h3>
                                        <button type="button" className="btn btn-sm btn-outline" onClick={addPricingTier}>
                                            <HiOutlinePlus size={16} />
                                            Aggiungi Tier
                                        </button>
                                    </div>
                                    <p className="subsection-desc">
                                        Definisci prezzi diversi per derby, Champions League, finali, ecc.
                                    </p>

                                    {pricingTiers.length === 0 ? (
                                        <div className="empty-message">
                                            Nessun tier definito. Il prezzo base verrà usato per tutti gli eventi.
                                        </div>
                                    ) : (
                                        <div className="tiers-list">
                                            {pricingTiers.map((tier, index) => (
                                                <div key={index} className="tier-item">
                                                    <div className="tier-row">
                                                        <input
                                                            type="text"
                                                            value={tier.nome}
                                                            onChange={(e) => updatePricingTier(index, 'nome', e.target.value)}
                                                            className="form-input"
                                                            placeholder="Nome tier (es. Derby)"
                                                        />
                                                        <input
                                                            type="text"
                                                            value={tier.codice}
                                                            onChange={(e) => updatePricingTier(index, 'codice', e.target.value)}
                                                            className="form-input"
                                                            placeholder="Codice"
                                                        />
                                                        <input
                                                            type="number"
                                                            value={tier.prezzo}
                                                            onChange={(e) => updatePricingTier(index, 'prezzo', e.target.value)}
                                                            className="form-input"
                                                            placeholder="Prezzo €"
                                                        />
                                                        <input
                                                            type="number"
                                                            value={tier.moltiplicatore}
                                                            onChange={(e) => updatePricingTier(index, 'moltiplicatore', e.target.value)}
                                                            className="form-input"
                                                            placeholder="Molt."
                                                            step="0.1"
                                                        />
                                                        <button
                                                            type="button"
                                                            className="btn-icon danger"
                                                            onClick={() => removePricingTier(index)}
                                                        >
                                                            <HiOutlineTrash size={18} />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Exclusivity Tab */}
                        {activeTab === 'exclusivity' && (
                            <div className="form-section">
                                <h2 className="section-title">Esclusività</h2>

                                <div className="toggle-cards">
                                    <div className={`toggle-card ${formData.esclusivo ? 'active' : ''}`}>
                                        <label className="checkbox-label">
                                            <input
                                                type="checkbox"
                                                name="esclusivo"
                                                checked={formData.esclusivo}
                                                onChange={handleChange}
                                            />
                                            <div>
                                                <strong>Diritto Esclusivo</strong>
                                                <span>Solo un sponsor può possedere questo diritto</span>
                                            </div>
                                        </label>
                                    </div>

                                    <div className={`toggle-card ${formData.esclusivita_settoriale ? 'active' : ''}`}>
                                        <label className="checkbox-label">
                                            <input
                                                type="checkbox"
                                                name="esclusivita_settoriale"
                                                checked={formData.esclusivita_settoriale}
                                                onChange={handleChange}
                                            />
                                            <div>
                                                <strong>Esclusività Settoriale</strong>
                                                <span>Blocca sponsor dello stesso settore merceologico</span>
                                            </div>
                                        </label>
                                    </div>

                                    <div className={`toggle-card ${formData.sublicenziabile ? 'active' : ''}`}>
                                        <label className="checkbox-label">
                                            <input
                                                type="checkbox"
                                                name="sublicenziabile"
                                                checked={formData.sublicenziabile}
                                                onChange={handleChange}
                                            />
                                            <div>
                                                <strong>Sublicenziabile</strong>
                                                <span>Lo sponsor può sublicenziare il diritto</span>
                                            </div>
                                        </label>
                                    </div>
                                </div>

                                {!formData.esclusivo && (
                                    <div className="form-group">
                                        <label className="form-label">Numero Massimo Allocazioni</label>
                                        <input
                                            type="number"
                                            name="max_allocazioni"
                                            value={formData.max_allocazioni}
                                            onChange={handleNumberChange}
                                            className="form-input"
                                            min="1"
                                            style={{ maxWidth: '150px' }}
                                        />
                                        <span className="form-hint">Quanti sponsor possono avere questo diritto contemporaneamente</span>
                                    </div>
                                )}

                                {formData.sublicenziabile && (
                                    <>
                                        <div className="form-group">
                                            <label className="form-label">Percentuale Club su Sublicenza</label>
                                            <div className="input-with-addon" style={{ maxWidth: '200px' }}>
                                                <input
                                                    type="number"
                                                    name="percentuale_sublicenza"
                                                    value={formData.percentuale_sublicenza || ''}
                                                    onChange={handleNumberChange}
                                                    className="form-input"
                                                    placeholder="0"
                                                    min="0"
                                                    max="100"
                                                />
                                                <span className="input-addon">%</span>
                                            </div>
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">Condizioni Sublicenza</label>
                                            <textarea
                                                name="condizioni_sublicenza"
                                                value={formData.condizioni_sublicenza}
                                                onChange={handleChange}
                                                className="form-textarea"
                                                rows={3}
                                                placeholder="Condizioni e limitazioni per la sublicenza..."
                                            />
                                        </div>
                                    </>
                                )}

                                <div className="form-group">
                                    <label className="form-label">Settori Esclusi</label>
                                    <div className="chips-select">
                                        {sectorOptions.map(sector => (
                                            <button
                                                key={sector}
                                                type="button"
                                                className={`chip ${formData.settori_esclusi.includes(sector) ? 'active' : ''}`}
                                                onClick={() => {
                                                    const current = formData.settori_esclusi;
                                                    if (current.includes(sector)) {
                                                        setFormData(prev => ({
                                                            ...prev,
                                                            settori_esclusi: current.filter(s => s !== sector)
                                                        }));
                                                    } else {
                                                        setFormData(prev => ({
                                                            ...prev,
                                                            settori_esclusi: [...current, sector]
                                                        }));
                                                    }
                                                }}
                                            >
                                                {sector}
                                            </button>
                                        ))}
                                    </div>
                                    <span className="form-hint">Settori che non possono acquistare questo diritto</span>
                                </div>
                            </div>
                        )}

                        {/* Territory Tab */}
                        {activeTab === 'territory' && (
                            <div className="form-section">
                                <h2 className="section-title">Territorio</h2>

                                <div className="form-group">
                                    <label className="form-label">Territorio Disponibile</label>
                                    <div className="radio-cards">
                                        {territoryOptions.map(opt => (
                                            <label
                                                key={opt.value}
                                                className={`radio-card ${formData.territorio_disponibile === opt.value ? 'active' : ''}`}
                                            >
                                                <input
                                                    type="radio"
                                                    name="territorio_disponibile"
                                                    value={opt.value}
                                                    checked={formData.territorio_disponibile === opt.value}
                                                    onChange={handleChange}
                                                />
                                                <HiOutlineGlobeAlt size={24} />
                                                <span>{opt.label}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                <div className="info-box">
                                    <HiOutlineInformationCircle size={20} />
                                    <p>
                                        Il territorio definisce dove lo sponsor può utilizzare il diritto.
                                        Per diritti "Mondiali" lo sponsor può usarlo globalmente.
                                        Per "Italia" solo nel territorio nazionale.
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Duration Tab */}
                        {activeTab === 'duration' && (
                            <div className="form-section">
                                <h2 className="section-title">Durata e Rinnovo</h2>

                                <div className="form-row">
                                    <div className="form-group">
                                        <label className="form-label">Durata Minima (mesi)</label>
                                        <input
                                            type="number"
                                            name="durata_minima_mesi"
                                            value={formData.durata_minima_mesi || ''}
                                            onChange={handleNumberChange}
                                            className="form-input"
                                            min="1"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Durata Massima (mesi)</label>
                                        <input
                                            type="number"
                                            name="durata_massima_mesi"
                                            value={formData.durata_massima_mesi || ''}
                                            onChange={handleNumberChange}
                                            className="form-input"
                                            min="1"
                                            placeholder="Nessun limite"
                                        />
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Preavviso Disdetta (giorni)</label>
                                    <input
                                        type="number"
                                        name="preavviso_disdetta_giorni"
                                        value={formData.preavviso_disdetta_giorni || ''}
                                        onChange={handleNumberChange}
                                        className="form-input"
                                        min="0"
                                        style={{ maxWidth: '200px' }}
                                    />
                                </div>

                                <div className="toggle-cards">
                                    <div className={`toggle-card ${formData.rinnovo_automatico ? 'active' : ''}`}>
                                        <label className="checkbox-label">
                                            <input
                                                type="checkbox"
                                                name="rinnovo_automatico"
                                                checked={formData.rinnovo_automatico}
                                                onChange={handleChange}
                                            />
                                            <div>
                                                <strong>Rinnovo Automatico</strong>
                                                <span>Il contratto si rinnova automaticamente alla scadenza</span>
                                            </div>
                                        </label>
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Stagione Corrente</label>
                                    <input
                                        type="text"
                                        name="stagione_corrente"
                                        value={formData.stagione_corrente}
                                        onChange={handleChange}
                                        className="form-input"
                                        placeholder="es. 2024-2025"
                                        style={{ maxWidth: '200px' }}
                                    />
                                </div>
                            </div>
                        )}

                        {/* Media Tab */}
                        {activeTab === 'media' && (
                            <div className="form-section">
                                <h2 className="section-title">Media e Documenti</h2>

                                <div className="form-group">
                                    <label className="form-label">Immagine Principale (URL)</label>
                                    <input
                                        type="url"
                                        name="immagine_principale"
                                        value={formData.immagine_principale}
                                        onChange={handleChange}
                                        className="form-input"
                                        placeholder="https://..."
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Video Presentazione (URL)</label>
                                    <input
                                        type="url"
                                        name="video_presentazione"
                                        value={formData.video_presentazione}
                                        onChange={handleChange}
                                        className="form-input"
                                        placeholder="https://youtube.com/..."
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Documento Specifiche (URL)</label>
                                    <input
                                        type="url"
                                        name="documento_specifiche"
                                        value={formData.documento_specifiche}
                                        onChange={handleChange}
                                        className="form-input"
                                        placeholder="https://..."
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Note Interne</label>
                                    <textarea
                                        name="note_interne"
                                        value={formData.note_interne}
                                        onChange={handleChange}
                                        className="form-textarea"
                                        rows={4}
                                        placeholder="Note visibili solo al club..."
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </form>

            <style jsx>{`
                .page-container {
                    padding: 24px;
                    max-width: 1200px;
                    margin: 0 auto;
                }

                .page-header {
                    margin-bottom: 24px;
                }

                .header-content {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }

                .header-left {
                    display: flex;
                    align-items: center;
                    gap: 16px;
                }

                .btn-back {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    width: 40px;
                    height: 40px;
                    border-radius: 10px;
                    border: 1px solid var(--border-color);
                    background: var(--bg-primary);
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .btn-back:hover {
                    background: var(--bg-secondary);
                }

                .page-title {
                    font-size: 24px;
                    font-weight: 700;
                    margin: 0;
                }

                .page-subtitle {
                    font-size: 14px;
                    color: var(--text-secondary);
                    margin: 4px 0 0 0;
                }

                .header-actions {
                    display: flex;
                    gap: 12px;
                }

                /* Form Layout */
                .form-layout {
                    display: grid;
                    grid-template-columns: 220px 1fr;
                    gap: 24px;
                }

                .form-sidebar {
                    position: sticky;
                    top: 24px;
                    height: fit-content;
                }

                .form-nav {
                    background: var(--bg-primary);
                    border: 1px solid var(--border-color);
                    border-radius: 12px;
                    padding: 8px;
                }

                .form-nav .nav-item {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    width: 100%;
                    padding: 12px 14px;
                    border: none;
                    background: none;
                    border-radius: 8px;
                    font-size: 14px;
                    color: var(--text-secondary);
                    cursor: pointer;
                    transition: all 0.2s;
                    text-align: left;
                }

                .form-nav .nav-item:hover {
                    background: var(--bg-secondary);
                    color: var(--text-primary);
                }

                .form-nav .nav-item.active {
                    background: var(--primary-green);
                    color: var(--primary-black);
                    font-weight: 500;
                }

                .form-content {
                    background: var(--bg-primary);
                    border: 1px solid var(--border-color);
                    border-radius: 12px;
                    padding: 24px;
                }

                .form-section {
                    animation: fadeIn 0.2s ease;
                }

                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }

                .section-title {
                    font-size: 18px;
                    font-weight: 600;
                    margin: 0 0 24px 0;
                    padding-bottom: 12px;
                    border-bottom: 1px solid var(--border-light);
                }

                /* Form Elements */
                .form-row {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 16px;
                    margin-bottom: 20px;
                }

                .form-group {
                    margin-bottom: 20px;
                }

                .form-label {
                    display: block;
                    font-size: 13px;
                    font-weight: 500;
                    color: var(--text-primary);
                    margin-bottom: 6px;
                }

                .form-label.required::after {
                    content: ' *';
                    color: var(--danger);
                }

                .form-input,
                .form-select,
                .form-textarea {
                    width: 100%;
                    padding: 10px 14px;
                    border: 1px solid var(--border-color);
                    border-radius: 8px;
                    font-size: 14px;
                    background: var(--bg-primary);
                    transition: all 0.2s;
                }

                .form-input:focus,
                .form-select:focus,
                .form-textarea:focus {
                    outline: none;
                    border-color: var(--primary-green);
                    box-shadow: 0 0 0 3px rgba(133, 255, 0, 0.1);
                }

                .form-input.error,
                .form-select.error {
                    border-color: var(--danger);
                }

                .error-text {
                    display: block;
                    font-size: 12px;
                    color: var(--danger);
                    margin-top: 4px;
                }

                .form-hint {
                    display: block;
                    font-size: 12px;
                    color: var(--text-secondary);
                    margin-top: 4px;
                }

                .input-with-addon {
                    display: flex;
                }

                .input-with-addon .form-input {
                    border-top-right-radius: 0;
                    border-bottom-right-radius: 0;
                }

                .input-addon {
                    display: flex;
                    align-items: center;
                    padding: 0 14px;
                    background: var(--bg-secondary);
                    border: 1px solid var(--border-color);
                    border-left: none;
                    border-radius: 0 8px 8px 0;
                    font-size: 14px;
                    color: var(--text-secondary);
                }

                /* Checkboxes */
                .checkboxes {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 16px;
                }

                .checkbox-label {
                    display: flex;
                    align-items: flex-start;
                    gap: 10px;
                    cursor: pointer;
                }

                .checkbox-label input[type="checkbox"] {
                    width: 18px;
                    height: 18px;
                    margin-top: 2px;
                    accent-color: var(--primary-green);
                }

                /* Toggle Cards */
                .toggle-cards {
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                    margin-bottom: 24px;
                }

                .toggle-card {
                    padding: 16px;
                    border: 1px solid var(--border-color);
                    border-radius: 10px;
                    background: var(--bg-primary);
                    transition: all 0.2s;
                }

                .toggle-card.active {
                    border-color: var(--primary-green);
                    background: rgba(133, 255, 0, 0.05);
                }

                .toggle-card .checkbox-label div {
                    display: flex;
                    flex-direction: column;
                }

                .toggle-card .checkbox-label strong {
                    font-size: 14px;
                    color: var(--text-primary);
                }

                .toggle-card .checkbox-label span {
                    font-size: 12px;
                    color: var(--text-secondary);
                    margin-top: 2px;
                }

                /* Radio Cards */
                .radio-cards {
                    display: grid;
                    grid-template-columns: repeat(4, 1fr);
                    gap: 12px;
                }

                .radio-card {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 8px;
                    padding: 20px;
                    border: 2px solid var(--border-color);
                    border-radius: 12px;
                    cursor: pointer;
                    transition: all 0.2s;
                    text-align: center;
                }

                .radio-card:hover {
                    border-color: var(--primary-green);
                }

                .radio-card.active {
                    border-color: var(--primary-green);
                    background: rgba(133, 255, 0, 0.05);
                }

                .radio-card input {
                    display: none;
                }

                .radio-card svg {
                    color: var(--text-secondary);
                }

                .radio-card.active svg {
                    color: var(--primary-green);
                }

                /* Chips */
                .chips-select {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 8px;
                }

                .chip {
                    padding: 6px 14px;
                    border: 1px solid var(--border-color);
                    border-radius: 20px;
                    background: var(--bg-primary);
                    font-size: 13px;
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .chip:hover {
                    border-color: var(--primary-green);
                }

                .chip.active {
                    background: var(--primary-green);
                    border-color: var(--primary-green);
                    color: var(--primary-black);
                }

                /* Subsection */
                .subsection {
                    margin-top: 32px;
                    padding-top: 24px;
                    border-top: 1px solid var(--border-light);
                }

                .subsection-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 8px;
                }

                .subsection-header h3 {
                    font-size: 15px;
                    font-weight: 600;
                    margin: 0;
                }

                .subsection-desc {
                    font-size: 13px;
                    color: var(--text-secondary);
                    margin: 0 0 16px 0;
                }

                .empty-message {
                    padding: 24px;
                    text-align: center;
                    color: var(--text-secondary);
                    font-size: 14px;
                    background: var(--bg-secondary);
                    border-radius: 8px;
                }

                /* Tiers List */
                .tiers-list {
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                }

                .tier-item {
                    padding: 12px;
                    border: 1px solid var(--border-color);
                    border-radius: 8px;
                }

                .tier-row {
                    display: grid;
                    grid-template-columns: 2fr 1fr 1fr 80px 40px;
                    gap: 12px;
                    align-items: center;
                }

                .tier-row .form-input {
                    margin-bottom: 0;
                }

                /* Info Box */
                .info-box {
                    display: flex;
                    gap: 12px;
                    padding: 16px;
                    background: #3B82F610;
                    border: 1px solid #3B82F630;
                    border-radius: 10px;
                    margin-top: 20px;
                }

                .info-box svg {
                    color: #3B82F6;
                    flex-shrink: 0;
                }

                .info-box p {
                    margin: 0;
                    font-size: 13px;
                    color: var(--text-secondary);
                    line-height: 1.5;
                }

                /* Buttons */
                .btn {
                    display: inline-flex;
                    align-items: center;
                    gap: 8px;
                    padding: 10px 16px;
                    border-radius: 8px;
                    font-size: 14px;
                    font-weight: 500;
                    cursor: pointer;
                    transition: all 0.2s;
                    border: none;
                }

                .btn:disabled {
                    opacity: 0.6;
                    cursor: not-allowed;
                }

                .btn-primary {
                    background: var(--primary-green);
                    color: var(--primary-black);
                }

                .btn-primary:hover:not(:disabled) {
                    background: var(--primary-green-dark);
                }

                .btn-outline {
                    background: transparent;
                    border: 1px solid var(--border-color);
                    color: var(--text-primary);
                }

                .btn-outline:hover {
                    background: var(--bg-secondary);
                }

                .btn-sm {
                    padding: 6px 12px;
                    font-size: 12px;
                }

                .btn-icon {
                    background: none;
                    border: none;
                    padding: 8px;
                    cursor: pointer;
                    color: var(--text-secondary);
                    border-radius: 6px;
                }

                .btn-icon:hover {
                    background: var(--bg-secondary);
                }

                .btn-icon.danger {
                    color: var(--danger);
                }

                .btn-icon.danger:hover {
                    background: #EF444410;
                }

                /* Loading */
                .loading-container {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    padding: 80px;
                }

                .spinner {
                    width: 40px;
                    height: 40px;
                    border: 3px solid var(--border-color);
                    border-top-color: var(--primary-green);
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                }

                @keyframes spin {
                    to { transform: rotate(360deg); }
                }

                /* Responsive */
                @media (max-width: 768px) {
                    .form-layout {
                        grid-template-columns: 1fr;
                    }

                    .form-sidebar {
                        position: static;
                    }

                    .form-nav {
                        display: flex;
                        overflow-x: auto;
                        padding: 4px;
                    }

                    .form-nav .nav-item {
                        flex-shrink: 0;
                        padding: 10px 16px;
                    }

                    .form-row {
                        grid-template-columns: 1fr;
                    }

                    .radio-cards {
                        grid-template-columns: repeat(2, 1fr);
                    }

                    .tier-row {
                        grid-template-columns: 1fr;
                    }
                }
            `}</style>
        </div>
    );
}

export default RightForm;
