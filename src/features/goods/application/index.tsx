"use client";

import { useState } from "react";
import SearchForm, { type SearchFormData } from "./components/searchForm";
import ApplicationTable from "./components/applicationTable";
import ApplicationForm from "./components/applicationForm";
import CustomPagination from "@/components/CustomPagination";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  useApplications,
  useDeleteApplication,
  useCreateApplication,
  useUpdateApplication,
  useSubmitApplication,
  type ApplicationData,
  type ApplicationPayload,
} from "./query";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

export default function ApplicationView() {
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [searchParams, setSearchParams] = useState<SearchFormData>({});
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [submittingId, setSubmittingId] = useState<number | null>(null);
  const [viewApplication, setViewApplication] =
    useState<ApplicationData | null>(null);
  const [editApplication, setEditApplication] =
    useState<ApplicationData | null>(null);

  // 查询数据
  const { data, isLoading, error } = useApplications({
    page,
    pageSize,
    ...searchParams,
  });

  // 删除mutation
  const deleteMutation = useDeleteApplication();
  // 创建mutation
  const createMutation = useCreateApplication();
  // 更新mutation
  const updateMutation = useUpdateApplication();
  const submitMutation = useSubmitApplication();

  const handleSearch = (params: SearchFormData) => {
    setSearchParams(params);
    setPage(1); // 重置到第一页
  };

  const handleReset = () => {
    setSearchParams({});
    setPage(1);
  };

  const handleView = (application: ApplicationData) => {
    setViewApplication(application);
  };

  const handleEdit = (application: ApplicationData) => {
    setEditApplication(application);
    setIsEditOpen(true);
  };

  const handleDelete = (id: number) => {
    setDeleteId(id);
  };

  const handleSubmitApplication = async (application: ApplicationData) => {
    if (!application.id) return;
    if (application.status !== 0 && application.status !== 1) {
      toast.error("当前状态不可提交");
      return;
    }

    setSubmittingId(application.id);
    try {
      await submitMutation.mutateAsync({ applicationId: application.id });
      toast.success("提交成功");
    } catch (error: any) {
      console.error(error);
      const message = error?.data?.message;
      toast.error(typeof message === "string" ? message : "提交失败");
    } finally {
      setSubmittingId(null);
    }
  };

  const confirmDelete = async () => {
    if (deleteId === null) return;

    try {
      await deleteMutation.mutateAsync(deleteId);
      toast.success("删除成功");
      setDeleteId(null);
    } catch (error) {
      toast.error("删除失败");
    }
  };

  const handleCreate = async (data: ApplicationPayload) => {
    try {
      await createMutation.mutateAsync(data);
      setIsCreateOpen(false);
      toast.success("创建成功");
    } catch (error) {
      console.error(error);
      toast.error("创建失败");
    }
  };

  const handleUpdate = async (data: ApplicationPayload) => {
    if (!editApplication?.id) return;

    try {
      await updateMutation.mutateAsync({ id: editApplication.id, data });
      setIsEditOpen(false);
      setEditApplication(null);
      toast.success("更新成功");
    } catch (error) {
      console.error(error);
      toast.error("更新失败");
    }
  };

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

  return (
    <div className="space-y-6 p-6">
      {/* 查询表单与操作 */}
      <div className="flex flex-wrap items-start gap-4">
        <div className="flex-1 min-w-[280px]">
          <SearchForm onSearch={handleSearch} onReset={handleReset} />
        </div>
        <div className="ml-auto">
          <Button onClick={() => setIsCreateOpen(true)}>新增申请</Button>
        </div>
      </div>

      {/* 数据表格 */}
      {isLoading ? (
        <div className="text-center py-8">加载中...</div>
      ) : error ? (
        <div className="text-center py-8 text-red-500">加载失败</div>
      ) : (
        <>
          <ApplicationTable
            data={data?.data || []}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onSubmit={handleSubmitApplication}
            submittingId={submittingId}
          />

          {/* 分页器 */}
          <CustomPagination
            page={page}
            pageSize={pageSize}
            total={data?.total || 0}
            onChange={setPage}
            className="mt-4 justify-end"
          />
        </>
      )}

      {/* 新增申请单弹窗 */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="min-w-[600px]">
          <DialogHeader>
            <DialogTitle>新增物资申请</DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            <ApplicationForm
              onSubmit={handleCreate}
              isLoading={createMutation.isPending}
              onCancel={() => setIsCreateOpen(false)}
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* 编辑申请单弹窗 */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="min-w-[600px]">
          <DialogHeader>
            <DialogTitle>编辑物资申请</DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            {editApplication && (
              <ApplicationForm
                onSubmit={handleUpdate}
                isLoading={updateMutation.isPending}
                onCancel={() => {
                  setIsEditOpen(false);
                  setEditApplication(null);
                }}
                defaultValues={{
                  title: editApplication.title,
                  operation: editApplication.operation,
                  applicant: editApplication.applicant,
                  applicantNo: editApplication.applicantNo,
                  origin: editApplication.origin || undefined,
                  purpose: editApplication.purpose || undefined,
                }}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* 删除确认弹窗 */}
      <AlertDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除？</AlertDialogTitle>
            <AlertDialogDescription>
              此操作将把申请单标记为废弃，无法恢复。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              确认删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 查看详情弹窗 */}
      <Dialog
        open={!!viewApplication}
        onOpenChange={(open) => !open && setViewApplication(null)}
      >
        <DialogContent className="min-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>查看申请单详情</DialogTitle>
          </DialogHeader>
          {viewApplication && (
            <div className="space-y-4 mt-4">
              {/* 基本信息 */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                <div>
                  <span className="text-sm font-medium text-gray-600">
                    申请单号：
                  </span>
                  <span className="text-sm">
                    {viewApplication.applicationCode}
                  </span>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-600">
                    状态：
                  </span>
                  <Badge
                    variant={getStatusVariant(viewApplication.status) as any}
                    className="ml-2"
                  >
                    {getStatusText(viewApplication.status)}
                  </Badge>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-600">
                    标题：
                  </span>
                  <span className="text-sm">{viewApplication.title}</span>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-600">
                    操作类型：
                  </span>
                  <span className="text-sm">
                    {viewApplication.operation === "IN" ? "入库" : "出库"}
                  </span>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-600">
                    申请人：
                  </span>
                  <span className="text-sm">{viewApplication.applicant}</span>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-600">
                    申请人工号：
                  </span>
                  <span className="text-sm">{viewApplication.applicantNo}</span>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-600">
                    申请时间：
                  </span>
                  <span className="text-sm">
                    {viewApplication.applicationTime}
                  </span>
                </div>
                {viewApplication.origin && (
                  <div>
                    <span className="text-sm font-medium text-gray-600">
                      来源：
                    </span>
                    <span className="text-sm">{viewApplication.origin}</span>
                  </div>
                )}
              </div>

              {/* 用途说明 */}
              {viewApplication.purpose && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">用途说明</label>
                  <div className="p-3 bg-gray-50 rounded-lg text-sm">
                    {viewApplication.purpose}
                  </div>
                </div>
              )}

              {/* 审批信息（如有） */}
              {viewApplication.approver && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">审批信息</label>
                  <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                    <div>
                      <span className="text-sm font-medium text-gray-600">
                        审批人：
                      </span>
                      <span className="text-sm">
                        {viewApplication.approver}
                      </span>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-600">
                        审批人工号：
                      </span>
                      <span className="text-sm">
                        {viewApplication.approverNo}
                      </span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-sm font-medium text-gray-600">
                        审批时间：
                      </span>
                      <span className="text-sm">
                        {viewApplication.approveTime}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
