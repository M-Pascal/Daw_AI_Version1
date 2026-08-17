"use server";

import { redirect } from "next/navigation";
import { randomUUID } from "crypto";
import { createUser, findUserByEmail, updateUserPassword } from "@/lib/data/store";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { createSession, deleteSession } from "@/lib/auth/session";
import {
  EmailOnlySchema,
  LoginSchema,
  ResetPasswordSchema,
  SignupSchema,
} from "@/lib/validation";

export interface AuthFormState {
  error?: string;
  fieldErrors?: Record<string, string>;
  success?: boolean;
}

export async function signupAction(
  _prevState: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const parsed = SignupSchema.safeParse({
    fullName: formData.get("fullName"),
    email: formData.get("email"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0]?.toString() ?? "form";
      if (!fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return { fieldErrors };
  }

  const { fullName, email, password } = parsed.data;

  const existing = await findUserByEmail(email);
  if (existing) {
    return { fieldErrors: { email: "An account with this email already exists." } };
  }

  const passwordHash = await hashPassword(password);
  const user = {
    id: randomUUID(),
    fullName,
    email: email.toLowerCase(),
    passwordHash,
    createdAt: new Date().toISOString(),
  };

  await createUser(user);
  await createSession({ userId: user.id, email: user.email, fullName: user.fullName });

  redirect("/overview");
}

export async function loginAction(
  _prevState: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const parsed = LoginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0]?.toString() ?? "form";
      if (!fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return { fieldErrors };
  }

  const { email, password } = parsed.data;
  const user = await findUserByEmail(email);

  if (!user) {
    return { error: "No account found with that email and password." };
  }

  if (!user.passwordHash) {
    return {
      error: "This account signs in with Google. Use the “Continue with Google” button below.",
    };
  }

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) {
    return { error: "No account found with that email and password." };
  }

  await createSession({ userId: user.id, email: user.email, fullName: user.fullName });
  redirect("/overview");
}

export async function logoutAction(): Promise<void> {
  await deleteSession();
  redirect("/login");
}

export interface ForgotPasswordState {
  step: "request" | "reset" | "done";
  email?: string;
  error?: string;
  fieldErrors?: Record<string, string>;
}

export async function checkEmailAction(
  prevState: ForgotPasswordState,
  formData: FormData
): Promise<ForgotPasswordState> {
  const parsed = EmailOnlySchema.safeParse({ email: formData.get("email") });

  if (!parsed.success) {
    return {
      step: "request",
      error: parsed.error.issues[0]?.message ?? "Enter a valid email address.",
    };
  }

  const user = await findUserByEmail(parsed.data.email);
  if (!user) {
    return {
      step: "request",
      error: "No account found with that email address.",
    };
  }

  return { step: "reset", email: user.email };
}

export async function resetPasswordAction(
  prevState: ForgotPasswordState,
  formData: FormData
): Promise<ForgotPasswordState> {
  const email = (formData.get("email") as string) ?? prevState.email ?? "";

  const parsed = ResetPasswordSchema.safeParse({
    email,
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0]?.toString() ?? "form";
      if (!fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return { step: "reset", email, fieldErrors };
  }

  const passwordHash = await hashPassword(parsed.data.password);
  const updated = await updateUserPassword(parsed.data.email, passwordHash);

  if (!updated) {
    return { step: "request", error: "No account found with that email address." };
  }

  return { step: "done", email: parsed.data.email };
}
