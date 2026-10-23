export class TestExecutionContext implements ExecutionContext {
  readonly exports = {};
  readonly props = undefined;

  waitUntil(): void {}

  passThroughOnException(): void {}

  abort(): void {}

  get tracing(): Tracing {
    throw new Error("tracing_unavailable_in_tests");
  }
}
