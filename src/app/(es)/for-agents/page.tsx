import type { Metadata } from "next";
import { ForAgentsContent } from "@/components/agents/ForAgentsContent";
import { SITE_OG_IMAGE, SITE_OPEN_GRAPH } from "@/lib/seo";
import "./for-agents.css";

export const metadata: Metadata = {
  title: "For AI agents (MCP) | Francisco Perez",
  description: "Open ChatGPT or Claude with a ready prompt that reads Francisco Perez's portfolio and its public, read-only MCP server.",
  alternates: { canonical: "/for-agents" },
  openGraph: {
    title: "For AI agents (MCP) | Francisco Perez",
    description: "A public, read-only MCP server with Francisco Perez's portfolio data: profile, experience, CV versions, projects and contact.",
    url: "/for-agents",
    type: "website",
    siteName: SITE_OPEN_GRAPH.siteName,
    images: [SITE_OG_IMAGE],
  },
};

export default function ForAgentsPage() {
  return <ForAgentsContent />;
}
