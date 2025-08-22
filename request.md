For the integrations connection flow, there are two flows:
New Connection: User authenticates, a health data sync is run for certain integrations, user is routed to chat page, and a "let's complete the integration for < service_name> message is sent with an integration_in_progress flag
Reconnection: User authenticates and returns to integrations screen.

Currently, the reconnection flow is going through the full new connection flow.  Please fix.