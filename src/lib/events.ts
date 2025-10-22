import type { EventResponse } from "../types/event";
import { resolveFileUrl } from "./api";

export function formatEventDate(value?: string): string {
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

export function getEventCoverUrl(event: Pick<EventResponse, "coverUrl">): string | undefined {
  return (
    resolveFileUrl(event.coverUrl ?? undefined, {
      defaultPrefix: "/api/files/thumbnail/ASSETS",
    }) ?? undefined
  );
}
