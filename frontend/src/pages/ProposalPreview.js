import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
        HiOutlineArrowLeft,
        HiOutlineArrowDownTray,
        HiOutlinePaperAirplane,
        HiOutlineLink,
        HiOutlinePencil,
        HiOutlineCheckCircle,
        HiOutlineClock,
        HiOutlineGlobeAlt,
        HiOutlinePhone,
        HiOutlineEnvelope,
        HiOutlineCalendar,
        HiOutlineCurrencyEuro,
        HiOutlineShieldCheck,
        HiOutlineStar
} from 'react-icons/hi2';

const ProposalPreview = () => {
        const navigate = useNavigate();
        const { id } = useParams();
        const [proposal, setProposal] = useState(null);
        const [loading, setLoading] = useState(true);
        const [club, setClub] = useState(null);

        useEffect(() => {
                fetchProposal();
        }, [id]);

        const fetchProposal = async () => {
                setLoading(true);
                try {
                        const token = localStorage.getItem('club_token');
                        const response = await fetch(`/api/club/proposals/${id}`, {
                                headers: { 'Authorization': `Bearer ${token}` }
                        });

                        if (response.ok) {
                                const data = await response.json();
                                setProposal(data);
                        } else {
                                setProposal(getDemoProposal());
                        }

                        // Fetch club profile
                        const clubRes = await fetch('/api/club/profile', {
                                headers: { 'Authorization': `Bearer ${token}` }
                        });
                        if (clubRes.ok) {
                                setClub(await clubRes.json());
                        }
                } catch (error) {
                        console.error('Error:', error);
                        setProposal(getDemoProposal());
                }
                setLoading(false);
        };

        const getDemoProposal = () => ({
                id: 1,
                codice: 'PROP-2024-001',
                titolo: 'Partnership Premium',
                sottotitolo: 'Stagione 2024/25',
                destinatario_azienda: 'Coca-Cola Italia',
                destinatario_nome: 'Marco Rossi',
                destinatario_ruolo: 'Marketing Director',
                destinatario_email: 'marco.rossi@coca-cola.it',
                settore_merceologico: 'Bevande',
                messaggio_introduttivo: 'Gentile Marco,\n\nSiamo lieti di presentarvi questa proposta di partnership esclusiva per la stagione 2024/25. Il nostro club rappresenta una delle realtà più dinamiche e seguite del panorama calcistico italiano, con una fanbase in costante crescita e un engagement digitale tra i più alti della Serie A.',
                proposta_valore: 'Con questa partnership, Coca-Cola Italia avrà accesso a:\n\n• Visibilità premium durante tutte le partite casalinghe\n• Esclusività nel settore bevande\n• Contenuti digitali dedicati sui nostri canali social\n• Accesso VIP alle nostre strutture hospitality\n• Attivazioni esclusive con i nostri atleti',
                termini_condizioni: 'La presente proposta ha validità 30 giorni dalla data di invio. I termini economici sono da intendersi al netto di IVA. Il pagamento potrà essere effettuato in unica soluzione o in rate concordate.',
                valore_finale: 350000,
                sconto_percentuale: 10,
                durata_mesi: 12,
                stagioni: '2024/25',
                giorni_validita: 30,
                data_scadenza: '2024-06-20',
                colore_primario: '#1A1A1A',
                colore_secondario: '#85FF00',
                items: [
                        {
                                id: 1,
                                nome_display: 'LED Bordocampo Primo Anello',
                                descrizione_display: 'Spazio LED premium primo anello - 20 secondi per partita',
                                gruppo: 'Visibilità Stadio',
                                quantita: 19,
                                prezzo_unitario: 2500,
                                valore_totale: 47500,
                                selezionato: true
                        },
                        {
                                id: 2,
                                nome_display: 'Backdrop Conferenze Stampa',
                                descrizione_display: 'Logo su backdrop conferenze stampa pre e post partita',
                                gruppo: 'Visibilità Stadio',
                                quantita: 1,
                                prezzo_unitario: 25000,
                                valore_totale: 25000,
                                selezionato: true
                        },
                        {
                                id: 3,
                                nome_display: 'Pacchetto Social Premium',
                                descrizione_display: '20 post Instagram + 40 stories + 10 reel dedicati',
                                gruppo: 'Digital',
                                quantita: 1,
                                prezzo_unitario: 45000,
                                valore_totale: 45000,
                                selezionato: true
                        },
                        {
                                id: 4,
                                nome_display: 'Business Lounge Stagionale',
                                descrizione_display: 'Accesso Business Lounge 10 posti per tutta la stagione',
                                gruppo: 'Hospitality',
                                quantita: 1,
                                prezzo_unitario: 80000,
                                valore_totale: 80000,
                                selezionato: true
                        },
                        {
                                id: 5,
                                nome_display: 'Esclusiva Settore Bevande',
                                descrizione_display: 'Esclusività categoria merceologica bevande analcoliche',
                                gruppo: 'Diritti Esclusivi',
                                quantita: 1,
                                prezzo_unitario: 150000,
                                valore_totale: 150000,
                                esclusivo: true,
                                selezionato: true
                        }
                ]
        });

        const formatCurrency = (value) => {
                return new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(value || 0);
        };

        const formatDate = (dateStr) => {
                if (!dateStr) return '-';
                return new Date(dateStr).toLocaleDateString('it-IT', { day: '2-digit', month: 'long', year: 'numeric' });
        };

        const handleCopyLink = () => {
                const link = `${window.location.origin}/p/${proposal.link_condivisione}`;
                navigator.clipboard.writeText(link);
        };

        const groupedItems = proposal?.items?.reduce((groups, item) => {
                if (!item.selezionato) return groups;
                const group = item.gruppo || 'Altro';
                if (!groups[group]) groups[group] = [];
                groups[group].push(item);
                return groups;
        }, {}) || {};

        const calculateSubtotal = () => {
                return proposal?.items?.reduce((sum, item) => sum + (item.selezionato ? (item.valore_totale || 0) : 0), 0) || 0;
        };

        if (loading) {
                return (
                        <div className="min-h-screen bg-gray-100 flex items-center justify-center">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#85FF00]"></div>
                        </div>
                );
        }

        if (!proposal) {
                return (
                        <div className="min-h-screen bg-gray-100 flex items-center justify-center">
                                <p className="text-gray-500">Proposta non trovata</p>
                        </div>
                );
        }

        const subtotal = calculateSubtotal();
        const discount = subtotal * ((proposal.sconto_percentuale || 0) / 100);
        const total = subtotal - discount;

        return (
                <div className="min-h-screen bg-gray-100">
                        {/* Toolbar */}
                        <div className="bg-white border-b border-gray-200 sticky top-0 z-50">
                                <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                                <button
                                                        onClick={() => navigate(`/club/proposals/${id}/edit`)}
                                                        className="p-2 hover:bg-gray-100 rounded-lg"
                                                >
                                                        <HiOutlineArrowLeft className="w-5 h-5" />
                                                </button>
                                                <div>
                                                        <p className="text-sm text-gray-500">Anteprima</p>
                                                        <p className="font-medium text-gray-900">{proposal.codice}</p>
                                                </div>
                                        </div>

                                        <div className="flex items-center gap-3">
                                                <button
                                                        onClick={() => navigate(`/club/proposals/${id}/edit`)}
                                                        className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50"
                                                >
                                                        <HiOutlinePencil className="w-4 h-4" />
                                                        Modifica
                                                </button>
                                                <button
                                                        onClick={handleCopyLink}
                                                        className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50"
                                                >
                                                        <HiOutlineLink className="w-4 h-4" />
                                                        Copia link
                                                </button>
                                                <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50">
                                                        <HiOutlineArrowDownTray className="w-4 h-4" />
                                                        Scarica PDF
                                                </button>
                                                <button className="flex items-center gap-2 px-5 py-2 bg-[#85FF00] text-black rounded-lg font-medium hover:bg-[#9fff33]">
                                                        <HiOutlinePaperAirplane className="w-4 h-4" />
                                                        Invia
                                                </button>
                                        </div>
                                </div>
                        </div>

                        {/* Preview Container */}
                        <div className="max-w-4xl mx-auto py-8 px-6">
                                <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
                                        {/* Cover */}
                                        <div
                                                className="relative h-80 flex items-center justify-center"
                                                style={{ backgroundColor: proposal.colore_primario || '#1A1A1A' }}
                                        >
                                                <div className="absolute inset-0 opacity-10">
                                                        <div className="absolute inset-0" style={{
                                                                backgroundImage: `radial-gradient(circle at 1px 1px, ${proposal.colore_secondario || '#85FF00'} 1px, transparent 0)`,
                                                                backgroundSize: '40px 40px'
                                                        }}></div>
                                                </div>

                                                <div className="relative text-center text-white px-8">
                                                        {club?.logo_url && (
                                                                <img src={club.logo_url} alt={club.nome} className="h-20 mx-auto mb-6 object-contain" />
                                                        )}
                                                        <h1 className="text-4xl font-bold mb-2">{proposal.titolo}</h1>
                                                        {proposal.sottotitolo && (
                                                                <p className="text-xl text-gray-300">{proposal.sottotitolo}</p>
                                                        )}
                                                        <div className="mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-full" style={{ backgroundColor: proposal.colore_secondario || '#85FF00' }}>
                                                                <span className="text-black font-semibold">{proposal.destinatario_azienda}</span>
                                                        </div>
                                                </div>
                                        </div>

                                        {/* Content */}
                                        <div className="p-10">
                                                {/* Intro */}
                                                <div className="mb-10">
                                                        <div className="flex items-center gap-2 mb-4">
                                                                <div className="w-1 h-6 rounded-full" style={{ backgroundColor: proposal.colore_secondario || '#85FF00' }}></div>
                                                                <h2 className="text-xl font-semibold text-gray-900">Gentile {proposal.destinatario_nome}</h2>
                                                        </div>
                                                        <div className="prose prose-gray max-w-none">
                                                                {proposal.messaggio_introduttivo?.split('\n').map((paragraph, i) => (
                                                                        <p key={i} className="text-gray-600 leading-relaxed">{paragraph}</p>
                                                                ))}
                                                        </div>
                                                </div>

                                                {/* Value Proposition */}
                                                {proposal.proposta_valore && (
                                                        <div className="mb-10 p-6 rounded-xl" style={{ backgroundColor: `${proposal.colore_secondario}15` || '#85FF0015' }}>
                                                                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                                                        <HiOutlineStar className="w-5 h-5" style={{ color: proposal.colore_secondario || '#85FF00' }} />
                                                                        I Vantaggi della Partnership
                                                                </h3>
                                                                <div className="prose prose-gray max-w-none">
                                                                        {proposal.proposta_valore?.split('\n').map((line, i) => (
                                                                                <p key={i} className="text-gray-600">{line}</p>
                                                                        ))}
                                                                </div>
                                                        </div>
                                                )}

                                                {/* Items by Group */}
                                                <div className="mb-10">
                                                        <h2 className="text-xl font-semibold text-gray-900 mb-6">Dettaglio Offerta</h2>

                                                        {Object.entries(groupedItems).map(([group, items]) => (
                                                                <div key={group} className="mb-6">
                                                                        <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">{group}</h3>
                                                                        <div className="border border-gray-200 rounded-xl overflow-hidden">
                                                                                <table className="w-full">
                                                                                        <tbody className="divide-y divide-gray-100">
                                                                                                {items.map(item => (
                                                                                                        <tr key={item.id}>
                                                                                                                <td className="px-5 py-4">
                                                                                                                        <div className="flex items-start gap-3">
                                                                                                                                {item.esclusivo && (
                                                                                                                                        <span className="mt-1">
                                                                                                                                                <HiOutlineShieldCheck className="w-5 h-5 text-purple-500" />
                                                                                                                                        </span>
                                                                                                                                )}
                                                                                                                                <div>
                                                                                                                                        <p className="font-medium text-gray-900">{item.nome_display}</p>
                                                                                                                                        <p className="text-sm text-gray-500">{item.descrizione_display}</p>
                                                                                                                                </div>
                                                                                                                        </div>
                                                                                                                </td>
                                                                                                                <td className="px-5 py-4 text-right text-gray-500">
                                                                                                                        x{item.quantita}
                                                                                                                </td>
                                                                                                                <td className="px-5 py-4 text-right font-semibold text-gray-900">
                                                                                                                        {formatCurrency(item.valore_totale)}
                                                                                                                </td>
                                                                                                        </tr>
                                                                                                ))}
                                                                                        </tbody>
                                                                                </table>
                                                                        </div>
                                                                </div>
                                                        ))}
                                                </div>

                                                {/* Pricing Summary */}
                                                <div className="mb-10 p-6 rounded-xl" style={{ backgroundColor: proposal.colore_primario || '#1A1A1A' }}>
                                                        <div className="space-y-3 text-white">
                                                                <div className="flex justify-between text-gray-400">
                                                                        <span>Subtotale</span>
                                                                        <span>{formatCurrency(subtotal)}</span>
                                                                </div>
                                                                {discount > 0 && (
                                                                        <div className="flex justify-between" style={{ color: proposal.colore_secondario || '#85FF00' }}>
                                                                                <span>Sconto ({proposal.sconto_percentuale}%)</span>
                                                                                <span>- {formatCurrency(discount)}</span>
                                                                        </div>
                                                                )}
                                                                <div className="flex justify-between text-2xl font-bold pt-4 border-t border-gray-700">
                                                                        <span>Totale Investimento</span>
                                                                        <span style={{ color: proposal.colore_secondario || '#85FF00' }}>{formatCurrency(total)}</span>
                                                                </div>
                                                        </div>
                                                </div>

                                                {/* Terms Grid */}
                                                <div className="grid grid-cols-3 gap-4 mb-10">
                                                        <div className="p-4 bg-gray-50 rounded-xl text-center">
                                                                <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center mx-auto mb-2 shadow-sm">
                                                                        <HiOutlineCalendar className="w-5 h-5 text-gray-600" />
                                                                </div>
                                                                <p className="text-sm text-gray-500">Durata</p>
                                                                <p className="font-semibold text-gray-900">{proposal.durata_mesi} mesi</p>
                                                        </div>
                                                        <div className="p-4 bg-gray-50 rounded-xl text-center">
                                                                <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center mx-auto mb-2 shadow-sm">
                                                                        <HiOutlineGlobeAlt className="w-5 h-5 text-gray-600" />
                                                                </div>
                                                                <p className="text-sm text-gray-500">Stagioni</p>
                                                                <p className="font-semibold text-gray-900">{proposal.stagioni || '-'}</p>
                                                        </div>
                                                        <div className="p-4 bg-gray-50 rounded-xl text-center">
                                                                <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center mx-auto mb-2 shadow-sm">
                                                                        <HiOutlineClock className="w-5 h-5 text-gray-600" />
                                                                </div>
                                                                <p className="text-sm text-gray-500">Validità proposta</p>
                                                                <p className="font-semibold text-gray-900">{formatDate(proposal.data_scadenza)}</p>
                                                        </div>
                                                </div>

                                                {/* Terms & Conditions */}
                                                {proposal.termini_condizioni && (
                                                        <div className="mb-10">
                                                                <h3 className="text-lg font-semibold text-gray-900 mb-3">Termini e Condizioni</h3>
                                                                <div className="prose prose-sm prose-gray max-w-none">
                                                                        {proposal.termini_condizioni.split('\n').map((line, i) => (
                                                                                <p key={i} className="text-gray-600">{line}</p>
                                                                        ))}
                                                                </div>
                                                        </div>
                                                )}

                                                {/* CTA */}
                                                <div className="text-center py-8 border-t border-gray-200">
                                                        <p className="text-gray-600 mb-4">Interessato a questa proposta?</p>
                                                        <button
                                                                className="inline-flex items-center gap-2 px-8 py-3 rounded-xl font-semibold text-lg transition-colors"
                                                                style={{
                                                                        backgroundColor: proposal.colore_secondario || '#85FF00',
                                                                        color: '#000'
                                                                }}
                                                        >
                                                                <HiOutlineCheckCircle className="w-5 h-5" />
                                                                Accetta Proposta
                                                        </button>
                                                </div>

                                                {/* Contact Footer */}
                                                <div className="mt-10 pt-8 border-t border-gray-200">
                                                        <div className="flex items-center justify-between">
                                                                <div className="flex items-center gap-4">
                                                                        {club?.logo_url && (
                                                                                <img src={club.logo_url} alt={club?.nome} className="h-12 object-contain" />
                                                                        )}
                                                                        <div>
                                                                                <p className="font-semibold text-gray-900">{club?.nome || 'Club'}</p>
                                                                                <p className="text-sm text-gray-500">Partnership & Sponsorship</p>
                                                                        </div>
                                                                </div>
                                                                <div className="flex items-center gap-6 text-sm text-gray-500">
                                                                        {club?.email && (
                                                                                <a href={`mailto:${club.email}`} className="flex items-center gap-2 hover:text-gray-700">
                                                                                        <HiOutlineEnvelope className="w-4 h-4" />
                                                                                        {club.email}
                                                                                </a>
                                                                        )}
                                                                        {club?.telefono && (
                                                                                <a href={`tel:${club.telefono}`} className="flex items-center gap-2 hover:text-gray-700">
                                                                                        <HiOutlinePhone className="w-4 h-4" />
                                                                                        {club.telefono}
                                                                                </a>
                                                                        )}
                                                                </div>
                                                        </div>
                                                </div>
                                        </div>
                                </div>

                                {/* Footer Note */}
                                <p className="text-center text-sm text-gray-400 mt-6">
                                        Proposta generata con Pitch Partner • {proposal.codice}
                                </p>
                        </div>
                </div>
        );
};

export default ProposalPreview;
