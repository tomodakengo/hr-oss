# 開発環境セットアップ

HR-OSSの開発環境構築とコマンド一覧。

## 🛠 前提条件

- Node.js 18+
- PostgreSQL 14+
- npm または yarn

## 📁 プロジェクト構造

```
hr-oss/
├── frontend/          # React フロントエンド
├── backend/           # Node.js バックエンド
├── database/          # データベース関連ファイル
├── docs/              # ドキュメント
├── docker-compose.yml # Docker構成
└── README.md
```

## 🚀 セットアップ手順

### クイックスタート（Docker使用）

**推奨: 1コマンドで起動**
```bash
./start.sh
```

**手動でDocker起動**
```bash
# 環境変数設定
cp backend/.env.example backend/.env

# Docker起動
docker-compose up -d --build
```

### ローカル開発環境

### 1. リポジトリクローン
```bash
git clone https://github.com/your-org/hr-oss.git
cd hr-oss
```

### 2. 依存関係インストール
```bash
npm install
```

### 3. 環境変数設定
```bash
# backend/.env
cp backend/.env.example backend/.env
# 必要に応じて設定値を編集
```

### 4. データベースセットアップ
```bash
npm run db:generate
npm run db:push
npm run db:seed
```

### 5. 開発サーバー起動
```bash
npm run dev
```

## 📜 コマンド一覧

### ルートレベル
```bash
npm run dev         # フロントエンド・バックエンド両方を同時起動
npm install         # 両方のサービスの依存関係をインストール
```

### バックエンド (`/backend`)
```bash
npm run dev          # 開発サーバー（ホットリロード）
npm run build        # TypeScript → dist/ コンパイル
npm run start        # 本番サーバー起動
npm run test         # Jest テスト実行
npm run test:watch   # テストのwatch mode
npm run lint         # ESLint チェック
npm run lint:fix     # ESLint 自動修正

# データベース操作
npm run db:generate  # Prisma クライアント型生成
npm run db:push      # スキーマ変更をデータベースに反映
npm run db:migrate   # マイグレーション作成・実行
npm run db:seed      # サンプルデータ投入
npm run db:studio    # Prisma Studio 起動
```

### フロントエンド (`/frontend`)
```bash
npm start           # React 開発サーバー
npm run build       # 本番ビルド
npm test            # React テスト実行
```

## 🔧 環境変数

### バックエンド (backend/.env)
```bash
DATABASE_URL=postgresql://username:password@localhost:5432/hr_oss
JWT_SECRET=your-secret-key
NODE_ENV=development
PORT=3001
FRONTEND_URL=http://localhost:3000
```

## 🐳 Docker開発環境

### 基本コマンド
```bash
# 1コマンド起動（推奨）
./start.sh

# 手動起動
docker-compose up -d --build

# ログ確認
docker-compose logs -f

# 停止
docker-compose down

# 再起動
docker-compose restart
```

### トラブルシューティング
```bash
# 診断実行
./docker-troubleshoot.sh

# 完全リセット（データ削除）
./docker-reset.sh

# 特定サービスの再ビルド
docker-compose up -d --build backend
docker-compose up -d --build frontend
```

### データベース操作
```bash
# PostgreSQL接続
docker-compose exec postgres psql -U hr_user -d hr_oss

# データベース初期化
docker-compose exec backend npm run db:push
docker-compose exec backend npm run db:seed

# Prisma Studio（GUI）
docker-compose exec backend npm run db:studio
```

## 🧪 テスト実行

```bash
# 全テスト実行
npm run test

# バックエンドのみ
npm run test:backend

# フロントエンドのみ
npm run test:frontend

# カバレッジ付きテスト
npm run test:coverage
```

## 📊 開発ツール

### API ドキュメント
- Swagger UI: http://localhost:3001/api-docs

### データベース管理
- Prisma Studio: `npm run db:studio`
- 直接接続: `psql -h localhost -d hr_oss -U username`

### デバッグ
- VS Code用のlaunch.json設定済み
- Chrome DevTools でのフロントエンドデバッグ

## 🔍 よく使うコマンド

```bash
# 新しいマイグレーション作成
npm run db:migrate -- --name add_new_field

# 特定のテストファイル実行
npm run test -- --testPathPattern=auth

# 依存関係の更新確認
npm outdated

# ビルドサイズ分析
npm run build && npm run analyze
```