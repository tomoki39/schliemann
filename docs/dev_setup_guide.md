# 開発環境セットアップガイド

## 前提条件
- Node.js 18+
- Docker & Docker Compose
- Git
- PostgreSQL 14+（ローカル開発用）

## クイックスタート

### 1. リポジトリクローン
```bash
git clone https://github.com/tomoki39/rinzo.git
cd rinzo
```

### 2. 環境変数設定
```bash
cp .env.example .env
# .envファイルを編集（データベース接続情報等）
```

### 3. Docker環境起動
```bash
docker-compose up -d
```

### 4. データベース初期化
```bash
npm run db:migrate
npm run db:seed
```

### 5. 開発サーバー起動
```bash
# フロントエンド
cd frontend
npm install
npm run dev

# バックエンド（別ターミナル）
cd backend
npm install
npm run dev
```

## 詳細セットアップ

### フロントエンド（React + TypeScript）
```bash
cd frontend
npm install
npm run type-check
npm run test
npm run build
```

### バックエンド（Node.js + Express）
```bash
cd backend
npm install
npm run test
npm run start:dev
```

### データ処理（Python）
```bash
cd data-processing
pip install -r requirements.txt
python scripts/import_ethnologue.py
```

## 開発ツール

### 推奨エディタ設定
- VSCode + 拡張機能
  - TypeScript
  - ESLint
  - Prettier
  - GitLens

### デバッグ
- フロントエンド: React DevTools
- バックエンド: Node.js Inspector
- データベース: pgAdmin

## トラブルシューティング

### よくある問題
1. **ポート競合**: 3000, 5432ポートが使用中
2. **データベース接続エラー**: PostgreSQL起動確認
3. **メモリ不足**: Dockerメモリ設定調整

### ログ確認
```bash
# Docker ログ
docker-compose logs -f

# アプリケーションログ
tail -f logs/app.log
```

## 本番環境デプロイ

### ステージング
```bash
git push origin main
# GitHub Actions が自動デプロイ
```

### 本番
```bash
# 手動デプロイ（管理者のみ）
npm run deploy:prod
```

## 貢献ガイド

### ブランチ戦略
- `main`: 本番環境
- `develop`: 開発環境
- `feature/*`: 機能開発
- `hotfix/*`: 緊急修正

### プルリクエスト
1. 機能ブランチ作成
2. 実装・テスト
3. プルリクエスト作成
4. コードレビュー
5. マージ

### コミット規約
```
feat: 新機能追加
fix: バグ修正
docs: ドキュメント更新
style: コードフォーマット
refactor: リファクタリング
test: テスト追加
chore: その他
```
