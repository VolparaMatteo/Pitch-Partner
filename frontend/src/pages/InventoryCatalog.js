import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { getAuth } from '../utils/auth';
import { getImageUrl } from '../utils/imageUtils';
import DefaultAsset from '../static/logo/FavIcon.png';
import Modal from '../components/Modal';
import SupportWidget from '../components/SupportWidget';
import GuidedTour from '../components/GuidedTour';
import {
  FaSearch, FaFilter, FaPlus, FaTh, FaList, FaBoxOpen, FaTag,
  FaEuroSign, FaCheck, FaTimes, FaChevronRight, FaChevronLeft, FaLayerGroup,
  FaCube, FaDesktop, FaTshirt, FaUsers, FaBullhorn, FaBuilding,
  FaGlobe, FaStar, FaEye, FaEdit, FaTrash, FaChartPie, FaCog,
  FaCalendar, FaHistory, FaPalette, FaSave, FaChevronDown, FaArchive,
  FaUndo, FaExclamationTriangle, FaGavel
} from 'react-icons/fa';
import '../styles/template-style.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5003/api';

// Icone per categorie
const categoryIcons = {
  led: FaDesktop,
  jersey: FaTshirt,
  digital: FaGlobe,
  hospitality: FaUsers,
  broadcast: FaBullhorn,
  naming: FaBuilding,
  retail: FaBoxOpen,
  event: FaLayerGroup,
  default: FaCube
};

function InventoryCatalog() {
  const [assets, setAssets] = useState([]);
  const [categories, setCategories] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [filterDisponibile, setFilterDisponibile] = useState('all');
  const [filterTipo, setFilterTipo] = useState('all');
  const [filterPrezzo, setFilterPrezzo] = useState('all');
  const [sortBy, setSortBy] = useState('nome_asc');
  const [viewMode, setViewMode] = useState('list');
  const [showCategoryModal, setShowCategoryModal] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  // Category CRUD state
  const [editingCategory, setEditingCategory] = useState(null);
  const [categoryForm, setCategoryForm] = useState({
    nome: '',
    icona: 'default',
    colore: '#3B82F6'
  });
  const [savingCategory, setSavingCategory] = useState(false);
  const [showCategoryConfirmModal, setShowCategoryConfirmModal] = useState(false);
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState(null);

  // Asset delete modal state
  const [showAssetDeleteModal, setShowAssetDeleteModal] = useState(false);
  const [assetToDelete, setAssetToDelete] = useState(null);
  const [deletingAsset, setDeletingAsset] = useState(false);

  // Asset archive modal state
  const [showAssetArchiveModal, setShowAssetArchiveModal] = useState(false);
  const [assetToArchive, setAssetToArchive] = useState(null);
  const [archivingAsset, setArchivingAsset] = useState(false);
  const [archiveReason, setArchiveReason] = useState('');
  const [showArchivedAssets, setShowArchivedAssets] = useState(false);

  // Guided Tour state
  const [isTourOpen, setIsTourOpen] = useState(false);

  // Category scroll state
  const categoryScrollRef = useRef(null);
  const catalogRef = useRef(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);

  // Custom dropdown state
  const [tipoDropdownOpen, setTipoDropdownOpen] = useState(false);
  const [disponibilitaDropdownOpen, setDisponibilitaDropdownOpen] = useState(false);
  const [prezzoDropdownOpen, setPrezzoDropdownOpen] = useState(false);
  const [sortDropdownOpen, setSortDropdownOpen] = useState(false);
  const tipoDropdownRef = useRef(null);
  const disponibilitaDropdownRef = useRef(null);
  const prezzoDropdownRef = useRef(null);
  const sortDropdownRef = useRef(null);

  // Handle page change with smooth scroll
  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
    if (catalogRef.current) {
      catalogRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const checkScrollArrows = () => {
    const el = categoryScrollRef.current;
    if (el) {
      setShowLeftArrow(el.scrollLeft > 0);
      setShowRightArrow(el.scrollLeft < el.scrollWidth - el.clientWidth - 5);
    }
  };

  const scrollCategories = (direction) => {
    const el = categoryScrollRef.current;
    if (el) {
      const scrollAmount = 200;
      el.scrollBy({ left: direction === 'left' ? -scrollAmount : scrollAmount, behavior: 'smooth' });
    }
  };

  useEffect(() => {
    checkScrollArrows();
    window.addEventListener('resize', checkScrollArrows);
    return () => window.removeEventListener('resize', checkScrollArrows);
  }, [categories]);

  // Click outside handler for custom dropdowns
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (tipoDropdownRef.current && !tipoDropdownRef.current.contains(e.target)) {
        setTipoDropdownOpen(false);
      }
      if (disponibilitaDropdownRef.current && !disponibilitaDropdownRef.current.contains(e.target)) {
        setDisponibilitaDropdownOpen(false);
      }
      if (prezzoDropdownRef.current && !prezzoDropdownRef.current.contains(e.target)) {
        setPrezzoDropdownOpen(false);
      }
      if (sortDropdownRef.current && !sortDropdownRef.current.contains(e.target)) {
        setSortDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Available icons for categories
  const availableIcons = [
    { value: 'led', label: 'LED/Display', icon: FaDesktop },
    { value: 'jersey', label: 'Jersey/Abbigliamento', icon: FaTshirt },
    { value: 'digital', label: 'Digital', icon: FaGlobe },
    { value: 'hospitality', label: 'Hospitality', icon: FaUsers },
    { value: 'broadcast', label: 'Broadcast', icon: FaBullhorn },
    { value: 'naming', label: 'Naming Rights', icon: FaBuilding },
    { value: 'retail', label: 'Retail', icon: FaBoxOpen },
    { value: 'event', label: 'Eventi', icon: FaLayerGroup },
    { value: 'default', label: 'Generico', icon: FaCube }
  ];

  // Available colors for categories
  const availableColors = [
    '#3B82F6', '#10B981', '#8B5CF6', '#F59E0B', '#EF4444',
    '#EC4899', '#6366F1', '#14B8A6', '#F97316', '#84CC16'
  ];

  // Filter options for custom dropdowns
  const tipoOptions = [
    { value: 'all', label: 'Tutti i tipi', icon: FaLayerGroup, color: '#6B7280' },
    { value: 'fisico', label: 'Fisico', icon: FaCube, color: '#3B82F6' },
    { value: 'digitale', label: 'Digitale', icon: FaGlobe, color: '#8B5CF6' },
    { value: 'esperienza', label: 'Esperienza', icon: FaStar, color: '#F59E0B' },
    { value: 'diritto', label: 'Diritto', icon: FaGavel, color: '#EC4899' },
    { value: 'misto', label: 'Misto', icon: FaLayerGroup, color: '#10B981' }
  ];

  const disponibilitaOptions = [
    { value: 'all', label: 'Tutti gli stati', icon: FaLayerGroup, color: '#6B7280' },
    { value: 'true', label: 'Disponibili', icon: FaCheck, color: '#10B981' },
    { value: 'false', label: 'Non disponibili', icon: FaTimes, color: '#EF4444' }
  ];

  const prezzoOptions = [
    { value: 'all', label: 'Tutti i prezzi', icon: FaEuroSign, color: '#6B7280' },
    { value: '0-50000', label: 'Fino a €50.000', icon: FaEuroSign, color: '#10B981' },
    { value: '50000-150000', label: '€50.000 - €150.000', icon: FaEuroSign, color: '#3B82F6' },
    { value: '150000-500000', label: '€150.000 - €500.000', icon: FaEuroSign, color: '#8B5CF6' },
    { value: '500000+', label: 'Oltre €500.000', icon: FaEuroSign, color: '#F59E0B' }
  ];

  const sortOptions = [
    { value: 'nome_asc', label: 'Nome A-Z', icon: FaCube, color: '#6B7280' },
    { value: 'nome_desc', label: 'Nome Z-A', icon: FaCube, color: '#6B7280' },
    { value: 'prezzo_asc', label: 'Prezzo crescente', icon: FaEuroSign, color: '#10B981' },
    { value: 'prezzo_desc', label: 'Prezzo decrescente', icon: FaEuroSign, color: '#EF4444' },
    { value: 'categoria', label: 'Categoria', icon: FaTag, color: '#8B5CF6' }
  ];

  // Helper function to get selected option
  const getSelectedOption = (options, value) => options.find(opt => opt.value === value) || options[0];

  const navigate = useNavigate();
  const { user, token } = getAuth();

  useEffect(() => {
    if (!user || user.role !== 'club') {
      navigate('/club/login');
      return;
    }
    fetchData();
  }, [showArchivedAssets]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const headers = { Authorization: `Bearer ${token}` };

      // Build URL with archive filter
      const assetsUrl = showArchivedAssets
        ? `${API_URL}/club/inventory/assets?only_archived=true`
        : `${API_URL}/club/inventory/assets`;

      const [assetsRes, categoriesRes, statsRes] = await Promise.all([
        axios.get(assetsUrl, { headers }),
        axios.get(`${API_URL}/club/inventory/categories`, { headers }),
        axios.get(`${API_URL}/club/inventory/stats`, { headers })
      ]);

      setAssets(assetsRes.data?.assets || assetsRes.data || []);
      setCategories(categoriesRes.data?.categories || categoriesRes.data || []);
      setStats(statsRes.data?.stats || statsRes.data || {});
    } catch (error) {
      console.error('Errore caricamento inventario:', error);
      // Demo data
      setCategories([
        { id: 1, nome: 'LED Boards', codice: 'led', icona: 'led', colore: '#3B82F6', assets_count: 12 },
        { id: 2, nome: 'Jersey & Kit', codice: 'jersey', icona: 'jersey', colore: '#10B981', assets_count: 8 },
        { id: 3, nome: 'Digital', codice: 'digital', icona: 'digital', colore: '#8B5CF6', assets_count: 15 },
        { id: 4, nome: 'Hospitality', codice: 'hospitality', icona: 'hospitality', colore: '#F59E0B', assets_count: 6 },
        { id: 5, nome: 'Broadcast', codice: 'broadcast', icona: 'broadcast', colore: '#EF4444', assets_count: 10 },
        { id: 6, nome: 'Naming Rights', codice: 'naming', icona: 'naming', colore: '#EC4899', assets_count: 4 },
        { id: 7, nome: 'Diritti', codice: 'diritti', icona: 'default', colore: '#EC4899', assets_count: 3 }
      ]);
      setAssets([
        { id: 1, codice: 'LED-001', nome: 'LED Board Tribuna Centrale', category: { nome: 'LED Boards', codice: 'led', colore: '#3B82F6' }, tipo: 'fisico', prezzo_listino: 50000, disponibile: true, posizione: 'Tribuna Centrale', dimensioni: '6m x 1m' },
        { id: 2, codice: 'LED-002', nome: 'LED Board Curva Nord', category: { nome: 'LED Boards', codice: 'led', colore: '#3B82F6' }, tipo: 'fisico', prezzo_listino: 35000, disponibile: true, posizione: 'Curva Nord' },
        { id: 3, codice: 'JER-001', nome: 'Maglia Gara - Fronte', category: { nome: 'Jersey & Kit', codice: 'jersey', colore: '#10B981' }, tipo: 'fisico', prezzo_listino: 500000, disponibile: false, posizione: 'Fronte maglia' },
        { id: 4, codice: 'JER-002', nome: 'Maglia Gara - Manica Dx', category: { nome: 'Jersey & Kit', codice: 'jersey', colore: '#10B981' }, tipo: 'fisico', prezzo_listino: 150000, disponibile: true, posizione: 'Manica destra' },
        { id: 5, codice: 'DIG-001', nome: 'Banner Homepage Sito', category: { nome: 'Digital', codice: 'digital', colore: '#8B5CF6' }, tipo: 'digitale', prezzo_listino: 25000, disponibile: true },
        { id: 6, codice: 'DIG-002', nome: 'Post Instagram Sponsorizzato', category: { nome: 'Digital', codice: 'digital', colore: '#8B5CF6' }, tipo: 'digitale', prezzo_listino: 15000, disponibile: true },
        { id: 7, codice: 'HOS-001', nome: 'Skybox VIP 12 posti', category: { nome: 'Hospitality', codice: 'hospitality', colore: '#F59E0B' }, tipo: 'esperienza', prezzo_listino: 80000, disponibile: true },
        { id: 8, codice: 'BRO-001', nome: 'Backdrop Interviste', category: { nome: 'Broadcast', codice: 'broadcast', colore: '#EF4444' }, tipo: 'fisico', prezzo_listino: 100000, disponibile: false },
        { id: 9, codice: 'DIR-001', nome: 'Diritto di Immagine Prima Squadra', category: { nome: 'Diritti', codice: 'diritti', colore: '#EC4899' }, tipo: 'diritto', prezzo_listino: 200000, disponibile: true, descrizione: 'Utilizzo immagini giocatori per campagne pubblicitarie' },
        { id: 10, codice: 'DIR-002', nome: 'Diritto Esclusiva Settore Automotive', category: { nome: 'Diritti', codice: 'diritti', colore: '#EC4899' }, tipo: 'diritto', prezzo_listino: 350000, disponibile: true, descrizione: 'Esclusiva di categoria per il settore automotive' },
        { id: 11, codice: 'DIR-003', nome: 'Diritto Naming Training Center', category: { nome: 'Naming Rights', codice: 'naming', colore: '#EC4899' }, tipo: 'diritto', prezzo_listino: 500000, disponibile: false, descrizione: 'Naming rights del centro sportivo' }
      ]);
      setStats({
        inventory: { total_assets: 55, available_assets: 42, occupancy_rate: 23.6, total_value: 2500000, allocated_value: 850000 },
        exclusivities: { total: 12, assigned: 5, available: 7 },
        packages: { total: 4, sold: 2 }
      });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0
    }).format(value || 0);
  };

  const getCategoryIcon = (codice) => {
    const IconComponent = categoryIcons[codice] || categoryIcons.default;
    return <IconComponent />;
  };

  // Filtering logic
  const filteredAssets = assets.filter(asset => {
    const matchesSearch = !searchTerm ||
      asset.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset.codice?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset.posizione?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' ||
      asset.category?.codice === selectedCategory ||
      asset.category_id === parseInt(selectedCategory);
    const matchesDisponibile = filterDisponibile === 'all' ||
      (filterDisponibile === 'true' && asset.disponibile) ||
      (filterDisponibile === 'false' && !asset.disponibile);
    const matchesTipo = filterTipo === 'all' || asset.tipo === filterTipo;
    const matchesPrezzo = filterPrezzo === 'all' ||
      (filterPrezzo === '0-50000' && (asset.prezzo_listino || 0) <= 50000) ||
      (filterPrezzo === '50000-150000' && (asset.prezzo_listino || 0) > 50000 && (asset.prezzo_listino || 0) <= 150000) ||
      (filterPrezzo === '150000-500000' && (asset.prezzo_listino || 0) > 150000 && (asset.prezzo_listino || 0) <= 500000) ||
      (filterPrezzo === '500000+' && (asset.prezzo_listino || 0) > 500000);
    return matchesSearch && matchesCategory && matchesDisponibile && matchesTipo && matchesPrezzo;
  });

  // Sorting logic
  const sortedAssets = [...filteredAssets].sort((a, b) => {
    switch (sortBy) {
      case 'nome_asc':
        return (a.nome || '').localeCompare(b.nome || '');
      case 'nome_desc':
        return (b.nome || '').localeCompare(a.nome || '');
      case 'prezzo_asc':
        return (a.prezzo_listino || 0) - (b.prezzo_listino || 0);
      case 'prezzo_desc':
        return (b.prezzo_listino || 0) - (a.prezzo_listino || 0);
      case 'categoria':
        return (a.category?.nome || '').localeCompare(b.category?.nome || '');
      default:
        return 0;
    }
  });

  // Pagination logic
  const totalItems = sortedAssets.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedAssets = sortedAssets.slice(startIndex, startIndex + itemsPerPage);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedCategory, filterDisponibile, filterTipo, filterPrezzo, sortBy]);

  // Count active filters
  const activeFiltersCount = [
    searchTerm,
    selectedCategory !== 'all',
    filterDisponibile !== 'all',
    filterTipo !== 'all',
    filterPrezzo !== 'all'
  ].filter(Boolean).length;

  // Clear all filters
  const clearAllFilters = () => {
    setSearchTerm('');
    setSelectedCategory('all');
    setFilterDisponibile('all');
    setFilterTipo('all');
    setFilterPrezzo('all');
    setSortBy('nome_asc');
  };

  const handleDeleteAsset = (asset, e) => {
    e.stopPropagation();
    setAssetToDelete(asset);
    setShowAssetDeleteModal(true);
  };

  const confirmDeleteAsset = async () => {
    if (!assetToDelete) return;

    setDeletingAsset(true);
    try {
      await axios.delete(`${API_URL}/club/inventory/assets/${assetToDelete.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setShowAssetDeleteModal(false);
      setAssetToDelete(null);
      fetchData();
    } catch (error) {
      console.error('Errore eliminazione:', error);
      alert('Errore nell\'eliminazione dell\'asset');
    } finally {
      setDeletingAsset(false);
    }
  };

  // ============ ASSET ARCHIVE HANDLERS ============

  const handleArchiveAsset = (asset, e) => {
    e.stopPropagation();
    setAssetToArchive(asset);
    setArchiveReason('');
    setShowAssetArchiveModal(true);
  };

  const confirmArchiveAsset = async () => {
    if (!assetToArchive) return;

    setArchivingAsset(true);
    try {
      await axios.post(`${API_URL}/club/inventory/assets/${assetToArchive.id}/archive`, {
        motivo: archiveReason
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setShowAssetArchiveModal(false);
      setAssetToArchive(null);
      setArchiveReason('');
      fetchData();
    } catch (error) {
      console.error('Errore archiviazione:', error);
      alert('Errore nell\'archiviazione dell\'asset');
    } finally {
      setArchivingAsset(false);
    }
  };

  const handleRestoreAsset = async (asset, e) => {
    e.stopPropagation();
    try {
      await axios.post(`${API_URL}/club/inventory/assets/${asset.id}/restore`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchData();
    } catch (error) {
      console.error('Errore ripristino:', error);
      alert('Errore nel ripristino dell\'asset');
    }
  };

  // ============ GUIDED TOUR CONFIGURATION ============

  const tourSteps = [
    {
      target: '[data-tour="page-header"]',
      title: 'Benvenuto nell\'Inventario',
      content: 'Questa è la pagina principale per gestire tutti gli asset e i diritti del tuo club. Qui puoi visualizzare, creare, modificare e organizzare tutte le opportunità di sponsorizzazione disponibili.',
      placement: 'bottom',
      tip: 'Gli asset includono spazi LED, posizioni sulla maglia, hospitality. I diritti includono esclusività di settore, diritti di immagine e naming rights.',
      icon: <FaBoxOpen size={18} color="white" />,
      iconBg: 'linear-gradient(135deg, #85FF00, #65A30D)'
    },
    {
      target: '[data-tour="action-buttons"]',
      title: 'Azioni Rapide',
      content: 'Da qui puoi accedere velocemente alle funzionalità principali: confrontare asset e diritti, visualizzare il calendario disponibilità, consultare lo storico allocazioni, gestire i pacchetti e visualizzare gli elementi archiviati.',
      placement: 'bottom-left',
      tip: 'Usa "Nuovo Asset" per aggiungere un nuovo asset o diritto al catalogo.',
      icon: <FaPlus size={18} color="white" />,
      iconBg: 'linear-gradient(135deg, #3B82F6, #1D4ED8)'
    },
    {
      target: '[data-tour="stats-row"]',
      title: 'Statistiche Inventario',
      content: 'Queste card mostrano una panoramica del tuo inventario: il numero totale di asset e diritti, quanti sono disponibili, il valore complessivo del catalogo e il tasso di occupazione attuale.',
      placement: 'bottom',
      tip: 'Il tasso di occupazione indica la percentuale di asset e diritti attualmente allocati a sponsor.',
      icon: <FaChartPie size={18} color="white" />,
      iconBg: 'linear-gradient(135deg, #8B5CF6, #6D28D9)'
    },
    {
      target: '[data-tour="categories-filter"]',
      title: 'Filtro per Categorie',
      content: 'Usa questi chip per filtrare rapidamente gli asset e i diritti per categoria. Clicca su una categoria per vedere solo gli elementi di quel tipo, oppure "Tutte" per visualizzare l\'intero catalogo.',
      placement: 'bottom',
      tip: 'Clicca su "Gestisci Categorie" per creare, modificare o eliminare le categorie di asset e diritti.',
      icon: <FaTag size={18} color="white" />,
      iconBg: 'linear-gradient(135deg, #F59E0B, #D97706)'
    },
    {
      target: '[data-tour="search-input"]',
      title: 'Ricerca Asset e Diritti',
      content: 'Cerca asset e diritti per nome, codice o posizione. La ricerca è istantanea e filtra i risultati mentre digiti.',
      placement: 'bottom',
      tip: 'Combina la ricerca con i filtri per trovare esattamente ciò che cerchi.',
      icon: <FaSearch size={18} color="white" />,
      iconBg: 'linear-gradient(135deg, #10B981, #059669)'
    },
    {
      target: '[data-tour="filter-tipo"]',
      title: 'Filtro per Tipo',
      content: 'Filtra gli elementi in base al tipo: Fisico (LED boards, bandiere), Digitale (banner sito, social), Esperienza (hospitality, meet&greet), Diritto (esclusività, naming rights, immagine) o Misto.',
      placement: 'bottom',
      tip: 'I filtri attivi sono evidenziati con un bordo verde.',
      icon: <FaCube size={18} color="white" />,
      iconBg: 'linear-gradient(135deg, #3B82F6, #1D4ED8)'
    },
    {
      target: '[data-tour="filter-disponibilita"]',
      title: 'Filtro Disponibilità',
      content: 'Visualizza solo asset e diritti disponibili per nuove sponsorizzazioni oppure quelli già allocati. Utile per capire rapidamente cosa puoi offrire a un nuovo sponsor.',
      placement: 'bottom',
      icon: <FaCheck size={18} color="white" />,
      iconBg: 'linear-gradient(135deg, #10B981, #059669)'
    },
    {
      target: '[data-tour="filter-prezzo"]',
      title: 'Filtro per Prezzo',
      content: 'Filtra asset e diritti per fascia di prezzo, dal più economico al più esclusivo. Ideale per trovare opportunità che rientrano nel budget di uno specifico sponsor.',
      placement: 'bottom',
      icon: <FaEuroSign size={18} color="white" />,
      iconBg: 'linear-gradient(135deg, #F59E0B, #D97706)'
    },
    {
      target: '[data-tour="sort-dropdown"]',
      title: 'Ordinamento',
      content: 'Ordina gli asset per nome (A-Z o Z-A), prezzo (crescente o decrescente) o per categoria. L\'ordinamento si applica ai risultati filtrati.',
      placement: 'bottom-right',
      icon: <FaFilter size={18} color="white" />,
      iconBg: 'linear-gradient(135deg, #6366F1, #4F46E5)'
    },
    {
      target: '[data-tour="view-toggle"]',
      title: 'Modalità di Visualizzazione',
      content: 'Alterna tra la visualizzazione a lista (tabella dettagliata) e la visualizzazione a griglia (card con immagini). Scegli quella che preferisci in base alle tue esigenze.',
      placement: 'bottom-right',
      tip: 'La griglia è ideale per una panoramica visiva, la lista per confrontare dettagli.',
      icon: <FaTh size={18} color="white" />,
      iconBg: 'linear-gradient(135deg, #EC4899, #DB2777)'
    },
    {
      target: '[data-tour="asset-list"]',
      title: 'Elenco Asset e Diritti',
      content: 'Qui trovi tutti gli asset e i diritti del tuo catalogo. Per ogni elemento puoi vedere categoria, tipo, posizione, prezzo e stato di disponibilità. Passa il mouse sopra un elemento per vedere le azioni disponibili.',
      placement: 'top',
      tip: 'Clicca sull\'icona dell\'occhio per visualizzare i dettagli completi.',
      icon: <FaList size={18} color="white" />,
      iconBg: 'linear-gradient(135deg, #1A1A1A, #374151)'
    },
    {
      target: '[data-tour="asset-actions"]',
      title: 'Azioni sugli Elementi',
      content: 'Per ogni asset o diritto puoi: visualizzare i dettagli, modificare le informazioni, archiviare (per conservare i dati senza eliminare) o eliminare definitivamente.',
      placement: 'left',
      tip: 'L\'archiviazione è consigliata rispetto all\'eliminazione per mantenere lo storico.',
      icon: <FaCog size={18} color="white" />,
      iconBg: 'linear-gradient(135deg, #6B7280, #4B5563)'
    }
  ];

  // Archive Tour Steps
  const archiveTourSteps = [
    {
      target: '[data-tour="page-header"]',
      title: 'Archivio Asset e Diritti',
      content: 'Benvenuto nell\'archivio! Qui trovi tutti gli asset e i diritti che sono stati archiviati. Gli elementi archiviati non sono visibili nel catalogo principale ma i loro dati e lo storico sono conservati.',
      placement: 'bottom',
      tip: 'L\'archiviazione è ideale per elementi temporaneamente non disponibili o fuori produzione.',
      icon: <FaArchive size={18} color="white" />,
      iconBg: 'linear-gradient(135deg, #F59E0B, #D97706)'
    },
    {
      target: '[data-tour="action-buttons"]',
      title: 'Torna al Catalogo',
      content: 'Clicca nuovamente sul pulsante "Archivio" per tornare alla vista normale del catalogo e vedere gli asset e i diritti attivi.',
      placement: 'bottom-left',
      icon: <FaUndo size={18} color="white" />,
      iconBg: 'linear-gradient(135deg, #3B82F6, #1D4ED8)'
    },
    {
      target: '[data-tour="asset-list"]',
      title: 'Elementi Archiviati',
      content: 'Qui vedi tutti gli asset e i diritti archiviati con la data di archiviazione e il motivo (se specificato). Puoi cercare e filtrare anche tra gli elementi archiviati.',
      placement: 'top',
      tip: 'Gli elementi archiviati mantengono tutto lo storico delle allocazioni passate.',
      icon: <FaList size={18} color="white" />,
      iconBg: 'linear-gradient(135deg, #1A1A1A, #374151)'
    },
    {
      target: '[data-tour="asset-actions"]',
      title: 'Ripristina o Elimina',
      content: 'Per ogni elemento archiviato puoi: ripristinarlo nel catalogo attivo (icona verde) oppure eliminarlo definitivamente (icona rossa). Il ripristino riporta l\'elemento disponibile per nuove sponsorizzazioni.',
      placement: 'left',
      tip: 'L\'eliminazione è permanente e rimuove tutti i dati. Usa con cautela!',
      icon: <FaCog size={18} color="white" />,
      iconBg: 'linear-gradient(135deg, #6B7280, #4B5563)'
    }
  ];

  const handleStartTour = () => {
    setIsTourOpen(true);
  };

  const handleTourComplete = () => {
    setIsTourOpen(false);
  };

  // ============ CATEGORY CRUD HANDLERS ============

  const openNewCategory = () => {
    setEditingCategory(null);
    setCategoryForm({
      nome: '',
      icona: 'default',
      colore: '#3B82F6'
    });
  };

  const openEditCategory = (category) => {
    setEditingCategory(category);
    setCategoryForm({
      nome: category.nome || '',
      icona: category.icona || 'default',
      colore: category.colore || '#3B82F6'
    });
  };

  const handleCategoryFormChange = (field, value) => {
    setCategoryForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSaveCategory = () => {
    if (!categoryForm.nome) {
      alert('Il nome è obbligatorio');
      return;
    }
    // Show confirmation modal
    setShowCategoryConfirmModal(true);
  };

  const confirmSaveCategory = async () => {
    setSavingCategory(true);
    try {
      if (editingCategory) {
        // Update
        await axios.put(
          `${API_URL}/club/inventory/categories/${editingCategory.id}`,
          categoryForm,
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } else {
        // Create
        await axios.post(
          `${API_URL}/club/inventory/categories`,
          categoryForm,
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }

      // Reset form and refresh
      setEditingCategory(null);
      setCategoryForm({
        nome: '',
        icona: 'default',
        colore: '#3B82F6'
      });
      setShowCategoryConfirmModal(false);
      fetchData();
    } catch (error) {
      console.error('Errore salvataggio categoria:', error);
      alert('Errore nel salvataggio della categoria');
    } finally {
      setSavingCategory(false);
    }
  };

  const handleDeleteCategory = (categoryId) => {
    const category = categories.find(c => c.id === categoryId);
    setCategoryToDelete(category);
    setShowDeleteConfirmModal(true);
  };

  const confirmDeleteCategory = async () => {
    if (!categoryToDelete) return;

    try {
      await axios.delete(`${API_URL}/club/inventory/categories/${categoryToDelete.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setShowDeleteConfirmModal(false);
      setCategoryToDelete(null);
      fetchData();
    } catch (error) {
      console.error('Errore eliminazione categoria:', error);
      alert('Errore nell\'eliminazione della categoria');
    }
  };

  const cancelCategoryEdit = () => {
    setEditingCategory(null);
    setCategoryForm({
      nome: '',
      icona: 'default',
      colore: '#3B82F6'
    });
  };

  if (loading) {
    return (
      <div className="tp-page">
        <div className="tp-loading">
          <div className="tp-spinner"></div>
          <p>Caricamento inventario...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="tp-page">
      {/* Page Header */}
      <div className="tp-page-header" data-tour="page-header">
        <div className="tp-header-content">
          <h1 className="tp-page-title">Inventario Asset</h1>
          <p className="tp-page-subtitle">
            Gestisci il catalogo completo degli asset disponibili per sponsorizzazione
          </p>
        </div>
        <div className="tp-page-actions" data-tour="action-buttons">
          <button
            className="tp-btn tp-btn-outline"
            onClick={() => navigate('/club/inventory/compare')}
            title="Confronta Asset"
          >
            <FaChartPie /> Confronta
          </button>
          <button
            className="tp-btn tp-btn-outline"
            onClick={() => navigate('/club/inventory/calendar')}
            title="Calendario Disponibilità"
          >
            <FaCalendar /> Calendario
          </button>
          <button
            className="tp-btn tp-btn-outline"
            onClick={() => navigate('/club/inventory/allocations')}
            title="Storico Allocazioni"
          >
            <FaHistory /> Allocazioni
          </button>
          <button
            className="tp-btn tp-btn-outline"
            onClick={() => navigate('/club/inventory/packages')}
          >
            <FaLayerGroup /> Packages
          </button>
          <button
            className={`tp-btn ${showArchivedAssets ? 'tp-btn-warning' : 'tp-btn-outline'}`}
            onClick={() => setShowArchivedAssets(!showArchivedAssets)}
            style={showArchivedAssets ? {
              background: '#F59E0B',
              borderColor: '#F59E0B',
              color: 'white'
            } : {}}
          >
            <FaArchive /> {showArchivedAssets ? 'Archivio' : 'Archivio'}
            {stats?.inventory?.archived_assets > 0 && !showArchivedAssets && (
              <span style={{
                marginLeft: '6px',
                background: '#F59E0B',
                color: 'white',
                padding: '2px 8px',
                borderRadius: '10px',
                fontSize: '12px',
                fontWeight: 600
              }}>
                {stats.inventory.archived_assets}
              </span>
            )}
          </button>
          {!showArchivedAssets && (
            <button
              className="tp-btn tp-btn-primary"
              onClick={() => navigate('/club/inventory/assets/new')}
            >
              <FaPlus /> Nuovo Asset
            </button>
          )}
        </div>
      </div>

      {/* Archive Mode Banner */}
      {showArchivedAssets && (
        <div style={{
          background: 'linear-gradient(135deg, #FEF3C7, #FDE68A)',
          border: '1px solid #F59E0B',
          borderRadius: '12px',
          padding: '16px 24px',
          marginBottom: '24px',
          display: 'flex',
          alignItems: 'center',
          gap: '16px'
        }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            background: '#F59E0B',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <FaArchive size={24} color="white" />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: '16px', color: '#92400E' }}>
              Stai visualizzando gli asset archiviati
            </div>
            <div style={{ fontSize: '14px', color: '#B45309', marginTop: '4px' }}>
              Gli asset archiviati non sono visibili nel catalogo e non possono essere allocati. Puoi ripristinarli in qualsiasi momento.
            </div>
          </div>
          <button
            onClick={() => setShowArchivedAssets(false)}
            style={{
              padding: '10px 20px',
              background: 'white',
              border: '2px solid #F59E0B',
              borderRadius: '8px',
              fontWeight: 600,
              color: '#92400E',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <FaUndo /> Torna al Catalogo
          </button>
        </div>
      )}

      {/* Stats Row */}
      {stats && !showArchivedAssets && (
        <div className="tp-stats-row" data-tour="stats-row">
          <div className="tp-stat-card-dark">
            <div className="tp-stat-icon" style={{ background: '#FFFFFF' }}>
              <FaCube style={{ color: '#1F2937' }} />
            </div>
            <div className="tp-stat-content">
              <div className="tp-stat-value">{stats.inventory?.total_assets || 0}</div>
              <div className="tp-stat-label">Asset Totali</div>
            </div>
          </div>
          <div className="tp-stat-card-dark">
            <div className="tp-stat-icon" style={{ background: '#FFFFFF' }}>
              <FaCheck style={{ color: '#1F2937' }} />
            </div>
            <div className="tp-stat-content">
              <div className="tp-stat-value">{stats.inventory?.available_assets || 0}</div>
              <div className="tp-stat-label">Disponibili</div>
            </div>
          </div>
          <div className="tp-stat-card-dark">
            <div className="tp-stat-icon" style={{ background: '#FFFFFF' }}>
              <FaEuroSign style={{ color: '#1F2937' }} />
            </div>
            <div className="tp-stat-content">
              <div className="tp-stat-value">{formatCurrency(stats.inventory?.total_value)}</div>
              <div className="tp-stat-label">Valore Catalogo</div>
            </div>
          </div>
          <div className="tp-stat-card-dark">
            <div className="tp-stat-icon" style={{ background: '#FFFFFF' }}>
              <FaChartPie style={{ color: '#1F2937' }} />
            </div>
            <div className="tp-stat-content">
              <div className="tp-stat-value">{stats.inventory?.occupancy_rate || 0}%</div>
              <div className="tp-stat-label">Tasso Occupazione</div>
            </div>
          </div>
        </div>
      )}

      {/* Archived Stats Row */}
      {showArchivedAssets && (
        <div className="tp-stats-row">
          <div className="tp-stat-card-dark" style={{ background: 'linear-gradient(135deg, #F59E0B, #D97706)' }}>
            <div className="tp-stat-icon" style={{ background: 'rgba(255,255,255,0.2)' }}>
              <FaArchive style={{ color: '#FFFFFF' }} />
            </div>
            <div className="tp-stat-content">
              <div className="tp-stat-value" style={{ color: 'white' }}>{assets.length}</div>
              <div className="tp-stat-label" style={{ color: 'rgba(255,255,255,0.8)' }}>Asset Archiviati</div>
            </div>
          </div>
          <div className="tp-stat-card-dark">
            <div className="tp-stat-icon" style={{ background: '#FFFFFF' }}>
              <FaCube style={{ color: '#1F2937' }} />
            </div>
            <div className="tp-stat-content">
              <div className="tp-stat-value">{stats?.inventory?.total_assets || 0}</div>
              <div className="tp-stat-label">Asset Attivi</div>
            </div>
          </div>
          <div className="tp-stat-card-dark">
            <div className="tp-stat-icon" style={{ background: '#FFFFFF' }}>
              <FaUndo style={{ color: '#1F2937' }} />
            </div>
            <div className="tp-stat-content">
              <div className="tp-stat-value">Disponibile</div>
              <div className="tp-stat-label">Ripristino</div>
            </div>
          </div>
        </div>
      )}

      {/* Categories Quick Filter */}
      <div className="tp-card" style={{ marginBottom: '24px' }} data-tour="categories-filter">
        <div className="tp-card-body" style={{ padding: '16px 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontWeight: 600, color: '#374151', flexShrink: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
              <FaTag /> Categorie:
            </span>

            {/* Left Arrow */}
            {showLeftArrow && (
              <button
                onClick={() => scrollCategories('left')}
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  border: '1px solid #E5E7EB',
                  background: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  flexShrink: 0,
                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                }}
              >
                <FaChevronLeft size={12} color="#6B7280" />
              </button>
            )}

            <div
              ref={categoryScrollRef}
              onScroll={checkScrollArrows}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                flex: 1,
                overflowX: 'auto',
                scrollbarWidth: 'none',
                msOverflowStyle: 'none'
              }}
              className="hide-scrollbar"
            >
              <button
                className={`tp-filter-chip ${selectedCategory === 'all' ? 'active' : ''}`}
                onClick={() => setSelectedCategory('all')}
                style={{ flexShrink: 0 }}
              >
                Tutte ({assets.length})
              </button>
              {categories.map(cat => (
                <button
                  key={cat.id}
                  className={`tp-filter-chip ${selectedCategory === cat.codice ? 'active' : ''}`}
                  onClick={() => setSelectedCategory(cat.codice)}
                  style={{
                    '--chip-color': cat.colore,
                    borderColor: selectedCategory === cat.codice ? cat.colore : undefined,
                    background: selectedCategory === cat.codice ? `${cat.colore}15` : undefined,
                    flexShrink: 0
                  }}
                >
                  {getCategoryIcon(cat.codice)}
                  {cat.nome} ({cat.assets_count || 0})
                </button>
              ))}
            </div>

            {/* Right Arrow */}
            {showRightArrow && (
              <button
                onClick={() => scrollCategories('right')}
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  border: '1px solid #E5E7EB',
                  background: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  flexShrink: 0,
                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                }}
              >
                <FaChevronRight size={12} color="#6B7280" />
              </button>
            )}

            <button
              className="tp-btn tp-btn-ghost"
              style={{ flexShrink: 0 }}
              onClick={() => setShowCategoryModal(true)}
            >
              <FaCog /> Gestisci Categorie
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="tp-card" ref={catalogRef}>
        <div className="tp-card-header">
          <div className="tp-card-header-left">
            {/* Search */}
            <div className="tp-search-wrapper" data-tour="search-input">
              <input
                type="text"
                className="tp-search-input"
                placeholder="Cerca asset, codice, posizione..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <span className="tp-search-icon"><FaSearch /></span>
            </div>

            {/* Filter Tipo - Custom Dropdown */}
            <div ref={tipoDropdownRef} style={{ position: 'relative' }} data-tour="filter-tipo">
              <button
                type="button"
                onClick={() => {
                  setTipoDropdownOpen(!tipoDropdownOpen);
                  setDisponibilitaDropdownOpen(false);
                  setPrezzoDropdownOpen(false);
                  setSortDropdownOpen(false);
                }}
                className="custom-filter-btn"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '10px 14px',
                  border: filterTipo !== 'all' ? '2px solid #85FF00' : '2px solid #E5E7EB',
                  borderRadius: '8px',
                  background: filterTipo !== 'all' ? 'rgba(133, 255, 0, 0.08)' : 'white',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  minWidth: '150px'
                }}
              >
                {(() => {
                  const selected = getSelectedOption(tipoOptions, filterTipo);
                  const Icon = selected.icon;
                  return (
                    <>
                      <div style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '6px',
                        background: selected.color,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <Icon size={12} color="white" />
                      </div>
                      <span style={{ flex: 1, textAlign: 'left', fontSize: '14px', fontWeight: 500, color: '#1A1A1A' }}>
                        {selected.label}
                      </span>
                      <FaChevronDown
                        size={12}
                        color="#6B7280"
                        style={{
                          transition: 'transform 0.2s',
                          transform: tipoDropdownOpen ? 'rotate(180deg)' : 'rotate(0)'
                        }}
                      />
                    </>
                  );
                })()}
              </button>

              {tipoDropdownOpen && (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  marginTop: '4px',
                  background: 'white',
                  border: '1px solid #E5E7EB',
                  borderRadius: '12px',
                  boxShadow: '0 10px 40px rgba(0,0,0,0.12)',
                  zIndex: 100,
                  minWidth: '200px',
                  overflow: 'hidden',
                  animation: 'fadeIn 0.15s ease'
                }}>
                  {tipoOptions.map(option => {
                    const OptionIcon = option.icon;
                    const isSelected = filterTipo === option.value;
                    return (
                      <div
                        key={option.value}
                        onClick={() => {
                          setFilterTipo(option.value);
                          setTipoDropdownOpen(false);
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                          padding: '12px 16px',
                          cursor: 'pointer',
                          transition: 'background 0.15s',
                          background: isSelected ? 'rgba(133, 255, 0, 0.1)' : 'transparent',
                          borderLeft: isSelected ? '3px solid #85FF00' : '3px solid transparent'
                        }}
                        onMouseEnter={(e) => {
                          if (!isSelected) e.currentTarget.style.background = '#F9FAFB';
                        }}
                        onMouseLeave={(e) => {
                          if (!isSelected) e.currentTarget.style.background = 'transparent';
                        }}
                      >
                        <div style={{
                          width: '28px',
                          height: '28px',
                          borderRadius: '6px',
                          background: option.color,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          <OptionIcon size={14} color="white" />
                        </div>
                        <span style={{ flex: 1, fontSize: '14px', fontWeight: 500, color: '#1A1A1A' }}>
                          {option.label}
                        </span>
                        {isSelected && <FaCheck size={12} color="#85FF00" />}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Filter Disponibilità - Custom Dropdown */}
            <div ref={disponibilitaDropdownRef} style={{ position: 'relative' }} data-tour="filter-disponibilita">
              <button
                type="button"
                onClick={() => {
                  setDisponibilitaDropdownOpen(!disponibilitaDropdownOpen);
                  setTipoDropdownOpen(false);
                  setPrezzoDropdownOpen(false);
                  setSortDropdownOpen(false);
                }}
                className="custom-filter-btn"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '10px 14px',
                  border: filterDisponibile !== 'all' ? '2px solid #85FF00' : '2px solid #E5E7EB',
                  borderRadius: '8px',
                  background: filterDisponibile !== 'all' ? 'rgba(133, 255, 0, 0.08)' : 'white',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  minWidth: '160px'
                }}
              >
                {(() => {
                  const selected = getSelectedOption(disponibilitaOptions, filterDisponibile);
                  const Icon = selected.icon;
                  return (
                    <>
                      <div style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '6px',
                        background: selected.color,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <Icon size={12} color="white" />
                      </div>
                      <span style={{ flex: 1, textAlign: 'left', fontSize: '14px', fontWeight: 500, color: '#1A1A1A' }}>
                        {selected.label}
                      </span>
                      <FaChevronDown
                        size={12}
                        color="#6B7280"
                        style={{
                          transition: 'transform 0.2s',
                          transform: disponibilitaDropdownOpen ? 'rotate(180deg)' : 'rotate(0)'
                        }}
                      />
                    </>
                  );
                })()}
              </button>

              {disponibilitaDropdownOpen && (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  marginTop: '4px',
                  background: 'white',
                  border: '1px solid #E5E7EB',
                  borderRadius: '12px',
                  boxShadow: '0 10px 40px rgba(0,0,0,0.12)',
                  zIndex: 100,
                  minWidth: '200px',
                  overflow: 'hidden',
                  animation: 'fadeIn 0.15s ease'
                }}>
                  {disponibilitaOptions.map(option => {
                    const OptionIcon = option.icon;
                    const isSelected = filterDisponibile === option.value;
                    return (
                      <div
                        key={option.value}
                        onClick={() => {
                          setFilterDisponibile(option.value);
                          setDisponibilitaDropdownOpen(false);
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                          padding: '12px 16px',
                          cursor: 'pointer',
                          transition: 'background 0.15s',
                          background: isSelected ? 'rgba(133, 255, 0, 0.1)' : 'transparent',
                          borderLeft: isSelected ? '3px solid #85FF00' : '3px solid transparent'
                        }}
                        onMouseEnter={(e) => {
                          if (!isSelected) e.currentTarget.style.background = '#F9FAFB';
                        }}
                        onMouseLeave={(e) => {
                          if (!isSelected) e.currentTarget.style.background = 'transparent';
                        }}
                      >
                        <div style={{
                          width: '28px',
                          height: '28px',
                          borderRadius: '6px',
                          background: option.color,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          <OptionIcon size={14} color="white" />
                        </div>
                        <span style={{ flex: 1, fontSize: '14px', fontWeight: 500, color: '#1A1A1A' }}>
                          {option.label}
                        </span>
                        {isSelected && <FaCheck size={12} color="#85FF00" />}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Filter Prezzo - Custom Dropdown */}
            <div ref={prezzoDropdownRef} style={{ position: 'relative' }} data-tour="filter-prezzo">
              <button
                type="button"
                onClick={() => {
                  setPrezzoDropdownOpen(!prezzoDropdownOpen);
                  setTipoDropdownOpen(false);
                  setDisponibilitaDropdownOpen(false);
                  setSortDropdownOpen(false);
                }}
                className="custom-filter-btn"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '10px 14px',
                  border: filterPrezzo !== 'all' ? '2px solid #85FF00' : '2px solid #E5E7EB',
                  borderRadius: '8px',
                  background: filterPrezzo !== 'all' ? 'rgba(133, 255, 0, 0.08)' : 'white',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  minWidth: '170px'
                }}
              >
                {(() => {
                  const selected = getSelectedOption(prezzoOptions, filterPrezzo);
                  const Icon = selected.icon;
                  return (
                    <>
                      <div style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '6px',
                        background: selected.color,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <Icon size={12} color="white" />
                      </div>
                      <span style={{ flex: 1, textAlign: 'left', fontSize: '14px', fontWeight: 500, color: '#1A1A1A' }}>
                        {selected.label}
                      </span>
                      <FaChevronDown
                        size={12}
                        color="#6B7280"
                        style={{
                          transition: 'transform 0.2s',
                          transform: prezzoDropdownOpen ? 'rotate(180deg)' : 'rotate(0)'
                        }}
                      />
                    </>
                  );
                })()}
              </button>

              {prezzoDropdownOpen && (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  marginTop: '4px',
                  background: 'white',
                  border: '1px solid #E5E7EB',
                  borderRadius: '12px',
                  boxShadow: '0 10px 40px rgba(0,0,0,0.12)',
                  zIndex: 100,
                  minWidth: '220px',
                  overflow: 'hidden',
                  animation: 'fadeIn 0.15s ease'
                }}>
                  {prezzoOptions.map(option => {
                    const OptionIcon = option.icon;
                    const isSelected = filterPrezzo === option.value;
                    return (
                      <div
                        key={option.value}
                        onClick={() => {
                          setFilterPrezzo(option.value);
                          setPrezzoDropdownOpen(false);
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                          padding: '12px 16px',
                          cursor: 'pointer',
                          transition: 'background 0.15s',
                          background: isSelected ? 'rgba(133, 255, 0, 0.1)' : 'transparent',
                          borderLeft: isSelected ? '3px solid #85FF00' : '3px solid transparent'
                        }}
                        onMouseEnter={(e) => {
                          if (!isSelected) e.currentTarget.style.background = '#F9FAFB';
                        }}
                        onMouseLeave={(e) => {
                          if (!isSelected) e.currentTarget.style.background = 'transparent';
                        }}
                      >
                        <div style={{
                          width: '28px',
                          height: '28px',
                          borderRadius: '6px',
                          background: option.color,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          <OptionIcon size={14} color="white" />
                        </div>
                        <span style={{ flex: 1, fontSize: '14px', fontWeight: 500, color: '#1A1A1A' }}>
                          {option.label}
                        </span>
                        {isSelected && <FaCheck size={12} color="#85FF00" />}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="tp-card-header-right">
            {/* Sort - Custom Dropdown */}
            <div ref={sortDropdownRef} style={{ position: 'relative' }} data-tour="sort-dropdown">
              <button
                type="button"
                onClick={() => {
                  setSortDropdownOpen(!sortDropdownOpen);
                  setTipoDropdownOpen(false);
                  setDisponibilitaDropdownOpen(false);
                  setPrezzoDropdownOpen(false);
                }}
                className="custom-filter-btn"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '10px 14px',
                  border: '2px solid #E5E7EB',
                  borderRadius: '8px',
                  background: 'white',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  minWidth: '180px'
                }}
              >
                {(() => {
                  const selected = getSelectedOption(sortOptions, sortBy);
                  const Icon = selected.icon;
                  return (
                    <>
                      <div style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '6px',
                        background: selected.color,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <Icon size={12} color="white" />
                      </div>
                      <span style={{ flex: 1, textAlign: 'left', fontSize: '14px', fontWeight: 500, color: '#1A1A1A' }}>
                        {selected.label}
                      </span>
                      <FaChevronDown
                        size={12}
                        color="#6B7280"
                        style={{
                          transition: 'transform 0.2s',
                          transform: sortDropdownOpen ? 'rotate(180deg)' : 'rotate(0)'
                        }}
                      />
                    </>
                  );
                })()}
              </button>

              {sortDropdownOpen && (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  right: 0,
                  marginTop: '4px',
                  background: 'white',
                  border: '1px solid #E5E7EB',
                  borderRadius: '12px',
                  boxShadow: '0 10px 40px rgba(0,0,0,0.12)',
                  zIndex: 100,
                  minWidth: '200px',
                  overflow: 'hidden',
                  animation: 'fadeIn 0.15s ease'
                }}>
                  {sortOptions.map(option => {
                    const OptionIcon = option.icon;
                    const isSelected = sortBy === option.value;
                    return (
                      <div
                        key={option.value}
                        onClick={() => {
                          setSortBy(option.value);
                          setSortDropdownOpen(false);
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                          padding: '12px 16px',
                          cursor: 'pointer',
                          transition: 'background 0.15s',
                          background: isSelected ? 'rgba(133, 255, 0, 0.1)' : 'transparent',
                          borderLeft: isSelected ? '3px solid #85FF00' : '3px solid transparent'
                        }}
                        onMouseEnter={(e) => {
                          if (!isSelected) e.currentTarget.style.background = '#F9FAFB';
                        }}
                        onMouseLeave={(e) => {
                          if (!isSelected) e.currentTarget.style.background = 'transparent';
                        }}
                      >
                        <div style={{
                          width: '28px',
                          height: '28px',
                          borderRadius: '6px',
                          background: option.color,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          <OptionIcon size={14} color="white" />
                        </div>
                        <span style={{ flex: 1, fontSize: '14px', fontWeight: 500, color: '#1A1A1A' }}>
                          {option.label}
                        </span>
                        {isSelected && <FaCheck size={12} color="#85FF00" />}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* View Toggle */}
            <div className="tp-view-toggle" data-tour="view-toggle">
              <button
                className={`tp-view-toggle-btn ${viewMode === 'list' ? 'active' : ''}`}
                onClick={() => setViewMode('list')}
                title="Lista"
              >
                <FaList />
              </button>
              <button
                className={`tp-view-toggle-btn ${viewMode === 'grid' ? 'active' : ''}`}
                onClick={() => setViewMode('grid')}
                title="Griglia"
              >
                <FaTh />
              </button>
            </div>
          </div>
        </div>

        <div className="tp-card-body">
          {/* Active Filters Badge */}
          {activeFiltersCount > 0 && (
            <div className="tp-active-filters">
              <span className="tp-active-filters-text">
                <FaFilter style={{ marginRight: '6px' }} />
                {totalItems} asset trovati
                {activeFiltersCount > 0 && ` (${activeFiltersCount} filtri attivi)`}
              </span>
              <button
                className="tp-clear-filters-btn"
                onClick={clearAllFilters}
              >
                Rimuovi tutti i filtri
              </button>
            </div>
          )}

          {totalItems === 0 ? (
            <div className="tp-empty-state">
              {showArchivedAssets ? (
                <>
                  <div className="tp-empty-icon" style={{ background: 'linear-gradient(135deg, #FEF3C7, #FDE68A)' }}>
                    <FaArchive style={{ color: '#D97706' }} />
                  </div>
                  <h3 className="tp-empty-title">Nessun asset archiviato</h3>
                  <p className="tp-empty-description">
                    Non hai ancora archiviato nessun asset. Gli asset archiviati appariranno qui.
                  </p>
                  <button
                    className="tp-btn tp-btn-primary"
                    onClick={() => setShowArchivedAssets(false)}
                  >
                    <FaUndo /> Torna al Catalogo
                  </button>
                </>
              ) : (
                <>
                  <div className="tp-empty-icon"><FaBoxOpen /></div>
                  <h3 className="tp-empty-title">Nessun asset trovato</h3>
                  <p className="tp-empty-description">
                    {activeFiltersCount > 0
                      ? 'Prova a modificare i filtri o i termini di ricerca'
                      : 'Inizia creando il tuo primo asset nel catalogo'}
                  </p>
                  {activeFiltersCount > 0 ? (
                    <button
                      className="tp-btn tp-btn-outline"
                      onClick={clearAllFilters}
                    >
                      Rimuovi filtri
                    </button>
                  ) : (
                    <button
                      className="tp-btn tp-btn-primary"
                      onClick={() => navigate('/club/inventory/assets/new')}
                    >
                      <FaPlus /> Crea Asset
                    </button>
                  )}
                </>
              )}
            </div>
          ) : viewMode === 'grid' ? (
            /* GRID VIEW */
            <div className="tp-grid" data-tour="asset-list">
              {paginatedAssets.map(asset => (
                <div key={asset.id} className="tp-sponsor-card">
                  {/* Header */}
                  <div className="tp-sponsor-header">
                    <div className="tp-sponsor-logo">
                      {asset.immagine_principale ? (
                        <img
                          src={getImageUrl(asset.immagine_principale)}
                          alt={asset.nome}
                        />
                      ) : (
                        <img
                          src={DefaultAsset}
                          alt="Default"
                          style={{ opacity: 0.6, padding: '8px' }}
                        />
                      )}
                    </div>
                    {showArchivedAssets ? (
                      <span className="tp-badge" style={{ background: '#FEF3C7', color: '#D97706', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <FaArchive size={10} /> Archiviato
                      </span>
                    ) : (
                      <span className={`tp-badge ${asset.disponibile ? 'tp-badge-success' : 'tp-badge-danger'}`}>
                        {asset.disponibile ? 'Disponibile' : 'Non disponibile'}
                      </span>
                    )}
                  </div>

                  {/* Content */}
                  <div className="tp-sponsor-content">
                    <div className="tp-sponsor-sector" style={{ color: asset.category?.colore, display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {getCategoryIcon(asset.category?.codice)}
                      {asset.category?.nome || 'Asset'}
                    </div>
                    <h3 className="tp-sponsor-name">{asset.nome}</h3>
                    <div className="tp-sponsor-tags">
                      <span className="tp-sponsor-tag">{asset.codice}</span>
                      <span className="tp-sponsor-tag">{formatCurrency(asset.prezzo_listino)}</span>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="tp-sponsor-footer">
                    <div className="tp-sponsor-contact">
                      <span className="tp-sponsor-contact-item">
                        {asset.posizione || 'Nessuna posizione'}
                      </span>
                      <span className="tp-sponsor-contact-item">
                        {asset.tipo === 'fisico' ? 'Fisico' :
                         asset.tipo === 'digitale' ? 'Digitale' :
                         asset.tipo === 'esperienza' ? 'Esperienza' :
                         asset.tipo === 'diritto' ? 'Diritto' : asset.tipo || 'N/D'}
                      </span>
                    </div>
                    <div className="tp-sponsor-actions" data-tour="asset-actions">
                      {showArchivedAssets ? (
                        /* Archived asset actions */
                        <>
                          <button
                            className="tp-btn-icon tp-btn-icon-restore"
                            onClick={(e) => handleRestoreAsset(asset, e)}
                            title="Ripristina"
                          >
                            <FaUndo />
                          </button>
                          <button
                            className="tp-btn-icon tp-btn-icon-delete"
                            onClick={(e) => handleDeleteAsset(asset, e)}
                            title="Elimina definitivamente"
                          >
                            <FaTrash />
                          </button>
                        </>
                      ) : (
                        /* Normal asset actions */
                        <>
                          <button
                            className="tp-btn-icon tp-btn-icon-view"
                            onClick={() => navigate(`/club/inventory/assets/${asset.id}`)}
                            title="Visualizza"
                          >
                            <FaEye />
                          </button>
                          <button
                            className="tp-btn-icon tp-btn-icon-edit"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/club/inventory/assets/${asset.id}/edit`);
                            }}
                            title="Modifica"
                          >
                            <FaEdit />
                          </button>
                          <button
                            className="tp-btn-icon tp-btn-icon-archive"
                            onClick={(e) => handleArchiveAsset(asset, e)}
                            title="Archivia"
                          >
                            <FaArchive />
                          </button>
                          <button
                            className="tp-btn-icon tp-btn-icon-delete"
                            onClick={(e) => handleDeleteAsset(asset, e)}
                            title="Elimina"
                          >
                            <FaTrash />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* LIST VIEW (Table) */
            <div className="tp-table-container" data-tour="asset-list">
              <table className="tp-table">
                <thead>
                  <tr>
                    <th>Asset</th>
                    <th>Categoria</th>
                    <th>Tipo</th>
                    <th>Posizione</th>
                    <th>Prezzo</th>
                    <th>Stato</th>
                    <th>Azioni</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedAssets.map(asset => (
                    <tr key={asset.id}>
                      <td>
                        <div className="tp-table-user">
                          <div className="tp-table-avatar">
                            {asset.immagine_principale ? (
                              <img
                                src={getImageUrl(asset.immagine_principale)}
                                alt={asset.nome}
                              />
                            ) : (
                              <img
                                src={DefaultAsset}
                                alt="Default"
                                style={{ opacity: 0.6, padding: '6px' }}
                              />
                            )}
                          </div>
                          <div className="tp-table-user-info">
                            <span className="tp-table-name">{asset.nome}</span>
                            <span className="tp-table-sector">{asset.codice}</span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span
                          className="tp-badge"
                          style={{
                            background: `${asset.category?.colore}20`,
                            color: asset.category?.colore,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px'
                          }}
                        >
                          {getCategoryIcon(asset.category?.codice)}
                          {asset.category?.nome}
                        </span>
                      </td>
                      <td>
                        <span className="tp-badge tp-badge-neutral">
                          {asset.tipo === 'fisico' ? 'Fisico' :
                           asset.tipo === 'digitale' ? 'Digitale' :
                           asset.tipo === 'esperienza' ? 'Esperienza' :
                           asset.tipo === 'diritto' ? 'Diritto' : asset.tipo}
                        </span>
                      </td>
                      <td>
                        <div className="tp-table-user-info">
                          <span style={{ fontSize: '14px', color: '#1f2937' }}>{asset.posizione || '-'}</span>
                          <span style={{ fontSize: '13px', color: '#6b7280' }}>{asset.dimensioni || ''}</span>
                        </div>
                      </td>
                      <td>
                        <span className="tp-table-value">{formatCurrency(asset.prezzo_listino)}</span>
                      </td>
                      <td>
                        {showArchivedAssets ? (
                          <span className="tp-badge" style={{ background: '#FEF3C7', color: '#D97706', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <FaArchive size={10} /> Archiviato
                          </span>
                        ) : (
                          <span className={`tp-badge ${asset.disponibile ? 'tp-badge-success' : 'tp-badge-danger'}`}>
                            {asset.disponibile ? 'Disponibile' : 'Non disponibile'}
                          </span>
                        )}
                      </td>
                      <td>
                        <div className="tp-table-actions" data-tour="asset-actions">
                          {showArchivedAssets ? (
                            /* Archived asset actions */
                            <>
                              <button
                                className="tp-btn-icon tp-btn-icon-restore"
                                onClick={(e) => handleRestoreAsset(asset, e)}
                                title="Ripristina"
                              >
                                <FaUndo />
                              </button>
                              <button
                                className="tp-btn-icon tp-btn-icon-delete"
                                onClick={(e) => handleDeleteAsset(asset, e)}
                                title="Elimina definitivamente"
                              >
                                <FaTrash />
                              </button>
                            </>
                          ) : (
                            /* Normal asset actions */
                            <>
                              <button
                                className="tp-btn-icon tp-btn-icon-view"
                                onClick={() => navigate(`/club/inventory/assets/${asset.id}`)}
                                title="Visualizza"
                              >
                                <FaEye />
                              </button>
                              <button
                                className="tp-btn-icon tp-btn-icon-edit"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate(`/club/inventory/assets/${asset.id}/edit`);
                                }}
                                title="Modifica"
                              >
                                <FaEdit />
                              </button>
                              <button
                                className="tp-btn-icon tp-btn-icon-archive"
                                onClick={(e) => handleArchiveAsset(asset, e)}
                                title="Archivia"
                              >
                                <FaArchive />
                              </button>
                              <button
                                className="tp-btn-icon tp-btn-icon-delete"
                                onClick={(e) => handleDeleteAsset(asset, e)}
                                title="Elimina"
                              >
                                <FaTrash />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {totalItems > itemsPerPage && (
            <div className="tp-pagination">
              <div className="tp-pagination-info">
                Mostrando {startIndex + 1}-{Math.min(startIndex + itemsPerPage, totalItems)} di {totalItems} asset
              </div>
              <ul className="tp-pagination-list">
                <li
                  className={`tp-pagination-item ${currentPage === 1 ? 'disabled' : ''}`}
                  onClick={() => currentPage > 1 && handlePageChange(currentPage - 1)}
                >
                  ‹
                </li>
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(page => {
                    if (totalPages <= 7) return true;
                    if (page === 1 || page === totalPages) return true;
                    if (Math.abs(page - currentPage) <= 1) return true;
                    return false;
                  })
                  .map((page, idx, arr) => (
                    <span key={page}>
                      {idx > 0 && arr[idx - 1] !== page - 1 && (
                        <li className="tp-pagination-item" style={{ background: 'transparent', cursor: 'default' }}>...</li>
                      )}
                      <li
                        className={`tp-pagination-item ${currentPage === page ? 'active' : ''}`}
                        onClick={() => handlePageChange(page)}
                      >
                        {page}
                      </li>
                    </span>
                  ))
                }
                <li
                  className={`tp-pagination-item ${currentPage === totalPages ? 'disabled' : ''}`}
                  onClick={() => currentPage < totalPages && handlePageChange(currentPage + 1)}
                >
                  ›
                </li>
              </ul>
            </div>
          )}
        </div>
      </div>


      {/* Category Management Modal */}
      <Modal
        isOpen={showCategoryModal}
        onClose={() => { setShowCategoryModal(false); cancelCategoryEdit(); }}
        title={editingCategory ? `Modifica Categoria: ${editingCategory.nome}` : 'Gestione Categorie'}
        maxWidth="700px"
      >
        <div style={{ padding: '8px 0' }}>
          {/* Category Form Section */}
          <div style={{
            background: '#F9FAFB',
            padding: '20px',
            borderRadius: '12px',
            marginBottom: '24px'
          }}>
            <h4 style={{ margin: '0 0 16px 0', fontSize: '14px', fontWeight: 600, color: '#374151' }}>
              {editingCategory ? 'Modifica Categoria' : 'Nuova Categoria'}
            </h4>

            {/* Nome Categoria */}
            <div className="form-group" style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, fontSize: '14px' }}>
                Nome Categoria <span style={{ color: '#EF4444' }}>*</span>
              </label>
              <input
                type="text"
                value={categoryForm.nome}
                onChange={(e) => handleCategoryFormChange('nome', e.target.value)}
                placeholder="Es: LED Boards, Jersey, Hospitality"
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  border: '2px solid #E5E7EB',
                  borderRadius: '8px',
                  fontSize: '14px',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            {/* Colore */}
            <div className="form-group" style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '12px', fontWeight: 600, fontSize: '14px' }}>
                Colore
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {availableColors.map(color => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => handleCategoryFormChange('colore', color)}
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '8px',
                      border: categoryForm.colore === color ? '3px solid #1A1A1A' : '2px solid #E5E7EB',
                      background: color,
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    {categoryForm.colore === color && (
                      <FaCheck size={14} color="white" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Icona */}
            <div className="form-group" style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', marginBottom: '12px', fontWeight: 600, fontSize: '14px' }}>
                Icona
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {availableIcons.map(iconOpt => {
                  const IconComp = iconOpt.icon;
                  const isSelected = categoryForm.icona === iconOpt.value;
                  return (
                    <button
                      key={iconOpt.value}
                      type="button"
                      onClick={() => handleCategoryFormChange('icona', iconOpt.value)}
                      title={iconOpt.label}
                      style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: '10px',
                        border: isSelected ? '2px solid #85FF00' : '2px solid #E5E7EB',
                        background: isSelected ? 'rgba(133, 255, 0, 0.1)' : 'white',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: isSelected ? '#1A1A1A' : '#6B7280'
                      }}
                    >
                      <IconComp size={20} />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Preview */}
            {categoryForm.nome && (
              <div style={{
                padding: '16px',
                background: 'white',
                borderRadius: '12px',
                marginBottom: '20px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}>
                <div style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '10px',
                  background: categoryForm.colore,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  {(() => {
                    const selectedIcon = availableIcons.find(i => i.value === categoryForm.icona);
                    const PreviewIcon = selectedIcon?.icon || FaCube;
                    return <PreviewIcon size={22} color="white" />;
                  })()}
                </div>
                <div style={{ fontWeight: 600, fontSize: '15px', color: '#1A1A1A' }}>
                  {categoryForm.nome}
                </div>
                <span style={{ marginLeft: 'auto', fontSize: '12px', color: '#9CA3AF', fontStyle: 'italic' }}>
                  Anteprima
                </span>
              </div>
            )}

            {/* Form Actions */}
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              {editingCategory && (
                <button
                  type="button"
                  onClick={cancelCategoryEdit}
                  style={{
                    padding: '10px 20px',
                    border: '2px solid #E5E7EB',
                    borderRadius: '8px',
                    background: 'white',
                    fontWeight: 600,
                    fontSize: '14px',
                    cursor: 'pointer',
                    color: '#374151'
                  }}
                >
                  Annulla Modifica
                </button>
              )}
              <button
                type="button"
                onClick={handleSaveCategory}
                disabled={savingCategory || !categoryForm.nome}
                style={{
                  padding: '10px 20px',
                  border: 'none',
                  borderRadius: '8px',
                  background: !categoryForm.nome ? '#E5E7EB' : '#1A1A1A',
                  color: !categoryForm.nome ? '#9CA3AF' : 'white',
                  fontWeight: 600,
                  fontSize: '14px',
                  cursor: !categoryForm.nome ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                {savingCategory ? 'Salvataggio...' : (
                  <>
                    <FaSave /> {editingCategory ? 'Aggiorna Categoria' : 'Crea Categoria'}
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Categories List */}
          <h4 style={{ margin: '0 0 16px 0', fontSize: '14px', fontWeight: 600, color: '#374151' }}>
            Categorie Esistenti ({categories.length})
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {categories.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '32px', color: '#9CA3AF' }}>
                <FaTag size={32} style={{ marginBottom: '12px', opacity: 0.5 }} />
                <p>Nessuna categoria. Creane una nuova!</p>
              </div>
            ) : (
              categories.map(cat => (
                <div
                  key={cat.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '12px 16px',
                    background: editingCategory?.id === cat.id ? 'rgba(133, 255, 0, 0.1)' : '#F9FAFB',
                    border: editingCategory?.id === cat.id ? '2px solid #85FF00' : '2px solid transparent',
                    borderRadius: '12px',
                    transition: 'all 0.2s'
                  }}
                >
                  <div style={{
                    width: '44px',
                    height: '44px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '10px',
                    background: cat.colore,
                    color: 'white',
                    flexShrink: 0
                  }}>
                    {getCategoryIcon(cat.icona)}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, color: '#1A1A1A', fontSize: '15px' }}>{cat.nome}</div>
                    <div style={{ fontSize: '13px', color: '#6B7280', marginTop: '2px' }}>
                      {cat.assets_count || 0} asset
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      type="button"
                      title="Modifica"
                      onClick={() => openEditCategory(cat)}
                      style={{
                        width: '36px',
                        height: '36px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: '1px solid #E5E7EB',
                        borderRadius: '8px',
                        background: 'white',
                        cursor: 'pointer',
                        color: '#6B7280',
                        transition: 'all 0.2s'
                      }}
                    >
                      <FaEdit />
                    </button>
                    <button
                      type="button"
                      title="Elimina"
                      onClick={() => handleDeleteCategory(cat.id)}
                      style={{
                        width: '36px',
                        height: '36px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: '1px solid #E5E7EB',
                        borderRadius: '8px',
                        background: 'white',
                        cursor: 'pointer',
                        color: '#EF4444',
                        transition: 'all 0.2s'
                      }}
                    >
                      <FaTrash />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </Modal>

      {/* Category Creation/Update Confirmation Modal */}
      <Modal
        isOpen={showCategoryConfirmModal}
        onClose={() => setShowCategoryConfirmModal(false)}
        title={editingCategory ? 'Conferma Modifica Categoria' : 'Conferma Creazione Categoria'}
        maxWidth="500px"
      >
        <div style={{ padding: '20px 0' }}>
          {/* Category Preview */}
          <div style={{
            padding: '20px',
            background: '#F9FAFB',
            borderRadius: '12px',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '16px'
          }}>
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '12px',
              background: categoryForm.colore,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              {(() => {
                const selectedIcon = availableIcons.find(i => i.value === categoryForm.icona);
                const PreviewIcon = selectedIcon?.icon || FaCube;
                return <PreviewIcon size={28} color="white" />;
              })()}
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '18px', color: '#1A1A1A' }}>
                {categoryForm.nome}
              </div>
              <div style={{ fontSize: '14px', color: '#6B7280', marginTop: '4px' }}>
                {editingCategory ? 'Categoria modificata' : 'Nuova categoria asset'}
              </div>
            </div>
          </div>

          <p style={{ fontSize: '15px', lineHeight: '1.6', marginBottom: '24px', color: '#6B7280' }}>
            {editingCategory
              ? <>Sei sicuro di voler aggiornare la categoria "<strong>{categoryForm.nome}</strong>"?</>
              : <>Sei sicuro di voler creare la categoria "<strong>{categoryForm.nome}</strong>"?</>
            }
          </p>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={() => setShowCategoryConfirmModal(false)}
              style={{
                padding: '10px 20px',
                border: '2px solid #E5E7EB',
                borderRadius: '8px',
                background: 'white',
                fontWeight: 600,
                fontSize: '14px',
                cursor: 'pointer',
                color: '#374151'
              }}
            >
              Annulla
            </button>
            <button
              type="button"
              onClick={confirmSaveCategory}
              disabled={savingCategory}
              style={{
                padding: '10px 20px',
                border: 'none',
                borderRadius: '8px',
                background: '#1A1A1A',
                color: 'white',
                fontWeight: 600,
                fontSize: '14px',
                cursor: savingCategory ? 'not-allowed' : 'pointer',
                opacity: savingCategory ? 0.7 : 1
              }}
            >
              {savingCategory ? 'Salvataggio...' : (editingCategory ? 'Conferma Modifica' : 'Conferma Creazione')}
            </button>
          </div>
        </div>
      </Modal>

      {/* Category Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteConfirmModal}
        onClose={() => { setShowDeleteConfirmModal(false); setCategoryToDelete(null); }}
        title="Conferma Eliminazione"
        maxWidth="500px"
      >
        <div style={{ padding: '20px 0' }}>
          {categoryToDelete && (
            <>
              {/* Category Preview */}
              <div style={{
                padding: '20px',
                background: '#FEF2F2',
                borderRadius: '12px',
                marginBottom: '20px',
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                border: '1px solid #FECACA'
              }}>
                <div style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '12px',
                  background: categoryToDelete.colore,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  {getCategoryIcon(categoryToDelete.icona)}
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '18px', color: '#1A1A1A' }}>
                    {categoryToDelete.nome}
                  </div>
                  <div style={{ fontSize: '14px', color: '#6B7280', marginTop: '4px' }}>
                    {categoryToDelete.assets_count || 0} asset
                  </div>
                </div>
              </div>

              {categoryToDelete.assets_count > 0 ? (
                <>
                  <div style={{
                    padding: '16px',
                    background: '#FEF3C7',
                    borderRadius: '8px',
                    marginBottom: '20px',
                    border: '1px solid #FCD34D'
                  }}>
                    <p style={{ margin: 0, fontSize: '14px', color: '#92400E', fontWeight: 500 }}>
                      ⚠️ Attenzione: questa categoria contiene <strong>{categoryToDelete.assets_count} asset</strong>.
                    </p>
                    <p style={{ margin: '8px 0 0 0', fontSize: '14px', color: '#92400E' }}>
                      Eliminando la categoria, gli asset verranno spostati nella categoria predefinita.
                    </p>
                  </div>
                  <p style={{ fontSize: '15px', lineHeight: '1.6', marginBottom: '24px', color: '#6B7280' }}>
                    Sei sicuro di voler eliminare la categoria "<strong>{categoryToDelete.nome}</strong>"?
                  </p>
                </>
              ) : (
                <p style={{ fontSize: '15px', lineHeight: '1.6', marginBottom: '24px', color: '#6B7280' }}>
                  Sei sicuro di voler eliminare la categoria "<strong>{categoryToDelete.nome}</strong>"? Questa azione non può essere annullata.
                </p>
              )}

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => { setShowDeleteConfirmModal(false); setCategoryToDelete(null); }}
                  style={{
                    padding: '10px 20px',
                    border: '2px solid #E5E7EB',
                    borderRadius: '8px',
                    background: 'white',
                    fontWeight: 600,
                    fontSize: '14px',
                    cursor: 'pointer',
                    color: '#374151'
                  }}
                >
                  Annulla
                </button>
                <button
                  type="button"
                  onClick={confirmDeleteCategory}
                  style={{
                    padding: '10px 20px',
                    border: 'none',
                    borderRadius: '8px',
                    background: '#EF4444',
                    color: 'white',
                    fontWeight: 600,
                    fontSize: '14px',
                    cursor: 'pointer'
                  }}
                >
                  Elimina Categoria
                </button>
              </div>
            </>
          )}
        </div>
      </Modal>

      {/* Asset Delete Confirmation Modal - Clearly Dangerous */}
      <Modal
        isOpen={showAssetDeleteModal}
        onClose={() => { setShowAssetDeleteModal(false); setAssetToDelete(null); }}
        title=""
        maxWidth="540px"
      >
        <div style={{ padding: '20px 0' }}>
          {assetToDelete && (
            <>
              {/* Danger Header */}
              <div style={{
                textAlign: 'center',
                marginBottom: '24px'
              }}>
                <div style={{
                  width: '72px',
                  height: '72px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #FEE2E2, #FECACA)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 16px'
                }}>
                  <FaExclamationTriangle size={32} color="#DC2626" />
                </div>
                <h3 style={{ margin: 0, fontSize: '20px', fontWeight: 700, color: '#DC2626' }}>
                  Eliminazione Permanente
                </h3>
                <p style={{ margin: '8px 0 0', fontSize: '14px', color: '#6B7280' }}>
                  Questa azione è irreversibile
                </p>
              </div>

              {/* Asset Preview */}
              <div style={{
                padding: '20px',
                background: '#FEF2F2',
                borderRadius: '12px',
                marginBottom: '20px',
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                border: '2px solid #FECACA'
              }}>
                <div style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '12px',
                  background: assetToDelete.category?.colore || '#6B7280',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                  color: 'white',
                  fontSize: '24px'
                }}>
                  {assetToDelete.immagine_principale ? (
                    <img
                      src={getImageUrl(assetToDelete.immagine_principale)}
                      alt={assetToDelete.nome}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    getCategoryIcon(assetToDelete.category?.codice)
                  )}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: '18px', color: '#1A1A1A' }}>
                    {assetToDelete.nome}
                  </div>
                  <div style={{ fontSize: '14px', color: '#6B7280', marginTop: '4px' }}>
                    {assetToDelete.codice} • {assetToDelete.category?.nome || 'Asset'}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 700, fontSize: '16px', color: '#1A1A1A' }}>
                    {formatCurrency(assetToDelete.prezzo_listino)}
                  </div>
                  <div style={{ fontSize: '12px', color: '#6B7280' }}>Listino</div>
                </div>
              </div>

              {/* What will be deleted */}
              <div style={{
                padding: '16px',
                background: '#FEF2F2',
                borderRadius: '8px',
                marginBottom: '16px',
                border: '1px solid #FECACA'
              }}>
                <p style={{ margin: 0, fontSize: '14px', color: '#DC2626', fontWeight: 600 }}>
                  Verranno eliminati permanentemente:
                </p>
                <ul style={{ margin: '12px 0 0', paddingLeft: '20px', fontSize: '14px', color: '#7F1D1D' }}>
                  <li>Tutti i dati dell'asset</li>
                  <li>Lo storico delle allocazioni</li>
                  <li>I pricing tiers configurati</li>
                  <li>Le immagini e i documenti associati</li>
                </ul>
              </div>

              {/* Alternative: Archive */}
              {!showArchivedAssets && (
                <div style={{
                  padding: '16px',
                  background: 'linear-gradient(135deg, #FEF3C7, #FDE68A)',
                  borderRadius: '8px',
                  marginBottom: '20px',
                  border: '1px solid #F59E0B',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px'
                }}>
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '10px',
                    background: '#F59E0B',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <FaArchive size={18} color="white" />
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ margin: 0, fontSize: '14px', color: '#92400E', fontWeight: 600 }}>
                      Preferisci archiviare?
                    </p>
                    <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#B45309' }}>
                      L'archiviazione mantiene tutti i dati per consultazioni future.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAssetDeleteModal(false);
                      setAssetToArchive(assetToDelete);
                      setAssetToDelete(null);
                      setArchiveReason('');
                      setShowAssetArchiveModal(true);
                    }}
                    style={{
                      padding: '8px 16px',
                      border: '2px solid #F59E0B',
                      borderRadius: '8px',
                      background: 'white',
                      fontWeight: 600,
                      fontSize: '13px',
                      cursor: 'pointer',
                      color: '#92400E',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    Archivia invece
                  </button>
                </div>
              )}

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => { setShowAssetDeleteModal(false); setAssetToDelete(null); }}
                  style={{
                    padding: '12px 24px',
                    border: '2px solid #E5E7EB',
                    borderRadius: '8px',
                    background: 'white',
                    fontWeight: 600,
                    fontSize: '14px',
                    cursor: 'pointer',
                    color: '#374151'
                  }}
                >
                  Annulla
                </button>
                <button
                  type="button"
                  onClick={confirmDeleteAsset}
                  disabled={deletingAsset}
                  style={{
                    padding: '12px 24px',
                    border: 'none',
                    borderRadius: '8px',
                    background: 'linear-gradient(135deg, #DC2626, #B91C1C)',
                    color: 'white',
                    fontWeight: 600,
                    fontSize: '14px',
                    cursor: deletingAsset ? 'not-allowed' : 'pointer',
                    opacity: deletingAsset ? 0.7 : 1,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  <FaTrash size={14} />
                  {deletingAsset ? 'Eliminazione...' : 'Elimina Definitivamente'}
                </button>
              </div>
            </>
          )}
        </div>
      </Modal>

      {/* Asset Archive Confirmation Modal - Safe Alternative */}
      <Modal
        isOpen={showAssetArchiveModal}
        onClose={() => { setShowAssetArchiveModal(false); setAssetToArchive(null); setArchiveReason(''); }}
        title=""
        maxWidth="540px"
      >
        <div style={{ padding: '20px 0' }}>
          {assetToArchive && (
            <>
              {/* Archive Header */}
              <div style={{
                textAlign: 'center',
                marginBottom: '24px'
              }}>
                <div style={{
                  width: '72px',
                  height: '72px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #FEF3C7, #FDE68A)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 16px'
                }}>
                  <FaArchive size={32} color="#D97706" />
                </div>
                <h3 style={{ margin: 0, fontSize: '20px', fontWeight: 700, color: '#92400E' }}>
                  Archivia Asset
                </h3>
                <p style={{ margin: '8px 0 0', fontSize: '14px', color: '#6B7280' }}>
                  I dati verranno conservati per consultazioni future
                </p>
              </div>

              {/* Asset Preview */}
              <div style={{
                padding: '20px',
                background: 'linear-gradient(135deg, #FEF3C7, #FDE68A)',
                borderRadius: '12px',
                marginBottom: '20px',
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                border: '2px solid #F59E0B'
              }}>
                <div style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '12px',
                  background: assetToArchive.category?.colore || '#6B7280',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                  color: 'white',
                  fontSize: '24px'
                }}>
                  {assetToArchive.immagine_principale ? (
                    <img
                      src={getImageUrl(assetToArchive.immagine_principale)}
                      alt={assetToArchive.nome}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    getCategoryIcon(assetToArchive.category?.codice)
                  )}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: '18px', color: '#1A1A1A' }}>
                    {assetToArchive.nome}
                  </div>
                  <div style={{ fontSize: '14px', color: '#6B7280', marginTop: '4px' }}>
                    {assetToArchive.codice} • {assetToArchive.category?.nome || 'Asset'}
                  </div>
                </div>
              </div>

              {/* What happens when archived */}
              <div style={{
                padding: '16px',
                background: '#F0FDF4',
                borderRadius: '8px',
                marginBottom: '16px',
                border: '1px solid #86EFAC'
              }}>
                <p style={{ margin: 0, fontSize: '14px', color: '#166534', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <FaCheck size={14} /> Cosa succede quando archivi:
                </p>
                <ul style={{ margin: '12px 0 0', paddingLeft: '20px', fontSize: '14px', color: '#15803D' }}>
                  <li>L'asset non sarà più visibile nel catalogo</li>
                  <li>Non potrà essere allocato a nuove sponsorship</li>
                  <li>Tutti i dati e lo storico saranno conservati</li>
                  <li>Potrai ripristinarlo in qualsiasi momento</li>
                </ul>
              </div>

              {/* Optional reason */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: 600,
                  color: '#374151',
                  marginBottom: '8px'
                }}>
                  Motivo archiviazione (opzionale)
                </label>
                <textarea
                  value={archiveReason}
                  onChange={(e) => setArchiveReason(e.target.value)}
                  placeholder="Es: Contratto sponsor terminato, Asset dismesso, Fine stagione..."
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '2px solid #E5E7EB',
                    borderRadius: '8px',
                    fontSize: '14px',
                    minHeight: '80px',
                    resize: 'vertical',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => { setShowAssetArchiveModal(false); setAssetToArchive(null); setArchiveReason(''); }}
                  style={{
                    padding: '12px 24px',
                    border: '2px solid #E5E7EB',
                    borderRadius: '8px',
                    background: 'white',
                    fontWeight: 600,
                    fontSize: '14px',
                    cursor: 'pointer',
                    color: '#374151'
                  }}
                >
                  Annulla
                </button>
                <button
                  type="button"
                  onClick={confirmArchiveAsset}
                  disabled={archivingAsset}
                  style={{
                    padding: '12px 24px',
                    border: 'none',
                    borderRadius: '8px',
                    background: 'linear-gradient(135deg, #F59E0B, #D97706)',
                    color: 'white',
                    fontWeight: 600,
                    fontSize: '14px',
                    cursor: archivingAsset ? 'not-allowed' : 'pointer',
                    opacity: archivingAsset ? 0.7 : 1,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  <FaArchive size={14} />
                  {archivingAsset ? 'Archiviazione...' : 'Archivia Asset'}
                </button>
              </div>
            </>
          )}
        </div>
      </Modal>

      <style jsx>{`
        .tp-filter-chip {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 8px 14px;
          border: 1px solid #E5E7EB;
          border-radius: 20px;
          background: white;
          font-size: 13px;
          font-weight: 500;
          color: #4B5563;
          cursor: pointer;
          transition: all 0.2s;
        }
        .tp-filter-chip:hover {
          border-color: #85FF00;
          background: #F9FAFB;
        }
        .tp-filter-chip.active {
          border-color: #85FF00;
          background: linear-gradient(135deg, rgba(133, 255, 0, 0.1), rgba(101, 163, 13, 0.1));
          color: #1F2937;
        }
        .tp-filter-chip svg {
          font-size: 12px;
        }

        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }

        .tp-pagination-item.disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .custom-filter-btn:hover {
          border-color: #D1D5DB !important;
          background: #F9FAFB !important;
        }
      `}</style>

      {/* Support Widget */}
      <SupportWidget
        pageTitle={showArchivedAssets ? "Archivio Asset e Diritti" : "Catalogo Asset e Diritti"}
        pageDescription={showArchivedAssets
          ? "L'Archivio contiene tutti gli asset e i diritti che sono stati archiviati. Qui puoi consultare lo storico, ripristinare elementi nel catalogo attivo o eliminarli definitivamente. Gli elementi archiviati conservano tutte le informazioni e lo storico delle allocazioni passate."
          : "Il Catalogo è il cuore del tuo inventario sponsorizzazioni. Da qui puoi visualizzare tutti gli asset (spazi fisici, digitali, esperienze) e i diritti (esclusività, immagine, naming rights), organizzarli per categoria, filtrare per tipo o disponibilità, e gestire prezzi e dettagli. Usa la vista griglia o lista per esplorare il catalogo."
        }
        pageIcon={showArchivedAssets ? FaArchive : FaBoxOpen}
        docsSection={showArchivedAssets ? "inventory-archive" : "inventory-catalog"}
        onStartTour={handleStartTour}
      />

      {/* Guided Tour */}
      <GuidedTour
        steps={showArchivedAssets ? archiveTourSteps : tourSteps}
        isOpen={isTourOpen}
        onClose={() => setIsTourOpen(false)}
        onComplete={handleTourComplete}
      />
    </div>
  );
}

export default InventoryCatalog;
