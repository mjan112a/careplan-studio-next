import Handlebars from 'handlebars';
import { logger } from '@/lib/logging';

interface RenderOptions {
  template: string;
  replacements: Record<string, any>;
  warnOnMissing?: boolean;
}

// Helper to extract variable names from a template
function extractVariables(template: string): string[] {
  const matches = template.match(/\{\{([^}]+)\}\}/g) || [];
  return matches.map(match => {
    // Remove {{ and }} and any whitespace
    const varName = match.slice(2, -2).trim();
    // Remove any helper prefixes (like 'if', 'each', etc.)
    return varName.split(' ')[0];
  });
}

export function renderPrompt({ template, replacements, warnOnMissing = true }: RenderOptions): string {
  if (warnOnMissing) {
    // Extract all variables from the template
    const variables = extractVariables(template);
    
    // Check each variable against replacements
    variables.forEach(varName => {
      // Skip if the variable is a helper (starts with # or /)
      if (varName.startsWith('#') || varName.startsWith('/')) {
        return;
      }
      
      // Check if the variable exists in replacements
      if (!(varName in replacements)) {
        logger.warn(`Missing replacement for variable "${varName}" in template`);
      }
    });
  }

  try {
    const compiledTemplate = Handlebars.compile(template);
    return compiledTemplate(replacements);
  } catch (error) {
    logger.error('Error rendering prompt template', { 
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    throw new Error('Failed to render prompt template');
  }
} 