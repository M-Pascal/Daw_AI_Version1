"use client";

import { Suspense, useActionState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { signupAction, type AuthFormState } from "@/lib/actions/auth-actions";
import { SplitAuthShell } from "@/components/auth/split-auth-shell";
import { GoogleAuthButton } from "@/components/google-auth-button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";

const initialState: AuthFormState = {};

const GOOGLE_ERROR_MESSAGES: Record<string, string> = {
  google_not_configured: "Google sign-in isn't configured on this server yet.",
  google_failed: "Google sign-in failed. Please try again or use the form below.",
};

export default function SignupPage() {
  return (
    <Suspense fallback={null}>
      <SignupForm />
    </Suspense>
  );
}

function SignupForm() {
  const [state, formAction, pending] = useActionState(signupAction, initialState);
  const searchParams = useSearchParams();
  const googleError = searchParams.get("error");

  return (
    <SplitAuthShell
      headline="Track disease trends across Kenya's eight regions."
      description="Create an account to monitor HIV, TB, and Malaria case burden, explore regional outbreak patterns, and forecast what's coming next."
      title="Create your DawAI account"
      subtitle="Get access to the disease forecast dashboard."
      activeTab="signup"
      footer={
        <>
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-primary hover:underline">
            Sign in
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
          <Label htmlFor="fullName">Full names</Label>
          <Input id="fullName" name="fullName" type="text" placeholder="Jane Wanjiru" required />
          {state.fieldErrors?.fullName && (
            <p className="text-xs text-destructive">{state.fieldErrors.fullName}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" placeholder="you@hospital.go.ke" required />
          {state.fieldErrors?.email && (
            <p className="text-xs text-destructive">{state.fieldErrors.email}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            name="password"
            type="password"
            placeholder="At least 8 characters"
            required
            minLength={8}
          />
          {state.fieldErrors?.password && (
            <p className="text-xs text-destructive">{state.fieldErrors.password}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="confirmPassword">Confirm password</Label>
          <Input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            placeholder="Re-enter your password"
            required
            minLength={8}
          />
          {state.fieldErrors?.confirmPassword && (
            <p className="text-xs text-destructive">{state.fieldErrors.confirmPassword}</p>
          )}
        </div>

        <Button type="submit" className="w-full" disabled={pending}>
          {pending ? "Creating account..." : "Create account"}
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
