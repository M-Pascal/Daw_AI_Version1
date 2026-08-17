"use client";

import { useActionState } from "react";
import Link from "next/link";
import {
  checkEmailAction,
  resetPasswordAction,
  type ForgotPasswordState,
} from "@/lib/actions/auth-actions";
import { AuthShell } from "@/components/auth-shell";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { CheckCircle2 } from "lucide-react";

const initialCheckState: ForgotPasswordState = { step: "request" };
const initialResetState: ForgotPasswordState = { step: "reset" };

export default function ForgotPasswordPage() {
  const [checkState, checkAction, checkPending] = useActionState(
    checkEmailAction,
    initialCheckState
  );
  const [resetState, resetAction, resetPending] = useActionState(
    resetPasswordAction,
    initialResetState
  );

  if (resetState.step === "done") {
    return (
      <AuthShell title="Password updated">
        <div className="flex flex-col items-center gap-3 text-center">
          <CheckCircle2 className="h-10 w-10 text-balanced" />
          <p className="text-sm text-muted-foreground">
            Your password has been updated. You can now log in with your new
            password.
          </p>
          <Link href="/login" className="mt-2">
            <Button>Go to login</Button>
          </Link>
        </div>
      </AuthShell>
    );
  }

  if (checkState.step === "reset") {
    const email = checkState.email ?? resetState.email ?? "";
    return (
      <AuthShell
        title="Set a new password"
        subtitle={`Resetting password for ${email}`}
      >
        <form action={resetAction} className="space-y-4">
          <input type="hidden" name="email" value={email} />

          <div className="space-y-1.5">
            <Label htmlFor="password">New password</Label>
            <Input id="password" name="password" type="password" required minLength={8} />
            {resetState.fieldErrors?.password && (
              <p className="text-xs text-destructive">{resetState.fieldErrors.password}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="confirmPassword">Confirm new password</Label>
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              required
              minLength={8}
            />
            {resetState.fieldErrors?.confirmPassword && (
              <p className="text-xs text-destructive">
                {resetState.fieldErrors.confirmPassword}
              </p>
            )}
          </div>

          <Button type="submit" className="w-full" disabled={resetPending}>
            {resetPending ? "Updating..." : "Update password"}
          </Button>
        </form>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Forgot your password?"
      subtitle="Enter your account email to reset it"
      footer={
        <Link href="/login" className="font-medium text-primary hover:underline">
          Back to login
        </Link>
      }
    >
      <form action={checkAction} className="space-y-4">
        {checkState.error && <Alert variant="destructive">{checkState.error}</Alert>}

        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" placeholder="you@hospital.go.ke" required />
        </div>

        <Button type="submit" className="w-full" disabled={checkPending}>
          {checkPending ? "Checking..." : "Continue"}
        </Button>
      </form>
    </AuthShell>
  );
}
