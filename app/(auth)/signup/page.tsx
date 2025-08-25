import { SignupForm } from '@/app/components/auth/signup-form'

export default function SignupPage() {
  return (
    <div>
      <h2 className="text-center text-3xl font-bold text-foreground mb-8">
        Create your account
      </h2>
      <SignupForm />
      
      {/* Legal Links */}
      <div className="mt-8 text-center text-sm text-muted-foreground">
        <p>
          By creating an account, you agree to our{' '}
          <a 
            href="https://www.juniperassistant.com/terms-of-use" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            Terms of Use
          </a>
          {' '}and{' '}
          <a 
            href="https://www.juniperassistant.com/privacy-policy" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            Privacy Policy
          </a>
        </p>
      </div>
    </div>
  )
}