import type { Metadata } from "next";
import { AgentHiring } from "@/components/AgentHiring";

export const metadata: Metadata = {
  title: "For Recruiters | Francisco Perez",
  description: "Compare a job description with Francisco Perez's portfolio using local, evidence-based search.",
};

export default function ForRecruitersPage() {
  return <AgentHiring />;
}
