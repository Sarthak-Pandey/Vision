'use client';

import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { deleteProject } from '@/lib/api/client';
import { AlertTriangle } from 'lucide-react';
import { Project } from '@/types';

export interface DeleteProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project;
  onDeleted: () => void;
}

export const DeleteProjectModal: React.FC<DeleteProjectModalProps> = ({
  isOpen,
  onClose,
  project,
  onDeleted,
}) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      setError(null);
      await deleteProject(project.id);
      setIsDeleting(false);
      onDeleted();
    } catch (err: any) {
      setIsDeleting(false);
      setError(err.message || 'Failed to delete project');
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Delete Project">
      <div className="space-y-4">
        <div className="flex items-start gap-3 p-3 bg-red-50 border border-red-200 rounded-xl">
          <AlertTriangle className="w-5 h-5 text-status-error shrink-0 mt-0.5" />
          <div className="text-xs text-secondary-text space-y-1">
            <p className="font-semibold text-primary-text">
              Are you sure you want to delete &quot;{project.name}&quot;?
            </p>
            <p>
              This action will permanently delete the project and all associated media evidence and AI analysis records.
            </p>
          </div>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-status-error font-medium">
            {error}
          </div>
        )}

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
          <Button type="button" variant="outline" onClick={onClose} disabled={isDeleting}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="primary"
            className="bg-status-error hover:bg-red-700 text-white"
            onClick={handleDelete}
            isLoading={isDeleting}
          >
            Delete Project
          </Button>
        </div>
      </div>
    </Modal>
  );
};
