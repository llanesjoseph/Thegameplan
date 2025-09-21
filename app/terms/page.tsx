import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Terms of Service | GamePlan',
  description: 'Terms of Service for GamePlan AI coaching platform'
}

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow-lg rounded-lg p-8 lg:p-12">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Terms of Service</h1>

          <div className="prose prose-lg max-w-none">
            <p className="text-gray-600 mb-8">
              <strong>Last Updated:</strong> {new Date().toLocaleDateString()}
            </p>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Acceptance of Terms</h2>
              <p className="text-gray-700 mb-4">
                By accessing or using GamePlan ("the Service"), you agree to be bound by these Terms of Service ("Terms").
                If you do not agree to these Terms, please do not use the Service.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Description of Service</h2>
              <p className="text-gray-700 mb-4">
                GamePlan is an AI-powered sports coaching platform that provides training advice, mental performance guidance,
                and strategic insights for athletes. The Service includes AI-generated coaching content, training materials,
                and educational resources.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. AI-Generated Content Disclaimer</h2>
              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
                <div className="flex">
                  <div className="ml-3">
                    <p className="text-sm text-yellow-700">
                      <strong>Important:</strong> Our AI coaching advice is for informational and educational purposes only.
                      It should not replace professional coaching, medical advice, or personal training guidance.
                    </p>
                  </div>
                </div>
              </div>
              <ul className="list-disc list-inside text-gray-700 space-y-2">
                <li>AI responses are generated based on training data and algorithms</li>
                <li>Content may not always be accurate, complete, or suitable for your specific situation</li>
                <li>Always consult with qualified professionals for personalized guidance</li>
                <li>We do not guarantee the effectiveness of any AI-generated advice</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Medical and Safety Disclaimer</h2>
              <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4">
                <div className="flex">
                  <div className="ml-3">
                    <p className="text-sm text-red-700">
                      <strong>Medical Disclaimer:</strong> GamePlan does not provide medical advice, diagnosis, or treatment.
                      For any injuries, health concerns, or medical conditions, consult with qualified healthcare professionals.
                    </p>
                  </div>
                </div>
              </div>
              <ul className="list-disc list-inside text-gray-700 space-y-2">
                <li>Do not use the Service for medical emergencies</li>
                <li>Always seek medical clearance before returning to sport after injury</li>
                <li>Stop using advice that causes pain or discomfort</li>
                <li>The Service is not a substitute for professional medical care</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. User Responsibilities</h2>
              <p className="text-gray-700 mb-4">You agree to:</p>
              <ul className="list-disc list-inside text-gray-700 space-y-2">
                <li>Use the Service only for lawful purposes</li>
                <li>Provide accurate information when creating an account</li>
                <li>Keep your account credentials secure</li>
                <li>Not attempt to reverse engineer or manipulate the AI system</li>
                <li>Not share inappropriate, harmful, or offensive content</li>
                <li>Respect the intellectual property rights of the Service</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Privacy and Data</h2>
              <p className="text-gray-700 mb-4">
                Your privacy is important to us. Our data practices are governed by our Privacy Policy,
                which is incorporated into these Terms by reference.
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2">
                <li>We collect and process data as described in our Privacy Policy</li>
                <li>AI interactions may be logged for service improvement</li>
                <li>You retain ownership of content you submit</li>
                <li>We may use aggregated, anonymized data for research and improvement</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Subscription and Payment</h2>
              <p className="text-gray-700 mb-4">
                If you subscribe to premium features:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2">
                <li>Subscription fees are charged in advance</li>
                <li>Cancellation policies are outlined in your account settings</li>
                <li>Refunds are provided according to our refund policy</li>
                <li>Prices may change with advance notice</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Limitation of Liability</h2>
              <p className="text-gray-700 mb-4">
                To the maximum extent permitted by law:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2">
                <li>GamePlan is provided "as is" without warranties</li>
                <li>We are not liable for any indirect, incidental, or consequential damages</li>
                <li>Our total liability is limited to the amount you paid for the Service</li>
                <li>We do not guarantee uninterrupted or error-free service</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. Intellectual Property</h2>
              <p className="text-gray-700 mb-4">
                The Service and its content are protected by intellectual property laws:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2">
                <li>GamePlan owns all rights to the platform and AI models</li>
                <li>You may not copy, modify, or distribute our content without permission</li>
                <li>Creator content is owned by respective contributors</li>
                <li>You grant us rights to use your feedback for service improvement</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">10. Termination</h2>
              <p className="text-gray-700 mb-4">
                We may suspend or terminate your access to the Service:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2">
                <li>For violation of these Terms</li>
                <li>For suspected fraudulent or harmful activity</li>
                <li>If required by law or regulation</li>
                <li>You may terminate your account at any time</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">11. Changes to Terms</h2>
              <p className="text-gray-700 mb-4">
                We may update these Terms from time to time. We will notify you of significant changes
                through the Service or by email. Continued use after changes constitutes acceptance of the new Terms.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">12. Contact Information</h2>
              <p className="text-gray-700 mb-4">
                If you have questions about these Terms, please contact us at:
              </p>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-gray-700">
                  <strong>Email:</strong> legal@gameplan.dev<br />
                  <strong>Address:</strong> [Your Business Address]<br />
                  <strong>Phone:</strong> [Your Contact Number]
                </p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">13. Governing Law</h2>
              <p className="text-gray-700 mb-4">
                These Terms are governed by the laws of [Your Jurisdiction] without regard to conflict of law principles.
                Any disputes will be resolved in the courts of [Your Jurisdiction].
              </p>
            </section>

            <div className="mt-12 pt-8 border-t border-gray-200">
              <p className="text-sm text-gray-500">
                These Terms of Service are effective as of {new Date().toLocaleDateString()} and replace any prior versions.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}