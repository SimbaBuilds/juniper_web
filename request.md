We are adding some more health and wellness integrations: Epic MyChart API, Apple Health Kit, and Google Fit, but only MyChart auth will be supported in this web application.  Please research up to date docs for MyChart and implement the flow following existing patterns in the codebase.  Then, update both the protected integrations page and public integration-descriptions UI to support the new flows.  Service record service_name col values are MyChart, Apple Health, and Google Fit exactly.

Google Fit and Apple Health connection should render in the integrations page, but instead of Connect, Disconnect, and Reconnect buttons, they should display the message “Connect in mobile app only”.

