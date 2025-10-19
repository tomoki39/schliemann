#!/usr/bin/env python3
"""
方言判定システム
テキストから方言を自動判定し、適切なTTSエンジンを選択
"""

import re
import logging
from typing import Dict, List, Optional, Tuple
from dataclasses import dataclass
from enum import Enum

# ログ設定
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class DialectType(Enum):
    STANDARD = "standard"
    SHANGHAI = "shanghai"
    SICHUAN = "sichuan"
    GYEONGSANG = "gyeongsang"
    JEJU = "jeju"
    AUTO = "auto"

@dataclass
class DialectPattern:
    """方言パターンの定義"""
    vocabulary: List[str]
    grammar: List[str]
    pronunciation: List[str]
    unique_expressions: List[str]

class DialectDetector:
    """方言自動判定システム"""
    
    def __init__(self):
        # 各方言の特徴パターンを定義
        self.dialect_patterns = {
            DialectType.SHANGHAI: DialectPattern(
                vocabulary=[
                    '侬', '阿拉', '今朝', '蛮好', '再会', '啥', '哪能',
                    '啥地方', '谢谢侬', '做生活', '困觉', '屋里', '学堂',
                    '伊', '伊拉', '个', '个能', '个么', '个辰光'
                ],
                grammar=[
                    '啥地方', '哪能', '做生活', '困觉', '个能', '个么',
                    '个辰光', '个搭', '个里', '个面'
                ],
                pronunciation=[
                    'zh→z', 'ch→c', 'sh→s', 'r→l', 'an→ang', 'en→eng'
                ],
                unique_expressions=[
                    '侬好', '今朝', '蛮好', '阿拉', '伊拉', '个能'
                ]
            ),
            DialectType.SICHUAN: DialectPattern(
                vocabulary=[
                    '巴适', '安逸', '要得', '瓜娃子', '哈儿', '锤子',
                    '整', '得行', '咋个', '啥子', '啷个', '巴适得很'
                ],
                grammar=[
                    '巴适得很', '要得不', '咋个整', '啷个办', '啥子嘛'
                ],
                pronunciation=[
                    'n→l', 'l→n', 'tone_merging', 'rising_tone'
                ],
                unique_expressions=[
                    '巴适', '安逸', '要得', '瓜娃子', '哈儿'
                ]
            ),
            DialectType.GYEONGSANG: DialectPattern(
                vocabulary=[
                    '오이소', '모하노', '어디가', '뭐하노', '어떻게', '왜그래',
                    '그래서', '그러면', '그런데', '그러니까'
                ],
                grammar=[
                    '오이소', '모하노', '어디가', '뭐하노', '왜그래'
                ],
                pronunciation=[
                    'rising_tone', 'final_rising', 'vowel_lengthening'
                ],
                unique_expressions=[
                    '오이소', '모하노', '어디가', '뭐하노'
                ]
            ),
            DialectType.JEJU: DialectPattern(
                vocabulary=[
                    '혼저', '옵서예', '하르방', '할망', '고사리', '돌하르방',
                    '돌하르방이', '돌하르방이야', '돌하르방이요'
                ],
                grammar=[
                    '혼저 옵서예', '하르방', '할망', '돌하르방'
                ],
                pronunciation=[
                    'vowel_merging', 'consonant_weakening', 'tone_simplification'
                ],
                unique_expressions=[
                    '혼저 옵서예', '하르방', '할망', '돌하르방'
                ]
            ),
            DialectType.STANDARD: DialectPattern(
                vocabulary=[
                    '你好', '今天', '很好', '我们', '你们', '什么', '怎么',
                    '哪里', '谢谢', '再见', '吃饭', '睡觉', '工作', '学习',
                    '朋友', '家', '学校', '医院', '商店', '银行'
                ],
                grammar=[
                    '什么地方', '怎么', '工作', '学习', '朋友'
                ],
                pronunciation=[
                    'zh', 'ch', 'sh', 'r', 'standard_tones'
                ],
                unique_expressions=[
                    '你好', '今天', '很好', '我们', '你们'
                ]
            )
        }
        
        # 重み付けスコア
        self.weights = {
            'vocabulary': 3.0,
            'grammar': 2.0,
            'pronunciation': 1.5,
            'unique_expressions': 4.0
        }
    
    def detect_dialect(self, text: str, confidence_threshold: float = 0.3) -> Tuple[DialectType, float]:
        """
        テキストから方言を自動判定
        
        Args:
            text: 判定するテキスト
            confidence_threshold: 信頼度の閾値
            
        Returns:
            (方言タイプ, 信頼度スコア)
        """
        if not text or not text.strip():
            return DialectType.STANDARD, 0.0
        
        # 各方言のスコアを計算
        scores = {}
        for dialect_type, pattern in self.dialect_patterns.items():
            if dialect_type == DialectType.STANDARD:
                continue  # 標準語はデフォルトとして扱う
            
            score = self._calculate_dialect_score(text, pattern)
            scores[dialect_type] = score
        
        # 最高スコアの方言を選択
        if not scores:
            return DialectType.STANDARD, 0.0
        
        best_dialect = max(scores, key=scores.get)
        best_score = scores[best_dialect]
        
        # 信頼度チェック
        if best_score < confidence_threshold:
            return DialectType.STANDARD, best_score
        
        return best_dialect, best_score
    
    def _calculate_dialect_score(self, text: str, pattern: DialectPattern) -> float:
        """方言スコアを計算"""
        total_score = 0.0
        total_weight = 0.0
        
        # 語彙スコア
        vocab_score = self._calculate_pattern_score(text, pattern.vocabulary)
        total_score += vocab_score * self.weights['vocabulary']
        total_weight += self.weights['vocabulary']
        
        # 文法スコア
        grammar_score = self._calculate_pattern_score(text, pattern.grammar)
        total_score += grammar_score * self.weights['grammar']
        total_weight += self.weights['grammar']
        
        # 発音スコア（テキストからは直接判定困難）
        pronunciation_score = 0.0
        total_score += pronunciation_score * self.weights['pronunciation']
        total_weight += self.weights['pronunciation']
        
        # 独特表現スコア
        unique_score = self._calculate_pattern_score(text, pattern.unique_expressions)
        total_score += unique_score * self.weights['unique_expressions']
        total_weight += self.weights['unique_expressions']
        
        # 正規化されたスコアを返す
        return total_score / total_weight if total_weight > 0 else 0.0
    
    def _calculate_pattern_score(self, text: str, patterns: List[str]) -> float:
        """パターンマッチングスコアを計算"""
        if not patterns:
            return 0.0
        
        matches = 0
        for pattern in patterns:
            if pattern in text:
                matches += 1
        
        return matches / len(patterns)
    
    def get_dialect_info(self, dialect: DialectType) -> Dict[str, any]:
        """方言の詳細情報を取得"""
        if dialect not in self.dialect_patterns:
            return {}
        
        pattern = self.dialect_patterns[dialect]
        return {
            'name': dialect.value,
            'vocabulary_count': len(pattern.vocabulary),
            'grammar_count': len(pattern.grammar),
            'pronunciation_features': pattern.pronunciation,
            'unique_expressions': pattern.unique_expressions
        }
    
    def suggest_dialect_conversion(self, text: str, target_dialect: DialectType) -> str:
        """テキストを指定された方言に変換する提案"""
        if target_dialect == DialectType.STANDARD:
            return text
        
        # 方言別の変換ルール
        conversion_rules = {
            DialectType.SHANGHAI: {
                '你好': '侬好',
                '今天': '今朝',
                '很好': '蛮好',
                '我们': '阿拉',
                '你们': '侬拉',
                '什么': '啥',
                '怎么': '哪能',
                '哪里': '啥地方',
                '谢谢': '谢谢侬',
                '再见': '再会',
                '吃饭': '吃饭',
                '睡觉': '困觉',
                '工作': '做生活',
                '学习': '读书',
                '朋友': '朋友',
                '家': '屋里',
                '学校': '学堂',
                '医院': '医院',
                '商店': '店',
                '银行': '银行'
            },
            DialectType.SICHUAN: {
                '很好': '巴适',
                '可以': '要得',
                '怎么样': '啷个',
                '什么': '啥子',
                '怎么': '啷个',
                '哪里': '哪搭',
                '这里': '这搭',
                '那里': '那搭',
                '这个': '这个',
                '那个': '那个',
                '人': '人',
                '东西': '东西',
                '事情': '事情',
                '问题': '问题',
                '办法': '办法'
            }
        }
        
        if target_dialect not in conversion_rules:
            return text
        
        converted_text = text
        rules = conversion_rules[target_dialect]
        
        for standard, dialect in rules.items():
            converted_text = converted_text.replace(standard, dialect)
        
        return converted_text

def main():
    """テスト実行"""
    detector = DialectDetector()
    
    # テストケース
    test_cases = [
        "你好，今天天气很好",
        "侬好，今朝天气蛮好",
        "巴适得很，要得不",
        "오이소, 모하노?",
        "혼저 옵서예"
    ]
    
    for text in test_cases:
        dialect, confidence = detector.detect_dialect(text)
        print(f"テキスト: {text}")
        print(f"判定結果: {dialect.value} (信頼度: {confidence:.2f})")
        print("-" * 50)

if __name__ == "__main__":
    main()
