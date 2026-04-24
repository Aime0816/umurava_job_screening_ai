import { logger } from '../config/logger';
import { User } from '../models/user.model';

export const ensureAdminUser = async (): Promise<void> => {
  const email = (process.env.ADMIN_EMAIL || 'admin@umurava.local').trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD || 'Admin@12345';
  const name = process.env.ADMIN_NAME || 'System Administrator';
  const existingUser = await User.findOne({ email }).lean();

  if (existingUser) return;

  await User.create({
    name,
    email,
    password,
    role: 'admin',
  });

  logger.warn(`Bootstrap admin created: ${email}`);
  logger.warn('Change the bootstrap password after first login.');
};
