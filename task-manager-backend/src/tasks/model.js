import { v4 as uuidv4 } from 'uuid';

const tasks = [];

const TaskModel = {
  getAll: () => tasks,

  getById: (id) => tasks.find(task => task.id === id),

  create: (data) => {
    const newTask = {
      id: uuidv4(),
      title: data.title,
      description: data.description || '',
      completed: data.completed || false,
      created_at: new Date().toISOString()
    };
    tasks.push(newTask);
    return newTask;
  },

  update: (id, data) => {
    const index = tasks.findIndex(task => task.id === id);
    if (index === -1) return null;

    tasks[index] = {
      ...tasks[index],
      ...data,
      id: tasks[index].id,
      created_at: tasks[index].created_at
    };
    return tasks[index];
  },

  delete: (id) => {
    const index = tasks.findIndex(task => task.id === id);
    if (index === -1) return false;
    tasks.splice(index, 1);
    return true;
  }
};

export default TaskModel;