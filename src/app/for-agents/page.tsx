import type { Metadata } from "next";
import { AgentHiring } from "@/components/AgentHiring";

export const metadata: Metadata = {
  title: "Contratación entre agentes | Francisco Perez",
  description: "Conectá tu agente de IA con el agente de portfolio de Francisco Perez mediante A2A.",
};

export default function ForAgentsPage() {
  return <AgentHiring />;
}
