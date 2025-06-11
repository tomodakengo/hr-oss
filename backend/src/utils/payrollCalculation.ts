/**
 * 日本の労働法・税法に準拠した給与計算ユーティリティ
 */

import { Decimal } from '@prisma/client/runtime/library';

// 2024年の各種保険料率・税率（一般的な値）
const INSURANCE_RATES = {
  healthInsurance: 0.0495,      // 健康保険料率（協会けんぽ・一般）
  pensionInsurance: 0.0915,     // 厚生年金保険料率
  employmentInsurance: 0.003,   // 雇用保険料率（一般事業）
  longCareInsurance: 0.0123,    // 介護保険料率（40歳以上）
} as const;

// 時間外労働の割増率
const OVERTIME_RATES = {
  normal: 1.25,     // 通常の時間外労働（月60時間以内）
  extended: 1.50,   // 長時間残業（月60時間超）
  night: 1.25,      // 深夜労働
  holiday: 1.35,    // 休日労働
} as const;

// 所得税の源泉徴収税額表（簡易版）
const INCOME_TAX_TABLE = [
  { min: 0, max: 88000, rate: 0, deduction: 0 },
  { min: 88000, max: 162000, rate: 0.05, deduction: 4400 },
  { min: 162000, max: 270000, rate: 0.10, deduction: 12500 },
  { min: 270000, max: 350000, rate: 0.15, deduction: 26000 },
  { min: 350000, max: 450000, rate: 0.20, deduction: 43500 },
  { min: 450000, max: 550000, rate: 0.25, deduction: 66000 },
  { min: 550000, max: Infinity, rate: 0.30, deduction: 93500 },
] as const;

export interface AttendanceData {
  workHours: number;
  overtimeHours: number;
  nightHours: number;
  holidayHours: number;
}

export interface SalarySettings {
  baseSalary: number;
  transportAllowance?: number;
  familyAllowance?: number;
  housingAllowance?: number;
  positionAllowance?: number;
  skillAllowance?: number;
  otherAllowances?: number;
  hourlyRate?: number;
  overtimeRate?: number;
  nightRate?: number;
  holidayRate?: number;
}

export interface TaxSettings {
  dependents: number;           // 扶養親族数
  socialInsuranceExemption: boolean;  // 社会保険料控除
  age: number;                 // 年齢（介護保険料判定用）
}

export interface PayrollCalculationResult {
  // 支給項目
  baseSalary: number;
  overtimePay: number;
  nightPay: number;
  holidayPay: number;
  transportAllowance: number;
  familyAllowance: number;
  housingAllowance: number;
  positionAllowance: number;
  skillAllowance: number;
  otherAllowances: number;
  grossSalary: number;

  // 控除項目
  healthInsurance: number;
  pensionInsurance: number;
  employmentInsurance: number;
  longCareInsurance: number;
  incomeTax: number;
  residenceTax: number;
  otherDeductions: number;
  totalDeductions: number;

  // 差引支給額
  netSalary: number;

  // 労働時間
  workHours: number;
  overtimeHours: number;
  nightHours: number;
  holidayHours: number;
}

/**
 * 基本給から時間給を計算
 * @param baseSalary 基本給（月額）
 * @param standardWorkHours 標準労働時間（月）
 * @returns 時間給
 */
export function calculateHourlyRate(baseSalary: number, standardWorkHours: number = 160): number {
  return baseSalary / standardWorkHours;
}

/**
 * 時間外労働手当を計算
 * @param attendanceData 勤怠データ
 * @param hourlyRate 時間給
 * @param overtimeRate 残業割増率
 * @returns 時間外労働手当
 */
export function calculateOvertimePay(
  attendanceData: AttendanceData,
  hourlyRate: number,
  overtimeRate: number = OVERTIME_RATES.normal
): number {
  const { overtimeHours } = attendanceData;
  
  // 月60時間超の場合の割増率変更は簡略化
  const normalOvertimeHours = Math.min(overtimeHours, 60);
  const extendedOvertimeHours = Math.max(overtimeHours - 60, 0);
  
  const normalPay = normalOvertimeHours * hourlyRate * overtimeRate;
  const extendedPay = extendedOvertimeHours * hourlyRate * OVERTIME_RATES.extended;
  
  return normalPay + extendedPay;
}

/**
 * 深夜労働手当を計算
 * @param attendanceData 勤怠データ
 * @param hourlyRate 時間給
 * @param nightRate 深夜割増率
 * @returns 深夜労働手当
 */
export function calculateNightPay(
  attendanceData: AttendanceData,
  hourlyRate: number,
  nightRate: number = OVERTIME_RATES.night
): number {
  const { nightHours } = attendanceData;
  return nightHours * hourlyRate * (nightRate - 1); // 深夜は基本給+25%なので0.25倍
}

/**
 * 休日労働手当を計算
 * @param attendanceData 勤怠データ
 * @param hourlyRate 時間給
 * @param holidayRate 休日割増率
 * @returns 休日労働手当
 */
export function calculateHolidayPay(
  attendanceData: AttendanceData,
  hourlyRate: number,
  holidayRate: number = OVERTIME_RATES.holiday
): number {
  const { holidayHours } = attendanceData;
  return holidayHours * hourlyRate * holidayRate;
}

/**
 * 健康保険料を計算
 * @param grossSalary 総支給額
 * @param rate 健康保険料率
 * @returns 健康保険料（労働者負担分）
 */
export function calculateHealthInsurance(
  grossSalary: number,
  rate: number = INSURANCE_RATES.healthInsurance
): number {
  // 標準報酬月額表による計算は簡略化
  return Math.round(grossSalary * rate / 2); // 労働者負担は1/2
}

/**
 * 厚生年金保険料を計算
 * @param grossSalary 総支給額
 * @param rate 厚生年金保険料率
 * @returns 厚生年金保険料（労働者負担分）
 */
export function calculatePensionInsurance(
  grossSalary: number,
  rate: number = INSURANCE_RATES.pensionInsurance
): number {
  return Math.round(grossSalary * rate / 2); // 労働者負担は1/2
}

/**
 * 雇用保険料を計算
 * @param grossSalary 総支給額
 * @param rate 雇用保険料率
 * @returns 雇用保険料（労働者負担分）
 */
export function calculateEmploymentInsurance(
  grossSalary: number,
  rate: number = INSURANCE_RATES.employmentInsurance
): number {
  return Math.round(grossSalary * rate);
}

/**
 * 介護保険料を計算（40歳以上）
 * @param grossSalary 総支給額
 * @param age 年齢
 * @param rate 介護保険料率
 * @returns 介護保険料（労働者負担分）
 */
export function calculateLongCareInsurance(
  grossSalary: number,
  age: number,
  rate: number = INSURANCE_RATES.longCareInsurance
): number {
  if (age < 40) return 0; // 40歳未満は介護保険料なし
  return Math.round(grossSalary * rate / 2); // 労働者負担は1/2
}

/**
 * 所得税を計算（源泉徴収税額表による簡易計算）
 * @param taxableIncome 課税所得（総支給額-社会保険料）
 * @param dependents 扶養親族数
 * @returns 所得税額
 */
export function calculateIncomeTax(
  taxableIncome: number,
  dependents: number = 0
): number {
  // 扶養控除額（簡略化）
  const dependentDeduction = dependents * 38000; // 1人38,000円控除
  const adjustedIncome = Math.max(taxableIncome - dependentDeduction, 0);
  
  // 源泉徴収税額表による計算
  for (const bracket of INCOME_TAX_TABLE) {
    if (adjustedIncome >= bracket.min && adjustedIncome < bracket.max) {
      return Math.round(adjustedIncome * bracket.rate - bracket.deduction);
    }
  }
  
  return 0;
}

/**
 * 総合的な給与計算
 * @param attendanceData 勤怠データ
 * @param salarySettings 給与設定
 * @param taxSettings 税務設定
 * @returns 給与計算結果
 */
export function calculatePayroll(
  attendanceData: AttendanceData,
  salarySettings: SalarySettings,
  taxSettings: TaxSettings
): PayrollCalculationResult {
  // 時間給計算
  const hourlyRate = salarySettings.hourlyRate || 
    calculateHourlyRate(salarySettings.baseSalary);

  // 支給項目計算
  const baseSalary = salarySettings.baseSalary;
  const overtimePay = calculateOvertimePay(
    attendanceData,
    hourlyRate,
    salarySettings.overtimeRate || OVERTIME_RATES.normal
  );
  const nightPay = calculateNightPay(
    attendanceData,
    hourlyRate,
    salarySettings.nightRate || OVERTIME_RATES.night
  );
  const holidayPay = calculateHolidayPay(
    attendanceData,
    hourlyRate,
    salarySettings.holidayRate || OVERTIME_RATES.holiday
  );

  // 各種手当
  const transportAllowance = salarySettings.transportAllowance || 0;
  const familyAllowance = salarySettings.familyAllowance || 0;
  const housingAllowance = salarySettings.housingAllowance || 0;
  const positionAllowance = salarySettings.positionAllowance || 0;
  const skillAllowance = salarySettings.skillAllowance || 0;
  const otherAllowances = salarySettings.otherAllowances || 0;

  // 総支給額
  const grossSalary = baseSalary + overtimePay + nightPay + holidayPay +
    transportAllowance + familyAllowance + housingAllowance +
    positionAllowance + skillAllowance + otherAllowances;

  // 社会保険料計算
  const healthInsurance = calculateHealthInsurance(grossSalary);
  const pensionInsurance = calculatePensionInsurance(grossSalary);
  const employmentInsurance = calculateEmploymentInsurance(grossSalary);
  const longCareInsurance = calculateLongCareInsurance(grossSalary, taxSettings.age);

  const totalSocialInsurance = healthInsurance + pensionInsurance + 
    employmentInsurance + longCareInsurance;

  // 所得税計算
  const taxableIncome = grossSalary - totalSocialInsurance;
  const incomeTax = calculateIncomeTax(taxableIncome, taxSettings.dependents);

  // 住民税（簡略化：前年所得に基づくため0とする）
  const residenceTax = 0;
  const otherDeductions = 0;

  // 総控除額
  const totalDeductions = totalSocialInsurance + incomeTax + residenceTax + otherDeductions;

  // 差引支給額
  const netSalary = grossSalary - totalDeductions;

  return {
    // 支給項目
    baseSalary,
    overtimePay,
    nightPay,
    holidayPay,
    transportAllowance,
    familyAllowance,
    housingAllowance,
    positionAllowance,
    skillAllowance,
    otherAllowances,
    grossSalary,

    // 控除項目
    healthInsurance,
    pensionInsurance,
    employmentInsurance,
    longCareInsurance,
    incomeTax,
    residenceTax,
    otherDeductions,
    totalDeductions,

    // 差引支給額
    netSalary,

    // 労働時間
    workHours: attendanceData.workHours,
    overtimeHours: attendanceData.overtimeHours,
    nightHours: attendanceData.nightHours,
    holidayHours: attendanceData.holidayHours,
  };
}

/**
 * 月次勤怠データから給与計算用データを集計
 * @param attendances 月次勤怠記録
 * @returns 集計された勤怠データ
 */
export function aggregateAttendanceData(attendances: any[]): AttendanceData {
  return attendances.reduce(
    (acc, attendance) => ({
      workHours: acc.workHours + (parseFloat(attendance.workHours?.toString() || '0')),
      overtimeHours: acc.overtimeHours + (parseFloat(attendance.overtimeHours?.toString() || '0')),
      nightHours: acc.nightHours + (parseFloat(attendance.nightHours?.toString() || '0')),
      holidayHours: acc.holidayHours + (parseFloat(attendance.holidayHours?.toString() || '0')),
    }),
    { workHours: 0, overtimeHours: 0, nightHours: 0, holidayHours: 0 }
  );
}

/**
 * 年収から月額給与を逆算
 * @param annualSalary 年収
 * @param months 支給月数（通常12ヶ月、賞与含む場合は14-16ヶ月）
 * @returns 月額給与
 */
export function calculateMonthlySalaryFromAnnual(
  annualSalary: number,
  months: number = 12
): number {
  return Math.round(annualSalary / months);
}

/**
 * 給与計算結果のフォーマット（表示用）
 * @param result 給与計算結果
 * @returns フォーマットされた文字列
 */
export function formatPayrollResult(result: PayrollCalculationResult): string {
  return `
=== 給与明細 ===
【支給項目】
基本給: ${result.baseSalary.toLocaleString()}円
残業手当: ${result.overtimePay.toLocaleString()}円
深夜手当: ${result.nightPay.toLocaleString()}円
休日手当: ${result.holidayPay.toLocaleString()}円
通勤手当: ${result.transportAllowance.toLocaleString()}円
家族手当: ${result.familyAllowance.toLocaleString()}円
住宅手当: ${result.housingAllowance.toLocaleString()}円
職位手当: ${result.positionAllowance.toLocaleString()}円
技能手当: ${result.skillAllowance.toLocaleString()}円
その他手当: ${result.otherAllowances.toLocaleString()}円
────────────────
総支給額: ${result.grossSalary.toLocaleString()}円

【控除項目】
健康保険料: ${result.healthInsurance.toLocaleString()}円
厚生年金保険料: ${result.pensionInsurance.toLocaleString()}円
雇用保険料: ${result.employmentInsurance.toLocaleString()}円
介護保険料: ${result.longCareInsurance.toLocaleString()}円
所得税: ${result.incomeTax.toLocaleString()}円
住民税: ${result.residenceTax.toLocaleString()}円
その他控除: ${result.otherDeductions.toLocaleString()}円
────────────────
総控除額: ${result.totalDeductions.toLocaleString()}円

【差引支給額】
手取り額: ${result.netSalary.toLocaleString()}円

【労働時間】
労働時間: ${result.workHours}時間
残業時間: ${result.overtimeHours}時間
深夜時間: ${result.nightHours}時間
休日時間: ${result.holidayHours}時間
  `.trim();
}