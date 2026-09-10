import { exec } from 'child_process';
import path from 'path';
import { promises as fs } from 'fs';
import { XMLParser } from 'fast-xml-parser';

// Configuration - Direct paths with correct structure
const BASE_DIR = path.join(process.cwd(), 'public');
const EXE_PATH = path.join(BASE_DIR, 'pclint', 'pclp64.exe');
const CONFIG_PATH = path.join(BASE_DIR, 'pclint', 'config', 'co-vs2019.lnt');
const MISRA_PATH = path.join(BASE_DIR, 'pclint', 'lnt', 'au-misra3.lnt');
const ENVXML_PATH = path.join(BASE_DIR, 'pclint', 'lnt', 'env-xml.lnt');
const SOURCE_PATH = path.join(BASE_DIR, 'temp_linter_files', 'example.c');
const OUTPUT_PATH = path.join(BASE_DIR, 'temp_linter_files', 'lint_report.xml');

// Ensure temp directory exists
async function ensureTempDir() {
  const tempDir = path.dirname(SOURCE_PATH);
  try {
    await fs.access(tempDir);
  } catch {
    await fs.mkdir(tempDir, { recursive: true });
  }
}

// XML parser configuration for PC-lint format
const xmlParser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  allowBooleanAttributes: true,
  parseNodeValue: true,
  parseAttributeValue: true,
  trimValues: true,
  isArray: (tagName, jPath, isLeafNode, isAttribute) => {
    return tagName === 'message';
  }
});

// Main lint function
export async function runPCLint(code) {
  try {
    await ensureTempDir();
    
    // Write code to temporary file
    await fs.writeFile(SOURCE_PATH, code, 'utf8');
    console.log('Done');
    
    
    // Build the command with correct paths
    const command = `"${EXE_PATH}" "${CONFIG_PATH}" "${MISRA_PATH}" "${ENVXML_PATH}" -wlib=4 -wlib=1 "${SOURCE_PATH}" > "${OUTPUT_PATH}"`;
    
    // Execute PC-lint from the pclint directory
    await executeCommand(command);
    
    // Parse and return results
    return await parseLintResults();
    
  } catch (error) {
    console.error('PC-lint error:', error);
    return { 
      error: error.message,
      messages: []
    };
  }
}

// Execute command from pclint directory
function executeCommand(command) {
  return new Promise((resolve, reject) => {
    exec(command, { cwd: path.join(BASE_DIR, 'pclint', 'config') }, (error, stdout, stderr) => {
      const isInformationalStderr = stderr && 
        (stderr.includes('PC-lint Plus') || 
         stderr.includes('LICENSED') ||
         stderr.includes('licensed for evaluation'));
      
      if (error && !isInformationalStderr) {
        reject(error);
      } else {
        resolve({ stdout, stderr });
      }
    });
  });
}

// Parse XML results
async function parseLintResults() {
  try {
    const xmlData = await fs.readFile(OUTPUT_PATH, 'utf8');
    
    if (!xmlData.trim()) {
      return { messages: [] };
    }
    
    const parsedData = xmlParser.parse(xmlData);
    
    if (!parsedData.doc || !parsedData.doc.message) {
      return { messages: [] };
    }
    
    const messages = parsedData.doc.message.map(msg => ({
      file: normalizePath(msg.file || ''),
      line: parseInt(msg.line) || 0,
      type: msg.type || 'unknown',
      code: msg.code?.toString() || '',
      desc: msg.desc || ''
    })).filter(msg => msg.desc);
    
    return { messages };
    
  } catch (parseError) {
    console.error('XML parse error:', parseError);
    return { 
      error: 'Failed to parse XML output',
      messages: []
    };
  }
}

// Normalize Windows paths
function normalizePath(filePath) {
  if (!filePath) return '';
  return filePath.replace(/\\/g, '/');
}