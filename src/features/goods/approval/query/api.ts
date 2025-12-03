import {
  getPendingApplications,
  updateApplication,
  type ApplicationData,
  type GetPendingApplicationParams,
  type UpdateApplicationPayload,
} from "../../application/query/api";

export type {
  ApplicationData,
  GetPendingApplicationParams,
  UpdateApplicationPayload,
};

export const fetchPendingApplications = (params: GetPendingApplicationParams) =>
  getPendingApplications(params);

export const updateApprovalApplication = (
  id: number,
  data: UpdateApplicationPayload,
) => updateApplication(id, data);
