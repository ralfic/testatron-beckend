import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import compression from 'compression';
import session from 'express-session';
import cookieParser from 'cookie-parser';
import { PrismaClient } from '@prisma/client';
import passport from 'passport';
import './strategies/local.strategy';
import routes from './routes';

dotenv.config();

const app = express();

export const prisma = new PrismaClient();

const PORT = process.env.PORT || 3434;

async function main() {
  app.use(cors());
  app.use(helmet());
  app.use(compression());
  app.use(cookieParser());
  app.use(
    session({
      secret: process.env.SESSION_SECRET || 'secret',
      resave: false,
      saveUninitialized: false,
      cookie: { maxAge: 24 * 60 * 60 * 1000 },
    })
  );
  app.use(express.json());
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
