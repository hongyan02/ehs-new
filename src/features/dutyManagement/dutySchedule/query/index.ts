import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getDutySchedule, getAllDutyPersons, createDutySchedule, deleteDutySchedule } from "./api";
import type { AxiosResponse } from "axios";

export type DutyScheduleQuery = {
  start_duty_date: string;
  end_duty_date: string;
};

export type DutyScheduleItem = {
  id: number;
  date: string;
  shift: number | string; // 0: day, 1: night
  name: string;
  no: string;
  position: string;
};

type DutyScheduleApiResponse = {
  data: DutyScheduleItem[];
  message?: string;
  success?: boolean;
};

type UseDutyScheduleOptions = {
  enabled?: boolean;
};

export const useDutySchedule = (
  params?: DutyScheduleQuery,
  options?: UseDutyScheduleOptions,
) => {
  return useQuery<DutyScheduleItem[]>({
    queryKey: ["dutySchedule", params],
    queryFn: async () => {
      const res: AxiosResponse<DutyScheduleApiResponse> =
        await getDutySchedule(params);
      return res.data.data;
    },
    enabled: options?.enabled ?? true,
  });
};

export const useAllDutyPersons = () => {
  return useQuery({
    queryKey: ["allDutyPersons"],
    queryFn: async () => {
      const res = await getAllDutyPersons();
      return res.data.data.data;
    },
  });
};

export const useCreateDutySchedule = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createDutySchedule,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dutySchedule"] });
    },
  });
};

export const useDeleteDutySchedule = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteDutySchedule,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dutySchedule"] });
    },
  });
};
