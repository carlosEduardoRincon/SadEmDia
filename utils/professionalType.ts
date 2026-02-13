import { ProfessionalType } from '../types';

export const PROFESSIONAL_TYPE_OPTIONS: ProfessionalType[] = [
  'Médico',
  'Fisioterapeuta',
  'Fonoaudiólogo',
  'Enfermeiro',
  'Tecnico Enfermagem',
];

const LABELS: Record<ProfessionalType, string> = {
  Medico: 'Médico',
  Fisioterapeuta: 'Fisioterapeuta',
  Fonoaudiólogo: 'Fonoaudiólogo',
  Enfermeiro: 'Enfermeiro',
  Tecnico Enfermagem: 'Técnico Enfermagem'
};

export function getProfessionalTypeLabel(type: ProfessionalType): string {
  return LABELS[type] ?? type;
}
