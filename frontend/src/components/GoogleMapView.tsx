import React, { useEffect, useRef } from 'react';
import { Wrapper, Status } from '@googlemaps/react-wrapper';
import { Language } from '../types/Language';

interface GoogleMapViewProps {
  languages: Language[];
  selectedLanguage: Language | null;
  onLanguageClick: (language: Language) => void;
}

const MapComponent: React.FC<GoogleMapViewProps> = ({ 
  languages, 
  selectedLanguage, 
  onLanguageClick 
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const map = new google.maps.Map(mapRef.current, {
      center: { lat: 35.68, lng: 139.76 },
      zoom: 2,
      mapTypeId: google.maps.MapTypeId.ROADMAP,
    });

    mapInstanceRef.current = map;
  }, []);

  useEffect(() => {
    if (!mapInstanceRef.current) return;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.setMap(null));
    markersRef.current = [];

    // Add new markers
    languages.forEach(lang => {
      if (!lang.center) return;

      const marker = new google.maps.Marker({
        position: { lat: lang.center.lat, lng: lang.center.lng },
        map: mapInstanceRef.current,
        title: lang.name_ja,
        icon: {
          url: 'https://maps.google.com/mapfiles/ms/icons/red-dot.png',
          scaledSize: new google.maps.Size(25, 25),
        },
      });

      const infoWindow = new google.maps.InfoWindow({
        content: `
          <div>
            <h3 style="font-weight: bold; margin: 0 0 4px 0;">${lang.name_ja}</h3>
            <p style="margin: 0 0 4px 0; font-size: 12px; color: #666;">${lang.family}</p>
            ${lang.total_speakers ? `<p style="margin: 0; font-size: 11px; color: #888;">${lang.total_speakers.toLocaleString()}人</p>` : ''}
          </div>
        `,
      });

      marker.addListener('click', () => {
        onLanguageClick(lang);
        infoWindow.open(mapInstanceRef.current, marker);
      });

      markersRef.current.push(marker);
    });
  }, [languages, onLanguageClick]);

  useEffect(() => {
    if (!mapInstanceRef.current || !selectedLanguage?.center) return;

    mapInstanceRef.current.setCenter({
      lat: selectedLanguage.center.lat,
      lng: selectedLanguage.center.lng,
    });
    mapInstanceRef.current.setZoom(6);
  }, [selectedLanguage]);

  return <div ref={mapRef} style={{ height: '100%', width: '100%' }} className="min-h-0" />;
};

const render = (status: Status) => {
  switch (status) {
    case Status.LOADING:
      return (
        <div className="flex items-center justify-center h-full">
          <div className="text-gray-600">地図を読み込み中...</div>
        </div>
      );
    case Status.FAILURE:
      return (
        <div className="flex items-center justify-center h-full">
          <div className="text-red-600">地図の読み込みに失敗しました</div>
        </div>
      );
    default:
      return null;
  }
};

const GoogleMapView: React.FC<GoogleMapViewProps> = (props) => {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-red-600 text-center">
          <div>Google Maps API キーが設定されていません</div>
          <div className="text-sm mt-2">
            .env ファイルに VITE_GOOGLE_MAPS_API_KEY を設定してください
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 h-full">
      <Wrapper apiKey={apiKey} render={render}>
        <MapComponent {...props} />
      </Wrapper>
    </div>
  );
};

export default GoogleMapView;
