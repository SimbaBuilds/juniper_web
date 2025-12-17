Error: Cannot read properties of undefined (reading 'split')

components/automations/AutomationsClient.tsx (299:6) @ formatKeyLabel


  297 | function formatKeyLabel(key: string): string {
  298 |   return key
> 299 |     .split('_')
      |      ^
  300 |     .map(word => word.charAt(0).toUpperCase() + word.slice(1))
  301 |     .join(' ');
  302 | }



  [{"idx":12,"id":"1219d63e-40c8-4f8b-8de0-5f89e1c2e874","user_id":"56a2c117-6486-4ca5-a57d-6c2e877e7083","name":"Fitbit - Resting Heart Rate Trend Alert","description":"Send SMS if resting heart rate is elevated","trigger_type":"polling","trigger_config":"{\"service\": \"Fitbit\", \"event_type\": \"heart_rate_updated\", \"source_tool\": \"fitbit_get_heart_rate_data\", \"tool_params\": {\"date\": \"{{today}}\"}}","script_code":null,"execution_params":null,"dependencies":null,"active":false,"created_at":"2025-12-13 04:51:05.576031+00","updated_at":"2025-12-15 04:03:25.15939+00","actions":"[{\"tool\": \"textbelt_send_sms\", \"params\": {\"phone\": \"{{user.phone_number}}\", \"message\": \"Your resting heart rate is elevated at {{trigger_data.restingHeartRate}} BPM. Consider monitoring your stress and recovery.\"}, \"action_id\": \"send_heart_rate_alert\", \"condition\": {\"op\": \">\", \"path\": \"trigger_data.restingHeartRate\", \"value\": 70}}]","variables":"{}","status":"active","confirmed_at":"2025-12-13 04:51:05.57603+00","next_poll_at":"2025-12-13 04:51:05.576032+00","last_poll_cursor":null,"polling_interval_minutes":5}]