import { db } from "@server/db/db";
import { dutyLog, dutySchedule } from "@server/db/schema";
import { eq, and, gte, lte, desc, asc } from "drizzle-orm";

export interface GetDutyLogsParams {
    page?: number;
    pageSize?: number;
    startDate?: string; // YYYY-MM-DD
    endDate?: string; // YYYY-MM-DD
    shift?: number; // 0=白班，1=夜班
}

export interface CreateDutyLogParams {
    name: string;
    no: string;
    date: string; // YYYY-MM-DD
    shift: number; // 0=白班，1=夜班
    log: string;
    todo?: string;
    createTime: string;
    updateTime: string;
}

export interface UpdateDutyLogParams {
    id: number;
    name?: string;
    no?: string;
    date?: string;
    shift?: number;
    log?: string;
    todo?: string;
    updateTime: string;
}

export interface DutyLogInspectionParams {
    startDate: string;
    endDate: string;
}

export interface MissingDutyLog {
    date: string;
    shift: number;
    name: string;
    no: string;
}

/**
 * 获取值班日志列表（支持分页和过滤）
 */
export const getDutyLogs = async (params: GetDutyLogsParams) => {
    console.log("getDutyLogs called with params:", params);
    const { page = 1, pageSize = 10, startDate, endDate, shift } = params;

    try {
        // 构建查询条件
        const conditions = [];
        if (startDate) {
            conditions.push(gte(dutyLog.date, startDate));
        }
        if (endDate) {
            conditions.push(lte(dutyLog.date, endDate));
        }
        if (shift !== undefined) {
            conditions.push(eq(dutyLog.shift, shift));
        }

        const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
        console.log("Where clause:", whereClause);

        // 查询总数 - 方法1：直接查询所有数据然后计数
        console.log("Querying all data for count...");
        const allData = await db
            .select()
            .from(dutyLog)
            .where(whereClause);
        const total = allData.length;
        console.log("Total records:", total);

        // 查询数据（分页）
        const offset = (page - 1) * pageSize;
        console.log("Querying paginated data...", { offset, limit: pageSize });
        const data = await db
            .select()
            .from(dutyLog)
            .where(whereClause)
            .orderBy(desc(dutyLog.date), desc(dutyLog.shift))
            .limit(pageSize)
            .offset(offset);
        console.log("Paginated data count:", data.length);

        return {
            data,
            total,
            page,
            pageSize,
            totalPages: Math.ceil(total / pageSize),
        };
    } catch (error) {
        console.error("getDutyLogs service error:", error);
        throw error;
    }
};

/**
 * 根据ID获取单个值班日志
 */
export const getDutyLogById = async (id: number) => {
    const result = await db.select().from(dutyLog).where(eq(dutyLog.id, id));
    return result[0];
};

/**
 * 创建值班日志
 */
export const createDutyLog = async (params: CreateDutyLogParams) => {
    const result = await db.insert(dutyLog).values(params).returning();
    return result[0];
};

/**
 * 更新值班日志
 */
export const updateDutyLog = async (params: UpdateDutyLogParams) => {
    const { id, ...updateData } = params;
    const result = await db
        .update(dutyLog)
        .set(updateData)
        .where(eq(dutyLog.id, id))
        .returning();
    return result[0];
};

/**
 * 删除值班日志
 */
export const deleteDutyLog = async (id: number) => {
    const result = await db.delete(dutyLog).where(eq(dutyLog.id, id)).returning();
    return result[0];
};

/**
 * 根据日期范围筛选未按时填写的值班日志
 */
export const getMissingDutyLogs = async (params: DutyLogInspectionParams) => {
    const { startDate, endDate } = params;

    // 获取日期范围内的排班（用于确定应当填写日志的人员）
    const schedules = await db
        .select()
        .from(dutySchedule)
        .where(and(gte(dutySchedule.date, startDate), lte(dutySchedule.date, endDate)))
        .orderBy(asc(dutySchedule.date), asc(dutySchedule.shift));

    if (schedules.length === 0) return [];

    // 获取日期范围内已存在的日志
    const existingLogs = await db
        .select({
            date: dutyLog.date,
            shift: dutyLog.shift,
        })
        .from(dutyLog)
        .where(and(gte(dutyLog.date, startDate), lte(dutyLog.date, endDate)));

    const existingLogKeys = new Set(
        existingLogs.map((log) => `${log.date}-${log.shift}`)
    );

    // 找出排班中缺失的日志
    const missingLogs: MissingDutyLog[] = schedules
        .filter((schedule) => !existingLogKeys.has(`${schedule.date}-${schedule.shift}`))
        .map((schedule) => ({
            date: schedule.date,
            shift: schedule.shift,
            name: schedule.name,
            no: schedule.no,
        }));

    return missingLogs;
};
