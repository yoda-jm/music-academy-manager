import React from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { attendanceApi } from '@/api/attendance';
import { Spinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { Badge } from '@/components/ui/Badge';

interface AttendanceStatsProps {
  courseId?: string;
  studentId?: string;
}

const ATTENDANCE_COLORS = {
  present: '#22c55e',
  absent: '#ef4444',
  late: '#f59e0b',
  excused: '#3b82f6',
  makeup: '#8b5cf6',
};

export const AttendanceStats: React.FC<AttendanceStatsProps> = ({ courseId, studentId }) => {
  const { data, isLoading } = useQuery({
    queryKey: ['attendance', 'stats', courseId, studentId],
    queryFn: () => attendanceApi.getAttendanceStats({ courseId, studentId }),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <EmptyState
        title="No attendance data"
        description="Attendance statistics will appear here once sessions have been recorded."
      />
    );
  }

  const chartData = data.map((row) => ({
    name: row.studentName.split(' ')[0], // First name only for chart brevity
    Present: row.present,
    Absent: row.absent,
    Late: row.late,
    Excused: row.excused,
    Makeup: row.makeup,
    rate: row.rate,
  }));

  return (
    <div className="space-y-6">
      {/* Rate summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {data.slice(0, 4).map((row) => (
          <div
            key={row.studentId}
            className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-4"
          >
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
              {row.studentName}
            </p>
            <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-gray-100">
              {row.rate.toFixed(0)}%
            </p>
            <div className="mt-1 flex items-center gap-1">
              <Badge
                variant={row.rate >= 80 ? 'success' : row.rate >= 60 ? 'warning' : 'error'}
                size="sm"
              >
                {row.present}/{row.totalSessions} sessions
              </Badge>
            </div>
          </div>
        ))}
      </div>

      {/* Bar chart */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">
          Attendance by Student
        </h3>
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#6b7280' }} />
            <YAxis tick={{ fontSize: 12, fill: '#6b7280' }} />
            <Tooltip
              contentStyle={{
                backgroundColor: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '12px',
              }}
            />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Bar dataKey="Present" stackId="a" fill={ATTENDANCE_COLORS.present} radius={[0, 0, 0, 0]} />
            <Bar dataKey="Late" stackId="a" fill={ATTENDANCE_COLORS.late} />
            <Bar dataKey="Makeup" stackId="a" fill={ATTENDANCE_COLORS.makeup} />
            <Bar dataKey="Excused" stackId="a" fill={ATTENDANCE_COLORS.excused} />
            <Bar dataKey="Absent" stackId="a" fill={ATTENDANCE_COLORS.absent} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Detailed table */}
      <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              <th className="px-4 py-3 text-left text-gray-600 dark:text-gray-300 font-medium">Student</th>
              <th className="px-4 py-3 text-center text-gray-600 dark:text-gray-300 font-medium">Total</th>
              <th className="px-4 py-3 text-center text-green-600 font-medium">Present</th>
              <th className="px-4 py-3 text-center text-red-600 font-medium">Absent</th>
              <th className="px-4 py-3 text-center text-yellow-600 font-medium">Late</th>
              <th className="px-4 py-3 text-center text-blue-600 font-medium">Excused</th>
              <th className="px-4 py-3 text-center text-purple-600 font-medium">Makeup</th>
              <th className="px-4 py-3 text-center text-gray-600 dark:text-gray-300 font-medium">Rate</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800 bg-white dark:bg-gray-900">
            {data.map((row) => (
              <tr key={row.studentId}>
                <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100">
                  {row.studentName}
                </td>
                <td className="px-4 py-3 text-center text-gray-700 dark:text-gray-300">{row.totalSessions}</td>
                <td className="px-4 py-3 text-center text-green-600 font-medium">{row.present}</td>
                <td className="px-4 py-3 text-center text-red-600 font-medium">{row.absent}</td>
                <td className="px-4 py-3 text-center text-yellow-600 font-medium">{row.late}</td>
                <td className="px-4 py-3 text-center text-blue-600 font-medium">{row.excused}</td>
                <td className="px-4 py-3 text-center text-purple-600 font-medium">{row.makeup}</td>
                <td className="px-4 py-3 text-center">
                  <Badge
                    variant={row.rate >= 80 ? 'success' : row.rate >= 60 ? 'warning' : 'error'}
                  >
                    {row.rate.toFixed(0)}%
                  </Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
