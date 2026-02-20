import * as React from 'react';
import { cn } from '@/lib/utils';
import { getAvatarGradient, getInitials } from '@/constants/design-system';

interface UserAvatarProps {
  name: string;
  src?: string | null;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const sizeMap = {
  xs: 'h-6 w-6 text-[10px]',
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-12 w-12 text-base',
  xl: 'h-16 w-16 text-lg',
};

/**
 * Standardized user avatar component with consistent gradient fallback.
 * Use this everywhere user avatars are displayed to ensure consistency.
 */
export function UserAvatar({ name, src, size = 'md', className }: UserAvatarProps) {
  const [imageError, setImageError] = React.useState(false);
  const showImage = src && !imageError;

  return (
    <div
      className={cn(
        'rounded-full flex items-center justify-center font-semibold text-white overflow-hidden flex-shrink-0',
        getAvatarGradient(name),
        sizeMap[size],
        className
      )}
    >
      {showImage ? (
        <img
          src={src}
          alt={name}
          className="h-full w-full object-cover"
          onError={() => setImageError(true)}
        />
      ) : (
        getInitials(name)
      )}
    </div>
  );
}

interface UserInfoProps {
  name: string;
  subtitle?: string;
  avatar?: string | null;
  avatarSize?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
}

/**
 * User info block with avatar, name, and optional subtitle.
 */
export function UserInfo({ name, subtitle, avatar, avatarSize = 'md', className }: UserInfoProps) {
  return (
    <div className={cn('flex items-center gap-3', className)}>
      <UserAvatar name={name} src={avatar} size={avatarSize} />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-brand-navy dark:text-white truncate">{name}</p>
        {subtitle && (
          <p className="text-xs text-muted-foreground truncate">{subtitle}</p>
        )}
      </div>
    </div>
  );
}

export { UserAvatar as default };
