import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { PaginatedResponse } from "../../application/query";
import {
  fetchPendingApplications,
  updateApprovalApplication,
  type ApplicationData,
  type GetPendingApplicationParams,
  type UpdateApplicationPayload,
} from "./api";

type PendingApplicationResponse = PaginatedResponse<ApplicationData>;

export const usePendingApplications = (params: GetPendingApplicationParams) => {
  return useQuery<PendingApplicationResponse>({
    queryKey: ["pendingApplications", params],
    queryFn: async () => {
      try {
        const res = await fetchPendingApplications(params);
        if (res?.data?.data) {
          return res.data.data;
        }
      } catch (error) {
        console.error("获取待审核申请单失败:", error);
      }

      return {
        data: [],
        total: 0,
        page: params.page || 1,
        pageSize: params.pageSize || 10,
        totalPages: 0,
      };
    },
  });
};

interface UpdateStatusParams {
  id: number;
  data: UpdateApplicationPayload;
}

export const useUpdateApplicationStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: UpdateStatusParams) => {
      const res = await updateApprovalApplication(id, data);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pendingApplications"] });
    },
  });
};

export type { ApplicationData };
