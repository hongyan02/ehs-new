import request from "@/utils/request";
import { API_SERVICE } from "@/config/api";

export interface SearchMaterialParams {
  materialName?: string;
  materialCode?: string;
  type?: string;
  supplier?: string;
  page?: number;
  pageSize?: number;
}

export interface MaterialData {
  id: number;
  materialCode: string;
  materialName: string;
  spec?: string;
  unit: string;
  num: number;
  threshold: number;
  type?: string;
  location?: string;
  supplier?: string;
  createTime: string;
  updateTime: string;
}

export type UpdateMaterialPayload = Partial<
  Omit<MaterialData, "id" | "num" | "createTime" | "updateTime">
>;

export const getMaterialList = (params: SearchMaterialParams) => {
  return request.get(API_SERVICE.materialStore.store, {
    params,
    headers: { isToken: false },
  });
};

export const updateMaterial = (id: number, data: UpdateMaterialPayload) => {
  const { ...payload } = data;
  return request.put(`${API_SERVICE.materialStore.store}/${id}`, payload, {
    headers: { isToken: false },
  });
};
