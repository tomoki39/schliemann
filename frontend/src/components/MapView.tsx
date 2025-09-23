import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { Icon } from 'leaflet';
import { Language } from '../types/Language';
import 'leaflet/dist/leaflet.css';

interface MapViewProps {
  languages: Language[];
  selectedLanguage: Language | null;
  onLanguageClick: (language: Language) => void;
}

const MapView: React.FC<MapViewProps> = ({ languages, selectedLanguage, onLanguageClick }) => {
  const defaultIcon = new Icon({
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  });

  return (
    <div className="flex-1 h-full">
      <MapContainer
        center={[35.68, 139.76]}
        zoom={2}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {languages.map(lang => {
          if (!lang.center) return null;
          return (
            <Marker
              key={lang.id}
              position={[lang.center.lat, lang.center.lng]}
              icon={defaultIcon}
              eventHandlers={{
                click: () => onLanguageClick(lang)
              }}
            >
              <Popup>
                <div>
                  <h3 className="font-bold">{lang.name_ja}</h3>
                  <p className="text-sm">{lang.family}</p>
                  {lang.total_speakers && (
                    <p className="text-xs text-gray-600">
                      {lang.total_speakers.toLocaleString()}人
                    </p>
                  )}
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
};

export default MapView;
