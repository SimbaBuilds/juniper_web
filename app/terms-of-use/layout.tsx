import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Use",
  description: "Juniper Terms of Use - Learn about the terms and conditions for using our AI-powered mobile assistant and integration services.",
};

export default function TermsOfUseLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
} 