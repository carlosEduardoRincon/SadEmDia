
export const PROFESSIONAL_TYPES = [
  'Medico',
  'Fisioterapeuta',
  'Fonoaudiólogo',
  'Enfermeiro',
  'Psicologo',
  'AssistenteSocial',
  'TecnicoEnfermagem'
] as const;

export type ProfessionalType = (typeof PROFESSIONAL_TYPES)[number];

export const PROFESSIONAL_TYPE_OPTIONS: ProfessionalType[] = [...PROFESSIONAL_TYPES];

const LABELS: Record<ProfessionalType, string> = {
  Medico: 'Médico',
  Fisioterapeuta: 'Fisioterapeuta',
  Fonoaudiólogo: 'Fonoaudiólogo',
  Enfermeiro: 'Enfermeiro',
  Psicologo: 'Psicólogo',
  AssistenteSocial: 'Assistente Social',
  TecnicoEnfermagem: 'Técnico de Enfermagem',
};

export function getProfessionalTypeLabel(type: ProfessionalType): string {
  return LABELS[type] ?? type;
}
