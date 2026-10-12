// @vitest-environment node
import { describe, expect, test, vi } from "vitest";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { createCallerFactory, publicProcedure, router } from "./trpc";
import { run } from "./action";

vi.mock("./routers/_app", () => ({ appRouter: {} }));

const testRouter = router({
  ok: publicProcedure.query(() => "ok"),
  throws: publicProcedure.mutation(() => {
    throw new Error("original");
  }),
  denied: publicProcedure.mutation(() => {
    throw new TRPCError({ code: "FORBIDDEN", message: "no_permission" });
  }),
  typed: publicProcedure.input(z.object({ n: z.number() })).query(() => 1),
});
const call = () => createCallerFactory(testRouter)({});

describe("run", () => {
  test("returns the procedure's result", async () => {
    await expect(run(() => call().ok())).resolves.toBe("ok");
  });

  test("rethrows the procedure's original error, unwrapped", async () => {
    const error = await run(() => call().throws()).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(Error);
    expect(error).not.toBeInstanceOf(TRPCError);
    expect((error as Error).message).toBe("original");
  });

  test("hands an auth failure to onDenied with its reason", async () => {
    const onDenied = vi.fn(() => "denied");
    await expect(run(() => call().denied(), onDenied)).resolves.toBe("denied");
    expect(onDenied).toHaveBeenCalledWith("no_permission");
  });

  test("without onDenied, an auth failure is thrown", async () => {
    await expect(run(() => call().denied())).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
  });

  test("invalid input surfaces as the validation error", async () => {
    await expect(
      run(() => call().typed({ n: "x" as unknown as number })),
    ).rejects.toBeInstanceOf(z.ZodError);
  });
});
