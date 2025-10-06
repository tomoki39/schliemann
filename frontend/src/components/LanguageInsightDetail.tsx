import React, { useState } from 'react';
import { Language } from '../types/Language';
import DialectPlayer from './DialectPlayer';
import LanguageComparison from './LanguageComparison';
import dialectPhonetics from '../data/dialect_phonetics.json';

interface LanguageInsightDetailProps {
  language: Language;
  onClose: () => void;
  allLanguages?: Language[];
}

const LanguageInsightDetail: React.FC<LanguageInsightDetailProps> = ({ language, onClose, allLanguages = [] }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'phonetics' | 'dialects' | 'history' | 'comparison'>('overview');
  const [showComparison, setShowComparison] = useState(false);

  const tabs = [
    { id: 'overview', label: '概要', icon: '📋' },
    { id: 'phonetics', label: '音韻', icon: '🔊' },
    { id: 'dialects', label: '方言', icon: '🗺️' },
    { id: 'history', label: '歴史', icon: '📚' },
    { id: 'comparison', label: '比較', icon: '⚖️' }
  ];

  const renderOverview = () => (
    <div className="space-y-6">
      <div className="bg-blue-50 p-4 rounded-lg">
        <h3 className="text-lg font-semibold mb-3">基本情報</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-medium">系統:</span> {language.family}
            {language.branch && ` > ${language.branch}`}
            {language.group && ` > ${language.group}`}
          </div>
          <div>
            <span className="font-medium">話者数:</span> {language.total_speakers?.toLocaleString()}人
          </div>
          <div>
            <span className="font-medium">分布:</span> {language.countries?.slice(0, 3).join(', ')}
          </div>
          <div>
            <span className="font-medium">言語コード:</span> {language.id}
          </div>
        </div>
      </div>

      {language.audio && (
        <div>
          <h3 className="text-lg font-semibold mb-3">代表サンプル</h3>
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600 mb-2">{language.audio.text || ''}</p>
            <DialectPlayer
              dialect={{
                name: '標準',
                region: '',
                sample_text: language.audio.text || '',
                description: '標準的な発音',
                conversion_model: 'standard',
                custom_input_enabled: false,
                id: 'standard'
              }}
              className="w-full"
            />
          </div>
        </div>
      )}

      <div>
        <h3 className="text-lg font-semibold mb-3">言語学的特徴</h3>
        <div className="bg-green-50 p-4 rounded-lg">
          <p className="text-sm">
            {language.family?.includes('インド・ヨーロッパ') && '屈折語的特徴、子音群の複雑さ、語順の柔軟性が特徴的。'}
            {language.family?.includes('シナ・チベット') && '声調言語、単音節語根、語順が意味を決定する重要な要素。'}
            {language.family?.includes('アフロ・アジア') && '三子音語根、咽頭化音、強勢パターンが顕著。'}
            {language.family?.includes('ウラル') && '母音調和、膠着語的特徴、格体系が発達。'}
            {language.family?.includes('テュルク') && '母音調和、膠着語、SOV語順が基本。'}
            {!language.family?.includes('インド・ヨーロッパ') && !language.family?.includes('シナ・チベット') && 
             !language.family?.includes('アフロ・アジア') && !language.family?.includes('ウラル') && 
             !language.family?.includes('テュルク') && '音韻・形態・語順の相互作用に注目すると系統差が見えやすい。'}
          </p>
        </div>
      </div>
    </div>
  );

  const renderPhonetics = () => (
    <div className="space-y-6">
      <div className="bg-purple-50 p-4 rounded-lg">
        <h3 className="text-lg font-semibold mb-3">音韻体系</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 className="font-medium mb-2">子音</h4>
            <div className="text-sm bg-white p-3 rounded border">
              {language.phonetics?.consonants ? 
                `/${language.phonetics.consonants.join(', ')}/` :
                (language.family?.includes('インド・ヨーロッパ') && '/p, b, t, d, k, g, f, v, s, z, ʃ, ʒ, m, n, ŋ, l, r/') ||
                (language.family?.includes('シナ・チベット') && '/p, pʰ, t, tʰ, k, kʰ, ts, tsʰ, tɕ, tɕʰ, ɕ, ʂ, ʐ/') ||
                (language.family?.includes('アフロ・アジア') && '/p, b, t, d, k, g, ʔ, ʕ, ħ, ʕ, f, v, s, z, ʃ, ʒ/') ||
                (language.family?.includes('ウラル') && '/p, t, k, s, ʃ, m, n, ŋ, l, r, j, w/') ||
                (language.family?.includes('テュルク') && '/p, b, t, d, k, g, f, v, s, z, ʃ, ʒ, m, n, ŋ, l, r, j/') ||
                '/p, t, k, s, m, n, l, r/'
              }
            </div>
          </div>
          <div>
            <h4 className="font-medium mb-2">母音</h4>
            <div className="text-sm bg-white p-3 rounded border">
              {language.phonetics?.vowels ? 
                `/${language.phonetics.vowels.join(', ')}/` :
                (language.family?.includes('インド・ヨーロッパ') && '/a, e, i, o, u, ə, ɪ, ʊ/') ||
                (language.family?.includes('シナ・チベット') && '/a, e, i, o, u, y, ɨ, ə/') ||
                (language.family?.includes('アフロ・アジア') && '/a, e, i, o, u, ə, ɪ, ʊ/') ||
                (language.family?.includes('ウラル') && '/a, e, i, o, u, y, ø, ɨ/') ||
                (language.family?.includes('テュルク') && '/a, e, i, o, u, y, ø, ɨ/') ||
                '/a, e, i, o, u/'
              }
            </div>
          </div>
        </div>
        
        {language.phonetics?.tones && language.phonetics.tones.length > 0 && (
          <div className="mt-4">
            <h4 className="font-medium mb-2">声調</h4>
            <div className="text-sm bg-white p-3 rounded border">
              {language.phonetics.tones.join(', ')}
            </div>
          </div>
        )}
        
        {language.phonetics?.syllable_structure && (
          <div className="mt-4">
            <h4 className="font-medium mb-2">音節構造</h4>
            <div className="text-sm bg-white p-3 rounded border">
              {language.phonetics.syllable_structure}
            </div>
          </div>
        )}
        
        {language.phonetics?.phonetic_notes && (
          <div className="mt-4">
            <h4 className="font-medium mb-2">音韻特徴</h4>
            <div className="text-sm bg-white p-3 rounded border">
              {language.phonetics.phonetic_notes}
            </div>
          </div>
        )}
      </div>

      <div className="bg-yellow-50 p-4 rounded-lg">
        <h3 className="text-lg font-semibold mb-3">音韻特徴</h3>
        <div className="space-y-2 text-sm">
          {language.family?.includes('シナ・チベット') && (
            <>
              <div>• <strong>声調:</strong> 4-9声調（方言により異なる）</div>
              <div>• <strong>音節構造:</strong> CV(C) - 単音節語根が基本</div>
              <div>• <strong>子音群:</strong> 限定的、主に語頭に出現</div>
            </>
          )}
          {language.family?.includes('インド・ヨーロッパ') && (
            <>
              <div>• <strong>子音群:</strong> 複雑な子音結合が可能</div>
              <div>• <strong>音節構造:</strong> (C)(C)(C)V(C)(C)(C) - 複雑</div>
              <div>• <strong>強勢:</strong> 語幹に固定または可変</div>
            </>
          )}
          {language.family?.includes('アフロ・アジア') && (
            <>
              <div>• <strong>語根:</strong> 三子音語根が基本</div>
              <div>• <strong>咽頭化音:</strong> 咽頭・喉頭音の存在</div>
              <div>• <strong>母音調和:</strong> 限定的</div>
            </>
          )}
          {language.family?.includes('ウラル') && (
            <>
              <div>• <strong>母音調和:</strong> 前舌・後舌の調和</div>
              <div>• <strong>膠着語:</strong> 接尾辞による語形変化</div>
              <div>• <strong>格体系:</strong> 豊富な格変化</div>
            </>
          )}
          {language.family?.includes('テュルク') && (
            <>
              <div>• <strong>母音調和:</strong> 前舌・後舌の調和</div>
              <div>• <strong>膠着語:</strong> 接尾辞による語形変化</div>
              <div>• <strong>語順:</strong> SOVが基本</div>
            </>
          )}
        </div>
      </div>
    </div>
  );

  const renderDialects = () => (
    <div className="space-y-6">
      <div className="bg-orange-50 p-4 rounded-lg">
        <h3 className="text-lg font-semibold mb-3">方言分布</h3>
        <div className="text-sm">
          {language.dialects && language.dialects.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {language.dialects.map((dialect, index) => {
                const dialectId = (dialect as any).id || dialect.name.toLowerCase().replace(/\s+/g, '_');
                const phoneticData = (dialectPhonetics as any)[language.id]?.[dialectId];
                
                return (
                  <div key={index} className="bg-white p-3 rounded border">
                    <div className="font-medium">{dialect.name}</div>
                    <div className="text-gray-600 text-xs mb-2">{dialect.region}</div>
                    <div className="text-xs text-gray-500 mb-2">{dialect.description}</div>
                    
                    {phoneticData?.phonetic_changes && (
                      <div className="mt-2 text-xs">
                        <div className="font-medium text-purple-600 mb-1">音韻特徴:</div>
                        <div className="space-y-1">
                          {phoneticData.phonetic_changes.vowel_shifts?.length > 0 && (
                            <div>
                              <span className="text-blue-600">母音変化:</span> {phoneticData.phonetic_changes.vowel_shifts.join(', ')}
                            </div>
                          )}
                          {phoneticData.phonetic_changes.consonant_changes?.length > 0 && (
                            <div>
                              <span className="text-green-600">子音変化:</span> {phoneticData.phonetic_changes.consonant_changes.join(', ')}
                            </div>
                          )}
                          {phoneticData.phonetic_changes.accent_pattern && (
                            <div>
                              <span className="text-orange-600">アクセント:</span> {phoneticData.phonetic_changes.accent_pattern}
                            </div>
                          )}
                          {phoneticData.phonetic_changes.unique_features?.length > 0 && (
                            <div>
                              <span className="text-red-600">特徴:</span> {phoneticData.phonetic_changes.unique_features.join(', ')}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                    
                    <DialectPlayer
                      dialect={{...dialect, id: dialect.conversion_model || `dialect-${index}`}}
                      className="w-full"
                    />
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-gray-600">方言データがありません</p>
          )}
        </div>
      </div>

      <div className="bg-red-50 p-4 rounded-lg">
        <h3 className="text-lg font-semibold mb-3">音韻変化</h3>
        <div className="text-sm space-y-2">
          {language.family?.includes('シナ・チベット') && (
            <>
              <div>• <strong>声調変化:</strong> 北京語4声調 → 広東語6-9声調</div>
              <div>• <strong>子音変化:</strong> 古音 *k → 現代音 /tɕ/ (北京語)</div>
              <div>• <strong>母音変化:</strong> 中古音 → 現代音の母音推移</div>
            </>
          )}
          {language.family?.includes('インド・ヨーロッパ') && (
            <>
              <div>• <strong>子音推移:</strong> グリムの法則、ヴェルナーの法則</div>
              <div>• <strong>母音変化:</strong> 大母音推移（英語）</div>
              <div>• <strong>語彙変化:</strong> 借用語の音韻適応</div>
            </>
          )}
          {!language.family?.includes('シナ・チベット') && !language.family?.includes('インド・ヨーロッパ') && (
            <div>• 系統特有の音韻変化パターンが観察される</div>
          )}
        </div>
      </div>
    </div>
  );

  const renderHistory = () => (
    <div className="space-y-6">
      <div className="bg-indigo-50 p-4 rounded-lg">
        <h3 className="text-lg font-semibold mb-3">歴史的音変化</h3>
        <div className="space-y-4">
          {language.family?.includes('シナ・チベット') && (
            <div className="bg-white p-4 rounded border">
              <h4 className="font-medium mb-2">中国語の音変化</h4>
              <div className="text-sm space-y-1">
                <div>• <strong>上古音 (紀元前11世紀):</strong> 複子音語頭、声調未分化</div>
                <div>• <strong>中古音 (隋唐):</strong> 4声調確立、韻母体系完成</div>
                <div>• <strong>近古音 (宋元):</strong> 入声消失、声調変化</div>
                <div>• <strong>現代音 (明清以降):</strong> 現在の音韻体系</div>
              </div>
            </div>
          )}
          {language.family?.includes('インド・ヨーロッパ') && (
            <div className="bg-white p-4 rounded border">
              <h4 className="font-medium mb-2">印欧語の音変化</h4>
              <div className="text-sm space-y-1">
                <div>• <strong>印欧祖語:</strong> 複雑な子音群、母音交替</div>
                <div>• <strong>ゲルマン語派:</strong> グリムの法則、子音推移</div>
                <div>• <strong>ロマンス語派:</strong> ラテン語からの音韻変化</div>
                <div>• <strong>現代語:</strong> 各地域での独自発達</div>
              </div>
            </div>
          )}
          {!language.family?.includes('シナ・チベット') && !language.family?.includes('インド・ヨーロッパ') && (
            <div className="bg-white p-4 rounded border">
              <h4 className="font-medium mb-2">系統別音変化</h4>
              <div className="text-sm">
                <p>各語族特有の音変化パターンが歴史的に観察される。</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderComparison = () => (
    <div className="space-y-6">
      <div className="bg-teal-50 p-4 rounded-lg">
        <h3 className="text-lg font-semibold mb-3">言語比較</h3>
        <div className="text-sm">
          <p className="mb-4">他の言語との比較機能です。音韻体系、語順、文法構造などの比較が可能です。</p>
          <button
            onClick={() => setShowComparison(true)}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            比較を開始
          </button>
        </div>
      </div>
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview': return renderOverview();
      case 'phonetics': return renderPhonetics();
      case 'dialects': return renderDialects();
      case 'history': return renderHistory();
      case 'comparison': return renderComparison();
      default: return renderOverview();
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold">{language.name_ja}</h2>
              <p className="text-sm text-gray-600">{language.family}</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-2xl"
            >
              ×
            </button>
          </div>

        {/* Tabs */}
        <div className="border-b">
          <div className="flex overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600 bg-blue-50'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {renderTabContent()}
        </div>
      </div>
    </div>
    
    {showComparison && (
      <LanguageComparison
        languages={allLanguages}
        onClose={() => setShowComparison(false)}
      />
    )}
  </>
  );
};

export default LanguageInsightDetail;
