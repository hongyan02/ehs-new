import { Home, Calendar, Trophy, Warehouse, User2, Settings } from "lucide-react";
import { LucideIcon } from "lucide-react";

export interface MenuItem {
    title: string;
    url?: string;
    icon: LucideIcon;
    items?: {
        title: string;
        url: string;
        require?: string;
    }[];
    require?: string;
}

// 主导航菜单配置
export const menuItems: MenuItem[] = [
    {
        title: "首页",
        url: "/",
        icon: Home,
    },
    {
        title: "系统管理",
        icon: Settings,
        require: "ADMIN",
        items: [
            {
                title: "权限管理",
                url: "/system/permissions",
            },
            {
                title: "推送管理",
                url: "/system/webhook",
            },
            {
                title: "定时任务",
                url: "/system/corn",
            },
        ],
    },
    {
        title: "积分管理",
        url: "/points",
        icon: Trophy,
        require: "POINT",
    },
    {
        title: "值班管理",
        icon: Calendar,
        items: [
            {
                title: "值班人员管理",
                url: "/dutyManagement/dutyPerson",
                require: "DUTY",
            },
            {
                title: "值班日志",
                url: "/dutyManagement/dutyLog",
            },
            {
                title: "日志稽查",
                url: "/dutyManagement/dutyInspection",
                require: "DUTY",
            },
            {
                title: "换班申请",
                url: "/dutyManagement/dutyChange",
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
                require: "GOODS_APPROVAL",
            },
        ],
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
