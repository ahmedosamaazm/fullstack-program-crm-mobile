export {
  AttachmentTooLargeError,
  AttachmentTypeNotAllowedError,
  createAttachmentSignedUrl,
  CustomerNotEditableError,
  CustomerPhoneConflictError,
  isAllowedMimeType,
  isPhoneConflict,
  isViewableImage,
  MAX_ATTACHMENT_BYTES,
  normalisePhone,
  PAGE_SIZE,
  parseSecondaryContacts,
  toCustomerInput,
  toListItemFromDetail,
} from './api';
export { CreateCustomerSheet } from './components/CreateCustomerSheet';
export { CustomerRow } from './components/CustomerRow';
export { groupCustomersAlpha } from './grouping';
export type { CustomerGroup, CustomerGroupKey } from './grouping';
export {
  customerKeys,
  useCreateCustomer,
  useCreateCustomerNote,
  useCustomerAttachments,
  useCustomerDetail,
  useCustomerNotes,
  useCustomers,
  // Exported for SCRUM-28's Create Ticket customer picker — not called
  // anywhere in this feature. Do not delete as unused.
  useCustomerSearch,
  useCustomersCount,
  useRecentCustomersCount,
  useUpdateCustomer,
  useUploadCustomerAttachment,
  useWithOpenTicketsCount,
} from './hooks';
export { CreateCustomerScreen } from './screens/CreateCustomerScreen';
export { CustomerDetailScreen } from './screens/CustomerDetailScreen';
export { CustomersScreen } from './screens/CustomersScreen';
export { EditCustomerScreen } from './screens/EditCustomerScreen';
export type {
  CreateCustomerInput,
  CustomerAttachment,
  CustomerDetail,
  CustomerFilter,
  CustomerListItem,
  CustomerNote,
  CustomerTicket,
  PickedFile,
  SecondaryContact,
  SecondaryContactInput,
} from './types';
