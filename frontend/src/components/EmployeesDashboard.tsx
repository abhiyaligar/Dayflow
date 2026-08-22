import React, { useState } from 'react';
import type { Employee, UserRole } from '../types';
import { calculateSalaryInfo } from '../mockData';

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

  const handleOnboardSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!firstName.trim() || !lastName.trim() || !email.trim() || !mobile.trim() || !designation.trim()) {
      setError('Please fill in all fields.');
      return;
    }

    // Auto-generate Login ID based on PRD algorithm:
    // UPPER(first_name[:2]) + UPPER(last_name[:2]) + str(joining_year) + f"{serial_count:03d}"
    const firstPart = (firstName.trim().substring(0, 2) + lastName.trim().substring(0, 2)).toUpperCase();
    
    // Count how many exist for this year
    const yearMatches = employees.filter((emp) => {
      // check if the loginId year segment matches joiningYear
      const yearInId = emp.loginId.substring(4, 8);
      return yearInId === joiningYear;
    });
    const serialCount = yearMatches.length + 1;
    const serialStr = String(serialCount).padStart(3, '0');
    const generatedLoginId = `${firstPart}${joiningYear}${serialStr}`;

    // Auto-generate secure temporary password
    const generatedTempPassword = `DF-${firstPart}${joiningYear}!`;

    // Construct the new employee record
    const newEmp: Employee = {
      id: `e_new_${Date.now()}`,
      loginId: generatedLoginId,
      name: `${firstName.trim()} ${lastName.trim()}`,
      email: email.trim(),
      mobile: mobile.trim(),
      company: 'Odoo India',
      department: department,
      manager: 'Jane Doe', // default
      location: 'Gandhinagar, Gujarat',
      jobPosition: designation.trim(),
      avatarUrl: `https://api.dicebear.com/7.x/initials/svg?seed=${firstName}+${lastName}`,
      attendanceStatus: 'Absent', // default starting status
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
          empCode: 'EMP' + generatedLoginId.substring(8)
        }
      },
      salaryInfo: calculateSalaryInfo(Number(salary), 0)
    };

    onOnboard(newEmp);
    
    // Reset uploader form states
    setFirstName('');
    setLastName('');
    setEmail('');
    setMobile('');
    setDesignation('');
    setSalary('80000');
    
    // Show credentials modal
    setShowModal(false);
    setShowCredentials({ id: generatedLoginId, tempPass: generatedTempPassword });
  };

  const getStatusColor = (status: 'Present' | 'Absent' | 'Leave') => {
    switch (status) {
      case 'Present':
        return 'bg-emerald-500';
      case 'Leave':
        return 'bg-sky-400';
      case 'Absent':
      default:
        return 'bg-amber-500';
    }
  };

  const getStatusIcon = (status: 'Present' | 'Absent' | 'Leave') => {
    if (status === 'Leave') {
      return (
        <span title="On Leave" className="flex items-center justify-center text-sky-400 font-semibold text-sm">
          ✈️
        </span>
      );
    }
    return <span className={`w-3 h-3 rounded-full ${getStatusColor(status)}`}></span>;
  };

  return (
    <div className="flex-1 bg-[#0e0f12] px-6 py-8">
      {/* Top Filter and Actions row */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 mb-8">
        <div className="relative flex-1 max-w-md">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by Name, Employee ID, designation..."
            className="w-full bg-[#16181d] border border-[#242730] rounded-md pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
          />
          <svg
            className="absolute left-3.5 top-3 w-4 h-4 text-slate-500"
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
            className="bg-purple-600 hover:bg-purple-500 text-white font-bold text-sm tracking-wider px-5 py-2.5 rounded-md flex items-center justify-center space-x-1.5 transition-colors shadow"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
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
            className="bg-[#16181d] border border-[#242730] hover:border-purple-500/50 hover:shadow-purple-500/5 rounded-xl p-5 relative cursor-pointer flex flex-col items-center text-center transition-all group"
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
                className="w-20 h-20 rounded-full border border-slate-800 object-cover group-hover:scale-105 transition-transform"
              />
            </div>

            {/* Info */}
            <h3 className="text-white font-bold text-base truncate max-w-full group-hover:text-purple-400 transition-colors">
              {emp.name}
            </h3>
            <p className="text-purple-400/90 text-xs font-semibold mt-0.5">{emp.jobPosition}</p>
            <p className="text-slate-500 text-[10px] uppercase font-bold tracking-wider mt-2 bg-[#0e0f12] px-2 py-0.5 rounded border border-[#242730]">
              {emp.loginId}
            </p>

            <div className="w-full border-t border-[#242730] mt-4 pt-4 flex flex-col space-y-1 text-slate-400 text-xs items-start text-left">
              <div className="flex items-center space-x-2 truncate max-w-full">
                <span className="text-slate-600 font-semibold w-10">Email:</span>
                <span className="truncate">{emp.email}</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-slate-600 font-semibold w-10">Dept:</span>
                <span>{emp.department}</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-slate-600 font-semibold w-10">Loc:</span>
                <span className="truncate">{emp.location.split(',')[0]}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredEmployees.length === 0 && (
        <div className="text-center py-12 text-slate-500">
          No employees found matching "{searchTerm}".
        </div>
      )}

      {/* Onboarding Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#16181d] border border-[#242730] rounded-xl max-w-lg w-full p-6 relative">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 text-slate-500 hover:text-slate-300"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <h3 className="text-lg font-bold text-white mb-4">Onboard New Employee</h3>
            
            {error && (
              <div className="mb-4 bg-rose-900/20 border border-rose-800 text-rose-300 px-3 py-2 rounded text-xs font-semibold">
                {error}
              </div>
            )}

            <form onSubmit={handleOnboardSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">First Name</label>
                  <input
                    type="text"
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="John"
                    className="w-full bg-[#0e0f12] border border-[#242730] rounded px-3 py-2 text-sm text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">Last Name</label>
                  <input
                    type="text"
                    required
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Doe"
                    className="w-full bg-[#0e0f12] border border-[#242730] rounded px-3 py-2 text-sm text-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">Email</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="john.doe@dayflow.com"
                    className="w-full bg-[#0e0f12] border border-[#242730] rounded px-3 py-2 text-sm text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">Mobile</label>
                  <input
                    type="text"
                    required
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full bg-[#0e0f12] border border-[#242730] rounded px-3 py-2 text-sm text-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">Joining Year</label>
                  <select
                    value={joiningYear}
                    onChange={(e) => setJoiningYear(e.target.value)}
                    className="w-full bg-[#0e0f12] border border-[#242730] rounded px-2 py-2 text-sm text-white focus:outline-none"
                  >
                    <option value="2026">2026</option>
                    <option value="2025">2025</option>
                    <option value="2024">2024</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">Department</label>
                  <select
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full bg-[#0e0f12] border border-[#242730] rounded px-2 py-2 text-sm text-white focus:outline-none"
                  >
                    <option value="Engineering">Engineering</option>
                    <option value="Human Resources">Human Resources</option>
                    <option value="Design">Design</option>
                    <option value="Product">Product</option>
                    <option value="Sales">Sales</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">Role</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as UserRole)}
                    className="w-full bg-[#0e0f12] border border-[#242730] rounded px-2 py-2 text-sm text-white focus:outline-none"
                  >
                    <option value="Employee">Employee</option>
                    <option value="HR Officer">HR Officer</option>
                    <option value="Admin">Admin</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">Designation</label>
                  <input
                    type="text"
                    required
                    value={designation}
                    onChange={(e) => setDesignation(e.target.value)}
                    placeholder="Software Engineer"
                    className="w-full bg-[#0e0f12] border border-[#242730] rounded px-3 py-2 text-sm text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">Month Wage (₹)</label>
                  <input
                    type="number"
                    required
                    value={salary}
                    onChange={(e) => setSalary(e.target.value)}
                    className="w-full bg-[#0e0f12] border border-[#242730] rounded px-3 py-2 text-sm text-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-[#242730]">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold px-4 py-2 rounded text-sm transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-purple-600 hover:bg-purple-500 text-white font-bold px-5 py-2 rounded text-sm transition-colors"
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
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#16181d] border border-emerald-500/30 rounded-xl max-w-md w-full p-6 text-center shadow-emerald-500/5 shadow-lg">
            <div className="w-12 h-12 bg-emerald-900/30 border border-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4 text-emerald-400">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            
            <h3 className="text-lg font-bold text-white mb-2">Employee Onboarded Successfully</h3>
            <p className="text-slate-400 text-sm mb-5">Please share these initial credentials securely with the employee.</p>
            
            <div className="bg-[#0e0f12] border border-[#242730] rounded-lg p-4 mb-6 text-left space-y-2.5">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500 font-bold uppercase tracking-wider">Login ID:</span>
                <span className="text-emerald-400 font-mono font-bold text-sm bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-800/30">
                  {showCredentials.id}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500 font-bold uppercase tracking-wider">Temporary Password:</span>
                <span className="text-emerald-400 font-mono font-bold text-sm bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-800/30">
                  {showCredentials.tempPass}
                </span>
              </div>
            </div>

            <button
              onClick={() => setShowCredentials(null)}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-6 py-2 rounded text-sm transition-colors shadow"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
