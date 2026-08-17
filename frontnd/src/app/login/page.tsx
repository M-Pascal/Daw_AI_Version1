"use client";

import { Suspense, useActionState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { loginAction, type AuthFormState } from "@/lib/actions/auth-actions";
import { SplitAuthShell } from "@/components/auth/split-auth-shell";
import { GoogleAuthButton } from "@/components/google-auth-button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";

const initialState: AuthFormState = {};

const GOOGLE_ERROR_MESSAGES: Record<string, string> = {
  google_not_configured: "Google sign-in isn't configured on this server yet.",
  google_failed: "Google sign-in failed. Please try again or use email and password.",
};

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const [state, formAction, pending] = useActionState(loginAction, initialState);
  const searchParams = useSearchParams();
  const googleError = searchParams.get("error");

  return (
    <SplitAuthShell
      headline="See disease trends before they become outbreaks."
      description="Monitor HIV, TB, and Malaria case patterns across Kenya's eight regions, and forecast where disease activity is heading next."
      title="Sign in to DawAI"
      subtitle="Access disease trends and regional forecasts."
      activeTab="signin"
      footer={
        <>
          New to DawAI?{" "}
          <Link href="/signup" className="font-medium text-primary hover:underline">
            Create an account
          </Link>
        </>
      }
    >
      <form action={formAction} className="space-y-4">
        {googleError && !state.error && (
          <Alert variant="destructive">
            {GOOGLE_ERROR_MESSAGES[googleError] ?? "Something went wrong. Please try again."}
          </Alert>
        )}
        {state.error && <Alert variant="destructive">{state.error}</Alert>}

        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" placeholder="you@hospital.go.ke" required />
          {state.fieldErrors?.email && (
            <p className="text-xs text-destructive">{state.fieldErrors.email}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            <Link href="/forgot-password" className="text-xs text-primary hover:underline">
              Forgot password?
            </Link>
          </div>
          <Input
            id="password"
            name="password"
            type="password"
            placeholder="At least 8 characters"
            required
          />
          {state.fieldErrors?.password && (
            <p className="text-xs text-destructive">{state.fieldErrors.password}</p>
          )}
        </div>

        <Button type="submit" className="w-full" disabled={pending}>
          {pending ? "Signing in..." : "Sign in"}
        </Button>
      </form>

      <div className="my-6 flex items-center gap-3 text-xs text-muted-foreground">
        <div className="h-px flex-1 bg-border" />
        OR
        <div className="h-px flex-1 bg-border" />
      </div>

      <GoogleAuthButton />
    </SplitAuthShell>
  );
}
