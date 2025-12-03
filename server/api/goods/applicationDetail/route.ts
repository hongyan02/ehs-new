import { Hono } from "hono";
import {
    getApplicationDetailsController,
    createApplicationDetailController,
    updateApplicationDetailController,
    deleteApplicationDetailController,
} from "./controller";

const applicationDetailRoute = new Hono();

applicationDetailRoute.get("/", getApplicationDetailsController);
applicationDetailRoute.post("/", createApplicationDetailController);
applicationDetailRoute.put("/:id", updateApplicationDetailController);
applicationDetailRoute.delete("/:id", deleteApplicationDetailController);

export default applicationDetailRoute;
