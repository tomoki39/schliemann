import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Language } from '../types/Language';
import BookmarkButton from './BookmarkButton';
import AudioPlayer from './AudioPlayer';
import DialectPlayer from './DialectPlayer';
import { convertTextToDialect } from '../utils/dialectConverter';

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
      <div className="p-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">{t('detail.title')}</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ×
          </button>
        </div>
        
        <div className="space-y-4">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-2xl font-semibold">{language.name_ja}</h3>
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
              {language.family}
              {language.branch ? ` > ${language.branch}` : ''}
              {language.subgroup ? ` > ${language.subgroup}` : ''}
            </p>
          </div>

          {language.audio && (
            <div>
              <h4 className="font-medium mb-2">音声サンプル</h4>
              <AudioPlayer
                languageName={language.name_ja}
                text={language.audio.text}
                className="w-full"
              />
              {language.audio.source && (
                <p className="text-xs text-gray-500 mt-1">
                  出典: {language.audio.source}
                </p>
              )}
            </div>
          )}

          {language.dialects && language.dialects.length > 0 && (
            <div>
              <div className="flex justify-between items-center mb-2">
                <h4 className="font-medium">方言</h4>
                <button
                  onClick={() => setShowCustomInput(!showCustomInput)}
                  className="text-xs text-blue-600 hover:text-blue-800 underline"
                >
                  {showCustomInput ? 'カスタム入力を閉じる' : 'カスタムテキストを入力'}
                </button>
              </div>

              {/* グローバルカスタム入力 */}
              {showCustomInput && (
                <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                  <textarea
                    value={customText}
                    onChange={(e) => setCustomText(e.target.value)}
                    placeholder="ここにテキストを入力してください..."
                    className="w-full p-2 text-sm border rounded resize-none mb-2"
                    rows={3}
                  />
                  {customText && (
                    <div className="text-xs text-gray-600 mb-2">
                      変換結果プレビュー:
                    </div>
                  )}
                </div>
              )}

              <div className="space-y-2">
                {language.dialects.map((dialect, index) => (
                  <DialectPlayer
                    key={index}
                    dialect={dialect}
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
              <p>{language.total_speakers.toLocaleString()}人</p>
            </div>
          )}
          
          {language.countries && language.countries.length > 0 && (
            <div>
              <h4 className="font-medium">公用国</h4>
              <p className="text-sm text-gray-800">
                {language.countries.join(', ')}
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
    </div>
  );
};

export default DetailPanel;
