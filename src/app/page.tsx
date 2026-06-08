"use client";

import dynamic from "next/dynamic";
import { Nav } from "@/components/Nav";
import {
  Hero,
  About,
  Experience,
  Education,
  Projects,
  Contact,
  Footer,
} from "@/components/Sections";
import { NotesMCP } from "@/components/NotesMCP";

// La escena 3D es client-only (WebGL); se carga sin SSR.
const Scene = dynamic(() => import("@/components/three/Scene"), { ssr: false });

export default function Home() {
  return (
    <>
      <Scene />
      <Nav />
      <main className="content-layer">
        <Hero />
        <About />
        <Experience />
        <Education />
        <NotesMCP />
        <Projects />
        <Contact />
        <Footer />
      </main>
    </>
  );
}
