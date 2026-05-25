export function parseDate(dateStr: string): Date | null {
  const regex = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/;

  if (!regex.test(dateStr)) {
    return null;
  }

  const date = new Date(dateStr.replace(" ", "T"));

  return isNaN(date.getTime()) ? null : date;
}
