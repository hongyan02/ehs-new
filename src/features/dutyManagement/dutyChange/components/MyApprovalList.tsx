import { DataTable } from "@/components/ui/data-table";
import {
  useApproveDutyChange,
  useMyDutyChange,
  useRejectDutyChange,
  useSwapDutySchedule,
} from "../query";
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
import { useMemo } from "react";
import { message } from "antd";
import { formatDateTime } from "@/utils";

export default function MyApprovalList() {
  const { username } = useInfoStore();
  const { data, isLoading } = useMyDutyChange({
    user_no: username || "",
  });
  const { mutate: approve, isPending: isApproving } = useApproveDutyChange();
  const { mutate: reject } = useRejectDutyChange();
  const { mutate: swapSchedule, isPending: isSwapping } = useSwapDutySchedule();

  // 过滤出需要我审批的申请 (我是被换人)
  const myApprovals = useMemo(() => {
    return data?.filter((item) => item.to_no === username) || [];
  }, [data, username]);

  const renderShift = (shift?: number) => {
    if (shift === 0) return "白班";
    if (shift === 1) return "夜班";
    return "-";
  };

  const handleApprove = (application: DutyChangeApplication) => {
    if (application.from_shift == null || application.to_shift == null) {
      message.error("缺少班次信息，无法互换排班");
      return;
    }

    if (application.from_shift !== application.to_shift) {
      message.error("换班双方班次不一致，无法互换排班");
      return;
    }

    approve(application.id, {
      onSuccess: () => {
        swapSchedule({
          from_no: application.from_no,
          from_date: application.from_date,
          to_no: application.to_no,
          to_date: application.to_date,
          shift: application.from_shift,
        });
      },
    });
  };

  const actionDisabled = isApproving || isSwapping;

  const columns: ColumnDef<DutyChangeApplication>[] = [
    {
      accessorKey: "id",
      header: "ID",
    },
    {
      accessorKey: "from_name",
      header: "申请人",
      cell: ({ row }) => (
        <span>
          {row.original.from_name} ({row.original.from_no})
        </span>
      ),
    },
    {
      accessorKey: "from_date",
      header: "换班日期",
    },
    {
      accessorKey: "from_shift",
      header: "换班人班次",
      cell: ({ row }) => renderShift(row.original.from_shift),
    },
    {
      accessorKey: "to_date",
      header: "被换日期",
    },
    {
      accessorKey: "to_shift",
      header: "被换人班次",
      cell: ({ row }) => renderShift(row.original.to_shift),
    },
    {
      accessorKey: "reason",
      header: "原因",
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
            return <Badge variant="default">已同意</Badge>;
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

        if (isPending) {
          return (
            <div className="flex gap-2">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="link" size="sm" className="h-auto p-0">
                    同意
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>确定同意该申请吗？</AlertDialogTitle>
                    <AlertDialogDescription>
                      同意后将自动更新排班表。
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>取消</AlertDialogCancel>
                    <AlertDialogAction
                      disabled={actionDisabled}
                      onClick={() => handleApprove(row.original)}
                    >
                      确定
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="link"
                    size="sm"
                    className="text-destructive h-auto p-0"
                  >
                    拒绝
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>确定拒绝该申请吗？</AlertDialogTitle>
                    <AlertDialogDescription>
                      拒绝后将通知申请人。
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>取消</AlertDialogCancel>
                    <AlertDialogAction onClick={() => reject(row.original.id)}>
                      确定
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          );
        }
        return null;
      },
    },
  ];

  return (
    <div className="py-4">
      <DataTable columns={columns} data={myApprovals} isLoading={isLoading} />
    </div>
  );
}
