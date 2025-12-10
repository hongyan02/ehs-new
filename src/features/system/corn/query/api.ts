import request from "@/utils/request";
import { API_SERVICE } from "@/config/api";

export type SchedulerTask = {
    id: number;
    name: string;
    jobKey: string;
    cron: string | null;
    enabled: number;
    payload: unknown;
    lastRunAt: string | null;
    lastStatus: string | null;
    lastError: string | null;
    createdAt: string;
    updatedAt: string;
};

export type SchedulerTaskPayload = {
    name: string;
    jobKey: string;
    cron?: string | null;
    enabled?: boolean;
    payload?: unknown;
};

export type SchedulerTaskResponse = {
    success: boolean;
    data: SchedulerTask[];
    message?: string;
};

const baseUrl = API_SERVICE.scheduler.task;

export const fetchSchedulerTasks = () =>
    request.get<SchedulerTaskResponse>(baseUrl, {
        headers: { isToken: false },
    });

export const createSchedulerTask = (payload: SchedulerTaskPayload) =>
    request.post(baseUrl, payload, { headers: { isToken: false } });

export const updateSchedulerTask = (id: number, payload: SchedulerTaskPayload) =>
    request.put(`${baseUrl}/${id}`, payload, { headers: { isToken: false } });

export const deleteSchedulerTask = (id: number) =>
    request.delete(`${baseUrl}/${id}`, { headers: { isToken: false } });

export const triggerSchedulerTask = (id: number) =>
    request.post(`${baseUrl}/${id}/trigger`, undefined, {
        headers: { isToken: false },
    });
