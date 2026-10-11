// @vitest-environment node
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, test } from "vitest";
import { getTableConfig, isPgEnum, PgTable } from "drizzle-orm/pg-core";
import {
  createTableRelationsHelpers,
  extractTablesRelationalConfig,
  is,
} from "drizzle-orm";
import * as schema from "./schema";
import * as relations from "./relations";

// Guards the Prisma → Drizzle switch: while both schemas exist, the Drizzle one
// must describe exactly the tables Prisma does, including Prisma's client-side
// defaults (cuid ids, @updatedAt) that the database itself doesn't know about.

interface PrismaField {
  name: string;
  type: string;
  optional: boolean;
  list: boolean;
  cuid: boolean;
  updatedAt: boolean;
}

const prismaSource = readFileSync(
  join(process.cwd(), "prisma", "schema.prisma"),
  "utf8",
);

function parseBlocks(kind: "model" | "enum"): Map<string, string[]> {
  const blocks = new Map<string, string[]>();
  const re = new RegExp(`^${kind} (\\w+) \\{([\\s\\S]*?)^\\}`, "gm");
  for (const m of prismaSource.matchAll(re)) {
    const lines = m[2]
      .split(/\r?\n/)
      .map((l) => l.replace(/\/\/.*$/, "").trim())
      .filter((l) => l && !l.startsWith("@@"));
    blocks.set(m[1], lines);
  }
  return blocks;
}

const prismaEnums = parseBlocks("enum");
const prismaModels = new Map(
  [...parseBlocks("model")].map(([name, lines]) => [
    name,
    lines.map((line): PrismaField => {
      const [fieldName, rawType] = line.split(/\s+/);
      return {
        name: fieldName,
        type: rawType.replace(/[[\]?]/g, ""),
        optional: rawType.endsWith("?"),
        list: rawType.endsWith("[]"),
        cuid: line.includes("cuid()"),
        updatedAt: line.includes("@updatedAt"),
      };
    }),
  ]),
);

const SCALARS = new Set(["String", "Int", "Boolean", "DateTime", "Json"]);
const isColumn = (f: PrismaField) => SCALARS.has(f.type) || prismaEnums.has(f.type);

const drizzleTables = new Map(
  Object.values(schema)
    .flatMap((v) => (is(v, PgTable) ? [getTableConfig(v)] : []))
    .map((config) => [config.name, config]),
);

const drizzleEnums = new Map(
  Object.values(schema)
    .flatMap((v) => (isPgEnum(v) ? [[v.enumName, [...v.enumValues]] as const] : [])),
);

describe("Drizzle schema matches prisma/schema.prisma", () => {
  test("has the same tables", () => {
    expect([...drizzleTables.keys()].sort()).toEqual([...prismaModels.keys()].sort());
  });

  test("has the same enums and values", () => {
    expect([...drizzleEnums.keys()].sort()).toEqual([...prismaEnums.keys()].sort());
    for (const [name, lines] of prismaEnums) {
      expect(drizzleEnums.get(name), name).toEqual(lines.map((l) => l.split(/\s+/)[0]));
    }
  });

  describe.each([...prismaModels.keys()])("%s", (model) => {
    const fields = prismaModels.get(model)!.filter(isColumn);
    const table = drizzleTables.get(model)!;
    const columns = new Map(table.columns.map((c) => [c.name, c]));

    test("has the same columns", () => {
      expect([...columns.keys()].sort()).toEqual(fields.map((f) => f.name).sort());
    });

    test("matches nullability, arrays and enum types", () => {
      for (const f of fields) {
        const col = columns.get(f.name)!;
        // Prisma lists are nullable-free in the client but nullable in SQL.
        if (!f.list) expect(col.notNull, `${model}.${f.name} notNull`).toBe(!f.optional);
        expect(col.columnType === "PgArray", `${model}.${f.name} array`).toBe(f.list);
        if (prismaEnums.has(f.type)) {
          expect(
            (col as unknown as { enum: { enumName: string } }).enum.enumName,
            `${model}.${f.name} enum`,
          ).toBe(f.type);
        }
        if (f.type === "DateTime") {
          expect(col.dataType, `${model}.${f.name} returns Date`).toBe("date");
        }
      }
    });

    test("keeps Prisma's client-side cuid and @updatedAt defaults", () => {
      for (const f of fields) {
        const col = columns.get(f.name)!;
        if (f.cuid) {
          expect(col.defaultFn, `${model}.${f.name} cuid`).toBeTypeOf("function");
          expect(col.defaultFn!()).toMatch(/^[a-z0-9]{24,}$/);
        }
        if (f.updatedAt) {
          expect(col.onUpdateFn, `${model}.${f.name} onUpdate`).toBeTypeOf("function");
          expect(col.defaultFn, `${model}.${f.name} default`).toBeTypeOf("function");
        }
      }
    });
  });

  test("declares a Drizzle relation for every Prisma relation field", () => {
    const { tables } = extractTablesRelationalConfig(
      { ...schema, ...relations },
      createTableRelationsHelpers,
    );
    const declared = new Map(
      Object.values(tables).map((t) => [t.dbName, new Set(Object.keys(t.relations))]),
    );

    for (const [model, fields] of prismaModels) {
      for (const f of fields) {
        if (isColumn(f)) continue;
        expect(declared.get(model)?.has(f.name), `${model}.${f.name}`).toBe(true);
      }
    }
  });
});
