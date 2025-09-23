import React, { useEffect, useRef } from 'react';
import { Wrapper, Status } from '@googlemaps/react-wrapper';
import { Language } from '../types/Language';
import countryOfficialMap from '../data/countries_official_languages.json';

interface GoogleMapViewProps {
  languages: Language[];
  selectedLanguage: Language | null;
  onLanguageClick: (language: Language) => void;
  colorMode: 'family' | 'branch' | 'subgroup';
  familyFilter?: string;
  branchFilter?: string;
  subgroupFilter?: string;
}

// 国境GeoJSON（将来は自前CDNへ移行）
const WORLD_GEOJSON_URL = 'https://raw.githubusercontent.com/datasets/geo-countries/master/data/countries.geojson';

const COLOR_PALETTE = [
  '#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd',
  '#8c564b', '#e377c2', '#7f7f7f', '#bcbd22', '#17becf',
  '#3182bd', '#6baed6', '#9ecae1', '#e6550d', '#fd8d3c',
  '#31a354', '#74c476', '#a1d99b', '#756bb1', '#9e9ac8'
];

function colorForKey(key: string | undefined): string {
  if (!key) return '#cccccc';
  let hash = 0;
  for (let i = 0; i < key.length; i++) hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
  return COLOR_PALETTE[hash % COLOR_PALETTE.length];
}

// 部分的なISO A3→A2マップ（デモ用・主要国）
const ISO_A3_TO_A2: Record<string, string> = {
  USA: 'US', GBR: 'GB', CAN: 'CA', AUS: 'AU', NZL: 'NZ', IRL: 'IE', SGP: 'SG',
  CHN: 'CN', TWN: 'TW', ESP: 'ES', MEX: 'MX', ARG: 'AR', BRA: 'BR', PRT: 'PT',
  FRA: 'FR', BEL: 'BE', CHE: 'CH', ITA: 'IT', DEU: 'DE', AUT: 'AT', RUS: 'RU',
  IND: 'IN', SAU: 'SA', JPN: 'JP', NLD: 'NL'
};

function getFeatureA2(feature: google.maps.Data.Feature): string | undefined {
  const a2 = (feature.getProperty('ISO_A2') || feature.getProperty('iso_a2') || feature.getProperty('ISO3166-1-Alpha-2') || feature.getProperty('id')) as string | undefined;
  if (a2 && typeof a2 === 'string' && a2.length === 2) return a2;
  const a3 = (feature.getProperty('ISO_A3') || feature.getProperty('ISO3166-1-Alpha-3')) as string | undefined;
  if (a3 && ISO_A3_TO_A2[a3]) return ISO_A3_TO_A2[a3];
  return undefined;
}

function getPropCaseInsensitive(feature: google.maps.Data.Feature, keys: string[]): string | undefined {
  for (const k of keys) {
    const v = feature.getProperty(k) as string | undefined;
    if (typeof v === 'string' && v.length) return v;
  }
  // 試しに小文字化キーもチェック
  for (const k of keys) {
    const v = feature.getProperty(k.toLowerCase()) as string | undefined;
    if (typeof v === 'string' && v.length) return v;
  }
  return undefined;
}

// デモ用: 主要言語の系統（最小セット）
const DEMO_LANG_LINEAGE: Record<string, { family: string; branch?: string; subgroup?: string }> = {
  eng: { family: 'インド・ヨーロッパ', branch: 'ゲルマン', subgroup: '西ゲルマン' },
  deu: { family: 'インド・ヨーロッパ', branch: 'ゲルマン', subgroup: '西ゲルマン' },
  nld: { family: 'インド・ヨーロッパ', branch: 'ゲルマン', subgroup: '西ゲルマン' },
  spa: { family: 'インド・ヨーロッパ', branch: 'ロマンス', subgroup: 'イベロ・ロマンス' },
  fra: { family: 'インド・ヨーロッパ', branch: 'ロマンス', subgroup: 'ガロ・ロマンス' },
  por: { family: 'インド・ヨーロッパ', branch: 'ロマンス', subgroup: 'イベロ・ロマンス' },
  rus: { family: 'インド・ヨーロッパ', branch: 'スラブ', subgroup: '東スラブ' },
  hin: { family: 'インド・ヨーロッパ', branch: 'インド・アーリア' },
  cmn: { family: 'シナ・チベット' },
  jpn: { family: '日本語族' },
  arb: { family: 'アフロ・アジア' }
};

function modeKeyForLangId(id: string, colorMode: 'family' | 'branch' | 'subgroup'): string | undefined {
  const ll = DEMO_LANG_LINEAGE[id];
  if (!ll) return undefined;
  if (colorMode === 'family') return ll.family;
  if (colorMode === 'branch') return ll.branch || ll.family;
  return ll.subgroup || ll.branch || ll.family;
}

const MapComponent: React.FC<GoogleMapViewProps> = ({ 
  languages, 
  selectedLanguage, 
  onLanguageClick,
  colorMode,
  familyFilter,
  branchFilter,
  subgroupFilter
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const dataLoadedRef = useRef(false);
  const legendRef = useRef<HTMLDivElement | null>(null);
  const hoverInfoRef = useRef<google.maps.InfoWindow | null>(null);
  // 主要ファミリー（これ以外は「その他」扱い）
  const MAJOR_FAMILIES = new Set<string>([
    'インド・ヨーロッパ',
    'シナ・チベット',
    'アフロ・アジア',
    'ニジェール・コンゴ',
    'オーストロネシア',
    'ドラヴィダ',
    'テュルク',
    'クラーダイ',
    'オーストロアジア'
  ]);

  const normalizeFamily = (family: string | undefined): string => {
    if (!family) return 'その他';
    return MAJOR_FAMILIES.has(family) ? family : 'その他';
  };

  // スタイル計算: 与えられた feature に対して StyleOptions を返す
  const computeStyleForFeature = (
    feature: google.maps.Data.Feature,
    langs: Language[],
    mode: 'family' | 'branch' | 'subgroup'
  ): google.maps.Data.StyleOptions => {
    const isFiltered = Boolean(familyFilter || branchFilter || subgroupFilter);
    const code = getFeatureA2(feature);

    const families = new Set<string>();
    if (code) {
      const matchedLangs = langs.filter(l => l.countries?.includes(code));
      if (isFiltered) {
        // 絞り込み時: 条件に合致する言語だけ濃色
        const filtered = matchedLangs.filter(l => (
          (!familyFilter || l.family === familyFilter) &&
          (!branchFilter || l.branch === branchFilter) &&
          (!subgroupFilter || l.subgroup === subgroupFilter)
        ));
        for (const l of filtered) {
          const key = mode === 'family' ? normalizeFamily(l.family) : mode === 'branch' ? (l.branch || normalizeFamily(l.family)) : (l.subgroup || l.branch || normalizeFamily(l.family));
          families.add(key);
        }
      } else {
        // 無絞り込み時: Family 単位で色分け
        for (const l of matchedLangs) {
          families.add(normalizeFamily(l.family));
        }
      }
      // 公用語スタブのフォールバックは、無絞り込み時のみ採用
      if (!isFiltered && !families.size) {
        const entry = (countryOfficialMap as Record<string, { official_languages: string[] }>)[code];
        if (entry) {
          for (const lid of entry.official_languages) {
            const key = modeKeyForLangId(lid, mode);
            if (key) families.add(key);
          }
        }
      }
    }
    const familyKey = families.values().next().value as string | undefined;
    const fill = colorForKey(familyKey);
    return {
      fillColor: fill,
      fillOpacity: familyKey ? 0.7 : 0.12,
      strokeColor: '#666',
      strokeOpacity: 0.6,
      strokeWeight: familyKey ? 1.1 : 0.6,
      visible: true,
      zIndex: familyKey ? 80 : 10
    };
  };

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const map = new google.maps.Map(mapRef.current, {
      center: { lat: 20, lng: 0 },
      zoom: 2,
      mapTypeId: google.maps.MapTypeId.ROADMAP,
      streetViewControl: false,
      fullscreenControl: false,
      mapTypeControl: false,
      restriction: {
        latLngBounds: {
          north: 85,
          south: -85,
          west: -180,
          east: 180
        },
        strictBounds: true
      }
    });

    mapInstanceRef.current = map;
    // 国境GeoJSONを読み込み
    fetch(WORLD_GEOJSON_URL)
      .then(r => r.json())
      .then((geojson) => {
        const added = map.data.addGeoJson(geojson);
        dataLoadedRef.current = true;
        console.info('[GoogleMapView] Loaded features:', added.length);
        // setStyle と overrideStyle の両方を適用
        map.data.setStyle((f) => computeStyleForFeature(f, languages, colorMode));
        map.data.forEach((f) => map.data.overrideStyle(f, computeStyleForFeature(f, languages, colorMode)));
        // 後から追加される場合にも適用
        map.data.addListener('addfeature', (e) => {
          const style = computeStyleForFeature(e.feature, languages, colorMode);
          map.data.overrideStyle(e.feature, style);
        });
        // ホバーでカーソル変更 + ツールチップ
        hoverInfoRef.current = new google.maps.InfoWindow({
          content: '',
          disableAutoPan: true
        });

        map.data.addListener('mouseover', (ev) => {
          map.setOptions({ draggableCursor: 'pointer' });
          const feature = ev.feature;
          const code = getFeatureA2(feature);
          if (code && hoverInfoRef.current) {
            // 該当国の可視言語（最大5件）
            const list = languages.filter(l => l.countries?.includes(code)).slice(0, 5).map(l => l.name_ja);
            const html = `
              <div style="font-size:12px;line-height:1.4;">
                <div style="font-weight:600;margin-bottom:4px;">${code}</div>
                ${list.length ? `<div>${list.join(' / ')}</div>` : '<div style="color:#666;">公用語データなし</div>'}
              </div>
            `;
            hoverInfoRef.current.setContent(html);
            if (ev.latLng) {
              hoverInfoRef.current.setPosition(ev.latLng);
              hoverInfoRef.current.open({ map });
            }
          }
        });
        map.data.addListener('mouseout',  () => {
          map.setOptions({ draggableCursor: undefined });
          if (hoverInfoRef.current) hoverInfoRef.current.close();
        });

        // クリック時: その国に紐づく可視言語の先頭を詳細表示
        map.data.addListener('click', (ev) => {
          const feature = ev.feature;
          const code = getFeatureA2(feature);
          if (!code) return;
          const lang = languages.find(l => l.countries?.includes(code));
          if (lang) onLanguageClick(lang);
        });
        // デバッグポリゴンは撤去（運用ロジックへ切替）
      })
      .catch(e => console.error('Failed to load world geojson', e));

    // 凡例コントロール
    const legend = document.createElement('div');
    legend.style.background = 'white';
    legend.style.padding = '8px 10px';
    legend.style.margin = '10px';
    legend.style.borderRadius = '6px';
    legend.style.boxShadow = '0 1px 4px rgba(0,0,0,0.2)';
    legend.style.fontSize = '12px';
    legend.innerHTML = '<div style="font-weight:600;margin-bottom:6px;">Family</div>' +
      COLOR_PALETTE.slice(0,6).map((c,i)=>`<div style="display:flex;align-items:center;margin:2px 0;"><span style="display:inline-block;width:12px;height:12px;background:${c};margin-right:6px;border:1px solid #ccc"></span>色サンプル ${i+1}</div>`).join('');
    legendRef.current = legend;
    map.controls[google.maps.ControlPosition.LEFT_BOTTOM].push(legend);
  }, []);

  useEffect(() => {
    if (!mapInstanceRef.current || !dataLoadedRef.current) return;
    // スタイル更新: 既存フィーチャのスタイルを全て上書き
    mapInstanceRef.current.data.revertStyle();
    mapInstanceRef.current.data.setStyle((f) => computeStyleForFeature(f, languages, colorMode));
    mapInstanceRef.current.data.forEach((f) => {
      const style = computeStyleForFeature(f, languages, colorMode);
      mapInstanceRef.current!.data.overrideStyle(f, style);
    });
    // 凡例の更新（可視言語のファミリー一覧）
    if (legendRef.current) {
      const isFiltered = Boolean(familyFilter || branchFilter || subgroupFilter);
      const keys = Array.from(new Set(languages.flatMap(l => {
        if (!isFiltered) {
          return [normalizeFamily(l.family)];
        }
        const ok = (!familyFilter || l.family === familyFilter) && (!branchFilter || l.branch === branchFilter) && (!subgroupFilter || l.subgroup === subgroupFilter);
        if (!ok) return [] as string[];
        const key = colorMode === 'family' ? normalizeFamily(l.family) : colorMode === 'branch' ? (l.branch || normalizeFamily(l.family)) : (l.subgroup || l.branch || normalizeFamily(l.family));
        return [key];
      })) ).sort();
      // その他は末尾へ
      keys.sort((a,b)=> (a==='その他') ? 1 : (b==='その他') ? -1 : a.localeCompare(b));
      const rows = keys.map(key => {
        const color = colorForKey(key);
        return `<div style="display:flex;align-items:center;margin:2px 0;">
          <span style="display:inline-block;width:12px;height:12px;background:${color};margin-right:6px;border:1px solid #ccc"></span>
          <span>${key}</span>
        </div>`;
      }).join('');
      const title = colorMode.charAt(0).toUpperCase() + colorMode.slice(1);
      legendRef.current.innerHTML = `<div style=\"font-weight:600;margin-bottom:6px;\">${title}</div>${rows || '<div style="color:#666;">該当なし</div>'}`;
    }
  }, [languages, onLanguageClick, colorMode, familyFilter, branchFilter, subgroupFilter]);

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
