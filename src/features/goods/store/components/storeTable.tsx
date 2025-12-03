"use client";

import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  createColumnHelper,
} from "@tanstack/react-table";
import type { ColumnDef } from "@tanstack/react-table";
import type { MaterialData } from "../query/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const column = createColumnHelper<MaterialData>();

export const createStoreColumns = (
  onEdit: (material: MaterialData) => void,
): ColumnDef<MaterialData, any>[] => [
  column.accessor("materialCode", {
    header: "物料编码",
    cell: (info) => info.getValue(),
  }),
  column.accessor("materialName", {
    header: "物料名称",
    cell: (info) => info.getValue(),
  }),
  column.accessor("spec", {
    header: "规格型号",
    cell: (info) => info.getValue() || "-",
  }),
  column.accessor("unit", {
    header: "单位",
    cell: (info) => info.getValue(),
  }),
  column.accessor("num", {
    header: "当前库存",
    cell: (info) => {
      const num = info.getValue();
      const threshold = info.row.original.threshold;
      const isLowStock = num <= threshold;
      return (
        <span className={isLowStock ? "text-red-600 font-bold" : ""}>
          {num}
        </span>
      );
    },
  }),
  column.accessor("threshold", {
    header: "阀值",
    cell: (info) => info.getValue(),
  }),
  column.accessor("type", {
    header: "类别",
    cell: (info) => {
      const type = info.getValue();
      return type ? <Badge variant="outline">{type}</Badge> : "-";
    },
  }),
  column.accessor("location", {
    header: "存放位置",
    cell: (info) => info.getValue() || "-",
  }),
  column.accessor("supplier", {
    header: "供应商",
    cell: (info) => info.getValue() || "-",
  }),
  column.accessor("updateTime", {
    header: "更新时间",
    cell: (info) => info.getValue(),
  }),
  column.display({
    id: "actions",
    header: "操作",
    cell: (info) => (
      <Button
        size="sm"
        variant="ghost"
        className="text-blue-600 hover:text-blue-800"
        onClick={() => onEdit(info.row.original)}
      >
        编辑
      </Button>
    ),
  }),
];

interface StoreTableProps {
  data: MaterialData[];
  onEdit: (material: MaterialData) => void;
}

export default function StoreTable({ data, onEdit }: StoreTableProps) {
  const columns = createStoreColumns(onEdit);
  const table = useReactTable({
    data,
    columns,
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
                className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted"
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
              <td colSpan={columns.length} className="h-24 text-center">
                暂无数据
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
