import React, { useState } from 'react';
import { Language } from '../types/Language';
import DialectPlayer from './DialectPlayer';
import LanguageComparison from './LanguageComparison';
import dialectPhonetics from '../data/dialect_phonetics.json';
import { useTranslation } from 'react-i18next';
import i18n from '../i18n';
import { getLanguageName, getFamilyName, getBranchName, getGroupName, getDialectName, getDialectDescription } from '../utils/languageNames';
import { getRegionName } from '../utils/countryNames';

interface LanguageInsightDetailProps {
  language: Language;
  onClose: () => void;
  allLanguages?: Language[];
}

const LanguageInsightDetail: React.FC<LanguageInsightDetailProps> = ({ language, onClose, allLanguages = [] }) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'overview' | 'phonetics' | 'dialects' | 'history' | 'comparison'>('overview');
  const [showComparison, setShowComparison] = useState(false);

  const tabs = [
    { id: 'overview', label: t('insights.detail.tabs.overview'), icon: '📋' },
    { id: 'phonetics', label: t('insights.detail.tabs.phonetics'), icon: '🔊' },
    { id: 'dialects', label: t('insights.detail.tabs.dialects'), icon: '🗺️' },
    { id: 'history', label: t('insights.detail.tabs.history'), icon: '📚' },
    { id: 'comparison', label: t('insights.detail.tabs.comparison'), icon: '⚖️' }
  ];

  const renderOverview = () => (
    <div className="space-y-6">
      <div className="bg-blue-50 p-4 rounded-lg">
        <h3 className="text-lg font-semibold mb-3">{t('insights.detail.basicInfo')}</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-medium">{t('insights.detail.family')}</span> {getFamilyName(language.family, i18n.language)}
            {language.branch && ` > ${getBranchName(language.branch, i18n.language)}`}
            {language.group && ` > ${getGroupName(language.group, i18n.language)}`}
          </div>
          <div>
            <span className="font-medium">{t('insights.detail.speakers')}</span> {language.total_speakers?.toLocaleString()}{t('common.speakers')}
          </div>
          <div>
            <span className="font-medium">{t('insights.detail.distribution')}</span> {language.countries?.slice(0, 3).map(c => getRegionName(c, i18n.language)).join(', ')}
          </div>
          <div>
            <span className="font-medium">{t('insights.detail.code')}</span> {language.id}
          </div>
        </div>
      </div>

      {language.audio && (
        <div>
          <h3 className="text-lg font-semibold mb-3">{t('insights.detail.representativeSample')}</h3>
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600 mb-2">{language.audio.text || ''}</p>
            <DialectPlayer
              dialect={{
                name: t('voice.standard'),
                region: '',
                sample_text: language.audio.text || '',
                description: t('voice.standard'),
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
        <h3 className="text-lg font-semibold mb-3">{t('insights.detail.linguisticFeatures')}</h3>
        <div className="bg-green-50 p-4 rounded-lg">
          <p className="text-sm">
            {language.family?.includes('インド・ヨーロッパ') && t('insights.detail.features.indoEuropean')}
            {language.family?.includes('シナ・チベット') && t('insights.detail.features.sinoTibetan')}
            {language.family?.includes('アフロ・アジア') && t('insights.detail.features.afroAsiatic')}
            {language.family?.includes('ウラル') && t('insights.detail.features.uralic')}
            {language.family?.includes('テュルク') && t('insights.detail.features.turkic')}
            {!language.family?.includes('インド・ヨーロッパ') && !language.family?.includes('シナ・チベット') && 
             !language.family?.includes('アフロ・アジア') && !language.family?.includes('ウラル') && 
             !language.family?.includes('テュルク') && t('insights.detail.features.default')}
          </p>
        </div>
      </div>
    </div>
  );

  const renderPhonetics = () => (
    <div className="space-y-6">
      <div className="bg-purple-50 p-4 rounded-lg">
        <h3 className="text-lg font-semibold mb-3">{t('insights.detail.phonetics.system')}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 className="font-medium mb-2">{t('insights.detail.phonetics.consonants')}</h4>
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
            <h4 className="font-medium mb-2">{t('insights.detail.phonetics.vowels')}</h4>
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
            <h4 className="font-medium mb-2">{t('insights.detail.phonetics.tones')}</h4>
            <div className="text-sm bg-white p-3 rounded border">
              {language.phonetics.tones.join(', ')}
            </div>
          </div>
        )}
        
        {language.phonetics?.syllable_structure && (
          <div className="mt-4">
            <h4 className="font-medium mb-2">{t('insights.detail.phonetics.syllableStructure')}</h4>
            <div className="text-sm bg-white p-3 rounded border">
              {language.phonetics.syllable_structure}
            </div>
          </div>
        )}
        
        {language.phonetics?.phonetic_notes && (
          <div className="mt-4">
            <h4 className="font-medium mb-2">{t('insights.detail.phonetics.notes')}</h4>
            <div className="text-sm bg-white p-3 rounded border">
              {language.phonetics.phonetic_notes}
            </div>
          </div>
        )}
      </div>

      <div className="bg-yellow-50 p-4 rounded-lg">
        <h3 className="text-lg font-semibold mb-3">{t('insights.detail.phonetics.notes')}</h3>
        <div className="space-y-2 text-sm">
          {language.family?.includes('シナ・チベット') && (
            <>
              <div>{t('insights.detail.phonetics.tone.desc')}</div>
              <div>{t('insights.detail.phonetics.syllable.desc')}</div>
              <div>{t('insights.detail.phonetics.cluster.desc')}</div>
            </>
          )}
          {language.family?.includes('インド・ヨーロッパ') && (
            <>
              <div>{t('insights.detail.phonetics.cluster.ie')}</div>
              <div>{t('insights.detail.phonetics.syllable.ie')}</div>
              <div>{t('insights.detail.phonetics.stress.ie')}</div>
            </>
          )}
          {language.family?.includes('アフロ・アジア') && (
            <>
              <div>{t('insights.detail.phonetics.root.aa')}</div>
              <div>{t('insights.detail.phonetics.pharyngeal.aa')}</div>
              <div>{t('insights.detail.phonetics.harmony.aa')}</div>
            </>
          )}
          {language.family?.includes('ウラル') && (
            <>
              <div>{t('insights.detail.phonetics.harmony.ur')}</div>
              <div>{t('insights.detail.phonetics.agglutination.ur')}</div>
              <div>{t('insights.detail.phonetics.case.ur')}</div>
            </>
          )}
          {language.family?.includes('テュルク') && (
            <>
              <div>{t('insights.detail.phonetics.harmony.ur')}</div>
              <div>{t('insights.detail.phonetics.agglutination.ur')}</div>
              <div>{t('insights.detail.phonetics.sov.tu')}</div>
            </>
          )}
        </div>
      </div>
    </div>
  );

  const renderDialects = () => (
    <div className="space-y-6">
      <div className="bg-orange-50 p-4 rounded-lg">
        <h3 className="text-lg font-semibold mb-3">{t('insights.detail.dialects.distribution')}</h3>
        <div className="text-sm">
          {language.dialects && language.dialects.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {language.dialects.map((dialect, index) => {
                const dialectId = (dialect as any).id || dialect.name.toLowerCase().replace(/\s+/g, '_');
                const phoneticData = (dialectPhonetics as any)[language.id]?.[dialectId];
                
                return (
                  <div key={index} className="bg-white p-3 rounded border">
                    <div className="font-medium">{getDialectName(dialect.name, i18n.language)}</div>
                    <div className="text-gray-600 text-xs mb-2">{getRegionName(dialect.region || '', i18n.language)}</div>
                    <div className="text-xs text-gray-500 mb-2">{getDialectDescription(dialect.description, i18n.language)}</div>
                    
                    {phoneticData?.phonetic_changes && (
                      <div className="mt-2 text-xs">
                        <div className="font-medium text-purple-600 mb-1">{t('insights.detail.dialects.phoneticFeatures')}</div>
                        <div className="space-y-1">
                          {phoneticData.phonetic_changes.vowel_shifts?.length > 0 && (
                            <div>
                              <span className="text-blue-600">{t('insights.detail.dialects.vowelShifts')}</span> {phoneticData.phonetic_changes.vowel_shifts.join(', ')}
                            </div>
                          )}
                          {phoneticData.phonetic_changes.consonant_changes?.length > 0 && (
                            <div>
                              <span className="text-green-600">{t('insights.detail.dialects.consonantChanges')}</span> {phoneticData.phonetic_changes.consonant_changes.join(', ')}
                            </div>
                          )}
                          {phoneticData.phonetic_changes.accent_pattern && (
                            <div>
                              <span className="text-orange-600">{t('insights.detail.dialects.accent')}</span> {phoneticData.phonetic_changes.accent_pattern}
                            </div>
                          )}
                          {phoneticData.phonetic_changes.unique_features?.length > 0 && (
                            <div>
                              <span className="text-red-600">{t('insights.detail.dialects.features')}</span> {phoneticData.phonetic_changes.unique_features.join(', ')}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                    
                    <DialectPlayer
                      dialect={{
                        ...dialect, 
                        id: dialect.conversion_model || `dialect-${index}`,
                        name: getDialectName(dialect.name, i18n.language),
                        region: getRegionName(dialect.region || '', i18n.language),
                        description: getDialectDescription(dialect.description, i18n.language)
                      }}
                      className="w-full"
                    />
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-gray-600">{t('insights.detail.dialects.noData')}</p>
          )}
        </div>
      </div>

      <div className="bg-red-50 p-4 rounded-lg">
        <h3 className="text-lg font-semibold mb-3">{t('insights.detail.phoneticChanges.title')}</h3>
        <div className="text-sm space-y-2">
          {language.family?.includes('シナ・チベット') && (
            <>
              <div>{t('insights.detail.history.sinoTibetan.middle')}</div>
              <div>{t('insights.detail.history.sinoTibetan.earlyModern')}</div>
              <div>{t('insights.detail.history.sinoTibetan.modern')}</div>
            </>
          )}
          {language.family?.includes('インド・ヨーロッパ') && (
            <>
              <div>{t('insights.detail.history.indoEuropean.germanic')}</div>
              <div>{t('insights.detail.history.indoEuropean.modern')}</div>
              <div>{t('insights.detail.history.indoEuropean.romance')}</div>
            </>
          )}
          {!language.family?.includes('シナ・チベット') && !language.family?.includes('インド・ヨーロッパ') && (
            <div>{t('insights.detail.history.general.desc')}</div>
          )}
        </div>
      </div>
    </div>
  );

  const renderHistory = () => (
    <div className="space-y-6">
      <div className="bg-indigo-50 p-4 rounded-lg">
        <h3 className="text-lg font-semibold mb-3">{t('insights.detail.history.title')}</h3>
        <div className="space-y-4">
          {language.family?.includes('シナ・チベット') && (
            <div className="bg-white p-4 rounded border">
              <h4 className="font-medium mb-2">{t('insights.detail.history.sinoTibetan.title')}</h4>
              <div className="text-sm space-y-1">
                <div>{t('insights.detail.history.sinoTibetan.old')}</div>
                <div>{t('insights.detail.history.sinoTibetan.middle')}</div>
                <div>{t('insights.detail.history.sinoTibetan.earlyModern')}</div>
                <div>{t('insights.detail.history.sinoTibetan.modern')}</div>
              </div>
            </div>
          )}
          {language.family?.includes('インド・ヨーロッパ') && (
            <div className="bg-white p-4 rounded border">
              <h4 className="font-medium mb-2">{t('insights.detail.history.indoEuropean.title')}</h4>
              <div className="text-sm space-y-1">
                <div>{t('insights.detail.history.indoEuropean.proto')}</div>
                <div>{t('insights.detail.history.indoEuropean.germanic')}</div>
                <div>{t('insights.detail.history.indoEuropean.romance')}</div>
                <div>{t('insights.detail.history.indoEuropean.modern')}</div>
              </div>
            </div>
          )}
          {!language.family?.includes('シナ・チベット') && !language.family?.includes('インド・ヨーロッパ') && (
            <div className="bg-white p-4 rounded border">
              <h4 className="font-medium mb-2">{t('insights.detail.history.general.title')}</h4>
              <div className="text-sm">
                <p>{t('insights.detail.history.general.desc')}</p>
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
        <h3 className="text-lg font-semibold mb-3">{t('insights.detail.comparison.title')}</h3>
        <div className="text-sm">
          <p className="mb-4">{t('insights.detail.comparison.desc')}</p>
          <button
            onClick={() => setShowComparison(true)}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            {t('insights.detail.comparison.start')}
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
              <h2 className="text-xl font-bold">{getLanguageName(language.name_ja, i18n.language)}</h2>
              <p className="text-sm text-gray-600">{getFamilyName(language.family, i18n.language)}</p>
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
