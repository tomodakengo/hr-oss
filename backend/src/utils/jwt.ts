import jwt from 'jsonwebtoken';
import { UserRole } from '@prisma/client';

export interface JwtPayload {
  userId: string;
  email: string;
  companyId: string;
  role: UserRole;
}

export const generateToken = (payload: JwtPayload): string => {
  const jwtSecret = process.env.JWT_SECRET;
  const jwtExpire = process.env.JWT_EXPIRE || '30d';

  if (!jwtSecret) {
    throw new Error('JWT_SECRET is not defined');
  }

  return jwt.sign(payload as any, jwtSecret, {
    expiresIn: jwtExpire || '30d',
  } as any);
};

export const generateRefreshToken = (payload: JwtPayload): string => {
  const jwtSecret = process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET;

  if (!jwtSecret) {
    throw new Error('JWT_REFRESH_SECRET is not defined');
  }

  return jwt.sign(payload as any, jwtSecret, {
    expiresIn: '7d',
  } as any);
};

export const verifyToken = (token: string): JwtPayload => {
  const jwtSecret = process.env.JWT_SECRET;

  if (!jwtSecret) {
    throw new Error('JWT_SECRET is not defined');
  }

  return jwt.verify(token, jwtSecret) as JwtPayload;
};

export const verifyRefreshToken = (token: string): JwtPayload => {
  const jwtSecret = process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET;

  if (!jwtSecret) {
    throw new Error('JWT_REFRESH_SECRET is not defined');
  }

  return jwt.verify(token, jwtSecret) as JwtPayload;
};