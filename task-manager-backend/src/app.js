import express from "express";
import cors from "cors";
import taskRoutes from "./tasks/index.js";
import userRoutes from "./users/index.js";
import { swaggerSpec } from "./docs/swagger.js";
import swaggerUi from "swagger-ui-express";

const app = express();

app.use(cors());
app.use(express.json());

app.use("/tasks", taskRoutes);
app.use("/users", userRoutes);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.get("/", (req, res) => {
  res.send("Task Manager API is running. Docs at /api-docs");
});

export default app;
