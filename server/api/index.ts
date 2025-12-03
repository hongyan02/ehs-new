import { Hono } from "hono";
import webhookDutyLogRoute from "./webhook/dutyLog/route";
import dutyLogRoute from "./dutyLog/route";
import dutyPersonRoute from "./dutyPerson/route";
import dutyScheduleRoute from "./dutySchedule/route";
import goodsStoreRoute from "./goods/store/route";
import applicationRoute from "./goods/application/route";
import applicationDetailRoute from "./goods/applicationDetail/route";
import materialLogRoute from "./goods/materialLog/route";

const app = new Hono().basePath("/api");

app.route("/webhook", webhookDutyLogRoute);
app.route("/dutyLog", dutyLogRoute);
app.route("/dutyPerson", dutyPersonRoute);
app.route("/dutySchedule", dutyScheduleRoute);
app.route("/goods/store", goodsStoreRoute);
app.route("/goods/application", applicationRoute);
app.route("/goods/applicationDetail", applicationDetailRoute);
app.route("/goods/materialLog", materialLogRoute);

export { app };

export type AppType = typeof app;
