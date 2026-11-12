import { splitDuration } from "./overview-stats"

type Translate = (key: string, named: Record<string, unknown>) => string

/**
 * A span in the two largest units that matter: "2 天 3 小时", "3 小时 20 分",
 * "45 分钟". Under a minute reads as "不到 1 分钟".
 */
export function formatDurationLabel(t: Translate, seconds: number): string {
  const { days, hours, minutes } = splitDuration(seconds)
  if (days > 0) {
    return t("rankBorder.overview.duration.daysHours", { days, hours })
  }
  if (hours > 0) {
    return t("rankBorder.overview.duration.hoursMinutes", { hours, minutes })
  }
  if (minutes > 0) {
    return t("rankBorder.overview.duration.minutes", { minutes })
  }
  return t("rankBorder.overview.duration.underMinute", {})
}
