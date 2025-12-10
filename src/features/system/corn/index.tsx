"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { ColumnDef } from "@tanstack/react-table";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    useCreateSchedulerTask,
    useDeleteSchedulerTask,
    useSchedulerTasks,
    useTriggerSchedulerTask,
    useUpdateSchedulerTask,
    type SchedulerTask,
    type SchedulerTaskPayload,
} from "./query";

type FormValues = {
    name: string;
    jobKey: string;
    cron: string;
    enabled: boolean;
    shift: string;
    content: string;
};

const JOB_KEY_OPTIONS = [
    { value: "send-duty-leader-text", label: "值班日志填写提醒" },
];

const formatDate = (val?: string | null) => {
    if (!val) return "-";
    return val.replace("T", " ");
};

export default function CornView() {
    const { data: tasks = [], isLoading } = useSchedulerTasks();
    const createMutation = useCreateSchedulerTask();
    const updateMutation = useUpdateSchedulerTask();
    const deleteMutation = useDeleteSchedulerTask();
    const triggerMutation = useTriggerSchedulerTask();

    const [open, setOpen] = useState(false);
    const [editing, setEditing] = useState<SchedulerTask | null>(null);
    const form = useForm<FormValues>({
        defaultValues: {
            name: "",
            jobKey: JOB_KEY_OPTIONS[0].value,
            cron: "",
            enabled: true,
            shift: "0",
            content: "",
        },
    });

    const extractShift = (payload: unknown): string => {
        if (typeof payload === "string") {
            try {
                const parsed = JSON.parse(payload);
                return parsed?.shift === 1 || parsed?.shift === "1" ? "1" : "0";
            } catch {
                return "0";
            }
        }
        if (payload && typeof payload === "object" && "shift" in payload) {
            const value = (payload as { shift?: unknown }).shift;
            return value === 1 || value === "1" ? "1" : "0";
        }
        return "0";
    };

    const extractContent = (payload: unknown): string => {
        if (typeof payload === "string") {
            try {
                const parsed = JSON.parse(payload);
                return typeof parsed?.content === "string" ? parsed.content : "";
            } catch {
                return "";
            }
        }
        if (payload && typeof payload === "object" && "content" in payload) {
            const value = (payload as { content?: unknown }).content;
            return typeof value === "string" ? value : "";
        }
        return "";
    };

    const resetForm = (task?: SchedulerTask | null) => {
        if (!task) {
            form.reset({
                name: "",
                jobKey: JOB_KEY_OPTIONS[0].value,
                cron: "",
                enabled: true,
                shift: "0",
                content: "",
            });
            return;
        }

        form.reset({
            name: task.name,
            jobKey: task.jobKey,
            cron: task.cron || "",
            enabled: !!task.enabled,
            shift: extractShift(task.payload),
            content: extractContent(task.payload),
        });
    };

    const handleSubmit = async (values: FormValues) => {
        const shift = values.shift === "1" ? 1 : 0;
        const payload: SchedulerTaskPayload = {
            name: values.name.trim(),
            jobKey: values.jobKey,
            cron: values.cron.trim() ? values.cron.trim() : null,
            enabled: values.enabled,
            payload: {
                shift,
                content: values.content?.trim() || undefined,
            },
        };

        try {
            if (editing) {
                await updateMutation.mutateAsync({ id: editing.id, payload });
                toast.success("更新成功");
            } else {
                await createMutation.mutateAsync(payload);
                toast.success("创建成功");
            }
            setOpen(false);
            setEditing(null);
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "保存失败");
        }
    };

    const handleDelete = async (task: SchedulerTask) => {
        if (!confirm(`确定删除任务「${task.name}」?`)) return;
        try {
            await deleteMutation.mutateAsync(task.id);
            toast.success("删除成功");
        } catch (error) {
            console.error(error);
            toast.error("删除失败");
        }
    };

    const handleTrigger = async (task: SchedulerTask) => {
        try {
            await triggerMutation.mutateAsync(task.id);
            toast.success("已触发执行");
        } catch (error) {
            console.error(error);
            toast.error("触发失败");
        }
    };

    const columns: ColumnDef<SchedulerTask>[] = [
        {
            accessorKey: "name",
            header: "任务名称",
        },
        {
            accessorKey: "jobKey",
            header: "Job Key",
        },
        {
            accessorKey: "cron",
            header: "Cron 表达式",
            cell: ({ row }) => row.original.cron || <span className="text-muted-foreground">手动</span>,
        },
        {
            accessorKey: "enabled",
            header: "状态",
            cell: ({ row }) =>
                row.original.enabled ? (
                    <Badge className="bg-green-500 hover:bg-green-500">启用</Badge>
                ) : (
                    <Badge variant="outline">停用</Badge>
                ),
        },
        {
            accessorKey: "payload",
            header: "班次",
            cell: ({ row }) => (extractShift(row.original.payload) === "1" ? "夜班" : "白班"),
        },
        {
            accessorKey: "payloadContent",
            header: "自定义内容",
            cell: ({ row }) => {
                const content = extractContent(row.original.payload);
                return content ? (
                    <span className="line-clamp-2 max-w-xs break-all">{content}</span>
                ) : (
                    "-"
                );
            },
        },
        {
            accessorKey: "lastRunAt",
            header: "上次执行时间",
            cell: ({ row }) => formatDate(row.original.lastRunAt),
        },
        {
            accessorKey: "lastStatus",
            header: "上次结果",
            cell: ({ row }) => {
                const status = row.original.lastStatus;
                if (!status) return "-";
                const isOk = status === "success";
                return (
                    <Badge className={isOk ? "bg-green-500 hover:bg-green-500" : "bg-red-500 hover:bg-red-500"}>
                        {isOk ? "成功" : "失败"}
                    </Badge>
                );
            },
        },
        {
            accessorKey: "lastError",
            header: "错误信息",
            cell: ({ row }) =>
                row.original.lastError ? (
                    <span className="line-clamp-2 max-w-xs break-all">{row.original.lastError}</span>
                ) : (
                    "-"
                ),
        },
        {
            id: "actions",
            header: "操作",
            cell: ({ row }) => {
                const task = row.original;
                return (
                    <div className="flex gap-2">
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleTrigger(task)}
                            disabled={triggerMutation.isPending}
                        >
                            触发
                        </Button>
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                                setEditing(task);
                                resetForm(task);
                                setOpen(true);
                            }}
                        >
                            编辑
                        </Button>
                        <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDelete(task)}
                            disabled={deleteMutation.isPending}
                        >
                            删除
                        </Button>
                    </div>
                );
            },
        },
    ];

    return (
        <div className="space-y-4 p-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-semibold">定时任务</h2>
                    <p className="text-sm text-muted-foreground">支持 cron 表达式与手动触发</p>
                </div>
                <Button
                    onClick={() => {
                        setEditing(null);
                        resetForm(null);
                        setOpen(true);
                    }}
                >
                    新建任务
                </Button>
            </div>

            <DataTable columns={columns} data={tasks} isLoading={isLoading} />

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="max-w-xl">
                    <DialogHeader>
                        <DialogTitle>{editing ? "编辑任务" : "新建任务"}</DialogTitle>
                    </DialogHeader>

                    <form
                        className="space-y-4"
                        onSubmit={form.handleSubmit(handleSubmit)}
                    >
                        <div className="space-y-2">
                            <Label htmlFor="name">任务名称</Label>
                            <Input
                                id="name"
                                placeholder="例如：白班领导提醒"
                                {...form.register("name", { required: true })}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="jobKey">Job Key</Label>
                            <select
                                id="jobKey"
                                className="w-full rounded-md border px-3 py-2 text-sm"
                                {...form.register("jobKey", { required: true })}
                            >
                                {JOB_KEY_OPTIONS.map((opt) => (
                                    <option key={opt.value} value={opt.value}>
                                        {opt.label} ({opt.value})
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="cron">Cron 表达式（留空则仅手动触发）</Label>
                            <Input
                                id="cron"
                                placeholder="如：0 9 * * *"
                                {...form.register("cron")}
                            />
                        </div>

                        <div className="flex items-center gap-2">
                            <input
                                id="enabled"
                                type="checkbox"
                                className="h-4 w-4"
                                {...form.register("enabled")}
                            />
                            <Label htmlFor="enabled">启用</Label>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="shift">班次</Label>
                            <select
                                id="shift"
                                className="w-full rounded-md border px-3 py-2 text-sm"
                                {...form.register("shift")}
                            >
                                <option value="0">白班</option>
                                <option value="1">夜班</option>
                            </select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="content">自定义内容（可选）</Label>
                            <Input
                                id="content"
                                placeholder="不填写则使用默认提醒文案"
                                {...form.register("content")}
                            />
                        </div>

                        <div className="flex justify-end gap-2 pt-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => {
                                    setOpen(false);
                                    setEditing(null);
                                }}
                            >
                                取消
                            </Button>
                            <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                                {editing ? "保存" : "创建"}
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
