"use client";

import { useForm } from "react-hook-form";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCreateMaterial, type CreateMaterialPayload } from "../query";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface MaterialQuickAddDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess?: (material: any) => void;
}

export default function MaterialQuickAddDialog({
    open,
    onOpenChange,
    onSuccess,
}: MaterialQuickAddDialogProps) {
    const { register, handleSubmit, reset, formState: { errors } } = useForm<CreateMaterialPayload>({
        defaultValues: {
            num: 0,
            threshold: 0,
        },
    });

    const createMutation = useCreateMaterial();

    const onSubmit = async (data: CreateMaterialPayload) => {
        try {
            const result = await createMutation.mutateAsync(data);
            toast.success("物资创建成功");
            reset();
            onOpenChange(false);
            onSuccess?.(result);
        } catch (error) {
            console.error("创建物资失败:", error);
            toast.error("创建物资失败");
        }
    };

    const handleClose = () => {
        reset();
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>新增物资</DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="materialCode">
                                物料编码 <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                id="materialCode"
                                {...register("materialCode", { required: "物料编码不能为空" })}
                                placeholder="请输入物料编码"
                            />
                            {errors.materialCode && (
                                <p className="text-sm text-red-500">{errors.materialCode.message}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="materialName">
                                物料名称 <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                id="materialName"
                                {...register("materialName", { required: "物料名称不能为空" })}
                                placeholder="请输入物料名称"
                            />
                            {errors.materialName && (
                                <p className="text-sm text-red-500">{errors.materialName.message}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="spec">规格型号</Label>
                            <Input
                                id="spec"
                                {...register("spec")}
                                placeholder="请输入规格型号"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="unit">
                                单位 <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                id="unit"
                                {...register("unit", { required: "单位不能为空" })}
                                placeholder="例如：个、箱、包"
                            />
                            {errors.unit && (
                                <p className="text-sm text-red-500">{errors.unit.message}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="type">物料类别</Label>
                            <Input
                                id="type"
                                {...register("type")}
                                placeholder="例如：劳保、办公、维修"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="supplier">供应商/品牌</Label>
                            <Input
                                id="supplier"
                                {...register("supplier")}
                                placeholder="请输入供应商或品牌"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="location">存放位置</Label>
                            <Input
                                id="location"
                                {...register("location")}
                                placeholder="例如：A区货架1层"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="threshold">库存下限</Label>
                            <Input
                                id="threshold"
                                type="number"
                                {...register("threshold", { valueAsNumber: true })}
                                placeholder="默认为 0"
                            />
                        </div>
                    </div>

                    <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                        <p className="text-sm text-blue-800">
                            💡 提示：新增物资的库存数量默认为 0，创建后可在申请单中直接使用
                        </p>
                    </div>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={handleClose}
                            disabled={createMutation.isPending}
                        >
                            取消
                        </Button>
                        <Button type="submit" disabled={createMutation.isPending}>
                            {createMutation.isPending && (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            )}
                            创建物资
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
