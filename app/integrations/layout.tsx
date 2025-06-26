import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Integrations",
  description: "Explore and connect with 18+ integrations available for Mobile Jarvis, including Notion, Slack, Google Workspace, Microsoft Office, and more.",
};

export default function IntegrationsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
} 