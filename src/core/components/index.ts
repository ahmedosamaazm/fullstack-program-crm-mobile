// Font primitives — the only files permitted to import Text/TextInput from react-native.
export { Text, type TextProps, type TextTone, type TextWeight } from './Text';
export { TextInput, type TextInputProps } from './TextInput';
export { Icon, type IconProps, type IconName } from './Icon';

// Buttons
export { IconButton, type IconButtonProps, type IconButtonVariant } from './IconButton';
export { Button, type ButtonProps } from './Button';

// Form
export { TextField, type TextFieldProps } from './TextField';
export { TextArea, type TextAreaProps } from './TextArea';
export { SearchField, type SearchFieldProps } from './SearchField';

// Headers
export { SectionHeader, type SectionHeaderProps } from './SectionHeader';
export { ModalHeader, type ModalHeaderProps } from './ModalHeader';
export { SheetHeader, type SheetHeaderProps } from './SheetHeader';
export { Tab, TabBar, type TabProps, type TabBarProps } from './Tab';

// Rows
export { DetailRow, type DetailRowProps } from './DetailRow';
export { SettingsRow, RowGroup, type SettingsRowProps, type RowGroupProps } from './SettingsRow';
export { ActionRow, type ActionRowProps } from './ActionRow';
export { FilterChip, type FilterChipProps } from './FilterChip';
export { Dropzone, type DropzoneProps } from './Dropzone';

// Existing generic components (migrated to the new token layer)
export { Avatar } from './Avatar';
export { BottomSheet } from './BottomSheet';
export { EmptyState } from './EmptyState';
export { ErrorState } from './ErrorState';
export { FAB } from './FAB';
export { OfflineBanner } from './OfflineBanner';
export { SegmentedControl, type Segment } from './SegmentedControl';
export { Skeleton, SkeletonList } from './Skeleton';
