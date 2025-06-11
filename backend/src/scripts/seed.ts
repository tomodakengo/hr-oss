import { PrismaClient, UserRole, CompanySize, EmploymentType, Gender } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Create sample company
  const company = await prisma.company.create({
    data: {
      name: 'サンプル会社株式会社',
      email: 'info@sample-company.com',
      phone: '03-1234-5678',
      address: '東京都渋谷区サンプル1-2-3',
      website: 'https://sample-company.com',
      industry: 'IT・ソフトウェア',
      size: CompanySize.MEDIUM,
    },
  });

  console.log('✅ Company created:', company.name);

  // Create admin user
  const hashedPassword = await bcrypt.hash('admin123', 12);
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@sample-company.com',
      password: hashedPassword,
      firstName: '管理者',
      lastName: '田中',
      role: UserRole.ADMIN,
      companyId: company.id,
    },
  });

  console.log('✅ Admin user created:', adminUser.email);

  // Create HR staff user
  const hrPassword = await bcrypt.hash('hr123', 12);
  const hrUser = await prisma.user.create({
    data: {
      email: 'hr@sample-company.com',
      password: hrPassword,
      firstName: '人事',
      lastName: '佐藤',
      role: UserRole.HR_STAFF,
      companyId: company.id,
    },
  });

  console.log('✅ HR user created:', hrUser.email);

  // Create departments
  const departments = await Promise.all([
    prisma.department.create({
      data: {
        name: '開発部',
        description: 'ソフトウェア開発を担当する部署',
        companyId: company.id,
      },
    }),
    prisma.department.create({
      data: {
        name: '営業部',
        description: '営業活動を担当する部署',
        companyId: company.id,
      },
    }),
    prisma.department.create({
      data: {
        name: '人事部',
        description: '人事・総務を担当する部署',
        companyId: company.id,
      },
    }),
  ]);

  console.log('✅ Departments created:', departments.map(d => d.name).join(', '));

  // Create positions
  const positions = await Promise.all([
    prisma.position.create({
      data: {
        name: 'シニアエンジニア',
        description: '上級開発者',
        level: 3,
        baseSalary: 600000,
        companyId: company.id,
        departmentId: departments[0].id,
      },
    }),
    prisma.position.create({
      data: {
        name: 'エンジニア',
        description: '開発者',
        level: 2,
        baseSalary: 450000,
        companyId: company.id,
        departmentId: departments[0].id,
      },
    }),
    prisma.position.create({
      data: {
        name: '営業マネージャー',
        description: '営業管理者',
        level: 3,
        baseSalary: 550000,
        companyId: company.id,
        departmentId: departments[1].id,
      },
    }),
    prisma.position.create({
      data: {
        name: '人事スタッフ',
        description: '人事担当者',
        level: 2,
        baseSalary: 400000,
        companyId: company.id,
        departmentId: departments[2].id,
      },
    }),
  ]);

  console.log('✅ Positions created:', positions.map(p => p.name).join(', '));

  // Create sample employees
  const employees = await Promise.all([
    prisma.employee.create({
      data: {
        employeeNumber: 'EMP001',
        email: 'yamada@sample-company.com',
        firstName: '太郎',
        lastName: '山田',
        firstNameKana: 'タロウ',
        lastNameKana: 'ヤマダ',
        birthDate: new Date('1990-05-15'),
        gender: Gender.MALE,
        phone: '090-1234-5678',
        address: '東京都新宿区サンプル2-3-4',
        postalCode: '160-0001',
        hireDate: new Date('2020-04-01'),
        employmentType: EmploymentType.FULL_TIME,
        companyId: company.id,
        departmentId: departments[0].id,
        positionId: positions[0].id,
      },
    }),
    prisma.employee.create({
      data: {
        employeeNumber: 'EMP002',
        email: 'suzuki@sample-company.com',
        firstName: '花子',
        lastName: '鈴木',
        firstNameKana: 'ハナコ',
        lastNameKana: 'スズキ',
        birthDate: new Date('1992-08-22'),
        gender: Gender.FEMALE,
        phone: '090-2345-6789',
        address: '東京都渋谷区サンプル3-4-5',
        postalCode: '150-0001',
        hireDate: new Date('2021-07-01'),
        employmentType: EmploymentType.FULL_TIME,
        companyId: company.id,
        departmentId: departments[0].id,
        positionId: positions[1].id,
      },
    }),
    prisma.employee.create({
      data: {
        employeeNumber: 'EMP003',
        email: 'tanaka@sample-company.com',
        firstName: '次郎',
        lastName: '田中',
        firstNameKana: 'ジロウ',
        lastNameKana: 'タナカ',
        birthDate: new Date('1988-12-10'),
        gender: Gender.MALE,
        phone: '090-3456-7890',
        address: '東京都港区サンプル4-5-6',
        postalCode: '108-0001',
        hireDate: new Date('2019-10-01'),
        employmentType: EmploymentType.FULL_TIME,
        companyId: company.id,
        departmentId: departments[1].id,
        positionId: positions[2].id,
      },
    }),
  ]);

  console.log('✅ Employees created:', employees.map(e => `${e.lastName} ${e.firstName}`).join(', '));

  // Create sample attendance records for the current month
  const today = new Date();
  const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();

  const attendanceRecords = [];
  for (let day = 1; day <= Math.min(daysInMonth, today.getDate()); day++) {
    const date = new Date(today.getFullYear(), today.getMonth(), day);
    
    // Skip weekends
    if (date.getDay() === 0 || date.getDay() === 6) continue;

    for (const employee of employees) {
      const clockIn = new Date(date);
      clockIn.setHours(9, Math.floor(Math.random() * 30), 0, 0); // 9:00-9:30

      const clockOut = new Date(date);
      clockOut.setHours(18, Math.floor(Math.random() * 60), 0, 0); // 18:00-19:00

      const workHours = (clockOut.getTime() - clockIn.getTime()) / (1000 * 60 * 60);
      const overtimeHours = Math.max(0, workHours - 8);

      attendanceRecords.push({
        date,
        clockIn,
        clockOut,
        workHours: Number(workHours.toFixed(2)),
        overtimeHours: Number(overtimeHours.toFixed(2)),
        employeeId: employee.id,
        companyId: company.id,
      });
    }
  }

  if (attendanceRecords.length > 0) {
    await prisma.attendance.createMany({
      data: attendanceRecords,
    });
    console.log(`✅ Created ${attendanceRecords.length} attendance records`);
  }

  console.log('🎉 Database seed completed!');
  console.log('\n📝 Sample login credentials:');
  console.log('Admin: admin@sample-company.com / admin123');
  console.log('HR Staff: hr@sample-company.com / hr123');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });