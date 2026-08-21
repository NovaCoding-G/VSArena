import Image from "next/image";
import { cn } from "@/lib/utils";

interface BrandMarkProps {
  className?: string;
  /** Intrinsic pixel size hint for next/image. */
  width?: number;
  height?: number;
  priority?: boolean;
  decorative?: boolean;
}

/**
 * Official VS lockup (cyan V + orange S) on a transparent field.
 *
 * @example <BrandMark className="h-10 w-auto" />
 */
export function BrandMark({
  className,
  width = 280,
  height = 200,
  priority = false,
  decorative = false,
}: BrandMarkProps) {
  return (
    <Image
      src="/brand/vs-arena-mark.png"
      alt={decorative ? "" : "VS Arena"}
      width={width}
      height={height}
      priority={priority}
      unoptimized
      className={cn("bg-transparent object-contain object-center mix-blend-screen", className)}
    />
  );
}
