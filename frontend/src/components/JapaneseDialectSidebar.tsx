import React from 'react';

interface Dialect {
  id: string;
  name: string;
  region: string;
  sample_text: string;
  description: string;
  conversion_model: string;
}

interface JapaneseDialectSidebarProps {
  dialects: Dialect[];
  selectedDialect: string | null;
  onDialectSelect: (dialectId: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onBackToWorld: () => void;
}

const JapaneseDialectSidebar: React.FC<JapaneseDialectSidebarProps> = ({
  dialects,
  selectedDialect,
  onDialectSelect,
  searchQuery,
  onSearchChange,
  onBackToWorld
}) => {
  const filteredDialects = dialects.filter(dialect =>
    dialect.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    dialect.region.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="w-80 bg-white border-r border-gray-200 flex flex-col h-full">
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-gray-800">日本方言</h2>
          <button
            onClick={onBackToWorld}
            className="text-sm text-blue-600 hover:text-blue-800 flex items-center space-x-1"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span>戻る</span>
          </button>
        </div>
        <input
          type="text"
          placeholder="方言を検索..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      
      <div className="flex-1 overflow-y-auto">
        <div className="p-4">
          <div className="space-y-2">
            {filteredDialects.map((dialect) => (
              <div
                key={dialect.id}
                onClick={() => onDialectSelect(dialect.conversion_model)}
                className={`p-3 rounded-lg cursor-pointer transition-colors ${
                  selectedDialect === dialect.conversion_model
                    ? 'bg-blue-100 border-2 border-blue-500'
                    : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-800">{dialect.name}</h3>
                    <p className="text-sm text-gray-600 mt-1">{dialect.region}</p>
                    <p className="text-xs text-gray-500 mt-2 line-clamp-2">
                      {dialect.description}
                    </p>
                  </div>
                </div>
                
                <div className="mt-2 p-2 bg-white rounded border text-sm text-gray-700">
                  <div className="font-medium text-xs text-gray-500 mb-1">例文:</div>
                  <div className="italic">"{dialect.sample_text}"</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      <div className="p-4 border-t border-gray-200 bg-gray-50">
        <div className="text-xs text-gray-600">
          <p>💡 方言をクリックして音声を聞いてみましょう</p>
          <p className="mt-1">地図上のマーカーからも選択できます</p>
        </div>
      </div>
    </div>
  );
};

export default JapaneseDialectSidebar;
