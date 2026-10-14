"use client";

import { useRef, useTransition, type FormEvent, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface ActionFormProps {
  action: (formData: FormData) => void | Promise<void>;
  /** Toast shown once the action resolves. */
  success?: string;
  /** Native confirm() prompt shown before submitting; cancelling aborts. */
  confirmMessage?: string;
  /** Clear the inputs after a successful submit (create / upload forms). */
  resetOnSuccess?: boolean;
  className?: string;
  children: ReactNode;
}

/** Next.js signals redirect() / notFound() by throwing an error carrying a NEXT_* digest. */
function nextDigest(err: unknown): string | null {
  if (typeof err === "object" && err !== null && "digest" in err) {
    const digest = (err as { digest: unknown }).digest;
    if (typeof digest === "string" && digest.startsWith("NEXT_")) return digest;
  }
  return null;
}

function errorMessage(err: unknown): string {
  const message = err instanceof Error ? err.message : "";
  // Production builds replace server-side error messages with a generic notice.
  if (!message || message.includes("omitted in production")) {
    return "Something went wrong. Please try again.";
  }
  return message;
}

/**
 * Drop-in replacement for `<form action={serverAction}>` in the admin panel.
 *
 * Runs the server action in a transition so the form can show feedback:
 * every control is disabled and the clicked submit button gets a spinner while
 * it runs, then a toast reports success or failure and the route is refreshed
 * so lists reflect the change without a manual reload. `action` stays on the
 * <form> as the no-JS fallback.
 */
export function ActionForm({
  action,
  success = "Saved",
  confirmMessage,
  resetOnSuccess = false,
  className,
  children,
}: ActionFormProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const submitterRef = useRef<HTMLElement | null>(null);

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (pending) return;
    if (confirmMessage && !confirm(confirmMessage)) return;

    const form = e.currentTarget;
    const submitter = (e.nativeEvent as SubmitEvent).submitter as HTMLElement | null;
    // Read the fields before the fieldset disables them.
    const formData = new FormData(form, submitter);

    submitterRef.current = submitter;
    submitter?.setAttribute("data-submitting", "");

    startTransition(async () => {
      try {
        await action(formData);
        toast.success(success);
        if (resetOnSuccess) form.reset();
        router.refresh();
      } catch (err) {
        const digest = nextDigest(err);
        if (digest?.startsWith("NEXT_REDIRECT")) {
          // The router is already following the redirect.
          if (digest.includes("/forbidden")) {
            toast.error("You don't have permission to do that.");
          } else {
            toast.success(success);
          }
        } else if (digest) {
          throw err;
        } else {
          toast.error(errorMessage(err));
        }
      } finally {
        submitterRef.current?.removeAttribute("data-submitting");
        submitterRef.current = null;
      }
    });
  }

  return (
    <form
      action={action}
      onSubmit={handleSubmit}
      aria-busy={pending || undefined}
      className={className}
    >
      {/* display:contents keeps the form's own flex/grid layout intact. */}
      <fieldset disabled={pending} className="contents">
        {children}
      </fieldset>
    </form>
  );
}
