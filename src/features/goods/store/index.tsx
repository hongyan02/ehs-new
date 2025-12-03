"use client";

import { useState } from "react";
import SearchForm, { type SearchFormData } from "./components/searchForm";
import StoreTable from "./components/storeTable";
import CustomPagination from "@/components/CustomPagination";
import { useMaterialList, useUpdateMaterial } from "./query";
import StoreEditDialog, { type FormValues } from "./components/storeEditDialog";
import type { MaterialData } from "./query/api";
import { toast } from "sonner";
export default function GoodsStoreView() {
    const [page, setPage] = useState(1);
    const [pageSize] = useState(10);
    const [searchParams, setSearchParams] = useState<SearchFormData>({});
    const [editingMaterial, setEditingMaterial] = useState<MaterialData | null>(null);
    const [isEditOpen, setIsEditOpen] = useState(false);

    const { data, isLoading, error } = useMaterialList({
        page,
        pageSize,
        ...searchParams,
    });
    const updateMaterialMutation = useUpdateMaterial();

    const handleSearch = (params: SearchFormData) => {
        setSearchParams(params);
        setPage(1);
    };

    const handleReset = () => {
        setSearchParams({});
        setPage(1);
    };

    const handleOpenEdit = (material: MaterialData) => {
        setEditingMaterial(material);
        setIsEditOpen(true);
    };

    const handleEditSubmit = async (values: FormValues) => {
        if (!editingMaterial) return;
        try {
            await updateMaterialMutation.mutateAsync({ id: editingMaterial.id, data: values });
            toast.success("更新成功");
            setIsEditOpen(false);
            setEditingMaterial(null);
        } catch (err) {
            console.error(err);
            toast.error("更新失败");
        }
    };

    return (
        <div className="space-y-6 p-6">
            <div className="flex flex-wrap items-start gap-4">
                <div className="flex-1 min-w-[280px]">
                    <SearchForm onSearch={handleSearch} onReset={handleReset} />
                </div>
            </div>

            {isLoading ? (
                <div className="text-center py-8">加载中...</div>
            ) : error ? (
                <div className="text-center py-8 text-red-500">加载失败</div>
            ) : (
                <>
                    <StoreTable data={data?.list || []} onEdit={handleOpenEdit} />
                    <CustomPagination
                        page={page}
                        pageSize={pageSize}
                        total={data?.total || 0}
                        onChange={setPage}
                        className="mt-4 justify-end"
                    />
                </>
            )}

            <StoreEditDialog
                open={isEditOpen}
                onOpenChange={(open) => {
                    if (!open) {
                        setEditingMaterial(null);
                    }
                    setIsEditOpen(open);
                }}
                material={editingMaterial}
                onSubmit={handleEditSubmit}
                isSubmitting={updateMaterialMutation.isPending}
            />
        </div>
    );
}
