export const SERVICES = [
  { name: 'Notion', public: true },
  { name: 'Slack', public: true }, 
  { name: 'Dropbox', public: true },
  { name: 'Todoist', public: true },
  { name: 'Perplexity', public: true },
  { name: 'Google Sheets', public: true },
  { name: 'Google Docs', public: true },
  { name: 'Gmail', public: true },
  { name: 'Google Calendar', public: true },
  { name: 'Microsoft Excel Online', public: true },
  { name: 'Microsoft Word Online', public: true },
  { name: 'Microsoft Calendar', public: true },
  { name: 'Microsoft Email', public: true },
  { name: 'Microsoft Teams', public: true },
  { name: 'Textbelt', public: false },
  { name: 'Twilio', public: false },
  { name: 'Google Meet', public: true },
  { name: 'Twitter/X', public: true }
] as const;

export const SERVICE_CATEGORIES = {
  'Communications': ['Slack', 'Microsoft Teams', 'Twilio', 'Textbelt'],
  'Productivity and Task Management': ['Notion', 'Todoist'],
  'Calendar': ['Google Calendar', 'Microsoft Calendar'],
  'Email': ['Gmail', 'Microsoft Email'],
  'Video Conferencing': ['Google Meet'],
  'Research': ['Perplexity', 'Twitter/X'],
  'Cloud Storage': ['Dropbox'],
  'Cloud Text Documents': ['Google Docs', 'Microsoft Word Online'],
  'Cloud Spreadsheets': ['Google Sheets', 'Microsoft Excel Online']
} as const;

export type ServiceName = typeof SERVICES[number]['name'];
export type ServiceCategory = keyof typeof SERVICE_CATEGORIES;

export interface IntegrationStatus {
  name: ServiceName;
  status: 'connected' | 'pending_setup' | 'disconnected';
  lastConnected?: string;
  category: ServiceCategory;
  description: string;
  isSystemIntegration?: boolean;
  public?: boolean;
}

// Helper function to get public services
export const getPublicServices = () => SERVICES.filter(service => service.public);