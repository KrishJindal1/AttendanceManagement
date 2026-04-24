import React, { useState, useRef } from 'react';
import { UploadCloud, CheckCircle, FileSpreadsheet, XCircle, Loader2 } from 'lucide-react';
import { apiService } from '../services/api';
import '../styles/FileUploader.css';

interface FileUploaderProps {
  onUploadSuccess: () => void;
}

const FileUploader: React.FC<FileUploaderProps> = ({ onUploadSuccess }) => {
  const [dragActive, setDragActive] = useState<boolean>(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');

  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const validateAndSetFile = (file: File) => {
    const validTypes = [
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/csv',
    ];

    if (validTypes.includes(file.type) || file.name.match(/\.(xlsx|xls|csv)$/i)) {
      setSelectedFile(file);
      setUploadStatus('idle');
      setErrorMessage('');
    } else {
      setUploadStatus('error');
      setErrorMessage('Invalid file type. Please upload an Excel (.xlsx, .xls) or CSV file.');
      setSelectedFile(null);
    }
  };

  const onButtonClick = () => {
    inputRef.current?.click();
  };

  const removeFile = () => {
    setSelectedFile(null);
    setUploadStatus('idle');
    if (inputRef.current) inputRef.current.value = '';
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    setUploadStatus('idle');

    try {
      await apiService.uploadExcel(selectedFile);
      setUploadStatus('success');
      setTimeout(() => {
        setSelectedFile(null);
        setUploadStatus('idle');
        onUploadSuccess();
        if (inputRef.current) inputRef.current.value = '';
      }, 2000);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'An error occurred during upload.';
      setUploadStatus('error');
      setErrorMessage(message);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="uploader-container animate-fade-in">
      <h3 className="import-panel-title">Import spreadsheet</h3>
      <div
        className={`drop-zone glass-panel-interactive ${dragActive ? 'drag-active' : ''} ${selectedFile ? 'has-file' : ''}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".xlsx,.xls,.csv"
          onChange={handleChange}
          className="file-input-hidden"
        />

        {!selectedFile ? (
          <div className="upload-prompt">
            <div className="upload-icon-wrapper">
              <UploadCloud size={48} className="text-accent" />
            </div>
            <h3>Drag &amp; drop your attendance file</h3>
            <p>or</p>
            <button type="button" className="btn-secondary" onClick={onButtonClick}>
              Browse files
            </button>
            <span className="file-hint">Supports .xlsx, .xls, .csv</span>
          </div>
        ) : (
          <div className="file-preview">
            <div className="file-info-header">
              <div className="file-icon bg-success-light">
                <FileSpreadsheet size={32} className="text-success" />
              </div>
              <div className="file-details">
                <p className="file-name">{selectedFile.name}</p>
                <p className="file-size">{(selectedFile.size / 1024).toFixed(2)} KB</p>
              </div>
              {!isUploading && (
                <button type="button" className="btn-remove" onClick={removeFile} aria-label="Remove file">
                  <XCircle size={20} />
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {uploadStatus === 'error' && (
        <div className="status-message error animate-fade-in">
          <XCircle size={18} />
          <span>{errorMessage}</span>
        </div>
      )}

      {uploadStatus === 'success' && (
        <div className="status-message success animate-fade-in">
          <CheckCircle size={18} />
          <span>Records uploaded successfully!</span>
        </div>
      )}

      <div className="upload-actions">
        <button
          type="button"
          className="btn-primary"
          disabled={!selectedFile || isUploading || uploadStatus === 'success'}
          onClick={handleUpload}
        >
          {isUploading ? (
            <>
              <Loader2 className="spinner" size={18} />
              Processing file…
            </>
          ) : (
            'Upload & process'
          )}
        </button>
      </div>
    </div>
  );
};

export default FileUploader;
