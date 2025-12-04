import request from "@/utils/request";
import { API_SERVICE } from "@/config/api";
import {
    CreateDutyChangeParams,
    DutyChangeApplication,
    GetAllDutyChangeParams,
    GetMyDutyChangeParams,
    SwapDutyScheduleParams,
} from "../types";

// 创建换班申请
export function createDutyChange(data: CreateDutyChangeParams) {
    return request.post<{ success: boolean; data: DutyChangeApplication }>(
        API_SERVICE.dutyChange.change,
        data
    );
}

// 查询我的换班申请
export function getMyDutyChange(params: GetMyDutyChangeParams) {
    return request.get<{ success: boolean; data: DutyChangeApplication[] }>(
        API_SERVICE.dutyChange.change + "/my",
        { params }
    );
}

// 查询所有换班申请
export function getAllDutyChange(params: GetAllDutyChangeParams) {
    return request.get<{ success: boolean; data: DutyChangeApplication[] }>(
        API_SERVICE.dutyChange.change + "/all",
        { params }
    );
}

// 同意换班申请
export function approveDutyChange(id: number) {
    return request.patch<{ success: boolean; data: DutyChangeApplication }>(
        `${API_SERVICE.dutyChange.change}/${id}/approve`
    );
}

// 拒绝换班申请
export function rejectDutyChange(id: number) {
    return request.patch<{ success: boolean; data: DutyChangeApplication }>(
        `${API_SERVICE.dutyChange.change}/${id}/reject`
    );
}

// 取消换班申请
export function cancelDutyChange(id: number) {
    return request.patch<{ success: boolean; data: DutyChangeApplication }>(
        `${API_SERVICE.dutyChange.change}/${id}/cancel`
    );
}

// 互换值班
export function swapDutySchedule(data: SwapDutyScheduleParams) {
    return request.post<{ success: boolean }>(
        `${API_SERVICE.dutyChange.change}/swap`,
        data
    );
}
