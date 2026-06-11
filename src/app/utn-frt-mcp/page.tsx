import type { Metadata } from "next";
import Link from "next/link";
import { CV } from "@/data/cv";
import { NotesMCP } from "@/components/NotesMCP";

export const metadata: Metadata = {
  title: "UTN-FRT-MCP — Apuntes de la UTN-FRT en tu CLI",
  description:
    "Servidor MCP que expone los apuntes de Ingeniería en Sistemas (UTN-FRT) a cualquier cliente por HTTP: listá materias, leé apuntes y hacé búsqueda full-text desde tu terminal.",
  openGraph: {
    title: "UTN-FRT-MCP — Apuntes de la UTN-FRT en tu CLI",
    description:
      "Conectá los apuntes de la UTN-FRT a Claude Code, Cursor o cualquier cliente MCP por HTTP.",
    type: "website",
  },
};

export default function UtnFrtMcpPage() {
  return (
    <main className="content-layer">
      <div className="wrap" style={{ paddingTop: "6rem" }}>
        <Link
          href="/"
          className="link-underline"
          style={{ color: "var(--muted)", fontSize: "0.85rem", fontFamily: "var(--font-geist-mono)" }}
        >
          ← Volver al inicio
        </Link>
      </div>
      <NotesMCP />
      <footer className="content-layer" style={{ padding: "2.5rem 1.5rem", textAlign: "center" }}>
        <div className="divider" style={{ maxWidth: 600, margin: "0 auto 1.5rem" }} />
        <p style={{ color: "var(--muted)", fontSize: "0.85rem", margin: 0 }}>
          © {new Date().getFullYear()} {CV.name}
        </p>
      </footer>
    </main>
  );
}
