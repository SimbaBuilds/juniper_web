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
  { name: 'Twitter/X', public: true },
  { name: 'Fitbit', public: true },
  { name: 'Oura', public: true }
] as const;

export const SERVICE_CATEGORIES = {
  'Health and Wellness': ['Fitbit', 'Oura'],
  'Cloud Spreadsheets': ['Google Sheets', 'Microsoft Excel Online'],
  'Search': ['Perplexity'],
  'Email': ['Gmail', 'Microsoft Email'],
  'Video Conferencing': ['Google Meet'],
  'Cloud Text Documents': ['Google Docs', 'Microsoft Word Online'],
  'Reminders': [],
  'Project Management': ['Notion'],
  'Team Collaboration': ['Slack', 'Microsoft Teams'],
  'Cloud Storage': ['Dropbox'],
  'Research': ['Twitter/X'],
  'Note-Taking': [],
  'Calendar': ['Google Calendar', 'Microsoft Calendar'],
  'SMS': ['Textbelt'],
  'AI': [],
  'Team Communication': [],
  'Text Message': ['Twilio'],
  'Task Management': ['Todoist'],
  'Task Scheduling': [],
  'Other': [] // Fallback category
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