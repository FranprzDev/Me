import { Hero, Experience, Projects, Contact } from "@/components/Sections";
import { StarAura } from "@/components/StarAura";
import { BigBangIntro } from "@/components/BigBangIntro";

export default function Home() {
  return (
    <main className="content-layer">
      <StarAura />
      <BigBangIntro />
      <Hero />
      <Experience />
      <Projects />
      <Contact />
    </main>
  );
}
