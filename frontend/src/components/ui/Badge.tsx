import React from 'react';
import { clsx } from 'clsx';
import {
  Role,
  CourseType,
  SessionStatus,
  EnrollmentStatus,
  InvoiceStatus,
  AttendanceStatus,
  VacationType,
} from '@/types';

type BadgeVariant =
  | 'default'
  | 'success'
  | 'warning'
  | 'error'
  | 'info'
  | 'purple'
  | 'orange'
  | 'gray';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  size?: 'sm' | 'md';
  dot?: boolean;
  className?: string;
}

const variantStyles: Record<BadgeVariant, string> = {
  default: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  success: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  warning: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  error: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  info: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  purple: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  orange: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  gray: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
};

const dotStyles: Record<BadgeVariant, string> = {
  default: 'bg-gray-400',
  success: 'bg-green-500',
  warning: 'bg-yellow-500',
  error: 'bg-red-500',
  info: 'bg-blue-500',
  purple: 'bg-purple-500',
  orange: 'bg-orange-500',
  gray: 'bg-gray-400',
};

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  size = 'sm',
  dot = false,
  className,
}) => {
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1.5 rounded-full font-medium',
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-sm',
        variantStyles[variant],
        className
      )}
    >
      {dot && (
        <span className={clsx('h-1.5 w-1.5 rounded-full flex-shrink-0', dotStyles[variant])} />
      )}
      {children}
    </span>
  );
};

// Role badge
export const RoleBadge: React.FC<{ role: Role }> = ({ role }) => {
  const config: Record<Role, { label: string; variant: BadgeVariant }> = {
    [Role.SUPER_ADMIN]: { label: 'Super Admin', variant: 'error' },
    [Role.ADMIN]: { label: 'Admin', variant: 'purple' },
    [Role.TEACHER]: { label: 'Teacher', variant: 'info' },
    [Role.STUDENT]: { label: 'Student', variant: 'success' },
    [Role.PARENT]: { label: 'Parent', variant: 'orange' },
    [Role.RECEPTIONIST]: { label: 'Receptionist', variant: 'default' },
  };
  const { label, variant } = config[role] || { label: role, variant: 'default' };
  return <Badge variant={variant}>{label}</Badge>;
};

// Course type badge
export const CourseTypeBadge: React.FC<{ type: CourseType }> = ({ type }) => {
  const config: Record<CourseType, { label: string; variant: BadgeVariant }> = {
    [CourseType.PRIVATE_LESSON]: { label: 'Individuel', variant: 'info' },
    [CourseType.GROUP_INSTRUMENT]: { label: 'Groupe', variant: 'success' },
    [CourseType.MUSIC_THEORY]: { label: 'FM', variant: 'default' },
    [CourseType.WORKSHOP]: { label: 'Atelier', variant: 'orange' },
    [CourseType.MASTERCLASS]: { label: 'Masterclass', variant: 'purple' },
  };
  const { label, variant } = config[type] || { label: type, variant: 'default' };
  return <Badge variant={variant}>{label}</Badge>;
};

// Session status badge
export const SessionStatusBadge: React.FC<{ status: SessionStatus }> = ({ status }) => {
  const config: Record<SessionStatus, { label: string; variant: BadgeVariant }> = {
    [SessionStatus.SCHEDULED]: { label: 'Scheduled', variant: 'info' },
    [SessionStatus.IN_PROGRESS]: { label: 'In progress', variant: 'warning' },
    [SessionStatus.COMPLETED]: { label: 'Completed', variant: 'success' },
    [SessionStatus.CANCELLED]: { label: 'Cancelled', variant: 'error' },
    [SessionStatus.RESCHEDULED]: { label: 'Rescheduled', variant: 'warning' },
  };
  const { label, variant } = config[status] || { label: status, variant: 'default' };
  return <Badge variant={variant} dot>{label}</Badge>;
};

// Enrollment status badge
export const EnrollmentStatusBadge: React.FC<{ status: EnrollmentStatus }> = ({ status }) => {
  const config: Record<EnrollmentStatus, { label: string; variant: BadgeVariant }> = {
    [EnrollmentStatus.ACTIVE]: { label: 'Active', variant: 'success' },
    [EnrollmentStatus.PAUSED]: { label: 'Paused', variant: 'warning' },
    [EnrollmentStatus.COMPLETED]: { label: 'Completed', variant: 'info' },
    [EnrollmentStatus.CANCELLED]: { label: 'Cancelled', variant: 'error' },
  };
  const { label, variant } = config[status] || { label: status, variant: 'default' };
  return <Badge variant={variant} dot>{label}</Badge>;
};

// Invoice status badge
export const InvoiceStatusBadge: React.FC<{ status: InvoiceStatus }> = ({ status }) => {
  const config: Record<InvoiceStatus, { label: string; variant: BadgeVariant }> = {
    [InvoiceStatus.DRAFT]: { label: 'Draft', variant: 'gray' },
    [InvoiceStatus.SENT]: { label: 'Sent', variant: 'info' },
    [InvoiceStatus.PAID]: { label: 'Paid', variant: 'success' },
    [InvoiceStatus.OVERDUE]: { label: 'Overdue', variant: 'error' },
    [InvoiceStatus.CANCELLED]: { label: 'Cancelled', variant: 'gray' },
    [InvoiceStatus.PARTIAL]: { label: 'Partial', variant: 'warning' },
  };
  const { label, variant } = config[status] || { label: status, variant: 'default' };
  return <Badge variant={variant} dot>{label}</Badge>;
};

// Attendance status badge
export const AttendanceStatusBadge: React.FC<{ status: AttendanceStatus }> = ({ status }) => {
  const config: Record<AttendanceStatus, { label: string; variant: BadgeVariant }> = {
    [AttendanceStatus.PRESENT]: { label: 'Present', variant: 'success' },
    [AttendanceStatus.ABSENT]: { label: 'Absent', variant: 'error' },
    [AttendanceStatus.LATE]: { label: 'Late', variant: 'warning' },
    [AttendanceStatus.EXCUSED]: { label: 'Excused', variant: 'info' },
    [AttendanceStatus.MAKEUP]: { label: 'Makeup', variant: 'purple' },
  };
  const { label, variant } = config[status] || { label: status, variant: 'default' };
  return <Badge variant={variant} dot>{label}</Badge>;
};

// Vacation type badge
export const VacationTypeBadge: React.FC<{ type: VacationType }> = ({ type }) => {
  const config: Record<VacationType, { label: string; variant: BadgeVariant }> = {
    [VacationType.SCHOOL_HOLIDAY]: { label: 'School Holiday', variant: 'info' },
    [VacationType.SUMMER_BREAK]: { label: 'Summer Break', variant: 'orange' },
    [VacationType.SPECIAL_CLOSURE]: { label: 'Special Closure', variant: 'error' },
    [VacationType.TEACHER_TRAINING]: { label: 'Teacher Training', variant: 'warning' },
    [VacationType.OTHER]: { label: 'Other', variant: 'gray' },
  };
  const { label, variant } = config[type] || { label: type, variant: 'default' };
  return <Badge variant={variant}>{label}</Badge>;
};
