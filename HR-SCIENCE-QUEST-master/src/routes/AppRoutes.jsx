import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import LandingPage from "../pages/public/LandingPage";
import StudentRegister from "../pages/auth/StudentRegister";
import StudentLogin from "../pages/auth/StudentLogin";
import AdminLogin from "../pages/auth/AdminLogin";
import AdminDashboard from "../pages/admin/AdminDashboard";
import Subjects from "../pages/admin/Subjects";
import Questions from "../pages/admin/Question";
import TestQuestions from "../pages/admin/TestQuestions";
import Tests from "../pages/admin/Tests";
import TestPreview from "../pages/admin/TestPreview";
import StudentDashboard from "../pages/student/StudentDashboard";
import StudentCourses from "../pages/student/StudentCourses";
import StudentCourseDetail from "../pages/student/StudentCourseDetail";
import StudentSubjects from "../pages/student/StudentSubjects";
import StudentTests from "../pages/student/StudentTests";
import StudentResults from "../pages/student/StudentResults";
import StudentProgress from "../pages/student/StudentProgress";
import StudentProfile from "../pages/student/StudentProfile";
import { useEffect } from "react";
import { renewToken } from "../services/api";
import AdminProtectedRoute from "../components/admin/AdminProtectedRoute";
import StudentTestAttempt from "../pages/student/TestAttempt";
import TestResult from "../pages/student/TestResult";
import StudentProtectedRoute from "../components/student/Studentprotected";
import TeacherMyCourses from "../pages/admin/MyCourses";
import TeacherCreateCourse from "../pages/admin/CreateCourse";
import TeacherEditCourse from "../pages/admin/EditCourse";
import UsersReports from "../pages/admin/UsersReports";
import StudentVideoPlayer from "../pages/student/StudentVideoPlayer";
import StudentMyCourses from "../pages/student/StudentMyCourses";
import AdminProfile from "../pages/admin/AdminProfile";
import TeacherSubjects from "../pages/admin/TeacherSubjects";
import { persistLastVisitedPath } from "../services/session";
// import TeacherCoursePreview from "../pages/admin/CoursePreview";
import AboutPage from "../pages/public/AboutPage";
import ContactPage from "../pages/public/ContactPage";
import PrivacyPolicyPage from "../pages/public/PrivacyPolicyPage";
import TermsPage from "../pages/public/TermsPage";
import RefundPolicyPage from "../pages/public/RefundPolicyPage";

 function RouteMemorySync() {
  const location = useLocation();

  useEffect(() => {
    persistLastVisitedPath(location.pathname);
  }, [location.pathname]);

  return null;
}

export default function AppRoutes() {
  useEffect(() => {
    // Attempt a token refresh on app start to keep sessions stable across reloads.
    renewToken();
    const interval = setInterval(async () => {
      const success = await renewToken();
      if (!success) {
        console.log("Token renew failed");
      }
    }, 25 * 60 * 1000); // every 25 minutes

    return () => clearInterval(interval);
  }, []);

  return (
    <BrowserRouter>
      <RouteMemorySync />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/registration/student" element={<StudentRegister />} />
        <Route path="/login/student" element={<StudentLogin />} />
        <Route path="/login/admin" element={<AdminLogin />} />
        <Route path="/about" element={<AboutPage />} />
         <Route path="/contact" element={<ContactPage />} />
         <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
         <Route path="/terms" element={<TermsPage />} />
         <Route path="/refund-policy" element={<RefundPolicyPage />} />
        <Route
  path="/admin/dashboard"
  element={
    <AdminProtectedRoute>
      <AdminDashboard />
    </AdminProtectedRoute>
  }
/>

<Route
  path="/admin/subjects"
  element={
    <AdminProtectedRoute>
      <Subjects />
    </AdminProtectedRoute>
  }
/>

<Route
  path="/admin/questions"
  element={
    <AdminProtectedRoute>
      <Questions />
    </AdminProtectedRoute>
  }
/>

	<Route
	  path="/admin/tests"
	  element={
	    <AdminProtectedRoute>
	      <Tests />
	    </AdminProtectedRoute>
	  }
	/>

        <Route
          path="/admin/users-reports"
          element={
            <AdminProtectedRoute>
              <UsersReports />
            </AdminProtectedRoute>
          }
        />
        <Route
          path="/admin/profile"
          element={
            <AdminProtectedRoute>
              <AdminProfile />
            </AdminProtectedRoute>
          }
        />
        <Route
          path="/admin/my-subjects"
          element={
            <AdminProtectedRoute>
              <TeacherSubjects />
            </AdminProtectedRoute>
          }
        />

<Route
  path="/admin/tests/:testId"
  element={
    <AdminProtectedRoute>
      <TestQuestions />
    </AdminProtectedRoute>
  }
/>

<Route
  path="/admin/tests/:testId/preview"
  element={
    <AdminProtectedRoute>
      <TestPreview />
    </AdminProtectedRoute>
  }
/>

{/* Teacher Course Management Routes - Protected under Admin */}
        <Route
          path="/admin/courses"
          element={
            <AdminProtectedRoute>
              <TeacherMyCourses />
            </AdminProtectedRoute>
          }
        />

        <Route
          path="/admin/course/create"
          element={
            <AdminProtectedRoute>
              <TeacherCreateCourse />
            </AdminProtectedRoute>
          }
        />

        <Route
          path="/admin/course/:courseId/edit"
          element={
            <AdminProtectedRoute>
              <TeacherEditCourse />
            </AdminProtectedRoute>
          }
        />


        <Route path="/student/dashboard" element={
          <StudentProtectedRoute>
            <StudentDashboard />
          </StudentProtectedRoute>
        } />
        <Route path="/student/courses" element={
          <StudentProtectedRoute>
            <StudentCourses />
          </StudentProtectedRoute>
        } />
        <Route path="/student/my-courses" element={
          <StudentProtectedRoute>
            <StudentMyCourses />
          </StudentProtectedRoute>
        } />
        <Route path="/student/courses/:courseId" element={
          <StudentProtectedRoute>
            <StudentCourseDetail />
          </StudentProtectedRoute>
        } />
        <Route path="/student/courses/:courseId/watch" element={
          <StudentProtectedRoute>
            <StudentVideoPlayer />
          </StudentProtectedRoute>
        } />
        <Route path="/student/subjects" element={
          <StudentProtectedRoute>
            <StudentSubjects />
          </StudentProtectedRoute>
        } />
        <Route path="/student/tests" element={
          <StudentProtectedRoute>
            <StudentTests />
          </StudentProtectedRoute>
        } />
        <Route path="/student/results" element={
          <StudentProtectedRoute>
            <StudentResults />
          </StudentProtectedRoute>
        } />
        <Route path="/student/progress" element={
          <StudentProtectedRoute>
            <StudentProgress />
          </StudentProtectedRoute>
        } />
        <Route path="/student/profile" element={
          <StudentProtectedRoute>
            <StudentProfile />
          </StudentProtectedRoute>
        } />
        <Route
          path="/student/tests/attempt/:attemptId"
          element={
            <StudentProtectedRoute>
              <StudentTestAttempt />
            </StudentProtectedRoute>
          }
        />
        <Route path="/student/test/result" element={
          <StudentProtectedRoute>
            <TestResult />
          </StudentProtectedRoute>
        } />



      </Routes>
    </BrowserRouter>
  );
}
