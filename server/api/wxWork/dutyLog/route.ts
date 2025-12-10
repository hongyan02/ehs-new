import { Hono } from "hono";

import { sendDutyLeaderMessageController } from "./controller";

const wxWorkDutyLogRoute = new Hono();

wxWorkDutyLogRoute.post("/", sendDutyLeaderMessageController);

export default wxWorkDutyLogRoute;
