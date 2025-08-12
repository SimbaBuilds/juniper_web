import { UpdatePasswordForm } from '@/app/components/auth/update-password-form'

export default function UpdatePasswordPage() {
  return (
    <div>
      <h2 className="text-center text-3xl font-bold text-gray-900 mb-8">
        Update your password
      </h2>
      <p className="text-center text-gray-600 mb-8">
        Enter your new password below.
      </p>
      <UpdatePasswordForm />
    </div>
  )
}