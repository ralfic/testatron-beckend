import bcrypt from 'bcrypt';

const saltRound = 10;

export const hashPassword = async (password: string) => {
  const salt = await bcrypt.genSalt(saltRound);
  return await bcrypt.hash(password, salt);
};

export const comparePassword = async (password: string, hash: string) => {
  return await bcrypt.compare(password, hash);
};
