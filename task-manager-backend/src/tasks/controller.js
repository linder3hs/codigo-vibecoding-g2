import TaskModel from "./model.js";

const TaskController = {
  getAll: async (req, res) => {
    try {
      const tasks = await TaskModel.getAll(req.userId);
      res.json(tasks);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  getById: async (req, res) => {
    try {
      const task = await TaskModel.getById(req.params.id, req.userId);
      if (!task) {
        return res.status(404).json({ error: "Task not found" });
      }
      res.json(task);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  create: async (req, res) => {
    try {
      const newTask = await TaskModel.create(req.body, req.userId);
      res.status(201).json(newTask);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  update: async (req, res) => {
    try {
      const result = await TaskModel.update(req.params.id, req.body, req.userId);
      if (result.count === 0) {
        return res.status(404).json({ error: "Task not found" });
      }
      const task = await TaskModel.getById(req.params.id, req.userId);
      res.json(task);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  delete: async (req, res) => {
    try {
      const result = await TaskModel.delete(req.params.id, req.userId);
      if (result.count === 0) {
        return res.status(404).json({ error: "Task not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
};

export default TaskController;