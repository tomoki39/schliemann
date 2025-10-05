import React, { useState, useRef, useEffect } from 'react';
import { enhancedVoiceService, EnhancedVoiceRequest } from '../services/enhancedVoiceService';
import { Language } from '../types/Language';
import { DEMO_CONFIG } from '../config/demo';

interface LanguageExplorerProps {
  languages: Language[];
  onClose: () => void;
}

interface LanguageItem {
  id: string;
  name: string;
  level: 'family' | 'branch' | 'group' | 'subgroup' | 'language' | 'dialect';
  parentId?: string;
  children: LanguageItem[];
  languages: Language[];
  isExpanded: boolean;
  isPlaying: boolean;
  isLoading: boolean;
  error?: string;
}

const LanguageExplorer: React.FC<LanguageExplorerProps> = ({ languages, onClose }) => {
  const [languageTree, setLanguageTree] = useState<LanguageItem[]>([]);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [playingItems, setPlayingItems] = useState<Set<string>>(new Set());
  const [loadingItems, setLoadingItems] = useState<Set<string>>(new Set());
  const [errorItems, setErrorItems] = useState<Map<string, string>>(new Map());
  const audioRefs = useRef<Map<string, HTMLAudioElement>>(new Map());

  // 言語ツリーを構築
  useEffect(() => {
    const buildLanguageTree = (): LanguageItem[] => {
      const families = new Map<string, LanguageItem>();
      
      languages.forEach(lang => {
        // 語族レベル
        if (!families.has(lang.family)) {
          families.set(lang.family, {
            id: `family_${lang.family}`,
            name: lang.family,
            level: 'family',
            children: [],
            languages: [],
            isExpanded: false,
            isPlaying: false,
            isLoading: false
          });
        }
        
        const family = families.get(lang.family)!;
        family.languages.push(lang);
        
        // 語派レベル
        if (lang.branch) {
          let branch = family.children.find(child => child.name === lang.branch);
          if (!branch) {
            branch = {
              id: `branch_${lang.family}_${lang.branch}`,
              name: lang.branch,
              level: 'branch',
              parentId: family.id,
              children: [],
              languages: [],
              isExpanded: false,
              isPlaying: false,
              isLoading: false
            };
            family.children.push(branch);
          }
          branch.languages.push(lang);
          
          // 語群レベル
          if (lang.group) {
            let group = branch.children.find(child => child.name === lang.group);
            if (!group) {
              group = {
                id: `group_${lang.family}_${lang.branch}_${lang.group}`,
                name: lang.group,
                level: 'group',
                parentId: branch.id,
                children: [],
                languages: [],
                isExpanded: false,
                isPlaying: false,
                isLoading: false
              };
              branch.children.push(group);
            }
            group.languages.push(lang);
            
            // 語支レベル
            if (lang.subgroup) {
              let subgroup = group.children.find(child => child.name === lang.subgroup);
              if (!subgroup) {
                subgroup = {
                  id: `subgroup_${lang.family}_${lang.branch}_${lang.group}_${lang.subgroup}`,
                  name: lang.subgroup,
                  level: 'subgroup',
                  parentId: group.id,
                  children: [],
                  languages: [],
                  isExpanded: false,
                  isPlaying: false,
                  isLoading: false
                };
                group.children.push(subgroup);
              }
              subgroup.languages.push(lang);
              
              // 言語レベル
              if (lang.language) {
                let language = subgroup.children.find(child => child.name === lang.language);
                if (!language) {
                  language = {
                    id: `language_${lang.family}_${lang.branch}_${lang.group}_${lang.subgroup}_${lang.language}`,
                    name: lang.language,
                    level: 'language',
                    parentId: subgroup.id,
                    children: [],
                    languages: [],
                    isExpanded: false,
                    isPlaying: false,
                    isLoading: false
                  };
                  subgroup.children.push(language);
                }
                language.languages.push(lang);
                
                // 方言レベル
                if (lang.dialects && lang.dialects.length > 0) {
                  lang.dialects.forEach((dialect, index) => {
                    const dialectItem: LanguageItem = {
                      id: `dialect_${lang.id}_${index}`,
                      name: dialect.name,
                      level: 'dialect',
                      parentId: language.id,
                      children: [],
                      languages: [lang],
                      isExpanded: false,
                      isPlaying: false,
                      isLoading: false
                    };
                    language.children.push(dialectItem);
                  });
                }
              }
            }
          }
        }
      });
      
      return Array.from(families.values()).sort((a, b) => a.name.localeCompare(b.name));
    };
    
    setLanguageTree(buildLanguageTree());
  }, [languages]);

  // アイテムの展開/折りたたみ
  const toggleExpanded = (itemId: string) => {
    setLanguageTree(prev => {
      const updateItem = (items: LanguageItem[]): LanguageItem[] => {
        return items.map(item => {
          if (item.id === itemId) {
            return { ...item, isExpanded: !item.isExpanded };
          }
          if (item.children.length > 0) {
            return { ...item, children: updateItem(item.children) };
          }
          return item;
        });
      };
      return updateItem(prev);
    });
  };

  // アイテムの選択/選択解除
  const toggleSelection = (itemId: string) => {
    setSelectedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  };

  // 音声再生
  const playAudio = async (item: LanguageItem) => {
    if (playingItems.has(item.id)) {
      // 停止
      const audio = audioRefs.current.get(item.id);
      if (audio) {
        audio.pause();
        audio.currentTime = 0;
      }
      setPlayingItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(item.id);
        return newSet;
      });
      return;
    }

    // 他の音声を停止
    playingItems.forEach(playingId => {
      const audio = audioRefs.current.get(playingId);
      if (audio) {
        audio.pause();
        audio.currentTime = 0;
      }
    });
    setPlayingItems(new Set());

    // 新しい音声を再生
    setLoadingItems(prev => new Set(prev).add(item.id));
    setErrorItems(prev => {
      const newMap = new Map(prev);
      newMap.delete(item.id);
      return newMap;
    });

    try {
      const text = getSampleText(item);
      const request: EnhancedVoiceRequest = {
        text,
        language: getLanguageCode(item),
        dialect: item.level === 'dialect' ? item.name : undefined
      };

      const result = await enhancedVoiceService.generateVoice(request);
      
      if (result.success && result.audioUrl) {
        const audio = new Audio(result.audioUrl);
        audioRefs.current.set(item.id, audio);
        
        audio.onended = () => {
          setPlayingItems(prev => {
            const newSet = new Set(prev);
            newSet.delete(item.id);
            return newSet;
          });
        };
        
        audio.onerror = () => {
          setErrorItems(prev => new Map(prev).set(item.id, '音声の再生に失敗しました'));
          setPlayingItems(prev => {
            const newSet = new Set(prev);
            newSet.delete(item.id);
            return newSet;
          });
        };
        
        await audio.play();
        setPlayingItems(prev => new Set(prev).add(item.id));
      } else {
        setErrorItems(prev => new Map(prev).set(item.id, result.error || '音声の生成に失敗しました'));
      }
    } catch (error) {
      setErrorItems(prev => new Map(prev).set(item.id, '音声の生成中にエラーが発生しました'));
    } finally {
      setLoadingItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(item.id);
        return newSet;
      });
    }
  };

  // サンプルテキストを取得
  const getSampleText = (item: LanguageItem): string => {
    if (item.level === 'dialect') {
      const lang = item.languages[0];
      if (lang.id === 'jpn') {
        return DEMO_CONFIG.sampleTexts.japanese[item.name.toLowerCase() as keyof typeof DEMO_CONFIG.sampleTexts.japanese] || 
               `こんにちは、${item.name}で話しています。`;
      }
    }
    
    const lang = item.languages[0];
    if (lang.id === 'eng') {
      return `Hello, I am speaking ${item.name}.`;
    } else if (lang.id === 'fr') {
      return `Bonjour, je parle ${item.name}.`;
    } else if (lang.id === 'spa') {
      return `Hola, hablo ${item.name}.`;
    } else if (lang.id === 'cmn') {
      return `你好，我说${item.name}。`;
    }
    
    return `Hello, I am speaking ${item.name}.`;
  };

  // 言語コードを取得
  const getLanguageCode = (item: LanguageItem): string => {
    const lang = item.languages[0];
    return lang.id;
  };

  // 複数選択で音声比較
  const playComparison = async () => {
    const selectedArray = Array.from(selectedItems);
    if (selectedArray.length < 2) return;

    // 選択されたアイテムを順番に再生
    for (const itemId of selectedArray) {
      const item = findItemById(languageTree, itemId);
      if (item) {
        await playAudio(item);
        // 少し待ってから次の音声を再生
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
  };

  // アイテムをIDで検索
  const findItemById = (items: LanguageItem[], id: string): LanguageItem | null => {
    for (const item of items) {
      if (item.id === id) return item;
      if (item.children.length > 0) {
        const found = findItemById(item.children, id);
        if (found) return found;
      }
    }
    return null;
  };

  // アイテムをレンダリング
  const renderItem = (item: LanguageItem, depth: number = 0) => {
    const isSelected = selectedItems.has(item.id);
    const isPlaying = playingItems.has(item.id);
    const isLoading = loadingItems.has(item.id);
    const error = errorItems.get(item.id);

    return (
      <div key={item.id} className="mb-1">
        <div 
          className={`flex items-center p-2 rounded cursor-pointer hover:bg-gray-100 ${
            isSelected ? 'bg-blue-100 border border-blue-300' : ''
          }`}
          style={{ marginLeft: `${depth * 20}px` }}
        >
          {/* 展開/折りたたみボタン */}
          {item.children.length > 0 && (
            <button
              onClick={() => toggleExpanded(item.id)}
              className="mr-2 w-6 h-6 flex items-center justify-center text-gray-500 hover:text-gray-700"
            >
              {item.isExpanded ? '▼' : '▶'}
            </button>
          )}
          
          {/* チェックボックス */}
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => toggleSelection(item.id)}
            className="mr-2"
          />
          
          {/* アイテム名 */}
          <span className="flex-1 text-sm font-medium">
            {item.name}
            <span className="ml-2 text-xs text-gray-500">
              ({item.languages.length}言語)
            </span>
          </span>
          
          {/* 音声再生ボタン */}
          <button
            onClick={() => playAudio(item)}
            disabled={isLoading}
            className={`px-3 py-1 text-xs rounded ${
              isPlaying 
                ? 'bg-red-500 text-white hover:bg-red-600' 
                : 'bg-blue-500 text-white hover:bg-blue-600'
            } disabled:opacity-50`}
          >
            {isLoading ? '生成中...' : isPlaying ? '停止' : '再生'}
          </button>
        </div>
        
        {/* エラーメッセージ */}
        {error && (
          <div className="text-red-500 text-xs mt-1" style={{ marginLeft: `${(depth + 1) * 20}px` }}>
            {error}
          </div>
        )}
        
        {/* 子アイテム */}
        {item.isExpanded && item.children.length > 0 && (
          <div>
            {item.children.map(child => renderItem(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col bg-white">
      {/* ヘッダー */}
      <div className="p-4 border-b bg-gray-50">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-gray-800">言語分類エクスプローラー</h2>
            <p className="text-sm text-gray-600 mt-1">
              言語の分類を階層的に表示し、音声を聞くことができます。複数選択して比較も可能です。
            </p>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-2xl"
            >
              ×
            </button>
          )}
        </div>
      </div>
      
      {/* コントロール */}
      <div className="p-4 border-b bg-gray-50">
        <div className="flex gap-2">
          <button
            onClick={playComparison}
            disabled={selectedItems.size < 2}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            選択した音声を順番に再生 ({selectedItems.size}個選択中)
          </button>
          <button
            onClick={() => setSelectedItems(new Set())}
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            選択をクリア
          </button>
        </div>
      </div>
      
      {/* 言語ツリー */}
      <div className="flex-1 overflow-y-auto p-4">
        {languageTree.map(item => renderItem(item))}
      </div>
    </div>
  );
};

export default LanguageExplorer;
