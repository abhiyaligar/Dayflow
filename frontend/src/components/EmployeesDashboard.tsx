import React, { useState } from 'react';
import type { Employee, UserRole } from '../types';
import { calculateSalaryInfo } from '../utils/salary';
import { employeesApi } from '../api';

interface EmployeesDashboardProps {
  employees: Employee[];
  currentRole: UserRole;
  onOnboard: (newEmp: Employee) => void;
  onSelectEmployee: (emp: Employee) => void;
}

export const EmployeesDashboard: React.FC<EmployeesDashboardProps> = ({
  employees,
  currentRole,
  onOnboard,
  onSelectEmployee,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showCredentials, setShowCredentials] = useState<{ id: string; tempPass: string } | null>(null);

  // Onboarding Form States
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [department, setDepartment] = useState('Engineering');
  const [designation, setDesignation] = useState('');
  const [joiningYear, setJoiningYear] = useState('2026');
  const [role, setRole] = useState<UserRole>('Employee');
  const [salary, setSalary] = useState('80000');
  const [error, setError] = useState('');

  // Search Filter
  const filteredEmployees = employees.filter((emp) => {
    const term = searchTerm.toLowerCase().trim();
    return (
      emp.name.toLowerCase().includes(term) ||
      emp.loginId.toLowerCase().includes(term) ||
      emp.email.toLowerCase().includes(term) ||
      emp.jobPosition.toLowerCase().includes(term)
    );
  });

  const handleOnboardSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!firstName.trim() || !lastName.trim() || !email.trim() || !mobile.trim() || !designation.trim()) {
      setError('Please fill in all fields.');
      return;
    }

    try {
      // Call backend onboarding API
      const res = await employeesApi.onboard({
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        email: email.trim(),
        joining_year: Number(joiningYear),
        designation: designation.trim(),
        department: department,
        joining_date: `${joiningYear}-08-22`,
        role: role,
      });

      // Construct the new employee record
      const newEmp: Employee = {
        id: res.id,
        loginId: res.login_id,
        name: `${firstName.trim()} ${lastName.trim()}`,
        email: email.trim(),
        mobile: mobile.trim(),
        company: localStorage.getItem('df_company_name') || 'Odoo India',
        department: department,
        manager: 'Jane Doe',
        location: 'Gandhinagar, Gujarat',
        jobPosition: designation.trim(),
        avatarUrl: `https://api.dicebear.com/7.x/initials/svg?seed=${firstName}+${lastName}`,
        attendanceStatus: 'Absent',
        resumeName: 'cv_not_uploaded.pdf',
        about: 'Newly onboarded team member.',
        skills: ['HTML', 'JavaScript'],
        certifications: [],
        interests: [],
        role: role,
        privateInfo: {
          dateOfBirth: '1998-01-01',
          residingAddress: 'Gandhinagar, Gujarat',
          nationality: 'Indian',
          personalEmail: email.trim(),
          gender: 'Not Specified',
          maritalStatus: 'Single',
          dateOfJoining: `${joiningYear}-08-22`,
          bankDetails: {
            accountNumber: '9120100' + Math.floor(10000000 + Math.random() * 90000000),
            bankName: 'HDFC Bank Ltd',
            ifscCode: 'HDFC0000148',
            panNo: 'PAN' + Math.floor(10000 + Math.random() * 90000) + 'X',
            uanNo: '1004' + Math.floor(10000000 + Math.random() * 90000000),
            empCode: res.login_id
          }
        },
        salaryInfo: calculateSalaryInfo(Number(salary), 0)
      };

      onOnboard(newEmp);

      // Reset form states
      setFirstName('');
      setLastName('');
      setEmail('');
      setMobile('');
      setDesignation('');
      setSalary('80000');
      
      // Show credentials modal
      setShowModal(false);
      setShowCredentials({ id: res.login_id, tempPass: res.temporary_password });
    } catch (err: any) {
      setError(err.message || 'Failed to onboard employee.');
    }
  };

  const getStatusColorClass = (status: 'Present' | 'Absent' | 'Leave') => {
    switch (status) {
      case 'Present':
        return 'text-[#2F855A] bg-[#F0FDF4] border-[#DCFCE7]';
      case 'Leave':
        return 'text-[#2B6CB0] bg-[#EBF8FF] border-[#BEE3F8]';
      case 'Absent':
      default:
        return 'text-[#718096] bg-[#F8F9FA] border-[#E2E8F0]';
    }
  };

  const getStatusBadge = (status: 'Present' | 'Absent' | 'Leave') => {
    return (
      <span className={`text-[9px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${getStatusColorClass(status)}`}>
        {status === 'Leave' ? '✈ Leave' : status}
      </span>
    );
  };

  return (
    <div className="flex-1 bg-[#F8F9FA] px-8 py-8 space-y-6 overflow-y-auto max-h-[calc(100vh-64px)]">
      {/* Top Filter and Actions row */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search directory by Name, ID, or Designation..."
            className="w-full bg-white border border-[#E2E8F0] rounded-xl pl-10 pr-4 py-2.5 text-xs text-[#111111] placeholder-[#A0AEC0] focus:outline-none focus:border-[#111111] transition-all"
          />
          <svg
            className="absolute left-3.5 top-3.5 w-4 h-4 text-[#A0AEC0]"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>

        {/* NEW Button is only visible to Admin & HR Officer roles */}
        {(currentRole === 'Admin' || currentRole === 'HR Officer') && (
          <button
            onClick={() => setShowModal(true)}
            className="bg-[#111111] hover:bg-[#222222] text-white font-bold text-xs tracking-wider px-5 py-2.5 rounded-xl flex items-center justify-center space-x-1.5 transition-all shadow-sm"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span>NEW EMPLOYEE</span>
          </button>
        )}
      </div>

      {/* Grid of employee directory cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {filteredEmployees.map((emp) => (
          <div
            key={emp.id}
            onClick={() => onSelectEmployee(emp)}
            className="bg-white border border-[#E2E8F0] rounded-xl p-6 relative cursor-pointer flex flex-col items-center text-center transition-all shadow-sm hover:border-[#111111]/20 group"
          >
            {/* Status dot in top-right */}
            <div className="absolute top-4 right-4 flex items-center">
              {getStatusBadge(emp.attendanceStatus)}
            </div>

            {/* Profile Avatar */}
            <div className="mb-4 mt-2">
              <img
                src={emp.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150'}
                alt={emp.name}
                className="w-16 h-16 rounded-full border border-[#E2E8F0] object-cover transition-transform"
              />
            </div>

            {/* Info */}
            <h3 className="text-[#111111] font-bold text-sm truncate max-w-full">
              {emp.name}
            </h3>
            <p className="text-[#718096] text-xs mt-0.5">{emp.jobPosition}</p>
            <p className="text-[#4A5568] text-[9px] uppercase font-bold tracking-wider mt-2.5 bg-[#F8F9FA] px-2.5 py-0.5 rounded border border-[#E2E8F0]">
              {emp.loginId}
            </p>

            <div className="w-full border-t border-[#E2E8F0] mt-4 pt-4 flex flex-col space-y-1.5 text-[#718096] text-xs items-start text-left">
              <div className="flex items-center space-x-2 truncate w-full">
                <span className="text-[#A0AEC0] font-semibold w-10">Email:</span>
                <span className="truncate text-[#111111] font-medium">{emp.email}</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-[#A0AEC0] font-semibold w-10">Dept:</span>
                <span className="text-[#111111] font-medium">{emp.department}</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-[#A0AEC0] font-semibold w-10">Loc:</span>
                <span className="truncate text-[#111111] font-medium">{emp.location.split(',')[0]}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredEmployees.length === 0 && (
        <div className="text-center py-12 text-[#A0AEC0] font-bold">
          No employees found matching "{searchTerm}".
        </div>
      )}

      {/* Onboarding Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border border-[#E2E8F0] rounded-2xl max-w-lg w-full p-6 relative shadow-sm animate-scale-in">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 text-[#718096] hover:text-[#111111] p-1.5 hover:bg-[#F8F9FA] rounded-lg transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <h3 className="text-sm font-bold text-[#111111] uppercase tracking-wider mb-4 border-b border-[#E2E8F0] pb-2">Onboard New Employee</h3>
            
            {error && (
              <div className="mb-4 bg-[#FFF5F5] border border-[#FED7D7] text-[#C53030] px-3 py-2 rounded-xl text-xs font-semibold">
                {error}
              </div>
            )}

            <form onSubmit={handleOnboardSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-[#4A5568] mb-1">First Name</label>
                  <input
                    type="text"
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="John"
                    className="w-full bg-[#F8F9FA] border border-[#E2E8F0] rounded-xl px-3 py-2 text-xs text-[#111111] placeholder-[#A0AEC0] focus:bg-white focus:outline-none focus:border-[#111111] transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-[#4A5568] mb-1">Last Name</label>
                  <input
                    type="text"
                    required
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Doe"
                    className="w-full bg-[#F8F9FA] border border-[#E2E8F0] rounded-xl px-3 py-2 text-xs text-[#111111] placeholder-[#A0AEC0] focus:bg-white focus:outline-none focus:border-[#111111] transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-[#4A5568] mb-1">Email</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="john.doe@dayflow.com"
                    className="w-full bg-[#F8F9FA] border border-[#E2E8F0] rounded-xl px-3 py-2 text-xs text-[#111111] placeholder-[#A0AEC0] focus:bg-white focus:outline-none focus:border-[#111111] transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-[#4A5568] mb-1">Mobile</label>
                  <input
                    type="text"
                    required
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full bg-[#F8F9FA] border border-[#E2E8F0] rounded-xl px-3 py-2 text-xs text-[#111111] placeholder-[#A0AEC0] focus:bg-white focus:outline-none focus:border-[#111111] transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-[#4A5568] mb-1">Joining Year</label>
                  <select
                    value={joiningYear}
                    onChange={(e) => setJoiningYear(e.target.value)}
                    className="w-full bg-[#F8F9FA] border border-[#E2E8F0] rounded-xl px-3 py-2 text-xs text-[#111111] focus:outline-none focus:border-[#111111] transition-all"
                  >
                    <option value="2026">2026</option>
                    <option value="2025">2025</option>
                    <option value="2024">2024</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-[#4A5568] mb-1">Department</label>
                  <select
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full bg-[#F8F9FA] border border-[#E2E8F0] rounded-xl px-3 py-2 text-xs text-[#111111] focus:outline-none focus:border-[#111111] transition-all"
                  >
                    <option value="Engineering">Engineering</option>
                    <option value="Human Resources">Human Resources</option>
                    <option value="Design">Design</option>
                    <option value="Product">Product</option>
                    <option value="Sales">Sales</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-[#4A5568] mb-1">Role</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as UserRole)}
                    className="w-full bg-[#F8F9FA] border border-[#E2E8F0] rounded-xl px-3 py-2 text-xs text-[#111111] focus:outline-none focus:border-[#111111] transition-all"
                  >
                    <option value="Employee">Employee</option>
                    <option value="HR Officer">HR Officer</option>
                    <option value="Admin">Admin</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-[#4A5568] mb-1">Designation</label>
                  <input
                    type="text"
                    required
                    value={designation}
                    onChange={(e) => setDesignation(e.target.value)}
                    placeholder="Software Engineer"
                    className="w-full bg-[#F8F9FA] border border-[#E2E8F0] rounded-xl px-3 py-2 text-xs text-[#111111] placeholder-[#A0AEC0] focus:bg-white focus:outline-none focus:border-[#111111] transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-[#4A5568] mb-1">Month Wage (₹)</label>
                  <input
                    type="number"
                    required
                    value={salary}
                    onChange={(e) => setSalary(e.target.value)}
                    className="w-full bg-[#F8F9FA] border border-[#E2E8F0] rounded-xl px-3 py-2 text-xs text-[#111111] focus:bg-white focus:outline-none focus:border-[#111111] transition-all"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-[#E2E8F0]">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="bg-[#F8F9FA] hover:bg-[#E2E8F0] border border-[#E2E8F0] text-[#718096] font-semibold px-4 py-2 rounded-xl text-xs transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-[#111111] hover:bg-[#222222] text-white font-semibold px-5 py-2 rounded-xl text-xs transition-all shadow-sm"
                >
                  Onboard
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Credentials Popup Modal */}
      {showCredentials && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-[#E2E8F0] rounded-2xl max-w-md w-full p-6 text-center shadow-sm animate-scale-in">
            <div className="w-12 h-12 bg-[#F0FDF4] border border-[#DCFCE7] rounded-xl flex items-center justify-center mx-auto mb-4 text-[#2F855A]">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            
            <h3 className="text-sm font-bold text-[#111111] uppercase tracking-wider mb-2">Employee Onboarded</h3>
            <p className="text-[#718096] text-xs font-medium mb-5">Please share these initial credentials securely with the employee.</p>
            
            <div className="bg-[#F8F9FA] border border-[#E2E8F0] rounded-xl p-4 mb-6 text-left space-y-2.5">
              <div className="flex justify-between items-center text-xs">
                <span className="text-[#718096] font-semibold">Login ID:</span>
                <span className="text-[#2F855A] font-mono font-bold text-xs bg-green-50 px-2.5 py-0.5 rounded border border-[#DCFCE7]">
                  {showCredentials.id}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-[#718096] font-semibold">Temporary Password:</span>
                <span className="text-[#2F855A] font-mono font-bold text-xs bg-green-50 px-2.5 py-0.5 rounded border border-[#DCFCE7]">
                  {showCredentials.tempPass}
                </span>
              </div>
            </div>

            <button
              onClick={() => setShowCredentials(null)}
              className="bg-[#111111] hover:bg-[#222222] text-white font-bold px-6 py-2.5 rounded-xl text-xs transition-colors shadow-sm w-full"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
