import cron, { type ScheduledTask } from "node-cron";
import { eq } from "drizzle-orm";

import { db } from "@server/db/db";
import { schedulerTask } from "@server/db/schema";
import { sendDutyLeaderTextMessage } from "@server/api/wxWork/dutyLog/services";

type SchedulerTaskRow = typeof schedulerTask.$inferSelect;

type JobHandler = (task: SchedulerTaskRow) => Promise<unknown>;

const scheduledJobs = new Map<number, ScheduledTask>();
let schedulerStarted = false;

const timeNow = () =>
    new Date()
        .toLocaleString("sv-SE", { timeZone: "Asia/Shanghai", hour12: false })
        .replace("T", " ");

export const SUPPORTED_JOB_KEYS = ["send-duty-leader-text"] as const;
export type SupportedJobKey = (typeof SUPPORTED_JOB_KEYS)[number];

const jobHandlers: Record<SupportedJobKey, JobHandler> = {
    "send-duty-leader-text": async (task) => {
        const payload = parsePayload(task.payload);
        const shift = getShiftFromPayload(payload);
        const content = getContentFromPayload(payload);
        return sendDutyLeaderTextMessage({ shift, content });
    },
};

const getJobHandler = (jobKey: string): JobHandler | undefined =>
    jobHandlers[jobKey as SupportedJobKey];

const stopScheduledJob = (taskId: number) => {
    const job = scheduledJobs.get(taskId);
    if (job) {
        job.stop();
        scheduledJobs.delete(taskId);
    }
};

const parsePayload = (payload: unknown): unknown => {
    if (typeof payload === "string") {
        try {
            return JSON.parse(payload);
        } catch {
            return null;
        }
    }
    return payload;
};

const getShiftFromPayload = (payload: unknown): number => {
    if (payload && typeof payload === "object" && "shift" in payload) {
        const value = (payload as { shift?: unknown }).shift;
        if (value === 1 || value === "1" || value === 0 || value === "0") {
            return Number(value);
        }
    }
    return 0; // default to day shift
};

const getContentFromPayload = (payload: unknown): string | undefined => {
    if (payload && typeof payload === "object" && "content" in payload) {
        const value = (payload as { content?: unknown }).content;
        if (typeof value === "string" && value.trim().length > 0) {
            return value.trim();
        }
    }
    return undefined;
};

export const runTask = async (task: SchedulerTaskRow) => {
    const handler = getJobHandler(task.jobKey);
    if (!handler) {
        throw new Error(`No handler registered for jobKey=${task.jobKey}`);
    }

    const startedAt = timeNow();

    try {
        const result = await handler(task);

        await db
            .update(schedulerTask)
            .set({
                lastRunAt: startedAt,
                lastStatus: "success",
                lastError: null,
                updatedAt: timeNow(),
            })
            .where(eq(schedulerTask.id, task.id));

        return result;
    } catch (error) {
        await db
            .update(schedulerTask)
            .set({
                lastRunAt: startedAt,
                lastStatus: "failed",
                lastError: error instanceof Error ? error.message : String(error),
                updatedAt: timeNow(),
            })
            .where(eq(schedulerTask.id, task.id));

        throw error;
    }
};

export const runTaskById = async (taskId: number) => {
    const rows = await db
        .select()
        .from(schedulerTask)
        .where(eq(schedulerTask.id, taskId));

    const row = rows[0];
    if (!row) {
        throw new Error(`Task not found: ${taskId}`);
    }

    return runTask(row);
};

const scheduleSingleTask = (task: SchedulerTaskRow) => {
    stopScheduledJob(task.id);

    if (!task.enabled || !task.cron) {
        return;
    }

    if (!cron.validate(task.cron)) {
        console.warn(`Invalid cron expression for task ${task.id}: ${task.cron}`);
        return;
    }

    const handler = getJobHandler(task.jobKey);
    if (!handler) {
        console.warn(`No handler for jobKey=${task.jobKey}, task ${task.id} skipped`);
        return;
    }

    const scheduled = cron.schedule(
        task.cron,
        () => {
            runTask(task).catch((error) =>
                console.error(`Scheduled task ${task.id} failed`, error)
            );
        },
        { timezone: "Asia/Shanghai" }
    );

    scheduledJobs.set(task.id, scheduled);
};

export const refreshScheduledTasks = async () => {
    // Stop existing jobs
    scheduledJobs.forEach((job) => job.stop());
    scheduledJobs.clear();

    const tasks = await db
        .select()
        .from(schedulerTask)
        .where(eq(schedulerTask.enabled, 1));

    tasks.forEach((task) => {
        if (task.cron) {
            scheduleSingleTask(task);
        }
    });
};

export const rescheduleTask = async (taskId: number) => {
    const rows = await db
        .select()
        .from(schedulerTask)
        .where(eq(schedulerTask.id, taskId));

    const row = rows[0];
    if (!row) {
        stopScheduledJob(taskId);
        return;
    }

    scheduleSingleTask(row);
};

export const startScheduler = async () => {
    if (schedulerStarted) return;
    schedulerStarted = true;

    try {
        await refreshScheduledTasks();
    } catch (error) {
        console.error("Failed to start scheduler", error);
    }
};
