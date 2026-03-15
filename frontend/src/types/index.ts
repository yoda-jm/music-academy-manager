// ============================================================
// Enums — kept in sync with backend Prisma schema
// ============================================================

export enum Role {
  SUPER_ADMIN = 'SUPER_ADMIN',
  ADMIN = 'ADMIN',
  RECEPTIONIST = 'RECEPTIONIST',
  TEACHER = 'TEACHER',
  STUDENT = 'STUDENT',
  PARENT = 'PARENT',
}

export enum CourseType {
  PRIVATE_LESSON = 'PRIVATE_LESSON',
  GROUP_INSTRUMENT = 'GROUP_INSTRUMENT',
  MUSIC_THEORY = 'MUSIC_THEORY',
  WORKSHOP = 'WORKSHOP',
  MASTERCLASS = 'MASTERCLASS',
}

export enum SessionStatus {
  SCHEDULED = 'SCHEDULED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  RESCHEDULED = 'RESCHEDULED',
}

export enum EnrollmentStatus {
  ACTIVE = 'ACTIVE',
  PAUSED = 'PAUSED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export enum PaymentType {
  PER_SESSION = 'PER_SESSION',
  MONTHLY = 'MONTHLY',
  YEARLY = 'YEARLY',
  FREE = 'FREE',
}

export enum AttendanceStatus {
  PRESENT = 'PRESENT',
  ABSENT = 'ABSENT',
  LATE = 'LATE',
  EXCUSED = 'EXCUSED',
  MAKEUP = 'MAKEUP',
}

export enum InvoiceStatus {
  DRAFT = 'DRAFT',
  SENT = 'SENT',
  PAID = 'PAID',
  PARTIAL = 'PARTIAL',
  OVERDUE = 'OVERDUE',
  CANCELLED = 'CANCELLED',
}

export enum PaymentMethod {
  CASH = 'CASH',
  BANK_TRANSFER = 'BANK_TRANSFER',
  CARD = 'CARD',
  CHEQUE = 'CHEQUE',
  ONLINE = 'ONLINE',
  OTHER = 'OTHER',
}

export enum VacationType {
  SCHOOL_HOLIDAY = 'SCHOOL_HOLIDAY',
  SUMMER_BREAK = 'SUMMER_BREAK',
  SPECIAL_CLOSURE = 'SPECIAL_CLOSURE',
  TEACHER_TRAINING = 'TEACHER_TRAINING',
  OTHER = 'OTHER',
}

export enum ConvType {
  DIRECT = 'DIRECT',
  GROUP = 'GROUP',
  ANNOUNCEMENT = 'ANNOUNCEMENT',
  SUPPORT = 'SUPPORT',
}

export enum NotifType {
  COURSE_REMINDER = 'COURSE_REMINDER',
  INVOICE_DUE = 'INVOICE_DUE',
  ATTENDANCE_MARKED = 'ATTENDANCE_MARKED',
  MESSAGE_RECEIVED = 'MESSAGE_RECEIVED',
  ENROLLMENT_CHANGE = 'ENROLLMENT_CHANGE',
  SYSTEM = 'SYSTEM',
  VACATION_NOTICE = 'VACATION_NOTICE',
  ABSENCE = 'ABSENCE',
}

export enum EventParticipantRole {
  PERFORMER = 'PERFORMER',
  ATTENDEE = 'ATTENDEE',
  STAFF = 'STAFF',
  ORGANIZER = 'ORGANIZER',
}

export enum EventFileType {
  PROGRAM = 'PROGRAM',
  AFFICHE = 'AFFICHE',
  PLAYLIST = 'PLAYLIST',
  SPEECH = 'SPEECH',
  OTHER = 'OTHER',
}

export enum FamilyRelation {
  PARENT = 'PARENT',
  GUARDIAN = 'GUARDIAN',
  CHILD = 'CHILD',
  SIBLING = 'SIBLING',
  OTHER = 'OTHER',
}

export enum InstrumentLevel {
  BEGINNER = 'BEGINNER',
  ELEMENTARY = 'ELEMENTARY',
  INTERMEDIATE = 'INTERMEDIATE',
  ADVANCED = 'ADVANCED',
  PROFESSIONAL = 'PROFESSIONAL',
}

// ============================================================
// Core Entities
// ============================================================

export interface User {
  id: string;
  email: string;
  role: Role;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  profile?: Profile;
  teacher?: Teacher;
  student?: Student;
}

export interface Profile {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  phone?: string;
  address?: string;
  city?: string;
  postalCode?: string;
  birthDate?: string;
  avatarUrl?: string;
  notes?: string;
}

export interface Family {
  id: string;
  name: string;
  createdAt: string;
  members?: FamilyMember[];
  students?: Student[];
  invoices?: Invoice[];
}

export interface FamilyMember {
  id: string;
  familyId: string;
  userId: string;
  relation: FamilyRelation;
  isPrimary: boolean;
  family?: Family;
  user?: User;
}

export interface Teacher {
  id: string;
  userId: string;
  bio?: string;
  hourlyRate?: number;
  isActive?: boolean;
  createdAt: string;
  updatedAt: string;
  user?: User;
  instruments?: TeacherInstrument[];
  availability?: TeacherAvailability[];
  courses?: Course[];
}

export interface TeacherInstrument {
  teacherId: string;
  instrumentId: string;
  level: string;
  instrument?: Instrument;
}

export interface TeacherAvailability {
  id: string;
  teacherId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isRecurring: boolean;
}

export interface Student {
  id: string;
  userId: string;
  familyId?: string;
  createdAt: string;
  updatedAt: string;
  user?: User;
  family?: Family;
  instruments?: StudentInstrument[];
  enrollments?: Enrollment[];
}

export interface StudentInstrument {
  studentId: string;
  instrumentId: string;
  level: string;
  startDate?: string;
  notes?: string;
  instrument?: Instrument;
}

export interface Instrument {
  id: string;
  name: string;
  category: string;
}

export interface Room {
  id: string;
  name: string;
  capacity: number;
  floor?: string;
  equipment?: string[];
  isActive: boolean;
  color?: string;
  notes?: string;
}

export interface Course {
  id: string;
  name: string;
  description?: string;
  type: CourseType;
  teacherId: string;
  roomId: string;
  instrumentId?: string;
  maxStudents: number;
  durationMinutes: number;
  recurrenceRule?: string;
  pricePerSession?: number;
  priceMonthly?: number;
  priceYearly?: number;
  isActive: boolean;
  color?: string;
  createdAt: string;
  updatedAt: string;
  teacher?: Teacher;
  room?: Room;
  instrument?: Instrument;
  sessions?: CourseSession[];
  enrollments?: Enrollment[];
  _count?: {
    sessions: number;
    enrollments: number;
  };
}

export interface CourseSession {
  id: string;
  courseId: string;
  startTime: string;
  endTime: string;
  status: SessionStatus;
  notes?: string;
  isCancelled: boolean;
  cancelReason?: string;
  createdAt: string;
  course?: Course;
  room?: Room;
  attendance?: Attendance[];
  _count?: {
    attendance: number;
  };
}

export interface Enrollment {
  id: string;
  studentId: string;
  courseId: string;
  startDate: string;
  endDate?: string;
  status: EnrollmentStatus;
  paymentType: PaymentType;
  notes?: string;
  createdAt: string;
  student?: Student;
  course?: Course;
}

export interface Attendance {
  id: string;
  sessionId: string;
  studentId: string;
  status: AttendanceStatus;
  notes?: string;
  markedAt: string;
  markedById?: string;
  session?: CourseSession;
  student?: Student;
}

export interface Invoice {
  id: string;
  number: string;
  familyId?: string;
  studentId?: string;
  periodStart: string;
  periodEnd: string;
  dueDate: string;
  status: InvoiceStatus;
  subtotal: number;
  discount: number;
  total: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  family?: Family;
  student?: Student;
  items?: InvoiceItem[];
  payments?: Payment[];
  _count?: {
    items: number;
    payments: number;
  };
}

export interface InvoiceItem {
  id: string;
  invoiceId: string;
  studentId?: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
  courseId?: string;
  student?: Student;
}

export interface Payment {
  id: string;
  invoiceId: string;
  amount: number;
  method: PaymentMethod;
  reference?: string;
  paidAt: string;
  notes?: string;
  createdAt: string;
}

export interface PricingRule {
  id: string;
  name: string;
  courseType?: CourseType;
  instrumentId?: string;
  pricePerSession?: number;
  priceMonthly?: number;
  priceYearly?: number;
  isDefault: boolean;
  createdAt: string;
  instrument?: Instrument;
}

export interface Vacation {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  type: VacationType;
  affectsCourses: boolean;
  color: string;
  createdAt: string;
}

export interface Conversation {
  id: string;
  type: ConvType;
  name?: string;
  createdAt: string;
  updatedAt: string;
  participants?: ConversationParticipant[];
  messages?: Message[];
  _count?: { messages: number };
  lastMessage?: Message;
  unreadCount?: number;
}

export interface ConversationParticipant {
  conversationId: string;
  userId: string;
  joinedAt: string;
  lastReadAt?: string;
  isAdmin: boolean;
  user?: User;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  attachments?: string[];
  isEdited: boolean;
  deletedAt?: string;
  createdAt: string;
  updatedAt: string;
  sender?: User;
}

export interface Notification {
  id: string;
  userId: string;
  type: NotifType;
  title: string;
  content: string;
  link?: string;
  isRead: boolean;
  createdAt: string;
}

export interface Event {
  id: string;
  name: string;
  description?: string;
  startDate: string;
  endDate: string;
  isAllDay: boolean;
  location?: string;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
  participants?: EventParticipant[];
  files?: EventFile[];
  _count?: { participants: number; files: number };
}

export interface EventParticipant {
  id: string;
  eventId: string;
  userId: string;
  role: EventParticipantRole;
  notes?: string;
  createdAt: string;
  user?: User;
}

export interface EventFile {
  id: string;
  eventId: string;
  name: string;
  fileUrl: string;
  fileType: EventFileType;
  mimeType?: string;
  size?: number;
  createdAt: string;
}

// ============================================================
// API Response Types
// ============================================================

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface ApiError {
  message: string;
  errors?: Record<string, string[]>;
  statusCode: number;
}

// ============================================================
// Auth Types
// ============================================================

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

// ============================================================
// Calendar / Scheduling Types
// ============================================================

export interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  resource?: CourseSession | Vacation;
  type: 'session' | 'vacation';
  color?: string;
  courseType?: CourseType;
}

export interface ScheduleConflict {
  type: 'room' | 'teacher';
  sessionId: string;
  message: string;
}

// ============================================================
// Report / Stats Types
// ============================================================

export interface AttendanceReport {
  studentId: string;
  studentName: string;
  courseId: string;
  courseName: string;
  totalSessions: number;
  present: number;
  absent: number;
  late: number;
  excused: number;
  makeup: number;
  rate: number;
}

export interface RevenueReport {
  period: string;
  invoiced: number;
  collected: number;
  outstanding: number;
  overdue: number;
}

export interface StudentStats {
  totalStudents: number;
  activeStudents: number;
  newThisMonth: number;
  byInstrument: { instrument: string; count: number }[];
  byLevel: { level: string; count: number }[];
}

export interface TeacherHoursReport {
  teacherId: string;
  teacherName: string;
  totalHours: number;
  sessionCount: number;
  byMonth: { month: string; hours: number }[];
}

export interface BillingStats {
  period: { startDate: string; endDate: string };
  totalInvoices: number;
  totalRevenue: number;
  totalOutstanding: number;
  totalPaid: number;
  byStatus: {
    DRAFT: number;
    SENT: number;
    PAID: number;
    PARTIAL: number;
    OVERDUE: number;
  };
}

export interface DashboardStats {
  activeStudents: number;
  activeTeachers: number;
  revenueThisMonth: number;
  overdueInvoices: number;
  todaySessions: CourseSession[];
  recentEnrollments: Enrollment[];
}

export interface PaginationParams {
  page: number;
  limit: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}
