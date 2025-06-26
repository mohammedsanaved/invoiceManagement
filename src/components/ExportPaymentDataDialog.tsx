import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from './ui/label';
import { Popover, PopoverTrigger, PopoverContent } from './ui/popover';
import { Calendar } from './ui/calendar';
import { CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Formik, Form, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { format } from 'date-fns';
import { API_URL } from '@/lib/url';

interface ExportDataDialogProps {
  open: boolean;
  onClose: () => void;
}

/** Values sent to the export endpoint */
interface FormValues {
  start_date: string; // "yyyy-MM-dd"
  end_date: string; // "yyyy-MM-dd"
}

const ExportPaymentDataDialog: React.FC<ExportDataDialogProps> = ({
  open,
  onClose,
}) => {
  const [startDateObj, setStartDateObj] = useState<Date | undefined>();
  const [endDateObj, setEndDateObj] = useState<Date | undefined>();

  /** We require two dates; end_date must be ≥ start_date */
  const validationSchema = Yup.object<Partial<FormValues>>({
    start_date: Yup.date()
      .required('Start date is required')
      .typeError('Start date is invalid'),
    end_date: Yup.date()
      .required('End date is required')
      .typeError('End date is invalid')
      .min(
        Yup.ref('start_date'),
        'End date must be the same or after the start date'
      ),
  });

  const initialValues: FormValues = {
    start_date: '',
    end_date: '',
  };

  /**
   * Call the server to export bills between start_date and end_date.
   * If the status is 200, read response.blob() and force-download the file.
   */
  const handleExport = async (values: FormValues) => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      console.error('No access token found');
      return;
    }
    const { start_date, end_date } = values;

    try {
      const response = await fetch(
        `${API_URL}/api/bills/export-payments/?start_date=${encodeURIComponent(
          start_date
        )}&end_date=${encodeURIComponent(end_date)}`,
        {
          method: 'GET',
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (!response.ok) {
        console.error('Export failed', response.status, await response.text());
        return;
      }

      const blob = await response.blob();

      // 1) Build exactly the filename you want:
      const filename = `payments-${start_date}-to-${end_date}`;

      // 2) Trigger download
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename; // <-- your dynamic name
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error exporting data:', err);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className='sm:max-w-lg'>
        <Formik
          initialValues={initialValues}
          validationSchema={validationSchema}
          onSubmit={async (values, { setSubmitting }) => {
            setSubmitting(true);
            await handleExport(values);
            setSubmitting(false);
            onClose();
          }}
        >
          {({ values, setFieldValue, isSubmitting }) => (
            <Form>
              <DialogHeader>
                <DialogTitle>Export Payments Data</DialogTitle>
              </DialogHeader>

              {/* Start Date */}
              <div className='mt-4 grid grid-cols-4 items-center gap-4'>
                <Label htmlFor='start_date' className='text-right'>
                  Start Date
                </Label>
                <div className='col-span-3'>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant='outline'
                        className={cn(
                          'w-[240px] justify-start text-left font-normal',
                          !values.start_date && 'text-muted-foreground'
                        )}
                      >
                        <CalendarIcon className='mr-2 h-4 w-4' />
                        {values.start_date || 'Pick a date'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className='w-auto p-0' align='start'>
                      <Calendar
                        mode='single'
                        selected={startDateObj}
                        onSelect={(selected) => {
                          setStartDateObj(selected);
                          if (selected) {
                            const formatted = format(selected, 'yyyy-MM-dd');
                            setFieldValue('start_date', formatted);
                          }
                        }}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <ErrorMessage
                    name='start_date'
                    component='div'
                    className='text-sm text-red-500 mt-1'
                  />
                </div>
              </div>

              {/* End Date */}
              <div className='mt-4 grid grid-cols-4 items-center gap-4'>
                <Label htmlFor='end_date' className='text-right'>
                  End Date
                </Label>
                <div className='col-span-3'>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant='outline'
                        className={cn(
                          'w-[240px] justify-start text-left font-normal',
                          !values.end_date && 'text-muted-foreground'
                        )}
                      >
                        <CalendarIcon className='mr-2 h-4 w-4' />
                        {values.end_date || 'Pick a date'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className='w-auto p-0' align='start'>
                      <Calendar
                        mode='single'
                        selected={endDateObj}
                        onSelect={(selected) => {
                          setEndDateObj(selected);
                          if (selected) {
                            const formatted = format(selected, 'yyyy-MM-dd');
                            setFieldValue('end_date', formatted);
                          }
                        }}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <ErrorMessage
                    name='end_date'
                    component='div'
                    className='text-sm text-red-500 mt-1'
                  />
                </div>
              </div>

              {/* Footer */}
              <DialogFooter className='mt-6 flex justify-end space-x-2'>
                <Button
                  type='button'
                  variant='outline'
                  onClick={onClose}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button type='submit' disabled={isSubmitting}>
                  {isSubmitting ? 'Exporting...' : 'Export'}
                </Button>
              </DialogFooter>
            </Form>
          )}
        </Formik>
      </DialogContent>
    </Dialog>
  );
};

export default ExportPaymentDataDialog;
