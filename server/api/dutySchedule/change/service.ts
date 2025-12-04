import { db } from "@server/db/db";
import { dutySwap, dutySchedule } from "@server/db/schema";
import { and, eq, or, desc } from "drizzle-orm";

type DutySwapInsert = typeof dutySwap.$inferInsert;

export interface CreateDutySwapParams {
    from_name: string;
    from_no: string;
    from_position: string;
    from_date: string;
    from_shift: number;
    to_name: string;
    to_no: string;
    to_position: string;
    to_date: string;
    to_shift: number;
    reason?: string;
    created_at: string;
    updated_at: string;
}

export interface UpdateDutySwapStatusParams {
    id: number;
    status: number;
    updated_at: string;
}

export interface GetMyDutySwapParams {
    userNo: string;
    status?: number;
}

export interface GetAllDutySwapParams {
    status?: number;
}

// 创建换班申请
export const createDutySwap = async (payload: CreateDutySwapParams) => {
    const result = await db
        .insert(dutySwap)
        .values({
            from_name: payload.from_name,
            from_no: payload.from_no,
            from_position: payload.from_position,
            from_date: payload.from_date,
            from_shift: payload.from_shift,
            to_name: payload.to_name,
            to_no: payload.to_no,
            to_position: payload.to_position,
            to_date: payload.to_date,
            to_shift: payload.to_shift,
            status: 0, // 默认为申请中
            reason: payload.reason ?? null,
            created_at: payload.created_at,
            updated_at: payload.updated_at,
        })
        .returning();

    return result[0];
};

// 获取换班申请详情
export const getDutySwapById = async (id: number) => {
    const result = await db
        .select()
        .from(dutySwap)
        .where(eq(dutySwap.id, id));

    return result[0];
};

// 查询我的换班申请（我发起的或者换我的）
export const getMyDutySwap = async (params: GetMyDutySwapParams) => {
    const { userNo, status } = params;
    const conditions = [
        or(eq(dutySwap.from_no, userNo), eq(dutySwap.to_no, userNo)),
    ];

    if (status !== undefined) {
        conditions.push(eq(dutySwap.status, status));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    return db
        .select()
        .from(dutySwap)
        .where(whereClause)
        .orderBy(desc(dutySwap.created_at));
};

// 查询所有换班申请
export const getAllDutySwap = async (params: GetAllDutySwapParams) => {
    const { status } = params;
    const conditions = [];

    if (status !== undefined) {
        conditions.push(eq(dutySwap.status, status));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    return db
        .select()
        .from(dutySwap)
        .where(whereClause)
        .orderBy(desc(dutySwap.created_at));
};

// 更新换班申请状态（同意/拒绝）
export const updateDutySwapStatus = async (
    payload: UpdateDutySwapStatusParams
) => {
    const { id, status, updated_at } = payload;

    const result = await db
        .update(dutySwap)
        .set({
            status,
            updated_at,
        })
        .where(eq(dutySwap.id, id))
        .returning();

    return result[0];
};

// 取消换班申请(将状态改为3,而不是删除记录)
export const cancelDutySwap = async (id: number, updated_at: string) => {
    const result = await db
        .update(dutySwap)
        .set({
            status: 3,
            updated_at,
        })
        .where(eq(dutySwap.id, id))
        .returning();

    return result[0];
};

// 互换值班接口参数
export interface SwapDutyScheduleParams {
    from_no: string;
    from_date: string;
    to_no: string;
    to_date: string;
    shift: number;
}

// 互换两个人的值班
export const swapDutySchedule = async (params: SwapDutyScheduleParams) => {
    const { from_no, from_date, to_no, to_date, shift } = params;

    // 查找换班人的值班记录
    const fromSchedule = await db
        .select()
        .from(dutySchedule)
        .where(
            and(
                eq(dutySchedule.no, from_no),
                eq(dutySchedule.date, from_date),
                eq(dutySchedule.shift, shift)
            )
        );

    // 查找被换人的值班记录
    const toSchedule = await db
        .select()
        .from(dutySchedule)
        .where(
            and(
                eq(dutySchedule.no, to_no),
                eq(dutySchedule.date, to_date),
                eq(dutySchedule.shift, shift)
            )
        );

    if (!fromSchedule[0]) {
        throw new Error(
            `未找到工号${from_no}在${from_date}的值班记录`
        );
    }

    if (!toSchedule[0]) {
        throw new Error(
            `未找到工号${to_no}在${to_date}的值班记录`
        );
    }

    // 执行互换操作
    // 更新换班人的记录为被换人的信息(但保留原日期)
    await db
        .update(dutySchedule)
        .set({
            name: toSchedule[0].name,
            no: toSchedule[0].no,
            position: toSchedule[0].position,
        })
        .where(eq(dutySchedule.id, fromSchedule[0].id));

    // 更新被换人的记录为换班人的信息(但保留原日期)
    await db
        .update(dutySchedule)
        .set({
            name: fromSchedule[0].name,
            no: fromSchedule[0].no,
            position: fromSchedule[0].position,
        })
        .where(eq(dutySchedule.id, toSchedule[0].id));

    return {
        success: true,
        from: {
            id: fromSchedule[0].id,
            date: from_date,
            originalPerson: fromSchedule[0].name,
            newPerson: toSchedule[0].name,
        },
        to: {
            id: toSchedule[0].id,
            date: to_date,
            originalPerson: toSchedule[0].name,
            newPerson: fromSchedule[0].name,
        },
    };
};

