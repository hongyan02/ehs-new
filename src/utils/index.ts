import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";

dayjs.extend(customParseFormat);

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const DEFAULT_SOURCE_FORMAT = "YYYY-MM-DD HH-mm-ss";
const DEFAULT_OUTPUT_FORMAT = "YYYY-MM-DD HH:mm:ss";

export function formatDateTime(
  value?: string,
  outputFormat: string = DEFAULT_OUTPUT_FORMAT,
  sourceFormat: string = DEFAULT_SOURCE_FORMAT,
) {
  if (!value) return "-";
  const parsed = dayjs(value, sourceFormat, true);
  return parsed.isValid() ? parsed.format(outputFormat) : value;
}
