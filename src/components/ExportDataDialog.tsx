import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import axios from 'axios';
import { API_URL } from '@/lib/url';
import { Label } from './ui/label';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { cn } from '@/lib/utils';
import { CalendarIcon } from 'lucide-react';
import { Calendar } from './ui/calendar';
import { ErrorMessage, Formik, Form } from 'formik';
import * as Yup from 'yup';
import { format } from 'date-fns';

interface AssignDialogProps {
  open: boolean;
  onClose: () => void;
}

interface FormValues {
  start_date: string;
  end_date: string;
}

const ExportDataDialog: React.FC<AssignDialogProps> = ({ open, onClose }) => {
  const [startDateObj, setStartDateObj] = useState<Date | undefined>();
  const [endDateObj, setEndDateObj] = useState<Date | undefined>();

  useEffect(() => {
    const fetchEmployee = async () => {
      const token = localStorage.getItem('accessToken');
      if (!token) return;

      try {
        await axios.get<string>(`${API_URL}/api/auth/users/`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      } catch (error: unknown) {
        console.error('Error fetching employee:', error);
      }
    };

    fetchEmployee();
  }, []);

  const validationSchema = Yup.object().shape({
    start_date: Yup.string().required('Start date is required'),
    end_date: Yup.string()
      .required('End date is required')
      .test('is-after', 'End date must be after start date', function (value) {
        const { start_date } = this.parent;
        if (!start_date || !value) return true;
        const [sd, sm, sy] = start_date.split('-').map(Number);
        const [ed, em, ey] = value.split('-').map(Number);
        const start = new Date(sy, sm - 1, sd);
        const end = new Date(ey, em - 1, ed);
        return end >= start;
      }),
  });

  const initialValues: FormValues = {
    start_date: '',
    end_date: '',
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className='sm:max-w-lg'>
        <Formik
          initialValues={initialValues}
          validationSchema={validationSchema}
          onSubmit={(values) => {
            console.log('Export with:', values);
            onClose();
          }}
        >
          {({ setFieldValue, values }) => (
            <Form>
              <DialogHeader>
                <DialogTitle>Export the Invoice Data</DialogTitle>
                <DialogDescription>
                  Select Start Date & End Date
                </DialogDescription>
              </DialogHeader>

              {/* Start Date */}
              <div className='grid grid-cols-4 items-center gap-4'>
                <Label htmlFor='start_date' className='text-right'>
                  Start Date
                </Label>
                <div className='col-span-3'>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={'outline'}
                        className={cn(
                          'w-[240px] justify-start text-left font-normal',
                          !values.start_date && 'text-muted-foreground'
                        )}
                      >
                        <CalendarIcon className='mr-2 h-4 w-4' />
                        {values.start_date ? values.start_date : 'Pick a date'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className='w-auto p-0' align='start'>
                      <Calendar
                        mode='single'
                        selected={startDateObj}
                        onSelect={(selected) => {
                          setStartDateObj(selected);
                          if (selected) {
                            const formatted = format(selected, 'dd-MM-yyyy');
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
                    className='text-sm text-red-500'
                  />
                </div>
              </div>

              {/* End Date */}
              <div className='grid grid-cols-4 items-center gap-4 mt-4'>
                <Label htmlFor='end_date' className='text-right'>
                  End Date
                </Label>
                <div className='col-span-3'>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={'outline'}
                        className={cn(
                          'w-[240px] justify-start text-left font-normal',
                          !values.end_date && 'text-muted-foreground'
                        )}
                      >
                        <CalendarIcon className='mr-2 h-4 w-4' />
                        {values.end_date ? values.end_date : 'Pick a date'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className='w-auto p-0' align='start'>
                      <Calendar
                        mode='single'
                        selected={endDateObj}
                        onSelect={(selected) => {
                          setEndDateObj(selected);
                          if (selected) {
                            const formatted = format(selected, 'dd-MM-yyyy');
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
                    className='text-sm text-red-500'
                  />
                </div>
              </div>

              <DialogFooter className='mt-6'>
                <Button type='button' variant='outline' onClick={onClose}>
                  Cancel
                </Button>
                <Button type='submit'>Export</Button>
              </DialogFooter>
            </Form>
          )}
        </Formik>
      </DialogContent>
    </Dialog>
  );
};

export default ExportDataDialog;
