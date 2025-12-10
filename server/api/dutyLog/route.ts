import { Hono } from "hono";
import {
    getDutyLogsController,
    getDutyLogByIdController,
    createDutyLogController,
    updateDutyLogController,
    deleteDutyLogController,
    dutyLogInspectionController,
} from "./controller";

const dutyLogRoute = new Hono();

// 获取值班日志列表（支持分页和过滤）
dutyLogRoute.get("/", getDutyLogsController);

// 查询未按时填写的值班日志
dutyLogRoute.post("/Inspection", dutyLogInspectionController);

// 根据ID获取值班日志
dutyLogRoute.get("/:id", getDutyLogByIdController);

// 创建值班日志
dutyLogRoute.post("/", createDutyLogController);

// 更新值班日志
dutyLogRoute.put("/:id", updateDutyLogController);

// 删除值班日志
dutyLogRoute.delete("/:id", deleteDutyLogController);

export default dutyLogRoute;
