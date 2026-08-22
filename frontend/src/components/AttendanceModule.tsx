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
    <div className="flex-1 bg-[#F5F6FC] px-8 py-6">
      {/* View Header */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#E2E6F2] pb-4">
        <div>
          <h2 className="text-lg font-bold text-[#171A45] tracking-tight">Attendance Logs</h2>
          <p className="text-xs text-[#70738D] mt-0.5 font-semibold">
            {isAdminOrHR ? 'Organization-wide Daily Log View' : 'Personal Monthly Attendance Sheet'}
          </p>
        </div>

        {/* Date Selector for Admin */}
        {isAdminOrHR && (
          <div className="flex items-center space-x-2 bg-white border border-[#E2E6F2] px-3.5 py-1.8 rounded-xl shadow-sm">
            <button
              onClick={handlePrevDate}
              className="text-[#70738D] hover:text-[#171A45] p-1 hover:bg-[#F5F6FC] rounded-lg transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <span className="text-xs font-bold text-[#171A45] px-2 min-w-[130px] text-center">
              {formatDateDisplay(selectedDate)}
            </span>
            <button
              onClick={handleNextDate}
              className="text-[#70738D] hover:text-[#171A45] p-1 hover:bg-[#F5F6FC] rounded-lg transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
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
              placeholder="Search present employees by name..."
              className="w-full bg-white border border-[#E2E6F2] rounded-xl pl-10 pr-4 py-2.5 text-sm text-[#171A45] placeholder-[#9A9DB5] focus:outline-none focus:border-[#171717] focus:ring-1 focus:ring-[#171717] transition-all"
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

          {/* Daily list table */}
          <div className="bg-white border border-[#E2E6F2] rounded-[20px] overflow-hidden shadow-premium">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#F5F6FC] text-[#70738D] border-b border-[#E2E6F2] uppercase font-bold tracking-wider">
                    <th className="p-4">Employee</th>
                    <th className="p-4 text-center">Check In</th>
                    <th className="p-4 text-center">Check Out</th>
                    <th className="p-4 text-center">Work Hours</th>
                    <th className="p-4 text-center">Extra Hours</th>
                    <th className="p-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E6F2] text-[#171A45]">
                  {adminRecords.map((rec) => (
                    <tr key={rec.id} className="hover:bg-[#F5F6FC]/50 transition-colors">
                      <td className="p-4 font-bold text-[#171A45] flex items-center space-x-3">
                        <span className="w-7 h-7 bg-[#171717]/10 text-[#171717] rounded-lg flex items-center justify-center font-bold text-xs">
                          {rec.employeeName.substring(0, 2).toUpperCase()}
                        </span>
                        <span>{rec.employeeName}</span>
                      </td>
                      <td className="p-4 text-center font-mono text-[#171A45] font-semibold">{rec.checkIn}</td>
                      <td className="p-4 text-center font-mono text-[#70738D] font-semibold">{rec.checkOut || '-- : --'}</td>
                      <td className="p-4 text-center font-mono text-[#70738D] font-semibold">
                        {rec.workHours !== undefined ? `${rec.workHours.toFixed(2)} hrs` : '--'}
                      </td>
                      <td className="p-4 text-center font-mono text-[#70738D] font-semibold">
                        {rec.extraHours !== undefined ? `${rec.extraHours.toFixed(2)} hrs` : '--'}
                      </td>
                      <td className="p-4 text-center">
                        <span className="inline-flex items-center justify-center w-24 px-2.5 py-1.2 rounded-lg text-[10px] uppercase font-bold tracking-wider bg-[#43B77A]/10 text-[#43B77A] border border-[#43B77A]/20">
                          Present
                        </span>
                      </td>
                    </tr>
                  ))}
                  {adminRecords.length === 0 && (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-[#9A9DB5] font-bold">
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
            <div className="bg-white border border-[#E2E6F2] p-5 rounded-[20px] flex items-center justify-between shadow-premium hover:shadow-premium-hover transition-all">
              <div>
                <span className="text-[#70738D] text-xs font-bold uppercase tracking-wider block">Days Present</span>
                <span className="text-3xl font-extrabold text-[#43B77A] mt-1 block">{daysPresent} Days</span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-[#43B77A]/20 flex items-center justify-center text-emerald-400 text-lg">
                🟢
              </div>
            </div>
            
            <div className="bg-white border border-[#E2E6F2] p-5 rounded-[20px] flex items-center justify-between shadow-premium hover:shadow-premium-hover transition-all">
              <div>
                <span className="text-[#70738D] text-xs font-bold uppercase tracking-wider block">Leaves Count</span>
                <span className="text-3xl font-extrabold text-[#171717] mt-1 block">{daysOnLeave} Days</span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-gray-100 border border-[#171717]/20 flex items-center justify-center text-[#171717] text-lg">
                ✈️
              </div>
            </div>

            <div className="bg-white border border-[#E2E6F2] p-5 rounded-[20px] flex items-center justify-between shadow-premium hover:shadow-premium-hover transition-all">
              <div>
                <span className="text-[#70738D] text-xs font-bold uppercase tracking-wider block">Total Working Days</span>
                <span className="text-3xl font-extrabold text-[#171A45] mt-1 block">{totalWorkingDays} Days</span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-[#F5F6FC] border border-[#E2E6F2] flex items-center justify-center text-[#70738D] text-lg font-bold">
                🗓️
              </div>
            </div>
          </div>

          {/* Employee Month Table */}
          <div className="bg-white border border-[#E2E6F2] rounded-[20px] overflow-hidden shadow-premium">
            <div className="px-5 py-3.5 bg-[#F5F6FC] border-b border-[#E2E6F2] flex items-center justify-between">
              <span className="text-xs font-extrabold text-[#171A45] uppercase tracking-wider">August 2026 Logs</span>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-white text-[#70738D] border-b border-[#E2E6F2] uppercase font-bold tracking-wider">
                    <th className="p-4">Date</th>
                    <th className="p-4 text-center">Check In</th>
                    <th className="p-4 text-center">Check Out</th>
                    <th className="p-4 text-center">Work Hours</th>
                    <th className="p-4 text-center">Extra Hours</th>
                    <th className="p-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E6F2] text-[#171A45]">
                  {employeeRecords.map((rec) => (
                    <tr key={rec.id} className="hover:bg-[#F5F6FC]/50 transition-colors">
                      <td className="p-4 font-bold text-[#171A45] font-mono">
                        {new Date(rec.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="p-4 text-center font-mono text-[#171A45] font-semibold">{rec.checkIn || '--:--'}</td>
                      <td className="p-4 text-center font-mono text-[#70738D] font-semibold">{rec.checkOut || '--:--'}</td>
                      <td className="p-4 text-center font-mono text-[#70738D] font-semibold">
                        {rec.workHours !== undefined ? `${rec.workHours.toFixed(2)} hrs` : '--'}
                      </td>
                      <td className="p-4 text-center font-mono text-[#70738D] font-semibold">
                        {rec.extraHours !== undefined ? `${rec.extraHours.toFixed(2)} hrs` : '--'}
                      </td>
                      <td className="p-4 text-center">
                        <span
                          className={`inline-flex items-center justify-center w-24 px-2.5 py-1.2 rounded-lg text-[10px] uppercase font-bold tracking-wider border ${
                            rec.status === 'Present'
                              ? 'bg-[#43B77A]/10 text-[#43B77A] border-[#43B77A]/20'
                              : rec.status === 'Leave'
                              ? 'bg-[#5D78E8]/10 text-[#5D78E8] border-[#5D78E8]/20'
                              : 'bg-[#E9A93A]/10 text-[#E9A93A] border-[#E9A93A]/20'
                          }`}
                        >
                          {rec.status === 'Present' ? 'Present' : rec.status === 'Leave' ? 'Leave' : 'Absent'}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {employeeRecords.length === 0 && (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-[#9A9DB5] font-bold">
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
