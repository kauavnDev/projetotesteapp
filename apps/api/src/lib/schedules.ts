export function occursOn(
  scheduleType: "daily" | "weekly" | "monthly" | "custom",
  cfg: { days?: number[]; dayOfMonth?: number; interval?: number; anchor?: string },
  startDate: string,
  endDate: string | null,
  dateISO: string,
): boolean {
  if (dateISO < startDate) return false;
  if (endDate && dateISO > endDate) return false;
  const d = new Date(dateISO + "T00:00:00");
  switch (scheduleType) {
    case "daily": return true;
    case "weekly": return (cfg.days ?? []).includes(d.getDay());
    case "monthly": return d.getDate() === cfg.dayOfMonth;
    case "custom": {
      const anchor = new Date((cfg.anchor ?? startDate) + "T00:00:00");
      const diff = Math.floor((d.getTime() - anchor.getTime()) / 86_400_000);
      return diff >= 0 && diff % (cfg.interval ?? 2) === 0;
    }
  }
}