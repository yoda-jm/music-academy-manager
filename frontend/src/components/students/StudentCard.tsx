import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Music, Users, BookOpen } from 'lucide-react';
import { clsx } from 'clsx';
import { Student } from '@/types';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';

interface StudentCardProps {
  student: Student;
  className?: string;
}

export const StudentCard: React.FC<StudentCardProps> = ({ student, className }) => {
  const navigate = useNavigate();
  const profile = student.user?.profile;
  const displayName = profile
    ? `${profile.firstName} ${profile.lastName}`
    : student.user?.email || 'Unknown';

  return (
    <div
      onClick={() => navigate(`/students/${student.id}`)}
      className={clsx(
        'bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700',
        'p-5 cursor-pointer hover:shadow-md transition-all hover:border-primary-200 dark:hover:border-primary-800',
        !student.isActive && 'opacity-60',
        className
      )}
    >
      <div className="flex items-start gap-4">
        <Avatar
          src={profile?.avatarUrl}
          name={displayName}
          size="lg"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 truncate">
              {displayName}
            </h3>
            {!student.isActive && (
              <Badge variant="gray" size="sm">Inactive</Badge>
            )}
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
            {student.user?.email}
          </p>

          {/* Instruments */}
          {student.instruments && student.instruments.length > 0 && (
            <div className="mt-2.5 flex items-center gap-1.5 flex-wrap">
              <Music className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
              {student.instruments.slice(0, 3).map((si) => (
                <Badge key={si.id} variant="info" size="sm">
                  {si.instrument?.name} • {si.level.charAt(0) + si.level.slice(1).toLowerCase()}
                </Badge>
              ))}
              {student.instruments.length > 3 && (
                <Badge variant="gray" size="sm">+{student.instruments.length - 3}</Badge>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="mt-4 pt-3.5 border-t border-gray-100 dark:border-gray-800 flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
        {student.family && (
          <div className="flex items-center gap-1">
            <Users className="h-3.5 w-3.5" />
            <span>{student.family.name}</span>
          </div>
        )}
        {student.enrollments && (
          <div className="flex items-center gap-1">
            <BookOpen className="h-3.5 w-3.5" />
            <span>
              {student.enrollments.filter((e) => e.status === 'ACTIVE').length} active course(s)
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
