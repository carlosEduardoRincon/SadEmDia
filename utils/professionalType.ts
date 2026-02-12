import { ProfessionalType } from '../types';

export const PROFESSIONAL_TYPE_OPTIONS: ProfessionalType[] = [
  'Médico',
  'Fisioterapeuta',
  'Fonoaudiólogo',
  'Enfermeiro',
];

const LABELS: Record<ProfessionalType, string> = {
  Medico: 'Médico',
  Fisioterapeuta: 'Fisioterapeuta',
  Fonoaudiólogo: 'Fonoaudiólogo',
  Enfermeiro: 'Enfermeiro',
};

export function getProfessionalTypeLabel(type: ProfessionalType): string {
  return LABELS[type] ?? type;
}
