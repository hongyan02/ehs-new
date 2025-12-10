"use client";

import { useEffect, useMemo } from "react";
import { useForm, useFieldArray, Control } from "react-hook-form";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { AutoComplete, Option } from "@/components/autoCompleteSelect";
import { Plus, Trash2 } from "lucide-react";
import { useAllDutyPersons, DutyScheduleItem, useDeleteDutySchedule } from "../query/index";
import { toast } from "sonner";

type ScheduleFormValues = {
  day: {
    dutyLeader: ScheduleOption[];
    shiftCadre: ScheduleOption[];
    safetyManager: ScheduleOption[];
    safetyOfficer: ScheduleOption[];
  };
  night: {
    dutyLeader: ScheduleOption[];
    shiftCadre: ScheduleOption[];
    safetyManager: ScheduleOption[];
    safetyOfficer: ScheduleOption[];
  };
};

type ScheduleOption = Option & {
  scheduleId?: string; // 排班记录ID
  position?: string;
  no?: string;
  role?: string;
};

type ScheduleDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  date: string;
  initialData?: DutyScheduleItem[];
  onSave: (data: ScheduleFormValues) => void;
};

export function ScheduleDialog({
  open,
  onOpenChange,
  date,
  initialData,
  onSave,
}: ScheduleDialogProps) {
  const { data: allPersons } = useAllDutyPersons();
  const deleteMutation = useDeleteDutySchedule();

  const employeeOptions: ScheduleOption[] = useMemo(() => {
    return (allPersons ?? []).map((p: any) => ({
      value: String(p.id),
      label: p.name,
      position: p.position,
      no: p.no,
    }));
  }, [allPersons]);

  const form = useForm<ScheduleFormValues>({
    defaultValues: {
      day: {
        dutyLeader: [],
        shiftCadre: [],
        safetyManager: [],
        safetyOfficer: [],
      },
      night: {
        dutyLeader: [],
        shiftCadre: [],
        safetyManager: [],
        safetyOfficer: [],
      },
    },
  });

  const { handleSubmit, control, reset } = form;

  useEffect(() => {
    if (open) {
      if (!initialData || initialData.length === 0) {
        // 无初始数据，重置为空表单
        reset({
          day: {
            dutyLeader: [],
            shiftCadre: [],
            safetyManager: [],
            safetyOfficer: [],
          },
          night: {
            dutyLeader: [],
            shiftCadre: [],
            safetyManager: [],
            safetyOfficer: [],
          },
        });
      } else {
        // 有初始数据，转换为表单格式
        const dayShift = initialData.filter(
          (item) => String(item.shift) === "0",
        );
        const nightShift = initialData.filter(
          (item) => String(item.shift) === "1",
        );

        const mapToOption = (item: DutyScheduleItem): ScheduleOption => {
          const found =
            employeeOptions.find(
              (opt) => opt.no === item.no || opt.label === item.name,
            ) ?? null;

          // 使用数据库记录的 ID 作为 value 和 id
          if (found) {
            const result = {
              ...found,
              scheduleId: String(item.id), // 排班记录ID
            };
            return result;
          }

          const result = {
            value: found?.value ?? item.no ?? item.name ?? String(item.id),
            label: item.name,
            position: item.position,
            no: item.no || "",
            scheduleId: String(item.id),
            role: item.position,
          };
          return result;
        };
        const buildRoleOptions = (items: DutyScheduleItem[]) => ({
          dutyLeader: items
            .filter((item) => item.position === "值班领导")
            .map(mapToOption),
          shiftCadre: items
            .filter((item) => item.position === "带班干部")
            .map(mapToOption),
          safetyManager: items
            .filter((item) => item.position === "安全管理人员")
            .map(mapToOption),
          safetyOfficer: items
            .filter((item) => item.position === "安全员")
            .map(mapToOption),
        });

        const dayRoles = buildRoleOptions(dayShift);
        const nightRoles = buildRoleOptions(nightShift);

        reset({
          day: {
            dutyLeader: dayRoles.dutyLeader,
            shiftCadre: dayRoles.shiftCadre,
            safetyManager: dayRoles.safetyManager,
            safetyOfficer: dayRoles.safetyOfficer,
          },
          night: {
            dutyLeader: nightRoles.dutyLeader,
            shiftCadre: nightRoles.shiftCadre,
            safetyManager: nightRoles.safetyManager,
            safetyOfficer: nightRoles.safetyOfficer,
          },
        });
      }
    }
  }, [open, date, reset, initialData, employeeOptions]);

  const onSubmit = (data: ScheduleFormValues) => {
    onSave(data);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>排班安排 - {date}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 白班 */}
            <div className="space-y-4 border p-4 rounded-lg bg-sky-50/50">
              <h3 className="font-semibold text-lg text-sky-700 flex items-center gap-2">
                <span className="w-2 h-6 bg-sky-500 rounded-full"></span>
                白班
              </h3>

              <RoleSection
                control={control}
                name="day.dutyLeader"
                label="值班领导"
                options={employeeOptions}
                onDelete={deleteMutation}
                roleKey="dutyLeader"
              />
              <RoleSection
                control={control}
                name="day.shiftCadre"
                label="带班干部"
                options={employeeOptions}
                onDelete={deleteMutation}
                roleKey="shiftCadre"
              />
              <RoleSection
                control={control}
                name="day.safetyManager"
                label="安全管理人员"
                options={employeeOptions}
                onDelete={deleteMutation}
                roleKey="safetyManager"
              />
              <RoleSection
                control={control}
                name="day.safetyOfficer"
                label="安全员"
                options={employeeOptions}
                onDelete={deleteMutation}
                roleKey="safetyOfficer"
              />
            </div>

            {/* 夜班 */}
            <div className="space-y-4 border p-4 rounded-lg bg-indigo-50/50">
              <h3 className="font-semibold text-lg text-indigo-700 flex items-center gap-2">
                <span className="w-2 h-6 bg-indigo-500 rounded-full"></span>
                夜班
              </h3>

              <RoleSection
                control={control}
                name="night.dutyLeader"
                label="值班领导"
                options={employeeOptions}
                onDelete={deleteMutation}
                roleKey="dutyLeader"
              />
              <RoleSection
                control={control}
                name="night.shiftCadre"
                label="带班干部"
                options={employeeOptions}
                onDelete={deleteMutation}
                roleKey="shiftCadre"
              />
              <RoleSection
                control={control}
                name="night.safetyManager"
                label="安全管理人员"
                options={employeeOptions}
                onDelete={deleteMutation}
                roleKey="safetyManager"
              />
              <RoleSection
                control={control}
                name="night.safetyOfficer"
                label="安全员"
                options={employeeOptions}
                onDelete={deleteMutation}
                roleKey="safetyOfficer"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              取消
            </Button>
            <Button type="submit">保存</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

type RoleSectionProps = {
  control: Control<ScheduleFormValues>;
  name: any; // Path to the array
  label: string;
  options: ScheduleOption[];
  onDelete: any; // Delete mutation
  roleKey: keyof typeof ROLE_POSITION_MAP;
};

const ROLE_POSITION_MAP = {
  dutyLeader: "值班领导",
  shiftCadre: "带班干部",
  safetyManager: "安全管理人员",
  safetyOfficer: "安全员",
} as const;

function RoleSection({ control, name, label, options, onDelete, roleKey }: RoleSectionProps) {
  const { fields, append, remove, update } = useFieldArray({
    control,
    name,
  });

  const filteredOptions = options.filter(
    (opt) => !opt.position || opt.position === ROLE_POSITION_MAP[roleKey],
  );

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium text-gray-700">{label}</Label>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-6 px-2 text-primary hover:bg-primary/10"
          onClick={() => append({ label: "", value: "" })}
        >
          <Plus className="w-3 h-3 mr-1" />
          添加
        </Button>
      </div>

      <div className="space-y-2">
        {fields.map((field, index) => (
          <div key={field.id} className="flex items-center gap-2">
            <div className="flex-1">
              <AutoComplete
                options={filteredOptions}
                value={field as unknown as ScheduleOption}
                onValueChange={(val) =>
                  update(index, {
                    ...val,
                    scheduleId: (field as unknown as ScheduleOption).scheduleId,
                    position: val.position ?? (field as unknown as ScheduleOption).position,
                    no: val.no ?? (field as unknown as ScheduleOption).no,
                    role: ROLE_POSITION_MAP[roleKey],
                  })
                }
                placeholder={`选择${label}`}
                emptyMessage="未找到符合岗位的人员"
              />
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-9 w-9 text-muted-foreground hover:text-destructive"
              onClick={async () => {
                const fieldValue = field as unknown as ScheduleOption;
                const dbId = fieldValue.scheduleId
                  ? Number(fieldValue.scheduleId)
                  : NaN;

                if (!isNaN(dbId)) {
                  // 有有效的数据库ID，调用API删除
                  try {
                    await onDelete.mutateAsync(dbId);
                    toast.success("删除成功");
                    remove(index);
                  } catch (error: any) {
                    const errorMessage = error?.data?.error || "删除失败";
                    toast.error(errorMessage);
                  }
                } else {
                  // 新添加的记录，直接从表单移除
                  remove(index);
                }
              }}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        ))}
        {fields.length === 0 && (
          <div className="text-xs text-muted-foreground italic px-2 py-1 bg-white/50 rounded border border-dashed">
            暂无人员
          </div>
        )}
      </div>
    </div>
  );
}
