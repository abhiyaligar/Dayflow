export type UserRole = 'Admin' | 'HR Officer' | 'Employee';

export interface SalaryComponent {
  name: string;
  calculationType: 'Fixed' | 'Percentage';
  value: number; // percentage or fixed amount
  amount: number; // auto-calculated value
}

export interface SalaryInfo {
  wageType: 'Fixed';
  monthWage: number;
  yearlyWage: number;
  workingDaysPerWeek: number;
  breakTime: number; // hours
  components: {
    basic: SalaryComponent;
    hra: SalaryComponent;
    standard: SalaryComponent;
    performanceBonus: SalaryComponent;
    lta: SalaryComponent;
    fixedAllowance: SalaryComponent;
  };
  deductions: {
    employeePF: SalaryComponent;
    employerPF: SalaryComponent;
    professionalTax: SalaryComponent;
  };
}

export interface PrivateInfo {
  dateOfBirth: string;
  residingAddress: string;
  nationality: string;
  personalEmail: string;
  gender: string;
  maritalStatus: string;
  dateOfJoining: string;
  bankDetails: {
    accountNumber: string;
    bankName: string;
    ifscCode: string;
    panNo: string;
    uanNo: string;
    empCode: string;
  };
}

export interface Employee {
  id: string; // unique UUID or employee code
  loginId: string; // generated format: FI LA YEAR SERIAL (e.g., JODO2026001)
  password?: string; // Optional field for local mock authentication checks
  name: string;
  email: string;
  mobile: string;
  company: string;
  department: string;
  manager: string;
  location: string;
  jobPosition: string;
  avatarUrl?: string;
  attendanceStatus: 'Present' | 'Absent' | 'Leave';
  resumeName?: string;
  about?: string;
  skills: string[];
  certifications: string[];
  interests: string[];
  privateInfo?: PrivateInfo;
  salaryInfo?: SalaryInfo;
  role: UserRole;
}

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  date: string; // YYYY-MM-DD
  checkIn: string; // HH:MM
  checkOut?: string; // HH:MM
  workHours?: number; // hours
  extraHours?: number; // hours
  status: 'Present' | 'Absent' | 'Leave';
}

export interface LeaveRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  leaveType: 'Paid' | 'Sick' | 'Unpaid';
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  durationDays: number;
  remarks?: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  attachmentUrl?: string;
  attachmentName?: string;
}
