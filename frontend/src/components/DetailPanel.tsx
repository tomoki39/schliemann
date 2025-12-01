import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Language } from '../types/Language';
import BookmarkButton from './BookmarkButton';
import AudioPlayer from './AudioPlayer';
import DialectPlayer from './DialectPlayer';
import i18n from '../i18n';
import { getLanguageName, getFamilyName, getBranchName, getGroupName, getSubgroupName } from '../utils/languageNames';
// import { convertTextToDialect } from '../utils/dialectConverter';

interface DetailPanelProps {
  language: Language | null;
  onClose: () => void;
  isBookmarked: boolean;
  onToggleBookmark: (language: Language) => void;
}

const DetailPanel: React.FC<DetailPanelProps> = ({ 
  language, 
  onClose, 
  isBookmarked, 
  onToggleBookmark 
}) => {
  const { t } = useTranslation();
  const [customText, setCustomText] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);

  if (!language) return null;

  return (
    <div className="fixed top-0 right-0 w-96 h-full bg-white shadow-lg z-50 overflow-y-auto">
      <div className="p-4 sticky top-0 bg-white z-10 border-b">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold">{t('detail.title')}</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ×
          </button>
        </div>
      </div>
      
      <div className="p-4 space-y-4">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-2xl font-semibold">{getLanguageName(language.name_ja, i18n.language)}</h3>
            <p className="text-gray-600">ID: {language.id}</p>
          </div>
          <BookmarkButton
            language={language}
            isBookmarked={isBookmarked}
            onToggle={onToggleBookmark}
          />
        </div>
        
        <div>
          <h4 className="font-medium">{t('detail.lineage')}</h4>
          <p className="text-sm text-gray-800">
            {getFamilyName(language.family, i18n.language)}
            {language.branch ? ` > ${getBranchName(language.branch, i18n.language)}` : ''}
            {language.group ? ` > ${getGroupName(language.group, i18n.language)}` : ''}
            {language.subgroup ? ` > ${getSubgroupName(language.subgroup, i18n.language)}` : ''}
            {language.language ? ` > ${getLanguageName(language.language, i18n.language)}` : ''}
          </p>
        </div>

        {language.audio && (
          <div>
            <h4 className="font-medium mb-2">{t('detail.audioSample')}</h4>
            <AudioPlayer
              languageName={getLanguageName(language.name_ja, i18n.language)}
              text={language.audio.text}
              className="w-full"
            />
            {language.audio.source && (
              <p className="text-xs text-gray-500 mt-1">
                {t('detail.source')}: {language.audio.source}
              </p>
            )}
          </div>
        )}

        {language.dialects && language.dialects.length > 0 && (
          <div>
            <div className="flex justify-between items-center mb-2">
              <h4 className="font-medium">{t('detail.dialects')}</h4>
              <button
                onClick={() => setShowCustomInput(!showCustomInput)}
                className="text-xs text-blue-600 hover:text-blue-800 underline"
              >
                {showCustomInput ? t('detail.customInputClose') : t('detail.customInputOpen')}
              </button>
            </div>

            {/* グローバルカスタム入力 */}
            {showCustomInput && (
              <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                <textarea
                  value={customText}
                  onChange={(e) => setCustomText(e.target.value)}
                  placeholder={t('detail.customInputPlaceholder')}
                  className="w-full p-2 text-sm border rounded resize-none mb-2"
                  rows={3}
                />
                {customText && (
                  <div className="text-xs text-gray-600 mb-2">
                    {t('detail.conversionPreview')}
                  </div>
                )}
              </div>
            )}

            <div className="space-y-2">
              {language.dialects.map((dialect, index) => (
                <DialectPlayer
                  key={index}
                  dialect={{...dialect, id: dialect.conversion_model || `dialect-${index}`}}
                  className="w-full"
                  customText={showCustomInput ? customText : ''}
                  showCustomInput={showCustomInput}
                />
              ))}
            </div>
          </div>
        )}
        
        {language.total_speakers && (
          <div>
            <h4 className="font-medium">{t('detail.speakers')}</h4>
            <p>{language.total_speakers.toLocaleString()}{t('common.speakers')}</p>
          </div>
        )}
        
        {language.countries && language.countries.length > 0 && (
          <div>
            <h4 className="font-medium">{t('detail.officialCountries')}</h4>
            <p className="text-sm text-gray-800">
              {language.countries.map(code => {
                try {
                  const locale = i18n.language === 'en' ? 'en' : 'ja';
                  return new Intl.DisplayNames([locale], { type: 'region' }).of(code) || code;
                } catch {
                  return code;
                }
              }).join(i18n.language === 'en' ? ', ' : '、')}
            </p>
          </div>
        )}

        {language.center && (
          <div>
            <h4 className="font-medium">{t('detail.center')}</h4>
            <p>{language.center.lat.toFixed(2)}, {language.center.lng.toFixed(2)}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DetailPanel;
