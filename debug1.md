Session check result: {
  hasSession: true,
  hasAccessToken: true,
  accessTokenLength: 735,
  sessionError: undefined
}
Using request ID: web-medical-1758168422098-uyy2qgg47 (provided by frontend)
Python backend success response: {
  success: false,
  processedCount: 0,
  failedCount: 1,
  totalPages: 0,
  processingTime: 0.40008974075317383
}
=== MEDICAL RECORDS API REQUEST SUCCESS ===
 POST /api/process_medical_records 200 in 1204ms


Browser:
🔄 MedicalRecordsStorageService: Starting medical record upload {userId: 'f8ac1669-7e9e-4d9e-bb9d-bebd806ce58e', fileName: 'email_int_screenshot.jpeg', fileSize: 659452, fileType: 'image/jpeg'}
MedicalRecordsStorageService.ts:58 🔄 MedicalRecordsStorageService: Checking user authentication
MedicalRecordsStorageService.ts:71 ✅ MedicalRecordsStorageService: User authenticated {userId: 'f8ac1669-7e9e-4d9e-bb9d-bebd806ce58e'}
MedicalRecordsStorageService.ts:75 🔄 MedicalRecordsStorageService: Uploading to path {filePath: 'f8ac1669-7e9e-4d9e-bb9d-bebd806ce58e/medical-records/1758168421146_email_int_screenshot.jpeg'}
MedicalRecordsStorageService.ts:92 ✅ MedicalRecordsStorageService: Upload successful {data: {…}}
MedicalRecordsStorageService.ts:95 ✅ MedicalRecordsStorageService: Public URL generated {fileUrl: 'https://ydbabipbxxleeiiysojv.supabase.co/storage/v…l-records/1758168421146_email_int_screenshot.jpeg'}
turbopack-hot-reloader-common.ts:41 [Fast Refresh] rebuilding
report-hmr-latency.ts:26 [Fast Refresh] done in 152ms

UI:

Processed 0 files successfully, 1 files failed

Failed files:

email_int_screenshot.jpeg: Failed to download file: 400 Client Error: Bad Request for url: https://ydbabipbxxleeiiysojv.supabase.co/storage/v1/object/public/medical-records/f8ac1669-7e9e-4d9e-bb9d-bebd806ce58e/medical-records/1758168421146_email_int_screenshot.jpeg