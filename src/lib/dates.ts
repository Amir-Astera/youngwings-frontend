const RELATIVE_TIME_FORMATTER = new Intl.RelativeTimeFormat("ru", { numeric: "auto" });

const DIVISORS: { unit: Intl.RelativeTimeFormatUnit; ms: number }[] = [
  { unit: "year", ms: 1000 * 60 * 60 * 24 * 365 },
  { unit: "month", ms: 1000 * 60 * 60 * 24 * 30 },
  { unit: "week", ms: 1000 * 60 * 60 * 24 * 7 },
  { unit: "day", ms: 1000 * 60 * 60 * 24 },
  { unit: "hour", ms: 1000 * 60 * 60 },
  { unit: "minute", ms: 1000 * 60 },
  { unit: "second", ms: 1000 },
];

export function formatRelativeTime(input?: string | Date | null): string {
  if (!input) {
    return "";
  }

  const date = typeof input === "string" ? new Date(input) : input;

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const diff = date.getTime() - Date.now();

  for (const { unit, ms } of DIVISORS) {
    const delta = diff / ms;

    if (Math.abs(delta) >= 1) {
      return RELATIVE_TIME_FORMATTER.format(Math.round(delta), unit);
    }
  }

  return "только что";
}
