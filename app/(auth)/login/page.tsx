import { LoginForm } from "@/components/auth/login-form";

export default function LoginPage() {
  return (
    <div className="w-full max-w-md mx-4">
      <div className="bg-white rounded-2xl shadow-xl p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">OneBooking</h1>
          <p className="text-gray-600 mt-2">Central Dashboard</p>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}
