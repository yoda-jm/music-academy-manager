import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import { reportsApi } from '@/api/reports';
import { Tabs, TabContent } from '@/components/ui/Tabs';
import { Card } from '@/components/ui/Card';
import { DatePicker } from '@/components/ui/DatePicker';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { Table, TableColumn } from '@/components/ui/Table';
import { AttendanceReport, RevenueReport, TeacherHoursReport } from '@/types';

const CHART_COLORS = ['#4f46e5', '#a855f7', '#f59e0b', '#22c55e', '#ef4444', '#3b82f6', '#ec4899'];

function DateRangePicker({
  startDate,
  endDate,
  onStartChange,
  onEndChange,
}: {
  startDate: string;
  endDate: string;
  onStartChange: (d: string) => void;
  onEndChange: (d: string) => void;
}) {
  return (
    <div className="flex items-center gap-3 flex-wrap">
      <DatePicker label="From" value={startDate} onChange={onStartChange} />
      <DatePicker label="To" value={endDate} onChange={onEndChange} min={startDate} />
    </div>
  );
}

function AttendanceReportTab() {
  const [startDate, setStartDate] = useState(format(startOfMonth(subMonths(new Date(), 1)), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(endOfMonth(new Date()), 'yyyy-MM-dd'));

  const { data, isLoading } = useQuery({
    queryKey: ['reports', 'attendance', startDate, endDate],
    queryFn: () => reportsApi.getAttendanceReport({ startDate, endDate }),
  });

  const columns: TableColumn<AttendanceReport>[] = [
    { key: 'studentName', header: 'Student', sortable: true },
    { key: 'courseName', header: 'Course' },
    { key: 'totalSessions', header: 'Total', render: (_, r) => r.totalSessions },
    { key: 'present', header: 'Present', render: (_, r) => <span className="text-green-600 font-medium">{r.present}</span> },
    { key: 'absent', header: 'Absent', render: (_, r) => <span className="text-red-600 font-medium">{r.absent}</span> },
    { key: 'late', header: 'Late', render: (_, r) => <span className="text-yellow-600 font-medium">{r.late}</span> },
    {
      key: 'rate', header: 'Rate', render: (_, r) => (
        <Badge variant={r.rate >= 80 ? 'success' : r.rate >= 60 ? 'warning' : 'error'}>
          {r.rate.toFixed(0)}%
        </Badge>
      )
    },
  ];

  return (
    <div className="space-y-5">
      <DateRangePicker startDate={startDate} endDate={endDate} onStartChange={setStartDate} onEndChange={setEndDate} />
      <Table columns={columns} data={data || []} isLoading={isLoading} emptyMessage="No attendance data" rowKey={(r) => r.studentId + r.courseId} />
    </div>
  );
}

function RevenueReportTab() {
  const [startDate, setStartDate] = useState(format(startOfMonth(subMonths(new Date(), 5)), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(endOfMonth(new Date()), 'yyyy-MM-dd'));

  const { data, isLoading } = useQuery({
    queryKey: ['reports', 'revenue', startDate, endDate],
    queryFn: () => reportsApi.getRevenueReport({ startDate, endDate, groupBy: 'month' }),
  });

  return (
    <div className="space-y-5">
      <DateRangePicker startDate={startDate} endDate={endDate} onStartChange={setStartDate} onEndChange={setEndDate} />
      {isLoading ? (
        <div className="flex justify-center py-8"><Spinner /></div>
      ) : (
        <Card>
          <Card.Body>
            <ResponsiveContainer width="100%" height={360}>
              <BarChart data={data || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="period" tick={{ fontSize: 12, fill: '#6b7280' }} />
                <YAxis tick={{ fontSize: 12, fill: '#6b7280' }} tickFormatter={(v) => `$${v}`} />
                <Tooltip formatter={(v: number) => `$${v.toLocaleString()}`} />
                <Legend />
                <Bar dataKey="invoiced" name="Invoiced" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                <Bar dataKey="collected" name="Collected" fill="#22c55e" radius={[4, 4, 0, 0]} />
                <Bar dataKey="outstanding" name="Outstanding" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card.Body>
        </Card>
      )}
    </div>
  );
}

function StudentStatsTab() {
  const { data, isLoading } = useQuery({
    queryKey: ['reports', 'students'],
    queryFn: () => reportsApi.getStudentsReport(),
  });

  return (
    <div className="space-y-5">
      {isLoading ? (
        <div className="flex justify-center py-8"><Spinner /></div>
      ) : data ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <Card>
            <Card.Header><h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Students by Instrument</h3></Card.Header>
            <Card.Body>
              {data.byInstrument?.length ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie data={data.byInstrument} dataKey="count" nameKey="instrument" cx="50%" cy="50%" outerRadius={100} label={({ name, percent }: { name: string; percent: number }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                      {data.byInstrument.map((_, i) => (
                        <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : <p className="text-sm text-gray-500 text-center py-8">No data</p>}
            </Card.Body>
          </Card>

          <Card>
            <Card.Header><h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Students by Level</h3></Card.Header>
            <Card.Body>
              {data.byLevel?.length ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={data.byLevel} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis type="number" tick={{ fontSize: 12, fill: '#6b7280' }} />
                    <YAxis dataKey="level" type="category" tick={{ fontSize: 12, fill: '#6b7280' }} width={90} />
                    <Tooltip />
                    <Bar dataKey="count" name="Students" fill="#4f46e5" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : <p className="text-sm text-gray-500 text-center py-8">No data</p>}
            </Card.Body>
          </Card>
        </div>
      ) : null}
    </div>
  );
}

function TeacherHoursTab() {
  const [startDate, setStartDate] = useState(format(startOfMonth(subMonths(new Date(), 2)), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(endOfMonth(new Date()), 'yyyy-MM-dd'));

  const { data, isLoading } = useQuery({
    queryKey: ['reports', 'teacher-hours', startDate, endDate],
    queryFn: () => reportsApi.getTeacherHoursReport({ startDate, endDate }),
  });

  const columns: TableColumn<TeacherHoursReport>[] = [
    { key: 'teacherName', header: 'Teacher' },
    { key: 'sessionCount', header: 'Sessions' },
    { key: 'totalHours', header: 'Total Hours', render: (_, r) => `${r.totalHours.toFixed(1)}h` },
  ];

  return (
    <div className="space-y-5">
      <DateRangePicker startDate={startDate} endDate={endDate} onStartChange={setStartDate} onEndChange={setEndDate} />
      <Table columns={columns} data={data || []} isLoading={isLoading} emptyMessage="No teacher hours data" rowKey={(r) => r.teacherId} />
    </div>
  );
}

export default function ReportsPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Reports</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Analytics and performance reports</p>
      </div>

      <Tabs
        tabs={[
          { value: 'attendance', label: 'Attendance' },
          { value: 'revenue', label: 'Revenue' },
          { value: 'students', label: 'Student Stats' },
          { value: 'teacher-hours', label: 'Teacher Hours' },
        ]}
      >
        <TabContent value="attendance"><AttendanceReportTab /></TabContent>
        <TabContent value="revenue"><RevenueReportTab /></TabContent>
        <TabContent value="students"><StudentStatsTab /></TabContent>
        <TabContent value="teacher-hours"><TeacherHoursTab /></TabContent>
      </Tabs>
    </div>
  );
}
