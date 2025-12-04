"use client";

import { useCreateDutyChange } from "../query";
import { useAllDutyPersons, useDutySchedule } from "../../dutySchedule/query";
import type {
  DutyScheduleItem,
  DutyScheduleQuery,
} from "../../dutySchedule/query";
import useInfoStore from "@/stores/useUserInfo";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DatePicker } from "@/components/ui/date-picker";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import dayjs from "dayjs";

interface CreateApplicationDialogProps {
  open: boolean;
  onClose: () => void;
}

interface FormData {
  from_name: string;
  from_no: string;
  from_position?: string;
  from_date: Date;
  from_shift?: number;
  to_no: string;
  to_shift?: number;
  to_date: Date;
  reason?: string;
}

export default function CreateApplicationDialog({
  open,
  onClose,
}: CreateApplicationDialogProps) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<FormData>();

  const { mutate: create, isPending } = useCreateDutyChange();
  const { data: dutyPersons } = useAllDutyPersons();
  const { nickname, username } = useInfoStore();
  const [debouncedRange, setDebouncedRange] = useState<
    DutyScheduleQuery | undefined
  >(undefined);

  useEffect(() => {
    register("from_shift", { required: true });
    register("to_shift", { required: true });
  }, [register]);

  const fromDate = watch("from_date");
  const toDate = watch("to_date");
  const toNo = watch("to_no");
  const fromShift = watch("from_shift");
  const toShift = watch("to_shift");

  const fromDateString = fromDate ? dayjs(fromDate).format("YYYY-MM-DD") : "";
  const toDateString = toDate ? dayjs(toDate).format("YYYY-MM-DD") : "";

  const scheduleRange = useMemo(() => {
    const selectedDates = [fromDateString, toDateString].filter(Boolean);
    if (!selectedDates.length) {
      return {
        start_duty_date: "",
        end_duty_date: "",
      };
    }
    const sorted = [...selectedDates].sort();
    return {
      start_duty_date: sorted[0],
      end_duty_date: sorted[sorted.length - 1] || sorted[0],
    };
  }, [fromDateString, toDateString]);

  useEffect(() => {
    if (!scheduleRange.start_duty_date) {
      setDebouncedRange(undefined);
      return;
    }

    const handle = setTimeout(() => {
      setDebouncedRange(scheduleRange);
    }, 300);

    return () => clearTimeout(handle);
  }, [scheduleRange]);

  const { data: dutySchedule } = useDutySchedule(debouncedRange, {
    enabled: Boolean(debouncedRange),
  });

  const fromScheduleEntry = useMemo(() => {
    if (!fromDateString || !username) return undefined;
    return dutySchedule?.find(
      (item: DutyScheduleItem) =>
        item.date === fromDateString && item.no === username,
    );
  }, [dutySchedule, fromDateString, username]);

  const availableToPersons = useMemo(() => {
    if (!toDateString || fromShift == null) return [] as DutyScheduleItem[];
    return (
      dutySchedule?.filter(
        (item: DutyScheduleItem) =>
          item.date === toDateString &&
          item.no !== username &&
          Number(item.shift) === Number(fromShift),
      ) || []
    );
  }, [dutySchedule, toDateString, username, fromShift]);

  useEffect(() => {
    if (fromScheduleEntry) {
      setValue("from_shift", Number(fromScheduleEntry.shift), {
        shouldValidate: true,
      });
      setValue("from_position", fromScheduleEntry.position || "值班员");
    } else {
      setValue("from_shift", undefined, { shouldValidate: true });
    }
  }, [fromScheduleEntry, setValue]);

  useEffect(() => {
    if (!toDateString) {
      setValue("to_no", "");
      setValue("to_shift", undefined, { shouldValidate: true });
      return;
    }

    if (toNo && !availableToPersons.some((person) => person.no === toNo)) {
      setValue("to_no", "");
      setValue("to_shift", undefined, { shouldValidate: true });
    }
  }, [toDateString, availableToPersons, toNo, setValue]);

  useEffect(() => {
    if (!toNo) {
      setValue("to_shift", undefined, { shouldValidate: true });
      return;
    }
    const entry = availableToPersons.find((person) => person.no === toNo);
    if (entry) {
      setValue("to_shift", Number(entry.shift), { shouldValidate: true });
    } else {
      setValue("to_shift", undefined, { shouldValidate: true });
    }
  }, [availableToPersons, toNo, setValue]);

  const getShiftLabel = (shift?: number) => {
    if (shift === 0) return "白班";
    if (shift === 1) return "夜班";
    return "未排班";
  };

  // 自动填充当前用户信息
  useEffect(() => {
    if (open && username) {
      setValue("from_name", nickname);
      setValue("from_no", username);
    }
  }, [open, nickname, username, setValue]);

  const onSubmit = (values: FormData) => {
    // 查找被换人信息以获取职位
    const toPerson = dutyPersons?.find((p: any) => p.no === values.to_no);
    // 查找换班人信息以获取职位
    const fromPerson = dutyPersons?.find((p: any) => p.no === values.from_no);

    if (values.from_shift == null || values.to_shift == null) {
      return;
    }

    const fromDateFormatted = dayjs(values.from_date).format("YYYY-MM-DD");
    const toDateFormatted = dayjs(values.to_date).format("YYYY-MM-DD");

    const scheduleFromPerson = dutySchedule?.find(
      (item: DutyScheduleItem) =>
        item.date === fromDateFormatted && item.no === values.from_no,
    );
    const scheduleToPerson = dutySchedule?.find(
      (item: DutyScheduleItem) =>
        item.date === toDateFormatted && item.no === values.to_no,
    );

    create(
      {
        from_name: values.from_name,
        from_no: values.from_no,
        from_position:
          scheduleFromPerson?.position ||
          fromPerson?.position ||
          values.from_position ||
          "值班员",
        from_date: fromDateFormatted,
        from_shift: values.from_shift,
        to_name: scheduleToPerson?.name || toPerson?.name || "",
        to_no: values.to_no,
        to_position:
          scheduleToPerson?.position || toPerson?.position || "值班员",
        to_date: toDateFormatted,
        to_shift: values.to_shift,
        reason: values.reason,
      },
      {
        onSuccess: () => {
          reset();
          onClose();
        },
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>新建换班申请</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="from_name">换班人姓名</Label>
              <Input
                id="from_name"
                {...register("from_name", { required: true })}
                disabled
              />
              {errors.from_name && (
                <p className="text-sm text-destructive">请输入换班人姓名</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="from_no">换班人工号</Label>
              <Input
                id="from_no"
                {...register("from_no", { required: true })}
                disabled
              />
              {errors.from_no && (
                <p className="text-sm text-destructive">请输入换班人工号</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>换班日期</Label>
              <DatePicker
                date={fromDate}
                onSelect={(date) =>
                  date &&
                  setValue("from_date", date, {
                    shouldValidate: true,
                    shouldDirty: true,
                  })
                }
                placeholder="选择换班日期"
              />
              {errors.from_date && (
                <p className="text-sm text-destructive">请选择换班日期</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>换班人班次</Label>
              <Input readOnly value={getShiftLabel(fromShift)} />
              {errors.from_shift && (
                <p className="text-sm text-destructive">未找到换班人班次</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>被换日期</Label>
              <DatePicker
                date={toDate}
                onSelect={(date) =>
                  date &&
                  setValue("to_date", date, {
                    shouldValidate: true,
                    shouldDirty: true,
                  })
                }
                placeholder="选择被换日期"
              />
              {errors.to_date && (
                <p className="text-sm text-destructive">请选择被换日期</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>被换人班次</Label>
              <Input readOnly value={getShiftLabel(toShift)} />
              {errors.to_shift && (
                <p className="text-sm text-destructive">未找到被换人班次</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>被换人</Label>
              <Select
                value={toNo || undefined}
                onValueChange={(value) =>
                  setValue("to_no", value, {
                    shouldValidate: true,
                    shouldDirty: true,
                  })
                }
              >
                <SelectTrigger className="w-full" disabled={!toDate}>
                  <SelectValue
                    placeholder={toDate ? "选择被换人" : "请先选择被换日期"}
                  />
                </SelectTrigger>
                <SelectContent>
                  {toDate && availableToPersons.length === 0 && (
                    <div className="px-3 py-2 text-sm text-muted-foreground">
                      该日期暂无排班人员
                    </div>
                  )}
                  {availableToPersons.map((p) => (
                    <SelectItem key={`${p.date}-${p.no}`} value={p.no}>
                      {p.name} ({p.no}) · {getShiftLabel(Number(p.shift))}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.to_no && (
                <p className="text-sm text-destructive">请选择被换人</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>被换人工号</Label>
              <Input readOnly value={toNo || ""} placeholder="选择后自动填充" />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reason">换班原因</Label>
            <Textarea
              id="reason"
              {...register("reason")}
              rows={4}
              placeholder="请输入换班原因"
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              取消
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "提交中..." : "确定"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
