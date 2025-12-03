import { Context } from "hono";
import { z } from "zod";
import {
  getApplications,
  getApplicationById,
  createApplication,
  updateApplication,
} from "./services";

const optionalText = z
  .string()
  .optional()
  .transform((val) => (val?.trim() ? val.trim() : undefined));

const statusQuerySchema = z
  .string()
  .optional()
  .transform((val) => {
    if (!val) return undefined;
    const parsed = parseInt(val, 10);
    return Number.isNaN(parsed) ? undefined : parsed;
  })
  .refine((val) => val === undefined || [0, 1, 2, 3, 4, 5].includes(val), {
    message: "状态必须为0、1、2、3、4或5",
  });

const statusBodySchema = z
  .union([z.number(), z.string()])
  .transform((val) => (typeof val === "string" ? parseInt(val, 10) : val))
  .refine((val) => [0, 1, 2, 3, 4, 5].includes(val), {
    message: "状态必须为0、1、2、3、4或5",
  });

const operationSchema = z.enum(["IN", "OUT"], {
  message: "操作类型必须为IN或OUT",
});

const getApplicationsSchema = z.object({
  page: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 1)),
  pageSize: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 10)),
  title: optionalText,
  applicant: optionalText,
  status: statusQuerySchema,
  operation: z
    .string()
    .optional()
    .transform((val) => {
      if (!val || (val !== "IN" && val !== "OUT")) return undefined;
      return val as "IN" | "OUT";
    }),
});

const getPendingApplicationsSchema = z.object({
  page: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 1)),
  pageSize: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 10)),
});

const createApplicationSchema = z.object({
  title: z.string().min(1, "标题不能为空"),
  operation: operationSchema,
  applicant: z.string().min(1, "申请人不能为空"),
  applicantNo: z.string().min(1, "申请人工号不能为空"),
  origin: optionalText,
  purpose: optionalText,
});

const updateApplicationSchema = z.object({
  title: z.string().min(1, "标题不能为空").optional(),
  operation: operationSchema.optional(),
  applicant: z.string().min(1, "申请人不能为空").optional(),
  applicantNo: z.string().min(1, "申请人工号不能为空").optional(),
  approveTime: optionalText,
  approver: optionalText,
  approverNo: optionalText,
  origin: optionalText,
  purpose: optionalText,
  status: statusBodySchema.optional(),
});

// 生成申请单号的辅助函数
const generateApplicationCode = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const timestamp = now.getTime().toString().slice(-6);
  return `APP${year}${month}${day}${timestamp}`;
};

// 获取当前时间字符串
const getCurrentTimeString = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  const seconds = String(now.getSeconds()).padStart(2, "0");
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
};

export const getApplicationsController = async (c: Context) => {
  try {
    const params = getApplicationsSchema.parse(c.req.query());
    const result = await getApplications(params);
    return c.json({ success: true, data: result });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json({ success: false, message: error.issues }, 400);
    }
    console.error("getApplicationsController error:", error);
    return c.json({ success: false, message: "服务器错误" }, 500);
  }
};

export const getPendingApplicationsController = async (c: Context) => {
  try {
    const params = getPendingApplicationsSchema.parse(c.req.query());
    const result = await getApplications({ ...params, status: 2 });
    return c.json({ success: true, data: result });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json({ success: false, message: error.issues }, 400);
    }
    console.error("getPendingApplicationsController error:", error);
    return c.json({ success: false, message: "服务器错误" }, 500);
  }
};

export const getApplicationByIdController = async (c: Context) => {
  try {
    const id = parseInt(c.req.param("id"));
    if (Number.isNaN(id)) {
      return c.json({ success: false, message: "无效的ID" }, 400);
    }

    const result = await getApplicationById(id);
    if (!result) {
      return c.json({ success: false, message: "未找到该申请单" }, 404);
    }

    return c.json({ success: true, data: result });
  } catch (error) {
    console.error("getApplicationByIdController error:", error);
    return c.json({ success: false, message: "服务器错误" }, 500);
  }
};

export const createApplicationController = async (c: Context) => {
  try {
    const body = await c.req.json();
    const validated = createApplicationSchema.parse(body);

    const currentTime = getCurrentTimeString();
    const applicationCode = generateApplicationCode();

    const payload = {
      applicationCode,
      title: validated.title,
      operation: validated.operation,
      applicationTime: currentTime,
      applicant: validated.applicant,
      applicantNo: validated.applicantNo,
      approveTime: null,
      approver: null,
      approverNo: null,
      origin: validated.origin ?? null,
      purpose: validated.purpose ?? null,
      status: 0, // 默认状态为未提交
      createTime: currentTime,
      updateTime: currentTime,
    };

    const result = await createApplication(payload);
    return c.json({ success: true, data: result }, 201);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json({ success: false, message: error.issues }, 400);
    }
    console.error("createApplicationController error:", error);
    return c.json({ success: false, message: "服务器错误" }, 500);
  }
};

export const updateApplicationController = async (c: Context) => {
  try {
    const id = parseInt(c.req.param("id"));
    if (Number.isNaN(id)) {
      return c.json({ success: false, message: "无效的ID" }, 400);
    }

    const body = await c.req.json();
    const validated = updateApplicationSchema.parse(body);
    const existing = await getApplicationById(id);

    if (!existing) {
      return c.json({ success: false, message: "未找到该申请单" }, 404);
    }

    const payload: Parameters<typeof updateApplication>[0] = {
      id,
      updateTime: getCurrentTimeString(),
    };

    if (validated.title !== undefined) payload.title = validated.title;
    if (validated.operation !== undefined)
      payload.operation = validated.operation;
    if (validated.applicant !== undefined)
      payload.applicant = validated.applicant;
    if (validated.applicantNo !== undefined)
      payload.applicantNo = validated.applicantNo;
    if (validated.approveTime !== undefined)
      payload.approveTime = validated.approveTime ?? null;
    if (validated.approver !== undefined)
      payload.approver = validated.approver ?? null;
    if (validated.approverNo !== undefined)
      payload.approverNo = validated.approverNo ?? null;
    if (validated.origin !== undefined)
      payload.origin = validated.origin ?? null;
    if (validated.purpose !== undefined)
      payload.purpose = validated.purpose ?? null;
    if (validated.status !== undefined) payload.status = validated.status;

    const result = await updateApplication(payload);
    return c.json({ success: true, data: result });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json({ success: false, message: error.issues }, 400);
    }
    console.error("updateApplicationController error:", error);
    return c.json({ success: false, message: "服务器错误" }, 500);
  }
};

export const deleteApplicationController = async (c: Context) => {
  try {
    const id = parseInt(c.req.param("id"));
    if (Number.isNaN(id)) {
      return c.json({ success: false, message: "无效的ID" }, 400);
    }

    const existing = await getApplicationById(id);
    if (!existing) {
      return c.json({ success: false, message: "未找到该申请单" }, 404);
    }

    await updateApplication({
      id,
      status: 5,
      updateTime: getCurrentTimeString(),
    });
    return c.json({ success: true, message: "删除成功" });
  } catch (error) {
    console.error("deleteApplicationController error:", error);
    return c.json({ success: false, message: "服务器错误" }, 500);
  }
};
