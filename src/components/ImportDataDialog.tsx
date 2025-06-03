import React, { useState } from 'react';
import axios from 'axios';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { useToast } from '@/hooks/use-toast';
import { API_URL } from '@/lib/url';

interface AssignDialogProps {
  open: boolean;
  onClose: () => void;
}

const ImportDataDialog = ({ open, onClose }: AssignDialogProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      const validExtensions = [
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-excel',
      ];
      if (!validExtensions.includes(selectedFile.type)) {
        toast({
          variant: 'destructive',
          title: 'Invalid file type',
          description: 'Only Excel files (.xlsx or .xls) are allowed.',
        });
        e.target.value = ''; // clear file input
        setFile(null);
        return;
      }
      setFile(selectedFile);
    }
    console.log('selected file:', selectedFile);
    console.log('file type:', selectedFile?.type);
    console.log('file name:', selectedFile?.name);
    console.log('file size:', selectedFile?.size);
  };

  const handleSubmit = async () => {
    if (!file) {
      toast({
        variant: 'destructive',
        title: 'No file selected',
        description: 'Please select an Excel file to import.',
      });
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    const token = localStorage.getItem('accessToken');
    if (!token) {
      toast({
        variant: 'destructive',
        title: 'Authentication error',
        description: 'Please log in to continue.',
      });
      return;
    }

    try {
      setIsUploading(true);
      await axios.post(`${API_URL}/api/bills/import/`, formData, {
        headers: {
          //   'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      toast({
        variant: 'default',
        title: 'Success',
        description: 'File uploaded successfully.',
      });
      onClose(); // close dialog
      setFile(null);
    } catch (error: unknown | string) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Something went wrong while uploading the file.';
      toast({
        variant: 'destructive',
        title: 'Upload failed',
        description: errorMessage,
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Import Excel Data</DialogTitle>
          <DialogDescription>
            Upload your Excel file to import invoice data.
          </DialogDescription>
        </DialogHeader>
        <div className='grid grid-cols-4 items-center gap-4'>
          <Label htmlFor='file' className='text-right'>
            File
          </Label>
          <div className='col-span-3'>
            <Input
              id='file'
              type='file'
              accept='.xls,.xlsx'
              onChange={handleFileChange}
              disabled={isUploading}
            />
          </div>
        </div>
        <div className='flex justify-end pt-4'>
          <Button
            onClick={handleSubmit}
            disabled={isUploading}
            className='w-full sm:w-auto cursor-pointer'
          >
            {isUploading ? 'Uploading...' : 'Upload'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ImportDataDialog;
