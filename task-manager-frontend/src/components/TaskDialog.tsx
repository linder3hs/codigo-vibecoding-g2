import { useState, useEffect } from "react";
import type { Task, TaskFormData } from "../types/Task";

interface TaskDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: TaskFormData) => void;
  onDelete?: () => void;
  task?: Task | null;
  mode: "create" | "edit" | "delete";
}

export function TaskDialog({
  isOpen,
  onClose,
  onSubmit,
  onDelete,
  task,
  mode,
}: TaskDialogProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    if (task && (mode === "edit" || mode === "delete")) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setTitle(task.title);
      setDescription(task.description);
    } else {
      setTitle("");
      setDescription("");
    }
  }, [task, mode, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === "delete") {
      onDelete?.();
    } else {
      onSubmit({ title, description });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md p-6">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 text-gray-400 hover:text-gray-600"
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
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>

        <h2 className="text-xl font-semibold text-gray-800 mb-4">
          {mode === "create" && "Nueva Tarea"}
          {mode === "edit" && "Editar Tarea"}
          {mode === "delete" && "Eliminar Tarea"}
        </h2>

        {mode === "delete" ? (
          <div>
            <p className="text-gray-600 mb-6">
              ¿Estás seguro de que deseas eliminar la tarea{" "}
              <strong>"{task?.title}"</strong>? Esta acción no se puede
              deshacer.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={onDelete}
                className="px-4 py-2 bg-red-500 text-white hover:bg-red-600 rounded-lg transition-colors"
              >
                Eliminar
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Título
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Ingresa el título"
                required
              />
            </div>
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Descripción
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                placeholder="Ingresa la descripción"
                rows={3}
              />
            </div>
            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-500 text-white hover:bg-blue-600 rounded-lg transition-colors"
              >
                {mode === "create" ? "Crear" : "Guardar"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
