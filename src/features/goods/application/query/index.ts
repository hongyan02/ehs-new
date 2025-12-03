import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getApplications,
  getApplicationById,
  createApplication,
  updateApplication,
  deleteApplication,
  type GetApplicationParams,
  type ApplicationData,
  type ApplicationPayload,
  type UpdateApplicationPayload,
  getApplicationDetails,
  createApplicationDetail,
  updateApplicationDetail,
  deleteApplicationDetail,
  type ApplicationDetailData,
  type CreateApplicationDetailPayload,
  type UpdateApplicationDetailPayload,
  submitApplicationLogs,
  type SubmitApplicationPayload,
} from "./api";

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export const useApplications = (params: GetApplicationParams) => {
  return useQuery<PaginatedResponse<ApplicationData>>({
    queryKey: ["applications", params],
    queryFn: async () => {
      try {
        const res = await getApplications(params);
        if (res?.data?.data) {
          return res.data.data;
        }
      } catch (error) {
        console.error("获取申请单失败:", error);
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

export const useApplicationById = (id: number, enabled = true) => {
  return useQuery<ApplicationData>({
    queryKey: ["application", id],
    queryFn: async () => {
      const res = await getApplicationById(id);
      return res.data.data;
    },
    enabled,
  });
};

export const useCreateApplication = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: ApplicationPayload) => {
      const res = await createApplication(data);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["applications"] });
    },
  });
};

export const useUpdateApplication = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: number;
      data: UpdateApplicationPayload;
    }) => {
      const res = await updateApplication(id, data);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["applications"] });
      queryClient.invalidateQueries({ queryKey: ["application"] });
    },
  });
};

export const useDeleteApplication = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const res = await deleteApplication(id);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["applications"] });
    },
  });
};

export const useSubmitApplication = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: SubmitApplicationPayload) => {
      const res = await submitApplicationLogs(payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["applications"] });
      queryClient.invalidateQueries({ queryKey: ["application"] });
      queryClient.invalidateQueries({ queryKey: ["applicationDetails"] });
      queryClient.invalidateQueries({ queryKey: ["pendingApplications"] });
    },
  });
};

export const useApplicationDetails = (
  applicationCode: string,
  enabled = true,
) => {
  return useQuery<ApplicationDetailData[]>({
    queryKey: ["applicationDetails", applicationCode],
    queryFn: async () => {
      const res = await getApplicationDetails(applicationCode);
      return res.data.data;
    },
    enabled: !!applicationCode && enabled,
  });
};

export const useCreateApplicationDetail = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateApplicationDetailPayload) => {
      const res = await createApplicationDetail(data);
      return res.data.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["applicationDetails", variables.applicationCode],
      });
    },
  });
};

export const useUpdateApplicationDetail = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: number;
      data: UpdateApplicationDetailPayload;
    }) => {
      const res = await updateApplicationDetail(id, data);
      return res.data.data;
    },
    onSuccess: (data) => {
      // Assuming the response contains the updated detail which has applicationCode
      // If not, we might need to pass applicationCode in variables or invalidate all details
      if (data && data[0] && data[0].applicationCode) {
        queryClient.invalidateQueries({
          queryKey: ["applicationDetails", data[0].applicationCode],
        });
      }
    },
  });
};

export const useDeleteApplicationDetail = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      applicationCode,
    }: {
      id: number;
      applicationCode: string;
    }) => {
      await deleteApplicationDetail(id);
      return applicationCode;
    },
    onSuccess: (applicationCode) => {
      queryClient.invalidateQueries({
        queryKey: ["applicationDetails", applicationCode],
      });
    },
  });
};

//物资库 Hooks

import {
  getMaterialList,
  createMaterial,
  type MaterialData,
  type GetMaterialParams,
  type CreateMaterialPayload,
} from "./api";

export const useMaterials = (params: GetMaterialParams, enabled = true) => {
  return useQuery<MaterialData[]>({
    queryKey: ["materials", params],
    queryFn: async () => {
      try {
        const res = await getMaterialList(params);

        // 物资库API返回格式：{ code: 0, data: { list: [...], total, page, pageSize } }
        if (res?.data?.data?.list) {
          const list = res.data.data.list;
          return Array.isArray(list) ? list : [];
        }

        // 备用格式
        if (res?.data?.data) {
          const data = res.data.data;
          return Array.isArray(data) ? data : [];
        }

        console.warn("物资列表数据格式异常:", res);
      } catch (error) {
        console.error("获取物资列表失败:", error);
      }
      return [];
    },
    enabled,
  });
};

export const useCreateMaterial = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateMaterialPayload) => {
      const res = await createMaterial(data);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["materials"] });
    },
  });
};

export type {
  GetApplicationParams,
  ApplicationData,
  ApplicationPayload,
  UpdateApplicationPayload,
  ApplicationDetailData,
  CreateApplicationDetailPayload,
  UpdateApplicationDetailPayload,
  MaterialData,
  GetMaterialParams,
  CreateMaterialPayload,
};
