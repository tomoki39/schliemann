import React from 'react';
import { useTranslation } from 'react-i18next';
import { Language } from '../types/Language';

interface ComparePanelProps {
  leftLanguage: Language | null;
  rightLanguage: Language | null;
  onClose: () => void;
  onSetLeft: (language: Language) => void;
  onSetRight: (language: Language) => void;
  onClearLeft: () => void;
  onClearRight: () => void;
}

const ComparePanel: React.FC<ComparePanelProps> = ({
  leftLanguage,
  rightLanguage,
  onClose,
  onSetLeft,
  onSetRight,
  onClearLeft,
  onClearRight
}) => {
  const { t } = useTranslation();

  return (
    <div className="fixed top-0 right-0 w-96 h-full bg-white shadow-lg z-50 overflow-y-auto">
      <div className="p-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">{t('compare.title')}</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ×
          </button>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          {/* Left Language */}
          <div className="border rounded p-3">
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-semibold">言語A</h3>
              {leftLanguage && (
                <button
                  onClick={onClearLeft}
                  className="text-red-500 hover:text-red-700 text-sm"
                >
                  削除
                </button>
              )}
            </div>
            {leftLanguage ? (
              <div className="space-y-2">
                <div className="font-medium">{leftLanguage.name_ja}</div>
                <div className="text-sm text-gray-600">{leftLanguage.family}</div>
                {leftLanguage.total_speakers && (
                  <div className="text-xs text-gray-500">
                    {leftLanguage.total_speakers.toLocaleString()}人
                  </div>
                )}
              </div>
            ) : (
              <div className="text-gray-400 text-sm">言語を選択してください</div>
            )}
          </div>

          {/* Right Language */}
          <div className="border rounded p-3">
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-semibold">言語B</h3>
              {rightLanguage && (
                <button
                  onClick={onClearRight}
                  className="text-red-500 hover:text-red-700 text-sm"
                >
                  削除
                </button>
              )}
            </div>
            {rightLanguage ? (
              <div className="space-y-2">
                <div className="font-medium">{rightLanguage.name_ja}</div>
                <div className="text-sm text-gray-600">{rightLanguage.family}</div>
                {rightLanguage.total_speakers && (
                  <div className="text-xs text-gray-500">
                    {rightLanguage.total_speakers.toLocaleString()}人
                  </div>
                )}
              </div>
            ) : (
              <div className="text-gray-400 text-sm">言語を選択してください</div>
            )}
          </div>
        </div>

        {/* Comparison Table */}
        {leftLanguage && rightLanguage && (
          <div className="mt-6">
            <h3 className="font-semibold mb-3">比較結果</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="font-medium">言語名:</span>
                <div className="text-right">
                  <div>{leftLanguage.name_ja}</div>
                  <div className="text-gray-600">{rightLanguage.name_ja}</div>
                </div>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">ファミリー:</span>
                <div className="text-right">
                  <div>{leftLanguage.family}</div>
                  <div className="text-gray-600">{rightLanguage.family}</div>
                </div>
              </div>
              {leftLanguage.total_speakers && rightLanguage.total_speakers && (
                <div className="flex justify-between">
                  <span className="font-medium">話者数:</span>
                  <div className="text-right">
                    <div>{leftLanguage.total_speakers.toLocaleString()}人</div>
                    <div className="text-gray-600">{rightLanguage.total_speakers.toLocaleString()}人</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ComparePanel;
