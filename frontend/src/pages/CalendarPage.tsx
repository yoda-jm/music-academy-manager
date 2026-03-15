import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { teachersApi } from '@/api/teachers';
import { roomsApi } from '@/api/rooms';
import { studentsApi } from '@/api/students';
import { AcademyCalendar } from '@/components/calendar/AcademyCalendar';
import { useAuthStore } from '@/store/auth.store';
import { Role } from '@/types';

export default function CalendarPage() {
  const { user } = useAuthStore();
  const isAdmin = user?.role === Role.ADMIN || user?.role === Role.SUPER_ADMIN;
  const [searchParams] = useSearchParams();

  const [teacherFilter, setTeacherFilter] = useState(searchParams.get('teacher') || '');
  const [roomFilter, setRoomFilter] = useState(searchParams.get('room') || '');
  const [studentFilter, setStudentFilter] = useState(searchParams.get('student') || '');

  const { data: teachersData } = useQuery({
    queryKey: ['teachers', 'list'],
    queryFn: () => teachersApi.getTeachers({ page: 1, limit: 100 }),
    enabled: isAdmin,
  });

  const { data: roomsData } = useQuery({
    queryKey: ['rooms', 'list'],
    queryFn: () => roomsApi.getRooms({ page: 1, limit: 100, isActive: true }),
    enabled: isAdmin,
  });

  const { data: studentsData } = useQuery({
    queryKey: ['students', 'list'],
    queryFn: () => studentsApi.getStudents({ page: 1, limit: 200 }),
    enabled: isAdmin,
  });

  const teacherOptions = (teachersData?.data || []).map((t) => ({
    value: t.id,
    label: t.user?.profile
      ? `${t.user.profile.firstName} ${t.user.profile.lastName}`
      : t.user?.email || t.id,
  }));

  const roomOptions = (roomsData?.data || []).map((r) => ({
    value: r.id,
    label: r.name,
  }));

  const studentOptions = (studentsData?.data || []).map((s) => ({
    value: s.id,
    label: s.user?.profile
      ? `${s.user.profile.firstName} ${s.user.profile.lastName}`
      : s.user?.email || s.id,
  }));

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Calendar</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          View and manage all scheduled sessions
        </p>
      </div>

      <AcademyCalendar
        teacherFilter={teacherFilter}
        roomFilter={roomFilter}
        studentFilter={studentFilter}
        onTeacherFilterChange={isAdmin ? setTeacherFilter : undefined}
        onRoomFilterChange={isAdmin ? setRoomFilter : undefined}
        onStudentFilterChange={isAdmin ? setStudentFilter : undefined}
        teacherOptions={isAdmin ? teacherOptions : []}
        roomOptions={isAdmin ? roomOptions : []}
        studentOptions={isAdmin ? studentOptions : []}
      />
    </div>
  );
}
