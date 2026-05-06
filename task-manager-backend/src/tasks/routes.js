import express from "express";
import TaskController from "./controller.js";

const router = express.Router();

router.get("/", TaskController.getAll);
router.post("/", TaskController.create);
router.get("/:id", TaskController.getById);
router.put("/:id", TaskController.update);
router.delete("/:id", TaskController.delete);

export default router;
