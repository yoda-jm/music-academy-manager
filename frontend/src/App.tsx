import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { ProtectedRoute } from '@/components/layout/ProtectedRoute';
import { Spinner } from '@/components/ui/Spinner';
import { Role } from '@/types';

// Lazy-load pages for code splitting
// Public pages (outside Layout) still need their own Suspense at the App level
const LoginPage = lazy(() => import('@/pages/LoginPage'));
const RegisterPage = lazy(() => import('@/pages/RegisterPage'));
const HomePage = lazy(() => import('@/pages/HomePage'));
const DashboardPage = lazy(() => import('@/pages/DashboardPage'));
const CalendarPage = lazy(() => import('@/pages/CalendarPage'));
const StudentsPage = lazy(() => import('@/pages/StudentsPage'));
const StudentDetailPage = lazy(() => import('@/pages/StudentDetailPage'));
const TeachersPage = lazy(() => import('@/pages/TeachersPage'));
const TeacherDetailPage = lazy(() => import('@/pages/TeacherDetailPage'));
const RoomsPage = lazy(() => import('@/pages/RoomsPage'));
const CoursesPage = lazy(() => import('@/pages/CoursesPage'));
const CourseDetailPage = lazy(() => import('@/pages/CourseDetailPage'));
const BillingPage = lazy(() => import('@/pages/BillingPage'));
const InvoiceListPage = lazy(() => import('@/pages/InvoiceListPage'));
const InvoiceDetailPage = lazy(() => import('@/pages/InvoiceDetailPage'));
const PricingPage = lazy(() => import('@/pages/PricingPage'));
const MessagingPage = lazy(() => import('@/pages/MessagingPage'));
const NotificationsPage = lazy(() => import('@/pages/NotificationsPage'));
const ReportsPage = lazy(() => import('@/pages/ReportsPage'));
const VacationsPage = lazy(() => import('@/pages/VacationsPage'));
const ProfilePage = lazy(() => import('@/pages/ProfilePage'));
const SettingsPage = lazy(() => import('@/pages/SettingsPage'));
const FamiliesPage = lazy(() => import('@/pages/FamiliesPage'));
const FamilyDetailPage = lazy(() => import('@/pages/FamilyDetailPage'));
const InvoiceCreatePage = lazy(() => import('@/pages/InvoiceCreatePage'));
const EventsPage = lazy(() => import('@/pages/EventsPage'));
const EventDetailPage = lazy(() => import('@/pages/EventDetailPage'));

const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen">
    <Spinner size="xl" />
  </div>
);

export default function App() {
  return (
    // Suspense here only covers public routes (login/register outside Layout).
    // Protected routes get their Suspense boundary inside Layout to keep the sidebar visible.
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Protected routes — wrapped in Layout */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          {/* Home */}
          <Route index element={<HomePage />} />

          {/* Dashboard (admin only) */}
          <Route
            path="dashboard"
            element={
              <ProtectedRoute allowedRoles={[Role.ADMIN, Role.SUPER_ADMIN]}>
                <DashboardPage />
              </ProtectedRoute>
            }
          />

          {/* Calendar */}
          <Route path="calendar" element={<CalendarPage />} />

          {/* Students */}
          <Route
            path="students"
            element={
              <ProtectedRoute allowedRoles={[Role.ADMIN, Role.TEACHER]}>
                <StudentsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="students/:id"
            element={
              <ProtectedRoute allowedRoles={[Role.ADMIN, Role.TEACHER]}>
                <StudentDetailPage />
              </ProtectedRoute>
            }
          />

          {/* Teachers */}
          <Route
            path="teachers"
            element={
              <ProtectedRoute allowedRoles={[Role.ADMIN]}>
                <TeachersPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="teachers/:id"
            element={
              <ProtectedRoute allowedRoles={[Role.ADMIN]}>
                <TeacherDetailPage />
              </ProtectedRoute>
            }
          />

          {/* Rooms */}
          <Route
            path="rooms"
            element={
              <ProtectedRoute allowedRoles={[Role.ADMIN]}>
                <RoomsPage />
              </ProtectedRoute>
            }
          />

          {/* Courses */}
          <Route
            path="courses"
            element={
              <ProtectedRoute allowedRoles={[Role.ADMIN, Role.TEACHER]}>
                <CoursesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="courses/:id"
            element={
              <ProtectedRoute allowedRoles={[Role.ADMIN, Role.TEACHER]}>
                <CourseDetailPage />
              </ProtectedRoute>
            }
          />

          {/* Billing */}
          <Route path="billing" element={<BillingPage />} />
          <Route path="billing/invoices" element={<InvoiceListPage />} />
          <Route path="billing/invoices/new" element={<InvoiceCreatePage />} />
          <Route path="billing/invoices/:id" element={<InvoiceDetailPage />} />
          <Route
            path="billing/pricing"
            element={
              <ProtectedRoute allowedRoles={[Role.ADMIN]}>
                <PricingPage />
              </ProtectedRoute>
            }
          />

          {/* Events */}
          <Route path="events" element={<EventsPage />} />
          <Route path="events/:id" element={<EventDetailPage />} />

          {/* Messaging */}
          <Route path="messaging" element={<MessagingPage />} />

          {/* Notifications */}
          <Route path="notifications" element={<NotificationsPage />} />

          {/* Reports */}
          <Route
            path="reports"
            element={
              <ProtectedRoute allowedRoles={[Role.ADMIN, Role.TEACHER]}>
                <ReportsPage />
              </ProtectedRoute>
            }
          />

          {/* Families */}
          <Route
            path="families"
            element={
              <ProtectedRoute allowedRoles={[Role.ADMIN]}>
                <FamiliesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="families/:id"
            element={
              <ProtectedRoute allowedRoles={[Role.ADMIN]}>
                <FamilyDetailPage />
              </ProtectedRoute>
            }
          />

          {/* Vacations */}
          <Route
            path="vacations"
            element={
              <ProtectedRoute allowedRoles={[Role.ADMIN]}>
                <VacationsPage />
              </ProtectedRoute>
            }
          />

          {/* Profile */}
          <Route path="profile" element={<ProfilePage />} />

          {/* Settings */}
          <Route
            path="settings"
            element={
              <ProtectedRoute allowedRoles={[Role.ADMIN]}>
                <SettingsPage />
              </ProtectedRoute>
            }
          />

          {/* Catch-all redirect */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>

        {/* Root catch-all */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Suspense>
  );
}
