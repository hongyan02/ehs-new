import { useMutation } from "@tanstack/react-query";
import { fetchDutyInspection, type DutyInspectionItem, type DutyInspectionParams } from "./api";

export const useDutyInspection = () => {
    return useMutation<DutyInspectionItem[], Error, DutyInspectionParams>({
        mutationFn: async (params: DutyInspectionParams) => {
            const res = await fetchDutyInspection(params);
            return res.data.data ?? [];
        },
    });
};

export type { DutyInspectionItem, DutyInspectionParams };
