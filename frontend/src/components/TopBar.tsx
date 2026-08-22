import React, { useState } from 'react';
import type { UserRole, Employee } from '../types';

interface TopBarProps {
  currentView: string;
  currentRole: UserRole;
  currentUser: Employee;
  checkInState: { checkedIn: boolean; checkInTime: string | null };
  onCheckIn: () => void;
  onCheckOut: () => void;
  employeeViewActive: boolean;
  onToggleEmployeeView: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  currentView,
  currentRole,
  currentUser,
  checkInState,
  onCheckIn,
  onCheckOut,
  employeeViewActive,
  onToggleEmployeeView,
}) => {
  const [systrayOpen, setSystrayOpen] = useState(false);

  const getStatusColorClasses = () => {
    if (checkInState.checkedIn) return 'bg-[#2F855A] text-[#2F855A]';
    if (currentUser?.attendanceStatus === 'Leave') return 'bg-[#2B6CB0] text-[#2B6CB0]';
    return 'bg-[#718096] text-[#718096]';
  };

  const getStatusText = () => {
    if (checkInState.checkedIn) return 'Present';
    if (currentUser?.attendanceStatus === 'Leave') return 'On Leave';
    return 'Absent';
  };

  const getViewTitle = () => {
    switch (currentView) {
      case 'DASHBOARD':
        return 'Dashboard';
      case 'EMPLOYEES':
        return 'Employees Directory';
      case 'ATTENDANCE':
        return 'Attendance Tracker';
      case 'TIME_OFF':
        return 'Time Off & Leaves';
      case 'MY_PROFILE':
        return 'My Profile Settings';
      default:
        return 'Dayflow HRMS';
    }
  };

  return (
    <header className="bg-white border-b border-[#E2E8F0] py-3.5 px-6 flex items-center justify-between sticky top-0 z-30 shadow-sm">
      {/* Left: View Breadcrumbs */}
      <div>
        <h1 className="text-base font-bold text-[#111111] tracking-tight">{getViewTitle()}</h1>
      </div>

      {/* Right: Actions, Role Selector & Systray */}
      <div className="flex items-center space-x-3">
        
        {/* Attendance Systray Widget */}
        <div className="relative">
          <button
            onClick={() => setSystrayOpen(!systrayOpen)}
            className="flex items-center space-x-2 bg-[#F8F9FA] border border-[#E2E8F0] hover:border-[#111111]/30 px-3 py-2 rounded-xl text-xs text-[#111111] font-semibold transition-all"
          >
            <span className={`w-2 h-2 rounded-full ${getStatusColorClasses().split(' ')[0]}`}></span>
            <span>{getStatusText()}</span>
            {checkInState.checkedIn && checkInState.checkInTime && (
              <span className="text-[#718096] font-mono">({checkInState.checkInTime})</span>
            )}
            <svg className="w-4 h-4 text-[#718096]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {systrayOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white border border-[#E2E8F0] rounded-xl shadow-sm p-4 z-50 animate-scale-in">
              <div className="text-[10px] font-bold text-[#A0AEC0] uppercase tracking-wider mb-2">
                Presence Status
              </div>
              <div className="flex items-center space-x-2 mb-4">
                <span className={`w-2 h-2 rounded-full ${getStatusColorClasses().split(' ')[0]}`}></span>
                <span className="text-xs font-bold text-[#111111]">{getStatusText()}</span>
                {checkInState.checkedIn && checkInState.checkInTime && (
                  <span className="text-[10px] text-[#718096] font-mono">since {checkInState.checkInTime}</span>
                )}
              </div>
              
              {!checkInState.checkedIn ? (
                <button
                  onClick={() => {
                    onCheckIn();
                    setSystrayOpen(false);
                  }}
                  className="w-full bg-[#111111] hover:bg-[#222222] text-white font-bold py-2.5 px-3 rounded-lg text-xs flex items-center justify-center space-x-1.5 transition-colors shadow-sm"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                  </svg>
                  <span>Check In</span>
                </button>
              ) : (
                <button
                  onClick={() => {
                    onCheckOut();
                    setSystrayOpen(false);
                  }}
                  className="w-full bg-[#C53030] hover:bg-[#9B2C2C] text-white font-bold py-2.5 px-3 rounded-lg text-xs flex items-center justify-center space-x-1.5 transition-colors shadow-sm"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  <span>Check Out</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Sandbox view switcher for Admin/HR Officer */}
        {(currentUser.role === 'Admin' || currentUser.role === 'HR Officer') && (
          <button
            onClick={onToggleEmployeeView}
            className={`flex items-center space-x-1.5 px-3 py-2 rounded-xl border text-xs font-bold transition-all shadow-xs ${
              employeeViewActive
                ? 'bg-[#FEFCBF] border-[#FEEBC8] text-[#B7791F]'
                : 'bg-[#F8F9FA] border-[#E2E8F0] text-[#111111] hover:bg-[#E2E8F0]'
            }`}
            title="Toggle Employee Sandbox View"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            <span className="hidden sm:inline">{employeeViewActive ? 'Exit Employee View' : 'Employee View Sandbox'}</span>
          </button>
        )}

        {/* User Role Badge (Non-changeable, fetched from DB) */}
        <div className="flex items-center bg-[#F8F9FA] border border-[#E2E8F0] px-3.5 py-2 rounded-xl select-none text-xs">
          <span className="text-[10px] uppercase font-bold text-[#718096] mr-1">Role:</span>
          <span className="text-[#111111] font-bold">{currentRole}</span>
        </div>

        {/* Notifications indicators */}
        <div className="hidden sm:flex items-center space-x-2">
          <button className="w-9 h-9 bg-[#F8F9FA] border border-[#E2E8F0] hover:bg-[#E2E8F0] rounded-xl flex items-center justify-center text-[#718096] transition-colors">
            <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          </button>
        </div>

      </div>
    </header>
  );
};
