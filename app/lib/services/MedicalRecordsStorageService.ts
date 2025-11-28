import { createClient } from '@/lib/utils/supabase/client';
import { sanitizeFilename } from '@/app/lib/utils/sanitizeFilename';

export interface MedicalRecordUploadResult {
  success: boolean;
  fileUrl?: string;
  error?: string;
}

export interface FileMetadata {
  url: string;
  file_type: string;
  filename: string;
  size_bytes: number;
}

export class MedicalRecordsStorageService {
  private static readonly BUCKET_NAME = 'medical-records';
  private static supabase = createClient();

  static async uploadMedicalRecord(
    userId: string,
    file: File,
    fileName?: string
  ): Promise<MedicalRecordUploadResult> {
    console.log('🔄 MedicalRecordsStorageService: Starting medical record upload', {
      userId,
      fileName: fileName || file.name,
      fileSize: file.size,
      fileType: file.type
    });

    try {
      if (!userId) {
        const error = 'User ID is required for medical record upload';
        console.error('❌ MedicalRecordsStorageService:', error);
        return { success: false, error };
      }

      if (!file) {
        const error = 'File is required for upload';
        console.error('❌ MedicalRecordsStorageService:', error);
        return { success: false, error };
      }

      if (!this.isSupportedFileType(file.type)) {
        const error = 'Only PDF, PNG, JPEG, CSV, TXT, RTF, DOCX, DOC, and MD files are allowed';
        console.error('❌ MedicalRecordsStorageService:', error);
        return { success: false, error };
      }

      const maxSize = 50 * 1024 * 1024; // 50MB
      if (file.size > maxSize) {
        const error = 'File size must be less than 50MB';
        console.error('❌ MedicalRecordsStorageService:', error);
        return { success: false, error };
      }

      console.log('🔄 MedicalRecordsStorageService: Checking user authentication');
      const { data: { user }, error: authError } = await this.supabase.auth.getUser();

      if (authError) {
        console.error('❌ MedicalRecordsStorageService: Auth error:', authError);
        return { success: false, error: `Authentication error: ${authError.message}` };
      }

      if (!user) {
        console.error('❌ MedicalRecordsStorageService: User not authenticated');
        return { success: false, error: 'User not authenticated' };
      }

      console.log('✅ MedicalRecordsStorageService: User authenticated', { userId: user.id });

      const sanitizedFileName = sanitizeFilename(fileName || file.name);
      const finalFileName = fileName ? sanitizedFileName : `${Date.now()}_${sanitizedFileName}`;
      const filePath = `${userId}/${finalFileName}`;
      console.log('🔄 MedicalRecordsStorageService: Uploading to path', { filePath });

      const { data, error } = await this.supabase.storage
        .from(MedicalRecordsStorageService.BUCKET_NAME)
        .upload(filePath, file, {
          contentType: file.type,
          upsert: false
        });

      if (error) {
        console.error('❌ MedicalRecordsStorageService: Supabase upload error:', {
          error: error.message,
          name: error.name
        });
        return { success: false, error: error.message };
      }

      console.log('✅ MedicalRecordsStorageService: Upload successful', { data });

      const fileUrl = await MedicalRecordsStorageService.getSignedUrl(filePath);
      if (!fileUrl) {
        return { success: false, error: 'Failed to generate signed URL' };
      }

      console.log('✅ MedicalRecordsStorageService: Signed URL generated', { fileUrl });

      return {
        success: true,
        fileUrl
      };

    } catch (error) {
      console.error('❌ MedicalRecordsStorageService: Unexpected error during upload:', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error during medical record upload'
      };
    }
  }

  static async uploadMultipleMedicalRecords(
    userId: string,
    files: File[]
  ): Promise<{ results: MedicalRecordUploadResult[]; fileMetadata: FileMetadata[] }> {
    console.log('🔄 MedicalRecordsStorageService: Starting batch upload', {
      userId,
      fileCount: files.length
    });

    if (files.length > 8) {
      throw new Error('Maximum 8 files allowed per upload');
    }

    const results: MedicalRecordUploadResult[] = [];
    const fileMetadata: FileMetadata[] = [];

    for (const file of files) {
      const result = await this.uploadMedicalRecord(userId, file);
      results.push(result);

      if (result.success && result.fileUrl) {
        fileMetadata.push({
          url: result.fileUrl,
          file_type: this.getFileExtension(file.type),
          filename: file.name,
          size_bytes: file.size
        });
      }
    }

    return { results, fileMetadata };
  }

  static getPublicUrl(filePath: string): string {
    const { data } = this.supabase.storage
      .from(MedicalRecordsStorageService.BUCKET_NAME)
      .getPublicUrl(filePath);

    return data.publicUrl;
  }

  static async getSignedUrl(filePath: string): Promise<string | null> {
    const { data, error } = await this.supabase.storage
      .from(MedicalRecordsStorageService.BUCKET_NAME)
      .createSignedUrl(filePath, 3600); // 1 hour expiry

    if (error) {
      console.error('Failed to create signed URL:', error);
      return null;
    }

    return data.signedUrl;
  }

  static async deleteFile(filePath: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await this.supabase.storage
        .from(MedicalRecordsStorageService.BUCKET_NAME)
        .remove([filePath]);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };

    } catch (error) {
      console.error('❌ Error deleting medical record:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  static getFileSizeLimit(): number {
    return 50 * 1024 * 1024; // 50MB
  }

  static getMaxFileCount(): number {
    return 8;
  }

  static isSupportedFileType(mimeType: string): boolean {
    const supportedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/jpg',
      'image/png',
      'text/csv',
      'application/csv',
      'text/plain',
      'application/rtf',
      'text/rtf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword',
      'text/markdown',
      'text/x-markdown'
    ];
    return supportedTypes.includes(mimeType.toLowerCase());
  }

  static getFileExtension(mimeType: string): string {
    const mimeToExt: Record<string, string> = {
      'application/pdf': 'pdf',
      'image/jpeg': 'jpeg',
      'image/jpg': 'jpg',
      'image/png': 'png',
      'text/csv': 'csv',
      'application/csv': 'csv',
      'text/plain': 'txt',
      'application/rtf': 'rtf',
      'text/rtf': 'rtf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
      'application/msword': 'doc',
      'text/markdown': 'md',
      'text/x-markdown': 'md'
    };
    return mimeToExt[mimeType.toLowerCase()] || 'unknown';
  }

  static getSupportedFileTypesText(): string {
    return 'PDF, PNG, JPEG, CSV, TXT, RTF, DOCX, DOC, MD';
  }
}