import { apiService } from './api';

export interface DashboardData {
  overview: {
    totalEmployees: number;
    currentPeriod: {
      year: number;
      month: number;
    };
  };
  attendance: {
    today: {
      total: number;
      present: number;
      late: number;
      absent: number;
      attendanceRate: number;
      recentClockIns: Array<{
        employeeName: string;
        department?: string;
        clockIn: string;
        status: string;
      }>;
    };
    monthly: {
      totalWorkHours: number;
      totalOvertimeHours: number;
      averageWorkHours: number;
      overtimeRate: number;
      weeklyTrend: Array<{
        date: string;
        attendanceCount: number;
        attendanceRate: number;
      }>;
    };
  };
  payroll: {
    totalGrossSalary: number;
    totalNetSalary: number;
    averageGrossSalary: number;
    totalEmployees: number;
    calculatedCount: number;
    approvedCount: number;
    paidCount: number;
  };
  departments: Array<{
    id: string;
    name: string;
    totalEmployees: number;
    presentToday: number;
    attendanceRate: number;
  }>;
  activities: Array<{
    type: string;
    message: string;
    department?: string;
    status?: string;
    timestamp: string;
  }>;
  alerts: Array<{
    type: string;
    title: string;
    message: string;
    severity: string;
    count: number;
  }>;
}

export interface AttendanceTrends {
  period: {
    start: string;
    end: string;
  };
  daily: Array<{
    date: string;
    totalAttendances: number;
    presentCount: number;
    absentCount: number;
    lateCount: number;
    averageWorkHours: number;
  }>;
  departments: Array<{
    name: string;
    totalAttendances: number;
    presentCount: number;
    totalWorkHours: number;
    totalOvertimeHours: number;
  }>;
}

export interface PayrollReport {
  period: {
    year: number;
    months: number;
  };
  monthly: Array<{
    year: number;
    month: number;
    employeeCount: number;
    totalGrossSalary: number;
    totalNetSalary: number;
    averageGrossSalary: number;
  }>;
}

export class DashboardService {
  // 総合ダッシュボードデータ取得
  async getDashboardData(): Promise<DashboardData> {
    const response = await apiService.get<{ success: boolean; data: DashboardData }>('/dashboard');
    return response.data.data;
  }

  // 勤怠トレンド分析
  async getAttendanceTrends(period: '7d' | '30d' | '90d' = '7d'): Promise<AttendanceTrends> {
    const response = await apiService.get<{ success: boolean; data: AttendanceTrends }>(
      `/dashboard/attendance-trends?period=${period}`
    );
    return response.data.data;
  }

  // 給与統計レポート
  async getPayrollReport(year?: number, months: number = 12): Promise<PayrollReport> {
    const params = new URLSearchParams();
    if (year) params.append('year', year.toString());
    params.append('months', months.toString());

    const response = await apiService.get<{ success: boolean; data: PayrollReport }>(
      `/dashboard/payroll-report?${params.toString()}`
    );
    return response.data.data;
  }

  // アラートの重要度色
  getAlertColor(severity: string): string {
    const colors = {
      high: 'bg-red-100 text-red-800 border-red-200',
      medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      low: 'bg-blue-100 text-blue-800 border-blue-200',
    };
    return colors[severity as keyof typeof colors] || colors.low;
  }

  // アラートアイコン
  getAlertIcon(type: string): string {
    const icons = {
      warning: '⚠️',
      info: 'ℹ️',
      success: '✅',
      error: '❌',
    };
    return icons[type as keyof typeof icons] || '📌';
  }

  // 出勤率の状態色
  getAttendanceRateColor(rate: number): string {
    if (rate >= 95) return 'text-green-600';
    if (rate >= 90) return 'text-yellow-600';
    return 'text-red-600';
  }

  // 残業率の状態色
  getOvertimeRateColor(rate: number): string {
    if (rate <= 10) return 'text-green-600';
    if (rate <= 20) return 'text-yellow-600';
    return 'text-red-600';
  }

  // 通貨フォーマット
  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('ja-JP', {
      style: 'currency',
      currency: 'JPY',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  }

  // パーセンテージフォーマット
  formatPercentage(value: number, decimals: number = 1): string {
    return `${value.toFixed(decimals)}%`;
  }

  // 時間フォーマット
  formatHours(hours: number): string {
    if (!hours) return '0:00';
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    return `${h}:${m.toString().padStart(2, '0')}`;
  }

  // 日付フォーマット
  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('ja-JP', {
      month: 'short',
      day: 'numeric',
    });
  }

  // 時刻フォーマット
  formatTime(time: string): string {
    return new Date(time).toLocaleTimeString('ja-JP', {
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  // 相対時間フォーマット
  formatRelativeTime(timestamp: string): string {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInMinutes = Math.floor((now.getTime() - time.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return 'たった今';
    if (diffInMinutes < 60) return `${diffInMinutes}分前`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}時間前`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}日前`;
    
    return time.toLocaleDateString('ja-JP');
  }

  // トレンドアイコン
  getTrendIcon(current: number, previous: number): string {
    if (current > previous) return '📈';
    if (current < previous) return '📉';
    return '➡️';
  }

  // 部署別データのソート
  sortDepartmentsByAttendanceRate(departments: DashboardData['departments']): DashboardData['departments'] {
    return [...departments].sort((a, b) => b.attendanceRate - a.attendanceRate);
  }

  // 過去期間との比較計算
  calculateGrowthRate(current: number, previous: number): {
    rate: number;
    isPositive: boolean;
    formatted: string;
  } {
    if (previous === 0) {
      return {
        rate: current > 0 ? 100 : 0,
        isPositive: current > 0,
        formatted: current > 0 ? '+100%' : '0%'
      };
    }

    const rate = ((current - previous) / previous) * 100;
    const isPositive = rate > 0;
    const formatted = `${isPositive ? '+' : ''}${rate.toFixed(1)}%`;

    return { rate, isPositive, formatted };
  }
}

export const dashboardService = new DashboardService();