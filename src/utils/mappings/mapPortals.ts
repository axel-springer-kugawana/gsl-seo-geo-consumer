import { ClassifiedManagementStructure } from '@models'

// eslint-disable-next-line no-confusing-arrow
export const mapPortals = (validations: ClassifiedManagementStructure['visibility']['validations'] = []): string[] =>
  validations.map(({ portal }) => portal)
