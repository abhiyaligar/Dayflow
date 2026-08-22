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
import { employeesApi, attendanceApi, leavesApi, mapBackendProfileToEmployee, getAuthToken, removeAuthToken } from './api';

const getCurrentDateStr = () => {
  const now = new Date();
  const yr = now.getFullYear();
  const mo = String(now.getMonth() + 1).padStart(2, '0');
  const dy = String(now.getDate()).padStart(2, '0');
  return `${yr}-${mo}-${dy}`;
};

export const App: React.FC = () => {
  // Navigation & Session States
  const [currentView, setCurrentView] = useState<string>('SIGN_IN');
  const [currentUser, setCurrentUser] = useState<Employee | null>(null);
  const [currentRole, setCurrentRole] = useState<UserRole>('Employee');
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [employeeViewActive, setEmployeeViewActive] = useState<boolean>(false);

  const effectiveRole = (employeeViewActive && (currentRole === 'Admin' || currentRole === 'HR Officer')) ? 'Employee' : currentRole;

  // Global Database States
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);

  // Check In State
  const [checkInState, setCheckInState] = useState<{ checkedIn: boolean; checkInTime: string | null }>(() => {
    const saved = localStorage.getItem('df_checkin_state');
    return saved ? JSON.parse(saved) : { checkedIn: false, checkInTime: null };
  });

  // Load session from localStorage on mount
  useEffect(() => {
    const token = getAuthToken();
    const storedUser = localStorage.getItem('df_user');
    if (token && storedUser) {
      const userObj = JSON.parse(storedUser);
      setCurrentUser(userObj);
      setCurrentRole(userObj.role);
      setCurrentView('DASHBOARD');
    }
  }, []);

  // Sync / Load actual backend data when currentUser is set
  const loadBackendData = async () => {
    if (!currentUser) return;
    try {
      // 1. Fetch updated profile
      const profile = await employeesApi.getProfile(currentUser.loginId);
      const mappedUser = mapBackendProfileToEmployee(profile);
      setCurrentUser(mappedUser);
      localStorage.setItem('df_user', JSON.stringify(mappedUser));

      // 2. Fetch employee list (Admin/HR Only)
      if (currentRole === 'Admin' || currentRole === 'HR Officer') {
        const list = await employeesApi.list();
        const mappedList = list.map((emp: any) => mapBackendProfileToEmployee(emp));
        setEmployees(mappedList);

        // Fetch today's present attendance logs
        try {
          const presentLogs = await attendanceApi.getTodayPresent();
          // Update the checkin status of listed employees
          setEmployees(prev => prev.map(emp => {
            const log = presentLogs.find((l: any) => l.employee_id === emp.loginId);
            return {
              ...emp,
              attendanceStatus: log && log.status === 'Present' ? 'Present' : 'Absent'
            };
          }));
        } catch (e) {
          console.error("Failed to load today's attendance logs:", e);
        }
      }

      // 3. Fetch attendance logs for the current logged-in employee
      try {
        const myLogs = await attendanceApi.getMyLogs();
        // Convert logs into AttendanceRecord format
        const convertedLogs: AttendanceRecord[] = myLogs.map((log: any, idx: number) => {
          const checkInTime = log.check_in ? new Date(log.check_in).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }) : '';
          const checkOutTime = log.check_out ? new Date(log.check_out).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }) : '';
          
          return {
            id: `a_db_${idx}_${log.date}`,
            employeeId: currentUser.id,
            employeeName: currentUser.name,
            date: log.date,
            checkIn: checkInTime,
            checkOut: checkOutTime || undefined,
            workHours: log.total_hours || 0.0,
            extraHours: Math.max(0, (log.total_hours || 0.0) - 8.0),
            status: log.status
          };
        });

        setAttendanceRecords(convertedLogs);

        // Sync check-in/out state with today's record (if any)
        const todayStr = getCurrentDateStr();
        const todayLog = myLogs.find((l: any) => l.date === todayStr);
        if (todayLog) {
          const checkInTime = todayLog.check_in ? new Date(todayLog.check_in).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }) : '';
          setCheckInState({
            checkedIn: !todayLog.check_out,
            checkInTime: checkInTime
          });
        } else {
          setCheckInState({ checkedIn: false, checkInTime: null });
        }
      } catch (e) {
        console.error("Failed to fetch my logs:", e);
      }

    } catch (error) {
      console.error("Error loading backend data:", error);
    }
  };

  useEffect(() => {
    if (currentUser) {
      loadBackendData();
    }
  }, [currentUser?.loginId]);

  // Persist states in LocalStorage as fallback
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
    setCurrentView('DASHBOARD');
  };

  const handleLogout = () => {
    removeAuthToken();
    localStorage.removeItem('df_user');
    setCurrentUser(null);
    setCurrentView('SIGN_IN');
    setSelectedEmployee(null);
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
  const handleCheckIn = async () => {
    if (!currentUser) return;
    try {
      await attendanceApi.checkIn();
      await loadBackendData();
    } catch (e: any) {
      alert(e.message || "Failed to check in");
    }
  };

  const handleCheckOut = async () => {
    if (!currentUser) return;
    try {
      await attendanceApi.checkOut();
      await loadBackendData();
    } catch (e: any) {
      alert(e.message || "Failed to check out");
    }
  };

  // Leaves Review Operations
  // Leaves Review Operations
  const handleApplyLeave = async (newLeave: LeaveRequest, attachment?: File) => {
    try {
      const res = await leavesApi.apply({
        leave_type: newLeave.leaveType as any,
        start_date: newLeave.startDate,
        end_date: newLeave.endDate,
        remarks: newLeave.remarks,
      });

      if (attachment && currentUser) {
        try {
          await employeesApi.uploadDoc(currentUser.loginId, attachment);
        } catch (docErr: any) {
          console.error("Failed to upload sick leave certificate:", docErr);
        }
      }

      const mappedLeave: LeaveRequest = {
        ...newLeave,
        id: res.id,
        employeeId: currentUser?.id || 'e_temp',
        employeeName: currentUser?.name || 'Employee',
      };

      setLeaveRequests((prev) => [mappedLeave, ...prev]);
    } catch (e: any) {
      alert(e.message || "Failed to submit leave request");
    }
  };

  const handleReviewLeave = async (leaveId: string, status: 'Approved' | 'Rejected') => {
    try {
      await leavesApi.review(leaveId, {
        status: status,
        admin_comments: "Reviewed via HR/Admin Dashboard Panel"
      });

      setLeaveRequests((prev) =>
        prev.map((req) => (req.id === leaveId ? { ...req, status } : req))
      );
    } catch (e: any) {
      alert(e.message || "Failed to review leave request");
    }
  };

  const isAuthView = currentView === 'SIGN_IN' || currentView === 'SIGN_UP';

  if (isAuthView) {
    return (
      <div className="min-h-screen bg-[#F5F6FC] flex flex-col font-sans overflow-y-auto">
        <main className="flex-1 flex flex-col justify-center items-center py-12 px-4">
          {currentView === 'SIGN_IN' && (
            <SignIn
              onNavigate={setCurrentView}
              onLoginSuccess={handleLoginSuccess}
            />
          )}

          {currentView === 'SIGN_UP' && (
            <SignUp onNavigate={setCurrentView} />
          )}
        </main>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#F5F6FC] font-sans overflow-hidden">
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
          currentRole={effectiveRole}
          currentUser={currentUser!}
          checkInState={checkInState}
          onCheckIn={handleCheckIn}
          onCheckOut={handleCheckOut}
          employeeViewActive={employeeViewActive}
          onToggleEmployeeView={() => setEmployeeViewActive(!employeeViewActive)}
        />

        {/* Scrollable routing viewport */}
        <main className="flex-1 overflow-y-auto flex flex-col">
          {currentView === 'DASHBOARD' && currentUser && (
            <Dashboard
              employees={employees}
              attendanceRecords={attendanceRecords}
              leaveRequests={leaveRequests}
              currentUser={currentUser}
              currentRole={effectiveRole}
              onNavigate={setCurrentView}
              onReviewLeave={handleReviewLeave}
            />
          )}

          {currentView === 'EMPLOYEES' && currentUser && (
            <EmployeesDashboard
              employees={employees}
              currentRole={effectiveRole}
              onOnboard={handleOnboardEmployee}
              onSelectEmployee={setSelectedEmployee}
            />
          )}

          {currentView === 'MY_PROFILE' && currentUser && (
            <MyProfile
              key={`${currentUser.id}-${effectiveRole}`}
              employee={currentUser}
              currentRole={effectiveRole}
              onSaveProfile={handleSaveProfile}
            />
          )}

          {currentView === 'ATTENDANCE' && currentUser && (
            <AttendanceModule
              attendanceRecords={attendanceRecords}
              currentRole={effectiveRole}
              currentUser={currentUser}
            />
          )}

          {currentView === 'TIME_OFF' && currentUser && (
            <TimeOffModule
              leaveRequests={leaveRequests}
              currentRole={effectiveRole}
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
          currentRole={effectiveRole}
          onClose={() => setSelectedEmployee(null)}
        />
      )}
    </div>
  );
};

export default App;
