import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
    createSchedulerTask,
    deleteSchedulerTask,
    fetchSchedulerTasks,
    triggerSchedulerTask,
    updateSchedulerTask,
    type SchedulerTask,
    type SchedulerTaskPayload,
} from "./api";

const QUERY_KEY = ["schedulerTaskList"];

export const useSchedulerTasks = () =>
    useQuery({
        queryKey: QUERY_KEY,
        queryFn: async () => {
            const res = await fetchSchedulerTasks();
            return res.data?.data ?? [];
        },
    });

export const useCreateSchedulerTask = () => {
    const client = useQueryClient();
    return useMutation({
        mutationFn: (payload: SchedulerTaskPayload) => createSchedulerTask(payload),
        onSuccess: () => client.invalidateQueries({ queryKey: QUERY_KEY }),
    });
};

export const useUpdateSchedulerTask = () => {
    const client = useQueryClient();
    return useMutation({
        mutationFn: ({
            id,
            payload,
        }: {
            id: number;
            payload: SchedulerTaskPayload;
        }) => updateSchedulerTask(id, payload),
        onSuccess: () => client.invalidateQueries({ queryKey: QUERY_KEY }),
    });
};

export const useDeleteSchedulerTask = () => {
    const client = useQueryClient();
    return useMutation({
        mutationFn: (id: number) => deleteSchedulerTask(id),
        onSuccess: () => client.invalidateQueries({ queryKey: QUERY_KEY }),
    });
};

export const useTriggerSchedulerTask = () => {
    const client = useQueryClient();
    return useMutation({
        mutationFn: (id: number) => triggerSchedulerTask(id),
        onSuccess: () => client.invalidateQueries({ queryKey: QUERY_KEY }),
    });
};

export type { SchedulerTask, SchedulerTaskPayload };
