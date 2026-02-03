import { useState, useEffect, useRef } from 'react';

/**
 * Componente per la ricerca di indirizzi con autocomplete usando Nominatim (OpenStreetMap)
 *
 * Props:
 * - value: valore iniziale
 * - onChange: callback quando viene selezionato un indirizzo
 * - placeholder: placeholder per l'input
 * - disabled: disabilita l'input
 */
function AddressAutocomplete({ value, onChange, placeholder = "Cerca indirizzo...", disabled = false }) {
  const [query, setQuery] = useState(value || '');
  const [suggestions, setSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const debounceRef = useRef(null);
  const wrapperRef = useRef(null);

  // Chiudi suggerimenti quando si clicca fuori
  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Aggiorna query se value cambia dall'esterno
  useEffect(() => {
    if (value && !selectedAddress) {
      setQuery(value);
    }
  }, [value, selectedAddress]);

  // Ricerca con debounce
  const searchAddress = async (searchQuery) => {
    if (!searchQuery || searchQuery.length < 3) {
      setSuggestions([]);
      return;
    }

    setIsLoading(true);
    try {
      // Nominatim API - gratuita, senza API key
      // Limitiamo la ricerca all'Italia per risultati più pertinenti
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?` +
        `q=${encodeURIComponent(searchQuery)}&` +
        `format=json&` +
        `addressdetails=1&` +
        `limit=5&` +
        `countrycodes=it&` +
        `accept-language=it`,
        {
          headers: {
            'User-Agent': 'PitchPartner/1.0'
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        setSuggestions(data);
        setShowSuggestions(data.length > 0);
      }
    } catch (error) {
      console.error('Errore ricerca indirizzo:', error);
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const newQuery = e.target.value;
    setQuery(newQuery);
    setSelectedAddress(null);

    // Debounce per evitare troppe richieste
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      searchAddress(newQuery);
    }, 300);
  };

  const handleSelectAddress = (suggestion) => {
    const address = suggestion.address || {};

    // Estrai i dati dall'indirizzo Nominatim
    const locationData = {
      location: suggestion.display_name,
      location_city: address.city || address.town || address.village || address.municipality || '',
      location_province: address.county || address.state_district || '',
      location_region: address.state || '',
      location_country: address.country || 'Italia',
      location_lat: parseFloat(suggestion.lat),
      location_lng: parseFloat(suggestion.lon)
    };

    setQuery(suggestion.display_name);
    setSelectedAddress(locationData);
    setShowSuggestions(false);
    setSuggestions([]);

    // Callback al parent
    if (onChange) {
      onChange(locationData);
    }
  };

  const handleClear = () => {
    setQuery('');
    setSelectedAddress(null);
    setSuggestions([]);
    if (onChange) {
      onChange(null);
    }
  };

  const formatSuggestion = (suggestion) => {
    const address = suggestion.address || {};
    const parts = [];

    if (address.road) parts.push(address.road);
    if (address.house_number) parts[0] = `${parts[0]} ${address.house_number}`;
    if (address.city || address.town || address.village) {
      parts.push(address.city || address.town || address.village);
    }
    if (address.county) parts.push(address.county);
    if (address.state) parts.push(address.state);

    return parts.length > 0 ? parts.join(', ') : suggestion.display_name;
  };

  const getPlaceType = (suggestion) => {
    const type = suggestion.type || suggestion.class;
    const typeMap = {
      'city': 'Città',
      'town': 'Città',
      'village': 'Paese',
      'hamlet': 'Frazione',
      'stadium': 'Stadio',
      'sports_centre': 'Centro Sportivo',
      'building': 'Edificio',
      'street': 'Via',
      'road': 'Via',
      'neighbourhood': 'Quartiere',
      'suburb': 'Quartiere'
    };
    return typeMap[type] || '';
  };

  return (
    <div ref={wrapperRef} style={{ position: 'relative', width: '100%' }}>
      {/* Input */}
      <div style={{ position: 'relative' }}>
        <input
          type="text"
          value={query}
          onChange={handleInputChange}
          onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
          placeholder={placeholder}
          disabled={disabled}
          style={{
            width: '100%',
            padding: '14px 40px 14px 16px',
            borderRadius: '12px',
            border: selectedAddress ? '2px solid #22c55e' : '2px solid #E0E0E0',
            fontSize: '15px',
            outline: 'none',
            transition: 'border-color 0.2s',
            background: disabled ? '#f5f5f5' : 'white'
          }}
        />

        {/* Loading indicator */}
        {isLoading && (
          <div style={{
            position: 'absolute',
            right: '12px',
            top: '50%',
            transform: 'translateY(-50%)',
            color: '#999'
          }}>
            <span style={{ animation: 'spin 1s linear infinite', display: 'inline-block' }}>
              ⏳
            </span>
          </div>
        )}

        {/* Clear button */}
        {query && !isLoading && (
          <button
            type="button"
            onClick={handleClear}
            style={{
              position: 'absolute',
              right: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: '#999',
              fontSize: '18px',
              padding: '4px'
            }}
          >
            ×
          </button>
        )}
      </div>

      {/* Selected address indicator */}
      {selectedAddress && (
        <div style={{
          marginTop: '8px',
          padding: '8px 12px',
          background: '#f0fdf4',
          border: '1px solid #86efac',
          borderRadius: '8px',
          fontSize: '13px',
          color: '#166534',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <span>📍</span>
          <span>
            {selectedAddress.location_city}
            {selectedAddress.location_province && `, ${selectedAddress.location_province}`}
          </span>
          <span style={{
            marginLeft: 'auto',
            fontSize: '11px',
            color: '#15803d',
            background: '#dcfce7',
            padding: '2px 8px',
            borderRadius: '4px'
          }}>
            Coordinate salvate
          </span>
        </div>
      )}

      {/* Suggestions dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 0,
          marginTop: '4px',
          background: 'white',
          borderRadius: '12px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
          border: '1px solid #E0E0E0',
          maxHeight: '300px',
          overflowY: 'auto',
          zIndex: 1000
        }}>
          {suggestions.map((suggestion, index) => (
            <div
              key={suggestion.place_id || index}
              onClick={() => handleSelectAddress(suggestion)}
              style={{
                padding: '12px 16px',
                cursor: 'pointer',
                borderBottom: index < suggestions.length - 1 ? '1px solid #f0f0f0' : 'none',
                transition: 'background 0.15s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = '#f8f8f8'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
            >
              <div style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '12px'
              }}>
                <span style={{ fontSize: '20px', marginTop: '2px' }}>📍</span>
                <div style={{ flex: 1 }}>
                  <div style={{
                    fontSize: '14px',
                    fontWeight: 500,
                    color: '#1a1a1a',
                    marginBottom: '4px'
                  }}>
                    {formatSuggestion(suggestion)}
                  </div>
                  {getPlaceType(suggestion) && (
                    <span style={{
                      fontSize: '11px',
                      color: '#666',
                      background: '#f0f0f0',
                      padding: '2px 8px',
                      borderRadius: '4px'
                    }}>
                      {getPlaceType(suggestion)}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}

          {/* Attribution (required by Nominatim) */}
          <div style={{
            padding: '8px 16px',
            fontSize: '11px',
            color: '#999',
            background: '#f8f8f8',
            borderTop: '1px solid #f0f0f0',
            textAlign: 'center'
          }}>
            Dati © <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer" style={{ color: '#666' }}>OpenStreetMap</a>
          </div>
        </div>
      )}

      {/* No results */}
      {showSuggestions && query.length >= 3 && suggestions.length === 0 && !isLoading && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 0,
          marginTop: '4px',
          background: 'white',
          borderRadius: '12px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
          border: '1px solid #E0E0E0',
          padding: '16px',
          textAlign: 'center',
          color: '#666',
          fontSize: '14px',
          zIndex: 1000
        }}>
          Nessun risultato trovato
        </div>
      )}
    </div>
  );
}

export default AddressAutocomplete;
