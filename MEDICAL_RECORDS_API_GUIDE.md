# Medical Records API Usage Guide

This guide covers how to use the medical records processing endpoints in the Juniper API.

## Overview

The medical records API allows you to upload and process medical documents (PDF, JPEG, PNG, CSV) with automatic text extraction, OCR processing, and embedding generation for semantic search.

## Authentication

All endpoints require Bearer token authentication using the same pattern as other Juniper API endpoints.

```
Authorization: Bearer <your-jwt-token>
```

## Endpoints

### 1. Process Medical Records

**Endpoint:** `POST /api/process_medical_records`

**Description:** Upload and process medical record files. Each file is processed according to its type, with pages extracted and stored in the database.

#### Request Format

The endpoint expects form data with a JSON payload:

```http
POST /api/process_medical_records
Content-Type: application/x-www-form-urlencoded
Authorization: Bearer <your-jwt-token>

json_data=<JSON_PAYLOAD>
```

#### Request Schema

```typescript
interface ProcessMedicalRecordsRequest {
  files: FileMetadata[];
  request_id?: string;  // Optional, will be generated if not provided
}

interface FileMetadata {
  url: string;          // Supabase storage URL or publicly accessible URL
  file_type: string;    // "pdf", "jpeg", "jpg", "png", or "csv"
  filename: string;     // Original filename
  size_bytes: number;   // File size in bytes
}
```

#### Example Request

```javascript
const payload = {
  files: [
    {
      url: "https://your-supabase-storage.com/medical-records/patient-123/lab-results.pdf",
      file_type: "pdf",
      filename: "lab-results.pdf",
      size_bytes: 2048576
    },
    {
      url: "https://your-supabase-storage.com/medical-records/patient-123/x-ray.jpeg",
      file_type: "jpeg",
      filename: "chest-x-ray.jpeg",
      size_bytes: 1048576
    },
    {
      url: "https://your-supabase-storage.com/medical-records/patient-123/vitals.csv",
      file_type: "csv",
      filename: "vital-signs.csv",
      size_bytes: 4096
    }
  ],
  request_id: "req-12345-abcde"
};

const response = await fetch('/api/process_medical_records', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/x-www-form-urlencoded'
  },
  body: `json_data=${encodeURIComponent(JSON.stringify(payload))}`
});
```

#### Response Schema

```typescript
interface ProcessMedicalRecordsResponse {
  success: boolean;
  message: string;
  processed_records: ProcessedRecord[];
  failed_records: FailedRecord[];
  total_pages: number;
  total_files: number;
  processing_time: number;  // Processing time in seconds
  request_id: string;
}

interface ProcessedRecord {
  success: true;
  record_id: string;        // UUID of created medical record
  num_pages: number;
  page_ids: string[];       // UUIDs of created page records
  processing_time: number;
}

interface FailedRecord {
  file_metadata: FileMetadata;
  error: string;
}
```

#### Example Response

```json
{
  "success": true,
  "message": "Successfully processed 3 medical records with 12 total pages",
  "processed_records": [
    {
      "success": true,
      "record_id": "550e8400-e29b-41d4-a716-446655440000",
      "num_pages": 8,
      "page_ids": [
        "550e8400-e29b-41d4-a716-446655440001",
        "550e8400-e29b-41d4-a716-446655440002"
      ],
      "processing_time": 4.2
    }
  ],
  "failed_records": [],
  "total_pages": 12,
  "total_files": 3,
  "processing_time": 8.7,
  "request_id": "req-12345-abcde"
}
```

### 2. List Medical Records

**Endpoint:** `GET /api/medical_records`

**Description:** Retrieve a paginated list of user's medical records.

#### Query Parameters

- `limit` (optional): Number of records to return (default: 50, max: 100)
- `offset` (optional): Number of records to skip (default: 0)

#### Example Request

```javascript
const response = await fetch('/api/medical_records?limit=20&offset=0', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

#### Response Schema

```typescript
interface MedicalRecordsListResponse {
  records: MedicalRecordSummary[];
  total_count: number;
  limit: number;
  offset: number;
  has_more: boolean;
}

interface MedicalRecordSummary {
  id: string;                    // UUID
  title: string;
  original_file_type: string;
  original_filename: string;
  file_size_bytes: number;
  num_pages: number;
  status: string;                // "processing", "completed", "failed"
  created_at: string;            // ISO datetime
  updated_at: string;            // ISO datetime
}
```

### 3. Get Medical Record Details

**Endpoint:** `GET /api/medical_records/{record_id}`

**Description:** Get detailed information about a specific medical record including all its pages.

#### Example Request

```javascript
const recordId = "550e8400-e29b-41d4-a716-446655440000";
const response = await fetch(`/api/medical_records/${recordId}`, {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

#### Response Schema

```typescript
interface MedicalRecordDetailsResponse {
  record: MedicalRecordDetail;
  pages: RecordPage[];
  total_pages: number;
}

interface MedicalRecordDetail {
  id: string;
  user_id: string;
  title: string;
  original_file_type: string;
  original_filename: string;
  file_size_bytes: number;
  num_pages: number;
  status: string;
  upload_url: string;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

interface RecordPage {
  id: string;                    // UUID
  page_number: number;
  content: string;               // Extracted text content
  processed_at: string;          // ISO datetime
  created_at: string;            // ISO datetime
}
```

### 4. Delete Medical Record

**Endpoint:** `DELETE /api/medical_records/{record_id}`

**Description:** Delete a medical record and all its associated pages.

#### Example Request

```javascript
const recordId = "550e8400-e29b-41d4-a716-446655440000";
const response = await fetch(`/api/medical_records/${recordId}`, {
  method: 'DELETE',
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

#### Response Schema

```typescript
interface DeleteResponse {
  message: string;
}
```

## Supported File Types

| File Type | Extension | Processing Method | Notes |
|-----------|-----------|-------------------|-------|
| PDF | `.pdf` | Text extraction + OCR fallback | OCR used if < 200 chars extracted |
| JPEG | `.jpeg`, `.jpg` | OCR | Direct OCR processing |
| PNG | `.png` | OCR | Direct OCR processing |
| CSV | `.csv` | Structured parsing | Converted to readable text format |

## Processing Behavior

### PDF Files
1. **Text Extraction**: First attempts standard PDF text extraction
2. **OCR Fallback**: If less than 200 characters extracted, converts page to image and uses OCR
3. **Page-by-Page**: Each PDF page becomes a separate record page

### Image Files (JPEG/PNG)
1. **Direct OCR**: Uses Tesseract OCR with image preprocessing
2. **Single Page**: Each image becomes one record page
3. **Preprocessing**: Automatic contrast enhancement, resizing, noise reduction

### CSV Files
1. **Data Analysis**: Parses CSV and generates structured summary
2. **Content Format**: Includes column info, data types, sample rows
3. **Single Page**: Entire CSV becomes one record page

## Error Handling

### HTTP Status Codes

- `200`: Success
- `400`: Bad request (invalid file type, missing data)
- `401`: Unauthorized (invalid/missing token)
- `404`: Record not found
- `422`: Validation error
- `500`: Server error

### Common Error Responses

```json
{
  "detail": "Unsupported file type: docx. Supported types: pdf, jpeg, jpg, png, csv"
}
```

```json
{
  "detail": "No files provided for processing"
}
```

## Rate Limits and File Limits

- **File Size**: Maximum 100MB per file
- **File Count**: No limit on number of files per request
- **Processing Time**: Varies by file size and type (typically 1-10 seconds per file)

## Integration Notes

### Embedding Generation
- Text content from each page is automatically queued for embedding generation
- Embeddings are generated asynchronously via Supabase Edge Functions
- Embedded pages become searchable via the existing semantic search system

### Database Storage
- Medical records are stored in the `medical_records` table
- Individual pages are stored in the `record_pages` table
- Page content is stored as plain text with optional embeddings

### Security
- All requests require valid JWT authentication
- Users can only access their own medical records
- File URLs should be from trusted sources (Supabase storage recommended)

## Example Client Implementation

```javascript
class MedicalRecordsClient {
  constructor(apiBaseUrl, authToken) {
    this.baseUrl = apiBaseUrl;
    this.token = authToken;
  }

  async processFiles(files) {
    const payload = {
      files: files,
      request_id: `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    };

    const response = await fetch(`${this.baseUrl}/api/process_medical_records`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: `json_data=${encodeURIComponent(JSON.stringify(payload))}`
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }

    return await response.json();
  }

  async listRecords(limit = 50, offset = 0) {
    const response = await fetch(
      `${this.baseUrl}/api/medical_records?limit=${limit}&offset=${offset}`,
      {
        headers: {
          'Authorization': `Bearer ${this.token}`
        }
      }
    );

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }

    return await response.json();
  }

  async getRecordDetails(recordId) {
    const response = await fetch(
      `${this.baseUrl}/api/medical_records/${recordId}`,
      {
        headers: {
          'Authorization': `Bearer ${this.token}`
        }
      }
    );

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }

    return await response.json();
  }

  async deleteRecord(recordId) {
    const response = await fetch(
      `${this.baseUrl}/api/medical_records/${recordId}`,
      {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${this.token}`
        }
      }
    );

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }

    return await response.json();
  }
}

// Usage example
const client = new MedicalRecordsClient('https://api.yourapp.com', 'your-jwt-token');

// Process files
const files = [
  {
    url: 'https://storage.supabase.co/v1/object/public/medical-records/file1.pdf',
    file_type: 'pdf',
    filename: 'lab-results.pdf',
    size_bytes: 1048576
  }
];

const result = await client.processFiles(files);
console.log(`Processed ${result.total_files} files with ${result.total_pages} pages`);

// List records
const records = await client.listRecords(20, 0);
console.log(`Found ${records.total_count} total records`);

// Get details
const details = await client.getRecordDetails(records.records[0].id);
console.log(`Record has ${details.total_pages} pages`);
```

## Best Practices

1. **File Storage**: Use Supabase storage for reliable file hosting
2. **Error Handling**: Always check response status and handle errors gracefully
3. **Progress Tracking**: Use request_id to track processing status
4. **Batch Processing**: Group related files in single requests when possible
5. **File Validation**: Validate file types and sizes before upload
6. **Authentication**: Ensure JWT tokens are valid and refreshed as needed

## Support

For issues or questions about the medical records API, check the server logs or contact the development team.