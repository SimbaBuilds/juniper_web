import { ResetPasswordForm } from '@/app/components/auth/reset-password-form'

export default function ResetPasswordPage() {
  return (
    <div>
      <h2 className="text-center text-3xl font-bold text-gray-900 mb-8">
        Reset your password
      </h2>
      <p className="text-center text-gray-600 mb-8">
        Enter your email address and we'll send you a link to reset your password.
      </p>
      <ResetPasswordForm />
    </div>
  )
}