import {
  PrismaClient,
  Role,
  CourseType,
  EnrollmentStatus,
  PaymentType,
  AttendanceStatus,
  SessionStatus,
  VacationType,
  InvoiceStatus,
  PaymentMethod,
  EventParticipantRole,
  ConvType,
  FamilyRelation,
} from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

function isInVacation(date: Date): boolean {
  const d = date.getTime();
  const vacations: [Date, Date][] = [
    [new Date('2025-10-18'), new Date('2025-11-03')],
    [new Date('2025-12-20'), new Date('2026-01-06')],
    [new Date('2026-02-14'), new Date('2026-03-02')],
    [new Date('2026-04-25'), new Date('2026-05-11')],
  ];
  const holidays = new Set([
    '2025-11-01', '2025-12-08', '2026-01-01', '2026-04-06',
    '2026-05-01', '2026-05-08', '2026-05-14', '2026-05-25',
  ]);
  const dateStr = date.toISOString().split('T')[0];
  if (holidays.has(dateStr)) return true;
  for (const [s, e] of vacations) {
    if (d >= s.getTime() && d <= e.getTime()) return true;
  }
  return false;
}

function generateWeeklySessions(
  dayOfWeek: number,
  startHour: number,
  startMin: number,
  durationMinutes: number,
  from = new Date('2025-09-15'),
  to = new Date('2026-06-26'),
): Array<{ startTime: Date; endTime: Date }> {
  const sessions: Array<{ startTime: Date; endTime: Date }> = [];
  const current = new Date(from);
  while (current.getDay() !== dayOfWeek) current.setDate(current.getDate() + 1);
  while (current <= to) {
    if (!isInVacation(current)) {
      const start = new Date(current);
      start.setHours(startHour, startMin, 0, 0);
      const end = new Date(start);
      end.setMinutes(end.getMinutes() + durationMinutes);
      sessions.push({ startTime: start, endTime: end });
    }
    current.setDate(current.getDate() + 7);
  }
  return sessions;
}

// Trimestre 1 = Sep–Dec, Trimestre 3 = Mar–Jun
function generateTrimesterSessions(
  trimestre: 1 | 3,
  dayOfWeek: number,
  startHour: number,
  startMin: number,
  durationMinutes: number,
): Array<{ startTime: Date; endTime: Date }> {
  const from = trimestre === 1 ? new Date('2025-09-15') : new Date('2026-03-02');
  const to = trimestre === 1 ? new Date('2025-12-19') : new Date('2026-06-26');
  return generateWeeklySessions(dayOfWeek, startHour, startMin, durationMinutes, from, to);
}

function seededRandom(n: number): number {
  const x = Math.sin(n * 9301 + 49297) * 233280;
  return x - Math.floor(x);
}

function attendanceStatus(seed: number, studentKey: string): AttendanceStatus {
  const r = seededRandom(seed);
  if (studentKey === 'baptiste_thomas' || studentKey === 'linh_pham') {
    if (r < 0.28) return 'ABSENT';
    if (r < 0.33) return 'EXCUSED';
    if (r < 0.36) return 'LATE';
    return 'PRESENT';
  }
  const excellent = ['hugo_martin', 'camille_dupont', 'noa_chevalier', 'charlotte_robin', 'simon_david', 'mathieu_clement'];
  if (excellent.includes(studentKey)) {
    return r < 0.04 ? 'ABSENT' : 'PRESENT';
  }
  if (r < 0.85) return 'PRESENT';
  if (r < 0.93) return 'ABSENT';
  if (r < 0.98) return 'LATE';
  return 'EXCUSED';
}

async function main() {
  console.log('🎵 Starting Académie Les Hirondelles seed...');

  const pw_admin = await bcrypt.hash('Admin1234!', 10);
  const pw_teacher = await bcrypt.hash('Teacher1234!', 10);
  const pw_parent = await bcrypt.hash('Parent1234!', 10);
  const pw_student = await bcrypt.hash('Student1234!', 10);

  // ─────────────────────────────────────────────
  // 1. Instruments
  // ─────────────────────────────────────────────
  const instrumentDefs = [
    { name: 'Piano', category: 'Claviers' },
    { name: 'Guitare classique', category: 'Cordes pincées' },
    { name: 'Guitare électrique', category: 'Cordes pincées' },
    { name: 'Ukulélé', category: 'Cordes pincées' },
    { name: 'Violon', category: 'Cordes frottées' },
    { name: 'Alto', category: 'Cordes frottées' },
    { name: 'Violoncelle', category: 'Cordes frottées' },
    { name: 'Contrebasse', category: 'Cordes frottées' },
    { name: 'Flûte traversière', category: 'Vents bois' },
    { name: 'Saxophone alto', category: 'Vents bois' },
    { name: 'Saxophone ténor', category: 'Vents bois' },
    { name: 'Clarinette', category: 'Vents bois' },
    { name: 'Trompette', category: 'Cuivres' },
    { name: 'Trombone', category: 'Cuivres' },
    { name: 'Cor', category: 'Cuivres' },
    { name: 'Batterie', category: 'Percussions' },
    { name: 'Percussions classiques', category: 'Percussions' },
    { name: 'Chant', category: 'Voix' },
    { name: 'Formation musicale', category: 'Théorie' },
  ];

  const instruments: Record<string, string> = {};
  for (const instr of instrumentDefs) {
    const r = await prisma.instrument.upsert({
      where: { name: instr.name },
      update: {},
      create: instr,
    });
    instruments[instr.name] = r.id;
  }
  console.log('✓ Instruments');

  // ─────────────────────────────────────────────
  // 2. Rooms
  // ─────────────────────────────────────────────
  const roomDefs = [
    { name: 'Salle Chopin', capacity: 2, color: '#4f46e5', floor: 'RDC', equipment: ['Piano à queue Yamaha C3', 'Piano droit'] },
    { name: 'Salle Cordes', capacity: 3, color: '#059669', floor: 'RDC', equipment: ['Violon', 'Alto', 'Violoncelle', 'Pupitres'] },
    { name: 'Salle Vents', capacity: 2, color: '#0891b2', floor: '1er', equipment: ['Chaises', 'Pupitres', 'Miroir'] },
    { name: 'Salle Cuivres', capacity: 2, color: '#d97706', floor: '1er', equipment: ['Sourdines', 'Pupitres'] },
    { name: 'Salle Rythmes', capacity: 4, color: '#dc2626', floor: 'RDC', equipment: ['Batterie acoustique', 'Batterie électronique', 'Percussions'] },
    { name: 'Salle Guitares', capacity: 3, color: '#7c3aed', floor: '1er', equipment: ['3 guitares classiques', 'Ampli', 'Ukulélés'] },
    { name: 'Grande Salle', capacity: 20, color: '#0f766e', floor: '2ème', equipment: ['Piano droit', 'Chaises', 'Pupitres', 'Tableau blanc'] },
    { name: 'Auditorium', capacity: 120, color: '#1e40af', floor: '2ème', equipment: ['Scène', 'Sono', 'Lumières', 'Piano de concert'] },
  ];

  const rooms: Record<string, string> = {};
  for (const room of roomDefs) {
    const r = await prisma.room.upsert({
      where: { name: room.name },
      update: {},
      create: room,
    });
    rooms[room.name] = r.id;
  }
  console.log('✓ Rooms');

  // ─────────────────────────────────────────────
  // 3. Zone B vacations 2025-2026
  // ─────────────────────────────────────────────
  const vacationDefs = [
    { name: 'Toussaint 2025', startDate: new Date('2025-10-18'), endDate: new Date('2025-11-03'), type: 'SCHOOL_HOLIDAY' as VacationType, color: '#f97316' },
    { name: 'Noël 2025', startDate: new Date('2025-12-20'), endDate: new Date('2026-01-05'), type: 'SCHOOL_HOLIDAY' as VacationType, color: '#ef4444' },
    { name: 'Hiver 2026 Zone B', startDate: new Date('2026-02-14'), endDate: new Date('2026-03-01'), type: 'SCHOOL_HOLIDAY' as VacationType, color: '#3b82f6' },
    { name: 'Printemps 2026 Zone B', startDate: new Date('2026-04-25'), endDate: new Date('2026-05-10'), type: 'SCHOOL_HOLIDAY' as VacationType, color: '#10b981' },
    { name: 'Été 2026', startDate: new Date('2026-07-04'), endDate: new Date('2026-09-01'), type: 'SUMMER_BREAK' as VacationType, color: '#f59e0b' },
  ];

  for (const v of vacationDefs) {
    const existing = await prisma.vacation.findFirst({ where: { name: v.name } });
    if (!existing) await prisma.vacation.create({ data: { ...v, affectsCourses: true } });
  }
  console.log('✓ Vacations');

  // ─────────────────────────────────────────────
  // 4. Pricing
  // ─────────────────────────────────────────────
  let subPlan = await prisma.subscriptionPlan.findFirst({ where: { name: 'Formule Standard 2025-2026' } });
  if (!subPlan) {
    subPlan = await prisma.subscriptionPlan.create({
      data: {
        name: 'Formule Standard 2025-2026',
        description: 'Inclut 1 cours individuel + 1 FM groupe par semaine, 32 semaines',
        yearlyPrice: 680.00,
        includedPrivateLessons: 1,
        includedGroupCourses: 1,
        extraPrivateLessonPrice: 420.00,
        extraGroupCoursePrice: 200.00,
        orchestraPrice: 200.00,
        choirPrice: 140.00,
        workshopPricePerSession: 30.00,
      },
    });
  }

  const disc2 = await prisma.familyDiscountRule.findFirst({ where: { minChildRank: 2 } });
  if (!disc2) await prisma.familyDiscountRule.create({ data: { name: '2ème enfant -5%', minChildRank: 2, discountPercent: 5 } });
  const disc3 = await prisma.familyDiscountRule.findFirst({ where: { minChildRank: 3 } });
  if (!disc3) await prisma.familyDiscountRule.create({ data: { name: '3ème enfant et + -30%', minChildRank: 3, discountPercent: 30 } });
  const discBrass = await prisma.instrumentCategoryDiscount.findFirst({ where: { category: 'Cuivres' } });
  if (!discBrass) await prisma.instrumentCategoryDiscount.create({ data: { category: 'Cuivres', discountPercent: 15, name: 'Réduction cuivres -15%' } });

  console.log('✓ Pricing rules');

  // ─────────────────────────────────────────────
  // 5. Admin user
  // ─────────────────────────────────────────────
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@hirondelles-musique.fr' },
    update: {},
    create: {
      email: 'admin@hirondelles-musique.fr',
      passwordHash: pw_admin,
      role: Role.SUPER_ADMIN,
      isActive: true,
      profile: { create: { firstName: 'Hélène', lastName: 'Marchand (Admin)', phone: '03 88 45 12 67', city: 'Strasbourg' } },
    },
  });

  // ─────────────────────────────────────────────
  // 6. Teachers
  // ─────────────────────────────────────────────
  const teacherDefs = [
    {
      email: 'h.marchand@hirondelles-musique.fr',
      firstName: 'Hélène', lastName: 'Marchand',
      bio: 'Diplômée du Conservatoire National Supérieur de Paris, 20 ans d\'enseignement. Directrice de l\'académie.',
      hourlyRate: 55,
      instruments: [{ name: 'Piano', level: 'ADVANCED' }],
    },
    {
      email: 't.nguyen@hirondelles-musique.fr',
      firstName: 'Thomas', lastName: 'Nguyen',
      bio: 'Guitariste de formation jazz et classique, animateur de l\'Atelier Jazz.',
      hourlyRate: 42,
      instruments: [{ name: 'Guitare classique', level: 'ADVANCED' }, { name: 'Guitare électrique', level: 'ADVANCED' }, { name: 'Ukulélé', level: 'ADVANCED' }],
    },
    {
      email: 's.leblanc@hirondelles-musique.fr',
      firstName: 'Sophie', lastName: 'Leblanc',
      bio: 'Ancienne violoniste de l\'Orchestre Philharmonique de Strasbourg. Enseigne depuis 8 ans.',
      hourlyRate: 45,
      instruments: [{ name: 'Violon', level: 'ADVANCED' }, { name: 'Alto', level: 'INTERMEDIATE' }],
    },
    {
      email: 'm.durand@hirondelles-musique.fr',
      firstName: 'Marc', lastName: 'Durand',
      bio: 'Ancien musicien militaire, chef de la section cuivres de l\'Orchestre Jeunes.',
      hourlyRate: 42,
      instruments: [{ name: 'Trompette', level: 'ADVANCED' }, { name: 'Trombone', level: 'ADVANCED' }, { name: 'Cor', level: 'INTERMEDIATE' }],
    },
    {
      email: 'i.petit@hirondelles-musique.fr',
      firstName: 'Isabelle', lastName: 'Petit',
      bio: 'Flûtiste concertiste, masterclasses régulières dans la région.',
      hourlyRate: 42,
      instruments: [{ name: 'Flûte traversière', level: 'ADVANCED' }],
    },
    {
      email: 'k.benali@hirondelles-musique.fr',
      firstName: 'Karim', lastName: 'Benali',
      bio: 'Batteur professionnel (studio + scène), enseigne du classique au jazz-rock.',
      hourlyRate: 40,
      instruments: [{ name: 'Batterie', level: 'ADVANCED' }, { name: 'Percussions classiques', level: 'INTERMEDIATE' }],
    },
    {
      email: 'n.rousseau@hirondelles-musique.fr',
      firstName: 'Nathalie', lastName: 'Rousseau',
      bio: 'Musicologue et pédagogue, 15 ans dans l\'enseignement de la théorie. Directrice artistique de la Chorale.',
      hourlyRate: 38,
      instruments: [{ name: 'Formation musicale', level: 'ADVANCED' }, { name: 'Chant', level: 'INTERMEDIATE' }],
    },
    {
      email: 'p.moreau@hirondelles-musique.fr',
      firstName: 'Pierre', lastName: 'Moreau',
      bio: 'Ancien soliste, membre du quatuor Alsace. Très demandé pour les cours adultes.',
      hourlyRate: 45,
      instruments: [{ name: 'Violoncelle', level: 'ADVANCED' }, { name: 'Contrebasse', level: 'INTERMEDIATE' }],
    },
    {
      email: 'a.simon@hirondelles-musique.fr',
      firstName: 'Agathe', lastName: 'Simon',
      bio: 'Chanteuse lyrique et de variété, enseigne technique vocale tous niveaux.',
      hourlyRate: 42,
      instruments: [{ name: 'Chant', level: 'ADVANCED' }],
    },
    {
      email: 'j.fabre@hirondelles-musique.fr',
      firstName: 'Julien', lastName: 'Fabre',
      bio: 'Saxophoniste jazz et classique, co-animateur de l\'Atelier Jazz.',
      hourlyRate: 42,
      instruments: [{ name: 'Saxophone alto', level: 'ADVANCED' }, { name: 'Saxophone ténor', level: 'ADVANCED' }, { name: 'Clarinette', level: 'INTERMEDIATE' }],
    },
  ];

  const teacherIds: Record<string, string> = {};
  const teacherUserIds: Record<string, string> = {};
  for (const td of teacherDefs) {
    const u = await prisma.user.upsert({
      where: { email: td.email },
      update: {},
      create: {
        email: td.email,
        passwordHash: pw_teacher,
        role: Role.TEACHER,
        isActive: true,
        profile: { create: { firstName: td.firstName, lastName: td.lastName, city: 'Strasbourg' } },
      },
    });
    teacherUserIds[td.email] = u.id;

    let teacher = await prisma.teacher.findUnique({ where: { userId: u.id } });
    if (!teacher) {
      teacher = await prisma.teacher.create({
        data: { userId: u.id, bio: td.bio, hourlyRate: td.hourlyRate },
      });
    }
    teacherIds[td.email] = teacher.id;

    for (const instr of td.instruments) {
      const instrId = instruments[instr.name];
      if (!instrId) continue;
      await prisma.teacherInstrument.upsert({
        where: { teacherId_instrumentId: { teacherId: teacher.id, instrumentId: instrId } },
        update: {},
        create: { teacherId: teacher.id, instrumentId: instrId, level: instr.level },
      });
    }
  }
  console.log('✓ Teachers');

  const T = {
    marchand: teacherIds['h.marchand@hirondelles-musique.fr'],
    nguyen: teacherIds['t.nguyen@hirondelles-musique.fr'],
    leblanc: teacherIds['s.leblanc@hirondelles-musique.fr'],
    durand: teacherIds['m.durand@hirondelles-musique.fr'],
    petit_i: teacherIds['i.petit@hirondelles-musique.fr'],
    benali: teacherIds['k.benali@hirondelles-musique.fr'],
    rousseau: teacherIds['n.rousseau@hirondelles-musique.fr'],
    moreau: teacherIds['p.moreau@hirondelles-musique.fr'],
    simon: teacherIds['a.simon@hirondelles-musique.fr'],
    fabre: teacherIds['j.fabre@hirondelles-musique.fr'],
  };
  const TU = {
    marchand: teacherUserIds['h.marchand@hirondelles-musique.fr'],
    nguyen: teacherUserIds['t.nguyen@hirondelles-musique.fr'],
    leblanc: teacherUserIds['s.leblanc@hirondelles-musique.fr'],
    durand: teacherUserIds['m.durand@hirondelles-musique.fr'],
    petit_i: teacherUserIds['i.petit@hirondelles-musique.fr'],
    benali: teacherUserIds['k.benali@hirondelles-musique.fr'],
    rousseau: teacherUserIds['n.rousseau@hirondelles-musique.fr'],
    moreau: teacherUserIds['p.moreau@hirondelles-musique.fr'],
    simon: teacherUserIds['a.simon@hirondelles-musique.fr'],
    fabre: teacherUserIds['j.fabre@hirondelles-musique.fr'],
  };
  const R = rooms;
  const I = instruments;

  // ─────────────────────────────────────────────
  // 7. Courses (C01-C28)
  // ─────────────────────────────────────────────
  // schedule: [dayOfWeek, startHour, startMin]
  // 0=Sun,1=Mon,2=Tue,3=Wed,4=Thu,5=Fri,6=Sat
  const courseDefs = [
    // C01-C03 Piano
    { key: 'C01', name: 'Piano individuel — Débutant', type: CourseType.PRIVATE_LESSON, teacherId: T.marchand, roomId: R['Salle Chopin'], instrId: I['Piano'], maxStudents: 1, duration: 30, day: 2, hour: 14, min: 0, price: 680 },
    { key: 'C02', name: 'Piano individuel — Intermédiaire', type: CourseType.PRIVATE_LESSON, teacherId: T.marchand, roomId: R['Salle Chopin'], instrId: I['Piano'], maxStudents: 1, duration: 45, day: 1, hour: 15, min: 0, price: 680 },
    { key: 'C03', name: 'Piano individuel — Avancé', type: CourseType.PRIVATE_LESSON, teacherId: T.marchand, roomId: R['Salle Chopin'], instrId: I['Piano'], maxStudents: 1, duration: 60, day: 3, hour: 10, min: 0, price: 680 },
    // C04-C06 Guitare
    { key: 'C04', name: 'Guitare classique individuel', type: CourseType.PRIVATE_LESSON, teacherId: T.nguyen, roomId: R['Salle Guitares'], instrId: I['Guitare classique'], maxStudents: 1, duration: 30, day: 2, hour: 16, min: 0, price: 680 },
    { key: 'C05', name: 'Guitare électrique individuel', type: CourseType.PRIVATE_LESSON, teacherId: T.nguyen, roomId: R['Salle Guitares'], instrId: I['Guitare électrique'], maxStudents: 1, duration: 30, day: 3, hour: 16, min: 0, price: 680 },
    { key: 'C06', name: 'Ukulélé individuel', type: CourseType.PRIVATE_LESSON, teacherId: T.nguyen, roomId: R['Salle Guitares'], instrId: I['Ukulélé'], maxStudents: 1, duration: 30, day: 4, hour: 16, min: 0, price: 680 },
    // C07-C09 Cordes frottées
    { key: 'C07', name: 'Violon individuel — Débutant', type: CourseType.PRIVATE_LESSON, teacherId: T.leblanc, roomId: R['Salle Cordes'], instrId: I['Violon'], maxStudents: 1, duration: 30, day: 1, hour: 14, min: 0, price: 680 },
    { key: 'C08', name: 'Violon individuel — Avancé', type: CourseType.PRIVATE_LESSON, teacherId: T.leblanc, roomId: R['Salle Cordes'], instrId: I['Violon'], maxStudents: 1, duration: 45, day: 5, hour: 14, min: 0, price: 680 },
    { key: 'C09', name: 'Alto individuel', type: CourseType.PRIVATE_LESSON, teacherId: T.leblanc, roomId: R['Salle Cordes'], instrId: I['Alto'], maxStudents: 1, duration: 30, day: 6, hour: 10, min: 30, price: 680 },
    // C10-C12 Cuivres
    { key: 'C10', name: 'Trompette individuel', type: CourseType.PRIVATE_LESSON, teacherId: T.durand, roomId: R['Salle Cuivres'], instrId: I['Trompette'], maxStudents: 1, duration: 30, day: 1, hour: 16, min: 0, price: 578 },
    { key: 'C11', name: 'Trombone individuel', type: CourseType.PRIVATE_LESSON, teacherId: T.durand, roomId: R['Salle Cuivres'], instrId: I['Trombone'], maxStudents: 1, duration: 30, day: 2, hour: 17, min: 0, price: 578 },
    { key: 'C12', name: 'Cor individuel', type: CourseType.PRIVATE_LESSON, teacherId: T.durand, roomId: R['Salle Cuivres'], instrId: I['Cor'], maxStudents: 1, duration: 30, day: 3, hour: 17, min: 0, price: 578 },
    // C13 Flûte
    { key: 'C13', name: 'Flûte traversière individuel', type: CourseType.PRIVATE_LESSON, teacherId: T.petit_i, roomId: R['Salle Vents'], instrId: I['Flûte traversière'], maxStudents: 1, duration: 30, day: 2, hour: 10, min: 0, price: 680 },
    // C14-C15 Percussion
    { key: 'C14', name: 'Batterie individuel', type: CourseType.PRIVATE_LESSON, teacherId: T.benali, roomId: R['Salle Rythmes'], instrId: I['Batterie'], maxStudents: 1, duration: 30, day: 1, hour: 15, min: 0, price: 680 },
    { key: 'C15', name: 'Percussions classiques individuel', type: CourseType.PRIVATE_LESSON, teacherId: T.benali, roomId: R['Salle Rythmes'], instrId: I['Percussions classiques'], maxStudents: 1, duration: 30, day: 3, hour: 15, min: 0, price: 680 },
    // C16-C17 Cordes basses
    { key: 'C16', name: 'Violoncelle individuel', type: CourseType.PRIVATE_LESSON, teacherId: T.moreau, roomId: R['Salle Cordes'], instrId: I['Violoncelle'], maxStudents: 1, duration: 30, day: 3, hour: 11, min: 0, price: 680 },
    { key: 'C17', name: 'Contrebasse individuel', type: CourseType.PRIVATE_LESSON, teacherId: T.moreau, roomId: R['Salle Cordes'], instrId: I['Contrebasse'], maxStudents: 1, duration: 30, day: 4, hour: 10, min: 0, price: 680 },
    // C18-C19 Saxo/Clari
    { key: 'C18', name: 'Saxophone individuel', type: CourseType.PRIVATE_LESSON, teacherId: T.fabre, roomId: R['Salle Vents'], instrId: I['Saxophone alto'], maxStudents: 1, duration: 30, day: 2, hour: 14, min: 0, price: 680 },
    { key: 'C19', name: 'Clarinette individuel', type: CourseType.PRIVATE_LESSON, teacherId: T.fabre, roomId: R['Salle Vents'], instrId: I['Clarinette'], maxStudents: 1, duration: 30, day: 5, hour: 14, min: 0, price: 680 },
    // C20 Chant
    { key: 'C20', name: 'Chant individuel', type: CourseType.PRIVATE_LESSON, teacherId: T.simon, roomId: R['Salle Vents'], instrId: I['Chant'], maxStudents: 1, duration: 30, day: 1, hour: 14, min: 0, price: 680 },
    // C21-C23 FM
    { key: 'C21', name: 'Formation musicale — Débutants', type: CourseType.MUSIC_THEORY, teacherId: T.rousseau, roomId: R['Grande Salle'], instrId: I['Formation musicale'], maxStudents: 15, duration: 60, day: 3, hour: 14, min: 0, price: 0 },
    { key: 'C22', name: 'Formation musicale — Intermédiaires', type: CourseType.MUSIC_THEORY, teacherId: T.rousseau, roomId: R['Grande Salle'], instrId: I['Formation musicale'], maxStudents: 15, duration: 60, day: 6, hour: 10, min: 0, price: 0 },
    { key: 'C23', name: 'Formation musicale — Avancés', type: CourseType.MUSIC_THEORY, teacherId: T.rousseau, roomId: R['Grande Salle'], instrId: I['Formation musicale'], maxStudents: 15, duration: 90, day: 1, hour: 17, min: 0, price: 0 },
    // C24 Orchestre
    { key: 'C24', name: 'Orchestre Jeunes Les Hirondelles', type: CourseType.GROUP_INSTRUMENT, teacherId: T.leblanc, roomId: R['Grande Salle'], instrId: null, maxStudents: 25, duration: 90, day: 6, hour: 14, min: 30, price: 200 },
    // C25 Chorale
    { key: 'C25', name: 'Chorale Les Hirondelles', type: CourseType.GROUP_INSTRUMENT, teacherId: T.rousseau, roomId: R['Grande Salle'], instrId: I['Chant'], maxStudents: 25, duration: 60, day: 3, hour: 18, min: 0, price: 140 },
    // C26-C27 Atelier Jazz
    { key: 'C26', name: 'Atelier Jazz — Trimestre 1', type: CourseType.WORKSHOP, teacherId: T.nguyen, roomId: R['Grande Salle'], instrId: null, maxStudents: 12, duration: 90, day: 4, hour: 18, min: 0, price: 90 },
    { key: 'C27', name: 'Atelier Jazz — Trimestre 3', type: CourseType.WORKSHOP, teacherId: T.fabre, roomId: R['Grande Salle'], instrId: null, maxStudents: 12, duration: 90, day: 4, hour: 18, min: 0, price: 90 },
    // C28 Piano 4 mains
    { key: 'C28', name: 'Piano 4 mains', type: CourseType.GROUP_INSTRUMENT, teacherId: T.marchand, roomId: R['Salle Chopin'], instrId: I['Piano'], maxStudents: 4, duration: 60, day: 5, hour: 16, min: 0, price: 200 },
  ];

  const courseIds: Record<string, string> = {};
  for (const cd of courseDefs) {
    const existing = await prisma.course.findFirst({ where: { name: cd.name } });
    if (existing) {
      courseIds[cd.key] = existing.id;
      continue;
    }
    const c = await prisma.course.create({
      data: {
        name: cd.name,
        type: cd.type,
        teacherId: cd.teacherId,
        roomId: cd.roomId,
        instrumentId: cd.instrId ?? undefined,
        maxStudents: cd.maxStudents,
        durationMinutes: cd.duration,
        priceYearly: cd.price > 0 ? cd.price : undefined,
        isActive: true,
        color: '#8B5CF6',
      },
    });
    courseIds[cd.key] = c.id;
  }
  console.log('✓ Courses');

  // ─────────────────────────────────────────────
  // 8. Families, Parents, Students, Enrollments
  // ─────────────────────────────────────────────

  async function createParent(email: string, firstName: string, lastName: string, address?: string) {
    return prisma.user.upsert({
      where: { email },
      update: {},
      create: {
        email,
        passwordHash: pw_parent,
        role: Role.PARENT,
        isActive: true,
        profile: { create: { firstName, lastName, address, city: 'Strasbourg', postalCode: '67000' } },
      },
    });
  }

  async function createStudentUser(email: string, firstName: string, lastName: string, birthYear: number) {
    return prisma.user.upsert({
      where: { email },
      update: {},
      create: {
        email,
        passwordHash: pw_student,
        role: Role.STUDENT,
        isActive: true,
        profile: {
          create: {
            firstName,
            lastName,
            birthDate: new Date(`${birthYear}-06-01`),
            city: 'Strasbourg',
          },
        },
      },
    });
  }

  async function createFamily(name: string) {
    return prisma.family.upsert({
      where: { id: name }, // won't match, forces create
      update: {},
      create: { name },
    }).catch(async () => {
      const existing = await prisma.family.findFirst({ where: { name } });
      return existing!;
    });
  }

  async function addFamilyMember(familyId: string, userId: string, relation: FamilyRelation, isPrimary = false) {
    await prisma.familyMember.upsert({
      where: { familyId_userId: { familyId, userId } },
      update: {},
      create: { familyId, userId, relation, isPrimary },
    });
  }

  async function createStudent(userId: string, familyId: string | null) {
    const existing = await prisma.student.findUnique({ where: { userId } });
    if (existing) return existing;
    return prisma.student.create({ data: { userId, familyId } });
  }

  async function enroll(studentId: string, courseKey: string) {
    const courseId = courseIds[courseKey];
    if (!courseId) return;
    await prisma.enrollment.upsert({
      where: { studentId_courseId: { studentId, courseId } },
      update: {},
      create: {
        studentId,
        courseId,
        startDate: new Date('2025-09-15'),
        status: EnrollmentStatus.ACTIVE,
        paymentType: PaymentType.YEARLY,
      },
    });
  }

  // ── Family definitions ──────────────────────
  // Format: { family name, parents, children: [{ firstName, lastName, birthYear, courses[] }] }

  type ChildDef = { firstName: string; lastName: string; birthYear: number; courses: string[]; key: string };
  type FamilyDef = {
    name: string;
    address: string;
    parents: { email: string; firstName: string; lastName: string; isPrimary: boolean }[];
    children: ChildDef[];
  };

  const familyDefs: FamilyDef[] = [
    {
      name: 'Martin', address: '8 allée des Peupliers, 67200 Strasbourg',
      parents: [
        { email: 'f.martin@famille.fr', firstName: 'Frédéric', lastName: 'Martin', isPrimary: true },
        { email: 's.martin@famille.fr', firstName: 'Sandrine', lastName: 'Martin', isPrimary: false },
      ],
      children: [
        { key: 'hugo_martin', firstName: 'Hugo', lastName: 'Martin', birthYear: 2011, courses: ['C02', 'C22', 'C24'] },
        { key: 'lea_martin', firstName: 'Léa', lastName: 'Martin', birthYear: 2014, courses: ['C07', 'C21', 'C25'] },
        { key: 'emma_martin', firstName: 'Emma', lastName: 'Martin', birthYear: 2016, courses: ['C13', 'C21'] },
      ],
    },
    {
      name: 'Bernard', address: '23 rue du Maréchal-Joffre, 67100 Strasbourg',
      parents: [
        { email: 'l.bernard@famille.fr', firstName: 'Laurent', lastName: 'Bernard', isPrimary: true },
        { email: 'v.bernard@famille.fr', firstName: 'Véronique', lastName: 'Bernard', isPrimary: false },
      ],
      children: [
        { key: 'antoine_bernard', firstName: 'Antoine', lastName: 'Bernard', birthYear: 2009, courses: ['C04', 'C23', 'C26'] },
        { key: 'chloe_bernard', firstName: 'Chloé', lastName: 'Bernard', birthYear: 2012, courses: ['C02', 'C22'] },
        { key: 'mathis_bernard', firstName: 'Mathis', lastName: 'Bernard', birthYear: 2015, courses: ['C14', 'C21'] },
      ],
    },
    {
      name: 'Dupont', address: '5 rue de la Cigogne, 67000 Strasbourg',
      parents: [
        { email: 'o.dupont@famille.fr', firstName: 'Olivier', lastName: 'Dupont', isPrimary: true },
        { email: 'mc.dupont@famille.fr', firstName: 'Marie-Claire', lastName: 'Dupont', isPrimary: false },
      ],
      children: [
        { key: 'camille_dupont', firstName: 'Camille', lastName: 'Dupont', birthYear: 2010, courses: ['C08', 'C23', 'C24'] },
        { key: 'romain_dupont', firstName: 'Romain', lastName: 'Dupont', birthYear: 2013, courses: ['C18', 'C22'] },
        { key: 'elisa_dupont', firstName: 'Elisa', lastName: 'Dupont', birthYear: 2017, courses: ['C01', 'C21'] },
      ],
    },
    {
      name: 'Thomas', address: '17 avenue des Vosges, 67000 Strasbourg',
      parents: [
        { email: 'ph.thomas@famille.fr', firstName: 'Philippe', lastName: 'Thomas', isPrimary: true },
        { email: 'i.thomas@famille.fr', firstName: 'Isabelle', lastName: 'Thomas', isPrimary: false },
      ],
      children: [
        { key: 'lola_thomas', firstName: 'Lola', lastName: 'Thomas', birthYear: 2011, courses: ['C13', 'C22', 'C24'] },
        { key: 'baptiste_thomas', firstName: 'Baptiste', lastName: 'Thomas', birthYear: 2014, courses: ['C10', 'C21'] },
        { key: 'ines_thomas', firstName: 'Inès', lastName: 'Thomas', birthYear: 2016, courses: ['C16', 'C21'] },
        { key: 'victor_thomas', firstName: 'Victor', lastName: 'Thomas', birthYear: 2018, courses: ['C04', 'C21'] },
      ],
    },
    {
      name: 'Robert', address: '42 rue du Fossé-des-Treize, 67000 Strasbourg',
      parents: [
        { email: 's.robert@famille.fr', firstName: 'Sébastien', lastName: 'Robert', isPrimary: true },
        { email: 'c.robert@famille.fr', firstName: 'Céline', lastName: 'Robert', isPrimary: false },
      ],
      children: [
        { key: 'manon_robert', firstName: 'Manon', lastName: 'Robert', birthYear: 2009, courses: ['C03', 'C23', 'C25'] },
        { key: 'lucas_robert', firstName: 'Lucas', lastName: 'Robert', birthYear: 2012, courses: ['C14', 'C22'] },
        { key: 'jade_robert', firstName: 'Jade', lastName: 'Robert', birthYear: 2015, courses: ['C07', 'C21'] },
      ],
    },
    // 2-child families
    {
      name: 'Leroy', address: '3 rue des Bouchers, 67000 Strasbourg',
      parents: [{ email: 'ch.leroy@famille.fr', firstName: 'Christophe', lastName: 'Leroy', isPrimary: true }, { email: 'n.leroy@famille.fr', firstName: 'Nadia', lastName: 'Leroy', isPrimary: false }],
      children: [
        { key: 'theo_leroy', firstName: 'Théo', lastName: 'Leroy', birthYear: 2010, courses: ['C02', 'C23'] },
        { key: 'alice_leroy', firstName: 'Alice', lastName: 'Leroy', birthYear: 2013, courses: ['C16', 'C22'] },
      ],
    },
    {
      name: 'Girard', address: '9 rue du Dragon, 67000 Strasbourg',
      parents: [{ email: 'jp.girard@famille.fr', firstName: 'Jean-Paul', lastName: 'Girard', isPrimary: false }, { email: 'm.girard@famille.fr', firstName: 'Mélanie', lastName: 'Girard', isPrimary: true }],
      children: [
        { key: 'raphael_girard', firstName: 'Raphaël', lastName: 'Girard', birthYear: 2011, courses: ['C04', 'C22', 'C26'] },
        { key: 'sarah_girard', firstName: 'Sarah', lastName: 'Girard', birthYear: 2014, courses: ['C13', 'C21'] },
      ],
    },
    {
      name: 'Moreau-Famille', address: '14 quai des Bateliers, 67000 Strasbourg',
      parents: [{ email: 'd.moreau@famille.fr', firstName: 'David', lastName: 'Moreau', isPrimary: true }, { email: 'j.moreau@famille.fr', firstName: 'Julie', lastName: 'Moreau', isPrimary: false }],
      children: [
        { key: 'axel_moreau', firstName: 'Axel', lastName: 'Moreau', birthYear: 2012, courses: ['C18', 'C22'] },
        { key: 'nina_moreau', firstName: 'Nina', lastName: 'Moreau', birthYear: 2015, courses: ['C01', 'C21'] },
      ],
    },
    {
      name: 'Laurent', address: '27 rue de la Mésange, 67000 Strasbourg',
      parents: [{ email: 'p.laurent@famille.fr', firstName: 'Pascal', lastName: 'Laurent', isPrimary: true }, { email: 'as.laurent@famille.fr', firstName: 'Anne-Sophie', lastName: 'Laurent', isPrimary: false }],
      children: [
        { key: 'tom_laurent', firstName: 'Tom', lastName: 'Laurent', birthYear: 2009, courses: ['C10', 'C23', 'C24'] },
        { key: 'clara_laurent', firstName: 'Clara', lastName: 'Laurent', birthYear: 2012, courses: ['C08', 'C22'] },
      ],
    },
    {
      name: 'Simon-Famille', address: '6 rue des Francs-Bourgeois, 67000 Strasbourg',
      parents: [{ email: 'b.simon@famille.fr', firstName: 'Bruno', lastName: 'Simon', isPrimary: false }, { email: 'h.simon@famille.fr', firstName: 'Hélène', lastName: 'Simon', isPrimary: true }],
      children: [
        { key: 'leo_simon', firstName: 'Léo', lastName: 'Simon', birthYear: 2010, courses: ['C02', 'C22'] },
        { key: 'zoe_simon', firstName: 'Zoé', lastName: 'Simon', birthYear: 2013, courses: ['C20', 'C25'] },
      ],
    },
    {
      name: 'Michel', address: '18 rue de la Krutenau, 67000 Strasbourg',
      parents: [{ email: 'de.michel@famille.fr', firstName: 'Denis', lastName: 'Michel', isPrimary: true }, { email: 'pa.michel@famille.fr', firstName: 'Patricia', lastName: 'Michel', isPrimary: false }],
      children: [
        { key: 'paul_michel', firstName: 'Paul', lastName: 'Michel', birthYear: 2011, courses: ['C04', 'C22'] },
        { key: 'marie_michel', firstName: 'Marie', lastName: 'Michel', birthYear: 2014, courses: ['C07', 'C21'] },
      ],
    },
    {
      name: 'Lefebvre', address: '31 avenue de la Paix, 67000 Strasbourg',
      parents: [{ email: 'ar.lefebvre@famille.fr', firstName: 'Arnaud', lastName: 'Lefebvre', isPrimary: true }, { email: 'sy.lefebvre@famille.fr', firstName: 'Sylvie', lastName: 'Lefebvre', isPrimary: false }],
      children: [
        { key: 'nathan_lefebvre', firstName: 'Nathan', lastName: 'Lefebvre', birthYear: 2010, courses: ['C14', 'C23'] },
        { key: 'lucie_lefebvre', firstName: 'Lucie', lastName: 'Lefebvre', birthYear: 2013, courses: ['C13', 'C22'] },
      ],
    },
    {
      name: 'Roux', address: '5 impasse des Roses, 67200 Strasbourg',
      parents: [{ email: 'st.roux@famille.fr', firstName: 'Stéphane', lastName: 'Roux', isPrimary: false }, { email: 'au.roux@famille.fr', firstName: 'Aurélie', lastName: 'Roux', isPrimary: true }],
      children: [
        { key: 'matteo_roux', firstName: 'Matteo', lastName: 'Roux', birthYear: 2011, courses: ['C18', 'C22'] },
        { key: 'camille_roux', firstName: 'Camille', lastName: 'Roux', birthYear: 2014, courses: ['C04', 'C21'] },
      ],
    },
    {
      name: 'David', address: '44 rue du Vieux-Marché-aux-Poissons, 67000 Strasbourg',
      parents: [{ email: 'gi.david@famille.fr', firstName: 'Gilles', lastName: 'David', isPrimary: true }, { email: 'my.david@famille.fr', firstName: 'Myriam', lastName: 'David', isPrimary: false }],
      children: [
        { key: 'simon_david', firstName: 'Simon', lastName: 'David', birthYear: 2009, courses: ['C03', 'C23'] },
        { key: 'eva_david', firstName: 'Eva', lastName: 'David', birthYear: 2012, courses: ['C08', 'C22'] },
      ],
    },
    {
      name: 'Bertrand', address: '12 rue des Hallebardes, 67000 Strasbourg',
      parents: [{ email: 'ni.bertrand@famille.fr', firstName: 'Nicolas', lastName: 'Bertrand', isPrimary: false }, { email: 'ca.bertrand@famille.fr', firstName: 'Carole', lastName: 'Bertrand', isPrimary: true }],
      children: [
        { key: 'adrien_bertrand', firstName: 'Adrien', lastName: 'Bertrand', birthYear: 2010, courses: ['C04', 'C23', 'C26', 'C27'] },
        { key: 'sofia_bertrand', firstName: 'Sofia', lastName: 'Bertrand', birthYear: 2013, courses: ['C13', 'C22'] },
      ],
    },
    {
      name: 'Morel', address: '7 rue des Veaux, 67000 Strasbourg',
      parents: [{ email: 'xa.morel@famille.fr', firstName: 'Xavier', lastName: 'Morel', isPrimary: true }, { email: 'la.morel@famille.fr', firstName: 'Laure', lastName: 'Morel', isPrimary: false }],
      children: [
        { key: 'maxime_morel', firstName: 'Maxime', lastName: 'Morel', birthYear: 2011, courses: ['C10', 'C24'] },
        { key: 'chloe_morel', firstName: 'Chloé', lastName: 'Morel', birthYear: 2014, courses: ['C01', 'C21'] },
      ],
    },
    {
      name: 'Fournier', address: '20 rue du Fossé-des-Tanneurs, 67000 Strasbourg',
      parents: [{ email: 'al.fournier@famille.fr', firstName: 'Alain', lastName: 'Fournier', isPrimary: false }, { email: 'ch.fournier@famille.fr', firstName: 'Christine', lastName: 'Fournier', isPrimary: true }],
      children: [
        { key: 'arthur_fournier', firstName: 'Arthur', lastName: 'Fournier', birthYear: 2012, courses: ['C14', 'C22'] },
        { key: 'julie_fournier', firstName: 'Julie', lastName: 'Fournier', birthYear: 2015, courses: ['C07', 'C21'] },
      ],
    },
    {
      name: 'Giraud', address: '33 rue de la Nuée-Bleue, 67000 Strasbourg',
      parents: [{ email: 'ma.giraud@famille.fr', firstName: 'Marc', lastName: 'Giraud', isPrimary: true }, { email: 'de.giraud@famille.fr', firstName: 'Delphine', lastName: 'Giraud', isPrimary: false }],
      children: [
        { key: 'clement_giraud', firstName: 'Clément', lastName: 'Giraud', birthYear: 2010, courses: ['C02', 'C23', 'C25'] },
        { key: 'emilie_giraud', firstName: 'Emilie', lastName: 'Giraud', birthYear: 2013, courses: ['C20', 'C25'] },
      ],
    },
    {
      name: 'Bonnet', address: '8 quai des Pêcheurs, 67000 Strasbourg',
      parents: [{ email: 'fr.bonnet@famille.fr', firstName: 'Frédéric', lastName: 'Bonnet', isPrimary: false }, { email: 'is.bonnet@famille.fr', firstName: 'Isabelle', lastName: 'Bonnet', isPrimary: true }],
      children: [
        { key: 'oscar_bonnet', firstName: 'Oscar', lastName: 'Bonnet', birthYear: 2011, courses: ['C18', 'C27'] },
        { key: 'ines_bonnet', firstName: 'Inès', lastName: 'Bonnet', birthYear: 2014, courses: ['C16', 'C22'] },
      ],
    },
    {
      name: 'François', address: '15 rue des Orfèvres, 67000 Strasbourg',
      parents: [{ email: 'pa.francois@famille.fr', firstName: 'Pascal', lastName: 'François', isPrimary: true }, { email: 'ka.francois@famille.fr', firstName: 'Karine', lastName: 'François', isPrimary: false }],
      children: [
        { key: 'hugo_francois', firstName: 'Hugo', lastName: 'François', birthYear: 2012, courses: ['C04', 'C22'] },
        { key: 'manon_francois', firstName: 'Manon', lastName: 'François', birthYear: 2015, courses: ['C13', 'C21'] },
      ],
    },
    {
      name: 'Gauthier', address: '2 rue du Dôme, 67000 Strasbourg',
      parents: [{ email: 're.gauthier@famille.fr', firstName: 'Rémi', lastName: 'Gauthier', isPrimary: false }, { email: 'so.gauthier@famille.fr', firstName: 'Sophie', lastName: 'Gauthier', isPrimary: true }],
      children: [
        { key: 'theo_gauthier', firstName: 'Théo', lastName: 'Gauthier', birthYear: 2009, courses: ['C08', 'C23', 'C24'] },
        { key: 'rose_gauthier', firstName: 'Rose', lastName: 'Gauthier', birthYear: 2012, courses: ['C02', 'C22'] },
      ],
    },
    {
      name: 'Garcia', address: '19 rue du Général-de-Castelnau, 67000 Strasbourg',
      parents: [{ email: 'ca.garcia@famille.fr', firstName: 'Carlos', lastName: 'Garcia', isPrimary: true }, { email: 'lu.garcia@famille.fr', firstName: 'Lucie', lastName: 'Garcia', isPrimary: false }],
      children: [
        { key: 'diego_garcia', firstName: 'Diego', lastName: 'Garcia', birthYear: 2010, courses: ['C14', 'C23'] },
        { key: 'luna_garcia', firstName: 'Luna', lastName: 'Garcia', birthYear: 2013, courses: ['C20', 'C25'] },
      ],
    },
    {
      name: 'Perrin', address: '11 allée de la Robertsau, 67000 Strasbourg',
      parents: [{ email: 'an.perrin@famille.fr', firstName: 'Antoine', lastName: 'Perrin', isPrimary: false }, { email: 'vi.perrin@famille.fr', firstName: 'Virginie', lastName: 'Perrin', isPrimary: true }],
      children: [
        { key: 'ethan_perrin', firstName: 'Ethan', lastName: 'Perrin', birthYear: 2011, courses: ['C10', 'C22'] },
        { key: 'mia_perrin', firstName: 'Mia', lastName: 'Perrin', birthYear: 2014, courses: ['C07', 'C21'] },
      ],
    },
    {
      name: 'Lambert', address: '28 boulevard de la Victoire, 67000 Strasbourg',
      parents: [{ email: 'ol.lambert@famille.fr', firstName: 'Olivier', lastName: 'Lambert', isPrimary: true }, { email: 'st.lambert@famille.fr', firstName: 'Stéphanie', lastName: 'Lambert', isPrimary: false }],
      children: [
        { key: 'jules_lambert', firstName: 'Jules', lastName: 'Lambert', birthYear: 2010, courses: ['C02', 'C23'] },
        { key: 'lena_lambert', firstName: 'Léna', lastName: 'Lambert', birthYear: 2013, courses: ['C04', 'C22'] },
      ],
    },
  ];

  // Single-child families
  const singleFamilyDefs: FamilyDef[] = [
    { name: 'Chevalier', address: '4 rue Sainte-Marguerite, 67000 Strasbourg', parents: [{ email: 'marie.chevalier@famille.fr', firstName: 'Marie', lastName: 'Chevalier', isPrimary: true }], children: [{ key: 'noa_chevalier', firstName: 'Noa', lastName: 'Chevalier', birthYear: 2008, courses: ['C08', 'C23', 'C24'] }] },
    { name: 'Robin', address: '16 rue des Frères, 67000 Strasbourg', parents: [{ email: 'thierry.robin@famille.fr', firstName: 'Thierry', lastName: 'Robin', isPrimary: true }], children: [{ key: 'charlotte_robin', firstName: 'Charlotte', lastName: 'Robin', birthYear: 2009, courses: ['C03', 'C23'] }] },
    { name: 'Faure', address: '9 rue du Bain-aux-Plantes, 67000 Strasbourg', parents: [{ email: 'brigitte.faure@famille.fr', firstName: 'Brigitte', lastName: 'Faure', isPrimary: true }], children: [{ key: 'benjamin_faure', firstName: 'Benjamin', lastName: 'Faure', birthYear: 2010, courses: ['C16', 'C22', 'C24'] }] },
    { name: 'Renaud', address: '22 rue des Pompiers, 67000 Strasbourg', parents: [{ email: 'sylvain.renaud@famille.fr', firstName: 'Sylvain', lastName: 'Renaud', isPrimary: true }], children: [{ key: 'alexia_renaud', firstName: 'Alexia', lastName: 'Renaud', birthYear: 2011, courses: ['C13', 'C22'] }] },
    { name: 'Clement', address: '37 rue du Noyer, 67000 Strasbourg', parents: [{ email: 'patricia.clement@famille.fr', firstName: 'Patricia', lastName: 'Clement', isPrimary: true }], children: [{ key: 'mathieu_clement', firstName: 'Mathieu', lastName: 'Clement', birthYear: 2008, courses: ['C18', 'C23', 'C26', 'C27'] }] },
    { name: 'Rousseau2', address: '6 rue Brûlée, 67000 Strasbourg', parents: [{ email: 'jean.rousseau2@famille.fr', firstName: 'Jean', lastName: 'Rousseau', isPrimary: true }], children: [{ key: 'bastien_rousseau', firstName: 'Bastien', lastName: 'Rousseau', birthYear: 2013, courses: ['C04', 'C21'] }] },
    { name: 'Vincent', address: '13 rue des Charpentiers, 67000 Strasbourg', parents: [{ email: 'nathalie.vincent@famille.fr', firstName: 'Nathalie', lastName: 'Vincent', isPrimary: true }], children: [{ key: 'zara_vincent', firstName: 'Zara', lastName: 'Vincent', birthYear: 2014, courses: ['C07', 'C21'] }] },
    { name: 'Muller', address: '5 rue des Alsaciens, 67000 Strasbourg', parents: [{ email: 'dieter.muller@famille.fr', firstName: 'Dieter', lastName: 'Muller', isPrimary: true }], children: [{ key: 'karl_muller', firstName: 'Karl', lastName: 'Muller', birthYear: 2010, courses: ['C02', 'C22'] }] },
    { name: 'Gonzalez', address: '8 rue du Bouclier, 67000 Strasbourg', parents: [{ email: 'elena.gonzalez@famille.fr', firstName: 'Elena', lastName: 'Gonzalez', isPrimary: true }], children: [{ key: 'sofia_gonzalez', firstName: 'Sofia', lastName: 'Gonzalez', birthYear: 2012, courses: ['C04', 'C22'] }] },
    { name: 'Leclerc', address: '30 rue du Faubourg-National, 67000 Strasbourg', parents: [{ email: 'bernard.leclerc@famille.fr', firstName: 'Bernard', lastName: 'Leclerc', isPrimary: true }], children: [{ key: 'timothee_leclerc', firstName: 'Timothée', lastName: 'Leclerc', birthYear: 2009, courses: ['C14', 'C23'] }] },
    { name: 'Adam', address: '14 rue des Serruriers, 67000 Strasbourg', parents: [{ email: 'sylvie.adam@famille.fr', firstName: 'Sylvie', lastName: 'Adam', isPrimary: true }], children: [{ key: 'elsa_adam', firstName: 'Elsa', lastName: 'Adam', birthYear: 2010, courses: ['C20', 'C25'] }] },
    { name: 'Henry', address: '7 rue du Parchemin, 67000 Strasbourg', parents: [{ email: 'patrick.henry@famille.fr', firstName: 'Patrick', lastName: 'Henry', isPrimary: true }], children: [{ key: 'enzo_henry', firstName: 'Enzo', lastName: 'Henry', birthYear: 2011, courses: ['C10', 'C22', 'C24'] }] },
    { name: 'Jacquet', address: '2 rue de la Marne, 67000 Strasbourg', parents: [{ email: 'beatrice.jacquet@famille.fr', firstName: 'Béatrice', lastName: 'Jacquet', isPrimary: true }], children: [{ key: 'lily_jacquet', firstName: 'Lily', lastName: 'Jacquet', birthYear: 2015, courses: ['C13', 'C21'] }] },
    { name: 'Martini', address: '19 rue des Dentelles, 67000 Strasbourg', parents: [{ email: 'paolo.martini@famille.fr', firstName: 'Paolo', lastName: 'Martini', isPrimary: true }], children: [{ key: 'marco_martini', firstName: 'Marco', lastName: 'Martini', birthYear: 2008, courses: ['C03', 'C23'] }] },
    { name: 'Nguyen2', address: '25 avenue du Président-Wilson, 67000 Strasbourg', parents: [{ email: 'lan.nguyen2@famille.fr', firstName: 'Lan', lastName: 'Nguyen', isPrimary: true }], children: [{ key: 'mei_nguyen', firstName: 'Mei', lastName: 'Nguyen', birthYear: 2013, courses: ['C07', 'C21'] }] },
    { name: 'Pham', address: '11 rue de la Course, 67000 Strasbourg', parents: [{ email: 'thu.pham@famille.fr', firstName: 'Thu', lastName: 'Pham', isPrimary: true }], children: [{ key: 'linh_pham', firstName: 'Linh', lastName: 'Pham', birthYear: 2016, courses: ['C01', 'C21'] }] },
    { name: 'Hamidi', address: '40 rue de la Fonderie, 67000 Strasbourg', parents: [{ email: 'nadia.hamidi@famille.fr', firstName: 'Nadia', lastName: 'Hamidi', isPrimary: true }], children: [{ key: 'yasmine_hamidi', firstName: 'Yasmine', lastName: 'Hamidi', birthYear: 2012, courses: ['C13', 'C22'] }] },
    { name: 'Okafor', address: '6 rue des Glacières, 67000 Strasbourg', parents: [{ email: 'chisom.okafor@famille.fr', firstName: 'Chisom', lastName: 'Okafor', isPrimary: true }], children: [{ key: 'amara_okafor', firstName: 'Amara', lastName: 'Okafor', birthYear: 2011, courses: ['C14', 'C22'] }] },
    { name: 'Dubois', address: '17 rue des Bains, 67000 Strasbourg', parents: [{ email: 'fabrice.dubois@famille.fr', firstName: 'Fabrice', lastName: 'Dubois', isPrimary: true }], children: [{ key: 'victor_dubois', firstName: 'Victor', lastName: 'Dubois', birthYear: 2009, courses: ['C04', 'C23', 'C27'] }] },
    { name: 'Petit2', address: '23 rue des Veilles-Arcades, 67000 Strasbourg', parents: [{ email: 'gerard.petit2@famille.fr', firstName: 'Gérard', lastName: 'Petit', isPrimary: true }], children: [{ key: 'camille_petit', firstName: 'Camille', lastName: 'Petit', birthYear: 2014, courses: ['C09', 'C21'] }] },
    { name: 'Wagner', address: '8 rue des Pucelles, 67000 Strasbourg', parents: [{ email: 'klaus.wagner@famille.fr', firstName: 'Klaus', lastName: 'Wagner', isPrimary: true }], children: [{ key: 'hannah_wagner', firstName: 'Hannah', lastName: 'Wagner', birthYear: 2011, courses: ['C19', 'C22', 'C24'] }] },
    { name: 'Schmitt', address: '15 rue des Tonneliers, 67000 Strasbourg', parents: [{ email: 'elisabeth.schmitt@famille.fr', firstName: 'Elisabeth', lastName: 'Schmitt', isPrimary: true }], children: [{ key: 'lucas_schmitt', firstName: 'Lucas', lastName: 'Schmitt', birthYear: 2012, courses: ['C11', 'C22'] }] },
  ];

  const allFamilyDefs = [...familyDefs, ...singleFamilyDefs];
  const studentIdsByKey: Record<string, string> = {};

  for (const fd of allFamilyDefs) {
    const family = await createFamily(fd.name);

    // Parents
    for (const p of fd.parents) {
      const pu = await createParent(p.email, p.firstName, p.lastName, fd.address);
      await addFamilyMember(family.id, pu.id, FamilyRelation.PARENT, p.isPrimary);
    }

    // Children
    for (const child of fd.children) {
      const email = `${child.key.replace(/_/g, '.')}@eleve.hirondelles-musique.fr`;
      const su = await createStudentUser(email, child.firstName, child.lastName, child.birthYear);
      await addFamilyMember(family.id, su.id, FamilyRelation.CHILD, false);
      const student = await createStudent(su.id, family.id);
      studentIdsByKey[child.key] = student.id;
      for (const courseKey of child.courses) {
        await enroll(student.id, courseKey);
      }
    }
  }
  console.log(`✓ Families & students (${Object.keys(studentIdsByKey).length} students)`);

  // ── Adult students (no family) ──────────────
  const adultDefs = [
    { key: 'sandrine_beaumont', email: 'sandrine.beaumont@email.fr', firstName: 'Sandrine', lastName: 'Beaumont', birthYear: 1990, courses: ['C02'] },
    { key: 'philippe_renard', email: 'philippe.renard@email.fr', firstName: 'Philippe', lastName: 'Renard', birthYear: 1983, courses: ['C04'] },
    { key: 'cecile_aumont', email: 'cecile.aumont@email.fr', firstName: 'Cécile', lastName: 'Aumont', birthYear: 1997, courses: ['C20', 'C25'] },
    { key: 'marc_antoine_dubois', email: 'marc-antoine.dubois@email.fr', firstName: 'Marc-Antoine', lastName: 'Dubois', birthYear: 1994, courses: ['C18'] },
    { key: 'hanna_kowalski', email: 'hanna.kowalski@email.fr', firstName: 'Hanna', lastName: 'Kowalski', birthYear: 1999, courses: ['C07'] },
  ];

  for (const ad of adultDefs) {
    const su = await prisma.user.upsert({
      where: { email: ad.email },
      update: {},
      create: {
        email: ad.email,
        passwordHash: pw_student,
        role: Role.STUDENT,
        isActive: true,
        profile: { create: { firstName: ad.firstName, lastName: ad.lastName, birthDate: new Date(`${ad.birthYear}-01-01`), city: 'Strasbourg' } },
      },
    });
    const student = await createStudent(su.id, null);
    studentIdsByKey[ad.key] = student.id;
    for (const courseKey of ad.courses) {
      await enroll(student.id, courseKey);
    }
  }
  console.log('✓ Adult students');

  // ─────────────────────────────────────────────
  // 9. Sessions
  // ─────────────────────────────────────────────
  const courseSchedules: Record<string, { day: number; hour: number; min: number; duration: number; trimestre?: 1 | 3 }> = {
    C01: { day: 2, hour: 14, min: 0, duration: 30 },
    C02: { day: 1, hour: 15, min: 0, duration: 45 },
    C03: { day: 3, hour: 10, min: 0, duration: 60 },
    C04: { day: 2, hour: 16, min: 0, duration: 30 },
    C05: { day: 3, hour: 16, min: 0, duration: 30 },
    C06: { day: 4, hour: 16, min: 0, duration: 30 },
    C07: { day: 1, hour: 14, min: 0, duration: 30 },
    C08: { day: 5, hour: 14, min: 0, duration: 45 },
    C09: { day: 6, hour: 10, min: 30, duration: 30 },
    C10: { day: 1, hour: 16, min: 0, duration: 30 },
    C11: { day: 2, hour: 17, min: 0, duration: 30 },
    C12: { day: 3, hour: 17, min: 0, duration: 30 },
    C13: { day: 2, hour: 10, min: 0, duration: 30 },
    C14: { day: 1, hour: 15, min: 0, duration: 30 },
    C15: { day: 3, hour: 15, min: 0, duration: 30 },
    C16: { day: 3, hour: 11, min: 0, duration: 30 },
    C17: { day: 4, hour: 10, min: 0, duration: 30 },
    C18: { day: 2, hour: 14, min: 30, duration: 30 },
    C19: { day: 5, hour: 14, min: 0, duration: 30 },
    C20: { day: 1, hour: 14, min: 0, duration: 30 },
    C21: { day: 3, hour: 14, min: 0, duration: 60 },
    C22: { day: 6, hour: 10, min: 0, duration: 60 },
    C23: { day: 1, hour: 17, min: 0, duration: 90 },
    C24: { day: 6, hour: 14, min: 30, duration: 90 },
    C25: { day: 3, hour: 18, min: 0, duration: 60 },
    C26: { day: 4, hour: 18, min: 0, duration: 90, trimestre: 1 },
    C27: { day: 4, hour: 18, min: 0, duration: 90, trimestre: 3 },
    C28: { day: 5, hour: 16, min: 0, duration: 60 },
  };

  // Map courseKey -> [sessionIds]
  const sessionsByCourse: Record<string, string[]> = {};

  for (const [key, sched] of Object.entries(courseSchedules)) {
    const courseId = courseIds[key];
    if (!courseId) continue;

    let slots: Array<{ startTime: Date; endTime: Date }>;
    if (sched.trimestre) {
      slots = generateTrimesterSessions(sched.trimestre, sched.day, sched.hour, sched.min, sched.duration);
    } else {
      slots = generateWeeklySessions(sched.day, sched.hour, sched.min, sched.duration);
    }

    const now = new Date();
    const ids: string[] = [];
    for (const slot of slots) {
      const status: SessionStatus = slot.endTime < now ? 'COMPLETED' : 'SCHEDULED';
      const session = await prisma.courseSession.create({
        data: { courseId, startTime: slot.startTime, endTime: slot.endTime, status },
      });
      ids.push(session.id);
    }
    sessionsByCourse[key] = ids;
  }
  console.log('✓ Sessions generated');

  // ─────────────────────────────────────────────
  // 10. Attendance
  // ─────────────────────────────────────────────
  const now = new Date();

  // Build course -> enrolledStudents map
  for (const [courseKey, sessionIds] of Object.entries(sessionsByCourse)) {
    const courseId = courseIds[courseKey];
    const enrollments = await prisma.enrollment.findMany({
      where: { courseId, status: 'ACTIVE' },
      select: { studentId: true, student: { select: { userId: true } } },
    });

    // Only mark attendance for past sessions (first 70% to simulate partial marking)
    const pastSessions = sessionIds.filter((_, i) => {
      // We don't have date info here but we know past sessions are at start
      return true; // will check per session
    });

    let sessionIndex = 0;
    for (const sessionId of sessionIds) {
      const session = await prisma.courseSession.findUnique({ where: { id: sessionId }, select: { startTime: true } });
      if (!session || session.startTime > now) { sessionIndex++; continue; }

      for (const enrollment of enrollments) {
        // Find the student key
        const studentKey = Object.entries(studentIdsByKey).find(([, id]) => id === enrollment.studentId)?.[0] ?? 'unknown';
        const seed = (sessionIndex * 1000) + enrollments.indexOf(enrollment);
        const status = attendanceStatus(seed, studentKey);
        await prisma.attendance.upsert({
          where: { sessionId_studentId: { sessionId, studentId: enrollment.studentId } },
          update: {},
          create: { sessionId, studentId: enrollment.studentId, status },
        });
      }
      sessionIndex++;
    }
  }
  console.log('✓ Attendance');

  // ─────────────────────────────────────────────
  // 11. Events
  // ─────────────────────────────────────────────
  const events: Record<string, string> = {};

  const eventDefs = [
    {
      key: 'portes_ouvertes',
      name: 'Journée Portes Ouvertes',
      description: 'Découverte de tous les instruments, essais gratuits encadrés par les professeurs, inscription possible sur place pour le 2ème semestre.',
      startDate: new Date('2026-01-17T10:00:00'),
      endDate: new Date('2026-01-17T17:00:00'),
      isAllDay: false,
      location: 'Académie entière, 14 rue des Mélodies, 67000 Strasbourg',
      isPublic: true,
    },
    {
      key: 'audition_printemps',
      name: 'Audition de Printemps',
      description: 'Audition ouverte aux familles. Les élèves de chaque instrument se produisent en 3 sessions de 45 minutes (débutants, intermédiaires, avancés). Programme distribué à l\'entrée.',
      startDate: new Date('2026-03-15T14:00:00'),
      endDate: new Date('2026-03-15T18:00:00'),
      isAllDay: false,
      location: 'Grande Salle + Auditorium, 14 rue des Mélodies',
      isPublic: true,
    },
    {
      key: 'stage_orchestre',
      name: 'Stage Intensif Orchestre',
      description: 'Stage résidentiel pour les membres de l\'Orchestre Jeunes et de la Chorale. Répétitions intensives, soirée jeux musicaux, mini-concert interne le dimanche.',
      startDate: new Date('2026-03-27'),
      endDate: new Date('2026-03-29'),
      isAllDay: true,
      location: 'Centre de loisirs La Clairière, Barr (67)',
      isPublic: false,
    },
    {
      key: 'concert_fin_annee',
      name: 'Grand Concert de Fin d\'Année',
      description: 'Concert de clôture de l\'année scolaire. Orchestre Jeunes (45 min), solistes sélectionnés (30 min), Chorale (20 min), Finale orchestre + chorale réunis. Buffet offert après le concert.',
      startDate: new Date('2026-06-20T19:00:00'),
      endDate: new Date('2026-06-20T22:30:00'),
      isAllDay: false,
      location: 'Auditorium, 14 rue des Mélodies, 67000 Strasbourg',
      isPublic: true,
    },
  ];

  for (const ev of eventDefs) {
    const existing = await prisma.event.findFirst({ where: { name: ev.name } });
    const event = existing ?? await prisma.event.create({
      data: {
        name: ev.name,
        description: ev.description,
        startDate: ev.startDate,
        endDate: ev.endDate,
        isAllDay: ev.isAllDay,
        location: ev.location,
        isPublic: ev.isPublic,
      },
    });
    events[ev.key] = event.id;
  }

  // Add teachers as STAFF to all events
  for (const eventId of Object.values(events)) {
    for (const userId of Object.values(TU)) {
      await prisma.eventParticipant.upsert({
        where: { eventId_userId: { eventId, userId } },
        update: {},
        create: { eventId, userId, role: EventParticipantRole.STAFF },
      });
    }
  }

  // Add performers to audition & concert
  const performerKeys = ['hugo_martin', 'camille_dupont', 'noa_chevalier', 'charlotte_robin', 'simon_david', 'manon_robert', 'theo_gauthier', 'antoine_bernard', 'mathieu_clement', 'tom_laurent', 'adrien_bertrand'];
  for (const key of performerKeys) {
    const studentId = studentIdsByKey[key];
    if (!studentId) continue;
    const student = await prisma.student.findUnique({ where: { id: studentId }, select: { userId: true } });
    if (!student) continue;
    for (const evKey of ['audition_printemps', 'concert_fin_annee']) {
      await prisma.eventParticipant.upsert({
        where: { eventId_userId: { eventId: events[evKey], userId: student.userId } },
        update: {},
        create: { eventId: events[evKey], userId: student.userId, role: EventParticipantRole.PERFORMER },
      });
    }
  }
  console.log('✓ Events');

  // ─────────────────────────────────────────────
  // 12. Conversations & Messages
  // ─────────────────────────────────────────────
  const iThomas = await prisma.user.findUnique({ where: { email: 'i.thomas@famille.fr' } });
  const nRousseauUser = await prisma.user.findUnique({ where: { email: 'n.rousseau@hirondelles-musique.fr' } });
  const adminUserFull = await prisma.user.findUnique({ where: { email: 'admin@hirondelles-musique.fr' } });
  const hMarchandUser = await prisma.user.findUnique({ where: { email: 'h.marchand@hirondelles-musique.fr' } });
  const sDuboisUser = await prisma.user.findUnique({ where: { email: 'sandrine.beaumont@email.fr' } });
  const mDurandUser = await prisma.user.findUnique({ where: { email: 'm.durand@hirondelles-musique.fr' } });
  const vPerrinUser = await prisma.user.findUnique({ where: { email: 'vi.perrin@famille.fr' } });
  const odupontUser = await prisma.user.findUnique({ where: { email: 'o.dupont@famille.fr' } });
  const thuPhamUser = await prisma.user.findUnique({ where: { email: 'thu.pham@famille.fr' } });

  async function createConversation(participants: string[], messages: { senderId: string; content: string; date: Date }[], name?: string) {
    const conv = await prisma.conversation.create({
      data: {
        type: participants.length > 2 ? ConvType.GROUP : ConvType.DIRECT,
        name,
        participants: {
          create: participants.map((userId) => ({ userId })),
        },
      },
    });
    for (const msg of messages) {
      await prisma.message.create({
        data: {
          conversationId: conv.id,
          senderId: msg.senderId,
          content: msg.content,
          createdAt: msg.date,
          updatedAt: msg.date,
        },
      });
    }
    return conv;
  }

  if (iThomas && nRousseauUser) {
    await createConversation([iThomas.id, nRousseauUser.id], [
      { senderId: iThomas.id, content: 'Bonjour Madame Rousseau, Baptiste ne pourra pas venir mercredi prochain car il a rendez-vous chez l\'orthodontiste. Pourrait-il récupérer la séance ?', date: new Date('2026-01-08T09:15:00') },
      { senderId: nRousseauUser.id, content: 'Bonjour, bien sûr, pas de problème. Je lui enverrai les exercices par ce biais. Il peut rejoindre le groupe du samedi 17h pour compenser si vous souhaitez.', date: new Date('2026-01-08T10:30:00') },
      { senderId: iThomas.id, content: 'Parfait, merci beaucoup !', date: new Date('2026-01-08T10:45:00') },
    ]);
  }

  if (sDuboisUser && hMarchandUser) {
    await createConversation([sDuboisUser.id, hMarchandUser.id], [
      { senderId: sDuboisUser.id, content: 'Bonjour Hélène, je dois décaler mon cours de mercredi prochain, aurais-tu un créneau jeudi ou vendredi ?', date: new Date('2026-01-22T11:00:00') },
      { senderId: hMarchandUser.id, content: 'Bonjour Sandrine, je peux te proposer jeudi 29 janvier à 18h30 ou vendredi 30 à 17h, qu\'est-ce qui t\'arrange ?', date: new Date('2026-01-22T14:20:00') },
      { senderId: sDuboisUser.id, content: 'Jeudi 18h30 c\'est parfait, merci !', date: new Date('2026-01-22T15:05:00') },
    ]);
  }

  if (mDurandUser && vPerrinUser) {
    await createConversation([mDurandUser.id, vPerrinUser.id], [
      { senderId: mDurandUser.id, content: 'Bonjour, je souhaitais vous informer qu\'Ethan a réalisé d\'excellents progrès ce semestre. Il maîtrise maintenant les gammes jusqu\'à 3 bémols et son son s\'est beaucoup amélioré. Je l\'encourage vivement à intégrer l\'Orchestre Jeunes à la rentrée de septembre prochain.', date: new Date('2026-02-03T16:00:00') },
      { senderId: vPerrinUser.id, content: 'Bonjour M. Durand, merci pour ce retour encourageant ! Ethan sera ravi d\'apprendre ça. Nous en parlerons ensemble ce week-end.', date: new Date('2026-02-04T09:30:00') },
    ]);
  }

  if (adminUserFull && odupontUser) {
    await createConversation([adminUserFull.id, odupontUser.id], [
      { senderId: adminUserFull.id, content: 'Bonjour M. et Mme Dupont, nous vous rappelons que la facture n°2026-018 d\'un montant de €1 960 pour le 2ème semestre reste impayée. Pourriez-vous régulariser votre situation avant le 28 février ? Merci de contacter notre secrétariat au 03 88 45 12 67.', date: new Date('2026-02-10T09:00:00') },
    ]);
  }

  if (thuPhamUser && hMarchandUser) {
    await createConversation([thuPhamUser.id, hMarchandUser.id], [
      { senderId: thuPhamUser.id, content: 'Bonjour Madame, Linh a encore été malade cette semaine (bronchite). C\'est la 4ème absence depuis janvier. Nous craignons de trop prendre de retard. Est-il possible d\'avoir un bilan avec son professeur ?', date: new Date('2026-03-05T08:30:00') },
      { senderId: hMarchandUser.id, content: 'Bonjour Mme Pham, je comprends votre inquiétude. Hélène suit bien Linh et me dit qu\'elle rattrape vite. Je vous propose un rendez-vous le samedi 14 mars à 11h30, est-ce possible ?', date: new Date('2026-03-05T10:15:00') },
    ]);
  }

  // Announcement
  if (adminUserFull && nRousseauUser && hMarchandUser && mDurandUser) {
    const allUserIds = [adminUserFull.id, ...Object.values(TU)];
    const conv = await prisma.conversation.create({
      data: {
        type: ConvType.ANNOUNCEMENT,
        name: 'Annonces Académie 2025-2026',
        participants: { create: allUserIds.map((userId) => ({ userId, isAdmin: userId === adminUserFull.id })) },
      },
    });
    await prisma.message.create({
      data: {
        conversationId: conv.id,
        senderId: hMarchandUser.id,
        content: 'Chers élèves et familles, je suis ravie de vous annoncer que l\'Audition de Printemps aura lieu le dimanche 15 mars de 14h à 18h. Les inscriptions pour se produire sont ouvertes jusqu\'au 1er mars. Tous les élèves ayant au moins 6 mois d\'ancienneté sont encouragés à participer ! Le programme sera affiché prochainement. Bonne pratique à tous.',
        createdAt: new Date('2026-01-15T11:00:00'),
        updatedAt: new Date('2026-01-15T11:00:00'),
      },
    });
    await prisma.message.create({
      data: {
        conversationId: conv.id,
        senderId: nRousseauUser.id,
        content: 'Bravo à tous pour vos prestations de dimanche ! Vous avez fait honneur à l\'académie. Pour le cours de lundi, nous commençons le chapitre sur les modes ecclésiastiques — pensez à relire votre cours sur les gammes majeures. À lundi !',
        createdAt: new Date('2026-03-20T12:00:00'),
        updatedAt: new Date('2026-03-20T12:00:00'),
      },
    });
  }
  console.log('✓ Conversations & messages');

  // ─────────────────────────────────────────────
  // 13. Invoices
  // ─────────────────────────────────────────────
  let invoiceNumber = 1;
  const familiesForInvoice = await prisma.family.findMany({ include: { students: { include: { enrollments: { include: { course: true } } } } } });

  for (const family of familiesForInvoice) {
    if (family.students.length === 0) continue;

    for (const semesterIdx of [0, 1]) {
      const periodStart = semesterIdx === 0 ? new Date('2025-09-15') : new Date('2026-01-06');
      const periodEnd = semesterIdx === 0 ? new Date('2026-01-05') : new Date('2026-06-30');
      const dueDate = semesterIdx === 0 ? new Date('2025-10-15') : new Date('2026-02-15');

      let subtotal = 0;
      const items: { description: string; quantity: number; unitPrice: number; total: number; studentId?: string; courseId?: string }[] = [];

      for (let childIdx = 0; childIdx < family.students.length; childIdx++) {
        const student = family.students[childIdx];
        const discount = childIdx === 0 ? 0 : childIdx === 1 ? 0.05 : 0.30;

        for (const enrollment of student.enrollments) {
          if (enrollment.status !== 'ACTIVE') continue;
          const course = enrollment.course;
          let price = Number(course.priceYearly ?? 0);
          if (price === 0) continue;
          const semPrice = price / 2;
          const discounted = semPrice * (1 - discount);
          subtotal += discounted;
          items.push({
            description: `${course.name} — ${family.students.length > 1 && childIdx > 0 ? `${Math.round(discount * 100)}% réduction fratrie` : 'tarif normal'}`,
            quantity: 1,
            unitPrice: Math.round(discounted * 100) / 100,
            total: Math.round(discounted * 100) / 100,
            studentId: student.id,
            courseId: course.id,
          });
        }
      }

      if (items.length === 0) continue;

      // Determine status: first few paid, one overdue, one partial
      let status: InvoiceStatus = 'PAID';
      if (family.name === 'Dupont' && semesterIdx === 1) status = 'OVERDUE';
      else if (family.name === 'Pham' && semesterIdx === 1) status = 'PARTIAL';

      const invoice = await prisma.invoice.create({
        data: {
          number: `2026-${String(invoiceNumber++).padStart(3, '0')}`,
          familyId: family.id,
          periodStart,
          periodEnd,
          dueDate,
          status,
          subtotal: Math.round(subtotal * 100) / 100,
          discount: 0,
          total: Math.round(subtotal * 100) / 100,
          items: { create: items },
        },
      });

      if (status === 'PAID') {
        await prisma.payment.create({
          data: {
            invoiceId: invoice.id,
            amount: Math.round(subtotal * 100) / 100,
            method: PaymentMethod.BANK_TRANSFER,
            paidAt: new Date(dueDate.getTime() - 5 * 24 * 60 * 60 * 1000),
          },
        });
      } else if (status === 'PARTIAL') {
        await prisma.payment.create({
          data: {
            invoiceId: invoice.id,
            amount: Math.round(subtotal * 0.5 * 100) / 100,
            method: PaymentMethod.CASH,
            paidAt: dueDate,
          },
        });
      }
    }
  }
  console.log('✓ Invoices');

  // ─────────────────────────────────────────────
  // 14. Pricing Rules
  // ─────────────────────────────────────────────
  await prisma.pricingRule.createMany({
    skipDuplicates: true,
    data: [
      {
        name: 'Cours particulier — 30 min',
        courseType: CourseType.PRIVATE_LESSON,
        pricePerSession: 25.00,
        priceMonthly: 85.00,
        priceYearly: 850.00,
        isDefault: false,
      },
      {
        name: 'Cours particulier — 45 min',
        courseType: CourseType.PRIVATE_LESSON,
        pricePerSession: 32.00,
        priceMonthly: 110.00,
        priceYearly: 1100.00,
        isDefault: true,
      },
      {
        name: 'Cours particulier — 60 min',
        courseType: CourseType.PRIVATE_LESSON,
        pricePerSession: 42.00,
        priceMonthly: 145.00,
        priceYearly: 1450.00,
        isDefault: false,
      },
      {
        name: 'Cours collectif instrument',
        courseType: CourseType.GROUP_INSTRUMENT,
        pricePerSession: 15.00,
        priceMonthly: 55.00,
        priceYearly: 550.00,
        isDefault: true,
      },
      {
        name: 'Formation musicale',
        courseType: CourseType.MUSIC_THEORY,
        pricePerSession: 12.00,
        priceMonthly: 45.00,
        priceYearly: 450.00,
        isDefault: true,
      },
      {
        name: 'Stage / Atelier',
        courseType: CourseType.WORKSHOP,
        pricePerSession: 20.00,
        isDefault: true,
      },
      {
        name: 'Masterclass',
        courseType: CourseType.MASTERCLASS,
        pricePerSession: 35.00,
        isDefault: true,
      },
    ],
  });
  console.log('✓ Pricing Rules');

  // ─────────────────────────────────────────────
  // 15. Notifications
  // ─────────────────────────────────────────────
  if (hMarchandUser) {
    await prisma.notification.createMany({
      data: [
        {
          userId: hMarchandUser.id,
          type: 'SYSTEM',
          title: 'Inscription confirmée',
          content: 'Inscription de Victor Thomas (Guitare + FM Débutants) confirmée pour l\'année 2025-2026.',
          createdAt: new Date('2025-09-10T10:00:00'),
        },
        {
          userId: hMarchandUser.id,
          type: 'COURSE_REMINDER',
          title: 'Répétition générale audition',
          content: 'Rappel : Orchestre Jeunes ce samedi 14h30 — Répétition générale audition. Présence obligatoire.',
          createdAt: new Date('2026-03-13T09:00:00'),
        },
      ],
    });
  }
  if (thuPhamUser) {
    await prisma.notification.create({
      data: {
        userId: thuPhamUser.id,
        type: 'ABSENCE',
        title: 'Absence enregistrée — Linh Pham',
        content: 'Linh Pham a été marquée absente au cours de Piano débutant du 12 février (Hélène Marchand).',
        createdAt: new Date('2026-02-12T16:30:00'),
      },
    });
  }
  if (odupontUser) {
    await prisma.notification.create({
      data: {
        userId: odupontUser.id,
        type: 'INVOICE_DUE',
        title: 'Facture en retard',
        content: 'La facture 2026-018 d\'un montant de €1 960 est en retard de paiement. Échéance dépassée.',
        createdAt: new Date('2026-03-01T09:00:00'),
      },
    });
  }
  console.log('✓ Notifications');

  // Summary
  const totalStudents = await prisma.student.count();
  const totalTeachers = await prisma.teacher.count();
  const totalCourses = await prisma.course.count();
  const totalSessions = await prisma.courseSession.count();
  const totalAttendance = await prisma.attendance.count();
  const totalInvoices = await prisma.invoice.count();
  const totalEvents = await prisma.event.count();

  console.log('\n🎉 Seed complete!');
  console.log(`   Students: ${totalStudents}, Teachers: ${totalTeachers}, Courses: ${totalCourses}`);
  console.log(`   Sessions: ${totalSessions}, Attendance: ${totalAttendance}`);
  console.log(`   Events: ${totalEvents}, Invoices: ${totalInvoices}`);
  console.log('\n📋 Login credentials:');
  console.log('   SUPER_ADMIN: admin@hirondelles-musique.fr / Admin1234!');
  console.log('   TEACHER:     h.marchand@hirondelles-musique.fr / Teacher1234!');
  console.log('   TEACHER:     t.nguyen@hirondelles-musique.fr / Teacher1234!');
  console.log('   PARENT:      f.martin@famille.fr / Parent1234!');
  console.log('   PARENT:      o.dupont@famille.fr / Parent1234! (has overdue invoice)');
  console.log('   STUDENT:     sandrine.beaumont@email.fr / Student1234!');
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
