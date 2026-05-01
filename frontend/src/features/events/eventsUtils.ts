import type { ConflictSeverity } from "./eventsTypes";

export function severityClass(severity: ConflictSeverity) {
  return severity.toLowerCase();
}

export function formatAlertAge(ageMinutes: number) {
  if (ageMinutes < 1) return "Now";
  if (ageMinutes < 60) return `${ageMinutes} min ago`;
  const ageHours = Math.round(ageMinutes / 60);
  if (ageHours < 24) return `${ageHours}h ago`;
  return `${Math.round(ageHours / 24)}d ago`;
}
