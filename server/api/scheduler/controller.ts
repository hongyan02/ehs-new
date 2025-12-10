import { Context } from "hono";
import { z } from "zod";

import {
    createSchedulerTask,
    deleteSchedulerTask,
    listSchedulerTasks,
    triggerSchedulerTask,
    updateSchedulerTask,
} from "./services";
import { SUPPORTED_JOB_KEYS } from "../../utils/scheduler";

const jobKeyEnum = z.enum(SUPPORTED_JOB_KEYS);

const cronSchema = z
    .string()
    .min(1, "cron 表达式不能为空")
    .optional()
    .nullable();

const createTaskSchema = z.object({
    name: z.string().min(1, "任务名称不能为空"),
    jobKey: jobKeyEnum,
    cron: cronSchema,
    enabled: z.boolean().optional(),
    payload: z.unknown().optional(),
});

const updateTaskSchema = z.object({
    name: z.string().optional(),
    jobKey: jobKeyEnum.optional(),
    cron: cronSchema.optional(),
    enabled: z.boolean().optional(),
    payload: z.unknown().optional(),
});

export const listTasksController = async (c: Context) => {
    const data = await listSchedulerTasks();
    return c.json({ success: true, data });
};

export const createTaskController = async (c: Context) => {
    try {
        const body = await c.req.json();
        const payload = createTaskSchema.parse(body);
        const data = await createSchedulerTask(payload);
        return c.json({ success: true, data });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return c.json({ success: false, message: error.issues }, 400);
        }
        return c.json(
            { success: false, message: error instanceof Error ? error.message : String(error) },
            400
        );
    }
};

export const updateTaskController = async (c: Context) => {
    try {
        const id = Number(c.req.param("id"));
        if (Number.isNaN(id)) {
            return c.json({ success: false, message: "无效的任务ID" }, 400);
        }

        const body = await c.req.json();
        const payload = updateTaskSchema.parse(body);

        const data = await updateSchedulerTask({ id, ...payload });
        return c.json({ success: true, data });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return c.json({ success: false, message: error.issues }, 400);
        }
        return c.json(
            { success: false, message: error instanceof Error ? error.message : String(error) },
            400
        );
    }
};

export const deleteTaskController = async (c: Context) => {
    const id = Number(c.req.param("id"));
    if (Number.isNaN(id)) {
        return c.json({ success: false, message: "无效的任务ID" }, 400);
    }

    const data = await deleteSchedulerTask(id);
    if (!data) {
        return c.json({ success: false, message: "任务不存在" }, 404);
    }

    return c.json({ success: true, data });
};

export const triggerTaskController = async (c: Context) => {
    try {
        const id = Number(c.req.param("id"));
        if (Number.isNaN(id)) {
            return c.json({ success: false, message: "无效的任务ID" }, 400);
        }

        const data = await triggerSchedulerTask(id);
        return c.json({ success: true, data });
    } catch (error) {
        return c.json(
            { success: false, message: error instanceof Error ? error.message : String(error) },
            400
        );
    }
};
