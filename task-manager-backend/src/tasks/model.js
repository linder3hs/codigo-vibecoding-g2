import prisma from '../lib/prisma.js'

const TaskModel = {
  getAll: async (userId) => {
    return await prisma.task.findMany({ where: { userId } })
  },

  getById: async (id, userId) => {
    return await prisma.task.findFirst({ where: { id, userId } })
  },

  create: async (data, userId) => {
    return await prisma.task.create({
      data: {
        title: data.title,
        description: data.description || '',
        completed: data.completed || false,
        userId,
      },
    })
  },

  update: async (id, data, userId) => {
    return await prisma.task.updateMany({
      where: { id, userId },
      data: {
        ...(data.title !== undefined && { title: data.title }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.completed !== undefined && { completed: data.completed }),
      },
    })
  },

  delete: async (id, userId) => {
    return await prisma.task.deleteMany({ where: { id, userId } })
  },
}

export default TaskModel