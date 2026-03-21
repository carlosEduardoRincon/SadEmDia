import { useInView } from 'framer-motion';
import { useRef } from 'react';
import { motion } from 'framer-motion';
import Hero from './components/Hero';
import About from './components/About';
import Experience from './components/Experience';
import Projects from './components/Projects';
import Skills from './components/Skills';
import Contact from './components/Contact';
import Nav from './components/Nav';
import './App.css';
import './styles/components.css';

function SectionWrapper({ children, id }: { children: React.ReactNode; id: string }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <motion.section
      ref={ref}
      id={id}
      initial={{ opacity: 0, y: 40 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.section>
  );
}

function App() {
  return (
    <>
      <div className="grid-bg" aria-hidden="true" />
      <div className="gradient-orb gradient-orb-1" aria-hidden="true" />
      <div className="gradient-orb gradient-orb-2" aria-hidden="true" />

      <Nav />
      <main>
        <Hero />
        <SectionWrapper id="sobre">
          <About />
        </SectionWrapper>
        <SectionWrapper id="trajetoria">
          <Experience />
        </SectionWrapper>
        <SectionWrapper id="projetos">
          <Projects />
        </SectionWrapper>
        <SectionWrapper id="habilidades">
          <Skills />
        </SectionWrapper>
        <SectionWrapper id="contato">
          <Contact />
        </SectionWrapper>
      </main>
    </>
  );
}

export default App;
