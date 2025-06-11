#!/bin/bash

# Docker トラブルシューティングスクリプト

echo "🔍 Docker環境の診断を開始します..."

# システム情報
echo "📊 システム情報:"
docker --version
docker-compose --version

# Docker の状態確認
echo -e "\n🐳 Docker サービス状態:"
docker info | grep -E "Server Version|Storage Driver|Containers|Images"

# 実行中のコンテナ確認
echo -e "\n📦 実行中のコンテナ:"
docker ps -a

# ネットワーク確認
echo -e "\n🌐 Dockerネットワーク:"
docker network ls

# ボリューム確認
echo -e "\n💾 Dockerボリューム:"
docker volume ls

# イメージ確認
echo -e "\n🖼️  Dockerイメージ:"
docker images

# ディスク使用量確認
echo -e "\n💿 Docker ディスク使用量:"
docker system df

# プロセス確認
echo -e "\n⚙️  システムプロセス:"
ps aux | grep docker | head -5

# ポート使用状況確認
echo -e "\n🔌 ポート使用状況:"
netstat -tulpn | grep -E ":(3000|3001|5432|6379)" || ss -tulpn | grep -E ":(3000|3001|5432|6379)"

# メモリ使用量確認
echo -e "\n🧠 メモリ使用量:"
free -h

# ディスク容量確認
echo -e "\n💽 ディスク容量:"
df -h

echo -e "\n✅ 診断完了"
echo "🔧 問題が見つかった場合は、以下を試してください:"
echo "   - docker-compose down && docker-compose up -d --build"
echo "   - ./docker-reset.sh (完全リセット)"
echo "   - Docker Desktop の再起動"