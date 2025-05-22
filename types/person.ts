import { Person, defaultPerson as simulatorDefaultPerson } from './simulator-interfaces';

// Re-export the Person interface
export type { Person };

// Re-export the defaultPerson with an optional override for any project-specific defaults
export const defaultPerson: Person = {
  ...simulatorDefaultPerson
};
