import { GenericResponse } from '../models/GenericResponse.js';

/**
 * Validation middleware for retailer signup
 * Validates both store and retailer data before processing
 */
export const validateRetailerSignup = (req, res, next) => {
    try {
        const { storeDetails, retailerDetails } = req.body;
        const errors = [];

        // Check if main objects are provided
        if (!storeDetails) {
            errors.push('Store details are required');
        }
        
        if (!retailerDetails) {
            errors.push('Retailer details are required');
        }

        // If main objects are missing, return error immediately
        if (errors.length > 0) {
            return GenericResponse
                .validationError(errors)
                .send(res);
        }

        // Validate store details structure
        const requiredStoreFields = [
            'storeName', 'storeType', 'storeAddress', 'storeCity', 
            'storeState', 'storePincode', 'storeCountry', 'storeContact', 
            'storeEmail', 'storeGSTIN'
        ];

        requiredStoreFields.forEach(field => {
            if (!storeDetails[field] || (typeof storeDetails[field] === 'string' && storeDetails[field].trim() === '')) {
                errors.push(`Store ${field.replace('store', '').toLowerCase()} is required`);
            }
        });

        // Validate retailer details structure
        const requiredRetailerFields = [
            'retailerName', 'retailerType', 'retailerPhoneNum', 
            'retailerEmail', 'retailerAadhar', 'retailerPAN'
        ];

        requiredRetailerFields.forEach(field => {
            if (!retailerDetails[field] || (typeof retailerDetails[field] === 'string' && retailerDetails[field].trim() === '')) {
                errors.push(`Retailer ${field.replace('retailer', '').toLowerCase()} is required`);
            }
        });

        // Additional format validations
        if (storeDetails.storeEmail && !isValidEmail(storeDetails.storeEmail)) {
            errors.push('Invalid store email format');
        }

        if (retailerDetails.retailerEmail && !isValidEmail(retailerDetails.retailerEmail)) {
            errors.push('Invalid retailer email format');
        }

        if (storeDetails.storeContact && !isValidPhone(storeDetails.storeContact)) {
            errors.push('Invalid store contact format (should be 10 digits)');
        }

        if (retailerDetails.retailerPhoneNum && !isValidPhone(retailerDetails.retailerPhoneNum)) {
            errors.push('Invalid retailer phone format (should be 10 digits)');
        }

        if (storeDetails.storePincode && !isValidPincode(storeDetails.storePincode)) {
            errors.push('Invalid store pincode format (should be 6 digits)');
        }

        if (storeDetails.storeGSTIN && !isValidGSTIN(storeDetails.storeGSTIN)) {
            errors.push('Invalid GSTIN format');
        }

        if (retailerDetails.retailerAadhar && !isValidAadhar(retailerDetails.retailerAadhar)) {
            errors.push('Invalid Aadhar number format');
        }

        if (retailerDetails.retailerPAN && !isValidPAN(retailerDetails.retailerPAN)) {
            errors.push('Invalid PAN number format');
        }

        // Password validation if provided
        if (retailerDetails.password) {
            if (retailerDetails.password.length < 8) {
                errors.push('Password must be at least 8 characters long');
            }
            if (!/(?=.*[a-z])/.test(retailerDetails.password)) {
                errors.push('Password must contain at least one lowercase letter');
            }
            if (!/(?=.*[A-Z])/.test(retailerDetails.password)) {
                errors.push('Password must contain at least one uppercase letter');
            }
            if (!/(?=.*\d)/.test(retailerDetails.password)) {
                errors.push('Password must contain at least one number');
            }
            if (!/(?=.*[@$!%*?&])/.test(retailerDetails.password)) {
                errors.push('Password must contain at least one special character (@$!%*?&)');
            }
        }

        // If there are validation errors, return them
        if (errors.length > 0) {
            return GenericResponse
                .validationError(errors)
                .send(res);
        }

        // If validation passes, continue to next middleware
        next();

    } catch (error) {
        console.error('Validation middleware error:', error);
        return GenericResponse
            .serverError('Validation error occurred')
            .send(res);
    }
};

/**
 * Email validation helper
 */
const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

/**
 * Phone validation helper (Indian format)
 */
const isValidPhone = (phone) => {
    const phoneRegex = /^[6-9]\d{9}$/;
    return phoneRegex.test(phone.replace(/\D/g, ''));
};

/**
 * Pincode validation helper (Indian format)
 */
const isValidPincode = (pincode) => {
    const pincodeRegex = /^[1-9][0-9]{5}$/;
    return pincodeRegex.test(pincode);
};

/**
 * GSTIN validation helper
 */
const isValidGSTIN = (gstin) => {
    const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
    return gstinRegex.test(gstin);
};

/**
 * Aadhar validation helper
 */
const isValidAadhar = (aadhar) => {
    const aadharRegex = /^[2-9]{1}[0-9]{3}[0-9]{4}[0-9]{4}$/;
    return aadharRegex.test(aadhar.replace(/\s/g, ''));
};

/**
 * PAN validation helper
 */
const isValidPAN = (pan) => {
    const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
    return panRegex.test(pan.toUpperCase());
};

/**
 * Generic validation middleware for other routes
 */
export const validateLogin = (req, res, next) => {
    try {
        const { email, password } = req.body;
        const errors = [];

        if (!email || email.trim() === '') {
            errors.push('Email is required');
        } else if (!isValidEmail(email)) {
            errors.push('Invalid email format');
        }

        if (!password || password.trim() === '') {
            errors.push('Password is required');
        }

        if (errors.length > 0) {
            return GenericResponse
                .validationError(errors)
                .send(res);
        }

        next();
    } catch (error) {
        console.error('Login validation error:', error);
        return GenericResponse
            .serverError('Validation error occurred')
            .send(res);
    }
};

/**
 * Validate file uploads
 */
export const validateFileUploads = (req, res, next) => {
    try {
        const files = req.files || {};
        const errors = [];

        // Define allowed file types
        const allowedMimeTypes = [
            'image/jpeg', 'image/jpg', 'image/png', 'image/gif',
            'application/pdf', 'application/msword', 
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        ];

        // Define max file size (5MB)
        const maxFileSize = 5 * 1024 * 1024;

        // Check each uploaded file
        Object.keys(files).forEach(fieldName => {
            const fileArray = files[fieldName];
            fileArray.forEach(file => {
                // Check file type
                if (!allowedMimeTypes.includes(file.mimetype)) {
                    errors.push(`Invalid file type for ${fieldName}. Allowed types: JPG, PNG, GIF, PDF, DOC, DOCX`);
                }

                // Check file size
                if (file.size > maxFileSize) {
                    errors.push(`File size too large for ${fieldName}. Maximum size: 5MB`);
                }
            });
        });

        if (errors.length > 0) {
            return GenericResponse
                .validationError(errors)
                .send(res);
        }

        next();
    } catch (error) {
        console.error('File validation error:', error);
        return GenericResponse
            .serverError('File validation error occurred')
            .send(res);
    }
};