import TaskModel from "./model.js";

const TaskController = {
  getAll: (req, res) => {
    const tasks = TaskModel.getAll();
    res.json(tasks);
  },

  getById: (req, res) => {
    const task = TaskModel.getById(req.params.id);
    if (!task) {
      return res.status(404).json({ error: "Task not found" });
    }
    res.json(task);
  },

  create: (req, res) => {
    const newTask = TaskModel.create(req.body);
    res.status(201).json(newTask);
  },

  update: (req, res) => {
    const task = TaskModel.update(req.params.id, req.body);
    if (!task) {
      return res.status(404).json({ error: "Task not found" });
    }
    res.json(task);
  },

  delete: (req, res) => {
    const deleted = TaskModel.delete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: "Task not found" });
    }
    res.status(204).send();
  },
};

export default TaskController;
