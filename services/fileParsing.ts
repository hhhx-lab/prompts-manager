import mammoth from 'mammoth';
import * as XLSX from 'xlsx';
import { Attachment } from '../types';

export const MAX_ATTACHMENTS = 10;

export const readFile = (file: File, method: 'readAsArrayBuffer' | 'readAsDataURL' | 'readAsText'): Promise<any> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader[method](file);
  });
};

export const parseOptimizationAttachment = async (file: File): Promise<Attachment> => {
  const id = createId();
  const ext = getExtension(file.name);
  const attachment: Attachment = {
    id,
    data: '',
    mimeType: file.type,
    name: file.name,
    type: 'other'
  };

  if (file.type.startsWith('image/')) {
    attachment.type = 'image';
    attachment.data = await readFile(file, 'readAsDataURL');
  } else if (file.type === 'application/pdf') {
    attachment.type = 'pdf';
    attachment.data = await readFile(file, 'readAsDataURL');
  } else if (['docx'].includes(ext)) {
    attachment.type = 'word';
    attachment.mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    attachment.textContent = await extractWordText(file);
  } else if (['xls', 'xlsx', 'csv'].includes(ext)) {
    attachment.type = 'excel';
    attachment.textContent = await extractSpreadsheetText(file);
    if (!attachment.mimeType) attachment.mimeType = 'text/csv';
  } else if (['md', 'markdown'].includes(ext)) {
    attachment.type = 'markdown';
    attachment.mimeType = 'text/markdown';
    attachment.textContent = await readFile(file, 'readAsText');
  } else if (['txt'].includes(ext) || file.type.startsWith('text/')) {
    attachment.type = 'text';
    attachment.mimeType = file.type || 'text/plain';
    attachment.textContent = await readFile(file, 'readAsText');
  } else if (['json'].includes(ext) || file.type === 'application/json') {
    attachment.type = 'json';
    attachment.mimeType = 'application/json';
    attachment.textContent = await readFile(file, 'readAsText');
  }

  return attachment;
};

export const extractAssetText = async (file: File): Promise<string> => {
  const ext = getExtension(file.name);
  if (['md', 'markdown', 'txt', 'json'].includes(ext) || file.type.startsWith('text/')) {
    return readFile(file, 'readAsText');
  }
  if (ext === 'docx') return extractWordText(file);
  if (['xls', 'xlsx', 'csv'].includes(ext)) return extractSpreadsheetText(file);
  throw new Error('项目库导入仅支持 md、txt、json、docx、xlsx、xls、csv 文件');
};

const extractWordText = async (file: File): Promise<string> => {
  const arrayBuffer = await readFile(file, 'readAsArrayBuffer');
  const result = await mammoth.extractRawText({ arrayBuffer });
  return result.value;
};

const extractSpreadsheetText = async (file: File): Promise<string> => {
  if (getExtension(file.name) === 'csv') return readFile(file, 'readAsText');
  const arrayBuffer = await readFile(file, 'readAsArrayBuffer');
  const workbook = XLSX.read(arrayBuffer);
  return workbook.SheetNames.map(sheetName => {
    const worksheet = workbook.Sheets[sheetName];
    return `# ${sheetName}\n${XLSX.utils.sheet_to_csv(worksheet)}`;
  }).join('\n\n');
};

const getExtension = (name: string) => name.split('.').pop()?.toLowerCase() || '';

const createId = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
