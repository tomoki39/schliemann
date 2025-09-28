import React, { useEffect, useRef, useState } from 'react';
import { Wrapper, Status } from '@googlemaps/react-wrapper';

interface DialectRegion {
  id: string;
  name: string;
  name_en: string;
  center: { lat: number; lng: number };
  bounds: { north: number; south: number; east: number; west: number };
  color: string;
  description: string;
}

interface JapaneseDialectMapProps {
  selectedDialect: string | null;
  onDialectSelect: (dialectId: string) => void;
  onDialectHover: (dialectId: string | null) => void;
}

// 日本の方言地域データ（バックエンドの方言IDと一致）
const DIALECT_REGIONS: DialectRegion[] = [
  {
    id: 'standard',
    name: '標準語',
    name_en: 'Standard Japanese',
    center: { lat: 35.6762, lng: 139.6503 },
    bounds: { north: 36.5, south: 34.5, east: 140.5, west: 138.5 },
    color: '#3B82F6',
    description: '東京を中心とした標準語地域'
  },
  {
    id: 'tokyo',
    name: '東京弁',
    name_en: 'Tokyo Dialect',
    center: { lat: 35.6762, lng: 139.6503 },
    bounds: { north: 35.8, south: 35.4, east: 139.9, west: 139.3 },
    color: '#1E40AF',
    description: '東京の方言'
  },
  {
    id: 'osaka',
    name: '大阪弁',
    name_en: 'Osaka Dialect',
    center: { lat: 34.6937, lng: 135.5023 },
    bounds: { north: 34.8, south: 34.5, east: 135.7, west: 135.2 },
    color: '#EF4444',
    description: '大阪を中心とした関西地方の方言'
  },
  {
    id: 'kyoto',
    name: '京都弁',
    name_en: 'Kyoto Dialect',
    center: { lat: 35.0116, lng: 135.7681 },
    bounds: { north: 35.1, south: 34.9, east: 135.9, west: 135.6 },
    color: '#DC2626',
    description: '京都の伝統的な方言'
  },
  {
    id: 'kansai',
    name: '関西弁',
    name_en: 'Kansai Dialect',
    center: { lat: 34.6937, lng: 135.5023 },
    bounds: { north: 35.1, south: 34.5, east: 135.9, west: 135.2 },
    color: '#F59E0B',
    description: '関西地方の方言'
  },
  {
    id: 'hiroshima',
    name: '広島弁',
    name_en: 'Hiroshima Dialect',
    center: { lat: 34.3853, lng: 132.4553 },
    bounds: { north: 34.5, south: 34.2, east: 132.6, west: 132.3 },
    color: '#F59E0B',
    description: '中国地方の方言'
  },
  {
    id: 'hakata',
    name: '博多弁',
    name_en: 'Hakata Dialect',
    center: { lat: 33.5904, lng: 130.4017 },
    bounds: { north: 33.7, south: 33.4, east: 130.5, west: 130.2 },
    color: '#10B981',
    description: '福岡・博多の方言'
  },
  {
    id: 'tsugaru',
    name: '津軽弁',
    name_en: 'Tsugaru Dialect',
    center: { lat: 40.8244, lng: 140.7404 },
    bounds: { north: 41.0, south: 40.6, east: 140.9, west: 140.6 },
    color: '#8B5CF6',
    description: '青森県津軽地方の方言'
  },
  {
    id: 'sendai',
    name: '仙台弁',
    name_en: 'Sendai Dialect',
    center: { lat: 38.2682, lng: 140.8694 },
    bounds: { north: 38.4, south: 38.1, east: 141.0, west: 140.7 },
    color: '#8B5CF6',
    description: '東北地方の代表的な方言'
  },
  {
    id: 'nagoya',
    name: '名古屋弁',
    name_en: 'Nagoya Dialect',
    center: { lat: 35.1815, lng: 136.9066 },
    bounds: { north: 35.3, south: 35.0, east: 137.1, west: 136.7 },
    color: '#F97316',
    description: '中部地方の方言'
  },
  {
    id: 'sapporo',
    name: '札幌弁',
    name_en: 'Sapporo Dialect',
    center: { lat: 43.0642, lng: 141.3469 },
    bounds: { north: 43.2, south: 42.9, east: 141.5, west: 141.1 },
    color: '#06B6D4',
    description: '北海道の方言'
  },
  {
    id: 'okinawa',
    name: '沖縄方言',
    name_en: 'Okinawa Dialect',
    center: { lat: 26.2124, lng: 127.6792 },
    bounds: { north: 26.4, south: 26.0, east: 127.8, west: 127.5 },
    color: '#EC4899',
    description: '沖縄の方言'
  },
  {
    id: 'kagoshima',
    name: '鹿児島弁',
    name_en: 'Kagoshima Dialect',
    center: { lat: 31.5602, lng: 130.5581 },
    bounds: { north: 31.7, south: 31.4, east: 130.7, west: 130.4 },
    color: '#84CC16',
    description: '鹿児島の方言'
  }
];

const MapComponent: React.FC<JapaneseDialectMapProps> = ({
  selectedDialect,
  onDialectSelect,
  onDialectHover
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const infoWindowRef = useRef<google.maps.InfoWindow | null>(null);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const map = new google.maps.Map(mapRef.current, {
      center: { lat: 36.0, lng: 138.0 },
      zoom: 6,
      mapTypeId: google.maps.MapTypeId.ROADMAP,
      streetViewControl: false,
      fullscreenControl: false,
      mapTypeControl: false,
      restriction: {
        latLngBounds: {
          north: 45.5,
          south: 24.0,
          west: 129.0,
          east: 146.0
        },
        strictBounds: true
      }
    });

    mapInstanceRef.current = map;
    infoWindowRef.current = new google.maps.InfoWindow();

    // 方言地域のマーカーを作成
    DIALECT_REGIONS.forEach(region => {
      const marker = new google.maps.Marker({
        position: region.center,
        map: map,
        title: region.name,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 12,
          fillColor: region.color,
          fillOpacity: 0.8,
          strokeColor: '#ffffff',
          strokeWeight: 2
        }
      });

      // クリックイベント
      marker.addListener('click', () => {
        onDialectSelect(region.id);
        if (infoWindowRef.current) {
          infoWindowRef.current.setContent(`
            <div style="padding: 8px; min-width: 200px;">
              <h3 style="margin: 0 0 8px 0; color: ${region.color}; font-size: 16px;">
                ${region.name}
              </h3>
              <p style="margin: 0 0 8px 0; font-size: 14px; color: #666;">
                ${region.name_en}
              </p>
              <p style="margin: 0; font-size: 12px; color: #888;">
                ${region.description}
              </p>
            </div>
          `);
          infoWindowRef.current.open(map, marker);
        }
      });

      // ホバーイベント
      marker.addListener('mouseover', () => {
        onDialectHover(region.id);
        marker.setIcon({
          path: google.maps.SymbolPath.CIRCLE,
          scale: 16,
          fillColor: region.color,
          fillOpacity: 1.0,
          strokeColor: '#ffffff',
          strokeWeight: 3
        });
      });

      marker.addListener('mouseout', () => {
        onDialectHover(null);
        marker.setIcon({
          path: google.maps.SymbolPath.CIRCLE,
          scale: 12,
          fillColor: region.color,
          fillOpacity: 0.8,
          strokeColor: '#ffffff',
          strokeWeight: 2
        });
      });

      markersRef.current.push(marker);
    });
  }, [onDialectSelect, onDialectHover]);

  // 選択された方言のマーカーをハイライト
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    markersRef.current.forEach((marker, index) => {
      const region = DIALECT_REGIONS[index];
      if (region.id === selectedDialect) {
        marker.setIcon({
          path: google.maps.SymbolPath.CIRCLE,
          scale: 18,
          fillColor: region.color,
          fillOpacity: 1.0,
          strokeColor: '#ffffff',
          strokeWeight: 4
        });
      } else {
        marker.setIcon({
          path: google.maps.SymbolPath.CIRCLE,
          scale: 12,
          fillColor: region.color,
          fillOpacity: 0.8,
          strokeColor: '#ffffff',
          strokeWeight: 2
        });
      }
    });
  }, [selectedDialect]);

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

const JapaneseDialectMap: React.FC<JapaneseDialectMapProps> = (props) => {
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

export default JapaneseDialectMap;
