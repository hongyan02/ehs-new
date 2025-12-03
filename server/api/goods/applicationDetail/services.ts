import { db } from "@server/db/db";
import { applicationDetail, application } from "@server/db/schema";
import { eq, desc } from "drizzle-orm";

export type CreateApplicationDetailInput = typeof applicationDetail.$inferInsert;
export type UpdateApplicationDetailInput = Partial<CreateApplicationDetailInput>;

export const getApplicationDetails = async (applicationCode: string) => {
    return await db
        .select()
        .from(applicationDetail)
        .where(eq(applicationDetail.applicationCode, applicationCode))
        .orderBy(desc(applicationDetail.id));
};

export const createApplicationDetail = async (data: CreateApplicationDetailInput) => {
    // 检查申请单状态，只有未提交（0）状态下才能添加明细
    const apps = await db
        .select()
        .from(application)
        .where(eq(application.applicationCode, data.applicationCode))
        .limit(1);

    const app = apps[0];

    if (!app) {
        throw new Error("申请单不存在");
    }

    if (![0, 1].includes(app.status)) {
        throw new Error("只有未提交或已保存状态的申请单可以添加明细");
    }

    return await db.insert(applicationDetail).values(data).returning();
};

export const updateApplicationDetail = async (id: number, data: UpdateApplicationDetailInput) => {
    // 获取明细以找到申请单号
    const details = await db
        .select()
        .from(applicationDetail)
        .where(eq(applicationDetail.id, id))
        .limit(1);

    const detail = details[0];

    if (!detail) {
        throw new Error("明细不存在");
    }

    // 检查申请单状态
    const apps = await db
        .select()
        .from(application)
        .where(eq(application.applicationCode, detail.applicationCode))
        .limit(1);

    const app = apps[0];

    if (!app) {
        throw new Error("申请单不存在");
    }

    if (![0, 1].includes(app.status)) {
        throw new Error("只有未提交或已保存状态的申请单可以修改明细");
    }

    return await db
        .update(applicationDetail)
        .set(data)
        .where(eq(applicationDetail.id, id))
        .returning();
};

export const deleteApplicationDetail = async (id: number) => {
    // 获取明细以找到申请单号
    const details = await db
        .select()
        .from(applicationDetail)
        .where(eq(applicationDetail.id, id))
        .limit(1);

    const detail = details[0];

    if (!detail) {
        throw new Error("明细不存在");
    }

    // 检查申请单状态
    const apps = await db
        .select()
        .from(application)
        .where(eq(application.applicationCode, detail.applicationCode))
        .limit(1);

    const app = apps[0];

    if (!app) {
        throw new Error("申请单不存在");
    }

    if (app.status !== 0) {
        throw new Error("只有未提交状态的申请单可以删除明细");
    }

    return await db.delete(applicationDetail).where(eq(applicationDetail.id, id)).returning();
};
