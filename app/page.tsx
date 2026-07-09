import LoginBanner from '../components/auth/LoginBanner'
import LoginForm from '../components/auth/LoginForm'

export default function LoginPage() {
  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-gradient-to-br from-[#0B162C] via-[#1D4ED8] to-[#60A5FA] font-sans select-none overflow-auto lg:overflow-hidden">

      {/* Left: Banner — hidden on xs mobile, compact on sm, full on lg+ */}
      <LoginBanner />

      {/* Right: Form — stacks below banner on mobile, side-by-side on lg+ */}
      <div className="flex-1 flex items-center justify-center px-4 py-8 sm:px-8 sm:py-10 lg:py-0 relative z-10">
        <div className="w-full max-w-sm sm:max-w-md relative z-10">
          <LoginForm />
        </div>
      </div>
    </div>
  )
}
