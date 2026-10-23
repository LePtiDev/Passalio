export type RecordedStatement = {
  readonly sql: string;
  readonly params: readonly unknown[];
};

class RecordingStatement implements D1PreparedStatement {
  readonly #database: D1Database;
  readonly #record: (statement: RecordedStatement) => void;
  readonly sql: string;
  readonly params: readonly unknown[];

  constructor(
    database: D1Database,
    record: (statement: RecordedStatement) => void,
    sql: string,
    params: readonly unknown[],
  ) {
    this.#database = database;
    this.#record = record;
    this.sql = sql;
    this.params = params;
  }

  bind(...values: unknown[]): D1PreparedStatement {
    return new RecordingStatement(this.#database, this.#record, this.sql, values);
  }

  real(): D1PreparedStatement {
    this.#record({ sql: this.sql, params: this.params });
    return this.#database.prepare(this.sql).bind(...this.params);
  }

  first<T = unknown>(colName: string): Promise<T | null>;
  first<T = Record<string, unknown>>(): Promise<T | null>;
  async first<T>(colName?: string): Promise<T | null> {
    return colName === undefined ? this.real().first<T>() : this.real().first<T>(colName);
  }

  async run<T = Record<string, unknown>>(): Promise<D1Result<T>> {
    return this.real().run<T>();
  }

  async all<T = Record<string, unknown>>(): Promise<D1Result<T>> {
    return this.real().all<T>();
  }

  raw<T = unknown[]>(options: { columnNames: true }): Promise<[string[], ...T[]]>;
  raw<T = unknown[]>(options?: { columnNames?: false }): Promise<T[]>;
  async raw<T = unknown[]>(options?: { columnNames?: boolean }): Promise<[string[], ...T[]] | T[]> {
    return options?.columnNames === true
      ? this.real().raw<T>({ columnNames: true })
      : this.real().raw<T>();
  }
}

export class RecordingD1 implements D1Database {
  readonly #database: D1Database;
  readonly #recorded: RecordedStatement[] = [];

  constructor(database: D1Database) {
    this.#database = database;
  }

  readonly #record = (statement: RecordedStatement) => {
    this.#recorded.push(statement);
  };

  recorded(): readonly RecordedStatement[] {
    return [...this.#recorded];
  }

  async recording(action: () => Promise<unknown>): Promise<readonly RecordedStatement[]> {
    this.#recorded.length = 0;
    await action();
    return this.recorded();
  }

  prepare(query: string): D1PreparedStatement {
    return new RecordingStatement(this.#database, this.#record, query, []);
  }

  async batch<T = unknown>(statements: D1PreparedStatement[]): Promise<D1Result<T>[]> {
    return this.#database.batch<T>(
      statements.map((statement) =>
        statement instanceof RecordingStatement ? statement.real() : statement,
      ),
    );
  }

  async exec(query: string): Promise<D1ExecResult> {
    this.#record({ sql: query, params: [] });
    return this.#database.exec(query);
  }

  withSession(...session: Parameters<D1Database["withSession"]>): D1DatabaseSession {
    return this.#database.withSession(...session);
  }

  async dump(): Promise<ArrayBuffer> {
    return this.#database.dump();
  }
}
