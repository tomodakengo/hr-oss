import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import { prisma } from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { AuthenticatedRequest } from '../middleware/auth';

export const getEmployees = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return next(new AppError('認証が必要です', 401));
    }

    const {
      page = 1,
      limit = 10,
      search,
      department,
      position,
      status = 'ACTIVE',
      sort = 'createdAt',
      order = 'desc'
    } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    // Build filter conditions
    const where: any = {
      companyId: req.user.companyId,
    };

    if (status) {
      where.status = status;
    }

    if (department) {
      where.departmentId = department;
    }

    if (position) {
      where.positionId = position;
    }

    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { employeeNumber: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Get employees with pagination
    const [employees, total] = await Promise.all([
      prisma.employee.findMany({
        where,
        include: {
          department: {
            select: {
              id: true,
              name: true,
            },
          },
          position: {
            select: {
              id: true,
              name: true,
              level: true,
            },
          },
        },
        orderBy: {
          [sort as string]: order,
        },
        skip,
        take: limitNum,
      }),
      prisma.employee.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limitNum);

    res.status(200).json({
      success: true,
      data: {
        employees,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages,
          hasNext: pageNum < totalPages,
          hasPrev: pageNum > 1,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getEmployee = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return next(new AppError('認証が必要です', 401));
    }

    const { id } = req.params;

    const employee = await prisma.employee.findFirst({
      where: {
        id,
        companyId: req.user.companyId,
      },
      include: {
        department: {
          select: {
            id: true,
            name: true,
            description: true,
          },
        },
        position: {
          select: {
            id: true,
            name: true,
            description: true,
            level: true,
            baseSalary: true,
          },
        },
        attendances: {
          take: 10,
          orderBy: {
            date: 'desc',
          },
          select: {
            id: true,
            date: true,
            clockIn: true,
            clockOut: true,
            workHours: true,
            status: true,
          },
        },
      },
    });

    if (!employee) {
      return next(new AppError('従業員が見つかりません', 404));
    }

    res.status(200).json({
      success: true,
      data: { employee },
    });
  } catch (error) {
    next(error);
  }
};

export const createEmployee = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new AppError('入力データが無効です', 400));
    }

    if (!req.user) {
      return next(new AppError('認証が必要です', 401));
    }

    const {
      employeeNumber,
      email,
      firstName,
      lastName,
      firstNameKana,
      lastNameKana,
      birthDate,
      gender,
      phone,
      mobile,
      address,
      postalCode,
      emergencyContact,
      emergencyPhone,
      hireDate,
      employmentType,
      departmentId,
      positionId,
      bankAccount,
      bankBranch,
      bankName,
    } = req.body;

    // Check if employee number or email already exists
    const existingEmployee = await prisma.employee.findFirst({
      where: {
        companyId: req.user.companyId,
        OR: [
          { employeeNumber },
          { email },
        ],
      },
    });

    if (existingEmployee) {
      return next(new AppError('社員番号またはメールアドレスが既に使用されています', 409));
    }

    // Verify department and position belong to the same company
    if (departmentId) {
      const department = await prisma.department.findFirst({
        where: { id: departmentId, companyId: req.user.companyId },
      });
      if (!department) {
        return next(new AppError('指定された部署が見つかりません', 404));
      }
    }

    if (positionId) {
      const position = await prisma.position.findFirst({
        where: { id: positionId, companyId: req.user.companyId },
      });
      if (!position) {
        return next(new AppError('指定された役職が見つかりません', 404));
      }
    }

    const employee = await prisma.employee.create({
      data: {
        employeeNumber,
        email,
        firstName,
        lastName,
        firstNameKana,
        lastNameKana,
        birthDate: birthDate ? new Date(birthDate) : null,
        gender,
        phone,
        mobile,
        address,
        postalCode,
        emergencyContact,
        emergencyPhone,
        hireDate: new Date(hireDate),
        employmentType,
        departmentId,
        positionId,
        bankAccount,
        bankBranch,
        bankName,
        companyId: req.user.companyId,
      },
      include: {
        department: {
          select: {
            id: true,
            name: true,
          },
        },
        position: {
          select: {
            id: true,
            name: true,
            level: true,
          },
        },
      },
    });

    res.status(201).json({
      success: true,
      message: '従業員が正常に登録されました',
      data: { employee },
    });
  } catch (error) {
    next(error);
  }
};

export const updateEmployee = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new AppError('入力データが無効です', 400));
    }

    if (!req.user) {
      return next(new AppError('認証が必要です', 401));
    }

    const { id } = req.params;
    const updateData = req.body;

    // Check if employee exists and belongs to the same company
    const existingEmployee = await prisma.employee.findFirst({
      where: {
        id,
        companyId: req.user.companyId,
      },
    });

    if (!existingEmployee) {
      return next(new AppError('従業員が見つかりません', 404));
    }

    // Check for duplicate employee number or email (excluding current employee)
    if (updateData.employeeNumber || updateData.email) {
      const duplicateEmployee = await prisma.employee.findFirst({
        where: {
          companyId: req.user.companyId,
          id: { not: id },
          OR: [
            updateData.employeeNumber ? { employeeNumber: updateData.employeeNumber } : {},
            updateData.email ? { email: updateData.email } : {},
          ].filter(condition => Object.keys(condition).length > 0),
        },
      });

      if (duplicateEmployee) {
        return next(new AppError('社員番号またはメールアドレスが既に使用されています', 409));
      }
    }

    // Convert date strings to Date objects
    if (updateData.birthDate) {
      updateData.birthDate = new Date(updateData.birthDate);
    }
    if (updateData.hireDate) {
      updateData.hireDate = new Date(updateData.hireDate);
    }
    if (updateData.resignationDate) {
      updateData.resignationDate = new Date(updateData.resignationDate);
    }

    const employee = await prisma.employee.update({
      where: { id },
      data: updateData,
      include: {
        department: {
          select: {
            id: true,
            name: true,
          },
        },
        position: {
          select: {
            id: true,
            name: true,
            level: true,
          },
        },
      },
    });

    res.status(200).json({
      success: true,
      message: '従業員情報が更新されました',
      data: { employee },
    });
  } catch (error) {
    next(error);
  }
};

export const deleteEmployee = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return next(new AppError('認証が必要です', 401));
    }

    const { id } = req.params;

    // Check if employee exists and belongs to the same company
    const existingEmployee = await prisma.employee.findFirst({
      where: {
        id,
        companyId: req.user.companyId,
      },
    });

    if (!existingEmployee) {
      return next(new AppError('従業員が見つかりません', 404));
    }

    // Soft delete by updating status to RESIGNED
    await prisma.employee.update({
      where: { id },
      data: {
        status: 'RESIGNED',
        resignationDate: new Date(),
      },
    });

    res.status(200).json({
      success: true,
      message: '従業員が退職処理されました',
    });
  } catch (error) {
    next(error);
  }
};

export const getEmployeeStats = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return next(new AppError('認証が必要です', 401));
    }

    const [
      totalEmployees,
      activeEmployees,
      departmentStats,
      employmentTypeStats,
      recentHires,
    ] = await Promise.all([
      prisma.employee.count({
        where: { companyId: req.user.companyId },
      }),
      prisma.employee.count({
        where: {
          companyId: req.user.companyId,
          status: 'ACTIVE',
        },
      }),
      prisma.employee.groupBy({
        by: ['departmentId'],
        where: {
          companyId: req.user.companyId,
          status: 'ACTIVE',
        },
        _count: {
          id: true,
        },
      }),
      prisma.employee.groupBy({
        by: ['employmentType'],
        where: {
          companyId: req.user.companyId,
          status: 'ACTIVE',
        },
        _count: {
          id: true,
        },
      }),
      prisma.employee.findMany({
        where: {
          companyId: req.user.companyId,
          hireDate: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
          },
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          hireDate: true,
          department: {
            select: {
              name: true,
            },
          },
        },
        orderBy: {
          hireDate: 'desc',
        },
        take: 5,
      }),
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalEmployees,
        activeEmployees,
        departmentStats,
        employmentTypeStats,
        recentHires,
      },
    });
  } catch (error) {
    next(error);
  }
};