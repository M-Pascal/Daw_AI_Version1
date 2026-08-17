import Image from "next/image";
import { cn } from "@/lib/utils";
import logoImage from "../../public/logo.png";

export function Logo({
  className,
  size = 40,
}: {
  className?: string;
  size?: number;
}) {
  return (
    <span className={cn("inline-flex items-center", className)}>
      <Image
        src={logoImage}
        alt="DawAI"
        width={size}
        height={size}
        className="rounded-lg"
        priority
      />
    </span>
  );
}
