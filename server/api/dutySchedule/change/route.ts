import { Hono } from "hono";
import {
    createDutySwapController,
    getMyDutySwapController,
    getAllDutySwapController,
    approveDutySwapController,
    rejectDutySwapController,
    cancelDutySwapController,
    swapDutyScheduleController,
} from "./controller";

const changeRoute = new Hono();

// 创建换班申请
changeRoute.post("/", createDutySwapController);

// 查询我的换班申请 (需要传递 user_no 参数)
changeRoute.get("/my", getMyDutySwapController);

// 查询所有换班申请
changeRoute.get("/all", getAllDutySwapController);

// 同意换班申请
changeRoute.patch("/:id/approve", approveDutySwapController);

// 拒绝换班申请
changeRoute.patch("/:id/reject", rejectDutySwapController);

// 取消换班申请
changeRoute.patch("/:id/cancel", cancelDutySwapController);

// 互换值班(实际操作值班表)
changeRoute.post("/swap", swapDutyScheduleController);

export default changeRoute;
