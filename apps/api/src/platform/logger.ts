type LogLevel = "info" | "warn" | "error";

export type LogFields = {
  readonly event: string;
  readonly [key: string]: unknown;
};

export type Logger = {
  readonly info: (fields: LogFields) => void;
  readonly warn: (fields: LogFields) => void;
  readonly error: (fields: LogFields) => void;
};

const WRITERS: Readonly<Record<LogLevel, (line: string) => void>> = {
  info: (line) => console.info(line),
  warn: (line) => console.warn(line),
  error: (line) => console.error(line),
};

const write = (level: LogLevel, traceId: string, fields: LogFields): void => {
  WRITERS[level](
    JSON.stringify({ level, timestamp: new Date().toISOString(), trace_id: traceId, ...fields }),
  );
};

export const createLogger = (traceId: string): Logger => ({
  info: (fields) => write("info", traceId, fields),
  warn: (fields) => write("warn", traceId, fields),
  error: (fields) => write("error", traceId, fields),
});
