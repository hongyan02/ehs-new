"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Search } from "lucide-react";
import PermissionDefinitionTable from "./components/PermissionDefinitionTable";
import UserPermissionTable from "./components/UserPermissionTable";
import PermissionDefinitionDialog from "./components/PermissionDefinitionDialog";
import UserPermissionDialog from "./components/UserPermissionDialog";
import {
  usePermissionDefinitions,
  useDeletePermissionDefinition,
  useUserPermissions,
  useDeleteUserPermission,
} from "./query";
import { toast } from "sonner";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

export default function PermissionsView() {
  const [activeTab, setActiveTab] = useState("users");

  // 权限定义状态
  const [defPage, setDefPage] = useState(1);
  const [defPageSize] = useState(10);
  const [defSearchCode, setDefSearchCode] = useState("");
  const [defSearchName, setDefSearchName] = useState("");
  const [isDefDialogOpen, setIsDefDialogOpen] = useState(false);

  // 用户权限状态
  const [userPage, setUserPage] = useState(1);
  const [userPageSize] = useState(10);
  const [userSearchEmployeeId, setUserSearchEmployeeId] = useState("");
  const [isUserDialogOpen, setIsUserDialogOpen] = useState(false);

  // 权限定义查询
  const {
    data: defData,
    refetch: refetchDef,
    isLoading: defLoading,
  } = usePermissionDefinitions({
    page: defPage,
    pageSize: defPageSize,
    code: defSearchCode,
    name: defSearchName,
  });

  const deleteDefMutation = useDeletePermissionDefinition();

  // 用户权限查询
  const {
    data: userData,
    refetch: refetchUser,
    isLoading: userLoading,
  } = useUserPermissions({
    page: userPage,
    pageSize: userPageSize,
    employeeId: userSearchEmployeeId,
  });

  const deleteUserMutation = useDeleteUserPermission();

  // 权限定义处理函数
  const handleDefSearch = () => {
    setDefPage(1);
    refetchDef();
  };

  const handleDefDelete = async (id: number) => {
    if (!confirm("确定要删除这个权限定义吗？")) return;

    try {
      await deleteDefMutation.mutateAsync(id);
      toast.success("删除成功");
      refetchDef();
    } catch (error) {
      console.error("删除失败:", error);
      toast.error("删除失败");
    }
  };

  // 用户权限处理函数
  const handleUserSearch = () => {
    setUserPage(1);
    refetchUser();
  };

  const handleUserDelete = async (id: number) => {
    if (!confirm("确定要删除这个用户权限吗？")) return;

    try {
      await deleteUserMutation.mutateAsync(id);
      toast.success("删除成功");
      refetchUser();
    } catch (error) {
      console.error("删除失败:", error);
      toast.error("删除失败");
    }
  };

  return (
    <div className="p-6 space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="users">用户权限</TabsTrigger>
          <TabsTrigger value="definitions">权限定义</TabsTrigger>
        </TabsList>

        {/* 权限定义Tab */}
        <TabsContent value="definitions" className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="flex-1 flex gap-2">
              <Input
                placeholder="搜索权限代码"
                value={defSearchCode}
                onChange={(e) => setDefSearchCode(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleDefSearch()}
                className="max-w-xs"
              />
              <Input
                placeholder="搜索权限名称"
                value={defSearchName}
                onChange={(e) => setDefSearchName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleDefSearch()}
                className="max-w-xs"
              />
              <Button onClick={handleDefSearch} variant="outline">
                <Search className="h-4 w-4 mr-2" />
                搜索
              </Button>
            </div>
            <Button onClick={() => setIsDefDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              新增权限定义
            </Button>
          </div>

          {defLoading ? (
            <div className="text-center py-12">加载中...</div>
          ) : (
            <>
              <PermissionDefinitionTable
                data={defData?.data?.data || []}
                onDelete={handleDefDelete}
                onUpdate={refetchDef}
              />

              {defData?.data && defData.data.totalPages > 1 && (
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          setDefPage((p) => Math.max(1, p - 1));
                        }}
                        className={
                          defPage === 1
                            ? "pointer-events-none opacity-50"
                            : "cursor-pointer"
                        }
                      />
                    </PaginationItem>
                    {Array.from(
                      { length: defData.data.totalPages },
                      (_, i) => i + 1,
                    ).map((page) => (
                      <PaginationItem key={page}>
                        <PaginationLink
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            setDefPage(page);
                          }}
                          isActive={page === defPage}
                          className="cursor-pointer"
                        >
                          {page}
                        </PaginationLink>
                      </PaginationItem>
                    ))}
                    <PaginationItem>
                      <PaginationNext
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          setDefPage((p) =>
                            Math.min(defData.data.totalPages, p + 1),
                          );
                        }}
                        className={
                          defPage === defData.data.totalPages
                            ? "pointer-events-none opacity-50"
                            : "cursor-pointer"
                        }
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              )}
            </>
          )}
        </TabsContent>

        {/* 用户权限Tab */}
        <TabsContent value="users" className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="flex-1 flex gap-2">
              <Input
                placeholder="搜索员工ID"
                value={userSearchEmployeeId}
                onChange={(e) => setUserSearchEmployeeId(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleUserSearch()}
                className="max-w-xs"
              />
              <Button onClick={handleUserSearch} variant="outline">
                <Search className="h-4 w-4 mr-2" />
                搜索
              </Button>
            </div>
            <Button onClick={() => setIsUserDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              新增用户权限
            </Button>
          </div>

          {userLoading ? (
            <div className="text-center py-12">加载中...</div>
          ) : (
            <>
              <UserPermissionTable
                data={userData?.data?.data || []}
                onDelete={handleUserDelete}
                onUpdate={refetchUser}
              />

              {userData?.data && userData.data.totalPages > 1 && (
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          setUserPage((p) => Math.max(1, p - 1));
                        }}
                        className={
                          userPage === 1
                            ? "pointer-events-none opacity-50"
                            : "cursor-pointer"
                        }
                      />
                    </PaginationItem>
                    {Array.from(
                      { length: userData.data.totalPages },
                      (_, i) => i + 1,
                    ).map((page) => (
                      <PaginationItem key={page}>
                        <PaginationLink
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            setUserPage(page);
                          }}
                          isActive={page === userPage}
                          className="cursor-pointer"
                        >
                          {page}
                        </PaginationLink>
                      </PaginationItem>
                    ))}
                    <PaginationItem>
                      <PaginationNext
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          setUserPage((p) =>
                            Math.min(userData.data.totalPages, p + 1),
                          );
                        }}
                        className={
                          userPage === userData.data.totalPages
                            ? "pointer-events-none opacity-50"
                            : "cursor-pointer"
                        }
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              )}
            </>
          )}
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <PermissionDefinitionDialog
        open={isDefDialogOpen}
        onOpenChange={setIsDefDialogOpen}
        onSuccess={refetchDef}
      />
      <UserPermissionDialog
        open={isUserDialogOpen}
        onOpenChange={setIsUserDialogOpen}
        onSuccess={refetchUser}
      />
    </div>
  );
}
