// In-memory stand-in for `db.query.<table>.findMany / findFirst` from "@/db".
//
// Instead of asserting on query arguments, tests seed rows and let the real
// `where` / `orderBy` / `limit` / `columns` / `with` options run against them,
// so they check behaviour (a DRAFT course is filtered out) rather than syntax.
//
//   vi.mock("@/db", async () => (await import("@/__tests__/drizzle-mock")).mockDbModule());
//   import { db } from "@/db";
//   setMockRows(db, "course", [{ ...row, category: { ...cat } }]);
//
// Relations are seeded inline on each row (`category: {...}` / `items: [...]`)
// and are only returned when requested through `with`, like the real client.
//
// Writes (`insert` / `update` / `delete`) are recorded, not applied: read them
// back with getMockWrites(). Tests that need real write semantics should use
// the in-memory Postgres in ./pg-test-db instead.
//
// src/__tests__/setup.ts installs this fake for every test, so no test can
// reach a real database through "@/db" by accident.

import {
  createTableRelationsHelpers,
  extractTablesRelationalConfig,
  is,
} from "drizzle-orm";
import { getTableConfig, PgTable } from "drizzle-orm/pg-core";
import * as tables from "@/db/schema";
import * as relations from "@/db/relations";

type Row = Record<string, unknown>;
type Predicate = (row: Row) => boolean;
type Order = { column: string; direction: "asc" | "desc" };

interface QueryConfig {
  where?: (
    fields: Record<string, string>,
    ops: typeof operators,
  ) => Predicate | undefined;
  orderBy?: (
    fields: Record<string, string>,
    ops: typeof orderOperators,
  ) => Order | Order[];
  limit?: number;
  offset?: number;
  columns?: Record<string, boolean>;
  with?: Record<string, true | QueryConfig>;
}

const { tables: relational } = extractTablesRelationalConfig(
  { ...tables, ...relations },
  createTableRelationsHelpers,
);

const value = (row: Row, column: string) => row[column] as never;
const compare = (a: unknown, b: unknown) =>
  a instanceof Date && b instanceof Date
    ? a.getTime() - b.getTime()
    : a! < b!
      ? -1
      : a! > b!
        ? 1
        : 0;

const operators = {
  eq:
    (c: string, v: unknown): Predicate =>
    (r) =>
      compare(value(r, c), v) === 0 && r[c] != null,
  ne:
    (c: string, v: unknown): Predicate =>
    (r) =>
      r[c] != null && compare(value(r, c), v) !== 0,
  gt:
    (c: string, v: unknown): Predicate =>
    (r) =>
      r[c] != null && compare(value(r, c), v) > 0,
  gte:
    (c: string, v: unknown): Predicate =>
    (r) =>
      r[c] != null && compare(value(r, c), v) >= 0,
  lt:
    (c: string, v: unknown): Predicate =>
    (r) =>
      r[c] != null && compare(value(r, c), v) < 0,
  lte:
    (c: string, v: unknown): Predicate =>
    (r) =>
      r[c] != null && compare(value(r, c), v) <= 0,
  isNull:
    (c: string): Predicate =>
    (r) =>
      r[c] == null,
  isNotNull:
    (c: string): Predicate =>
    (r) =>
      r[c] != null,
  inArray:
    (c: string, vs: unknown[]): Predicate =>
    (r) =>
      vs.includes(r[c]),
  notInArray:
    (c: string, vs: unknown[]): Predicate =>
    (r) =>
      r[c] != null && !vs.includes(r[c]),
  not:
    (p: Predicate): Predicate =>
    (r) =>
      !p(r),
  and:
    (...ps: (Predicate | undefined)[]): Predicate =>
    (r) =>
      ps.every((p) => !p || p(r)),
  or:
    (...ps: (Predicate | undefined)[]): Predicate =>
    (r) =>
      ps.some((p) => !!p && p(r)),
};

const orderOperators = {
  asc: (column: string): Order => ({ column, direction: "asc" }),
  desc: (column: string): Order => ({ column, direction: "desc" }),
};

/** Column proxy: `fields.status` evaluates to the key "status". */
const fieldNames = new Proxy({}, { get: (_t, key) => key }) as Record<
  string,
  string
>;

function runQuery(
  tableName: string,
  rows: Row[],
  config: QueryConfig = {},
): Row[] {
  const table = relational[tableName];
  if (!table) throw new Error(`drizzle-mock: unknown table "${tableName}"`);

  let result = rows;
  const predicate = config.where?.(fieldNames, operators);
  if (predicate) result = result.filter(predicate);

  if (config.orderBy) {
    const orders = [config.orderBy(fieldNames, orderOperators)].flat();
    result = [...result].sort((a, b) => {
      for (const { column, direction } of orders) {
        const [x, y] = [a[column], b[column]];
        // Postgres: NULLS LAST for ASC, NULLS FIRST for DESC.
        if (x == null || y == null) {
          if (x == null && y == null) continue;
          const nullFirst = direction === "desc";
          return (x == null) === nullFirst ? -1 : 1;
        }
        const c = compare(x, y);
        if (c !== 0) return direction === "asc" ? c : -c;
      }
      return 0;
    });
  }

  if (config.offset) result = result.slice(config.offset);
  if (config.limit !== undefined) result = result.slice(0, config.limit);

  const allColumns = Object.keys(table.columns);
  const selected = config.columns
    ? allColumns.filter((c) => config.columns![c])
    : allColumns;

  return result.map((row) => {
    const out: Row = {};
    for (const c of selected) out[c] = row[c] ?? null;
    for (const [relName, relConfig] of Object.entries(config.with ?? {})) {
      const relation = table.relations[relName];
      if (!relation)
        throw new Error(
          `drizzle-mock: unknown relation "${tableName}.${relName}"`,
        );
      const target = Object.keys(relational).find(
        (k) => relational[k].dbName === relation.referencedTableName,
      )!;
      const nested = relConfig === true ? {} : relConfig;
      const seeded = row[relName];
      if (Array.isArray(seeded)) {
        out[relName] = runQuery(target, seeded as Row[], nested);
      } else {
        out[relName] = seeded
          ? runQuery(target, [seeded as Row], nested)[0]
          : null;
      }
    }
    return out;
  });
}

export interface MockWrite {
  op: "insert" | "update" | "delete";
  table: string;
  /** insert: the row(s) passed to values(); update: the object passed to set(). */
  data?: Row | Row[];
  /** onConflictDoUpdate / onConflictDoNothing config, if any. */
  onConflict?: { action: "update" | "nothing"; set?: Row };
  /** Whether where() was called (its SQL condition is not evaluated). */
  hasWhere: boolean;
}

type MockDb = {
  query: Record<
    string,
    {
      findMany: (c?: QueryConfig) => Promise<Row[]>;
      findFirst: (c?: QueryConfig) => Promise<Row | undefined>;
    }
  >;
  insert: (table: unknown) => WriteBuilder;
  update: (table: unknown) => WriteBuilder;
  delete: (table: unknown) => WriteBuilder;
  transaction: <T>(fn: (tx: MockDb) => Promise<T>) => Promise<T>;
  __rows: Map<string, Row[]>;
  __errors: Map<string, unknown>;
  __writes: MockWrite[];
};

const tsNameOf = (table: unknown): string => {
  if (!is(table, PgTable))
    throw new Error("drizzle-mock: expected a table from @/db/schema");
  const dbName = getTableConfig(table).name;
  return Object.keys(relational).find((k) => relational[k].dbName === dbName)!;
};

type WriteBuilder = ReturnType<typeof writeBuilder>;

/** Chainable, awaitable write builder that records itself into `writes`. */
function writeBuilder(
  write: MockWrite,
  writes: MockWrite[],
  errors: Map<string, unknown>,
) {
  writes.push(write);
  const result = (): Promise<Row[]> => {
    if (errors.has(write.table)) return Promise.reject(errors.get(write.table));
    return Promise.resolve(
      write.op === "insert" ? [write.data ?? []].flat() : [],
    );
  };
  const builder = {
    values(data: Row | Row[]) {
      write.data = data;
      return builder;
    },
    set(data: Row) {
      write.data = data;
      return builder;
    },
    where(_condition?: unknown) {
      write.hasWhere = true;
      return builder;
    },
    onConflictDoUpdate(config: { target?: unknown; set: Row }) {
      write.onConflict = { action: "update", set: config.set };
      return builder;
    },
    onConflictDoNothing(_config?: unknown) {
      write.onConflict = { action: "nothing" };
      return builder;
    },
    returning(_fields?: unknown) {
      return result();
    },
    then<A = void, B = never>(
      ok?: ((v: void) => A | PromiseLike<A>) | null,
      fail?: ((e: unknown) => B | PromiseLike<B>) | null,
    ) {
      return result()
        .then(() => undefined)
        .then(ok, fail);
    },
  };
  return builder;
}

export function createMockDb(): MockDb {
  const rows = new Map<string, Row[]>();
  const errors = new Map<string, unknown>();
  const query = Object.fromEntries(
    Object.keys(relational).map((name) => {
      const run = async (config?: QueryConfig) => {
        if (errors.has(name)) throw errors.get(name);
        return runQuery(name, rows.get(name) ?? [], config);
      };
      return [
        name,
        {
          findMany: (config?: QueryConfig) => run(config),
          findFirst: async (config?: QueryConfig) =>
            (await run({ ...config, limit: 1 }))[0],
        },
      ];
    }),
  );
  const writes: MockWrite[] = [];
  const write = (op: MockWrite["op"]) => (table: unknown) =>
    writeBuilder(
      { op, table: tsNameOf(table), hasWhere: false },
      writes,
      errors,
    );
  const mock: MockDb = {
    query,
    insert: write("insert"),
    update: write("update"),
    delete: write("delete"),
    transaction: (fn) => fn(mock),
    __rows: rows,
    __errors: errors,
    __writes: writes,
  };
  return mock;
}

/** Module factory for `vi.mock("@/db", ...)`. */
export function mockDbModule() {
  return { db: createMockDb() };
}

function asMock(db: unknown): MockDb {
  if (!db || !(db as MockDb).__rows) {
    throw new Error('drizzle-mock: "@/db" is not mocked with mockDbModule()');
  }
  return db as MockDb;
}

/** Seed the rows a table's queries will see. Relations go inline on each row. */
export function setMockRows(
  db: unknown,
  table: keyof typeof relational,
  rows: Row[],
) {
  asMock(db).__rows.set(table as string, rows);
}

/** Make every query on `table` reject with `error` (to test fallbacks). */
export function failMockQuery(
  db: unknown,
  table: keyof typeof relational,
  error: unknown = new Error("db down"),
) {
  asMock(db).__errors.set(table as string, error);
}

/** Writes recorded since the last reset, optionally for one table. */
export function getMockWrites(
  db: unknown,
  table?: keyof typeof relational,
): MockWrite[] {
  const writes = asMock(db).__writes;
  return table ? writes.filter((w) => w.table === table) : [...writes];
}

/** Every row passed to insert().values() for `table`, in order. */
export function getInsertedRows(
  db: unknown,
  table: keyof typeof relational,
): Row[] {
  return getMockWrites(db, table)
    .filter((w) => w.op === "insert")
    .flatMap((w) => [w.data ?? []].flat());
}

/** Clear all seeded rows, failures and recorded writes. */
export function resetMockDb(db: unknown) {
  asMock(db).__rows.clear();
  asMock(db).__errors.clear();
  asMock(db).__writes.length = 0;
}

/** True when "@/db" is this fake (and not, say, a pg-test-db instance). */
export function isMockDb(db: unknown): boolean {
  return !!db && !!(db as MockDb).__rows;
}
