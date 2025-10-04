import React, { useState } from 'react';

interface DetailedInfo {
  history: string;
  characteristics: string[];
  unique_words: string[];
  pronunciation_notes: string;
  cultural_context: string;
  sample_phrases: string[];
}

interface Dialect {
  id: string;
  name: string;
  region: string;
  sample_text: string;
  description?: string;
  conversion_model: string;
  detailed_info?: DetailedInfo;
}

interface DialectDetailPanelProps {
  dialect: Dialect;
  onClose: () => void;
  onPlaySample: (text: string) => void;
  onPlayCustom: (text: string) => void;
  customText: string;
  onCustomTextChange: (text: string) => void;
}

const DialectDetailPanel: React.FC<DialectDetailPanelProps> = ({
  dialect,
  onClose,
  onPlaySample,
  onPlayCustom,
  customText,
  onCustomTextChange
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'details' | 'samples' | 'compare'>('overview');
  const [selectedPhrase, setSelectedPhrase] = useState<string>('');

  const handlePlayPhrase = (phrase: string) => {
    setSelectedPhrase(phrase);
    onPlaySample(phrase);
  };

  const handlePlayCustom = () => {
    if (customText.trim()) {
      onPlayCustom(customText);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* ヘッダー */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">{dialect.name}</h2>
              <p className="text-blue-100 mt-1">{dialect.region} • {dialect.description}</p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-200 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* タブナビゲーション */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {[
              { id: 'overview', label: '概要', icon: '📋' },
              { id: 'details', label: '詳細情報', icon: '📚' },
              { id: 'samples', label: '音声サンプル', icon: '🎵' },
              { id: 'compare', label: '比較', icon: '⚖️' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* コンテンツエリア */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-3">基本情報</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">方言名</label>
                    <p className="text-gray-900">{dialect.name}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">地域</label>
                    <p className="text-gray-900">{dialect.region}</p>
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-sm font-medium text-gray-600">説明</label>
                    <p className="text-gray-900">{dialect.description}</p>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-3">例文</h3>
                <div className="flex items-center justify-between">
                  <p className="text-lg italic text-gray-700">"{dialect.sample_text}"</p>
                  <button
                    onClick={() => onPlaySample(dialect.sample_text)}
                    className="ml-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h1m4 0h1m-6-8h8a2 2 0 012 2v8a2 2 0 01-2 2H8a2 2 0 01-2-2V6a2 2 0 012-2z" />
                    </svg>
                    <span>再生</span>
                  </button>
                </div>
              </div>

              <div className="bg-green-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-3">カスタム音声</h3>
                <div className="space-y-3">
                  <textarea
                    value={customText}
                    onChange={(e) => onCustomTextChange(e.target.value)}
                    placeholder="ここにテキストを入力してください..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    rows={3}
                  />
                  <button
                    onClick={handlePlayCustom}
                    disabled={!customText.trim()}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h1m4 0h1m-6-8h8a2 2 0 012 2v8a2 2 0 01-2 2H8a2 2 0 01-2-2V6a2 2 0 012-2z" />
                    </svg>
                    <span>カスタム音声を再生</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'details' && dialect.detailed_info && (
            <div className="space-y-6">
              <div className="bg-yellow-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-3">歴史・背景</h3>
                <p className="text-gray-700 leading-relaxed">{dialect.detailed_info.history}</p>
              </div>

              <div className="bg-purple-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-3">特徴</h3>
                <ul className="space-y-2">
                  {dialect.detailed_info.characteristics.map((characteristic, index) => (
                    <li key={index} className="flex items-center space-x-2">
                      <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                      <span className="text-gray-700">{characteristic}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-red-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-3">特徴的な語彙</h3>
                <div className="flex flex-wrap gap-2">
                  {dialect.detailed_info.unique_words.map((word, index) => (
                    <span
                      key={index}
                      className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-medium"
                    >
                      {word}
                    </span>
                  ))}
                </div>
              </div>

              <div className="bg-indigo-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-3">発音の特徴</h3>
                <p className="text-gray-700 leading-relaxed">{dialect.detailed_info.pronunciation_notes}</p>
              </div>

              <div className="bg-teal-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-3">文化的背景</h3>
                <p className="text-gray-700 leading-relaxed">{dialect.detailed_info.cultural_context}</p>
              </div>
            </div>
          )}

          {activeTab === 'samples' && dialect.detailed_info && (
            <div className="space-y-6">
              <div className="bg-orange-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-3">音声サンプル集</h3>
                <p className="text-gray-600 mb-4">各フレーズをクリックして音声を聞いてみましょう</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {dialect.detailed_info.sample_phrases.map((phrase, index) => (
                    <button
                      key={index}
                      onClick={() => handlePlayPhrase(phrase)}
                      className={`p-3 rounded-lg border-2 transition-all text-left ${
                        selectedPhrase === phrase
                          ? 'border-orange-500 bg-orange-100 text-orange-800'
                          : 'border-gray-200 bg-white hover:border-orange-300 hover:bg-orange-50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{phrase}</span>
                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h1m4 0h1m-6-8h8a2 2 0 012 2v8a2 2 0 01-2 2H8a2 2 0 01-2-2V6a2 2 0 012-2z" />
                        </svg>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-3">音声の特徴</h3>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <span className="w-3 h-3 bg-green-500 rounded-full"></span>
                    <span className="text-gray-700">自然な音声合成</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className="w-3 h-3 bg-blue-500 rounded-full"></span>
                    <span className="text-gray-700">方言特有のアクセント</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className="w-3 h-3 bg-purple-500 rounded-full"></span>
                    <span className="text-gray-700">地域の特徴を反映</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'compare' && (
            <div className="space-y-6">
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-3">方言比較機能</h3>
                <p className="text-gray-600 mb-4">
                  他の方言と比較して特徴を確認できます（準備中）
                </p>
                <div className="bg-yellow-100 border border-yellow-300 rounded-lg p-4">
                  <div className="flex items-center space-x-2">
                    <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-yellow-800 font-medium">開発予定機能</span>
                  </div>
                  <p className="text-yellow-700 mt-2">
                    複数方言の同時比較、音声の並列再生、特徴の対比表示などを予定しています。
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* フッター */}
        <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              <span className="font-medium">{dialect.name}</span> の詳細情報
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => onPlaySample(dialect.sample_text)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h1m4 0h1m-6-8h8a2 2 0 012 2v8a2 2 0 01-2 2H8a2 2 0 01-2-2V6a2 2 0 012-2z" />
                </svg>
                <span>例文を再生</span>
              </button>
              <button
                onClick={onClose}
                className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
              >
                閉じる
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DialectDetailPanel;
