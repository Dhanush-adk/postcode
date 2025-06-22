import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

// Get current directory (needed for ES modules)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Create subdirectories for different document types
const documentDirs = ['stores', 'retailers'];
documentDirs.forEach(dir => {
    const dirPath = path.join(uploadsDir, dir);
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
    }
});

// Configure multer storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        let uploadPath = uploadsDir;
        
        // Organize files by type
        if (file.fieldname.startsWith('store')) {
            uploadPath = path.join(uploadsDir, 'stores');
        } else if (file.fieldname.startsWith('retailer')) {
            uploadPath = path.join(uploadsDir, 'retailers');
        }
        
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        // Create unique filename with timestamp
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const extension = path.extname(file.originalname);
        const baseName = file.fieldname;
        cb(null, `${baseName}-${uniqueSuffix}${extension}`);
    }
});

// File filter function
const fileFilter = (req, file, cb) => {
    // Define allowed file types
    const allowedMimeTypes = [
        'image/jpeg',
        'image/jpg', 
        'image/png',
        'image/gif',
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];

    if (allowedMimeTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error(`Invalid file type for ${file.fieldname}. Allowed types: JPG, PNG, GIF, PDF, DOC, DOCX`), false);
    }
};

// Configure multer
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
        files: 10 // Maximum 10 files per request
    },
    fileFilter: fileFilter
});

// Error handling middleware for multer
const handleMulterError = (error, req, res, next) => {
    if (error instanceof multer.MulterError) {
        let message = 'File upload error';
        
        switch (error.code) {
            case 'LIMIT_FILE_SIZE':
                message = 'File size too large. Maximum size allowed is 5MB';
                break;
            case 'LIMIT_FILE_COUNT':
                message = 'Too many files uploaded. Maximum 10 files allowed';
                break;
            case 'LIMIT_UNEXPECTED_FILE':
                message = `Unexpected file field: ${error.field}`;
                break;
            case 'LIMIT_FIELD_COUNT':
                message = 'Too many fields in the form';
                break;
            case 'LIMIT_FIELD_KEY':
                message = 'Field name too long';
                break;
            case 'LIMIT_FIELD_VALUE':
                message = 'Field value too long';
                break;
            default:
                message = error.message;
        }
        
        return res.status(400).json({
            success: false,
            statusCode: 400,
            statusMessage: 'File Upload Error',
            errors: [message],
            timestamp: new Date().toISOString()
        });
    }
    
    // Handle custom file filter errors
    if (error.message.includes('Invalid file type')) {
        return res.status(400).json({
            success: false,
            statusCode: 400,
            statusMessage: 'Invalid File Type',
            errors: [error.message],
            timestamp: new Date().toISOString()
        });
    }
    
    next(error);
};

// Utility function to delete uploaded files (useful for cleanup on error)
const deleteUploadedFiles = (files) => {
    if (!files) return;
    
    Object.keys(files).forEach(fieldName => {
        const fileArray = files[fieldName];
        if (Array.isArray(fileArray)) {
            fileArray.forEach(file => {
                if (file.path && fs.existsSync(file.path)) {
                    fs.unlinkSync(file.path);
                }
            });
        }
    });
};

// Utility function to get file info
const getFileInfo = (file) => {
    if (!file) return null;
    
    return {
        originalName: file.originalname,
        filename: file.filename,
        path: file.path,
        size: file.size,
        mimetype: file.mimetype,
        uploadedAt: new Date().toISOString()
    };
};

// Utility function to validate file exists
const validateFileExists = (filePath) => {
    return fs.existsSync(filePath);
};

// Export the configured upload middleware and utilities
export { 
    upload, 
    handleMulterError, 
    deleteUploadedFiles, 
    getFileInfo, 
    validateFileExists 
};