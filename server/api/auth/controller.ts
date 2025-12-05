import { Context } from "hono";
import { z } from "zod";
import { sign } from "hono/jwt";
import { setCookie } from "hono/cookie";
import { callIMSLogin, getUserPermissions } from "./services";

const loginSchema = z.object({
    username: z.string(),
    password: z.string(),
});

export const loginController = async (c: Context) => {
    try {
        const body = await c.req.json();
        const { username, password } = loginSchema.parse(body);

        // 1. Call external IMS login
        const imsResponse = await callIMSLogin(username, password);

        // IMS 返回的数据结构：{ token, user: { nickName, ... } }
        const token = imsResponse.token;
        const user = imsResponse.user || {};
        const employeeId = username; // 使用 username 作为 employeeId

        // 2. Get user permissions from database
        const permissions = await getUserPermissions(employeeId);

        // 3. Generate JWT with permissions
        const jwtSecret = process.env.JWT_SECRET || "default_secret_please_change";
        const payload = {
            employeeId: employeeId,
            username: username,
            permissions: permissions,
            exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24, // 24 hours
        };
        const permissionToken = await sign(payload, jwtSecret);

        // 4. Set Cookie (secure: false for HTTP deployment)
        setCookie(c, "Permission-Token", permissionToken, {
            path: "/",
            secure: false, // 设置为 false 以支持 HTTP
            httpOnly: true,
            maxAge: 60 * 60 * 24,
            sameSite: "Lax",
        });

        // 5. Return response
        return c.json({
            success: true,
            code: 200,
            msg: "Login success",
            token: token,
            user: {
                name: user.nickName || username,
                employeeId: employeeId,
                permissions: permissions,
            },
        });
    } catch (error: any) {
        if (error instanceof z.ZodError) {
            return c.json({ success: false, message: error.issues }, 400);
        }
        console.error("Login error:", error.response?.data || error.message);
        return c.json(
            {
                error: "Login failed",
                details: error.response?.data?.msg || error.message,
            },
            401
        );
    }
};

export const logoutController = (c: Context) => {
    // 设置过期的 cookie 来清除它
    setCookie(c, "Permission-Token", "", {
        path: "/",
        secure: false, // 设置为 false 以支持 HTTP
        httpOnly: true,
        maxAge: 0, // 立即过期
        sameSite: "Lax",
    });

    return c.json({
        success: true,
        msg: "Logout success",
    });
};
