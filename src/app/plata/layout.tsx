import type { Metadata } from "next";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

export default function PaymentLayout({ children }: LayoutProps<"/plata">) {
  return <div className="container-g max-w-2xl py-20 md:py-28">{children}</div>;
}
