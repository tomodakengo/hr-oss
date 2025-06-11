import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import { prisma } from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { AuthenticatedRequest } from '../middleware/auth';

export const getPositions = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return next(new AppError('認証が必要です', 401));
    }

    const { departmentId, includeInactive = false } = req.query;

    const where: any = {
      companyId: req.user.companyId,
    };

    if (departmentId) {
      where.departmentId = departmentId;
    }

    if (!includeInactive) {
      where.isActive = true;
    }

    const positions = await prisma.position.findMany({
      where,
      include: {
        department: {
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
      orderBy: [
        { department: { name: 'asc' } },
        { level: 'desc' },
        { name: 'asc' },
      ],
    });

    res.status(200).json({
      success: true,
      data: { positions },
    });
  } catch (error) {
    next(error);
  }
};

export const getPosition = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return next(new AppError('認証が必要です', 401));
    }

    const { id } = req.params;

    const position = await prisma.position.findFirst({
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
        employees: {
          where: {
            status: 'ACTIVE',
          },
          select: {
            id: true,
            firstName: true,
            lastName: true,
            employeeNumber: true,
            email: true,
          },
        },
      },
    });

    if (!position) {
      return next(new AppError('役職が見つかりません', 404));
    }

    res.status(200).json({
      success: true,
      data: { position },
    });
  } catch (error) {
    next(error);
  }
};

export const createPosition = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new AppError('入力データが無効です', 400));
    }

    if (!req.user) {
      return next(new AppError('認証が必要です', 401));
    }

    const { name, description, level, baseSalary, departmentId } = req.body;

    // Verify department exists and belongs to the same company
    const department = await prisma.department.findFirst({
      where: {
        id: departmentId,
        companyId: req.user.companyId,
        isActive: true,
      },
    });

    if (!department) {
      return next(new AppError('指定された部署が見つかりません', 404));
    }

    // Check if position name already exists in the same department
    const existingPosition = await prisma.position.findFirst({
      where: {
        name,
        departmentId,
        companyId: req.user.companyId,
      },
    });

    if (existingPosition) {
      return next(new AppError('同じ部署に同じ名前の役職が既に存在します', 409));
    }

    const position = await prisma.position.create({
      data: {
        name,
        description,
        level,
        baseSalary: baseSalary ? parseFloat(baseSalary) : null,
        departmentId,
        companyId: req.user.companyId,
      },
      include: {
        department: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    res.status(201).json({
      success: true,
      message: '役職が正常に作成されました',
      data: { position },
    });
  } catch (error) {
    next(error);
  }
};

export const updatePosition = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new AppError('入力データが無効です', 400));
    }

    if (!req.user) {
      return next(new AppError('認証が必要です', 401));
    }

    const { id } = req.params;
    const { name, description, level, baseSalary, departmentId, isActive } = req.body;

    // Check if position exists
    const existingPosition = await prisma.position.findFirst({
      where: {
        id,
        companyId: req.user.companyId,
      },
    });

    if (!existingPosition) {
      return next(new AppError('役職が見つかりません', 404));
    }

    // Verify department if provided
    if (departmentId) {
      const department = await prisma.department.findFirst({
        where: {
          id: departmentId,
          companyId: req.user.companyId,
          isActive: true,
        },
      });

      if (!department) {
        return next(new AppError('指定された部署が見つかりません', 404));
      }
    }

    // Check for duplicate name in the same department (excluding current position)
    if (name && (name !== existingPosition.name || (departmentId && departmentId !== existingPosition.departmentId))) {
      const duplicatePosition = await prisma.position.findFirst({
        where: {
          name,
          departmentId: departmentId || existingPosition.departmentId,
          companyId: req.user.companyId,
          id: { not: id },
        },
      });

      if (duplicatePosition) {
        return next(new AppError('同じ部署に同じ名前の役職が既に存在します', 409));
      }
    }

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (level !== undefined) updateData.level = level;
    if (baseSalary !== undefined) updateData.baseSalary = baseSalary ? parseFloat(baseSalary) : null;
    if (departmentId !== undefined) updateData.departmentId = departmentId;
    if (isActive !== undefined) updateData.isActive = isActive;

    const position = await prisma.position.update({
      where: { id },
      data: updateData,
      include: {
        department: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    res.status(200).json({
      success: true,
      message: '役職情報が更新されました',
      data: { position },
    });
  } catch (error) {
    next(error);
  }
};

export const deletePosition = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return next(new AppError('認証が必要です', 401));
    }

    const { id } = req.params;

    // Check if position exists
    const existingPosition = await prisma.position.findFirst({
      where: {
        id,
        companyId: req.user.companyId,
      },
    });

    if (!existingPosition) {
      return next(new AppError('役職が見つかりません', 404));
    }

    // Check if position has active employees
    const employeeCount = await prisma.employee.count({
      where: {
        positionId: id,
        status: 'ACTIVE',
      },
    });

    if (employeeCount > 0) {
      return next(new AppError('アクティブな従業員が配属されている役職は削除できません', 400));
    }

    // Soft delete by setting isActive to false
    await prisma.position.update({
      where: { id },
      data: { isActive: false },
    });

    res.status(200).json({
      success: true,
      message: '役職が削除されました',
    });
  } catch (error) {
    next(error);
  }
};