import axios from "axios";
import type { Task, TaskFormData } from "../types/Task";

const api = axios.create({
  baseURL: "http://localhost:3000",
});

export const getTasks = async (): Promise<Task[]> => {
  const response = await api.get("/tasks");
  return response.data;
};

export const getTask = async (id: string): Promise<Task> => {
  const response = await api.get(`/tasks/${id}`);
  return response.data;
};

export const createTask = async (data: TaskFormData): Promise<Task> => {
  const response = await api.post("/tasks", data);
  return response.data;
};

export const updateTask = async (
  id: string,
  data: Partial<TaskFormData>,
): Promise<Task> => {
  const response = await api.put(`/tasks/${id}`, data);
  return response.data;
};

export const deleteTask = async (id: string): Promise<void> => {
  await api.delete(`/tasks/${id}`);
};

export const toggleTaskComplete = async (
  id: string,
  completed: boolean,
): Promise<Task> => {
  const response = await api.put(`/tasks/${id}`, { completed });
  return response.data;
};
