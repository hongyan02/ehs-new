"use client";

import {
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { createColumnHelper } from "@tanstack/react-table";
import type { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { ApplicationData } from "../query";
import { useState } from "react";
import ApplicationDetailDialog from "./applicationDetailDialog";

const column = createColumnHelper<ApplicationData>();

const getStatusText = (status: number) => {
  switch (status) {
    case 0:
      return "未提交";
    case 1:
      return "已保存";
    case 2:
      return "待审核";
    case 3:
      return "已完成";
    case 4:
      return "已驳回";
    case 5:
      return "废弃";
    default:
      return "未知";
  }
};

const getStatusVariant = (status: number) => {
  switch (status) {
    case 0:
      return "outline";
    case 1:
      return "secondary";
    case 2:
      return "default";
    case 3:
      return "default";
    case 4:
      return "destructive";
    case 5:
      return "outline";
    default:
      return "outline";
  }
};

const getOperationText = (operation: string) => {
  return operation === "IN" ? "入库" : "出库";
};

export const applicationColumns = (
  onView: (application: ApplicationData) => void,
  onDelete: (id: number) => void,
  onSubmit: (application: ApplicationData) => void,
  submittingId: number | null = null,
): ColumnDef<ApplicationData, any>[] => [
  column.accessor("applicationCode", {
    header: "申请单号",
    cell: (info) => <span className="font-medium">{info.getValue()}</span>,
  }),

  column.accessor("title", {
    header: "标题",
    cell: (info) => info.getValue(),
  }),

  column.accessor("operation", {
    header: "操作类型",
    cell: (info) => (
      <Badge variant="outline">{getOperationText(info.getValue())}</Badge>
    ),
  }),

  column.accessor("applicant", {
    header: "申请人",
    cell: (info) => info.getValue(),
  }),

  column.accessor("approver", {
    header: "审批人",
    cell: (info) => info.getValue(),
  }),

  column.accessor("applicationTime", {
    header: "申请时间",
    cell: (info) => info.getValue(),
  }),

  column.accessor("approveTime", {
    header: "审批时间",
    cell: (info) => info.getValue(),
  }),

  column.accessor("status", {
    header: "状态",
    cell: (info) => (
      <Badge variant={getStatusVariant(info.getValue()) as any}>
        {getStatusText(info.getValue())}
      </Badge>
    ),
  }),

  column.display({
    id: "actions",
    header: "操作",
    cell: (info) => {
      const row = info.row.original;
      const canSubmit = row.status === 0 || row.status === 1;
      const canDelete = row.status !== 3 && row.status !== 5;
      const isRowSubmitting =
        submittingId !== null && row.id != null && row.id === submittingId;
      return (
        <div className="flex gap-1">
          <Button
            size="sm"
            variant="ghost"
            className="text-blue-400/90 hover:text-blue-800"
            onClick={() => onView(row)}
          >
            查看
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="text-green-600 hover:text-green-700 disabled:opacity-50"
            disabled={!canSubmit || isRowSubmitting}
            onClick={() => canSubmit && !isRowSubmitting && onSubmit(row)}
          >
            {isRowSubmitting ? "提交中..." : "提交"}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="text-red-600 hover:text-red-800"
            disabled={!canDelete}
            onClick={() => canDelete && row.id && onDelete(row.id)}
          >
            删除
          </Button>
        </div>
      );
    },
  }),
];

interface ApplicationTableProps {
  data: ApplicationData[];
  onDelete: (id: number) => void;
  onSubmit: (application: ApplicationData) => void;
  submittingId: number | null;
}

export default function ApplicationTable({
  data,
  onDelete,
  onSubmit,
  submittingId,
}: ApplicationTableProps) {
  const [viewApplication, setViewApplication] =
    useState<ApplicationData | null>(null);
  const [isViewOpen, setIsViewOpen] = useState(false);

  const handleView = (application: ApplicationData) => {
    setViewApplication(application);
    setIsViewOpen(true);
  };

  const columns = applicationColumns(
    handleView,
    onDelete,
    onSubmit,
    submittingId,
  );

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <>
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
                    className="h-12 px-2 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0"
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
                  className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted"
                >
                  {row.getVisibleCells().map((cell) => (
                    <td
                      key={cell.id}
                      className="p-4 align-middle [&:has([role=checkbox])]:pr-0"
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length} className="h-24 text-center">
                  暂无数据
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <ApplicationDetailDialog
        open={isViewOpen}
        onOpenChange={setIsViewOpen}
        application={viewApplication}
      />
    </>
  );
}
