import React, { useState } from 'react';
import type { AttendanceRecord, UserRole, Employee } from '../types';

interface AttendanceModuleProps {
  attendanceRecords: AttendanceRecord[];
  currentRole: UserRole;
  currentUser: Employee | null;
}

export const AttendanceModule: React.FC<AttendanceModuleProps> = ({
  attendanceRecords,
  currentRole,
  currentUser,
}) => {
  const [selectedDate, setSelectedDate] = useState('2026-08-22');
  const [searchTerm, setSearchTerm] = useState('');

  const isAdminOrHR = currentRole === 'Admin' || currentRole === 'HR Officer';

  // Navigate date backwards/forwards
  const handlePrevDate = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() - 1);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  const handleNextDate = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + 1);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  const formatDateDisplay = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  // --- Admin/HR Logic ---
  // Filter records for the selected date, matching search term
  const adminRecords = attendanceRecords.filter((rec) => {
    const matchesDate = rec.date === selectedDate;
    const matchesSearch = rec.employeeName.toLowerCase().includes(searchTerm.toLowerCase().trim());
    return matchesDate && matchesSearch;
  });

  // --- Employee Logic ---
  // Filter records belonging to the current user
  const employeeRecords = attendanceRecords.filter((rec) => rec.employeeId === currentUser?.id);

  // Summary Stats for Employee View
  const daysPresent = employeeRecords.filter((r) => r.status === 'Present').length;
  const daysOnLeave = employeeRecords.filter((r) => r.status === 'Leave').length;
  const totalWorkingDays = employeeRecords.length;

  return (
    <div className="flex-1 bg-[#F8F9FA] px-8 py-8 space-y-6 overflow-y-auto max-h-[calc(100vh-64px)]">
      {/* View Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#E2E8F0] pb-4">
        <div>
          <h2 className="text-lg font-bold text-[#111111] tracking-tight">Attendance Logs</h2>
          <p className="text-xs text-[#718096] mt-0.5 font-semibold uppercase tracking-wider">
            {isAdminOrHR ? 'Organization Daily Logs' : 'Personal Monthly Attendance Sheet'}
          </p>
        </div>

        {/* Date Selector for Admin */}
        {isAdminOrHR && (
          <div className="flex items-center space-x-1.5 bg-white border border-[#E2E8F0] px-3 py-1.5 rounded-xl shadow-sm">
            <button
              onClick={handlePrevDate}
              className="text-[#718096] hover:text-[#111111] p-1 hover:bg-[#F8F9FA] rounded transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <span className="text-xs font-bold text-[#111111] px-2 min-w-[140px] text-center uppercase tracking-wider">
              {formatDateDisplay(selectedDate)}
            </span>
            <button
              onClick={handleNextDate}
              className="text-[#718096] hover:text-[#111111] p-1 hover:bg-[#F8F9FA] rounded transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        )}
      </div>

      {isAdminOrHR ? (
        // ==================== ADMIN & HR OFFICER VIEW ====================
        <div className="space-y-6 animate-slide-up">
          {/* Search bar */}
          <div className="relative max-w-md">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search present employees..."
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

          {/* Daily list table */}
          <div className="bg-white border border-[#E2E8F0] rounded-xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#F8F9FA] text-[#4A5568] border-b border-[#E2E8F0] uppercase font-bold tracking-wider text-[10px]">
                    <th className="p-4">Employee</th>
                    <th className="p-4 text-center">Check In</th>
                    <th className="p-4 text-center">Check Out</th>
                    <th className="p-4 text-center">Work Hours</th>
                    <th className="p-4 text-center">Extra Hours</th>
                    <th className="p-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8F0] text-[#111111]">
                  {adminRecords.map((rec) => (
                    <tr key={rec.id} className="hover:bg-[#F8F9FA] transition-colors">
                      <td className="p-4 font-bold flex items-center space-x-2.5">
                        <span className="w-7 h-7 bg-[#F8F9FA] text-[#111111] border border-[#E2E8F0] rounded-full flex items-center justify-center font-bold text-[10px]">
                          {rec.employeeName.substring(0, 2).toUpperCase()}
                        </span>
                        <span>{rec.employeeName}</span>
                      </td>
                      <td className="p-4 text-center font-mono text-[#111111] font-semibold">{rec.checkIn}</td>
                      <td className="p-4 text-center font-mono text-[#718096] font-semibold">{rec.checkOut || '-- : --'}</td>
                      <td className="p-4 text-center font-mono text-[#718096] font-semibold">
                        {rec.workHours !== undefined ? `${rec.workHours.toFixed(2)} hrs` : '--'}
                      </td>
                      <td className="p-4 text-center font-mono text-[#718096] font-semibold">
                        {rec.extraHours !== undefined ? `${rec.extraHours.toFixed(2)} hrs` : '--'}
                      </td>
                      <td className="p-4 text-center">
                        <span className="inline-flex items-center justify-center w-24 px-2 py-0.5 rounded border text-[9px] uppercase font-bold tracking-wider text-[#2F855A] bg-[#F0FDF4] border-[#DCFCE7]">
                          Present
                        </span>
                      </td>
                    </tr>
                  ))}
                  {adminRecords.length === 0 && (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-[#A0AEC0] font-bold bg-white">
                        No checked-in employees recorded for {formatDateDisplay(selectedDate)}.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        // ==================== EMPLOYEE PERSONAL VIEW ====================
        <div className="space-y-6 animate-slide-up">
          {/* Summary Cards Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="bg-white border border-[#E2E8F0] p-5 rounded-xl flex items-center justify-between shadow-sm">
              <div>
                <span className="text-[#718096] text-[10px] font-bold uppercase tracking-wider block">Days Present</span>
                <span className="text-xl font-bold text-[#111111] mt-1 block">{daysPresent} Days</span>
              </div>
              <span className="text-xs font-bold px-2 py-0.5 bg-[#F0FDF4] text-[#2F855A] border border-[#DCFCE7] rounded">ACTIVE</span>
            </div>
            
            <div className="bg-white border border-[#E2E8F0] p-5 rounded-xl flex items-center justify-between shadow-sm">
              <div>
                <span className="text-[#718096] text-[10px] font-bold uppercase tracking-wider block">Leaves Count</span>
                <span className="text-xl font-bold text-[#111111] mt-1 block">{daysOnLeave} Days</span>
              </div>
              <span className="text-xs font-bold px-2 py-0.5 bg-[#EBF8FF] text-[#2B6CB0] border border-[#BEE3F8] rounded">ON LEAVE</span>
            </div>

            <div className="bg-white border border-[#E2E8F0] p-5 rounded-xl flex items-center justify-between shadow-sm">
              <div>
                <span className="text-[#718096] text-[10px] font-bold uppercase tracking-wider block">Total Working Days</span>
                <span className="text-xl font-bold text-[#111111] mt-1 block">{totalWorkingDays} Days</span>
              </div>
              <span className="text-xs font-bold px-2 py-0.5 bg-[#F8F9FA] text-[#718096] border border-[#E2E8F0] rounded">SUMMARY</span>
            </div>
          </div>

          {/* Employee Month Table */}
          <div className="bg-white border border-[#E2E8F0] rounded-xl overflow-hidden shadow-sm">
            <div className="px-5 py-3 bg-[#F8F9FA] border-b border-[#E2E8F0] flex items-center justify-between">
              <span className="text-[10px] font-bold text-[#111111] uppercase tracking-wider">August 2026 Logs</span>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-white text-[#4A5568] border-b border-[#E2E8F0] uppercase font-bold tracking-wider text-[10px]">
                    <th className="p-4">Date</th>
                    <th className="p-4 text-center">Check In</th>
                    <th className="p-4 text-center">Check Out</th>
                    <th className="p-4 text-center">Work Hours</th>
                    <th className="p-4 text-center">Extra Hours</th>
                    <th className="p-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8F0] text-[#111111]">
                  {employeeRecords.map((rec) => (
                    <tr key={rec.id} className="hover:bg-[#F8F9FA] transition-colors">
                      <td className="p-4 font-bold text-[#111111] font-mono">
                        {new Date(rec.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="p-4 text-center font-mono text-[#111111] font-semibold">{rec.checkIn || '--:--'}</td>
                      <td className="p-4 text-center font-mono text-[#718096] font-semibold">{rec.checkOut || '--:--'}</td>
                      <td className="p-4 text-center font-mono text-[#718096] font-semibold">
                        {rec.workHours !== undefined ? `${rec.workHours.toFixed(2)} hrs` : '--'}
                      </td>
                      <td className="p-4 text-center font-mono text-[#718096] font-semibold">
                        {rec.extraHours !== undefined ? `${rec.extraHours.toFixed(2)} hrs` : '--'}
                      </td>
                      <td className="p-4 text-center">
                        <span
                          className={`inline-flex items-center justify-center w-24 px-2 py-0.5 rounded border text-[9px] uppercase font-bold tracking-wider ${
                            rec.status === 'Present'
                              ? 'bg-[#F0FDF4] text-[#2F855A] border-[#DCFCE7]'
                              : rec.status === 'Leave'
                              ? 'bg-[#EBF8FF] text-[#2B6CB0] border-[#BEE3F8]'
                              : 'bg-[#F8F9FA] text-[#718096] border-[#E2E8F0]'
                          }`}
                        >
                          {rec.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {employeeRecords.length === 0 && (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-[#A0AEC0] font-bold bg-white">
                        No attendance records logged for the current month.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
