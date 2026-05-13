import prisma from '../lib/prisma.js';
import bcrypt from 'bcrypt';

const UserModel = {
  findByEmail: async (email) => {
    return await prisma.user.findUnique({ where: { email } });
  },

  register: async (data) => {
    const hashedPassword = await bcrypt.hash(data.password, 10);
    return await prisma.user.create({
      data: {
        name: data.name,
        lastname: data.lastname,
        email: data.email,
        password: hashedPassword,
      },
    });
  },

  login: async (email, password) => {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return null;
    
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) return null;
    
    return user;
  },
};

export default UserModel;