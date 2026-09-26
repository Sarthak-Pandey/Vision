'use client';

import React, { useState, useRef, useEffect } from 'react';
import { UploadCloud, Image as ImageIcon, X, MapPin, Calendar, Folder, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { Toast } from '@/components/ui/Toast';
import { getProjects, uploadMediaFile, createAsset } from '@/lib/api/client';
import { Project, MediaAsset } from '@/types';

export interface UploadMediaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUploaded?: (asset: MediaAsset) => void;
  defaultProjectId?: string;
}

export const UploadMediaModal: React.FC<UploadMediaModalProps> = ({
  isOpen,
  onClose,
  onUploaded,
  defaultProjectId,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>(defaultProjectId || '');
  const [captureDate, setCaptureDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [latitude, setLatitude] = useState<string>('');
  const [longitude, setLongitude] = useState<string>('');
  const [uploadedBy, setUploadedBy] = useState<string>('Sarthak Pandey');

  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      loadProjects();
    }
  }, [isOpen]);

  useEffect(() => {
    if (defaultProjectId) {
      setSelectedProjectId(defaultProjectId);
    }
  }, [defaultProjectId]);

  const loadProjects = async () => {
    try {
      const data = await getProjects();
      setProjects(data);
      if (!selectedProjectId && data.length > 0) {
        setSelectedProjectId(data[0].id);
      }
    } catch (err: any) {
      console.error('Failed to load projects for upload modal:', err);
    }
  };

  const handleFileSelect = (file: File) => {
    if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
      setError('Please select an image or video file.');
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      setError('File size exceeds the 15MB limit.');
      return;
    }

    setError(null);
    setSelectedFile(file);

    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleRemoveFile = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setSelectedFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleGetLocation = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLatitude(position.coords.latitude.toFixed(6));
          setLongitude(position.coords.longitude.toFixed(6));
        },
        (err) => {
          setError(`Location access error: ${err.message}`);
        }
      );
    } else {
      setError('Geolocation is not supported by your browser.');
    }
  };

  const resetForm = () => {
    handleRemoveFile();
    setUploadProgress(0);
    setStatusMessage('');
    setError(null);
    setIsUploading(false);
  };

  const handleModalClose = () => {
    if (isUploading) return;
    resetForm();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      setError('Please choose or drop an image file.');
      return;
    }
    if (!selectedProjectId) {
      setError('Please assign the evidence to a project.');
      return;
    }

    let parsedLat: number | undefined = undefined;
    if (latitude.trim()) {
      const latVal = Number(latitude);
      if (!Number.isFinite(latVal) || latVal < -90 || latVal > 90) {
        setError('Latitude must be a valid number between -90 and 90.');
        return;
      }
      parsedLat = latVal;
    }

    let parsedLng: number | undefined = undefined;
    if (longitude.trim()) {
      const lngVal = Number(longitude);
      if (!Number.isFinite(lngVal) || lngVal < -180 || lngVal > 180) {
        setError('Longitude must be a valid number between -180 and 180.');
        return;
      }
      parsedLng = lngVal;
    }

    setError(null);
    setIsUploading(true);
    setUploadProgress(20);
    setStatusMessage('Uploading media to Cloudinary...');

    try {
      // Step 1: Upload to Cloudinary / storage pipeline
      const uploadRes = await uploadMediaFile(selectedFile);
      setUploadProgress(70);
      setStatusMessage('Saving asset record to database...');

      // Step 2: Register asset record in database
      const newAsset = await createAsset({
        project_id: selectedProjectId,
        cloudinary_public_id: uploadRes.public_id,
        url: uploadRes.url,
        type: selectedFile.type.startsWith('video') ? 'video' : 'image',
        capture_date: captureDate ? new Date(captureDate).toISOString() : new Date().toISOString(),
        latitude: parsedLat,
        longitude: parsedLng,
        uploaded_by: uploadedBy.trim() || undefined,
      });

      setUploadProgress(100);
      setStatusMessage('Upload complete!');
      setToastMessage('Evidence uploaded and saved successfully!');

      setTimeout(() => {
        resetForm();
        if (onUploaded) onUploaded(newAsset);
        onClose();
      }, 700);
    } catch (err: any) {
      setIsUploading(false);
      setUploadProgress(0);
      setStatusMessage('');
      setError(err.message || 'Failed to complete media upload pipeline.');
    }
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={handleModalClose}
        title="Upload Field Evidence"
        description="Ingest visual evidence into the Cloudinary pipeline and record metadata in Supabase."
        className="max-w-xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-status-error font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Drag & Drop Upload Zone or Preview */}
          {!selectedFile ? (
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center ${
                isDragging
                  ? 'border-brand-primary bg-brand-primary/5'
                  : 'border-border hover:border-brand-primary/60 hover:bg-slate-50/50'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,video/*"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleFileSelect(e.target.files[0]);
                  }
                }}
                className="hidden"
              />
              <div className="w-12 h-12 rounded-full bg-brand-primary/10 text-brand-primary flex items-center justify-center mb-3">
                <UploadCloud className="w-6 h-6" />
              </div>
              <p className="text-sm font-semibold text-primary-text">
                Click to upload or drag & drop evidence
              </p>
              <p className="text-xs text-secondary-text mt-1">
                PNG, JPG, WEBP, or MP4 (Max 15MB)
              </p>
            </div>
          ) : (
            <div className="relative border border-border rounded-2xl p-3 bg-secondary-bg/30">
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-xl overflow-hidden bg-slate-200 shrink-0 border border-border flex items-center justify-center">
                  {previewUrl && (
                    selectedFile.type.startsWith('video/') ? (
                      <video
                        src={previewUrl}
                        className="w-full h-full object-cover"
                        controls={false}
                        muted
                        playsInline
                      />
                    ) : (
                      <img
                        src={previewUrl}
                        alt="Upload preview"
                        className="w-full h-full object-cover"
                      />
                    )
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-primary-text truncate">
                    {selectedFile.name}
                  </p>
                  <p className="text-xs text-secondary-text mt-0.5">
                    {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB • {selectedFile.type || 'image'}
                  </p>
                  <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-medium mt-1">
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>Ready for ingestion</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleRemoveFile}
                  disabled={isUploading}
                  className="p-1.5 text-secondary-text hover:text-status-error hover:bg-red-50 rounded-lg transition-colors"
                  aria-label="Remove selected file"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Upload Progress Bar */}
          {isUploading && (
            <div className="p-3 bg-brand-primary/5 border border-brand-primary/20 rounded-xl space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-primary-text">
                <span className="flex items-center gap-1.5">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-brand-primary" />
                  {statusMessage}
                </span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-brand-primary transition-all duration-300 rounded-full"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Form Metadata Fields */}
          <div className="space-y-3 pt-1">
            <div>
              <label className="block text-xs font-semibold text-primary-text mb-1 flex items-center gap-1.5">
                <Folder className="w-3.5 h-3.5 text-secondary-text" />
                <span>Target Project *</span>
              </label>
              <Select
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                options={
                  projects.length > 0
                    ? projects.map((p) => ({ value: p.id, label: p.name }))
                    : [{ value: '', label: 'No projects available' }]
                }
                disabled={isUploading}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-primary-text mb-1 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-secondary-text" />
                  <span>Capture Date</span>
                </label>
                <Input
                  type="date"
                  value={captureDate}
                  onChange={(e) => setCaptureDate(e.target.value)}
                  disabled={isUploading}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-primary-text mb-1">
                  Uploaded By
                </label>
                <Input
                  placeholder="e.g. Sarthak Pandey"
                  value={uploadedBy}
                  onChange={(e) => setUploadedBy(e.target.value)}
                  disabled={isUploading}
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-primary-text flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-secondary-text" />
                  <span>Geo-Coordinates (GPS)</span>
                </label>
                <button
                  type="button"
                  onClick={handleGetLocation}
                  disabled={isUploading}
                  className="text-xs text-brand-primary hover:underline font-medium"
                >
                  Detect Current GPS
                </button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Input
                  placeholder="Latitude (e.g. 28.6139)"
                  value={latitude}
                  onChange={(e) => setLatitude(e.target.value)}
                  disabled={isUploading}
                />
                <Input
                  placeholder="Longitude (e.g. 77.2090)"
                  value={longitude}
                  onChange={(e) => setLongitude(e.target.value)}
                  disabled={isUploading}
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
            <Button
              type="button"
              variant="outline"
              onClick={handleModalClose}
              disabled={isUploading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              isLoading={isUploading}
              disabled={isUploading || !selectedFile}
              className="gap-2"
            >
              <UploadCloud className="w-4 h-4" />
              <span>Ingest Evidence</span>
            </Button>
          </div>
        </form>
      </Modal>

      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50">
          <Toast
            message={toastMessage}
            type="success"
            onClose={() => setToastMessage(null)}
          />
        </div>
      )}
    </>
  );
};
