import { Hero, Experience, Projects, Contact } from "@/components/Sections";
import { StarAura } from "@/components/StarAura";

export default function Home() {
  return (
    <main className="content-layer">
      <StarAura />
      <Hero />
      <Experience />
      <Projects />
      <Contact />
    </main>
  );
}
