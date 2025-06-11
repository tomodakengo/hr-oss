# 管理者ガイド

HR-OSSの管理者向け操作ガイドです。システム管理、マスタデータ管理、運用手順について説明します。

## 🔧 システム管理

### 初期セットアップ

#### 1. 会社情報設定

**基本情報**
```
設定 → 会社情報
```
- 会社名
- 住所・連絡先
- 法人番号
- 設立年月日

**労働時間設定**
```
設定 → 労働時間ルール
```
- 標準労働時間: 8時間/日、40時間/週
- 休憩時間: 60分（8時間超勤務時）
- コアタイム設定（フレックス制の場合）
- 残業申請の要否

#### 2. 管理者アカウント設定

**初期管理者作成**
```sql
-- データベース直接操作（初回のみ）
INSERT INTO users (email, password, role, company_id) 
VALUES ('admin@company.com', 'hashed_password', 'ADMIN', 'company_id');
```

**権限移譲**
```
ユーザー管理 → 既存ユーザー → 権限変更
```

### ユーザー管理

#### ユーザー作成

1. **HR担当者アカウント**
```
ユーザー管理 → 新規作成
- メールアドレス: hr@company.com
- 権限: HR_STAFF
- 従業員紐付け: 必要に応じて
```

2. **マネージャーアカウント**
```
ユーザー管理 → 新規作成
- メールアドレス: manager@company.com
- 権限: MANAGER
- 従業員紐付け: 必須
```

3. **一般従業員アカウント**
```
従業員管理 → 従業員詳細 → アカウント作成
- 自動でEMPLOYEE権限を付与
- 初期パスワードはメール送信
```

#### 一括ユーザー作成

**CSVインポート**
```csv
email,firstName,lastName,department,position,hireDate,baseSalary
taro@company.com,太郎,田中,営業部,主任,2023-04-01,300000
hanako@company.com,花子,佐藤,経理部,係長,2023-04-01,350000
```

**インポート手順**
1. `ユーザー管理 → CSV一括インポート`
2. テンプレートをダウンロード
3. データを入力してアップロード
4. プレビューで内容確認
5. 「実行」でユーザー作成

### パスワードポリシー

#### 設定項目
```
設定 → セキュリティ → パスワードポリシー
```
- 最小文字数: 8文字以上
- 文字種要求: 英数字 + 特殊文字
- 有効期限: 90日
- 履歴保持: 過去5回分
- ロックアウト: 5回失敗で30分ロック

#### パスワードリセット

**管理者による強制リセット**
```
ユーザー管理 → 対象ユーザー → パスワードリセット
```
- 仮パスワードを自動生成
- ユーザーにメール通知
- 初回ログイン時に変更強制

## 🏢 マスタデータ管理

### 組織マスタ

#### 部署管理

**部署階層の設定**
```
組織管理 → 部署管理
```

```
例: 階層構造
会社
├── 営業本部
│   ├── 営業1部
│   ├── 営業2部
│   └── 海外営業部
├── 管理本部
│   ├── 人事部
│   ├── 経理部
│   └── 総務部
└── 技術本部
    ├── 開発部
    └── 品質管理部
```

**部署責任者設定**
- 各部署に管理者を割り当て
- 勤怠承認権限を自動付与
- 部署レポートの閲覧権限を付与

#### 役職管理

**役職レベル設定**
```
組織管理 → 役職管理
```

| 役職名 | レベル | 基本給範囲 | 権限 |
|--------|--------|------------|------|
| 取締役 | 10 | 800,000~ | 全部署管理 |
| 部長 | 8 | 600,000~ | 部署管理 |
| 課長 | 6 | 450,000~ | 課管理 |
| 係長 | 4 | 350,000~ | 係管理 |
| 主任 | 3 | 300,000~ | - |
| 一般 | 1 | 200,000~ | - |

### 給与マスタ

#### 給与テンプレート設定

**役職別テンプレート**
```
設定 → 給与テンプレート → 新規作成
```

**主任テンプレート例**
```json
{
  "baseSalary": 300000,
  "allowances": {
    "position": 30000,
    "commute": 15000,
    "family": 10000
  },
  "overtimeRate": {
    "weekday": 1.25,
    "holiday": 1.35,
    "nighttime": 1.25
  }
}
```

#### 社会保険料率設定

**年度更新作業**
```
設定 → 社会保険料率 → 2024年度設定
```

```typescript
const RATES_2024 = {
  healthInsurance: {
    tokyo: 0.0997,  // 協会けんぽ東京都
    osaka: 0.1018   // 協会けんぽ大阪府
  },
  pensionInsurance: 0.182,
  employmentInsurance: 0.0155,
  longCareInsurance: 0.0164  // 40歳以上
};
```

### 勤怠マスタ

#### 勤務パターン設定

**標準勤務**
```
設定 → 勤務パターン → 標準勤務
- 開始時刻: 09:00
- 終了時刻: 18:00
- 休憩時間: 12:00-13:00 (60分)
- 週休: 土日
```

**フレックス制**
```
設定 → 勤務パターン → フレックス
- コアタイム: 10:00-15:00
- 標準労働時間: 8時間
- 出社時間帯: 07:00-10:00
- 退社時間帯: 15:00-22:00
```

#### 休日設定

**祝日マスタ**
```
設定 → 休日設定 → 2024年祝日
```
- 国民の祝日を自動取得
- 会社独自の休日を追加
- 振替休日の自動計算

**有給付与ルール**
```
設定 → 有給設定
- 入社6ヶ月後: 10日付与
- 継続勤務1年6ヶ月: 11日付与
- 以降毎年1日ずつ増加（上限20日）
- 時効: 2年
```

## 📊 運用管理

### 月次処理

#### 勤怠締め処理

**月末締め手順**
1. 未提出勤怠の催促
```
勤怠管理 → 月次処理 → 未提出一覧
- 自動メール送信
- 個別催促メッセージ
```

2. 勤怠データの承認状況確認
```
勤怠管理 → 承認状況一覧
- 部署別承認率の確認
- 未承認データの督促
```

3. 勤怠締め実行
```
勤怠管理 → 月次処理 → 締め処理実行
- 対象月: 2024年4月
- 締め日: 2024年4月30日
- 実行後は修正不可（管理者除く）
```

#### 給与計算処理

**給与計算実行**
```
給与管理 → 月次給与計算
1. 対象期間選択: 2024年4月
2. 計算対象選択: 全従業員 / 部署別 / 個別選択
3. 「一括計算」実行
4. 計算結果確認・修正
5. 「承認」で確定
```

**計算エラー対応**
```
給与管理 → エラー一覧
- 勤怠データ不足
- マスタ設定不備
- 計算ルール例外
```

### データメンテナンス

#### バックアップ管理

**日次バックアップ**
```bash
# 自動バックアップスクリプト
#!/bin/bash
DATE=$(date +%Y%m%d)
pg_dump hr_oss > /backup/hr_oss_$DATE.sql
aws s3 cp /backup/hr_oss_$DATE.sql s3://hr-oss-backup/
```

**リストア手順**
```bash
# 緊急時のリストア
psql hr_oss < /backup/hr_oss_20240415.sql
```

#### データ保持期間

**データ削除ポリシー**
```
設定 → データ保持期間
- 勤怠データ: 7年間保存
- 給与データ: 7年間保存
- ログデータ: 1年間保存
- 一時ファイル: 30日で削除
```

### セキュリティ管理

#### アクセスログ監視

**不正アクセス検知**
```
システム監視 → アクセスログ
- 短時間での大量アクセス
- 通常と異なる時間帯のアクセス
- 複数IPからの同一アカウントアクセス
- ログイン失敗の連続
```

**アラート設定**
```
設定 → セキュリティアラート
- 5回連続ログイン失敗 → メール通知
- 深夜時間帯のアクセス → Slack通知
- 管理者権限での操作 → ログ記録
```

#### 個人情報保護

**アクセス制御**
```
設定 → データアクセス制御
- 個人情報の閲覧権限設定
- データ出力の承認フロー
- 操作ログの詳細記録
```

**データマスキング**
```typescript
// 開発環境でのデータマスキング
const maskedData = {
  firstName: employee.firstName.substring(0, 1) + "**",
  email: email.split('@')[0].substring(0, 3) + "***@" + email.split('@')[1],
  phone: phone.substring(0, 3) + "-****-****"
};
```

## 🔧 システム設定

### 環境設定

#### 本番環境設定

**環境変数管理**
```bash
# /etc/environment
NODE_ENV=production
DATABASE_URL=postgresql://user:pass@rds-endpoint:5432/hr_oss
JWT_SECRET=super-secure-secret-key
REDIS_URL=redis://elasticache-endpoint:6379
```

**ログレベル設定**
```typescript
// config/logger.ts
const logLevel = {
  development: 'debug',
  staging: 'info',
  production: 'warn'
}[process.env.NODE_ENV];
```

#### メール設定

**SMTP設定**
```
設定 → メール設定
- SMTP サーバー: smtp.company.com
- ポート: 587 (STARTTLS)
- 認証: SMTP AUTH
- 送信者: noreply@company.com
```

**メールテンプレート**
```html
<!-- 新規ユーザー登録通知 -->
<h2>HR-OSSアカウント作成のお知らせ</h2>
<p>{{firstName}} {{lastName}} 様</p>
<p>以下の情報でログインしてください：</p>
<ul>
  <li>URL: {{loginUrl}}</li>
  <li>メールアドレス: {{email}}</li>
  <li>初期パスワード: {{temporaryPassword}}</li>
</ul>
```

### パフォーマンス設定

#### データベース最適化

**インデックス管理**
```sql
-- 定期的なインデックス再構築
REINDEX INDEX idx_attendance_employee_date;
REINDEX INDEX idx_employees_company_id;

-- 統計情報更新
ANALYZE attendance;
ANALYZE employees;
```

**接続プール設定**
```typescript
// prisma/schema.prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  // 接続プール: 10-20接続
}
```

#### キャッシュ設定

**Redis キャッシュ**
```typescript
// キャッシュ戦略
const cacheStrategy = {
  userSessions: 86400,    // 24時間
  employeeData: 3600,     // 1時間
  departmentList: 86400,  // 24時間
  payrollCache: 1800      // 30分
};
```

## 📈 監視・レポート

### システム監視

#### パフォーマンス監視

**CPU・メモリ使用率**
```bash
# システムリソース監視
top -p $(pgrep node)
free -h
df -h
```

**データベース監視**
```sql
-- 実行中クエリ確認
SELECT query, state, query_start 
FROM pg_stat_activity 
WHERE state != 'idle';

-- データベースサイズ確認
SELECT pg_size_pretty(pg_database_size('hr_oss'));
```

#### エラー監視

**アプリケーションエラー**
```bash
# エラーログ監視
tail -f /var/log/hr-oss/error.log | grep ERROR

# 特定エラーの集計
grep "500 Internal Server Error" /var/log/nginx/access.log | wc -l
```

### 運用レポート

#### 月次運用レポート

**利用統計**
```sql
-- 月間ログイン数
SELECT COUNT(*) as login_count 
FROM access_logs 
WHERE action = 'login' 
AND created_at >= '2024-04-01' 
AND created_at < '2024-05-01';

-- 機能別利用状況
SELECT feature, COUNT(*) as usage_count
FROM access_logs 
WHERE created_at >= '2024-04-01'
GROUP BY feature 
ORDER BY usage_count DESC;
```

**エラー統計**
```sql
-- エラー発生状況
SELECT error_type, COUNT(*) as error_count
FROM error_logs 
WHERE created_at >= '2024-04-01'
GROUP BY error_type 
ORDER BY error_count DESC;
```

#### 業務レポート

**勤怠集計レポート**
- 部署別出勤率
- 平均残業時間
- 有給取得率
- 長時間労働者リスト

**給与集計レポート**
- 部署別平均給与
- 昇給実施状況
- 社会保険料負担額
- 源泉徴収税額

## 🚨 障害対応

### 障害発生時の対応手順

#### 初期対応

1. **障害切り分け**
```bash
# システム状態確認
systemctl status hr-oss-backend
systemctl status hr-oss-frontend
systemctl status postgresql
systemctl status nginx
```

2. **ログ確認**
```bash
# アプリケーションログ
tail -100 /var/log/hr-oss/app.log

# エラーログ
tail -100 /var/log/hr-oss/error.log

# システムログ
journalctl -u hr-oss-backend --since "1 hour ago"
```

3. **緊急連絡**
- 利用者への障害告知
- 経営陣への報告
- システム開発ベンダーへの連絡

#### 復旧作業

**データベース障害**
```bash
# データベース復旧
systemctl restart postgresql

# 最新バックアップからのリストア
psql hr_oss < /backup/latest/hr_oss.sql
```

**アプリケーション障害**
```bash
# アプリケーション再起動
systemctl restart hr-oss-backend
systemctl restart hr-oss-frontend

# 設定ファイル確認
nginx -t
```

### 災害対策

#### バックアップ戦略

**3-2-1 ルール**
- 3つのコピー（本体+バックアップ2つ）
- 2つの異なるメディア（HDD+クラウド）
- 1つのオフサイト保管（AWS S3）

**復旧手順書**
1. 代替サーバーの立ち上げ
2. 最新バックアップの復元
3. SSL証明書の設定
4. DNS切り替え
5. 動作確認・利用者通知

## 📚 トレーニング

### 新任管理者向け

**初期トレーニング内容**
1. HR-OSSの概要と機能
2. 管理者権限と責任
3. 基本操作（ユーザー管理、組織管理）
4. 月次処理手順
5. 障害対応の基本

**継続教育**
- 四半期ごとのシステム更新説明
- セキュリティ意識向上研修
- 個人情報保護法の改正対応

### ヘルプデスク対応

**よくある問合せ対応**
1. パスワードリセット依頼
2. 権限変更要求
3. データ出力依頼
4. 操作方法の問合せ
5. システム障害報告

**エスカレーション基準**
- レベル1: 基本操作・設定変更
- レベル2: データ修正・権限問題
- レベル3: システム障害・開発要求