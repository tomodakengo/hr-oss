# API仕様

HR-OSSのREST API仕様とエンドポイント詳細。

## 🌐 ベースURL

```
開発環境: http://localhost:3001/api
本番環境: https://your-domain.com/api
```

## 🔐 認証

### JWT認証

```http
Authorization: Bearer <JWT_TOKEN>
```

### ログイン

```http
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

**レスポンス:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "role": "HR_STAFF",
    "companyId": "company-uuid"
  }
}
```

## 👥 従業員管理 API

### 従業員一覧取得

```http
GET /employees?page=1&limit=20&search=田中&department=営業部
```

**クエリパラメータ:**
- `page`: ページ番号（デフォルト: 1）
- `limit`: 1ページあたりの件数（デフォルト: 20）
- `search`: 名前・メールでの検索
- `department`: 部署フィルター
- `position`: 役職フィルター

**レスポンス:**
```json
{
  "employees": [
    {
      "id": "uuid",
      "employeeNumber": "EMP001",
      "firstName": "太郎",
      "lastName": "田中",
      "email": "tanaka@example.com",
      "department": {
        "id": "dept-uuid",
        "name": "営業部"
      },
      "position": {
        "id": "pos-uuid",
        "name": "主任"
      },
      "hireDate": "2023-04-01",
      "status": "ACTIVE"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8
  }
}
```

### 従業員詳細取得

```http
GET /employees/:id
```

**レスポンス:**
```json
{
  "id": "uuid",
  "employeeNumber": "EMP001",
  "firstName": "太郎",
  "lastName": "田中",
  "email": "tanaka@example.com",
  "phone": "090-1234-5678",
  "birthDate": "1990-01-01",
  "gender": "MALE",
  "address": {
    "postalCode": "100-0001",
    "prefecture": "東京都",
    "city": "千代田区",
    "street": "丸の内1-1-1"
  },
  "emergencyContact": {
    "name": "田中花子",
    "relationship": "配偶者",
    "phone": "090-8765-4321"
  },
  "employment": {
    "hireDate": "2023-04-01",
    "employmentType": "FULL_TIME",
    "contractEndDate": null,
    "probationEndDate": "2023-09-30"
  },
  "department": {
    "id": "dept-uuid",
    "name": "営業部"
  },
  "position": {
    "id": "pos-uuid",
    "name": "主任"
  },
  "salary": {
    "baseSalary": 300000,
    "allowances": [
      { "type": "COMMUTE", "amount": 15000 },
      { "type": "POSITION", "amount": 30000 }
    ]
  },
  "status": "ACTIVE",
  "createdAt": "2023-04-01T00:00:00.000Z",
  "updatedAt": "2023-04-01T00:00:00.000Z"
}
```

### 従業員作成

```http
POST /employees
Content-Type: application/json

{
  "employeeNumber": "EMP002",
  "firstName": "次郎",
  "lastName": "佐藤",
  "email": "sato@example.com",
  "phone": "090-2345-6789",
  "birthDate": "1985-05-15",
  "gender": "MALE",
  "hireDate": "2023-04-15",
  "departmentId": "dept-uuid",
  "positionId": "pos-uuid",
  "baseSalary": 280000
}
```

## ⏰ 勤怠管理 API

### 勤怠記録一覧

```http
GET /attendance?employeeId=uuid&startDate=2023-04-01&endDate=2023-04-30
```

### 出勤打刻

```http
POST /attendance/clock-in
Content-Type: application/json

{
  "employeeId": "uuid",
  "clockInTime": "2023-04-01T09:00:00.000Z",
  "location": {
    "latitude": 35.6762,
    "longitude": 139.6503
  }
}
```

### 退勤打刻

```http
POST /attendance/clock-out
Content-Type: application/json

{
  "attendanceId": "attendance-uuid",
  "clockOutTime": "2023-04-01T18:00:00.000Z"
}
```

## 💰 給与管理 API

### 給与計算実行

```http
POST /payroll/calculate
Content-Type: application/json

{
  "payPeriod": "2023-04",
  "employeeIds": ["uuid1", "uuid2"]
}
```

### 給与明細取得

```http
GET /payroll/:payrollId
```

**レスポンス:**
```json
{
  "id": "payroll-uuid",
  "employee": {
    "id": "emp-uuid",
    "name": "田中太郎",
    "employeeNumber": "EMP001"
  },
  "payPeriod": "2023-04",
  "baseSalary": 300000,
  "allowances": [
    { "type": "COMMUTE", "amount": 15000 },
    { "type": "OVERTIME", "amount": 25000 }
  ],
  "deductions": [
    { "type": "HEALTH_INSURANCE", "amount": 14955 },
    { "type": "PENSION_INSURANCE", "amount": 27300 },
    { "type": "EMPLOYMENT_INSURANCE", "amount": 2040 },
    { "type": "INCOME_TAX", "amount": 8500 }
  ],
  "grossPay": 340000,
  "netPay": 287205,
  "workingDays": 20,
  "workingHours": 160,
  "overtimeHours": 15,
  "status": "CALCULATED",
  "calculatedAt": "2023-04-25T10:00:00.000Z"
}
```

## 🏢 組織管理 API

### 部署一覧

```http
GET /departments
```

### 部署作成

```http
POST /departments
Content-Type: application/json

{
  "name": "開発部",
  "description": "システム開発を担当する部署",
  "parentId": null,
  "managerId": "manager-uuid"
}
```

### 役職一覧

```http
GET /positions
```

## 📊 ダッシュボード API

### ダッシュボード統計

```http
GET /dashboard/stats
```

**レスポンス:**
```json
{
  "attendance": {
    "todayPresent": 145,
    "todayAbsent": 5,
    "lateArrivals": 3,
    "attendanceRate": 96.7
  },
  "overtime": {
    "thisMonth": 2150,
    "lastMonth": 1980,
    "averagePerEmployee": 14.3,
    "overLimitEmployees": 5
  },
  "payroll": {
    "thisMonthTotal": 15000000,
    "lastMonthTotal": 14800000,
    "averageSalary": 320000,
    "pendingApprovals": 12
  },
  "employees": {
    "total": 150,
    "newHires": 5,
    "resignations": 2,
    "anniversaries": 8
  }
}
```

## ❌ エラーレスポンス

### エラー形式

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "エラーメッセージ",
    "details": [
      {
        "field": "email",
        "message": "有効なメールアドレスを入力してください"
      }
    ]
  }
}
```

### エラーコード一覧

| コード | 説明 | HTTPステータス |
|--------|------|----------------|
| `UNAUTHORIZED` | 認証が必要 | 401 |
| `FORBIDDEN` | アクセス権限なし | 403 |
| `NOT_FOUND` | リソースが見つからない | 404 |
| `VALIDATION_ERROR` | 入力データが無効 | 400 |
| `DUPLICATE_ERROR` | 重複エラー | 409 |
| `INTERNAL_ERROR` | サーバー内部エラー | 500 |

## 📝 リクエスト制限

- **レート制限**: 1分間に100リクエスト/IP
- **ペイロード制限**: 10MB/リクエスト
- **ファイルアップロード**: 5MB/ファイル

## 🔍 検索・フィルタリング

### 共通クエリパラメータ

- `page`: ページ番号
- `limit`: 件数制限
- `sort`: ソート項目
- `order`: ソート順（`asc` | `desc`）
- `search`: 全文検索

### 日付範囲検索

```http
GET /attendance?startDate=2023-04-01&endDate=2023-04-30
```

### 複数条件検索

```http
GET /employees?department=営業部&position=主任&status=ACTIVE
```

## 📚 Swagger UI

開発環境でのAPI仕様確認:
```
http://localhost:3001/api-docs
```