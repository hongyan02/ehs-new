"use client";

import { useState, useEffect, useRef } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  useApplicationDetails,
  useCreateApplicationDetail,
  useDeleteApplicationDetail,
  useMaterials,
  useUpdateApplicationDetail,
  useUpdateApplication,
  type ApplicationData,
  type MaterialData,
} from "../query";
import { Loader2, Plus, Trash2, PackagePlus } from "lucide-react";
import { toast } from "sonner";
import MaterialQuickAddDialog from "./materialQuickAddDialog";
import { AutoComplete, type Option } from "@/components/autoCompleteSelect";

interface ApplicationDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  application: ApplicationData | null;
}

interface FormValues {
  materials: Array<{
    detailId?: number;
    materialCode: string;
    materialName: string;
    spec?: string;
    unit: string;
    quantity: number;
    type?: string;
    remark?: string;
  }>;
}

export default function ApplicationDetailDialog({
  open,
  onOpenChange,
  application,
}: ApplicationDetailDialogProps) {
  const { data: existingDetails, isLoading: loadingDetails } =
    useApplicationDetails(application?.applicationCode || "", open);
  const { data: materials = [], refetch: refetchMaterials } = useMaterials(
    { page: 1, pageSize: 10000 },
    open,
  );
  const createDetail = useCreateApplicationDetail();
  const deleteDetail = useDeleteApplicationDetail();
  const updateDetail = useUpdateApplicationDetail();
  const updateApplicationMutation = useUpdateApplication();

  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);

  const canModifyStructure = application?.status === 0;
  const canModifyQuantities =
    application?.status === 0 || application?.status === 1;
  const canAddMaterials =
    application?.status === 0 || application?.status === 1;
  const quantityUpdateTimers = useRef<
    Record<number, ReturnType<typeof setTimeout>>
  >({});

  const canEditRow = (detailId?: number) => canModifyStructure || !detailId;

  const clearQuantityTimers = () => {
    Object.values(quantityUpdateTimers.current).forEach((timer) =>
      clearTimeout(timer),
    );
    quantityUpdateTimers.current = {};
  };

  const { control, register, handleSubmit, reset, setValue, watch } =
    useForm<FormValues>({
      defaultValues: {
        materials: [],
      },
    });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "materials",
  });

  // 加载现有明细到表单
  useEffect(() => {
    if (existingDetails && existingDetails.length > 0) {
      reset({
        materials: existingDetails.map((detail) => ({
          detailId: detail.id,
          materialCode: detail.materialCode,
          materialName: detail.materialName,
          spec: detail.spec,
          unit: detail.unit,
          quantity: detail.quantity,
          type: detail.type,
          remark: detail.remark,
        })),
      });
    } else if (open && !loadingDetails) {
      reset({ materials: [] });
    }
  }, [existingDetails, open, loadingDetails, reset]);

  useEffect(() => {
    return () => {
      clearQuantityTimers();
    };
  }, []);

  const handleClose = () => {
    reset({ materials: [] });
    clearQuantityTimers();
    onOpenChange(false);
  };

  const handleAddRow = () => {
    if (!canAddMaterials) return;
    append({
      detailId: undefined,
      materialCode: "",
      materialName: "",
      spec: "",
      unit: "",
      quantity: 1,
      type: "",
      remark: "",
    });
  };

  const handleQuickAddSuccess = async (newMaterial: MaterialData) => {
    await refetchMaterials();
    // 如果当前有空行，自动选中新物资
    const currentMaterials = watch("materials");
    const emptyIndex = currentMaterials.findIndex((m) => !m.materialCode);
    if (emptyIndex !== -1) {
      setValue(
        `materials.${emptyIndex}.materialCode`,
        newMaterial.materialCode,
      );
      setValue(
        `materials.${emptyIndex}.materialName`,
        newMaterial.materialName,
      );
      setValue(`materials.${emptyIndex}.spec`, newMaterial.spec || "");
      setValue(`materials.${emptyIndex}.unit`, newMaterial.unit);
      setValue(`materials.${emptyIndex}.type`, newMaterial.type || "");
    }
  };

  const handleDeleteRow = async (index: number) => {
    const material = fields[index];
    const detailId = material?.detailId;
    if (detailId) {
      // 如果是已保存的明细，调用删除 API
      try {
        await deleteDetail.mutateAsync({
          id: detailId,
          applicationCode: application!.applicationCode,
        });
        toast.success("删除成功");
      } catch (error) {
        toast.error("删除失败");
        return;
      }
    }
    remove(index);
  };

  const scheduleQuantityUpdate = (detailId: number, quantity: number) => {
    if (!application || application.status !== 1) return;
    if (!detailId || Number.isNaN(quantity) || quantity <= 0) return;

    const existingTimer = quantityUpdateTimers.current[detailId];
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    quantityUpdateTimers.current[detailId] = setTimeout(async () => {
      try {
        await updateDetail.mutateAsync({
          id: detailId,
          data: { quantity },
        });
        toast.success("数量已更新");
      } catch (error) {
        console.error("更新明细失败:", error);
        toast.error("数量更新失败，请重试");
      }
    }, 500);
  };

  const onSubmit = async (data: FormValues) => {
    if (!application) return;

    const validMaterials = data.materials.filter(
      (m) => m.materialCode && m.quantity > 0,
    );

    if (validMaterials.length === 0) {
      toast.error("请至少添加一条有效的物资明细");
      return;
    }

    try {
      // 创建新明细（过滤掉已有 detailId 的）
      const newMaterials = validMaterials.filter((m) => !m.detailId);

      for (const material of newMaterials) {
        await createDetail.mutateAsync({
          applicationCode: application.applicationCode,
          materialCode: material.materialCode,
          materialName: material.materialName,
          spec: material.spec,
          unit: material.unit,
          quantity: material.quantity,
          type: material.type,
          remark: material.remark,
        });
      }

      let successMessage =
        newMaterials.length > 0
          ? `成功保存 ${newMaterials.length} 条物资明细`
          : "明细已保存";

      if (application.status === 0 && application.id) {
        await updateApplicationMutation.mutateAsync({
          id: application.id,
          data: { status: 1 },
        });
        successMessage = `${successMessage}，状态已更新为已保存`;
      }

      toast.success(successMessage);
      handleClose();
    } catch (error) {
      console.error("保存失败:", error);
      toast.error("保存失败，请重试");
    }
  };

  // 转换 materials 为 AutoComplete 需要的 options 格式
  const materialOptions = Array.isArray(materials)
    ? materials.map((m) => ({
        value: m.id.toString(),
        label: `${m.materialName} (${m.materialCode})`,
        materialCode: m.materialCode,
        materialName: m.materialName,
        spec: m.spec || "",
        unit: m.unit,
        type: m.type || "",
      }))
    : [];

  return (
    <>
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="!w-[70vw] !max-w-[70vw] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{application?.title}</DialogTitle>
          </DialogHeader>

          {canAddMaterials && (
            <div className="flex justify-end -mt-2 mb-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setIsQuickAddOpen(true)}
              >
                <PackagePlus className="mr-2 h-4 w-4" />
                新增物资
              </Button>
            </div>
          )}

          {loadingDetails ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-4">
                {fields.map((field, index) => {
                  const detailId = field.detailId;
                  return (
                    <div
                      key={field.id}
                      className="grid grid-cols-12 gap-3 p-4 border rounded-lg bg-muted/20"
                    >
                      <div className="col-span-3 space-y-2">
                        <Label>物资选择 *</Label>
                        <AutoComplete
                          options={materialOptions}
                          placeholder="搜索物资..."
                          emptyMessage="暂无物资"
                          value={materialOptions.find(
                            (opt) =>
                              opt.materialCode ===
                              watch(`materials.${index}.materialCode`),
                          )}
                          onValueChange={(option) => {
                            setValue(
                              `materials.${index}.materialCode`,
                              option.materialCode,
                            );
                            setValue(
                              `materials.${index}.materialName`,
                              option.materialName,
                            );
                            setValue(`materials.${index}.spec`, option.spec);
                            setValue(`materials.${index}.unit`, option.unit);
                            setValue(`materials.${index}.type`, option.type);
                          }}
                          disabled={!canEditRow(detailId)}
                        />
                      </div>

                      <div className="col-span-2 space-y-2">
                        <Label>物料编码</Label>
                        <Input
                          {...register(`materials.${index}.materialCode`)}
                          disabled
                          placeholder=""
                        />
                      </div>

                      <div className="col-span-2 space-y-2">
                        <Label>规格</Label>
                        <Input
                          {...register(`materials.${index}.spec`)}
                          disabled
                          placeholder=""
                        />
                      </div>

                      <div className="col-span-1 space-y-2">
                        <Label>单位</Label>
                        <Input
                          {...register(`materials.${index}.unit`)}
                          disabled
                          placeholder=""
                        />
                      </div>

                      <div className="col-span-2 space-y-2">
                        <Label>申请数量 *</Label>
                        <Input
                          type="number"
                          {...register(`materials.${index}.quantity`, {
                            valueAsNumber: true,
                            min: 1,
                            onChange: (event) => {
                              if (application?.status === 1 && detailId) {
                                const nextValue = Number(event.target.value);
                                scheduleQuantityUpdate(detailId, nextValue);
                              }
                            },
                          })}
                          disabled={!canModifyQuantities}
                          placeholder="数量"
                        />
                      </div>

                      <div className="col-span-1 space-y-2">
                        <Label>备注</Label>
                        <Input
                          {...register(`materials.${index}.remark`)}
                          disabled={!canEditRow(detailId)}
                          placeholder="备注"
                        />
                      </div>

                      {(canModifyStructure || !detailId) && (
                        <div className="col-span-1 flex items-end">
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            className="text-red-600 hover:text-red-800"
                            onClick={() => handleDeleteRow(index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  );
                })}

                {fields.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    暂无物资明细，点击下方按钮添加
                  </div>
                )}
              </div>

              {canAddMaterials && (
                <div className="flex justify-between items-center pt-4 border-t">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleAddRow}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    添加物资行
                  </Button>

                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleClose}
                    >
                      取消
                    </Button>
                    <Button
                      type="submit"
                      disabled={
                        createDetail.isPending || deleteDetail.isPending
                      }
                    >
                      {(createDetail.isPending || deleteDetail.isPending) && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      保存明细
                    </Button>
                  </div>
                </div>
              )}

              {!canAddMaterials && (
                <div className="flex justify-end pt-4 border-t">
                  <Button type="button" variant="outline" onClick={handleClose}>
                    关闭
                  </Button>
                </div>
              )}
            </form>
          )}
        </DialogContent>
      </Dialog>

      <MaterialQuickAddDialog
        open={isQuickAddOpen}
        onOpenChange={setIsQuickAddOpen}
        onSuccess={handleQuickAddSuccess}
      />
    </>
  );
}
