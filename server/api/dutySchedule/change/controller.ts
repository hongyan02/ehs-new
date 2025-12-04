import { Context } from "hono";
import { z } from "zod";
import {
  createDutySwap,
  cancelDutySwap,
  getDutySwapById,
  getMyDutySwap,
  getAllDutySwap,
  updateDutySwapStatus,
  swapDutySchedule,
} from "./service";

const dateStringSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "日期格式应为YYYY-MM-DD");

const optionalText = z
  .string()
  .optional()
  .transform((val) => (val?.trim() ? val.trim() : undefined));

// 创建换班申请的schema
const createDutySwapSchema = z.object({
  from_name: z.string().min(1, "换班人姓名不能为空"),
  from_no: z.string().min(1, "换班人工号不能为空"),
  from_position: z.string().min(1, "换班人职位不能为空"),
  from_date: dateStringSchema,
  from_shift: z
    .union([z.number(), z.string()])
    .transform((val) => (typeof val === "string" ? parseInt(val, 10) : val))
    .refine((val) => val === 0 || val === 1, {
      message: "换班人班次必须为0(白班)或1(夜班)",
    }),
  to_name: z.string().min(1, "被换人姓名不能为空"),
  to_no: z.string().min(1, "被换人工号不能为空"),
  to_position: z.string().min(1, "被换人职位不能为空"),
  to_date: dateStringSchema,
  to_shift: z
    .union([z.number(), z.string()])
    .transform((val) => (typeof val === "string" ? parseInt(val, 10) : val))
    .refine((val) => val === 0 || val === 1, {
      message: "被换人班次必须为0(白班)或1(夜班)",
    }),
  reason: optionalText,
});

// 查询我的换班申请的schema
const getMyDutySwapSchema = z.object({
  user_no: z.string().min(1, "用户工号不能为空"),
  status: z
    .string()
    .optional()
    .transform((val) => {
      if (!val) return undefined;
      const parsed = parseInt(val, 10);
      return Number.isNaN(parsed) ? undefined : parsed;
    })
    .refine(
      (val) =>
        val === undefined || val === 0 || val === 1 || val === 2 || val === 3,
      {
        message: "状态必须为0、1、2或3",
      },
    ),
});

// 查询所有换班申请的schema
const getAllDutySwapSchema = z.object({
  status: z
    .string()
    .optional()
    .transform((val) => {
      if (!val) return undefined;
      const parsed = parseInt(val, 10);
      return Number.isNaN(parsed) ? undefined : parsed;
    })
    .refine(
      (val) =>
        val === undefined || val === 0 || val === 1 || val === 2 || val === 3,
      {
        message: "状态必须为0、1、2或3",
      },
    ),
});

// 更新状态的schema
const updateStatusSchema = z.object({
  status: z
    .union([z.number(), z.string()])
    .transform((val) => (typeof val === "string" ? parseInt(val, 10) : val))
    .refine((val) => val === 1 || val === 2, {
      message: "状态必须为1(同意)或2(拒绝)",
    }),
});

// 获取当前时间的辅助函数
const getCurrentDateTime = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  const seconds = String(now.getSeconds()).padStart(2, "0");
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
};

// 创建换班申请
export const createDutySwapController = async (c: Context) => {
  try {
    const body = await c.req.json();
    const validated = createDutySwapSchema.parse(body);
    const currentTime = getCurrentDateTime();

    const payload = {
      ...validated,
      reason: validated.reason,
      created_at: currentTime,
      updated_at: currentTime,
    };

    const result = await createDutySwap(payload);
    return c.json({ success: true, data: result, message: "创建成功" }, 201);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json({ success: false, message: error.issues }, 400);
    }

    console.error("createDutySwapController error:", error);
    return c.json({ success: false, message: "服务器错误" }, 500);
  }
};

// 查询我的换班申请
export const getMyDutySwapController = async (c: Context) => {
  try {
    const params = getMyDutySwapSchema.parse(c.req.query());
    const result = await getMyDutySwap({
      userNo: params.user_no,
      status: params.status,
    });

    return c.json({ success: true, data: result });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json({ success: false, message: error.issues }, 400);
    }

    console.error("getMyDutySwapController error:", error);
    return c.json({ success: false, message: "服务器错误" }, 500);
  }
};

// 查询所有换班申请
export const getAllDutySwapController = async (c: Context) => {
  try {
    const params = getAllDutySwapSchema.parse(c.req.query());
    const result = await getAllDutySwap({
      status: params.status,
    });

    return c.json({ success: true, data: result });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json({ success: false, message: error.issues }, 400);
    }

    console.error("getAllDutySwapController error:", error);
    return c.json({ success: false, message: "服务器错误" }, 500);
  }
};

// 同意换班申请
export const approveDutySwapController = async (c: Context) => {
  try {
    const id = parseInt(c.req.param("id"));
    if (Number.isNaN(id)) {
      return c.json({ success: false, message: "无效的ID" }, 400);
    }

    const existing = await getDutySwapById(id);
    if (!existing) {
      return c.json({ success: false, message: "未找到对应换班申请" }, 404);
    }

    if (existing.status !== 0) {
      return c.json(
        { success: false, message: "该申请已处理,无法再次操作" },
        400,
      );
    }

    const currentTime = getCurrentDateTime();
    const result = await updateDutySwapStatus({
      id,
      status: 1,
      updated_at: currentTime,
    });

    return c.json({ success: true, data: result, message: "已同意" });
  } catch (error) {
    console.error("approveDutySwapController error:", error);
    return c.json({ success: false, message: "服务器错误" }, 500);
  }
};

// 拒绝换班申请
export const rejectDutySwapController = async (c: Context) => {
  try {
    const id = parseInt(c.req.param("id"));
    if (Number.isNaN(id)) {
      return c.json({ success: false, message: "无效的ID" }, 400);
    }

    const existing = await getDutySwapById(id);
    if (!existing) {
      return c.json({ success: false, message: "未找到对应换班申请" }, 404);
    }

    if (existing.status !== 0) {
      return c.json(
        { success: false, message: "该申请已处理,无法再次操作" },
        400,
      );
    }

    const currentTime = getCurrentDateTime();
    const result = await updateDutySwapStatus({
      id,
      status: 2,
      updated_at: currentTime,
    });

    return c.json({ success: true, data: result, message: "已拒绝" });
  } catch (error) {
    console.error("rejectDutySwapController error:", error);
    return c.json({ success: false, message: "服务器错误" }, 500);
  }
};

// 删除换班申请
// 取消换班申请
export const cancelDutySwapController = async (c: Context) => {
  try {
    const id = parseInt(c.req.param("id"));
    if (Number.isNaN(id)) {
      return c.json({ success: false, message: "无效的ID" }, 400);
    }

    const existing = await getDutySwapById(id);
    if (!existing) {
      return c.json({ success: false, message: "未找到对应换班申请" }, 404);
    }

    if (existing.status !== 0) {
      return c.json({ success: false, message: "只能取消申请中的换班" }, 400);
    }

    const currentTime = getCurrentDateTime();
    const result = await cancelDutySwap(id, currentTime);
    return c.json({ success: true, data: result, message: "已取消" });
  } catch (error) {
    console.error("cancelDutySwapController error:", error);
    return c.json({ success: false, message: "服务器错误" }, 500);
  }
};

// 互换值班的schema
const swapDutyScheduleSchema = z.object({
  from_no: z.string().min(1, "换班人工号不能为空"),
  from_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "日期格式应为YYYY-MM-DD"),
  to_no: z.string().min(1, "被换人工号不能为空"),
  to_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "日期格式应为YYYY-MM-DD"),
  shift: z
    .union([z.number(), z.string()])
    .transform((val) => (typeof val === "string" ? parseInt(val, 10) : val))
    .refine((val) => val === 0 || val === 1, {
      message: "班次必须为0(白班)或1(夜班)",
    }),
});

// 互换值班控制器
export const swapDutyScheduleController = async (c: Context) => {
  try {
    const body = await c.req.json();
    const validated = swapDutyScheduleSchema.parse(body);

    const result = await swapDutySchedule({
      from_no: validated.from_no,
      from_date: validated.from_date,
      to_no: validated.to_no,
      to_date: validated.to_date,
      shift: validated.shift,
    });

    return c.json({
      success: true,
      data: result,
      message: "值班互换成功",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json({ success: false, message: error.issues }, 400);
    }

    // 处理业务逻辑错误(如未找到值班记录)
    if (error instanceof Error) {
      return c.json({ success: false, message: error.message }, 400);
    }

    console.error("swapDutyScheduleController error:", error);
    return c.json({ success: false, message: "服务器错误" }, 500);
  }
};
