import Link from "next/link";
import { Logo } from "@/components/Logo";
import { applyHref, mainNav } from "@/config/navigation";
import { MobileMenu } from "./MobileMenu";
import { HeaderShell } from "./HeaderShell";
import { LogoLink } from "./LogoLink";

export function Header() {
  const nav = mainNav();
  return (
    <HeaderShell>
      <div className="container-g flex h-[var(--header-h)] items-center justify-between gap-6">
        <LogoLink label="GRUPAREA 33 — pagina principală">
          <Logo size={38} />
        </LogoLink>

        <nav aria-label="Navigație principală" className="hidden md:block">
          <ul className="flex items-center gap-8 text-sm text-muted">
            {nav.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="transition-colors hover:text-fg">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex items-center gap-3">
          <Link href={applyHref} className="btn btn-primary hidden !min-h-10 !px-5 !py-2 text-sm sm:inline-flex">
            Aplică pentru G33
          </Link>
          <MobileMenu items={nav} />
        </div>
      </div>
    </HeaderShell>
  );
}
