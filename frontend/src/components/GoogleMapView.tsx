import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { Wrapper, Status } from '@googlemaps/react-wrapper';
import { Language } from '../types/Language';
import countryOfficialMap from '../data/countries_official_languages.json';

interface GoogleMapViewProps {
  languages: Language[];
  selectedLanguage: Language | null;
  onLanguageClick: (language: Language) => void;
  colorMode: 'family' | 'branch' | 'group' | 'subgroup' | 'language' | 'dialect';
  familyFilter?: string;
  branchFilter?: string;
  groupFilter?: string;
  subgroupFilter?: string;
  languageFilter?: string;
  dialectFilter?: string;
}

// 国境GeoJSON（将来は自前CDNへ移行）
const WORLD_GEOJSON_URL = 'https://raw.githubusercontent.com/datasets/geo-countries/master/data/countries.geojson';

// 固定カラー（実際のデータに基づく）
const FAMILY_COLORS: Record<string, string> = {
  'インド・ヨーロッパ': '#3B82F6',
  'シナ・チベット': '#EF4444',
  'アフロ・アジア': '#F59E0B',
  'ウラル': '#10B981',
  'オーストロアジア': '#8B5CF6',
  'カルトヴェリ': '#F97316',
  'ドラヴィダ': '#EC4899',
  'テュルク': '#06B6D4',
  '日本語族': '#DC2626',
  '朝鮮語族': '#7C3AED',
  'タイ・カダイ': '#059669',
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
const DEMO_LANG_LINEAGE: Record<string, { family: string; branch?: string; group?: string; subgroup?: string; language?: string; dialect?: string }> = {
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
  zsm: { family: 'オーストロネシア', branch: 'マレー・ポリネシア' },
  msa: { family: 'オーストロネシア', branch: 'マレー・ポリネシア' }
};

function modeKeyForLangId(id: string, colorMode: 'family' | 'branch' | 'group' | 'subgroup' | 'language' | 'dialect'): string | undefined {
  const ll = DEMO_LANG_LINEAGE[id];
  if (!ll) {
    // 未定義コードは Family=その他 へフォールバック
    return colorMode === 'family' ? 'その他' : undefined;
  }
  if (colorMode === 'family') return ll.family;
  if (colorMode === 'branch') return ll.branch || ll.family;
  if (colorMode === 'group') return ll.group || ll.branch || ll.family;
  if (colorMode === 'subgroup') return ll.subgroup || ll.group || ll.branch || ll.family;
  if (colorMode === 'language') return ll.language || ll.subgroup || ll.group || ll.branch || ll.family;
  if (colorMode === 'dialect') return ll.dialect || ll.language || ll.subgroup || ll.group || ll.branch || ll.family;
  return ll.family;
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
  groupFilter,
  subgroupFilter,
  languageFilter,
  dialectFilter
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const dataLoadedRef = useRef(false);
  const legendRef = useRef<HTMLDivElement | null>(null);
  const hoverInfoRef = useRef<google.maps.InfoWindow | null>(null);
  const [zoomLevel, setZoomLevel] = useState<number>(2);
  const visibleLanguages = useMemo(() => {
    // デバウンス処理でズーム変更時の再計算を抑制
    return sampleLanguagesByZoom(zoomLevel, languages);
  }, [zoomLevel, languages]);

  // Branchが使用されている言語ファミリーのセット（定数として定義）
  const FAMILIES_WITH_BRANCHES = useMemo(() => new Set([
    'インド・ヨーロッパ',
    'シナ・チベット',
    'アフロ・アジア',
    'ウラル',
    'テュルク',
    'ドラヴィダ',
    'カルトヴェリ',
    'タイ・カダイ',
    'オーストロアジア'
  ]), []);

  // フィルタの状態に応じて適切なcolorModeを決定する関数
  const determineColorMode = useCallback((): 'family' | 'branch' | 'group' | 'subgroup' | 'language' | 'dialect' => {
    const hasBranches = familyFilter ? FAMILIES_WITH_BRANCHES.has(familyFilter) : false;
    
    if (!familyFilter) {
      // 語族がすべての時は語族で色分け
      return 'family';
    } else if (!hasBranches) {
      // Branchの概念が適用されない言語ファミリーの場合は言語で色分け
      return 'language';
    } else if (!branchFilter) {
      // 語派がすべての時は語派で色分け
      return 'branch';
    } else if (!groupFilter) {
      // 語群がすべての時は語群で色分け
      return 'group';
    } else if (!subgroupFilter) {
      // 語支がすべての時は語支で色分け
      return 'subgroup';
    } else if (!languageFilter) {
      // 言語がすべての時は言語で色分け
      return 'language';
    } else if (!dialectFilter) {
      // 方言がすべての時は方言で色分け
      return 'dialect';
    } else {
      // 全て選択されている場合は方言で色分け
      return 'dialect';
    }
  }, [familyFilter, branchFilter, groupFilter, subgroupFilter, languageFilter, dialectFilter]);

  // 凡例更新関数
  const updateLegend = useCallback(() => {
    if (!legendRef.current) return;
    // languagesが空の場合は何もしない
    if (languages.length === 0) {
      return;
    }
    
    // Branchが使用されている言語ファミリーかどうかを判定
    const familiesWithBranches = new Set([
      'インド・ヨーロッパ',
      'シナ・チベット',
      'アフロ・アジア',
      'ウラル',
      'テュルク',
      'ドラヴィダ',
      'カルトヴェリ',
      '日本語族',
      '朝鮮語族',
      'タイ・カダイ',
      'オーストロアジア'
    ]);
    const hasBranches = familyFilter ? familiesWithBranches.has(familyFilter) : false;
    
    // フィルタの状態に応じて凡例のタイトルと内容を決定（6層構造対応）
    let title: string;
    let keys: string[];
    
    if (!familyFilter) {
      // 言語ファミリーが全ての時はFamilyを表示
      title = '語族 (Family)';
      // 実際のデータから語族を動的に抽出
      keys = Array.from(new Set(
        languages.map(l => l.family)
      )).sort();
    } else if (!hasBranches) {
      // Branchの概念が適用されない言語ファミリーの場合は、言語名を表示
      title = '言語 (Languages)';
      const filteredLanguages = languages.filter(l => l.family === familyFilter);
      keys = filteredLanguages.map(l => l.name_ja).sort();
    } else if (!branchFilter) {
      // 言語ファミリーが選ばれている時はBranchを表示
      title = '語派 (Branch)';
      const filteredLanguages = languages.filter(l => l.family === familyFilter);
      keys = Array.from(new Set(
        filteredLanguages.map(l => l.branch || '未分類')
      )).sort();
    } else if (!groupFilter) {
      // 語派が選ばれている時は語群を表示
      title = '語群 (Group)';
      const filteredLanguages = languages.filter(l => l.family === familyFilter && l.branch === branchFilter);
      keys = Array.from(new Set(
        filteredLanguages.map(l => l.group || '未分類')
      )).sort();
    } else if (!subgroupFilter) {
      // 語群が選ばれている時は語支を表示
      title = '語支 (Subgroup)';
      const filteredLanguages = languages.filter(l => l.family === familyFilter && l.branch === branchFilter && l.group === groupFilter);
      keys = Array.from(new Set(
        filteredLanguages.map(l => l.subgroup || '未分類')
      )).sort();
    } else if (!languageFilter) {
      // 語支が選ばれている時は言語を表示
      title = '言語 (Language)';
      const filteredLanguages = languages.filter(l => l.family === familyFilter && l.branch === branchFilter && l.group === groupFilter && l.subgroup === subgroupFilter);
      keys = Array.from(new Set(
        filteredLanguages.map(l => l.language || l.name_ja)
      )).sort();
    } else if (!dialectFilter) {
      // 言語が選ばれている時は方言を表示
      title = '方言 (Dialect)';
      const filteredLanguages = languages.filter(l => l.family === familyFilter && l.branch === branchFilter && l.group === groupFilter && l.subgroup === subgroupFilter && l.language === languageFilter);
      keys = Array.from(new Set(
        filteredLanguages.flatMap(l => l.dialects || []).map(dialect => dialect.name)
      )).sort();
    } else {
      // 全て選択されている場合は方言を表示
      title = '方言 (Dialect)';
      const filteredLanguages = languages.filter(l => l.family === familyFilter && l.branch === branchFilter && l.group === groupFilter && l.subgroup === subgroupFilter && l.language === languageFilter);
      keys = Array.from(new Set(
        filteredLanguages.flatMap(l => l.dialects || []).map(dialect => dialect.name)
      )).sort();
    }
    
    // その他/未分類は末尾へ移動
    const others = ['その他', '未分類'];
    others.forEach(other => {
      if (keys.includes(other)) {
        keys.splice(keys.indexOf(other), 1);
        keys.push(other);
      }
    });
    
    // コンパクト凡例の実装
    const maxVisibleItems = 8; // 最大表示項目数
    const showMore = keys.length > maxVisibleItems;
    const visibleKeys = showMore ? keys.slice(0, maxVisibleItems) : keys;
    const hiddenCount = keys.length - maxVisibleItems;
    
    
    const moreButton = showMore ? `<div style="font-size:10px;color:#666;margin-top:4px;cursor:pointer;text-align:center;padding:2px;border:1px solid #ddd;border-radius:3px;" onclick="this.parentElement.querySelector('.hidden-items').style.display='block';this.style.display='none';">
      +${hiddenCount}件を表示
    </div>` : '';
    
    // 色分け結果をキャッシュして最適化
    const colorCache = new Map<string, string>();
    const getCachedColor = (key: string) => {
      if (!colorCache.has(key)) {
        colorCache.set(key, colorForKey(key));
      }
      return colorCache.get(key)!;
    };

    
    
    // 検索機能付き凡例
    const searchId = `legend-search-${Date.now()}`;
    const searchInput = keys.length > 5 ? `
      <input 
        id="${searchId}" 
        type="text" 
        placeholder="検索..." 
        style="width:100%;padding:2px 4px;font-size:10px;border:1px solid #ccc;border-radius:2px;margin-bottom:4px;"
        onkeyup="
          const searchTerm = this.value.toLowerCase();
          const items = this.parentElement.querySelectorAll('.legend-item');
          items.forEach(item => {
            const text = item.textContent.toLowerCase();
            item.style.display = text.includes(searchTerm) ? 'flex' : 'none';
          });
        "
      />
    ` : '';
    
    const rowsWithClass = visibleKeys.map(key => {
      const color = getCachedColor(key);
      return `<div class="legend-item" style="display:flex;align-items:center;margin:1px 0;font-size:11px;line-height:1.2;">
        <span style="display:inline-block;width:10px;height:10px;background:${color};margin-right:4px;border:1px solid #ccc;flex-shrink:0;"></span>
        <span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${key}</span>
      </div>`;
    }).join('');
    
    const hiddenRowsWithClass = showMore ? keys.slice(maxVisibleItems).map(key => {
      const color = getCachedColor(key);
      return `<div class="legend-item" style="display:flex;align-items:center;margin:1px 0;font-size:11px;line-height:1.2;">
        <span style="display:inline-block;width:10px;height:10px;background:${color};margin-right:4px;border:1px solid #ccc;flex-shrink:0;"></span>
        <span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${key}</span>
      </div>`;
    }).join('') : '';
    
    const hiddenSectionWithClass = showMore ? `<div class="hidden-items" style="display:none;">${hiddenRowsWithClass}</div>` : '';
    
    // 階層パンくずリスト
    const breadcrumb = [];
    if (familyFilter) breadcrumb.push(familyFilter);
    if (branchFilter) breadcrumb.push(branchFilter);
    if (groupFilter) breadcrumb.push(groupFilter);
    if (subgroupFilter) breadcrumb.push(subgroupFilter);
    if (languageFilter) breadcrumb.push(languageFilter);
    
    const breadcrumbHtml = breadcrumb.length > 0 ? `
      <div style="font-size:9px;color:#666;margin-bottom:4px;padding:2px 4px;background:#f5f5f5;border-radius:2px;">
        ${breadcrumb.join(' > ')}
      </div>
    ` : '';
    
    // 統計情報
    const statsHtml = keys.length > 0 ? `
      <div style="font-size:9px;color:#888;margin-bottom:4px;text-align:right;">
        ${visibleKeys.length}${showMore ? `/${keys.length}` : ''}件
      </div>
    ` : '';
    
    
    legendRef.current.innerHTML = `
      <div style="font-weight:600;margin-bottom:4px;font-size:12px;border-bottom:1px solid #ddd;padding-bottom:2px;">${title}</div>
      ${breadcrumbHtml}
      ${statsHtml}
      ${searchInput}
      <div style="max-height:200px;overflow-y:auto;overflow-x:hidden;">
        ${rowsWithClass || '<div style="color:#666;font-size:10px;">該当なし</div>'}
        ${hiddenSectionWithClass}
      </div>
      ${moreButton}
    `;
  }, [languages, familyFilter, branchFilter, groupFilter, subgroupFilter, languageFilter, dialectFilter]);
  
  // フィルタが変更された時に地図のスタイルを更新
  useEffect(() => {
    if (mapInstanceRef.current && dataLoadedRef.current) {
      const currentColorMode = determineColorMode();
      mapInstanceRef.current.data.revertStyle();
      mapInstanceRef.current.data.setStyle((f) => computeStyleForFeature(f, visibleLanguages, currentColorMode));
      mapInstanceRef.current.data.forEach((f) => {
        const style = computeStyleForFeature(f, visibleLanguages, currentColorMode);
        mapInstanceRef.current!.data.overrideStyle(f, style);
      });
    }
  }, [familyFilter, branchFilter, groupFilter, subgroupFilter, languageFilter, dialectFilter, determineColorMode, visibleLanguages]);
  
  // 実際のデータに基づく主要ファミリー
  const MAJOR_FAMILIES = new Set<string>([
    'インド・ヨーロッパ',
    'シナ・チベット',
    'アフロ・アジア',
    'ウラル',
    'オーストロアジア',
    'カルトヴェリ',
    'ドラヴィダ',
    'テュルク',
    '日本語族',
    '朝鮮語族',
    'タイ・カダイ'
  ]);

  const normalizeFamily = (family: string | undefined): string => {
    if (!family) return 'その他';
    return MAJOR_FAMILIES.has(family) ? family : 'その他';
  };

  // スタイル計算: 与えられた feature に対して StyleOptions を返す
  const computeStyleForFeature = (
    feature: google.maps.Data.Feature,
    langs: Language[],
    mode: 'family' | 'branch' | 'group' | 'subgroup' | 'language' | 'dialect'
  ): google.maps.Data.StyleOptions => {
    const isFiltered = Boolean(familyFilter || branchFilter || groupFilter || subgroupFilter || languageFilter || dialectFilter);
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
    // クリティカルな暫定対処: FR/NO/SJ は強制的に適切なキーで着色（フィルタ適用時は無効）
    if (!isFiltered) {
      if (code === 'FR' || (adminName && /France/i.test(adminName))) {
        const fill = colorForKey('インド・ヨーロッパ');
        return { fillColor: fill, fillOpacity: 0.7, strokeColor: '#666', strokeOpacity: 0.6, strokeWeight: 1.1, visible: true, zIndex: 95 };
      }
      if (code === 'NO' || code === 'SJ' || (adminName && /(Norway|Svalbard)/i.test(adminName))) {
        const fill = colorForKey('インド・ヨーロッパ');
        return { fillColor: fill, fillOpacity: 0.7, strokeColor: '#666', strokeOpacity: 0.6, strokeWeight: 1.1, visible: true, zIndex: 95 };
      }
    }

    const families = new Set<string>();
    if (code) {
      const matchedLangs = langs.filter(l => l.countries?.includes(code));
      if (isFiltered) {
        // 絞り込み時: 条件に合致する言語だけ濃色
        // フィルタ条件を事前に計算して最適化
        const hasDialectFilter = Boolean(dialectFilter);
        const filtered = matchedLangs.filter(l => {
          // 早期リターンでパフォーマンス向上
          if (familyFilter && l.family !== familyFilter) return false;
          if (branchFilter && l.branch !== branchFilter) return false;
          if (groupFilter && l.group !== groupFilter) return false;
          if (subgroupFilter && l.subgroup !== subgroupFilter) return false;
          if (languageFilter && l.language !== languageFilter) return false;
          if (hasDialectFilter && (!l.dialects || !l.dialects.some(d => d.name === dialectFilter))) return false;
          return true;
        });
        
        // 複数言語がある場合は、話者数が最も多い言語を優先
        if (filtered.length > 1) {
          filtered.sort((a, b) => (b.total_speakers || 0) - (a.total_speakers || 0));
        }
        
        // フィルタ条件に合致する言語が1つでもあれば、その国を色分け
        if (filtered.length > 0) {
          // 主言語（話者数が最も多い言語）がフィルタ条件に合致する場合のみ色分け
          const primaryLanguage = filtered.reduce((prev, current) => 
            (current.total_speakers || 0) > (prev.total_speakers || 0) ? current : prev
          );
          
          let key: string;
          if (mode === 'family') {
            key = normalizeFamily(primaryLanguage.family);
          } else if (mode === 'branch') {
            key = primaryLanguage.branch || normalizeFamily(primaryLanguage.family);
          } else if (mode === 'group') {
            key = primaryLanguage.group || primaryLanguage.branch || normalizeFamily(primaryLanguage.family);
          } else if (mode === 'subgroup') {
            key = primaryLanguage.subgroup || primaryLanguage.group || primaryLanguage.branch || normalizeFamily(primaryLanguage.family);
          } else if (mode === 'language') {
            key = primaryLanguage.language || primaryLanguage.subgroup || primaryLanguage.group || primaryLanguage.branch || normalizeFamily(primaryLanguage.family);
          } else if (mode === 'dialect') {
            // 方言モードの場合は、選択された方言がある場合はその方言名を使用
            if (dialectFilter && primaryLanguage.dialects) {
              const selectedDialect = primaryLanguage.dialects.find(d => d.name === dialectFilter);
              key = selectedDialect ? selectedDialect.name : (primaryLanguage.dialects[0]?.name || primaryLanguage.language || primaryLanguage.subgroup || primaryLanguage.group || primaryLanguage.branch || normalizeFamily(primaryLanguage.family));
            } else {
              key = (primaryLanguage.dialects && primaryLanguage.dialects.length > 0) ? primaryLanguage.dialects[0].name : (primaryLanguage.language || primaryLanguage.subgroup || primaryLanguage.group || primaryLanguage.branch || normalizeFamily(primaryLanguage.family));
            }
          } else {
            key = normalizeFamily(primaryLanguage.family);
          }
          families.add(key);
        }
        // フィルタ条件に合致する言語がない場合は、その国を色分けしない
        if (!families.size) {
          // フィルタが適用されている場合は、条件に合致しない国は色分けしない
          return {
            fillColor: '#f0f0f0',
            fillOpacity: 0.1,
            strokeColor: '#ccc',
            strokeOpacity: 0.3,
            strokeWeight: 0.5,
            visible: true,
            zIndex: 1
          };
        }
      } else {
        // 無絞り込み時: colorModeに応じた色分け
        // 複数言語がある場合は、話者数が最も多い言語を優先
        const sortedLangs = matchedLangs.sort((a, b) => (b.total_speakers || 0) - (a.total_speakers || 0));
        
        for (const l of sortedLangs) {
          if (mode === 'family') {
            families.add(normalizeFamily(l.family));
          } else if (mode === 'branch') {
            families.add(l.branch || '未分類');
          } else if (mode === 'group') {
            families.add(l.group || '未分類');
          } else if (mode === 'subgroup') {
            families.add(l.subgroup || '未分類');
          } else if (mode === 'language') {
            families.add(l.language || '未分類');
          } else if (mode === 'dialect') {
            families.add((l.dialects && l.dialects.length > 0) ? l.dialects[0].name : '未分類');
          }
        }
      }
      // 公用語スタブのフォールバック（無絞り込み時のみ）
      if (!families.size && !isFiltered) {
        const entry = (countryOfficialMap as Record<string, { official_languages: string[] }>)[code];
        if (entry) {
          
          // 公用語データから該当する言語を取得し、話者数でソート
          const officialLangs = entry.official_languages
            .map(lid => {
              const lang = langs.find(l => l.id === lid);
              if (lang) return lang;
              // languages.jsonに存在しない場合はDEMO_LANG_LINEAGEから取得
              const lineage = DEMO_LANG_LINEAGE[lid];
              if (lineage) {
                return {
                  id: lid,
                  family: lineage.family,
                  branch: lineage.branch,
                  group: lineage.group,
                  subgroup: lineage.subgroup,
                  language: lineage.language,
                  dialect: lineage.dialect,
                  total_speakers: 0
                };
              }
              return null;
            })
            .filter(Boolean)
            .sort((a, b) => (b!.total_speakers || 0) - (a!.total_speakers || 0));
          
          // 主言語（話者数が最も多い言語）のみを使用
          if (officialLangs.length > 0) {
            const primaryLanguage = officialLangs[0]; // 既に話者数でソート済み
            
            if (primaryLanguage) {
              
              let key: string;
              if (mode === 'family') {
                key = normalizeFamily(primaryLanguage.family);
              } else if (mode === 'branch') {
                key = primaryLanguage.branch || normalizeFamily(primaryLanguage.family);
              } else if (mode === 'group') {
                key = primaryLanguage.group || primaryLanguage.branch || normalizeFamily(primaryLanguage.family);
              } else if (mode === 'subgroup') {
                key = primaryLanguage.subgroup || primaryLanguage.group || primaryLanguage.branch || normalizeFamily(primaryLanguage.family);
              } else if (mode === 'language') {
                key = primaryLanguage.language || primaryLanguage.subgroup || primaryLanguage.group || primaryLanguage.branch || normalizeFamily(primaryLanguage.family);
              } else if (mode === 'dialect') {
                key = primaryLanguage.dialect || primaryLanguage.language || primaryLanguage.subgroup || primaryLanguage.group || primaryLanguage.branch || normalizeFamily(primaryLanguage.family);
              } else {
                key = normalizeFamily(primaryLanguage.family);
              }
              
              if (key) {
                families.add(key);
                if (code && ['CN', 'MY', 'SA', 'EG', 'US', 'GB', 'FR', 'DE', 'IT', 'ES', 'RU', 'JP', 'KR', 'IN', 'BR', 'AU', 'CA', 'NO', 'SJ'].includes(code)) {
                  console.log(`    -> 色分けキー: ${key}`);
                }
              }
            }
          }
          
          // 依然としてキーが得られない場合は "その他" を採用して必ず塗る（無選択時）
          if (!families.size && mode === 'family') {
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
          } else if (mode === 'family') {
            families.add('その他');
          }
        }
      }
    }
    const familyKey = families.values().next().value as string | undefined;
    const fill = colorForKey(familyKey);
    
    
    // フィルタが適用されている場合の色分けロジック
    if (isFiltered) {
      if (familyKey) {
        // フィルタ条件に合致する国は濃い色で表示
        return {
          fillColor: fill,
          fillOpacity: 0.7,
          strokeColor: '#666',
          strokeOpacity: 0.6,
          strokeWeight: 1.1,
          visible: true,
          zIndex: 80
        };
      } else {
        // フィルタ条件に合致しない国は薄い色で表示
        return {
          fillColor: '#f0f0f0',
          fillOpacity: 0.1,
          strokeColor: '#ccc',
          strokeOpacity: 0.3,
          strokeWeight: 0.5,
          visible: true,
          zIndex: 1
        };
      }
    } else {
      // フィルタが適用されていない場合は通常の色分け
      return {
        fillColor: fill,
        fillOpacity: familyKey ? 0.7 : 0.12,
        strokeColor: '#666',
        strokeOpacity: 0.6,
        strokeWeight: familyKey ? 1.1 : 0.6,
        visible: true,
        zIndex: familyKey ? 80 : 10
      };
    }
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
        const currentColorMode = determineColorMode();
        map.data.setStyle((f) => computeStyleForFeature(f, visibleLanguages, currentColorMode));
        map.data.forEach((f) => map.data.overrideStyle(f, computeStyleForFeature(f, visibleLanguages, currentColorMode)));
        // 後から追加される場合にも適用
        map.data.addListener('addfeature', (e) => {
          const style = computeStyleForFeature(e.feature, visibleLanguages, currentColorMode);
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
    legend.style.background = 'rgba(255,255,255,0.95)';
    legend.style.padding = '6px 8px';
    legend.style.margin = '8px';
    legend.style.borderRadius = '4px';
    legend.style.boxShadow = '0 2px 8px rgba(0,0,0,0.15)';
    legend.style.fontSize = '11px';
    legend.style.minWidth = '140px';
    legend.style.maxWidth = '200px';
    legend.style.maxHeight = '300px';
    legend.style.overflow = 'hidden';
    legend.style.position = 'relative';
    legend.style.zIndex = '1000';
    legend.innerHTML = '<div style="font-weight:600;margin-bottom:4px;font-size:12px;">語族 (Family)</div><div style="color:#666;font-size:10px;">読み込み中...</div>';
    
    // レスポンシブ対応: 画面サイズに応じて凡例の位置を調整
    const adjustLegendPosition = () => {
      const mapElement = mapRef.current;
      if (!mapElement) return;
      
      
      // 画面幅が狭い場合は凡例を上に移動
      if (window.innerWidth < 768) {
        legend.style.maxHeight = '200px';
        legend.style.maxWidth = '150px';
        legend.style.fontSize = '10px';
      } else {
        legend.style.maxHeight = '300px';
        legend.style.maxWidth = '200px';
        legend.style.fontSize = '11px';
      }
    };
    
    // 初期調整とリサイズイベント
    adjustLegendPosition();
    window.addEventListener('resize', adjustLegendPosition);
    legendRef.current = legend;
    map.controls[google.maps.ControlPosition.LEFT_BOTTOM].push(legend);
    
    // 初期凡例更新（地図読み込み完了後）
    const updateInitialLegend = () => {
      if (legendRef.current && languages.length > 0) {
        updateLegend();
      }
    };
    
    // 言語データが利用可能になったら凡例を更新
    if (languages.length > 0) {
      updateInitialLegend();
    }
  }, [languages, colorMode, familyFilter, branchFilter, subgroupFilter]);

  // languagesが読み込まれた後に凡例を更新
  useEffect(() => {
    if (languages.length > 0 && legendRef.current) {
      updateLegend();
    }
  }, [languages, updateLegend]);

  useEffect(() => {
    if (!mapInstanceRef.current || !dataLoadedRef.current) return;
    // スタイル更新: 既存フィーチャのスタイルを全て上書き
    const currentColorMode = determineColorMode();
    mapInstanceRef.current.data.revertStyle();
    mapInstanceRef.current.data.setStyle((f) => computeStyleForFeature(f, visibleLanguages, currentColorMode));
    mapInstanceRef.current.data.forEach((f) => {
      const style = computeStyleForFeature(f, visibleLanguages, currentColorMode);
      mapInstanceRef.current!.data.overrideStyle(f, style);
    });
    // 凡例の更新
    updateLegend();
  }, [visibleLanguages, onLanguageClick, colorMode, updateLegend, languages]);

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
