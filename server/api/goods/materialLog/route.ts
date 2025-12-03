import { Hono } from "hono";
import { createMaterialLogController } from "./controller";

const materialLogRoute = new Hono();

materialLogRoute.post("/", createMaterialLogController);

export default materialLogRoute;
