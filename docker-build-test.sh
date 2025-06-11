#!/bin/bash

# Docker ビルドテストスクリプト

echo "🔨 Docker ビルドテストを開始します..."

# 既存のコンテナを停止
echo "🛑 既存のコンテナを停止中..."
docker-compose down

# バックエンドのビルドテスト
echo "🔧 バックエンドのビルドテスト..."
docker-compose build backend
if [ $? -eq 0 ]; then
    echo "✅ バックエンドビルド成功"
else
    echo "❌ バックエンドビルド失敗"
    exit 1
fi

# フロントエンドのビルドテスト
echo "🔧 フロントエンドのビルドテスト..."
docker-compose build frontend
if [ $? -eq 0 ]; then
    echo "✅ フロントエンドビルド成功"
else
    echo "❌ フロントエンドビルド失敗"
    exit 1
fi

# 全体のビルドテスト
echo "🔧 全体のビルドテスト..."
docker-compose build
if [ $? -eq 0 ]; then
    echo "✅ 全体ビルド成功"
else
    echo "❌ 全体ビルド失敗"
    exit 1
fi

echo "🎉 すべてのビルドテストが完了しました！"