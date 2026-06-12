/**
 * Vercel Serverless Function Entry Point
 * 
 * Wraps the Express app as a Vercel serverless handler.
 * All /api/* routes are routed here by vercel.json.
 */
import app from '../backend/src/index.js';

export default app;
