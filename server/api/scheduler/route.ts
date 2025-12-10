import { Hono } from "hono";

import { authMiddleware } from "../../middleware/auth";
import {
    createTaskController,
    deleteTaskController,
    listTasksController,
    triggerTaskController,
    updateTaskController,
} from "./controller";

const schedulerRoute = new Hono();

// 所有定时任务管理接口需要登录
schedulerRoute.use("*", authMiddleware);

schedulerRoute.get("/task", listTasksController);
schedulerRoute.post("/task", createTaskController);
schedulerRoute.put("/task/:id", updateTaskController);
schedulerRoute.delete("/task/:id", deleteTaskController);
schedulerRoute.post("/task/:id/trigger", triggerTaskController);

export default schedulerRoute;
