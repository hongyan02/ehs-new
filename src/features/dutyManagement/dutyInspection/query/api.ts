import request from "@/utils/request";
import { API_SERVICE } from "@/config/api";

export interface DutyInspectionParams {
    startDate: string;
    endDate: string;
}

export interface DutyInspectionItem {
    date: string;
    shift: number;
    name: string;
    no: string;
}

export function fetchDutyInspection(params: DutyInspectionParams) {
    return request.post<{ success: boolean; data: DutyInspectionItem[] }>(
        API_SERVICE.dutyLog.inspection,
        params,
        { headers: { isToken: false } }
    );
}
