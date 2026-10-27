import { useState, useEffect } from 'react';
import { SessionProvider, useSession } from './context/SessionContext.tsx';
import { RoleGateway } from './components/RoleGateway.tsx';
import { StudentWorkspace } from './components/StudentWorkspace.tsx';
import { TeacherDashboard } from './components/TeacherDashboard.tsx';

function MainApp() {
  const { session, isLoading, teacherToken } = useSession();
  const [role, setRole] = useState<'gateway' | 'student' | 'teacher'>('gateway');
  const [studentGroupId, setStudentGroupId] = useState<number | null>(null);

  // Check URL query parameters for direct links (e.g. from QR code or shared link)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const groupParam = params.get('group');
    const roleParam = params.get('role');

    if (groupParam) {
      const gNum = parseInt(groupParam, 10);
      if (!isNaN(gNum) && gNum >= 1 && gNum <= 12) {
        setStudentGroupId(gNum);
        setRole('student');
      }
    } else if (roleParam === 'teacher') {
      setRole('teacher');
    }
  }, []);

  if (isLoading || !session) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="font-bold text-slate-700 text-sm">
            Đang kết nối phòng thảo luận số...
          </p>
        </div>
      </div>
    );
  }

  // Teacher Screen
  if (role === 'teacher') {
    // If not authenticated, gateway will handle asking PIN
    if (!teacherToken) {
      return (
        <RoleGateway
          onSelectStudent={(gNum) => {
            setStudentGroupId(gNum);
            setRole('student');
          }}
          onEnterTeacher={() => setRole('teacher')}
        />
      );
    }
    return <TeacherDashboard onLogout={() => setRole('gateway')} />;
  }

  // Student Workspace
  if (role === 'student' && studentGroupId !== null) {
    return (
      <StudentWorkspace
        groupId={studentGroupId}
        onBackToRoles={() => {
          setStudentGroupId(null);
          setRole('gateway');
        }}
      />
    );
  }

  // Default: Welcome Gateway
  return (
    <RoleGateway
      onSelectStudent={(gNum) => {
        setStudentGroupId(gNum);
        setRole('student');
      }}
      onEnterTeacher={() => setRole('teacher')}
    />
  );
}

export default function App() {
  return (
    <SessionProvider>
      <MainApp />
    </SessionProvider>
  );
}
