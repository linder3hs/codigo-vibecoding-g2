import { useState, useEffect } from "react";
import type { Task, TaskFormData } from "../types/Task";
import {
  getTasks,
  createTask,
  updateTask,
  deleteTask,
  toggleTaskComplete,
} from "../services/api";
import { TaskCard } from "../components/TaskCard";
import { TaskDialog } from "../components/TaskDialog";

export function Home() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<"create" | "edit" | "delete">(
    "create",
  );
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  const fetchTasks = async () => {
    try {
      const data = await getTasks();
      setTasks(data);
    } catch (err) {
      setError("Error al cargar las tareas");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchTasks();
  }, []);

  const handleCreate = () => {
    setDialogMode("create");
    setSelectedTask(null);
    setDialogOpen(true);
  };

  const handleEdit = (task: Task) => {
    setDialogMode("edit");
    setSelectedTask(task);
    setDialogOpen(true);
  };

  const handleDelete = (task: Task) => {
    setDialogMode("delete");
    setSelectedTask(task);
    setDialogOpen(true);
  };

  const handleSubmit = async (data: TaskFormData) => {
    try {
      if (dialogMode === "create") {
        await createTask(data);
      } else if (dialogMode === "edit" && selectedTask) {
        await updateTask(selectedTask.id, data);
      }
      setDialogOpen(false);
      fetchTasks();
    } catch (err) {
      console.error("Error saving task:", err);
    }
  };

  const handleDeleteConfirm = async () => {
    if (selectedTask) {
      try {
        await deleteTask(selectedTask.id);
        setDialogOpen(false);
        fetchTasks();
      } catch (err) {
        console.error("Error deleting task:", err);
      }
    }
  };

  const handleToggle = async (id: string, completed: boolean) => {
    try {
      await toggleTaskComplete(id, completed);
      fetchTasks();
    } catch (err) {
      console.error("Error toggling task:", err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Cargando tareas...</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Mis Tareas</h1>
        <button
          onClick={handleCreate}
          className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
          Nueva Tarea
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg">
          {error}
        </div>
      )}

      {tasks.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 mb-4">No hay tareas aún</p>
          <button
            onClick={handleCreate}
            className="text-blue-500 hover:text-blue-600"
          >
            Crea tu primera tarea
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onToggle={handleToggle}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      <TaskDialog
        isOpen={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSubmit={handleSubmit}
        onDelete={handleDeleteConfirm}
        task={selectedTask}
        mode={dialogMode}
      />
    </div>
  );
}
