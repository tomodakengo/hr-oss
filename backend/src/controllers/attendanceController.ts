import { Request, Response } from 'express';
import { PrismaClient, AttendanceStatus, AttendanceType, Prisma } from '@prisma/client';
import { AuthenticatedRequest } from '../middleware/auth';
import { calculateWorkHours, calculateOvertimeHours, calculateNightHours, calculateHolidayHours } from '../utils/timeCalculation';

const prisma = new PrismaClient();

export class AttendanceController {
  // 出勤打刻
  async clockIn(req: AuthenticatedRequest, res: Response) {
    try {
      const { employeeId } = req.params;
      const { location, ipAddress } = req.body;
      const companyId = req.user!.companyId;

      // 従業員が存在し、同じ会社に属しているか確認
      const employee = await prisma.employee.findFirst({
        where: { id: employeeId, companyId }
      });

      if (!employee) {
        return res.status(404).json({
          success: false,
          error: 'Employee not found'
        });
      }

      const today = new Date();
      const dateOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());

      // 今日の勤怠記録があるか確認
      const existingAttendance = await prisma.attendance.findUnique({
        where: {
          employeeId_date: {
            employeeId,
            date: dateOnly
          }
        }
      });

      if (existingAttendance?.clockIn) {
        return res.status(400).json({
          success: false,
          error: 'Already clocked in today'
        });
      }

      const attendance = await prisma.attendance.upsert({
        where: {
          employeeId_date: {
            employeeId,
            date: dateOnly
          }
        },
        update: {
          clockIn: today,
          location,
          ipAddress,
          status: AttendanceStatus.PRESENT
        },
        create: {
          employeeId,
          companyId,
          date: dateOnly,
          clockIn: today,
          location,
          ipAddress,
          status: AttendanceStatus.PRESENT,
          attendanceType: AttendanceType.WORK_DAY
        }
      });

      return res.json({
        success: true,
        data: { attendance }
      });
    } catch (error) {
      console.error('Clock in error:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  // 退勤打刻
  async clockOut(req: AuthenticatedRequest, res: Response) {
    try {
      const { employeeId } = req.params;
      const { location, ipAddress } = req.body;
      const companyId = req.user!.companyId;

      const today = new Date();
      const dateOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());

      const attendance = await prisma.attendance.findUnique({
        where: {
          employeeId_date: {
            employeeId,
            date: dateOnly
          }
        }
      });

      if (!attendance || !attendance.clockIn) {
        return res.status(400).json({
          success: false,
          error: 'No clock in record found for today'
        });
      }

      if (attendance.clockOut) {
        return res.status(400).json({
          success: false,
          error: 'Already clocked out today'
        });
      }

      // 労働時間の計算
      const workHours = calculateWorkHours(
        attendance.clockIn,
        today,
        attendance.breakStart,
        attendance.breakEnd
      );
      
      const overtimeHours = calculateOvertimeHours(workHours);
      const nightHours = calculateNightHours(attendance.clockIn, today);
      const holidayHours = calculateHolidayHours(attendance.clockIn, today, dateOnly);

      const updatedAttendance = await prisma.attendance.update({
        where: { id: attendance.id },
        data: {
          clockOut: today,
          location,
          ipAddress,
          workHours: new Prisma.Decimal(workHours.toString()),
          overtimeHours: new Prisma.Decimal(overtimeHours.toString()),
          nightHours: new Prisma.Decimal(nightHours.toString()),
          holidayHours: new Prisma.Decimal(holidayHours.toString())
        }
      });

      return res.json({
        success: true,
        data: { attendance: updatedAttendance }
      });
    } catch (error) {
      console.error('Clock out error:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  // 休憩開始
  async startBreak(req: AuthenticatedRequest, res: Response) {
    try {
      const { employeeId } = req.params;
      const companyId = req.user!.companyId;

      const today = new Date();
      const dateOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());

      const attendance = await prisma.attendance.findUnique({
        where: {
          employeeId_date: {
            employeeId,
            date: dateOnly
          }
        }
      });

      if (!attendance || !attendance.clockIn || attendance.clockOut) {
        return res.status(400).json({
          success: false,
          error: 'Invalid attendance status for break'
        });
      }

      const updatedAttendance = await prisma.attendance.update({
        where: { id: attendance.id },
        data: {
          breakStart: today
        }
      });

      return res.json({
        success: true,
        data: { attendance: updatedAttendance }
      });
    } catch (error) {
      console.error('Start break error:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  // 休憩終了
  async endBreak(req: AuthenticatedRequest, res: Response) {
    try {
      const { employeeId } = req.params;
      const companyId = req.user!.companyId;

      const today = new Date();
      const dateOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());

      const attendance = await prisma.attendance.findUnique({
        where: {
          employeeId_date: {
            employeeId,
            date: dateOnly
          }
        }
      });

      if (!attendance || !attendance.breakStart) {
        return res.status(400).json({
          success: false,
          error: 'No active break found'
        });
      }

      const updatedAttendance = await prisma.attendance.update({
        where: { id: attendance.id },
        data: {
          breakEnd: today
        }
      });

      return res.json({
        success: true,
        data: { attendance: updatedAttendance }
      });
    } catch (error) {
      console.error('End break error:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  // 勤怠記録一覧取得
  async getAttendances(req: AuthenticatedRequest, res: Response) {
    try {
      const companyId = req.user!.companyId;
      const {
        employeeId,
        startDate,
        endDate,
        status,
        page = '1',
        limit = '10'
      } = req.query;

      const pageNum = parseInt(page as string);
      const limitNum = parseInt(limit as string);
      const offset = (pageNum - 1) * limitNum;

      const where: Prisma.AttendanceWhereInput = {
        companyId,
        ...(employeeId && { employeeId: employeeId as string }),
        ...(startDate && endDate && {
          date: {
            gte: new Date(startDate as string),
            lte: new Date(endDate as string)
          }
        }),
        ...(status && { status: status as AttendanceStatus })
      };

      const [attendances, total] = await Promise.all([
        prisma.attendance.findMany({
          where,
          include: {
            employee: {
              select: {
                id: true,
                employeeNumber: true,
                firstName: true,
                lastName: true,
                department: {
                  select: { name: true }
                },
                position: {
                  select: { name: true }
                }
              }
            }
          },
          orderBy: [
            { date: 'desc' },
            { clockIn: 'desc' }
          ],
          skip: offset,
          take: limitNum
        }),
        prisma.attendance.count({ where })
      ]);

      const totalPages = Math.ceil(total / limitNum);

      return res.json({
        success: true,
        data: {
          attendances,
          pagination: {
            page: pageNum,
            limit: limitNum,
            total,
            totalPages,
            hasNext: pageNum < totalPages,
            hasPrev: pageNum > 1
          }
        }
      });
    } catch (error) {
      console.error('Get attendances error:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  // 個別従業員の勤怠記録取得
  async getEmployeeAttendances(req: AuthenticatedRequest, res: Response) {
    try {
      const { employeeId } = req.params;
      const companyId = req.user!.companyId;
      const { startDate, endDate, year, month } = req.query;

      let dateFilter: Prisma.DateTimeFilter = {};

      if (startDate && endDate) {
        dateFilter = {
          gte: new Date(startDate as string),
          lte: new Date(endDate as string)
        };
      } else if (year && month) {
        const yearNum = parseInt(year as string);
        const monthNum = parseInt(month as string);
        const start = new Date(yearNum, monthNum - 1, 1);
        const end = new Date(yearNum, monthNum, 0);
        dateFilter = { gte: start, lte: end };
      }

      const attendances = await prisma.attendance.findMany({
        where: {
          employeeId,
          companyId,
          date: dateFilter
        },
        orderBy: { date: 'asc' }
      });

      // 統計計算
      const stats = {
        totalWorkDays: attendances.filter(a => a.status === AttendanceStatus.PRESENT).length,
        totalWorkHours: attendances.reduce((sum, a) => sum + (a.workHours ? parseFloat(a.workHours.toString()) : 0), 0),
        totalOvertimeHours: attendances.reduce((sum, a) => sum + (a.overtimeHours ? parseFloat(a.overtimeHours.toString()) : 0), 0),
        absentDays: attendances.filter(a => a.status === AttendanceStatus.ABSENT).length,
        lateDays: attendances.filter(a => a.status === AttendanceStatus.LATE).length,
        earlyLeaveDays: attendances.filter(a => a.status === AttendanceStatus.EARLY_LEAVE).length
      };

      return res.json({
        success: true,
        data: {
          attendances,
          stats
        }
      });
    } catch (error) {
      console.error('Get employee attendances error:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  // 勤怠記録更新（管理者用）
  async updateAttendance(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const companyId = req.user!.companyId;
      const {
        clockIn,
        clockOut,
        breakStart,
        breakEnd,
        status,
        attendanceType,
        remarks
      } = req.body;

      // 権限確認
      if (!['ADMIN', 'HR_STAFF', 'MANAGER'].includes(req.user!.role)) {
        return res.status(403).json({
          success: false,
          error: 'Insufficient permissions'
        });
      }

      const attendance = await prisma.attendance.findFirst({
        where: { id, companyId }
      });

      if (!attendance) {
        return res.status(404).json({
          success: false,
          error: 'Attendance record not found'
        });
      }

      // 労働時間の再計算
      let workHours = 0;
      let overtimeHours = 0;
      let nightHours = 0;
      let holidayHours = 0;

      if (clockIn && clockOut) {
        workHours = calculateWorkHours(
          new Date(clockIn),
          new Date(clockOut),
          breakStart ? new Date(breakStart) : undefined,
          breakEnd ? new Date(breakEnd) : undefined
        );
        overtimeHours = calculateOvertimeHours(workHours);
        nightHours = calculateNightHours(new Date(clockIn), new Date(clockOut));
        holidayHours = calculateHolidayHours(new Date(clockIn), new Date(clockOut), attendance.date);
      }

      const updatedAttendance = await prisma.attendance.update({
        where: { id },
        data: {
          ...(clockIn && { clockIn: new Date(clockIn) }),
          ...(clockOut && { clockOut: new Date(clockOut) }),
          ...(breakStart && { breakStart: new Date(breakStart) }),
          ...(breakEnd && { breakEnd: new Date(breakEnd) }),
          ...(status && { status }),
          ...(attendanceType && { attendanceType }),
          ...(remarks !== undefined && { remarks }),
          ...(workHours && { workHours: new Prisma.Decimal(workHours.toString()) }),
          ...(overtimeHours && { overtimeHours: new Prisma.Decimal(overtimeHours.toString()) }),
          ...(nightHours && { nightHours: new Prisma.Decimal(nightHours.toString()) }),
          ...(holidayHours && { holidayHours: new Prisma.Decimal(holidayHours.toString()) }),
          approvedBy: req.user!.id,
          approvedAt: new Date()
        }
      });

      return res.json({
        success: true,
        data: { attendance: updatedAttendance }
      });
    } catch (error) {
      console.error('Update attendance error:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  // 今日の勤怠状況
  async getTodayStatus(req: AuthenticatedRequest, res: Response) {
    try {
      const { employeeId } = req.params;
      const companyId = req.user!.companyId;

      const today = new Date();
      const dateOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());

      const attendance = await prisma.attendance.findUnique({
        where: {
          employeeId_date: {
            employeeId,
            date: dateOnly
          }
        }
      });

      return res.json({
        success: true,
        data: { attendance }
      });
    } catch (error) {
      console.error('Get today status error:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  // 勤怠サマリー（月次統計）
  async getMonthlySummary(req: AuthenticatedRequest, res: Response) {
    try {
      const companyId = req.user!.companyId;
      const { year, month } = req.query;

      const yearNum = parseInt(year as string) || new Date().getFullYear();
      const monthNum = parseInt(month as string) || new Date().getMonth() + 1;

      const startDate = new Date(yearNum, monthNum - 1, 1);
      const endDate = new Date(yearNum, monthNum, 0);

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
              id: true,
              employeeNumber: true,
              firstName: true,
              lastName: true,
              department: { select: { name: true } }
            }
          }
        }
      });

      // 部署別統計
      const departmentStats = attendances.reduce((acc, attendance) => {
        const deptName = attendance.employee.department?.name || '未配属';
        if (!acc[deptName]) {
          acc[deptName] = {
            totalWorkHours: 0,
            totalOvertimeHours: 0,
            presentDays: 0,
            absentDays: 0,
            employeeCount: new Set()
          };
        }

        acc[deptName].totalWorkHours += attendance.workHours ? parseFloat(attendance.workHours.toString()) : 0;
        acc[deptName].totalOvertimeHours += attendance.overtimeHours ? parseFloat(attendance.overtimeHours.toString()) : 0;
        acc[deptName].employeeCount.add(attendance.employee.id);

        if (attendance.status === AttendanceStatus.PRESENT) {
          acc[deptName].presentDays++;
        } else if (attendance.status === AttendanceStatus.ABSENT) {
          acc[deptName].absentDays++;
        }

        return acc;
      }, {} as Record<string, any>);

      // Set を数値に変換
      Object.keys(departmentStats).forEach(dept => {
        departmentStats[dept].employeeCount = departmentStats[dept].employeeCount.size;
      });

      // 全体統計
      const totalStats = {
        totalEmployees: new Set(attendances.map(a => a.employee.id)).size,
        totalWorkHours: attendances.reduce((sum, a) => sum + (a.workHours ? parseFloat(a.workHours.toString()) : 0), 0),
        totalOvertimeHours: attendances.reduce((sum, a) => sum + (a.overtimeHours ? parseFloat(a.overtimeHours.toString()) : 0), 0),
        averageWorkHours: 0,
        attendanceRate: 0
      };

      if (totalStats.totalEmployees > 0) {
        totalStats.averageWorkHours = totalStats.totalWorkHours / totalStats.totalEmployees;
        const totalWorkingDays = attendances.filter(a => a.status === AttendanceStatus.PRESENT).length;
        const totalPossibleDays = attendances.length;
        totalStats.attendanceRate = totalPossibleDays > 0 ? (totalWorkingDays / totalPossibleDays) * 100 : 0;
      }

      return res.json({
        success: true,
        data: {
          period: { year: yearNum, month: monthNum },
          totalStats,
          departmentStats
        }
      });
    } catch (error) {
      console.error('Get monthly summary error:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }
}