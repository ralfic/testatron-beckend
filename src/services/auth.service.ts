import { prisma } from '@/server';
import { hashPassword } from '@/utils/helpers';
import { RegisterSchema } from '@/validation/auth.dtos';

export const register = async (userData: RegisterSchema) => {
  const { email, password, firstName, lastName } = userData;
  try {
    const hashedPassword = await hashPassword(password);
    const user = await prisma.user.create({
      data: {
        email: email,
        password: hashedPassword,
        firstName: firstName,
        lastName: lastName,
      },
    });
    if (!user) {
      throw new Error('Something went wrong');
    }
    return user;
  } catch (error) {
    console.log(error);
  }
};
