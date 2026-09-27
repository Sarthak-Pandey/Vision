'use client';

import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Button } from '@/components/ui/Button';
import { updateProject } from '@/lib/api/client';
import { Toast } from '@/components/ui/Toast';
import { Project } from '@/types';

export interface EditProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project;
  onUpdated?: (updatedProject: Project) => void;
}

export const EditProjectModal: React.FC<EditProjectModalProps> = ({
  isOpen,
  onClose,
  project,
  onUpdated,
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    if (project) {
      setName(project.name || '');
      setDescription(project.description || '');
      setLocation(project.location || '');
      setStartDate(project.start_date ? project.start_date.split('T')[0] : '');
      setEndDate(project.end_date ? project.end_date.split('T')[0] : '');
    }
  }, [project, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedName = name.trim();
    if (!trimmedName) {
      setError('Project name is required and cannot be blank.');
      return;
    }

    if (trimmedName.length > 150) {
      setError('Project name must not exceed 150 characters.');
      return;
    }

    if (description.trim().length > 1000) {
      setError('Description must not exceed 1000 characters.');
      return;
    }

    if (location.trim().length > 200) {
      setError('Location must not exceed 200 characters.');
      return;
    }

    if (startDate && endDate) {
      const start = new Date(startDate).getTime();
      const end = new Date(endDate).getTime();
      if (!isNaN(start) && !isNaN(end) && end < start) {
        setError('End date cannot be earlier than start date.');
        return;
      }
    }

    try {
      setIsLoading(true);
      const updated = await updateProject(project.id, {
        name: trimmedName,
        description: description.trim() || undefined,
        location: location.trim() || undefined,
        start_date: startDate || undefined,
        end_date: endDate || undefined,
      });

      setToastMessage('Project updated successfully!');
      setTimeout(() => {
        setIsLoading(false);
        if (onUpdated) onUpdated(updated);
        onClose();
      }, 500);
    } catch (err: any) {
      setIsLoading(false);
      setError(err.message || 'Failed to update project details.');
    }
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="Edit Project"
        description="Update metadata and configuration for this impact project."
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-status-error font-medium">
              {error}
            </div>
          )}

          <Input
            label="Project Name *"
            placeholder="e.g. Yamuna Restoration"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

          <Textarea
            label="Description"
            placeholder="Brief overview of project scope, goals, and field metrics..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
          />

          <Input
            label="Location"
            placeholder="e.g. Delhi"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Start Date"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
            <Input
              label="End Date"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isLoading}>
              Save Changes
            </Button>
          </div>
        </form>
      </Modal>

      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50">
          <Toast message={toastMessage} type="success" onClose={() => setToastMessage(null)} />
        </div>
      )}
    </>
  );
};
