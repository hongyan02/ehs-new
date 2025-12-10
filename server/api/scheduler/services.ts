import cron from "node-cron";
import { desc, eq } from "drizzle-orm";

import { db } from "@server/db/db";
import { schedulerTask } from "@server/db/schema";
import {
    SUPPORTED_JOB_KEYS,
    type SupportedJobKey,
    rescheduleTask,
    runTaskById,
} from "@server/utils/scheduler";

export type SchedulerTaskDTO = Omit<
    typeof schedulerTask.$inferSelect,
    "payload"
> & {
    payload: unknown;
};

export type CreateSchedulerTaskParams = {
    name: string;
    jobKey: SupportedJobKey;
    cron?: string | null;
    enabled?: boolean;
    payload?: unknown;
};

export type UpdateSchedulerTaskParams = {
    id: number;
    name?: string;
    jobKey?: SupportedJobKey;
    cron?: string | null;
    enabled?: boolean;
    payload?: unknown;
};

const timeNow = () =>
  new Date()
    .toLocaleString("sv-SE", { timeZone: "Asia/Shanghai", hour12: false })
    .replace("T", " ");

const serializePayload = (payload: unknown) => {
    if (payload === undefined || payload === null) return null;
    try {
        return JSON.stringify(payload);
    } catch {
        throw new Error("payload 需要可序列化为 JSON");
    }
};

const parsePayload = (payload: string | null): unknown => {
    if (!payload) return null;
    try {
        return JSON.parse(payload);
    } catch {
        return payload;
    }
};

const toDTO = (row: typeof schedulerTask.$inferSelect): SchedulerTaskDTO => ({
    ...row,
    payload: parsePayload(row.payload ?? null),
});

const ensureCronValid = (value?: string | null) => {
    if (!value) return;
    if (!cron.validate(value)) {
        throw new Error("无效的 cron 表达式");
    }
};

const ensureJobKeySupported = (jobKey: string) => {
    if (!SUPPORTED_JOB_KEYS.includes(jobKey as SupportedJobKey)) {
        throw new Error(`不支持的 jobKey: ${jobKey}`);
    }
};

export const listSchedulerTasks = async () => {
    const rows = await db
        .select()
        .from(schedulerTask)
        .orderBy(desc(schedulerTask.id));

    return rows.map(toDTO);
};

export const createSchedulerTask = async (params: CreateSchedulerTaskParams) => {
    ensureJobKeySupported(params.jobKey);
    ensureCronValid(params.cron);

    const now = timeNow();

    const payload = serializePayload(params.payload);

    const [created] = await db
        .insert(schedulerTask)
        .values({
            name: params.name,
            jobKey: params.jobKey,
            cron: params.cron ?? null,
            enabled: params.enabled === false ? 0 : 1,
            payload,
            lastRunAt: null,
            lastStatus: null,
            lastError: null,
            createdAt: now,
            updatedAt: now,
        })
        .returning();

    await rescheduleTask(created.id);

    return toDTO(created);
};

export const updateSchedulerTask = async (params: UpdateSchedulerTaskParams) => {
    const existing = await db
        .select()
        .from(schedulerTask)
        .where(eq(schedulerTask.id, params.id));

    if (!existing[0]) {
        throw new Error("任务不存在");
    }

    if (params.jobKey) ensureJobKeySupported(params.jobKey);
    if (params.cron !== undefined) ensureCronValid(params.cron);

    const updateData: Partial<typeof schedulerTask.$inferInsert> = {
        updatedAt: timeNow(),
    };

    if (params.name !== undefined) updateData.name = params.name;
    if (params.jobKey !== undefined) updateData.jobKey = params.jobKey;
    if (params.cron !== undefined) updateData.cron = params.cron;
    if (params.enabled !== undefined) updateData.enabled = params.enabled ? 1 : 0;
    if (params.payload !== undefined) updateData.payload = serializePayload(params.payload);

    const [updated] = await db
        .update(schedulerTask)
        .set(updateData)
        .where(eq(schedulerTask.id, params.id))
        .returning();

    await rescheduleTask(params.id);

    return toDTO(updated);
};

export const deleteSchedulerTask = async (id: number) => {
    const [deleted] = await db
        .delete(schedulerTask)
        .where(eq(schedulerTask.id, id))
        .returning();

    await rescheduleTask(id);

    return deleted ? toDTO(deleted) : null;
};

export const triggerSchedulerTask = async (id: number) => {
    await runTaskById(id);

    const rows = await db
        .select()
        .from(schedulerTask)
        .where(eq(schedulerTask.id, id));

    if (!rows[0]) {
        throw new Error("任务不存在");
    }

    return toDTO(rows[0]);
};
