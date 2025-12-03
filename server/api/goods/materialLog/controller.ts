import { Context } from "hono";
import { z } from "zod";
import { createMaterialLogs } from "./services";

const createMaterialLogSchema = z.object({
  applicationId: z.number().int().positive(),
  approver: z.string().optional(),
  approverNo: z.string().optional(),
});

export const createMaterialLogController = async (c: Context) => {
  try {
    const body = await c.req.json();
    const { applicationId, approver, approverNo } =
      createMaterialLogSchema.parse(body);

    const result = await createMaterialLogs({
      applicationId,
      approver,
      approverNo,
    });
    return c.json({ success: true, data: result });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json({ success: false, message: error.issues }, 400);
    }
    console.error("createMaterialLogController error:", error);
    return c.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "服务器错误",
      },
      500,
    );
  }
};
