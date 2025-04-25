import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import { PrismaClient } from '@prisma/client';
import passport from 'passport';
import routes from './routes';
import pg from 'pg';
import pgSession from 'connect-pg-simple';
import session from 'express-session';
import './strategies/local.strategy';

dotenv.config();

const pool = new pg.Pool({
  user: process.env.USER_POSTGRES,
  host: process.env.DATABASE_HOST,
  database: process.env.DATABASE_NAME,
  password: process.env.DATABASE_PASSWORD,
  port: 5432,
});

const PgSession = pgSession(session);

const app = express();

export const prisma = new PrismaClient();

const PORT = process.env.PORT || 3434;

async function main() {
  app.use(
    cors({
      credentials: true,
      origin: process.env.ORIGIN_PRODUCTION_URL,
      optionsSuccessStatus: 200,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    })
  );
  app.use(helmet());
  app.use(compression());
  app.use(cookieParser());
  app.use(express.json());
  app.use(
    session({
      store: new PgSession({
        pool: pool,
        tableName: 'user_sessions',
      }),
      secret: process.env.SESSION_SECRET || 'secret',
      resave: false,
      saveUninitialized: false,
      cookie: {
        httpOnly: true,
        maxAge: 30 * 24 * 60 * 60 * 1000,
        secure: false,
        sameSite: 'lax',
      },
    })
  );
  app.use(passport.initialize());
  app.use(passport.session());

  app.use(routes);

  app.get('/', (req: Request, res: Response) => {
    res.send('Hello World!');
  });

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    await prisma.$disconnect();
    process.exit(1);
  });
