# Schliemann（シュリーマン）

**Explore the world's knowledge territories**

## 概要

Schliemann（シュリーマン）は、全世界の言語分布を都市・村落レベルで詳細に表示するインタラクティブなWebアプリケーションです。Google MapsとWikipediaを組み合わせたような、知識探索型のプラットフォームとして設計されています。

### 🌟 将来ビジョン
Schliemannは言語学から始まり、将来的には**人類学、宗教学、地理学、社会学、歴史学**など、あらゆる人文・社会科学分野の知識を地理的コンテキストで統合し、人類の知識全体を探索できるプラットフォームを目指します。

**詳細なビジョン・戦略**: [docs/vision_and_strategy.md](docs/vision_and_strategy.md)  
**多分野展開ロードマップ**: [docs/multi_domain_roadmap.md](docs/multi_domain_roadmap.md)  
**全体ロードマップ**: [docs/overall_roadmap.md](docs/overall_roadmap.md)

## 名前の由来

ハインリヒ・シュリーマン（1822-1890）ドイツの考古学者・実業家から命名。トロイア遺跡の発掘や古代ギリシャ研究など、考古学的発見と探検精神を象徴しています。

## 特徴

### 🗺️ 地理的可視化
- 🌍 **全世界対応**: 都市・村落レベルの詳細な言語分布
- 🎨 **複数表示モード**: 言語ファミリー、話者数、消滅危惧度、文字体系別表示
- 🔍 **高度な検索・フィルタ**: 言語名、地域、話者数、年代での絞り込み

### 📚 知識探索
- 📊 **詳細情報表示**: 言語学的特徴、歴史、文化、統計情報
- 🔄 **比較機能**: 複数言語・地域の同時比較
- 📚 **ブックマーク機能**: 興味深い地域・言語の保存・共有
- 📈 **統計・分析**: 地域の言語多様性指数、時系列分析

### 🌐 ユーザー参加（Wikipedia風）
- ✏️ **ユーザー編集**: 誰でも情報を追加・修正可能
- 🔍 **品質管理**: コミュニティによる情報検証
- 🌍 **多言語対応**: 英語・日本語から始まり、段階的に多言語展開

### 💰 マネタイズ方針
- 🆓 **フリー**: ほぼ全ての機能を無料で利用可能
- 💎 **プレミアム**: 高度な分析ツール、API アクセス等のプラスアルファ
- 💝 **寄付**: Wikipedia風の寄付システム

### 📱 アクセシビリティ
- 📱 **レスポンシブデザイン**: PC・タブレット・スマートフォン対応
- ♿ **アクセシビリティ**: WCAG 2.1 AA準拠、多様なユーザーへの配慮

## 技術スタック

- **フロントエンド**: React 18 + TypeScript + Leaflet + Tailwind CSS
- **バックエンド**: Node.js + Express + PostgreSQL + PostGIS + Redis
- **データ処理**: Python + GeoPandas + GDAL
- **状態管理**: Zustand + React Query
- **多言語対応**: i18next（日本語・英語）
- **テスト**: Jest + React Testing Library + Playwright
- **インフラ**: Docker + AWS/Google Cloud + CDN

## 開発状況

🚧 **開発中** - MVP開発フェーズ

### 開発ロードマップ

#### 言語学フェーズ（2025年）
- **Phase 1 (3-4ヶ月)**: 基本機能・MVP開発
- **Phase 2 (2-3ヶ月)**: 機能拡張・データ充実
- **Phase 3 (2-3ヶ月)**: 最適化・高度機能

#### 多分野展開（2026年以降）
- **Phase 4 (2026年)**: 人類学・宗教学分野の追加
- **Phase 5 (2027年)**: 地理学・環境学分野の追加
- **Phase 6 (2028年)**: 社会学・政治学分野の追加
- **Phase 7 (2029年)**: 歴史学・考古学分野の追加

詳細な仕様については [docs/language_map_specification.md](docs/language_map_specification.md) をご覧ください。

## 多言語対応

- **開発言語**: 日本語（基本言語、同僚との協業のため）
- **第2言語**: 英語（国際展開のため）
- **将来展開**: 中国語、スペイン語、フランス語、ドイツ語等
- **UI言語選択**: ユーザーが言語を選択可能

## データソース

- **Ethnologue**: 言語データベース
- **UNESCO Atlas**: 消滅危惧言語
- **Glottolog**: 言語分類・系統
- **WALS**: 言語構造データ
- **OpenStreetMap**: 地理データ
- **Wikipedia**: 多言語情報

## 追加ドキュメント
- **DBスキーマ**: [docs/database_schema.md](docs/database_schema.md)
- **API仕様**: [docs/api_spec.md](docs/api_spec.md)
- **認証・権限**: [docs/auth_and_permissions.md](docs/auth_and_permissions.md)
- **UIワイヤーフレーム**: [docs/ui_wireframes.md](docs/ui_wireframes.md)
- **データフロー**: [docs/data_flow.md](docs/data_flow.md)
- **CI/CD・デプロイ**: [docs/devops_cicd.md](docs/devops_cicd.md)
- **環境設定・インフラ**: [docs/env_and_infra.md](docs/env_and_infra.md)
- **エラーハンドリング・ログ**: [docs/error_logging.md](docs/error_logging.md)
- **データ取り込み・変換・更新**: [docs/data_ingestion.md](docs/data_ingestion.md)
- **詳細テスト仕様**: [docs/testing_details.md](docs/testing_details.md)
- **セキュリティ・コンプライアンス**: [docs/security_compliance.md](docs/security_compliance.md)
- **パフォーマンス・スケーラビリティ**: [docs/performance_scalability.md](docs/performance_scalability.md)
- **アクセシビリティ詳細**: [docs/accessibility_spec.md](docs/accessibility_spec.md)

## 開発ガイド
- **開発ロードマップ**: [docs/development_roadmap.md](docs/development_roadmap.md)
- **開発環境セットアップ**: [docs/dev_setup_guide.md](docs/dev_setup_guide.md)
- **MVPタスクリスト**: [docs/mvp_task_list.md](docs/mvp_task_list.md)

## ライセンス

MIT License

## 貢献

プロジェクトへの貢献を歓迎します。詳細は [Issues](https://github.com/tomoki39/schliemann/issues) をご覧ください。