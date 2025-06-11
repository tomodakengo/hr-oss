/**
 * 日本の労働基準法に準拠した時間計算ユーティリティ
 */

// 標準労働時間（8時間）
const STANDARD_WORK_HOURS = 8;

// 深夜時間帯（22:00-05:00）
const NIGHT_START_HOUR = 22;
const NIGHT_END_HOUR = 5;

// 法定休日の判定（日曜日 = 0）
const LEGAL_HOLIDAY_WEEKDAY = 0;

/**
 * 労働時間を計算する
 * @param clockIn 出勤時刻
 * @param clockOut 退勤時刻
 * @param breakStart 休憩開始時刻
 * @param breakEnd 休憩終了時刻
 * @returns 労働時間（時間単位）
 */
export function calculateWorkHours(
  clockIn: Date,
  clockOut: Date,
  breakStart?: Date,
  breakEnd?: Date
): number {
  const totalMinutes = (clockOut.getTime() - clockIn.getTime()) / (1000 * 60);
  
  let breakMinutes = 0;
  if (breakStart && breakEnd) {
    breakMinutes = (breakEnd.getTime() - breakStart.getTime()) / (1000 * 60);
  }
  
  // 労働時間が6時間を超える場合、最低45分の休憩が必要
  // 8時間を超える場合、最低60分の休憩が必要
  const workMinutesWithoutBreak = totalMinutes - breakMinutes;
  const workHours = workMinutesWithoutBreak / 60;
  
  if (workHours > 8 && breakMinutes < 60) {
    // 8時間超で休憩が60分未満の場合、60分の休憩を自動適用
    return Math.max(0, (totalMinutes - 60) / 60);
  } else if (workHours > 6 && breakMinutes < 45) {
    // 6時間超で休憩が45分未満の場合、45分の休憩を自動適用
    return Math.max(0, (totalMinutes - 45) / 60);
  }
  
  return Math.max(0, workHours);
}

/**
 * 残業時間を計算する
 * @param workHours 実労働時間
 * @returns 残業時間（時間単位）
 */
export function calculateOvertimeHours(workHours: number): number {
  return Math.max(0, workHours - STANDARD_WORK_HOURS);
}

/**
 * 深夜労働時間を計算する
 * @param clockIn 出勤時刻
 * @param clockOut 退勤時刻
 * @returns 深夜労働時間（時間単位）
 */
export function calculateNightHours(clockIn: Date, clockOut: Date): number {
  let nightMinutes = 0;
  
  const current = new Date(clockIn);
  const end = new Date(clockOut);
  
  while (current < end) {
    const nextHour = new Date(current);
    nextHour.setHours(current.getHours() + 1, 0, 0, 0);
    
    const periodEnd = nextHour > end ? end : nextHour;
    const hour = current.getHours();
    
    // 深夜時間帯（22:00-05:00）の判定
    if (hour >= NIGHT_START_HOUR || hour < NIGHT_END_HOUR) {
      const periodMinutes = (periodEnd.getTime() - current.getTime()) / (1000 * 60);
      nightMinutes += periodMinutes;
    }
    
    current.setTime(periodEnd.getTime());
  }
  
  return nightMinutes / 60;
}

/**
 * 休日労働時間を計算する
 * @param clockIn 出勤時刻
 * @param clockOut 退勤時刻
 * @param date 勤務日
 * @returns 休日労働時間（時間単位）
 */
export function calculateHolidayHours(
  clockIn: Date,
  clockOut: Date,
  date: Date
): number {
  // 日曜日または国民の祝日の場合
  if (isLegalHoliday(date) || isNationalHoliday(date)) {
    return calculateWorkHours(clockIn, clockOut);
  }
  
  return 0;
}

/**
 * 法定休日（日曜日）かどうかを判定する
 * @param date 判定する日付
 * @returns 法定休日の場合true
 */
export function isLegalHoliday(date: Date): boolean {
  return date.getDay() === LEGAL_HOLIDAY_WEEKDAY;
}

/**
 * 国民の祝日かどうかを判定する
 * @param date 判定する日付
 * @returns 国民の祝日の場合true
 */
export function isNationalHoliday(date: Date): boolean {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  
  // 固定祝日
  const fixedHolidays = [
    { month: 1, day: 1 },   // 元日
    { month: 2, day: 11 },  // 建国記念の日
    { month: 2, day: 23 },  // 天皇誕生日
    { month: 4, day: 29 },  // 昭和の日
    { month: 5, day: 3 },   // 憲法記念日
    { month: 5, day: 4 },   // みどりの日
    { month: 5, day: 5 },   // こどもの日
    { month: 8, day: 11 },  // 山の日
    { month: 11, day: 3 },  // 文化の日
    { month: 11, day: 23 }, // 勤労感謝の日
  ];
  
  // 固定祝日のチェック
  if (fixedHolidays.some(holiday => holiday.month === month && holiday.day === day)) {
    return true;
  }
  
  // 移動する祝日（簡易実装）
  // 成人の日（1月第2月曜日）
  if (month === 1 && isNthMondayOfMonth(date, 2)) {
    return true;
  }
  
  // 海の日（7月第3月曜日）
  if (month === 7 && isNthMondayOfMonth(date, 3)) {
    return true;
  }
  
  // 敬老の日（9月第3月曜日）
  if (month === 9 && isNthMondayOfMonth(date, 3)) {
    return true;
  }
  
  // 体育の日/スポーツの日（10月第2月曜日）
  if (month === 10 && isNthMondayOfMonth(date, 2)) {
    return true;
  }
  
  // 春分の日と秋分の日（近似計算）
  if (month === 3 && day === calculateVernalEquinox(year)) {
    return true;
  }
  
  if (month === 9 && day === calculateAutumnalEquinox(year)) {
    return true;
  }
  
  return false;
}

/**
 * 指定された月の第N月曜日かどうかを判定する
 * @param date 判定する日付
 * @param nth 第何月曜日か
 * @returns 第N月曜日の場合true
 */
function isNthMondayOfMonth(date: Date, nth: number): boolean {
  if (date.getDay() !== 1) return false; // 月曜日でない
  
  const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
  const firstMonday = new Date(firstDay);
  
  // その月の最初の月曜日を見つける
  while (firstMonday.getDay() !== 1) {
    firstMonday.setDate(firstMonday.getDate() + 1);
  }
  
  // 第N月曜日の日付を計算
  const nthMonday = new Date(firstMonday);
  nthMonday.setDate(firstMonday.getDate() + (nth - 1) * 7);
  
  return date.getDate() === nthMonday.getDate();
}

/**
 * 春分の日を計算する（近似）
 * @param year 年
 * @returns 春分の日の日付
 */
function calculateVernalEquinox(year: number): number {
  if (year >= 1851 && year <= 1899) {
    return Math.floor(19.8277 + 0.2422 * (year - 1851) - Math.floor((year - 1851) / 4));
  } else if (year >= 1900 && year <= 1979) {
    return Math.floor(21.124 + 0.2422 * (year - 1900) - Math.floor((year - 1900) / 4));
  } else if (year >= 1980 && year <= 2099) {
    return Math.floor(20.8431 + 0.242194 * (year - 1980) - Math.floor((year - 1980) / 4));
  } else if (year >= 2100 && year <= 2150) {
    return Math.floor(21.8510 + 0.242194 * (year - 2100) - Math.floor((year - 2100) / 4));
  }
  return 20; // デフォルト値
}

/**
 * 秋分の日を計算する（近似）
 * @param year 年
 * @returns 秋分の日の日付
 */
function calculateAutumnalEquinox(year: number): number {
  if (year >= 1851 && year <= 1899) {
    return Math.floor(22.7020 + 0.2422 * (year - 1851) - Math.floor((year - 1851) / 4));
  } else if (year >= 1900 && year <= 1979) {
    return Math.floor(23.2488 + 0.2422 * (year - 1900) - Math.floor((year - 1900) / 4));
  } else if (year >= 1980 && year <= 2099) {
    return Math.floor(23.2488 + 0.242194 * (year - 1980) - Math.floor((year - 1980) / 4));
  } else if (year >= 2100 && year <= 2150) {
    return Math.floor(24.2488 + 0.242194 * (year - 2100) - Math.floor((year - 2100) / 4));
  }
  return 23; // デフォルト値
}

/**
 * 週の労働時間を計算する
 * @param attendances その週の勤怠記録
 * @returns 週の労働時間
 */
export function calculateWeeklyWorkHours(attendances: Array<{ workHours: number }>): number {
  return attendances.reduce((total, attendance) => total + (attendance.workHours || 0), 0);
}

/**
 * 月の労働時間を計算する
 * @param attendances その月の勤怠記録
 * @returns 月の労働時間
 */
export function calculateMonthlyWorkHours(attendances: Array<{ workHours: number }>): number {
  return attendances.reduce((total, attendance) => total + (attendance.workHours || 0), 0);
}

/**
 * 労働時間の上限チェック（36協定）
 * @param monthlyHours 月の労働時間
 * @param monthlyOvertimeHours 月の残業時間
 * @returns 上限違反の警告
 */
export function checkLaborTimeViolations(
  monthlyHours: number,
  monthlyOvertimeHours: number
): Array<{ type: string; message: string; severity: 'warning' | 'error' }> {
  const violations = [];
  
  // 月45時間の残業時間上限（原則）
  if (monthlyOvertimeHours > 45) {
    violations.push({
      type: 'monthly_overtime_limit',
      message: `月の残業時間が45時間を超えています（${monthlyOvertimeHours}時間）`,
      severity: monthlyOvertimeHours > 80 ? 'error' : 'warning' as 'warning' | 'error'
    });
  }
  
  // 月100時間未満の労働時間上限（休日労働含む）
  if (monthlyHours > 100) {
    violations.push({
      type: 'monthly_total_limit',
      message: `月の総労働時間が100時間を超えています（${monthlyHours}時間）`,
      severity: 'error'
    });
  }
  
  return violations as { type: string; message: string; severity: "error" | "warning"; }[];
}

/**
 * 時間を "HH:mm" 形式でフォーマットする
 * @param hours 時間（小数点可）
 * @returns フォーマットされた時間文字列
 */
export function formatHours(hours: number): string {
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}