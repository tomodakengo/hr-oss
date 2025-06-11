import { UserRole } from '@prisma/client';

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: UserRole;
        companyId: string;
        firstName: string;
        lastName: string;
      };
    }
  }
}

export {};