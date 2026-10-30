import type { Metadata, Viewport } from "next";
import "../globals.css";
import { RootShell, rootMetadata, rootViewport } from "@/components/RootShell";

export const metadata: Metadata = rootMetadata;
export const viewport: Viewport = rootViewport;

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <RootShell lang="es">{children}</RootShell>;
}
