# トラブルシューティング

HR-OSSでよく発生する問題と解決方法をまとめています。

## 🚀 起動・環境設定関連

### Q. `npm run dev` でエラーが発生する

**症状:**
```bash
Error: Cannot find module 'xxx'
```

**解決方法:**
```bash
# 依存関係を再インストール
rm -rf node_modules package-lock.json
npm install

# backend と frontend 両方で実行
cd backend && npm install
cd frontend && npm install
```

### Q. データベース接続エラー

**症状:**
```
Error: P1001: Can't reach database server
```

**解決方法:**
1. PostgreSQLが起動しているか確認
```bash
# PostgreSQL状態確認
sudo systemctl status postgresql
# または
docker ps | grep postgres
```

2. 環境変数を確認
```bash
# backend/.env
DATABASE_URL=postgresql://username:password@localhost:5432/hr_oss
```

3. データベースが存在するか確認
```bash
psql -h localhost -U username -l
```

### Q. Prismaエラー

**症状:**
```
Error: Prisma schema file not found
```

**解決方法:**
```bash
# Prismaクライアント再生成
cd backend
npm run db:generate

# マイグレーション実行
npm run db:push

# 完全リセット（開発環境のみ）
npm run db:reset
```

## 🔐 認証・権限関連

### Q. ログインできない

**症状:**
- 正しいメール・パスワードでもログインエラー

**解決方法:**
1. JWT_SECRETが設定されているか確認
```bash
# backend/.env
JWT_SECRET=your-secret-key
```

2. ユーザーが存在するか確認
```bash
npm run db:studio
# または
psql -d hr_oss -c "SELECT * FROM users WHERE email = 'user@example.com';"
```

3. パスワードハッシュを確認
```bash
# bcryptでパスワードが正しくハッシュ化されているか
```

### Q. 権限エラー

**症状:**
```json
{
  "error": {
    "code": "FORBIDDEN",
    "message": "アクセス権限がありません"
  }
}
```

**解決方法:**
1. ユーザーロールを確認
```sql
SELECT id, email, role, company_id FROM users WHERE email = 'user@example.com';
```

2. 会社IDが正しく設定されているか確認
3. ルート保護ミドルウェアのロール設定を確認

## 💰 給与計算関連

### Q. 給与計算結果がおかしい

**症状:**
- 残業代が正しく計算されない
- 社会保険料が間違っている

**解決方法:**
1. 勤怠データを確認
```sql
SELECT * FROM attendance 
WHERE employee_id = 'xxx' AND date BETWEEN '2023-04-01' AND '2023-04-30';
```

2. 給与計算ログを確認
```bash
# ログファイルで計算過程をチェック
tail -f logs/payroll-calculation.log
```

3. 社会保険料率を確認
```typescript
// backend/src/utils/payrollCalculation.ts
const SOCIAL_INSURANCE_RATES_2024 = {
  HEALTH_INSURANCE: { employee: 0.04985 },
  // ...
};
```

### Q. 税額計算エラー

**症状:**
- 所得税が計算されない
- 住民税額が異常

**解決方法:**
1. 税額表データを確認
2. 扶養者数設定を確認
3. 給与所得控除の計算を確認

## ⏰ 勤怠管理関連

### Q. 打刻ができない

**症状:**
- 出勤/退勤ボタンが押せない
- 位置情報エラー

**解決方法:**
1. ブラウザの位置情報許可を確認
2. システム時刻を確認
3. 重複打刻チェックロジックを確認
```sql
SELECT * FROM attendance 
WHERE employee_id = 'xxx' AND date = CURRENT_DATE;
```

### Q. 残業時間が正しく計算されない

**症状:**
- 8時間を超えても残業時間が0
- 深夜労働が認識されない

**解決方法:**
1. 勤怠計算ロジックを確認
```typescript
// backend/src/utils/timeCalculation.ts
function calculateOvertimeHours(startTime: Date, endTime: Date) {
  // ロジック確認
}
```

2. 休憩時間の設定を確認
3. 法定労働時間の設定を確認

## 🎯 パフォーマンス関連

### Q. ページ読み込みが遅い

**症状:**
- 従業員一覧の表示に時間がかかる
- ダッシュボード更新が遅い

**解決方法:**
1. データベースクエリを最適化
```sql
-- インデックス作成
CREATE INDEX IF NOT EXISTS idx_employees_company_status 
ON employees(company_id, status);

-- スロークエリの確認
EXPLAIN ANALYZE SELECT * FROM employees WHERE company_id = 'xxx';
```

2. フロントエンドの最適化
```typescript
// React.memoを使用
const EmployeeList = React.memo(({ employees }) => {
  // ...
});

// useMemoで重い計算をキャッシュ
const expensiveValue = useMemo(() => {
  return calculateComplexData(data);
}, [data]);
```

3. APIレスポンスを確認
```bash
# レスポンス時間測定
curl -w "@curl-format.txt" -o /dev/null http://localhost:3001/api/employees
```

### Q. メモリ使用量が高い

**症状:**
- Node.jsプロセスのメモリ使用量が増加し続ける
- アプリケーションが重くなる

**解決方法:**
1. メモリリークを確認
```bash
# Node.jsメモリ使用量確認
node --inspect server.js
# Chrome DevToolsでメモリプロファイル
```

2. データベース接続プールを確認
```typescript
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  // 接続プール設定
}
```

## 📱 UI/UX関連

### Q. レスポンシブデザインが崩れる

**症状:**
- モバイルでレイアウトが崩れる
- テーブルが横にはみ出る

**解決方法:**
1. Tailwind CSSのレスポンシブクラスを確認
```jsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
  {/* コンテンツ */}
</div>
```

2. ビューポート設定を確認
```html
<meta name="viewport" content="width=device-width, initial-scale=1.0">
```

### Q. フォームバリデーションエラー

**症状:**
- 入力値が正しいのにエラーが表示される
- バリデーションメッセージが日本語で表示されない

**解決方法:**
1. バリデーションスキーマを確認
```typescript
// Zodスキーマ例
const employeeSchema = z.object({
  email: z.string().email("有効なメールアドレスを入力してください"),
  firstName: z.string().min(1, "名前は必須です"),
});
```

2. フロントエンドとバックエンドのバリデーション同期を確認

## 🔄 API関連

### Q. CORS エラー

**症状:**
```
Access to fetch at 'http://localhost:3001/api/...' from origin 'http://localhost:3000' has been blocked by CORS policy
```

**解決方法:**
1. CORS設定を確認
```typescript
// backend/src/index.ts
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
```

2. 環境変数を確認
```bash
# backend/.env
FRONTEND_URL=http://localhost:3000
```

### Q. API レスポンスエラー

**症状:**
- 500 Internal Server Error
- 404 Not Found（正しいエンドポイント）

**解決方法:**
1. サーバーログを確認
```bash
# ログ確認
tail -f logs/app.log
# または
docker-compose logs backend
```

2. エラーハンドリングミドルウェアを確認
```typescript
// backend/src/middleware/errorHandler.ts
export const errorHandler = (error: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(error.stack);
  // ...
};
```

## 🐳 Docker関連

### Q. Docker起動エラー

**症状:**
```bash
docker-compose up
# Container exits with error
```

**解決方法:**
1. ログを確認
```bash
docker-compose logs backend
docker-compose logs frontend
```

2. 環境変数を確認
```bash
# .env ファイルの存在確認
ls -la backend/.env

# 環境変数の値確認
docker-compose config
```

3. ポートの競合を確認
```bash
# ポート使用状況確認
netstat -tulpn | grep :3001
```

### Q. ボリュームマウントエラー

**症状:**
- データベースデータが永続化されない
- ファイルアップロードが保存されない

**解決方法:**
1. ボリュームを確認
```bash
docker volume ls
docker volume inspect hr-oss_postgres_data
```

2. 権限を確認
```bash
# ホストディレクトリの権限確認
ls -la ./uploads/
```

## 🔍 デバッグ手順

### 基本的なデバッグフロー

1. **エラーメッセージを確認**
   - フロントエンド: ブラウザのDevTools Console
   - バックエンド: サーバーログ

2. **ネットワークタブで API 通信確認**
   - リクエスト/レスポンスの内容
   - ステータスコード
   - レスポンス時間

3. **データベースの状態確認**
   ```bash
   npm run db:studio
   ```

4. **ログレベルを上げて詳細確認**
   ```typescript
   // 開発環境でのデバッグログ
   console.log('Debug:', JSON.stringify(data, null, 2));
   ```

### 本番環境でのトラブルシューティング

1. **ヘルスチェック確認**
   ```bash
   curl http://your-domain.com/api/health
   ```

2. **システムリソース確認**
   ```bash
   top
   free -h
   df -h
   ```

3. **ログ監視**
   ```bash
   tail -f /var/log/hr-oss/app.log
   ```

## 📞 サポート

解決できない問題がある場合:

1. **GitHub Issues**: 詳細な再現手順と環境情報を含めて報告
2. **ログファイル**: エラーが発生した時刻のログを添付
3. **環境情報**: Node.js、PostgreSQL、Dockerのバージョン情報