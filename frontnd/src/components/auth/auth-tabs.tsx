import Link from "next/link";
import { cn } from "@/lib/utils";

export function AuthTabs({ active }: { active: "signin" | "signup" }) {
  return (
    <div className="grid grid-cols-2 gap-1 rounded-lg bg-secondary p-1 text-sm font-medium">
      <Link
        href="/login"
        className={cn(
          "rounded-md py-2 text-center transition-colors",
          active === "signin"
            ? "bg-card text-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        Sign in
      </Link>
      <Link
        href="/signup"
        className={cn(
          "rounded-md py-2 text-center transition-colors",
          active === "signup"
            ? "bg-card text-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        Sign up
      </Link>
    </div>
  );
}
