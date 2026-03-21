import { motion } from 'framer-motion';
import { skills } from '../data';

export default function Skills() {
  return (
    <div className="skills">
      <h2 className="section-title">Habilidades</h2>
      <p className="skills__intro">
        Tecnologias e ferramentas que utilizo no dia a dia.
      </p>

      <motion.div
        className="skills__list"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
      >
        {skills.map((skill, i) => (
          <motion.span
            key={skill}
            className="skills__chip glass-card"
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.3, delay: i * 0.03 }}
            whileHover={{ scale: 1.05, borderColor: 'rgba(0, 212, 255, 0.4)' }}
          >
            {skill}
          </motion.span>
        ))}
      </motion.div>
    </div>
  );
}
