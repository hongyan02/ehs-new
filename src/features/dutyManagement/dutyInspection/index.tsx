"use client";

import { useMemo, useState } from "react";
import { format } from "date-fns";
import { toast } from "sonner";
import { DatePicker } from "@/components/ui/date-picker";
import { Button } from "@/components/ui/button";
import {
    Table,
    TableBody,
    TableCaption,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useDutyInspection, type DutyInspectionItem, type DutyInspectionParams } from "./query";

const formatShift = (shift: number) => (shift === 0 ? "白班" : "夜班");

export default function DutyInspectionView() {
    const [startDate, setStartDate] = useState<Date | undefined>();
    const [endDate, setEndDate] = useState<Date | undefined>();
    const [query, setQuery] = useState<DutyInspectionParams | null>(null);

    const inspectionMutation = useDutyInspection();
    const data = inspectionMutation.data ?? [];

    const handleSearch = async () => {
        if (!startDate || !endDate) {
            toast.error("请选择开始和结束日期");
            return;
        }

        const formattedStart = format(startDate, "yyyy-MM-dd");
        const formattedEnd = format(endDate, "yyyy-MM-dd");

        if (formattedStart > formattedEnd) {
            toast.error("开始日期不能大于结束日期");
            return;
        }

        const params = {
            startDate: formattedStart,
            endDate: formattedEnd,
        };

        setQuery(params);
        try {
            await inspectionMutation.mutateAsync(params);
        } catch (error) {
            toast.error("查询失败，请稍后重试");
        }
    };

    const handleReset = () => {
        setStartDate(undefined);
        setEndDate(undefined);
        setQuery(null);
        inspectionMutation.reset();
    };

    const summaryText = useMemo(() => {
        if (!query) return "请选择日期范围后查询";
        return `共 ${data.length} 条缺失日志`;
    }, [data.length, query]);

    return (
        <div className="space-y-6">
            <div className="rounded-lg text-card-foreground ">
                <div className="flex flex-wrap items-end gap-4 px-6 py-4">
                    <div className="flex flex-col gap-2">
                        <label className="text-sm font-medium text-muted-foreground">
                            开始日期
                        </label>
                        <DatePicker
                            date={startDate}
                            onSelect={setStartDate}
                            placeholder="选择开始日期"
                        />
                    </div>
                    <div className="flex flex-col gap-2">
                        <label className="text-sm font-medium text-muted-foreground">
                            结束日期
                        </label>
                        <DatePicker
                            date={endDate}
                            onSelect={setEndDate}
                            placeholder="选择结束日期"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <Button onClick={handleSearch}>查询</Button>
                        <Button variant="outline" onClick={handleReset}>
                            重置
                        </Button>
                    </div>
                </div>
            </div>

            <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
                <div className="flex items-center justify-between border-b px-6 py-4">
                    <div>
                        <p className="text-base font-semibold">{summaryText}</p>
                    </div>
                    {query && (
                        <div className="text-sm text-muted-foreground">
                            查询范围：{query.startDate} 至 {query.endDate}
                        </div>
                    )}
                </div>

                {inspectionMutation.isPending ? (
                    <div className="py-10 text-center text-sm text-muted-foreground">
                        查询中，请稍候...
                    </div>
                ) : inspectionMutation.isError ? (
                    <div className="py-10 text-center text-sm text-destructive">
                        查询失败，请稍后重试
                    </div>
                ) : !query ? (
                    <div className="py-10 text-center text-sm text-muted-foreground">
                        尚未查询，请先选择日期范围
                    </div>
                ) : data.length === 0 ? (
                    <div className="py-10 text-center text-sm text-muted-foreground">
                        所选日期内没有缺失日志
                    </div>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-32">日期</TableHead>
                                <TableHead className="w-24">班次</TableHead>
                                <TableHead>值班领导</TableHead>
                                <TableHead>工号</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {data.map((item: DutyInspectionItem) => (
                                <TableRow key={`${item.date}-${item.shift}`}>
                                    <TableCell className="font-medium">{item.date}</TableCell>
                                    <TableCell>
                                        <Badge variant={item.shift === 0 ? "secondary" : "default"}>
                                            {formatShift(item.shift)}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>{item.name}</TableCell>
                                    <TableCell>{item.no}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
            </div>
        </div>
    );
}
