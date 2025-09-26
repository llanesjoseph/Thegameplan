/**
 * Coach Access Gate Component
 * Controls access to coach features based on role and application status
 */

'use client'

import Link from 'next/link'
import { useCreatorDashboardAccess } from '@/hooks/use-creator-status'
import { 
 Clock, 
 UserCheck, 
 UserX, 
 FileText, 
 ArrowRight,
 Loader2,
 CheckCircle,
 XCircle,
 AlertCircle
} from 'lucide-react'

interface CreatorAccessGateProps {
 children: React.ReactNode
 fallbackContent?: React.ReactNode
 showFullPage?: boolean
}

export default function CreatorAccessGate({ 
 children, 
 fallbackContent,
 showFullPage = true 
}: CreatorAccessGateProps) {
 const { accessStatus, accessMessage, canAccess, canApply, loading } = useCreatorDashboardAccess()

 if (loading) {
  return (
   <div className="min-h-screen bg-gray-50 flex items-center justify-center">
    <div className="text-center">
     <Loader2 className="w-8 h-8 animate-spin text-cardinal mx-auto mb-4" />
     <p className="text-gray-600">Checking your creator status...</p>
    </div>
   </div>
  )
 }

 if (canAccess) {
  return <>{children}</>
 }

 if (fallbackContent && !showFullPage) {
  return <>{fallbackContent}</>
 }

 return (
  <div className="min-h-screen bg-gray-50">
   <div className="max-w-4xl mx-auto px-4 py-16">
    <div className="text-center mb-12">
     <div className="mb-6">
      {accessStatus === 'pending' && (
       <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <Clock className="w-8 h-8 text-yellow-600" />
       </div>
      )}
      {accessStatus === 'not-applied' && (
       <div className="w-16 h-16 bg-cardinal/10 rounded-full flex items-center justify-center mx-auto mb-4">
        <UserCheck className="w-8 h-8 text-cardinal" />
       </div>
      )}
      {accessStatus === 'rejected' && (
       <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <UserX className="w-8 h-8 text-red-600" />
       </div>
      )}
     </div>

     <h1 className="text-3xl text-gray-900 mb-4">
      {accessStatus === 'pending' && 'Application Under Review'}
      {accessStatus === 'not-applied' && 'Become a Creator'}
      {accessStatus === 'rejected' && 'Creator Application Status'}
     </h1>

     <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
      {accessMessage}
     </p>
    </div>

    {/* Status-specific content */}
    {accessStatus === 'pending' && (
     <div className="bg-white rounded-xl border border-gray-200 p-8 mb-8">
      <div className="flex items-center gap-4 mb-6">
       <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
        <AlertCircle className="w-6 h-6 text-yellow-600" />
       </div>
       <div>
        <h3 className="text-lg  text-gray-900">Review in Progress</h3>
        <p className="text-gray-600">Our team is reviewing your application</p>
       </div>
      </div>

      <div className="grid md:grid-cols-3 gap-4 text-center">
       <div className="p-4 bg-gray-50 rounded-lg">
        <CheckCircle className="w-6 h-6 text-green-600 mx-auto mb-2" />
        <p className=" text-gray-900">Application Submitted</p>
        <p className="text-sm text-gray-600">Your application is complete</p>
       </div>
       <div className="p-4 bg-yellow-50 rounded-lg border-2 border-yellow-200">
        <Clock className="w-6 h-6 text-yellow-600 mx-auto mb-2" />
        <p className=" text-gray-900">Under Review</p>
        <p className="text-sm text-gray-600">Typically takes 2-3 business days</p>
       </div>
       <div className="p-4 bg-gray-50 rounded-lg">
        <UserCheck className="w-6 h-6 text-gray-400 mx-auto mb-2" />
        <p className=" text-gray-900">Approval</p>
        <p className="text-sm text-gray-600">You'll receive an email notification</p>
       </div>
      </div>
     </div>
    )}

    {accessStatus === 'not-applied' && (
     <div className="bg-white rounded-xl border border-gray-200 p-8 mb-8">
      <div className="text-center mb-8">
       <h3 className="text-xl  text-gray-900 mb-4">Join Our Creator Community</h3>
       <p className="text-gray-600 max-w-2xl mx-auto">
        Share your expertise with athletes around the world. Create content, build your audience, 
        and earn revenue from your knowledge and experience.
       </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6 mb-8">
       <div className="text-center p-6 bg-gradient-to-br from-cardinal/5 to-red-50 rounded-lg">
        <div className="w-12 h-12 bg-cardinal/10 rounded-lg flex items-center justify-center mx-auto mb-4">
         <FileText className="w-6 h-6 text-cardinal" />
        </div>
        <h4 className=" text-gray-900 mb-2">Create Content</h4>
        <p className="text-sm text-gray-600">
         Upload videos, write guides, and create lessons for your sport
        </p>
       </div>
       <div className="text-center p-6 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg">
        <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
         <UserCheck className="w-6 h-6 text-purple-600" />
        </div>
        <h4 className=" text-gray-900 mb-2">Build Audience</h4>
        <p className="text-sm text-gray-600">
         Connect with athletes and coaches who want to learn from you
        </p>
       </div>
       <div className="text-center p-6 bg-gradient-to-br from-green-50 to-emerald-100 rounded-lg">
        <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
         <CheckCircle className="w-6 h-6 text-green-600" />
        </div>
        <h4 className=" text-gray-900 mb-2">Earn Revenue</h4>
        <p className="text-sm text-gray-600">
         Monetize your expertise through premium content and coaching
        </p>
       </div>
      </div>
     </div>
    )}

    {accessStatus === 'rejected' && (
     <div className="bg-white rounded-xl border border-gray-200 p-8 mb-8">
      <div className="flex items-center gap-4 mb-6">
       <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
        <XCircle className="w-6 h-6 text-red-600" />
       </div>
       <div>
        <h3 className="text-lg  text-gray-900">Application Not Approved</h3>
        <p className="text-gray-600">We're unable to approve your creator application at this time</p>
       </div>
      </div>

      <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
       <p className="text-red-800  mb-2">Next Steps:</p>
       <ul className="text-red-700 text-sm space-y-1">
        <li>• Review our creator guidelines and requirements</li>
        <li>• Consider gaining more experience in your field</li>
        <li>• You may reapply after 30 days</li>
       </ul>
      </div>
     </div>
    )}

    {/* Action buttons */}
    <div className="text-center">
     {canApply && (
      <Link
       href="/contributors/apply"
       className="inline-flex items-center gap-2 px-6 py-3 bg-cardinal text-white rounded-lg  hover:bg-cardinal-dark transition-colors"
      >
       Apply to Become a Creator
       <ArrowRight className="w-4 h-4" />
      </Link>
     )}

     {accessStatus === 'rejected' && (
      <div className="flex gap-4 justify-center">
       <Link
        href="/support"
        className="inline-flex items-center gap-2 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg  hover:bg-gray-50 transition-colors"
       >
        Contact Support
       </Link>
       <Link
        href="/creators/guidelines"
        className="inline-flex items-center gap-2 px-6 py-3 bg-cardinal text-white rounded-lg  hover:bg-cardinal-dark transition-colors"
       >
        View Guidelines
        <ArrowRight className="w-4 h-4" />
       </Link>
      </div>
     )}

     <div className="mt-6">
      <Link
       href="/dashboard"
       className="text-cardinal hover:text-cardinal-dark transition-colors"
      >
       ← Back to Dashboard
      </Link>
     </div>
    </div>
   </div>
  </div>
 )
}
