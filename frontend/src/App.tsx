import React, { useState, useEffect } from 'react';
import { SignIn } from './components/SignIn';
import { SignUp } from './components/SignUp';
import { EmployeesDashboard } from './components/EmployeesDashboard';
import { EmployeeDetailModal } from './components/EmployeeDetailModal';
import { MyProfile } from './components/MyProfile';
import { AttendanceModule } from './components/AttendanceModule';
import { TimeOffModule } from './components/TimeOffModule';
import { Sidebar } from './components/Sidebar';
import { TopBar } from './components/TopBar';
import { Dashboard } from './components/Dashboard';

import type { Employee, AttendanceRecord, LeaveRequest, UserRole } from './types';
import { mockEmployees, mockAttendanceRecords, mockLeaveRequests } from './mockData';

// Helper utilities for date/time logs
const getCurrentTimeStr = () => {
  const now = new Date();
  const hrs = String(now.getHours()).padStart(2, '0');
  const mins = String(now.getMinutes()).padStart(2, '0');
  return `${hrs}:${mins}`;
};

const getCurrentDateStr = () => {
  const now = new Date();
  const yr = now.getFullYear();
  const mo = String(now.getMonth() + 1).padStart(2, '0');
  const dy = String(now.getDate()).padStart(2, '0');
  return `${yr}-${mo}-${dy}`;
};

const calculateHoursDiff = (start: string, end: string): number => {
  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);
  const diffMinutes = (eh * 60 + em) - (sh * 60 + sm);
  return Math.max(0, Math.round((diffMinutes / 60) * 100) / 100);
};

export const App: React.FC = () => {
  // Navigation & Session States
  const [currentView, setCurrentView] = useState<string>('SIGN_IN');
  const [currentUser, setCurrentUser] = useState<Employee | null>(null);
  const [currentRole, setCurrentRole] = useState<UserRole>('Employee');
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);

  // Global Mock Database States
  const [employees, setEmployees] = useState<Employee[]>(() => {
    const saved = localStorage.getItem('df_employees');
    return saved ? JSON.parse(saved) : mockEmployees;
  });
  
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>(() => {
    const saved = localStorage.getItem('df_attendance');
    return saved ? JSON.parse(saved) : mockAttendanceRecords;
  });
  
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>(() => {
    const saved = localStorage.getItem('df_leaves');
    return saved ? JSON.parse(saved) : mockLeaveRequests;
  });

  // Check In State
  const [checkInState, setCheckInState] = useState<{ checkedIn: boolean; checkInTime: string | null }>(() => {
    const saved = localStorage.getItem('df_checkin_state');
    return saved ? JSON.parse(saved) : { checkedIn: false, checkInTime: null };
  });

  // Persist states in LocalStorage to feel like a real DB
  useEffect(() => {
    localStorage.setItem('df_employees', JSON.stringify(employees));
  }, [employees]);

  useEffect(() => {
    localStorage.setItem('df_attendance', JSON.stringify(attendanceRecords));
  }, [attendanceRecords]);

  useEffect(() => {
    localStorage.setItem('df_leaves', JSON.stringify(leaveRequests));
  }, [leaveRequests]);

  useEffect(() => {
    localStorage.setItem('df_checkin_state', JSON.stringify(checkInState));
  }, [checkInState]);

  // Auth Operations
  const handleLoginSuccess = (user: Employee) => {
    setCurrentUser(user);
    setCurrentRole(user.role);
    
    // Sync check-in state with today's record (if any exists in DB)
    const today = getCurrentDateStr();
    const todayRecord = attendanceRecords.find(r => r.employeeId === user.id && r.date === today);
    if (todayRecord) {
      setCheckInState({
        checkedIn: !todayRecord.checkOut,
        checkInTime: todayRecord.checkIn
      });
    } else {
      setCheckInState({ checkedIn: false, checkInTime: null });
    }

    setCurrentView('DASHBOARD');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setCurrentView('SIGN_IN');
    setSelectedEmployee(null);
  };

  const handleRoleChange = (role: UserRole) => {
    setCurrentRole(role);
    // If the active user profile changes its role context in state
    if (currentUser) {
      const updatedUser = { ...currentUser, role: role };
      setCurrentUser(updatedUser);
      setEmployees(prev => prev.map(emp => emp.id === currentUser.id ? updatedUser : emp));
    }
  };

  // Onboarding Operation
  const handleOnboardEmployee = (newEmp: Employee) => {
    setEmployees((prev) => [newEmp, ...prev]);
  };

  // Profile Save Operation
  const handleSaveProfile = (updatedEmp: Employee) => {
    setEmployees((prev) => prev.map((emp) => (emp.id === updatedEmp.id ? updatedEmp : emp)));
    if (currentUser && currentUser.id === updatedEmp.id) {
      setCurrentUser(updatedEmp);
    }
  };

  // Check In/Out Systray Operations
  const handleCheckIn = () => {
    if (!currentUser) return;
    const today = getCurrentDateStr();
    const time = getCurrentTimeStr();

    // 1. Create a new check-in record
    const newRecord: AttendanceRecord = {
      id: `a_new_${Date.now()}`,
      employeeId: currentUser.id,
      employeeName: currentUser.name,
      date: today,
      checkIn: time,
      status: 'Present'
    };

    setAttendanceRecords(prev => [newRecord, ...prev]);
    setCheckInState({ checkedIn: true, checkInTime: time });

    // 2. Set employee status in directory to Present
    setEmployees(prev => prev.map(emp => {
      if (emp.id === currentUser.id) {
        const updated = { ...emp, attendanceStatus: 'Present' as const };
        if (currentUser.id === emp.id) setCurrentUser(updated);
        return updated;
      }
      return emp;
    }));
  };

  const handleCheckOut = () => {
    if (!currentUser) return;
    const today = getCurrentDateStr();
    const time = getCurrentTimeStr();

    // 1. Find and update today's check-in log
    setAttendanceRecords(prev => prev.map(rec => {
      if (rec.employeeId === currentUser.id && rec.date === today && !rec.checkOut) {
        const workHrs = calculateHoursDiff(rec.checkIn, time);
        const extraHrs = Math.max(0, workHrs - 8.0); // overtime over 8 hours
        return {
          ...rec,
          checkOut: time,
          workHours: workHrs,
          extraHours: extraHrs
        };
      }
      return rec;
    }));

    setCheckInState({ checkedIn: false, checkInTime: null });

    // 2. Reset employee status in directory
    setEmployees(prev => prev.map(emp => {
      if (emp.id === currentUser.id) {
        const updated = { ...emp, attendanceStatus: 'Absent' as const };
        if (currentUser.id === emp.id) setCurrentUser(updated);
        return updated;
      }
      return emp;
    }));
  };

  // Leaves Review Operations
  const handleApplyLeave = (newLeave: LeaveRequest) => {
    setLeaveRequests((prev) => [newLeave, ...prev]);
    
    // Update employee status if start date is today
    const today = getCurrentDateStr();
    if (newLeave.startDate === today && newLeave.status === 'Approved') {
      setEmployees(prev => prev.map(emp => {
        if (emp.id === newLeave.employeeId) {
          return { ...emp, attendanceStatus: 'Leave' as const };
        }
        return emp;
      }));
    }
  };

  const handleReviewLeave = (leaveId: string, status: 'Approved' | 'Rejected') => {
    setLeaveRequests((prev) =>
      prev.map((req) => (req.id === leaveId ? { ...req, status } : req))
    );

    // If approved and date is today, update active employee status
    const targetLeave = leaveRequests.find(r => r.id === leaveId);
    if (targetLeave && status === 'Approved') {
      const today = getCurrentDateStr();
      if (targetLeave.startDate <= today && targetLeave.endDate >= today) {
        setEmployees(prev => prev.map(emp => {
          if (emp.id === targetLeave.employeeId) {
            const updated = { ...emp, attendanceStatus: 'Leave' as const };
            if (currentUser && currentUser.id === emp.id) setCurrentUser(updated);
            return updated;
          }
          return emp;
        }));
      }
    }
  };

  const isAuthView = currentView === 'SIGN_IN' || currentView === 'SIGN_UP';

  if (isAuthView) {
    return (
      <div className="min-h-screen bg-[#F5F6FC] flex flex-col font-sans select-none overflow-y-auto">
        <main className="flex-1 flex flex-col justify-center items-center py-12 px-4">
          {currentView === 'SIGN_IN' && (
            <SignIn
              onNavigate={setCurrentView}
              onLoginSuccess={handleLoginSuccess}
              employees={employees}
            />
          )}

          {currentView === 'SIGN_UP' && (
            <SignUp onNavigate={setCurrentView} onRegister={handleOnboardEmployee} />
          )}
        </main>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#F5F6FC] font-sans select-none overflow-hidden">
      {/* Sidebar Panel */}
      <Sidebar
        currentView={currentView}
        onNavigate={setCurrentView}
        currentUser={currentUser!}
        onLogout={handleLogout}
      />

      {/* Main Container region */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header systrays */}
        <TopBar
          currentView={currentView}
          currentRole={currentRole}
          onChangeRole={handleRoleChange}
          currentUser={currentUser!}
          checkInState={checkInState}
          onCheckIn={handleCheckIn}
          onCheckOut={handleCheckOut}
        />

        {/* Scrollable routing viewport */}
        <main className="flex-1 overflow-y-auto flex flex-col">
          {currentView === 'DASHBOARD' && currentUser && (
            <Dashboard
              employees={employees}
              attendanceRecords={attendanceRecords}
              leaveRequests={leaveRequests}
              currentUser={currentUser}
              currentRole={currentRole}
              onNavigate={setCurrentView}
              onReviewLeave={handleReviewLeave}
            />
          )}

          {currentView === 'EMPLOYEES' && currentUser && (
            <EmployeesDashboard
              employees={employees}
              currentRole={currentRole}
              onOnboard={handleOnboardEmployee}
              onSelectEmployee={setSelectedEmployee}
            />
          )}

          {currentView === 'MY_PROFILE' && currentUser && (
            <MyProfile
              key={`${currentUser.id}-${currentRole}`}
              employee={currentUser}
              currentRole={currentRole}
              onSaveProfile={handleSaveProfile}
            />
          )}

          {currentView === 'ATTENDANCE' && currentUser && (
            <AttendanceModule
              attendanceRecords={attendanceRecords}
              currentRole={currentRole}
              currentUser={currentUser}
            />
          )}

          {currentView === 'TIME_OFF' && currentUser && (
            <TimeOffModule
              leaveRequests={leaveRequests}
              currentRole={currentRole}
              currentUser={currentUser}
              onApplyLeave={handleApplyLeave}
              onReviewLeave={handleReviewLeave}
            />
          )}
        </main>
      </div>

      {/* Selected Employee View-Only Modal */}
      {selectedEmployee && (
        <EmployeeDetailModal
          employee={selectedEmployee}
          currentRole={currentRole}
          onClose={() => setSelectedEmployee(null)}
        />
      )}
    </div>
  );
};

export default App;
