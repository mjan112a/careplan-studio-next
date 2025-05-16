/**
 * Utility script to identify files still using direct logger calls instead of helper functions
 * Also checks for console.log/warn/error usage that should be replaced
 * 
 * Usage: node scripts/logger-migration.js
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Define patterns to search for
const directLoggerCalls = [
  'logger.debug',
  'logger.info',
  'logger.warn',
  'logger.error'
];

const consoleCalls = [
  'console.log',
  'console.info',
  'console.warn',
  'console.error'
];

// Paths to skip
const excludeDirs = [
  'node_modules',
  '.next',
  '.git',
  'scripts',
  'lib/logging',
  'utils/logger-migration.js'
];

// Execute grep to find logger usage
try {
  console.log('Scanning codebase for direct logger and console usage...\n');
  
  // Create results object
  const results = {
    debug: [],
    info: [],
    warn: [],
    error: []
  };

  // For console usage
  const consoleResults = {
    log: [],
    info: [],
    warn: [],
    error: []
  };

  // Search for each logger pattern
  directLoggerCalls.forEach(pattern => {
    const level = pattern.split('.')[1];
    
    try {
      const grepCmd = `grep -r "${pattern}" --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" . | grep -v "${excludeDirs.join('\\|')}"`;
      const output = execSync(grepCmd, { encoding: 'utf8' });
      
      if (output) {
        const matches = output.split('\n').filter(Boolean);
        results[level] = matches.map(line => {
          const [file, content] = line.split(':', 2);
          return { file, content: content.trim() };
        });
      }
    } catch (err) {
      // grep returns non-zero exit code if no matches found
      if (err.status !== 1) {
        console.error(`Error searching for ${pattern}:`, err.message);
      }
    }
  });

  // Search for each console pattern
  consoleCalls.forEach(pattern => {
    const level = pattern.split('.')[1];
    
    try {
      const grepCmd = `grep -r "${pattern}" --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" . | grep -v "${excludeDirs.join('\\|')}"`;
      const output = execSync(grepCmd, { encoding: 'utf8' });
      
      if (output) {
        const matches = output.split('\n').filter(Boolean);
        consoleResults[level] = matches.map(line => {
          const [file, content] = line.split(':', 2);
          return { file, content: content.trim() };
        });
      }
    } catch (err) {
      // grep returns non-zero exit code if no matches found
      if (err.status !== 1) {
        console.error(`Error searching for ${pattern}:`, err.message);
      }
    }
  });

  // Generate summary for logger calls
  console.log('Files using direct logger calls:');
  console.log('===============================\n');
  
  let totalLoggerIssues = 0;
  Object.entries(results).forEach(([level, matches]) => {
    if (matches.length > 0) {
      console.log(`\n${level.toUpperCase()} (${matches.length} occurrences):`);
      console.log('-'.repeat(level.length + 14));
      
      const fileGroups = {};
      matches.forEach(match => {
        if (!fileGroups[match.file]) {
          fileGroups[match.file] = [];
        }
        fileGroups[match.file].push(match.content);
      });

      Object.entries(fileGroups).forEach(([file, contents]) => {
        console.log(`\n${file} (${contents.length} calls):`);
        contents.forEach((content, i) => {
          console.log(`  ${i+1}. ${content}`);
        });
      });
      
      totalLoggerIssues += matches.length;
    }
  });

  console.log('\n===============================');
  console.log(`Found ${totalLoggerIssues} direct logger calls that should be migrated.`);

  // Generate summary for console calls
  console.log('\n\nFiles using console methods:');
  console.log('===========================\n');
  
  let totalConsoleIssues = 0;
  Object.entries(consoleResults).forEach(([level, matches]) => {
    if (matches.length > 0) {
      console.log(`\n${level.toUpperCase()} (${matches.length} occurrences):`);
      console.log('-'.repeat(level.length + 14));
      
      const fileGroups = {};
      matches.forEach(match => {
        if (!fileGroups[match.file]) {
          fileGroups[match.file] = [];
        }
        fileGroups[match.file].push(match.content);
      });

      Object.entries(fileGroups).forEach(([file, contents]) => {
        console.log(`\n${file} (${contents.length} calls):`);
        contents.forEach((content, i) => {
          console.log(`  ${i+1}. ${content}`);
        });
      });
      
      totalConsoleIssues += matches.length;
    }
  });

  console.log('\n===========================');
  console.log(`Found ${totalConsoleIssues} console method calls that should be migrated.`);

  // Provide migration instructions
  console.log('\n\nMigration Instructions:');
  console.log('====================');
  
  if (totalLoggerIssues > 0) {
    console.log('\nFor direct logger calls:');
    console.log('1. Replace logger.debug(...) with logDebug(...)');
    console.log('2. Replace logger.info(...) with logInfo(...)');
    console.log('3. Replace logger.warn(...) with logWarn(...)');
    console.log('4. Replace logger.error(...) with logError(...)');
  }

  if (totalConsoleIssues > 0) {
    console.log('\nFor console method calls:');
    console.log('1. Replace console.log(...) with logDebug(...) or logInfo(...) depending on importance');
    console.log('2. Replace console.info(...) with logInfo(...)');
    console.log('3. Replace console.warn(...) with logWarn(...)');
    console.log('4. Replace console.error(...) with logError(error, contextData)');
  }

  if (totalLoggerIssues > 0 || totalConsoleIssues > 0) {
    console.log('\nMake sure to update imports to include the helper functions:');
    console.log(`import { logDebug, logInfo, logWarn, logError } from '@/lib/logging';`);
  } else {
    console.log('\nGreat! All logging calls are using the helper functions.');
  }

  // Total issues
  if (totalLoggerIssues > 0 || totalConsoleIssues > 0) {
    console.log(`\nTotal issues to fix: ${totalLoggerIssues + totalConsoleIssues}`);
  }

} catch (error) {
  console.error('Error scanning files:', error);
  process.exit(1);
} 