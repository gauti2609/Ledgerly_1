

import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { read, utils } from 'xlsx';
// FIX: Add file extensions to fix module resolution errors.
import { TrialBalanceItem } from '../types.ts';
import { CloseIcon, UploadIcon, DownloadIcon } from './icons.tsx';
import { downloadSampleTBFormat } from '../services/exportService.ts';

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (data: Omit<TrialBalanceItem, 'id' | 'isMapped' | 'majorHeadCode' | 'minorHeadCode' | 'groupingCode'>[]) => void;
}

export const ImportModal: React.FC<ImportModalProps> = ({ isOpen, onClose, onImport }) => {
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0]);
      setError(null);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx']
    },
    multiple: false,
  });

  const processData = (headers: string[], rows: any[]) => {
    const normalizedHeaders = headers.map(h => String(h).trim().toLowerCase().replace(/\s/g, ''));
    const ledgerIndex = normalizedHeaders.indexOf('ledger');
    const closingCyIndex = normalizedHeaders.indexOf('closingcy');
    const closingPyIndex = normalizedHeaders.indexOf('closingpy');

    if (ledgerIndex === -1 || closingCyIndex === -1) {
      throw new Error('File must contain "ledger" and "closingCy" columns.');
    }

    return rows.map((row, i) => {
      const ledger = row[ledgerIndex]?.toString().trim();
      const closingCy = parseFloat(row[closingCyIndex]?.toString().trim());
      const closingPy = closingPyIndex > -1 ? parseFloat(row[closingPyIndex]?.toString().trim()) : 0;

      if (!ledger || isNaN(closingCy)) {
        throw new Error(`Invalid data found in row ${i + 2}. Check ledger and closingCy columns.`);
      }
      return { ledger, closingCy, closingPy: isNaN(closingPy) ? 0 : closingPy, noteLineItemId: null };
    });
  };

  const handleImport = () => {
    if (!file) {
      setError('Please select a file to import.');
      return;
    }

    const reader = new FileReader();

    if (file.name.endsWith('.xlsx')) {
      reader.onload = (event) => {
        try {
          const arrayBuffer = event.target?.result as ArrayBuffer;
          const workbook = read(arrayBuffer, { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = utils.sheet_to_json(worksheet, { header: 1 }) as any[][];

          if (jsonData.length < 2) {
            throw new Error('File appears to be empty or missing headers.');
          }

          const headers = jsonData[0] as string[];
          const rows = jsonData.slice(1).filter(row => row.length > 0);

          const data = processData(headers, rows);

          // Validation: Check if TB is balanced
          const totalCy = data.reduce((sum, item) => sum + item.closingCy, 0);
          const totalPy = data.reduce((sum, item) => sum + (item.closingPy || 0), 0);

          if (Math.abs(totalCy) > 1.0) {
            throw new Error(`Trial Balance (CY) is not balanced. Difference: ${totalCy.toFixed(2)}`);
          }
          if (Math.abs(totalPy) > 1.0) {
            // Optional: Warning for PY or Block? Let's block for data integrity.
            throw new Error(`Trial Balance (PY) is not balanced. Difference: ${totalPy.toFixed(2)}`);
          }

          onImport(data);
          onClose();
        } catch (e: any) {
          setError(e.message || 'Failed to parse XLSX file.');
        }
      };
      reader.readAsArrayBuffer(file);
    } else {
      // CSV Data Parse
      reader.onload = (event) => {
        try {
          const csvText = event.target?.result as string;
          const rawRows = csvText.split('\n').filter(row => row.trim() !== '');
          const headers = rawRows[0].split(',');
          // Prepare rows as array of arrays (string values) to match processData signature
          const rows = rawRows.slice(1).map(r => r.split(','));

          const data = processData(headers, rows);

          onImport(data);
          onClose();
        } catch (e: any) {
          setError(e.message || 'Failed to parse CSV file.');
        }
      };
      reader.readAsText(file);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-900/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-800 rounded-lg shadow-2xl border border-gray-700 w-full max-w-lg">
        <header className="p-4 border-b border-gray-700 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-100">Import Trial Balance</h2>
          <button onClick={onClose} className="p-1 rounded-full text-gray-400 hover:bg-gray-700 hover:text-white transition-colors">
            <CloseIcon className="w-6 h-6" />
          </button>
        </header>
        <main className="p-6">
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${isDragActive ? 'border-brand-blue bg-brand-blue/10' : 'border-gray-600 hover:border-gray-500'
              }`}
          >
            <input {...getInputProps()} />
            <UploadIcon className="w-12 h-12 mx-auto text-gray-500 mb-2" />
            {file ? (
              <p className="text-gray-300">File selected: <span className="font-semibold">{file.name}</span></p>
            ) : (
              <p className="text-gray-400">Drag & drop CSV or XLSX file, or click to select.</p>
            )}
            <p className="text-xs text-gray-500 mt-2">Required columns: 'ledger', 'closingCy'. Optional: 'closingPy'.</p>
          </div>
          {error && <p className="text-red-400 text-sm mt-4">{error}</p>}
        </main>
        <footer className="p-4 bg-gray-800/50 border-t border-gray-700 flex justify-between items-center">
          <button onClick={downloadSampleTBFormat} className="text-brand-blue-light hover:text-white text-sm flex items-center">
            <DownloadIcon className="w-4 h-4 mr-1" /> Download Sample
          </button>
          <div className="flex space-x-3">
            <button onClick={onClose} className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded-md transition-colors text-sm">
              Cancel
            </button>
            <button onClick={handleImport} disabled={!file} className="bg-brand-blue hover:bg-brand-blue-dark disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold py-2 px-4 rounded-md transition-colors text-sm">
              Import Data
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
};