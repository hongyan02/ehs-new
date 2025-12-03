"use client";

import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

export interface SearchFormData {
    title?: string;
    applicant?: string;
    status?: number;
    operation?: "IN" | "OUT";
}

interface SearchFormProps {
    onSearch: (data: SearchFormData) => void;
    onReset?: () => void;
}

export default function SearchForm({ onSearch, onReset }: SearchFormProps) {
    const { register, handleSubmit, reset } = useForm<SearchFormData>();
    const [status, setStatus] = useState<number | undefined>();
    const [operation, setOperation] = useState<"IN" | "OUT" | undefined>();

    const statusValue = status !== undefined ? String(status) : "all";
    const operationValue = operation || "all";

    const onSubmit = (data: SearchFormData) => {
        const formData: SearchFormData = {
            ...data,
        };

        if (status !== undefined) {
            formData.status = status;
        }

        if (operation) {
            formData.operation = operation;
        }

        // 过滤空字符串
        if (!formData.title) delete formData.title;
        if (!formData.applicant) delete formData.applicant;

        onSearch(formData);
    };

    const handleReset = () => {
        setStatus(undefined);
        setOperation(undefined);
        reset();
        onReset?.();
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="flex flex-wrap gap-4 items-end">
                {/* 标题 */}
                <div className="flex items-center gap-2">
                    <label className="text-sm font-medium whitespace-nowrap">标题</label>
                    <div className="flex-1 min-w-[150px]">
                        <Input
                            placeholder="请输入标题"
                            {...register("title")}
                        />
                    </div>
                </div>

                {/* 申请人 */}
                <div className="flex items-center gap-2">
                    <label className="text-sm font-medium whitespace-nowrap">申请人</label>
                    <div className="flex-1 min-w-[150px]">
                        <Input
                            placeholder="请输入申请人"
                            {...register("applicant")}
                        />
                    </div>
                </div>

                {/* 状态选择 */}
                <div className="flex items-center gap-2">
                    <label className="text-sm font-medium whitespace-nowrap">状态</label>
                    <Select
                        value={statusValue}
                        onValueChange={(value) =>
                            setStatus(value === "all" ? undefined : Number(value))
                        }
                    >
                        <SelectTrigger className="w-[120px]">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">全部</SelectItem>
                            <SelectItem value="0">未提交</SelectItem>
                            <SelectItem value="1">已保存</SelectItem>
                            <SelectItem value="2">待审核</SelectItem>
                            <SelectItem value="3">已完成</SelectItem>
                            <SelectItem value="4">已驳回</SelectItem>
                            <SelectItem value="5">废弃</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* 操作类型选择 */}
                <div className="flex items-center gap-2">
                    <label className="text-sm font-medium whitespace-nowrap">类别</label>
                    <Select
                        value={operationValue}
                        onValueChange={(value) =>
                            setOperation(value === "all" ? undefined : value as "IN" | "OUT")
                        }
                    >
                        <SelectTrigger className="w-[120px]">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">全部</SelectItem>
                            <SelectItem value="IN">入库</SelectItem>
                            <SelectItem value="OUT">出库</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* 按钮 */}
                <div className="flex gap-2">
                    <Button type="submit">查询</Button>
                    <Button type="button" variant="outline" onClick={handleReset}>
                        重置
                    </Button>
                </div>
            </div>
        </form>
    );
}
