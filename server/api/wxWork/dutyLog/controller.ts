import { Context } from "hono";

import {
    DutyLeaderNotFoundError,
    sendDutyLeaderTextMessage,
} from "./services";

export const sendDutyLeaderMessageController = async (c: Context) => {
    try {
        const shiftParam = c.req.query("shift");
        const shift = shiftParam === "1" ? 1 : 0;
        const result = await sendDutyLeaderTextMessage({ shift });
        return c.json({ success: true, data: result });
    } catch (error) {
        if (error instanceof DutyLeaderNotFoundError) {
            return c.json({ success: false, message: error.message }, 404);
        }

        const message =
            error instanceof Error ? error.message : "发送企业微信消息失败";
        return c.json({ success: false, message }, 500);
    }
};
