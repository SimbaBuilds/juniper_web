import { createClient } from '@/lib/utils/supabase/client';

export interface CompletionMessage {
  serviceName: string;
  userId: string;
}

export class IntegrationCompletionService {
  private static instance: IntegrationCompletionService;
  private supabase = createClient();

  static getInstance(): IntegrationCompletionService {
    if (!IntegrationCompletionService.instance) {
      IntegrationCompletionService.instance = new IntegrationCompletionService();
    }
    return IntegrationCompletionService.instance;
  }

  async completeIntegration(serviceName: string): Promise<boolean> {
    try {
      // Get current user
      const { data: { user }, error: authError } = await this.supabase.auth.getUser();
      if (authError || !user) {
        console.error('User not authenticated for integration completion');
        return false;
      }

      console.log(`Completing integration for service: ${serviceName}`);
      
      // Send completion message to chat API
      const message = `Let's complete the integration for ${serviceName}`;
      
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          integration_in_progress: true,
          service_name: serviceName,
          history: [] // No history for completion messages
        }),
      });

      if (!response.ok) {
        console.error('Failed to send integration completion message:', await response.text());
        return false;
      }

      console.log('Integration completion message sent successfully');

      // Dispatch custom event for UI updates
      const event = new CustomEvent('integration_completed', {
        detail: { serviceName, userId: user.id }
      });
      window.dispatchEvent(event);

      // Navigate to chat page
      window.location.href = '/chat';

      return true;

    } catch (error) {
      console.error('Error completing integration:', error);
      return false;
    }
  }

  async completeIntegrationWithNavigation(serviceName: string): Promise<void> {
    const success = await this.completeIntegration(serviceName);
    
    if (success) {
      console.log(`Integration completion initiated for ${serviceName}, navigating to chat`);
    } else {
      console.error(`Failed to complete integration for ${serviceName}`);
      // Still navigate to chat even if completion message failed
      window.location.href = '/chat';
    }
  }

  // Alternative method that can be called from callback routes
  static async sendCompletionMessage(serviceName: string, userId: string): Promise<boolean> {
    try {
      console.log(`Sending completion message for ${serviceName} to user ${userId}`);
      
      const message = `Let's complete the integration for ${serviceName}`;
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          integration_in_progress: true,
          service_name: serviceName,
          user_id: userId,
          history: []
        }),
      });

      if (!response.ok) {
        console.error('Failed to send integration completion message:', await response.text());
        return false;
      }

      console.log('Integration completion message sent successfully via API');
      return true;

    } catch (error) {
      console.error('Error sending completion message:', error);
      return false;
    }
  }

  // Method for handling completion events
  setupCompletionEventListeners(): void {
    window.addEventListener('integration_completed', (event: CustomEvent<CompletionMessage>) => {
      const { serviceName, userId } = event.detail;
      console.log(`Integration completed event received for ${serviceName} (user: ${userId})`);
      
      // Additional UI updates can be handled here
      // For example, updating integration status displays
    });

    window.addEventListener('integration_disconnected', (event: CustomEvent<{ serviceName: string }>) => {
      const { serviceName } = event.detail;
      console.log(`Integration disconnected event received for ${serviceName}`);
      
      // Handle UI updates for disconnection
    });
  }

  // Clean up event listeners
  removeCompletionEventListeners(): void {
    window.removeEventListener('integration_completed', this.handleCompletionEvent);
    window.removeEventListener('integration_disconnected', this.handleDisconnectionEvent);
  }

  private handleCompletionEvent = (event: CustomEvent<CompletionMessage>) => {
    const { serviceName, userId } = event.detail;
    console.log(`Handling completion event for ${serviceName} (user: ${userId})`);
  };

  private handleDisconnectionEvent = (event: CustomEvent<{ serviceName: string }>) => {
    const { serviceName } = event.detail;
    console.log(`Handling disconnection event for ${serviceName}`);
  };
}