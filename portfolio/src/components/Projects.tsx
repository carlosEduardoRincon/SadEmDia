import { motion } from 'framer-motion';
import { projects } from '../data';

const languageColors: Record<string, string> = {
  TypeScript: '#3178c6',
  JavaScript: '#f7df1e',
  Java: '#ed8b00',
  Python: '#3776ab',
  CSS: '#264de4',
  'C++': '#00599c',
};

export default function Projects() {
  return (
    <div className="projects">
      <h2 className="section-title">Projetos</h2>
      <p className="projects__intro">
        Repositórios públicos no GitHub. Destaque para aplicações mobile, APIs e desafios técnicos.
      </p>

      <div className="projects__grid">
        {projects.map((project, i) => (
          <motion.a
            key={project.name}
            href={project.url}
            target="_blank"
            rel="noopener noreferrer"
            className="projects__card glass-card"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: i * 0.05 }}
            whileHover={{ y: -4 }}
          >
            <div className="projects__card-header">
              <h3 className="projects__name">{project.name}</h3>
              <span
                className="projects__lang"
                style={{ '--lang-color': languageColors[project.language] || '#888' } as React.CSSProperties}
              >
                {project.language}
              </span>
            </div>
            <p className="projects__description">{project.description}</p>
            {project.stack && (
              <div className="projects__stack">
                {project.stack.map((s) => (
                  <span key={s} className="projects__tag">{s}</span>
                ))}
              </div>
            )}
            <span className="projects__link">Abrir no GitHub →</span>
          </motion.a>
        ))}
      </div>

      <motion.a
        href="https://github.com/carlosEduardoRincon"
        target="_blank"
        rel="noopener noreferrer"
        className="projects__github"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        Ver todos os repositórios no GitHub →
      </motion.a>
    </div>
  );
}
