import { motion } from 'framer-motion';
import { profile } from '../data';

export default function Hero() {
  return (
    <section id="inicio" className="hero">
      <div className="hero__content">
        <motion.div
          className="hero__badge"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <span className="hero__status" />
          Disponível para novos desafios
        </motion.div>

        <motion.h1
          className="hero__title"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          <span className="hero__greeting">Olá, sou</span>
          <span className="hero__name">{profile.name}</span>
          <span className="hero__role">{profile.title}</span>
        </motion.h1>

        <motion.p
          className="hero__subtitle"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          {profile.subtitle}
        </motion.p>

        <motion.p
          className="hero__bio"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          {profile.bio.slice(0, 180)}...
        </motion.p>

        <motion.div
          className="hero__ctas"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <a href={profile.linkedin} target="_blank" rel="noopener noreferrer" className="hero__btn hero__btn--primary">
            LinkedIn
          </a>
          <a href={profile.github} target="_blank" rel="noopener noreferrer" className="hero__btn hero__btn--outline">
            GitHub
          </a>
        </motion.div>

        <motion.div
          className="hero__scroll"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
        >
          <div className="hero__scroll-line" />
          <span>Scroll</span>
        </motion.div>
      </div>

      <motion.div
        className="hero__avatar-wrapper"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, delay: 0.3 }}
      >
        <div className="hero__avatar-glow" />
        <img
          src={profile.avatar}
          alt={profile.name}
          className="hero__avatar"
        />
        <div className="hero__avatar-ring" />
      </motion.div>
    </section>
  );
}
