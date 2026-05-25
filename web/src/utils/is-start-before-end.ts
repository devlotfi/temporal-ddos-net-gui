import { parseDate } from "./parse-date";

export function isBefore(startStr: string, endStr: string): boolean {
  const start = parseDate(startStr);
  const end = parseDate(endStr);

  if (!start || !end) {
    return false;
  }

  return start <= end;
}
