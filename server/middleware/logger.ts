import { Context, Next } from "hono";
import fs from "fs";
import path from "path";

// ANSI 颜色代码
const colors = {
    reset: "\x1b[0m",
    green: "\x1b[32m",
    yellow: "\x1b[33m",
    red: "\x1b[31m",
    cyan: "\x1b[36m",
    gray: "\x1b[90m",
};

// 状态码颜色映射
function getStatusColor(status: number): string {
    if (status >= 500) return colors.red;
    if (status >= 400) return colors.yellow;
    if (status >= 300) return colors.cyan;
    if (status >= 200) return colors.green;
    return colors.reset;
}

// 格式化时间
function formatTime(ms: number): string {
    if (ms < 1000) {
        return `${ms.toFixed(2)}ms`;
    }
    return `${(ms / 1000).toFixed(2)}s`;
}

// 日志文件配置
const LOG_DIR = path.join(process.cwd(), "logs");
const MAX_LOG_SIZE = 1024 * 1024 * 1024; // 1GB
let currentLogFile: string;
let currentLogStream: fs.WriteStream | null = null;

// 确保日志目录存在
function ensureLogDir() {
    if (!fs.existsSync(LOG_DIR)) {
        fs.mkdirSync(LOG_DIR, { recursive: true });
    }
}

// 获取当前日志文件路径
function getCurrentLogFile(): string {
    const timestamp = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
    let logFile = path.join(LOG_DIR, `app-${timestamp}.log`);

    // 检查文件大小
    if (fs.existsSync(logFile)) {
        const stats = fs.statSync(logFile);
        if (stats.size >= MAX_LOG_SIZE) {
            // 文件超过1GB，创建新文件
            let counter = 1;
            let newLogFile: string;
            do {
                newLogFile = path.join(LOG_DIR, `app-${timestamp}-${counter}.log`);
                counter++;
            } while (fs.existsSync(newLogFile) && fs.statSync(newLogFile).size >= MAX_LOG_SIZE);
            logFile = newLogFile;
        }
    }

    return logFile;
}

// 写入日志到文件
function writeToFile(message: string) {
    ensureLogDir();
    const logFile = getCurrentLogFile();

    // 如果日志文件变化，关闭旧的流并创建新的
    if (currentLogFile !== logFile) {
        if (currentLogStream) {
            currentLogStream.end();
        }
        currentLogFile = logFile;
        currentLogStream = fs.createWriteStream(logFile, { flags: "a" });
    }

    // 移除 ANSI 颜色代码后写入文件
    const plainMessage = message.replace(/\x1b\[\d+m/g, "");
    currentLogStream?.write(plainMessage + "\n");
}

// 获取客户端 IP 地址
function getClientIP(c: Context): string {
    // 优先从代理头获取（如果使用了 Nginx 等反向代理）
    const forwardedFor = c.req.header("x-forwarded-for");
    if (forwardedFor) {
        // X-Forwarded-For 可能包含多个 IP，取第一个
        return forwardedFor.split(",")[0].trim();
    }

    const realIP = c.req.header("x-real-ip");
    if (realIP) {
        return realIP;
    }

    // 从请求对象获取（开发环境）
    return "unknown";
}

// 获取格式化的当前时间
function getFormattedTime(): string {
    const now = new Date();
    return now.toLocaleString("zh-CN", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
    });
}

// 敏感字段列表（需要脱敏）
const SENSITIVE_FIELDS = ["password", "token", "authorization", "cookie"];

// 过滤敏感信息
function filterSensitiveData(obj: any): any {
    if (!obj || typeof obj !== "object") {
        return obj;
    }

    if (Array.isArray(obj)) {
        return obj.map(filterSensitiveData);
    }

    const filtered: any = {};
    for (const [key, value] of Object.entries(obj)) {
        const lowerKey = key.toLowerCase();
        if (SENSITIVE_FIELDS.some((field) => lowerKey.includes(field))) {
            filtered[key] = "***";
        } else if (typeof value === "object" && value !== null) {
            filtered[key] = filterSensitiveData(value);
        } else {
            filtered[key] = value;
        }
    }
    return filtered;
}

// 格式化 JSON 字符串
function formatJSON(data: any): string {
    try {
        const filtered = filterSensitiveData(data);
        return JSON.stringify(filtered, null, 2);
    } catch {
        return String(data);
    }
}

// Hono logger middleware
export function customLogger() {
    return async (c: Context, next: Next) => {
        const start = Date.now();
        const method = c.req.method;
        const path = c.req.path;
        const ip = getClientIP(c);
        const timestamp = getFormattedTime();

        // 读取请求体
        let requestBody: any = null;
        if (["POST", "PUT", "PATCH"].includes(method)) {
            try {
                // 克隆请求以读取 body
                const clonedReq = c.req.raw.clone();
                requestBody = await clonedReq.json();
            } catch {
                // 如果不是 JSON，忽略
            }
        }

        // 入站请求日志
        const inboundLog = `${colors.gray}[${timestamp}]${colors.reset} ${colors.cyan}-->${colors.reset} ${colors.gray}${method}${colors.reset} ${path} ${colors.gray}[${ip}]${colors.reset}`;
        console.log(inboundLog);
        writeToFile(`[${timestamp}] --> ${method} ${path} [${ip}]`);

        if (requestBody) {
            const bodyLog = `    ${colors.gray}Request Body:${colors.reset} ${formatJSON(requestBody)}`;
            console.log(bodyLog);
            writeToFile(`    Request Body: ${formatJSON(requestBody)}`);
        }

        await next();

        // 出站响应日志
        const end = Date.now();
        const elapsed = end - start;
        const status = c.res.status;
        const statusColor = getStatusColor(status);

        const outboundLog = `${colors.gray}[${timestamp}]${colors.reset} ${colors.cyan}<--${colors.reset} ${colors.gray}${method}${colors.reset} ${path} ${statusColor}${status}${colors.reset} ${colors.gray}${formatTime(elapsed)}${colors.reset} ${colors.gray}[${ip}]${colors.reset}`;
        console.log(outboundLog);
        writeToFile(`[${timestamp}] <-- ${method} ${path} ${status} ${formatTime(elapsed)} [${ip}]`);
    };
}

// 清理函数（应用关闭时调用）
export function closeLogger() {
    if (currentLogStream) {
        currentLogStream.end();
        currentLogStream = null;
    }
}
