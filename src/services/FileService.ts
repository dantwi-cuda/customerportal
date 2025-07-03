import ApiService from './ApiService';

// Define a type for the upload response if specific fields are expected (e.g., file URL)
export interface FileUploadResponse {
    url: string;
    fileName: string;
    fileType?: string;
    size?: number;
}

const FileService = {
    uploadFile: async (file: File, metadata?: Record<string, string>): Promise<FileUploadResponse> => {
        const formData = new FormData();
        formData.append('file', file);

        if (metadata) {
            formData.append('metadata', JSON.stringify(metadata));
        }

        try {
            // Replace 'upload' with your actual backend endpoint for file uploads
            // The backend should return a JSON response including the URL of the uploaded file.
            const result = await ApiService.fetchDataWithAxios<FileUploadResponse, FormData>({
                url: 'common/upload', // Example endpoint, adjust as per your swagger.json or API docs
                method: 'post',
                data: formData,
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            console.log('File upload response:', result);
            return result;
        } catch (error) {
            console.error('Failed to upload file:', error);
            throw error;
        }
    },
};

export default FileService;
