import LoginBanner from '../components/auth/LoginBanner'
import LoginForm from '../components/auth/LoginForm'

export default function LoginPage() {
  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-white">
      <LoginBanner />
      <LoginForm />
    </div>
  )
}
