"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
// import { CalendarApi } from "@fullcalendar/core";
import { DutyScheduleItem, useCreateDutySchedule } from "../query/index";
import { cn } from "@/utils/index";
import zhCnLocale from "@fullcalendar/core/locales/zh-cn";
import type { EventContentArg } from "@fullcalendar/core";
import { ScheduleDialog } from "./ScheduleDialog";
import { toast } from "sonner";

type CalendarProps = {
  data: DutyScheduleItem[];
  shiftFilter?: "0" | "1"; //不填显示全部
} & Record<string, any>;

export default function Calendar({
  data,
  shiftFilter,
  ...props
}: CalendarProps) {
  const calendarRef = useRef<FullCalendar | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>("");

  const createMutation = useCreateDutySchedule();

  //后翻页
  // function goNext() {
  //   const api: CalendarApi | undefined = calendarRef.current?.getApi();
  //   api?.next();
  // }
  //前翻页
  // function goPrev() {
  //   const api: CalendarApi | undefined = calendarRef.current?.getApi();
  //   api?.prev();
  // }

  const events = useMemo(() => {
    const filteredData = shiftFilter
      ? (data ?? []).filter((item) => String(item.shift) === shiftFilter)
      : (data ?? []);

    const grouped = new Map<
      string,
      { date: string; shift: string; employees: DutyScheduleItem[] }
    >();

    (filteredData ?? []).forEach((item) => {
      const shiftStr = String(item.shift);
      const key = `${item.date}-${shiftStr}`;
      if (!grouped.has(key)) {
        grouped.set(key, { date: item.date, shift: shiftStr, employees: [] });
      }
      grouped.get(key)?.employees.push(item);
    });

    return Array.from(grouped.entries()).map(([key, value]) => ({
      id: key,
      start: value.date, // "YYYY-MM-DD"
      allDay: true,
      title: value.shift === "0" ? "白班" : "夜班",
      extendedProps: {
        shift: value.shift,
        employees: value.employees ?? [],
      },
      backgroundColor: "transparent",
      borderColor: "transparent",
    }));
  }, [data, shiftFilter]);

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver(() => {
      calendarRef.current?.getApi().updateSize();
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const handleDateClick = (arg: { dateStr: string }) => {
    setSelectedDate(arg.dateStr);
    setDialogOpen(true);
  };

  const currentDateData = useMemo(() => {
    return (data ?? []).filter((item) => item.date === selectedDate);
  }, [data, selectedDate]);

  const handleSaveSchedule = async (formData: any) => {
    // 转换表单数据为API所需格式
    const scheduleItems: any[] = [];

    // 处理白班数据
    const dayShift = formData.day;
    Object.entries(dayShift).forEach(([role, employees]: [string, any]) => {
      (employees || []).forEach((emp: any) => {
        scheduleItems.push({
          date: selectedDate,
          shift: 0,
          name: emp.label,
          no: emp.no,
          position: emp.position,
        });
      });
    });

    // 处理夜班数据
    const nightShift = formData.night;
    Object.entries(nightShift).forEach(([role, employees]: [string, any]) => {
      (employees || []).forEach((emp: any) => {
        scheduleItems.push({
          date: selectedDate,
          shift: 1,
          name: emp.label,
          no: emp.no,
          position: emp.position,
        });
      });
    });

    // 调用API保存
    try {
      for (const item of scheduleItems) {
        await createMutation.mutateAsync(item);
      }
      toast.success("排班保存成功");
      setDialogOpen(false);
    } catch (error) {
      toast.error("排班保存失败");
      console.error("Save schedule error:", error);
    }
  };

  return (
    <div ref={containerRef} className="h-full w-full relative">
      <FullCalendar
        ref={calendarRef}
        plugins={[dayGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        events={events}
        eventContent={renderEventContent}
        dayMaxEventRows={4}
        fixedWeekCount={false}
        handleWindowResize
        locales={[zhCnLocale]}
        locale="zh-cn"
        height="100%"
        contentHeight="auto"
        dateClick={handleDateClick}
        {...props}
      />

      <ScheduleDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        date={selectedDate}
        initialData={currentDateData}
        onSave={handleSaveSchedule}
      />
    </div>
  );
}

//自定义渲染日期格
function renderEventContent(arg: EventContentArg) {
  const { shift, employees } = arg.event.extendedProps as {
    shift: string | number;
    employees: DutyScheduleItem[];
  };

  const employeeList = employees ?? [];
  const isDay = String(shift) === "0";

  return (
    <div className="w-full cursor-pointer">
      <ul className="mt-1">
        {employeeList.map((e, i) => (
          <li
            key={`${e.no || e.name}-${i}`}
            className={cn(
              "group flex items-center gap-0.5 rounded-lg px-2 py-0.5 ",
              // isDay
              //   ? "bg-white/70  hover:bg-white"
              //   : "bg-white/5 hover:bg-white/10",
            )}
          >
            <span
              className={cn(
                "h-1.5 w-1.5 rounded-full shrink-0",
                isDay ? "bg-sky-500" : "bg-indigo-300",
              )}
            />
            <span
              className={cn(
                "text-xs leading-none px-1.5 py-0.5 rounded-2xl",
                isDay
                  ? "bg-sky-50  text-sky-700"
                  : "bg-indigo-900/40 text-black",
              )}
            >
              {e.position}
            </span>
            <span
              className={cn(
                "text-xs font-medium truncate",
                isDay ? "text-slate-800" : "text-black",
              )}
            >
              {e.name}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
