# CI/CD・デプロイ仕様

## 目的
- 一貫したビルド/テスト/デプロイの自動化
- 環境ごとの差分管理（dev/stg/prod）

## パイプライン（GitHub Actions）
- トリガー
  - `pull_request`: Lint/Build/Test
  - `push main`: Build/Test → Staging デプロイ
  - 手動 `workflow_dispatch`: Production デプロイ
- ジョブ
  - setup-node / npm ci
  - typecheck / lint / test
  - docker build & push（ghcr.io）
  - deploy（stg/prod）: IaC or CLI（AWS/GCP）

## コンテナ
- `Dockerfile`（frontend / backend 別、もしくは monorepo）
- 画像最適化・MVT生成はビルド時に実施可能

## 環境
- dev: ローカルDocker（docker-compose）
- stg: クラウド（小規模、オートスケール有）
- prod: マルチAZ、CDN、WAF

## デプロイ手順（概要）
1. mainへマージ → Actionsでビルド・テスト
2. コンテナをレジストリへプッシュ
3. IaC適用（Terraform等）/ サービス更新
4. ヘルスチェック → 切り替え
