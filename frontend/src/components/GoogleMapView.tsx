import React, { useEffect, useRef, useState, useMemo } from 'react';
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

// 固定カラー（仕様: docs/language_map_specification.md 3.2.1）
const FAMILY_COLORS: Record<string, string> = {
  'インド・ヨーロッパ': '#3B82F6',
  'シナ・チベット': '#EF4444',
  'ニジェール・コンゴ': '#10B981',
  'アフロ・アジア': '#F59E0B',
  'オーストロネシア': '#8B5CF6',
  'アルタイ': '#F97316',
  'ドラヴィダ': '#EC4899',
  'その他': '#6B7280'
};

const COLOR_PALETTE = [
  '#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd',
  '#8c564b', '#e377c2', '#7f7f7f', '#bcbd22', '#17becf',
  '#3182bd', '#6baed6', '#9ecae1', '#e6550d', '#fd8d3c',
  '#31a354', '#74c476', '#a1d99b', '#756bb1', '#9e9ac8'
];

function colorForKey(key: string | undefined): string {
  if (!key) return '#cccccc';
  if (FAMILY_COLORS[key]) return FAMILY_COLORS[key];
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

// 国コード単位の最終フォールバック（Wikidataに出てこない準国家・地域など）
const FALLBACK_A2_TO_LANGIDS: Record<string, string[]> = {
  NO: ['nor','nob','nno'],
  UA: ['ukr'],
  MD: ['ron'],
  RS: ['srp'],
  FR: ['fra'],
  GL: ['kal'],
  SJ: ['nor'],
  SO: ['som','ara'],
  // ソマリランド（Hargeisa 周辺）やプントランド（Bosaso 周辺）等の部分行政区分
  'XS': ['som'],
  'XP': ['som']
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
  jpn: { family: 'その他' },
  kor: { family: 'その他' },
  fin: { family: 'その他' },
  hun: { family: 'その他' },
  ita: { family: 'インド・ヨーロッパ', branch: 'ロマンス', subgroup: 'イタロ・ロマンス' },
  pol: { family: 'インド・ヨーロッパ', branch: 'スラブ', subgroup: '西スラブ' },
  ukr: { family: 'インド・ヨーロッパ', branch: 'スラブ', subgroup: '東スラブ' },
  bel: { family: 'インド・ヨーロッパ', branch: 'スラブ', subgroup: '東スラブ' },
  ron: { family: 'インド・ヨーロッパ', branch: 'ロマンス', subgroup: 'バルカン・ロマンス' },
  bul: { family: 'インド・ヨーロッパ', branch: 'スラブ', subgroup: '南スラブ' },
  ces: { family: 'インド・ヨーロッパ', branch: 'スラブ', subgroup: '西スラブ' },
  slk: { family: 'インド・ヨーロッパ', branch: 'スラブ', subgroup: '西スラブ' },
  ell: { family: 'インド・ヨーロッパ', branch: 'ギリシア' },
  swe: { family: 'インド・ヨーロッパ', branch: 'ゲルマン', subgroup: '北ゲルマン' },
  nor: { family: 'インド・ヨーロッパ', branch: 'ゲルマン', subgroup: '北ゲルマン' },
  nob: { family: 'インド・ヨーロッパ', branch: 'ゲルマン', subgroup: '北ゲルマン' },
  nno: { family: 'インド・ヨーロッパ', branch: 'ゲルマン', subgroup: '北ゲルマン' },
  dan: { family: 'インド・ヨーロッパ', branch: 'ゲルマン', subgroup: '北ゲルマン' },
  srp: { family: 'インド・ヨーロッパ', branch: 'スラブ', subgroup: '南スラブ' },
  mlt: { family: 'アフロ・アジア', branch: 'セム' },
  kat: { family: 'その他' },
  kal: { family: 'その他' },
  tur: { family: 'テュルク', branch: 'オグズ' },
  aze: { family: 'テュルク', branch: 'オグズ' },
  kaz: { family: 'テュルク', branch: 'キプチャク' },
  uzb: { family: 'テュルク', branch: 'カルルク' },
  ara: { family: 'アフロ・アジア', branch: 'セム' },
  arb: { family: 'アフロ・アジア', branch: 'セム' },
  heb: { family: 'アフロ・アジア', branch: 'セム' },
  fas: { family: 'インド・ヨーロッパ', branch: 'イラン' },
  pes: { family: 'インド・ヨーロッパ', branch: 'イラン' },
  kur: { family: 'インド・ヨーロッパ', branch: 'イラン' },
  urd: { family: 'インド・ヨーロッパ', branch: 'インド・アーリア' },
  ben: { family: 'インド・ヨーロッパ', branch: 'インド・アーリア' },
  pan: { family: 'インド・ヨーロッパ', branch: 'インド・アーリア' },
  tam: { family: 'ドラヴィダ' },
  tel: { family: 'ドラヴィダ' },
  kan: { family: 'ドラヴィダ' },
  mal: { family: 'ドラヴィダ' },
  vie: { family: 'オーストロアジア', branch: 'モン–クメール' },
  tha: { family: 'クラーダイ', branch: 'タイ' },
  ind: { family: 'オーストロネシア', branch: 'マレー・ポリネシア' },
  zsm: { family: 'オーストロネシア', branch: 'マレー・ポリネシア' }
};

function modeKeyForLangId(id: string, colorMode: 'family' | 'branch' | 'subgroup'): string | undefined {
  const ll = DEMO_LANG_LINEAGE[id];
  if (!ll) {
    // 未定義コードは Family=その他 へフォールバック
    return colorMode === 'family' ? 'その他' : undefined;
  }
  if (colorMode === 'family') return ll.family;
  if (colorMode === 'branch') return ll.branch || ll.family;
  return ll.subgroup || ll.branch || ll.family;
}

// ズームに応じて可視化件数をサンプリング（Phase 7 足場）
function sampleLanguagesByZoom(zoom: number, langs: Language[]): Language[] {
  // ズームが低いほど件数を絞る。total_speakers が無ければ安定順で切る
  const cap = zoom >= 7 ? Infinity : zoom >= 5 ? 500 : zoom >= 3 ? 200 : 80;
  if (!isFinite(cap)) return langs;
  const withScore = langs.map((l) => ({
    l,
    s: typeof l.total_speakers === 'number' ? -l.total_speakers : l.id.charCodeAt(0)
  }));
  withScore.sort((a, b) => a.s - b.s);
  return withScore.slice(0, cap).map(x => x.l);
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
  const [zoomLevel, setZoomLevel] = useState<number>(2);
  const visibleLanguages = useMemo(() => sampleLanguagesByZoom(zoomLevel, languages), [zoomLevel, languages]);
  // 主要ファミリー（これ以外は「その他」扱い）
  const MAJOR_FAMILIES = new Set<string>([
    'インド・ヨーロッパ',
    'シナ・チベット',
    'ニジェール・コンゴ',
    'アフロ・アジア',
    'オーストロネシア',
    'アルタイ',
    'ドラヴィダ',
    // 他は「その他」へ
  ]);

  const normalizeFamily = (family: string | undefined): string => {
    if (!family) return 'その他';
    // テュルク/モンゴル/ツングース等は暫定的に「アルタイ」へ吸収
    if (family === 'テュルク' || family === 'モンゴル' || family === 'ツングース' || family === 'アルタイ') return 'アルタイ';
    if (family === '日本語族') return 'その他';
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
    const adminName = getPropCaseInsensitive(feature, ['ADMIN','NAME','name']);

    // 南極は塗りなし
    if (code === 'AQ' || (adminName && /Antarctica/i.test(adminName))) {
      return {
        fillColor: '#000000',
        fillOpacity: 0,
        strokeColor: '#666',
        strokeOpacity: 0.3,
        strokeWeight: 0.4,
        visible: true,
        zIndex: 1
      };
    }
    // クリティカルな暫定対処: FR/NO/SJ は強制的に適切なキーで着色
    if (code === 'FR' || (adminName && /France/i.test(adminName))) {
      const fill = colorForKey('インド・ヨーロッパ');
      return { fillColor: fill, fillOpacity: 0.7, strokeColor: '#666', strokeOpacity: 0.6, strokeWeight: 1.1, visible: true, zIndex: 95 };
    }
    if (code === 'NO' || code === 'SJ' || (adminName && /(Norway|Svalbard)/i.test(adminName))) {
      const fill = colorForKey('インド・ヨーロッパ');
      return { fillColor: fill, fillOpacity: 0.7, strokeColor: '#666', strokeOpacity: 0.6, strokeWeight: 1.1, visible: true, zIndex: 95 };
    }

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
        // マッチが無い場合でも公用語データから該当キーを推定
        if (!families.size) {
          const entry = (countryOfficialMap as Record<string, { official_languages: string[] }>)[code];
          if (entry) {
            for (const lid of entry.official_languages) {
              const key = modeKeyForLangId(lid, mode);
              if (!key) continue;
              // フィルタ条件に一致するキーのみ着色
              const keyMatches = (
                (!familyFilter || key === familyFilter || (mode==='branch'||mode==='subgroup' ? true : false)) &&
                (!branchFilter || key === branchFilter || (mode==='subgroup' ? true : false)) &&
                (!subgroupFilter || key === subgroupFilter)
              );
              if (keyMatches) families.add(key);
            }
          }
        }
      } else {
        // 無絞り込み時: colorModeに応じた色分け
        for (const l of matchedLangs) {
          if (mode === 'family') {
            families.add(normalizeFamily(l.family));
          } else if (mode === 'branch') {
            families.add(l.branch || '未分類');
          } else if (mode === 'subgroup') {
            families.add(l.subgroup || '未分類');
          }
        }
      }
      // 公用語スタブのフォールバック（無絞り込み時: Family推定）
      if (!families.size) {
        const entry = (countryOfficialMap as Record<string, { official_languages: string[] }>)[code];
        if (entry) {
          for (const lid of entry.official_languages) {
            const key = modeKeyForLangId(lid, mode);
            if (key) families.add(key);
          }
          // 依然としてキーが得られない場合は "その他" を採用して必ず塗る（無選択時）
          if (!families.size && !isFiltered && mode === 'family') {
            families.add('その他');
          }
        } else {
          // Wikidataに存在しない地域などはローカルフォールバック
          const lids = FALLBACK_A2_TO_LANGIDS[code];
          if (lids) {
            for (const lid of lids) {
              const key = modeKeyForLangId(lid, mode);
              if (key) families.add(key);
            }
          } else if (!isFiltered && mode === 'family') {
            families.add('その他');
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
    // ズーム変更で可視件数を更新
    map.addListener('zoom_changed', () => {
      const z = map.getZoom() ?? 2;
      setZoomLevel(z);
    });
    // 国境GeoJSONを読み込み
    fetch(WORLD_GEOJSON_URL)
      .then(r => r.json())
      .then((geojson) => {
        const added = map.data.addGeoJson(geojson);
        dataLoadedRef.current = true;
        console.info('[GoogleMapView] Loaded features:', added.length);
        // setStyle と overrideStyle の両方を適用
        map.data.setStyle((f) => computeStyleForFeature(f, visibleLanguages, colorMode));
        map.data.forEach((f) => map.data.overrideStyle(f, computeStyleForFeature(f, visibleLanguages, colorMode)));
        // 後から追加される場合にも適用
        map.data.addListener('addfeature', (e) => {
          const style = computeStyleForFeature(e.feature, visibleLanguages, colorMode);
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
            // 該当国の可視言語（最大5件）。無ければ公用語フォールバック
            let list = visibleLanguages.filter(l => l.countries?.includes(code)).slice(0, 5).map(l => l.name_ja);
            if (!list.length) {
              const entry = (countryOfficialMap as Record<string, { official_languages: string[] }>)[code];
              if (entry) {
                list = entry.official_languages.slice(0,5).map((lid) => {
                  const byId = visibleLanguages.find(l => l.id === lid);
                  return byId ? byId.name_ja : lid.toUpperCase();
                });
              }
            }
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
          const lang = visibleLanguages.find(l => l.countries?.includes(code));
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
    legend.style.minWidth = '120px';
    legend.innerHTML = '<div style="font-weight:600;margin-bottom:6px;">Family</div><div style="color:#666;">読み込み中...</div>';
    legendRef.current = legend;
    map.controls[google.maps.ControlPosition.LEFT_BOTTOM].push(legend);
    
    // 初期凡例更新（地図読み込み完了後）
    const updateInitialLegend = () => {
      if (legendRef.current && languages.length > 0) {
        const isFiltered = Boolean(familyFilter || branchFilter || subgroupFilter);
        
        let keys: string[];
        if (colorMode === 'family') {
          // Family モード: 固定の8つのファミリーを表示
          keys = [
            'インド・ヨーロッパ',
            'シナ・チベット',
            'ニジェール・コンゴ',
            'アフロ・アジア',
            'オーストロネシア',
            'アルタイ',
            'ドラヴィダ',
            'その他'
          ];
        } else {
          // Branch/Subgroup モード: 実際のデータから動的生成
          keys = Array.from(new Set(languages.flatMap(l => {
            if (!isFiltered) {
              if (colorMode === 'branch') {
                return [l.branch || '未分類'];
              } else if (colorMode === 'subgroup') {
                return [l.subgroup || '未分類'];
              }
              return [normalizeFamily(l.family)];
            }
            const ok = (!familyFilter || l.family === familyFilter) && (!branchFilter || l.branch === branchFilter) && (!subgroupFilter || l.subgroup === subgroupFilter);
            if (!ok) return [] as string[];
            if (colorMode === 'branch') {
              return [l.branch || '未分類'];
            } else if (colorMode === 'subgroup') {
              return [l.subgroup || '未分類'];
            }
            return [normalizeFamily(l.family)];
          })) ).sort();
          
          // その他/未分類は末尾へ移動
          const others = ['その他', '未分類'];
          others.forEach(other => {
            if (keys.includes(other)) {
              keys.splice(keys.indexOf(other), 1);
              keys.push(other);
            }
          });
        }
        
        const rows = keys.map(key => {
          const color = colorForKey(key);
          return `<div style="display:flex;align-items:center;margin:2px 0;">
            <span style="display:inline-block;width:12px;height:12px;background:${color};margin-right:6px;border:1px solid #ccc"></span>
            <span>${key}</span>
          </div>`;
        }).join('');
        
        const title = colorMode === 'family' ? 'Family' : colorMode === 'branch' ? 'Branch' : 'Subgroup';
        legendRef.current.innerHTML = `<div style="font-weight:600;margin-bottom:6px;">${title}</div>${rows || '<div style="color:#666;">該当なし</div>'}`;
      }
    };
    
    // 言語データが利用可能になったら凡例を更新
    if (languages.length > 0) {
      updateInitialLegend();
    }
  }, [languages, colorMode, familyFilter, branchFilter, subgroupFilter]);

  useEffect(() => {
    if (!mapInstanceRef.current || !dataLoadedRef.current) return;
    // スタイル更新: 既存フィーチャのスタイルを全て上書き
    mapInstanceRef.current.data.revertStyle();
    mapInstanceRef.current.data.setStyle((f) => computeStyleForFeature(f, visibleLanguages, colorMode));
    mapInstanceRef.current.data.forEach((f) => {
      const style = computeStyleForFeature(f, visibleLanguages, colorMode);
      mapInstanceRef.current!.data.overrideStyle(f, style);
    });
    // 凡例の更新（可視言語のファミリー一覧）
    if (legendRef.current) {
      const isFiltered = Boolean(familyFilter || branchFilter || subgroupFilter);
      
      let keys: string[];
      if (colorMode === 'family') {
        // Family モード: 固定の8つのファミリーを表示
        keys = [
          'インド・ヨーロッパ',
          'シナ・チベット',
          'ニジェール・コンゴ',
          'アフロ・アジア',
          'オーストロネシア',
          'アルタイ',
          'ドラヴィダ',
          'その他'
        ];
      } else {
        // Branch/Subgroup モード: 実際のデータから動的生成
        keys = Array.from(new Set(visibleLanguages.flatMap(l => {
          if (!isFiltered) {
            if (colorMode === 'branch') {
              return [l.branch || '未分類'];
            } else if (colorMode === 'subgroup') {
              return [l.subgroup || '未分類'];
            }
            return [normalizeFamily(l.family)];
          }
          const ok = (!familyFilter || l.family === familyFilter) && (!branchFilter || l.branch === branchFilter) && (!subgroupFilter || l.subgroup === subgroupFilter);
          if (!ok) return [] as string[];
          if (colorMode === 'branch') {
            return [l.branch || '未分類'];
          } else if (colorMode === 'subgroup') {
            return [l.subgroup || '未分類'];
          }
          return [normalizeFamily(l.family)];
        })) ).sort();
        
        // その他/未分類は末尾へ移動
        const others = ['その他', '未分類'];
        others.forEach(other => {
          if (keys.includes(other)) {
            keys.splice(keys.indexOf(other), 1);
            keys.push(other);
          }
        });
      }
      
      const rows = keys.map(key => {
        const color = colorForKey(key);
        return `<div style="display:flex;align-items:center;margin:2px 0;">
          <span style="display:inline-block;width:12px;height:12px;background:${color};margin-right:6px;border:1px solid #ccc"></span>
          <span>${key}</span>
        </div>`;
      }).join('');
      
      const title = colorMode === 'family' ? 'Family' : colorMode === 'branch' ? 'Branch' : 'Subgroup';
      legendRef.current.innerHTML = `<div style="font-weight:600;margin-bottom:6px;">${title}</div>${rows || '<div style="color:#666;">該当なし</div>'}`;
    }
  }, [visibleLanguages, onLanguageClick, colorMode, familyFilter, branchFilter, subgroupFilter]);

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
