# 環境設定・インフラ仕様

## 環境変数（.env.example）
- DATABASE_URL=postgres://user:pass@host:5432/db
- REDIS_URL=redis://host:6379
- NODE_ENV=development|staging|production
- MAP_TILE_BASE=https://cdn.example.com/tiles
- PORT=3000

## ネットワーク/インフラ
- CDN: タイル/静的配信（Cache-Control, ETag）
- WAF: OWASP Top10対策
- LB: HTTPS(TLS1.2+)
- DB: PostgreSQL + PostGIS（マネージド推奨）
- キャッシュ: Redis（マネージド推奨）

## バックアップ/DR
- DB: 日次スナップショット、7-30日保持
- オブジェクトストレージ: バージョニング有効
- 復旧手順: 四半期ごとにテスト
