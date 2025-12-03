"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { MaterialData } from "../query/api";

interface StoreEditDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    material: MaterialData | null;
    onSubmit: (values: FormValues) => Promise<void> | void;
    isSubmitting?: boolean;
}

export interface FormValues {
    materialName: string;
    spec?: string;
    unit: string;
    threshold: number;
    type?: string;
    location?: string;
    supplier?: string;
}

export default function StoreEditDialog({
    open,
    onOpenChange,
    material,
    onSubmit,
    isSubmitting,
}: StoreEditDialogProps) {
    const { register, handleSubmit, reset } = useForm<FormValues>({
        defaultValues: {
            materialName: "",
            spec: "",
            unit: "",
            threshold: 0,
            type: "",
            location: "",
            supplier: "",
        },
    });

    useEffect(() => {
        if (material) {
            reset({
                materialName: material.materialName,
                spec: material.spec || "",
                unit: material.unit,
                threshold: material.threshold,
                type: material.type || "",
                location: material.location || "",
                supplier: material.supplier || "",
            });
        }
    }, [material, reset]);

    const handleClose = (nextOpen: boolean) => {
        if (!nextOpen) {
            reset();
        }
        onOpenChange(nextOpen);
    };

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>编辑物料</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit(async (values) => onSubmit(values))} className="space-y-4">
                    <div>
                        <Label className="mb-1 block">物料名称</Label>
                        <Input {...register("materialName", { required: true })} />
                    </div>
                    <div>
                        <Label className="mb-1 block">规格型号</Label>
                        <Input {...register("spec")} />
                    </div>
                    <div>
                        <Label className="mb-1 block">单位</Label>
                        <Input {...register("unit", { required: true })} />
                    </div>
                    <div>
                        <Label className="mb-1 block">阀值</Label>
                        <Input type="number" {...register("threshold", { valueAsNumber: true, min: 0 })} />
                    </div>
                    <div>
                        <Label className="mb-1 block">类别</Label>
                        <Input {...register("type")} />
                    </div>
                    <div>
                        <Label className="mb-1 block">存放位置</Label>
                        <Input {...register("location")} />
                    </div>
                    <div>
                        <Label className="mb-1 block">供应商</Label>
                        <Input {...register("supplier")} />
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                        <Button type="button" variant="outline" onClick={() => handleClose(false)}>
                            取消
                        </Button>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? "保存中..." : "保存"}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
