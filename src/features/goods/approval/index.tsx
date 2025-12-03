"use client";

import { useState } from "react";
import { toast } from "sonner";
import CustomPagination from "@/components/CustomPagination";
import PendingApplicationTable from "./components/pendingTable";
import {
  usePendingApplications,
  useUpdateApplicationStatus,
  type ApplicationData,
} from "./query";
import ApplicationDetailDialog from "./components/applicationDetailDialog";
import { useSubmitApplication } from "../application/query";
import useInfoStore from "@/stores/useUserInfo";

export default function ApprovalView() {
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [viewApplication, setViewApplication] =
    useState<ApplicationData | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const { data, isLoading, isError, refetch } = usePendingApplications({
    page,
    pageSize,
  });

  const pendingList = data?.data ?? [];

  const updateStatusMutation = useUpdateApplicationStatus();
  const submitLogsMutation = useSubmitApplication();
  const { nickname, username } = useInfoStore();

  const handleViewDetails = (application: ApplicationData) => {
    if (!application.id) return;
    setSelectedId(application.id);
    setViewApplication(application);
    setIsDialogOpen(true);
  };

  const handleDialogChange = (open: boolean) => {
    setIsDialogOpen(open);
    if (!open) {
      setViewApplication(null);
      setSelectedId(null);
    }
  };

  const handleStatusChange = async (status: number) => {
    if (!viewApplication?.id) {
      toast.error("请选择需要操作的申请单");
      return;
    }

    try {
      if (status === 3) {
        await submitLogsMutation.mutateAsync({
          applicationId: viewApplication.id,
          approver: nickname,
          approverNo: username,
        });
      } else {
        await updateStatusMutation.mutateAsync({
          id: viewApplication.id,
          data: { status },
        });
      }
      toast.success(status === 3 ? "已同意申请" : "已驳回申请");
      handleDialogChange(false);
      refetch();
    } catch (error: any) {
      const message = error?.data?.message;
      toast.error(typeof message === "string" ? message : "操作失败");
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div className="">
        {isLoading ? (
          <div className="py-10 text-center">加载中...</div>
        ) : isError ? (
          <div className="py-10 text-center text-red-500">
            加载失败，请稍后重试
          </div>
        ) : (
          <>
            <PendingApplicationTable
              data={pendingList}
              onView={handleViewDetails}
              selectedId={selectedId}
            />
            <CustomPagination
              page={page}
              pageSize={pageSize}
              total={data?.total || 0}
              onChange={(nextPage) => {
                setPage(nextPage);
                setSelectedId(null);
              }}
              className="mt-4 justify-end"
            />
          </>
        )}
      </div>

      <ApplicationDetailDialog
        open={isDialogOpen}
        onOpenChange={handleDialogChange}
        application={viewApplication}
        onApprove={() => handleStatusChange(3)}
        onReject={() => handleStatusChange(4)}
        isActionPending={
          updateStatusMutation.isPending || submitLogsMutation.isPending
        }
      />
    </div>
  );
}
