import type { Metadata } from "next";
import { legal } from "./site";

/** Legal drafts are not indexed until they have been legally reviewed. */
export function legalMetadata(title: string, description: string, path: string): Metadata {
  return {
    title,
    description,
    alternates: { canonical: path },
    robots: legal.reviewed ? undefined : { index: false, follow: true },
  };
}
