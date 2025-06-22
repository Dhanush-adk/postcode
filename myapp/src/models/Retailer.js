import bcrypt from 'bcrypt';

/**
 * Retailer Module
 * Handles retailer-related data and operations
 */
class Retailer {
    constructor({
        retailerId = null,
        retailerName,
        retailerType,
        retailerPhoneNum,
        retailerEmail,
        retailerAadhar,
        retailerPAN,
        retailerAadharDoc = null,
        retailerPANDoc = null,
        retailerPasswordHash = null
    }) {
        this.retailerId = retailerId;
        this.retailerName = retailerName;
        this.retailerType = retailerType;
        this.retailerPhoneNum = retailerPhoneNum;
        this.retailerEmail = retailerEmail;
        this.retailerAadhar = retailerAadhar;
        this.retailerPAN = retailerPAN;
        this.retailerAadharDoc = retailerAadharDoc;
        this.retailerPANDoc = retailerPANDoc;
        this.retailerPasswordHash = retailerPasswordHash;
        this.createdAt = new Date();
        this.updatedAt = new Date();
        this.isActive = true;
    }

    /**
     * Validate retailer data
     * @returns {Object} - Validation result with isValid boolean and errors array
     */
    validate() {
        const errors = [];

        // Required field validations
        if (!this.retailerName || this.retailerName.trim().length === 0) {
            errors.push('Retailer name is required');
        }

        if (!this.retailerType || this.retailerType.trim().length === 0) {
            errors.push('Retailer type is required');
        }

        if (!this.retailerPhoneNum || this.retailerPhoneNum.trim().length === 0) {
            errors.push('Retailer phone number is required');
        }

        if (!this.retailerEmail || this.retailerEmail.trim().length === 0) {
            errors.push('Retailer email is required');
        }

        if (!this.retailerAadhar || this.retailerAadhar.trim().length === 0) {
            errors.push('Retailer Aadhar number is required');
        }

        if (!this.retailerPAN || this.retailerPAN.trim().length === 0) {
            errors.push('Retailer PAN number is required');
        }

        // Format validations
        if (this.retailerEmail && !this.isValidEmail(this.retailerEmail)) {
            errors.push('Invalid retailer email format');
        }

        if (this.retailerPhoneNum && !this.isValidPhone(this.retailerPhoneNum)) {
            errors.push('Invalid retailer phone number format');
        }

        if (this.retailerAadhar && !this.isValidAadhar(this.retailerAadhar)) {
            errors.push('Invalid Aadhar number format');
        }

        if (this.retailerPAN && !this.isValidPAN(this.retailerPAN)) {
            errors.push('Invalid PAN number format');
        }

        return {
            isValid: errors.length === 0,
            errors: errors
        };
    }

    /**
     * Check if email is valid
     * @param {string} email - Email to validate
     * @returns {boolean} - True if valid, false otherwise
     */
    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    /**
     * Check if phone number is valid (Indian format)
     * @param {string} phone - Phone number to validate
     * @returns {boolean} - True if valid, false otherwise
     */
    isValidPhone(phone) {
        const phoneRegex = /^[6-9]\d{9}$/;
        return phoneRegex.test(phone.replace(/\D/g, ''));
    }

    /**
     * Check if Aadhar number is valid
     * @param {string} aadhar - Aadhar number to validate
     * @returns {boolean} - True if valid, false otherwise
     */
    isValidAadhar(aadhar) {
        const aadharRegex = /^[2-9]{1}[0-9]{3}[0-9]{4}[0-9]{4}$/;
        return aadharRegex.test(aadhar.replace(/\s/g, ''));
    }

    /**
     * Check if PAN number is valid
     * @param {string} pan - PAN number to validate
     * @returns {boolean} - True if valid, false otherwise
     */
    isValidPAN(pan) {
        const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
        return panRegex.test(pan.toUpperCase());
    }

    /**
     * Hash password
     * @param {string} password - Plain text password
     * @returns {Promise<string>} - Hashed password
     */
    async hashPassword(password) {
        if (!password) {
            throw new Error('Password is required');
        }
        
        const saltRounds = 12;
        this.retailerPasswordHash = await bcrypt.hash(password, saltRounds);
        return this.retailerPasswordHash;
    }

    /**
     * Verify password
     * @param {string} password - Plain text password to verify
     * @returns {Promise<boolean>} - True if password matches, false otherwise
     */
    async verifyPassword(password) {
        if (!this.retailerPasswordHash) {
            return false;
        }
        return await bcrypt.compare(password, this.retailerPasswordHash);
    }

    /**
     * Convert retailer instance to plain object (excluding sensitive data)
     * @param {boolean} includeSensitive - Whether to include sensitive data
     * @returns {Object} - Plain object representation
     */
    toObject(includeSensitive = false) {
        const obj = {
            retailerId: this.retailerId,
            retailerName: this.retailerName,
            retailerType: this.retailerType,
            retailerPhoneNum: this.retailerPhoneNum,
            retailerEmail: this.retailerEmail,
            retailerAadharDoc: this.retailerAadharDoc,
            retailerPANDoc: this.retailerPANDoc,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt,
            isActive: this.isActive
        };

        if (includeSensitive) {
            obj.retailerAadhar = this.retailerAadhar;
            obj.retailerPAN = this.retailerPAN;
            obj.retailerPasswordHash = this.retailerPasswordHash;
        }

        return obj;
    }

    /**
     * Get masked Aadhar number (show only last 4 digits)
     * @returns {string} - Masked Aadhar number
     */
    getMaskedAadhar() {
        if (!this.retailerAadhar) return '';
        return 'XXXX-XXXX-' + this.retailerAadhar.slice(-4);
    }

    /**
     * Get masked PAN number (show only last 4 characters)
     * @returns {string} - Masked PAN number
     */
    getMaskedPAN() {
        if (!this.retailerPAN) return '';
        return 'XXXXX' + this.retailerPAN.slice(-4);
    }

    /**
     * Update retailer data
     * @param {Object} updateData - Data to update
     */
    update(updateData) {
        Object.keys(updateData).forEach(key => {
            if (this.hasOwnProperty(key) && key !== 'retailerId' && key !== 'createdAt') {
                this[key] = updateData[key];
            }
        });
        this.updatedAt = new Date();
    }

    /**
     * Deactivate retailer account
     */
    deactivate() {
        this.isActive = false;
        this.updatedAt = new Date();
    }

    /**
     * Activate retailer account
     */
    activate() {
        this.isActive = true;
        this.updatedAt = new Date();
    }

    /**
     * Create retailer instance from database row
     * @param {Object} row - Database row object
     * @returns {Retailer} - Retailer instance
     */
    static fromDatabaseRow(row) {
        return new Retailer(row);
    }
}

export { Retailer };
export default Retailer;