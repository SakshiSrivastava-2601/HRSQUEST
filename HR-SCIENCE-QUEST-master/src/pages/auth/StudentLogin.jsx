import StudentLoginForm from "./StudentLoginForm";
import { useNavigate } from "react-router-dom";

export default function StudentLogin() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-100 to-white px-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl p-8">
        <StudentLoginForm
          onSuccess={() => navigate("/student/dashboard")}
          switchToRegister={() => navigate("/registration/student")}
        />
      </div>
    </div>
  );
}
