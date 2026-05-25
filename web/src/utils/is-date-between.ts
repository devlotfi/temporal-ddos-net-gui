export function isDateBetween(
  dateStr: string,
  startStr: string,
  endStr: string,
): boolean {
  // Validate format: YYYY-MM-DD HH:mm:ss
  const regex = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/;

  if (!regex.test(dateStr) || !regex.test(startStr) || !regex.test(endStr)) {
    return false;
  }

  // Convert "YYYY-MM-DD HH:mm:ss" -> "YYYY-MM-DDTHH:mm:ss"
  const toDate = (s: string): Date => new Date(s.replace(" ", "T"));

  const date = toDate(dateStr);
  const start = toDate(startStr);
  const end = toDate(endStr);

  // Check for invalid dates
  if (isNaN(date.getTime()) || isNaN(start.getTime()) || isNaN(end.getTime())) {
    return false;
  }

  return date >= start && date <= end;
}
