import type { Employee, AttendanceRecord, LeaveRequest, SalaryInfo } from './types';

// Dynamic Salary Component Calculator matching system specifications exactly
export const calculateSalaryInfo = (monthWage: number, performanceBonus: number = 0): SalaryInfo => {
  const basicAmount = monthWage * 0.50; // Basic = 50% of Wage
  const hraAmount = basicAmount * 0.50; // HRA = 50% of Basic (25% of Wage)
  const standardAmount = Math.round(monthWage * 0.0833 * 100) / 100; // Standard = 8.33% of Wage
  const ltaAmount = Math.round(monthWage * 0.0833 * 100) / 100; // LTA = 8.33% of Wage
  
  // Fixed Allowance absorbs the variance so basic + hra + standard + lta + bonus + fixed = wage
  const fixedAmount = monthWage - (basicAmount + hraAmount + standardAmount + ltaAmount + performanceBonus);
  
  // Deductions
  const employeePF = basicAmount * 0.12; // 12% of Basic
  const employerPF = basicAmount * 0.12; // 12% of Basic
  const professionalTax = 200.00; // Fixed PT
  
  return {
    wageType: 'Fixed',
    monthWage,
    yearlyWage: monthWage * 12,
    workingDaysPerWeek: 5,
    breakTime: 1, // 1 hour
    components: {
      basic: { name: 'Basic Salary', calculationType: 'Percentage', value: 50, amount: basicAmount },
      hra: { name: 'House Rent Allowance', calculationType: 'Percentage', value: 50, amount: hraAmount },
      standard: { name: 'Standard Allowance', calculationType: 'Percentage', value: 8.33, amount: standardAmount },
      performanceBonus: { name: 'Performance Bonus', calculationType: 'Fixed', value: performanceBonus, amount: performanceBonus },
      lta: { name: 'Leave Travel Allowance', calculationType: 'Percentage', value: 8.33, amount: ltaAmount },
      fixedAllowance: { name: 'Fixed Allowance', calculationType: 'Fixed', value: 0, amount: fixedAmount }
    },
    deductions: {
      employeePF: { name: 'Employee PF', calculationType: 'Percentage', value: 12, amount: employeePF },
      employerPF: { name: 'Employer PF', calculationType: 'Percentage', value: 12, amount: employerPF },
      professionalTax: { name: 'Professional Tax', calculationType: 'Fixed', value: 200, amount: professionalTax }
    }
  };
};

export const mockEmployees: Employee[] = [
  {
    id: 'e1',
    loginId: 'JADO2026001',
    name: 'Jane Doe',
    email: 'jane.doe@dayflow.com',
    mobile: '+91 98765 43210',
    company: 'Odoo India',
    department: 'Administration',
    manager: 'None (Board)',
    location: 'Gandhinagar, Gujarat',
    jobPosition: 'HR Generalist & Administrator',
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
    attendanceStatus: 'Present',
    resumeName: 'jane_doe_cv.pdf',
    about: 'Senior Human Resources expert dedicated to optimizing organizational workforce flow, performance benchmarks, and compensation plans.',
    skills: ['Talent Acquisition', 'Payroll Compliance', 'Conflict Resolution', 'SQL'],
    certifications: ['SHRM-CP Certified', 'Strategic HR Leadership (Wharton)'],
    interests: ['Amateur Photography', 'Badminton', 'Trekking'],
    role: 'Admin',
    privateInfo: {
      dateOfBirth: '1990-04-12',
      residingAddress: 'Flat 402, Shivalik Sky, Sargasan, Gandhinagar',
      nationality: 'Indian',
      personalEmail: 'jane.doe.personal@gmail.com',
      gender: 'Female',
      maritalStatus: 'Married',
      dateOfJoining: '2026-01-05',
      bankDetails: {
        accountNumber: '912010048739103',
        bankName: 'HDFC Bank Ltd',
        ifscCode: 'HDFC0000148',
        panNo: 'ABCDE1234F',
        uanNo: '100483920194',
        empCode: 'EMP2026001'
      }
    },
    salaryInfo: calculateSalaryInfo(250000.00, 5000.00)
  },
  {
    id: 'e2',
    loginId: 'HAOF2026002',
    name: 'Harry Officer',
    email: 'harry.officer@dayflow.com',
    mobile: '+91 87654 32109',
    company: 'Odoo India',
    department: 'Human Resources',
    manager: 'Jane Doe',
    location: 'Gandhinagar, Gujarat',
    jobPosition: 'HR Officer',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    attendanceStatus: 'Present',
    resumeName: 'harry_officer_resume.pdf',
    about: 'Diligent HR operations officer handling onboarding, day-to-day attendance tracking, leave requests coordination, and benefits allocations.',
    skills: ['G-Suite', 'Onboarding Pipelines', 'Employee Relations'],
    certifications: ['Diploma in HR Management'],
    interests: ['Cricket', 'Playing Flute', 'Traveling'],
    role: 'HR Officer',
    privateInfo: {
      dateOfBirth: '1993-08-25',
      residingAddress: 'Block C-101, Pramukh Heights, Kudasan, Gandhinagar',
      nationality: 'Indian',
      personalEmail: 'harry.officer.personal@yahoo.com',
      gender: 'Male',
      maritalStatus: 'Single',
      dateOfJoining: '2026-01-15',
      bankDetails: {
        accountNumber: '501004839201920',
        bankName: 'ICICI Bank Ltd',
        ifscCode: 'ICIC0000084',
        panNo: 'FGHIJ5678K',
        uanNo: '100489302194',
        empCode: 'EMP2026002'
      }
    },
    salaryInfo: calculateSalaryInfo(120000.00, 2000.00)
  },
  {
    id: 'e3',
    loginId: 'JODO2026003',
    name: 'John Doe',
    email: 'john.doe@dayflow.com',
    mobile: '+91 76543 21098',
    company: 'Odoo India',
    department: 'Engineering',
    manager: 'Jane Doe',
    location: 'Gandhinagar, Gujarat',
    jobPosition: 'Senior Software Engineer',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
    attendanceStatus: 'Present',
    resumeName: 'john_doe_cv.pdf',
    about: 'Full-stack software engineer with 6+ years of experience building secure databases, RESTful APIs, and responsive React user interfaces.',
    skills: ['React', 'TypeScript', 'FastAPI', 'PostgreSQL', 'Tailwind CSS'],
    certifications: ['AWS Certified Solutions Architect', 'React Advanced (Meta)'],
    interests: ['Video Games', 'Cycling', 'Chess'],
    role: 'Employee',
    privateInfo: {
      dateOfBirth: '1995-11-02',
      residingAddress: 'Flat 12, Shanti Enclave, Infocity, Gandhinagar',
      nationality: 'Indian',
      personalEmail: 'john.doe.dev@gmail.com',
      gender: 'Male',
      maritalStatus: 'Married',
      dateOfJoining: '2026-02-01',
      bankDetails: {
        accountNumber: '302948576912304',
        bankName: 'State Bank of India',
        ifscCode: 'SBIN0001048',
        panNo: 'LMNOP9012Q',
        uanNo: '100495830193',
        empCode: 'EMP2026003'
      }
    },
    salaryInfo: calculateSalaryInfo(150000.00, 3000.00)
  },
  {
    id: 'e4',
    loginId: 'JASM2026004',
    name: 'Jane Smith',
    email: 'jane.smith@dayflow.com',
    mobile: '+91 65432 10987',
    company: 'Odoo India',
    department: 'Product',
    manager: 'Jane Doe',
    location: 'Gandhinagar, Gujarat',
    jobPosition: 'Product Lead',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    attendanceStatus: 'Leave',
    resumeName: 'jane_smith_cv.pdf',
    about: 'Passionate Product Manager focused on aligning user requirements, engineering schedules, and visual mockups into coherent roadmaps.',
    skills: ['Product Strategy', 'Figma', 'Scrum Agile', 'User Research'],
    certifications: ['Certified Scrum Product Owner (CSPO)'],
    interests: ['Painting', 'Yoga', 'Blogging'],
    role: 'Employee',
    privateInfo: {
      dateOfBirth: '1992-06-15',
      residingAddress: 'Row House 4, Palm Green Villas, Randesan, Gandhinagar',
      nationality: 'Indian',
      personalEmail: 'jane.smith.pm@gmail.com',
      gender: 'Female',
      maritalStatus: 'Married',
      dateOfJoining: '2026-02-10',
      bankDetails: {
        accountNumber: '912010058392019',
        bankName: 'HDFC Bank Ltd',
        ifscCode: 'HDFC0000148',
        panNo: 'RSTUV3456W',
        uanNo: '100495392019',
        empCode: 'EMP2026004'
      }
    },
    salaryInfo: calculateSalaryInfo(180000.00, 4000.00)
  },
  {
    id: 'e5',
    loginId: 'BOJO2026005',
    name: 'Bob Johnson',
    email: 'bob.johnson@dayflow.com',
    mobile: '+91 54321 09876',
    company: 'Odoo India',
    department: 'Engineering',
    manager: 'John Doe',
    location: 'Gandhinagar, Gujarat',
    jobPosition: 'QA Engineer',
    avatarUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150',
    attendanceStatus: 'Absent',
    resumeName: 'bob_johnson_qa.pdf',
    about: 'Quality assurance engineer specialized in automated browser end-to-end testing, integration validation, and performance monitoring.',
    skills: ['Selenium', 'Playwright', 'Jest', 'CI/CD Pipelines'],
    certifications: ['ISTQB Advanced Level Test Analyst'],
    interests: ['Cooking', 'Running', 'Podcasts'],
    role: 'Employee',
    privateInfo: {
      dateOfBirth: '1996-02-28',
      residingAddress: 'Plot 234, Sector 7, Gandhinagar',
      nationality: 'Indian',
      personalEmail: 'bob.johnson.qa@gmail.com',
      gender: 'Male',
      maritalStatus: 'Single',
      dateOfJoining: '2026-03-01',
      bankDetails: {
        accountNumber: '002910394019302',
        bankName: 'Axis Bank Ltd',
        ifscCode: 'UTIB0000021',
        panNo: 'XYZAB7890C',
        uanNo: '100496839201',
        empCode: 'EMP2026005'
      }
    },
    salaryInfo: calculateSalaryInfo(85000.00, 1000.00)
  },
  {
    id: 'e6',
    loginId: 'ALSM2026006',
    name: 'Alice Smith',
    email: 'alice.smith@dayflow.com',
    mobile: '+91 43210 98765',
    company: 'Odoo India',
    department: 'Design',
    manager: 'Jane Smith',
    location: 'Gandhinagar, Gujarat',
    jobPosition: 'UI/UX Designer',
    avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150',
    attendanceStatus: 'Present',
    resumeName: 'alice_designer_portfolio.pdf',
    about: 'Visual designer crafting gorgeous dark mode interfaces, layouts, component libraries, typography patterns, and custom icons.',
    skills: ['Figma', 'Illustrator', 'Design Systems', 'CSS Grid'],
    certifications: ['Google UX Design Certificate'],
    interests: ['Pottery', 'Rock Climbing', 'Indie Music'],
    role: 'Employee',
    privateInfo: {
      dateOfBirth: '1998-09-08',
      residingAddress: 'Flat 503, Radhe Residency, Kudasan, Gandhinagar',
      nationality: 'Indian',
      personalEmail: 'alice.design@gmail.com',
      gender: 'Female',
      maritalStatus: 'Single',
      dateOfJoining: '2026-03-20',
      bankDetails: {
        accountNumber: '309204938201948',
        bankName: 'State Bank of India',
        ifscCode: 'SBIN0001048',
        panNo: 'DEFGH2468I',
        uanNo: '100497281920',
        empCode: 'EMP2026006'
      }
    },
    salaryInfo: calculateSalaryInfo(95000.00, 1500.00)
  },
  {
    id: 'e7',
    loginId: 'CHBR2026007',
    name: 'Charlie Brown',
    email: 'charlie.brown@dayflow.com',
    mobile: '+91 32109 87654',
    company: 'Odoo India',
    department: 'Sales',
    manager: 'Jane Doe',
    location: 'Mumbai, Maharashtra',
    jobPosition: 'Sales Lead',
    avatarUrl: 'https://images.unsplash.com/photo-1552058544-f2b08422138a?w=150',
    attendanceStatus: 'Present',
    resumeName: 'charlie_brown_sales.pdf',
    about: 'Enterprise sales specialist with a record of driving revenue growth, cultivating corporate leads, and negotiating contract agreements.',
    skills: ['B2B Sales', 'CRM Tools', 'Key Account Management'],
    certifications: ['Certified Professional Sales Person (CPSP)'],
    interests: ['Golf', 'Reading History', 'Stargazing'],
    role: 'Employee',
    privateInfo: {
      dateOfBirth: '1988-12-18',
      residingAddress: 'Floor 12, Regency Towers, Bandra West, Mumbai',
      nationality: 'Indian',
      personalEmail: 'charlie.sales@gmail.com',
      gender: 'Male',
      maritalStatus: 'Married',
      dateOfJoining: '2026-04-01',
      bankDetails: {
        accountNumber: '501005839201934',
        bankName: 'ICICI Bank Ltd',
        ifscCode: 'ICIC0000084',
        panNo: 'JKLMN1357O',
        uanNo: '100498392019',
        empCode: 'EMP2026007'
      }
    },
    salaryInfo: calculateSalaryInfo(160000.00, 25000.00) // high performance bonus
  },
  {
    id: 'e8',
    loginId: 'EMWH2026008',
    name: 'Emily White',
    email: 'emily.white@dayflow.com',
    mobile: '+91 21098 76543',
    company: 'Odoo India',
    department: 'Engineering',
    manager: 'John Doe',
    location: 'Gandhinagar, Gujarat',
    jobPosition: 'Junior Software Engineer',
    avatarUrl: 'https://images.unsplash.com/photo-1543269865-cbf427effbad?w=150',
    attendanceStatus: 'Leave',
    resumeName: 'emily_white_resume.pdf',
    about: 'Self-motivated developer eager to contribute to core database optimization, unit test coverages, and clean-code frontend templates.',
    skills: ['JavaScript', 'HTML5', 'CSS Grid', 'Git Version Control'],
    certifications: ['NodeJS Developer Certification'],
    interests: ['Cooking', 'Gardening', 'Board Games'],
    role: 'Employee',
    privateInfo: {
      dateOfBirth: '2001-07-04',
      residingAddress: 'PG Accommodation, Sec-21, Gandhinagar',
      nationality: 'Indian',
      personalEmail: 'emily.white.dev@gmail.com',
      gender: 'Female',
      maritalStatus: 'Single',
      dateOfJoining: '2026-05-15',
      bankDetails: {
        accountNumber: '002930294857102',
        bankName: 'Axis Bank Ltd',
        ifscCode: 'UTIB0000021',
        panNo: 'PQRST2468U',
        uanNo: '100499291039',
        empCode: 'EMP2026008'
      }
    },
    salaryInfo: calculateSalaryInfo(60000.00, 500.00)
  }
];

export const mockAttendanceRecords: AttendanceRecord[] = [
  {
    id: 'a1',
    employeeId: 'e3',
    employeeName: 'John Doe',
    date: '2026-08-21',
    checkIn: '10:00',
    checkOut: '19:00',
    workHours: 9.0,
    extraHours: 1.0,
    status: 'Present'
  },
  {
    id: 'a2',
    employeeId: 'e3',
    employeeName: 'John Doe',
    date: '2026-08-20',
    checkIn: '10:00',
    checkOut: '19:00',
    workHours: 9.0,
    extraHours: 1.0,
    status: 'Present'
  },
  {
    id: 'a3',
    employeeId: 'e3',
    employeeName: 'John Doe',
    date: '2026-08-19',
    checkIn: '10:05',
    checkOut: '19:00',
    workHours: 8.92,
    extraHours: 0.92,
    status: 'Present'
  },
  {
    id: 'a4',
    employeeId: 'e3',
    employeeName: 'John Doe',
    date: '2026-08-18',
    checkIn: '09:55',
    checkOut: '19:00',
    workHours: 9.08,
    extraHours: 1.08,
    status: 'Present'
  },
  {
    id: 'a5',
    employeeId: 'e3',
    employeeName: 'John Doe',
    date: '2026-08-17',
    checkIn: '10:00',
    checkOut: '19:30',
    workHours: 9.5,
    extraHours: 1.5,
    status: 'Present'
  },
  // Harry Officer
  {
    id: 'a6',
    employeeId: 'e2',
    employeeName: 'Harry Officer',
    date: '2026-08-21',
    checkIn: '09:30',
    checkOut: '18:30',
    workHours: 9.0,
    extraHours: 1.0,
    status: 'Present'
  },
  {
    id: 'a7',
    employeeId: 'e2',
    employeeName: 'Harry Officer',
    date: '2026-08-20',
    checkIn: '09:40',
    checkOut: '18:40',
    workHours: 9.0,
    extraHours: 1.0,
    status: 'Present'
  },
  // Jane Doe
  {
    id: 'a8',
    employeeId: 'e1',
    employeeName: 'Jane Doe',
    date: '2026-08-21',
    checkIn: '09:00',
    checkOut: '18:00',
    workHours: 9.0,
    extraHours: 1.0,
    status: 'Present'
  },
  {
    id: 'a9',
    employeeId: 'e1',
    employeeName: 'Jane Doe',
    date: '2026-08-20',
    checkIn: '09:15',
    checkOut: '18:00',
    workHours: 8.75,
    extraHours: 0.75,
    status: 'Present'
  },
  // Alice Smith
  {
    id: 'a10',
    employeeId: 'e6',
    employeeName: 'Alice Smith',
    date: '2026-08-21',
    checkIn: '10:15',
    checkOut: '19:15',
    workHours: 9.0,
    extraHours: 1.0,
    status: 'Present'
  }
];

export const mockLeaveRequests: LeaveRequest[] = [
  {
    id: 'l1',
    employeeId: 'e4',
    employeeName: 'Jane Smith',
    leaveType: 'Paid',
    startDate: '2026-08-20',
    endDate: '2026-08-22',
    durationDays: 3,
    remarks: 'Annual trip to Kullu Manali with parents.',
    status: 'Approved'
  },
  {
    id: 'l2',
    employeeId: 'e8',
    employeeName: 'Emily White',
    leaveType: 'Sick',
    startDate: '2026-08-21',
    endDate: '2026-08-21',
    durationDays: 1,
    remarks: 'Down with sudden high fever and throat infection.',
    status: 'Approved',
    attachmentName: 'medical_certificate.pdf'
  },
  {
    id: 'l3',
    employeeId: 'e3',
    employeeName: 'John Doe',
    leaveType: 'Paid',
    startDate: '2026-09-01',
    endDate: '2026-09-05',
    durationDays: 5,
    remarks: 'Family wedding attendance in Delhi.',
    status: 'Pending'
  },
  {
    id: 'l4',
    employeeId: 'e5',
    employeeName: 'Bob Johnson',
    leaveType: 'Unpaid',
    startDate: '2026-08-25',
    endDate: '2026-08-26',
    durationDays: 2,
    remarks: 'Personal urgent banking work in native town.',
    status: 'Pending'
  },
  {
    id: 'l5',
    employeeId: 'e6',
    employeeName: 'Alice Smith',
    leaveType: 'Sick',
    startDate: '2026-08-10',
    endDate: '2026-08-11',
    durationDays: 2,
    remarks: 'Dental wisdom tooth extraction surgery recovery.',
    status: 'Rejected'
  }
];
