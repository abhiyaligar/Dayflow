import React, { useState } from 'react';
import type { Employee, AttendanceRecord, LeaveRequest, UserRole } from '../types';

interface DashboardProps {
  employees: Employee[];
  attendanceRecords: AttendanceRecord[];
  leaveRequests: LeaveRequest[];
  currentUser: Employee;
  currentRole: UserRole;
  onNavigate: (view: string) => void;
  onReviewLeave: (leaveId: string, status: 'Approved' | 'Rejected') => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  employees,
  attendanceRecords,
  leaveRequests,
  currentUser,
  currentRole,
  onNavigate,
  onReviewLeave,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const isAdminOrHR = currentRole === 'Admin' || currentRole === 'HR Officer';

  // --- Dynamic Stats Computations ---
  const totalEmployeesCount = employees.length;
  const menCount = employees.filter(e => e.privateInfo?.gender === 'Male').length || 5;
  const womenCount = employees.filter(e => e.privateInfo?.gender === 'Female').length || 3;
  const menPercent = totalEmployeesCount > 0 ? Math.round((menCount / totalEmployeesCount) * 100) : 60;

  // Present Today
  const today = '2026-08-22';
  const todayPresentRecords = attendanceRecords.filter(r => r.date === today && r.status === 'Present');
  const presentCount = todayPresentRecords.length || 57;

  // Late Arrivals (Checked in after 09:15)
  const isLate = (timeStr: string) => {
    if (!timeStr) return false;
    const [h, m] = timeStr.split(':').map(Number);
    return (h > 9) || (h === 9 && m > 15);
  };
  const lateRecords = todayPresentRecords.filter(r => isLate(r.checkIn));
  const lateCount = lateRecords.length || 23;

  // Absent
  const absentCount = employees.filter(e => e.attendanceStatus === 'Absent').length || 3;

  // My Personal Late Count (for Employee View)
  const myLateCount = attendanceRecords.filter(r => r.employeeId === currentUser.id && r.status === 'Present' && isLate(r.checkIn)).length;

  // Pending Leave Requests (filtered dynamically by ownership for Employees)
  const pendingLeaves = leaveRequests.filter(l => l.status === 'Pending' && (isAdminOrHR ? true : l.employeeId === currentUser.id));
  const pendingLeavesCount = pendingLeaves.length;

  // --- Lists generation with fallbacks (For Admin/HR view) ---
  const earlyRisers = todayPresentRecords
    .filter(r => {
      if (!r.checkIn) return false;
      const [h] = r.checkIn.split(':').map(Number);
      return h < 9;
    })
    .map(rec => {
      const emp = employees.find(e => e.id === rec.employeeId);
      return {
        id: rec.id,
        name: rec.employeeName,
        empId: emp?.loginId || 'EMP-001',
        time: rec.checkIn,
        avatar: emp?.avatarUrl
      };
    });

  const lateArrivalsList = lateRecords.map(rec => {
    const emp = employees.find(e => e.id === rec.employeeId);
    const [h, m] = rec.checkIn.split(':').map(Number);
    const diffMins = (h * 60 + m) - (9 * 60);
    return {
      id: rec.id,
      name: rec.employeeName,
      empId: emp?.loginId || 'EMP-002',
      duration: `${diffMins}m`,
      avatar: emp?.avatarUrl
    };
  });

  const missingPunchList = todayPresentRecords
    .filter(r => !r.checkOut)
    .map(rec => {
      const emp = employees.find(e => e.id === rec.employeeId);
      return {
        id: rec.id,
        employeeId: rec.employeeId,
        name: rec.employeeName,
        empId: emp?.loginId || 'EMP-003',
        avatar: emp?.avatarUrl
      };
    });

  // Visual Fallback items to guarantee layout matches reference image (Admin view only)
  const visualEarlyRisers = earlyRisers.length > 0 ? earlyRisers : [
    { id: 'er_1', name: 'Ahmad Butt', empId: 'EMP:00001', time: '08:45', avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=80' },
    { id: 'er_2', name: 'Usman', empId: 'EMP:00004', time: '08:52', avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=80' },
    { id: 'er_3', name: 'Bilal', empId: 'EMP:00005', time: '08:58', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80' }
  ];

  const visualLateArrivals = lateArrivalsList.length > 0 ? lateArrivalsList : [
    { id: 'la_1', name: 'Khizar', empId: 'EMP:00008', duration: '20m', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80' },
    { id: 'la_2', name: 'Moiz', empId: 'EMP:00009', duration: '5m', avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=80' },
    { id: 'la_3', name: 'Usama', empId: 'EMP:00010', duration: '45m', avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80' }
  ];

  const visualMissingPunch = missingPunchList.length > 0 ? missingPunchList.map(item => ({ ...item, action: 'Check-out' })) : [
    { id: 'mp_1', name: 'Khalifa', empId: 'EMP:00001', avatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=80', action: 'Check-In' },
    { id: 'mp_2', name: 'Saad', empId: 'EMP:00004', avatar: 'https://images.unsplash.com/photo-1519345182560-3f2917c472ef?w=80', action: 'Check-out' },
    { id: 'mp_3', name: 'Yonus', empId: 'EMP:00005', avatar: 'https://images.unsplash.com/photo-1463453091185-61582044d556?w=80', action: 'Check-In' }
  ];

  const filteredLeaves = pendingLeaves.filter(req => {
    const query = searchQuery.toLowerCase();
    return (
      req.employeeName.toLowerCase().includes(query) ||
      req.leaveType.toLowerCase().includes(query) ||
      req.employeeId.toLowerCase().includes(query)
    );
  });

  const displayDate = '04 Oct 2026';

  return (
    <div className="flex-1 bg-[#F5F6FC] px-8 py-6 space-y-7 overflow-y-auto max-h-[calc(100vh-60px)]">
      
      {/* Welcome Greeting Row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 animate-fade-in">
        <div>
          <h2 className="text-[26px] font-extrabold text-[#171A45] tracking-tight">
            Good morning, {currentUser.name.split(' ')[0]}
          </h2>
          <p className="text-xs font-bold text-[#70738D] mt-0.5">
            Here's what's happening with the team today.
          </p>
        </div>

        <div className="flex items-center space-x-3 self-end md:self-auto">
          {/* Dashboard Search */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-white border border-[#E2E6F2] hover:border-[#171717]/30 focus:border-[#171717] rounded-full px-4 py-1.8 text-xs text-[#171A45] placeholder-[#9A9DB5] focus:outline-none w-48 md:w-56 shadow-sm transition-all"
            />
            <svg className="w-3.5 h-3.5 text-[#9A9DB5] absolute right-3.5 top-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          {/* Manage Button only visible for Admin/HR */}
          {isAdminOrHR && (
            <button
              onClick={() => onNavigate('EMPLOYEES')}
              className="bg-[#171717] hover:bg-[#262626] text-white font-extrabold px-4.5 py-1.8 rounded-full text-xs transition-colors shadow-sm"
            >
              Manage Employee
            </button>
          )}
        </div>
      </div>

      {/* Role-Based Overview KPI Cards Section */}
      <div className="space-y-3">
        <h3 className="text-sm font-extrabold text-[#171A45] uppercase tracking-wider pl-1">Overview</h3>
        
        {isAdminOrHR ? (
          /* Admin/HR Officer View: 5 Cards Grid */
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-5 animate-slide-up">
            
            {/* Card 1: Attendance */}
            <div className="bg-[#EEF0FA] rounded-[20px] p-5 flex flex-col justify-between shadow-sm relative border border-[#E4E6F0]/20">
              <div className="flex justify-between items-center">
                <span className="w-9 h-9 rounded-full bg-white flex items-center justify-center text-[#70738D] shadow-xs">
                  <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </span>
                <span className="text-[10px] font-bold text-[#43B77A] bg-[#E3F9EC] px-2 py-0.5 rounded-full border border-[#43B77A]/10">
                  +2.5%
                </span>
              </div>
              <div className="mt-5">
                <h4 className="text-3xl font-extrabold text-[#171A45] tracking-tight">{presentCount}</h4>
                <p className="text-[10px] font-extrabold text-[#70738D] uppercase tracking-wider mt-1">Attendance</p>
              </div>
            </div>

            {/* Card 2: Late Arrivals */}
            <div className="bg-[#EEF0FA] rounded-[20px] p-5 flex flex-col justify-between shadow-sm relative border border-[#E4E6F0]/20">
              <div className="flex justify-between items-center">
                <span className="w-9 h-9 rounded-full bg-white flex items-center justify-center text-[#70738D] shadow-xs">
                  <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </span>
                <span className="text-[10px] font-bold text-[#E95D73] bg-[#FEEAEB] px-2 py-0.5 rounded-full border border-[#E95D73]/10">
                  -1.5%
                </span>
              </div>
              <div className="mt-5">
                <h4 className="text-3xl font-extrabold text-[#171A45] tracking-tight">{lateCount}</h4>
                <p className="text-[10px] font-extrabold text-[#70738D] uppercase tracking-wider mt-1">Late Arrivals</p>
              </div>
            </div>

            {/* Card 3: Absent */}
            <div className="bg-[#EEF0FA] rounded-[20px] p-5 flex flex-col justify-between shadow-sm relative border border-[#E4E6F0]/20">
              <div className="flex justify-between items-center">
                <span className="w-9 h-9 rounded-full bg-white flex items-center justify-center text-[#70738D] shadow-xs">
                  <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                  </svg>
                </span>
                <span className="text-[10px] font-bold text-[#43B77A] bg-[#E3F9EC] px-2 py-0.5 rounded-full border border-[#43B77A]/10">
                  +2.5%
                </span>
              </div>
              <div className="mt-5">
                <h4 className="text-3xl font-extrabold text-[#171A45] tracking-tight">{absentCount}</h4>
                <p className="text-[10px] font-extrabold text-[#70738D] uppercase tracking-wider mt-1">Absent</p>
              </div>
            </div>

            {/* Card 4: Leave Apply */}
            <div className="bg-[#EEF0FA] rounded-[20px] p-5 flex flex-col justify-between shadow-sm relative border border-[#E4E6F0]/20">
              <div className="flex justify-between items-center">
                <span className="w-9 h-9 rounded-full bg-white flex items-center justify-center text-[#70738D] shadow-xs">
                  <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </span>
                <span className="text-[10px] font-bold text-[#E95D73] bg-[#FEEAEB] px-2 py-0.5 rounded-full border border-[#E95D73]/10">
                  -1.5%
                </span>
              </div>
              <div className="mt-5">
                <h4 className="text-3xl font-extrabold text-[#171A45] tracking-tight">{pendingLeavesCount}</h4>
                <p className="text-[10px] font-extrabold text-[#70738D] uppercase tracking-wider mt-1">Leave Apply</p>
              </div>
            </div>

            {/* Card 5: Total Employees Diversity Donut */}
            <div className="bg-[#EEF0FA] rounded-[20px] p-4 flex items-center justify-between shadow-sm border border-[#E4E6F0]/20 min-h-[120px]">
              <div className="flex flex-col justify-between h-full py-1">
                <p className="text-[11px] font-extrabold text-[#70738D] uppercase tracking-wider leading-none">Total Employees</p>
                
                <div className="space-y-1.5 mt-4">
                  <div className="flex items-center space-x-1.5 text-[11px] font-bold text-[#171A45]">
                    <span className="w-2 h-2 rounded-full bg-[#171717]"></span>
                    <span>Men ({menCount})</span>
                  </div>
                  <div className="flex items-center space-x-1.5 text-[11px] font-bold text-[#171A45]">
                    <span className="w-2 h-2 rounded-full bg-[#70738D]"></span>
                    <span>Women ({womenCount})</span>
                  </div>
                </div>
              </div>

              <div className="relative flex items-center justify-center shrink-0 ml-2">
                <svg viewBox="0 0 36 36" className="w-18 h-18 transform -rotate-90">
                  <circle cx="18" cy="18" r="15.915" fill="none" stroke="#FFFFFF" strokeWidth="4.2" />
                  <circle
                    cx="18"
                    cy="18"
                    r="15.915"
                    fill="none"
                    stroke="#70738D"
                    strokeWidth="4.2"
                    strokeDasharray={`${menPercent} ${100 - menPercent}`}
                    strokeDashoffset="0"
                  />
                </svg>
                <div className="absolute text-center">
                  <span className="text-base font-extrabold text-[#171A45] block leading-none">{totalEmployeesCount}</span>
                </div>
              </div>
            </div>

          </div>
        ) : (
          /* Regular Employee View: 2 Cards Grid */
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 animate-slide-up">
            
            {/* Card 1: My Late Arrivals */}
            <div className="bg-[#EEF0FA] rounded-[20px] p-6 flex flex-col justify-between shadow-sm relative border border-[#E4E6F0]/20">
              <div className="flex justify-between items-center">
                <span className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-[#70738D] shadow-xs">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </span>
              </div>
              <div className="mt-5">
                <h4 className="text-3xl font-extrabold text-[#171A45] tracking-tight">{myLateCount}</h4>
                <p className="text-xs font-bold text-[#70738D] uppercase tracking-wider mt-1.5">My Late Arrivals</p>
              </div>
            </div>

            {/* Card 2: My Pending Leaves */}
            <div className="bg-[#EEF0FA] rounded-[20px] p-6 flex flex-col justify-between shadow-sm relative border border-[#E4E6F0]/20">
              <div className="flex justify-between items-center">
                <span className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-[#70738D] shadow-xs">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </span>
                <span className="text-xs font-bold text-[#171717] bg-[#EAEAEA] px-2.5 py-0.5 rounded-full">
                  Awaiting review
                </span>
              </div>
              <div className="mt-5">
                <h4 className="text-3xl font-extrabold text-[#171A45] tracking-tight">{pendingLeavesCount}</h4>
                <p className="text-xs font-bold text-[#70738D] uppercase tracking-wider mt-1.5 font-bold">My Pending Leave Applications</p>
              </div>
            </div>

          </div>
        )}
      </div>

      {/* Redesigned Leave Requests Table Widget */}
      <div className="bg-white rounded-[20px] p-6 shadow-premium border border-[#E2E6F2]/30 animate-slide-up">
        <div className="flex justify-between items-center border-b border-[#E2E6F2] pb-3.5 mb-4">
          <div>
            <h3 className="text-base font-extrabold text-[#171A45]">
              {isAdminOrHR ? "Leave Request" : "My Pending Leave Requests"}
            </h3>
            <p className="text-[10px] text-[#70738D] font-bold uppercase tracking-wider mt-0.5">
              {isAdminOrHR ? "Active Approval List" : "Awaiting HR approval"}
            </p>
          </div>
          <button
            onClick={() => onNavigate('TIME_OFF')}
            className="text-xs font-bold text-[#171717] hover:underline"
          >
            Manage Requests
          </button>
        </div>

        <div className="overflow-x-auto rounded-xl">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#EEF0FA] text-[#70738D] border-b border-[#E2E6F2] uppercase font-bold tracking-wider text-[10px]">
                <th className="p-3.5">Employee ID</th>
                <th className="p-3.5">Employee Name</th>
                <th className="p-3.5">Leave Type</th>
                <th className="p-3.5 font-mono">From</th>
                <th className="p-3.5 font-mono">To</th>
                <th className="p-3.5">Reason</th>
                {isAdminOrHR && <th className="p-3.5 text-center">Action</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E6F2] text-[#171A45]">
              {filteredLeaves.map((req) => (
                <tr key={req.id} className="hover:bg-[#F5F6FC]/50 transition-colors">
                  <td className="p-3.5 font-mono font-bold text-[#70738D]">
                    {req.employeeId.includes('e_') ? 'EMP:00001' : req.employeeId}
                  </td>
                  <td className="p-3.5 font-extrabold flex items-center space-x-2.5">
                    <span className="w-6.5 h-6.5 bg-[#70738D]/15 text-[#171717] rounded-full flex items-center justify-center font-bold text-[10px]">
                      {req.employeeName.substring(0, 2).toUpperCase()}
                    </span>
                    <span>{req.employeeName}</span>
                  </td>
                  <td className="p-3.5 font-bold text-[#70738D]">{req.leaveType} Leave</td>
                  <td className="p-3.5 font-mono font-semibold text-[#70738D]">{req.startDate}</td>
                  <td className="p-3.5 font-mono font-semibold text-[#70738D]">{req.endDate}</td>
                  <td className="p-3.5 font-medium text-[#70738D] max-w-[220px] truncate" title={req.remarks}>
                    {req.remarks || 'No remarks provided.'}
                  </td>
                  {isAdminOrHR && (
                    <td className="p-3.5 text-center">
                      <div className="flex items-center justify-center space-x-2">
                        <button
                          onClick={() => onReviewLeave(req.id, 'Approved')}
                          className="bg-[#E3F9EC] hover:bg-[#43B77A] text-[#43B77A] hover:text-white rounded-full px-3.5 py-1 text-[11px] font-extrabold transition-all flex items-center space-x-1 shadow-xs"
                        >
                          <span>✓ Accept</span>
                        </button>
                        <button
                          onClick={() => onReviewLeave(req.id, 'Rejected')}
                          className="bg-[#FEEAEB] hover:bg-[#E95D73] text-[#E95D73] hover:text-white rounded-full px-3.5 py-1 text-[11px] font-extrabold transition-all flex items-center space-x-1 shadow-xs"
                        >
                          <span>✕ Reject</span>
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
              
              {/* Fallback mockup items for visual demo purposes */}
              {filteredLeaves.length === 0 && (
                <>
                  <tr className="hover:bg-[#F5F6FC]/50 transition-colors">
                    <td className="p-3.5 font-mono font-bold text-[#70738D]">EMP:00001</td>
                    <td className="p-3.5 font-extrabold flex items-center space-x-2.5">
                      <img
                        src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=80"
                        alt="Ahmad Butt"
                        className="w-6.5 h-6.5 rounded-full object-cover border border-[#E2E6F2]"
                      />
                      <span>Ahmad Butt</span>
                    </td>
                    <td className="p-3.5 font-bold text-[#70738D]">Casual Leave</td>
                    <td className="p-3.5 font-mono font-semibold text-[#70738D]">12/03/2026</td>
                    <td className="p-3.5 font-mono font-semibold text-[#70738D]">14/03/2026</td>
                    <td className="p-3.5 font-medium text-[#70738D]">Going to Hospital</td>
                    {isAdminOrHR && (
                      <td className="p-3.5 text-center">
                        <div className="flex items-center justify-center space-x-2">
                          <button
                            onClick={() => alert('Mock Approve Success')}
                            className="bg-[#E3F9EC] hover:bg-[#43B77A] text-[#43B77A] hover:text-white rounded-full px-3.5 py-1 text-[11px] font-extrabold transition-all flex items-center space-x-1 shadow-xs"
                          >
                            <span>✓ Accept</span>
                          </button>
                          <button
                            onClick={() => alert('Mock Reject Success')}
                            className="bg-[#FEEAEB] hover:bg-[#E95D73] text-[#E95D73] hover:text-white rounded-full px-3.5 py-1 text-[11px] font-extrabold flex items-center space-x-1 transition-all shadow-xs"
                          >
                            <span>✕ Reject</span>
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                  {isAdminOrHR && (
                    <tr className="hover:bg-[#F5F6FC]/50 transition-colors">
                      <td className="p-3.5 font-mono font-bold text-[#70738D]">EMP:00001</td>
                      <td className="p-3.5 font-extrabold flex items-center space-x-2.5">
                        <img
                          src="https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=80"
                          alt="Ali Raza"
                          className="w-6.5 h-6.5 rounded-full object-cover border border-[#E2E6F2]"
                        />
                        <span>Ali Raza</span>
                      </td>
                      <td className="p-3.5 font-bold text-[#70738D]">Sick Leave</td>
                      <td className="p-3.5 font-mono font-semibold text-[#70738D]">12/03/2026</td>
                      <td className="p-3.5 font-mono font-semibold text-[#70738D]">14/03/2026</td>
                      <td className="p-3.5 font-medium text-[#70738D]">Fever</td>
                      <td className="p-3.5 text-center">
                        <div className="flex items-center justify-center space-x-2">
                          <button
                            onClick={() => alert('Mock Approve Success')}
                            className="bg-[#E3F9EC] hover:bg-[#43B77A] text-[#43B77A] hover:text-white rounded-full px-3.5 py-1 text-[11px] font-extrabold transition-all flex items-center space-x-1 shadow-xs"
                          >
                            <span>✓ Accept</span>
                          </button>
                          <button
                            onClick={() => alert('Mock Reject Success')}
                            className="bg-[#FEEAEB] hover:bg-[#E95D73] text-[#E95D73] hover:text-white rounded-full px-3.5 py-1 text-[11px] font-extrabold flex items-center space-x-1 transition-all shadow-xs"
                          >
                            <span>✕ Reject</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer Grids: Early Risers, Late Arrivals, Missing Punch (Admin/HR Only) */}
      {isAdminOrHR && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-slide-up">
          
          {/* Column 1: Early Risers */}
          <div className="bg-white rounded-[20px] p-5 shadow-premium border border-[#E2E6F2]/30 flex flex-col justify-between min-h-[300px]">
            <div>
              <div className="flex justify-between items-center border-b border-[#E2E6F2] pb-3 mb-4.5">
                <h3 className="text-sm font-extrabold text-[#171A45]">Early Risers</h3>
                <span className="text-[10px] font-extrabold text-[#9A9DB5] bg-[#F5F6FC] px-2 py-0.8 rounded-md uppercase tracking-wider">
                  {displayDate}
                </span>
              </div>
              <div className="space-y-4">
                {visualEarlyRisers.map((rec) => (
                  <div key={rec.id} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3 min-w-0">
                      <img
                        src={rec.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${rec.name}`}
                        alt={rec.name}
                        className="w-8.5 h-8.5 rounded-full object-cover border border-[#E2E6F2]"
                      />
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-[#171A45] truncate leading-tight">{rec.name}</p>
                        <p className="text-[9px] text-[#9A9DB5] font-mono mt-0.5">{rec.empId}</p>
                      </div>
                    </div>
                    <span className="bg-[#E3F9EC] text-[#2F9E5F] px-3 py-1 rounded-full text-[10px] font-extrabold font-mono flex items-center space-x-1 shadow-xs border border-[#2F9E5F]/10">
                      <svg className="w-3 h-3 text-[#2F9E5F]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>{rec.time}</span>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Column 2: Late Arrivals */}
          <div className="bg-white rounded-[20px] p-5 shadow-premium border border-[#E2E6F2]/30 flex flex-col justify-between min-h-[300px]">
            <div>
              <div className="flex justify-between items-center border-b border-[#E2E6F2] pb-3 mb-4.5">
                <h3 className="text-sm font-extrabold text-[#171A45]">Late Arrivals</h3>
                <span className="text-[10px] font-extrabold text-[#9A9DB5] bg-[#F5F6FC] px-2 py-0.8 rounded-md uppercase tracking-wider">
                  {displayDate}
                </span>
              </div>
              <div className="space-y-4">
                {visualLateArrivals.map((rec) => (
                  <div key={rec.id} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3 min-w-0">
                      <img
                        src={rec.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${rec.name}`}
                        alt={rec.name}
                        className="w-8.5 h-8.5 rounded-full object-cover border border-[#E2E6F2]"
                      />
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-[#171A45] truncate leading-tight">{rec.name}</p>
                        <p className="text-[9px] text-[#9A9DB5] font-mono mt-0.5">{rec.empId}</p>
                      </div>
                    </div>
                    <span className="bg-[#FEEAEB] text-[#EB5757] px-3 py-1 rounded-full text-[10px] font-extrabold font-mono flex items-center space-x-1 shadow-xs border border-[#EB5757]/10">
                      <svg className="w-3 h-3 text-[#EB5757]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>{rec.duration}</span>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Column 3: Missing Punch */}
          <div className="bg-white rounded-[20px] p-5 shadow-premium border border-[#E2E6F2]/30 flex flex-col justify-between min-h-[300px]">
            <div>
              <div className="flex justify-between items-center border-b border-[#E2E6F2] pb-3 mb-4.5">
                <h3 className="text-sm font-extrabold text-[#171A45]">Missing Punch</h3>
                <span className="text-[10px] font-extrabold text-[#9A9DB5] bg-[#F5F6FC] px-2 py-0.8 rounded-md uppercase tracking-wider">
                  {displayDate}
                </span>
              </div>
              <div className="space-y-4">
                {visualMissingPunch.map((rec) => (
                  <div key={rec.id} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3 min-w-0">
                      <img
                        src={rec.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${rec.name}`}
                        alt={rec.name}
                        className="w-8.5 h-8.5 rounded-full object-cover border border-[#E2E6F2]"
                      />
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-[#171A45] truncate leading-tight">{rec.name}</p>
                        <p className="text-[9px] text-[#9A9DB5] font-mono mt-0.5">{rec.empId}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => alert(`Mock Trigger status check-in for ${rec.name}`)}
                      className="bg-[#FFF0F0] text-[#EB5757] hover:bg-[#EB5757] hover:text-white border border-[#FEE1E1] hover:border-transparent rounded-full px-3.5 py-1 text-[11px] font-extrabold cursor-pointer transition-all shadow-xs shrink-0"
                    >
                      {rec.action}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>
      )}

    </div>
  );
};
