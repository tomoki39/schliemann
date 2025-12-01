import React from 'react';
import { Language } from '../types/Language';
import LanguageExplorer from './LanguageExplorer';

interface LanguageFamilyTabProps {
  languages: Language[];
  searchQuery: string;
}

const LanguageFamilyTab: React.FC<LanguageFamilyTabProps> = ({ languages }) => {
  return (
    <div className="h-full">
      <LanguageExplorer
        languages={languages}
      />
    </div>
  );
};

export default LanguageFamilyTab;
