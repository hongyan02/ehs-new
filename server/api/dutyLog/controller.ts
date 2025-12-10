import { Context } from "hono";
import { z } from "zod";
import {
    getDutyLogs,
    getDutyLogById,
    createDutyLog,
    updateDutyLog,
    deleteDutyLog,
    getMissingDutyLogs,
} from "./services";

// 查询参数校验
const getDutyLogsSchema = z.object({
    page: z.string().optional().transform((val) => (val ? parseInt(val) : 1)),
    pageSize: z
        .string()
        .optional()
        .transform((val) => (val ? parseInt(val) : 10)),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    shift: z
        .string()
        .optional()
        .transform((val) => (val ? parseInt(val) : undefined)),
});

// 创建值班日志参数校验
const createDutyLogSchema = z.object({
    name: z.string().min(1, "姓名不能为空"),
    no: z.string().min(1, "工号不能为空"),
    date: z.string().min(1, "日期不能为空"),
    shift: z.number().min(0).max(1, "班次必须为0或1"),
    log: z.string().min(1, "日志内容不能为空"),
    todo: z.string().optional(),
});

// 更新值班日志参数校验
const updateDutyLogSchema = z.object({
    name: z.string().optional(),
    no: z.string().optional(),
    date: z.string().optional(),
    shift: z.number().min(0).max(1).optional(),
    log: z.string().optional(),
    todo: z.string().optional(),
});

// 未填写日志筛查参数校验
const dutyLogInspectionSchema = z
    .object({
        startDate: z.string().min(1, "开始日期不能为空"),
        endDate: z.string().min(1, "结束日期不能为空"),
    })
    .refine(
        (data) => data.startDate <= data.endDate,
        "开始日期不能大于结束日期"
    );

/**
 * 获取值班日志列表
 */
export const getDutyLogsController = async (c: Context) => {
    try {
        const query = c.req.query();
        const params = getDutyLogsSchema.parse(query);
        const result = await getDutyLogs(params);
        return c.json({ success: true, data: result });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return c.json({ success: false, message: error.issues }, 400);
        }
        console.error("getDutyLogsController error:", error);
        return c.json({ success: false, message: "服务器错误" }, 500);
    }
};

/**
 * 根据ID获取值班日志
 */
export const getDutyLogByIdController = async (c: Context) => {
    try {
        const id = parseInt(c.req.param("id"));
        if (isNaN(id)) {
            return c.json({ success: false, message: "无效的ID" }, 400);
        }
        const result = await getDutyLogById(id);
        if (!result) {
            return c.json({ success: false, message: "未找到该日志" }, 404);
        }
        return c.json({ success: true, data: result });
    } catch (error) {
        return c.json({ success: false, message: "服务器错误" }, 500);
    }
};

/**
 * 创建值班日志
 */
export const createDutyLogController = async (c: Context) => {
    try {
        const body = await c.req.json();
        const validatedData = createDutyLogSchema.parse(body);

        // 添加时间戳
        const now = new Date().toISOString().replace("T", " ").substring(0, 19);
        const result = await createDutyLog({
            ...validatedData,
            createTime: now,
            updateTime: now,
        });

        return c.json({ success: true, data: result }, 201);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return c.json({ success: false, message: error.issues }, 400);
        }
        return c.json({ success: false, message: "服务器错误" }, 500);
    }
};

/**
 * 更新值班日志
 */
export const updateDutyLogController = async (c: Context) => {
    try {
        const id = parseInt(c.req.param("id"));
        if (isNaN(id)) {
            return c.json({ success: false, message: "无效的ID" }, 400);
        }

        const body = await c.req.json();
        const validatedData = updateDutyLogSchema.parse(body);

        // 先检查是否存在
        const existing = await getDutyLogById(id);
        if (!existing) {
            return c.json({ success: false, message: "未找到该日志" }, 404);
        }

        // 添加更新时间
        const now = new Date().toISOString().replace("T", " ").substring(0, 19);
        const result = await updateDutyLog({
            id,
            ...validatedData,
            updateTime: now,
        });

        return c.json({ success: true, data: result });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return c.json({ success: false, message: error.issues }, 400);
        }
        return c.json({ success: false, message: "服务器错误" }, 500);
    }
};

/**
 * 删除值班日志
 */
export const deleteDutyLogController = async (c: Context) => {
    try {
        const id = parseInt(c.req.param("id"));
        if (isNaN(id)) {
            return c.json({ success: false, message: "无效的ID" }, 400);
        }

        // 先检查是否存在
        const existing = await getDutyLogById(id);
        if (!existing) {
            return c.json({ success: false, message: "未找到该日志" }, 404);
        }

        await deleteDutyLog(id);
        return c.json({ success: true, message: "删除成功" });
    } catch (error) {
        return c.json({ success: false, message: "服务器错误" }, 500);
    }
};

/**
 * 查询日期范围内未按时填写的值班日志
 */
export const dutyLogInspectionController = async (c: Context) => {
    try {
        const body = await c.req.json();
        const params = dutyLogInspectionSchema.parse(body);
        const result = await getMissingDutyLogs(params);
        return c.json({ success: true, data: result });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return c.json({ success: false, message: error.issues }, 400);
        }
        console.error("dutyLogInspectionController error:", error);
        return c.json({ success: false, message: "服务器错误" }, 500);
    }
};
