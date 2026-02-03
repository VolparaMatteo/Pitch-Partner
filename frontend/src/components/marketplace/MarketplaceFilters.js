import { FaSearch, FaTh, FaList } from 'react-icons/fa';
import '../../styles/template-style.css';
import '../../styles/marketplace.css';

/**
 * Barra filtri moderna per marketplace
 * Include ricerca, filtri rapidi e ordinamento
 */
function MarketplaceFilters({
  searchTerm,
  onSearchChange,
  filters,
  onFilterChange,
  sortBy,
  onSortChange,
  resultsCount,
  viewMode,
  onViewModeChange
}) {
  const tipiOpportunita = [
    { value: 'all', label: 'Tutti i tipi' },
    { value: 'evento_speciale', label: 'Eventi' },
    { value: 'campagna_promozionale', label: 'Campagne' },
    { value: 'progetto_csr', label: 'CSR' },
    { value: 'co_branding', label: 'Co-Branding' },
    { value: 'attivazione_speciale', label: 'Attivazioni' }
  ];

  const sortOptions = [
    { value: 'recent', label: 'Più recenti' },
    { value: 'budget_high', label: 'Budget: alto → basso' },
    { value: 'budget_low', label: 'Budget: basso → alto' },
    { value: 'deadline', label: 'Scadenza imminente' },
    { value: 'popular', label: 'Più popolari' }
  ];

  const isFilterActive = (key, value) => {
    return filters[key] && filters[key] !== 'all';
  };

  return (
    <div className="mp-filters">
      {/* Main Filter Bar */}
      <div className="mp-filters-row">
        {/* Search */}
        <div className="tp-search-wrapper" style={{ width: '240px', flexShrink: 0 }}>
          <input
            type="text"
            className="tp-search-input"
            placeholder="Cerca..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
          />
          <span className="tp-search-icon">
            <FaSearch />
          </span>
        </div>

        {/* Quick Filters */}
        <div className="mp-filters-left" style={{ gap: '8px' }}>
          {/* Tipo */}
          <select
            className={`tp-select ${isFilterActive('tipo') ? 'tp-select-active' : ''}`}
            value={filters.tipo || 'all'}
            onChange={(e) => onFilterChange({ ...filters, tipo: e.target.value })}
          >
            {tipiOpportunita.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>

          {/* Creator Type */}
          <select
            className={`tp-select ${isFilterActive('creator_type') ? 'tp-select-active' : ''}`}
            value={filters.creator_type || 'all'}
            onChange={(e) => onFilterChange({ ...filters, creator_type: e.target.value })}
          >
            <option value="all">Tutti</option>
            <option value="club">Solo Club</option>
            <option value="sponsor">Solo Sponsor</option>
          </select>
        </div>

        {/* Results count & Sort */}
        <div className="mp-filters-right">
          <span className="mp-results-count">
            <strong>{resultsCount}</strong> opportunità
          </span>

          {/* Sort */}
          <select
            className="tp-select"
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value)}
          >
            {sortOptions.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>

          {/* View Mode Toggle */}
          {onViewModeChange && (
            <div className="tp-view-toggle">
              <button
                className={`tp-view-toggle-btn ${viewMode === 'grid' ? 'active' : ''}`}
                onClick={() => onViewModeChange('grid')}
                title="Vista griglia"
              >
                <FaTh />
              </button>
              <button
                className={`tp-view-toggle-btn ${viewMode === 'list' ? 'active' : ''}`}
                onClick={() => onViewModeChange('list')}
                title="Vista lista"
              >
                <FaList />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default MarketplaceFilters;
