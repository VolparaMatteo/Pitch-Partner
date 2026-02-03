import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  FaBook, FaSearch, FaBoxOpen, FaChevronRight, FaChevronDown,
  FaCube, FaTag, FaFilter, FaEye, FaEdit, FaArchive, FaTrash,
  FaPlus, FaList, FaTh, FaCalendar, FaHistory, FaLayerGroup,
  FaChartPie, FaCog, FaLightbulb, FaExclamationCircle, FaCheckCircle,
  FaArrowLeft, FaHome, FaClipboardList, FaUsers, FaFileContract,
  FaBullseye, FaRocket, FaStar, FaQuestion
} from 'react-icons/fa';
import '../styles/template-style.css';

// Documentation structure
const docsStructure = [
  {
    id: 'getting-started',
    title: 'Inizia',
    icon: FaRocket,
    articles: [
      { id: 'welcome', title: 'Benvenuto in Pitch Partner' },
      { id: 'quick-start', title: 'Guida Rapida' },
    ]
  },
  {
    id: 'inventory',
    title: 'Inventario',
    icon: FaBoxOpen,
    articles: [
      { id: 'inventory-overview', title: 'Panoramica Inventario' },
      { id: 'inventory-catalog', title: 'Catalogo Asset e Diritti' },
      { id: 'inventory-asset-form', title: 'Creazione Asset' },
      { id: 'inventory-calendar', title: 'Calendario Disponibilità' },
      { id: 'inventory-allocations', title: 'Storico Allocazioni' },
      { id: 'inventory-packages', title: 'Package Sponsorizzazione' },
      { id: 'inventory-categories', title: 'Gestione Categorie' },
      { id: 'inventory-filters', title: 'Filtri e Ricerca' },
      { id: 'inventory-archive', title: 'Archiviazione Asset e Diritti' },
    ]
  },
  {
    id: 'sponsors',
    title: 'Sponsor',
    icon: FaUsers,
    articles: [
      { id: 'sponsors-overview', title: 'Panoramica Sponsor' },
    ]
  },
  {
    id: 'contracts',
    title: 'Contratti',
    icon: FaFileContract,
    articles: [
      { id: 'contracts-overview', title: 'Panoramica Contratti' },
    ]
  },
  {
    id: 'leads',
    title: 'Lead Management',
    icon: FaBullseye,
    articles: [
      { id: 'leads-overview', title: 'Panoramica Lead' },
      { id: 'leads-pipeline', title: 'Pipeline Lead' },
      { id: 'leads-creation', title: 'Creazione Lead' },
      { id: 'leads-activities', title: 'Gestione Attività' },
      { id: 'leads-conversion', title: 'Conversione in Sponsor' },
    ]
  },
  {
    id: 'proposals',
    title: 'Proposte Commerciali',
    icon: FaFileContract,
    articles: [
      { id: 'proposals-overview', title: 'Panoramica Proposte' },
      { id: 'proposals-builder', title: 'Proposal Builder' },
      { id: 'proposals-tracking', title: 'Monitoraggio Proposte' },
      { id: 'proposals-templates', title: 'Template Proposte' },
    ]
  },
];

// Article content
const articleContent = {
  'welcome': {
    title: 'Benvenuto in Pitch Partner',
    description: 'La piattaforma completa per la gestione delle sponsorizzazioni sportive',
    content: (
      <>
        <p>
          <strong>Pitch Partner</strong> è la soluzione all-in-one per club sportivi che vogliono
          gestire in modo professionale le proprie sponsorizzazioni, gli asset, i contratti e le
          relazioni con gli sponsor.
        </p>

        <div className="docs-callout docs-callout-info">
          <FaLightbulb />
          <div>
            <strong>Suggerimento</strong>
            <p>Usa il menu laterale per navigare tra le diverse sezioni della documentazione.</p>
          </div>
        </div>

        <h3>Funzionalità Principali</h3>
        <ul>
          <li><strong>Inventario Asset e Diritti</strong> - Gestisci tutti gli spazi, le opportunità e i diritti di sponsorizzazione</li>
          <li><strong>Gestione Sponsor</strong> - CRM completo per i tuoi sponsor</li>
          <li><strong>Contratti</strong> - Crea e monitora i contratti di sponsorizzazione</li>
          <li><strong>Lead Management</strong> - Traccia i potenziali sponsor</li>
          <li><strong>Analytics</strong> - Dashboard e report dettagliati</li>
        </ul>
      </>
    )
  },
  'quick-start': {
    title: 'Guida Rapida',
    description: 'Inizia subito con Pitch Partner in pochi semplici passi',
    content: (
      <>
        <h3>1. Configura il tuo Inventario</h3>
        <p>
          Il primo passo è creare il catalogo dei tuoi asset e diritti. Vai alla sezione
          <strong> Inventario</strong> e crea le categorie, gli asset e i diritti disponibili per la sponsorizzazione.
        </p>

        <h3>2. Aggiungi i tuoi Sponsor</h3>
        <p>
          Nella sezione <strong>Sponsor</strong> puoi aggiungere tutti i tuoi sponsor attuali
          e potenziali, con informazioni di contatto e storico delle interazioni.
        </p>

        <h3>3. Crea i Contratti</h3>
        <p>
          Collega sponsor e asset attraverso i <strong>Contratti</strong>, definendo
          durata, valore e condizioni della sponsorizzazione.
        </p>

        <div className="docs-callout docs-callout-success">
          <FaCheckCircle />
          <div>
            <strong>Pronto!</strong>
            <p>Una volta completati questi passi, avrai una visione completa delle tue sponsorizzazioni.</p>
          </div>
        </div>
      </>
    )
  },
  'inventory-overview': {
    title: 'Panoramica Inventario',
    description: 'Scopri come funziona il modulo Inventario di Pitch Partner',
    content: (
      <>
        <p>
          Il modulo <strong>Inventario</strong> è il cuore della gestione degli asset e dei diritti di sponsorizzazione.
          Ti permette di catalogare, organizzare e monitorare tutti gli spazi, le opportunità e i diritti
          che puoi offrire agli sponsor.
        </p>

        <h3>Cosa sono gli Asset?</h3>
        <p>
          Gli <strong>asset</strong> sono tutti gli elementi fisici, digitali ed esperienziali che puoi offrire in sponsorizzazione:
        </p>
        <ul>
          <li><strong>Spazi fisici</strong> - LED boards, cartelloni, bandiere, striscioni</li>
          <li><strong>Abbigliamento</strong> - Posizioni sulla maglia, kit di allenamento</li>
          <li><strong>Digital</strong> - Banner sul sito, post social media, newsletter</li>
          <li><strong>Esperienze</strong> - Hospitality, meet & greet, eventi esclusivi</li>
        </ul>

        <h3>Cosa sono i Diritti?</h3>
        <p>
          I <strong>diritti</strong> sono opportunità immateriali legate al brand del club:
        </p>
        <ul>
          <li><strong>Esclusività di settore</strong> - Diritto esclusivo per una categoria merceologica</li>
          <li><strong>Diritti di immagine</strong> - Utilizzo immagini giocatori per campagne pubblicitarie</li>
          <li><strong>Naming Rights</strong> - Diritto di denominazione di strutture (stadio, centro sportivo)</li>
          <li><strong>Licenze</strong> - Diritto di produrre merchandise con il brand del club</li>
        </ul>

        <h3>Struttura del Modulo</h3>
        <p>Il modulo Inventario è composto da diverse sezioni:</p>

        <div className="docs-feature-grid">
          <div className="docs-feature-card">
            <FaBoxOpen className="docs-feature-icon" />
            <h4>Catalogo</h4>
            <p>Visualizza e gestisci asset e diritti</p>
          </div>
          <div className="docs-feature-card">
            <FaLayerGroup className="docs-feature-icon" />
            <h4>Packages</h4>
            <p>Crea pacchetti combinati</p>
          </div>
          <div className="docs-feature-card">
            <FaCalendar className="docs-feature-icon" />
            <h4>Calendario</h4>
            <p>Visualizza disponibilità nel tempo</p>
          </div>
          <div className="docs-feature-card">
            <FaHistory className="docs-feature-icon" />
            <h4>Allocazioni</h4>
            <p>Storico delle assegnazioni</p>
          </div>
        </div>
      </>
    )
  },
  'inventory-catalog': {
    title: 'Catalogo Asset e Diritti',
    description: 'Guida completa alla gestione del catalogo degli asset e dei diritti',
    content: (
      <>
        <p>
          Il <strong>Catalogo</strong> è la pagina principale per visualizzare e gestire
          tutti gli asset e i diritti del tuo inventario. Da qui puoi creare, modificare, archiviare
          ed eliminare ogni elemento.
        </p>

        <h3>Interfaccia della Pagina</h3>

        <h4>Header e Azioni Rapide</h4>
        <p>
          Nella parte superiore trovi il titolo della pagina e i pulsanti per le azioni rapide:
        </p>
        <ul>
          <li><strong>Confronta</strong> - Confronta più asset e diritti tra loro</li>
          <li><strong>Calendario</strong> - Visualizza la disponibilità nel tempo</li>
          <li><strong>Allocazioni</strong> - Consulta lo storico delle assegnazioni</li>
          <li><strong>Packages</strong> - Gestisci i pacchetti di asset e diritti</li>
          <li><strong>Archivio</strong> - Visualizza gli elementi archiviati</li>
          <li><strong>Nuovo Asset</strong> - Crea un nuovo asset o diritto</li>
        </ul>

        <h4>Statistiche</h4>
        <p>
          Le card statistiche mostrano una panoramica del tuo inventario:
        </p>
        <div className="docs-stats-example">
          <div className="docs-stat">
            <FaCube />
            <span>Asset Totali</span>
          </div>
          <div className="docs-stat">
            <FaCheckCircle />
            <span>Disponibili</span>
          </div>
          <div className="docs-stat">
            <span>€</span>
            <span>Valore Catalogo</span>
          </div>
          <div className="docs-stat">
            <FaChartPie />
            <span>Tasso Occupazione</span>
          </div>
        </div>

        <h4>Filtro Categorie</h4>
        <p>
          Sotto le statistiche trovi i chip delle categorie. Clicca su una categoria
          per filtrare gli asset. Il pulsante "Gestisci Categorie" apre il pannello
          per creare e modificare le categorie.
        </p>

        <h4>Barra dei Filtri</h4>
        <p>La barra dei filtri permette di:</p>
        <ul>
          <li><strong>Cercare</strong> - Cerca per nome, codice o posizione</li>
          <li><strong>Filtrare per Tipo</strong> - Fisico, Digitale, Esperienza, Diritto, Misto</li>
          <li><strong>Filtrare per Disponibilità</strong> - Disponibili o Non disponibili</li>
          <li><strong>Filtrare per Prezzo</strong> - Fasce di prezzo</li>
          <li><strong>Ordinare</strong> - Per nome, prezzo o categoria</li>
          <li><strong>Cambiare Vista</strong> - Lista o Griglia</li>
        </ul>

        <div className="docs-callout docs-callout-info">
          <FaLightbulb />
          <div>
            <strong>Suggerimento</strong>
            <p>I filtri attivi sono evidenziati con un bordo verde. Puoi combinare più filtri per ricerche precise.</p>
          </div>
        </div>

        <h4>Elenco Asset e Diritti</h4>
        <p>
          Gli asset e i diritti possono essere visualizzati in due modalità:
        </p>
        <ul>
          <li><strong>Vista Lista</strong> - Tabella dettagliata con tutte le informazioni</li>
          <li><strong>Vista Griglia</strong> - Card con immagine e informazioni principali</li>
        </ul>

        <h4>Azioni sugli Elementi</h4>
        <p>Per ogni asset o diritto sono disponibili le seguenti azioni:</p>
        <div className="docs-actions-list">
          <div className="docs-action-item">
            <FaEye className="action-icon view" />
            <div>
              <strong>Visualizza</strong>
              <p>Apre la pagina di dettaglio dell'elemento</p>
            </div>
          </div>
          <div className="docs-action-item">
            <FaEdit className="action-icon edit" />
            <div>
              <strong>Modifica</strong>
              <p>Apre il form di modifica dell'elemento</p>
            </div>
          </div>
          <div className="docs-action-item">
            <FaArchive className="action-icon archive" />
            <div>
              <strong>Archivia</strong>
              <p>Sposta l'elemento nell'archivio (conserva i dati)</p>
            </div>
          </div>
          <div className="docs-action-item">
            <FaTrash className="action-icon delete" />
            <div>
              <strong>Elimina</strong>
              <p>Elimina permanentemente l'elemento</p>
            </div>
          </div>
        </div>

        <div className="docs-callout docs-callout-warning">
          <FaExclamationCircle />
          <div>
            <strong>Attenzione</strong>
            <p>L'eliminazione è permanente. Se vuoi conservare i dati per consultazioni future, usa l'archiviazione.</p>
          </div>
        </div>
      </>
    )
  },
  'inventory-asset-form': {
    title: 'Creazione e Modifica Asset',
    description: 'Guida completa al wizard di creazione e modifica degli asset',
    content: (
      <>
        <p>
          Il <strong>form di creazione asset</strong> ti permette di aggiungere nuovi asset al tuo inventario
          attraverso un wizard guidato in 5 step. Lo stesso form viene utilizzato per modificare asset esistenti.
        </p>

        <h3>Panoramica del Wizard</h3>
        <p>Il processo di creazione è diviso in 5 step sequenziali:</p>

        <div className="docs-feature-grid">
          <div className="docs-feature-card">
            <span style={{ fontSize: '24px', marginBottom: '12px', display: 'block' }}>1️⃣</span>
            <h4>Informazioni Base</h4>
            <p>Categoria, codice, nome, tipo e descrizioni</p>
          </div>
          <div className="docs-feature-card">
            <span style={{ fontSize: '24px', marginBottom: '12px', display: 'block' }}>2️⃣</span>
            <h4>Dettagli Tecnici</h4>
            <p>Posizione, dimensioni, specifiche e tags</p>
          </div>
          <div className="docs-feature-card">
            <span style={{ fontSize: '24px', marginBottom: '12px', display: 'block' }}>3️⃣</span>
            <h4>Pricing</h4>
            <p>Prezzo listino, floor e pricing dinamico</p>
          </div>
          <div className="docs-feature-card">
            <span style={{ fontSize: '24px', marginBottom: '12px', display: 'block' }}>4️⃣</span>
            <h4>Media</h4>
            <p>Immagine principale e galleria</p>
          </div>
        </div>

        <div className="docs-callout docs-callout-info">
          <FaLightbulb />
          <div>
            <strong>Navigazione Flessibile</strong>
            <p>Puoi tornare agli step precedenti in qualsiasi momento cliccando sui numeri dello step o usando il pulsante "Indietro".</p>
          </div>
        </div>

        <h3>Step 1: Informazioni Base</h3>
        <p>In questo step inserisci le informazioni fondamentali dell'asset:</p>

        <h4>Categoria Asset</h4>
        <p>
          Seleziona la categoria dal menu a tendina. Se non trovi la categoria adatta,
          puoi crearne una nuova direttamente dal menu cliccando su <strong>"Crea nuova categoria"</strong>.
        </p>

        <h4>Codice Asset</h4>
        <p>
          Il codice è un identificativo univoco per l'asset. Usa una convenzione chiara:
        </p>
        <ul>
          <li><strong>LED-001</strong> - Per LED boards</li>
          <li><strong>JER-FRONT</strong> - Per posizioni sulla maglia</li>
          <li><strong>HOS-VIP01</strong> - Per pacchetti hospitality</li>
          <li><strong>DIG-BANNER</strong> - Per asset digitali</li>
        </ul>

        <h4>Quantità Totale</h4>
        <p>
          Indica quante unità di questo asset sono disponibili. Per asset unici (es. una specifica posizione LED)
          usa 1. Per asset multipli (es. bandierine) puoi indicare il numero disponibile.
        </p>

        <h4>Tipo di Asset</h4>
        <table className="docs-table">
          <thead>
            <tr>
              <th>Tipo</th>
              <th>Descrizione</th>
              <th>Esempi</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>Fisico</strong></td>
              <td>Asset tangibili nello stadio</td>
              <td>LED boards, banner, cartelloni</td>
            </tr>
            <tr>
              <td><strong>Digitale</strong></td>
              <td>Asset online e digitali</td>
              <td>Banner sito, post social, app</td>
            </tr>
            <tr>
              <td><strong>Esperienza</strong></td>
              <td>Servizi ed esperienze VIP</td>
              <td>Hospitality, meet & greet, tour</td>
            </tr>
            <tr>
              <td><strong>Diritto</strong></td>
              <td>Diritti immateriali legati al brand</td>
              <td>Esclusività settore, naming rights, immagine</td>
            </tr>
            <tr>
              <td><strong>Misto</strong></td>
              <td>Combinazione di più tipologie</td>
              <td>Pacchetti integrati</td>
            </tr>
          </tbody>
        </table>

        <h4>Descrizioni</h4>
        <ul>
          <li><strong>Descrizione Breve</strong> - Max 150 caratteri, visibile nel catalogo</li>
          <li><strong>Descrizione Completa</strong> - Dettagli approfonditi per gli sponsor</li>
        </ul>

        <h3>Step 2: Dettagli e Specifiche</h3>
        <p>In questo step aggiungi i dettagli tecnici dell'asset:</p>

        <h4>Posizione e Dimensioni</h4>
        <ul>
          <li><strong>Posizione</strong> - Dove si trova l'asset (es. "Tribuna Centrale", "Lato Campo Est")</li>
          <li><strong>Dimensioni</strong> - Formato fisico o digitale (es. "6m x 1m", "300x250px")</li>
        </ul>

        <h4>Specifiche Tecniche</h4>
        <p>
          In base al tipo di asset selezionato, il sistema suggerisce le specifiche più rilevanti.
          Clicca su un suggerimento per aggiungerlo automaticamente.
        </p>

        <div className="docs-callout docs-callout-info">
          <FaLightbulb />
          <div>
            <strong>Suggerimenti per Tipo</strong>
            <ul style={{ margin: '8px 0 0', paddingLeft: '20px' }}>
              <li><strong>Fisico:</strong> Larghezza, Altezza, Materiale, Peso, Illuminazione</li>
              <li><strong>Digitale:</strong> Risoluzione, Formato, Durata Spot, Impression/mese</li>
              <li><strong>Esperienza:</strong> Capacità, Durata, Servizi Inclusi, Catering</li>
              <li><strong>Diritto:</strong> Durata, Esclusività, Territorio, Limitazioni d'uso</li>
            </ul>
          </div>
        </div>

        <h4>Tags</h4>
        <p>
          Aggiungi tags separati da virgole per facilitare la ricerca
          (es. "premium, tribuna, alta visibilità, europee").
        </p>

        <h3>Step 3: Pricing e Listino</h3>
        <p>Configura i prezzi dell'asset:</p>

        <h4>Prezzo di Listino</h4>
        <p>
          Il prezzo di listino è il valore ufficiale dell'asset. Questo prezzo viene mostrato
          agli sponsor nel catalogo e nelle proposte commerciali.
        </p>

        <h4>Prezzo Minimo (Floor)</h4>
        <p>
          Il prezzo floor è il valore minimo accettabile durante le trattative.
          È visibile solo al tuo team e ti aiuta a non scendere sotto una soglia critica.
        </p>

        <h4>Pricing Dinamico per Evento</h4>
        <p>
          Puoi creare tier di prezzo differenziati per tipo di evento:
        </p>
        <ul>
          <li><strong>Derby</strong> - Partite ad alta affluenza</li>
          <li><strong>Champions League</strong> - Competizioni europee</li>
          <li><strong>Eventi Speciali</strong> - Finali, inaugurazioni</li>
        </ul>
        <p>
          Per ogni tier specifica nome, codice, prezzo e durata (per partita, mese, stagione o anno).
        </p>

        <div className="docs-callout docs-callout-success">
          <FaCheckCircle />
          <div>
            <strong>Best Practice</strong>
            <p>Il pricing dinamico può aumentare significativamente il valore degli asset nelle occasioni speciali. Gli sponsor premium sono spesso disposti a pagare di più per eventi ad alta visibilità.</p>
          </div>
        </div>

        <h3>Step 4: Immagini e Media</h3>
        <p>Carica le immagini dell'asset:</p>

        <h4>Immagine Principale</h4>
        <p>
          L'immagine principale è quella che appare nel catalogo e nelle anteprime.
          Puoi caricarla in due modi:
        </p>
        <ul>
          <li><strong>Drag & Drop</strong> - Trascina l'immagine nell'area di upload</li>
          <li><strong>URL</strong> - Inserisci il link diretto all'immagine</li>
        </ul>
        <p>Formati supportati: PNG, JPG, WebP. Dimensione massima: 5MB.</p>

        <h4>Galleria Immagini</h4>
        <p>
          Aggiungi ulteriori immagini per mostrare l'asset da diverse angolazioni,
          durante eventi, o con sponsor precedenti (con autorizzazione).
        </p>

        <div className="docs-callout docs-callout-info">
          <FaLightbulb />
          <div>
            <strong>Consigli per le Immagini</strong>
            <ul style={{ margin: '8px 0 0', paddingLeft: '20px' }}>
              <li>Usa foto ad alta risoluzione (min. 1920x1080)</li>
              <li>Mostra l'asset nel contesto dello stadio</li>
              <li>Includi immagini diurne e notturne se applicabile</li>
              <li>Aggiungi mockup con loghi sponsor di esempio</li>
            </ul>
          </div>
        </div>

        <h3>Step 5: Opzioni e Restrizioni</h3>
        <p>Nell'ultimo step configuri le opzioni avanzate:</p>

        <h4>Disponibilità</h4>
        <p>
          Attiva o disattiva la disponibilità dell'asset. Un asset non disponibile
          non appare nelle ricerche degli sponsor ma rimane nel tuo catalogo.
        </p>

        <h4>Categorie Merceologiche Escluse</h4>
        <p>
          Se hai accordi di esclusività con sponsor, puoi escludere intere categorie merceologiche.
          Ad esempio, se hai un'esclusiva con Coca-Cola, puoi escludere "Bevande" per evitare
          che competitor possano acquistare questo asset.
        </p>
        <p>Categorie disponibili:</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', margin: '12px 0 24px' }}>
          {['Bevande', 'Automotive', 'Technology', 'Banking', 'Food', 'Fashion', 'Telecom', 'Energy'].map(cat => (
            <span key={cat} style={{
              padding: '6px 12px',
              background: '#F3F4F6',
              borderRadius: '20px',
              fontSize: '13px',
              color: '#4B5563'
            }}>{cat}</span>
          ))}
        </div>

        <h4>Note Interne</h4>
        <p>
          Aggiungi note visibili solo al tuo team: condizioni speciali, contatti tecnici,
          requisiti di installazione, o qualsiasi altra informazione riservata.
        </p>

        <h4>Riepilogo</h4>
        <p>
          Prima del salvataggio, il sistema mostra un riepilogo dell'asset con nome, codice,
          prezzo e status. Verifica che tutto sia corretto prima di confermare.
        </p>

        <div className="docs-callout docs-callout-warning">
          <FaExclamationCircle />
          <div>
            <strong>Conferma Obbligatoria</strong>
            <p>Prima del salvataggio definitivo, apparirà un modal di conferma con il riepilogo dell'asset. Questo previene errori accidentali.</p>
          </div>
        </div>

        <h3>Modifica di un Asset Esistente</h3>
        <p>
          Per modificare un asset esistente, vai al Catalogo Asset, trova l'asset e clicca
          sull'icona di modifica. Il form si aprirà pre-compilato con tutti i dati esistenti.
        </p>
        <p>
          Quando modifichi un asset, tutte le allocazioni e i contratti esistenti non vengono
          influenzati dalle modifiche ai dati di base.
        </p>
      </>
    )
  },
  'inventory-calendar': {
    title: 'Calendario Disponibilità',
    description: 'Visualizza e gestisci le allocazioni degli asset nel tempo',
    content: (
      <>
        <p>
          Il <strong>Calendario Disponibilità</strong> offre una vista timeline di tutte le allocazioni
          dei tuoi asset, permettendoti di vedere a colpo d'occhio quali asset sono occupati,
          per quanto tempo, e da quali sponsor.
        </p>

        <h3>Accesso al Calendario</h3>
        <p>
          Puoi accedere al calendario dalla pagina del Catalogo Asset cliccando sul pulsante
          <strong> "Calendario"</strong> nella barra degli strumenti, oppure dal menu laterale
          sotto la sezione Inventario.
        </p>

        <h3>Visualizzazioni Disponibili</h3>
        <p>Il calendario offre tre diverse viste temporali:</p>

        <table className="docs-table">
          <thead>
            <tr>
              <th>Vista</th>
              <th>Periodo</th>
              <th>Utilizzo Consigliato</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>Mese</strong></td>
              <td>30 giorni</td>
              <td>Pianificazione a breve termine</td>
            </tr>
            <tr>
              <td><strong>Anno</strong></td>
              <td>12 mesi solari</td>
              <td>Vista annuale standard</td>
            </tr>
            <tr>
              <td><strong>Stagione</strong></td>
              <td>Luglio - Giugno</td>
              <td>Allineato alla stagione sportiva</td>
            </tr>
          </tbody>
        </table>

        <h3>Leggere la Timeline</h3>
        <p>
          Ogni riga della timeline rappresenta un asset. Le allocazioni attive sono mostrate
          come barre colorate che indicano il periodo di occupazione.
        </p>

        <div className="docs-callout docs-callout-info">
          <FaLightbulb />
          <div>
            <strong>Colori delle Barre</strong>
            <ul style={{ margin: '8px 0 0', paddingLeft: '20px' }}>
              <li><strong>Verde (#85FF00):</strong> Allocazione attiva</li>
              <li><strong>Grigio:</strong> Allocazione conclusa</li>
              <li><strong>Arancione:</strong> Periodo bloccato/riservato</li>
            </ul>
          </div>
        </div>

        <h3>Filtrare gli Asset</h3>
        <p>Puoi filtrare la vista del calendario in diversi modi:</p>
        <ul>
          <li><strong>Ricerca:</strong> Cerca per nome o codice asset</li>
          <li><strong>Categoria:</strong> Usa il menu a tendina o i chip rapidi</li>
        </ul>

        <h3>Dettaglio Asset</h3>
        <p>
          Clicca su qualsiasi riga per aprire il modal di dettaglio dell'asset, dove puoi vedere:
        </p>
        <ul>
          <li>Informazioni dell'asset (categoria, prezzo, disponibilità)</li>
          <li>Lista delle allocazioni attive con sponsor e importi</li>
          <li>Azioni rapide: Dettaglio, Blocca Date, Nuova Allocazione</li>
        </ul>

        <h3>Bloccare Date</h3>
        <p>
          La funzione <strong>"Blocca Date"</strong> ti permette di rendere un asset non disponibile
          per un periodo specifico. Utile per:
        </p>
        <ul>
          <li><strong>Manutenzione:</strong> Lavori programmati sull'asset</li>
          <li><strong>Eventi Speciali:</strong> Riservato per usi interni</li>
          <li><strong>Negoziazione:</strong> In trattativa con uno sponsor</li>
          <li><strong>Riserva Interna:</strong> Tenuto per uso del club</li>
        </ul>

        <div className="docs-callout docs-callout-warning">
          <FaExclamationCircle />
          <div>
            <strong>Attenzione</strong>
            <p>Quando blocchi delle date, l'asset non sarà disponibile per nuove allocazioni in quel periodo. Le allocazioni esistenti non vengono modificate.</p>
          </div>
        </div>

        <h3>Navigazione Temporale</h3>
        <p>Usa i controlli nella toolbar per navigare:</p>
        <ul>
          <li><strong>Frecce:</strong> Periodo precedente/successivo</li>
          <li><strong>Oggi:</strong> Torna al periodo corrente</li>
          <li><strong>Toggle Vista:</strong> Cambia tra Mese, Anno e Stagione</li>
        </ul>

        <h3>Statistiche</h3>
        <p>
          Nella parte superiore della pagina trovi le metriche chiave:
        </p>
        <ul>
          <li><strong>Asset Totali:</strong> Numero totale di asset</li>
          <li><strong>Disponibili:</strong> Asset con unità disponibili</li>
          <li><strong>Valore Allocazioni:</strong> Somma dei contratti attivi</li>
          <li><strong>Tasso Occupazione:</strong> Percentuale di asset completamente allocati</li>
        </ul>
      </>
    )
  },
  'inventory-allocations': {
    title: 'Storico Allocazioni',
    description: 'Visualizza e gestisci lo storico delle allocazioni degli asset',
    content: (
      <>
        <p>
          La pagina <strong>Storico Allocazioni</strong> mostra tutte le allocazioni degli asset,
          raggruppate per asset. Qui puoi monitorare i contratti attivi, analizzare le variazioni
          di prezzo nel tempo e gestire le relazioni con gli sponsor.
        </p>

        <h3>Struttura della Pagina</h3>
        <p>
          Le allocazioni sono organizzate per asset, permettendoti di vedere facilmente
          lo storico completo di ogni asset sponsorizzato.
        </p>

        <h3>Filtri Disponibili</h3>
        <p>Puoi filtrare le allocazioni usando diversi criteri:</p>
        <ul>
          <li><strong>Ricerca:</strong> Cerca per nome asset o sponsor</li>
          <li><strong>Stato:</strong> Attive, Concluse, Annullate</li>
          <li><strong>Asset:</strong> Filtra per asset specifico</li>
          <li><strong>Sponsor:</strong> Filtra per sponsor</li>
          <li><strong>Stagione:</strong> Filtra per stagione sportiva</li>
        </ul>

        <h3>Stati delle Allocazioni</h3>
        <table className="docs-table">
          <thead>
            <tr>
              <th>Stato</th>
              <th>Descrizione</th>
              <th>Colore</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>Attiva</strong></td>
              <td>Allocazione in corso</td>
              <td>Verde</td>
            </tr>
            <tr>
              <td><strong>Conclusa</strong></td>
              <td>Allocazione terminata regolarmente</td>
              <td>Grigio</td>
            </tr>
            <tr>
              <td><strong>Annullata</strong></td>
              <td>Allocazione cancellata prima della scadenza</td>
              <td>Rosso</td>
            </tr>
          </tbody>
        </table>

        <h3>Dettagli Allocazione</h3>
        <p>
          Clicca su un'allocazione per espandere i dettagli. Vedrai:
        </p>
        <ul>
          <li><strong>Stagione:</strong> Periodo di riferimento</li>
          <li><strong>Quantità:</strong> Numero di unità allocate</li>
          <li><strong>Data creazione:</strong> Quando è stata registrata</li>
          <li><strong>Durata:</strong> Durata totale in mesi</li>
          <li><strong>Note:</strong> Eventuali annotazioni</li>
        </ul>

        <h3>Variazione di Prezzo</h3>
        <p>
          Per ogni allocazione viene mostrata la variazione percentuale rispetto
          all'allocazione precedente dello stesso asset:
        </p>
        <ul>
          <li><strong>Freccia verde:</strong> Aumento di prezzo rispetto alla precedente</li>
          <li><strong>Freccia rossa:</strong> Diminuzione di prezzo</li>
        </ul>

        <div className="docs-callout docs-callout-info">
          <FaLightbulb />
          <div>
            <strong>Analisi Trend</strong>
            <p>Monitora le variazioni di prezzo per capire l'andamento del valore dei tuoi asset nel tempo e ottimizzare le trattative future.</p>
          </div>
        </div>

        <h3>Creare una Nuova Allocazione</h3>
        <p>
          Clicca su <strong>"Nuova Allocazione"</strong> per registrare un nuovo contratto:
        </p>
        <ol>
          <li>Seleziona l'asset da allocare</li>
          <li>Scegli lo sponsor</li>
          <li>Definisci il periodo (data inizio e fine)</li>
          <li>Specifica quantità e prezzo concordato</li>
          <li>Aggiungi eventuali note</li>
        </ol>

        <h3>Statistiche</h3>
        <p>
          Nella parte superiore della pagina trovi le metriche chiave:
        </p>
        <ul>
          <li><strong>Allocazioni Totali:</strong> Numero totale di allocazioni</li>
          <li><strong>Attive:</strong> Allocazioni attualmente in corso</li>
          <li><strong>Valore Attivo:</strong> Somma dei contratti attivi</li>
          <li><strong>Durata Media:</strong> Durata media delle allocazioni in mesi</li>
        </ul>
      </>
    )
  },
  'inventory-packages': {
    title: 'Package Sponsorizzazione',
    description: 'Crea e gestisci pacchetti di asset per offerte bundle complete',
    content: (
      <>
        <p>
          I <strong>Package Sponsorizzazione</strong> ti permettono di combinare più asset in offerte
          bundle complete per i tuoi sponsor. Questa funzionalità semplifica la vendita e permette
          di offrire sconti aggregati attraenti.
        </p>

        <h3>Perché Usare i Package</h3>
        <ul>
          <li><strong>Semplificazione vendita:</strong> Offri pacchetti completi invece di singoli asset</li>
          <li><strong>Sconti bundle:</strong> Proponi prezzi vantaggiosi per combinazioni di asset</li>
          <li><strong>Livelli di partnership:</strong> Differenzia le offerte per Main, Official, Premium e Standard Partner</li>
          <li><strong>Gestione centralizzata:</strong> Monitora vendite e disponibilità in un unico posto</li>
        </ul>

        <h3>Livelli di Package</h3>
        <table className="docs-table">
          <thead>
            <tr>
              <th>Livello</th>
              <th>Descrizione</th>
              <th>Target</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>Main Sponsor</strong></td>
              <td>Massima visibilità con posizioni premium</td>
              <td>Sponsor principale del club</td>
            </tr>
            <tr>
              <td><strong>Official Partner</strong></td>
              <td>Partner ufficiale con alta esposizione</td>
              <td>Sponsor di categoria</td>
            </tr>
            <tr>
              <td><strong>Premium Partner</strong></td>
              <td>Visibilità premium su asset selezionati</td>
              <td>Sponsor corporate</td>
            </tr>
            <tr>
              <td><strong>Standard Partner</strong></td>
              <td>Pacchetto base di ingresso</td>
              <td>PMI e nuovi sponsor</td>
            </tr>
          </tbody>
        </table>

        <h3>Creare un Nuovo Package</h3>
        <ol>
          <li>Clicca su <strong>"Nuovo Package"</strong></li>
          <li>Inserisci nome e codice identificativo</li>
          <li>Seleziona il livello di partnership</li>
          <li>Aggiungi una descrizione</li>
          <li>Imposta il prezzo di listino e l'eventuale prezzo scontato</li>
          <li>Seleziona gli asset da includere dalla lista disponibile</li>
          <li>Salva il package</li>
        </ol>

        <div className="docs-callout docs-callout-info">
          <FaLightbulb />
          <div>
            <strong>Suggerimento</strong>
            <p>Il sistema calcola automaticamente lo sconto percentuale confrontando il valore dei singoli asset con il prezzo del package.</p>
          </div>
        </div>

        <h3>Assegnare un Package</h3>
        <p>
          Per assegnare un package a uno sponsor, clicca sul pulsante <strong>"Assegna"</strong>
          nella card del package. Puoi scegliere tra:
        </p>
        <ul>
          <li><strong>Nuovo Sponsor:</strong> Seleziona uno sponsor esistente dal database</li>
          <li><strong>Contratto Esistente:</strong> Collega il package a un contratto già attivo</li>
        </ul>

        <h3>Gestione Disponibilità</h3>
        <p>
          Ogni package può avere un numero massimo di vendite. Il sistema mostra:
        </p>
        <ul>
          <li><strong>Vendite attuali:</strong> Quanti package sono già stati venduti</li>
          <li><strong>Max vendite:</strong> Limite massimo di vendite (o ∞ se illimitato)</li>
          <li><strong>Sold Out:</strong> Badge che appare quando il package è esaurito</li>
        </ul>

        <div className="docs-callout docs-callout-success">
          <FaCheckCircle />
          <div>
            <strong>Best Practice</strong>
            <p>Per i livelli Main Sponsor e Official Partner, limita le vendite a 1-2 per mantenere l'esclusività dell'offerta.</p>
          </div>
        </div>

        <h3>Statistiche Package</h3>
        <p>
          Nella parte superiore della pagina trovi le metriche chiave:
        </p>
        <ul>
          <li><strong>Package Totali:</strong> Numero di package creati</li>
          <li><strong>Package Venduti:</strong> Totale assegnazioni completate</li>
          <li><strong>Valore Venduto:</strong> Fatturato generato dai package</li>
          <li><strong>Sconto Medio:</strong> Percentuale media di sconto offerta</li>
        </ul>
      </>
    )
  },
  'inventory-categories': {
    title: 'Gestione Categorie',
    description: 'Come creare e organizzare le categorie degli asset',
    content: (
      <>
        <p>
          Le <strong>categorie</strong> ti permettono di organizzare gli asset in gruppi logici,
          facilitando la ricerca e la gestione del catalogo.
        </p>

        <h3>Accedere alla Gestione Categorie</h3>
        <p>
          Clicca sul pulsante <strong>"Gestisci Categorie"</strong> nella barra delle categorie
          per aprire il pannello di gestione.
        </p>

        <h3>Creare una Nuova Categoria</h3>
        <ol>
          <li>Inserisci il <strong>nome</strong> della categoria</li>
          <li>Seleziona un <strong>colore</strong> tra quelli disponibili</li>
          <li>Scegli un'<strong>icona</strong> rappresentativa</li>
          <li>Clicca su <strong>"Crea Categoria"</strong></li>
          <li>Conferma nel modal di conferma</li>
        </ol>

        <h3>Modificare una Categoria</h3>
        <p>
          Clicca sull'icona <FaEdit style={{ color: '#6B7280' }} /> accanto alla categoria
          che vuoi modificare. I campi si popoleranno con i dati attuali.
        </p>

        <h3>Eliminare una Categoria</h3>
        <p>
          Clicca sull'icona <FaTrash style={{ color: '#EF4444' }} /> per eliminare una categoria.
        </p>

        <div className="docs-callout docs-callout-warning">
          <FaExclamationCircle />
          <div>
            <strong>Nota</strong>
            <p>Se la categoria contiene asset, questi verranno spostati in una categoria predefinita.</p>
          </div>
        </div>

        <h3>Categorie Suggerite</h3>
        <p>Ecco alcune categorie comuni per un club sportivo:</p>
        <ul>
          <li><strong>LED Boards</strong> - Pannelli LED a bordo campo</li>
          <li><strong>Jersey & Kit</strong> - Posizioni su maglie e abbigliamento</li>
          <li><strong>Digital</strong> - Asset digitali (sito, social, app)</li>
          <li><strong>Hospitality</strong> - Esperienze VIP e hospitality</li>
          <li><strong>Broadcast</strong> - Visibilità TV e streaming</li>
          <li><strong>Naming Rights</strong> - Diritti di denominazione</li>
        </ul>
      </>
    )
  },
  'inventory-filters': {
    title: 'Filtri e Ricerca',
    description: 'Come trovare rapidamente gli asset nel catalogo',
    content: (
      <>
        <p>
          Il sistema di filtri ti permette di trovare rapidamente gli asset che cerchi,
          anche in cataloghi molto ampi.
        </p>

        <h3>Ricerca Testuale</h3>
        <p>
          La barra di ricerca cerca in tempo reale tra:
        </p>
        <ul>
          <li>Nome dell'asset</li>
          <li>Codice identificativo</li>
          <li>Posizione</li>
        </ul>

        <h3>Filtro per Tipo</h3>
        <table className="docs-table">
          <thead>
            <tr>
              <th>Tipo</th>
              <th>Descrizione</th>
              <th>Esempi</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>Fisico</strong></td>
              <td>Asset tangibili e fisici</td>
              <td>LED boards, bandiere, striscioni</td>
            </tr>
            <tr>
              <td><strong>Digitale</strong></td>
              <td>Asset online e digitali</td>
              <td>Banner sito, post social, newsletter</td>
            </tr>
            <tr>
              <td><strong>Esperienza</strong></td>
              <td>Servizi ed esperienze</td>
              <td>Hospitality, meet & greet, tour stadio</td>
            </tr>
            <tr>
              <td><strong>Misto</strong></td>
              <td>Combinazione di più tipi</td>
              <td>Pacchetti combinati</td>
            </tr>
          </tbody>
        </table>

        <h3>Filtro per Disponibilità</h3>
        <ul>
          <li><strong>Disponibili</strong> - Asset liberi per nuove sponsorizzazioni</li>
          <li><strong>Non disponibili</strong> - Asset già allocati a sponsor</li>
        </ul>

        <h3>Filtro per Prezzo</h3>
        <p>Filtra gli asset per fascia di prezzo di listino:</p>
        <ul>
          <li>Fino a €50.000</li>
          <li>€50.000 - €150.000</li>
          <li>€150.000 - €500.000</li>
          <li>Oltre €500.000</li>
        </ul>

        <h3>Ordinamento</h3>
        <p>Puoi ordinare gli asset per:</p>
        <ul>
          <li>Nome (A-Z o Z-A)</li>
          <li>Prezzo (crescente o decrescente)</li>
          <li>Categoria</li>
        </ul>

        <div className="docs-callout docs-callout-info">
          <FaLightbulb />
          <div>
            <strong>Suggerimento</strong>
            <p>Clicca su "Rimuovi tutti i filtri" per tornare alla visualizzazione completa del catalogo.</p>
          </div>
        </div>
      </>
    )
  },
  'inventory-archive': {
    title: 'Archiviazione Asset e Diritti',
    description: 'Come archiviare e ripristinare asset e diritti',
    content: (
      <>
        <p>
          L'<strong>archiviazione</strong> ti permette di rimuovere un asset o un diritto dal catalogo attivo
          mantenendo tutti i suoi dati per consultazioni future.
        </p>

        <h3>Quando Archiviare un Elemento</h3>
        <ul>
          <li>L'asset non è più disponibile (es. rimozione LED board)</li>
          <li>Un diritto è scaduto o non più in vendita</li>
          <li>Fine di un contratto di sponsorizzazione</li>
          <li>Ristrutturazione dello stadio</li>
          <li>Cambio di strategia commerciale</li>
        </ul>

        <h3>Archiviare un Asset o Diritto</h3>
        <ol>
          <li>Trova l'elemento nel catalogo</li>
          <li>Clicca sull'icona <FaArchive style={{ color: '#D97706' }} /> (Archivia)</li>
          <li>Opzionalmente, inserisci un motivo per l'archiviazione</li>
          <li>Conferma l'operazione</li>
        </ol>

        <h3>Visualizzare Elementi Archiviati</h3>
        <p>
          Clicca sul pulsante <strong>"Archivio"</strong> nell'header della pagina.
          La pagina mostrerà solo gli asset e i diritti archiviati con un banner giallo di avviso.
        </p>

        <h3>Ripristinare un Elemento</h3>
        <ol>
          <li>Vai nella sezione Archivio</li>
          <li>Trova l'asset o il diritto da ripristinare</li>
          <li>Clicca sull'icona <span style={{ color: '#059669' }}>↩</span> (Ripristina)</li>
          <li>L'elemento tornerà nel catalogo attivo</li>
        </ol>

        <div className="docs-callout docs-callout-success">
          <FaCheckCircle />
          <div>
            <strong>Vantaggi dell'Archiviazione</strong>
            <p>A differenza dell'eliminazione, l'archiviazione conserva tutto lo storico:
            allocazioni passate, pricing, immagini e documenti.</p>
          </div>
        </div>

        <h3>Archiviazione vs Eliminazione</h3>
        <table className="docs-table">
          <thead>
            <tr>
              <th>Azione</th>
              <th>Dati</th>
              <th>Reversibile</th>
              <th>Quando usare</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>Archivia</strong></td>
              <td>Conservati</td>
              <td>Sì</td>
              <td>Elemento temporaneamente non disponibile</td>
            </tr>
            <tr>
              <td><strong>Elimina</strong></td>
              <td>Persi</td>
              <td>No</td>
              <td>Elemento creato per errore</td>
            </tr>
          </tbody>
        </table>
      </>
    )
  },
  'sponsors-overview': {
    title: 'Panoramica Sponsor',
    description: 'Introduzione alla gestione degli sponsor',
    content: (
      <>
        <p>Documentazione in arrivo...</p>
      </>
    )
  },
  'contracts-overview': {
    title: 'Panoramica Contratti',
    description: 'Introduzione alla gestione dei contratti',
    content: (
      <>
        <p>Documentazione in arrivo...</p>
      </>
    )
  },
  'leads-overview': {
    title: 'Panoramica Lead Management',
    description: 'Introduzione completa alla gestione dei potenziali sponsor',
    content: (
      <>
        <p>
          Il modulo <strong>Lead Management</strong> è il cuore del processo di acquisizione
          di nuovi sponsor. Ti permette di tracciare, gestire e convertire potenziali clienti
          in sponsor attivi del tuo club.
        </p>

        <h3>Cos'è un Lead?</h3>
        <p>
          Un <strong>lead</strong> è un'azienda o contatto che ha mostrato interesse
          a diventare sponsor, ma non ha ancora firmato un contratto. Può provenire da:
        </p>
        <ul>
          <li><strong>Referral</strong> - Segnalazione da sponsor esistenti o partner</li>
          <li><strong>Eventi</strong> - Contatti raccolti durante eventi, fiere o presentazioni</li>
          <li><strong>Social Media</strong> - Interazioni sui canali social del club</li>
          <li><strong>Cold Call</strong> - Contatti proattivi da parte del team commerciale</li>
          <li><strong>Website</strong> - Richieste attraverso il sito web</li>
        </ul>

        <div className="docs-callout docs-callout-info">
          <FaLightbulb />
          <div>
            <strong>Best Practice</strong>
            <p>Registra immediatamente ogni potenziale contatto come lead, anche se le informazioni sono parziali. È meglio avere un lead incompleto che perdere un'opportunità.</p>
          </div>
        </div>

        <h3>Struttura del Modulo</h3>
        <p>Il Lead Management comprende:</p>

        <div className="docs-feature-grid">
          <div className="docs-feature-card">
            <FaList className="docs-feature-icon" />
            <h4>Pipeline Lead</h4>
            <p>Visualizza e gestisci tutti i lead per stato</p>
          </div>
          <div className="docs-feature-card">
            <FaPlus className="docs-feature-icon" />
            <h4>Creazione Lead</h4>
            <p>Wizard guidato per nuovi lead</p>
          </div>
          <div className="docs-feature-card">
            <FaHistory className="docs-feature-icon" />
            <h4>Timeline Attività</h4>
            <p>Storico interazioni e follow-up</p>
          </div>
          <div className="docs-feature-card">
            <FaCheckCircle className="docs-feature-icon" />
            <h4>Conversione</h4>
            <p>Trasforma lead in sponsor attivi</p>
          </div>
        </div>

        <h3>Stati del Lead</h3>
        <table className="docs-table">
          <thead>
            <tr>
              <th>Stato</th>
              <th>Descrizione</th>
              <th>Azione Consigliata</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>Nuovo</strong></td>
              <td>Lead appena inserito, da contattare</td>
              <td>Primo contatto entro 24-48h</td>
            </tr>
            <tr>
              <td><strong>Contattato</strong></td>
              <td>Primo contatto effettuato</td>
              <td>Qualificare interesse e budget</td>
            </tr>
            <tr>
              <td><strong>In Trattativa</strong></td>
              <td>Interesse confermato, discussione attiva</td>
              <td>Presentare proposte commerciali</td>
            </tr>
            <tr>
              <td><strong>Proposta Inviata</strong></td>
              <td>Proposta formale inviata</td>
              <td>Follow-up e negoziazione</td>
            </tr>
            <tr>
              <td><strong>Negoziazione</strong></td>
              <td>Trattativa finale in corso</td>
              <td>Chiudere termini e condizioni</td>
            </tr>
            <tr>
              <td><strong>Vinto</strong></td>
              <td>Lead convertito in sponsor</td>
              <td>Procedere con il contratto</td>
            </tr>
            <tr>
              <td><strong>Perso</strong></td>
              <td>Opportunità non conclusa</td>
              <td>Documentare motivo, mantenere contatto</td>
            </tr>
          </tbody>
        </table>

        <div className="docs-callout docs-callout-success">
          <FaCheckCircle />
          <div>
            <strong>Obiettivo del Lead Management</strong>
            <p>L'obiettivo è guidare ogni lead attraverso la pipeline fino alla conversione in sponsor, massimizzando il tasso di successo e il valore delle trattative.</p>
          </div>
        </div>
      </>
    )
  },
  'leads-pipeline': {
    title: 'Pipeline Lead',
    description: 'Guida alla visualizzazione e gestione della pipeline commerciale',
    content: (
      <>
        <p>
          La <strong>Pipeline Lead</strong> è la pagina principale per visualizzare e gestire
          tutti i potenziali sponsor. Offre una panoramica completa dello stato delle trattative.
        </p>

        <h3>Accesso alla Pipeline</h3>
        <p>
          Accedi alla Pipeline dalla sidebar cliccando su <strong>Acquisizione → Lead</strong>.
          La pagina mostra tutti i lead attivi con statistiche e filtri.
        </p>

        <h3>Statistiche in Tempo Reale</h3>
        <p>
          Nella parte superiore trovi le metriche chiave della tua pipeline:
        </p>
        <ul>
          <li><strong>Lead Totali</strong> - Numero totale di lead nel sistema</li>
          <li><strong>Valore Pipeline</strong> - Somma del valore stimato dei lead attivi</li>
          <li><strong>In Negoziazione</strong> - Lead in fase avanzata di trattativa</li>
          <li><strong>Tasso Conversione</strong> - Percentuale di lead convertiti in sponsor</li>
        </ul>

        <h3>Filtri della Pipeline</h3>
        <p>Puoi filtrare i lead per:</p>
        <ul>
          <li><strong>Status</strong> - Filtra per stato (Nuovo, Contattato, In Trattativa, etc.)</li>
          <li><strong>Fonte</strong> - Origine del lead (Referral, Evento, Social, etc.)</li>
          <li><strong>Priorità</strong> - Livello di priorità (Alta, Media, Bassa)</li>
          <li><strong>Ricerca</strong> - Cerca per nome azienda o referente</li>
        </ul>

        <div className="docs-callout docs-callout-info">
          <FaLightbulb />
          <div>
            <strong>Filtri Combinati</strong>
            <p>Combina più filtri per trovare lead specifici. Ad esempio, filtra per "In Trattativa" + "Priorità Alta" per concentrarti sulle opportunità più importanti.</p>
          </div>
        </div>

        <h3>Card Lead</h3>
        <p>
          Ogni lead è rappresentato da una card che mostra:
        </p>
        <ul>
          <li>Logo/Avatar dell'azienda</li>
          <li>Nome azienda e settore</li>
          <li>Status attuale con colore distintivo</li>
          <li>Valore stimato dell'opportunità</li>
          <li>Priorità e fonte</li>
          <li>Data ultimo contatto</li>
        </ul>

        <h3>Azioni Rapide</h3>
        <p>Per ogni lead puoi:</p>
        <div className="docs-actions-list">
          <div className="docs-action-item">
            <FaEye className="action-icon view" />
            <div>
              <strong>Visualizza Dettaglio</strong>
              <p>Apre la scheda completa del lead con timeline attività</p>
            </div>
          </div>
          <div className="docs-action-item">
            <FaEdit className="action-icon edit" />
            <div>
              <strong>Modifica</strong>
              <p>Aggiorna le informazioni del lead</p>
            </div>
          </div>
          <div className="docs-action-item">
            <FaTrash className="action-icon delete" />
            <div>
              <strong>Elimina</strong>
              <p>Rimuove il lead dal sistema (richiede conferma)</p>
            </div>
          </div>
        </div>

        <h3>Paginazione</h3>
        <p>
          Se hai molti lead, la lista è paginata per facilitare la navigazione.
          Usa i controlli in fondo alla pagina per spostarti tra le pagine.
        </p>
      </>
    )
  },
  'leads-creation': {
    title: 'Creazione Lead',
    description: 'Guida al wizard di creazione di un nuovo lead',
    content: (
      <>
        <p>
          Il <strong>wizard di creazione lead</strong> ti guida attraverso 4 step
          per registrare un nuovo potenziale sponsor nel sistema.
        </p>

        <h3>Step 1: Dati Aziendali</h3>
        <p>Inserisci le informazioni fondamentali dell'azienda:</p>
        <ul>
          <li><strong>Ragione Sociale</strong> - Nome ufficiale dell'azienda (obbligatorio)</li>
          <li><strong>Settore Merceologico</strong> - Categoria di business</li>
          <li><strong>Fonte del Lead</strong> - Come hai acquisito il contatto</li>
          <li><strong>Partita IVA / Codice Fiscale</strong> - Dati fiscali (opzionali)</li>
          <li><strong>Priorità</strong> - Livello di importanza (Bassa, Media, Alta)</li>
        </ul>

        <div className="docs-callout docs-callout-info">
          <FaLightbulb />
          <div>
            <strong>Indicatore Caratteri</strong>
            <p>Per P.IVA e Codice Fiscale, il sistema mostra un contatore che ti aiuta a inserire il numero corretto di caratteri.</p>
          </div>
        </div>

        <h3>Step 2: Informazioni di Contatto</h3>
        <p>Aggiungi i recapiti dell'azienda:</p>
        <ul>
          <li><strong>Email</strong> - Email principale di contatto</li>
          <li><strong>Telefono</strong> - Numero di telefono aziendale</li>
          <li><strong>Sito Web</strong> - URL del sito aziendale</li>
          <li><strong>Indirizzo Sede</strong> - Indirizzo completo della sede</li>
        </ul>

        <h3>Step 3: Referente Aziendale</h3>
        <p>Registra il contatto principale all'interno dell'azienda:</p>
        <ul>
          <li><strong>Nome e Cognome</strong> - Nome completo del referente</li>
          <li><strong>Ruolo</strong> - Posizione in azienda (es. Marketing Manager)</li>
          <li><strong>Contatto Diretto</strong> - Email o telefono personale</li>
        </ul>

        <div className="docs-callout docs-callout-success">
          <FaCheckCircle />
          <div>
            <strong>Importanza del Referente</strong>
            <p>Avere un contatto diretto con il decision maker accelera notevolmente il processo di chiusura della trattativa.</p>
          </div>
        </div>

        <h3>Step 4: Valutazione Opportunità</h3>
        <p>Valuta il potenziale dell'opportunità:</p>
        <ul>
          <li><strong>Valore Stimato</strong> - Budget previsto per la sponsorizzazione</li>
          <li><strong>Probabilità di Chiusura</strong> - Percentuale stimata di successo</li>
          <li><strong>Data Prossimo Contatto</strong> - Reminder per il follow-up</li>
          <li><strong>Note</strong> - Informazioni aggiuntive e contesto</li>
        </ul>

        <h4>Indicatore di Probabilità</h4>
        <p>
          Il sistema mostra una barra visiva colorata in base alla probabilità inserita:
        </p>
        <ul>
          <li><strong>Rosso (0-39%)</strong> - Bassa probabilità</li>
          <li><strong>Arancione (40-69%)</strong> - Probabilità media</li>
          <li><strong>Verde (70-100%)</strong> - Alta probabilità</li>
        </ul>

        <h3>Riepilogo e Conferma</h3>
        <p>
          Prima del salvataggio, il sistema mostra un riepilogo con:
        </p>
        <ul>
          <li>Nome azienda</li>
          <li>Valore stimato formattato</li>
          <li>Probabilità di chiusura</li>
        </ul>
        <p>
          Clicca su <strong>"Crea Lead"</strong> per confermare e salvare.
        </p>
      </>
    )
  },
  'leads-activities': {
    title: 'Gestione Attività',
    description: 'Come tracciare interazioni e follow-up con i lead',
    content: (
      <>
        <p>
          La <strong>Timeline Attività</strong> ti permette di registrare ogni interazione
          con un lead, creando uno storico completo delle comunicazioni.
        </p>

        <h3>Tipi di Attività</h3>
        <table className="docs-table">
          <thead>
            <tr>
              <th>Tipo</th>
              <th>Utilizzo</th>
              <th>Esempio</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>Chiamata</strong></td>
              <td>Conversazioni telefoniche</td>
              <td>Prima chiamata conoscitiva</td>
            </tr>
            <tr>
              <td><strong>Meeting</strong></td>
              <td>Incontri di persona o video</td>
              <td>Presentazione commerciale</td>
            </tr>
            <tr>
              <td><strong>Email</strong></td>
              <td>Comunicazioni via email</td>
              <td>Invio brochure sponsorizzazione</td>
            </tr>
            <tr>
              <td><strong>Nota</strong></td>
              <td>Appunti e osservazioni</td>
              <td>Preferenze emerse dalla call</td>
            </tr>
            <tr>
              <td><strong>Proposta</strong></td>
              <td>Invio di proposte commerciali</td>
              <td>Proposta partnership Gold</td>
            </tr>
            <tr>
              <td><strong>Altro</strong></td>
              <td>Altre interazioni</td>
              <td>Incontro casuale a evento</td>
            </tr>
          </tbody>
        </table>

        <h3>Creare un'Attività</h3>
        <p>Per registrare una nuova attività:</p>
        <ol>
          <li>Vai al dettaglio del lead</li>
          <li>Clicca su <strong>"Nuova Attività"</strong></li>
          <li>Seleziona il tipo di attività</li>
          <li>Inserisci titolo e descrizione</li>
          <li>Imposta data e ora</li>
          <li>Opzionalmente, aggiungi esito e follow-up</li>
        </ol>

        <h3>Esiti dell'Attività</h3>
        <p>Puoi classificare l'esito di ogni interazione:</p>
        <ul>
          <li><strong>Positivo</strong> - L'interazione ha portato progressi</li>
          <li><strong>Negativo</strong> - Ostacoli o obiezioni emerse</li>
          <li><strong>Neutro</strong> - Interazione informativa</li>
          <li><strong>Da Seguire</strong> - Richiede azioni successive</li>
        </ul>

        <div className="docs-callout docs-callout-info">
          <FaLightbulb />
          <div>
            <strong>Follow-up Automatici</strong>
            <p>Imposta una data di follow-up per ricevere promemoria. I follow-up in sospeso sono evidenziati nella timeline.</p>
          </div>
        </div>

        <h3>Visualizzare la Timeline</h3>
        <p>
          La timeline mostra tutte le attività in ordine cronologico, con:
        </p>
        <ul>
          <li>Icona del tipo di attività</li>
          <li>Badge colorato con l'esito</li>
          <li>Titolo e descrizione</li>
          <li>Data e ora dell'attività</li>
          <li>Nome del contatto coinvolto</li>
          <li>Stato del follow-up (se impostato)</li>
        </ul>

        <div className="docs-callout docs-callout-success">
          <FaCheckCircle />
          <div>
            <strong>Best Practice</strong>
            <p>Registra ogni interazione subito dopo che avviene. Una timeline completa ti aiuta a riprendere la conversazione esattamente da dove l'avevi lasciata.</p>
          </div>
        </div>
      </>
    )
  },
  'leads-conversion': {
    title: 'Conversione in Sponsor',
    description: 'Come convertire un lead in sponsor attivo',
    content: (
      <>
        <p>
          La <strong>conversione</strong> è il momento in cui un lead diventa sponsor ufficiale.
          Questo processo trasferisce tutti i dati e lo storico nel modulo Sponsor.
        </p>

        <h3>Quando Convertire</h3>
        <p>
          Un lead è pronto per la conversione quando:
        </p>
        <ul>
          <li>Ha accettato una proposta commerciale</li>
          <li>È pronto a firmare un contratto</li>
          <li>Ha confermato i termini della partnership</li>
        </ul>

        <h3>Processo di Conversione</h3>
        <ol>
          <li>Vai al dettaglio del lead</li>
          <li>Clicca su <strong>"Converti in Sponsor"</strong></li>
          <li>Inserisci l'email per l'account sponsor</li>
          <li>Crea una password per l'accesso alla piattaforma</li>
          <li>Conferma la conversione</li>
        </ol>

        <div className="docs-callout docs-callout-warning">
          <FaExclamationCircle />
          <div>
            <strong>Account Sponsor</strong>
            <p>Lo sponsor riceverà accesso alla piattaforma con le credenziali fornite. Assicurati di comunicarle correttamente.</p>
          </div>
        </div>

        <h3>Cosa Viene Trasferito</h3>
        <p>
          Durante la conversione, tutti i dati vengono trasferiti:
        </p>
        <ul>
          <li>Dati aziendali (ragione sociale, P.IVA, etc.)</li>
          <li>Informazioni di contatto</li>
          <li>Dati del referente</li>
          <li>Storico attività e interazioni</li>
          <li>Note e documenti allegati</li>
        </ul>

        <h3>Dopo la Conversione</h3>
        <p>
          Una volta convertito:
        </p>
        <ul>
          <li>Il lead viene marcato come "Convertito"</li>
          <li>Un nuovo sponsor viene creato con tutti i dati</li>
          <li>Puoi procedere con la creazione del contratto</li>
          <li>Lo sponsor può accedere alla piattaforma</li>
        </ul>

        <div className="docs-callout docs-callout-success">
          <FaCheckCircle />
          <div>
            <strong>Link Rapido</strong>
            <p>Dopo la conversione, dal dettaglio del lead puoi cliccare su "Vai allo Sponsor" per accedere direttamente alla scheda sponsor.</p>
          </div>
        </div>

        <h3>Lead Persi</h3>
        <p>
          Se un lead non viene convertito, puoi marcarlo come "Perso":
        </p>
        <ul>
          <li>Cambia lo status in "Perso"</li>
          <li>Documenta il motivo della perdita</li>
          <li>Il lead rimane nel sistema per analisi future</li>
        </ul>

        <div className="docs-callout docs-callout-info">
          <FaLightbulb />
          <div>
            <strong>Analisi dei Lead Persi</strong>
            <p>Analizzare i motivi di perdita ti aiuta a migliorare il processo commerciale e a evitare errori futuri.</p>
          </div>
        </div>
      </>
    )
  },
  'proposals-overview': {
    title: 'Panoramica Proposte Commerciali',
    description: 'Introduzione al modulo di gestione delle proposte',
    content: (
      <>
        <p>
          Il modulo <strong>Proposte Commerciali</strong> ti permette di creare, personalizzare
          e monitorare proposte professionali per i tuoi potenziali sponsor.
        </p>

        <h3>Cos'è una Proposta</h3>
        <p>
          Una <strong>proposta commerciale</strong> è un documento che presenta
          la tua offerta di sponsorizzazione a un potenziale partner, includendo:
        </p>
        <ul>
          <li>Asset e diritti proposti</li>
          <li>Pricing personalizzato</li>
          <li>Benefici della partnership</li>
          <li>Termini e condizioni</li>
        </ul>

        <div className="docs-feature-grid">
          <div className="docs-feature-card">
            <FaFileContract className="docs-feature-icon" />
            <h4>Proposal Builder</h4>
            <p>Crea proposte professionali</p>
          </div>
          <div className="docs-feature-card">
            <FaChartPie className="docs-feature-icon" />
            <h4>Analytics</h4>
            <p>Monitora visualizzazioni e interazioni</p>
          </div>
          <div className="docs-feature-card">
            <FaHistory className="docs-feature-icon" />
            <h4>Storico</h4>
            <p>Traccia tutte le proposte inviate</p>
          </div>
          <div className="docs-feature-card">
            <FaClipboardList className="docs-feature-icon" />
            <h4>Template</h4>
            <p>Riutilizza modelli di successo</p>
          </div>
        </div>

        <h3>Ciclo di Vita della Proposta</h3>
        <table className="docs-table">
          <thead>
            <tr>
              <th>Stato</th>
              <th>Descrizione</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>Bozza</strong></td>
              <td>Proposta in fase di creazione, non ancora inviata</td>
            </tr>
            <tr>
              <td><strong>Inviata</strong></td>
              <td>Proposta inviata al destinatario</td>
            </tr>
            <tr>
              <td><strong>Visualizzata</strong></td>
              <td>Il destinatario ha aperto la proposta</td>
            </tr>
            <tr>
              <td><strong>In Trattativa</strong></td>
              <td>Negoziazione in corso sui termini</td>
            </tr>
            <tr>
              <td><strong>Accettata</strong></td>
              <td>Proposta accettata, procedere con contratto</td>
            </tr>
            <tr>
              <td><strong>Rifiutata</strong></td>
              <td>Proposta non accettata</td>
            </tr>
            <tr>
              <td><strong>Scaduta</strong></td>
              <td>Proposta oltre la data di validità</td>
            </tr>
          </tbody>
        </table>

        <h3>Metriche Chiave</h3>
        <p>Il sistema traccia automaticamente:</p>
        <ul>
          <li><strong>Visualizzazioni</strong> - Quante volte è stata aperta</li>
          <li><strong>Tempo di Risposta</strong> - Giorni tra invio e risposta</li>
          <li><strong>Tasso di Conversione</strong> - Percentuale di proposte accettate</li>
          <li><strong>Valore Pipeline</strong> - Totale valore proposte attive</li>
        </ul>

        <div className="docs-callout docs-callout-success">
          <FaCheckCircle />
          <div>
            <strong>Vantaggio del Tracking</strong>
            <p>Sapere quando una proposta viene visualizzata ti permette di fare follow-up tempestivi e aumentare le probabilità di chiusura.</p>
          </div>
        </div>
      </>
    )
  },
  'proposals-builder': {
    title: 'Proposal Builder',
    description: 'Guida completa alla creazione di proposte commerciali',
    content: (
      <>
        <p>
          Il <strong>Proposal Builder</strong> è lo strumento per creare proposte
          commerciali professionali e personalizzate per i tuoi potenziali sponsor.
        </p>

        <h3>Creare una Nuova Proposta</h3>
        <ol>
          <li>Vai a <strong>Acquisizione → Proposte</strong></li>
          <li>Clicca su <strong>"Nuova Proposta"</strong></li>
          <li>Segui il wizard di creazione</li>
        </ol>

        <h3>Elementi della Proposta</h3>

        <h4>1. Informazioni Base</h4>
        <ul>
          <li><strong>Titolo</strong> - Nome della proposta (es. "Partnership Premium 2024/25")</li>
          <li><strong>Codice</strong> - Identificativo univoco (generato automaticamente)</li>
          <li><strong>Destinatario</strong> - Azienda e contatto a cui è rivolta</li>
          <li><strong>Settore</strong> - Categoria merceologica del destinatario</li>
        </ul>

        <h4>2. Selezione Asset</h4>
        <p>
          Seleziona gli asset e i diritti da includere nella proposta:
        </p>
        <ul>
          <li>Sfoglia il catalogo degli asset disponibili</li>
          <li>Filtra per categoria, tipo o prezzo</li>
          <li>Aggiungi gli asset al carrello della proposta</li>
          <li>Opzionalmente, includi package predefiniti</li>
        </ul>

        <div className="docs-callout docs-callout-info">
          <FaLightbulb />
          <div>
            <strong>Personalizzazione Prezzi</strong>
            <p>Puoi personalizzare il prezzo di ogni asset nella proposta, applicando sconti o condizioni speciali.</p>
          </div>
        </div>

        <h4>3. Pricing e Condizioni</h4>
        <ul>
          <li><strong>Valore Totale</strong> - Somma di tutti gli asset</li>
          <li><strong>Sconto Proposta</strong> - Eventuale sconto bundle</li>
          <li><strong>Valore Finale</strong> - Prezzo proposto allo sponsor</li>
          <li><strong>Data Scadenza</strong> - Validità della proposta</li>
        </ul>

        <h4>4. Personalizzazione</h4>
        <p>
          Aggiungi elementi per personalizzare la proposta:
        </p>
        <ul>
          <li>Messaggio introduttivo personalizzato</li>
          <li>Benefici specifici per il destinatario</li>
          <li>Case study di sponsor simili</li>
          <li>Immagini e mockup</li>
        </ul>

        <h3>Anteprima e Invio</h3>
        <p>
          Prima dell'invio, puoi:
        </p>
        <ul>
          <li>Visualizzare l'anteprima come la vedrà lo sponsor</li>
          <li>Generare un link di condivisione</li>
          <li>Inviare via email direttamente dalla piattaforma</li>
          <li>Scaricare in formato PDF</li>
        </ul>

        <div className="docs-callout docs-callout-warning">
          <FaExclamationCircle />
          <div>
            <strong>Verifica Prima dell'Invio</strong>
            <p>Controlla sempre l'anteprima prima di inviare. Una volta inviata, la proposta non può essere modificata (ma puoi creare una nuova versione).</p>
          </div>
        </div>
      </>
    )
  },
  'proposals-tracking': {
    title: 'Monitoraggio Proposte',
    description: 'Come monitorare lo stato e le interazioni con le proposte',
    content: (
      <>
        <p>
          Il sistema di <strong>monitoraggio</strong> ti permette di tracciare
          ogni interazione con le tue proposte commerciali.
        </p>

        <h3>Dashboard Proposte</h3>
        <p>
          La pagina principale mostra statistiche aggregate:
        </p>
        <ul>
          <li><strong>Totale Proposte</strong> - Numero di proposte create</li>
          <li><strong>Valore Pipeline</strong> - Totale valore proposte attive</li>
          <li><strong>Tasso Conversione</strong> - Percentuale di successo</li>
          <li><strong>Visualizzazioni</strong> - Totale view ricevute</li>
          <li><strong>Tempo Medio Risposta</strong> - Giorni medi per risposta</li>
        </ul>

        <h3>Filtri per Status</h3>
        <p>
          Usa i filtri rapidi per visualizzare proposte per stato:
        </p>
        <ul>
          <li><strong>Tutte</strong> - Vista completa</li>
          <li><strong>Bozza</strong> - Proposte non ancora inviate</li>
          <li><strong>Inviata</strong> - In attesa di visualizzazione</li>
          <li><strong>Visualizzata</strong> - Aperte dal destinatario</li>
          <li><strong>In Trattativa</strong> - Negoziazione in corso</li>
          <li><strong>Accettata</strong> - Proposte di successo</li>
          <li><strong>Rifiutata</strong> - Proposte non accettate</li>
        </ul>

        <div className="docs-callout docs-callout-info">
          <FaLightbulb />
          <div>
            <strong>Focus sulle Visualizzate</strong>
            <p>Concentra i tuoi follow-up sulle proposte "Visualizzate" - il destinatario ha già mostrato interesse aprendo il documento.</p>
          </div>
        </div>

        <h3>Dettaglio Proposta</h3>
        <p>
          Clicca su una proposta per vedere:
        </p>
        <ul>
          <li>Riepilogo completo del contenuto</li>
          <li>Timeline delle interazioni</li>
          <li>Storico delle visualizzazioni</li>
          <li>Note e commenti</li>
        </ul>

        <h3>Azioni sulla Proposta</h3>
        <div className="docs-actions-list">
          <div className="docs-action-item">
            <FaEye className="action-icon view" />
            <div>
              <strong>Visualizza</strong>
              <p>Apri il dettaglio completo della proposta</p>
            </div>
          </div>
          <div className="docs-action-item">
            <FaEdit className="action-icon edit" />
            <div>
              <strong>Modifica</strong>
              <p>Modifica proposta in bozza (non inviate)</p>
            </div>
          </div>
          <div className="docs-action-item">
            <FaClipboardList className="action-icon archive" />
            <div>
              <strong>Duplica</strong>
              <p>Crea una copia come base per nuova proposta</p>
            </div>
          </div>
          <div className="docs-action-item">
            <FaTrash className="action-icon delete" />
            <div>
              <strong>Elimina</strong>
              <p>Elimina proposta (solo bozze o rifiutate)</p>
            </div>
          </div>
        </div>

        <h3>Notifiche Automatiche</h3>
        <p>
          Il sistema ti notifica automaticamente quando:
        </p>
        <ul>
          <li>Una proposta viene visualizzata per la prima volta</li>
          <li>Una proposta sta per scadere</li>
          <li>Una proposta è scaduta</li>
          <li>Lo sponsor risponde o commenta</li>
        </ul>
      </>
    )
  },
  'proposals-templates': {
    title: 'Template Proposte',
    description: 'Come creare e gestire modelli riutilizzabili',
    content: (
      <>
        <p>
          I <strong>template</strong> ti permettono di creare modelli di proposta
          riutilizzabili per velocizzare il processo commerciale.
        </p>

        <h3>Vantaggi dei Template</h3>
        <ul>
          <li><strong>Velocità</strong> - Crea nuove proposte in pochi click</li>
          <li><strong>Coerenza</strong> - Mantieni uno stile uniforme</li>
          <li><strong>Best Practice</strong> - Riutilizza proposte di successo</li>
          <li><strong>Efficienza</strong> - Risparmia tempo prezioso</li>
        </ul>

        <h3>Creare un Template</h3>
        <ol>
          <li>Vai a <strong>Proposte → Template</strong></li>
          <li>Clicca su <strong>"Nuovo Template"</strong></li>
          <li>Configura gli elementi standard della proposta</li>
          <li>Salva il template con un nome descrittivo</li>
        </ol>

        <h3>Elementi del Template</h3>
        <p>Un template può includere:</p>
        <ul>
          <li><strong>Asset Predefiniti</strong> - Selezione di asset comuni</li>
          <li><strong>Package</strong> - Package di sponsorizzazione inclusi</li>
          <li><strong>Testo Standard</strong> - Messaggi e descrizioni riutilizzabili</li>
          <li><strong>Condizioni</strong> - Termini e validità predefinite</li>
        </ul>

        <div className="docs-callout docs-callout-success">
          <FaCheckCircle />
          <div>
            <strong>Template per Livello</strong>
            <p>Crea template diversi per ogni livello di partnership: Main Sponsor, Official Partner, Premium Partner, etc.</p>
          </div>
        </div>

        <h3>Usare un Template</h3>
        <ol>
          <li>Clicca su <strong>"Nuova Proposta"</strong></li>
          <li>Seleziona <strong>"Usa Template"</strong></li>
          <li>Scegli il template desiderato</li>
          <li>Personalizza con i dati del destinatario</li>
          <li>Completa e invia la proposta</li>
        </ol>

        <h3>Gestione Template</h3>
        <p>
          Dalla pagina Template puoi:
        </p>
        <ul>
          <li><strong>Modificare</strong> - Aggiorna un template esistente</li>
          <li><strong>Duplicare</strong> - Crea una variante</li>
          <li><strong>Eliminare</strong> - Rimuovi template non più utili</li>
          <li><strong>Ordinare</strong> - Prioritizza i template più usati</li>
        </ul>

        <div className="docs-callout docs-callout-info">
          <FaLightbulb />
          <div>
            <strong>Best Practice</strong>
            <p>Analizza le proposte con il miglior tasso di conversione e trasformale in template per replicare il successo.</p>
          </div>
        </div>
      </>
    )
  },
};

function Docs() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedSections, setExpandedSections] = useState(['inventory']);
  const [activeArticle, setActiveArticle] = useState('inventory-catalog');

  // Parse URL hash to set active article
  useEffect(() => {
    const hash = location.hash.replace('#', '');
    if (hash && articleContent[hash]) {
      setActiveArticle(hash);
      // Expand parent section
      const section = docsStructure.find(s => s.articles.some(a => a.id === hash));
      if (section && !expandedSections.includes(section.id)) {
        setExpandedSections([...expandedSections, section.id]);
      }
    }
  }, [location.hash]);

  const toggleSection = (sectionId) => {
    setExpandedSections(prev =>
      prev.includes(sectionId)
        ? prev.filter(id => id !== sectionId)
        : [...prev, sectionId]
    );
  };

  const handleArticleClick = (articleId) => {
    setActiveArticle(articleId);
    navigate(`#${articleId}`);
  };

  const article = articleContent[activeArticle];

  // Filter articles based on search
  const filteredStructure = searchTerm
    ? docsStructure.map(section => ({
        ...section,
        articles: section.articles.filter(a =>
          a.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (articleContent[a.id]?.description || '').toLowerCase().includes(searchTerm.toLowerCase())
        )
      })).filter(section => section.articles.length > 0)
    : docsStructure;

  return (
    <div className="tp-page" style={{ background: '#F8FAFC' }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #1A1A1A 0%, #2D2D2D 100%)',
        padding: '32px 40px',
        marginBottom: '0',
        borderRadius: '0'
      }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
            <button
              onClick={() => navigate(-1)}
              style={{
                background: 'rgba(255,255,255,0.1)',
                border: 'none',
                borderRadius: '8px',
                padding: '8px 12px',
                color: 'white',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '14px'
              }}
            >
              <FaArrowLeft /> Indietro
            </button>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '14px',
              background: 'linear-gradient(135deg, #85FF00, #65A30D)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <FaBook size={28} color="white" />
            </div>
            <div>
              <h1 style={{ margin: 0, fontSize: '28px', fontWeight: 700, color: 'white' }}>
                Documentazione
              </h1>
              <p style={{ margin: '4px 0 0', fontSize: '15px', color: 'rgba(255,255,255,0.7)' }}>
                Guide e manuali per utilizzare al meglio Pitch Partner
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div style={{
        display: 'flex',
        maxWidth: '1400px',
        margin: '0 auto',
        minHeight: 'calc(100vh - 200px)'
      }}>
        {/* Sidebar */}
        <aside style={{
          width: '300px',
          background: 'white',
          borderRight: '1px solid #E5E7EB',
          padding: '24px 0',
          flexShrink: 0,
          position: 'sticky',
          top: '0',
          height: 'fit-content',
          maxHeight: 'calc(100vh - 100px)',
          overflowY: 'auto'
        }}>
          {/* Search */}
          <div style={{ padding: '0 20px', marginBottom: '24px' }}>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                placeholder="Cerca nella documentazione..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px 10px 38px',
                  border: '2px solid #E5E7EB',
                  borderRadius: '8px',
                  fontSize: '14px',
                  boxSizing: 'border-box'
                }}
              />
              <FaSearch style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#9CA3AF'
              }} />
            </div>
          </div>

          {/* Navigation */}
          <nav>
            {filteredStructure.map(section => {
              const SectionIcon = section.icon;
              const isExpanded = expandedSections.includes(section.id);

              return (
                <div key={section.id} style={{ marginBottom: '4px' }}>
                  <button
                    onClick={() => toggleSection(section.id)}
                    style={{
                      width: '100%',
                      padding: '12px 20px',
                      background: 'transparent',
                      border: 'none',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: 600,
                      color: '#1F2937',
                      textAlign: 'left'
                    }}
                  >
                    <SectionIcon size={16} color="#6B7280" />
                    <span style={{ flex: 1 }}>{section.title}</span>
                    {isExpanded ? <FaChevronDown size={12} /> : <FaChevronRight size={12} />}
                  </button>

                  {isExpanded && (
                    <div style={{ marginLeft: '20px', borderLeft: '2px solid #E5E7EB' }}>
                      {section.articles.map(article => (
                        <button
                          key={article.id}
                          onClick={() => handleArticleClick(article.id)}
                          style={{
                            width: '100%',
                            padding: '10px 20px',
                            background: activeArticle === article.id ? 'rgba(133, 255, 0, 0.1)' : 'transparent',
                            border: 'none',
                            borderLeft: activeArticle === article.id ? '2px solid #85FF00' : '2px solid transparent',
                            marginLeft: '-2px',
                            display: 'block',
                            cursor: 'pointer',
                            fontSize: '14px',
                            color: activeArticle === article.id ? '#1F2937' : '#6B7280',
                            fontWeight: activeArticle === article.id ? 600 : 400,
                            textAlign: 'left',
                            transition: 'all 0.15s'
                          }}
                        >
                          {article.title}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>
        </aside>

        {/* Article Content */}
        <main style={{
          flex: 1,
          padding: '40px 60px',
          background: 'white',
          minHeight: '100%'
        }}>
          {article ? (
            <>
              <div style={{ marginBottom: '32px' }}>
                <h1 style={{
                  fontSize: '32px',
                  fontWeight: 700,
                  color: '#1F2937',
                  margin: '0 0 12px'
                }}>
                  {article.title}
                </h1>
                <p style={{
                  fontSize: '18px',
                  color: '#6B7280',
                  margin: 0,
                  lineHeight: '1.6'
                }}>
                  {article.description}
                </p>
              </div>

              <div className="docs-content">
                {article.content}
              </div>
            </>
          ) : (
            <div style={{ textAlign: 'center', padding: '60px 0' }}>
              <FaQuestion size={48} color="#D1D5DB" />
              <h2 style={{ marginTop: '16px', color: '#6B7280' }}>Articolo non trovato</h2>
            </div>
          )}
        </main>
      </div>

      {/* Styles */}
      <style>{`
        .docs-content h3 {
          font-size: 20px;
          font-weight: 700;
          color: #1F2937;
          margin: 32px 0 16px;
        }
        .docs-content h4 {
          font-size: 16px;
          font-weight: 600;
          color: #374151;
          margin: 24px 0 12px;
        }
        .docs-content p {
          font-size: 15px;
          line-height: 1.8;
          color: #4B5563;
          margin: 0 0 16px;
        }
        .docs-content ul, .docs-content ol {
          margin: 0 0 20px;
          padding-left: 24px;
        }
        .docs-content li {
          font-size: 15px;
          line-height: 1.8;
          color: #4B5563;
          margin-bottom: 8px;
        }
        .docs-callout {
          display: flex;
          gap: 16px;
          padding: 16px 20px;
          border-radius: 12px;
          margin: 24px 0;
        }
        .docs-callout svg {
          flex-shrink: 0;
          margin-top: 2px;
        }
        .docs-callout strong {
          display: block;
          margin-bottom: 4px;
        }
        .docs-callout p {
          margin: 0;
          font-size: 14px;
        }
        .docs-callout-info {
          background: linear-gradient(135deg, #EFF6FF, #DBEAFE);
          border: 1px solid #93C5FD;
        }
        .docs-callout-info svg {
          color: #2563EB;
        }
        .docs-callout-info strong {
          color: #1E40AF;
        }
        .docs-callout-info p {
          color: #1E3A8A;
        }
        .docs-callout-warning {
          background: linear-gradient(135deg, #FEF3C7, #FDE68A);
          border: 1px solid #FCD34D;
        }
        .docs-callout-warning svg {
          color: #D97706;
        }
        .docs-callout-warning strong {
          color: #92400E;
        }
        .docs-callout-warning p {
          color: #78350F;
        }
        .docs-callout-success {
          background: linear-gradient(135deg, #D1FAE5, #A7F3D0);
          border: 1px solid #6EE7B7;
        }
        .docs-callout-success svg {
          color: #059669;
        }
        .docs-callout-success strong {
          color: #065F46;
        }
        .docs-callout-success p {
          color: #064E3B;
        }
        .docs-feature-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 16px;
          margin: 24px 0;
        }
        .docs-feature-card {
          padding: 20px;
          background: #F9FAFB;
          border-radius: 12px;
          border: 1px solid #E5E7EB;
        }
        .docs-feature-icon {
          font-size: 24px;
          color: #85FF00;
          margin-bottom: 12px;
        }
        .docs-feature-card h4 {
          margin: 0 0 8px !important;
          font-size: 15px;
        }
        .docs-feature-card p {
          margin: 0;
          font-size: 13px;
          color: #6B7280;
        }
        .docs-stats-example {
          display: flex;
          gap: 16px;
          margin: 16px 0 24px;
        }
        .docs-stat {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 16px;
          background: linear-gradient(135deg, #1F2937, #374151);
          border-radius: 8px;
          color: white;
          font-size: 13px;
        }
        .docs-table {
          width: 100%;
          border-collapse: collapse;
          margin: 16px 0 24px;
          font-size: 14px;
        }
        .docs-table th, .docs-table td {
          padding: 12px 16px;
          text-align: left;
          border-bottom: 1px solid #E5E7EB;
        }
        .docs-table th {
          background: #F9FAFB;
          font-weight: 600;
          color: #374151;
        }
        .docs-table td {
          color: #4B5563;
        }
        .docs-actions-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin: 16px 0 24px;
        }
        .docs-action-item {
          display: flex;
          align-items: flex-start;
          gap: 16px;
          padding: 16px;
          background: #F9FAFB;
          border-radius: 10px;
        }
        .docs-action-item .action-icon {
          width: 36px;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 8px;
          font-size: 16px;
        }
        .docs-action-item .action-icon.view {
          background: #DBEAFE;
          color: #2563EB;
        }
        .docs-action-item .action-icon.edit {
          background: #D1FAE5;
          color: #059669;
        }
        .docs-action-item .action-icon.archive {
          background: #FEF3C7;
          color: #D97706;
        }
        .docs-action-item .action-icon.delete {
          background: #FEE2E2;
          color: #DC2626;
        }
        .docs-action-item strong {
          display: block;
          font-size: 14px;
          color: #1F2937;
          margin-bottom: 4px;
        }
        .docs-action-item p {
          margin: 0;
          font-size: 13px;
          color: #6B7280;
        }
      `}</style>
    </div>
  );
}

export default Docs;
