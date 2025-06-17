// import { Router } from 'express';
// import {
//   phoneInitiate, phoneVerify,
//   emailInitiate, emailVerify,
//   initiateLogin, verifyLogin,
//   refresh, closeSession, logout
// } from '../controllers/authController.js';
// import { authMiddleware } from '../middlewares/authMiddleware.js';

// const r = Router();

// /* phone flow */
// r.post('/phone/initiate', phoneInitiate);
// r.post('/phone/verify',   phoneVerify);

// /* email flow */
// r.post('/email/initiate', emailInitiate);
// r.post('/email/verify',   emailVerify);

// /* login with any verified channel */
// r.post('/login/initiate', initiateLogin);
// r.post('/login/verify',   verifyLogin);

// /* token refresh & logout */
// r.post('/session/refresh', authMiddleware, refresh);
// r.post('/session/close',   authMiddleware, closeSession);
// r.post('/logout',          authMiddleware, logout);

// export default r;

import { Router } from 'express';
import { initiate, verify,
         refreshToken, closeSession } from '../controllers/authController.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';

const r=Router();
r.post('/user/auth/initiate', initiate);
r.post('/user/auth/verify',   verify);
r.post('/user/auth/session/refresh', refreshToken);
r.post('/user/auth/session/close',   authMiddleware, closeSession);
export default r;
