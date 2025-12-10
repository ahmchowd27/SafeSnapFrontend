import { apiClient } from './client';
import { PresignedUploadResponse, PresignedDownloadResponse } from '@/types';

// Backend S3 is ready - use real endpoints
const USE_MOCK_S3 = false;

// Helper function to extract file extension from filename
const getFileExtension = (fileName: string): string => {
  return fileName.split('.').pop()?.toLowerCase() || '';
};

// Helper function to determine file type based on MIME type
const getFileType = (mimeType: string): 'IMAGE' | 'AUDIO' => {
  return mimeType.startsWith('image/') ? 'IMAGE' : 'AUDIO';
};

export const storageApi = {
  // Get pre-signed URL for file upload
  getUploadUrl: async (fileName: string, fileType: string): Promise<PresignedUploadResponse> => {
    if (USE_MOCK_S3) {
      // Mock response - simulate S3 presigned URL
      const mockFileUrl = `https://safesnaptest.s3.amazonaws.com/incidents/${fileType.startsWith('image') ? 'images' : 'audio'}/user_1_${Date.now()}_${fileName}`;
      
      return {
        uploadUrl: `https://safesnaptest.s3.amazonaws.com/presigned-upload/${Date.now()}`,
        fileUrl: mockFileUrl,
        expiresInSeconds: 3600
      };
    }

    // Real backend API call
    const fileExtension = getFileExtension(fileName);
    const backendFileType = getFileType(fileType);
    
    const response = await apiClient.post('/s3/upload-url', {
      fileType: backendFileType,
      fileExtension: fileExtension
    });
    
    // Transform backend response to frontend format
    const result = {
      uploadUrl: response.data.uploadUrl,
      fileUrl: response.data.s3Url || response.data.fileUrl || response.data.downloadUrl, // Try multiple field names
      expiresInSeconds: response.data.expiresInMinutes * 60 // Convert minutes to seconds
    };
    
    return result;
  },

  // Get pre-signed URL for file download
  getDownloadUrl: async (fileUrl: string): Promise<PresignedDownloadResponse> => {
    if (USE_MOCK_S3) {
      return {
        downloadUrl: fileUrl,
        expiresInSeconds: 3600
      };
    }

    const response = await apiClient.post('/s3/download-url', {
      s3Url: fileUrl
    });
    
    return {
      downloadUrl: response.data.downloadUrl,
      expiresInSeconds: 3600 // Backend doesn't return expiry for download, assume 1 hour
    };
  },

  // Upload file directly to S3
  uploadFile: async (uploadUrl: string, file: File): Promise<void> => {
    if (USE_MOCK_S3) {
      // Simulate upload with delay
      await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1000));
      return;
    }
    
    const response = await fetch(uploadUrl, {
      method: 'PUT',
      body: file,
      headers: {
        'Content-Type': file.type,
      },
    });
    
    if (!response.ok) {
      throw new Error(`Upload failed: ${response.status} ${response.statusText}`);
    }
  },

  // Check if file exists (using the new backend endpoint)
  fileExists: async (fileUrl: string): Promise<boolean> => {
    if (USE_MOCK_S3) {
      return true;
    }

    try {
      const response = await apiClient.get('/s3/file-exists', {
        params: { s3Url: fileUrl }
      });
      return response.data.exists;
    } catch (error) {
      return false;
    }
  },
};
