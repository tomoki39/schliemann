import React from 'react';
import { useTranslation } from 'react-i18next';
import { Language } from '../types/Language';

interface BookmarkButtonProps {
  language: Language;
  isBookmarked: boolean;
  onToggle: (language: Language) => void;
}

const BookmarkButton: React.FC<BookmarkButtonProps> = ({
  language,
  isBookmarked,
  onToggle
}) => {
  const { t } = useTranslation();

  return (
    <button
      onClick={() => onToggle(language)}
      className={`px-3 py-1 rounded text-sm transition-colors ${
        isBookmarked
          ? 'bg-yellow-500 text-white hover:bg-yellow-600'
          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
      }`}
    >
      {isBookmarked ? '★' : '☆'} {isBookmarked ? t('bookmark.remove') : t('bookmark.add')}
    </button>
  );
};

export default BookmarkButton;
