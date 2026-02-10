import { ProfessionalType } from '../types';

export const PROFESSIONAL_TYPE_OPTIONS: ProfessionalType[] = [
  'Cardiologista',
  'Fisioterapeuta',
  'Fonoaudiólogo',
];

const LABELS: Record<ProfessionalType, string> = {
  Cardiologista: 'Cardiologista',
  Fisioterapeuta: 'Fisioterapeuta',
  Fonoaudiólogo: 'Fonoaudiólogo',
};

export function getProfessionalTypeLabel(type: ProfessionalType): string {
  return LABELS[type] ?? type;
}
