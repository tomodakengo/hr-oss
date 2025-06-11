#!/bin/bash

# Docker環境の完全リセットスクリプト

echo "🔄 Docker環境をリセットしています..."

# 既存のコンテナを停止・削除
echo "📦 既存のコンテナを停止・削除中..."
docker-compose down -v --remove-orphans

# 使用していないイメージ・ネットワーク・ボリュームを削除
echo "🗑️  未使用のリソースを削除中..."
docker system prune -f

# 特定のボリュームを削除（必要に応じて）
echo "💾 既存のボリュームを削除中..."
docker volume rm skill-manage_postgres_data 2>/dev/null || true
docker volume rm skill-manage_backend_node_modules 2>/dev/null || true
docker volume rm skill-manage_frontend_node_modules 2>/dev/null || true

# Dockerキャッシュをクリア
echo "🧹 Dockerキャッシュをクリア中..."
docker builder prune -f

echo "✅ Docker環境のリセットが完了しました"
echo "🚀 再ビルドを実行するには: docker-compose up -d --build"