import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getMaterialList, updateMaterial, type MaterialData, type SearchMaterialParams, type UpdateMaterialPayload } from "./api";

interface MaterialListResponse {
    list: MaterialData[];
    total: number;
    page: number;
    pageSize: number;
}

export const useMaterialList = (params: SearchMaterialParams) => {
    return useQuery<MaterialListResponse>({
        queryKey: ["materialList", params],
        queryFn: async () => {
            const res = await getMaterialList(params);
            const payload = res?.data?.data;

            if (payload && Array.isArray(payload.list)) {
                return payload as MaterialListResponse;
            }

            return {
                list: [],
                total: payload?.total ?? 0,
                page: params.page ?? 1,
                pageSize: params.pageSize ?? 10,
            } satisfies MaterialListResponse;
        },
    });
};

export const useUpdateMaterial = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, data }: { id: number; data: UpdateMaterialPayload }) => {
            const res = await updateMaterial(id, data);
            return res.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["materialList"] });
        },
    });
};
