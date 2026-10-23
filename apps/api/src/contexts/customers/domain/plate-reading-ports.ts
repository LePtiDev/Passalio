import type { PlateReadingStatus, Result } from "@passalio/shared";

export type PlateImage = {
  readonly bytes: Uint8Array;
  readonly contentType: string;
};

export type PlateReaderUsage = {
  readonly inputTokens: number | undefined;
  readonly outputTokens: number | undefined;
};

export type PlateReaderReply = {
  readonly answer: unknown;
  readonly model: string;
  readonly usage: PlateReaderUsage;
};

export type PlateReaderFailure = {
  readonly model: string;
  readonly reason: string;
};

export type PlateReader = {
  readonly read: (
    image: PlateImage,
    traceId: string,
  ) => Promise<Result<PlateReaderReply, PlateReaderFailure>>;
};

export type PlateReading = {
  readonly id: string;
  readonly organizationId: string;
  readonly userId: string;
  readonly day: string;
  readonly status: PlateReadingStatus;
  readonly fieldCount: number;
  readonly model: string | null;
  readonly inputTokens: number | null;
  readonly outputTokens: number | null;
  readonly traceId: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;
};

export type PlateReadingRepository = {
  readonly countOnDay: (organizationId: string, day: string) => Promise<number>;
  readonly create: (reading: PlateReading) => Promise<void>;
};

export type PlateReadingError =
  | "invalid_photo"
  | "plate_reader_not_configured"
  | "plate_reading_limit_reached"
  | "plate_reader_unavailable";
