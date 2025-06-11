# システムアーキテクチャ

HR-OSSのシステム設計と技術選択について説明します。

## 🏗 全体アーキテクチャ

HR-OSSは、日本のHR業務に特化した包括的なSaaSシステムです。

### 技術スタック

#### フロントエンド
- **React 18** - UIライブラリ
- **TypeScript** - 型安全性
- **Tailwind CSS** - スタイリング
- **React Router** - ルーティング
- **React Query** - サーバー状態管理

#### バックエンド
- **Node.js** - ランタイム
- **Express.js** - Webフレームワーク
- **TypeScript** - 型安全性
- **Prisma ORM** - データベースORM
- **JWT** - 認証

#### データベース
- **PostgreSQL** - メインデータベース
- **Redis** - セッション・キャッシュ（オプション）

## 🏢 モノレポ構造

```
hr-oss/
├── backend/           # Node.js APIサーバー
│   ├── src/
│   │   ├── controllers/    # ルートハンドラー
│   │   ├── middleware/     # Express ミドルウェア
│   │   ├── models/         # データモデル
│   │   ├── routes/         # API ルート定義
│   │   ├── services/       # ビジネスロジック
│   │   ├── utils/          # ユーティリティ関数
│   │   └── types/          # 型定義
│   ├── prisma/
│   │   └── schema.prisma   # データベーススキーマ
│   └── package.json
├── frontend/          # React アプリケーション
│   ├── src/
│   │   ├── components/     # UIコンポーネント
│   │   ├── contexts/       # React Context
│   │   ├── hooks/          # カスタムフック
│   │   ├── services/       # API通信
│   │   └── types/          # 型定義
│   └── package.json
└── shared/            # 共通型定義・ユーティリティ
```

## 🎯 主要アーキテクチャパターン

### 1. マルチテナントアーキテクチャ

全データは`companyId`でスコープされ、完全なテナント分離を実現：

```typescript
// 全てのクエリで会社フィルタリングが必須
const employees = await prisma.employee.findMany({
  where: { 
    companyId: user.companyId,  // 必須
    // ... other filters
  }
});
```

### 2. ロールベースアクセス制御（RBAC）

4つのユーザーロールによる階層的権限制御：

```
ADMIN (最高権限)
├── HR_STAFF (人事担当者)
├── MANAGER (管理者)
└── EMPLOYEE (一般従業員)
```

### 3. 日本労働法準拠

勤怠・給与計算は日本の労働基準法に完全準拠：

```typescript
// 残業計算例
const overtimeRates = {
  standard: 1.25,    // 25%割増（月60時間まで）
  excessive: 1.50,   // 50%割増（月60時間超）
  holiday: 1.35,     // 35%割増（休日労働）
  nighttime: 1.25    // 25%割増（深夜労働）
};
```

### 4. リアルタイムダッシュボード

5分間隔での自動更新とアラートシステム：

```typescript
// ダッシュボードの自動更新
useEffect(() => {
  const interval = setInterval(() => {
    refetch(); // React Query
  }, 5 * 60 * 1000); // 5分
  
  return () => clearInterval(interval);
}, []);
```

## 🗄 データ層設計

### データモデル関係

```
Company (会社)
├── Department (部署)
│   └── Employee (従業員)
│       ├── Attendance (勤怠記録)
│       ├── Payroll (給与)
│       └── LeaveBalance (有給残高)
├── Position (役職)
└── SalaryTemplate (給与テンプレート)
```

### 主要エンティティ

#### Employee（従業員）
- 個人情報・雇用情報・緊急連絡先
- 部署・役職への参照
- マルチテナント対応（companyId）

#### Attendance（勤怠）
- 出退勤時刻・休憩時間
- 自動残業計算
- 承認ワークフロー

#### Payroll（給与）
- 基本給・各種手当・控除
- 社会保険料・所得税計算
- 承認ステータス管理

## 🔐 セキュリティアーキテクチャ

### 認証・認可フロー

```
1. ログイン → JWT発行
2. リクエスト → JWT検証
3. ロール確認 → アクセス許可
4. 会社スコープ → データフィルタリング
```

### データ保護

- パスワード: bcrypt ハッシュ化
- 個人情報: AES暗号化（予定）
- 通信: HTTPS強制
- CSRF: トークンベース保護

## 🚀 パフォーマンス最適化

### データベース最適化

```sql
-- よく使われるクエリのインデックス
CREATE INDEX idx_employee_company_id ON employees(company_id);
CREATE INDEX idx_attendance_employee_date ON attendance(employee_id, date);
CREATE INDEX idx_payroll_period ON payroll(company_id, pay_period);
```

### フロントエンド最適化

- **React.memo**: 高負荷コンポーネント
- **useMemo/useCallback**: 計算量の多い処理
- **React Query**: サーバー状態キャッシュ
- **Code Splitting**: ルート単位での遅延読み込み

## 📊 監視・ロギング

### アプリケーション監視

```typescript
// 構造化ログ
logger.info('Payroll calculation completed', {
  companyId,
  employeeCount,
  processingTime,
  timestamp: new Date().toISOString()
});
```

### メトリクス

- レスポンス時間
- エラー率
- データベース接続数
- メモリ使用量

## 🔄 開発ワークフロー

### Git フロー

```
main (本番)
├── develop (開発)
├── feature/* (機能開発)
├── hotfix/* (緊急修正)
└── release/* (リリース準備)
```

### CI/CD パイプライン

```yaml
# GitHub Actions
1. テスト実行
2. ビルド
3. セキュリティスキャン
4. デプロイ（ステージング）
5. E2Eテスト
6. デプロイ（本番）
```

## 📱 APIアーキテクチャ

### RESTful設計

```
GET    /api/employees       # 従業員一覧
POST   /api/employees       # 従業員作成
GET    /api/employees/:id   # 従業員詳細
PUT    /api/employees/:id   # 従業員更新
DELETE /api/employees/:id   # 従業員削除
```

### エラーハンドリング

```typescript
// 統一エラーレスポンス
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "入力データに問題があります",
    "details": [
      { "field": "email", "message": "有効なメールアドレスを入力してください" }
    ]
  }
}
```

## 🌐 国際化対応

現在は日本語のみ対応、将来的には多言語対応予定：

```typescript
// i18n 構造（将来）
{
  "ja": { "employee.name": "従業員名" },
  "en": { "employee.name": "Employee Name" }
}
```