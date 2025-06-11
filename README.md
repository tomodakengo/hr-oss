# HR-OSS - Open Source HR SaaS System

オープンソースのHR（人事）SaaSシステムです。

## 🚀 主要機能

- **従業員管理**: 従業員情報の登録・管理・検索
- **勤怠管理**: 出退勤記録・残業時間計算・有給管理
- **給与計算**: 基本給・手当の計算・給与明細生成
- **組織図管理**: 部署・役職の階層管理
- **ダッシュボード**: 各種統計情報の可視化

## 🛠 技術スタック

### フロントエンド
- React 18
- TypeScript
- Tailwind CSS
- React Router
- React Query

### バックエンド
- Node.js
- Express.js
- TypeScript
- JWT認証
- bcrypt

### データベース
- PostgreSQL
- Prisma ORM

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

## 🚀 クイックスタート

### Docker使用（推奨）

**1コマンドで起動:**
```bash
./start.sh
```

**手動起動:**
```bash
# 環境設定
cp backend/.env.example backend/.env

# Docker起動
docker-compose up -d --build
```

### ローカル開発環境

#### 前提条件
- Node.js 18+
- PostgreSQL 14+
- Docker & Docker Compose（推奨）

#### インストール手順

1. リポジトリをクローン
```bash
git clone https://github.com/your-org/hr-oss.git
cd hr-oss
```

2. 依存関係をインストール
```bash
npm install
```

3. 環境変数を設定
```bash
# backend/.env
cp backend/.env.example backend/.env
```

4. データベースをセットアップ
```bash
npm run db:generate
npm run db:push
npm run db:seed
```

5. 開発サーバーを起動
```bash
npm run dev
```

## 📚 API仕様

APIドキュメントは開発サーバー起動後、以下URLで確認できます：
- Swagger UI: http://localhost:3001/api-docs

## 🧪 テスト

```bash
# 全テストを実行
npm run test

# バックエンドのみ
npm run test:backend

# フロントエンドのみ
npm run test:frontend
```

## 🐳 Docker

```bash
# Docker Composeで起動
docker-compose up -d

# ログを確認
docker-compose logs -f
```

## 📄 ライセンス

MIT License - 詳細は [LICENSE](LICENSE) を参照

## 🤝 コントリビューション

プルリクエストやイシューの報告を歓迎します。

## 📞 サポート

- Issues: GitHub Issues
- Documentation: [docs/](docs/)