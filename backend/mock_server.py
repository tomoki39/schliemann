#!/usr/bin/env python3
"""
AI音声変換APIのモックサーバー
実際のAI音声変換サービスが利用できない場合のテスト用
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import base64
import io
import wave
import numpy as np
import json
import time
import pyttsx3
from gtts import gTTS
import edge_tts
import asyncio
import tempfile
import os

app = Flask(__name__)
CORS(app)

# 利用可能な方言のリスト
AVAILABLE_DIALECTS = [
    'standard', 'tokyo', 'osaka', 'kyoto', 'hiroshima', 'fukuoka', 
    'sendai', 'nagoya', 'sapporo', 'okinawa', 'kagoshima',
    'kansai', 'hakata', 'tsugaru'
]

def improve_kanji_reading(text: str) -> str:
    """漢字の読み方を改善するための前処理"""
    # よく間違えられる漢字の読み方を修正
    replacements = {
        # 数字の読み方
        '1': 'いち',
        '2': 'に',
        '3': 'さん',
        '4': 'よん',
        '5': 'ご',
        '6': 'ろく',
        '7': 'なな',
        '8': 'はち',
        '9': 'きゅう',
        '0': 'ゼロ',
        
        # よく使われる漢字の読み方修正
        '今日': 'きょう',
        '明日': 'あした',
        '昨日': 'きのう',
        '今': 'いま',
        '時': 'とき',
        '分': 'ふん',
        '秒': 'びょう',
        '年': 'ねん',
        '月': 'がつ',
        '日': 'にち',
        '曜日': 'ようび',
        '時間': 'じかん',
        '分間': 'ふんかん',
        '秒間': 'びょうかん',
        '年間': 'ねんかん',
        '月間': 'げっかん',
        '日間': 'にちかん',
        
        # 天気関連
        '天気': 'てんき',
        '晴れ': 'はれ',
        '雨': 'あめ',
        '雪': 'ゆき',
        '曇り': 'くもり',
        '風': 'かぜ',
        '暑い': 'あつい',
        '寒い': 'さむい',
        '暖かい': 'あたたかい',
        '涼しい': 'すずしい',
        
        # 挨拶
        'おはよう': 'おはよう',
        'こんにちは': 'こんにちは',
        'こんばんは': 'こんばんは',
        'ありがとう': 'ありがとう',
        'すみません': 'すみません',
        'ごめんなさい': 'ごめんなさい',
        
        # 場所
        '東京': 'とうきょう',
        '大阪': 'おおさか',
        '京都': 'きょうと',
        '名古屋': 'なごや',
        '福岡': 'ふくおか',
        '札幌': 'さっぽろ',
        '仙台': 'せんだい',
        '広島': 'ひろしま',
        '鹿児島': 'かごしま',
        '沖縄': 'おきなわ',
    }
    
    # 置換を実行
    result = text
    for kanji, reading in replacements.items():
        result = result.replace(kanji, reading)
    
    return result

def convert_to_browser_compatible_wav(audio_data: bytes) -> bytes:
    """WAVファイルをブラウザ互換形式に変換"""
    try:
        # 既存のWAVファイルを読み込み
        with io.BytesIO(audio_data) as input_buffer:
            with wave.open(input_buffer, 'rb') as wav_in:
                # WAVファイルの情報を取得
                n_channels = wav_in.getnchannels()
                sample_width = wav_in.getsampwidth()
                sample_rate = wav_in.getframerate()
                n_frames = wav_in.getnframes()
                
                # 音声データを読み込み
                frames = wav_in.readframes(n_frames)
        
        # ブラウザ互換のWAVファイルを作成
        output_buffer = io.BytesIO()
        with wave.open(output_buffer, 'wb') as wav_out:
            wav_out.setnchannels(n_channels)
            wav_out.setsampwidth(sample_width)
            wav_out.setframerate(sample_rate)
            wav_out.writeframes(frames)
        
        return output_buffer.getvalue()
        
    except Exception as e:
        print(f"WAV conversion error: {e}")
        # フォールバック：標準的なWAVファイルを生成
        return generate_standard_wav(audio_data)

def generate_standard_wav(audio_data: bytes) -> bytes:
    """標準的なWAVファイルを生成"""
    sample_rate = 22050
    duration = 2.0  # 2秒の音声
    samples = int(sample_rate * duration)
    
    # シンプルな音声を生成
    t = np.linspace(0, duration, samples, False)
    wave_data = 0.3 * np.sin(2 * np.pi * 440 * t)  # 440Hzの音
    
    # 16bit PCMに変換
    wave_data = np.clip(wave_data, -1.0, 1.0)
    wave_data = (wave_data * 32767).astype(np.int16)
    
    # WAVファイルとして出力
    buffer = io.BytesIO()
    with wave.open(buffer, 'wb') as wav_file:
        wav_file.setnchannels(1)  # モノラル
        wav_file.setsampwidth(2)  # 16bit
        wav_file.setframerate(sample_rate)
        wav_file.writeframes(wave_data.tobytes())
    
    return buffer.getvalue()

def generate_real_tts_audio(text: str, dialect: str) -> bytes:
    """実際のTTSを使用して音声を生成"""
    try:
        # Edge TTSを使用して高品質な音声を生成
        return asyncio.run(generate_edge_tts_audio(text, dialect))
    except Exception as e:
        print(f"Edge TTS Error: {e}")
        # フォールバック：pyttsx3を使用
        return generate_pyttsx3_audio(text, dialect)

async def generate_edge_tts_audio(text: str, dialect: str) -> bytes:
    """Microsoft Edge TTSを使用して高品質な音声を生成"""
    try:
        # 方言に応じた音声設定（より自然な読み方をする音声を選択）
        voice_mapping = {
            'standard': 'ja-JP-MayuNeural',    # 女性声（より自然な読み方）
            'tokyo': 'ja-JP-MayuNeural',       # 女性声（東京）
            'osaka': 'ja-JP-KeitaNeural',      # 男性声（関西弁）
            'kyoto': 'ja-JP-AoiNeural',        # 女性声（京都弁）
            'hiroshima': 'ja-JP-KeitaNeural',  # 男性声（広島弁）
            'fukuoka': 'ja-JP-KeitaNeural',    # 男性声（博多弁）
            'sendai': 'ja-JP-AoiNeural',       # 女性声（仙台弁）
            'nagoya': 'ja-JP-MayuNeural',      # 女性声（名古屋弁）
            'sapporo': 'ja-JP-AoiNeural',      # 女性声（札幌弁）
            'okinawa': 'ja-JP-KeitaNeural',    # 男性声（沖縄弁）
            'kagoshima': 'ja-JP-KeitaNeural',  # 男性声（鹿児島弁）
            'kansai': 'ja-JP-KeitaNeural',     # 男性声（関西弁）
            'hakata': 'ja-JP-KeitaNeural',     # 男性声（博多弁）
            'tsugaru': 'ja-JP-AoiNeural',      # 女性声（津軽弁）
        }
        
        voice = voice_mapping.get(dialect, 'ja-JP-NanamiNeural')
        
        # 方言に応じた音声スタイルと速度を設定
        style_settings = {
            'standard': {'rate': '+0%', 'pitch': '+0Hz'},
            'tokyo': {'rate': '+0%', 'pitch': '+0Hz'},
            'osaka': {'rate': '+10%', 'pitch': '+20Hz'},
            'kyoto': {'rate': '-10%', 'pitch': '-10Hz'},
            'hiroshima': {'rate': '+5%', 'pitch': '+10Hz'},
            'fukuoka': {'rate': '-5%', 'pitch': '-5Hz'},
            'sendai': {'rate': '-10%', 'pitch': '-10Hz'},
            'nagoya': {'rate': '+0%', 'pitch': '+0Hz'},
            'sapporo': {'rate': '-15%', 'pitch': '-15Hz'},
            'okinawa': {'rate': '+15%', 'pitch': '+30Hz'},
            'kagoshima': {'rate': '+5%', 'pitch': '+5Hz'},
            'kansai': {'rate': '+10%', 'pitch': '+20Hz'},
            'hakata': {'rate': '-5%', 'pitch': '-5Hz'},
            'tsugaru': {'rate': '-15%', 'pitch': '-15Hz'},
        }
        
        settings = style_settings.get(dialect, {'rate': '+0%', 'pitch': '+0Hz'})
        
        # 漢字の読み方を改善するための前処理
        processed_text = improve_kanji_reading(text)
        
        # Edge TTSで音声を生成
        communicate = edge_tts.Communicate(processed_text, voice)
        
        # 一時ファイルに音声を保存
        with tempfile.NamedTemporaryFile(suffix='.mp3', delete=False) as temp_file:
            temp_path = temp_file.name
        
        await communicate.save(temp_path)
        
        # 音声ファイルを読み込み
        with open(temp_path, 'rb') as f:
            audio_data = f.read()
        
        # 一時ファイルを削除
        os.unlink(temp_path)
        
        # MP3をWAVに変換
        return convert_mp3_to_wav(audio_data)
        
    except Exception as e:
        print(f"Edge TTS Error: {e}")
        # フォールバック：pyttsx3を使用
        return generate_pyttsx3_audio(text, dialect)

def generate_pyttsx3_audio(text: str, dialect: str) -> bytes:
    """pyttsx3を使用して音声を生成（フォールバック）"""
    try:
        # pyttsx3を使用して音声を生成
        engine = pyttsx3.init()
        
        # 方言に応じた音声設定
        voices = engine.getProperty('voices')
        if voices:
            # 日本語の音声を選択（利用可能な場合）
            for voice in voices:
                if 'japanese' in voice.name.lower() or 'ja' in voice.id.lower():
                    engine.setProperty('voice', voice.id)
                    break
        
        # 音声の速度とピッチを調整
        dialect_settings = {
            'standard': {'rate': 200, 'pitch': 0.5},
            'tokyo': {'rate': 200, 'pitch': 0.5},
            'osaka': {'rate': 220, 'pitch': 0.7},
            'kyoto': {'rate': 180, 'pitch': 0.3},
            'hiroshima': {'rate': 210, 'pitch': 0.6},
            'fukuoka': {'rate': 190, 'pitch': 0.4},
            'sendai': {'rate': 185, 'pitch': 0.3},
            'nagoya': {'rate': 195, 'pitch': 0.4},
            'sapporo': {'rate': 175, 'pitch': 0.2},
            'okinawa': {'rate': 240, 'pitch': 0.8},
            'kagoshima': {'rate': 205, 'pitch': 0.5},
            'kansai': {'rate': 220, 'pitch': 0.7},
            'hakata': {'rate': 190, 'pitch': 0.4},
            'tsugaru': {'rate': 175, 'pitch': 0.2},
        }
        
        settings = dialect_settings.get(dialect, {'rate': 200, 'pitch': 0.5})
        engine.setProperty('rate', settings['rate'])
        # ピッチ調整をスキップ（NSSSでサポートされていない場合がある）
        try:
            engine.setProperty('pitch', settings['pitch'])
        except:
            print("Pitch adjustment not supported, using default")
        
        # 一時ファイルに音声を保存
        with tempfile.NamedTemporaryFile(suffix='.wav', delete=False) as temp_file:
            temp_path = temp_file.name
        
        engine.save_to_file(text, temp_path)
        engine.runAndWait()
        
        # 音声ファイルを読み込み
        with open(temp_path, 'rb') as f:
            audio_data = f.read()
        
        # 一時ファイルを削除
        os.unlink(temp_path)
        
        # WAVファイルをブラウザ互換形式に変換
        return convert_to_browser_compatible_wav(audio_data)
        
    except Exception as e:
        print(f"pyttsx3 Error: {e}")
        # フォールバック：gTTSを使用
        return generate_gtts_audio(text, dialect)

def generate_gtts_audio(text: str, dialect: str) -> bytes:
    """Google Text-to-Speechを使用して音声を生成"""
    try:
        # gTTSを使用して音声を生成
        tts = gTTS(text=text, lang='ja', slow=False)
        
        # 一時ファイルに音声を保存
        with tempfile.NamedTemporaryFile(suffix='.mp3', delete=False) as temp_file:
            temp_path = temp_file.name
        
        tts.save(temp_path)
        
        # MP3ファイルを読み込み
        with open(temp_path, 'rb') as f:
            audio_data = f.read()
        
        # 一時ファイルを削除
        os.unlink(temp_path)
        
        # MP3をWAVに変換してブラウザ互換にする
        return convert_mp3_to_wav(audio_data)
        
    except Exception as e:
        print(f"gTTS Error: {e}")
        # 最終フォールバック：シンプルな音声生成
        return generate_simple_audio(text, dialect)

def convert_mp3_to_wav(mp3_data: bytes) -> bytes:
    """MP3ファイルをWAVファイルに変換"""
    try:
        # 一時ファイルにMP3を保存
        with tempfile.NamedTemporaryFile(suffix='.mp3', delete=False) as temp_mp3:
            temp_mp3.write(mp3_data)
            temp_mp3_path = temp_mp3.name
        
        # WAVファイルに変換
        with tempfile.NamedTemporaryFile(suffix='.wav', delete=False) as temp_wav:
            temp_wav_path = temp_wav.name
        
        # 実際のMP3ファイルをそのまま使用（ブラウザでMP3を再生可能）
        # MP3ファイルをそのまま返す
        with open(temp_mp3_path, 'rb') as f:
            mp3_data = f.read()
        
        # 一時ファイルを削除
        os.unlink(temp_mp3_path)
        if os.path.exists(temp_wav_path):
            os.unlink(temp_wav_path)
        
        return mp3_data
        
    except Exception as e:
        print(f"MP3 to WAV conversion error: {e}")
        # フォールバック：標準的なWAVファイルを生成
        return generate_standard_wav(b'')

def generate_simple_audio(text: str, dialect: str) -> bytes:
    """シンプルな音声生成（フォールバック）"""
    sample_rate = 22050
    duration = max(1.0, len(text) * 0.2)
    samples = int(sample_rate * duration)
    
    # 方言に応じた基本周波数
    dialect_freqs = {
        'standard': 200, 'tokyo': 200, 'osaka': 220, 'kyoto': 180,
        'hiroshima': 210, 'fukuoka': 190, 'sendai': 185, 'nagoya': 195,
        'sapporo': 175, 'okinawa': 240, 'kagoshima': 205,
        'kansai': 220, 'hakata': 190, 'tsugaru': 175,
    }
    
    base_freq = dialect_freqs.get(dialect, 200)
    t = np.linspace(0, duration, samples, False)
    
    # より自然な音声を生成
    wave_data = np.zeros(samples)
    
    # 基本周波数と倍音
    wave_data += 0.5 * np.sin(2 * np.pi * base_freq * t)
    wave_data += 0.3 * np.sin(2 * np.pi * base_freq * 2 * t)
    wave_data += 0.2 * np.sin(2 * np.pi * base_freq * 3 * t)
    
    # エンベロープを適用
    envelope = np.exp(-t * 2)
    wave_data *= envelope
    
    # 音量を調整
    wave_data = wave_data * 0.3
    
    # 16bit PCMに変換
    wave_data = np.clip(wave_data, -1.0, 1.0)
    wave_data = (wave_data * 32767).astype(np.int16)
    
    # WAVファイルとして出力
    buffer = io.BytesIO()
    with wave.open(buffer, 'wb') as wav_file:
        wav_file.setnchannels(1)
        wav_file.setsampwidth(2)
        wav_file.setframerate(sample_rate)
        wav_file.writeframes(wave_data.tobytes())
    
    return buffer.getvalue()

@app.route('/health', methods=['GET'])
def health_check():
    """ヘルスチェックエンドポイント"""
    return jsonify({
        'status': 'healthy',
        'service': 'AI Voice Conversion Mock',
        'version': '1.0.0'
    })

@app.route('/dialects', methods=['GET'])
def get_dialects():
    """利用可能な方言のリストを取得"""
    return jsonify({
        'dialects': AVAILABLE_DIALECTS,
        'count': len(AVAILABLE_DIALECTS)
    })

@app.route('/voice/convert', methods=['POST'])
def convert_voice():
    """音声変換エンドポイント"""
    try:
        data = request.get_json()
        
        # リクエストデータの検証
        required_fields = ['text', 'source_language', 'target_dialect']
        for field in required_fields:
            if field not in data:
                return jsonify({
                    'success': False,
                    'error': f'Missing required field: {field}'
                }), 400
        
        text = data['text']
        source_language = data['source_language']
        target_dialect = data['target_dialect']
        voice_settings = data.get('voice_settings', {})
        
        # 方言の検証
        if target_dialect not in AVAILABLE_DIALECTS:
            return jsonify({
                'success': False,
                'error': f'Unsupported dialect: {target_dialect}'
            }), 400
        
        # テキストの長さチェック
        if len(text) > 500:
            return jsonify({
                'success': False,
                'error': 'Text too long (max 500 characters)'
            }), 400
        
        # 音声生成のシミュレーション（実際の処理時間を模擬）
        time.sleep(0.5)
        
        # 実際のTTSを使用して音声を生成
        audio_data = generate_real_tts_audio(text, target_dialect)
        
        # 音声の長さを推定（実際のTTSでは正確な長さを取得できない場合がある）
        duration = min(len(text) * 0.1, 10.0)
        
        # Base64エンコード
        audio_base64 = base64.b64encode(audio_data).decode('utf-8')
        
        return jsonify({
            'success': True,
            'audio_data': audio_base64,
            'duration': duration,
            'dialect': target_dialect,
            'text': text,
            'conversion_info': {
                'source_language': source_language,
                'target_dialect': target_dialect,
                'voice_settings': voice_settings,
                'processing_time': 0.5
            }
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Internal server error: {str(e)}'
        }), 500

@app.route('/voice/status', methods=['GET'])
def voice_status():
    """音声変換サービスの状態を取得"""
    return jsonify({
        'service_status': 'running',
        'available_dialects': len(AVAILABLE_DIALECTS),
        'supported_languages': ['ja'],
        'max_text_length': 500,
        'supported_formats': ['wav']
    })

if __name__ == '__main__':
    print("AI音声変換モックサーバーを起動中...")
    print("利用可能な方言:", ', '.join(AVAILABLE_DIALECTS))
    print("APIエンドポイント:")
    print("  GET  /health - ヘルスチェック")
    print("  GET  /dialects - 方言リスト")
    print("  POST /voice/convert - 音声変換")
    print("  GET  /voice/status - サービス状態")
    print("\nサーバーを起動します...")
    
    app.run(host='0.0.0.0', port=8000, debug=True)

