import axios from "axios";
import { db } from "../../db/db";
import { userPermission } from "../../db/schema";
import { eq } from "drizzle-orm";

export type LoginParams = {
    username: string;
    password: string;
};

export type LoginResult = {
    token: string;
    user: {
        name: string;
        employeeId: string;
        permissions: string[];
    };
};

/**
 * 调用外部 IMS 登录
 */
export async function callIMSLogin(username: string, password: string) {
    const imsUrl = process.env.NEXT_PUBLIC_API_CONFIG_IMS;
    if (!imsUrl) {
        throw new Error("IMS API configuration missing");
    }

    const response = await axios.post(`${imsUrl}/login`, {
        username,
        password,
    });

    return response.data;
}

/**
 * 获取用户权限
 */
export async function getUserPermissions(employeeId: string): Promise<string[]> {
    const permissionRecord = await db.query.userPermission.findFirst({
        where: eq(userPermission.employeeId, employeeId),
    });

    if (!permissionRecord) {
        return [];
    }

    try {
        return JSON.parse(permissionRecord.permissions);
    } catch {
        return [];
    }
}
