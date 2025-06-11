# セキュリティガイド

HR-OSSのセキュリティ設定と最適化について説明します。

## 🔐 認証・認可

### JWT認証

#### JWT設定

```typescript
// backend/src/utils/jwt.ts
const JWT_CONFIG = {
  secret: process.env.JWT_SECRET,
  algorithm: 'HS256',
  expiresIn: '7d',
  issuer: 'hr-oss',
  audience: 'hr-oss-users'
};

export function generateToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_CONFIG.secret, {
    algorithm: JWT_CONFIG.algorithm,
    expiresIn: JWT_CONFIG.expiresIn,
    issuer: JWT_CONFIG.issuer,
    audience: JWT_CONFIG.audience
  });
}
```

#### トークン検証

```typescript
// backend/src/middleware/auth.ts
export const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    
    req.user = decoded as JWTPayload;
    next();
  });
};
```

### ロールベースアクセス制御

#### 権限階層

```typescript
enum UserRole {
  ADMIN = 'ADMIN',           // 最高権限
  HR_STAFF = 'HR_STAFF',     // 人事担当者
  MANAGER = 'MANAGER',       // 管理者
  EMPLOYEE = 'EMPLOYEE'      // 一般従業員
}

const ROLE_HIERARCHY = {
  ADMIN: 4,
  HR_STAFF: 3,
  MANAGER: 2,
  EMPLOYEE: 1
};
```

#### 権限チェック

```typescript
export const requireRole = (requiredRole: UserRole) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const userRole = req.user?.role;
    
    if (!userRole || ROLE_HIERARCHY[userRole] < ROLE_HIERARCHY[requiredRole]) {
      return res.status(403).json({ 
        error: 'Insufficient permissions',
        required: requiredRole,
        current: userRole 
      });
    }
    
    next();
  };
};
```

### パスワードセキュリティ

#### パスワードハッシュ化

```typescript
// backend/src/utils/password.ts
import bcrypt from 'bcrypt';

const SALT_ROUNDS = 12;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}
```

#### パスワードポリシー

```typescript
export const PASSWORD_POLICY = {
  minLength: 8,
  maxLength: 128,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: true,
  preventCommonPasswords: true,
  preventPasswordReuse: 5, // 過去5回分のパスワード履歴をチェック
  maxAge: 90 * 24 * 60 * 60 * 1000, // 90日でパスワード期限切れ
};

export function validatePassword(password: string): ValidationResult {
  const errors: string[] = [];
  
  if (password.length < PASSWORD_POLICY.minLength) {
    errors.push(`パスワードは${PASSWORD_POLICY.minLength}文字以上である必要があります`);
  }
  
  if (PASSWORD_POLICY.requireUppercase && !/[A-Z]/.test(password)) {
    errors.push('大文字を含む必要があります');
  }
  
  if (PASSWORD_POLICY.requireLowercase && !/[a-z]/.test(password)) {
    errors.push('小文字を含む必要があります');
  }
  
  if (PASSWORD_POLICY.requireNumbers && !/\d/.test(password)) {
    errors.push('数字を含む必要があります');
  }
  
  if (PASSWORD_POLICY.requireSpecialChars && !/[!@#$%^&*(),.?\":{}|<>]/.test(password)) {
    errors.push('特殊文字を含む必要があります');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}
```

## 🔒 データ保護

### データ暗号化

#### データベース暗号化

```typescript
// 機密データの暗号化
import crypto from 'crypto';

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY; // 32文字のキー
const ALGORITHM = 'aes-256-gcm';

export function encrypt(text: string): EncryptedData {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipher(ALGORITHM, ENCRYPTION_KEY);
  cipher.setAAD(Buffer.from('HR-OSS', 'utf8'));
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag();
  
  return {
    encrypted,
    iv: iv.toString('hex'),
    authTag: authTag.toString('hex')
  };
}

export function decrypt(encryptedData: EncryptedData): string {
  const decipher = crypto.createDecipher(ALGORITHM, ENCRYPTION_KEY);
  decipher.setAAD(Buffer.from('HR-OSS', 'utf8'));
  decipher.setAuthTag(Buffer.from(encryptedData.authTag, 'hex'));
  
  let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}
```

#### 個人情報の暗号化

```typescript
// Prismaモデルでの暗号化
model Employee {
  id              String @id @default(cuid())
  // 暗号化対象フィールド
  personalNumber  String @map("personal_number") // マイナンバー（暗号化必須）
  bankAccount     String @map("bank_account")    // 銀行口座（暗号化推奨）
  
  @@map("employees")
}

// 暗号化ミドルウェア
prisma.$use(async (params, next) => {
  // 個人情報を暗号化
  if (params.model === 'Employee' && params.action === 'create') {
    if (params.args.data.personalNumber) {
      params.args.data.personalNumber = encrypt(params.args.data.personalNumber).encrypted;
    }
  }
  
  const result = await next(params);
  
  // 復号化
  if (params.model === 'Employee' && result?.personalNumber) {
    result.personalNumber = decrypt({ encrypted: result.personalNumber });
  }
  
  return result;
});
```

### データマスキング

#### 開発環境でのデータマスキング

```typescript
// 開発環境用データマスキング
export function maskSensitiveData(data: any): any {
  if (process.env.NODE_ENV === 'production') {
    return data; // 本番環境では何もしない
  }
  
  return {
    ...data,
    firstName: data.firstName?.substring(0, 1) + '**',
    lastName: data.lastName?.substring(0, 1) + '**',
    email: maskEmail(data.email),
    phone: maskPhone(data.phone),
    personalNumber: '****-****-****',
    bankAccount: '***-*******',
  };
}

function maskEmail(email: string): string {
  if (!email) return email;
  const [localPart, domain] = email.split('@');
  const maskedLocal = localPart.substring(0, 2) + '***';
  return `${maskedLocal}@${domain}`;
}

function maskPhone(phone: string): string {
  if (!phone) return phone;
  return phone.replace(/(\d{3})-(\d{4})-(\d{4})/, '$1-****-$3');
}
```

## 🛡️ セキュリティヘッダー

### HTTP セキュリティヘッダー

```typescript
// backend/src/middleware/security.ts
import helmet from 'helmet';

export const securityMiddleware = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:"],
      scriptSrc: ["'self'"],
      connectSrc: ["'self'", process.env.FRONTEND_URL],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: [],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  },
  referrerPolicy: { policy: "strict-origin-when-cross-origin" }
});
```

### CORS 設定

```typescript
// CORS 設定
import cors from 'cors';

const corsOptions = {
  origin: function (origin: string, callback: Function) {
    const allowedOrigins = [
      process.env.FRONTEND_URL,
      'https://hr-oss.example.com',
      'https://admin.hr-oss.example.com'
    ];
    
    // 開発環境では localhost を許可
    if (process.env.NODE_ENV === 'development') {
      allowedOrigins.push('http://localhost:3000');
    }
    
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('CORS policy violation'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

app.use(cors(corsOptions));
```

## 🚫 入力値検証

### バリデーション

#### スキーマベースバリデーション

```typescript
// backend/src/validators/employee.ts
import { z } from 'zod';

export const createEmployeeSchema = z.object({
  firstName: z.string()
    .min(1, '名前は必須です')
    .max(50, '名前は50文字以内で入力してください')
    .regex(/^[ぁ-んァ-ヶ一-龠々]+$/, '名前は日本語で入力してください'),
    
  lastName: z.string()
    .min(1, '姓は必須です')
    .max(50, '姓は50文字以内で入力してください')
    .regex(/^[ぁ-んァ-ヶ一-龠々]+$/, '姓は日本語で入力してください'),
    
  email: z.string()
    .email('有効なメールアドレスを入力してください')
    .max(255, 'メールアドレスは255文字以内で入力してください'),
    
  phone: z.string()
    .regex(/^0\d{1,4}-\d{1,4}-\d{4}$/, '正しい電話番号形式で入力してください')
    .optional(),
    
  baseSalary: z.number()
    .positive('基本給は正の数で入力してください')
    .max(10000000, '基本給は1000万円以下で入力してください'),
    
  hireDate: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, '日付はYYYY-MM-DD形式で入力してください')
    .refine(date => new Date(date) <= new Date(), '入社日は今日以前の日付を入力してください')
});
```

#### SQL インジェクション対策

```typescript
// Prismaを使用することで自動的にSQL インジェクション対策
// 生のクエリを使用する場合は必ずパラメータ化クエリを使用

// ✅ 安全（Prisma）
const employee = await prisma.employee.findMany({
  where: {
    email: userInput // 自動的にエスケープ
  }
});

// ✅ 安全（パラメータ化クエリ）
const result = await prisma.$queryRaw`
  SELECT * FROM employees 
  WHERE email = ${userInput}
`;

// ❌ 危険（文字列結合）
const result = await prisma.$queryRawUnsafe(`
  SELECT * FROM employees 
  WHERE email = '${userInput}'
`);
```

### XSS 対策

#### 出力エスケープ

```typescript
// フロントエンドでのXSS対策
import DOMPurify from 'dompurify';

// HTMLコンテンツのサニタイズ
export function sanitizeHTML(dirty: string): string {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'br'],
    ALLOWED_ATTR: []
  });
}

// React コンポーネントでの使用例
const SafeContent: React.FC<{ content: string }> = ({ content }) => {
  const sanitizedContent = sanitizeHTML(content);
  return <div dangerouslySetInnerHTML={{ __html: sanitizedContent }} />;
};
```

#### CSP (Content Security Policy)

```typescript
// 厳格なCSP設定
const cspDirectives = {
  defaultSrc: ["'self'"],
  scriptSrc: [
    "'self'",
    // 信頼できるCDNのみ許可
    "https://cdn.jsdelivr.net",
    // ハッシュベースでインラインスクリプトを許可
    "'sha256-xyz123...'"
  ],
  styleSrc: [
    "'self'",
    "'unsafe-inline'", // Tailwind CSSのため
    "https://fonts.googleapis.com"
  ],
  imgSrc: [
    "'self'",
    "data:",
    "https://secure.gravatar.com" // アバター画像
  ],
  connectSrc: [
    "'self'",
    "https://api.hr-oss.example.com"
  ],
  fontSrc: [
    "'self'",
    "https://fonts.gstatic.com"
  ],
  mediaSrc: ["'none'"],
  objectSrc: ["'none'"],
  frameSrc: ["'none'"],
  upgradeInsecureRequests: []
};
```

## 🔍 監査ログ

### アクセスログ

```typescript
// backend/src/middleware/auditLog.ts
interface AuditLogEntry {
  userId: string;
  action: string;
  resource: string;
  resourceId?: string;
  ipAddress: string;
  userAgent: string;
  timestamp: Date;
  details?: any;
}

export const auditLogger = (action: string, resource: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const originalSend = res.send;
    
    res.send = function(data) {
      // レスポンス送信時にログを記録
      const logEntry: AuditLogEntry = {
        userId: req.user?.id || 'anonymous',
        action,
        resource,
        resourceId: req.params.id,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent') || '',
        timestamp: new Date(),
        details: {
          method: req.method,
          url: req.originalUrl,
          statusCode: res.statusCode,
          requestBody: sanitizeLogData(req.body)
        }
      };
      
      // 非同期でログを保存
      saveAuditLog(logEntry).catch(console.error);
      
      return originalSend.call(this, data);
    };
    
    next();
  };
};

// 機密情報をログから除外
function sanitizeLogData(data: any): any {
  const sensitiveFields = ['password', 'token', 'personalNumber', 'bankAccount'];
  
  if (typeof data === 'object' && data !== null) {
    const sanitized = { ...data };
    
    for (const field of sensitiveFields) {
      if (field in sanitized) {
        sanitized[field] = '[REDACTED]';
      }
    }
    
    return sanitized;
  }
  
  return data;
}
```

### データ変更ログ

```typescript
// Prismaミドルウェアでデータ変更を記録
prisma.$use(async (params, next) => {
  const start = Date.now();
  
  // 変更前のデータを取得（UPDATE/DELETEの場合）
  let beforeData = null;
  if (params.action === 'update' || params.action === 'delete') {
    beforeData = await prisma[params.model].findUnique({
      where: params.args.where
    });
  }
  
  const result = await next(params);
  
  // 変更ログを記録
  if (['create', 'update', 'delete'].includes(params.action)) {
    await prisma.dataChangeLog.create({
      data: {
        table: params.model,
        action: params.action,
        recordId: result?.id || params.args.where?.id,
        beforeData: beforeData ? JSON.stringify(beforeData) : null,
        afterData: result ? JSON.stringify(result) : null,
        userId: getCurrentUserId(), // コンテキストから取得
        timestamp: new Date(),
        duration: Date.now() - start
      }
    });
  }
  
  return result;
});
```

## 🔐 セッション管理

### セッションセキュリティ

```typescript
// セッション設定
import session from 'express-session';
import RedisStore from 'connect-redis';
import Redis from 'redis';

const redisClient = Redis.createClient({
  url: process.env.REDIS_URL
});

const sessionConfig = {
  store: new RedisStore({ client: redisClient }),
  secret: process.env.SESSION_SECRET,
  name: 'hr-oss-session',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production', // HTTPS必須
    httpOnly: true, // XSS対策
    maxAge: 24 * 60 * 60 * 1000, // 24時間
    sameSite: 'strict' // CSRF対策
  },
  genid: () => {
    return crypto.randomBytes(32).toString('hex');
  }
};

app.use(session(sessionConfig));
```

### セッション無効化

```typescript
// ログアウト時のセッション無効化
export const logout = async (req: Request, res: Response) => {
  try {
    // JWTブラックリストに追加
    const token = req.headers.authorization?.split(' ')[1];
    if (token) {
      await addToBlacklist(token);
    }
    
    // セッション破棄
    req.session.destroy((err) => {
      if (err) {
        console.error('Session destruction error:', err);
      }
    });
    
    // Cookieクリア
    res.clearCookie('hr-oss-session');
    
    res.json({ message: 'ログアウトしました' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'ログアウト処理でエラーが発生しました' });
  }
};

// JWTブラックリスト管理
const blacklistedTokens = new Set<string>();

async function addToBlacklist(token: string): Promise<void> {
  // Redisにブラックリストを保存
  await redisClient.setex(`blacklist:${token}`, 7 * 24 * 60 * 60, 'true');
  blacklistedTokens.add(token);
}

async function isBlacklisted(token: string): Promise<boolean> {
  const exists = await redisClient.exists(`blacklist:${token}`);
  return exists === 1 || blacklistedTokens.has(token);
}
```

## 🚨 レート制限

### API レート制限

```typescript
// backend/src/middleware/rateLimit.ts
import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import Redis from 'redis';

const redisClient = Redis.createClient({
  url: process.env.REDIS_URL
});

// 一般的なAPIエンドポイント用
export const generalRateLimit = rateLimit({
  store: new RedisStore({
    client: redisClient,
    prefix: 'rl:general:'
  }),
  windowMs: 15 * 60 * 1000, // 15分
  max: 1000, // 15分間に1000リクエスト
  message: {
    error: 'リクエストが多すぎます。しばらく待ってから再試行してください。'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// ログインエンドポイント用（より厳格）
export const loginRateLimit = rateLimit({
  store: new RedisStore({
    client: redisClient,
    prefix: 'rl:login:'
  }),
  windowMs: 15 * 60 * 1000, // 15分
  max: 5, // 15分間に5回
  message: {
    error: 'ログイン試行回数が多すぎます。15分後に再試行してください。'
  },
  standardHeaders: true,
  legacyHeaders: false,
  // IP + ユーザーIDでレート制限
  keyGenerator: (req) => {
    return `${req.ip}:${req.body.email || 'anonymous'}`;
  }
});

// ファイルアップロード用
export const uploadRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1時間
  max: 50, // 1時間に50ファイル
  message: {
    error: 'ファイルアップロード数の上限に達しました。'
  }
});
```

## 🔒 本番環境セキュリティ

### SSL/TLS 設定

```nginx
# nginx SSL設定
server {
    listen 443 ssl http2;
    server_name hr-oss.example.com;
    
    # SSL証明書
    ssl_certificate /etc/ssl/certs/hr-oss.crt;
    ssl_certificate_key /etc/ssl/private/hr-oss.key;
    
    # SSL設定
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    
    # HSTS
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
    
    # その他のセキュリティヘッダー
    add_header X-Content-Type-Options nosniff always;
    add_header X-Frame-Options DENY always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    
    # CSP
    add_header Content-Security-Policy "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'" always;
}
```

### ファイアウォール設定

```bash
# UFW ファイアウォール設定
ufw default deny incoming
ufw default allow outgoing

# 必要なポートのみ開放
ufw allow 22/tcp    # SSH
ufw allow 80/tcp    # HTTP
ufw allow 443/tcp   # HTTPS

# 特定IPからのアクセスのみ許可（管理用）
ufw allow from 192.168.1.0/24 to any port 5432  # PostgreSQL
ufw allow from 192.168.1.0/24 to any port 6379  # Redis

ufw enable
```

### 定期的なセキュリティ更新

```bash
#!/bin/bash
# セキュリティ更新スクリプト

# システムパッケージ更新
apt update && apt upgrade -y

# Node.js依存関係の脆弱性チェック
npm audit fix

# Docker イメージの更新
docker pull node:18-alpine
docker pull postgres:14
docker pull nginx:alpine

# SSL証明書の更新チェック
certbot renew --dry-run

# ログローテーション
logrotate /etc/logrotate.d/hr-oss

echo "セキュリティ更新完了: $(date)" >> /var/log/security-updates.log
```

## 📊 セキュリティ監視

### 侵入検知

```typescript
// 異常なアクセスパターンの検知
export class SecurityMonitor {
  private suspiciousActivities = new Map<string, number>();
  
  // 短時間での大量アクセス検知
  checkRapidRequests(ip: string): boolean {
    const key = `rapid:${ip}`;
    const count = this.suspiciousActivities.get(key) || 0;
    
    if (count > 100) { // 1分間に100リクエスト超
      this.alertSuspiciousActivity('RAPID_REQUESTS', ip);
      return true;
    }
    
    this.suspiciousActivities.set(key, count + 1);
    setTimeout(() => this.suspiciousActivities.delete(key), 60000);
    
    return false;
  }
  
  // 異常なログイン試行の検知
  checkSuspiciousLogin(ip: string, email: string): boolean {
    const key = `login:${ip}:${email}`;
    const attempts = this.suspiciousActivities.get(key) || 0;
    
    if (attempts > 3) { // 15分間に3回以上の失敗
      this.alertSuspiciousActivity('BRUTE_FORCE_LOGIN', ip, { email });
      return true;
    }
    
    return false;
  }
  
  private async alertSuspiciousActivity(type: string, ip: string, details?: any) {
    // Slack/メール通知
    await this.sendAlert({
      type,
      ip,
      timestamp: new Date(),
      details
    });
    
    // 自動ブロック（必要に応じて）
    await this.blockIP(ip, '1 hour');
  }
}
```

この包括的なセキュリティガイドにより、HR-OSSシステムを様々な脅威から保護できます。定期的な見直しと更新を行い、最新のセキュリティ基準に準拠することが重要です。