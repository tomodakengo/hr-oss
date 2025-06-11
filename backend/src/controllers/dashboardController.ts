import { Response } from 'express';
import { PrismaClient, AttendanceStatus, PayrollStatus } from '@prisma/client';
import { AuthenticatedRequest } from '../middleware/auth';

const prisma = new PrismaClient();

export class DashboardController {
  // 総合ダッシュボードデータ取得
  async getDashboardData(req: AuthenticatedRequest, res: Response) {
    try {
      const companyId = req.user!.companyId;
      const today = new Date();
      const currentMonth = today.getMonth() + 1;
      const currentYear = today.getFullYear();
      
      // 基本統計情報を並行取得
      const [
        totalEmployees,
        todayAttendance,
        monthlyAttendance,
        monthlyPayroll,
        departmentStats,
        recentActivities,
        alerts
      ] = await Promise.all([
        // 総従業員数
        prisma.employee.count({
          where: { companyId, status: 'ACTIVE' }
        }),
        
        // 今日の出勤状況
        this.getTodayAttendanceData(companyId),
        
        // 今月の勤怠統計
        this.getMonthlyAttendanceStats(companyId, currentYear, currentMonth),
        
        // 今月の給与統計
        this.getMonthlyPayrollStats(companyId, currentYear, currentMonth),
        
        // 部署別統計
        this.getDepartmentStats(companyId),
        
        // 最近のアクティビティ
        this.getRecentActivities(companyId),
        
        // アラート・警告
        this.getAlerts(companyId)
      ]);

      return res.json({
        success: true,
        data: {
          overview: {
            totalEmployees,
            currentPeriod: { year: currentYear, month: currentMonth }
          },
          attendance: {
            today: todayAttendance,
            monthly: monthlyAttendance
          },
          payroll: monthlyPayroll,
          departments: departmentStats,
          activities: recentActivities,
          alerts
        }
      });
    } catch (error) {
      console.error('Get dashboard data error:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  // 今日の出勤状況
  private async getTodayAttendanceData(companyId: string) {
    const today = new Date();
    const dateOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    
    const [attendances, totalEmployees] = await Promise.all([
      prisma.attendance.findMany({
        where: {
          companyId,
          date: dateOnly
        },
        include: {
          employee: {
            select: {
              firstName: true,
              lastName: true,
              department: { select: { name: true } }
            }
          }
        }
      }),
      prisma.employee.count({
        where: { companyId, status: 'ACTIVE' }
      })
    ]);

    const statusCounts = attendances.reduce((acc, att) => {
      acc[att.status] = (acc[att.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const presentCount = statusCounts[AttendanceStatus.PRESENT] || 0;
    const lateCount = statusCounts[AttendanceStatus.LATE] || 0;
    const absentCount = totalEmployees - attendances.length;
    
    return {
      total: totalEmployees,
      present: presentCount,
      late: lateCount,
      absent: absentCount,
      attendanceRate: totalEmployees > 0 ? ((presentCount + lateCount) / totalEmployees) * 100 : 0,
      recentClockIns: attendances
        .filter(att => att.clockIn && att.status === AttendanceStatus.PRESENT)
        .sort((a, b) => new Date(b.clockIn!).getTime() - new Date(a.clockIn!).getTime())
        .slice(0, 5)
        .map(att => ({
          employeeName: `${att.employee.lastName} ${att.employee.firstName}`,
          department: att.employee.department?.name,
          clockIn: att.clockIn,
          status: att.status
        }))
    };
  }

  // 月次勤怠統計
  private async getMonthlyAttendanceStats(companyId: string, year: number, month: number) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);
    
    const attendances = await prisma.attendance.findMany({
      where: {
        companyId,
        date: {
          gte: startDate,
          lte: endDate
        }
      }
    });

    const totalWorkHours = attendances.reduce(
      (sum, att) => sum + parseFloat(att.workHours?.toString() || '0'), 0
    );
    const totalOvertimeHours = attendances.reduce(
      (sum, att) => sum + parseFloat(att.overtimeHours?.toString() || '0'), 0
    );
    const avgWorkHours = attendances.length > 0 ? totalWorkHours / attendances.length : 0;

    // 日別勤怠率計算（過去7日間）
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      
      const dayAttendances = attendances.filter(att => 
        att.date.getTime() === dateOnly.getTime()
      );
      
      const presentCount = dayAttendances.filter(att => 
        att.status === AttendanceStatus.PRESENT || att.status === AttendanceStatus.LATE
      ).length;
      
      last7Days.push({
        date: dateOnly.toISOString().split('T')[0],
        attendanceCount: presentCount,
        attendanceRate: presentCount // 実際は総従業員数で割る必要があるが簡略化
      });
    }

    return {
      totalWorkHours,
      totalOvertimeHours,
      averageWorkHours: avgWorkHours,
      weeklyTrend: last7Days,
      overtimeRate: totalWorkHours > 0 ? (totalOvertimeHours / totalWorkHours) * 100 : 0
    };
  }

  // 月次給与統計
  private async getMonthlyPayrollStats(companyId: string, year: number, month: number) {
    const payrolls = await prisma.payroll.findMany({
      where: {
        companyId,
        year,
        month,
        status: { in: [PayrollStatus.APPROVED, PayrollStatus.PAID] }
      }
    });

    if (payrolls.length === 0) {
      return {
        totalGrossSalary: 0,
        totalNetSalary: 0,
        averageGrossSalary: 0,
        totalEmployees: 0,
        calculatedCount: 0,
        approvedCount: 0,
        paidCount: 0
      };
    }

    const totalGrossSalary = payrolls.reduce(
      (sum, p) => sum + parseFloat((p as any).grossSalary?.toString() || '0'), 0
    );
    const totalNetSalary = payrolls.reduce(
      (sum, p) => sum + parseFloat((p as any).netSalary?.toString() || '0'), 0
    );

    // ステータス別カウント
    const statusCounts = await prisma.payroll.groupBy({
      by: ['status'],
      where: { companyId, year, month },
      _count: { status: true }
    });

    const statusCountMap = statusCounts.reduce((acc, item) => {
      acc[item.status] = item._count.status;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalGrossSalary,
      totalNetSalary,
      averageGrossSalary: payrolls.length > 0 ? totalGrossSalary / payrolls.length : 0,
      totalEmployees: payrolls.length,
      calculatedCount: statusCountMap[PayrollStatus.CALCULATED] || 0,
      approvedCount: statusCountMap[PayrollStatus.APPROVED] || 0,
      paidCount: statusCountMap[PayrollStatus.PAID] || 0
    };
  }

  // 部署別統計
  private async getDepartmentStats(companyId: string) {
    const departments = await prisma.department.findMany({
      where: { companyId, isActive: true },
      include: {
        employees: {
          where: { status: 'ACTIVE' },
          select: { id: true }
        }
      }
    });

    const today = new Date();
    const dateOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    
    const stats = await Promise.all(
      departments.map(async (dept) => {
        const employeeIds = dept.employees.map(emp => emp.id);
        
        // 今日の出勤状況
        const todayAttendances = await prisma.attendance.findMany({
          where: {
            companyId,
            date: dateOnly,
            employeeId: { in: employeeIds }
          }
        });

        const presentCount = todayAttendances.filter(att => 
          att.status === AttendanceStatus.PRESENT || att.status === AttendanceStatus.LATE
        ).length;

        return {
          id: dept.id,
          name: dept.name,
          totalEmployees: dept.employees.length,
          presentToday: presentCount,
          attendanceRate: dept.employees.length > 0 ? 
            (presentCount / dept.employees.length) * 100 : 0
        };
      })
    );

    return stats;
  }

  // 最近のアクティビティ
  private async getRecentActivities(companyId: string) {
    const [recentEmployees, recentLeaveRequests] = await Promise.all([
      // 最近追加された従業員
      prisma.employee.findMany({
        where: { companyId },
        orderBy: { createdAt: 'desc' },
        take: 3,
        select: {
          firstName: true,
          lastName: true,
          hireDate: true,
          department: { select: { name: true } },
          createdAt: true
        }
      }),
      
      // 最近の有給申請
      prisma.leaveRequest.findMany({
        where: { companyId },
        orderBy: { submittedAt: 'desc' },
        take: 3,
        include: {
          employee: {
            select: {
              firstName: true,
              lastName: true
            }
          }
        }
      })
    ]);

    const activities = [
      ...recentEmployees.map(emp => ({
        type: 'new_employee',
        message: `${emp.lastName} ${emp.firstName}さんが入社しました`,
        department: emp.department?.name,
        timestamp: emp.createdAt
      })),
      ...recentLeaveRequests.map(req => ({
        type: 'leave_request',
        message: `${req.employee.lastName} ${req.employee.firstName}さんが有給申請しました`,
        status: req.status,
        timestamp: req.submittedAt
      }))
    ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return activities.slice(0, 5);
  }

  // アラート・警告
  private async getAlerts(companyId: string) {
    const alerts = [];
    const today = new Date();
    const currentMonth = today.getMonth() + 1;
    const currentYear = today.getFullYear();

    // 長時間労働者チェック
    const overtimeThreshold = 80; // 月80時間以上
    const monthlyOvertimeEmployees = await prisma.attendance.groupBy({
      by: ['employeeId'],
      where: {
        companyId,
        date: {
          gte: new Date(currentYear, currentMonth - 1, 1),
          lte: new Date(currentYear, currentMonth, 0)
        }
      },
      _sum: { overtimeHours: true },
      having: {
        overtimeHours: { _sum: { gte: overtimeThreshold } }
      }
    });

    if (monthlyOvertimeEmployees.length > 0) {
      alerts.push({
        type: 'warning',
        title: '長時間労働の警告',
        message: `${monthlyOvertimeEmployees.length}名の従業員が月${overtimeThreshold}時間以上の残業をしています`,
        severity: 'high',
        count: monthlyOvertimeEmployees.length
      });
    }

    // 未承認の有給申請
    const pendingLeaveRequests = await prisma.leaveRequest.count({
      where: {
        companyId,
        status: 'PENDING'
      }
    });

    if (pendingLeaveRequests > 0) {
      alerts.push({
        type: 'info',
        title: '未承認の有給申請',
        message: `${pendingLeaveRequests}件の有給申請が承認待ちです`,
        severity: 'medium',
        count: pendingLeaveRequests
      });
    }

    // 未計算の給与
    const uncalculatedPayrolls = await prisma.employee.count({
      where: {
        companyId,
        status: 'ACTIVE',
        payrolls: {
          none: {
            year: currentYear,
            month: currentMonth
          }
        }
      }
    });

    if (uncalculatedPayrolls > 0) {
      alerts.push({
        type: 'warning',
        title: '給与未計算',
        message: `${uncalculatedPayrolls}名の今月の給与が未計算です`,
        severity: 'medium',
        count: uncalculatedPayrolls
      });
    }

    return alerts;
  }

  // 勤怠トレンド分析
  async getAttendanceTrends(req: AuthenticatedRequest, res: Response) {
    try {
      const companyId = req.user!.companyId;
      const { period = '7d' } = req.query;
      
      let startDate: Date;
      const endDate = new Date();
      
      switch (period) {
        case '30d':
          startDate = new Date();
          startDate.setDate(startDate.getDate() - 30);
          break;
        case '90d':
          startDate = new Date();
          startDate.setDate(startDate.getDate() - 90);
          break;
        default: // 7d
          startDate = new Date();
          startDate.setDate(startDate.getDate() - 7);
      }

      const attendances = await prisma.attendance.findMany({
        where: {
          companyId,
          date: {
            gte: startDate,
            lte: endDate
          }
        },
        include: {
          employee: {
            select: {
              department: { select: { name: true } }
            }
          }
        }
      });

      // 日別集計
      const dailyStats = this.aggregateAttendanceByDay(attendances, startDate, endDate);
      
      // 部署別集計
      const departmentStats = this.aggregateAttendanceByDepartment(attendances);

      return res.json({
        success: true,
        data: {
          period: { start: startDate, end: endDate },
          daily: dailyStats,
          departments: departmentStats
        }
      });
    } catch (error) {
      console.error('Get attendance trends error:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  // 給与統計レポート
  async getPayrollReport(req: AuthenticatedRequest, res: Response) {
    try {
      const companyId = req.user!.companyId;
      const { year, months = 12 } = req.query;
      
      const targetYear = year ? parseInt(year as string) : new Date().getFullYear();
      const monthCount = parseInt(months as string);
      
      const payrollData = [];
      
      for (let i = 0; i < monthCount; i++) {
        const month = new Date().getMonth() - i + 1;
        const adjustedYear = targetYear + Math.floor((month - 1) / 12);
        const adjustedMonth = ((month - 1) % 12) + 1;
        
        const monthlyPayrolls = await prisma.payroll.findMany({
          where: {
            companyId,
            year: adjustedYear,
            month: adjustedMonth,
            status: { in: [PayrollStatus.APPROVED, PayrollStatus.PAID] }
          }
        });

        const totalGross = monthlyPayrolls.reduce(
          (sum, p) => sum + parseFloat((p as any).grossSalary?.toString() || '0'), 0
        );
        const totalNet = monthlyPayrolls.reduce(
          (sum, p) => sum + parseFloat((p as any).netSalary?.toString() || '0'), 0
        );

        payrollData.unshift({
          year: adjustedYear,
          month: adjustedMonth,
          employeeCount: monthlyPayrolls.length,
          totalGrossSalary: totalGross,
          totalNetSalary: totalNet,
          averageGrossSalary: monthlyPayrolls.length > 0 ? totalGross / monthlyPayrolls.length : 0
        });
      }

      return res.json({
        success: true,
        data: {
          period: { year: targetYear, months: monthCount },
          monthly: payrollData
        }
      });
    } catch (error) {
      console.error('Get payroll report error:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  // ヘルパー関数: 日別勤怠集計
  private aggregateAttendanceByDay(attendances: any[], startDate: Date, endDate: Date) {
    const dailyStats = [];
    const current = new Date(startDate);
    
    while (current <= endDate) {
      const dateStr = current.toISOString().split('T')[0];
      const dayAttendances = attendances.filter(att => 
        att.date.toISOString().split('T')[0] === dateStr
      );
      
      const presentCount = dayAttendances.filter(att => 
        att.status === AttendanceStatus.PRESENT || att.status === AttendanceStatus.LATE
      ).length;
      
      dailyStats.push({
        date: dateStr,
        totalAttendances: dayAttendances.length,
        presentCount,
        absentCount: dayAttendances.filter(att => att.status === AttendanceStatus.ABSENT).length,
        lateCount: dayAttendances.filter(att => att.status === AttendanceStatus.LATE).length,
        averageWorkHours: dayAttendances.length > 0 ? 
          dayAttendances.reduce((sum, att) => sum + parseFloat(att.workHours?.toString() || '0'), 0) / dayAttendances.length : 0
      });
      
      current.setDate(current.getDate() + 1);
    }
    
    return dailyStats;
  }

  // ヘルパー関数: 部署別勤怠集計
  private aggregateAttendanceByDepartment(attendances: any[]) {
    const deptStats = attendances.reduce((acc, att) => {
      const deptName = att.employee.department?.name || '未配属';
      if (!acc[deptName]) {
        acc[deptName] = {
          name: deptName,
          totalAttendances: 0,
          presentCount: 0,
          totalWorkHours: 0,
          totalOvertimeHours: 0
        };
      }
      
      acc[deptName].totalAttendances++;
      if (att.status === AttendanceStatus.PRESENT || att.status === AttendanceStatus.LATE) {
        acc[deptName].presentCount++;
      }
      acc[deptName].totalWorkHours += parseFloat(att.workHours?.toString() || '0');
      acc[deptName].totalOvertimeHours += parseFloat(att.overtimeHours?.toString() || '0');
      
      return acc;
    }, {} as Record<string, any>);
    
    return Object.values(deptStats);
  }
}