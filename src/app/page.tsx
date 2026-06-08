import {
  Hero,
  About,
  Experience,
  Education,
  Projects,
  Contact,
  Footer,
} from "@/components/Sections";

export default function Home() {
  return (
    <main className="content-layer">
      <Hero />
      <About />
      <Experience />
      <Education />
      <Projects />
      <Contact />
      <Footer />
    </main>
  );
}
