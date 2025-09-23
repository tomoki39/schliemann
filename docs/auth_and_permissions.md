# 認証・権限仕様（匿名ファースト）

## 方針
- Google Maps / Wikipedia 同様、**ログイン不要でほぼ全機能を提供**
- 認証は投稿・管理・同期など任意機能のみに限定

## 匿名ユーザー（Default）
- 許可: 閲覧（全GET API）、検索、比較、ローカルブックマーク
- 不可: 投稿、管理、サーバー同期

## ログインユーザー（任意）
- 追加メリット: ブックマーク同期・共有、UGC投稿（編集提案）、ダッシュボード
- 認証方式: OAuth2/OIDC（Google, GitHub） + Email Link（Passwordless）

## ロール
- user: 通常ユーザー（自身の投稿）
- moderator: 投稿レビュー/承認
- admin: システム管理

## 権限要旨
- GET（公開データ）: anonymous/user/moderator/admin すべて可
- POST（投稿提案）: user 以上
- PATCH/DELETE（承認・反映）: moderator 以上

## セキュリティ
- TLS、レート制限、監査ログ（承認操作）
- CSRF対策（認証エンドポイント）
- PII最小化（Emailのみ・ハッシュID）
