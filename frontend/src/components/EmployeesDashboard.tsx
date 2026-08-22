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
        company: 'Odoo India',
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

  const getStatusColor = (status: 'Present' | 'Absent' | 'Leave') => {
    switch (status) {
      case 'Present':
        return 'bg-[#43B77A]';
      case 'Leave':
        return 'bg-[#5D78E8]';
      case 'Absent':
      default:
        return 'bg-[#E9A93A]';
    }
  };

  const getStatusIcon = (status: 'Present' | 'Absent' | 'Leave') => {
    if (status === 'Leave') {
      return (
        <span title="On Leave" className="flex items-center justify-center text-sm">
          ✈️
        </span>
      );
    }
    return <span className={`w-2.5 h-2.5 rounded-full ${getStatusColor(status)}`}></span>;
  };

  return (
    <div className="flex-1 bg-[#F5F6FC] px-8 py-6">
      {/* Top Filter and Actions row */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by Name, Employee ID, designation..."
            className="w-full bg-white border border-[#E2E6F2] rounded-xl pl-10 pr-4 py-2.5 text-sm text-[#171A45] placeholder-[#9A9DB5] focus:outline-none focus:border-[#6658F5] focus:ring-1 focus:ring-[#6658F5] transition-all"
          />
          <svg
            className="absolute left-3.5 top-3 w-4 h-4 text-[#70738D]"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2.5}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>

        {/* NEW Button is only visible to Admin & HR Officer roles */}
        {(currentRole === 'Admin' || currentRole === 'HR Officer') && (
          <button
            onClick={() => setShowModal(true)}
            className="bg-[#6658F5] hover:bg-[#5748E8] text-white font-bold text-xs tracking-wider px-5 py-2.8 rounded-xl flex items-center justify-center space-x-1.5 transition-all shadow-md shadow-[#6658F5]/10"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
            </svg>
            <span>NEW</span>
          </button>
        )}
      </div>

      {/* Grid of employee directory cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {filteredEmployees.map((emp) => (
          <div
            key={emp.id}
            onClick={() => onSelectEmployee(emp)}
            className="bg-white border border-[#E2E6F2] rounded-[20px] p-6 relative cursor-pointer flex flex-col items-center text-center transition-all duration-300 shadow-premium hover:shadow-premium-hover hover:-translate-y-1 group"
          >
            {/* Status dot in top-right */}
            <div className="absolute top-4 right-4 flex items-center space-x-1">
              {getStatusIcon(emp.attendanceStatus)}
            </div>

            {/* Profile Avatar */}
            <div className="mb-4">
              <img
                src={emp.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150'}
                alt={emp.name}
                className="w-20 h-20 rounded-full border border-[#E2E6F2] object-cover group-hover:scale-105 transition-transform"
              />
            </div>

            {/* Info */}
            <h3 className="text-[#171A45] font-extrabold text-base truncate max-w-full group-hover:text-[#6658F5] transition-colors">
              {emp.name}
            </h3>
            <p className="text-[#6658F5] text-xs font-semibold mt-0.5">{emp.jobPosition}</p>
            <p className="text-[#70738D] text-[10px] uppercase font-bold tracking-wider mt-2.5 bg-[#F5F6FC] px-2.5 py-0.8 rounded-lg border border-[#E2E6F2]">
              {emp.loginId}
            </p>

            <div className="w-full border-t border-[#E2E6F2] mt-4 pt-4 flex flex-col space-y-1 text-[#70738D] text-xs items-start text-left">
              <div className="flex items-center space-x-2 truncate w-full">
                <span className="text-[#9A9DB5] font-bold w-10">Email:</span>
                <span className="truncate text-[#171A45] font-medium">{emp.email}</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-[#9A9DB5] font-bold w-10">Dept:</span>
                <span className="text-[#171A45] font-medium">{emp.department}</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-[#9A9DB5] font-bold w-10">Loc:</span>
                <span className="truncate text-[#171A45] font-medium">{emp.location.split(',')[0]}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredEmployees.length === 0 && (
        <div className="text-center py-12 text-[#9A9DB5] font-bold">
          No employees found matching "{searchTerm}".
        </div>
      )}

      {/* Onboarding Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border border-[#E2E6F2] rounded-[24px] max-w-lg w-full p-6 relative shadow-premium animate-scale-in">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 text-[#70738D] hover:text-[#171A45] p-1.5 hover:bg-[#F5F6FC] rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <h3 className="text-base font-extrabold text-[#171A45] mb-4">Onboard New Employee</h3>
            
            {error && (
              <div className="mb-4 bg-[#E95D73]/10 border border-[#E95D73]/20 text-[#E95D73] px-3 py-2 rounded-xl text-xs font-semibold">
                {error}
              </div>
            )}

            <form onSubmit={handleOnboardSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-extrabold uppercase tracking-wider text-[#70738D] mb-1">First Name</label>
                  <input
                    type="text"
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="John"
                    className="w-full bg-[#F5F6FC] border border-[#E2E6F2] rounded-xl px-3.5 py-2.5 text-sm text-[#171A45] placeholder-[#9A9DB5] focus:bg-white focus:outline-none focus:border-[#6658F5] transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-extrabold uppercase tracking-wider text-[#70738D] mb-1">Last Name</label>
                  <input
                    type="text"
                    required
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Doe"
                    className="w-full bg-[#F5F6FC] border border-[#E2E6F2] rounded-xl px-3.5 py-2.5 text-sm text-[#171A45] placeholder-[#9A9DB5] focus:bg-white focus:outline-none focus:border-[#6658F5] transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-extrabold uppercase tracking-wider text-[#70738D] mb-1">Email</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="john.doe@dayflow.com"
                    className="w-full bg-[#F5F6FC] border border-[#E2E6F2] rounded-xl px-3.5 py-2.5 text-sm text-[#171A45] placeholder-[#9A9DB5] focus:bg-white focus:outline-none focus:border-[#6658F5] transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-extrabold uppercase tracking-wider text-[#70738D] mb-1">Mobile</label>
                  <input
                    type="text"
                    required
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full bg-[#F5F6FC] border border-[#E2E6F2] rounded-xl px-3.5 py-2.5 text-sm text-[#171A45] placeholder-[#9A9DB5] focus:bg-white focus:outline-none focus:border-[#6658F5] transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-[10px] font-extrabold uppercase tracking-wider text-[#70738D] mb-1">Joining Year</label>
                  <select
                    value={joiningYear}
                    onChange={(e) => setJoiningYear(e.target.value)}
                    className="w-full bg-[#F5F6FC] border border-[#E2E6F2] rounded-xl px-3 py-2.5 text-sm text-[#171A45] focus:outline-none focus:border-[#6658F5] transition-all"
                  >
                    <option value="2026">2026</option>
                    <option value="2025">2025</option>
                    <option value="2024">2024</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-extrabold uppercase tracking-wider text-[#70738D] mb-1">Department</label>
                  <select
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full bg-[#F5F6FC] border border-[#E2E6F2] rounded-xl px-3 py-2.5 text-sm text-[#171A45] focus:outline-none focus:border-[#6658F5] transition-all"
                  >
                    <option value="Engineering">Engineering</option>
                    <option value="Human Resources">Human Resources</option>
                    <option value="Design">Design</option>
                    <option value="Product">Product</option>
                    <option value="Sales">Sales</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-extrabold uppercase tracking-wider text-[#70738D] mb-1">Role</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as UserRole)}
                    className="w-full bg-[#F5F6FC] border border-[#E2E6F2] rounded-xl px-3 py-2.5 text-sm text-[#171A45] focus:outline-none focus:border-[#6658F5] transition-all"
                  >
                    <option value="Employee">Employee</option>
                    <option value="HR Officer">HR Officer</option>
                    <option value="Admin">Admin</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-extrabold uppercase tracking-wider text-[#70738D] mb-1">Designation</label>
                  <input
                    type="text"
                    required
                    value={designation}
                    onChange={(e) => setDesignation(e.target.value)}
                    placeholder="Software Engineer"
                    className="w-full bg-[#F5F6FC] border border-[#E2E6F2] rounded-xl px-3.5 py-2.5 text-sm text-[#171A45] placeholder-[#9A9DB5] focus:bg-white focus:outline-none focus:border-[#6658F5] transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-extrabold uppercase tracking-wider text-[#70738D] mb-1">Month Wage (₹)</label>
                  <input
                    type="number"
                    required
                    value={salary}
                    onChange={(e) => setSalary(e.target.value)}
                    className="w-full bg-[#F5F6FC] border border-[#E2E6F2] rounded-xl px-3.5 py-2.5 text-sm text-[#171A45] focus:bg-white focus:outline-none focus:border-[#6658F5] transition-all"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-[#E2E6F2]">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="bg-[#F5F6FC] hover:bg-[#EEF0FA] text-[#70738D] hover:text-[#171A45] font-bold px-4 py-2.5 rounded-xl text-xs transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-[#6658F5] hover:bg-[#5748E8] text-white font-bold px-5 py-2.5 rounded-xl text-xs transition-all shadow-md shadow-[#6658F5]/10"
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
          <div className="bg-white border border-[#E2E6F2] rounded-[24px] max-w-md w-full p-6 text-center shadow-premium animate-scale-in">
            <div className="w-12 h-12 bg-[#43B77A]/10 border border-[#43B77A]/20 rounded-2xl flex items-center justify-center mx-auto mb-4 text-[#43B77A]">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            
            <h3 className="text-base font-extrabold text-[#171A45] mb-2">Employee Onboarded</h3>
            <p className="text-[#70738D] text-xs font-semibold mb-5">Please share these initial credentials securely with the employee.</p>
            
            <div className="bg-[#F5F6FC] border border-[#E2E6F2] rounded-xl p-4 mb-6 text-left space-y-2.5">
              <div className="flex justify-between items-center text-xs">
                <span className="text-[#70738D] font-bold uppercase tracking-wider">Login ID:</span>
                <span className="text-[#43B77A] font-mono font-bold text-xs bg-emerald-50 px-2 py-0.5 rounded border border-[#43B77A]/20">
                  {showCredentials.id}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-[#70738D] font-bold uppercase tracking-wider">Temporary Password:</span>
                <span className="text-[#43B77A] font-mono font-bold text-xs bg-emerald-50 px-2 py-0.5 rounded border border-[#43B77A]/20">
                  {showCredentials.tempPass}
                </span>
              </div>
            </div>

            <button
              onClick={() => setShowCredentials(null)}
              className="bg-[#6658F5] hover:bg-[#5748E8] text-white font-bold px-6 py-2.5 rounded-xl text-xs transition-colors shadow-md shadow-[#6658F5]/10"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
