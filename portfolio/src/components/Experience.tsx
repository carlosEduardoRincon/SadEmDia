import { motion } from 'framer-motion';
import { experience } from '../data';

export default function Experience() {
  return (
    <div className="experience">
      <h2 className="section-title">Trajetória Profissional</h2>
      <p className="experience__intro">
        Experiência em instituições financeiras e empresas de tecnologia.
      </p>

      <div className="experience__timeline">
        {experience.map((exp, i) => (
          <motion.article
            key={exp.company + exp.period}
            className="experience__item glass-card"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: i * 0.1 }}
          >
            <div className="experience__marker" />
            <div className="experience__content">
              <div className="experience__header">
                <h3 className="experience__role">{exp.role}</h3>
                <span className="experience__duration">{exp.duration}</span>
              </div>
              <a
                href={exp.companyUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="experience__company"
              >
                {exp.company}
              </a>
              <span className="experience__period">{exp.period}</span>
              <p className="experience__description">{exp.description}</p>
              {exp.highlights && (
                <ul className="experience__highlights">
                  {exp.highlights.map((h, j) => (
                    <li key={j}>{h}</li>
                  ))}
                </ul>
              )}
            </div>
          </motion.article>
        ))}
      </div>

      <motion.a
        href="https://www.linkedin.com/in/carloseduardorincon/"
        target="_blank"
        rel="noopener noreferrer"
        className="experience__linkedin"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        Ver perfil completo no LinkedIn →
      </motion.a>
    </div>
  );
}
