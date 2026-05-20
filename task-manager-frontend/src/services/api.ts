import axios from "axios";
import type { Task, TaskFormData } from "../types/Task";
import type { AuthResponse } from "../types/User";

const api = axios.create({
  baseURL: "http://localhost:3000",
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers["Authorization"] = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export const loginUser = async (
  email: string,
  password: string
): Promise<AuthResponse> => {
  const response = await api.post("/users/login", { email, password });
  return response.data;
};

export const registerUser = async (
  name: string,
  lastname: string,
  email: string,
  password: string
): Promise<void> => {
  await api.post("/users/register", { name, lastname, email, password });
};

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
  data: Partial<TaskFormData>
): Promise<Task> => {
  const response = await api.put(`/tasks/${id}`, data);
  return response.data;
};

export const deleteTask = async (id: string): Promise<void> => {
  await api.delete(`/tasks/${id}`);
};

export const toggleTaskComplete = async (
  id: string,
  completed: boolean
): Promise<Task> => {
  const response = await api.put(`/tasks/${id}`, { completed });
  return response.data;
};
