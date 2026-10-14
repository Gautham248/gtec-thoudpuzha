/**
 * Zod helpers for procedures fed by HTML forms.
 *
 * `form({...})` accepts either a FormData (what a Server Action receives) or a
 * plain object with the same fields (handy in tests), and turns the raw form
 * strings into typed values with the field helpers below.
 */
import { z } from "zod";

function entries(formData: FormData): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const key of new Set(formData.keys())) {
    const values = formData.getAll(key);
    result[key] = values.length > 1 ? values : values[0];
  }
  return result;
}

export function form<T extends z.ZodRawShape>(shape: T) {
  const object = z.object(shape);
  return z.preprocess(
    (value) => (value instanceof FormData ? entries(value) : value),
    object,
  ) as unknown as z.ZodType<
    z.output<typeof object>,
    FormData | z.input<typeof object>
  >;
}

/** Like `form`, but keeps fields not named in `shape` (as unknown). */
export function looseForm<T extends z.ZodRawShape>(shape: T) {
  const object = z.looseObject(shape);
  return z.preprocess(
    (value) => (value instanceof FormData ? entries(value) : value),
    object,
  ) as unknown as z.ZodType<
    z.output<typeof object>,
    FormData | z.input<typeof object>
  >;
}

/**
 * A text field. Missing reads as "", so a procedure's own "x is required"
 * check (not a schema error) still decides what the user sees.
 */
export const text = () =>
  z
    .string()
    .nullish()
    .transform((v) => v ?? "");

/** Optional text: missing or blank reads as null. */
export const optionalText = () =>
  z
    .string()
    .nullish()
    .transform((v) => v || null);

/** Optional text, trimmed; missing reads as "". */
export const trimmed = () =>
  z
    .string()
    .nullish()
    .transform((v) => (v ?? "").trim());

/** Optional text, trimmed: missing or blank reads as null. */
export const optionalTrimmed = () =>
  z
    .string()
    .nullish()
    .transform((v) => v?.trim() || null);

/** The page's locale, sent as a hidden field; defaults to "en". */
export const locale = () =>
  z
    .string()
    .nullish()
    .transform((v) => v || "en");

/** A checkbox: checked when its value is "on". */
export const checkbox = () =>
  z
    .unknown()
    .optional()
    .transform((v) => v === "on");

/** A hidden boolean field: true when its value is "true". */
export const flag = () =>
  z
    .unknown()
    .optional()
    .transform((v) => v === "true");

/** Optional date input; missing or blank reads as null. */
export const optionalDate = () =>
  z
    .string()
    .nullish()
    .transform((v) => (v ? new Date(v) : null));

/** Optional integer input; missing or blank reads as null. */
export const optionalInt = () =>
  z
    .string()
    .nullish()
    .transform((v) => (v ? parseInt(v, 10) : null));

const isFile = (v: unknown): v is File =>
  typeof v === "object" && v !== null && "arrayBuffer" in v && "name" in v;

/** An optional uploaded file. */
export const file = () =>
  z
    .custom<File>((v) => v == null || isFile(v))
    .nullish()
    .transform((v) => v ?? null);

/** Every value sent under one name (checkbox groups, multi-file inputs). */
export function list<T extends z.ZodType>(item: T) {
  return z.preprocess(
    (v) => (v == null ? [] : Array.isArray(v) ? v : [v]),
    z.array(item),
  );
}

export const anyFile = () => z.custom<File>(isFile);

export const direction = () => z.enum(["up", "down"]);

/** One of a fixed set of values; missing or blank reads as undefined. */
export function choice<const T extends readonly [string, ...string[]]>(
  values: T,
) {
  return z
    .enum(values)
    .or(z.literal(""))
    .nullish()
    .transform((v) => v || undefined);
}
