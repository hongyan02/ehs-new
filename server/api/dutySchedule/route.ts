import { Hono } from "hono";
import {
  createDutyScheduleController,
  deleteDutyScheduleController,
  getDutyScheduleByIdController,
  getDutyScheduleController,
  updateDutyScheduleController,
} from "./controller";
import changeRoute from "./change/route";
import { authMiddleware, requirePermission } from "../../middleware/auth";

const dutyScheduleRoute = new Hono();

// 全局应用认证中间件 - 所有路由都需要登录
dutyScheduleRoute.use("*", authMiddleware);

// 查询操作 - 只需要登录即可
dutyScheduleRoute.get("/", getDutyScheduleController);
dutyScheduleRoute.get("/:id", getDutyScheduleByIdController);

// 修改操作 - 需要 DUTY 权限
dutyScheduleRoute.post("/", requirePermission("DUTY"), createDutyScheduleController);
dutyScheduleRoute.delete("/:id", requirePermission("DUTY"), deleteDutyScheduleController);
dutyScheduleRoute.put("/:id", requirePermission("DUTY"), updateDutyScheduleController);
// 换班申请相关路由
dutyScheduleRoute.route("/change", changeRoute);

export default dutyScheduleRoute;
