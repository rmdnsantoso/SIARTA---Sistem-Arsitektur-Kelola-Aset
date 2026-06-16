import LoginBanner from '../components/auth/LoginBanner'
import LoginForm from '../components/auth/LoginForm'

export default function LoginPage() {
  return (
    <div className="min-h-screen flex bg-white font-sans text-gray-900">
      <LoginBanner />
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12">
        <LoginForm />
      </div>
    </div>
  )
}
