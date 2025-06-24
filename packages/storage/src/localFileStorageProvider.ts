import { StorageProvider } from ".";

export class LocalFileStorageProvider implements StorageProvider {
  private baseUrl = "http://localhost:3001";

  async uploadFile(localPath: string, destPath: string): Promise<string> {
    const response = await fetch(localPath);
    const blob = await response.blob();
    
    const formData = new FormData();
    const filename = destPath.split('/').pop() || 'file';
    formData.append('file', blob, filename);

    const uploadResponse = await fetch(`${this.baseUrl}/upload`, {
      method: 'POST',
      body: formData,
    });

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      throw new Error(`File upload failed: ${errorText}`);
    }

    const result = await uploadResponse.json();
    return result.url;
  }

  async getDownloadUrl(destPath: string): Promise<string> {
    return `${this.baseUrl}/files/${destPath}`;
  }
} 