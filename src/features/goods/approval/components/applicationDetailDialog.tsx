"use client";

import type { ReactNode } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DataTable } from "@/components/ui/data-table";
import { STATUS_TEXT_MAP, getOperationLabel } from "../constants";
import type { ApplicationData } from "../query";
import {
  useApplicationDetails,
  type ApplicationDetailData,
} from "../../application/query";

interface ApplicationDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  application: ApplicationData | null;
  onApprove: () => void;
  onReject: () => void;
  isActionPending: boolean;
}

export default function ApplicationDetailDialog({
  open,
  onOpenChange,
  application,
  onApprove,
  onReject,
  isActionPending,
}: ApplicationDetailDialogProps) {
  const detailsEnabled = open && !!application?.applicationCode;
  const { data: detailList = [], isLoading: isDetailLoading } =
    useApplicationDetails(application?.applicationCode ?? "", detailsEnabled);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[70vw]! max-w-[70vw]! max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>申请详情</DialogTitle>
          <DialogDescription>
            {application
              ? `申请单号：${application.applicationCode}`
              : "请选择需要查看的申请单"}
          </DialogDescription>
        </DialogHeader>

        {application ? (
          <div className="space-y-6">
            <div className="flex flex-col gap-4 rounded-lg border bg-muted/40 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-2 text-sm text-muted-foreground">
                <div>操作类型：{getOperationLabel(application.operation)}</div>
                <div>申请人：{application.applicant}</div>
              </div>
              <div className="flex flex-wrap gap-3">
                <Button onClick={onApprove} disabled={isActionPending}>
                  同意
                </Button>
                <Button
                  variant="destructive"
                  onClick={onReject}
                  disabled={isActionPending}
                >
                  驳回
                </Button>
              </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-[1.6fr_minmax(0,1fr)]">
              <section className="space-y-3">
                <header className="flex items-center justify-between">
                  <h3 className="text-base font-semibold">申请明细</h3>
                  <Badge variant="secondary">
                    {STATUS_TEXT_MAP[application.status] ?? "未知"}
                  </Badge>
                </header>
                <DetailTable details={detailList} isLoading={isDetailLoading} />
              </section>

              <section className="space-y-3">
                <h3 className="text-base font-semibold">基础信息</h3>
                <BaseInfo application={application} />
              </section>
            </div>
          </div>
        ) : (
          <div className="py-8 text-center text-sm text-muted-foreground">
            暂无选中的申请单
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

const BaseInfo = ({ application }: { application: ApplicationData }) => (
  <div className="rounded-lg border bg-muted/30 p-4 text-sm">
    <dl className="grid gap-3 sm:grid-cols-2">
      <InfoItem label="申请单号" value={application.applicationCode} />
      <InfoItem
        label="状态"
        value={STATUS_TEXT_MAP[application.status] ?? "未知"}
      />
      <InfoItem label="标题" value={application.title} />
      <InfoItem
        label="操作类型"
        value={getOperationLabel(application.operation)}
      />
      <InfoItem label="申请人" value={application.applicant} />
      <InfoItem label="申请人工号" value={application.applicantNo} />
      <InfoItem label="申请时间" value={application.applicationTime} />
      {application.origin && (
        <InfoItem label="来源" value={application.origin} />
      )}
      {application.purpose && (
        <InfoItem label="用途" value={application.purpose} fullWidth />
      )}
    </dl>
  </div>
);

const InfoItem = ({
  label,
  value,
  fullWidth = false,
}: {
  label: string;
  value: ReactNode;
  fullWidth?: boolean;
}) => (
  <div className={fullWidth ? "sm:col-span-2" : undefined}>
    <dt className="text-muted-foreground">{label}：</dt>
    <dd className="font-medium text-foreground">{value}</dd>
  </div>
);

const detailColumns: ColumnDef<ApplicationDetailData>[] = [
  {
    accessorKey: "materialCode",
    header: "物料编码",
  },
  {
    accessorKey: "materialName",
    header: "物料名称",
  },
  {
    accessorKey: "spec",
    header: "规格",
    cell: ({ row }) => row.original.spec || "-",
  },
  {
    accessorKey: "unit",
    header: "单位",
  },
  {
    accessorKey: "quantity",
    header: "数量",
  },
  {
    accessorKey: "remark",
    header: "备注",
    cell: ({ row }) => row.original.remark || "-",
  },
];

const DetailTable = ({
  details,
  isLoading,
}: {
  details: ApplicationDetailData[];
  isLoading: boolean;
}) => (
  <DataTable
    columns={detailColumns}
    data={details}
    isLoading={isLoading}
    emptyText="暂无明细"
  />
);
