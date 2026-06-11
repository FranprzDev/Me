import {
  Hero,
  Experience,
  Education,
  Projects,
  Contact,
} from "@/components/Sections";

export default function Home() {
  return (
    <main className="content-layer">
      <Hero />
      <Experience />
      <Education />
      <Projects />
      <Contact />
    </main>
  );
}
