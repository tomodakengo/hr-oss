#!/bin/bash

# HR-OSS Docker起動スクリプト

echo "🚀 HR-OSS を起動しています..."

# 環境ファイルの確認
if [ ! -f "./backend/.env" ]; then
    echo "📝 .envファイルが見つかりません。テンプレートからコピーしています..."
    cp "./backend/.env.example" "./backend/.env"
    echo "⚠️  backend/.envファイルを編集してください"
fi

# 必要なディレクトリを作成
echo "📁 必要なディレクトリを作成中..."
mkdir -p ./backend/logs
mkdir -p ./backend/uploads
mkdir -p ./database/init

# Docker Composeでサービスを起動
echo "🐳 Dockerコンテナを起動中..."
docker-compose up -d --build

# 起動状況を確認
echo "⏳ サービス起動を待機中..."
sleep 10

echo "📊 サービス状況:"
docker-compose ps

echo ""
echo "✅ HR-OSS の起動が完了しました！"
echo ""
echo "🌐 アクセス情報:"
echo "   フロントエンド: http://localhost:3000"
echo "   バックエンド API: http://localhost:3001"
echo "   API ドキュメント: http://localhost:3001/api-docs"
echo "   PostgreSQL: localhost:5432"
echo "   Redis: localhost:6379"
echo ""
echo "📋 管理コマンド:"
echo "   ログ確認: docker-compose logs -f"
echo "   停止: docker-compose down"
echo "   再起動: docker-compose restart"
echo "   データベース接続: docker-compose exec postgres psql -U hr_user -d hr_oss"
echo ""
echo "🔧 トラブルシューティング:"
echo "   診断実行: ./docker-troubleshoot.sh"
echo "   完全リセット: ./docker-reset.sh"