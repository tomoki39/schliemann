import React from 'react';
import { Language } from '../types/Language';
import LanguageExplorer from './LanguageExplorer';

interface LanguageFamilyTabProps {
  languages: Language[];
  searchQuery: string;
}

const LanguageFamilyTab: React.FC<LanguageFamilyTabProps> = ({ languages, searchQuery }) => {
  return (
    <div className="h-full">
      <LanguageExplorer
        languages={languages}
        onClose={() => {}} // タブ内では閉じる機能は不要
      />
    </div>
  );
};

export default LanguageFamilyTab;
