import { apiService } from './api';
import {
  Attendance,
  LeaveRequest,
  LeaveBalance,
  AttendanceStatus,
  LeaveType,
  LeaveStatus,
} from '../types/employee';

interface AttendanceListResponse {
  success: boolean;
  data: {
    attendances: Attendance[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
  };
}

interface EmployeeAttendanceResponse {
  success: boolean;
  data: {
    attendances: Attendance[];
    stats: {
      totalWorkDays: number;
      totalWorkHours: number;
      totalOvertimeHours: number;
      absentDays: number;
      lateDays: number;
      earlyLeaveDays: number;
    };
  };
}

interface LeaveRequestListResponse {
  success: boolean;
  data: {
    leaveRequests: LeaveRequest[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
  };
}

interface MonthlySummaryResponse {
  success: boolean;
  data: {
    period: { year: number; month: number };
    totalStats: {
      totalEmployees: number;
      totalWorkHours: number;
      totalOvertimeHours: number;
      averageWorkHours: number;
      attendanceRate: number;
    };
    departmentStats: Record<string, {
      totalWorkHours: number;
      totalOvertimeHours: number;
      presentDays: number;
      absentDays: number;
      employeeCount: number;
    }>;
  };
}

export class AttendanceService {
  // 出勤打刻
  async clockIn(employeeId: string, location?: string): Promise<Attendance> {
    const response = await apiService.post<{ success: boolean; data: { attendance: Attendance } }>(
      `/attendance/${employeeId}/clock-in`,
      {
        location,
        ipAddress: await this.getClientIP()
      }
    );
    return response.data.data.attendance;
  }

  // 退勤打刻
  async clockOut(employeeId: string, location?: string): Promise<Attendance> {
    const response = await apiService.post<{ success: boolean; data: { attendance: Attendance } }>(
      `/attendance/${employeeId}/clock-out`,
      {
        location,
        ipAddress: await this.getClientIP()
      }
    );
    return response.data.data.attendance;
  }

  // 休憩開始
  async startBreak(employeeId: string): Promise<Attendance> {
    const response = await apiService.post<{ success: boolean; data: { attendance: Attendance } }>(
      `/attendance/${employeeId}/break-start`,
      {}
    );
    return response.data.data.attendance;
  }

  // 休憩終了
  async endBreak(employeeId: string): Promise<Attendance> {
    const response = await apiService.post<{ success: boolean; data: { attendance: Attendance } }>(
      `/attendance/${employeeId}/break-end`,
      {}
    );
    return response.data.data.attendance;
  }

  // 今日の勤怠状況取得
  async getTodayStatus(employeeId: string): Promise<Attendance | null> {
    const response = await apiService.get<{ success: boolean; data: { attendance: Attendance | null } }>(
      `/attendance/${employeeId}/today`
    );
    return response.data.data.attendance;
  }

  // 勤怠記録一覧取得
  async getAttendances(params?: {
    employeeId?: string;
    startDate?: string;
    endDate?: string;
    status?: AttendanceStatus;
    page?: number;
    limit?: number;
  }): Promise<AttendanceListResponse['data']> {
    const queryParams = new URLSearchParams();
    
    if (params?.employeeId) queryParams.append('employeeId', params.employeeId);
    if (params?.startDate) queryParams.append('startDate', params.startDate);
    if (params?.endDate) queryParams.append('endDate', params.endDate);
    if (params?.status) queryParams.append('status', params.status);
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());

    const response = await apiService.get<AttendanceListResponse>(
      `/attendance?${queryParams.toString()}`
    );
    return response.data.data;
  }

  // 個別従業員の勤怠記録取得
  async getEmployeeAttendances(
    employeeId: string,
    params?: {
      startDate?: string;
      endDate?: string;
      year?: number;
      month?: number;
    }
  ): Promise<EmployeeAttendanceResponse['data']> {
    const queryParams = new URLSearchParams();
    
    if (params?.startDate) queryParams.append('startDate', params.startDate);
    if (params?.endDate) queryParams.append('endDate', params.endDate);
    if (params?.year) queryParams.append('year', params.year.toString());
    if (params?.month) queryParams.append('month', params.month.toString());

    const response = await apiService.get<EmployeeAttendanceResponse>(
      `/attendance/${employeeId}?${queryParams.toString()}`
    );
    return response.data.data;
  }

  // 勤怠記録更新（管理者用）
  async updateAttendance(id: string, data: {
    clockIn?: string;
    clockOut?: string;
    breakStart?: string;
    breakEnd?: string;
    status?: AttendanceStatus;
    attendanceType?: string;
    remarks?: string;
  }): Promise<Attendance> {
    const response = await apiService.put<{ success: boolean; data: { attendance: Attendance } }>(
      `/attendance/${id}`,
      data
    );
    return response.data.data.attendance;
  }

  // 月次サマリー取得
  async getMonthlySummary(year?: number, month?: number): Promise<MonthlySummaryResponse['data']> {
    const queryParams = new URLSearchParams();
    
    if (year) queryParams.append('year', year.toString());
    if (month) queryParams.append('month', month.toString());

    const response = await apiService.get<MonthlySummaryResponse>(
      `/attendance/summary/monthly?${queryParams.toString()}`
    );
    return response.data.data;
  }

  // 有給申請作成
  async createLeaveRequest(data: {
    employeeId: string;
    startDate: string;
    endDate: string;
    leaveType: LeaveType;
    reason?: string;
  }): Promise<LeaveRequest> {
    const response = await apiService.post<{ success: boolean; data: { leaveRequest: LeaveRequest } }>(
      '/attendance/leave-requests',
      data
    );
    return response.data.data.leaveRequest;
  }

  // 有給申請一覧取得
  async getLeaveRequests(params?: {
    employeeId?: string;
    status?: LeaveStatus;
    leaveType?: LeaveType;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }): Promise<LeaveRequestListResponse['data']> {
    const queryParams = new URLSearchParams();
    
    if (params?.employeeId) queryParams.append('employeeId', params.employeeId);
    if (params?.status) queryParams.append('status', params.status);
    if (params?.leaveType) queryParams.append('leaveType', params.leaveType);
    if (params?.startDate) queryParams.append('startDate', params.startDate);
    if (params?.endDate) queryParams.append('endDate', params.endDate);
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());

    const response = await apiService.get<LeaveRequestListResponse>(
      `/attendance/leave-requests?${queryParams.toString()}`
    );
    return response.data.data;
  }

  // 有給申請承認/却下
  async reviewLeaveRequest(id: string, status: LeaveStatus, remarks?: string): Promise<LeaveRequest> {
    const response = await apiService.put<{ success: boolean; data: { leaveRequest: LeaveRequest } }>(
      `/attendance/leave-requests/${id}/review`,
      { status, remarks }
    );
    return response.data.data.leaveRequest;
  }

  // 有給残高取得
  async getLeaveBalance(employeeId: string, year?: number): Promise<LeaveBalance> {
    const queryParams = new URLSearchParams();
    if (year) queryParams.append('year', year.toString());

    const response = await apiService.get<{ success: boolean; data: { balance: LeaveBalance } }>(
      `/attendance/leave-balance/${employeeId}?${queryParams.toString()}`
    );
    return response.data.data.balance;
  }

  // 有給残高初期化
  async initializeLeaveBalance(employeeId: string, year: number): Promise<any> {
    const response = await apiService.post<{ success: boolean; data: { balance: any } }>(
      '/attendance/leave-balance/initialize',
      { employeeId, year }
    );
    return response.data.data.balance;
  }

  // 有給統計取得
  async getLeaveStatistics(year?: number): Promise<any> {
    const queryParams = new URLSearchParams();
    if (year) queryParams.append('year', year.toString());

    const response = await apiService.get<{ success: boolean; data: any }>(
      `/attendance/leave-statistics?${queryParams.toString()}`
    );
    return response.data.data;
  }

  // 位置情報取得
  async getCurrentLocation(): Promise<string> {
    return new Promise((resolve) => {
      if ('geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const { latitude, longitude } = position.coords;
            resolve(`${latitude},${longitude}`);
          },
          () => {
            resolve('位置情報取得不可');
          }
        );
      } else {
        resolve('位置情報非対応');
      }
    });
  }

  // クライアントIP取得（簡易版）
  private async getClientIP(): Promise<string> {
    try {
      // 実際の実装では、プロキシやロードバランサーを考慮する必要があります
      return 'client-ip';
    } catch {
      return 'unknown';
    }
  }

  // 時間フォーマット
  formatTime(time?: string): string {
    if (!time) return '-';
    return new Date(time).toLocaleTimeString('ja-JP', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  // 労働時間フォーマット
  formatHours(hours?: number): string {
    if (!hours) return '0:00';
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    return `${h}:${m.toString().padStart(2, '0')}`;
  }

  // 日付フォーマット
  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      weekday: 'short'
    });
  }

  // 勤怠ステータスの日本語表示
  getStatusLabel(status: AttendanceStatus): string {
    const labels = {
      [AttendanceStatus.PRESENT]: '出勤',
      [AttendanceStatus.ABSENT]: '欠勤',
      [AttendanceStatus.LATE]: '遅刻',
      [AttendanceStatus.EARLY_LEAVE]: '早退',
      [AttendanceStatus.VACATION]: '有給',
      [AttendanceStatus.SICK_LEAVE]: '病欠',
      [AttendanceStatus.BUSINESS_TRIP]: '出張',
    };
    return labels[status] || status;
  }

  // 有給タイプの日本語表示
  getLeaveTypeLabel(type: LeaveType): string {
    const labels = {
      [LeaveType.ANNUAL_LEAVE]: '年次有給休暇',
      [LeaveType.SICK_LEAVE]: '病気休暇',
      [LeaveType.SPECIAL_LEAVE]: '特別休暇',
      [LeaveType.MATERNITY_LEAVE]: '産前産後休暇',
      [LeaveType.PATERNITY_LEAVE]: '育児休暇',
      [LeaveType.BEREAVEMENT_LEAVE]: '忌引休暇',
      [LeaveType.COMPENSATORY_LEAVE]: '代休',
      [LeaveType.UNPAID_LEAVE]: '無給休暇',
    };
    return labels[type] || type;
  }

  // 申請ステータスの日本語表示
  getLeaveStatusLabel(status: LeaveStatus): string {
    const labels = {
      [LeaveStatus.PENDING]: '承認待ち',
      [LeaveStatus.APPROVED]: '承認済み',
      [LeaveStatus.REJECTED]: '却下',
      [LeaveStatus.CANCELLED]: 'キャンセル',
    };
    return labels[status] || status;
  }
}

export const attendanceService = new AttendanceService();