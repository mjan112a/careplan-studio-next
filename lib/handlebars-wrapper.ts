// Add a declaration for the handlebars module
declare module 'handlebars/dist/handlebars.min.js';

// Import the browser-compatible version of Handlebars
import Handlebars from 'handlebars/dist/handlebars.min.js';
import { logger } from '@/lib/logging';

// Handlebars helper option type
interface HandlebarsHelperOptions {
  fn: (context: any) => string;
  inverse: (context: any) => string;
}

// Re-export the Handlebars instance
export default Handlebars;

// Add helper functions as needed
export function registerHelpers(): void {
  try {
    // Register any custom helpers here
    Handlebars.registerHelper('ifEquals', function(arg1: any, arg2: any, options: HandlebarsHelperOptions) {
      return (arg1 === arg2) ? options.fn(this) : options.inverse(this);
    });

    Handlebars.registerHelper('ifNotEquals', function(arg1: any, arg2: any, options: HandlebarsHelperOptions) {
      return (arg1 !== arg2) ? options.fn(this) : options.inverse(this);
    });

    logger.info('Handlebars helpers registered successfully');
  } catch (error) {
    logger.error('Failed to register Handlebars helpers', { error });
  }
} 