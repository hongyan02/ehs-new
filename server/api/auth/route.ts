import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { sign } from "hono/jwt";
import { setCookie } from "hono/cookie";
import axios from "axios";
import { db } from "../../db/db";
import { userPermission } from "../../db/schema";
import { eq } from "drizzle-orm";

const app = new Hono();

const loginSchema = z.object({
    username: z.string(),
    password: z.string(),
});

app.post(
    "/login",
    zValidator("json", loginSchema),
    async (c) => {
        const { username, password } = c.req.valid("json");

        try {
            // 1. Call external IMS login
            const imsUrl = process.env.NEXT_PUBLIC_API_CONFIG_IMS;
            if (!imsUrl) {
                return c.json({ error: "IMS API configuration missing" }, 500);
            }

            const loginRes = await axios.post(`${imsUrl}/login`, {
                username,
                password,
            });

            const token = loginRes.data.token; // Assuming the token is in data.token, adjust based on actual IMS response
            if (!token) {
                return c.json({ error: "Login failed: No token received" }, 401);
            }

            // 2. Get user info using the token
            const infoRes = await axios.get(`${imsUrl}/getInfo`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            const user = infoRes.data.user; // Assuming user info is in data.user
            if (!user) {
                return c.json({ error: "Failed to retrieve user info" }, 401);
            }

            const employeeId = user.userName; // Assuming userName is the employee ID (工号)

            // 3. Query user permissions
            const permissionRecord = await db.query.userPermission.findFirst({
                where: eq(userPermission.employeeId, employeeId),
            });

            let permissions: string[] = [];
            if (permissionRecord) {
                try {
                    permissions = JSON.parse(permissionRecord.permissions);
                } catch (e) {
                    console.error("Failed to parse permissions JSON", e);
                }
            }

            // 4. Generate JWT
            const jwtSecret = process.env.JWT_SECRET || "default_secret_please_change";
            const payload = {
                sub: employeeId,
                name: user.nickName, // Assuming nickName exists
                permissions: permissions,
                exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24, // 1 day expiration
            };

            const permissionToken = await sign(payload, jwtSecret);

            // 5. Set Cookie
            setCookie(c, "Permission-Token", permissionToken, {
                path: "/",
                secure: process.env.NODE_ENV === "production",
                httpOnly: true,
                maxAge: 60 * 60 * 24,
                sameSite: "Lax",
            });

            return c.json({
                success: true,
                code: 200,
                msg: "Login success",
                token: token,
                user: {
                    name: user.nickName,
                    employeeId: employeeId,
                    permissions: permissions
                }
            });

        } catch (error: any) {
            console.error("Login error:", error.response?.data || error.message);
            return c.json({ error: "Login failed", details: error.response?.data?.msg || error.message }, 401);
        }
    }
);

export default app;
