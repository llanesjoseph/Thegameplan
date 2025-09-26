import { Metadata } from 'next'

export const metadata: Metadata = {
 title: 'Privacy Policy | GamePlan',
 description: 'Privacy Policy for GamePlan AI coaching platform'
}

export default function PrivacyPolicy() {
 return (
  <div className="min-h-screen bg-gray-50 py-12">
   <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
    <div className="bg-white shadow-lg rounded-lg p-8 lg:p-12">
     <h1 className="text-3xl text-gray-900 mb-8">Privacy Policy</h1>

     <div className="prose prose-lg max-w-none">
      <p className="text-gray-600 mb-8">
       <strong>Last Updated:</strong> {new Date().toLocaleDateString()}
      </p>

      <section className="mb-8">
       <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Information We Collect</h2>

       <h3 className="text-lg font-medium text-gray-900 mb-3">Account Information</h3>
       <ul className="list-disc list-inside text-gray-700 space-y-2 mb-4">
        <li>Name, email address, and profile information</li>
        <li>Account preferences and settings</li>
        <li>Subscription and payment information</li>
       </ul>

       <h3 className="text-lg font-medium text-gray-900 mb-3">AI Interaction Data</h3>
       <ul className="list-disc list-inside text-gray-700 space-y-2 mb-4">
        <li>Questions you ask the AI coaching system</li>
        <li>AI responses and coaching advice provided</li>
        <li>Session timestamps and interaction frequency</li>
        <li>Feedback and ratings on AI responses</li>
       </ul>

       <h3 className="text-lg font-medium text-gray-900 mb-3">Usage Analytics</h3>
       <ul className="list-disc list-inside text-gray-700 space-y-2">
        <li>Device and browser information</li>
        <li>IP address and location data</li>
        <li>Pages visited and features used</li>
        <li>Performance and error logs</li>
       </ul>
      </section>

      <section className="mb-8">
       <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. How We Use Your Information</h2>
       <ul className="list-disc list-inside text-gray-700 space-y-2">
        <li><strong>Provide AI Coaching:</strong> Generate personalized coaching responses</li>
        <li><strong>Improve Services:</strong> Enhance AI models and platform features</li>
        <li><strong>Safety & Security:</strong> Monitor for harmful content and system abuse</li>
        <li><strong>Communication:</strong> Send important updates and support messages</li>
        <li><strong>Analytics:</strong> Understand usage patterns to improve user experience</li>
        <li><strong>Legal Compliance:</strong> Meet regulatory and legal requirements</li>
       </ul>
      </section>

      <section className="mb-8">
       <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. AI Data Processing</h2>
       <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-4">
        <div className="flex">
         <div className="ml-3">
          <p className="text-sm text-blue-700">
           <strong>AI Training:</strong> Your interactions help improve our AI coaching models.
           All data used for training is anonymized and aggregated.
          </p>
         </div>
        </div>
       </div>
       <ul className="list-disc list-inside text-gray-700 space-y-2">
        <li>AI responses are generated using third-party AI services (OpenAI, Google)</li>
        <li>Your questions may be processed by these services according to their policies</li>
        <li>We implement safety filters to prevent harmful or inappropriate content</li>
        <li>AI interaction logs are retained for service improvement</li>
       </ul>
      </section>

      <section className="mb-8">
       <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Information Sharing</h2>
       <p className="text-gray-700 mb-4">We do not sell your personal information. We may share data:</p>
       <ul className="list-disc list-inside text-gray-700 space-y-2">
        <li><strong>Service Providers:</strong> Third-party services that help operate our platform</li>
        <li><strong>AI Partners:</strong> OpenAI, Google, and other AI service providers</li>
        <li><strong>Legal Requirements:</strong> When required by law or to protect rights and safety</li>
        <li><strong>Business Transfers:</strong> In case of merger, acquisition, or sale</li>
        <li><strong>Aggregated Data:</strong> Anonymized, non-identifiable statistics for research</li>
       </ul>
      </section>

      <section className="mb-8">
       <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Data Security</h2>
       <p className="text-gray-700 mb-4">We implement industry-standard security measures:</p>
       <ul className="list-disc list-inside text-gray-700 space-y-2">
        <li>Encryption of data in transit and at rest</li>
        <li>Secure authentication and access controls</li>
        <li>Regular security audits and monitoring</li>
        <li>Limited access to personal data on a need-to-know basis</li>
        <li>Incident response procedures for data breaches</li>
       </ul>
      </section>

      <section className="mb-8">
       <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Your Rights and Choices</h2>
       <p className="text-gray-700 mb-4">You have the right to:</p>
       <ul className="list-disc list-inside text-gray-700 space-y-2">
        <li><strong>Access:</strong> Request copies of your personal data</li>
        <li><strong>Correction:</strong> Update or correct inaccurate information</li>
        <li><strong>Deletion:</strong> Request deletion of your personal data</li>
        <li><strong>Portability:</strong> Export your data in a machine-readable format</li>
        <li><strong>Opt-out:</strong> Unsubscribe from marketing communications</li>
        <li><strong>Restrict Processing:</strong> Limit how we use your data</li>
       </ul>
      </section>

      <section className="mb-8">
       <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Data Retention</h2>
       <ul className="list-disc list-inside text-gray-700 space-y-2">
        <li><strong>Account Data:</strong> Retained while your account is active</li>
        <li><strong>AI Interactions:</strong> Stored for up to 2 years for service improvement</li>
        <li><strong>Analytics Data:</strong> Aggregated data retained indefinitely</li>
        <li><strong>Support Records:</strong> Kept for 3 years for quality assurance</li>
        <li><strong>Legal Requirements:</strong> Some data may be retained longer if required by law</li>
       </ul>
      </section>

      <section className="mb-8">
       <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Cookies and Tracking</h2>
       <p className="text-gray-700 mb-4">We use cookies and similar technologies for:</p>
       <ul className="list-disc list-inside text-gray-700 space-y-2">
        <li>Authentication and session management</li>
        <li>Preferences and personalization</li>
        <li>Analytics and performance monitoring</li>
        <li>Security and fraud prevention</li>
       </ul>
       <p className="text-gray-700 mt-4">
        You can control cookie preferences through your browser settings.
       </p>
      </section>

      <section className="mb-8">
       <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. Children's Privacy</h2>
       <p className="text-gray-700 mb-4">
        Our Service is not intended for children under 13. We do not knowingly collect
        personal information from children under 13. If we become aware of such collection,
        we will delete the information immediately.
       </p>
      </section>

      <section className="mb-8">
       <h2 className="text-2xl font-semibent text-gray-900 mb-4">10. International Data Transfers</h2>
       <p className="text-gray-700 mb-4">
        Your data may be processed in countries other than your own. We ensure adequate
        protection through standard contractual clauses and other legal mechanisms.
       </p>
      </section>

      <section className="mb-8">
       <h2 className="text-2xl font-semibold text-gray-900 mb-4">11. Changes to This Policy</h2>
       <p className="text-gray-700 mb-4">
        We may update this Privacy Policy from time to time. We will notify you of
        material changes through the Service or by email.
       </p>
      </section>

      <section className="mb-8">
       <h2 className="text-2xl font-semibold text-gray-900 mb-4">12. Contact Us</h2>
       <p className="text-gray-700 mb-4">
        For questions about this Privacy Policy or to exercise your rights:
       </p>
       <div className="bg-gray-50 p-4 rounded-lg">
        <p className="text-gray-700">
         <strong>Email:</strong> privacy@gameplan.dev<br />
         <strong>Data Protection Officer:</strong> dpo@gameplan.dev<br />
         <strong>Address:</strong> [Your Business Address]
        </p>
       </div>
      </section>

      <div className="mt-12 pt-8 border-t border-gray-200">
       <p className="text-sm text-gray-500">
        This Privacy Policy is effective as of {new Date().toLocaleDateString()} and replaces any prior versions.
       </p>
      </div>
     </div>
    </div>
   </div>
  </div>
 )
}