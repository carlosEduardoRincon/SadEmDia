import { motion } from 'framer-motion';
import { profile, certifications } from '../data';

export default function About() {
  return (
    <div className="about">
      <h2 className="section-title">Sobre</h2>

      <div className="about__grid">
        <motion.div
          className="about__card glass-card"
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <h3 className="about__card-title">Quem sou</h3>
          <p className="about__text">{profile.bio}</p>
          <p className="about__text">
            Formado em Ciência da Computação pelo IFSP, atualmente cursando pós-graduação na FIAP. 
            Mais de 4 anos de experiência em desenvolvimento de software, com foco em sistemas 
            bancários, APIs REST e arquitetura de microserviços.
          </p>
          <div className="about__meta">
            <span>📍 {profile.location}</span>
            <span>🗣️ Inglês B2 (Cambridge)</span>
          </div>
        </motion.div>

        <motion.div
          className="about__card glass-card"
          initial={{ opacity: 0, x: 20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <h3 className="about__card-title">Certificações</h3>
          <ul className="about__certs">
            {certifications.slice(0, 6).map((cert, i) => (
              <li key={i}>
                <span className="about__cert-name">{cert.name}</span>
                <span className="about__cert-issuer">{cert.issuer}</span>
                {cert.url && (
                  <a href={cert.url} target="_blank" rel="noopener noreferrer" className="about__cert-link">
                    Ver →
                  </a>
                )}
              </li>
            ))}
          </ul>
        </motion.div>
      </div>
    </div>
  );
}
