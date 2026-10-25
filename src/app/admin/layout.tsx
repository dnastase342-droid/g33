import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Administrare",
  robots: { index: false, follow: false, nocache: true },
};

export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return <div className="container-g py-12 md:py-16">{children}</div>;
}
