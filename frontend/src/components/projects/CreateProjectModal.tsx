'use client';

import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Button } from '@/components/ui/Button';
import { createProject } from '@/lib/api/client';
import { Toast } from '@/components/ui/Toast';

export interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated?: () => void;
}

export const CreateProjectModal: React.FC<CreateProjectModalProps> = ({
  isOpen,
  onClose,
  onCreated,
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Project name is required');
      return;
    }

    try {
      setIsLoading(true);
      await createProject({
        name,
        description: description.trim() || undefined,
        location: location.trim() || undefined,
        start_date: startDate || undefined,
        end_date: endDate || undefined,
      });

      setToastMessage('Project created successfully!');
      setTimeout(() => {
        setName('');
        setDescription('');
        setLocation('');
        setStartDate('');
        setEndDate('');
        setIsLoading(false);
        if (onCreated) onCreated();
        onClose();
      }, 500);
    } catch (err: any) {
      setIsLoading(false);
      setError(err.message || 'Failed to create project');
    }
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="Create New Project"
        description="Fill in details to set up a new impact tracking project."
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
              Create Project
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
