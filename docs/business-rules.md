# 日本労働法とビジネスルール

HR-OSSで実装されている日本の労働基準法準拠の業務ルールについて説明します。

## ⏰ 勤怠管理ルール

### 法定労働時間

```typescript
const LABOR_STANDARDS = {
  DAILY_STANDARD_HOURS: 8,      // 1日8時間
  WEEKLY_STANDARD_HOURS: 40,    // 1週40時間
  MONTHLY_OVERTIME_LIMIT: 45,   // 月45時間（36協定）
  YEARLY_OVERTIME_LIMIT: 360    // 年360時間（36協定）
};
```

### 残業計算ルール

#### 時間外労働の割増率

```typescript
const OVERTIME_RATES = {
  // 平日残業
  WEEKDAY_OVERTIME: 1.25,        // 25%割増
  
  // 月60時間超の残業（大企業）
  EXCESSIVE_OVERTIME: 1.50,      // 50%割増
  
  // 休日労働
  LEGAL_HOLIDAY_WORK: 1.35,      // 35%割増
  STATUTORY_HOLIDAY_WORK: 1.25,  // 25%割増
  
  // 深夜労働（22:00-5:00）
  NIGHTTIME_WORK: 1.25,          // 25%割増
  
  // 深夜残業（重複適用）
  NIGHTTIME_OVERTIME: 1.50       // 25% + 25% = 50%割増
};
```

#### 計算例

```typescript
function calculateOvertimePay(
  baseSalary: number,
  regularHours: number,
  overtimeHours: number,
  nighttimeHours: number
): number {
  const hourlyRate = baseSalary / 160; // 月160時間想定
  
  let overtimePay = 0;
  
  // 通常残業（月60時間まで）
  const normalOvertime = Math.min(overtimeHours, 60);
  overtimePay += normalOvertime * hourlyRate * OVERTIME_RATES.WEEKDAY_OVERTIME;
  
  // 長時間残業（月60時間超）
  const excessiveOvertime = Math.max(overtimeHours - 60, 0);
  overtimePay += excessiveOvertime * hourlyRate * OVERTIME_RATES.EXCESSIVE_OVERTIME;
  
  // 深夜労働
  overtimePay += nighttimeHours * hourlyRate * OVERTIME_RATES.NIGHTTIME_WORK;
  
  return overtimePay;
}
```

### 休憩時間ルール

```typescript
const BREAK_TIME_RULES = {
  // 6時間超8時間以下: 45分休憩
  MEDIUM_SHIFT_BREAK: 45,
  
  // 8時間超: 60分休憩
  LONG_SHIFT_BREAK: 60,
  
  // 休憩時間は労働時間から除外
  UNPAID_BREAK: true
};
```

## 💰 給与計算ルール

### 社会保険料（2024年度）

```typescript
const SOCIAL_INSURANCE_RATES_2024 = {
  // 健康保険料（協会けんぽ・東京都）
  HEALTH_INSURANCE: {
    employee: 0.04985,  // 4.985%
    employer: 0.04985,  // 4.985%
    total: 0.0997
  },
  
  // 厚生年金保険料
  PENSION_INSURANCE: {
    employee: 0.091,    // 9.1%
    employer: 0.091,    // 9.1%
    total: 0.182
  },
  
  // 雇用保険料
  EMPLOYMENT_INSURANCE: {
    employee: 0.006,    // 0.6%
    employer: 0.0095,   // 0.95%（一般事業）
    total: 0.0155
  },
  
  // 介護保険料（40歳以上）
  LONG_CARE_INSURANCE: {
    employee: 0.0082,   // 0.82%
    employer: 0.0082,   // 0.82%
    total: 0.0164
  }
};
```

### 所得税計算

```typescript
// 月額所得税表（甲欄）の一部
const INCOME_TAX_TABLE_2024 = [
  { min: 0, max: 88000, tax: 0, rate: 0 },
  { min: 88000, max: 89000, tax: 130, rate: 0.1053 },
  { min: 89000, max: 90000, tax: 230, rate: 0.1053 },
  // ... 省略
];

function calculateIncomeTax(
  taxableIncome: number,
  dependents: number
): number {
  // 扶養控除を考慮した課税所得
  const adjustedIncome = taxableIncome - (dependents * 38000);
  
  for (const bracket of INCOME_TAX_TABLE_2024) {
    if (adjustedIncome >= bracket.min && adjustedIncome < bracket.max) {
      return Math.floor(bracket.tax + (adjustedIncome - bracket.min) * bracket.rate);
    }
  }
  
  return 0;
}
```

### 住民税

```typescript
const RESIDENT_TAX = {
  // 住民税は前年所得に基づく（6月から翌年5月）
  STANDARD_RATE: 0.10,  // 10%（市区町村税6% + 都道府県税4%）
  UNIFORM_LEVY: 5000,   // 均等割（年額）
  
  // 特別徴収（給与天引き）
  MONTHLY_COLLECTION: true
};
```

## 📅 勤怠承認ワークフロー

### 承認フロー

```typescript
enum AttendanceStatus {
  DRAFT = 'DRAFT',           // 下書き
  SUBMITTED = 'SUBMITTED',   // 提出済み
  APPROVED = 'APPROVED',     // 承認済み
  REJECTED = 'REJECTED',     // 却下
  MODIFIED = 'MODIFIED'      // 修正済み
}

const APPROVAL_WORKFLOW = {
  // 従業員 → 直属上司 → HR担当者
  EMPLOYEE: ['MANAGER', 'HR_STAFF'],
  
  // 自動承認条件
  AUTO_APPROVAL: {
    maxDailyHours: 10,        // 10時間以下
    maxMonthlyOvertime: 30,   // 月30時間以下
    noHolidayWork: true       // 休日出勤なし
  }
};
```

## 🏥 有給休暇管理

### 有給付与ルール

```typescript
const PAID_LEAVE_RULES = {
  // 入社6ヶ月後に10日付与
  INITIAL_GRANT: {
    months: 6,
    days: 10
  },
  
  // 継続勤務による付与日数
  ANNUAL_GRANT: [
    { years: 1.5, days: 11 },
    { years: 2.5, days: 12 },
    { years: 3.5, days: 14 },
    { years: 4.5, days: 16 },
    { years: 5.5, days: 18 },
    { years: 6.5, days: 20 }
  ],
  
  // 時効（2年）
  EXPIRATION_YEARS: 2,
  
  // 年5日取得義務（2019年4月〜）
  MANDATORY_USAGE: 5
};
```

### 有給取得率の計算

```typescript
function calculatePaidLeaveUsageRate(
  employee: Employee,
  year: number
): number {
  const granted = getPaidLeaveDaysGranted(employee, year);
  const used = getPaidLeaveDaysUsed(employee, year);
  
  return (used / granted) * 100;
}
```

## 🔒 労働安全衛生法対応

### 長時間労働対策

```typescript
const HEALTH_MANAGEMENT = {
  // 月100時間超の残業で医師面談義務
  MEDICAL_CHECKUP_THRESHOLD: 100,
  
  // 月80時間超の残業で健康相談の申出可能
  HEALTH_CONSULTATION_THRESHOLD: 80,
  
  // 勤務間インターバル（努力義務）
  WORK_INTERVAL_HOURS: 11
};
```

### アラート設定

```typescript
const OVERTIME_ALERTS = {
  WARNING: {
    monthly: 35,    // 月35時間で警告
    daily: 3        // 日3時間で警告
  },
  
  CRITICAL: {
    monthly: 80,    // 月80時間で要注意
    daily: 5        // 日5時間で要注意
  },
  
  EMERGENCY: {
    monthly: 100,   // 月100時間で緊急アラート
    daily: 8        // 日8時間で緊急アラート
  }
};
```

## 📊 法定帳簿

### 必要な記録

```typescript
const REQUIRED_RECORDS = {
  // 労働者名簿
  EMPLOYEE_ROSTER: [
    'name', 'birthDate', 'address', 'jobHistory',
    'hireDate', 'terminationDate', 'terminationReason'
  ],
  
  // 賃金台帳
  WAGE_LEDGER: [
    'name', 'payPeriod', 'workingDays', 'workingHours',
    'overtimeHours', 'baseSalary', 'allowances', 'deductions'
  ],
  
  // 出勤簿
  ATTENDANCE_RECORD: [
    'date', 'startTime', 'endTime', 'breakTime',
    'workingHours', 'overtimeHours', 'remarks'
  ]
};

// 保存期間
const RETENTION_PERIODS = {
  ATTENDANCE_RECORD: 3,    // 3年
  WAGE_LEDGER: 3,         // 3年
  EMPLOYEE_ROSTER: 3,     // 3年（退職後）
  PAYROLL_SLIP: 5         // 5年（推奨）
};
```

## 🎯 コンプライアンスチェック

### 自動チェック項目

```typescript
const COMPLIANCE_CHECKS = {
  // 36協定チェック
  OVERTIME_AGREEMENT: {
    monthlyLimit: 45,
    yearlyLimit: 360,
    specialClause: 720  // 特別条項
  },
  
  // 労働時間チェック
  WORKING_HOURS: {
    dailyMax: 8,
    weeklyMax: 40,
    restDays: 1  // 週1日以上
  },
  
  // 有給取得チェック
  PAID_LEAVE: {
    mandatoryDays: 5,
    usageRate: 70  // 推奨取得率
  }
};
```

これらのルールはすべてHR-OSSのシステム内で自動的に適用され、法令違反のリスクを最小限に抑えます。