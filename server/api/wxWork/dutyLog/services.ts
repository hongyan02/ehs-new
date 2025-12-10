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
            normalizedShift === 0
                ? "未找到当天白班值班领导排班"
                : "未找到当天夜班值班领导排班"
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
        "【值班提醒】",
        `日期：${leader.date}`,
        `班次：${normalizedShift === 0 ? "白班" : "夜班"}`,
        `姓名：${leader.name}`,
        `工号：${leader.no}`,
    ]
        .filter(Boolean)
        .join("\n");

    const contentToSend =
        content && content.trim().length > 0 ? content.trim() : fallbackContent;

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
