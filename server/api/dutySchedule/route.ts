import { Hono } from "hono";
import {
  createDutyScheduleController,
  deleteDutyScheduleController,
  getDutyScheduleByIdController,
  getDutyScheduleController,
  updateDutyScheduleController,
} from "./controller";
import changeRoute from "./change/route";

const dutyScheduleRoute = new Hono();

dutyScheduleRoute.get("/", getDutyScheduleController);
dutyScheduleRoute.get("/:id", getDutyScheduleByIdController);
dutyScheduleRoute.post("/", createDutyScheduleController);
dutyScheduleRoute.put("/:id", updateDutyScheduleController);
dutyScheduleRoute.delete("/:id", deleteDutyScheduleController);

// 换班申请相关路由
dutyScheduleRoute.route("/change", changeRoute);

export default dutyScheduleRoute;
