export interface Experience {
  company: string;
  role: string;
  period: string;
  duration: string;
  description: string;
  companyUrl?: string;
  highlights?: string[];
}

export interface Project {
  name: string;
  description: string;
  url: string;
  language: string;
  stack?: string[];
}

export interface Certification {
  name: string;
  issuer: string;
  date: string;
  url?: string;
}

export const profile = {
  name: "Carlos Eduardo Rincon",
  title: "Software Engineer",
  subtitle: "Analista de Sistemas Pleno @ Bradesco",
  bio: "Como engenheiro de software em um dos maiores bancos do Brasil, minhas principais responsabilidades envolvem desenvolvimento e otimização de sistemas backend. Busco diariamente soluções inovadoras e eficientes, guiado pela citação de Max Weber: 'O homem não teria alcançado o possível se repetidamente não tivesse buscado o impossível.'",
  avatar: "https://avatars.githubusercontent.com/u/85880891?v=4",
  location: "São Paulo, Brasil",
  linkedin: "https://www.linkedin.com/in/carloseduardorincon/",
  github: "https://github.com/carlosEduardoRincon",
  email: "carloscaca147@gmail.com",
  hackerrank: "https://www.hackerrank.com/profile/carlos_rincon",
};

export const experience: Experience[] = [
  {
    company: "Bradesco",
    role: "Analista de Sistemas Pleno",
    period: "Set 2025 — Presente",
    duration: "5 meses",
    companyUrl: "https://www.linkedin.com/company/bradesco/life",
    description: "Trabalho no produto Post-Sales dentro da Tribe de Reconciliação de Crédito. Desenvolvo novas funcionalidades, otimizo processos e implemento melhorias que elevam a eficiência e qualidade do projeto.",
    highlights: [
      "Desenvolvimento do sistema Post-Sales",
      "Implementação de novas funcionalidades",
      "Otimização de módulos existentes",
    ],
  },
  {
    company: "F1RST Digital Services",
    role: "Desenvolvedor de TI II",
    period: "Fev 2025 — Set 2025",
    duration: "7 meses",
    companyUrl: "https://www.linkedin.com/company/santander-tecnologia-brasil",
    description: "Desenvolvedor backend pleno no projeto de PIX automático, utilizando Spring Boot e Spring Batch.",
    highlights: [
      "Projeto PIX — desenvolvimento de funcionalidades",
      "Resolução de bugs e code smells",
      "Manutenção de cobertura de testes",
    ],
  },
  {
    company: "GFT Technologies",
    role: "Desenvolvedor Backend Pleno (L3)",
    period: "Out 2024 — Fev 2025",
    duration: "4 meses",
    companyUrl: "https://www.linkedin.com/company/gft-technologies",
    description: "Contribuição para um dos maiores bancos da Eurozona. Desenvolvimento de funcionalidades, otimização e manutenção do projeto PIX.",
  },
  {
    company: "Open Labs SA",
    role: "Analista de Sistemas",
    period: "Abr 2022 — Out 2024",
    duration: "2 anos e 6 meses",
    companyUrl: "https://www.linkedin.com/company/openlabssa",
    description: "Desenvolvedor de software com experiência em aplicações web escaláveis. Projetos: SIGO (APIs Java, PL/SQL, Jenkins, Flyway), OiPlay (streaming, MongoDB), migração de monólito para microserviços, projeto Node.js para migração de fibra óptica em AWS.",
    highlights: [
      "SIGO — APIs Java e Oracle",
      "OiPlay — streaming e MongoDB",
      "Arquitetura de microserviços",
      "Node.js e AWS para ISP",
    ],
  },
  {
    company: "Open Labs SA",
    role: "Estagiário em Desenvolvimento Java",
    period: "Ago 2021 — Abr 2022",
    duration: "8 meses",
    companyUrl: "https://www.linkedin.com/company/openlabssa",
    description: "Início da carreira como desenvolvedor Java.",
  },
];

export const projects: Project[] = [
  {
    name: "SadEmDia",
    description: "Aplicativo mobile Android com React Native (Expo) e Firebase para gerenciar pacientes em programa de saúde, com priorização inteligente e marcação de visitas.",
    url: "https://github.com/carlosEduardoRincon/SadEmDia",
    language: "TypeScript",
    stack: ["React Native", "Expo", "Firebase", "Firestore"],
  },
  {
    name: "NimbusFeedback",
    description: "Software para gestão de feedbacks de aulas.",
    url: "https://github.com/carlosEduardoRincon/NimbusFeedback",
    language: "Java",
  },
  {
    name: "CareHub",
    description: "Plataforma de cuidado e gestão de saúde.",
    url: "https://github.com/carlosEduardoRincon/CareHub",
    language: "Java",
  },
  {
    name: "Clone TabNews",
    description: "Implementação do TabNews para aprimorar conceitos de programação.",
    url: "https://github.com/carlosEduardoRincon/clone-tabnews",
    language: "JavaScript",
    stack: ["JavaScript", "Vercel"],
  },
  {
    name: "Design Patterns Java",
    description: "Projeto para treinar conceitos dos design patterns em Java.",
    url: "https://github.com/carlosEduardoRincon/design-patterns-java",
    language: "Java",
  },
  {
    name: "Spring Tutor",
    description: "Explicador de Código Java — ferramenta educacional.",
    url: "https://github.com/carlosEduardoRincon/spring-tutor",
    language: "Java",
  },
  {
    name: "Chefia",
    description: "Tech Challenge — Software para gestão de restaurantes.",
    url: "https://github.com/carlosEduardoRincon/chefia",
    language: "Java",
  },
  {
    name: "TaskHub",
    description: "App Android para gerenciamento de tarefas diárias com CRUD completo.",
    url: "https://github.com/carlosEduardoRincon/TaskHub",
    language: "Java",
  },
  {
    name: "Autoloca",
    description: "Aplicativo para alocação de produtos.",
    url: "https://github.com/carlosEduardoRincon/autoloca",
    language: "Java",
  },
];

export const certifications: Certification[] = [
  { name: "Java (Basic)", issuer: "HackerRank", date: "Mar 2024", url: "https://hackerrank.com/certificates/d38686083d01" },
  { name: "Spring Boot 3: API Rest", issuer: "Alura", date: "Mar 2024" },
  { name: "SQL Basic & Intermediate", issuer: "HackerRank", date: "Mar 2024" },
  { name: "Keras: Redes Neurais", issuer: "Alura", date: "Mar 2024" },
  { name: "Java Completo POO", issuer: "Udemy", date: "Jul 2022" },
  { name: "Linux LPI Essentials", issuer: "Alura", date: "Set 2021" },
  { name: "JAX-RS e Jersey", issuer: "Alura", date: "Ago 2021" },
  { name: "JPA/Hibernate", issuer: "Alura", date: "Ago 2021" },
];

export const skills = [
  "Java",
  "Spring Boot",
  "Spring Batch",
  "APIs REST",
  "SQL",
  "Oracle",
  "MongoDB",
  "Microserviços",
  "AWS",
  "Node.js",
  "React Native",
  "TypeScript",
];
