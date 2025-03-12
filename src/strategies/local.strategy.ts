import { Strategy } from 'passport-local';
import { prisma } from '../server';
import passport from 'passport';
import { comparePassword } from '@/utils/helpers';

passport.use(
  new Strategy({ usernameField: 'email' }, async (email, password, done) => {
    try {
      const user = await prisma.user.findUnique({ where: { email: email } });
      if (!user) {
        return done(null, false, { message: 'User not found' });
      }
      const isPasswordValid = await comparePassword(password, user.password);
      if (!isPasswordValid) {
        return done(null, false, { message: 'Invalid password' });
      }

      return done(null, user);
    } catch (error) {
      return done(error);
    }
  })
);

passport.serializeUser((user: any, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id: number, done) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: id },
      omit: { password: true, createdAt: true, updatedAt: true },
    });
    done(null, user);
  } catch (error) {
    done(error);
  }
});
