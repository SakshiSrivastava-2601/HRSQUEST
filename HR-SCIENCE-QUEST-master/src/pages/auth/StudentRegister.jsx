import StudentRegisterForm from "./StudentRegisterForm";


export default function StudentRegister() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-100 to-white px-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl p-8">
        <StudentRegisterForm />
      </div>
    </div>
  );
}
