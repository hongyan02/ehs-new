import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
    approveDutyChange,
    cancelDutyChange,
    createDutyChange,
    getAllDutyChange,
    getMyDutyChange,
    rejectDutyChange,
    swapDutySchedule,
} from "./api";
import {
    CreateDutyChangeParams,
    GetAllDutyChangeParams,
    GetMyDutyChangeParams,
    SwapDutyScheduleParams,
} from "../types";
import { message } from "antd";

export const dutyChangeKeys = {
    all: ["dutyChange"] as const,
    my: (params: GetMyDutyChangeParams) =>
        [...dutyChangeKeys.all, "my", params] as const,
    list: (params: GetAllDutyChangeParams) =>
        [...dutyChangeKeys.all, "list", params] as const,
};

// 查询我的换班申请
export const useMyDutyChange = (params: GetMyDutyChangeParams) => {
    return useQuery({
        queryKey: dutyChangeKeys.my(params),
        queryFn: () => getMyDutyChange(params),
        select: (res) => res.data.data,
    });
};

// 查询所有换班申请 (用于审批列表，这里假设审批人可以看到所有申请或者特定状态的申请)
// 实际业务中可能需要根据当前用户的角色来过滤，或者后端提供专门的审批列表接口
// 这里暂时复用 getAllDutyChange，前端可以传 status 参数
export const useAllDutyChange = (params: GetAllDutyChangeParams) => {
    return useQuery({
        queryKey: dutyChangeKeys.list(params),
        queryFn: () => getAllDutyChange(params),
        select: (res) => res.data.data,
    });
};

// 创建换班申请
export const useCreateDutyChange = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: createDutyChange,
        onSuccess: () => {
            message.success("申请提交成功");
            queryClient.invalidateQueries({ queryKey: dutyChangeKeys.all });
        },
        onError: (error: any) => {
            message.error(error.message || "申请提交失败");
        },
    });
};

// 同意换班申请
export const useApproveDutyChange = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: approveDutyChange,
        onSuccess: () => {
            message.success("已同意申请");
            queryClient.invalidateQueries({ queryKey: dutyChangeKeys.all });
        },
        onError: (error: any) => {
            message.error(error.message || "操作失败");
        },
    });
};

// 拒绝换班申请
export const useRejectDutyChange = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: rejectDutyChange,
        onSuccess: () => {
            message.success("已拒绝申请");
            queryClient.invalidateQueries({ queryKey: dutyChangeKeys.all });
        },
        onError: (error: any) => {
            message.error(error.message || "操作失败");
        },
    });
};

// 取消换班申请
export const useCancelDutyChange = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: cancelDutyChange,
        onSuccess: () => {
            message.success("已取消申请");
            queryClient.invalidateQueries({ queryKey: dutyChangeKeys.all });
        },
        onError: (error: any) => {
            message.error(error.message || "操作失败");
        },
    });
};

// 互换值班排班
export const useSwapDutySchedule = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (params: SwapDutyScheduleParams) => swapDutySchedule(params),
        onSuccess: () => {
            message.success("排班已更新");
            queryClient.invalidateQueries({ queryKey: ["dutySchedule"] });
        },
        onError: (error: any) => {
            message.error(error.message || "排班更新失败");
        },
    });
};
