// import React from 'react';
// import { Formik, Form, Field, ErrorMessage } from 'formik';
// import * as Yup from 'yup';
// import { useData } from '../context/DataContext';
// import type { Invoice } from '../types';
// import {
//   Dialog,
//   DialogContent,
//   DialogDescription,
//   DialogFooter,
//   DialogHeader,
//   DialogTitle,
// } from '@/components/ui/dialog';
// import { Button } from '@/components/ui/button';
// import { Input } from '@/components/ui/input';
// import { Label } from '@/components/ui/label';
// import { format } from 'date-fns';

// interface CreateInvoiceDialogProps {
//   open: boolean;
//   onClose: () => void;
// }

// // Form values interface that matches the form fields
// interface CreateInvoiceFormValues {
//   outlet: number;
//   outlet_name: string;
//   invoice_number: string;
//   amount: number;
//   brand: string;
//   overdue_days: number;
//   route_name: string;
// }

// // Validation schema for the form
// const CreateInvoiceSch = Yup.object().shape({
//   outlet: Yup.number()
//     .required('Outlet number is required')
//     .positive('Outlet number must be positive')
//     .integer('Outlet number must be an integer'),
//   outlet_name: Yup.string().required('Outlet name is required'),
//   invoice_number: Yup.string()
//     .required('Invoice number is required')
//     .matches(/^INV-\d{4}-\d{3}$/, 'Invalid format! Use format: INV-YYYY-XXX'),
//   amount: Yup.number()
//     .required('Amount is required')
//     .positive('Amount must be positive')
//     .typeError('Amount must be a number'),
//   brand: Yup.string().required('Brand is required'),
//   overdue_days: Yup.number()
//     .required('Overdue days is required')
//     .min(0, 'Cannot be negative')
//     .integer('Overdue days must be an integer')
//     .typeError('Overdue days must be a number'),
//   route_name: Yup.string().required('Route name is required'),
// });

// const CreateInvoiceSchema: React.FC<CreateInvoiceDialogProps> = ({
//   open,
//   onClose,
// }) => {
//   const { addInvoice } = useData();

//   const handleSubmit = async (
//     values: CreateInvoiceFormValues,
//     { setSubmitting }: { setSubmitting: (isSubmitting: boolean) => void }
//   ) => {
//     try {
//       // Transform form values to match the Invoice type expected by addInvoice
//       const invoiceData: Omit<
//         Invoice,
//         'id' | 'status' | 'created_at' | 'cleared_at'
//       > = {
//         outlet: values.outlet,
//         outlet_name: values.outlet_name,
//         invoice_number: values.invoice_number,
//         amount: values.amount,
//         brand: values.brand,
//         overdue_days: values.overdue_days,
//         route_name: values.route_name,
//         invoice_date: format(new Date(), 'yyyy-MM-dd'), // Add current date
//         route: values.route_name,
//       };

//       await addInvoice(invoiceData);
//       onClose();
//     } catch (error) {
//       console.error('Failed to create invoice:', error);
//       // Error handling is already done in the addInvoice function via toast
//     } finally {
//       setSubmitting(false);
//     }
//   };

//   return (
//     <Dialog open={open} onOpenChange={onClose}>
//       <DialogContent className='sm:max-w-lg'>
//         <DialogHeader>
//           <DialogTitle>Create New Invoice</DialogTitle>
//           <DialogDescription>
//             Enter the details of the new invoice to be created.
//           </DialogDescription>
//         </DialogHeader>

//         <Formik<CreateInvoiceFormValues>
//           initialValues={{
//             outlet: 0,
//             outlet_name: '',
//             invoice_number: 'INV-' + format(new Date(), 'yyyy') + '-',
//             amount: 0,
//             brand: '',
//             overdue_days: 0,
//             route_name: '',
//             route: 0,
//           }}
//           validationSchema={CreateInvoiceSch}
//           onSubmit={handleSubmit}
//         >
//           {({ errors, touched, isSubmitting }) => (
//             <Form className='space-y-4'>
//               <div className='grid gap-4 py-4'>
//                 <div className='grid grid-cols-4 items-center gap-4'>
//                   <Label htmlFor='outlet' className='text-right'>
//                     Outlet Number *
//                   </Label>
//                   <div className='col-span-3'>
//                     <Field
//                       as={Input}
//                       id='outlet'
//                       name='outlet'
//                       type='number'
//                       placeholder='1001'
//                       className={
//                         errors.outlet && touched.outlet ? 'border-red-500' : ''
//                       }
//                     />
//                     <ErrorMessage
//                       name='outlet'
//                       component='div'
//                       className='text-sm text-red-500 mt-1'
//                     />
//                   </div>
//                 </div>

//                 <div className='grid grid-cols-4 items-center gap-4'>
//                   <Label htmlFor='route' className='text-right'>
//                     Number *
//                   </Label>
//                   <div className='col-span-3'>
//                     <Field
//                       as={Input}
//                       id='route'
//                       name='route'
//                       type='number'
//                       placeholder='1001'
//                       className={
//                         errors.outlet && touched.outlet ? 'border-red-500' : ''
//                       }
//                     />
//                     <ErrorMessage
//                       name='outlet'
//                       component='div'
//                       className='text-sm text-red-500 mt-1'
//                     />
//                   </div>
//                 </div>

//                 <div className='grid grid-cols-4 items-center gap-4'>
//                   <Label htmlFor='outlet_name' className='text-right'>
//                     Outlet Name *
//                   </Label>
//                   <div className='col-span-3'>
//                     <Field
//                       as={Input}
//                       id='outlet_name'
//                       name='outlet_name'
//                       placeholder='City Center Store'
//                       className={
//                         errors.outlet_name && touched.outlet_name
//                           ? 'border-red-500'
//                           : ''
//                       }
//                     />
//                     <ErrorMessage
//                       name='outlet_name'
//                       component='div'
//                       className='text-sm text-red-500 mt-1'
//                     />
//                   </div>
//                 </div>

//                 <div className='grid grid-cols-4 items-center gap-4'>
//                   <Label htmlFor='invoice_number' className='text-right'>
//                     Invoice Number *
//                   </Label>
//                   <div className='col-span-3'>
//                     <Field
//                       as={Input}
//                       id='invoice_number'
//                       name='invoice_number'
//                       placeholder='INV-2024-001'
//                       className={
//                         errors.invoice_number && touched.invoice_number
//                           ? 'border-red-500'
//                           : ''
//                       }
//                     />
//                     <ErrorMessage
//                       name='invoice_number'
//                       component='div'
//                       className='text-sm text-red-500 mt-1'
//                     />
//                   </div>
//                 </div>

//                 <div className='grid grid-cols-4 items-center gap-4'>
//                   <Label htmlFor='amount' className='text-right'>
//                     Amount *
//                   </Label>
//                   <div className='col-span-3'>
//                     <Field
//                       as={Input}
//                       type='number'
//                       step='0.01'
//                       min='0'
//                       id='amount'
//                       name='amount'
//                       placeholder='1000.00'
//                       className={
//                         errors.amount && touched.amount ? 'border-red-500' : ''
//                       }
//                     />
//                     <ErrorMessage
//                       name='amount'
//                       component='div'
//                       className='text-sm text-red-500 mt-1'
//                     />
//                   </div>
//                 </div>

//                 <div className='grid grid-cols-4 items-center gap-4'>
//                   <Label htmlFor='brand' className='text-right'>
//                     Brand *
//                   </Label>
//                   <div className='col-span-3'>
//                     <Field
//                       as={Input}
//                       id='brand'
//                       name='brand'
//                       placeholder='Nike'
//                       className={
//                         errors.brand && touched.brand ? 'border-red-500' : ''
//                       }
//                     />
//                     <ErrorMessage
//                       name='brand'
//                       component='div'
//                       className='text-sm text-red-500 mt-1'
//                     />
//                   </div>
//                 </div>

//                 <div className='grid grid-cols-4 items-center gap-4'>
//                   <Label htmlFor='overdue_days' className='text-right'>
//                     Overdue Days *
//                   </Label>
//                   <div className='col-span-3'>
//                     <Field
//                       as={Input}
//                       type='number'
//                       min='0'
//                       id='overdue_days'
//                       name='overdue_days'
//                       placeholder='0'
//                       className={
//                         errors.overdue_days && touched.overdue_days
//                           ? 'border-red-500'
//                           : ''
//                       }
//                     />
//                     <ErrorMessage
//                       name='overdue_days'
//                       component='div'
//                       className='text-sm text-red-500 mt-1'
//                     />
//                   </div>
//                 </div>

//                 <div className='grid grid-cols-4 items-center gap-4'>
//                   <Label htmlFor='route_name' className='text-right'>
//                     Route Name *
//                   </Label>
//                   <div className='col-span-3'>
//                     <Field
//                       as={Input}
//                       id='route_name'
//                       name='route_name'
//                       placeholder='Downtown Route'
//                       className={
//                         errors.route_name && touched.route_name
//                           ? 'border-red-500'
//                           : ''
//                       }
//                     />
//                     <ErrorMessage
//                       name='route_name'
//                       component='div'
//                       className='text-sm text-red-500 mt-1'
//                     />
//                   </div>
//                 </div>
//               </div>

//               <DialogFooter>
//                 <Button
//                   type='button'
//                   variant='outline'
//                   onClick={onClose}
//                   disabled={isSubmitting}
//                 >
//                   Cancel
//                 </Button>
//                 <Button type='submit' disabled={isSubmitting}>
//                   {isSubmitting ? 'Creating...' : 'Create Invoice'}
//                 </Button>
//               </DialogFooter>
//             </Form>
//           )}
//         </Formik>
//       </DialogContent>
//     </Dialog>
//   );
// };

// export default CreateInvoiceSchema;
