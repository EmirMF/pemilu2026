'use client';

import { useState } from 'react';

export default function BulkImportDPT() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.type !== 'text/csv' && !selectedFile.name.endsWith('.csv')) {
        setError('Please select a CSV file');
        return;
      }
      setFile(selectedFile);
      setError('');
      setResult(null);
    }
  };

  const parseCSV = (text: string): Array<{ nim: string; name?: string }> => {
    const lines = text.split('\n').filter(line => line.trim());
    const voters: Array<{ nim: string; name?: string }> = [];

    // Skip header if exists
    const startIndex = lines[0].toLowerCase().includes('nim') ? 1 : 0;

    for (let i = startIndex; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const parts = line.split(',').map(p => p.trim().replace(/['"]/g, ''));
      if (parts[0]) {
        voters.push({
          nim: parts[0],
          name: parts[1] || undefined
        });
      }
    }

    return voters;
  };

  const handleImport = async () => {
    if (!file) {
      setError('Please select a file');
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const text = await file.text();
      const voters = parseCSV(text);

      if (voters.length === 0) {
        setError('No valid data found in CSV file');
        setLoading(false);
        return;
      }

      const response = await fetch('/api/settings/whitelist/bulk-import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ voters })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Import failed');
      }

      setResult(data);
      setFile(null);
      // Reset file input
      const fileInput = document.getElementById('csv-file') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Import failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-neutral-900 rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold mb-4">Bulk Import DPT (CSV)</h2>
      
      <div className="space-y-4">
        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-blue-900 mb-2">Format CSV:</h3>
          <pre className="text-sm text-blue-800 bg-white dark:bg-neutral-900 p-2 rounded">
{`nim,name
13521001,John Doe
13521002,Jane Smith
13521003,Bob Johnson`}
          </pre>
          <p className="text-sm text-blue-700 mt-2">
            • First column: NIM (required)<br />
            • Second column: Name (optional)<br />
            • Header row is optional
          </p>
        </div>

        {/* File Input */}
        <div>
          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
            Select CSV File
          </label>
          <input
            id="csv-file"
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            className="block w-full text-sm text-neutral-500
              file:mr-4 file:py-2 file:px-4
              file:rounded-lg file:border-0
              file:text-sm file:font-semibold
              file:bg-orange-50 file:text-orange-700
              hover:file:bg-orange-100
              cursor-pointer"
          />
          {file && (
            <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
              Selected: {file.name} ({(file.size / 1024).toFixed(2)} KB)
            </p>
          )}
        </div>

        {/* Import Button */}
        <button
          onClick={handleImport}
          disabled={!file || loading}
          className="w-full px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:bg-neutral-300 disabled:cursor-not-allowed transition"
        >
          {loading ? 'Importing...' : 'Import DPT'}
        </button>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {/* Success Result */}
        {result && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h3 className="font-semibold text-green-900 mb-2">Import Successful!</h3>
            <div className="text-sm text-green-800 space-y-1">
              <p>✓ Created: {result.results.created}</p>
              <p>✓ Updated: {result.results.updated}</p>
              {result.results.failed > 0 && (
                <p className="text-red-600">✗ Failed: {result.results.failed}</p>
              )}
            </div>
            {result.results.errors && result.results.errors.length > 0 && (
              <div className="mt-3 max-h-40 overflow-y-auto">
                <p className="font-semibold text-red-700 mb-1">Errors:</p>
                {result.results.errors.map((err: string, idx: number) => (
                  <p key={idx} className="text-xs text-red-600">{err}</p>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
