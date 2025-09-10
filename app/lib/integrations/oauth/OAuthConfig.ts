export interface OAuthServiceConfig {
  clientId: string;
  clientSecret?: string;
  authorizationUrl: string;
  tokenUrl: string;
  scopes: string[];
  redirectUri: string;
  usePKCE?: boolean;
  useBasicAuth?: boolean;
  customHeaders?: Record<string, string>;
  additionalParams?: Record<string, string>;
}

export interface ServiceDescriptor {
  displayName: string;
  description: string;
  category: string;
  iconName?: string;
}

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

export const OAUTH_CONFIG: Record<string, OAuthServiceConfig> = {
  'oura': {
    clientId: process.env.OURA_CLIENT_ID || '',
    clientSecret: process.env.OURA_CLIENT_SECRET || '',
    authorizationUrl: 'https://cloud.ouraring.com/oauth/authorize',
    tokenUrl: 'https://api.ouraring.com/oauth/token',
    scopes: ['email', 'personal', 'daily', 'heartrate', 'workout', 'tag', 'session', 'spo2', 'stress'],
    redirectUri: `${SITE_URL}/oauth/oura/web-callback`,
    useBasicAuth: true,
  },
  'fitbit': {
    clientId: process.env.FITBIT_CLIENT_ID_WEB || '',
    clientSecret: process.env.FITBIT_CLIENT_SECRET_WEB || '',
    authorizationUrl: 'https://www.fitbit.com/oauth2/authorize',
    tokenUrl: 'https://api.fitbit.com/oauth2/token',
    scopes: ['activity', 'heartrate', 'location', 'nutrition', 'profile', 'settings', 'sleep', 'social', 'weight'],
    redirectUri: `${SITE_URL}/oauth/fitbit/web-callback`,
    useBasicAuth: true,
  },
  'google_calendar': {
    clientId: process.env.GOOGLE_CLIENT_ID || '',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    authorizationUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenUrl: 'https://oauth2.googleapis.com/token',
    scopes: ['https://www.googleapis.com/auth/calendar.events', 'https://www.googleapis.com/auth/userinfo.email'],
    redirectUri: `${SITE_URL}/oauth/google-calendar/web-callback`,
    additionalParams: {
      access_type: 'offline',
      prompt: 'consent',
    },
  },
  'gmail': {
    clientId: process.env.GOOGLE_CLIENT_ID || '',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    authorizationUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenUrl: 'https://oauth2.googleapis.com/token',
    scopes: ['https://www.googleapis.com/auth/gmail.send', 'https://www.googleapis.com/auth/gmail.modify', 'https://www.googleapis.com/auth/userinfo.email'],
    redirectUri: `${SITE_URL}/oauth/gmail/web-callback`,
    additionalParams: {
      access_type: 'offline',
      prompt: 'consent',
    },
  },
  'google_docs': {
    clientId: process.env.GOOGLE_CLIENT_ID || '',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    authorizationUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenUrl: 'https://oauth2.googleapis.com/token',
    scopes: ['https://www.googleapis.com/auth/documents', 'https://www.googleapis.com/auth/userinfo.email'],
    redirectUri: `${SITE_URL}/oauth/google-docs/web-callback`,
    additionalParams: {
      access_type: 'offline',
      prompt: 'consent',
    },
  },
  'google_sheets': {
    clientId: process.env.GOOGLE_CLIENT_ID || '',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    authorizationUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenUrl: 'https://oauth2.googleapis.com/token',
    scopes: ['https://www.googleapis.com/auth/spreadsheets', 'https://www.googleapis.com/auth/userinfo.email'],
    redirectUri: `${SITE_URL}/oauth/google-sheets/web-callback`,
    additionalParams: {
      access_type: 'offline',
      prompt: 'consent',
    },
  },
  'google_meet': {
    clientId: process.env.GOOGLE_CLIENT_ID || '',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    authorizationUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenUrl: 'https://oauth2.googleapis.com/token',
    scopes: ['https://www.googleapis.com/auth/meetings', 'https://www.googleapis.com/auth/calendar.events', 'https://www.googleapis.com/auth/userinfo.email'],
    redirectUri: `${SITE_URL}/oauth/google-meet/web-callback`,
    additionalParams: {
      access_type: 'offline',
      prompt: 'consent',
    },
  },
  'microsoft_excel': {
    clientId: process.env.MICROSOFT_CLIENT_ID || '',
    clientSecret: process.env.MICROSOFT_CLIENT_SECRET || '',
    authorizationUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
    tokenUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
    scopes: ['https://graph.microsoft.com/Files.ReadWrite.All', 'https://graph.microsoft.com/Sites.ReadWrite.All', 'offline_access'],
    redirectUri: `${SITE_URL}/oauth/microsoft-excel/web-callback`,
  },
  'microsoft_word': {
    clientId: process.env.MICROSOFT_CLIENT_ID || '',
    clientSecret: process.env.MICROSOFT_CLIENT_SECRET || '',
    authorizationUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
    tokenUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
    scopes: ['https://graph.microsoft.com/Files.ReadWrite.All', 'https://graph.microsoft.com/Sites.ReadWrite.All', 'offline_access'],
    redirectUri: `${SITE_URL}/oauth/microsoft-word/web-callback`,
  },
  'microsoft_outlook_calendar': {
    clientId: process.env.MICROSOFT_CLIENT_ID || '',
    clientSecret: process.env.MICROSOFT_CLIENT_SECRET || '',
    authorizationUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
    tokenUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
    scopes: ['https://graph.microsoft.com/Calendars.ReadWrite', 'https://graph.microsoft.com/User.Read', 'offline_access'],
    redirectUri: `${SITE_URL}/oauth/outlook-calendar/web-callback`,
  },
  'microsoft_outlook_mail': {
    clientId: process.env.MICROSOFT_CLIENT_ID || '',
    clientSecret: process.env.MICROSOFT_CLIENT_SECRET || '',
    authorizationUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
    tokenUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
    scopes: ['https://graph.microsoft.com/Mail.ReadWrite', 'https://graph.microsoft.com/Mail.Send', 'https://graph.microsoft.com/User.Read', 'offline_access'],
    redirectUri: `${SITE_URL}/oauth/outlook-mail/web-callback`,
  },
  'microsoft_teams': {
    clientId: process.env.MICROSOFT_CLIENT_ID || '',
    clientSecret: process.env.MICROSOFT_CLIENT_SECRET || '',
    authorizationUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
    tokenUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
    scopes: ['https://graph.microsoft.com/Chat.ReadWrite', 'https://graph.microsoft.com/Team.ReadBasic.All', 'https://graph.microsoft.com/Channel.ReadBasic.All', 'https://graph.microsoft.com/TeamMember.Read.All', 'https://graph.microsoft.com/User.Read', 'offline_access'],
    redirectUri: `${SITE_URL}/oauth/microsoft-teams/web-callback`,
  },
  'slack': {
    clientId: process.env.SLACK_CLIENT_ID || '',
    clientSecret: process.env.SLACK_CLIENT_SECRET || '',
    authorizationUrl: 'https://slack.com/oauth/v2/authorize',
    tokenUrl: 'https://slack.com/api/oauth.v2.access',
    scopes: ['assistant:write', 'channels:history', 'channels:read', 'chat:write', 'chat:write.public', 'files:read', 'files:write', 'groups:history', 'groups:read', 'groups:write', 'im:history', 'im:read', 'im:write', 'mpim:history', 'mpim:read', 'mpim:write', 'team:read', 'users:read', 'users:read.email', 'reactions:read', 'reactions:write', 'channels:join', 'channels:manage', 'channels:write.topic', 'groups:write.topic'],
    redirectUri: `${SITE_URL}/oauth/slack/web-callback`,
  },
  'notion': {
    clientId: process.env.NOTION_CLIENT_ID || '',
    clientSecret: process.env.NOTION_CLIENT_SECRET || '',
    authorizationUrl: 'https://api.notion.com/v1/oauth/authorize',
    tokenUrl: 'https://api.notion.com/v1/oauth/token',
    scopes: [],
    redirectUri: `${SITE_URL}/oauth/notion/web-callback`,
    useBasicAuth: true,
  },
  'todoist': {
    clientId: process.env.TODOIST_CLIENT_ID_WEB || '',
    clientSecret: process.env.TODOIST_CLIENT_SECRET_WEB || '',
    authorizationUrl: 'https://todoist.com/oauth/authorize',
    tokenUrl: 'https://todoist.com/oauth/access_token',
    scopes: ['data:read_write'],
    redirectUri: `${SITE_URL}/oauth/todoist/web-callback`,
  },
  'mychart': {
    clientId: process.env.MYCHART_CLIENT_ID || '',
    clientSecret: process.env.MYCHART_CLIENT_SECRET || '',
    authorizationUrl: 'https://fhir.epic.com/interconnect-fhir-oauth/oauth2/authorize',
    tokenUrl: 'https://fhir.epic.com/interconnect-fhir-oauth/oauth2/token',
    scopes: [
      'patient/Patient.rs',
      'patient/Observation.rs',
      'patient/AllergyIntolerance.rs',
      'patient/Condition.rs',
      'patient/Immunization.rs',
      'patient/DiagnosticReport.rs',
      'patient/MedicationRequest.rs',
      'patient/Procedure.rs',
      'patient/AdverseEvent.rs',
      'patient/Appointment.rs',
      'patient/BodyStructure.rs',
      'patient/CarePlan.rs',
      'patient/CareTeam.rs',
      'patient/Communication.rs',
      'patient/Coverage.rs',
      'patient/Device.rs',
      'patient/DeviceRequest.rs',
      'patient/EpisodeOfCare.rs',
      'patient/ExplanationOfBenefit.rs',
      'patient/FamilyMemberHistory.rs',
      'patient/Flag.rs',
      'patient/Goal.rs',
      'patient/List.rs',
      'patient/Medication.rs',
      'patient/NutritionOrder.rs',
      'patient/Questionnaire.rs',
      'patient/QuestionnaireResponse.rs',
      'openid',
      'fhirUser',
      'offline_access',
      'launch'
    ],
    redirectUri: `${SITE_URL}/oauth/mychart/web-callback`,
    additionalParams: {
      aud: 'https://fhir.epic.com/interconnect-fhir-oauth/api/FHIR/R4/',
    },
  },
};

export const SERVICE_DESCRIPTORS: Record<string, ServiceDescriptor> = {
  'oura': {
    displayName: 'Oura',
    description: 'Connect your Oura Ring for sleep, activity, and readiness insights',
    category: 'Health and Wellness',
    iconName: 'activity',
  },
  'fitbit': {
    displayName: 'Fitbit',
    description: 'Sync your Fitbit data for comprehensive health tracking',
    category: 'Health and Wellness',
    iconName: 'activity',
  },
  'google_calendar': {
    displayName: 'Google Calendar',
    description: 'Access and manage your Google Calendar events',
    category: 'Calendar',
    iconName: 'calendar',
  },
  'gmail': {
    displayName: 'Gmail',
    description: 'Send emails and access your Gmail inbox',
    category: 'Email',
    iconName: 'mail',
  },
  'google_docs': {
    displayName: 'Google Docs',
    description: 'Create and edit Google Documents',
    category: 'Cloud Text Documents',
    iconName: 'file-text',
  },
  'google_sheets': {
    displayName: 'Google Sheets',
    description: 'Work with Google Spreadsheets',
    category: 'Cloud Spreadsheets',
    iconName: 'sheet',
  },
  'google_meet': {
    displayName: 'Google Meet',
    description: 'Create and manage Google Meet video calls',
    category: 'Video Conferencing',
    iconName: 'video',
  },
  'microsoft_excel': {
    displayName: 'Microsoft Excel Online',
    description: 'Work with Excel spreadsheets in the cloud',
    category: 'Cloud Spreadsheets',
    iconName: 'sheet',
  },
  'microsoft_word': {
    displayName: 'Microsoft Word Online',
    description: 'Create and edit Word documents online',
    category: 'Cloud Text Documents',
    iconName: 'file-text',
  },
  'microsoft_outlook_calendar': {
    displayName: 'Microsoft Outlook Calendar',
    description: 'Manage your Outlook calendar events',
    category: 'Calendar',
    iconName: 'calendar',
  },
  'microsoft_outlook_mail': {
    displayName: 'Microsoft Outlook Mail',
    description: 'Send emails and access your Outlook inbox',
    category: 'Email',
    iconName: 'mail',
  },
  'microsoft_teams': {
    displayName: 'Microsoft Teams',
    description: 'Collaborate with your Teams workspace',
    category: 'Team Collaboration',
    iconName: 'users',
  },
  'slack': {
    displayName: 'Slack',
    description: 'Send messages and interact with your Slack workspace',
    category: 'Team Collaboration',
    iconName: 'message-square',
  },
  'notion': {
    displayName: 'Notion',
    description: 'Access your Notion workspace and pages',
    category: 'Task Management',
    iconName: 'book',
  },
  'todoist': {
    displayName: 'Todoist',
    description: 'Manage your Todoist tasks and projects',
    category: 'Task Management',
    iconName: 'check-square',
  },
  'mychart': {
    displayName: 'MyChart',
    description: 'Access your Epic MyChart health records and medical data',
    category: 'Health and Wellness',
    iconName: 'activity',
  },
};

export function getOAuthConfig(serviceName: string): OAuthServiceConfig | null {
  // Map URL-style service names (with hyphens) to config keys (with underscores)
  const serviceNameMap: Record<string, string> = {
    'google-calendar': 'google_calendar',
    'google-docs': 'google_docs',
    'google-sheets': 'google_sheets',
    'google-meet': 'google_meet',
    'microsoft-excel': 'microsoft_excel',
    'microsoft-word': 'microsoft_word',
    'microsoft-outlook-calendar': 'microsoft_outlook_calendar',
    'outlook-calendar': 'microsoft_outlook_calendar',
    'microsoft-outlook-mail': 'microsoft_outlook_mail',
    'outlook-mail': 'microsoft_outlook_mail',
    'microsoft-teams': 'microsoft_teams',
    'my-chart': 'mychart',
  };
  
  const configKey = serviceNameMap[serviceName] || serviceName;
  return OAUTH_CONFIG[configKey] || null;
}

export function getServiceDescriptor(serviceName: string): ServiceDescriptor | null {
  // Map URL-style service names (with hyphens) to config keys (with underscores)
  const serviceNameMap: Record<string, string> = {
    'google-calendar': 'google_calendar',
    'google-docs': 'google_docs',
    'google-sheets': 'google_sheets',
    'google-meet': 'google_meet',
    'microsoft-excel': 'microsoft_excel',
    'microsoft-word': 'microsoft_word',
    'microsoft-outlook-calendar': 'microsoft_outlook_calendar',
    'outlook-calendar': 'microsoft_outlook_calendar',
    'microsoft-outlook-mail': 'microsoft_outlook_mail',
    'outlook-mail': 'microsoft_outlook_mail',
    'microsoft-teams': 'microsoft_teams',
    'my-chart': 'mychart',
  };
  
  const configKey = serviceNameMap[serviceName] || serviceName;
  return SERVICE_DESCRIPTORS[configKey] || null;
}

export function getAllConfiguredServices(): string[] {
  return Object.keys(OAUTH_CONFIG).filter(service => {
    const config = OAUTH_CONFIG[service];
    return config.clientId && config.clientId.length > 0;
  });
}