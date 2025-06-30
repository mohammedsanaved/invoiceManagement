// import React from 'react';
import { Dialog, DialogContent } from './ui/dialog';
import { Formik, Form, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import type { Invoice } from '@/types';
// import { API_URL } from '@/lib/url';
// import { useToast } from '../hooks/use-toast';

interface Cheque {
  id: number;
  cheque_status: 'pending' | 'cleared' | 'bounced';
  cheque?: Invoice;

  // ...other fields
}

interface ChequeStatusDataDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmitStatus: (status: 'cleared' | 'bounced') => void;
  cheque?: Cheque;
}

const ChequeStatusSchema = Yup.object().shape({
  cheque_status: Yup.string()
    .oneOf(['cleared', 'bounced'], 'Must select a valid new status')
    .required('Please select a status'),
});

export default function ChequeStatusDataDialog({
  open,
  onClose,
  onSubmitStatus,
  cheque,
}: ChequeStatusDataDialogProps) {
  // Only allow transitions from "pending"
  // const isPending = cheque?.cheque_status === 'pending';
  const options = [
    { value: 'pending', label: 'Pending' },
    { value: 'cleared', label: 'Cleared' },
    { value: 'bounced', label: 'Bounced' },
  ];
  console.log(cheque, 'changes values in Cheque');

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <h2 className='text-lg font-semibold mb-4'>Update Cheque Status</h2>

        <Formik
          initialValues={{
            cheque_status:
              cheque?.cheque_status === 'pending' ? '' : cheque?.cheque_status,
          }}
          validationSchema={ChequeStatusSchema}
          onSubmit={(values, { setSubmitting }) => {
            onSubmitStatus(values.cheque_status as 'cleared' | 'bounced');
            setSubmitting(false);
            onClose();
          }}
        >
          {({ values, setFieldValue, isSubmitting }) => (
            <Form className='space-y-6'>
              <div className='grid grid-cols-4 items-center gap-4'>
                <Label htmlFor='cheque_status' className='text-right'>
                  Cheque Status *
                </Label>
                <div className='col-span-3'>
                  <Select
                    value={values?.cheque_status}
                    onValueChange={(val) => setFieldValue('cheque_status', val)}
                  >
                    <SelectTrigger className='w-full'>
                      <SelectValue placeholder='Cheque Status' />
                    </SelectTrigger>
                    <SelectContent>
                      {options.map((emp) => (
                        <SelectItem
                          key={emp.value}
                          value={emp.value.toString()}
                        >
                          {emp.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <ErrorMessage
                    name='cheque_status'
                    component='div'
                    className='text-red-500 text-sm mt-1'
                  />
                </div>
              </div>

              <div className='flex justify-end space-x-2'>
                <Button
                  variant='outline'
                  type='button'
                  className='cursor-pointer'
                  onClick={onClose}
                >
                  Cancel
                </Button>
                <Button
                  type='submit'
                  className='cursor-pointer'
                  disabled={isSubmitting || !values.cheque_status}
                >
                  Update
                </Button>
              </div>
            </Form>
          )}
        </Formik>
      </DialogContent>
    </Dialog>
  );
}
