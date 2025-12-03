"use client";

import {
    flexRender,
    getCoreRowModel,
    useReactTable,
    createColumnHelper,
    type ColumnDef,
} from "@tanstack/react-table";
import type { ApplicationData } from "../query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/utils";
import { getOperationLabel, STATUS_TEXT_MAP } from "../constants";

const columnHelper = createColumnHelper<ApplicationData>();

const columns = (
    onView: (application: ApplicationData) => void,
): ColumnDef<ApplicationData, any>[] => [
    columnHelper.accessor("applicationCode", {
        header: "申请单号",
        cell: (info) => info.getValue() || "-",
    }),
    columnHelper.accessor("title", {
        header: "标题",
        cell: (info) => info.getValue() || "-",
    }),
    columnHelper.accessor("applicant", {
        header: "申请人",
        cell: (info) => info.getValue() || "-",
    }),
    columnHelper.accessor("operation", {
        header: "操作类型",
        cell: (info) => getOperationLabel(info.getValue()),
    }),
    columnHelper.accessor("applicationTime", {
        header: "申请时间",
        cell: (info) => info.getValue() || "-",
    }),
    columnHelper.accessor("status", {
        header: "状态",
        cell: (info) => (
            <Badge variant="outline">
                {STATUS_TEXT_MAP[info.getValue()] ?? "待审核"}
            </Badge>
        ),
    }),
    columnHelper.display({
        id: "actions",
        header: () => <div className="text-right">操作</div>,
        cell: (info) => (
            <div className="text-right">
                <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onView(info.row.original)}
                >
                    查看
                </Button>
            </div>
        ),
    }),
];

interface PendingTableProps {
    data: ApplicationData[];
    onView: (application: ApplicationData) => void;
    selectedId: number | null;
}

export default function PendingApplicationTable({
    data,
    onView,
    selectedId,
}: PendingTableProps) {
    const table = useReactTable({
        data,
        columns: columns(onView),
        getCoreRowModel: getCoreRowModel(),
    });

    return (
        <div className="rounded-md border">
            <table className="w-full border-collapse text-sm">
                <thead className="bg-muted/50">
                    {table.getHeaderGroups().map((headerGroup) => (
                        <tr
                            key={headerGroup.id}
                            className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted"
                        >
                            {headerGroup.headers.map((header) => (
                                <th
                                    key={header.id}
                                    className="h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0"
                                >
                                    {header.isPlaceholder
                                        ? null
                                        : flexRender(
                                            header.column.columnDef.header,
                                            header.getContext(),
                                        )}
                                </th>
                            ))}
                        </tr>
                    ))}
                </thead>
                <tbody className="[&_tr:last-child]:border-0">
                    {table.getRowModel().rows.length > 0 ? (
                        table.getRowModel().rows.map((row) => (
                            <tr
                                key={row.id}
                                data-state={
                                    row.original.id && row.original.id === selectedId
                                        ? "selected"
                                        : undefined
                                }
                                className={cn(
                                    "border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted",
                                    row.original.id === selectedId ? "bg-muted/40" : undefined,
                                )}
                            >
                                {row.getVisibleCells().map((cell) => (
                                    <td
                                        key={cell.id}
                                        className="p-4 align-middle [&:has([role=checkbox])]:pr-0"
                                    >
                                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                    </td>
                                ))}
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan={table.getAllColumns().length} className="h-24 text-center">
                                暂无数据
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
}
