import type { EventResponse } from "../types/event";
import { resolveFileUrl } from "./api";

export function formatEventDate(value?: string | null): string {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function formatEventDateRange(start?: string | null, end?: string | null): string {
  const formattedStart = formatEventDate(start);
  const formattedEnd = formatEventDate(end);

  if (formattedStart && formattedEnd) {
    return `${formattedStart} — ${formattedEnd}`;
  }

  return formattedStart || formattedEnd;
}

export function formatEventTime(value?: string): string {
  if (!value) {
    return "";
  }

  const [hours, minutes] = value.split(":");

  if (hours && minutes) {
    return `${hours}:${minutes}`;
  }

  return value;
}

export function getEventFormatLabel(value?: string | null): string | undefined {
  if (!value) {
    return undefined;
  }

  switch (value.toUpperCase()) {
    case "ONLINE":
      return "Онлайн";
    case "OFFLINE":
      return "Офлайн";
    case "HYBRID":
      return "Гибрид";
    default:
      return value;
  }
}

const EVENT_STATUS_LABELS: Record<string, string> = {
  PLANNED: "Запланировано",
  SCHEDULED: "Запланировано",
  UPCOMING: "Скоро",
  ACTIVE: "Активно",
  ONGOING: "В процессе",
  IN_PROGRESS: "В процессе",
  COMPLETED: "Завершено",
  FINISHED: "Завершено",
  CANCELLED: "Отменено",
  CANCELED: "Отменено",
  POSTPONED: "Перенесено",
  DRAFT: "Черновик",
  PUBLISHED: "Опубликовано",
};

export function getEventStatusLabel(value?: string | null): string | undefined {
  if (!value) {
    return undefined;
  }

  const normalized = value.trim();

  if (!normalized) {
    return undefined;
  }

  const lookupKey = normalized.toUpperCase();
  const label = EVENT_STATUS_LABELS[lookupKey];

  if (label) {
    return label;
  }

  return normalized;
}

export function getEventCoverUrl(event: Pick<EventResponse, "coverUrl">): string | undefined {
  return (
    resolveFileUrl(event.coverUrl ?? undefined, {
      defaultPrefix: "/api/files/thumbnail/ASSETS",
    }) ?? undefined
  );
}
