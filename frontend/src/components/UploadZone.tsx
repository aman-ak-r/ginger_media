import React, { useState, useRef } from 'react';
import { UploadCloud } from 'lucide-react';

interface UploadZoneProps {
  onUpload: (file: File) => void;
}

export const UploadZone: React.FC<UploadZoneProps> = ({ onUpload }) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onUpload(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onUpload(e.target.files[0]);
    }
  };

  return (
    <div
      className={`glass-card upload-zone ${isDragOver ? 'dragover' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => fileInputRef.current?.click()}
    >
      <input
        type="file"
        ref={fileInputRef}
        style={{ display: 'none' }}
        accept="image/*"
        onChange={handleFileChange}
      />
      <div className="upload-icon">
        <UploadCloud size={32} />
      </div>
      <h2 style={{ fontSize: '18px', fontWeight: 600 }}>Drag & Drop Vehicle Image</h2>
      <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
        Accepts JPEGs, PNGs, and WebPs up to 10MB
      </p>
      <button
        className="upload-btn"
        onClick={(e) => {
          e.stopPropagation(); // Avoid triggering the parent div click
          fileInputRef.current?.click();
        }}
      >
        Browse Local Storage
      </button>
    </div>
  );
};
