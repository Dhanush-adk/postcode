import awsServerlessExpress from '@vendia/serverless-express';
import app                 from './app.js';            // your Express instance

// The handler that Lambda & API Gateway will invoke
export const handler = awsServerlessExpress({ app });
