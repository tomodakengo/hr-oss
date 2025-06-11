# データベース設計

HR-OSSのデータベーススキーマとモデル設計について説明します。

## 🗄 データベース概要

- **DBMS**: PostgreSQL 14+
- **ORM**: Prisma
- **アーキテクチャ**: マルチテナント（会社ベース分離）

## 📊 全体ER図

```
Company (会社)
├── Department (部署) ─── Employee (従業員)
├── Position (役職)   ─── │
└── SalaryTemplate    ─── │
                          ├── Attendance (勤怠)
                          ├── Payroll (給与)
                          ├── LeaveBalance (有給残高)
                          └── EmergencyContact (緊急連絡先)
```

## 🏢 コアモデル

### Company（会社）

```prisma
model Company {
  id              String       @id @default(cuid())
  name            String
  address         String?
  phone           String?
  email           String?
  registrationId  String?      // 法人番号
  establishedDate DateTime?
  settings        Json?        // 会社固有設定
  
  // Relations
  users           User[]
  employees       Employee[]
  departments     Department[]
  positions       Position[]
  salaryTemplates SalaryTemplate[]
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  @@map("companies")
}
```

### User（システムユーザー）

```prisma
enum UserRole {
  ADMIN
  HR_STAFF
  MANAGER
  EMPLOYEE
}

model User {
  id        String   @id @default(cuid())
  email     String   @unique
  password  String
  role      UserRole @default(EMPLOYEE)
  companyId String
  
  // Relations
  company   Company @relation(fields: [companyId], references: [id])
  employee  Employee?
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  @@map("users")
}
```

### Employee（従業員）

```prisma
enum Gender {
  MALE
  FEMALE
  OTHER
}

enum EmploymentType {
  FULL_TIME
  PART_TIME
  CONTRACT
  TEMPORARY
}

enum EmployeeStatus {
  ACTIVE
  INACTIVE
  TERMINATED
}

model Employee {
  id             String         @id @default(cuid())
  employeeNumber String         @unique
  firstName      String
  lastName       String
  email          String         @unique
  phone          String?
  birthDate      DateTime?
  gender         Gender?
  
  // 住所情報
  postalCode     String?
  prefecture     String?
  city           String?
  street         String?
  
  // 雇用情報
  hireDate       DateTime
  employmentType EmploymentType @default(FULL_TIME)
  contractEndDate DateTime?
  probationEndDate DateTime?
  terminationDate DateTime?
  terminationReason String?
  
  // 組織情報
  companyId      String
  departmentId   String?
  positionId     String?
  managerId      String?        // 直属上司
  
  // 給与情報
  baseSalary     Decimal        @db.Decimal(10,2)
  
  status         EmployeeStatus @default(ACTIVE)
  
  // Relations
  company        Company          @relation(fields: [companyId], references: [id])
  department     Department?      @relation(fields: [departmentId], references: [id])
  position       Position?        @relation(fields: [positionId], references: [id])
  manager        Employee?        @relation("ManagerSubordinate", fields: [managerId], references: [id])
  subordinates   Employee[]       @relation("ManagerSubordinate")
  user           User?
  
  attendances    Attendance[]
  payrolls       Payroll[]
  leaveBalances  LeaveBalance[]
  emergencyContacts EmergencyContact[]
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  @@index([companyId])
  @@index([employeeNumber])
  @@index([email])
  @@map("employees")
}
```

### Department（部署）

```prisma
model Department {
  id          String  @id @default(cuid())
  name        String
  description String?
  parentId    String? // 上位部署
  managerId   String? // 部署責任者
  companyId   String
  
  // Relations
  company     Company      @relation(fields: [companyId], references: [id])
  parent      Department?  @relation("DepartmentHierarchy", fields: [parentId], references: [id])
  children    Department[] @relation("DepartmentHierarchy")
  employees   Employee[]
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  @@index([companyId])
  @@map("departments")
}
```

### Position（役職）

```prisma
model Position {
  id          String  @id @default(cuid())
  name        String
  description String?
  level       Int     @default(1) // 役職レベル（1が最下位）
  companyId   String
  
  // Relations
  company     Company    @relation(fields: [companyId], references: [id])
  employees   Employee[]
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  @@index([companyId])
  @@map("positions")
}
```

## ⏰ 勤怠関連モデル

### Attendance（勤怠記録）

```prisma
enum AttendanceStatus {
  DRAFT
  SUBMITTED
  APPROVED
  REJECTED
}

model Attendance {
  id           String            @id @default(cuid())
  date         DateTime          @db.Date
  employeeId   String
  
  // 打刻時間
  clockInTime  DateTime?
  clockOutTime DateTime?
  breakStartTime DateTime?
  breakEndTime   DateTime?
  
  // 計算結果
  workingHours   Decimal?        @db.Decimal(4,2)
  overtimeHours  Decimal?        @db.Decimal(4,2)
  nighttimeHours Decimal?        @db.Decimal(4,2)
  holidayHours   Decimal?        @db.Decimal(4,2)
  
  // 位置情報
  clockInLocation  Json?          // {lat, lng}
  clockOutLocation Json?          // {lat, lng}
  
  // 承認情報
  status       AttendanceStatus @default(DRAFT)
  approvedBy   String?
  approvedAt   DateTime?
  remarks      String?
  
  // Relations
  employee     Employee @relation(fields: [employeeId], references: [id])
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  @@unique([employeeId, date])
  @@index([employeeId, date])
  @@map("attendance")
}
```

### LeaveBalance（有給残高）

```prisma
enum LeaveType {
  PAID_LEAVE        // 有給休暇
  SICK_LEAVE        // 病気休暇
  MATERNITY_LEAVE   // 産休
  PATERNITY_LEAVE   // 育休
  SPECIAL_LEAVE     // 特別休暇
}

model LeaveBalance {
  id            String    @id @default(cuid())
  employeeId    String
  leaveType     LeaveType
  year          Int       // 対象年度
  
  grantedDays   Decimal   @db.Decimal(4,1) // 付与日数
  usedDays      Decimal   @db.Decimal(4,1) // 使用日数
  remainingDays Decimal   @db.Decimal(4,1) // 残日数
  expiryDate    DateTime  // 有効期限
  
  // Relations
  employee      Employee @relation(fields: [employeeId], references: [id])
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  @@unique([employeeId, leaveType, year])
  @@index([employeeId])
  @@map("leave_balances")
}
```

## 💰 給与関連モデル

### Payroll（給与）

```prisma
enum PayrollStatus {
  CALCULATED
  APPROVED
  PAID
  CANCELLED
}

model Payroll {
  id          String        @id @default(cuid())
  employeeId  String
  payPeriod   String        // "2023-04" 形式
  
  // 勤務情報
  workingDays    Int
  workingHours   Decimal      @db.Decimal(6,2)
  overtimeHours  Decimal      @db.Decimal(6,2)
  holidayHours   Decimal      @db.Decimal(6,2)
  nighttimeHours Decimal      @db.Decimal(6,2)
  
  // 支給項目
  baseSalary     Decimal      @db.Decimal(10,2)
  overtimePay    Decimal      @db.Decimal(10,2)
  allowances     Decimal      @db.Decimal(10,2)
  bonus          Decimal      @db.Decimal(10,2) @default(0)
  
  // 控除項目
  healthInsurance    Decimal  @db.Decimal(10,2) @default(0)
  pensionInsurance   Decimal  @db.Decimal(10,2) @default(0)
  employmentInsurance Decimal @db.Decimal(10,2) @default(0)
  longCareInsurance  Decimal  @db.Decimal(10,2) @default(0)
  incomeTax          Decimal  @db.Decimal(10,2) @default(0)
  residentTax        Decimal  @db.Decimal(10,2) @default(0)
  otherDeductions    Decimal  @db.Decimal(10,2) @default(0)
  
  // 計算結果
  grossPay    Decimal       @db.Decimal(10,2)
  totalDeductions Decimal   @db.Decimal(10,2)
  netPay      Decimal       @db.Decimal(10,2)
  
  status      PayrollStatus @default(CALCULATED)
  approvedBy  String?
  approvedAt  DateTime?
  paidAt      DateTime?
  
  // Relations
  employee    Employee      @relation(fields: [employeeId], references: [id])
  payrollItems PayrollItem[]
  
  calculatedAt DateTime     @default(now())
  createdAt    DateTime     @default(now())
  updatedAt    DateTime     @updatedAt
  
  @@unique([employeeId, payPeriod])
  @@index([employeeId])
  @@index([payPeriod])
  @@map("payrolls")
}
```

### PayrollItem（給与明細項目）

```prisma
enum PayrollItemType {
  ALLOWANCE     // 手当
  DEDUCTION     // 控除
  BONUS         // 賞与
  ADJUSTMENT    // 調整
}

model PayrollItem {
  id          String          @id @default(cuid())
  payrollId   String
  type        PayrollItemType
  name        String          // 項目名
  amount      Decimal         @db.Decimal(10,2)
  taxable     Boolean         @default(true) // 課税対象
  description String?
  
  // Relations
  payroll     Payroll @relation(fields: [payrollId], references: [id])
  
  createdAt DateTime @default(now())
  
  @@index([payrollId])
  @@map("payroll_items")
}
```

### SalaryTemplate（給与テンプレート）

```prisma
model SalaryTemplate {
  id          String  @id @default(cuid())
  name        String
  positionId  String?
  companyId   String
  
  baseSalary  Decimal @db.Decimal(10,2)
  allowances  Json    // 各種手当の設定
  
  // Relations
  company     Company   @relation(fields: [companyId], references: [id])
  position    Position? @relation(fields: [positionId], references: [id])
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  @@index([companyId])
  @@map("salary_templates")
}
```

## 👨‍👩‍👧‍👦 その他のモデル

### EmergencyContact（緊急連絡先）

```prisma
model EmergencyContact {
  id           String @id @default(cuid())
  employeeId   String
  name         String
  relationship String
  phone        String
  email        String?
  address      String?
  priority     Int    @default(1) // 優先順位
  
  // Relations
  employee     Employee @relation(fields: [employeeId], references: [id])
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  @@index([employeeId])
  @@map("emergency_contacts")
}
```

## 🔍 インデックス戦略

### 主要インデックス

```sql
-- 会社ベースのマルチテナント対応
CREATE INDEX idx_employees_company_id ON employees(company_id);
CREATE INDEX idx_attendance_employee_date ON attendance(employee_id, date);
CREATE INDEX idx_payroll_company_period ON payrolls(employee_id, pay_period);

-- 検索性能向上
CREATE INDEX idx_employees_name ON employees(last_name, first_name);
CREATE INDEX idx_employees_email ON employees(email);
CREATE INDEX idx_employees_number ON employees(employee_number);

-- 日付範囲検索
CREATE INDEX idx_attendance_date_range ON attendance(date, employee_id);
CREATE INDEX idx_payroll_period ON payrolls(pay_period);
```

## 🔒 データ制約

### 外部キー制約

```sql
-- 会社スコープ制約
ALTER TABLE employees ADD CONSTRAINT fk_employees_company 
  FOREIGN KEY (company_id) REFERENCES companies(id);

-- カスケード削除
ALTER TABLE attendance ADD CONSTRAINT fk_attendance_employee 
  FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE;
```

### チェック制約

```sql
-- 勤務時間の妥当性チェック
ALTER TABLE attendance ADD CONSTRAINT chk_working_hours 
  CHECK (working_hours >= 0 AND working_hours <= 24);

-- 給与の正数チェック  
ALTER TABLE payrolls ADD CONSTRAINT chk_positive_salary 
  CHECK (base_salary >= 0 AND gross_pay >= 0);
```

## 📁 マイグレーション管理

### Prismaマイグレーション

```bash
# 新しいマイグレーション作成
npx prisma migrate dev --name add_emergency_contacts

# 本番環境へのマイグレーション適用
npx prisma migrate deploy

# スキーマリセット（開発環境のみ）
npx prisma migrate reset
```

## 🎯 パフォーマンス最適化

### クエリ最適化例

```typescript
// 効率的な従業員一覧取得
const employees = await prisma.employee.findMany({
  where: { 
    companyId,
    status: 'ACTIVE'
  },
  select: {
    id: true,
    employeeNumber: true,
    firstName: true,
    lastName: true,
    email: true,
    department: {
      select: { name: true }
    }
  },
  take: 20,
  skip: (page - 1) * 20
});
```

### 接続プール設定

```typescript
// Prisma接続設定
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL + "?connection_limit=10&pool_timeout=20"
    }
  }
});
```