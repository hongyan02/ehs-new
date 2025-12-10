import axios from "axios";
import { and, eq } from "drizzle-orm";

import { db } from "@server/db/db";
import { dutySchedule } from "@server/db/schema";

import { getAccessToken } from "../getAccessToken";

const WXWORK_MESSAGE_URL = "http://10.1.3.65:8080/gateway/qywx/cgi-bin/message/send";

export class DutyLeaderNotFoundError extends Error {}

type DutyScheduleRecord = typeof dutySchedule.$inferSelect;

type SendMessagePayload = {
    touser: string;
    msgtype: "text";
    agentid: number;
    text: {
        content: string;
    };
    safe: 0;
};

type WeComSendMessageResponse = {
    errcode: number;
    errmsg: string;
    invaliduser?: string;
    invalidparty?: string;
    invalidtag?: string;
    msgid?: string;
};

export type SendDutyLeaderTextResult = {
    toUser: string;
    date: string;
    shift: number;
    position?: string | null;
    agentId: number;
    content: string;
    response: WeComSendMessageResponse;
};

const getTodayInShanghai = () =>
    new Intl.DateTimeFormat("en-CA", {
        timeZone: "Asia/Shanghai",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
    }).format(new Date());

const getTodayShiftLeader = async (shift: number): Promise<DutyScheduleRecord | null> => {
    const today = getTodayInShanghai();

    const result = await db
        .select()
        .from(dutySchedule)
        .where(and(eq(dutySchedule.date, today), eq(dutySchedule.shift, shift)))
        .limit(1);

    return result[0] ?? null;
};

export const sendDutyLeaderTextMessage = async ({
    shift = 0,
    content,
}: {
    shift?: number;
    content?: string;
} = {}): Promise<SendDutyLeaderTextResult> => {
    const normalizedShift = shift === 1 ? 1 : 0;

    const leader = await getTodayShiftLeader(normalizedShift);
    if (!leader) {
        throw new DutyLeaderNotFoundError(
            normalizedShift === 0 ? "未找到当天白班值班领导排班" : "未找到当天夜班值班领导排班"
        );
    }

    const agentId = process.env.AGENT_ID;
    if (!agentId) {
        throw new Error("AGENT_ID 环境变量未配置");
    }

    const parsedAgentId = Number(agentId);
    if (!Number.isFinite(parsedAgentId)) {
        throw new Error("AGENT_ID 环境变量必须为数字");
    }

    const accessToken = await getAccessToken();

    const url = new URL(WXWORK_MESSAGE_URL);
    url.searchParams.set("access_token", accessToken);

    const fallbackContent = [
        `${leader.name}，您好！`,
        "根据《8BU 领导值班管理规定》要求，值班领导需在当日值班期间完成以下工作：检查本单位安全生产情况，纠正违章作业，督查生产纪律。",
        "请您于值班当日及时通过在线值班系统填写值班日志，记录值班期间的工作内容及问题处理情况。",
        "请尽快登录系统完成日志提交，确保履职记录完整留存。感谢您对安全生产工作的支持与配合！",
        "填写地址：http://10.22.161.62:802/dutyManagement/dutyLog",
        `登录账号：${leader.no}`,
        "密码：(同综合管理平台)",
    ].join("\n");

    const contentToSend = content && content.trim().length > 0 ? content.trim() : fallbackContent;

    const payload: SendMessagePayload = {
        touser: leader.no.trim(),
        msgtype: "text",
        agentid: parsedAgentId,
        text: {
            content: contentToSend,
        },
        safe: 0,
    };

    const { data } = await axios.post<WeComSendMessageResponse>(url.toString(), payload);

    if (data.errcode !== 0) {
        throw new Error(`发送企业微信消息失败: ${data.errmsg}`);
    }

    return {
        toUser: payload.touser,
        date: leader.date,
        shift: normalizedShift,
        position: leader.position ?? undefined,
        agentId: parsedAgentId,
        content: contentToSend,
        response: data,
    };
};
