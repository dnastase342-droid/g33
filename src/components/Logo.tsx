import Image from "next/image";
import { brand } from "@/config/site";

export function Logo({ size = 40, withWordmark = true }: { size?: number; withWordmark?: boolean }) {
  return (
    <span className="inline-flex items-center gap-3">
      <Image
        src="/images/logo-g33.png"
        alt=""
        width={size}
        height={size}
        priority
        data-logo-mark
        className="shrink-0 will-change-transform"
      />
      {withWordmark && (
        <span className="flex flex-col leading-none">
          <span className="font-display text-[0.95rem] font-extrabold tracking-[0.14em]">{brand.name}</span>
          <span className="mt-1 text-[0.62rem] font-medium uppercase tracking-[0.3em] text-subtle">Comunitate privată</span>
        </span>
      )}
      <span className="sr-only">{brand.name}</span>
    </span>
  );
}
