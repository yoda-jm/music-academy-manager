import React from 'react';
import * as RadixAvatar from '@radix-ui/react-avatar';
import { clsx } from 'clsx';

type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

interface AvatarProps {
  src?: string;
  alt?: string;
  name?: string;
  size?: AvatarSize;
  className?: string;
}

const sizeStyles: Record<AvatarSize, string> = {
  xs: 'h-6 w-6 text-xs',
  sm: 'h-8 w-8 text-sm',
  md: 'h-10 w-10 text-sm',
  lg: 'h-12 w-12 text-base',
  xl: 'h-16 w-16 text-lg',
};

function getInitials(name?: string): string {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

const avatarColors = [
  'bg-indigo-500',
  'bg-purple-500',
  'bg-pink-500',
  'bg-rose-500',
  'bg-orange-500',
  'bg-amber-500',
  'bg-teal-500',
  'bg-cyan-500',
  'bg-sky-500',
  'bg-blue-500',
];

function getColorFromName(name?: string): string {
  if (!name) return avatarColors[0];
  const charSum = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return avatarColors[charSum % avatarColors.length];
}

export const Avatar: React.FC<AvatarProps> = ({
  src,
  alt,
  name,
  size = 'md',
  className,
}) => {
  const initials = getInitials(name);
  const bgColor = getColorFromName(name);

  return (
    <RadixAvatar.Root
      className={clsx(
        'inline-flex items-center justify-center rounded-full overflow-hidden flex-shrink-0 select-none',
        sizeStyles[size],
        className
      )}
    >
      <RadixAvatar.Image
        src={src}
        alt={alt || name || 'Avatar'}
        className="h-full w-full object-cover"
      />
      <RadixAvatar.Fallback
        className={clsx(
          'flex items-center justify-center h-full w-full font-semibold text-white',
          bgColor
        )}
        delayMs={0}
      >
        {initials}
      </RadixAvatar.Fallback>
    </RadixAvatar.Root>
  );
};
