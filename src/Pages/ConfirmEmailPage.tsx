import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../Components/ui/card";
import { FieldDescription, FieldGroup } from "../Components/ui/field";
import { Spinner } from "../Components/ui/spinner";

import { confirmEmailApi } from "../Services/loginServices";

type State =
  | { kind: "working" }
  | { kind: "done"; message: string }
  | { kind: "failed"; message: string };

// Landing page for the emailed confirmation link:
// /confirm-email?email=…&token=… — posts the token straight away and reports.
function ConfirmEmailPage() {
  const [searchParams] = useSearchParams();
  const email = searchParams.get("email") ?? "";
  const token = searchParams.get("token") ?? "";

  const [state, setState] = useState<State>({ kind: "working" });

  // StrictMode mounts twice in dev; the token is single-use, so post only once.
  const fired = useRef(false);

  useEffect(() => {
    if (fired.current) return;
    fired.current = true;

    if (!email || !token) {
      setState({
        kind: "failed",
        message: "This confirmation link is incomplete. Open the link from the email again.",
      });
      return;
    }

    confirmEmailApi(email, token)
      .then(() => setState({ kind: "done", message: "Your email address is confirmed." }))
      .catch((err: unknown) =>
        setState({
          kind: "failed",
          message:
            err instanceof Error ? err.message : "This confirmation link is invalid or has expired.",
        })
      );
  }, [email, token]);

  return (
    <div className="flex min-h-dvh w-full items-center justify-center overflow-y-auto py-8">
      <div className="flex flex-col gap-6 w-full max-w-md px-4 sm:px-0">
        <Card className="border-border">
          <CardHeader>
            <CardTitle>Email confirmation</CardTitle>
            <CardDescription>{email || "ExpenseTracker"}</CardDescription>
          </CardHeader>

          <CardContent>
            <FieldGroup>
              {state.kind === "working" ? (
                <FieldDescription className="flex items-center gap-2">
                  <Spinner />
                  Confirming your email…
                </FieldDescription>
              ) : (
                <FieldDescription className={state.kind === "failed" ? "text-destructive" : undefined}>
                  {state.message}
                </FieldDescription>
              )}

              <FieldDescription className="text-center">
                <Link to="/login" className="underline underline-offset-4 hover:no-underline">
                  Go to login
                </Link>
              </FieldDescription>
            </FieldGroup>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default ConfirmEmailPage;
