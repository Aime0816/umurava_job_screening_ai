import { NextFunction, Request, Response } from 'express';
import jwt, { SignOptions } from 'jsonwebtoken';
import { User } from '../models/user.model';
import { AuthenticatedRequest } from '../middleware/auth';

const jwtExpiresIn = ((process.env.JWT_EXPIRES_IN || '7d') as SignOptions['expiresIn']);

const signToken = (user: { _id: unknown; email: string; role: 'admin' }) =>
  jwt.sign(
    {
      sub: String(user._id),
      email: user.email,
      role: user.role,
    },
    process.env.JWT_SECRET || 'changeme_in_production',
    { expiresIn: jwtExpiresIn }
  );

export class AuthController {
  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const email = String(req.body.email || '').trim().toLowerCase();
      const password = String(req.body.password || '');

      const user = await User.findOne({ email }).select('+password');
      if (!user) return res.status(401).json({ error: 'Invalid email or password' });

      const isValid = await user.comparePassword(password);
      if (!isValid) return res.status(401).json({ error: 'Invalid email or password' });

      user.lastLoginAt = new Date();
      await user.save();

      const token = signToken({ _id: user._id, email: user.email, role: user.role });

      res.json({
        success: true,
        data: {
          token,
          user: {
            id: String(user._id),
            name: user.name,
            email: user.email,
            role: user.role,
            lastLoginAt: user.lastLoginAt,
          },
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async me(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const user = await User.findById(req.user?.sub).lean();
      if (!user) return res.status(404).json({ error: 'User not found' });

      res.json({
        success: true,
        data: {
          id: String(user._id),
          name: user.name,
          email: user.email,
          role: user.role,
          lastLoginAt: user.lastLoginAt,
        },
      });
    } catch (error) {
      next(error);
    }
  }
}

export const authController = new AuthController();
