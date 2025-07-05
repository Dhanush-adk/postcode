import { GenericResponse } from '../models/GenericResponse.js';
import Store from '../modules/Store.js';
import Retailer from '../modules/Retailer.js';

/**
 * Retailer Signup Controller
 * Handles retailer registration with store details
 */
export const retailerSignup = async (req, res, next) => {
    try {
        const { storeDetails, retailerDetails } = req.body;
        
        // Check if required data is provided
        if (!storeDetails || !retailerDetails) {
            return GenericResponse
                .error('Both store details and retailer details are required')
                .send(res);
        }

        // Handle uploaded files
        const files = req.files || {};
        
        // Add file paths to store details if files were uploaded
        if (files.storeGSTINCertificate) {
            storeDetails.storeGSTINCertificate = files.storeGSTINCertificate[0].path;
        }
        if (files.storeRegisterDoc) {
            storeDetails.storeRegisterDoc = files.storeRegisterDoc[0].path;
        }
        
        // Add file paths to retailer details if files were uploaded
        if (files.retailerAadharDoc) {
            retailerDetails.retailerAadharDoc = files.retailerAadharDoc[0].path;
        }
        if (files.retailerPANDoc) {
            retailerDetails.retailerPANDoc = files.retailerPANDoc[0].path;
        }

        // Create store instance and validate
        const store = new Store(storeDetails);
        const storeValidation = store.validate();
        
        if (!storeValidation.isValid) {
            return GenericResponse
                .validationError(storeValidation.errors)
                .send(res);
        }

        // Create retailer instance and validate
        const retailer = new Retailer(retailerDetails);
        const retailerValidation = retailer.validate();
        
        if (!retailerValidation.isValid) {
            return GenericResponse
                .validationError(retailerValidation.errors)
                .send(res);
        }

        // Hash password if provided
        if (retailerDetails.password) {
            await retailer.hashPassword(retailerDetails.password);
        }

        // TODO: Check if retailer email or phone already exists in database
        // const existingRetailer = await checkExistingRetailer(retailer.retailerEmail, retailer.retailerPhoneNum);
        // if (existingRetailer) {
        //     return GenericResponse
        //         .error('Retailer with this email or phone number already exists')
        //         .send(res);
        // }

        // TODO: Check if store email already exists in database
        // const existingStore = await checkExistingStore(store.storeEmail);
        // if (existingStore) {
        //     return GenericResponse
        //         .error('Store with this email already exists')
        //         .send(res);
        // }

        // TODO: Save to database
        // Begin transaction
        // const savedStore = await saveStore(store);
        // retailer.storeId = savedStore.storeId; // Link retailer to store
        // const savedRetailer = await saveRetailer(retailer);
        // Commit transaction

        return GenericResponse
            .success(200, 'Retailer and store registered successfully')
            .send(res);

    } catch (error) {
        next(error);
    }
};

/**
 * Get Retailer Profile
 * @TODO: Implement after authentication middleware is ready
 */
export const getRetailerProfile = async (req, res, next) => {
    try {
        // TODO: Get retailer ID from authenticated user
        // const retailerId = req.user.retailerId;
        
        // TODO: Fetch retailer and store details from database
        // const retailer = await getRetailerById(retailerId);
        // const store = await getStoreByRetailerId(retailerId);
        
        return GenericResponse
            .success({ message: 'Profile endpoint - To be implemented' })
            .send(res);
            
    } catch (error) {
        console.error('Error getting retailer profile:', error);
        return next(error);
    }
};

/**
 * Update Retailer Profile
 * @TODO: Implement after authentication middleware is ready
 */
export const updateRetailerProfile = async (req, res, next) => {
    try {
        // TODO: Implement profile update logic
        return GenericResponse
            .success({ message: 'Profile update endpoint - To be implemented' })
            .send(res);
            
    } catch (error) {
        console.error('Error updating retailer profile:', error);
        return next(error);
    }
};

/**
 * Retailer Login
 * @TODO: Implement login logic with JWT
 */
export const retailerLogin = async (req, res, next) => {
    try {
        const { email, password } = req.body;
        
        if (!email || !password) {
            return GenericResponse
                .error('Email and password are required')
                .send(res);
        }

        // TODO: Implement login logic
        // const retailer = await getRetailerByEmail(email);
        // if (!retailer || !(await retailer.verifyPassword(password))) {
        //     return GenericResponse
        //         .unauthorized('Invalid credentials')
        //         .send(res);
        // }
        
        // TODO: Generate JWT token
        // const token = generateJWT(retailer);
        
        return GenericResponse
            .success({ message: 'Login endpoint - To be implemented' })
            .send(res);
            
    } catch (error) {
        console.error('Error in retailer login:', error);
        return next(error);
    }
};

/**
 * Helper function to check if retailer already exists
 * @TODO: Implement database query
 */
const checkExistingRetailer = async (email, phone) => {
    // TODO: Query database to check if retailer exists
    // return await db.query('SELECT * FROM retailers WHERE retailerEmail = ? OR retailerPhoneNum = ?', [email, phone]);
    return null;
};

/**
 * Helper function to check if store already exists
 * @TODO: Implement database query
 */
const checkExistingStore = async (email) => {
    // TODO: Query database to check if store exists
    // return await db.query('SELECT * FROM stores WHERE storeEmail = ?', [email]);
    return null;
};