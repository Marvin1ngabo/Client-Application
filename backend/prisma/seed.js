const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');

const prisma = new PrismaClient();

function generateSalt(rounds = 16) {
  return crypto.randomBytes(rounds).toString('hex');
}

function hashPassword(password, salt, pepper = 'your_pepper_string_change_this_in_production_abcdef') {
  const hash = crypto
    .createHash('sha512')
    .update(password + salt + pepper)
    .digest('hex');
  return `${salt}:${hash}`;
}

async function main() {
  console.log('🌱 Seeding database...');

  // Create Admin User
  const adminSalt = generateSalt(16);
  const adminPasswordHash = hashPassword('Admin123!', adminSalt);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@school.com' },
    update: {},
    create: {
      email: 'admin@school.com',
      passwordHash: adminPasswordHash,
      role: 'ADMIN',
      firstName: 'Admin',
      lastName: 'User',
      phone: '+250788000000',
      isActive: true,
    },
  });

  console.log('✅ Admin user created:', admin.email);

  // Create Teacher User
  const teacherSalt = generateSalt(16);
  const teacherPasswordHash = hashPassword('Teacher123!', teacherSalt);

  const teacherUser = await prisma.user.upsert({
    where: { email: 'teacher@school.com' },
    update: {},
    create: {
      email: 'teacher@school.com',
      passwordHash: teacherPasswordHash,
      role: 'TEACHER',
      firstName: 'John',
      lastName: 'Teacher',
      phone: '+250788111111',
      isActive: true,
    },
  });

  const teacher = await prisma.teacher.upsert({
    where: { userId: teacherUser.id },
    update: {},
    create: {
      userId: teacherUser.id,
      employeeNumber: 'TCH001',
      subjects: ['Mathematics', 'Physics'],
    },
  });

  console.log('✅ Teacher user created:', teacherUser.email);

  // Create Student User
  const studentSalt = generateSalt(16);
  const studentPasswordHash = hashPassword('Student123!', studentSalt);

  const studentUser = await prisma.user.upsert({
    where: { email: 'student@school.com' },
    update: {},
    create: {
      email: 'student@school.com',
      passwordHash: studentPasswordHash,
      role: 'STUDENT',
      firstName: 'Jane',
      lastName: 'Student',
      phone: '+250788222222',
      isActive: true,
    },
  });

  // Create Parent User FIRST (before student)
  const parentSalt = generateSalt(16);
  const parentPasswordHash = hashPassword('Parent123!', parentSalt);

  const parentUser = await prisma.user.upsert({
    where: { email: 'parent@school.com' },
    update: {},
    create: {
      email: 'parent@school.com',
      passwordHash: parentPasswordHash,
      role: 'PARENT',
      firstName: 'Mary',
      lastName: 'Parent',
      phone: '+250788333333',
      isActive: true,
    },
  });

  console.log('✅ Parent user created:', parentUser.email);

  // Now create student and link to parent
  const student = await prisma.student.upsert({
    where: { userId: studentUser.id },
    update: {
      parentId: parentUser.id, // Link to parent
    },
    create: {
      userId: studentUser.id,
      studentNumber: 'STU001',
      parentId: parentUser.id, // Link to parent
    },
  });

  // Create fee account for student
  await prisma.feeAccount.upsert({
    where: { studentId: student.id },
    update: {},
    create: {
      studentId: student.id,
      balance: 10000,
      currency: 'RWF',
    },
  });

  console.log('✅ Student user created:', studentUser.email);
  console.log('✅ Student linked to parent');

  console.log('\n🎉 Seeding completed!\n');
  console.log('📝 Default Credentials:');
  console.log('Admin:   admin@school.com / Admin123!');
  console.log('Teacher: teacher@school.com / Teacher123!');
  console.log('Student: student@school.com / Student123!');
  console.log('Parent:  parent@school.com / Parent123!\n');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
