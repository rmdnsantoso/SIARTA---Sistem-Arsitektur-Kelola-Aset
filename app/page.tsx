import LoginBanner from '../components/auth/LoginBanner'
import LoginForm from '../components/auth/LoginForm'

export default function LoginPage() {
  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-white font-sans text-gray-900 relative overflow-hidden selection:bg-blue-100 selection:text-blue-900">
      
      {/* Banner Area (Left side on desktop) */}
      <LoginBanner />

      {/* Form Area (Right side on desktop) */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 md:p-20 relative z-10">
        
        {/* Subtle background blob for mobile/tablet only */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob lg:hidden pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-indigo-50 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-2000 lg:hidden pointer-events-none"></div>

        <div className="w-full max-w-md relative">
          <LoginForm />
        </div>
      </div>
    </div>
  )
}
