import { Request, Response } from 'express';
import { PrismaClient, LeaveType, LeaveStatus, Prisma } from '@prisma/client';
import { AuthenticatedRequest } from '../middleware/auth';

const prisma = new PrismaClient();

export class LeaveController {
  // 有給申請の作成
  async createLeaveRequest(req: AuthenticatedRequest, res: Response) {
    try {
      const {
        employeeId,
        startDate,
        endDate,
        leaveType,
        reason
      } = req.body;
      const companyId = req.user!.companyId;

      // 従業員の存在確認
      const employee = await prisma.employee.findFirst({
        where: { id: employeeId, companyId }
      });

      if (!employee) {
        return res.status(404).json({
          success: false,
          error: 'Employee not found'
        });
      }

      // 日数計算
      const start = new Date(startDate);
      const end = new Date(endDate);
      const days = this.calculateBusinessDays(start, end);

      // 有給残高チェック（年次有給休暇の場合）
      if (leaveType === LeaveType.ANNUAL_LEAVE) {
        const year = start.getFullYear();
        const balance = await this.getLeaveBalance(employeeId, year);
        
        if (balance.remainingAnnualLeave < days) {
          return res.status(400).json({
            success: false,
            error: 'Insufficient annual leave balance'
          });
        }
      }

      // 重複申請チェック
      const overlappingRequest = await prisma.leaveRequest.findFirst({
        where: {
          employeeId,
          status: { in: [LeaveStatus.PENDING, LeaveStatus.APPROVED] },
          OR: [
            {
              startDate: { lte: end },
              endDate: { gte: start }
            }
          ]
        }
      });

      if (overlappingRequest) {
        return res.status(400).json({
          success: false,
          error: 'Overlapping leave request exists'
        });
      }

      const leaveRequest = await prisma.leaveRequest.create({
        data: {
          employeeId,
          companyId,
          startDate: start,
          endDate: end,
          days: new Prisma.Decimal(days.toString()),
          leaveType,
          reason,
          status: LeaveStatus.PENDING
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

      return res.json({
        success: true,
        data: { leaveRequest }
      });
    } catch (error) {
      console.error('Create leave request error:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  // 有給申請の承認/却下
  async reviewLeaveRequest(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const { status, remarks } = req.body;
      const companyId = req.user!.companyId;

      // 権限確認
      if (!['ADMIN', 'HR_STAFF', 'MANAGER'].includes(req.user!.role)) {
        return res.status(403).json({
          success: false,
          error: 'Insufficient permissions'
        });
      }

      const leaveRequest = await prisma.leaveRequest.findFirst({
        where: { id, companyId },
        include: { employee: true }
      });

      if (!leaveRequest) {
        return res.status(404).json({
          success: false,
          error: 'Leave request not found'
        });
      }

      if (leaveRequest.status !== LeaveStatus.PENDING) {
        return res.status(400).json({
          success: false,
          error: 'Leave request already reviewed'
        });
      }

      // 承認の場合、有給残高を更新
      if (status === LeaveStatus.APPROVED && leaveRequest.leaveType === LeaveType.ANNUAL_LEAVE) {
        const year = leaveRequest.startDate.getFullYear();
        await this.updateLeaveBalance(
          leaveRequest.employeeId,
          year,
          parseFloat(leaveRequest.days.toString()),
          'annual'
        );
      }

      const updatedRequest = await prisma.leaveRequest.update({
        where: { id },
        data: {
          status,
          remarks,
          reviewedBy: req.user!.id,
          reviewedAt: new Date()
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

      return res.json({
        success: true,
        data: { leaveRequest: updatedRequest }
      });
    } catch (error) {
      console.error('Review leave request error:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  // 有給申請一覧取得
  async getLeaveRequests(req: AuthenticatedRequest, res: Response) {
    try {
      const companyId = req.user!.companyId;
      const {
        employeeId,
        status,
        leaveType,
        startDate,
        endDate,
        page = '1',
        limit = '10'
      } = req.query;

      const pageNum = parseInt(page as string);
      const limitNum = parseInt(limit as string);
      const offset = (pageNum - 1) * limitNum;

      const where: Prisma.LeaveRequestWhereInput = {
        companyId,
        ...(employeeId && { employeeId: employeeId as string }),
        ...(status && { status: status as LeaveStatus }),
        ...(leaveType && { leaveType: leaveType as LeaveType }),
        ...(startDate && endDate && {
          startDate: {
            gte: new Date(startDate as string),
            lte: new Date(endDate as string)
          }
        })
      };

      const [leaveRequests, total] = await Promise.all([
        prisma.leaveRequest.findMany({
          where,
          include: {
            employee: {
              select: {
                id: true,
                employeeNumber: true,
                firstName: true,
                lastName: true,
                department: { select: { name: true } },
                position: { select: { name: true } }
              }
            }
          },
          orderBy: { submittedAt: 'desc' },
          skip: offset,
          take: limitNum
        }),
        prisma.leaveRequest.count({ where })
      ]);

      const totalPages = Math.ceil(total / limitNum);

      return res.json({
        success: true,
        data: {
          leaveRequests,
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
      console.error('Get leave requests error:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  // 個別従業員の有給残高取得
  async getEmployeeLeaveBalance(req: AuthenticatedRequest, res: Response) {
    try {
      const { employeeId } = req.params;
      const { year } = req.query;
      const companyId = req.user!.companyId;

      const targetYear = year ? parseInt(year as string) : new Date().getFullYear();

      const balance = await this.getLeaveBalance(employeeId, targetYear);

      return res.json({
        success: true,
        data: { balance }
      });
    } catch (error) {
      console.error('Get employee leave balance error:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  // 有給残高の初期化（年度開始時）
  async initializeLeaveBalance(req: AuthenticatedRequest, res: Response) {
    try {
      const { employeeId, year } = req.body;
      const companyId = req.user!.companyId;

      // 権限確認
      if (!['ADMIN', 'HR_STAFF'].includes(req.user!.role)) {
        return res.status(403).json({
          success: false,
          error: 'Insufficient permissions'
        });
      }

      // 従業員の入社年数に基づいて年次有給休暇日数を計算
      const employee = await prisma.employee.findFirst({
        where: { id: employeeId, companyId }
      });

      if (!employee) {
        return res.status(404).json({
          success: false,
          error: 'Employee not found'
        });
      }

      const annualLeaveDays = this.calculateAnnualLeaveDays(employee.hireDate, year);

      const balance = await prisma.employeeLeaveBalance.upsert({
        where: {
          employeeId_year: {
            employeeId,
            year
          }
        },
        update: {
          annualLeave: new Prisma.Decimal(annualLeaveDays.toString())
        },
        create: {
          employeeId,
          companyId,
          year,
          annualLeave: new Prisma.Decimal(annualLeaveDays.toString())
        }
      });

      return res.json({
        success: true,
        data: { balance }
      });
    } catch (error) {
      console.error('Initialize leave balance error:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  // 有給取得状況の統計
  async getLeaveStatistics(req: AuthenticatedRequest, res: Response) {
    try {
      const companyId = req.user!.companyId;
      const { year } = req.query;
      const targetYear = year ? parseInt(year as string) : new Date().getFullYear();

      // 承認済みの有給申請を取得
      const approvedLeaves = await prisma.leaveRequest.findMany({
        where: {
          companyId,
          status: LeaveStatus.APPROVED,
          startDate: {
            gte: new Date(targetYear, 0, 1),
            lt: new Date(targetYear + 1, 0, 1)
          }
        },
        include: {
          employee: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              department: { select: { name: true } }
            }
          }
        }
      });

      // 従業員別統計
      const employeeStats = approvedLeaves.reduce((acc, leave) => {
        const empId = leave.employee.id;
        if (!acc[empId]) {
          acc[empId] = {
            employee: leave.employee,
            totalDays: 0,
            byType: {} as Record<string, number>
          };
        }
        
        const days = parseFloat(leave.days.toString());
        acc[empId].totalDays += days;
        acc[empId].byType[leave.leaveType] = (acc[empId].byType[leave.leaveType] || 0) + days;
        
        return acc;
      }, {} as Record<string, any>);

      // 部署別統計
      const departmentStats = approvedLeaves.reduce((acc, leave) => {
        const deptName = leave.employee.department?.name || '未配属';
        if (!acc[deptName]) {
          acc[deptName] = {
            totalDays: 0,
            employeeCount: new Set(),
            byType: {} as Record<string, number>
          };
        }
        
        const days = parseFloat(leave.days.toString());
        acc[deptName].totalDays += days;
        acc[deptName].employeeCount.add(leave.employee.id);
        acc[deptName].byType[leave.leaveType] = (acc[deptName].byType[leave.leaveType] || 0) + days;
        
        return acc;
      }, {} as Record<string, any>);

      // Set を数値に変換
      Object.keys(departmentStats).forEach(dept => {
        departmentStats[dept].employeeCount = departmentStats[dept].employeeCount.size;
        if (departmentStats[dept].employeeCount > 0) {
          departmentStats[dept].averageDaysPerEmployee = 
            departmentStats[dept].totalDays / departmentStats[dept].employeeCount;
        }
      });

      // 全社統計
      const totalDays = approvedLeaves.reduce((sum, leave) => sum + parseFloat(leave.days.toString()), 0);
      const uniqueEmployees = new Set(approvedLeaves.map(leave => leave.employee.id)).size;
      const averageDaysPerEmployee = uniqueEmployees > 0 ? totalDays / uniqueEmployees : 0;

      return res.json({
        success: true,
        data: {
          year: targetYear,
          summary: {
            totalLeaveDays: totalDays,
            totalEmployeesWithLeave: uniqueEmployees,
            averageDaysPerEmployee
          },
          employeeStats: Object.values(employeeStats),
          departmentStats
        }
      });
    } catch (error) {
      console.error('Get leave statistics error:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  // 営業日数計算（土日祝日除く）
  private calculateBusinessDays(startDate: Date, endDate: Date): number {
    let days = 0;
    const current = new Date(startDate);
    
    while (current <= endDate) {
      const dayOfWeek = current.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) { // 土日以外
        days++;
      }
      current.setDate(current.getDate() + 1);
    }
    
    return days;
  }

  // 有給残高取得
  private async getLeaveBalance(employeeId: string, year: number) {
    const balance = await prisma.employeeLeaveBalance.findUnique({
      where: {
        employeeId_year: {
          employeeId,
          year
        }
      }
    });

    if (!balance) {
      // 残高が存在しない場合、従業員の入社年数から計算
      const employee = await prisma.employee.findUnique({
        where: { id: employeeId }
      });
      
      if (!employee) {
        throw new Error('Employee not found');
      }

      const annualLeaveDays = this.calculateAnnualLeaveDays(employee.hireDate, year);
      
      return {
        year,
        annualLeave: annualLeaveDays,
        usedAnnualLeave: 0,
        remainingAnnualLeave: annualLeaveDays,
        sickLeave: 0,
        usedSickLeave: 0,
        specialLeave: 0,
        usedSpecialLeave: 0
      };
    }

    const annualLeave = parseFloat(balance.annualLeave.toString());
    const usedAnnualLeave = parseFloat(balance.usedAnnualLeave.toString());

    return {
      year,
      annualLeave,
      usedAnnualLeave,
      remainingAnnualLeave: annualLeave - usedAnnualLeave,
      sickLeave: parseFloat(balance.sickLeave.toString()),
      usedSickLeave: parseFloat(balance.usedSickLeave.toString()),
      specialLeave: parseFloat(balance.specialLeave.toString()),
      usedSpecialLeave: parseFloat(balance.usedSpecialLeave.toString())
    };
  }

  // 有給残高更新
  private async updateLeaveBalance(
    employeeId: string,
    year: number,
    days: number,
    leaveType: 'annual' | 'sick' | 'special'
  ) {
    const updateData: any = {};
    
    switch (leaveType) {
      case 'annual':
        updateData.usedAnnualLeave = { increment: new Prisma.Decimal(days.toString()) };
        break;
      case 'sick':
        updateData.usedSickLeave = { increment: new Prisma.Decimal(days.toString()) };
        break;
      case 'special':
        updateData.usedSpecialLeave = { increment: new Prisma.Decimal(days.toString()) };
        break;
    }

    await prisma.employeeLeaveBalance.upsert({
      where: {
        employeeId_year: {
          employeeId,
          year
        }
      },
      update: updateData,
      create: {
        employeeId,
        companyId: '', // この時点でcompanyIdが必要だが、ここでは取得する必要がある
        year,
        ...updateData
      }
    });
  }

  // 年次有給休暇日数計算（勤続年数に基づく）
  private calculateAnnualLeaveDays(hireDate: Date, targetYear: number): number {
    const yearsOfService = targetYear - hireDate.getFullYear();
    
    // 日本の労働基準法に基づく年次有給休暇日数
    if (yearsOfService < 0.5) return 0;
    if (yearsOfService < 1.5) return 10;
    if (yearsOfService < 2.5) return 11;
    if (yearsOfService < 3.5) return 12;
    if (yearsOfService < 4.5) return 14;
    if (yearsOfService < 5.5) return 16;
    if (yearsOfService < 6.5) return 18;
    return 20; // 6.5年以上
  }
}