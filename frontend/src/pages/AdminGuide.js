import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import {
  HiOutlineBookOpen,
  HiOutlineChartBar,
  HiOutlineDocumentText,
  HiOutlineCurrencyEuro,
  HiOutlineUserGroup,
  HiOutlineCursorArrowRays,
  HiOutlineFlag,
  HiOutlineArrowRight,
  HiOutlineLightBulb,
  HiOutlineCheckCircle,
  HiOutlineInformationCircle,
  HiOutlineLink,
  HiOutlineCircleStack,
  HiOutlineArrowPath,
  HiOutlinePencil,
  HiOutlineCalculator
} from 'react-icons/hi2';

const AdminGuide = () => {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState('overview');

  const sections = [
    { id: 'overview', label: 'Panoramica', icon: HiOutlineBookOpen },
    { id: 'data-flow', label: 'Flusso Dati', icon: HiOutlineCircleStack },
    { id: 'obiettivi', label: 'Obiettivi 2026', icon: HiOutlineFlag },
    { id: 'andamento', label: 'Andamento KPI', icon: HiOutlineChartBar },
    { id: 'contratti', label: 'Contratti', icon: HiOutlineDocumentText },
    { id: 'finanze', label: 'Finanze', icon: HiOutlineCurrencyEuro },
    { id: 'leads', label: 'Lead CRM', icon: HiOutlineCursorArrowRays },
    { id: 'clubs', label: 'Club', icon: HiOutlineUserGroup },
  ];

  const DataFlowCard = ({ from, to, description, automatic = true }) => (
    <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-gray-900">{from}</span>
          <HiOutlineArrowRight className="w-4 h-4 text-gray-400" />
          <span className="font-semibold text-blue-600">{to}</span>
        </div>
        <p className="text-sm text-gray-600 mt-1">{description}</p>
      </div>
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
        automatic ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
      }`}>
        {automatic ? 'Automatico' : 'Manuale'}
      </span>
    </div>
  );

  const QuickLink = ({ path, label, icon: Icon }) => (
    <button
      onClick={() => navigate(path)}
      className="flex items-center gap-3 p-4 bg-white border border-gray-200 rounded-xl hover:border-blue-500 hover:shadow-md transition-all"
    >
      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
        <Icon className="w-5 h-5 text-blue-600" />
      </div>
      <span className="font-medium text-gray-900">{label}</span>
      <HiOutlineArrowRight className="w-4 h-4 text-gray-400 ml-auto" />
    </button>
  );

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 overflow-auto">
        <div className="p-8 max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center">
                <HiOutlineBookOpen className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Guida Pannello Admin</h1>
                <p className="text-gray-600">Come utilizzare il sistema di gestione Pitch Partner</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
            {sections.map(section => (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg whitespace-nowrap transition-all ${
                  activeSection === section.id
                    ? 'bg-gray-900 text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-100'
                }`}
              >
                <section.icon className="w-4 h-4" />
                {section.label}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="space-y-8">
            {/* OVERVIEW */}
            {activeSection === 'overview' && (
              <>
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-8 text-white">
                  <h2 className="text-2xl font-bold mb-4">Benvenuto nel Pannello di Amministrazione</h2>
                  <p className="text-blue-100 text-lg mb-6">
                    Questo pannello ti permette di gestire l'intera operatività di Pitch Partner:
                    lead, club, contratti, fatturazione e monitoraggio KPI. Tutti i dati sono
                    interconnessi e aggiornati in tempo reale.
                  </p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-white/10 rounded-xl p-4 text-center">
                      <HiOutlineCursorArrowRays className="w-8 h-8 mx-auto mb-2" />
                      <div className="font-semibold">Lead</div>
                      <div className="text-sm text-blue-200">Pipeline vendita</div>
                    </div>
                    <div className="bg-white/10 rounded-xl p-4 text-center">
                      <HiOutlineDocumentText className="w-8 h-8 mx-auto mb-2" />
                      <div className="font-semibold">Contratti</div>
                      <div className="text-sm text-blue-200">Gestione accordi</div>
                    </div>
                    <div className="bg-white/10 rounded-xl p-4 text-center">
                      <HiOutlineCurrencyEuro className="w-8 h-8 mx-auto mb-2" />
                      <div className="font-semibold">Finanze</div>
                      <div className="text-sm text-blue-200">Fatturazione</div>
                    </div>
                    <div className="bg-white/10 rounded-xl p-4 text-center">
                      <HiOutlineChartBar className="w-8 h-8 mx-auto mb-2" />
                      <div className="font-semibold">KPI</div>
                      <div className="text-sm text-blue-200">Andamento</div>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-6 border border-gray-200">
                  <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <HiOutlineLightBulb className="w-6 h-6 text-yellow-500" />
                    Principio Fondamentale
                  </h3>
                  <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-4">
                    <p className="text-yellow-800 font-medium">
                      Tutti i KPI di andamento (tranne Milestone e Credibilità) sono calcolati
                      AUTOMATICAMENTE dai dati inseriti in Lead, Contratti e Fatture.
                      Non serve inserire numeri manualmente!
                    </p>
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="p-4 bg-green-50 rounded-xl border border-green-200">
                      <div className="flex items-center gap-2 mb-2">
                        <HiOutlineArrowPath className="w-5 h-5 text-green-600" />
                        <span className="font-semibold text-green-800">Dati Automatici</span>
                      </div>
                      <ul className="text-sm text-green-700 space-y-1">
                        <li>• Funnel (Contatti, Demo, Proposte, Contratti)</li>
                        <li>• ARR e Revenue dai Contratti</li>
                        <li>• Cash-in dalle Fatture pagate</li>
                        <li>• Club per piano</li>
                        <li>• Conversion rate</li>
                      </ul>
                    </div>
                    <div className="p-4 bg-yellow-50 rounded-xl border border-yellow-200">
                      <div className="flex items-center gap-2 mb-2">
                        <HiOutlinePencil className="w-5 h-5 text-yellow-600" />
                        <span className="font-semibold text-yellow-800">Dati Manuali</span>
                      </div>
                      <ul className="text-sm text-yellow-700 space-y-1">
                        <li>• Milestone trimestrali</li>
                        <li>• KPI di Credibilità per investitori</li>
                        <li>• Note e commenti</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-6 border border-gray-200">
                  <h3 className="text-xl font-bold text-gray-900 mb-4">Accesso Rapido</h3>
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <QuickLink path="/admin/obiettivi-2026" label="Obiettivi 2026" icon={HiOutlineFlag} />
                    <QuickLink path="/admin/andamento" label="Andamento KPI" icon={HiOutlineChartBar} />
                    <QuickLink path="/admin/contratti" label="Gestione Contratti" icon={HiOutlineDocumentText} />
                    <QuickLink path="/admin/finanze" label="Fatturazione" icon={HiOutlineCurrencyEuro} />
                    <QuickLink path="/admin/leads" label="Lead CRM" icon={HiOutlineCursorArrowRays} />
                    <QuickLink path="/admin/clubs" label="Gestione Club" icon={HiOutlineUserGroup} />
                  </div>
                </div>
              </>
            )}

            {/* DATA FLOW */}
            {activeSection === 'data-flow' && (
              <>
                <div className="bg-white rounded-2xl p-6 border border-gray-200">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                    <HiOutlineCircleStack className="w-8 h-8 text-blue-600" />
                    Flusso dei Dati
                  </h2>

                  <div className="mb-8">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Schema di Integrazione</h3>
                    <div className="bg-gray-900 rounded-xl p-6 text-white font-mono text-sm overflow-x-auto">
                      <pre>{`
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│    LEAD     │───▶│  CONTRATTO  │───▶│   FATTURA   │───▶│   KPI       │
│   (CRM)     │    │   (Admin)   │    │   (Admin)   │    │ (Andamento) │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
      │                   │                  │                  │
      │                   │                  │                  │
      ▼                   ▼                  ▼                  ▼
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│  Funnel:    │    │  ARR:       │    │  Cash-in:   │    │  Dashboard: │
│  - Contatti │    │  - Per piano│    │  - Mensile  │    │  - Overview │
│  - Demo     │    │  - Add-ons  │    │  - YTD      │    │  - Progress │
│  - Proposte │    │  - Totale   │    │  - Pending  │    │  - Targets  │
│  - Vinti    │    │             │    │             │    │             │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
                      `}</pre>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Dettaglio Connessioni</h3>

                    <DataFlowCard
                      from="Lead Stage: contattato+"
                      to="KPI Contatti"
                      description="Tutti i lead che hanno raggiunto lo stage 'contattato' o successivi vengono contati come contatti qualificati"
                    />

                    <DataFlowCard
                      from="Lead Stage: demo+"
                      to="KPI Demo"
                      description="Lead in stage 'demo', 'proposta', 'negoziazione' o 'vinto' vengono contati come demo effettuate"
                    />

                    <DataFlowCard
                      from="Lead Stage: proposta+"
                      to="KPI Proposte"
                      description="Lead in stage 'proposta', 'negoziazione' o 'vinto' vengono contati come proposte inviate"
                    />

                    <DataFlowCard
                      from="Lead Stage: vinto"
                      to="KPI Contratti"
                      description="Lead convertiti (stage 'vinto') = contratti chiusi nel funnel"
                    />

                    <DataFlowCard
                      from="Contratti Attivi"
                      to="ARR Totale"
                      description="La somma del valore di tutti i contratti con status 'active' determina l'ARR"
                    />

                    <DataFlowCard
                      from="Contratti per Piano"
                      to="ARR per Piano"
                      description="Basic €10k, Premium €15k, Elite €25k - calcolato automaticamente dal tipo di piano nel contratto"
                    />

                    <DataFlowCard
                      from="Add-ons nei Contratti"
                      to="Revenue Add-on"
                      description="Setup €2.5k, Training €2k, Custom €5k - sommati da tutti i contratti attivi"
                    />

                    <DataFlowCard
                      from="Fatture Pagate"
                      to="Cash-in"
                      description="Le fatture con status 'paid' determinano il cash-in effettivo (mensile e annuale)"
                    />

                    <DataFlowCard
                      from="Club.nome_abbonamento"
                      to="Club per Piano"
                      description="Il campo nome_abbonamento del club determina in quale piano viene contato"
                    />

                    <DataFlowCard
                      from="Inserimento Manuale"
                      to="Milestone"
                      description="Le milestone trimestrali devono essere aggiornate manualmente dall'admin"
                      automatic={false}
                    />

                    <DataFlowCard
                      from="Inserimento Manuale"
                      to="Credibilità"
                      description="I KPI di credibilità per investitori devono essere aggiornati manualmente"
                      automatic={false}
                    />
                  </div>
                </div>
              </>
            )}

            {/* OBIETTIVI */}
            {activeSection === 'obiettivi' && (
              <div className="bg-white rounded-2xl p-6 border border-gray-200">
                <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                  <HiOutlineFlag className="w-8 h-8 text-red-600" />
                  Obiettivi 2026
                </h2>

                <div className="grid md:grid-cols-2 gap-6 mb-6">
                  <div className="bg-blue-50 rounded-xl p-5 border border-blue-200">
                    <h4 className="font-bold text-blue-900 mb-3">Target Annuali</h4>
                    <ul className="space-y-2 text-blue-800">
                      <li className="flex justify-between"><span>Club Totali:</span><strong>15</strong></li>
                      <li className="flex justify-between"><span>ARR Target:</span><strong>€225.000</strong></li>
                      <li className="flex justify-between"><span>Add-on Revenue:</span><strong>€70.000</strong></li>
                      <li className="flex justify-between"><span>Revenue Totale:</span><strong>€295.000</strong></li>
                    </ul>
                  </div>

                  <div className="bg-purple-50 rounded-xl p-5 border border-purple-200">
                    <h4 className="font-bold text-purple-900 mb-3">Mix Club per Piano</h4>
                    <ul className="space-y-2 text-purple-800">
                      <li className="flex justify-between"><span>Basic (€10k):</span><strong>6 club</strong></li>
                      <li className="flex justify-between"><span>Premium (€15k):</span><strong>6 club</strong></li>
                      <li className="flex justify-between"><span>Elite (€25k):</span><strong>3 club</strong></li>
                    </ul>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-xl p-5">
                  <h4 className="font-bold text-gray-900 mb-3">Funnel Target</h4>
                  <div className="grid grid-cols-4 gap-4 text-center">
                    <div className="bg-white rounded-lg p-3 border">
                      <div className="text-2xl font-bold text-gray-900">120</div>
                      <div className="text-sm text-gray-600">Contatti</div>
                    </div>
                    <div className="bg-white rounded-lg p-3 border">
                      <div className="text-2xl font-bold text-blue-600">45</div>
                      <div className="text-sm text-gray-600">Demo</div>
                    </div>
                    <div className="bg-white rounded-lg p-3 border">
                      <div className="text-2xl font-bold text-indigo-600">30</div>
                      <div className="text-sm text-gray-600">Proposte</div>
                    </div>
                    <div className="bg-white rounded-lg p-3 border">
                      <div className="text-2xl font-bold text-green-600">15</div>
                      <div className="text-sm text-gray-600">Contratti</div>
                    </div>
                  </div>
                </div>

                <div className="mt-6">
                  <QuickLink path="/admin/obiettivi-2026" label="Vai a Obiettivi 2026" icon={HiOutlineFlag} />
                </div>
              </div>
            )}

            {/* ANDAMENTO */}
            {activeSection === 'andamento' && (
              <div className="bg-white rounded-2xl p-6 border border-gray-200">
                <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                  <HiOutlineChartBar className="w-8 h-8 text-green-600" />
                  Andamento KPI
                </h2>

                <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6">
                  <div className="flex items-start gap-3">
                    <HiOutlineCheckCircle className="w-6 h-6 text-green-600 mt-0.5" />
                    <div>
                      <h4 className="font-bold text-green-800">Dati Automatici al 100%</h4>
                      <p className="text-green-700 text-sm">
                        La pagina Andamento mostra tutti i KPI calcolati automaticamente.
                        I dati si aggiornano in tempo reale quando modifichi Lead, Contratti o Fatture.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4 mb-6">
                  <h4 className="font-bold text-gray-900">Cosa visualizzi:</h4>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="p-4 bg-gray-50 rounded-xl">
                      <h5 className="font-semibold text-gray-900 mb-2">Overview</h5>
                      <ul className="text-sm text-gray-600 space-y-1">
                        <li>• Club attivi totali</li>
                        <li>• ARR attuale vs target</li>
                        <li>• Contratti chiusi YTD</li>
                        <li>• Progress bar verso obiettivi</li>
                      </ul>
                    </div>

                    <div className="p-4 bg-gray-50 rounded-xl">
                      <h5 className="font-semibold text-gray-900 mb-2">Funnel Vendita</h5>
                      <ul className="text-sm text-gray-600 space-y-1">
                        <li>• Visualizzazione a imbuto</li>
                        <li>• Conversion rate tra fasi</li>
                        <li>• Confronto con target</li>
                      </ul>
                    </div>

                    <div className="p-4 bg-gray-50 rounded-xl">
                      <h5 className="font-semibold text-gray-900 mb-2">Revenue</h5>
                      <ul className="text-sm text-gray-600 space-y-1">
                        <li>• ARR per piano</li>
                        <li>• Add-on revenue</li>
                        <li>• Cash-in mensile</li>
                      </ul>
                    </div>

                    <div className="p-4 bg-yellow-50 rounded-xl border border-yellow-200">
                      <h5 className="font-semibold text-yellow-900 mb-2">Sezioni Manuali</h5>
                      <ul className="text-sm text-yellow-700 space-y-1">
                        <li>• Milestone trimestrali</li>
                        <li>• KPI Credibilità</li>
                        <li>• Usa il pulsante "Modifica"</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="mt-6">
                  <QuickLink path="/admin/andamento" label="Vai ad Andamento" icon={HiOutlineChartBar} />
                </div>
              </div>
            )}

            {/* CONTRATTI */}
            {activeSection === 'contratti' && (
              <div className="bg-white rounded-2xl p-6 border border-gray-200">
                <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                  <HiOutlineDocumentText className="w-8 h-8 text-blue-600" />
                  Gestione Contratti
                </h2>

                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
                  <div className="flex items-start gap-3">
                    <HiOutlineInformationCircle className="w-6 h-6 text-blue-600 mt-0.5" />
                    <div>
                      <h4 className="font-bold text-blue-800">Perché usare i Contratti</h4>
                      <p className="text-blue-700 text-sm">
                        I contratti sono il cuore del calcolo ARR. Ogni contratto attivo contribuisce
                        all'ARR totale. Quando crei un contratto, l'ARR si aggiorna automaticamente nella dashboard.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4 mb-6">
                  <h4 className="font-bold text-gray-900">Come creare un Contratto:</h4>

                  <ol className="space-y-3">
                    <li className="flex gap-3">
                      <span className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">1</span>
                      <div>
                        <strong>Seleziona il Club</strong>
                        <p className="text-sm text-gray-600">Scegli tra i club senza contratto attivo</p>
                      </div>
                    </li>
                    <li className="flex gap-3">
                      <span className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">2</span>
                      <div>
                        <strong>Scegli il Piano</strong>
                        <p className="text-sm text-gray-600">Basic (€10k), Premium (€15k), Elite (€25k)</p>
                      </div>
                    </li>
                    <li className="flex gap-3">
                      <span className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">3</span>
                      <div>
                        <strong>Aggiungi Add-ons</strong>
                        <p className="text-sm text-gray-600">Setup (€2.5k), Training (€2k), Custom (€5k), ecc.</p>
                      </div>
                    </li>
                    <li className="flex gap-3">
                      <span className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">4</span>
                      <div>
                        <strong>Imposta Date e Termini</strong>
                        <p className="text-sm text-gray-600">Data inizio, fine, termini di pagamento</p>
                      </div>
                    </li>
                    <li className="flex gap-3">
                      <span className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">5</span>
                      <div>
                        <strong>Salva</strong>
                        <p className="text-sm text-gray-600">L'ARR si aggiorna automaticamente!</p>
                      </div>
                    </li>
                  </ol>
                </div>

                <div className="bg-gray-50 rounded-xl p-4 mb-6">
                  <h4 className="font-bold text-gray-900 mb-3">Piani e Prezzi</h4>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-white rounded-lg p-4 border text-center">
                      <div className="font-bold text-gray-900">Basic</div>
                      <div className="text-2xl font-bold text-gray-600">€10.000</div>
                      <div className="text-sm text-gray-500">/anno</div>
                    </div>
                    <div className="bg-white rounded-lg p-4 border-2 border-blue-500 text-center">
                      <div className="font-bold text-blue-600">Premium</div>
                      <div className="text-2xl font-bold text-blue-600">€15.000</div>
                      <div className="text-sm text-gray-500">/anno</div>
                    </div>
                    <div className="bg-white rounded-lg p-4 border-2 border-purple-500 text-center">
                      <div className="font-bold text-purple-600">Elite</div>
                      <div className="text-2xl font-bold text-purple-600">€25.000</div>
                      <div className="text-sm text-gray-500">/anno</div>
                    </div>
                  </div>
                </div>

                <div className="mt-6">
                  <QuickLink path="/admin/contratti" label="Vai a Contratti" icon={HiOutlineDocumentText} />
                </div>
              </div>
            )}

            {/* FINANZE */}
            {activeSection === 'finanze' && (
              <div className="bg-white rounded-2xl p-6 border border-gray-200">
                <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                  <HiOutlineCurrencyEuro className="w-8 h-8 text-green-600" />
                  Finanze e Fatturazione
                </h2>

                <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6">
                  <div className="flex items-start gap-3">
                    <HiOutlineCalculator className="w-6 h-6 text-green-600 mt-0.5" />
                    <div>
                      <h4 className="font-bold text-green-800">ARR vs Cash-in</h4>
                      <p className="text-green-700 text-sm">
                        <strong>ARR</strong> = valore dei contratti attivi (ricavo annuale ricorrente)<br/>
                        <strong>Cash-in</strong> = fatture effettivamente pagate (denaro incassato)
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4 mb-6">
                  <h4 className="font-bold text-gray-900">Flusso Fatturazione:</h4>

                  <ol className="space-y-3">
                    <li className="flex gap-3">
                      <span className="w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-bold">1</span>
                      <div>
                        <strong>Crea Fattura</strong>
                        <p className="text-sm text-gray-600">Seleziona il contratto e l'importo da fatturare</p>
                      </div>
                    </li>
                    <li className="flex gap-3">
                      <span className="w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-bold">2</span>
                      <div>
                        <strong>Invia al Club</strong>
                        <p className="text-sm text-gray-600">La fattura parte in stato "In Attesa"</p>
                      </div>
                    </li>
                    <li className="flex gap-3">
                      <span className="w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-bold">3</span>
                      <div>
                        <strong>Segna come Pagata</strong>
                        <p className="text-sm text-gray-600">Quando ricevi il pagamento, segna la fattura come "Pagata"</p>
                      </div>
                    </li>
                    <li className="flex gap-3">
                      <span className="w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-bold">4</span>
                      <div>
                        <strong>Cash-in Aggiornato</strong>
                        <p className="text-sm text-gray-600">Il cash-in nella dashboard si aggiorna automaticamente!</p>
                      </div>
                    </li>
                  </ol>
                </div>

                <div className="bg-gray-50 rounded-xl p-4 mb-6">
                  <h4 className="font-bold text-gray-900 mb-3">Dashboard Finanze</h4>
                  <ul className="space-y-2 text-gray-700">
                    <li>• <strong>ARR/MRR</strong> - Revenue ricorrente annuale e mensile</li>
                    <li>• <strong>Cash-in YTD</strong> - Totale incassato nell'anno</li>
                    <li>• <strong>Da Incassare</strong> - Fatture in attesa di pagamento</li>
                    <li>• <strong>Scadute</strong> - Fatture oltre la data di scadenza</li>
                    <li>• <strong>Grafico Mensile</strong> - Andamento cash-in mese per mese</li>
                  </ul>
                </div>

                <div className="mt-6">
                  <QuickLink path="/admin/finanze" label="Vai a Finanze" icon={HiOutlineCurrencyEuro} />
                </div>
              </div>
            )}

            {/* LEADS */}
            {activeSection === 'leads' && (
              <div className="bg-white rounded-2xl p-6 border border-gray-200">
                <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                  <HiOutlineCursorArrowRays className="w-8 h-8 text-orange-600" />
                  Lead CRM
                </h2>

                <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 mb-6">
                  <div className="flex items-start gap-3">
                    <HiOutlineLink className="w-6 h-6 text-orange-600 mt-0.5" />
                    <div>
                      <h4 className="font-bold text-orange-800">Collegamento con KPI</h4>
                      <p className="text-orange-700 text-sm">
                        Lo stage di ogni lead determina automaticamente i KPI del funnel.
                        Quando sposti un lead da uno stage all'altro, i KPI si aggiornano in tempo reale.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mb-6">
                  <h4 className="font-bold text-gray-900 mb-4">Pipeline Stages e KPI</h4>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2 p-3 bg-gray-100 rounded-lg">
                      <span className="w-3 h-3 bg-gray-400 rounded-full"></span>
                      <span className="font-medium">Nuovo</span>
                      <span className="text-sm text-gray-500 ml-auto">Non contato nei KPI</span>
                    </div>
                    <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg border-l-4 border-blue-500">
                      <span className="w-3 h-3 bg-blue-500 rounded-full"></span>
                      <span className="font-medium">Contattato</span>
                      <span className="text-sm text-blue-600 ml-auto">→ KPI Contatti</span>
                    </div>
                    <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg border-l-4 border-blue-500">
                      <span className="w-3 h-3 bg-blue-500 rounded-full"></span>
                      <span className="font-medium">Qualificato</span>
                      <span className="text-sm text-blue-600 ml-auto">→ KPI Contatti</span>
                    </div>
                    <div className="flex items-center gap-2 p-3 bg-indigo-50 rounded-lg border-l-4 border-indigo-500">
                      <span className="w-3 h-3 bg-indigo-500 rounded-full"></span>
                      <span className="font-medium">Demo</span>
                      <span className="text-sm text-indigo-600 ml-auto">→ KPI Demo</span>
                    </div>
                    <div className="flex items-center gap-2 p-3 bg-purple-50 rounded-lg border-l-4 border-purple-500">
                      <span className="w-3 h-3 bg-purple-500 rounded-full"></span>
                      <span className="font-medium">Proposta</span>
                      <span className="text-sm text-purple-600 ml-auto">→ KPI Proposte</span>
                    </div>
                    <div className="flex items-center gap-2 p-3 bg-purple-50 rounded-lg border-l-4 border-purple-500">
                      <span className="w-3 h-3 bg-purple-500 rounded-full"></span>
                      <span className="font-medium">Negoziazione</span>
                      <span className="text-sm text-purple-600 ml-auto">→ KPI Proposte</span>
                    </div>
                    <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg border-l-4 border-green-500">
                      <span className="w-3 h-3 bg-green-500 rounded-full"></span>
                      <span className="font-medium">Vinto</span>
                      <span className="text-sm text-green-600 ml-auto">→ KPI Contratti</span>
                    </div>
                    <div className="flex items-center gap-2 p-3 bg-red-50 rounded-lg border-l-4 border-red-500">
                      <span className="w-3 h-3 bg-red-500 rounded-full"></span>
                      <span className="font-medium">Perso</span>
                      <span className="text-sm text-red-600 ml-auto">Non contato nei KPI</span>
                    </div>
                  </div>
                </div>

                <div className="mt-6">
                  <QuickLink path="/admin/leads" label="Vai ai Lead" icon={HiOutlineCursorArrowRays} />
                </div>
              </div>
            )}

            {/* CLUBS */}
            {activeSection === 'clubs' && (
              <div className="bg-white rounded-2xl p-6 border border-gray-200">
                <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                  <HiOutlineUserGroup className="w-8 h-8 text-purple-600" />
                  Gestione Club
                </h2>

                <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 mb-6">
                  <div className="flex items-start gap-3">
                    <HiOutlineLink className="w-6 h-6 text-purple-600 mt-0.5" />
                    <div>
                      <h4 className="font-bold text-purple-800">Collegamento con Contratti</h4>
                      <p className="text-purple-700 text-sm">
                        Quando crei un contratto per un club, il campo "nome_abbonamento"
                        viene aggiornato automaticamente con il piano scelto.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4 mb-6">
                  <h4 className="font-bold text-gray-900">Il Club nel sistema:</h4>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="p-4 bg-gray-50 rounded-xl">
                      <h5 className="font-semibold text-gray-900 mb-2">Dati Club</h5>
                      <ul className="text-sm text-gray-600 space-y-1">
                        <li>• Nome e informazioni</li>
                        <li>• Piano abbonamento (nome_abbonamento)</li>
                        <li>• Stato attivazione</li>
                        <li>• Sponsor gestiti</li>
                      </ul>
                    </div>

                    <div className="p-4 bg-gray-50 rounded-xl">
                      <h5 className="font-semibold text-gray-900 mb-2">Collegato a</h5>
                      <ul className="text-sm text-gray-600 space-y-1">
                        <li>• Contratti Admin</li>
                        <li>• Fatture</li>
                        <li>• KPI "Club per Piano"</li>
                        <li>• Lead (quando vinto → Club)</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="mt-6">
                  <QuickLink path="/admin/clubs" label="Vai ai Club" icon={HiOutlineUserGroup} />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminGuide;
