import { Router } from 'express';
import { authMiddleware } from '../middlewares/authMiddleware.js';
import {
  createAddress,
  listAddresses,
  updateAddress,
  removeAddress
} from '../controllers/addressController.js';

const router = Router();
router.use(authMiddleware);

router.post('/',      createAddress);
router.get('/',       listAddresses);
router.patch('/:id',  updateAddress);   // partial
router.put('/:id',    updateAddress);   // full
router.delete('/:id', removeAddress);

export default router;
