"use client";

import { useState } from "react";
import type { SearchFormData } from "./components/searchForm";
import dynamic from "next/dynamic";

const SearchForm = dynamic(() => import("./components/searchForm"), {
  ssr: false,
});
import LogTable from "./components/logTable";
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
  useDutyLogs,
  useDeleteDutyLog,
  useCreateDutyLogWithWebhook,
  type DutyLogData,
} from "./query";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import LogForm from "./components/logForm";
import { TiptapEditor } from "@/components/TiptapEditor";

export default function DutyLogView() {
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [searchParams, setSearchParams] = useState<SearchFormData>({});
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [viewLog, setViewLog] = useState<DutyLogData | null>(null);
  const [confirmCreateOpen, setConfirmCreateOpen] = useState(false);
  const [pendingCreate, setPendingCreate] = useState<DutyLogData | null>(null);

  // 查询数据
  const { data, isLoading, error } = useDutyLogs({
    page,
    pageSize,
    ...searchParams,
  });

  // 删除mutation
  const deleteMutation = useDeleteDutyLog();
  // 创建mutation
  const createMutation = useCreateDutyLogWithWebhook();

  const handleSearch = (params: SearchFormData) => {
    setSearchParams(params);
    setPage(1); // 重置到第一页
  };

  const handleReset = () => {
    setSearchParams({});
    setPage(1);
  };

  const handleView = (log: DutyLogData) => {
    setViewLog(log);
  };

  const handleDelete = (id: number) => {
    setDeleteId(id);
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

  const handleCreateRequest = (data: DutyLogData) => {
    setPendingCreate(data);
    setConfirmCreateOpen(true);
  };

  const handleConfirmCreate = async () => {
    if (!pendingCreate) return;
    try {
      const result = await createMutation.mutateAsync(pendingCreate);
      if (result.pushed) {
        toast.success("创建并推送成功");
      } else if (result.pushError) {
        console.error(result.pushError);
        toast.error("日志已保存，但推送失败");
      } else {
        toast.success("创建成功");
      }

      setIsCreateOpen(false);
      setConfirmCreateOpen(false);
      setPendingCreate(null);
    } catch (error) {
      console.error(error);
      toast.error(
        error instanceof Error ? error.message : "创建失败",
      );
      setConfirmCreateOpen(false);
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
          <Button onClick={() => setIsCreateOpen(true)}>新增日志</Button>
        </div>
      </div>

      {/* 数据表格 */}
      {isLoading ? (
        <div className="text-center py-8">加载中...</div>
      ) : error ? (
        <div className="text-center py-8 text-red-500">加载失败</div>
      ) : (
        <>
          <LogTable
            data={data?.data || []}
            onView={handleView}
            onDelete={handleDelete}
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

      {/* 新增日志弹窗 */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="min-w-[70vw] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>新增值班日志</DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            <LogForm
              onSubmit={handleCreateRequest}
              isLoading={createMutation.isPending}
              onCancel={() => setIsCreateOpen(false)}
            />
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={confirmCreateOpen}
        onOpenChange={(open) => {
          setConfirmCreateOpen(open);
          if (!open) setPendingCreate(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认保存并推送</AlertDialogTitle>
            <AlertDialogDescription>
              内容保存后将不可修改，且将同步推送到企业微信。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={createMutation.isPending}>
              取消
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmCreate}
              disabled={createMutation.isPending}
            >
              {createMutation.isPending ? "保存中..." : "确认"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 删除确认弹窗 */}
      <AlertDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除?</AlertDialogTitle>
            <AlertDialogDescription>
              此操作无法撤销。这将永久删除该值班日志记录。
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

      {/* 查看日志弹窗 */}
      <Dialog
        open={!!viewLog}
        onOpenChange={(open) => !open && setViewLog(null)}
      >
        <DialogContent className="min-w-[70vw] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>查看值班日志</DialogTitle>
          </DialogHeader>
          {viewLog && (
            <div className="space-y-4 mt-4">
              {/* 基本信息 */}
              <div className="grid grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
                <div>
                  <span className="text-sm font-medium text-gray-600">
                    日期：
                  </span>
                  <span className="text-sm">{viewLog.date}</span>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-600">
                    班次：
                  </span>
                  <span className="text-sm">
                    {viewLog.shift === 0 ? "白班" : "夜班"}
                  </span>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-600">
                    姓名：
                  </span>
                  <span className="text-sm">{viewLog.name}</span>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-600">
                    工号：
                  </span>
                  <span className="text-sm">{viewLog.no}</span>
                </div>
              </div>

              {/* 日志内容 */}
              <div className="space-y-2">
                <label className="text-sm font-medium">日志内容</label>
                <TiptapEditor
                  value={viewLog.log}
                  disabled
                  placeholder="无日志内容"
                />
              </div>

              {/* 待办事项 */}
              {viewLog.todo && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">待办事项</label>
                  <div className="p-3 bg-gray-50 rounded-lg text-sm">
                    {viewLog.todo}
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
