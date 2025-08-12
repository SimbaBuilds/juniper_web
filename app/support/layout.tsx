import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Support",
  description: "Juniper Support - Get help with troubleshooting, FAQs, and technical support for our AI-powered mobile assistant and integration services.",
};

export default function SupportLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
