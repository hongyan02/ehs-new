import request from "@/utils/request";
import { API_SERVICE } from "@/config/api";

export interface ApplicationDetailData {
  id: number;
  applicationCode: string;
  materialCode: string;
  materialName: string;
  spec?: string;
  unit: string;
  quantity: number;
  type?: string;
  remark?: string;
}

export type CreateApplicationDetailPayload = Omit<ApplicationDetailData, "id">;
export type UpdateApplicationDetailPayload =
  Partial<CreateApplicationDetailPayload>;

export interface GetApplicationParams {
  page?: number;
  pageSize?: number;
  title?: string;
  applicant?: string;
  status?: number;
  operation?: "IN" | "OUT";
}

export interface ApplicationData {
  id?: number;
  applicationCode: string;
  title: string;
  operation: "IN" | "OUT";
  applicationTime: string;
  applicant: string;
  applicantNo: string;
  approveTime?: string | null;
  approver?: string | null;
  approverNo?: string | null;
  origin?: string | null;
  purpose?: string | null;
  status: number;
  createTime: string;
  updateTime: string;
}

export type ApplicationPayload = Omit<
  ApplicationData,
  | "id"
  | "applicationCode"
  | "applicationTime"
  | "approveTime"
  | "approver"
  | "approverNo"
  | "status"
  | "createTime"
  | "updateTime"
>;

export type UpdateApplicationPayload = Partial<ApplicationPayload> & {
  status?: number;
};

export interface SubmitApplicationPayload {
  applicationId: number;
  approver?: string | null;
  approverNo?: string | null;
}

export interface GetPendingApplicationParams {
  page?: number;
  pageSize?: number;
}

export function getApplications(params: GetApplicationParams) {
  return request.get(API_SERVICE.application.application, {
    params,
    headers: { isToken: false },
  });
}

export function getPendingApplications(params: GetPendingApplicationParams) {
  return request.get(API_SERVICE.application.pending, {
    params,
    headers: { isToken: false },
  });
}

export function getApplicationById(id: number) {
  return request.get(`${API_SERVICE.application.application}/${id}`, {
    headers: { isToken: false },
  });
}

export function createApplication(data: ApplicationPayload) {
  return request.post(API_SERVICE.application.application, data, {
    headers: { isToken: false },
  });
}

export function updateApplication(id: number, data: UpdateApplicationPayload) {
  return request.put(`${API_SERVICE.application.application}/${id}`, data, {
    headers: { isToken: false },
  });
}

export function deleteApplication(id: number) {
  return request.delete(`${API_SERVICE.application.application}/${id}`, {
    headers: { isToken: false },
  });
}

export function getApplicationDetails(applicationCode: string) {
  return request.get(API_SERVICE.application.applicationDetail, {
    params: { applicationCode },
    headers: { isToken: false },
  });
}

export function createApplicationDetail(data: CreateApplicationDetailPayload) {
  return request.post(API_SERVICE.application.applicationDetail, data, {
    headers: { isToken: false },
  });
}

export function updateApplicationDetail(
  id: number,
  data: UpdateApplicationDetailPayload,
) {
  return request.put(
    `${API_SERVICE.application.applicationDetail}/${id}`,
    data,
    {
      headers: { isToken: false },
    },
  );
}

export function deleteApplicationDetail(id: number) {
  return request.delete(`${API_SERVICE.application.applicationDetail}/${id}`, {
    headers: { isToken: false },
  });
}

export function submitApplicationLogs(data: SubmitApplicationPayload) {
  return request.post(API_SERVICE.materialLog.log, data, {
    headers: { isToken: false },
  });
}

// ============ 物资库 API ============

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

export interface GetMaterialParams {
  materialName?: string;
  materialCode?: string;
  type?: string;
  supplier?: string;
  page?: number;
  pageSize?: number;
}

export type CreateMaterialPayload = Omit<
  MaterialData,
  "id" | "createTime" | "updateTime"
>;

export function getMaterialList(params: GetMaterialParams) {
  return request.get(API_SERVICE.materialStore.store, {
    params,
    headers: { isToken: false },
  });
}

export function createMaterial(data: CreateMaterialPayload) {
  return request.post(API_SERVICE.materialStore.store, data, {
    headers: { isToken: false },
  });
}
