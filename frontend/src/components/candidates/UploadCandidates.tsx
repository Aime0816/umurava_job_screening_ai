import React, { useCallback, useState, DragEvent } from 'react';
import { Button } from '../ui/Button';
import { ProgressBar } from '../ui/ProgressBar';
import { uploadApi } from '@/lib/api';
import { useAppDispatch } from '@/hooks/useRedux';
import { fetchCandidates } from '@/store/slices/candidatesSlice';

interface UploadResult {
  parsed: number;
  saved: number;
  failed: number;
  candidates: Array<{
    id: string;
    name: string;
    email: string;
    source: string;
  }>;
}

const UploadCandidates: React.FC = () => {
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<UploadResult | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const dispatch = useAppDispatch();

  const onDrop = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragActive(false);
    const droppedFiles = Array.from(e.dataTransfer.files).filter((file) =>
      ['application/pdf', 'text/csv', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'].includes(file.type)
    );
    setFiles(droppedFiles);
  }, []);

  const onDragOver = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragActive(true);
  }, []);

  const onFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files).filter((file) =>
        ['.pdf', '.csv', '.xlsx', '.xls'].includes(file.name.toLowerCase().slice(-4))
      );
      setFiles(selectedFiles);
    }
  }, []);

  const uploadFiles = useCallback(async () => {
    if (files.length === 0) return;

    const formData = new FormData();
    files.forEach((file) => formData.append('files', file));

    setUploading(true);
    setProgress(0);
    setResult(null);

    try {
      const response = await uploadApi.files(formData);
      setResult(response.data.data);
      dispatch(fetchCandidates()); // Refresh list
    } catch (error) {
      console.error('Upload failed:', error);
      setResult({
        parsed: 0,
        saved: 0,
        failed: files.length,
        candidates: [],
      });
    } finally {
      setUploading(false);
    }
  }, [files, dispatch]);

  return (
    <div className="p-6 bg-white rounded-lg shadow-md border border-gray-200 max-w-2xl mx-auto">
      <h3 className="text-lg font-semibold mb-4">📤 Upload Candidate CVs</h3>
      
      <div 
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200 cursor-pointer ${
          dragActive ? 'border-blue-400 bg-blue-50 ring-2 ring-blue-200' : 'border-gray-300 hover:border-gray-400'
        }`}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={() => setDragActive(false)}
      >
        <div className="mb-4">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 16l4-4m0 0l-4-4m4 4H7" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 4h18v12a1 1 0 01-1 1H4a1 1 0 01-1-1V4z" />
          </svg>
        </div>
        <p className="text-lg font-medium text-gray-900 mb-2">Drop PDF, CSV, Excel files here</p>
        <p className="text-sm text-gray-500 mb-4">or click to browse (max 20 files, 10MB each)</p>
        <input 
          type="file" 
          multiple 
          accept=".pdf,.csv,.xlsx,.xls" 
          onChange={onFileSelect}
          className="hidden"
          id="file-upload"
        />
        <label htmlFor="file-upload" className="cursor-pointer">
          <Button variant="outline" disabled={uploading}>Choose Files</Button>
        </label>
      </div>

      {files.length > 0 && (
        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
          <p className="font-medium mb-3">{files.length} file(s) selected:</p>
          <ul className="mt-2 space-y-1 max-h-20 overflow-y-auto">
            {files.map((file, i) => (
              <li key={i} className="text-sm flex items-center justify-between">
                <span className="truncate flex-1">{file.name}</span>
                <span className="text-xs text-gray-500">({(file.size / 1024 / 1024).toFixed(1)}MB)</span>
              </li>
            ))}
          </ul>
          <Button onClick={uploadFiles} disabled={uploading || files.length === 0} className="mt-4 w-full">
            {uploading ? 'Uploading...' : `Upload ${files.length} File${files.length > 1 ? 's' : ''}`}
          </Button>
        </div>
      )}

      {uploading && (
        <div className="mt-6">
          <ProgressBar label="Upload Progress" value={progress} />
          <p className="text-sm text-gray-600 text-center mt-2">Processing CVs... PDF parsing may take 30-60s.</p>
        </div>
      )}

      {result && (
        <div className="mt-6 p-4 bg-green-50 border-l-4 border-green-400 rounded-lg">
          <h4 className="font-semibold text-green-800 mb-3 flex items-center">
            ✅ Upload Complete
          </h4>
          <div className="grid grid-cols-3 gap-4 mb-4 text-sm">
            <div>Parsed: <span className="font-bold text-green-700">{result.parsed}</span></div>
            <div>Saved to DB: <span className="font-bold text-green-700">{result.saved}</span></div>
            <div>Failed: <span className="font-bold text-orange-600">{result.failed}</span></div>
          </div>
          {result.candidates.length > 0 && (
            <div className="mt-3">
              <p className="font-medium text-sm mb-2">New candidates added:</p>
              <div className="max-h-24 overflow-y-auto space-y-1">
                {result.candidates.slice(0,5).map((c, i) => (
                  <div key={i} className="text-xs bg-white p-2 rounded border flex justify-between">
                    <span>{c.name}</span>
                    <span className="font-mono text-[10px]">{c.email}</span>
                  </div>
                ))}
                {result.candidates.length > 5 && (
                  <div className="text-xs text-gray-500 text-center pt-1 border-t">... +{result.candidates.length - 5} more</div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default UploadCandidates;

