import { apiService } from './api';
import {
  Payroll,
  PayrollListParams,
  PayrollListResponse,
  PayrollStatistics,
  PayrollStatus,
} from '../types/employee';

export class PayrollService {
  // 給与計算実行
  async calculatePayroll(employeeId: string, year: number, month: number): Promise<Payroll> {
    const response = await apiService.post<{ success: boolean; data: { payroll: Payroll } }>(
      `/payroll/${employeeId}/calculate`,
      { year, month }
    );
    return response.data.data.payroll;
  }

  // 一括給与計算
  async calculateBulkPayroll(
    year: number, 
    month: number, 
    employeeIds: string[]
  ): Promise<{
    results: any[];
    errors: any[];
    summary: {
      total: number;
      success: number;
      failed: number;
    };
  }> {
    const response = await apiService.post<{ 
      success: boolean; 
      data: {
        results: any[];
        errors: any[];
        summary: {
          total: number;
          success: number;
          failed: number;
        };
      }
    }>(
      '/payroll/bulk-calculate',
      { year, month, employeeIds }
    );
    return response.data.data;
  }

  // 給与一覧取得
  async getPayrolls(params?: PayrollListParams): Promise<PayrollListResponse['data']> {
    const queryParams = new URLSearchParams();
    
    if (params?.employeeId) queryParams.append('employeeId', params.employeeId);
    if (params?.year) queryParams.append('year', params.year.toString());
    if (params?.month) queryParams.append('month', params.month.toString());
    if (params?.status) queryParams.append('status', params.status);
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());

    const response = await apiService.get<PayrollListResponse>(
      `/payroll?${queryParams.toString()}`
    );
    return response.data.data;
  }

  // 個別給与詳細取得
  async getPayrollById(id: string): Promise<Payroll> {
    const response = await apiService.get<{ success: boolean; data: { payroll: Payroll } }>(
      `/payroll/${id}`
    );
    return response.data.data.payroll;
  }

  // 給与承認
  async approvePayroll(id: string): Promise<Payroll> {
    const response = await apiService.put<{ success: boolean; data: { payroll: Payroll } }>(
      `/payroll/${id}/approve`,
      {}
    );
    return response.data.data.payroll;
  }

  // 給与統計取得
  async getPayrollStatistics(year?: number, month?: number): Promise<PayrollStatistics> {
    const queryParams = new URLSearchParams();
    
    if (year) queryParams.append('year', year.toString());
    if (month) queryParams.append('month', month.toString());

    const response = await apiService.get<{ success: boolean; data: PayrollStatistics }>(
      `/payroll/statistics/summary?${queryParams.toString()}`
    );
    return response.data.data;
  }

  // 給与明細PDF生成（将来実装）
  async generatePayslipPDF(id: string): Promise<Blob> {
    const response = await apiService.get<Blob>(`/payroll/${id}/payslip/pdf`, {
      responseType: 'blob'
    });
    return response.data;
  }

  // 給与データエクスポート（将来実装）
  async exportPayrollData(params: {
    year: number;
    month: number;
    format: 'csv' | 'excel';
  }): Promise<Blob> {
    const queryParams = new URLSearchParams();
    queryParams.append('year', params.year.toString());
    queryParams.append('month', params.month.toString());
    queryParams.append('format', params.format);

    const response = await apiService.get<Blob>(
      `/payroll/export?${queryParams.toString()}`,
      { responseType: 'blob' }
    );
    return response.data;
  }

  // 給与ステータスの日本語表示
  getStatusLabel(status: PayrollStatus): string {
    const labels = {
      [PayrollStatus.DRAFT]: '下書き',
      [PayrollStatus.CALCULATED]: '計算済み',
      [PayrollStatus.APPROVED]: '承認済み',
      [PayrollStatus.PAID]: '支払済み',
    };
    return labels[status] || status;
  }

  // 給与ステータスの色
  getStatusColor(status: PayrollStatus): string {
    const colors = {
      [PayrollStatus.DRAFT]: 'bg-gray-100 text-gray-800',
      [PayrollStatus.CALCULATED]: 'bg-yellow-100 text-yellow-800',
      [PayrollStatus.APPROVED]: 'bg-green-100 text-green-800',
      [PayrollStatus.PAID]: 'bg-blue-100 text-blue-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-600';
  }

  // 金額フォーマット
  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('ja-JP', {
      style: 'currency',
      currency: 'JPY',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  }

  // 期間フォーマット
  formatPeriod(year: number, month: number): string {
    return `${year}年${month}月`;
  }

  // 時間フォーマット
  formatHours(hours: number): string {
    if (!hours) return '0:00';
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    return `${h}:${m.toString().padStart(2, '0')}`;
  }

  // 給与明細の詳細表示用フォーマット
  formatPayrollDetails(payroll: Payroll): {
    allowances: Array<{ name: string; amount: number }>;
    deductions: Array<{ name: string; amount: number }>;
  } {
    const allowances = [
      { name: '基本給', amount: payroll.baseSalary },
      { name: '残業手当', amount: payroll.overtimePay },
      { name: '深夜手当', amount: payroll.nightPay },
      { name: '休日手当', amount: payroll.holidayPay },
      { name: '通勤手当', amount: payroll.transportAllowance },
      { name: '家族手当', amount: payroll.familyAllowance },
      { name: '住宅手当', amount: payroll.housingAllowance },
      { name: '職位手当', amount: payroll.positionAllowance },
      { name: '技能手当', amount: payroll.skillAllowance },
      { name: 'その他手当', amount: payroll.otherAllowances },
    ].filter(item => item.amount > 0);

    const deductions = [
      { name: '健康保険料', amount: payroll.healthInsurance },
      { name: '厚生年金保険料', amount: payroll.pensionInsurance },
      { name: '雇用保険料', amount: payroll.employmentInsurance },
      { name: '介護保険料', amount: payroll.longCareInsurance },
      { name: '所得税', amount: payroll.incomeTax },
      { name: '住民税', amount: payroll.residenceTax },
      { name: 'その他控除', amount: payroll.otherDeductions },
    ].filter(item => item.amount > 0);

    return { allowances, deductions };
  }

  // 年次給与統計（将来実装）
  async getAnnualPayrollSummary(year: number): Promise<{
    totalGrossSalary: number;
    totalNetSalary: number;
    totalTax: number;
    totalSocialInsurance: number;
    averageMonthlySalary: number;
    monthlyBreakdown: Array<{
      month: number;
      grossSalary: number;
      netSalary: number;
      employeeCount: number;
    }>;
  }> {
    const response = await apiService.get<{ 
      success: boolean; 
      data: {
        totalGrossSalary: number;
        totalNetSalary: number;
        totalTax: number;
        totalSocialInsurance: number;
        averageMonthlySalary: number;
        monthlyBreakdown: Array<{
          month: number;
          grossSalary: number;
          netSalary: number;
          employeeCount: number;
        }>;
      }
    }>(`/payroll/statistics/annual?year=${year}`);
    return response.data.data;
  }
}

export const payrollService = new PayrollService();