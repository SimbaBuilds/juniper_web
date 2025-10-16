export const RESOURCE_TYPES = [
  { value: 'memory', label: 'Memories' },
  { value: 'sample', label: 'Samples' },
  { value: 'reference', label: 'Reference' },
  { value: 'note', label: 'Notes' }
] as const;

export type ResourceType = typeof RESOURCE_TYPES[number]['value'];

export interface Resource {
  id: string;
  user_id: string;
  title: string;
  content: string;
  instructions?: string;
  type: ResourceType;
  relevance_score: number;
  decay_factor: number;
  auto_committed: boolean;
  tags: string[];
  last_accessed: Date;
  created_at: Date;
  updated_at: Date;
}

export interface Tag {
  id: string;
  name: string;
  category: 'general' | 'service' | 'service_type' | 'user_created';
}

export const PREDEFINED_TAGS = [
  'Important',
  'Work',
  'Personal',
  'Project',
  'Meeting',
  'Ideas',
  'Todo',
  'Research',
  'Documentation',
  'Archive'
];

export const MAX_RESOURCE_TAGS = 4;
export const MAX_CONTENT_LENGTH = 2000;
export const MAX_INSTRUCTIONS_LENGTH = 200;