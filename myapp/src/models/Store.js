/**
 * Store Module
 * Handles store-related data and operations
 */
class Store {
    constructor({
        storeId = null,
        storeName,
        storeType,
        storeAddress,
        storeCity,
        storeState,
        storePincode,
        storeCountry,
        storeContact,
        storeEmail,
        storeGSTIN,
        storeGSTINCertificate = null,
        storeRegisterDoc = null
    }) {
        this.storeId = storeId;
        this.storeName = storeName;
        this.storeType = storeType;
        this.storeAddress = storeAddress;
        this.storeCity = storeCity;
        this.storeState = storeState;
        this.storePincode = storePincode;
        this.storeCountry = storeCountry;
        this.storeContact = storeContact;
        this.storeEmail = storeEmail;
        this.storeGSTIN = storeGSTIN;
        this.storeGSTINCertificate = storeGSTINCertificate;
        this.storeRegisterDoc = storeRegisterDoc;
        this.createdAt = new Date();
        this.updatedAt = new Date();
    }

    /**
     * Validate store data
     * @returns {Object} - Validation result with isValid boolean and errors array
     */
    validate() {
        const errors = [];

        // Required field validations
        if (!this.storeName || this.storeName.trim().length === 0) {
            errors.push('Store name is required');
        }

        if (!this.storeType || this.storeType.trim().length === 0) {
            errors.push('Store type is required');
        }

        if (!this.storeAddress || this.storeAddress.trim().length === 0) {
            errors.push('Store address is required');
        }

        if (!this.storeCity || this.storeCity.trim().length === 0) {
            errors.push('Store city is required');
        }

        if (!this.storeState || this.storeState.trim().length === 0) {
            errors.push('Store state is required');
        }

        if (!this.storePincode || this.storePincode.trim().length === 0) {
            errors.push('Store pincode is required');
        }

        if (!this.storeCountry || this.storeCountry.trim().length === 0) {
            errors.push('Store country is required');
        }

        if (!this.storeContact || this.storeContact.trim().length === 0) {
            errors.push('Store contact is required');
        }

        if (!this.storeEmail || this.storeEmail.trim().length === 0) {
            errors.push('Store email is required');
        }

        if (!this.storeGSTIN || this.storeGSTIN.trim().length === 0) {
            errors.push('Store GSTIN is required');
        }

        // Format validations
        if (this.storeEmail && !this.isValidEmail(this.storeEmail)) {
            errors.push('Invalid store email format');
        }

        if (this.storeContact && !this.isValidPhone(this.storeContact)) {
            errors.push('Invalid store contact number format');
        }

        if (this.storePincode && !this.isValidPincode(this.storePincode)) {
            errors.push('Invalid store pincode format');
        }

        if (this.storeGSTIN && !this.isValidGSTIN(this.storeGSTIN)) {
            errors.push('Invalid GSTIN format');
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
     * Check if pincode is valid (Indian format)
     * @param {string} pincode - Pincode to validate
     * @returns {boolean} - True if valid, false otherwise
     */
    isValidPincode(pincode) {
        const pincodeRegex = /^[1-9][0-9]{5}$/;
        return pincodeRegex.test(pincode);
    }

    /**
     * Check if GSTIN is valid
     * @param {string} gstin - GSTIN to validate
     * @returns {boolean} - True if valid, false otherwise
     */
    isValidGSTIN(gstin) {
        const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
        return gstinRegex.test(gstin);
    }

    /**
     * Convert store instance to plain object
     * @returns {Object} - Plain object representation
     */
    toObject() {
        return {
            storeId: this.storeId,
            storeName: this.storeName,
            storeType: this.storeType,
            storeAddress: this.storeAddress,
            storeCity: this.storeCity,
            storeState: this.storeState,
            storePincode: this.storePincode,
            storeCountry: this.storeCountry,
            storeContact: this.storeContact,
            storeEmail: this.storeEmail,
            storeGSTIN: this.storeGSTIN,
            storeGSTINCertificate: this.storeGSTINCertificate,
            storeRegisterDoc: this.storeRegisterDoc,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt
        };
    }

    /**
     * Update store data
     * @param {Object} updateData - Data to update
     */
    update(updateData) {
        Object.keys(updateData).forEach(key => {
            if (this.hasOwnProperty(key) && key !== 'storeId' && key !== 'createdAt') {
                this[key] = updateData[key];
            }
        });
        this.updatedAt = new Date();
    }

    /**
     * Create store instance from database row
     * @param {Object} row - Database row object
     * @returns {Store} - Store instance
     */
    static fromDatabaseRow(row) {
        return new Store(row);
    }
}

export { Store };
export default Store;