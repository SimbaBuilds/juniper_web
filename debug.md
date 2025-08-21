Fetching integrations for user: f8ac1669-7e9e-4d9e-bb9d-bebd806ce58e
Found integrations: 13
 GET /api/integrations 200 in 386ms
 GET /api/integrations/system?userId=f8ac1669-7e9e-4d9e-bb9d-bebd806ce58e 200 in 289ms
Fetched services from database: 17
Services by type: { user: 15, system: 2 }
 GET /api/services 200 in 307ms
🔌 API: Starting disconnect for integration ID: f6eeaf62-0eb7-4f74-9126-9834d0283a18
🔍 API: Integration lookup result: {
  error: null,
  data: { service_id: 'a6fd4618-0cdc-4506-a371-df48e6413ea3' },
  count: null,
  status: 200,
  statusText: 'OK'
}
🔍 API: Service lookup result: {
  error: null,
  data: { service_name: 'Gmail' },
  count: null,
  status: 200,
  statusText: 'OK'
}
🏷️ API: Using service name: Gmail
🔌 Disconnecting Gmail integration...
🗑️ Attempting to delete integration with ID: f6eeaf62-0eb7-4f74-9126-9834d0283a18
🗑️ Delete operation result: { data: [], error: null, count: null, deletedRecords: 0 }
⚠️ No records were deleted for integration ID: f6eeaf62-0eb7-4f74-9126-9834d0283a18
🔚 API: Disconnect result: { success: false, error: 'No integration record found to delete' }
 POST /api/integrations 200 in 557ms