"use client";

import { useMemo } from "react";
import { useForm, Controller } from "react-hook-form";
import {
  AutoComplete,
  type Option as AutoCompleteOption,
} from "@/components/autoCompleteSelect";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { DutyPersonPayload } from "../query";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import useUserListStore from "@/stores/useUserList";

const formSchema = z.object({
  name: z.string().min(1, "请输入姓名"),
  no: z.string().min(1, "请输入工号"),
  position: z.string().optional(),
  shift: z.string(), // Select value is string
  phone: z.string().min(1, "请输入手机号"),
});

type FormValues = z.infer<typeof formSchema>;

interface PersonFormProps {
  defaultValues?: Partial<DutyPersonPayload>;
  onSubmit: (data: DutyPersonPayload) => void;
  isLoading?: boolean;
  onCancel?: () => void;
}

export default function PersonForm({
  defaultValues,
  onSubmit,
  isLoading,
  onCancel,
}: PersonFormProps) {
  const { userList } = useUserListStore();
  const userOptions = useMemo<AutoCompleteOption[]>(
    () =>
      userList.map((user) => ({
        label: user.nickName,
        value: user.nickName,
        userName: user.userName,
      })),
    [userList],
  );

  const {
    register,
    handleSubmit,
    control,
    setValue,
  formState: { errors },
} = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: defaultValues?.name || "",
      no: defaultValues?.no || "",
      position: defaultValues?.position || "",
      shift:
        defaultValues?.shift !== undefined ? String(defaultValues.shift) : "0",
      phone: defaultValues?.phone || "",
    },
  });

  // 处理姓名选择变化
  const handleNameChange = (nickName: string) => {
    const selectedUser = userList.find((user) => user.nickName === nickName);
    if (selectedUser) {
      setValue("name", selectedUser.nickName);
      setValue("no", selectedUser.userName);
    }
  };

  const onFormSubmit = (values: FormValues) => {
    onSubmit({
      name: values.name,
      no: values.no,
      position: values.position || null,
      shift: Number(values.shift),
      phone: values.phone,
    });
  };

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
          姓名 <span className="text-red-500">*</span>
        </label>
        <Controller
          control={control}
          name="name"
          render={({ field }) => {
            const selectedOption =
              userOptions.find((option) => option.value === field.value) ??
              undefined;

            return (
              <AutoComplete
                options={userOptions}
                placeholder="选择姓名"
                emptyMessage="没有匹配的姓名"
                value={selectedOption}
                onValueChange={(option) => {
                  field.onChange(option.value);
                  handleNameChange(option.value);
                }}
              />
            );
          }}
        />
        {errors.name && (
          <p className="text-sm font-medium text-red-500">
            {errors.name.message}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
          工号 <span className="text-red-500">*</span>
        </label>
        <Input placeholder="工号" {...register("no")} disabled />
        {errors.no && (
          <p className="text-sm font-medium text-red-500">
            {errors.no.message}
          </p>
        )}
      </div>

  <div className="space-y-2">
    <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
      职位
    </label>
    <Controller
      control={control}
      name="position"
      render={({ field }) => (
        <Select onValueChange={field.onChange} defaultValue={field.value ?? ""}>
          <SelectTrigger>
            <SelectValue placeholder="选择职位" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="值班领导">值班领导</SelectItem>
            <SelectItem value="带班干部">带班干部</SelectItem>
            <SelectItem value="安全管理人员">安全管理人员</SelectItem>
            <SelectItem value="安全员">安全员</SelectItem>
          </SelectContent>
        </Select>
      )}
    />
  </div>

      <div className="space-y-2">
        <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
          班次 <span className="text-red-500">*</span>
        </label>
        <Controller
          control={control}
          name="shift"
          render={({ field }) => (
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <SelectTrigger>
                <SelectValue placeholder="选择班次" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">白班</SelectItem>
                <SelectItem value="1">夜班</SelectItem>
              </SelectContent>
            </Select>
          )}
        />
        {errors.shift && (
          <p className="text-sm font-medium text-red-500">
            {errors.shift.message}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
          手机号
        </label>
        <Input placeholder="请输入手机号" {...register("phone")} />
        {errors.phone && (
          <p className="text-sm font-medium text-red-500">
            {errors.phone.message}
          </p>
        )}
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          取消
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "保存中..." : "保存"}
        </Button>
      </div>
    </form>
  );
}
