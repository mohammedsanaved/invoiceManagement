import React, { useEffect, useState } from 'react';
import { Formik, Form, Field, ErrorMessage, type FormikHelpers } from 'formik';
import * as Yup from 'yup';
import { useData } from '../context/DataContext';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { format } from 'date-fns';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { API_URL } from '@/lib/url';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { cn } from '@/lib/utils';
import { CalendarIcon } from 'lucide-react';
import { Calendar } from './ui/calendar';
import { useToast } from '../hooks/use-toast';
// import {
//   Command,
//   CommandEmpty,
//   CommandGroup,
//   CommandInput,
//   CommandItem,
//   CommandList,
// } from './ui/command';
// import OutletSelectorPopover from './SearchableDropdown';
import SearchableDropdown from './SearchableDropdown';

interface CreateInvoiceDialogProps {
  open: boolean;
  onClose: () => void;
}

const CreateInvoiceSchema = Yup.object().shape({
  invoice_date: Yup.string().required('Invoice Date is required'),
  route: Yup.number()
    .required('Route is required')
    .min(1, 'Please select a route'),
  outlet: Yup.number()
    .required('Outlet is required')
    .min(1, 'Please select an outlet'),
  invoice_number: Yup.string().required('Invoice number is required'),
  actual_amount: Yup.number()
    .required('Amount is required')
    .positive('Amount must be positive')
    .typeError('Amount must be a number'),
  brand: Yup.string().required('Brand is required'),
});

// This matches your API response for outlets:
interface Outlet {
  id: number;
  name: string;
  route: string;
}
interface OutletOptions {
  value: number;
  label: string;
}
interface Route {
  id: number;
  name: string;
}
interface InvoiceValues {
  route: number;
  outlet: number;
  invoice_number: string;
  invoice_date: string;
  actual_amount: number;
  brand: string;
}

export default function CreateInvoiceDialog({
  open,
  onClose,
}: CreateInvoiceDialogProps) {
  const { addInvoice } = useData();
  const { toast } = useToast();

  const [routeOptions, setRouteOptions] = useState<Route[]>([]);
  const [outletOptions, setOutletOptions] = useState<OutletOptions[]>([]);

  const [selectedRouteId, setSelectedRouteId] = useState<number | null>(null);
  const [date, setDate] = useState<Date | undefined>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [openCal, setOpenCal] = useState(false);
  // const [searchTerm, setSearchTerm] = useState('');

  // Fetch all routes when dialog opens
  useEffect(() => {
    if (!open) return;
    const fetchRoutes = async () => {
      const token = localStorage.getItem('accessToken');
      try {
        const res = await fetch(`${API_URL}/api/routes/`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data: Route[] = await res.json();
        setRouteOptions(data);
      } catch {
        toast({
          title: 'Error',
          description: 'Failed to fetch routes.',
          variant: 'destructive',
        });
      }
    };
    fetchRoutes();
  }, [open, toast]);

  // Fetch outlets whenever selectedRouteId changes
  useEffect(() => {
    if (selectedRouteId === null) return;
    const fetchOutlets = async () => {
      const token = localStorage.getItem('accessToken');
      try {
        const res = await fetch(
          `${API_URL}/api/routes/${selectedRouteId}/outlets/`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const data: Outlet[] = await res.json();
        const formatedOutlet = data.map((o) => ({
          value: o.id,
          label: o.name,
        }));
        setOutletOptions(formatedOutlet);
      } catch {
        toast({
          title: 'Error',
          description: 'Failed to fetch outlets.',
          variant: 'destructive',
        });
      }
    };
    fetchOutlets();
  }, [selectedRouteId, toast]);

  const handleSubmit = async (
    values: InvoiceValues,
    { resetForm }: FormikHelpers<InvoiceValues>
  ) => {
    try {
      setIsSubmitting(true);
      await addInvoice({
        route: values.route,
        outlet: values.outlet,
        invoice_number: values.invoice_number,
        invoice_date: values.invoice_date,
        actual_amount: values.actual_amount,
        brand: values.brand,
      });
      resetForm();
      setDate(undefined);
      setSelectedRouteId(null);
      setOutletOptions([]);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setDate(undefined);
    setSelectedRouteId(null);
    setOutletOptions([]);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className='sm:max-w-lg'>
        <DialogHeader>
          <DialogTitle>Create New Invoice</DialogTitle>
        </DialogHeader>

        <Formik
          initialValues={{
            route: 0,
            outlet: 0,
            invoice_number: '',
            invoice_date: '',
            actual_amount: 0,
            brand: '',
          }}
          validationSchema={CreateInvoiceSchema}
          onSubmit={handleSubmit}
          enableReinitialize
        >
          {({ errors, touched, setFieldValue, values }) => (
            <Form className='space-y-4'>
              {/* Route Select */}
              <div className='grid grid-cols-4 items-center gap-4'>
                <Label htmlFor='route' className='text-right'>
                  Route Name
                </Label>
                <Field name='route'>
                  {({
                    field,
                    form,
                  }: {
                    field: {
                      name: string;
                      value: string | number;
                      onChange: React.ChangeEventHandler<HTMLSelectElement>;
                      onBlur: React.FocusEventHandler<HTMLSelectElement>;
                    };
                    form: import('formik').FormikProps<InvoiceValues>;
                  }) => (
                    <Select
                      value={String(field.value)}
                      onValueChange={(val) => {
                        const id = parseInt(val);
                        form.setFieldValue('route', id);
                        setSelectedRouteId(id);
                        form.setFieldValue('outlet', 0);
                      }}
                    >
                      <SelectTrigger className='col-span-3 w-[180px]'>
                        <SelectValue>
                          {routeOptions.find((r) => r.id === values.route)
                            ?.name || 'Select Route'}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {routeOptions.map((route) => (
                          <SelectItem key={route.id} value={String(route.id)}>
                            {route.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </Field>
                <ErrorMessage
                  name='route'
                  component='div'
                  className='text-sm text-red-500 col-span-4 ml-[33%]'
                />
              </div>

              {/* Outlet Select (searchable popover) */}
              <div className='grid grid-cols-4 items-center gap-4'>
                <Label htmlFor='outlet' className='text-right'>
                  Outlet Name
                </Label>
                <div className='col-span-3'>
                  {/* <Field name='outlet'>
                    {({ field, form }: any) => {
                      // Local state for popover open/closed, and searchTerm

                      // Selected outlet object
                      const selectedOutlet = outletOptions.find(
                        (o) => o.id === form.values.outlet
                      );

                      // Filtered outlets by searchTerm
                      const filteredOutlets = outletOptions.filter((o) =>
                        o.name
                          .toLowerCase()
                          .includes(searchTerm.trim().toLowerCase())
                      );

                      return (
                        <Popover open={openPop} onOpenChange={setOpenPop}>
                          <PopoverTrigger asChild disabled={!selectedRouteId}>
                            <Button
                              variant='outline'
                              role='combobox'
                              aria-expanded={openPop}
                              className='w-[200px] justify-between'
                            >
                              {selectedOutlet
                                ? selectedOutlet.name
                                : 'Select Outlet'}
                              <ChevronsUpDown className='opacity-50' />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className='w-[200px] p-0'>
                            <Command>
                              <CommandInput
                                placeholder='Search outlet...'
                                // value={searchTerm}
                                // onValueChange={(val) => setSearchTerm(val)}
                                className='h-9'
                              />
                              <CommandList>
                                <CommandEmpty>No outlet found.</CommandEmpty>
                                <CommandGroup>
                                  {filteredOutlets.map((outlet) => (
                                    <CommandItem
                                      key={outlet.id}
                                      value={outlet.id.toString()}
                                      onSelect={() => {
                                        form.setFieldValue('outlet', outlet.id);
                                        setOpenPop(false);
                                        setSearchTerm('');
                                      }}
                                    >
                                      {outlet.name}
                                      {form.values.outlet === outlet.id && (
                                        <Check className='ml-auto' />
                                      )}
                                    </CommandItem>
                                  ))}
                                </CommandGroup>
                              </CommandList>
                            </Command>
                          </PopoverContent>
                        </Popover>
                      );
                    }}
                  </Field>
                  <ErrorMessage
                    name='outlet'
                    component='div'
                    className='text-sm text-red-500'
                  /> */}
                  <Field name='outlet'>
                    {({
                      form,
                    }: {
                      field: {
                        name: string;
                        value: string | number;
                        onChange: React.ChangeEventHandler<HTMLSelectElement>;
                        onBlur: React.FocusEventHandler<HTMLSelectElement>;
                      };
                      form: import('formik').FormikProps<InvoiceValues>;
                    }) => (
                      <SearchableDropdown
                        options={outletOptions}
                        selectedId={form.values.outlet || null}
                        onChange={(id) => {
                          form.setFieldValue('outlet', id);
                        }}
                        placeholder='Select Outlet'
                        disabled={!selectedRouteId}
                      />
                    )}
                  </Field>
                  <ErrorMessage
                    name='outlet'
                    component='div'
                    className='text-sm text-red-500'
                  />
                </div>
              </div>

              {/* Invoice Number */}
              <div className='grid grid-cols-4 items-center gap-4'>
                <Label htmlFor='invoice_number' className='text-right'>
                  Invoice Number
                </Label>
                <div className='col-span-3'>
                  <Field
                    as={Input}
                    id='invoice_number'
                    name='invoice_number'
                    placeholder='INV-2023-001'
                    className={
                      errors.invoice_number && touched.invoice_number
                        ? 'border-red-500'
                        : ''
                    }
                  />
                  <ErrorMessage
                    name='invoice_number'
                    component='div'
                    className='text-sm text-red-500'
                  />
                </div>
              </div>

              {/* Invoice Date */}
              <div className='grid grid-cols-4 items-center gap-4'>
                <Label htmlFor='invoice_date' className='text-right'>
                  Invoice Date
                </Label>
                <div className='col-span-3'>
                  <Popover open={openCal} onOpenChange={setOpenCal}>
                    <PopoverTrigger asChild>
                      <Button
                        variant='outline'
                        className={cn(
                          'w-[240px] justify-start text-left font-normal',
                          !values.invoice_date && 'text-muted-foreground'
                        )}
                      >
                        <CalendarIcon className='mr-2 h-4 w-4' />
                        {values.invoice_date
                          ? format(new Date(values.invoice_date), 'PPP')
                          : 'Pick a date'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className='w-auto p-0' align='start'>
                      <Calendar
                        mode='single'
                        selected={date}
                        onSelect={(selected) => {
                          setDate(selected);
                          if (selected) {
                            const formatted = format(selected, 'yyyy-MM-dd');
                            setFieldValue('invoice_date', formatted);
                            setOpenCal(false);
                          }
                        }}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <ErrorMessage
                    name='invoice_date'
                    component='div'
                    className='text-sm text-red-500'
                  />
                </div>
              </div>

              {/* Amount */}
              <div className='grid grid-cols-4 items-center gap-4'>
                <Label htmlFor='actual_amount' className='text-right'>
                  Amount
                </Label>
                <div className='col-span-3'>
                  <Field
                    as={Input}
                    type='number'
                    id='actual_amount'
                    name='actual_amount'
                    placeholder='1000.00'
                    className={
                      errors.actual_amount && touched.actual_amount
                        ? 'border-red-500'
                        : ''
                    }
                  />
                  <ErrorMessage
                    name='actual_amount'
                    component='div'
                    className='text-sm text-red-500'
                  />
                </div>
              </div>

              {/* Brand */}
              <div className='grid grid-cols-4 items-center gap-4'>
                <Label htmlFor='brand' className='text-right'>
                  Brand
                </Label>
                <div className='col-span-3'>
                  <Field
                    as={Input}
                    id='brand'
                    name='brand'
                    placeholder='Nike'
                    className={
                      errors.brand && touched.brand ? 'border-red-500' : ''
                    }
                  />
                  <ErrorMessage
                    name='brand'
                    component='div'
                    className='text-sm text-red-500'
                  />
                </div>
              </div>

              <DialogFooter>
                <Button type='button' variant='outline' onClick={handleClose}>
                  Cancel
                </Button>
                <Button
                  type='submit'
                  disabled={isSubmitting}
                  className='cursor-pointer'
                >
                  {isSubmitting ? 'Creating...' : 'Create Invoice'}
                </Button>
              </DialogFooter>
            </Form>
          )}
        </Formik>
      </DialogContent>
    </Dialog>
  );
}
