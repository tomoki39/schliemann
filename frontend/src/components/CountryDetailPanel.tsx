import React from 'react';
import { Language } from '../types/Language';
import DialectPlayer from './DialectPlayer';

interface CountryDetailPanelProps {
  countryCode: string;
  languages: Language[];
  onClose: () => void;
}

const CountryDetailPanel: React.FC<CountryDetailPanelProps> = ({ countryCode, languages, onClose }) => {
  const countryName = (() => {
    try {
      const dn = new Intl.DisplayNames(['ja'], { type: 'region' });
      return (dn.of(countryCode) as string) || countryCode;
    } catch {
      return countryCode;
    }
  })();

  const langsInCountry = languages.filter(l => (l.countries || []).includes(countryCode));

  return (
    <div className="fixed top-0 right-0 w-[400px] h-full bg-white shadow-lg z-50 overflow-y-auto">
      <div className="p-4 border-b flex items-center justify-between sticky top-0 bg-white z-10">
        <h2 className="text-lg font-semibold">{countryName} の言語</h2>
        <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-2xl">×</button>
      </div>

      <div className="p-4 space-y-4">
        {langsInCountry.length === 0 && (
          <div className="text-sm text-gray-600">この国に紐づく言語データが見つかりません。</div>
        )}

        {langsInCountry.map((lang) => (
          <div key={lang.id} className="border rounded-md p-3 bg-gray-50">
            <div className="mb-2">
              <div className="text-base font-medium">{lang.name_ja}</div>
              {lang.audio?.text && (
                <div className="text-xs text-gray-600 mt-1">{lang.audio.text}</div>
              )}
            </div>

            {lang.dialects && lang.dialects.length > 0 && (
              <div className="space-y-2">
                {lang.dialects.map((d, idx) => (
                  <DialectPlayer
                    key={idx}
                    dialect={{ ...d, id: d.conversion_model || String(idx) }}
                    className="w-full"
                  />
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default CountryDetailPanel;


