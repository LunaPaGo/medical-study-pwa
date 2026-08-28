import { mockClinicalApproach } from './clinicalApproachMock';
import type { ClinicalApproach } from './clinicalApproachTypes';

const approaches = new Map<string, ClinicalApproach>([[mockClinicalApproach.id, mockClinicalApproach]]);

export function listMemoryApproaches() { return Array.from(approaches.values()).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)); }
export function getMemoryApproach(id: string) { return approaches.get(id); }
export function saveMemoryApproach(approach: ClinicalApproach) { approaches.set(approach.id, approach); return approach; }
