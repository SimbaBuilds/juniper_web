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
  Trash2
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
  const handleTrigger = async (automation: AutomationRecord) => {
    setLoadingStates(prev => ({
      ...prev,
      [automation.id]: { ...prev[automation.id], trigger: true }
    }));

    try {
      const supabase = createClient();

      // Get session for authentication with edge function
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session?.access_token) {
        throw new Error('Please sign in to trigger automations');
      }

      // Get Supabase URL from env
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      if (!supabaseUrl) {
        throw new Error('Configuration error');
      }

      const executorUrl = `${supabaseUrl}/functions/v1/script-executor/manual`;

      const manualTriggerData = {
        trigger_type: 'manual',
        triggered_at: new Date().toISOString(),
        triggered_by: 'web_ui',
      };

      console.log(`Triggering automation ${automation.id} (${automation.name})`);

      const response = await fetch(executorUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          automation_id: automation.id,
          trigger_data: manualTriggerData,
          test_mode: false
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        try {
          const errorJson = JSON.parse(errorText);
          throw new Error(errorJson.error || errorJson.message || 'Execution failed');
        } catch {
          throw new Error(`Execution failed: ${errorText}`);
        }
      }

      toast.success(`Automation "${automation.name}" triggered successfully`);

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
      const allowedFields = ['active', 'name', 'description', 'trigger_config', 'actions', 'variables'];
      for (const field of allowedFields) {
        if (editValues[field] !== undefined) {
          // Stringify JSON fields if they're objects
          if (['trigger_config', 'actions', 'variables'].includes(field) && typeof editValues[field] === 'object') {
            updatePayload[field] = JSON.stringify(editValues[field]);
          } else {
            updatePayload[field] = editValues[field];
          }
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

  // Render action conditions as editable fields
  const renderEditableConditions = (actions: AutomationAction[] | null) => {
    if (!actions) return null;

    const editableConditions: { actionId: string; path: string; op: string; value: unknown }[] = [];

    actions.forEach(action => {
      if (action.condition) {
        if (action.condition.clauses) {
          action.condition.clauses.forEach((clause, idx) => {
            editableConditions.push({
              actionId: action.id,
              path: clause.path,
              op: clause.op,
              value: clause.value
            });
          });
        } else if (action.condition.path && action.condition.op) {
          editableConditions.push({
            actionId: action.id,
            path: action.condition.path,
            op: action.condition.op,
            value: action.condition.value
          });
        }
      }
    });

    if (editableConditions.length === 0) return null;

    return (
      <div className="space-y-3">
        <Label className="text-sm font-medium">Conditions</Label>
        {editableConditions.map((cond, idx) => (
          <div key={idx} className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground font-mono">{cond.path}</span>
            <span className="text-muted-foreground">{cond.op}</span>
            <Input
              type="text"
              className="w-24 h-8"
              defaultValue={String(cond.value)}
              onChange={(e) => {
                // Update the condition value in editValues
                const newActions = [...(editValues.actions as AutomationAction[] || editingAutomation?.actions || [])];
                const actionIdx = newActions.findIndex(a => a.id === cond.actionId);
                if (actionIdx >= 0) {
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

  const hasActiveFilters = filterService !== 'all' || filterTriggerType !== 'all' || filterStatus !== 'all';

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
            View, pause, and manually trigger your automations. Click on an automation to see execution history.
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
        <DialogContent className="max-w-lg">
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
