/**
 * Glue between Server Actions and tRPC procedures.
 *
 * `api()` returns a server-side caller for the app router. `run()` calls a
 * procedure from an action and keeps the action's behaviour exactly as if the
 * code ran inline: Next's redirect/notFound signals and any other error a
 * procedure throws come out unwrapped, and an auth failure goes to the
 * action's own `onDenied` handler (usually a redirect to /forbidden).
 */
import { TRPCError } from "@trpc/server";
import { redirect } from "next/navigation";
import { appRouter } from "./routers/_app";
import { createCallerFactory, type DeniedReason } from "./trpc";

const createCaller = createCallerFactory(appRouter);

export const api = () => createCaller({});

export async function run<T, D = never>(
  call: () => Promise<T>,
  onDenied?: (reason: DeniedReason) => D | Promise<D>,
): Promise<T | D> {
  try {
    return await call();
  } catch (error) {
    if (!(error instanceof TRPCError)) throw error;

    if (
      onDenied &&
      (error.code === "FORBIDDEN" || error.code === "UNAUTHORIZED") &&
      !error.cause
    ) {
      return onDenied(error.message as DeniedReason);
    }

    // Errors thrown inside a procedure (including Next's redirect/notFound
    // signals) reach us wrapped; rethrow the original.
    throw error.cause ?? error;
  }
}

/** The locale a form posted in its hidden "locale" field. */
export const formLocale = (formData: FormData) =>
  (formData.get("locale") as string) || "en";

/** onDenied handler: send the user to /{locale}/forbidden. */
export const toForbidden = (formData: FormData) => () =>
  redirect(`/${formLocale(formData)}/forbidden`);
