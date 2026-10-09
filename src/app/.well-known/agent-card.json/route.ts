import { NextResponse } from "next/server";

export function GET(request: Request) {
  const endpoint = new URL("/api/agent", request.url).toString();
  return NextResponse.json({
    protocolVersion: "0.3.0",
    name: "Francisco Perez Portfolio Agent",
    description: "Comparte información pública y verificada sobre Francisco Perez para evaluar oportunidades profesionales.",
    url: endpoint,
    preferredTransport: "JSONRPC",
    version: "1.0.0",
    capabilities: { streaming: false },
    defaultInputModes: ["text/plain"],
    defaultOutputModes: ["text/plain"],
    skills: [{
      id: "hiring-profile",
      name: "Hiring profile",
      description: "Responde consultas de contratación con información del portfolio, experiencia, proyectos y reconocimientos.",
      tags: ["hiring", "software development", "AI engineering", "Tucumán"],
      examples: ["¿Qué experiencia tiene Francisco con agentes de IA?", "¿Por qué sería buen candidato para un puesto de AI Engineer en Tucumán?"],
      inputModes: ["text/plain"],
      outputModes: ["text/plain"],
    }],
  });
}
