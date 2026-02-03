import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAuth } from '../utils/auth';
import { clubAPI } from '../services/api';
import Modal from '../components/Modal';
import Toast from '../components/Toast';
import SupportWidget from '../components/SupportWidget';
import GuidedTour from '../components/GuidedTour';
import {
	FaFileContract, FaPlus, FaSearch, FaFilter, FaEye, FaPaperPlane,
	FaCheckCircle, FaTimesCircle, FaClock,
	FaCopy, FaEllipsisV, FaTrash, FaEdit, FaLink,
	FaTh, FaList, FaExclamationTriangle,
	FaChevronLeft, FaChevronRight, FaChevronDown, FaPalette,
	FaRoute, FaHandshake
} from 'react-icons/fa';
import '../styles/template-style.css';

const ProposalList = () => {
	const navigate = useNavigate();
	const { user } = getAuth();
	const [proposals, setProposals] = useState([]);
	const [stats, setStats] = useState(null);
	const [loading, setLoading] = useState(true);
	const [search, setSearch] = useState('');
	const [filterStato, setFilterStato] = useState('');
	const [filterPriorita, setFilterPriorita] = useState('');
	const [filterDestinatario, setFilterDestinatario] = useState(''); // 'lead', 'sponsor', ''
	const [viewMode, setViewMode] = useState('grid');
	const [showMenu, setShowMenu] = useState(null);
	const [toast, setToast] = useState(null);

	// Guided Tour state
	const [isTourOpen, setIsTourOpen] = useState(false);

	// Delete Modal state
	const [showDeleteModal, setShowDeleteModal] = useState(false);
	const [proposalToDelete, setProposalToDelete] = useState(null);
	const [deleting, setDeleting] = useState(false);

	// Pagination
	const [currentPage, setCurrentPage] = useState(1);
	const itemsPerPage = 12;
	const catalogRef = useRef(null);

	// Custom dropdown state
	const [prioritaDropdownOpen, setPrioritaDropdownOpen] = useState(false);
	const prioritaDropdownRef = useRef(null);

	// Auth check on mount
	useEffect(() => {
		if (!user || user.role !== 'club') {
			navigate('/club/login');
			return;
		}
		fetchData();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	// Refetch when filters change
	useEffect(() => {
		if (user && user.role === 'club') {
			fetchData();
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [filterStato, filterPriorita, filterDestinatario]);

	// Click outside handler for dropdowns
	useEffect(() => {
		const handleClickOutside = (e) => {
			if (prioritaDropdownRef.current && !prioritaDropdownRef.current.contains(e.target)) {
				setPrioritaDropdownOpen(false);
			}
			if (showMenu && !e.target.closest('.tp-prop-menu')) {
				setShowMenu(null);
			}
		};
		document.addEventListener('mousedown', handleClickOutside);
		return () => document.removeEventListener('mousedown', handleClickOutside);
	}, [showMenu]);

	// Tour steps
	const tourSteps = [
		{
			target: '[data-tour="page-header"]',
			title: 'Proposal Builder',
			content: 'Benvenuto nel Proposal Builder! Qui puoi creare e gestire proposte commerciali professionali per i tuoi potenziali sponsor.',
			placement: 'bottom',
			tip: 'Una proposta ben strutturata aumenta significativamente le probabilità di chiusura.',
			icon: <FaFileContract size={18} color="white" />,
			iconBg: 'linear-gradient(135deg, #85FF00, #65A30D)'
		},
		{
			target: '[data-tour="status-filters"]',
			title: 'Filtro per Status',
			content: 'Filtra rapidamente le proposte per stato: Bozza, Inviata, Visualizzata, In Trattativa, Accettata o Rifiutata.',
			placement: 'bottom',
			tip: 'Concentrati sulle proposte "Visualizzate" e "In Trattativa" per massimizzare le conversioni.',
			icon: <FaFilter size={18} color="white" />,
			iconBg: 'linear-gradient(135deg, #3B82F6, #1D4ED8)'
		},
		{
			target: '[data-tour="search-input"]',
			title: 'Ricerca e Filtri',
			content: 'Cerca proposte per titolo, codice o destinatario. Puoi anche filtrare per priorità.',
			placement: 'bottom',
			icon: <FaSearch size={18} color="white" />,
			iconBg: 'linear-gradient(135deg, #10B981, #059669)'
		},
		{
			target: '[data-tour="view-toggle"]',
			title: 'Modalità Visualizzazione',
			content: 'Alterna tra vista Griglia (card con anteprima) e vista Lista (tabella compatta).',
			placement: 'bottom',
			icon: <FaTh size={18} color="white" />,
			iconBg: 'linear-gradient(135deg, #EC4899, #DB2777)'
		},
		{
			target: '[data-tour="new-proposal-btn"]',
			title: 'Nuova Proposta',
			content: 'Clicca qui per creare una nuova proposta commerciale. Il wizard ti guiderà nella selezione di asset, pricing e personalizzazione.',
			placement: 'bottom-left',
			icon: <FaPlus size={18} color="white" />,
			iconBg: 'linear-gradient(135deg, #F59E0B, #D97706)'
		}
	];

	const handleStartTour = () => setIsTourOpen(true);
	const handleTourComplete = () => setIsTourOpen(false);

	const fetchData = async () => {
		setLoading(true);
		try {
			const params = {};
			if (filterStato) params.stato = filterStato;
			if (filterPriorita) params.priorita = filterPriorita;
			if (filterDestinatario) params.destinatario_tipo = filterDestinatario;

			const [proposalsRes, statsRes] = await Promise.all([
				clubAPI.getProposals(params),
				clubAPI.getProposalStats()
			]);

			setProposals(proposalsRes.data || []);
			setStats(statsRes.data || null);
		} catch (error) {
			console.error('Error fetching proposals:', error);
			setToast({ type: 'error', message: 'Errore nel caricamento delle proposte' });
			setProposals([]);
			setStats(null);
		}
		setLoading(false);
	};

	const getStatoConfig = (stato) => {
		const configs = {
			bozza: { label: 'Bozza', color: '#6B7280', bg: '#F3F4F6', icon: FaFileContract },
			inviata: { label: 'Inviata', color: '#2563EB', bg: '#DBEAFE', icon: FaPaperPlane },
			visualizzata: { label: 'Visualizzata', color: '#7C3AED', bg: '#EDE9FE', icon: FaEye },
			in_trattativa: { label: 'In Trattativa', color: '#D97706', bg: '#FEF3C7', icon: FaClock },
			accettata: { label: 'Accettata', color: '#059669', bg: '#D1FAE5', icon: FaCheckCircle },
			rifiutata: { label: 'Rifiutata', color: '#DC2626', bg: '#FEE2E2', icon: FaTimesCircle },
			scaduta: { label: 'Scaduta', color: '#6B7280', bg: '#F3F4F6', icon: FaClock }
		};
		return configs[stato] || configs.bozza;
	};

	const getPrioritaConfig = (priorita) => {
		const configs = {
			bassa: { label: 'Bassa', color: '#6B7280' },
			media: { label: 'Media', color: '#2563EB' },
			alta: { label: 'Alta', color: '#F59E0B' },
			urgente: { label: 'Urgente', color: '#DC2626' }
		};
		return configs[priorita] || configs.media;
	};

	const formatCurrency = (value) => {
		if (!value) return '-';
		return new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(value);
	};

	const formatDate = (dateStr) => {
		if (!dateStr) return '-';
		return new Date(dateStr).toLocaleDateString('it-IT', { day: '2-digit', month: 'short', year: 'numeric' });
	};

	const getDaysUntilExpiry = (dateStr) => {
		if (!dateStr) return null;
		return Math.ceil((new Date(dateStr) - new Date()) / (1000 * 60 * 60 * 24));
	};

	const handleDeleteClick = (proposal) => {
		setProposalToDelete(proposal);
		setShowDeleteModal(true);
		setShowMenu(null);
	};

	const handleConfirmDelete = async () => {
		if (!proposalToDelete) return;
		setDeleting(true);
		try {
			await clubAPI.deleteProposal(proposalToDelete.id);
			fetchData();
			setToast({ message: 'Proposta eliminata con successo', type: 'success' });
		} catch (error) {
			console.error('Error deleting proposal:', error);
			setToast({ message: 'Errore nell\'eliminazione', type: 'error' });
		} finally {
			setDeleting(false);
			setShowDeleteModal(false);
			setProposalToDelete(null);
		}
	};

	const handleDuplicate = async (id) => {
		try {
			const response = await clubAPI.duplicateProposal(id, {});
			setToast({ message: 'Proposta duplicata con successo', type: 'success' });
			navigate(`/club/proposals/${response.data.id}/edit`);
		} catch (error) {
			console.error('Error duplicating proposal:', error);
			setToast({ message: 'Errore nella duplicazione', type: 'error' });
		}
		setShowMenu(null);
	};

	const handleCopyLink = (proposal) => {
		const link = `${window.location.origin}/proposals/${proposal.id}/preview`;
		navigator.clipboard.writeText(link);
		setToast({ message: 'Link copiato negli appunti', type: 'success' });
		setShowMenu(null);
	};

	const handlePageChange = (newPage) => {
		setCurrentPage(newPage);
		if (catalogRef.current) {
			catalogRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
		}
	};

	useEffect(() => { setCurrentPage(1); }, [filterStato, filterPriorita, filterDestinatario, search]);

	const filteredProposals = proposals.filter(p => {
		if (search) {
			const s = search.toLowerCase();
			if (!p.titolo?.toLowerCase().includes(s) &&
				!p.codice?.toLowerCase().includes(s) &&
				!p.destinatario_azienda?.toLowerCase().includes(s)) return false;
		}
		return true;
	});

	const totalPages = Math.ceil(filteredProposals.length / itemsPerPage);
	const paginatedProposals = filteredProposals.slice(
		(currentPage - 1) * itemsPerPage,
		currentPage * itemsPerPage
	);

	const prioritaOptions = [
		{ value: '', label: 'Tutte le priorità' },
		{ value: 'urgente', label: 'Urgente' },
		{ value: 'alta', label: 'Alta' },
		{ value: 'media', label: 'Media' },
		{ value: 'bassa', label: 'Bassa' }
	];

	if (loading) {
		return (
			<div className="tp-page-container">
				<div className="tp-loading">
					<div className="tp-spinner"></div>
					<p>Caricamento proposte...</p>
				</div>
			</div>
		);
	}

	return (
		<div className="tp-page-container">
			{/* Header */}
			<div className="tp-page-header" data-tour="page-header">
				<div className="tp-header-content">
					<h1 className="tp-page-title">Proposal Builder</h1>
					<p className="tp-page-subtitle">Crea e gestisci proposte commerciali professionali</p>
				</div>
				<div className="tp-header-actions" data-tour="action-buttons" style={{ display: 'flex', gap: '12px' }}>
					<button className="tp-btn tp-btn-outline" onClick={() => navigate('/club/proposals/templates')}>
						<FaCopy /> Template
					</button>
					<button className="tp-btn tp-btn-outline" onClick={() => navigate('/club/proposals/brand')} title="Personalizza Brand">
						<FaPalette /> Brand
					</button>
					<button className="tp-btn tp-btn-primary" onClick={() => navigate('/club/proposals/new')} data-tour="new-proposal-btn">
						<FaPlus /> Nuova Proposta
					</button>
				</div>
			</div>

			{/* Filters Row */}
			<div className="tp-card" style={{ marginBottom: '24px' }} data-tour="status-filters">
				<div className="tp-card-body" style={{ padding: '16px 24px' }}>
					{/* Destinatario Filter */}
					<div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
						<span style={{ fontWeight: 600, color: '#374151', fontSize: '14px' }}>Destinatario:</span>
						<div style={{ display: 'flex', gap: '8px' }}>
							<button
								className={`tp-filter-chip ${!filterDestinatario ? 'active' : ''}`}
								onClick={() => setFilterDestinatario('')}
								style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
							>
								Tutti
							</button>
							<button
								className={`tp-filter-chip ${filterDestinatario === 'lead' ? 'active' : ''}`}
								onClick={() => setFilterDestinatario(filterDestinatario === 'lead' ? '' : 'lead')}
								style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
							>
								<FaRoute size={12} /> Lead
							</button>
							<button
								className={`tp-filter-chip ${filterDestinatario === 'sponsor' ? 'active' : ''}`}
								onClick={() => setFilterDestinatario(filterDestinatario === 'sponsor' ? '' : 'sponsor')}
								style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
							>
								<FaHandshake size={12} /> Sponsor
							</button>
						</div>
					</div>

					{/* Status Filter */}
					<div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
						<span style={{ fontWeight: 600, color: '#374151', fontSize: '14px' }}>Status:</span>
						<div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflowX: 'auto', flex: 1 }} className="hide-scrollbar">
							<button
								className={`tp-filter-chip ${!filterStato ? 'active' : ''}`}
								onClick={() => setFilterStato('')}
							>
								Tutte ({stats?.totale || 0})
							</button>
							{['bozza', 'inviata', 'visualizzata', 'in_trattativa', 'accettata', 'rifiutata'].map(stato => {
								const config = getStatoConfig(stato);
								const count = stats?.per_stato?.[stato] || 0;
								return (
									<button
										key={stato}
										className={`tp-filter-chip ${filterStato === stato ? 'active' : ''}`}
										onClick={() => setFilterStato(filterStato === stato ? '' : stato)}
									>
										{config.label} ({count})
									</button>
								);
							})}
						</div>
					</div>
				</div>
			</div>

			{/* Main Content Card */}
			<div className="tp-card" ref={catalogRef}>
				{/* Filters Toolbar */}
				<div className="tp-card-header">
					<div className="tp-card-header-left">
						{/* Search */}
						<div className="tp-search-wrapper" data-tour="search-input">
							<input
								type="text"
								className="tp-search-input"
								placeholder="Cerca proposta, codice, destinatario..."
								value={search}
								onChange={(e) => setSearch(e.target.value)}
							/>
							<span className="tp-search-icon"><FaSearch /></span>
						</div>

						{/* Priority Dropdown */}
						<div ref={prioritaDropdownRef} className="tp-custom-dropdown">
							<button
								type="button"
								onClick={() => setPrioritaDropdownOpen(!prioritaDropdownOpen)}
								className={`tp-custom-dropdown-btn ${filterPriorita ? 'active' : ''}`}
							>
								<FaFilter size={14} />
								<span style={{ flex: 1, textAlign: 'left' }}>
									{prioritaOptions.find(o => o.value === filterPriorita)?.label || 'Tutte le priorità'}
								</span>
								<FaChevronDown
									size={12}
									className={`arrow ${prioritaDropdownOpen ? 'open' : ''}`}
								/>
							</button>
							{prioritaDropdownOpen && (
								<div className="tp-custom-dropdown-list">
									{prioritaOptions.map(option => (
										<button
											key={option.value}
											className={`tp-custom-dropdown-item ${filterPriorita === option.value ? 'selected' : ''}`}
											onClick={() => {
												setFilterPriorita(option.value);
												setPrioritaDropdownOpen(false);
											}}
										>
											{option.label}
										</button>
									))}
								</div>
							)}
						</div>
					</div>

					<div className="tp-card-header-right">
						<div className="tp-view-toggle" data-tour="view-toggle">
							<button
								className={`tp-view-toggle-btn ${viewMode === 'grid' ? 'active' : ''}`}
								onClick={() => setViewMode('grid')}
								title="Vista Griglia"
							>
								<FaTh />
							</button>
							<button
								className={`tp-view-toggle-btn ${viewMode === 'list' ? 'active' : ''}`}
								onClick={() => setViewMode('list')}
								title="Vista Lista"
							>
								<FaList />
							</button>
						</div>
					</div>
				</div>

				{/* Content */}
				<div className="tp-card-body" style={{ padding: '24px' }}>
					{filteredProposals.length === 0 ? (
						<div className="tp-empty-state">
							<div className="tp-empty-icon">
								<FaFileContract />
							</div>
							<h3>Nessuna proposta trovata</h3>
							<p>Crea la tua prima proposta commerciale</p>
							<button className="tp-btn tp-btn-primary" onClick={() => navigate('/club/proposals/new')}>
								<FaPlus /> Nuova Proposta
							</button>
						</div>
					) : viewMode === 'grid' ? (
						<div className="tp-proposal-grid">
							{paginatedProposals.map(proposal => {
								const statoConfig = getStatoConfig(proposal.stato);
								const prioritaConfig = getPrioritaConfig(proposal.priorita);
								const StatusIcon = statoConfig.icon;
								const daysUntilExpiry = getDaysUntilExpiry(proposal.data_scadenza);

								return (
									<div
										key={proposal.id}
										className="tp-proposal-card"
										onClick={() => navigate(`/club/proposals/${proposal.id}`)}
									>
										<div className="tp-prop-header">
											<span className="tp-status-badge" style={{ background: statoConfig.bg, color: statoConfig.color }}>
												<StatusIcon style={{ marginRight: '6px' }} />
												{statoConfig.label}
											</span>
											<div className="tp-prop-actions">
												<button
													className="tp-icon-btn"
													onClick={(e) => {
														e.stopPropagation();
														setShowMenu(showMenu === proposal.id ? null : proposal.id);
													}}
												>
													<FaEllipsisV />
												</button>
												{showMenu === proposal.id && (
													<div className="tp-prop-menu">
														<button className="tp-prop-menu-item" onClick={(e) => { e.stopPropagation(); navigate(`/club/proposals/${proposal.id}/edit`); }}>
															<FaEdit /> Modifica
														</button>
														<button className="tp-prop-menu-item" onClick={(e) => { e.stopPropagation(); handleDuplicate(proposal.id); }}>
															<FaCopy /> Duplica
														</button>
														{proposal.stato !== 'bozza' && (
															<button className="tp-prop-menu-item" onClick={(e) => { e.stopPropagation(); handleCopyLink(proposal); }}>
																<FaLink /> Copia link
															</button>
														)}
														{['bozza', 'rifiutata', 'scaduta'].includes(proposal.stato) && (
															<button className="tp-prop-menu-item danger" onClick={(e) => { e.stopPropagation(); handleDeleteClick(proposal); }}>
																<FaTrash /> Elimina
															</button>
														)}
													</div>
												)}
											</div>
										</div>

										<div className="tp-prop-body">
											<p className="tp-prop-code">{proposal.codice}</p>
											<h3 className="tp-prop-title">{proposal.titolo}</h3>
											<div className="tp-prop-company">
												<div className="tp-prop-avatar">
													{proposal.destinatario_azienda?.charAt(0)}
												</div>
												<div>
													<p className="tp-prop-company-name">{proposal.destinatario_azienda}</p>
													<p className="tp-prop-sector">{proposal.settore_merceologico}</p>
												</div>
											</div>
										</div>

										<div className="tp-prop-footer">
											<div className="tp-prop-price">
												{proposal.sconto_percentuale > 0 ? (
													<>
														<span style={{ textDecoration: 'line-through', color: '#9CA3AF', fontSize: '13px', marginRight: '8px' }}>
															{formatCurrency(proposal.valore_totale)}
														</span>
														<span style={{ color: '#059669' }}>{formatCurrency(proposal.valore_finale)}</span>
														<span style={{
															marginLeft: '8px',
															background: '#FEE2E2',
															color: '#DC2626',
															padding: '2px 6px',
															borderRadius: '4px',
															fontSize: '11px',
															fontWeight: 600
														}}>
															-{proposal.sconto_percentuale}%
														</span>
													</>
												) : (
													formatCurrency(proposal.valore_finale || proposal.valore_totale)
												)}
											</div>
										</div>

										{daysUntilExpiry !== null && daysUntilExpiry > 0 && proposal.stato !== 'accettata' && (
											<div className="tp-prop-expiry" style={{ color: daysUntilExpiry <= 5 ? '#DC2626' : '#6B7280' }}>
												<FaClock /> Scade in {daysUntilExpiry}g
											</div>
										)}
									</div>
								);
							})}
						</div>
					) : (
						<div className="tp-prop-table-wrap" style={{ border: 'none', marginTop: 0 }}>
							<table className="tp-prop-table">
								<thead>
									<tr>
										<th>Proposta</th>
										<th>Destinatario</th>
										<th>Stato</th>
										<th>Valore</th>
										<th>Views</th>
										<th>Data</th>
										<th></th>
									</tr>
								</thead>
								<tbody>
									{paginatedProposals.map(proposal => {
										const statoConfig = getStatoConfig(proposal.stato);
										const StatusIcon = statoConfig.icon;

										return (
											<tr key={proposal.id} onClick={() => navigate(`/club/proposals/${proposal.id}`)}>
												<td>
													<p className="td-code">{proposal.codice}</p>
													<p className="td-title">{proposal.titolo}</p>
												</td>
												<td>
													<p className="td-company">{proposal.destinatario_azienda}</p>
													<p className="td-sector">{proposal.settore_merceologico}</p>
												</td>
												<td>
													<span className="tp-status-badge" style={{ background: statoConfig.bg, color: statoConfig.color }}>
														<StatusIcon style={{ marginRight: '4px' }} />
														{statoConfig.label}
													</span>
												</td>
												<td className="td-price">
													{proposal.sconto_percentuale > 0 ? (
														<>
															<span style={{ textDecoration: 'line-through', color: '#9CA3AF', fontSize: '12px', display: 'block' }}>
																{formatCurrency(proposal.valore_totale)}
															</span>
															<span style={{ color: '#059669' }}>{formatCurrency(proposal.valore_finale)}</span>
															<span style={{
																marginLeft: '6px',
																background: '#FEE2E2',
																color: '#DC2626',
																padding: '2px 5px',
																borderRadius: '4px',
																fontSize: '10px',
																fontWeight: 600
															}}>
																-{proposal.sconto_percentuale}%
															</span>
														</>
													) : (
														formatCurrency(proposal.valore_finale || proposal.valore_totale)
													)}
												</td>
												<td className="td-views">{proposal.visualizzazioni || 0}</td>
												<td className="td-date">{formatDate(proposal.created_at)}</td>
												<td>
													<button
														className="tp-icon-btn"
														onClick={(e) => { e.stopPropagation(); navigate(`/club/proposals/${proposal.id}/edit`); }}
													>
														<FaEdit />
													</button>
												</td>
											</tr>
										);
									})}
								</tbody>
							</table>
						</div>
					)}

					{/* Pagination */}
					{filteredProposals.length > itemsPerPage && (
						<div className="tp-pagination">
							<span className="tp-pagination-info">
								Mostrando {((currentPage - 1) * itemsPerPage) + 1}-{Math.min(currentPage * itemsPerPage, filteredProposals.length)} di {filteredProposals.length} proposte
							</span>
							<div className="tp-pagination-list">
								<button
									className="tp-pagination-item"
									onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
									disabled={currentPage === 1}
								>
									<FaChevronLeft />
								</button>
								{Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
									<button
										key={page}
										className={`tp-pagination-item ${currentPage === page ? 'active' : ''}`}
										onClick={() => handlePageChange(page)}
									>
										{page}
									</button>
								))}
								<button
									className="tp-pagination-item"
									onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
									disabled={currentPage === totalPages}
								>
									<FaChevronRight />
								</button>
							</div>
						</div>
					)}
				</div>
			</div>

			{/* Delete Confirmation Modal */}
			<Modal
				isOpen={showDeleteModal}
				onClose={() => { setShowDeleteModal(false); setProposalToDelete(null); }}
				title="Conferma Eliminazione"
			>
				<div style={{ padding: '20px 0' }}>
					<div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', marginBottom: '24px' }}>
						<div style={{
							width: '48px', height: '48px', borderRadius: '50%', background: '#FEE2E2',
							display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
						}}>
							<FaExclamationTriangle style={{ color: '#DC2626', fontSize: '20px' }} />
						</div>
						<div>
							<h4 style={{ fontWeight: 600, color: '#1F2937', marginBottom: '8px' }}>
								Eliminare questa proposta?
							</h4>
							<p style={{ color: '#6B7280', fontSize: '14px', lineHeight: '1.5' }}>
								Stai per eliminare la proposta <strong>"{proposalToDelete?.titolo}"</strong> ({proposalToDelete?.codice}).
								Questa azione non può essere annullata.
							</p>
						</div>
					</div>
					<div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
						<button className="tp-btn tp-btn-outline" onClick={() => { setShowDeleteModal(false); setProposalToDelete(null); }} disabled={deleting}>
							Annulla
						</button>
						<button className="tp-btn" onClick={handleConfirmDelete} disabled={deleting} style={{ background: '#DC2626', color: 'white' }}>
							{deleting ? 'Eliminazione...' : <><FaTrash /> Elimina Proposta</>}
						</button>
					</div>
				</div>
			</Modal>

			{/* Support Widget */}
			<SupportWidget
				pageTitle="Proposal Builder"
				pageDescription="Il Proposal Builder è il tuo strumento per creare e gestire proposte commerciali professionali. Crea proposte personalizzate, monitora le visualizzazioni e traccia lo stato delle trattative."
				pageIcon={FaFileContract}
				docsSection="proposals-overview"
				onStartTour={handleStartTour}
			/>

			{/* Guided Tour */}
			<GuidedTour
				steps={tourSteps}
				isOpen={isTourOpen}
				onClose={() => setIsTourOpen(false)}
				onComplete={handleTourComplete}
			/>

			{/* Toast */}
			{toast && (
				<Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
			)}
		</div>
	);
};

export default ProposalList;
