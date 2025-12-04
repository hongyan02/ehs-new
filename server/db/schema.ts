import { sqliteTable, integer, text } from "drizzle-orm/sqlite-core";

//值班人员库
export const dutyStaff = sqliteTable("dutyStaff", {
  id: integer("id").primaryKey({ autoIncrement: true }),

  // 姓名
  name: text("name").notNull(),

  // 工号
  no: text("no").notNull(),

  // 职位
  position: text("position"),

  // 班次：0=白班，1=夜班
  shift: integer("shift").notNull(),

  // 电话
  phone: text("phone"),

  //状态
  status: integer("status").notNull(),
});

//值班表库
export const dutySchedule = sqliteTable("dutySchedule", {
  id: integer("id").primaryKey({ autoIncrement: true }),

  // 日期：YYYY-MM-DD
  date: text("date").notNull(),

  // 班次：0=白班，1=夜班
  shift: integer("shift").notNull(),

  // 当天排班的值班人姓名
  name: text("name").notNull(),

  // 工号
  no: text("no").notNull(),

  // 职位
  position: text("position"),
});

//换班表
export const dutySwap = sqliteTable("dutySwap", {
  // 主键
  id: integer("id").primaryKey({ autoIncrement: true }),

  // 换班人（发起换班的人）
  from_name: text("from_name").notNull(), // 换班人姓名
  from_no: text("from_no").notNull(), // 换班人工号
  from_position: text("from_position").notNull(), // 换班人职位
  from_date: text("from_date").notNull(), // 换班日期：YYYY-MM-DD
  from_shift: integer("from_shift").notNull(), // 换班人班次：0=白班，1=夜班

  // 被换人（顶班/与之互换的人）
  to_name: text("to_name").notNull(), // 被换人姓名
  to_no: text("to_no").notNull(), // 被换人工号
  to_position: text("to_position").notNull(), // 被换人职位
  to_date: text("to_date").notNull(), // 被换日期：YYYY-MM-DD
  to_shift: integer("to_shift").notNull(), // 被换人班次：0=白班，1=夜班

  // 状态：0=申请中，1=已同意，2=已拒绝，3=已取消
  status: integer("status").notNull().default(0),

  // 原因说明
  reason: text("reason"),

  // 创建时间 & 更新时间（YYYY-MM-DD hh-mm-ss）
  created_at: text("created_at").notNull(),
  updated_at: text("updated_at").notNull(),
});

//值班日志库
export const dutyLog = sqliteTable("dutyLog", {
  id: integer("id").primaryKey({ autoIncrement: true }),

  // 填写人姓名
  name: text("name").notNull(),

  // 填写人工号
  no: text("no").notNull(),

  // 日期：YYYY-MM-DD
  date: text("date").notNull(),

  // 班次：0=白班，1=夜班
  shift: integer("shift").notNull(),

  // 日志内容
  log: text("log").notNull(),

  // 待办事项
  todo: text("todo"),

  // 创建时间：YYYY-MM-DD hh-mm-ss
  createTime: text("create_time").notNull(),

  // 更新时间：YYYY-MM-DD hh-mm-ss
  updateTime: text("update_time").notNull(),
});

//物料库存表
export const materialStore = sqliteTable("materialStore", {
  id: integer("id").primaryKey({ autoIncrement: true }),

  // 物料编码，唯一标识一个物料
  materialCode: text("material_code").notNull().unique(),

  // 物料名称
  materialName: text("material_name").notNull(),

  // 规格型号
  spec: text("spec"),

  // 单位（个/包/箱等）
  unit: text("unit").notNull(),

  // 当前库存数量
  num: integer("num").notNull().default(0),

  // 库存下限阈值
  threshold: integer("threshold").notNull().default(0),

  // 物料类别（劳保/办公/维修等）
  type: text("type"),

  // 存放位置（仓库/货架）
  location: text("location"),

  // 供应商 / 品牌
  supplier: text("supplier"),

  // 创建时间（使用文本 YYYY-MM-DD hh-mm-ss）
  createTime: text("create_time").notNull(),

  // 更新时间（使用文本 YYYY-MM-DD hh-mm-ss）
  updateTime: text("updated_time").notNull(),
});

//申请单表
export const application = sqliteTable("application", {
  // id
  id: integer("id").primaryKey({ autoIncrement: true }),

  // 申请单号
  applicationCode: text("application_code").notNull().unique(),

  //标题
  title: text("title").notNull(),

  // 操作类型：IN / OUT
  operation: text("operation", { enum: ["IN", "OUT"] }).notNull(),

  // 申请时间
  applicationTime: text("application_time").notNull(),

  // 申请人姓名
  applicant: text("applicant").notNull(),

  // 申请人工号
  applicantNo: text("applicant_no").notNull(),

  //审批时间
  approveTime: text("approve_time"),

  //审批人姓名
  approver: text("approver"),

  //审批人工号
  approverNo: text("approver_no"),

  // 来源（部门/项目）
  origin: text("origin"),

  // 用途说明
  purpose: text("purpose"),

  // 状态：0=未提交 1=已保存 2=待审核，3=已完成，4=已驳回 5=废弃
  status: integer("status").notNull().default(0),

  // 创建时间（使用文本 YYYY-MM-DD hh-mm-ss）
  createTime: text("create_time").notNull(),

  // 更新时间（使用文本 YYYY-MM-DD hh-mm-ss）
  updateTime: text("updated_time").notNull(),
});

//申请明细表
export const applicationDetail = sqliteTable("application_detail", {
  //id
  id: integer("id").primaryKey({ autoIncrement: true }),

  // 所属申请单号（application.application_code）
  applicationCode: text("application_code").notNull(),

  // 物料编码（对应 materialStore.material_code）
  materialCode: text("material_code").notNull(),

  // 物料名称快照（记录当时的名称，避免主数据修改影响历史记录）
  materialName: text("material_name").notNull(),

  // 规格型号快照
  spec: text("spec"),

  // 单位快照
  unit: text("unit").notNull(),

  // 申请数量
  quantity: integer("quantity").notNull(),

  // 类别快照（可选，方便统计）
  type: text("type"),

  // 备注
  remark: text("remark"),
});

//操作记录表
export const materialLog = sqliteTable("material_log", {
  //id
  id: integer("id").primaryKey({ autoIncrement: true }),

  // 来源申请单号
  applicationCode: text("application_code").notNull(),

  // 物料编码（唯一标识物料）
  materialCode: text("material_code").notNull(),

  // 物料名称快照
  materialName: text("material_name").notNull(),

  // 规格型号快照
  spec: text("spec"),

  // 单位快照
  unit: text("unit").notNull(),

  // 操作数量（正数）
  quantity: integer("quantity").notNull(),

  // 操作类型：IN / OUT
  operation: text("operation", { enum: ["IN", "OUT"] }).notNull(),

  // 操作人（仓管员）
  // operator: text("operator").notNull(),

  // 实际出入库位置（仓库/货架位）
  location: text("location"),

  // 来源（部门/项目），方便统计“哪个部门用了多少”
  origin: text("origin"),

  // 备注
  remark: text("remark"),

  //时间（使用文本 YYYY-MM-DD hh-mm-ss）
  time: text("time").notNull(),
});

// 用户权限表
export const userPermission = sqliteTable("user_permission", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  employeeId: text("employee_id").unique().notNull(),
  permissions: text("permissions").notNull(), // JSON string of string[]
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});
