import { PrismaClient, Role } from '@prisma/client';
import { hashPassword } from '../src/utils/helpers';
import { mathTest } from './constants';

const prisma = new PrismaClient();
async function up() {
  const teacher = await prisma.user.create({
    data: {
      email: 'teacher@test.com',
      password: await hashPassword('123456789'),
      role: Role.TEACHER,
      fullName: 'Teacher',
    },
  });
  await prisma.user.create({
    data: {
      email: 'student@test.com',
      password: await hashPassword('123456789'),
      role: Role.STUDENT,
      fullName: 'Student',
    },
  });

  await prisma.test.create({
    data: mathTest(teacher.id),
  });
}
async function down() {
  await prisma.$executeRaw`TRUNCATE TABLE "users" RESTART IDENTITY CASCADE`;
  await prisma.$executeRaw`TRUNCATE TABLE "user_sessions" RESTART IDENTITY CASCADE`;
  await prisma.$executeRaw`TRUNCATE TABLE "tests" RESTART IDENTITY CASCADE`;
  await prisma.$executeRaw`TRUNCATE TABLE "test_sessions" RESTART IDENTITY CASCADE`;
  await prisma.$executeRaw`TRUNCATE TABLE "questions" RESTART IDENTITY CASCADE`;
  await prisma.$executeRaw`TRUNCATE TABLE "answers" RESTART IDENTITY CASCADE`;
  await prisma.$executeRaw`TRUNCATE TABLE "test_results" RESTART IDENTITY CASCADE`;
}

async function main() {
  try {
    await down();
    await up();
  } catch (e) {
    console.error(e);
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
