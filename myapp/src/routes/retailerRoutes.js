import { Router } from 'express';
import { retailerSignup } from '../controllers/authController.js';
import { validateRetailerSignup } from '../middlewares/authMiddleware.js';

const r=Router();
r.post('/retailer/signup', 
    // File upload middleware for documents
    upload.fields([
        { name: 'storeGSTINCertificate', maxCount: 1 },
        { name: 'storeRegisterDoc', maxCount: 1 },
        { name: 'retailerAadharDoc', maxCount: 1 },
        { name: 'retailerPANDoc', maxCount: 1 }
    ]),
    // Validation middleware
    validateRetailerSignup,
    // Controller
    retailerSignup
);
export default r;