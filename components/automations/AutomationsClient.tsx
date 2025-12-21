'use client';

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import {
  Play,
  ChevronDown,
  ChevronRight,
  Clock,
  Webhook,
  Calendar,
  Zap,
  RefreshCw,
  CheckCircle,
  XCircle,
  Loader2,
  Settings,
  History,
  Trash2,
  Search
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { createClient } from '@/lib/utils/supabase/client';
import type { AutomationRecord, AutomationExecutionLog, AutomationAction } from '@/app/lib/automations/types';

interface AutomationsClientProps {
  userId: string;
}

// Trigger type display configuration
const triggerTypeConfig: Record<string, { icon: React.ElementType; label: string; color: string }> = {
  webhook: { icon: Webhook, label: 'Webhook', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' },
  schedule_recurring: { icon: Calendar, label: 'Scheduled', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' },
  schedule_once: { icon: Clock, label: 'One-time', color: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200' },
  manual: { icon: Zap, label: 'Manual', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' },
  polling: { icon: RefreshCw, label: 'Polling', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' },
};

// Timezone conversion utilities
// Convert UTC time string (HH:MM) to user's timezone
function convertUtcTimeToTimezone(utcTime: string, timezone: string): string {
  // Create a date object for today with the UTC time
  const today = new Date();
  const [hours, minutes] = utcTime.split(':').map(Number);
  const utcDate = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate(), hours, minutes));

  // Format in user's timezone
  const formatter = new Intl.DateTimeFormat('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: timezone
  });

  return formatter.format(utcDate);
}

// Convert user's local time string (HH:MM) to UTC
function convertTimezoneToUtc(localTime: string, timezone: string): string {
  const today = new Date();
  const [hours, minutes] = localTime.split(':').map(Number);

  // Create a date string with the local time and parse it in the user's timezone
  const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}T${localTime}:00`;

  // Get the offset for the user's timezone
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });

  // Parse as if it's in the user's timezone
  const localDate = new Date(dateStr);
  const tzOffset = localDate.getTimezoneOffset(); // Browser's offset

  // Get the user's timezone offset
  const parts = formatter.formatToParts(new Date());
  const utcFormatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'UTC',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });

  // Convert to timestamp treating the time as in the target timezone
  const fakeUtc = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate(), hours, minutes);
  const tzDate = new Date(fakeUtc);

  // Get UTC representation
  const targetFormatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    hour12: false
  });

  // Find the offset by comparing
  const targetParts = targetFormatter.formatToParts(tzDate);
  const targetHour = parseInt(targetParts.find(p => p.type === 'hour')?.value || '0');
  const targetMinute = parseInt(targetParts.find(p => p.type === 'minute')?.value || '0');

  // Calculate offset in minutes
  let offsetMinutes = (targetHour * 60 + targetMinute) - (hours * 60 + minutes);
  if (offsetMinutes > 720) offsetMinutes -= 1440;
  if (offsetMinutes < -720) offsetMinutes += 1440;

  // Apply inverse offset to get UTC
  let utcMinutes = hours * 60 + minutes - offsetMinutes;
  if (utcMinutes < 0) utcMinutes += 1440;
  if (utcMinutes >= 1440) utcMinutes -= 1440;

  const utcHours = Math.floor(utcMinutes / 60);
  const utcMins = utcMinutes % 60;

  return `${String(utcHours).padStart(2, '0')}:${String(utcMins).padStart(2, '0')}`;
}

// Convert UTC ISO datetime to user's timezone for datetime-local input
function convertUtcDatetimeToTimezone(utcDatetime: string, timezone: string): string {
  const date = new Date(utcDatetime);
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });

  const parts = formatter.formatToParts(date);
  const year = parts.find(p => p.type === 'year')?.value;
  const month = parts.find(p => p.type === 'month')?.value;
  const day = parts.find(p => p.type === 'day')?.value;
  const hour = parts.find(p => p.type === 'hour')?.value;
  const minute = parts.find(p => p.type === 'minute')?.value;

  return `${year}-${month}-${day}T${hour}:${minute}`;
}

// Convert datetime-local value (in user's timezone) to UTC ISO string
function convertTimezoneDatetimeToUtc(localDatetime: string, timezone: string): string {
  // Parse the datetime-local value
  const [datePart, timePart] = localDatetime.split('T');
  const [year, month, day] = datePart.split('-').map(Number);
  const [hours, minutes] = timePart.split(':').map(Number);

  // Create a UTC date and find the offset
  const fakeUtc = Date.UTC(year, month - 1, day, hours, minutes);
  const tzDate = new Date(fakeUtc);

  const targetFormatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    hour12: false
  });

  const targetParts = targetFormatter.formatToParts(tzDate);
  const targetHour = parseInt(targetParts.find(p => p.type === 'hour')?.value || '0');
  const targetMinute = parseInt(targetParts.find(p => p.type === 'minute')?.value || '0');
  const targetDay = parseInt(targetParts.find(p => p.type === 'day')?.value || '0');

  // Calculate offset
  let offsetMinutes = (targetHour * 60 + targetMinute) - (hours * 60 + minutes);
  const dayDiff = targetDay - day;
  if (dayDiff !== 0) offsetMinutes += dayDiff * 1440;

  // Apply inverse offset to get UTC
  const utcDate = new Date(Date.UTC(year, month - 1, day, hours, minutes) - offsetMinutes * 60000);

  return utcDate.toISOString();
}

// Format time for display with timezone label
function formatTimeWithTimezone(utcTime: string, timezone: string): string {
  const localTime = convertUtcTimeToTimezone(utcTime, timezone);
  const tzAbbr = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    timeZoneName: 'short'
  }).formatToParts(new Date()).find(p => p.type === 'timeZoneName')?.value || timezone;

  return `${localTime} ${tzAbbr}`;
}

// ============================================================================
// Dynamic Editability Helpers
// ============================================================================

// Keys to always hide from trigger_config editing
const HIDDEN_TRIGGER_CONFIG_KEYS = new Set([
  'service', 'event_type', 'source_tool', 'field',  // Internal routing config
]);

// Keys to always hide from action parameter editing
const HIDDEN_PARAM_KEYS = new Set([
  'data',  // Complex nested objects for internal use
]);

// Check if a parameter should be hidden from editing
function shouldHideParam(key: string, value: unknown): boolean {
  // Hide explicit hidden keys
  if (HIDDEN_PARAM_KEYS.has(key)) return true;

  // Hide ID reference fields
  if (key.endsWith('_id') || key === 'id') return true;

  // Hide pure template references like "{{trigger_data.id}}"
  if (typeof value === 'string' && /^\{\{[^}]+\}\}$/.test(value)) return true;

  // Hide complex nested objects
  if (typeof value === 'object' && value !== null && !Array.isArray(value)) return true;

  // Hide arrays of objects (but keep arrays of primitives like ["sleep_score", "readiness_score"])
  if (Array.isArray(value) && value.length > 0 && typeof value[0] === 'object') return true;

  return false;
}

// Check if a trigger_config key should be hidden
function shouldHideTriggerConfigKey(key: string): boolean {
  return HIDDEN_TRIGGER_CONFIG_KEYS.has(key);
}

// Check if a condition should be hidden (references an action output)
function shouldHideCondition(path: string, outputVars: string[]): boolean {
  // Hide conditions that reference action outputs like "classification.answer"
  return outputVars.some(v => path.startsWith(v + '.') || path === v);
}

// Infer the input type based on key name and value
function inferInputType(key: string, value: unknown): 'text' | 'textarea' | 'number' | 'array' | 'checkbox' | 'email' | 'select' {
  // Textarea for long text fields
  if (['message', 'body', 'description', 'question', 'prompt', 'content'].includes(key)) {
    return 'textarea';
  }

  // Email fields
  if (key === 'to' || key.includes('email')) return 'email';

  // Special select for polling interval
  if (key === 'polling_interval_minutes') return 'select';

  // Numbers
  if (typeof value === 'number') return 'number';

  // Arrays
  if (Array.isArray(value)) return 'array';

  // Booleans
  if (typeof value === 'boolean') return 'checkbox';

  // Default to text
  return 'text';
}

// Format a key name for display (snake_case to Title Case)
function formatKeyLabel(key: string | undefined | null): string {
  if (!key) return 'Unknown';
  return key
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

// Editable field definition
interface EditableField {
  path: string;
  key: string;
  value: unknown;
  inputType: 'text' | 'textarea' | 'number' | 'array' | 'checkbox' | 'email' | 'select';
  label: string;
}

// Recursively find editable fields in an object
function findEditableFields(obj: Record<string, unknown>, basePath = ''): EditableField[] {
  const fields: EditableField[] = [];

  for (const [key, value] of Object.entries(obj)) {
    const fieldPath = basePath ? `${basePath}.${key}` : key;

    // Skip hidden fields
    if (shouldHideParam(key, value)) continue;
    if (basePath === '' && shouldHideTriggerConfigKey(key)) continue;

    // If it's a nested object (but not array), recurse
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      fields.push(...findEditableFields(value as Record<string, unknown>, fieldPath));
    } else {
      // It's an editable leaf value
      const inputType = inferInputType(key, value);
      fields.push({
        path: fieldPath,
        key,
        value,
        inputType,
        label: formatKeyLabel(key)
      });
    }
  }

  return fields;
}

export function AutomationsClient({ userId }: AutomationsClientProps) {
  const [automations, setAutomations] = useState<AutomationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingStates, setLoadingStates] = useState<Record<string, { toggle?: boolean; trigger?: boolean }>>({});
  const [expandedLogs, setExpandedLogs] = useState<Record<string, boolean>>({});
  const [logs, setLogs] = useState<Record<string, AutomationExecutionLog[]>>({});
  const [logsLoading, setLogsLoading] = useState<Record<string, boolean>>({});
  const [logsHasMore, setLogsHasMore] = useState<Record<string, boolean>>({});
  const [editingAutomation, setEditingAutomation] = useState<AutomationRecord | null>(null);
  const [editValues, setEditValues] = useState<Record<string, unknown>>({});
  const [deletingAutomation, setDeletingAutomation] = useState<AutomationRecord | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [userTimezone, setUserTimezone] = useState<string>('UTC');

  // Filters
  const [filterService, setFilterService] = useState<string>('all');
  const [filterTriggerType, setFilterTriggerType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Extract service name from tool name (e.g., "oura_get_daily_sleep" -> "oura")
  const extractServiceFromTool = (tool: string): string | null => {
    const parts = tool.split('_');
    if (parts.length >= 2) {
      return parts[0].toLowerCase();
    }
    return null;
  };

  // Get all services for an automation (from trigger_config and actions)
  const getAutomationServices = (automation: AutomationRecord): string[] => {
    const services = new Set<string>();

    // Add service from trigger_config if present
    if (automation.trigger_config?.service) {
      services.add(automation.trigger_config.service.toLowerCase());
    }

    // Extract services from action tool names
    if (automation.actions) {
      for (const action of automation.actions) {
        const service = extractServiceFromTool(action.tool);
        if (service) {
          services.add(service);
        }
      }
    }

    return Array.from(services);
  };

  // Get unique services from automations (from both triggers and actions)
  const uniqueServices = Array.from(
    new Set(
      automations.flatMap(a => getAutomationServices(a))
    )
  ).sort();

  // Filter automations
  const filteredAutomations = automations.filter(automation => {
    // Filter by search query (name and description)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const nameMatch = automation.name?.toLowerCase().includes(query);
      const descMatch = automation.description?.toLowerCase().includes(query);
      if (!nameMatch && !descMatch) return false;
    }

    // Filter by service (checks both trigger_config.service and action tools)
    if (filterService !== 'all') {
      const services = getAutomationServices(automation);
      if (!services.includes(filterService.toLowerCase())) return false;
    }

    // Filter by trigger type
    if (filterTriggerType !== 'all') {
      if (automation.trigger_type !== filterTriggerType) return false;
    }

    // Filter by status
    if (filterStatus !== 'all') {
      if (filterStatus === 'active' && !automation.active) return false;
      if (filterStatus === 'paused' && automation.active) return false;
    }

    return true;
  });

  // Fetch automations and user timezone
  const fetchAutomations = useCallback(async () => {
    try {
      const supabase = createClient();

      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        console.error('Error getting user:', userError);
        toast.error('Please sign in to view automations');
        setLoading(false);
        return;
      }

      // Fetch user's timezone from user_profiles
      const { data: profileData, error: profileError } = await supabase
        .from('user_profiles')
        .select('timezone')
        .eq('id', user.id)
        .single();

      if (!profileError && profileData?.timezone) {
        setUserTimezone(profileData.timezone);
      }

      // Fetch automations from the automations schema
      const { data: automationsData, error } = await supabase
        .schema('automations')
        .from('automation_records')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching automations:', error);
        toast.error('Failed to load automations');
        return;
      }

      // Parse JSON fields
      const parsedAutomations = (automationsData || []).map(automation => ({
        ...automation,
        trigger_config: typeof automation.trigger_config === 'string'
          ? JSON.parse(automation.trigger_config)
          : automation.trigger_config || {},
        actions: typeof automation.actions === 'string'
          ? JSON.parse(automation.actions)
          : automation.actions,
        execution_params: typeof automation.execution_params === 'string'
          ? JSON.parse(automation.execution_params)
          : automation.execution_params || {},
        variables: typeof automation.variables === 'string'
          ? JSON.parse(automation.variables)
          : automation.variables || {},
      }));

      setAutomations(parsedAutomations);
    } catch (error) {
      console.error('Error fetching automations:', error);
      toast.error('Failed to load automations');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAutomations();
  }, [fetchAutomations]);

  // Toggle automation active state
  const handleToggleActive = async (automation: AutomationRecord) => {
    setLoadingStates(prev => ({
      ...prev,
      [automation.id]: { ...prev[automation.id], toggle: true }
    }));

    try {
      const supabase = createClient();
      const newActiveState = !automation.active;

      const { data: updated, error } = await supabase
        .schema('automations')
        .from('automation_records')
        .update({
          active: newActiveState,
          updated_at: new Date().toISOString()
        })
        .eq('id', automation.id)
        .select()
        .single();

      if (error) throw error;

      // Parse JSON fields and update local state
      const parsedAutomation = {
        ...updated,
        trigger_config: typeof updated.trigger_config === 'string'
          ? JSON.parse(updated.trigger_config)
          : updated.trigger_config || {},
        actions: typeof updated.actions === 'string'
          ? JSON.parse(updated.actions)
          : updated.actions,
      };

      setAutomations(prev => prev.map(a =>
        a.id === automation.id ? parsedAutomation : a
      ));

      toast.success(`Automation ${newActiveState ? 'resumed' : 'paused'}`);
    } catch (error) {
      console.error('Error toggling automation:', error);
      toast.error('Failed to update automation');
    } finally {
      setLoadingStates(prev => ({
        ...prev,
        [automation.id]: { ...prev[automation.id], toggle: false }
      }));
    }
  };

  // Manually trigger automation
  // Uses the /api/automations/trigger route which handles:
  // - Polling automations: poll → wait → process events
  // - Other types: direct execution via script-executor
  const handleTrigger = async (automation: AutomationRecord) => {
    setLoadingStates(prev => ({
      ...prev,
      [automation.id]: { ...prev[automation.id], trigger: true }
    }));

    try {
      console.log(`Triggering ${automation.trigger_type} automation ${automation.id} (${automation.name})`);

      const response = await fetch('/api/automations/trigger', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          automation_id: automation.id
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Execution failed');
      }

      // Show appropriate success message based on trigger type
      if (automation.trigger_type === 'polling') {
        const pollResult = result.poll_result || {};
        const processResult = result.process_result || {};
        toast.success(
          `Polled ${pollResult.items_found || 0} items, processed ${processResult.events_processed || 0} events`
        );
      } else {
        toast.success(`Automation "${automation.name}" triggered successfully`);
      }

      // Refresh logs for this automation
      if (expandedLogs[automation.id]) {
        fetchLogs(automation.id, true);
      }
    } catch (error) {
      console.error('Error triggering automation:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to trigger automation');
    } finally {
      setLoadingStates(prev => ({
        ...prev,
        [automation.id]: { ...prev[automation.id], trigger: false }
      }));
    }
  };

  // Fetch execution logs for an automation
  const fetchLogs = async (automationId: string, refresh = false) => {
    const currentLogs = logs[automationId] || [];
    const offset = refresh ? 0 : currentLogs.length;
    const limit = 10;

    setLogsLoading(prev => ({ ...prev, [automationId]: true }));

    try {
      const supabase = createClient();

      const { data: logsData, error, count } = await supabase
        .schema('automations')
        .from('automation_execution_logs')
        .select('*', { count: 'exact' })
        .eq('automation_id', automationId)
        .order('started_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;

      // Parse JSON fields
      const parsedLogs = (logsData || []).map(log => ({
        ...log,
        trigger_data: typeof log.trigger_data === 'string'
          ? JSON.parse(log.trigger_data)
          : log.trigger_data || {},
        action_results: typeof log.action_results === 'string'
          ? JSON.parse(log.action_results)
          : log.action_results || [],
      }));

      setLogs(prev => ({
        ...prev,
        [automationId]: refresh
          ? parsedLogs
          : [...(prev[automationId] || []), ...parsedLogs]
      }));
      setLogsHasMore(prev => ({
        ...prev,
        [automationId]: (offset + limit) < (count || 0)
      }));
    } catch (error) {
      console.error('Error fetching logs:', error);
      toast.error('Failed to load execution logs');
    } finally {
      setLogsLoading(prev => ({ ...prev, [automationId]: false }));
    }
  };

  // Toggle logs expansion
  const handleToggleLogs = (automationId: string) => {
    const isExpanding = !expandedLogs[automationId];
    setExpandedLogs(prev => ({ ...prev, [automationId]: isExpanding }));

    // Fetch logs when expanding if not already loaded
    if (isExpanding && !logs[automationId]) {
      fetchLogs(automationId);
    }
  };

  // Save automation edits
  const handleSaveEdit = async () => {
    if (!editingAutomation) return;

    try {
      const supabase = createClient();

      // Prepare update payload
      const updatePayload: Record<string, unknown> = {
        updated_at: new Date().toISOString()
      };

      // Add fields from editValues
      // Note: JSONB columns (trigger_config, actions, variables) accept objects directly
      // Do NOT stringify them - Supabase handles the conversion
      const allowedFields = ['active', 'name', 'description', 'trigger_config', 'actions', 'variables'];
      for (const field of allowedFields) {
        if (editValues[field] !== undefined) {
          updatePayload[field] = editValues[field];
        }
      }

      const { data: updated, error } = await supabase
        .schema('automations')
        .from('automation_records')
        .update(updatePayload)
        .eq('id', editingAutomation.id)
        .select()
        .single();

      if (error) throw error;

      // Parse JSON fields
      const parsedAutomation = {
        ...updated,
        trigger_config: typeof updated.trigger_config === 'string'
          ? JSON.parse(updated.trigger_config)
          : updated.trigger_config || {},
        actions: typeof updated.actions === 'string'
          ? JSON.parse(updated.actions)
          : updated.actions,
      };

      setAutomations(prev => prev.map(a =>
        a.id === editingAutomation.id ? parsedAutomation : a
      ));

      toast.success('Automation updated');
      setEditingAutomation(null);
      setEditValues({});
    } catch (error) {
      console.error('Error updating automation:', error);
      toast.error('Failed to update automation');
    }
  };

  // Delete automation
  const handleDelete = async () => {
    if (!deletingAutomation) return;

    setIsDeleting(true);

    try {
      const supabase = createClient();

      const { error } = await supabase
        .schema('automations')
        .from('automation_records')
        .delete()
        .eq('id', deletingAutomation.id);

      if (error) throw error;

      // Remove from local state
      setAutomations(prev => prev.filter(a => a.id !== deletingAutomation.id));

      // Clean up any cached logs
      setLogs(prev => {
        const newLogs = { ...prev };
        delete newLogs[deletingAutomation.id];
        return newLogs;
      });

      toast.success(`Automation "${deletingAutomation.name}" deleted`);
      setDeletingAutomation(null);
    } catch (error) {
      console.error('Error deleting automation:', error);
      toast.error('Failed to delete automation');
    } finally {
      setIsDeleting(false);
    }
  };

  // Format relative time
  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  // Format duration
  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}m`;
  };

  // Get trigger description
  const getTriggerDescription = (automation: AutomationRecord) => {
    const config = automation.trigger_config;

    switch (automation.trigger_type) {
      case 'webhook':
        return `${config.service || 'Unknown'} - ${config.event_type || config.event_types?.join(', ') || 'events'}`;
      case 'schedule_recurring':
        if (config.time_of_day) {
          const localTime = formatTimeWithTimezone(config.time_of_day, userTimezone);
          const intervalLabel = config.interval ? config.interval.charAt(0).toUpperCase() + config.interval.slice(1) : 'Daily';
          return `${intervalLabel} at ${localTime}`;
        }
        return config.interval || 'Recurring';
      case 'schedule_once':
        if (config.run_at) {
          const localDatetime = convertUtcDatetimeToTimezone(config.run_at, userTimezone);
          const date = new Date(localDatetime);
          const tzAbbr = new Intl.DateTimeFormat('en-US', {
            timeZone: userTimezone,
            timeZoneName: 'short'
          }).formatToParts(new Date()).find(p => p.type === 'timeZoneName')?.value || userTimezone;
          return `Scheduled for ${date.toLocaleString()} ${tzAbbr}`;
        }
        return 'One-time';
      case 'polling':
        return `${config.service || 'Unknown'} - every ${config.poll_interval || '5min'}`;
      case 'manual':
        return 'Triggered manually';
      default:
        return 'Unknown trigger';
    }
  };

  // Render action conditions as editable fields (hides output-referenced conditions)
  const renderEditableConditions = (actions: AutomationAction[] | null) => {
    if (!actions) return null;

    // Collect output variable names from actions
    const outputVars = actions
      .filter(a => a.output_as)
      .map(a => a.output_as as string);

    const editableConditions: { actionId: string; actionIdx: number; actionLabel: string; path: string; op: string; value: unknown }[] = [];

    // Helper to get action ID (supports both 'id' and 'action_id')
    const getConditionActionId = (action: AutomationAction): string => {
      return action.id || (action as Record<string, unknown>).action_id as string || '';
    };

    actions.forEach((action, idx) => {
      const actionId = getConditionActionId(action);
      if (action.condition) {
        if (action.condition.clauses) {
          action.condition.clauses.forEach((clause) => {
            // Skip conditions that reference action outputs
            if (!shouldHideCondition(clause.path, outputVars)) {
              editableConditions.push({
                actionId,
                actionIdx: idx,
                actionLabel: formatKeyLabel(actionId || action.tool),
                path: clause.path,
                op: clause.op,
                value: clause.value
              });
            }
          });
        } else if (action.condition.path && action.condition.op) {
          // Skip conditions that reference action outputs
          if (!shouldHideCondition(action.condition.path, outputVars)) {
            editableConditions.push({
              actionId,
              actionIdx: idx,
              actionLabel: formatKeyLabel(actionId || action.tool),
              path: action.condition.path,
              op: action.condition.op,
              value: action.condition.value
            });
          }
        }
      }
    });

    if (editableConditions.length === 0) return null;

    return (
      <div className="space-y-3">
        <Label className="text-sm font-medium">Conditions</Label>
        {editableConditions.map((cond, idx) => (
          <div key={idx} className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground font-mono text-xs">{cond.path}</span>
            <span className="text-muted-foreground">{cond.op}</span>
            <Input
              type={typeof cond.value === 'number' ? 'number' : 'text'}
              className="w-24 h-8"
              defaultValue={String(cond.value)}
              onChange={(e) => {
                const newActions = [...(editValues.actions as AutomationAction[] || editingAutomation?.actions || [])];
                const actionIdx = cond.actionIdx;
                if (actionIdx >= 0 && actionIdx < newActions.length) {
                  const action = { ...newActions[actionIdx] };
                  if (action.condition?.clauses) {
                    const clauseIdx = action.condition.clauses.findIndex(
                      c => c.path === cond.path && c.op === cond.op
                    );
                    if (clauseIdx >= 0) {
                      action.condition.clauses[clauseIdx].value = isNaN(Number(e.target.value))
                        ? e.target.value
                        : Number(e.target.value);
                    }
                  } else if (action.condition) {
                    action.condition.value = isNaN(Number(e.target.value))
                      ? e.target.value
                      : Number(e.target.value);
                  }
                  newActions[actionIdx] = action;
                  setEditValues(prev => ({ ...prev, actions: newActions }));
                }
              }}
            />
          </div>
        ))}
      </div>
    );
  };

  // Render editable trigger_config fields
  const renderEditableTriggerConfig = (automation: AutomationRecord) => {
    if (!automation.trigger_config) return null;

    // Already handled by existing schedule editors
    if (automation.trigger_type === 'schedule_recurring' || automation.trigger_type === 'schedule_once') {
      return null;
    }

    const config = typeof automation.trigger_config === 'string'
      ? JSON.parse(automation.trigger_config)
      : automation.trigger_config;

    const editableFields = findEditableFields(config);

    if (editableFields.length === 0) return null;

    return (
      <div className="space-y-4 pt-4 border-t border-border">
        <Label className="text-sm font-medium">Trigger Settings</Label>
        {editableFields.map((field, idx) => (
          <div key={idx} className="space-y-2">
            <Label htmlFor={`trigger-${field.path}`} className="text-sm text-muted-foreground">
              {field.label}
            </Label>
            {renderFieldInput(field, 'trigger_config', config)}
          </div>
        ))}
      </div>
    );
  };

  // Helper to get action ID (supports both 'id' and 'action_id' schemas)
  const getActionId = (action: AutomationAction): string => {
    return action.id || (action as Record<string, unknown>).action_id as string || `action-${Math.random()}`;
  };

  // Helper to get action parameters (supports both 'parameters' and 'params' schemas)
  const getActionParams = (action: AutomationAction): Record<string, unknown> | null => {
    const params = action.parameters || (action as Record<string, unknown>).params;
    if (!params) return null;
    return typeof params === 'string' ? JSON.parse(params) : params;
  };

  // Render editable action parameters
  const renderEditableActionParams = (actions: AutomationAction[] | null) => {
    if (!actions || actions.length === 0) return null;

    const actionFields: { action: AutomationAction; actionIdx: number; fields: EditableField[] }[] = [];

    actions.forEach((action, actionIdx) => {
      const params = getActionParams(action);
      if (params) {
        const fields = findEditableFields(params);
        if (fields.length > 0) {
          actionFields.push({ action, actionIdx, fields });
        }
      }
    });

    if (actionFields.length === 0) return null;

    return (
      <div className="space-y-4 pt-4 border-t border-border">
        <Label className="text-sm font-medium">Action Parameters</Label>
        {actionFields.map(({ action, actionIdx, fields }) => {
          const actionId = getActionId(action);
          return (
            <div key={actionId} className="space-y-3 pl-2 border-l-2 border-muted">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                {formatKeyLabel(action.tool)}
              </span>
              {fields.map((field, fieldIdx) => (
                <div key={fieldIdx} className="space-y-1">
                  <Label
                    htmlFor={`action-${actionId}-${field.path}`}
                    className="text-sm text-muted-foreground"
                  >
                    {field.label}
                  </Label>
                  {renderActionFieldInput(field, action, actionIdx)}
                </div>
              ))}
            </div>
          );
        })}
      </div>
    );
  };

  // Helper to render input for a trigger_config field
  const renderFieldInput = (field: EditableField, configType: string, currentConfig: Record<string, unknown>) => {
    const currentValue = editValues.trigger_config
      ? getNestedValue(editValues.trigger_config as Record<string, unknown>, field.path)
      : getNestedValue(currentConfig, field.path);

    const value = currentValue !== undefined ? currentValue : field.value;

    const updateValue = (newValue: unknown) => {
      const updatedConfig = { ...currentConfig };
      setNestedValue(updatedConfig, field.path, newValue);
      setEditValues(prev => ({
        ...prev,
        trigger_config: {
          ...(prev.trigger_config as Record<string, unknown> || {}),
          ...updatedConfig
        }
      }));
    };

    switch (field.inputType) {
      case 'textarea':
        return (
          <textarea
            id={`trigger-${field.path}`}
            className="w-full min-h-[80px] px-3 py-2 text-sm border border-input rounded-md bg-background"
            defaultValue={String(value || '')}
            onChange={(e) => updateValue(e.target.value)}
          />
        );

      case 'array':
        return (
          <Input
            id={`trigger-${field.path}`}
            type="text"
            placeholder="Comma-separated values"
            defaultValue={Array.isArray(value) ? (value as string[]).join(', ') : ''}
            onChange={(e) => updateValue(e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
          />
        );

      case 'select':
        if (field.key === 'polling_interval_minutes') {
          return (
            <Select
              value={String(value || 5)}
              onValueChange={(v) => updateValue(Number(v))}
            >
              <SelectTrigger id={`trigger-${field.path}`}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1 minute</SelectItem>
                <SelectItem value="5">5 minutes</SelectItem>
                <SelectItem value="10">10 minutes</SelectItem>
                <SelectItem value="15">15 minutes</SelectItem>
                <SelectItem value="30">30 minutes</SelectItem>
                <SelectItem value="60">1 hour</SelectItem>
              </SelectContent>
            </Select>
          );
        }
        return <Input id={`trigger-${field.path}`} defaultValue={String(value || '')} onChange={(e) => updateValue(e.target.value)} />;

      case 'number':
        return (
          <Input
            id={`trigger-${field.path}`}
            type="number"
            defaultValue={String(value || '')}
            onChange={(e) => updateValue(Number(e.target.value))}
          />
        );

      case 'checkbox':
        return (
          <Switch
            id={`trigger-${field.path}`}
            checked={Boolean(value)}
            onCheckedChange={(checked) => updateValue(checked)}
          />
        );

      default:
        return (
          <Input
            id={`trigger-${field.path}`}
            type={field.inputType === 'email' ? 'email' : 'text'}
            defaultValue={String(value || '')}
            onChange={(e) => updateValue(e.target.value)}
          />
        );
    }
  };

  // Helper to render input for an action parameter field
  const renderActionFieldInput = (field: EditableField, action: AutomationAction, actionIdx: number) => {
    const currentActions = editValues.actions as AutomationAction[] || editingAutomation?.actions || [];
    const currentAction = currentActions[actionIdx] || action;
    const parsedParams = getActionParams(currentAction) || getActionParams(action) || {};
    const actionId = getActionId(action);

    const value = getNestedValue(parsedParams, field.path) ?? field.value;

    // Determine which key the original action uses for parameters
    const paramsKey = (action as Record<string, unknown>).params ? 'params' : 'parameters';

    const updateValue = (newValue: unknown) => {
      const newActions = [...currentActions];
      const updatedParams = { ...parsedParams };
      setNestedValue(updatedParams, field.path, newValue);
      newActions[actionIdx] = {
        ...newActions[actionIdx],
        [paramsKey]: updatedParams
      };
      setEditValues(prev => ({ ...prev, actions: newActions }));
    };

    switch (field.inputType) {
      case 'textarea':
        return (
          <textarea
            id={`action-${actionId}-${field.path}`}
            className="w-full min-h-[80px] px-3 py-2 text-sm border border-input rounded-md bg-background"
            defaultValue={String(value || '')}
            onChange={(e) => updateValue(e.target.value)}
          />
        );

      case 'array':
        return (
          <Input
            id={`action-${actionId}-${field.path}`}
            type="text"
            placeholder="Comma-separated values"
            defaultValue={Array.isArray(value) ? (value as string[]).join(', ') : ''}
            onChange={(e) => updateValue(e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
          />
        );

      case 'number':
        return (
          <Input
            id={`action-${actionId}-${field.path}`}
            type="number"
            defaultValue={String(value || '')}
            onChange={(e) => updateValue(Number(e.target.value))}
          />
        );

      case 'checkbox':
        return (
          <Switch
            id={`action-${actionId}-${field.path}`}
            checked={Boolean(value)}
            onCheckedChange={(checked) => updateValue(checked)}
          />
        );

      default:
        return (
          <Input
            id={`action-${actionId}-${field.path}`}
            type={field.inputType === 'email' ? 'email' : 'text'}
            defaultValue={String(value || '')}
            onChange={(e) => updateValue(e.target.value)}
          />
        );
    }
  };

  // Helper to get nested value from object by path (e.g., "filter.contains_any")
  const getNestedValue = (obj: Record<string, unknown>, path: string): unknown => {
    return path.split('.').reduce((acc: unknown, key) => {
      if (acc && typeof acc === 'object') {
        return (acc as Record<string, unknown>)[key];
      }
      return undefined;
    }, obj);
  };

  // Helper to set nested value in object by path
  const setNestedValue = (obj: Record<string, unknown>, path: string, value: unknown): void => {
    const keys = path.split('.');
    const lastKey = keys.pop()!;
    const target = keys.reduce((acc: unknown, key) => {
      if (acc && typeof acc === 'object') {
        if (!(key in (acc as Record<string, unknown>))) {
          (acc as Record<string, unknown>)[key] = {};
        }
        return (acc as Record<string, unknown>)[key];
      }
      return acc;
    }, obj);
    if (target && typeof target === 'object') {
      (target as Record<string, unknown>)[lastKey] = value;
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="bg-card p-6 rounded-lg border border-border">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                <Skeleton className="w-3 h-3 rounded-full" />
                <Skeleton className="h-6 w-48" />
              </div>
              <Skeleton className="h-5 w-16" />
            </div>
            <Skeleton className="h-4 w-full mb-4" />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-24" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  const activeAutomations = automations.filter(a => a.active);
  const inactiveAutomations = automations.filter(a => !a.active);

  const hasActiveFilters = filterService !== 'all' || filterTriggerType !== 'all' || filterStatus !== 'all' || searchQuery.trim() !== '';

  return (
    <div className="space-y-8">
      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-card p-6 rounded-lg border border-border">
          <h3 className="text-lg font-semibold text-foreground mb-2">Active Automations</h3>
          <div className="text-number-lg mb-1">{activeAutomations.length}</div>
          <p className="text-sm text-muted-foreground">Running workflows</p>
        </div>

        <div className="bg-card p-6 rounded-lg border border-border">
          <h3 className="text-lg font-semibold text-foreground mb-2">Inactive Automations</h3>
          <div className="text-number-lg mb-1">{inactiveAutomations.length}</div>
          <p className="text-sm text-muted-foreground">Paused workflows</p>
        </div>

        <div className="bg-card p-6 rounded-lg border border-border">
          <h3 className="text-lg font-semibold text-foreground mb-2">Total Automations</h3>
          <div className="text-number-lg mb-1">{automations.length}</div>
          <p className="text-sm text-muted-foreground">All workflows</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-card p-4 rounded-lg border border-border">
        <div className="flex flex-wrap items-center gap-4">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by title or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          <div className="flex items-center gap-2">
            <Label htmlFor="filter-status" className="text-sm text-muted-foreground whitespace-nowrap">Status:</Label>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger id="filter-status" className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="paused">Paused</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <Label htmlFor="filter-trigger" className="text-sm text-muted-foreground whitespace-nowrap">Trigger:</Label>
            <Select value={filterTriggerType} onValueChange={setFilterTriggerType}>
              <SelectTrigger id="filter-trigger" className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="webhook">Webhook</SelectItem>
                <SelectItem value="schedule_recurring">Scheduled</SelectItem>
                <SelectItem value="schedule_once">One-time</SelectItem>
                <SelectItem value="manual">Manual</SelectItem>
                <SelectItem value="polling">Polling</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {uniqueServices.length > 0 && (
            <div className="flex items-center gap-2">
              <Label htmlFor="filter-service" className="text-sm text-muted-foreground whitespace-nowrap">Service:</Label>
              <Select value={filterService} onValueChange={setFilterService}>
                <SelectTrigger id="filter-service" className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Services</SelectItem>
                  {uniqueServices.map(service => (
                    <SelectItem key={service} value={service}>
                      {service}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setFilterStatus('all');
                setFilterTriggerType('all');
                setFilterService('all');
                setSearchQuery('');
              }}
              className="text-muted-foreground hover:text-foreground"
            >
              Clear Filters
            </Button>
          )}

          {hasActiveFilters && (
            <span className="text-sm text-muted-foreground ml-auto">
              Showing {filteredAutomations.length} of {automations.length}
            </span>
          )}
        </div>
      </div>

      {/* Automations List */}
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-semibold text-foreground mb-2">Your Automations</h2>
          <p className="text-sm text-muted-foreground">
            View, pause, edit, and manually trigger your automations. Click on an automation to see execution history.
          </p>
        </div>

        {automations.length === 0 ? (
          <div className="bg-card p-8 rounded-lg border border-border text-center">
            <h3 className="text-lg font-medium text-foreground mb-2">No automations yet</h3>
            <p className="text-muted-foreground">
              Ask your assistant to create automations that can respond to triggers like email, calendar events, or schedules.
            </p>
          </div>
        ) : filteredAutomations.length === 0 ? (
          <div className="bg-card p-8 rounded-lg border border-border text-center">
            <h3 className="text-lg font-medium text-foreground mb-2">No matching automations</h3>
            <p className="text-muted-foreground">
              Try adjusting your filters to see more automations.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setFilterStatus('all');
                setFilterTriggerType('all');
                setFilterService('all');
                setSearchQuery('');
              }}
              className="mt-4"
            >
              Clear Filters
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredAutomations.map((automation) => {
              const triggerConfig = triggerTypeConfig[automation.trigger_type] || triggerTypeConfig.manual;
              const TriggerIcon = triggerConfig.icon;
              const isLoading = loadingStates[automation.id];
              const isExpanded = expandedLogs[automation.id];
              const automationLogs = logs[automation.id] || [];
              const hasMoreLogs = logsHasMore[automation.id];
              const isLogsLoading = logsLoading[automation.id];

              return (
                <div
                  key={automation.id}
                  className={`bg-card rounded-lg border border-border ${!automation.active ? 'opacity-60' : ''}`}
                >
                  {/* Main automation card */}
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className={`w-3 h-3 rounded-full ${automation.active ? 'bg-green-500' : 'bg-gray-400'}`} />
                        <h3 className="text-lg font-semibold text-foreground">{automation.name}</h3>
                        <Badge variant="secondary" className={triggerConfig.color}>
                          <TriggerIcon className="w-3 h-3 mr-1" />
                          {triggerConfig.label}
                        </Badge>
                      </div>

                      <div className="flex items-center gap-3">
                        {/* Trigger button - for manual, scheduled, and polling automations */}
                        {['manual', 'schedule_recurring', 'schedule_once', 'polling'].includes(automation.trigger_type) && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleTrigger(automation)}
                            disabled={isLoading?.trigger}
                          >
                            {isLoading?.trigger ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <>
                                <Play className="w-4 h-4 mr-1" />
                                Run Now
                              </>
                            )}
                          </Button>
                        )}

                        {/* Active toggle */}
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">
                            {automation.active ? 'Active' : 'Paused'}
                          </span>
                          <Switch
                            checked={automation.active}
                            onCheckedChange={() => handleToggleActive(automation)}
                            disabled={isLoading?.toggle}
                          />
                        </div>
                      </div>
                    </div>

                    {automation.description && (
                      <p className="text-sm text-muted-foreground mb-4">{automation.description}</p>
                    )}

                    {/* Trigger details */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm mb-4">
                      <div>
                        <span className="text-muted-foreground">Trigger:</span>
                        <span className="ml-2 font-medium text-foreground">
                          {getTriggerDescription(automation)}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Created:</span>
                        <span className="ml-2 text-foreground">
                          {formatRelativeTime(automation.created_at)}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Actions:</span>
                        <span className="ml-2 font-medium text-foreground text-number">
                          {automation.actions?.length || 0}
                        </span>
                      </div>
                    </div>

                    {/* Actions summary */}
                    {automation.actions && automation.actions.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-4">
                        {automation.actions.map((action, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            {action.tool}
                            {action.condition && (
                              <span className="ml-1 text-muted-foreground">(conditional)</span>
                            )}
                          </Badge>
                        ))}
                      </div>
                    )}

                    {/* Action buttons */}
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleLogs(automation.id)}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        {isExpanded ? (
                          <ChevronDown className="w-4 h-4 mr-1" />
                        ) : (
                          <ChevronRight className="w-4 h-4 mr-1" />
                        )}
                        <History className="w-4 h-4 mr-1" />
                        Execution History
                      </Button>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEditingAutomation(automation);
                          setEditValues({});
                        }}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <Settings className="w-4 h-4 mr-1" />
                        Edit
                      </Button>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeletingAutomation(automation)}
                        className="text-muted-foreground hover:text-red-500"
                      >
                        <Trash2 className="w-4 h-4 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </div>

                  {/* Expandable execution logs */}
                  <Collapsible open={isExpanded} onOpenChange={() => handleToggleLogs(automation.id)}>
                    <CollapsibleContent>
                      <div className="border-t border-border p-6 bg-muted/30">
                        <h4 className="text-sm font-medium text-foreground mb-4">Recent Executions</h4>

                        {isLogsLoading && automationLogs.length === 0 ? (
                          <div className="space-y-2">
                            {[1, 2, 3].map(i => (
                              <Skeleton key={i} className="h-16 w-full" />
                            ))}
                          </div>
                        ) : automationLogs.length === 0 ? (
                          <p className="text-sm text-muted-foreground">No executions yet</p>
                        ) : (
                          <div className="space-y-3">
                            {automationLogs.map((log) => (
                              <ExecutionLogItem key={log.id} log={log} />
                            ))}

                            {hasMoreLogs && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => fetchLogs(automation.id)}
                                disabled={isLogsLoading}
                                className="w-full"
                              >
                                {isLogsLoading ? (
                                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                ) : null}
                                Load More
                              </Button>
                            )}
                          </div>
                        )}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editingAutomation} onOpenChange={(open) => !open && setEditingAutomation(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Automation</DialogTitle>
            <DialogDescription>
              Modify automation settings and conditions
            </DialogDescription>
          </DialogHeader>

          {editingAutomation && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  defaultValue={editingAutomation.name}
                  onChange={(e) => setEditValues(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  defaultValue={editingAutomation.description || ''}
                  onChange={(e) => setEditValues(prev => ({ ...prev, description: e.target.value }))}
                />
              </div>

              {/* Editable conditions */}
              {renderEditableConditions(editingAutomation.actions)}

              {/* Schedule editing for scheduled automations */}
              {editingAutomation.trigger_type === 'schedule_recurring' && (
                <div className="space-y-4 pt-4 border-t border-border">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">Schedule Settings</Label>
                    <span className="text-xs text-muted-foreground">
                      Timezone: {new Intl.DateTimeFormat('en-US', {
                        timeZone: userTimezone,
                        timeZoneName: 'long'
                      }).formatToParts(new Date()).find(p => p.type === 'timeZoneName')?.value || userTimezone}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="interval" className="text-sm text-muted-foreground">Interval</Label>
                      <Select
                        value={
                          (editValues.trigger_config as Record<string, unknown>)?.interval as string ||
                          editingAutomation.trigger_config?.interval ||
                          'daily'
                        }
                        onValueChange={(value) => {
                          setEditValues(prev => ({
                            ...prev,
                            trigger_config: {
                              ...editingAutomation.trigger_config,
                              ...(prev.trigger_config as Record<string, unknown> || {}),
                              interval: value
                            }
                          }));
                        }}
                      >
                        <SelectTrigger id="interval">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="hourly">Hourly</SelectItem>
                          <SelectItem value="daily">Daily</SelectItem>
                          <SelectItem value="weekly">Weekly</SelectItem>
                          <SelectItem value="monthly">Monthly</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="time_of_day" className="text-sm text-muted-foreground">Time of Day</Label>
                      <Input
                        id="time_of_day"
                        type="time"
                        className="bg-background text-foreground"
                        defaultValue={
                          editingAutomation.trigger_config?.time_of_day
                            ? convertUtcTimeToTimezone(editingAutomation.trigger_config.time_of_day, userTimezone)
                            : '09:00'
                        }
                        onChange={(e) => {
                          // Convert user's local time to UTC for storage
                          const utcTime = convertTimezoneToUtc(e.target.value, userTimezone);
                          setEditValues(prev => ({
                            ...prev,
                            trigger_config: {
                              ...editingAutomation.trigger_config,
                              ...(prev.trigger_config as Record<string, unknown> || {}),
                              time_of_day: utcTime
                            }
                          }));
                        }}
                      />
                    </div>
                  </div>
                </div>
              )}

              {editingAutomation.trigger_type === 'schedule_once' && (
                <div className="space-y-4 pt-4 border-t border-border">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">Schedule Settings</Label>
                    <span className="text-xs text-muted-foreground">
                      Timezone: {new Intl.DateTimeFormat('en-US', {
                        timeZone: userTimezone,
                        timeZoneName: 'long'
                      }).formatToParts(new Date()).find(p => p.type === 'timeZoneName')?.value || userTimezone}
                    </span>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="run_at" className="text-sm text-muted-foreground">Run At</Label>
                    <Input
                      id="run_at"
                      type="datetime-local"
                      className="bg-background text-foreground"
                      defaultValue={
                        editingAutomation.trigger_config?.run_at
                          ? convertUtcDatetimeToTimezone(editingAutomation.trigger_config.run_at, userTimezone)
                          : ''
                      }
                      onChange={(e) => {
                        // Convert user's local datetime to UTC for storage
                        const utcDatetime = convertTimezoneDatetimeToUtc(e.target.value, userTimezone);
                        setEditValues(prev => ({
                          ...prev,
                          trigger_config: {
                            ...editingAutomation.trigger_config,
                            ...(prev.trigger_config as Record<string, unknown> || {}),
                            run_at: utcDatetime
                          }
                        }));
                      }}
                    />
                  </div>
                </div>
              )}

              {/* Dynamic trigger config fields (for webhook, polling, manual) */}
              {renderEditableTriggerConfig(editingAutomation)}

              {/* Dynamic action parameters */}
              {renderEditableActionParams(editingAutomation.actions)}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingAutomation(null)}>
              Cancel
            </Button>
            <Button onClick={handleSaveEdit}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingAutomation} onOpenChange={(open) => !open && setDeletingAutomation(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Automation</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{deletingAutomation?.name}&quot;? This action cannot be undone.
              All execution history for this automation will also be deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// Execution log item component
function ExecutionLogItem({ log }: { log: AutomationExecutionLog }) {
  const [expanded, setExpanded] = useState(false);

  const statusConfig = {
    completed: { icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-100 dark:bg-green-900' },
    failed: { icon: XCircle, color: 'text-red-500', bg: 'bg-red-100 dark:bg-red-900' },
    running: { icon: Loader2, color: 'text-blue-500', bg: 'bg-blue-100 dark:bg-blue-900' },
  };

  const status = statusConfig[log.status] || statusConfig.completed;
  const StatusIcon = status.icon;

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  return (
    <div className="bg-card border border-border rounded-md">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full p-3 flex items-center justify-between text-left hover:bg-muted/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <StatusIcon className={`w-4 h-4 ${status.color} ${log.status === 'running' ? 'animate-spin' : ''}`} />
          <div>
            <div className="text-sm font-medium text-foreground">
              {formatTime(log.started_at)}
            </div>
            <div className="text-xs text-muted-foreground">
              {log.trigger_type} trigger • {log.duration_ms}ms • {log.actions_executed} actions
              {log.actions_failed > 0 && (
                <span className="text-red-500 ml-1">({log.actions_failed} failed)</span>
              )}
            </div>
          </div>
        </div>
        {expanded ? (
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        ) : (
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        )}
      </button>

      {expanded && (
        <div className="border-t border-border p-3 space-y-3">
          {/* Trigger data */}
          {log.trigger_data && Object.keys(log.trigger_data).length > 0 && (
            <div>
              <h5 className="text-xs font-medium text-muted-foreground mb-1">Trigger Data</h5>
              <pre className="text-xs bg-muted p-2 rounded overflow-auto max-h-24">
                {JSON.stringify(log.trigger_data, null, 2)}
              </pre>
            </div>
          )}

          {/* Action results */}
          {log.action_results && log.action_results.length > 0 && (
            <div>
              <h5 className="text-xs font-medium text-muted-foreground mb-2">Action Results</h5>
              <div className="space-y-2">
                {log.action_results.map((result, idx) => (
                  <div
                    key={idx}
                    className={`p-2 rounded text-xs ${
                      result.success
                        ? 'bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800'
                        : 'bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium">{result.tool}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">{result.duration_ms}ms</span>
                        {result.skipped && (
                          <Badge variant="secondary" className="text-xs">Skipped</Badge>
                        )}
                        {result.condition_result !== null && (
                          <Badge
                            variant="secondary"
                            className={result.condition_result ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}
                          >
                            Condition: {result.condition_result ? 'true' : 'false'}
                          </Badge>
                        )}
                      </div>
                    </div>
                    {result.error && (
                      <div className="text-red-600 dark:text-red-400 mt-1">
                        Error: {result.error}
                      </div>
                    )}
                    {result.output && !result.skipped && (
                      <pre className="mt-1 text-xs overflow-auto max-h-20 bg-background/50 p-1 rounded">
                        {typeof result.output === 'string'
                          ? result.output
                          : JSON.stringify(result.output, null, 2)}
                      </pre>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Error summary */}
          {log.error_summary && (
            <div className="p-2 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded">
              <h5 className="text-xs font-medium text-red-600 dark:text-red-400 mb-1">Error Summary</h5>
              <p className="text-xs text-red-700 dark:text-red-300">{log.error_summary}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
