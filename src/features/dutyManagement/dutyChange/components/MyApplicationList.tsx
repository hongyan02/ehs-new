import { DataTable } from "@/components/ui/data-table";
import { useCancelDutyChange, useMyDutyChange } from "../query";
import useInfoStore from "@/stores/useUserInfo";
import { ColumnDef } from "@tanstack/react-table";
import { DutyChangeApplication, DutyChangeStatus } from "../types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import dayjs from "dayjs";
import { formatDateTime } from "@/utils";

export default function MyApplicationList() {
  const { username } = useInfoStore();
  const { data, isLoading } = useMyDutyChange({
    user_no: username || "",
  });
  const { mutate: cancel } = useCancelDutyChange();

  const renderShift = (shift?: number) => {
    if (shift === 0) return "白班";
    if (shift === 1) return "夜班";
    return "-";
  };

  const columns: ColumnDef<DutyChangeApplication>[] = [
    {
      accessorKey: "id",
      header: "申请编号",
    },
    {
      accessorKey: "from_date",
      header: "原值班日期",
      cell: ({ row }) => dayjs(row.original.from_date).format("YYYY-MM-DD"),
    },
    {
      accessorKey: "from_shift",
      header: "换班人班次",
      cell: ({ row }) => renderShift(row.original.from_shift),
    },
    {
      accessorKey: "to_name",
      header: "替班人",
    },
    {
      accessorKey: "to_date",
      header: "替班日期",
      cell: ({ row }) => dayjs(row.original.to_date).format("YYYY-MM-DD"),
    },
    {
      accessorKey: "to_shift",
      header: "被换人班次",
      cell: ({ row }) => renderShift(row.original.to_shift),
    },
    {
      accessorKey: "reason",
      header: "申请原因",
    },
    {
      accessorKey: "status",
      header: "状态",
      cell: ({ row }) => {
        const status = row.original.status;
        switch (status) {
          case DutyChangeStatus.PENDING:
            return <Badge variant="secondary">待审批</Badge>;
          case DutyChangeStatus.APPROVED:
            return <Badge variant="default">已通过</Badge>;
          case DutyChangeStatus.REJECTED:
            return <Badge variant="destructive">已拒绝</Badge>;
          case DutyChangeStatus.CANCELLED:
            return <Badge variant="outline">已取消</Badge>;
          default:
            return <Badge>未知</Badge>;
        }
      },
    },
    {
      accessorKey: "created_at",
      header: "申请时间",
      cell: ({ row }) => formatDateTime(row.original.created_at),
    },
    {
      id: "actions",
      header: "操作",
      cell: ({ row }) => {
        const isPending = row.original.status === DutyChangeStatus.PENDING;
        if (!isPending) return null;

        return (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="link" className="text-destructive h-auto p-0">
                取消
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>确定要取消申请吗？</AlertDialogTitle>
                <AlertDialogDescription>
                  此操作无法撤销。
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>取消</AlertDialogCancel>
                <AlertDialogAction onClick={() => cancel(row.original.id)}>
                  确定
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        );
      },
    },
  ];

  return (
    <div className="py-4">
      <DataTable columns={columns} data={data || []} isLoading={isLoading} />
    </div>
  );
}
