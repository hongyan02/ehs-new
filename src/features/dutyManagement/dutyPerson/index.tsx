"use client";

import { useState } from "react";
import SearchForm, { type SearchFormData } from "./components/searchForm";
import PersonTable from "./components/personTable";
import PersonForm from "./components/personForm";
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
  useDutyPersons,
  useDeleteDutyPerson,
  useCreateDutyPerson,
  useUpdateDutyPerson,
  type DutyPersonData,
  type DutyPersonPayload,
} from "./query";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function DutyPersonView() {
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [searchParams, setSearchParams] = useState<SearchFormData>({});
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editing, setEditing] = useState<DutyPersonData | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  // 查询数据
  const { data, isLoading, error } = useDutyPersons({
    page,
    pageSize,
    ...searchParams,
  });

  // 删除mutation
  const deleteMutation = useDeleteDutyPerson();
  // 创建mutation
  const createMutation = useCreateDutyPerson();
  // 更新mutation
  const updateMutation = useUpdateDutyPerson();

  const handleSearch = (params: SearchFormData) => {
    setSearchParams(params);
    setPage(1); // 重置到第一页
  };

  const handleReset = () => {
    setSearchParams({});
    setPage(1);
  };

  const handleEdit = (person: DutyPersonData) => {
    setEditing(person);
    setIsCreateOpen(true);
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
      console.error(error);
      toast.error("删除失败");
    }
  };

  const handleSubmit = async (data: DutyPersonPayload) => {
    try {
      if (editing?.id) {
        await updateMutation.mutateAsync({ id: editing.id, data });
        toast.success("修改成功");
      } else {
        await createMutation.mutateAsync(data);
        toast.success("创建成功");
      }
      setIsCreateOpen(false);
      setEditing(null);
    } catch (error) {
      console.error(error);
      toast.error(editing ? "修改失败" : "创建失败");
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
          <Button
            onClick={() => {
              setEditing(null);
              setIsCreateOpen(true);
            }}
          >
            新增人员
          </Button>
        </div>
      </div>

      {/* 数据表格 */}
      {isLoading ? (
        <div className="text-center py-8">加载中...</div>
      ) : error ? (
        <div className="text-center py-8 text-red-500">加载失败</div>
      ) : (
        <>
          <PersonTable
            data={data?.data || []}
            onEdit={handleEdit}
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

      {/* 新增人员弹窗 */}
      <Dialog
        open={isCreateOpen}
        onOpenChange={(open) => {
          setIsCreateOpen(open);
          if (!open) setEditing(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
          <DialogTitle>{editing ? "编辑值班人员" : "新增值班人员"}</DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            <PersonForm
              key={editing?.id ?? "create"}
              defaultValues={editing || undefined}
              onSubmit={handleSubmit}
              isLoading={createMutation.isPending || updateMutation.isPending}
              onCancel={() => {
                setEditing(null);
                setIsCreateOpen(false);
              }}
            />
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
              此操作无法撤销。这将永久删除该值班人员记录。
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
    </div>
  );
}
