import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import type { Task, TaskFormData } from "../types/Task";
import {
  getTask,
  updateTask,
  deleteTask,
  toggleTaskComplete,
} from "../services/api";
import { TaskDialog } from "../components/TaskDialog";

export function TaskDetail() {
  const { id } = useParams<{ id: string }>();
  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<"edit" | "delete">("edit");

  useEffect(() => {
    if (id) {
      // eslint-disable-next-line react-hooks/immutability
      fetchTask();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchTask = async () => {
    try {
      const data = await getTask(id!);
      setTask(data);
    } catch (err) {
      setError("Error al cargar la tarea");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    setDialogMode("edit");
    setDialogOpen(true);
  };

  const handleDelete = () => {
    setDialogMode("delete");
    setDialogOpen(true);
  };

  const handleSubmit = async (data: TaskFormData) => {
    try {
      await updateTask(id!, data);
      setDialogOpen(false);
      fetchTask();
    } catch (err) {
      console.error("Error updating task:", err);
    }
  };

  const handleDeleteConfirm = async () => {
    try {
      await deleteTask(id!);
      window.location.href = "/";
    } catch (err) {
      console.error("Error deleting task:", err);
    }
  };

  const handleToggle = async () => {
    if (task) {
      try {
        await toggleTaskComplete(task.id, !task.completed);
        fetchTask();
      } catch (err) {
        console.error("Error toggling task:", err);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Cargando tarea...</div>
      </div>
    );
  }

  if (error || !task) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center py-12">
          <p className="text-gray-500 mb-4">{error || "Tarea no encontrada"}</p>
          <Link to="/" className="text-blue-500 hover:text-blue-600">
            Volver al inicio
          </Link>
        </div>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("es-ES", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <Link
        to="/"
        className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-6"
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
            d="M15 19l-7-7 7-7"
          />
        </svg>
        Volver
      </Link>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex items-start gap-3 flex-1">
            <button
              onClick={handleToggle}
              className={`mt-1 w-6 h-6 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-colors ${
                task.completed
                  ? "bg-green-500 border-green-500"
                  : "border-gray-300 hover:border-green-400"
              }`}
            >
              {task.completed && (
                <svg
                  className="w-4 h-4 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={3}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              )}
            </button>
            <h1
              className={`text-2xl font-bold ${task.completed ? "text-gray-400 line-through" : "text-gray-800"}`}
            >
              {task.title}
            </h1>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleEdit}
              className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              title="Editar"
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
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                />
              </svg>
            </button>
            <button
              onClick={handleDelete}
              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              title="Eliminar"
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
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
            </button>
          </div>
        </div>

        {task.description && (
          <div className="mb-6 pl-9">
            <p
              className={`text-gray-600 whitespace-pre-wrap ${task.completed ? "text-gray-400" : ""}`}
            >
              {task.description}
            </p>
          </div>
        )}

        <div className="pl-9 border-t border-gray-100 pt-4">
          <p className="text-sm text-gray-400">
            Creada el {formatDate(task.created_at)}
          </p>
        </div>
      </div>

      <TaskDialog
        isOpen={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSubmit={handleSubmit}
        onDelete={handleDeleteConfirm}
        task={task}
        mode={dialogMode}
      />
    </div>
  );
}
