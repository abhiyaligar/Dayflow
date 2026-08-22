import React from 'react';
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
  const isAdminOrHR = currentRole === 'Admin' || currentRole === 'HR Officer';

  // --- Dynamic Stats Computations ---
  const totalEmployeesCount = employees.length;
  
  // Men / Women split
  const menCount = employees.filter(e => e.privateInfo?.gender === 'Male').length;
  const womenCount = employees.filter(e => e.privateInfo?.gender === 'Female').length;
  const menPercent = totalEmployeesCount > 0 ? Math.round((menCount / totalEmployeesCount) * 100) : 0;

  // Present Today
  const today = '2026-08-22';
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

  // Absent count (Absent status in directory or not checked in)
  const absentCount = employees.filter(e => e.attendanceStatus === 'Absent').length;

  // My Personal Late Count (for Employee View)
  const myLateCount = attendanceRecords.filter(r => r.employeeId === currentUser.id && r.status === 'Present' && isLate(r.checkIn)).length;

  // Pending Leave Requests (filtered dynamically by ownership for Employees)
  const pendingLeaves = leaveRequests.filter(l => l.status === 'Pending' && (isAdminOrHR ? true : l.employeeId === currentUser.id));
  const pendingLeavesCount = pendingLeaves.length;

  // --- Lists generation ---
  // Early Risers: Check-in before 09:00
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

  // Late Arrivals list
  const lateArrivalsList = lateRecords.map(rec => {
    const emp = employees.find(e => e.id === rec.employeeId);
    // calculate late duration in minutes (basis 09:00)
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

  // Missing Punch: Employees checked in but no checkout yet (and not the current user)
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

  return (
    <div className="flex-1 bg-[#F5F6FC] px-8 py-6 space-y-8 overflow-y-auto max-h-[calc(100vh-60px)]">
      
      {/* Top Welcome Header */}
      <div className="flex justify-between items-center animate-fade-in">
        <div>
          <h2 className="text-[28px] font-extrabold text-[#171A45] leading-tight">
            Good morning, {currentUser.name.split(' ')[0]}
          </h2>
          <p className="text-sm font-semibold text-[#70738D] mt-1">
            Here's what's happening with the team today.
          </p>
        </div>
      </div>

      {/* KPI Cards Row */}
      {isAdminOrHR ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 animate-slide-up">
          {/* Attendance */}
          <div className="bg-white rounded-[20px] p-6 shadow-premium hover:shadow-premium-hover transition-all duration-300 relative group overflow-hidden">
            <div className="flex justify-between items-start">
              <span className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center text-[#6658F5]">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </span>
              <span className="text-xs font-bold text-[#43B77A] bg-emerald-50 px-2 py-0.5 rounded-md flex items-center space-x-0.5">
                <span>+2.5%</span>
              </span>
            </div>
            <div className="mt-4">
              <h3 className="text-3xl font-extrabold text-[#171A45] tracking-tight">{presentCount}</h3>
              <p className="text-xs font-bold text-[#70738D] uppercase tracking-wider mt-1.5">Attendance Today</p>
            </div>
          </div>

          {/* Late Arrivals */}
          <div className="bg-white rounded-[20px] p-6 shadow-premium hover:shadow-premium-hover transition-all duration-300 relative group overflow-hidden">
            <div className="flex justify-between items-start">
              <span className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-[#E9A93A]">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </span>
              <span className="text-xs font-bold text-[#E95D73] bg-rose-50 px-2 py-0.5 rounded-md flex items-center space-x-0.5">
                <span>+1.2%</span>
              </span>
            </div>
            <div className="mt-4">
              <h3 className="text-3xl font-extrabold text-[#171A45] tracking-tight">{lateCount}</h3>
              <p className="text-xs font-bold text-[#70738D] uppercase tracking-wider mt-1.5">Late Arrivals</p>
            </div>
          </div>

          {/* Absent */}
          <div className="bg-white rounded-[20px] p-6 shadow-premium hover:shadow-premium-hover transition-all duration-300 relative group overflow-hidden">
            <div className="flex justify-between items-start">
              <span className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center text-[#E95D73]">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </span>
              <span className="text-xs font-bold text-[#43B77A] bg-emerald-50 px-2 py-0.5 rounded-md flex items-center space-x-0.5">
                <span>-0.8%</span>
              </span>
            </div>
            <div className="mt-4">
              <h3 className="text-3xl font-extrabold text-[#171A45] tracking-tight">{absentCount}</h3>
              <p className="text-xs font-bold text-[#70738D] uppercase tracking-wider mt-1.5">Absent Employees</p>
            </div>
          </div>

          {/* Leave Apply */}
          <div className="bg-white rounded-[20px] p-6 shadow-premium hover:shadow-premium-hover transition-all duration-300 relative group overflow-hidden">
            <div className="flex justify-between items-start">
              <span className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-[#5D78E8]">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </span>
              <span className="text-xs font-bold text-[#5D78E8] bg-blue-50 px-2 py-0.5 rounded-md flex items-center space-x-0.5">
                <span>Pending</span>
              </span>
            </div>
            <div className="mt-4">
              <h3 className="text-3xl font-extrabold text-[#171A45] tracking-tight">{pendingLeavesCount}</h3>
              <p className="text-xs font-bold text-[#70738D] uppercase tracking-wider mt-1.5">Leave Applications</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 animate-slide-up">
          {/* My Late Arrivals */}
          <div className="bg-white rounded-[20px] p-6 shadow-premium hover:shadow-premium-hover transition-all duration-300 relative group overflow-hidden">
            <div className="flex justify-between items-start">
              <span className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-[#E9A93A]">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </span>
            </div>
            <div className="mt-4">
              <h3 className="text-3xl font-extrabold text-[#171A45] tracking-tight">{myLateCount}</h3>
              <p className="text-xs font-bold text-[#70738D] uppercase tracking-wider mt-1.5">My Late Arrivals</p>
            </div>
          </div>

          {/* My Leave Applications */}
          <div className="bg-white rounded-[20px] p-6 shadow-premium hover:shadow-premium-hover transition-all duration-300 relative group overflow-hidden">
            <div className="flex justify-between items-start">
              <span className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-[#5D78E8]">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </span>
              <span className="text-xs font-bold text-[#5D78E8] bg-blue-50 px-2 py-0.5 rounded-md flex items-center space-x-0.5">
                <span>My Pending</span>
              </span>
            </div>
            <div className="mt-4">
              <h3 className="text-3xl font-extrabold text-[#171A45] tracking-tight">{pendingLeavesCount}</h3>
              <p className="text-xs font-bold text-[#70738D] uppercase tracking-wider mt-1.5">My Pending Leave Applications</p>
            </div>
          </div>
        </div>
      )}

      {isAdminOrHR && (
        <>
          {/* Middle Block: Attendance Trend & Donut Distribution Chart */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-slide-up">
            {/* Attendance Trend Chart */}
            <div className="bg-white rounded-[20px] p-6 shadow-premium lg:col-span-2 space-y-4">
              <div className="flex justify-between items-center border-b border-[#E2E6F2] pb-3">
                <div>
                  <h3 className="text-base font-bold text-[#171A45]">Attendance Trend</h3>
                  <p className="text-xs text-[#70738D] mt-0.5">Last 7 days VS prior week</p>
                </div>
                <div className="flex items-center space-x-4 text-xs font-bold">
                  <span className="flex items-center space-x-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#6658F5]"></span>
                    <span className="text-[#171A45]">Present</span>
                  </span>
                  <span className="flex items-center space-x-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#E2E6F2]"></span>
                    <span className="text-[#70738D]">Prior Week</span>
                  </span>
                </div>
              </div>
              
              {/* Custom SVG Line Chart */}
              <div className="w-full h-56 pt-2">
                <svg viewBox="0 0 500 150" className="w-full h-full">
                  {/* Horizontal grid lines */}
                  <line x1="20" y1="20" x2="480" y2="20" stroke="#EEF0FA" strokeWidth="1" strokeDasharray="3" />
                  <line x1="20" y1="60" x2="480" y2="60" stroke="#EEF0FA" strokeWidth="1" strokeDasharray="3" />
                  <line x1="20" y1="100" x2="480" y2="100" stroke="#EEF0FA" strokeWidth="1" strokeDasharray="3" />
                  <line x1="20" y1="130" x2="480" y2="130" stroke="#EEF0FA" strokeWidth="1" />

                  {/* Y Axis Labels */}
                  <text x="5" y="24" className="text-[9px] fill-[#9A9DB5] font-bold">8</text>
                  <text x="5" y="64" className="text-[9px] fill-[#9A9DB5] font-bold">4</text>
                  <text x="5" y="104" className="text-[9px] fill-[#9A9DB5] font-bold">2</text>
                  <text x="5" y="134" className="text-[9px] fill-[#9A9DB5] font-bold">0</text>

                  {/* Prior Week Line (Gray) */}
                  <path
                    d="M 30 110 Q 100 80 170 120 T 310 90 T 450 70"
                    fill="none"
                    stroke="#E2E6F2"
                    strokeWidth="2.5"
                  />

                  {/* Active Week Line (Purple) */}
                  <path
                    d="M 30 90 Q 100 30 170 70 T 310 40 T 450 30"
                    fill="none"
                    stroke="#6658F5"
                    strokeWidth="3"
                  />

                  {/* Active Points indicators */}
                  <circle cx="100" cy="50" r="4.5" fill="#6658F5" stroke="#FFFFFF" strokeWidth="1.5" />
                  <circle cx="240" cy="55" r="4.5" fill="#6658F5" stroke="#FFFFFF" strokeWidth="1.5" />
                  <circle cx="380" cy="35" r="4.5" fill="#6658F5" stroke="#FFFFFF" strokeWidth="1.5" />

                  {/* X Axis Labels */}
                  <text x="25" y="145" className="text-[9px] fill-[#9A9DB5] font-bold text-center">Mon</text>
                  <text x="95" y="145" className="text-[9px] fill-[#9A9DB5] font-bold text-center">Tue</text>
                  <text x="165" y="145" className="text-[9px] fill-[#9A9DB5] font-bold text-center">Wed</text>
                  <text x="235" y="145" className="text-[9px] fill-[#9A9DB5] font-bold text-center">Thu</text>
                  <text x="305" y="145" className="text-[9px] fill-[#9A9DB5] font-bold text-center">Fri</text>
                  <text x="375" y="145" className="text-[9px] fill-[#9A9DB5] font-bold text-center">Sat</text>
                  <text x="445" y="145" className="text-[9px] fill-[#9A9DB5] font-bold text-center">Sun</text>
                </svg>
              </div>
            </div>

            {/* Total Employees Donut Chart */}
            <div className="bg-white rounded-[20px] p-6 shadow-premium flex flex-col justify-between">
              <div className="border-b border-[#E2E6F2] pb-3">
                <h3 className="text-base font-bold text-[#171A45]">Gender Distribution</h3>
                <p className="text-xs text-[#70738D] mt-0.5">Workforce diversity details</p>
              </div>

              <div className="flex items-center justify-center py-6">
                <div className="relative flex items-center justify-center">
                  <svg viewBox="0 0 36 36" className="w-28 h-28 transform -rotate-90">
                    <circle cx="18" cy="18" r="15.915" fill="none" stroke="#EEF0FA" strokeWidth="3.5" />
                    <circle
                      cx="18"
                      cy="18"
                      r="15.915"
                      fill="none"
                      stroke="#6658F5"
                      strokeWidth="3.5"
                      strokeDasharray={`${menPercent} ${100 - menPercent}`}
                      strokeDashoffset="0"
                    />
                  </svg>
                  {/* Inner label */}
                  <div className="absolute text-center">
                    <span className="text-2xl font-extrabold text-[#171A45] tracking-tight">{totalEmployeesCount}</span>
                    <span className="text-[9px] font-bold text-[#9A9DB5] block uppercase tracking-wider">Total</span>
                  </div>
                </div>
              </div>

              <div className="flex justify-around text-xs font-bold border-t border-[#E2E6F2] pt-4">
                <div className="flex items-center space-x-2">
                  <span className="w-3 h-3 rounded-full bg-[#6658F5]"></span>
                  <div>
                    <span className="text-[#171A45] block font-extrabold">{menCount}</span>
                    <span className="text-[10px] text-[#9A9DB5] font-bold block uppercase tracking-wide">Men</span>
                  </div>
                </div>
                <div className="flex items-center space-x-2 border-l border-[#E2E6F2] pl-8">
                  <span className="w-3 h-3 rounded-full bg-[#EEF0FA]"></span>
                  <div>
                    <span className="text-[#171A45] block font-extrabold">{womenCount}</span>
                    <span className="text-[10px] text-[#9A9DB5] font-bold block uppercase tracking-wide">Women</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Daily lists Grid: Early Risers, Late Arrivals, Missing Punch */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-slide-up">
            {/* Early Risers */}
            <div className="bg-white rounded-[20px] p-6 shadow-premium flex flex-col justify-between min-h-[320px]">
              <div>
                <div className="flex justify-between items-center border-b border-[#E2E6F2] pb-3 mb-4">
                  <h3 className="text-sm font-extrabold text-[#171A45]">Early Risers</h3>
                  <span className="text-[10px] font-bold text-[#9A9DB5] uppercase tracking-wider">Today</span>
                </div>
                <div className="space-y-4 overflow-y-auto max-h-56 pr-1">
                  {earlyRisers.map((rec) => (
                    <div key={rec.id} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2.5 min-w-0">
                        <img
                          src={rec.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${rec.name}`}
                          alt={rec.name}
                          className="w-8 h-8 rounded-full object-cover border border-[#E2E6F2]"
                        />
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-[#171A45] truncate leading-tight">{rec.name}</p>
                          <p className="text-[9px] text-[#9A9DB5] font-mono mt-0.5">{rec.empId}</p>
                        </div>
                      </div>
                      <span className="bg-[#43B77A]/10 text-[#43B77A] border border-[#43B77A]/20 px-2.5 py-0.8 rounded-lg text-[10px] font-bold font-mono">
                        {rec.time}
                      </span>
                    </div>
                  ))}
                  {earlyRisers.length === 0 && (
                    <p className="text-xs text-[#9A9DB5] text-center pt-8 font-semibold">No early check-ins logged.</p>
                  )}
                </div>
              </div>
            </div>

            {/* Late Arrivals */}
            <div className="bg-white rounded-[20px] p-6 shadow-premium flex flex-col justify-between min-h-[320px]">
              <div>
                <div className="flex justify-between items-center border-b border-[#E2E6F2] pb-3 mb-4">
                  <h3 className="text-sm font-extrabold text-[#171A45]">Late Arrivals</h3>
                  <span className="text-[10px] font-bold text-[#9A9DB5] uppercase tracking-wider">Today</span>
                </div>
                <div className="space-y-4 overflow-y-auto max-h-56 pr-1">
                  {lateArrivalsList.map((rec) => (
                    <div key={rec.id} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2.5 min-w-0">
                        <img
                          src={rec.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${rec.name}`}
                          alt={rec.name}
                          className="w-8 h-8 rounded-full object-cover border border-[#E2E6F2]"
                        />
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-[#171A45] truncate leading-tight">{rec.name}</p>
                          <p className="text-[9px] text-[#9A9DB5] font-mono mt-0.5">{rec.empId}</p>
                        </div>
                      </div>
                      <span className="bg-[#E95D73]/10 text-[#E95D73] border border-[#E95D73]/20 px-2.5 py-0.8 rounded-lg text-[10px] font-bold font-mono">
                        +{rec.duration}
                      </span>
                    </div>
                  ))}
                  {lateArrivalsList.length === 0 && (
                    <p className="text-xs text-[#9A9DB5] text-center pt-8 font-semibold">No late arrivals logged.</p>
                  )}
                </div>
              </div>
            </div>

            {/* Missing Punch */}
            <div className="bg-white rounded-[20px] p-6 shadow-premium flex flex-col justify-between min-h-[320px]">
              <div>
                <div className="flex justify-between items-center border-b border-[#E2E6F2] pb-3 mb-4">
                  <h3 className="text-sm font-extrabold text-[#171A45]">Missing Punch</h3>
                  <span className="text-[10px] font-bold text-[#9A9DB5] uppercase tracking-wider">Checkout Missing</span>
                </div>
                <div className="space-y-4 overflow-y-auto max-h-56 pr-1">
                  {missingPunchList.map((rec) => (
                    <div key={rec.id} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2.5 min-w-0">
                        <img
                          src={rec.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${rec.name}`}
                          alt={rec.name}
                          className="w-8 h-8 rounded-full object-cover border border-[#E2E6F2]"
                        />
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-[#171A45] truncate leading-tight">{rec.name}</p>
                          <p className="text-[9px] text-[#9A9DB5] font-mono mt-0.5">{rec.empId}</p>
                        </div>
                      </div>
                      <span className="bg-[#E95D73]/10 text-[#E95D73] border border-[#E95D73]/20 px-2.5 py-0.5 rounded-lg text-[10px] font-bold tracking-wider uppercase">
                        Checkout Required
                      </span>
                    </div>
                  ))}
                  {missingPunchList.length === 0 && (
                    <p className="text-xs text-[#9A9DB5] text-center pt-8 font-semibold">All logs checked out cleanly.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Redesigned Leave Requests approval card */}
      <div className="bg-white rounded-[20px] p-6 shadow-premium animate-slide-up">
        <div className="flex justify-between items-center border-b border-[#E2E6F2] pb-3 mb-4">
          <div>
            <h3 className="text-base font-bold text-[#171A45]">
              {isAdminOrHR ? "Pending Leave Requests" : "My Pending Leave Requests"}
            </h3>
            <p className="text-xs text-[#70738D] mt-0.5">
              {isAdminOrHR ? "Decisions and reviews required" : "Awaiting HR approval"}
            </p>
          </div>
          <button
            onClick={() => onNavigate('TIME_OFF')}
            className="text-xs font-bold text-[#6658F5] hover:text-[#5748E8] transition-colors"
          >
            Manage Time Off
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#F5F6FC] text-[#70738D] border-b border-[#E2E6F2] uppercase font-bold tracking-wider">
                <th className="p-3.5">Employee</th>
                <th className="p-3.5">Leave Type</th>
                <th className="p-3.5">Duration</th>
                <th className="p-3.5">Validity Dates</th>
                <th className="p-3.5">Remarks</th>
                {isAdminOrHR && <th className="p-3.5 text-center">Action</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E6F2] text-[#171A45]">
              {pendingLeaves.map((req) => (
                <tr key={req.id} className="hover:bg-[#F5F6FC]/50 transition-colors">
                  <td className="p-3.5 font-bold flex items-center space-x-2.5">
                    <span className="w-7 h-7 bg-[#6658F5]/10 text-[#6658F5] rounded-lg flex items-center justify-center font-bold text-xs">
                      {req.employeeName.substring(0, 2).toUpperCase()}
                    </span>
                    <span>{req.employeeName}</span>
                  </td>
                  <td className="p-3.5 font-semibold">{req.leaveType} Leave</td>
                  <td className="p-3.5 font-mono">{req.durationDays} Days</td>
                  <td className="p-3.5 font-mono text-[#70738D]">{req.startDate} to {req.endDate}</td>
                  <td className="p-3.5 max-w-[200px] truncate font-medium text-[#70738D]" title={req.remarks}>
                    {req.remarks || 'No remarks provided.'}
                  </td>
                  {isAdminOrHR && (
                    <td className="p-3.5 text-center">
                      <div className="flex items-center justify-center space-x-2">
                        <button
                          onClick={() => onReviewLeave(req.id, 'Approved')}
                          className="bg-[#43B77A]/15 hover:bg-[#43B77A] text-[#43B77A] hover:text-white border border-[#43B77A]/20 rounded-lg px-2.5 py-1 text-[10px] font-bold transition-all shadow-sm"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => onReviewLeave(req.id, 'Rejected')}
                          className="bg-[#E95D73]/15 hover:bg-[#E95D73] text-[#E95D73] hover:text-white border border-[#E95D73]/20 rounded-lg px-2.5 py-1 text-[10px] font-bold transition-all shadow-sm"
                        >
                          Reject
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
              {pendingLeaves.length === 0 && (
                <tr>
                  <td colSpan={isAdminOrHR ? 6 : 5} className="p-6 text-center text-[#9A9DB5] font-semibold">
                    {isAdminOrHR ? "No leave requests pending review." : "You have no pending leave requests."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
