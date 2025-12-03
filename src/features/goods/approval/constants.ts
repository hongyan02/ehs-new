import type { ApplicationData } from "./query";

export const STATUS_TEXT_MAP: Record<number, string> = {
    2: "待审核",
    3: "已完成",
    4: "已驳回",
};

export const getOperationLabel = (operation: ApplicationData["operation"]) =>
    operation === "IN" ? "入库" : "出库";
