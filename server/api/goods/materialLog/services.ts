import { db } from "@server/db/db";
import {
  application,
  applicationDetail,
  materialLog,
  materialStore,
} from "@server/db/schema";
import { eq } from "drizzle-orm";

type MaterialLogRecord = typeof materialLog.$inferSelect;

export interface CreateMaterialLogParams {
  applicationId: number;
  approver?: string;
  approverNo?: string;
}

const getCurrentTimeString = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  const seconds = String(now.getSeconds()).padStart(2, "0");
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
};

export const createMaterialLogs = async ({
  applicationId,
  approver,
  approverNo,
}: CreateMaterialLogParams) => {
  const [appRecord] = await db
    .select()
    .from(application)
    .where(eq(application.id, applicationId))
    .limit(1);

  if (!appRecord) {
    throw new Error("申请单不存在");
  }

  const isDraftStatus = [0, 1].includes(appRecord.status);
  const isPendingStatus = appRecord.status === 2;

  if (!isDraftStatus && !isPendingStatus) {
    throw new Error("当前状态不可提交");
  }

  if (isPendingStatus && appRecord.operation !== "OUT") {
    throw new Error("当前状态不可提交");
  }

  const details = await db
    .select()
    .from(applicationDetail)
    .where(eq(applicationDetail.applicationCode, appRecord.applicationCode));

  if (details.length === 0) {
    throw new Error("申请单没有物资明细");
  }

  const now = getCurrentTimeString();
  const isOutbound = appRecord.operation === "OUT";
  const shouldProcessInventory =
    (!isOutbound && isDraftStatus) || (isOutbound && isPendingStatus);
  const targetStatus = (() => {
    if (isOutbound) {
      return isPendingStatus ? 3 : 2;
    }
    return 3;
  })();

  const result = db.transaction((tx) => {
    const updatePayload: Partial<typeof application.$inferInsert> = {
      status: targetStatus,
      updateTime: now,
    };

    if (targetStatus === 3) {
      updatePayload.approver = approver ?? null;
      updatePayload.approverNo = approverNo ?? null;
      updatePayload.approveTime = now;
    }

    tx.update(application)
      .set(updatePayload)
      .where(eq(application.id, applicationId))
      .run();

    const logs: MaterialLogRecord[] = [];

    if (shouldProcessInventory) {
      for (const detail of details) {
        const storeItem = tx
          .select()
          .from(materialStore)
          .where(eq(materialStore.materialCode, detail.materialCode))
          .limit(1)
          .get();

        if (!storeItem) {
          throw new Error(`物料 ${detail.materialCode} 不存在`);
        }

        let nextNum = storeItem.num ?? 0;

        if (appRecord.operation === "IN") {
          nextNum += detail.quantity;
        } else {
          if (detail.quantity > nextNum) {
            throw new Error(`${detail.materialName} 库存不足`);
          }
          nextNum -= detail.quantity;
        }

        tx.update(materialStore)
          .set({ num: nextNum, updateTime: now })
          .where(eq(materialStore.id, storeItem.id))
          .run();

        const insertedLog = tx
          .insert(materialLog)
          .values({
            applicationCode: appRecord.applicationCode,
            materialCode: detail.materialCode,
            materialName: detail.materialName,
            spec: detail.spec,
            unit: detail.unit,
            quantity: detail.quantity,
            operation: appRecord.operation,
            location: storeItem.location,
            origin: appRecord.origin,
            remark: detail.remark,
            time: now,
          })
          .returning()
          .get();

        if (insertedLog) {
          logs.push(insertedLog);
        }
      }
    }

    return {
      status: targetStatus,
      logs,
    };
  });

  return result;
};
