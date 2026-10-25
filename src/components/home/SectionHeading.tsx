import type { ReactNode } from "react";

export function SectionHeading({
  id,
  eyebrow,
  title,
  intro,
  align = "left",
}: {
  id: string;
  eyebrow: string;
  title: ReactNode;
  intro?: ReactNode;
  align?: "left" | "center";
}) {
  const center = align === "center";
  return (
    <div className={center ? "mx-auto max-w-3xl text-center" : "max-w-3xl"}>
      <p className={`eyebrow ${center ? "justify-center" : ""}`}>{eyebrow}</p>
      <h2 id={id} className="h-section mt-5">
        {title}
      </h2>
      {intro && <p className="lead mt-5">{intro}</p>}
    </div>
  );
}
