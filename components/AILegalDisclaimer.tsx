'use client'

import React, { useState } from 'react'
import { AlertTriangle, Shield, FileText, Check, X } from 'lucide-react'

interface AILegalDisclaimerProps {
 onAccept: () => void
 onDecline: () => void
 userEmail?: string
 showFullDisclaimer?: boolean
}

export default function AILegalDisclaimer({ 
 onAccept, 
 onDecline, 
 userEmail,
 showFullDisclaimer = true 
}: AILegalDisclaimerProps) {
 const [hasReadTerms, setHasReadTerms] = useState(false)
 const [hasReadPrivacy, setHasReadPrivacy] = useState(false)
 const [understandsRisks, setUnderstandsRisks] = useState(false)

 const canAccept = hasReadTerms && hasReadPrivacy && understandsRisks

 if (!showFullDisclaimer) {
  return (
   <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
    <div className="flex items-start space-x-3">
     <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
     <div className="text-sm text-amber-800">
      <p className=" mb-1">AI Coaching Disclaimer</p>
      <p>This AI coaching advice is for educational purposes only and should not replace professional medical advice or certified coaching guidance.</p>
     </div>
    </div>
   </div>
  )
 }

 return (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
   <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
    <div className="p-6">
     {/* Header */}
     <div className="flex items-center space-x-3 mb-6">
      <Shield className="h-8 w-8 text-blue-600" />
      <div>
       <h2 className="text-2xl text-gray-900">AI Coaching Terms & Disclaimers</h2>
       <p className="text-gray-600">Please read and acknowledge these important legal notices</p>
      </div>
     </div>

     {/* Main Disclaimer */}
     <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
      <div className="flex items-start space-x-3">
       <AlertTriangle className="h-6 w-6 text-red-600 mt-1 flex-shrink-0" />
       <div>
        <h3 className="text-lg  text-red-900 mb-2">Important Medical & Safety Disclaimer</h3>
        <div className="text-sm text-red-800 space-y-2">
         <p>{This AI coaching service is for educational and informational purposes only.}</p>
         <ul className="list-disc list-inside space-y-1 ml-4">
          <li>This service does not provide medical advice, diagnosis, or treatment</li>
          <li>Always consult qualified healthcare providers for medical concerns</li>
          <li>Stop any activity immediately if you experience pain or injury</li>
          <li>Athletic activities carry inherent risks of injury</li>
          <li>This AI cannot assess your individual physical condition or limitations</li>
         </ul>
        </div>
       </div>
      </div>
     </div>

     {/* Liability Section */}
     <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
      <h3 className="text-lg  text-gray-900 mb-3">Liability & Risk Acknowledgment</h3>
      <div className="text-sm text-gray-700 space-y-2">
       <p>By using this AI coaching service, you acknowledge and agree that:</p>
       <ul className="list-disc list-inside space-y-1 ml-4">
        <li>You assume all risks associated with following AI-generated coaching advice</li>
        <li>You will use your own judgment and consult professionals when appropriate</li>
        <li>The service provider is not liable for any injuries, damages, or losses</li>
        <li>This AI system may make errors or provide inappropriate advice</li>
        <li>You are responsible for your own safety and well-being</li>
       </ul>
      </div>
     </div>

     {/* Data Collection Notice */}
     <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
      <h3 className="text-lg  text-blue-900 mb-3">Data Collection & Privacy</h3>
      <div className="text-sm text-blue-800 space-y-2">
       <p>For legal and safety purposes, we collect and store:</p>
       <ul className="list-disc list-inside space-y-1 ml-4">
        <li>Your questions and AI responses (with privacy hashing)</li>
        <li>Timestamps and session information</li>
        <li>Safety flags and risk assessments</li>
        <li>Your consent and acceptance of these terms</li>
       </ul>
       <p className="mt-2">{Your data is used solely for safety, legal compliance, and service improvement.}</p>
      </div>
     </div>

     {/* Age & Capacity */}
     <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
      <h3 className="text-lg  text-yellow-900 mb-3">Age & Legal Capacity</h3>
      <div className="text-sm text-yellow-800 space-y-2">
       <p>By continuing, you confirm that you are:</p>
       <ul className="list-disc list-inside space-y-1 ml-4">
        <li>18 years of age or older, OR have parental/guardian consent</li>
        <li>Legally capable of entering into this agreement</li>
        <li>Using this service in accordance with all applicable laws</li>
       </ul>
      </div>
     </div>

     {/* Checkboxes */}
     <div className="space-y-4 mb-6">
      <label className="flex items-start space-x-3 cursor-pointer">
       <input
        type="checkbox"
        checked={hasReadTerms}
        onChange={(e) => setHasReadTerms(e.target.checked)}
        className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
       />
       <span className="text-sm text-gray-700">
        I have read and understand the {Terms of Service} and acknowledge all disclaimers above
       </span>
      </label>

      <label className="flex items-start space-x-3 cursor-pointer">
       <input
        type="checkbox"
        checked={hasReadPrivacy}
        onChange={(e) => setHasReadPrivacy(e.target.checked)}
        className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
       />
       <span className="text-sm text-gray-700">
        I have read and agree to the {Privacy Policy} and data collection practices
       </span>
      </label>

      <label className="flex items-start space-x-3 cursor-pointer">
       <input
        type="checkbox"
        checked={understandsRisks}
        onChange={(e) => setUnderstandsRisks(e.target.checked)}
        className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
       />
       <span className="text-sm text-gray-700">
        I understand the {risks and limitations} of AI coaching advice and assume full responsibility
       </span>
      </label>
     </div>

     {/* User Info */}
     {userEmail && (
      <div className="bg-gray-50 rounded-lg p-3 mb-6">
       <div className="flex items-center space-x-2">
        <FileText className="h-4 w-4 text-gray-600" />
        <span className="text-sm text-gray-700">
         Agreement will be recorded for: {{userEmail}}
        </span>
       </div>
      </div>
     )}

     {/* Action Buttons */}
     <div className="flex space-x-4">
      <button
       onClick={onDecline}
       className="flex-1 flex items-center justify-center space-x-2 px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
      >
       <X className="h-4 w-4" />
       <span>Decline</span>
      </button>
      <button
       onClick={onAccept}
       disabled={!canAccept}
       className={`flex-1 flex items-center justify-center space-x-2 px-6 py-3 rounded-lg transition-colors ${
        canAccept
         ? 'bg-blue-600 hover:bg-blue-700 text-white'
         : 'bg-gray-300 text-gray-500 cursor-not-allowed'
       }`}
      >
       <Check className="h-4 w-4" />
       <span>Accept & Continue</span>
      </button>
     </div>

     {/* Fine Print */}
     <div className="mt-6 pt-4 border-t border-gray-200">
      <p className="text-xs text-gray-500 text-center">
       Terms version 1.0 • Last updated: {new Date().toLocaleDateString()} • 
       This agreement is governed by applicable laws and regulations
      </p>
     </div>
    </div>
   </div>
  </div>
 )
}