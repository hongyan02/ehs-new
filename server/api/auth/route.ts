import { Hono } from "hono";
import { loginController, logoutController } from "./controller";

const authRoute = new Hono();

authRoute.post("/login", loginController);
authRoute.post("/logout", logoutController);

export default authRoute;
