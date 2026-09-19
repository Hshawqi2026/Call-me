import { describe, expect, it } from "vitest";

import { formatDuration, formatRecordingDate } from "../lib/recording-utils";

describe("recording formatting", () => {
  it("formats short and long durations as mm:ss", () => {
    expect(formatDuration(0)).toBe("00:00");
    expect(formatDuration(9)).toBe("00:09");
    expect(formatDuration(75)).toBe("01:15");
    expect(formatDuration(3661)).toBe("61:01");
  });

  it("formats a valid ISO timestamp with an Arabic locale date", () => {
    const label = formatRecordingDate("2026-09-19T18:30:00.000Z");
    expect(label).toMatch(/سبتمبر|سبت|١٩|19/);
    expect(label.length).toBeGreaterThan(5);
  });
});
