import { Context } from "hono";
import { z } from "zod";
import {
    getApplicationDetails,
    createApplicationDetail,
    updateApplicationDetail,
    deleteApplicationDetail,
} from "./services";

const createDetailSchema = z.object({
    applicationCode: z.string().min(1, "申请单号不能为空"),
    materialCode: z.string().min(1, "物料编码不能为空"),
    materialName: z.string().min(1, "物料名称不能为空"),
    spec: z.string().optional(),
    unit: z.string().min(1, "单位不能为空"),
    quantity: z.number().min(0.01, "数量必须大于0"),
    type: z.string().optional(),
    remark: z.string().optional(),
});

const updateDetailSchema = createDetailSchema.partial();

export const getApplicationDetailsController = async (c: Context) => {
    try {
        const applicationCode = c.req.query("applicationCode");
        if (!applicationCode) {
            return c.json({ success: false, message: "applicationCode is required" }, 400);
        }

        const result = await getApplicationDetails(applicationCode);
        return c.json({ success: true, data: result });
    } catch (error) {
        console.error("getApplicationDetailsController error:", error);
        return c.json({ success: false, message: "服务器错误" }, 500);
    }
};

export const createApplicationDetailController = async (c: Context) => {
    try {
        const body = await c.req.json();
        const validated = createDetailSchema.parse(body);

        const result = await createApplicationDetail(validated);
        return c.json({ success: true, data: result });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return c.json({ success: false, message: error.issues }, 400);
        }
        console.error("createApplicationDetailController error:", error);
        return c.json({ success: false, message: error instanceof Error ? error.message : "服务器错误" }, 500);
    }
};

export const updateApplicationDetailController = async (c: Context) => {
    try {
        const id = parseInt(c.req.param("id"));
        if (Number.isNaN(id)) {
            return c.json({ success: false, message: "无效的ID" }, 400);
        }

        const body = await c.req.json();
        const validated = updateDetailSchema.parse(body);

        const result = await updateApplicationDetail(id, validated);
        return c.json({ success: true, data: result });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return c.json({ success: false, message: error.issues }, 400);
        }
        console.error("updateApplicationDetailController error:", error);
        return c.json({ success: false, message: error instanceof Error ? error.message : "服务器错误" }, 500);
    }
};

export const deleteApplicationDetailController = async (c: Context) => {
    try {
        const id = parseInt(c.req.param("id"));
        if (Number.isNaN(id)) {
            return c.json({ success: false, message: "无效的ID" }, 400);
        }

        const result = await deleteApplicationDetail(id);
        return c.json({ success: true, data: result });
    } catch (error) {
        console.error("deleteApplicationDetailController error:", error);
        return c.json({ success: false, message: error instanceof Error ? error.message : "服务器错误" }, 500);
    }
};
