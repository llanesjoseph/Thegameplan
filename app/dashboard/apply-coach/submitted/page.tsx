'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/use-auth'
import AppHeader from '@/components/ui/AppHeader'
import {
  CheckCircle,
  Clock,
  Mail,
  ArrowRight,
  Home,
  FileText,
  UserCheck,
  Bell
} from 'lucide-react'

export default function ApplicationSubmittedPage() {
  const { user } = useAuth()
  const router = useRouter()

  useEffect(() => {
    // Send confirmation email
    const sendConfirmationEmail = async () => {
      if (!user?.email) return

      try {
        await fetch('/api/coach-application/confirm', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: user.email,
            name: user.displayName || 'Coach'
          })
        })
      } catch (error) {
        console.error('Failed to send confirmation email:', error)
      }
    }

    sendConfirmationEmail()
  }, [user])

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader />

      <div className="max-w-4xl mx-auto px-4 py-16">
        {/* Success Icon */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-12 h-12 text-green-600" />
          </div>

          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Application Submitted Successfully!
          </h1>

          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Thank you for applying to become a coach on PLAYBOOKD. We're excited to review your application!
          </p>
        </div>

        {/* Timeline */}
        <div className="bg-white rounded-xl border border-gray-200 p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            What Happens Next?
          </h2>

          <div className="space-y-6">
            {/* Step 1 */}
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                <Mail className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">
                  Confirmation Email Sent
                </h3>
                <p className="text-gray-600">
                  We've sent a confirmation email to <span className="font-medium">{user?.email}</span>.
                  Check your inbox for details about your application.
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center flex-shrink-0">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">
                  Review in Progress (2-3 Business Days)
                </h3>
                <p className="text-gray-600">
                  Our admin team will carefully review your application, credentials, and experience.
                  This typically takes 2-3 business days.
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                <Bell className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">
                  Approval Notification
                </h3>
                <p className="text-gray-600">
                  Once approved, you'll receive an email with access to your coach dashboard and
                  instructions on how to get started creating content.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Next Steps Card */}
        <div className="bg-gradient-to-br from-cardinal/5 to-red-50 rounded-xl border border-cardinal/20 p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            While You Wait...
          </h2>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg p-6">
              <FileText className="w-8 h-8 text-cardinal mb-3" />
              <h3 className="font-semibold text-gray-900 mb-2">
                Prepare Your Content
              </h3>
              <p className="text-gray-600 text-sm">
                Start planning your first lessons, drills, and training materials.
                Think about what makes your coaching unique.
              </p>
            </div>

            <div className="bg-white rounded-lg p-6">
              <UserCheck className="w-8 h-8 text-cardinal mb-3" />
              <h3 className="font-semibold text-gray-900 mb-2">
                Build Your Profile
              </h3>
              <p className="text-gray-600 text-sm">
                Once approved, you'll be able to upload professional photos,
                add your credentials, and customize your coach profile.
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/dashboard/progress"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-cardinal text-white rounded-lg font-semibold hover:bg-cardinal-dark transition-colors"
          >
            <Home className="w-5 h-5" />
            Go to Dashboard
          </Link>

          <Link
            href="/contributors"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
          >
            Browse Coaches
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>

        {/* Support Section */}
        <div className="mt-12 text-center">
          <p className="text-gray-600 mb-2">
            Have questions about your application?
          </p>
          <Link
            href="/support"
            className="text-cardinal hover:text-cardinal-dark font-semibold transition-colors"
          >
            Contact Support →
          </Link>
        </div>
      </div>
    </div>
  )
}
