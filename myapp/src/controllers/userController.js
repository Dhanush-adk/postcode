import { findUserById } from '../models/userModel.js';
import { AppError }     from '../utils/AppError.js';

export const getProfile = async (req, res, next) => {
  try {
    const user = await findUserById(req.user.user_id);
    if (!user) throw new AppError('User not found', 404);

    res.json({
      statusCode: 200,
      statusMessage: 'OK',
      data: user
    });
  } catch (err) { next(err); }
};
