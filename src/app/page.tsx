import { Hero, Experience, Projects, Contact } from "@/components/Sections";
import { StarAura } from "@/components/StarAura";

export default function Home() {
  return (
    <main id="main-content" className="content-layer" tabIndex={-1}>
      <StarAura />
      <Hero />
      <Experience />
      <Projects />
      <Contact />
    </main>
  );
}
