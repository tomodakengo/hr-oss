import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/database';
import { AppError } from './errorHandler';
import { UserRole } from '@prisma/client';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: UserRole;
    companyId: string;
    firstName: string;
    lastName: string;
  };
}

export const authenticateToken = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return next(new AppError('アクセストークンが必要です', 401));
    }

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      return next(new AppError('JWT設定が正しくありません', 500));
    }

    // Verify token
    const decoded = jwt.verify(token, jwtSecret) as {
      userId: string;
      email: string;
      companyId: string;
      iat: number;
      exp: number;
    };

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        companyId: true,
        isActive: true,
        company: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!user) {
      return next(new AppError('ユーザーが見つかりません', 401));
    }

    if (!user.isActive) {
      return next(new AppError('アカウントが無効です', 401));
    }

    // Check if token company matches user company (security check)
    if (user.companyId !== decoded.companyId) {
      return next(new AppError('認証エラー：会社情報が一致しません', 401));
    }

    // Add user info to request
    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
      companyId: user.companyId,
      firstName: user.firstName,
      lastName: user.lastName,
    };

    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return next(new AppError('無効なトークンです', 401));
    }
    if (error instanceof jwt.TokenExpiredError) {
      return next(new AppError('トークンの有効期限が切れています', 401));
    }
    next(error);
  }
};

// Role-based access control middleware
export const requireRole = (...roles: UserRole[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError('認証が必要です', 401));
    }

    if (!roles.includes(req.user.role)) {
      return next(new AppError('この操作を実行する権限がありません', 403));
    }

    next();
  };
};

// Multi-tenant security middleware
export const requireSameCompany = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) {
    return next(new AppError('認証が必要です', 401));
  }

  // For admin users, allow cross-company access (if needed)
  if (req.user.role === UserRole.ADMIN) {
    return next();
  }

  // Check if the requested resource belongs to the same company
  const resourceCompanyId = req.params.companyId || req.body.companyId || req.query.companyId;
  
  if (resourceCompanyId && resourceCompanyId !== req.user.companyId) {
    return next(new AppError('他の会社のデータにはアクセスできません', 403));
  }

  next();
};

// Check if user can access employee data
export const canAccessEmployee = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      return next(new AppError('認証が必要です', 401));
    }

    const employeeId = req.params.employeeId || req.params.id;
    
    if (!employeeId) {
      return next();
    }

    // Admin and HR can access all employees in their company
    if (req.user.role === UserRole.ADMIN || req.user.role === UserRole.HR_STAFF) {
      return next();
    }

    // Managers can access employees in their department
    if (req.user.role === UserRole.MANAGER) {
      // TODO: Implement department-based access control
      return next();
    }

    // Employees can only access their own data
    if (req.user.role === UserRole.EMPLOYEE) {
      const employee = await prisma.employee.findFirst({
        where: {
          id: employeeId,
          email: req.user.email,
          companyId: req.user.companyId,
        },
      });

      if (!employee) {
        return next(new AppError('この従業員データにはアクセスできません', 403));
      }
    }

    next();
  } catch (error) {
    next(error);
  }
};