import {
  Hero,
  Experience,
  Education,
  Projects,
  Contact,
} from "@/components/Sections";
import { StarAura } from "@/components/StarAura";

export default function Home() {
  return (
    <main className="content-layer">
      <StarAura />
      <Hero />
      <Experience />
      <Education />
      <Projects />
      <Contact />
    </main>
  );
}
