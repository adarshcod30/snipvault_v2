/**
 * Vercel serverless entry point. Vercel imports the Express app as the request
 * handler for every route (see vercel.json rewrites); it never calls listen().
 */
export { app as default } from '../src/app.js';
