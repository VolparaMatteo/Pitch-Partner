import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix per le icone di Leaflet in React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

/**
 * Componente mappa per visualizzare opportunità del marketplace
 *
 * Props:
 * - opportunities: array di opportunità con location_lat e location_lng
 * - center: [lat, lng] centro iniziale della mappa (default Italia)
 * - zoom: livello zoom iniziale
 * - height: altezza del container
 * - onOpportunityClick: callback quando si clicca su un marker
 * - selectedId: id dell'opportunità selezionata (per evidenziarla)
 */
function MarketplaceMap({
  opportunities = [],
  center = [41.9028, 12.4964], // Roma di default
  zoom = 6,
  height = '500px',
  onOpportunityClick,
  selectedId = null
}) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);
  const [isMapReady, setIsMapReady] = useState(false);

  // Inizializza la mappa
  useEffect(() => {
    if (mapRef.current && !mapInstanceRef.current) {
      mapInstanceRef.current = L.map(mapRef.current).setView(center, zoom);

      // Tile layer OpenStreetMap
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19
      }).addTo(mapInstanceRef.current);

      setIsMapReady(true);
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        setIsMapReady(false);
      }
    };
  }, []);

  // Aggiorna i marker quando cambiano le opportunità
  useEffect(() => {
    if (!mapInstanceRef.current || !isMapReady) return;

    // Rimuovi marker esistenti
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    // Filtra opportunità con coordinate valide
    const geoOpportunities = opportunities.filter(opp =>
      opp.location_lat && opp.location_lng
    );

    if (geoOpportunities.length === 0) return;

    // Crea marker per ogni opportunità
    const bounds = L.latLngBounds([]);

    geoOpportunities.forEach(opp => {
      const isSelected = opp.id === selectedId;

      // Icona personalizzata
      const customIcon = L.divIcon({
        className: 'custom-marker',
        html: `
          <div style="
            width: ${isSelected ? '40px' : '32px'};
            height: ${isSelected ? '40px' : '32px'};
            background: ${isSelected ? '#85FF00' : '#1a1a1a'};
            border: 3px solid ${isSelected ? '#1a1a1a' : 'white'};
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
            cursor: pointer;
            transition: all 0.2s;
            font-size: ${isSelected ? '18px' : '14px'};
          ">
            ${getTypeEmoji(opp.tipo_opportunita)}
          </div>
        `,
        iconSize: [isSelected ? 40 : 32, isSelected ? 40 : 32],
        iconAnchor: [isSelected ? 20 : 16, isSelected ? 20 : 16],
        popupAnchor: [0, -20]
      });

      const marker = L.marker([opp.location_lat, opp.location_lng], {
        icon: customIcon
      }).addTo(mapInstanceRef.current);

      // Popup con info opportunità
      const popupContent = `
        <div style="min-width: 200px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
          <div style="font-weight: 600; font-size: 14px; margin-bottom: 8px; color: #1a1a1a;">
            ${opp.titolo}
          </div>
          <div style="font-size: 12px; color: #666; margin-bottom: 8px;">
            ${opp.location_city || ''}${opp.location_province ? `, ${opp.location_province}` : ''}
          </div>
          ${opp.budget_richiesto ? `
            <div style="
              background: #f0fdf4;
              color: #166534;
              padding: 4px 8px;
              border-radius: 6px;
              font-size: 12px;
              font-weight: 600;
              display: inline-block;
              margin-bottom: 8px;
            ">
              €${opp.budget_richiesto.toLocaleString()}
            </div>
          ` : ''}
          ${opp.distance_km !== null && opp.distance_km !== undefined ? `
            <div style="font-size: 11px; color: #999;">
              📍 ${opp.distance_km} km da te
            </div>
          ` : ''}
        </div>
      `;

      marker.bindPopup(popupContent, {
        closeButton: true,
        className: 'marketplace-popup'
      });

      // Click handler
      marker.on('click', () => {
        if (onOpportunityClick) {
          onOpportunityClick(opp);
        }
      });

      markersRef.current.push(marker);
      bounds.extend([opp.location_lat, opp.location_lng]);
    });

    // Fit bounds se ci sono marker
    if (geoOpportunities.length > 0) {
      mapInstanceRef.current.fitBounds(bounds, {
        padding: [50, 50],
        maxZoom: 12
      });
    }

  }, [opportunities, isMapReady, selectedId, onOpportunityClick]);

  return (
    <div style={{ position: 'relative', width: '100%', height }}>
      <div ref={mapRef} style={{ width: '100%', height: '100%', borderRadius: '16px' }} />

      {/* Legend */}
      <div style={{
        position: 'absolute',
        bottom: '20px',
        left: '20px',
        background: 'white',
        padding: '12px 16px',
        borderRadius: '12px',
        boxShadow: '0 2px 12px rgba(0,0,0,0.15)',
        zIndex: 1000,
        fontSize: '12px'
      }}>
        <div style={{ fontWeight: 600, marginBottom: '8px' }}>Legenda</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>🎪</span> <span>Evento</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>📢</span> <span>Campagna</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>🌱</span> <span>CSR</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>🤝</span> <span>Co-Branding</span>
          </div>
        </div>
      </div>

      {/* Opportunities count */}
      <div style={{
        position: 'absolute',
        top: '20px',
        right: '20px',
        background: '#1a1a1a',
        color: 'white',
        padding: '8px 16px',
        borderRadius: '20px',
        boxShadow: '0 2px 12px rgba(0,0,0,0.2)',
        zIndex: 1000,
        fontSize: '13px',
        fontWeight: 600
      }}>
        {opportunities.filter(o => o.location_lat && o.location_lng).length} opportunità sulla mappa
      </div>

      {/* Stile per popup personalizzato */}
      <style>{`
        .marketplace-popup .leaflet-popup-content-wrapper {
          border-radius: 12px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.15);
        }
        .marketplace-popup .leaflet-popup-tip {
          background: white;
        }
        .custom-marker:hover {
          transform: scale(1.1);
        }
      `}</style>
    </div>
  );
}

// Helper per emoji in base al tipo
function getTypeEmoji(tipo) {
  const emojis = {
    'evento_speciale': '🎪',
    'campagna_promozionale': '📢',
    'progetto_csr': '🌱',
    'co_branding': '🤝',
    'attivazione_speciale': '⚡',
    'altro': '📌'
  };
  return emojis[tipo] || '📌';
}

export default MarketplaceMap;
