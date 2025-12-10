export const API_SERVICE = {
    //登陆
    login: {
        login: "/api/auth/login", //登陆
        logout: "/api/auth/logout", //登出（清除 HttpOnly cookie）
    },
    //用户信息相关
    userInfo: {
        getInfo: process.env.NEXT_PUBLIC_API_CONFIG_IMS + "/getInfo", //获取用户信息
        list: process.env.NEXT_PUBLIC_API_CONFIG_IMS + "/system/user/list", //获取用户列表
    },
    //webhook
    webhook: {
        dutyLog: process.env.NEXT_PUBLIC_API_CONFIG_LOCAL + "/webhook/dutyLog", //值班日志推送
        config: process.env.NEXT_PUBLIC_API_CONFIG_LOCAL + "/webhook/config", //Webhook配置
    },
    //值班日志
    dutyLog: {
        dutyLog: process.env.NEXT_PUBLIC_API_CONFIG_LOCAL + "/dutyLog", //CRUD操作
        inspection:
            process.env.NEXT_PUBLIC_API_CONFIG_LOCAL + "/dutyLog/Inspection", //值班日志稽查
    },
    dutyPerson: {
        dutyPerson: process.env.NEXT_PUBLIC_API_CONFIG_LOCAL + "/dutyPerson", //值班人员CRUD
    },
    //值班表
    dutySchedule: {
        getDutySchedule: process.env.NEXT_PUBLIC_API_CONFIG_LOCAL + "/dutySchedule", //查询值班表
        dutySchedule: process.env.NEXT_PUBLIC_API_CONFIG_LOCAL + "/dutySchedule", //(新增、更新、删除)值班表
        batch: process.env.NEXT_PUBLIC_API_CONFIG_LOCAL + "/dutySchedule/batch", //批量保存
    },
    //物资库存
    materialStore: {
        store: process.env.NEXT_PUBLIC_API_CONFIG_LOCAL + "/goods/store", //CRUD操作
    },
    materialLog: {
        log: process.env.NEXT_PUBLIC_API_CONFIG_LOCAL + "/goods/materialLog", //操作记录
    },
    //物资申请
    application: {
        application: process.env.NEXT_PUBLIC_API_CONFIG_LOCAL + "/goods/application", //CRUD操作
        pending: process.env.NEXT_PUBLIC_API_CONFIG_LOCAL + "/goods/application/pending", //待审核列表
        applicationDetail: process.env.NEXT_PUBLIC_API_CONFIG_LOCAL + "/goods/applicationDetail", //申请明细
    },
    //换班申请
    dutyChange: {
        change: process.env.NEXT_PUBLIC_API_CONFIG_LOCAL + "/dutySchedule/change", //换班申请 CRUD
    },
    //权限管理
    permissions: {
        definitions: process.env.NEXT_PUBLIC_API_CONFIG_LOCAL + "/system/permissions/definitions", //权限定义 CRUD
        users: process.env.NEXT_PUBLIC_API_CONFIG_LOCAL + "/system/permissions/users", //用户权限 CRUD
    },
    //积分管理
    points: {
        person: process.env.NEXT_PUBLIC_API_CONFIG_LOCAL + "/point/person",
        categories: process.env.NEXT_PUBLIC_API_CONFIG_LOCAL + "/point/categories",
        events: process.env.NEXT_PUBLIC_API_CONFIG_LOCAL + "/point/events",
        logs: process.env.NEXT_PUBLIC_API_CONFIG_LOCAL + "/point/logs",
        ranking: process.env.NEXT_PUBLIC_API_CONFIG_LOCAL + "/point/ranking",
    },
    scheduler: {
        task: process.env.NEXT_PUBLIC_API_CONFIG_LOCAL + "/scheduler/task",
    },
};
