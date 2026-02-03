import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
        HiOutlineExclamationTriangle,
        HiOutlineShieldCheck,
        HiOutlineCalendar,
        HiOutlineUserGroup,
        HiOutlineCheckCircle,
        HiOutlineXCircle,
        HiOutlineClock,
        HiOutlineEye,
        HiOutlineArrowRight,
        HiOutlineFunnel,
        HiOutlineArrowPath,
        HiOutlineDocumentText,
        HiOutlineChevronDown,
        HiOutlineChevronUp
} from 'react-icons/hi2';

const RightsConflicts = () => {
        const navigate = useNavigate();
        const [conflicts, setConflicts] = useState([]);
        const [loading, setLoading] = useState(true);
        const [stats, setStats] = useState({
                total: 0,
                attivi: 0,
                risolti: 0,
                ignorati: 0
        });
        const [filterStatus, setFilterStatus] = useState('all');
        const [filterSeverity, setFilterSeverity] = useState('all');
        const [expandedConflicts, setExpandedConflicts] = useState({});
        const [resolving, setResolving] = useState(null);

        useEffect(() => {
                fetchConflicts();
        }, []);

        const fetchConflicts = async () => {
                setLoading(true);
                try {
                        const token = localStorage.getItem('club_token');
                        const response = await fetch('/api/club/rights/conflicts', {
                                headers: { 'Authorization': `Bearer ${token}` }
                        });
                        if (response.ok) {
                                const data = await response.json();
                                setConflicts(data);
                                calculateStats(data);
                        } else {
                                // Demo data
                                const demoConflicts = generateDemoConflicts();
                                setConflicts(demoConflicts);
                                calculateStats(demoConflicts);
                        }
                } catch (error) {
                        console.error('Error fetching conflicts:', error);
                        const demoConflicts = generateDemoConflicts();
                        setConflicts(demoConflicts);
                        calculateStats(demoConflicts);
                }
                setLoading(false);
        };

        const generateDemoConflicts = () => {
                return [
                        {
                                id: 1,
                                tipo: 'sector_exclusivity',
                                gravita: 'critico',
                                stato: 'attivo',
                                descrizione: 'Due sponsor nel settore Bevande hanno diritti sovrapposti',
                                diritto: { id: 1, nome: 'Naming Rights Stadio', categoria: 'Naming Rights' },
                                sponsor1: { id: 1, nome: 'Coca-Cola Italia', settore: 'Bevande' },
                                sponsor2: { id: 2, nome: 'Pepsi Italia', settore: 'Bevande' },
                                allocazione1: { id: 1, data_inizio: '2024-01-01', data_fine: '2024-12-31' },
                                allocazione2: { id: 2, data_inizio: '2024-06-01', data_fine: '2025-05-31' },
                                periodo_sovrapposizione: { inizio: '2024-06-01', fine: '2024-12-31' },
                                rilevato_il: '2024-05-28T10:30:00',
                                note: null
                        },
                        {
                                id: 2,
                                tipo: 'right_exclusivity',
                                gravita: 'alto',
                                stato: 'attivo',
                                descrizione: 'Diritto esclusivo assegnato a multipli sponsor',
                                diritto: { id: 2, nome: 'LED Bordocampo Premium', categoria: 'Visibilità Stadio' },
                                sponsor1: { id: 3, nome: 'Nike', settore: 'Abbigliamento Sportivo' },
                                sponsor2: { id: 4, nome: 'Adidas', settore: 'Abbigliamento Sportivo' },
                                allocazione1: { id: 3, data_inizio: '2024-07-01', data_fine: '2025-06-30' },
                                allocazione2: { id: 4, data_inizio: '2024-09-01', data_fine: '2025-08-31' },
                                periodo_sovrapposizione: { inizio: '2024-09-01', fine: '2025-06-30' },
                                rilevato_il: '2024-05-25T14:15:00',
                                note: null
                        },
                        {
                                id: 3,
                                tipo: 'territory_overlap',
                                gravita: 'medio',
                                stato: 'risolto',
                                descrizione: 'Sovrapposizione territoriale per diritti digitali',
                                diritto: { id: 3, nome: 'Social Media Rights', categoria: 'Digitale' },
                                sponsor1: { id: 5, nome: 'TIM', settore: 'Telecomunicazioni' },
                                sponsor2: { id: 6, nome: 'Vodafone', settore: 'Telecomunicazioni' },
                                allocazione1: { id: 5, data_inizio: '2024-01-01', data_fine: '2024-12-31' },
                                allocazione2: { id: 6, data_inizio: '2024-01-01', data_fine: '2024-12-31' },
                                periodo_sovrapposizione: { inizio: '2024-01-01', fine: '2024-12-31' },
                                rilevato_il: '2024-04-10T09:00:00',
                                risolto_il: '2024-04-15T11:30:00',
                                note: 'Risolto: TIM mantiene diritti Italia, Vodafone Europa esclusa Italia'
                        },
                        {
                                id: 4,
                                tipo: 'sublicense_conflict',
                                gravita: 'basso',
                                stato: 'ignorato',
                                descrizione: 'Potenziale conflitto sublicenza non autorizzata',
                                diritto: { id: 4, nome: 'Hospitality Lounge', categoria: 'Hospitality' },
                                sponsor1: { id: 7, nome: 'Banco BPM', settore: 'Banche' },
                                sponsor2: { id: 8, nome: 'UniCredit', settore: 'Banche' },
                                allocazione1: { id: 7, data_inizio: '2024-01-01', data_fine: '2024-12-31' },
                                allocazione2: { id: 8, data_inizio: '2024-03-01', data_fine: '2024-11-30' },
                                periodo_sovrapposizione: { inizio: '2024-03-01', fine: '2024-11-30' },
                                rilevato_il: '2024-03-05T16:45:00',
                                note: 'Ignorato: diversi lounge assegnati'
                        },
                        {
                                id: 5,
                                tipo: 'sector_exclusivity',
                                gravita: 'critico',
                                stato: 'attivo',
                                descrizione: 'Conflitto esclusività settore Automotive',
                                diritto: { id: 5, nome: 'Sponsor Ufficiale Automotive', categoria: 'Partnership' },
                                sponsor1: { id: 9, nome: 'BMW Italia', settore: 'Automotive' },
                                sponsor2: { id: 10, nome: 'Audi Italia', settore: 'Automotive' },
                                allocazione1: { id: 9, data_inizio: '2024-01-01', data_fine: '2025-12-31' },
                                allocazione2: { id: 10, data_inizio: '2024-07-01', data_fine: '2026-06-30' },
                                periodo_sovrapposizione: { inizio: '2024-07-01', fine: '2025-12-31' },
                                rilevato_il: '2024-06-15T08:00:00',
                                note: null
                        }
                ];
        };

        const calculateStats = (data) => {
                setStats({
                        total: data.length,
                        attivi: data.filter(c => c.stato === 'attivo').length,
                        risolti: data.filter(c => c.stato === 'risolto').length,
                        ignorati: data.filter(c => c.stato === 'ignorato').length
                });
        };

        const handleResolve = async (conflictId, action) => {
                setResolving(conflictId);
                try {
                        const token = localStorage.getItem('club_token');
                        const response = await fetch(`/api/club/rights/conflicts/${conflictId}/resolve`, {
                                method: 'PUT',
                                headers: {
                                        'Authorization': `Bearer ${token}`,
                                        'Content-Type': 'application/json'
                                },
                                body: JSON.stringify({ action })
                        });
                        if (response.ok) {
                                fetchConflicts();
                        } else {
                                // Demo: update locally
                                setConflicts(prev => prev.map(c =>
                                        c.id === conflictId ? { ...c, stato: action, risolto_il: new Date().toISOString() } : c
                                ));
                                calculateStats(conflicts.map(c =>
                                        c.id === conflictId ? { ...c, stato: action } : c
                                ));
                        }
                } catch (error) {
                        console.error('Error resolving conflict:', error);
                        // Demo: update locally
                        setConflicts(prev => prev.map(c =>
                                c.id === conflictId ? { ...c, stato: action, risolto_il: new Date().toISOString() } : c
                        ));
                }
                setResolving(null);
        };

        const toggleExpand = (id) => {
                setExpandedConflicts(prev => ({
                        ...prev,
                        [id]: !prev[id]
                }));
        };

        const getSeverityConfig = (severity) => {
                switch (severity) {
                        case 'critico':
                                return {
                                        bg: 'bg-red-100',
                                        text: 'text-red-700',
                                        border: 'border-red-200',
                                        dot: 'bg-red-500',
                                        label: 'Critico'
                                };
                        case 'alto':
                                return {
                                        bg: 'bg-orange-100',
                                        text: 'text-orange-700',
                                        border: 'border-orange-200',
                                        dot: 'bg-orange-500',
                                        label: 'Alto'
                                };
                        case 'medio':
                                return {
                                        bg: 'bg-yellow-100',
                                        text: 'text-yellow-700',
                                        border: 'border-yellow-200',
                                        dot: 'bg-yellow-500',
                                        label: 'Medio'
                                };
                        case 'basso':
                                return {
                                        bg: 'bg-gray-100',
                                        text: 'text-gray-700',
                                        border: 'border-gray-200',
                                        dot: 'bg-gray-400',
                                        label: 'Basso'
                                };
                        default:
                                return {
                                        bg: 'bg-gray-100',
                                        text: 'text-gray-700',
                                        border: 'border-gray-200',
                                        dot: 'bg-gray-400',
                                        label: severity
                                };
                }
        };

        const getStatusConfig = (status) => {
                switch (status) {
                        case 'attivo':
                                return {
                                        bg: 'bg-red-100',
                                        text: 'text-red-700',
                                        icon: HiOutlineExclamationTriangle,
                                        label: 'Attivo'
                                };
                        case 'risolto':
                                return {
                                        bg: 'bg-green-100',
                                        text: 'text-green-700',
                                        icon: HiOutlineCheckCircle,
                                        label: 'Risolto'
                                };
                        case 'ignorato':
                                return {
                                        bg: 'bg-gray-100',
                                        text: 'text-gray-600',
                                        icon: HiOutlineXCircle,
                                        label: 'Ignorato'
                                };
                        default:
                                return {
                                        bg: 'bg-gray-100',
                                        text: 'text-gray-600',
                                        icon: HiOutlineClock,
                                        label: status
                                };
                }
        };

        const getTypeLabel = (type) => {
                switch (type) {
                        case 'sector_exclusivity':
                                return 'Esclusività Settore';
                        case 'right_exclusivity':
                                return 'Esclusività Diritto';
                        case 'territory_overlap':
                                return 'Sovrapposizione Territorio';
                        case 'sublicense_conflict':
                                return 'Conflitto Sublicenza';
                        default:
                                return type;
                }
        };

        const formatDate = (dateStr) => {
                if (!dateStr) return '-';
                return new Date(dateStr).toLocaleDateString('it-IT', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric'
                });
        };

        const formatDateTime = (dateStr) => {
                if (!dateStr) return '-';
                return new Date(dateStr).toLocaleString('it-IT', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                });
        };

        const filteredConflicts = conflicts.filter(c => {
                if (filterStatus !== 'all' && c.stato !== filterStatus) return false;
                if (filterSeverity !== 'all' && c.gravita !== filterSeverity) return false;
                return true;
        });

        if (loading) {
                return (
                        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#85FF00]"></div>
                        </div>
                );
        }

        return (
                <div className="min-h-screen bg-gray-50">
                        {/* Header */}
                        <div className="bg-[#0D0D0D] text-white px-6 py-8">
                                <div className="max-w-7xl mx-auto">
                                        <div className="flex items-center gap-2 text-gray-400 text-sm mb-4">
                                                <span
                                                        className="hover:text-white cursor-pointer"
                                                        onClick={() => navigate('/club/rights')}
                                                >
                                                        Diritti
                                                </span>
                                                <span>/</span>
                                                <span className="text-white">Conflitti</span>
                                        </div>

                                        <div className="flex items-center justify-between">
                                                <div>
                                                        <h1 className="text-3xl font-light mb-2">
                                                                Gestione Conflitti
                                                        </h1>
                                                        <p className="text-gray-400">
                                                                Monitora e risolvi i conflitti tra allocazioni di diritti
                                                        </p>
                                                </div>

                                                <button
                                                        onClick={fetchConflicts}
                                                        className="flex items-center gap-2 bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg transition-colors"
                                                >
                                                        <HiOutlineArrowPath className="w-5 h-5" />
                                                        <span>Aggiorna</span>
                                                </button>
                                        </div>
                                </div>
                        </div>

                        <div className="max-w-7xl mx-auto px-6 py-8">
                                {/* Stats */}
                                <div className="grid grid-cols-4 gap-4 mb-8">
                                        <div className="bg-white rounded-xl p-5 border border-gray-100">
                                                <div className="flex items-center gap-3 mb-3">
                                                        <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                                                                <HiOutlineExclamationTriangle className="w-5 h-5 text-gray-600" />
                                                        </div>
                                                        <span className="text-gray-500 text-sm">Totale Conflitti</span>
                                                </div>
                                                <p className="text-3xl font-semibold text-gray-900">{stats.total}</p>
                                        </div>

                                        <div className="bg-white rounded-xl p-5 border border-gray-100">
                                                <div className="flex items-center gap-3 mb-3">
                                                        <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                                                                <HiOutlineExclamationTriangle className="w-5 h-5 text-red-600" />
                                                        </div>
                                                        <span className="text-gray-500 text-sm">Attivi</span>
                                                </div>
                                                <p className="text-3xl font-semibold text-red-600">{stats.attivi}</p>
                                        </div>

                                        <div className="bg-white rounded-xl p-5 border border-gray-100">
                                                <div className="flex items-center gap-3 mb-3">
                                                        <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                                                                <HiOutlineCheckCircle className="w-5 h-5 text-green-600" />
                                                        </div>
                                                        <span className="text-gray-500 text-sm">Risolti</span>
                                                </div>
                                                <p className="text-3xl font-semibold text-green-600">{stats.risolti}</p>
                                        </div>

                                        <div className="bg-white rounded-xl p-5 border border-gray-100">
                                                <div className="flex items-center gap-3 mb-3">
                                                        <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                                                                <HiOutlineXCircle className="w-5 h-5 text-gray-500" />
                                                        </div>
                                                        <span className="text-gray-500 text-sm">Ignorati</span>
                                                </div>
                                                <p className="text-3xl font-semibold text-gray-500">{stats.ignorati}</p>
                                        </div>
                                </div>

                                {/* Filters */}
                                <div className="flex items-center gap-4 mb-6">
                                        <div className="flex items-center gap-2">
                                                <HiOutlineFunnel className="w-5 h-5 text-gray-400" />
                                                <span className="text-sm text-gray-600">Filtra:</span>
                                        </div>

                                        <select
                                                value={filterStatus}
                                                onChange={(e) => setFilterStatus(e.target.value)}
                                                className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#85FF00]"
                                        >
                                                <option value="all">Tutti gli stati</option>
                                                <option value="attivo">Attivi</option>
                                                <option value="risolto">Risolti</option>
                                                <option value="ignorato">Ignorati</option>
                                        </select>

                                        <select
                                                value={filterSeverity}
                                                onChange={(e) => setFilterSeverity(e.target.value)}
                                                className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#85FF00]"
                                        >
                                                <option value="all">Tutte le gravità</option>
                                                <option value="critico">Critico</option>
                                                <option value="alto">Alto</option>
                                                <option value="medio">Medio</option>
                                                <option value="basso">Basso</option>
                                        </select>

                                        <span className="text-sm text-gray-500 ml-auto">
                                                {filteredConflicts.length} conflitti trovati
                                        </span>
                                </div>

                                {/* Conflicts List */}
                                <div className="space-y-4">
                                        {filteredConflicts.length === 0 ? (
                                                <div className="bg-white rounded-xl p-12 text-center border border-gray-100">
                                                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                                                <HiOutlineShieldCheck className="w-8 h-8 text-green-600" />
                                                        </div>
                                                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                                                                Nessun conflitto trovato
                                                        </h3>
                                                        <p className="text-gray-500">
                                                                Non ci sono conflitti corrispondenti ai filtri selezionati.
                                                        </p>
                                                </div>
                                        ) : (
                                                filteredConflicts.map(conflict => {
                                                        const severityConfig = getSeverityConfig(conflict.gravita);
                                                        const statusConfig = getStatusConfig(conflict.stato);
                                                        const isExpanded = expandedConflicts[conflict.id];
                                                        const StatusIcon = statusConfig.icon;

                                                        return (
                                                                <div
                                                                        key={conflict.id}
                                                                        className={`bg-white rounded-xl border ${
                                                                                conflict.stato === 'attivo'
                                                                                        ? 'border-red-200'
                                                                                        : 'border-gray-100'
                                                                        } overflow-hidden`}
                                                                >
                                                                        {/* Conflict Header */}
                                                                        <div
                                                                                className="p-5 cursor-pointer"
                                                                                onClick={() => toggleExpand(conflict.id)}
                                                                        >
                                                                                <div className="flex items-start gap-4">
                                                                                        {/* Severity Indicator */}
                                                                                        <div className={`w-1 h-16 rounded-full ${severityConfig.dot}`}></div>

                                                                                        {/* Main Content */}
                                                                                        <div className="flex-1">
                                                                                                <div className="flex items-center gap-3 mb-2">
                                                                                                        <span className={`px-2 py-1 rounded text-xs font-medium ${severityConfig.bg} ${severityConfig.text}`}>
                                                                                                                {severityConfig.label}
                                                                                                        </span>
                                                                                                        <span className="px-2 py-1 bg-gray-100 rounded text-xs text-gray-600">
                                                                                                                {getTypeLabel(conflict.tipo)}
                                                                                                        </span>
                                                                                                        <span className={`flex items-center gap-1 px-2 py-1 rounded text-xs ${statusConfig.bg} ${statusConfig.text}`}>
                                                                                                                <StatusIcon className="w-3 h-3" />
                                                                                                                {statusConfig.label}
                                                                                                        </span>
                                                                                                </div>

                                                                                                <h3 className="text-lg font-medium text-gray-900 mb-1">
                                                                                                        {conflict.descrizione}
                                                                                                </h3>

                                                                                                <div className="flex items-center gap-4 text-sm text-gray-500">
                                                                                                        <span className="flex items-center gap-1">
                                                                                                                <HiOutlineDocumentText className="w-4 h-4" />
                                                                                                                {conflict.diritto?.nome}
                                                                                                        </span>
                                                                                                        <span className="flex items-center gap-1">
                                                                                                                <HiOutlineCalendar className="w-4 h-4" />
                                                                                                                Rilevato: {formatDateTime(conflict.rilevato_il)}
                                                                                                        </span>
                                                                                                </div>
                                                                                        </div>

                                                                                        {/* Expand Icon */}
                                                                                        <div className="text-gray-400">
                                                                                                {isExpanded ? (
                                                                                                        <HiOutlineChevronUp className="w-5 h-5" />
                                                                                                ) : (
                                                                                                        <HiOutlineChevronDown className="w-5 h-5" />
                                                                                                )}
                                                                                        </div>
                                                                                </div>
                                                                        </div>

                                                                        {/* Expanded Details */}
                                                                        {isExpanded && (
                                                                                <div className="px-5 pb-5 pt-0 border-t border-gray-100">
                                                                                        <div className="pt-5">
                                                                                                {/* Sponsors Involved */}
                                                                                                <div className="grid grid-cols-2 gap-6 mb-6">
                                                                                                        <div className="bg-gray-50 rounded-xl p-4">
                                                                                                                <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
                                                                                                                        <HiOutlineUserGroup className="w-4 h-4" />
                                                                                                                        Sponsor 1
                                                                                                                </div>
                                                                                                                <p className="font-medium text-gray-900">{conflict.sponsor1?.nome}</p>
                                                                                                                <p className="text-sm text-gray-500">{conflict.sponsor1?.settore}</p>
                                                                                                                <div className="mt-3 pt-3 border-t border-gray-200">
                                                                                                                        <p className="text-xs text-gray-500">Periodo allocazione:</p>
                                                                                                                        <p className="text-sm text-gray-700">
                                                                                                                                {formatDate(conflict.allocazione1?.data_inizio)} - {formatDate(conflict.allocazione1?.data_fine)}
                                                                                                                        </p>
                                                                                                                </div>
                                                                                                        </div>

                                                                                                        <div className="bg-gray-50 rounded-xl p-4">
                                                                                                                <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
                                                                                                                        <HiOutlineUserGroup className="w-4 h-4" />
                                                                                                                        Sponsor 2
                                                                                                                </div>
                                                                                                                <p className="font-medium text-gray-900">{conflict.sponsor2?.nome}</p>
                                                                                                                <p className="text-sm text-gray-500">{conflict.sponsor2?.settore}</p>
                                                                                                                <div className="mt-3 pt-3 border-t border-gray-200">
                                                                                                                        <p className="text-xs text-gray-500">Periodo allocazione:</p>
                                                                                                                        <p className="text-sm text-gray-700">
                                                                                                                                {formatDate(conflict.allocazione2?.data_inizio)} - {formatDate(conflict.allocazione2?.data_fine)}
                                                                                                                        </p>
                                                                                                                </div>
                                                                                                        </div>
                                                                                                </div>

                                                                                                {/* Overlap Period */}
                                                                                                <div className="bg-red-50 rounded-xl p-4 mb-6">
                                                                                                        <div className="flex items-center gap-2 text-sm text-red-600 mb-2">
                                                                                                                <HiOutlineExclamationTriangle className="w-4 h-4" />
                                                                                                                Periodo di Sovrapposizione
                                                                                                        </div>
                                                                                                        <p className="font-medium text-red-700">
                                                                                                                {formatDate(conflict.periodo_sovrapposizione?.inizio)}
                                                                                                                {' '}<HiOutlineArrowRight className="inline w-4 h-4" />{' '}
                                                                                                                {formatDate(conflict.periodo_sovrapposizione?.fine)}
                                                                                                        </p>
                                                                                                </div>

                                                                                                {/* Notes (if any) */}
                                                                                                {conflict.note && (
                                                                                                        <div className="bg-blue-50 rounded-xl p-4 mb-6">
                                                                                                                <p className="text-sm text-blue-600 mb-1">Note:</p>
                                                                                                                <p className="text-blue-800">{conflict.note}</p>
                                                                                                        </div>
                                                                                                )}

                                                                                                {/* Actions */}
                                                                                                {conflict.stato === 'attivo' && (
                                                                                                        <div className="flex items-center gap-3">
                                                                                                                <button
                                                                                                                        onClick={(e) => {
                                                                                                                                e.stopPropagation();
                                                                                                                                navigate(`/club/rights/${conflict.diritto?.id}`);
                                                                                                                        }}
                                                                                                                        className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-700"
                                                                                                                >
                                                                                                                        <HiOutlineEye className="w-4 h-4" />
                                                                                                                        Visualizza Diritto
                                                                                                                </button>

                                                                                                                <button
                                                                                                                        onClick={(e) => {
                                                                                                                                e.stopPropagation();
                                                                                                                                handleResolve(conflict.id, 'risolto');
                                                                                                                        }}
                                                                                                                        disabled={resolving === conflict.id}
                                                                                                                        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                                                                                                                >
                                                                                                                        <HiOutlineCheckCircle className="w-4 h-4" />
                                                                                                                        Segna come Risolto
                                                                                                                </button>

                                                                                                                <button
                                                                                                                        onClick={(e) => {
                                                                                                                                e.stopPropagation();
                                                                                                                                handleResolve(conflict.id, 'ignorato');
                                                                                                                        }}
                                                                                                                        disabled={resolving === conflict.id}
                                                                                                                        className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-600 disabled:opacity-50"
                                                                                                                >
                                                                                                                        <HiOutlineXCircle className="w-4 h-4" />
                                                                                                                        Ignora
                                                                                                                </button>
                                                                                                        </div>
                                                                                                )}

                                                                                                {conflict.stato === 'risolto' && conflict.risolto_il && (
                                                                                                        <p className="text-sm text-green-600">
                                                                                                                Risolto il {formatDateTime(conflict.risolto_il)}
                                                                                                        </p>
                                                                                                )}
                                                                                        </div>
                                                                                </div>
                                                                        )}
                                                                </div>
                                                        );
                                                })
                                        )}
                                </div>
                        </div>
                </div>
        );
};

export default RightsConflicts;
