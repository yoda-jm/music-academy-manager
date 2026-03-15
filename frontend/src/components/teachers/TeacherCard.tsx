import React from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Music } from 'lucide-react';
import { clsx } from 'clsx';
import { Teacher } from '@/types';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';

interface TeacherCardProps {
  teacher: Teacher;
  className?: string;
}

export const TeacherCard: React.FC<TeacherCardProps> = ({ teacher, className }) => {
  const navigate = useNavigate();
  const profile = teacher.user?.profile;
  const displayName = profile
    ? `${profile.firstName} ${profile.lastName}`
    : teacher.user?.email || 'Unknown';

  return (
    <div
      onClick={() => navigate(`/teachers/${teacher.id}`)}
      data-testid="teacher-card"
      className={clsx(
        'bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700',
        'p-5 cursor-pointer hover:shadow-md transition-all hover:border-primary-200 dark:hover:border-primary-800',
        !teacher.isActive && 'opacity-60',
        className
      )}
    >
      <div className="flex items-start gap-4">
        <Avatar src={profile?.avatarUrl} name={displayName} size="lg" />
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 truncate">
              {displayName}
            </h3>
            {!teacher.isActive && <Badge variant="gray" size="sm">Inactive</Badge>}
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
            {teacher.user?.email}
          </p>
          {teacher.bio && (
            <p className="mt-1.5 text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
              {teacher.bio}
            </p>
          )}
        </div>
      </div>

      {/* Instruments */}
      {teacher.instruments && teacher.instruments.length > 0 && (
        <div className="mt-3 flex items-center gap-1.5 flex-wrap">
          <Music className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
          {teacher.instruments.slice(0, 3).map((ti) => (
            <Badge key={ti.id} variant="purple" size="sm">
              {ti.instrument?.name}
            </Badge>
          ))}
          {teacher.instruments.length > 3 && (
            <Badge variant="gray" size="sm">+{teacher.instruments.length - 3}</Badge>
          )}
        </div>
      )}

      {/* Specializations */}
      {teacher.specializations && teacher.specializations.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {teacher.specializations.slice(0, 3).map((spec) => (
            <Badge key={spec} variant="default" size="sm">{spec}</Badge>
          ))}
        </div>
      )}

      <div className="mt-4 pt-3.5 border-t border-gray-100 dark:border-gray-800 flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
        {teacher.courses && (
          <div className="flex items-center gap-1">
            <BookOpen className="h-3.5 w-3.5" />
            <span>
              {teacher.courses.filter((c) => c.isActive).length} active course(s)
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
