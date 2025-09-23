import React from 'react';
import { useTranslation } from 'react-i18next';
import { Language } from '../types/Language';
import BookmarkButton from './BookmarkButton';

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
