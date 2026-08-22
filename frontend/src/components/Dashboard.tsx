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
  const menCount = employees.filter(e => e.privateInfo?.gender === 'Male').length;
  const womenCount = employees.filter(e => e.privateInfo?.gender === 'Female').length;
  const menPercent = totalEmployeesCount > 0 ? Math.round((menCount / totalEmployeesCount) * 100) : 0;

  // Present Today
  const today = new Date().toISOString().split('T')[0];
  const todayPresentRecords = attendanceRecords.filter(r => r.date === today && r.status === 'Present');
  const presentCount = todayPresentRecords.length;

  // Late Arrivals (Checked in after 09:15)
  const isLate = (timeStr: string) => {
    if (!timeStr) return false;
    const [h, m] = timeStr.split(':').map(Number);
    return (h > 9) || (h === 9 && m > 15);
  };
  const lateRecords = todayPresentRecords.filter(r => isLate(r.checkIn));
  const lateCount = lateRecords.length;

  // Absent
  const absentCount = employees.filter(e => e.attendanceStatus === 'Absent').length;

  // My Personal Late Count (for Employee View)
  const myLateCount = attendanceRecords.filter(r => r.employeeId === currentUser.id && r.status === 'Present' && isLate(r.checkIn)).length;

  // Pending Leave Requests (filtered dynamically by ownership for Employees)
  const pendingLeaves = leaveRequests.filter(l => l.status === 'Pending' && (isAdminOrHR ? true : l.employeeId === currentUser.id));
  const pendingLeavesCount = pendingLeaves.length;

  // --- Lists generation (For Admin/HR view) ---
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

  const visualEarlyRisers = earlyRisers;
  const visualLateArrivals = lateArrivalsList;
  const visualMissingPunch = missingPunchList.map(item => ({ ...item, action: 'Check-out' as const }));

  const filteredLeaves = pendingLeaves.filter(req => {
    const query = searchQuery.toLowerCase();
    return (
      req.employeeName.toLowerCase().includes(query) ||
      req.leaveType.toLowerCase().includes(query) ||
      req.employeeId.toLowerCase().includes(query)
    );
  });

  const displayDate = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

  return (
    <div className="flex-1 bg-[#F8F9FA] px-8 py-8 space-y-8 overflow-y-auto max-h-[calc(100vh-64px)]">
      
      {/* Welcome Greeting Row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 animate-fade-in">
        <div>
          <h2 className="text-xl font-bold text-[#111111] tracking-tight">
            Good morning, {currentUser.name.split(' ')[0]}
          </h2>
          <p className="text-xs text-[#718096] mt-1 font-medium">
            Here's what's happening with the team today.
          </p>
        </div>

        <div className="flex items-center space-x-3 self-end md:self-auto">
          {/* Dashboard Search */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search directory..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-white border border-[#E2E8F0] hover:border-[#111111]/30 focus:border-[#111111] rounded-xl px-4 py-2 text-xs text-[#111111] placeholder-[#A0AEC0] focus:outline-none w-48 md:w-56 shadow-sm transition-all"
            />
            <svg className="w-3.5 h-3.5 text-[#A0AEC0] absolute right-3.5 top-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          {/* Request Leave Button */}
          <button
            onClick={() => onNavigate('TIME_OFF')}
            className="bg-white border border-[#E2E8F0] hover:border-[#111111]/30 hover:bg-[#F8F9FA] text-[#111111] font-bold px-4 py-2 rounded-xl text-xs transition-all shadow-sm flex items-center space-x-1.5 cursor-pointer uppercase tracking-wider active:scale-95"
          >
            <svg className="w-3.5 h-3.5 text-[#111111]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span>Request Leave</span>
          </button>

          {/* Manage Button only visible for Admin/HR */}
          {isAdminOrHR && (
            <button
              onClick={() => onNavigate('EMPLOYEES')}
              className="bg-[#111111] hover:bg-[#222222] text-white font-bold px-4 py-2 rounded-xl text-xs transition-all shadow-sm cursor-pointer uppercase tracking-wider"
            >
              Manage Employees
            </button>
          )}
        </div>
      </div>

      {/* Role-Based Overview KPI Cards Section */}
      <div className="space-y-4">
        <h3 className="text-[10px] font-bold text-[#4A5568] uppercase tracking-wider pl-0.5">Overview</h3>
        
        {isAdminOrHR ? (
          /* Admin/HR Officer View: 5 Cards Grid */
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-5 animate-slide-up">
            
            {/* Card 1: Attendance */}
            <div className="bg-white rounded-xl p-5 flex flex-col justify-between shadow-sm border border-[#E2E8F0] hover:border-[#111111]/20 transition-all">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-bold text-[#4A5568] uppercase tracking-wider">Attendance</span>
                <span className="text-[10px] font-bold text-[#2F855A] bg-[#F0FDF4] px-2 py-0.5 rounded border border-[#DCFCE7]">
                  Active
                </span>
              </div>
              <div className="mt-4">
                <h4 className="text-2xl font-bold text-[#111111] tracking-tight">{presentCount}</h4>
                <p className="text-[10px] text-[#718096] mt-1">Checked in today</p>
              </div>
            </div>

            {/* Card 2: Late Arrivals */}
            <div className="bg-white rounded-xl p-5 flex flex-col justify-between shadow-sm border border-[#E2E8F0] hover:border-[#111111]/20 transition-all">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-bold text-[#4A5568] uppercase tracking-wider">Late Arrivals</span>
                <span className="text-[10px] font-bold text-[#C53030] bg-[#FFF5F5] px-2 py-0.5 rounded border border-[#FED7D7]">
                  After 9:15 AM
                </span>
              </div>
              <div className="mt-4">
                <h4 className="text-2xl font-bold text-[#111111] tracking-tight">{lateCount}</h4>
                <p className="text-[10px] text-[#718096] mt-1">Requires review</p>
              </div>
            </div>

            {/* Card 3: Absent */}
            <div className="bg-white rounded-xl p-5 flex flex-col justify-between shadow-sm border border-[#E2E8F0] hover:border-[#111111]/20 transition-all">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-bold text-[#4A5568] uppercase tracking-wider">Absent</span>
                <span className="text-[10px] font-bold text-[#718096] bg-[#F8F9FA] px-2 py-0.5 rounded border border-[#E2E8F0]">
                  No Punch
                </span>
              </div>
              <div className="mt-4">
                <h4 className="text-2xl font-bold text-[#111111] tracking-tight">{absentCount}</h4>
                <p className="text-[10px] text-[#718096] mt-1">Not in office</p>
              </div>
            </div>

            {/* Card 4: Leave Apply */}
            <div className="bg-white rounded-xl p-5 flex flex-col justify-between shadow-sm border border-[#E2E8F0] hover:border-[#111111]/20 transition-all">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-bold text-[#4A5568] uppercase tracking-wider">Leave requests</span>
                <span className="text-[10px] font-bold text-[#2B6CB0] bg-[#EBF8FF] px-2 py-0.5 rounded border border-[#BEE3F8]">
                  Pending
                </span>
              </div>
              <div className="mt-4">
                <h4 className="text-2xl font-bold text-[#111111] tracking-tight">{pendingLeavesCount}</h4>
                <p className="text-[10px] text-[#718096] mt-1">Awaiting approval</p>
              </div>
            </div>

            {/* Card 5: Total Employees Diversity Donut */}
            <div className="bg-white rounded-xl p-5 flex items-center justify-between shadow-sm border border-[#E2E8F0] hover:border-[#111111]/20 transition-all">
              <div className="flex flex-col justify-between h-full py-0.5">
                <p className="text-[10px] font-bold text-[#4A5568] uppercase tracking-wider leading-none">Total Directory</p>
                
                <div className="space-y-1.5 mt-3">
                  <div className="flex items-center space-x-1.5 text-[10px] font-semibold text-[#4A5568]">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#111111]"></span>
                    <span>Men ({menCount})</span>
                  </div>
                  <div className="flex items-center space-x-1.5 text-[10px] font-semibold text-[#4A5568]">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#A0AEC0]"></span>
                    <span>Women ({womenCount})</span>
                  </div>
                </div>
              </div>

              <div className="relative flex items-center justify-center shrink-0 ml-2">
                <svg viewBox="0 0 36 36" className="w-14 h-14 transform -rotate-90">
                  <circle cx="18" cy="18" r="15.915" fill="none" stroke="#F1F5F9" strokeWidth="4" />
                  <circle
                    cx="18"
                    cy="18"
                    r="15.915"
                    fill="none"
                    stroke="#111111"
                    strokeWidth="4"
                    strokeDasharray={`${menPercent} ${100 - menPercent}`}
                    strokeDashoffset="0"
                  />
                </svg>
                <div className="absolute text-center">
                  <span className="text-xs font-bold text-[#111111] block leading-none">{totalEmployeesCount}</span>
                </div>
              </div>
            </div>

          </div>
        ) : (
          /* Regular Employee View: 2 Cards Grid */
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 animate-slide-up">
            
            {/* Card 1: My Late Arrivals */}
            <div className="bg-white rounded-xl p-6 flex flex-col justify-between shadow-sm border border-[#E2E8F0] hover:border-[#111111]/20 transition-all">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-bold text-[#4A5568] uppercase tracking-wider">My Late Arrivals</span>
                <span className="text-[10px] font-bold text-[#C53030] bg-[#FFF5F5] px-2.5 py-0.5 rounded border border-[#FED7D7]">
                  After 9:15 AM
                </span>
              </div>
              <div className="mt-5">
                <h4 className="text-3xl font-bold text-[#111111] tracking-tight">{myLateCount}</h4>
                <p className="text-xs text-[#718096] mt-1">Requires attendance correction</p>
              </div>
            </div>

            {/* Card 2: My Pending Leaves */}
            <div className="bg-white rounded-xl p-6 flex flex-col justify-between shadow-sm border border-[#E2E8F0] hover:border-[#111111]/20 transition-all">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-bold text-[#4A5568] uppercase tracking-wider">Pending Leave Applications</span>
                <span className="text-[10px] font-bold text-[#2B6CB0] bg-[#EBF8FF] px-2.5 py-0.5 rounded border border-[#BEE3F8]">
                  Awaiting Review
                </span>
              </div>
              <div className="mt-5">
                <h4 className="text-3xl font-bold text-[#111111] tracking-tight">{pendingLeavesCount}</h4>
                <p className="text-xs text-[#718096] mt-1">Under HR review process</p>
              </div>
            </div>

          </div>
        )}
      </div>

      {/* Redesigned Leave Requests Table Widget */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-[#E2E8F0] animate-slide-up">
        <div className="flex justify-between items-center border-b border-[#E2E8F0] pb-4 mb-4">
          <div>
            <h3 className="text-sm font-bold text-[#111111] tracking-tight">
              {isAdminOrHR ? "Pending Approvals" : "My Pending Requests"}
            </h3>
            <p className="text-[10px] text-[#718096] font-medium uppercase tracking-wider mt-0.5">
              {isAdminOrHR ? "Action required on team requests" : "Leaves awaiting review"}
            </p>
          </div>
          <button
            onClick={() => onNavigate('TIME_OFF')}
            className="text-xs font-bold text-[#111111] hover:underline"
          >
            All Requests
          </button>
        </div>

        <div className="overflow-x-auto rounded-lg border border-[#E2E8F0]">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#F8F9FA] text-[#4A5568] border-b border-[#E2E8F0] uppercase font-bold tracking-wider text-[10px]">
                <th className="p-4">Employee ID</th>
                <th className="p-4">Employee</th>
                <th className="p-4">Leave Type</th>
                <th className="p-4 font-mono">From</th>
                <th className="p-4 font-mono">To</th>
                <th className="p-4">Remarks</th>
                {isAdminOrHR && <th className="p-4 text-center">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0] text-[#111111]">
              {filteredLeaves.map((req) => (
                <tr key={req.id} className="hover:bg-[#F8F9FA] transition-colors">
                  <td className="p-4 font-mono text-xs text-[#718096]">
                    {req.employeeId.includes('e_') ? 'EMP-001' : req.employeeId}
                  </td>
                  <td className="p-4 font-bold flex items-center space-x-2.5">
                    <span className="w-7 h-7 bg-[#F8F9FA] text-[#111111] border border-[#E2E8F0] rounded-full flex items-center justify-center font-bold text-[10px]">
                      {req.employeeName.substring(0, 2).toUpperCase()}
                    </span>
                    <span>{req.employeeName}</span>
                  </td>
                  <td className="p-4 text-[#4A5568] font-medium">{req.leaveType} Leave</td>
                  <td className="p-4 font-mono text-[#718096]">{req.startDate}</td>
                  <td className="p-4 font-mono text-[#718096]">{req.endDate}</td>
                  <td className="p-4 text-[#718096] max-w-[200px] truncate" title={req.remarks}>
                    {req.remarks || '--'}
                  </td>
                  {isAdminOrHR && (
                    <td className="p-4">
                      <div className="flex items-center justify-center space-x-2">
                        <button
                          onClick={() => onReviewLeave(req.id, 'Approved')}
                          className="bg-white border border-[#E2E8F0] hover:border-[#111111] text-[#111111] rounded-lg px-3 py-1 text-xs font-semibold transition-all shadow-sm"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => onReviewLeave(req.id, 'Rejected')}
                          className="bg-white border border-[#E2E8F0] hover:border-red-500 hover:text-red-500 text-[#718096] rounded-lg px-3 py-1 text-xs font-semibold transition-all shadow-sm"
                        >
                          Reject
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
              
              {filteredLeaves.length === 0 && (
                <tr>
                  <td colSpan={isAdminOrHR ? 7 : 6} className="p-8 text-center text-xs text-[#718096] font-medium bg-white">
                    No pending leave requests.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer Grids: Early Risers, Late Arrivals, Missing Punch (Admin/HR Only) */}
      {isAdminOrHR && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-slide-up">
          
          {/* Column 1: Early Risers */}
          <div className="bg-white rounded-xl p-5 shadow-sm border border-[#E2E8F0] flex flex-col justify-between min-h-[300px]">
            <div>
              <div className="flex justify-between items-center border-b border-[#E2E8F0] pb-3 mb-4">
                <h3 className="text-xs font-bold text-[#111111] uppercase tracking-wider">Early Risers</h3>
                <span className="text-[9px] font-bold text-[#718096] bg-[#F8F9FA] px-2 py-0.5 rounded border border-[#E2E8F0]">
                  {displayDate}
                </span>
              </div>
              <div className="space-y-4">
                {visualEarlyRisers.length === 0 ? (
                  <p className="text-xs text-center text-[#A0AEC0] py-12 font-medium">No early risers logged today.</p>
                ) : (
                  visualEarlyRisers.map((rec) => (
                    <div key={rec.id} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3 min-w-0">
                        <img
                          src={rec.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${rec.name}`}
                          alt={rec.name}
                          className="w-8 h-8 rounded-full object-cover border border-[#E2E8F0] flex-shrink-0"
                        />
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-[#111111] truncate leading-tight">{rec.name}</p>
                          <p className="text-[9px] text-[#718096] font-mono mt-0.5">{rec.empId}</p>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold text-[#2F855A] font-mono bg-[#F0FDF4] px-2.5 py-0.5 rounded border border-[#DCFCE7]">
                        {rec.time}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Column 2: Late Arrivals */}
          <div className="bg-white rounded-xl p-5 shadow-sm border border-[#E2E8F0] flex flex-col justify-between min-h-[300px]">
            <div>
              <div className="flex justify-between items-center border-b border-[#E2E8F0] pb-3 mb-4">
                <h3 className="text-xs font-bold text-[#111111] uppercase tracking-wider">Late Arrivals</h3>
                <span className="text-[9px] font-bold text-[#718096] bg-[#F8F9FA] px-2 py-0.5 rounded border border-[#E2E8F0]">
                  {displayDate}
                </span>
              </div>
              <div className="space-y-4">
                {visualLateArrivals.length === 0 ? (
                  <p className="text-xs text-center text-[#A0AEC0] py-12 font-medium">No late arrivals logged today.</p>
                ) : (
                  visualLateArrivals.map((rec) => (
                    <div key={rec.id} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3 min-w-0">
                        <img
                          src={rec.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${rec.name}`}
                          alt={rec.name}
                          className="w-8 h-8 rounded-full object-cover border border-[#E2E8F0] flex-shrink-0"
                        />
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-[#111111] truncate leading-tight">{rec.name}</p>
                          <p className="text-[9px] text-[#718096] font-mono mt-0.5">{rec.empId}</p>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold text-[#C53030] font-mono bg-[#FFF5F5] px-2.5 py-0.5 rounded border border-[#FED7D7]">
                        +{rec.duration}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Column 3: Missing Punch */}
          <div className="bg-white rounded-xl p-5 shadow-sm border border-[#E2E8F0] flex flex-col justify-between min-h-[300px]">
            <div>
              <div className="flex justify-between items-center border-b border-[#E2E8F0] pb-3 mb-4">
                <h3 className="text-xs font-bold text-[#111111] uppercase tracking-wider">Missing Punch</h3>
                <span className="text-[9px] font-bold text-[#718096] bg-[#F8F9FA] px-2 py-0.5 rounded border border-[#E2E8F0]">
                  {displayDate}
                </span>
              </div>
              <div className="space-y-4">
                {visualMissingPunch.length === 0 ? (
                  <p className="text-xs text-center text-[#A0AEC0] py-12 font-medium">No missing punches logged today.</p>
                ) : (
                  visualMissingPunch.map((rec) => (
                    <div key={rec.id} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3 min-w-0">
                        <img
                          src={rec.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${rec.name}`}
                          alt={rec.name}
                          className="w-8 h-8 rounded-full object-cover border border-[#E2E8F0] flex-shrink-0"
                        />
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-[#111111] truncate leading-tight">{rec.name}</p>
                          <p className="text-[9px] text-[#718096] font-mono mt-0.5">{rec.empId}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => alert(`Trigger status check-out/check-in for ${rec.name}`)}
                        className="bg-white border border-[#E2E8F0] hover:border-red-500 hover:text-red-500 text-xs font-semibold rounded-lg px-3 py-1 transition-all shadow-sm"
                      >
                        Force Out
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

        </div>
      )}

    </div>
  );
};
