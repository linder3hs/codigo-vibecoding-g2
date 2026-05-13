import prisma from '../lib/prisma.js'

const TaskModel = {
  getAll: async () => {
    return await prisma.task.findMany()
  },

  getById: async (id) => {
    return await prisma.task.findUnique({ where: { id } })
  },

  create: async (data) => {
    return await prisma.task.create({
      data: {
        title: data.title,
        description: data.description || '',
        completed: data.completed || false,
      },
    })
  },

  update: async (id, data) => {
    return await prisma.task.update({
      where: { id },
      data: {
        ...(data.title !== undefined && { title: data.title }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.completed !== undefined && { completed: data.completed }),
      },
    })
  },

  delete: async (id) => {
    return await prisma.task.delete({ where: { id } })
  },
}

export default TaskModel