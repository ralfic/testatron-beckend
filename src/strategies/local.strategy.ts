import passport from 'passport';
import { Strategy } from 'passport-local';
import { prisma } from '../server';
import { comparePassword } from '../utils/helpers';

passport.serializeUser((user: any, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id: number, done) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id },
    });
    if (!user) {
      throw new Error('Something went wrong');
    }
    done(null, user);
  } catch (error) {}
});

passport.use(
  new Strategy(
    {
      usernameField: 'email',
      passwordField: 'password',
    },
    async (email: string, password: string, done) => {
      try {
        const user = await prisma.user.findUnique({
          where: { email },
        });
        if (!user) {
          throw new Error('Something went wrong');
        }
        const isValid = await comparePassword(password, user.password);
        if (!isValid) {
          throw new Error('Password or email is incorrect');
        }
        return done(null, user);
      } catch (error) {
        console.log(error);
        done(error);
      }
    }
  )
);
