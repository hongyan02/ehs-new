import { Home, Calendar, Trophy, Warehouse, User2 } from "lucide-react";
import { LucideIcon } from "lucide-react";

export interface MenuItem {
  title: string;
  url?: string;
  icon: LucideIcon;
  items?: {
    title: string;
    url: string;
  }[];
}

// 主导航菜单配置
export const menuItems: MenuItem[] = [
  {
    title: "首页",
    url: "/",
    icon: Home,
  },
  {
    title: "值班管理",
    icon: Calendar,
    items: [
      {
        title: "值班人员管理",
        url: "/dutyManagement/dutyPerson",
      },
      {
        title: "值班日志",
        url: "/dutyManagement/dutyLog",
      },
      {
        title: "换班申请",
        url: "/dutyManagement/dutyChange"
      },
      {
        title: "值班表",
        url: "/dutyManagement/dutySchedule",
      },
    ],
  },
  {
    title: "物资管理",
    icon: Warehouse,
    items: [
      {
        title: "库存",
        url: "/goods/store",
      },
      {
        title: "申请表",
        url: "/goods/application",
      },
      {
        title: "申请审批",
        url: "/goods/approval",
      },
    ],
  },
  {
    title: "积分管理",
    url: "/points",
    icon: Trophy,
  },
];

// 底部菜单配置
export const footerMenuItem: MenuItem = {
  title: "用户中心",
  url: "/profile",
  icon: User2,
};

// 侧边栏配置
export const sidebarConfig = {
  appTitle: process.env.NEXT_PUBLIC_APP_TITLE || "EHS 系统",
  appSubtitle: "管理平台",
  // groupLabel: "导航菜单",
};
