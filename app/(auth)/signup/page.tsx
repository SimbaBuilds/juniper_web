import { SignupForm } from '@/app/components/auth/signup-form'

export default function SignupPage() {
  return (
    <div>
      <h2 className="text-center text-3xl font-bold text-gray-900 mb-8">
        Create your account
      </h2>
      <SignupForm />
    </div>
  )
}