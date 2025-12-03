import { db } from "@server/db/db";
import { application } from "@server/db/schema";
import { and, desc, eq, like } from "drizzle-orm";

type ApplicationInsert = typeof application.$inferInsert;

export interface GetApplicationsParams {
    page?: number;
    pageSize?: number;
    title?: string;
    applicant?: string;
    status?: number;
    operation?: "IN" | "OUT";
}

export interface CreateApplicationParams {
    applicationCode: string;
    title: string;
    operation: "IN" | "OUT";
    applicationTime: string;
    applicant: string;
    applicantNo: string;
    approveTime?: string | null;
    approver?: string | null;
    approverNo?: string | null;
    origin?: string | null;
    purpose?: string | null;
    status: number;
    createTime: string;
    updateTime: string;
}

export interface UpdateApplicationParams {
    id: number;
    title?: string;
    operation?: "IN" | "OUT";
    applicationTime?: string;
    applicant?: string;
    applicantNo?: string;
    approveTime?: string | null;
    approver?: string | null;
    approverNo?: string | null;
    origin?: string | null;
    purpose?: string | null;
    status?: number;
    updateTime?: string;
}

export const getApplications = async (params: GetApplicationsParams) => {
    const { page = 1, pageSize = 10, title, applicant, status, operation } = params;

    const conditions: (ReturnType<typeof eq> | ReturnType<typeof like>)[] = [];

    if (title) {
        const fuzzy = `%${title}%`;
        conditions.push(like(application.title, fuzzy));
    }

    if (applicant) {
        const fuzzy = `%${applicant}%`;
        conditions.push(like(application.applicant, fuzzy));
    }

    if (status !== undefined) {
        conditions.push(eq(application.status, status));
    }

    if (operation) {
        conditions.push(eq(application.operation, operation));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const allRows = await db.select().from(application).where(whereClause);
    const total = allRows.length;

    const offset = (page - 1) * pageSize;
    const data = await db
        .select()
        .from(application)
        .where(whereClause)
        .orderBy(desc(application.id))
        .limit(pageSize)
        .offset(offset);

    return {
        data,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
    };
};

export const getApplicationById = async (id: number) => {
    const result = await db.select().from(application).where(eq(application.id, id));
    return result[0];
};

export const createApplication = async (params: CreateApplicationParams) => {
    const result = await db
        .insert(application)
        .values({
            applicationCode: params.applicationCode,
            title: params.title,
            operation: params.operation,
            applicationTime: params.applicationTime,
            applicant: params.applicant,
            applicantNo: params.applicantNo,
            approveTime: params.approveTime ?? null,
            approver: params.approver ?? null,
            approverNo: params.approverNo ?? null,
            origin: params.origin ?? null,
            purpose: params.purpose ?? null,
            status: params.status,
            createTime: params.createTime,
            updateTime: params.updateTime,
        })
        .returning();

    return result[0];
};

export const updateApplication = async (params: UpdateApplicationParams) => {
    const { id, ...rest } = params;
    const updateData: Partial<ApplicationInsert> = {};

    if (rest.title !== undefined) updateData.title = rest.title;
    if (rest.operation !== undefined) updateData.operation = rest.operation;
    if (rest.applicationTime !== undefined) updateData.applicationTime = rest.applicationTime;
    if (rest.applicant !== undefined) updateData.applicant = rest.applicant;
    if (rest.applicantNo !== undefined) updateData.applicantNo = rest.applicantNo;
    if (rest.approveTime !== undefined) updateData.approveTime = rest.approveTime;
    if (rest.approver !== undefined) updateData.approver = rest.approver;
    if (rest.approverNo !== undefined) updateData.approverNo = rest.approverNo;
    if (rest.origin !== undefined) updateData.origin = rest.origin;
    if (rest.purpose !== undefined) updateData.purpose = rest.purpose;
    if (rest.status !== undefined) updateData.status = rest.status;
    if (rest.updateTime !== undefined) updateData.updateTime = rest.updateTime;

    if (Object.keys(updateData).length === 0) {
        return getApplicationById(id);
    }

    const result = await db
        .update(application)
        .set(updateData)
        .where(eq(application.id, id))
        .returning();

    return result[0];
};
