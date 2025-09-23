# エラーハンドリング・ログ仕様

## エラー方針
- APIは一貫した形式 `{ error: { code, message } }`
- 例外は捕捉して意味のあるHTTPステータスに変換

## エラーコード例
- E_VALIDATION, E_NOT_FOUND, E_RATE_LIMIT, E_INTERNAL

## ログ
- 構造化ログ（JSON）: level, ts, traceId, path, status, latency
- PIIは記録しない
- 例外スタックはERRORで記録

## 監視/アラート
- メトリクス: RPS、p95応答、エラー率
- しきい値超過で通知（Pager/Slack）
- ログ基盤: ELK or Cloud Logging
