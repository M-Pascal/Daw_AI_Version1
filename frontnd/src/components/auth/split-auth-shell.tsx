import Link from "next/link";
import type { ReactNode } from "react";
import { Logo } from "@/components/logo";
import { AuthTabs } from "@/components/auth/auth-tabs";

export function SplitAuthShell({
  headline,
  description,
  title,
  subtitle,
  activeTab,
  children,
  footer,
}: {
  headline: string;
  description: string;
  title: string;
  subtitle: string;
  activeTab: "signin" | "signup";
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="grid min-h-full flex-1 lg:grid-cols-2">
      {/* Marketing panel */}
      <div className="relative hidden overflow-hidden bg-gradient-to-br from-primary to-primary-glow p-10 text-primary-foreground lg:flex lg:flex-col">
        <Link href="/" className="absolute left-10 top-10">
          <Logo size={48} className="drop-shadow-[0_0_14px_rgba(255,255,255,0.65)]" />
        </Link>
        <div className="flex h-full max-w-md flex-col justify-center">
          <h2 className="text-3xl font-bold leading-tight sm:text-4xl">{headline}</h2>
          <p className="mt-4 text-base leading-relaxed text-primary-foreground/85">
            {description}
          </p>
        </div>
      </div>

      {/* Form panel */}
      <div className="flex flex-col items-center justify-center px-4 py-12 sm:px-6">
        <div className="mb-8 lg:hidden">
          <Link href="/">
            <Logo size={44} />
          </Link>
        </div>

        <div className="w-full max-w-sm">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">{title}</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">{subtitle}</p>

          <div className="mt-6">
            <AuthTabs active={activeTab} />
          </div>

          <div className="mt-6">{children}</div>

          {footer && <div className="mt-6 text-center text-sm text-muted-foreground">{footer}</div>}
        </div>
      </div>
    </div>
  );
}
