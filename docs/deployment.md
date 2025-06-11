# デプロイメント

HR-OSSのデプロイメント設定とインフラ構成について説明します。

## 🏗 インフラ構成

### 本番環境アーキテクチャ

```
Internet
    ↓
Load Balancer (ALB)
    ↓
Web Server (Nginx)
    ↓
Application Server (Node.js)
    ↓
Database (PostgreSQL RDS)
```

## 🐳 Docker設定

### docker-compose.yml

```yaml
version: '3.8'

services:
  # PostgreSQL Database
  postgres:
    image: postgres:14
    environment:
      POSTGRES_DB: hr_oss
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./database/init.sql:/docker-entrypoint-initdb.d/init.sql
    ports:
      - "5432:5432"
    networks:
      - hr-oss-network

  # Redis Cache (Optional)
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    networks:
      - hr-oss-network

  # Backend API
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    environment:
      NODE_ENV: production
      DATABASE_URL: postgresql://postgres:${DB_PASSWORD}@postgres:5432/hr_oss
      JWT_SECRET: ${JWT_SECRET}
      REDIS_URL: redis://redis:6379
    ports:
      - "3001:3001"
    depends_on:
      - postgres
      - redis
    networks:
      - hr-oss-network
    volumes:
      - ./backend/uploads:/app/uploads

  # Frontend
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    ports:
      - "3000:80"
    depends_on:
      - backend
    networks:
      - hr-oss-network

  # Nginx Proxy
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf
      - ./nginx/ssl:/etc/nginx/ssl
    depends_on:
      - frontend
      - backend
    networks:
      - hr-oss-network

volumes:
  postgres_data:
  redis_data:

networks:
  hr-oss-network:
    driver: bridge
```

### Backend Dockerfile

```dockerfile
# /backend/Dockerfile
FROM node:18-alpine AS builder

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy source code
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build application
RUN npm run build

# Production stage
FROM node:18-alpine AS production

WORKDIR /app

# Install only production dependencies
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Copy built application
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001
USER nextjs

EXPOSE 3001

CMD ["npm", "start"]
```

### Frontend Dockerfile

```dockerfile
# /frontend/Dockerfile
FROM node:18-alpine AS builder

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy source code
COPY . .

# Build application
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy built files
COPY --from=builder /app/build /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

## 🌐 Nginx設定

### nginx.conf

```nginx
upstream backend {
    server backend:3001;
}

upstream frontend {
    server frontend:80;
}

server {
    listen 80;
    server_name your-domain.com;
    
    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;
    
    # SSL Configuration
    ssl_certificate /etc/nginx/ssl/cert.pem;
    ssl_certificate_key /etc/nginx/ssl/key.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512;
    ssl_prefer_server_ciphers off;
    
    # Security Headers
    add_header X-Content-Type-Options nosniff;
    add_header X-Frame-Options DENY;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains";
    
    # API Routes
    location /api/ {
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
    
    # Frontend Routes
    location / {
        proxy_pass http://frontend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Handle React Router
        try_files $uri $uri/ /index.html;
    }
    
    # File Upload Limit
    client_max_body_size 10M;
    
    # Gzip Compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;
}
```

## ☁️ AWS デプロイ

### ECS設定

```yaml
# docker-compose-aws.yml
version: '3'
services:
  backend:
    image: your-account.dkr.ecr.region.amazonaws.com/hr-oss-backend:latest
    environment:
      DATABASE_URL: ${DATABASE_URL}
      JWT_SECRET: ${JWT_SECRET}
      REDIS_URL: ${REDIS_URL}
    logging:
      driver: awslogs
      options:
        awslogs-group: /ecs/hr-oss-backend
        awslogs-region: ap-northeast-1
        awslogs-stream-prefix: ecs

  frontend:
    image: your-account.dkr.ecr.region.amazonaws.com/hr-oss-frontend:latest
    logging:
      driver: awslogs
      options:
        awslogs-group: /ecs/hr-oss-frontend
        awslogs-region: ap-northeast-1
        awslogs-stream-prefix: ecs
```

### Terraform設定例

```hcl
# main.tf
provider "aws" {
  region = "ap-northeast-1"
}

# VPC
resource "aws_vpc" "main" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true
  
  tags = {
    Name = "hr-oss-vpc"
  }
}

# RDS Subnet Group
resource "aws_db_subnet_group" "main" {
  name       = "hr-oss-db-subnet-group"
  subnet_ids = [aws_subnet.private_1.id, aws_subnet.private_2.id]
  
  tags = {
    Name = "hr-oss-db-subnet-group"
  }
}

# RDS Instance
resource "aws_db_instance" "postgres" {
  identifier                = "hr-oss-postgres"
  engine                   = "postgres"
  engine_version          = "14.9"
  instance_class          = "db.t3.micro"
  allocated_storage       = 20
  storage_encrypted       = true
  
  db_name  = "hr_oss"
  username = "postgres"
  password = var.db_password
  
  vpc_security_group_ids = [aws_security_group.rds.id]
  db_subnet_group_name   = aws_db_subnet_group.main.name
  
  backup_retention_period = 7
  backup_window          = "03:00-04:00"
  maintenance_window     = "Sun:04:00-Sun:05:00"
  
  skip_final_snapshot = true
  deletion_protection = false
  
  tags = {
    Name = "hr-oss-postgres"
  }
}

# ALB
resource "aws_lb" "main" {
  name               = "hr-oss-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb.id]
  subnets           = [aws_subnet.public_1.id, aws_subnet.public_2.id]
  
  enable_deletion_protection = false
  
  tags = {
    Name = "hr-oss-alb"
  }
}
```

## 🚀 CI/CD パイプライン

### GitHub Actions

```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:14
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run tests
        run: npm test
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test
      
      - name: Run E2E tests
        run: npm run test:e2e

  build-and-deploy:
    needs: test
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v2
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: ap-northeast-1
      
      - name: Login to Amazon ECR
        id: login-ecr
        uses: aws-actions/amazon-ecr-login@v1
      
      - name: Build and push backend image
        env:
          ECR_REGISTRY: ${{ steps.login-ecr.outputs.registry }}
          ECR_REPOSITORY: hr-oss-backend
          IMAGE_TAG: ${{ github.sha }}
        run: |
          docker build -t $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG ./backend
          docker push $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG
      
      - name: Build and push frontend image
        env:
          ECR_REGISTRY: ${{ steps.login-ecr.outputs.registry }}
          ECR_REPOSITORY: hr-oss-frontend
          IMAGE_TAG: ${{ github.sha }}
        run: |
          docker build -t $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG ./frontend
          docker push $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG
      
      - name: Deploy to ECS
        run: |
          aws ecs update-service --cluster hr-oss-cluster --service hr-oss-backend --force-new-deployment
          aws ecs update-service --cluster hr-oss-cluster --service hr-oss-frontend --force-new-deployment
```

## 🔧 環境変数管理

### 本番環境 (.env.production)

```bash
NODE_ENV=production
PORT=3001

# Database
DATABASE_URL=postgresql://username:password@rds-endpoint:5432/hr_oss
DATABASE_SSL=true

# Authentication
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=7d

# Redis
REDIS_URL=redis://elasticache-endpoint:6379

# File Storage
AWS_REGION=ap-northeast-1
AWS_S3_BUCKET=hr-oss-uploads
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key

# Email
SMTP_HOST=smtp.amazonaws.com
SMTP_PORT=587
SMTP_USER=your-smtp-user
SMTP_PASS=your-smtp-pass

# Monitoring
SENTRY_DSN=your-sentry-dsn
NEW_RELIC_LICENSE_KEY=your-newrelic-key

# Security
CORS_ORIGIN=https://your-domain.com
RATE_LIMIT_MAX=100
```

## 📊 監視設定

### CloudWatch アラーム

```bash
# CPU使用率アラーム
aws cloudwatch put-metric-alarm \
  --alarm-name "hr-oss-high-cpu" \
  --alarm-description "HR-OSS High CPU Usage" \
  --metric-name CPUUtilization \
  --namespace AWS/ECS \
  --statistic Average \
  --period 300 \
  --threshold 80 \
  --comparison-operator GreaterThanThreshold \
  --evaluation-periods 2

# データベース接続数アラーム
aws cloudwatch put-metric-alarm \
  --alarm-name "hr-oss-db-connections" \
  --alarm-description "HR-OSS High DB Connections" \
  --metric-name DatabaseConnections \
  --namespace AWS/RDS \
  --statistic Average \
  --period 300 \
  --threshold 80 \
  --comparison-operator GreaterThanThreshold \
  --evaluation-periods 1
```

### ヘルスチェック

```typescript
// backend/src/routes/health.ts
app.get('/health', async (req, res) => {
  try {
    // Database connection check
    await prisma.$queryRaw`SELECT 1`;
    
    // Redis connection check (if enabled)
    if (redis) {
      await redis.ping();
    }
    
    res.status(200).json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.npm_package_version
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      error: error.message
    });
  }
});
```

## 🔄 デプロイコマンド

### 開発環境

```bash
# 開発環境起動
docker-compose up -d

# データベースマイグレーション
docker-compose exec backend npm run db:migrate

# シードデータ投入
docker-compose exec backend npm run db:seed
```

### 本番環境

```bash
# 本番環境ビルド
docker-compose -f docker-compose.prod.yml build

# 本番環境デプロイ
docker-compose -f docker-compose.prod.yml up -d

# ゼロダウンタイム デプロイ
docker-compose -f docker-compose.prod.yml up -d --scale backend=2
docker-compose -f docker-compose.prod.yml stop backend_old
```

## 🔒 セキュリティ設定

### SSL/TLS証明書

```bash
# Let's Encrypt証明書取得
certbot certonly --webroot -w /var/www/html -d your-domain.com

# 証明書自動更新
echo "0 12 * * * /usr/bin/certbot renew --quiet" | crontab -
```

### セキュリティグループ

```bash
# ALB用セキュリティグループ
aws ec2 create-security-group \
  --group-name hr-oss-alb-sg \
  --description "Security group for HR-OSS ALB"

# HTTP/HTTPS アクセス許可
aws ec2 authorize-security-group-ingress \
  --group-id sg-xxxxxxxx \
  --protocol tcp \
  --port 80 \
  --cidr 0.0.0.0/0

aws ec2 authorize-security-group-ingress \
  --group-id sg-xxxxxxxx \
  --protocol tcp \
  --port 443 \
  --cidr 0.0.0.0/0
```