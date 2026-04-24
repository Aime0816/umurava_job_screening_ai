import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthenticatedRequest extends Request {
  user?: {
    sub: string;
    email: string;
    role: 'admin';
  };
}

export const authenticate = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const token = authHeader.slice(7);
  const secret = process.env.JWT_SECRET || 'changeme_in_production';

  const payload = jwt.verify(token, secret) as AuthenticatedRequest['user'];
  req.user = payload;
  next();
};
