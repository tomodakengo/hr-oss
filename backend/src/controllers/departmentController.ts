import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import { prisma } from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { AuthenticatedRequest } from '../middleware/auth';

export const getDepartments = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return next(new AppError('認証が必要です', 401));
    }

    const { includeInactive = false } = req.query;

    const where: any = {
      companyId: req.user.companyId,
    };

    if (!includeInactive) {
      where.isActive = true;
    }

    const departments = await prisma.department.findMany({
      where,
      include: {
        parent: {
          select: {
            id: true,
            name: true,
          },
        },
        children: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            employees: {
              where: {
                status: 'ACTIVE',
              },
            },
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });

    res.status(200).json({
      success: true,
      data: { departments },
    });
  } catch (error) {
    next(error);
  }
};

export const getDepartment = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return next(new AppError('認証が必要です', 401));
    }

    const { id } = req.params;

    const department = await prisma.department.findFirst({
      where: {
        id,
        companyId: req.user.companyId,
      },
      include: {
        parent: {
          select: {
            id: true,
            name: true,
          },
        },
        children: {
          select: {
            id: true,
            name: true,
          },
        },
        employees: {
          where: {
            status: 'ACTIVE',
          },
          select: {
            id: true,
            firstName: true,
            lastName: true,
            employeeNumber: true,
            position: {
              select: {
                name: true,
              },
            },
          },
        },
        positions: {
          where: {
            isActive: true,
          },
          select: {
            id: true,
            name: true,
            level: true,
          },
        },
      },
    });

    if (!department) {
      return next(new AppError('部署が見つかりません', 404));
    }

    res.status(200).json({
      success: true,
      data: { department },
    });
  } catch (error) {
    next(error);
  }
};

export const createDepartment = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new AppError('入力データが無効です', 400));
    }

    if (!req.user) {
      return next(new AppError('認証が必要です', 401));
    }

    const { name, description, parentId } = req.body;

    // Check if department name already exists in the same company
    const existingDepartment = await prisma.department.findFirst({
      where: {
        name,
        companyId: req.user.companyId,
      },
    });

    if (existingDepartment) {
      return next(new AppError('同じ名前の部署が既に存在します', 409));
    }

    // Verify parent department if provided
    if (parentId) {
      const parentDepartment = await prisma.department.findFirst({
        where: {
          id: parentId,
          companyId: req.user.companyId,
        },
      });

      if (!parentDepartment) {
        return next(new AppError('指定された親部署が見つかりません', 404));
      }
    }

    const department = await prisma.department.create({
      data: {
        name,
        description,
        parentId,
        companyId: req.user.companyId,
      },
      include: {
        parent: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    res.status(201).json({
      success: true,
      message: '部署が正常に作成されました',
      data: { department },
    });
  } catch (error) {
    next(error);
  }
};

export const updateDepartment = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new AppError('入力データが無効です', 400));
    }

    if (!req.user) {
      return next(new AppError('認証が必要です', 401));
    }

    const { id } = req.params;
    const { name, description, parentId, isActive } = req.body;

    // Check if department exists
    const existingDepartment = await prisma.department.findFirst({
      where: {
        id,
        companyId: req.user.companyId,
      },
    });

    if (!existingDepartment) {
      return next(new AppError('部署が見つかりません', 404));
    }

    // Check for duplicate name (excluding current department)
    if (name && name !== existingDepartment.name) {
      const duplicateDepartment = await prisma.department.findFirst({
        where: {
          name,
          companyId: req.user.companyId,
          id: { not: id },
        },
      });

      if (duplicateDepartment) {
        return next(new AppError('同じ名前の部署が既に存在します', 409));
      }
    }

    // Verify parent department if provided
    if (parentId) {
      const parentDepartment = await prisma.department.findFirst({
        where: {
          id: parentId,
          companyId: req.user.companyId,
        },
      });

      if (!parentDepartment) {
        return next(new AppError('指定された親部署が見つかりません', 404));
      }

      // Prevent circular reference
      if (parentId === id) {
        return next(new AppError('部署を自分自身の親部署に設定することはできません', 400));
      }
    }

    const department = await prisma.department.update({
      where: { id },
      data: {
        name,
        description,
        parentId,
        isActive,
      },
      include: {
        parent: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    res.status(200).json({
      success: true,
      message: '部署情報が更新されました',
      data: { department },
    });
  } catch (error) {
    next(error);
  }
};

export const deleteDepartment = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return next(new AppError('認証が必要です', 401));
    }

    const { id } = req.params;

    // Check if department exists
    const existingDepartment = await prisma.department.findFirst({
      where: {
        id,
        companyId: req.user.companyId,
      },
    });

    if (!existingDepartment) {
      return next(new AppError('部署が見つかりません', 404));
    }

    // Check if department has active employees
    const employeeCount = await prisma.employee.count({
      where: {
        departmentId: id,
        status: 'ACTIVE',
      },
    });

    if (employeeCount > 0) {
      return next(new AppError('アクティブな従業員が所属している部署は削除できません', 400));
    }

    // Check if department has child departments
    const childCount = await prisma.department.count({
      where: {
        parentId: id,
        isActive: true,
      },
    });

    if (childCount > 0) {
      return next(new AppError('子部署が存在する部署は削除できません', 400));
    }

    // Soft delete by setting isActive to false
    await prisma.department.update({
      where: { id },
      data: { isActive: false },
    });

    res.status(200).json({
      success: true,
      message: '部署が削除されました',
    });
  } catch (error) {
    next(error);
  }
};