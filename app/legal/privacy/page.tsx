import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import Logo from '@/components/Logo'

export const metadata = {
  title: 'Privacy Policy',
  description: 'AfroConnect Privacy Policy - How we collect, use, and protect your data'
}

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <Logo href="/" size="sm" showText={true} />
            <Link
              href="/"
              className="flex items-center space-x-2 text-gray-600 hover:text-primary-600 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="text-sm font-medium">Back to Home</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-xl shadow-sm p-8 md:p-12">
          <h1 className="text-4xl font-display font-bold text-navy-900 mb-4">
            Privacy Policy
          </h1>
          <p className="text-gray-600 mb-8">
            Last Updated: August 7, 2026
          </p>

          <div className="prose prose-lg max-w-none">
            {/* Introduction */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-navy-900 mb-4">1. Introduction</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                Welcome to AfroConnect ("we," "our," or "us"). We are committed to protecting your privacy and ensuring the security of your personal information. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our platform.
              </p>
              <p className="text-gray-700 leading-relaxed">
                By accessing or using AfroConnect, you agree to this Privacy Policy. If you do not agree with the terms of this policy, please do not access the platform.
              </p>
            </section>

            {/* Information We Collect */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-navy-900 mb-4">2. Information We Collect</h2>

              <h3 className="text-xl font-semibold text-navy-800 mb-3">2.1 Information You Provide</h3>
              <ul className="list-disc pl-6 mb-4 text-gray-700 space-y-2">
                <li><strong>Account Information:</strong> Name, email address, password, user type (entrepreneur, investor, professional, company)</li>
                <li><strong>Profile Information:</strong> Bio, location, website, social media links, professional experience, company details</li>
                <li><strong>Type-Specific Information:</strong>
                  <ul className="list-circle pl-6 mt-2 space-y-1">
                    <li>Entrepreneurs: Startup details, funding goals, pitch decks</li>
                    <li>Investors: Investment criteria, portfolio, ticket sizes</li>
                    <li>Professionals: Skills, rates, certifications, availability</li>
                    <li>Companies: Hiring needs, company size, culture</li>
                  </ul>
                </li>
                <li><strong>Photos:</strong> Profile pictures and cover photos you upload</li>
                <li><strong>Communications:</strong> Messages, opportunities posted, match requests</li>
              </ul>

              <h3 className="text-xl font-semibold text-navy-800 mb-3">2.2 Automatically Collected Information</h3>
              <ul className="list-disc pl-6 mb-4 text-gray-700 space-y-2">
                <li><strong>Usage Data:</strong> Pages visited, features used, time spent on platform</li>
                <li><strong>Device Information:</strong> Browser type, operating system, IP address</li>
                <li><strong>Cookies:</strong> Session data, preferences, authentication tokens</li>
              </ul>
            </section>

            {/* How We Use Your Information */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-navy-900 mb-4">3. How We Use Your Information</h2>
              <p className="text-gray-700 mb-3">We use your information to:</p>
              <ul className="list-disc pl-6 mb-4 text-gray-700 space-y-2">
                <li>Create and manage your account</li>
                <li>Provide personalized matching and recommendations</li>
                <li>Enable communication between users</li>
                <li>Display your profile to other users based on their search criteria</li>
                <li>Send important notifications about your account and matches</li>
                <li>Improve our platform and develop new features</li>
                <li>Ensure security and prevent fraud</li>
                <li>Comply with legal obligations</li>
              </ul>
            </section>

            {/* Information Sharing */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-navy-900 mb-4">4. Information Sharing and Disclosure</h2>

              <h3 className="text-xl font-semibold text-navy-800 mb-3">4.1 Public Profile Information</h3>
              <p className="text-gray-700 mb-4">
                Your profile information (name, bio, professional details, type-specific information) is visible to other authenticated users on the platform to facilitate networking and matching.
              </p>

              <h3 className="text-xl font-semibold text-navy-800 mb-3">4.2 Private Information</h3>
              <p className="text-gray-700 mb-4">
                We do NOT share your email address, phone number, or direct contact information publicly. These are only visible to you and are protected by our security policies.
              </p>

              <h3 className="text-xl font-semibold text-navy-800 mb-3">4.3 Service Providers</h3>
              <p className="text-gray-700 mb-4">
                We may share information with trusted third-party service providers who assist us in operating the platform (hosting, database, authentication). These providers are bound by confidentiality agreements.
              </p>

              <h3 className="text-xl font-semibold text-navy-800 mb-3">4.4 Legal Requirements</h3>
              <p className="text-gray-700 mb-4">
                We may disclose information if required by law, court order, or governmental request, or to protect our rights and safety.
              </p>
            </section>

            {/* Data Security */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-navy-900 mb-4">5. Data Security</h2>
              <p className="text-gray-700 mb-3">We implement industry-standard security measures:</p>
              <ul className="list-disc pl-6 mb-4 text-gray-700 space-y-2">
                <li><strong>Encryption:</strong> All data transmission uses HTTPS/TLS encryption</li>
                <li><strong>Authentication:</strong> Secure password hashing and session management</li>
                <li><strong>Access Control:</strong> Row-level security policies restrict data access</li>
                <li><strong>Storage:</strong> Data stored in secure, SOC 2 compliant infrastructure (Supabase)</li>
              </ul>
              <p className="text-gray-700">
                However, no method of transmission over the internet is 100% secure. While we strive to protect your data, we cannot guarantee absolute security.
              </p>
            </section>

            {/* Your Rights */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-navy-900 mb-4">6. Your Rights and Choices</h2>
              <p className="text-gray-700 mb-3">You have the right to:</p>
              <ul className="list-disc pl-6 mb-4 text-gray-700 space-y-2">
                <li><strong>Access:</strong> View all your personal data we have stored</li>
                <li><strong>Edit:</strong> Update your profile information at any time</li>
                <li><strong>Delete:</strong> Request deletion of your account and associated data</li>
                <li><strong>Export:</strong> Download a copy of your data</li>
                <li><strong>Opt-Out:</strong> Unsubscribe from marketing communications</li>
                <li><strong>Control Visibility:</strong> Manage what information is shown on your profile</li>
              </ul>
              <p className="text-gray-700">
                To exercise these rights, contact us at <strong>privacy@afroconnect.io</strong> or use the settings in your account dashboard.
              </p>
            </section>

            {/* Data Retention */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-navy-900 mb-4">7. Data Retention</h2>
              <p className="text-gray-700">
                We retain your information for as long as your account is active or as needed to provide services. If you delete your account, we will delete your personal data within 30 days, except where retention is required by law or for legitimate business purposes (e.g., preventing fraud, resolving disputes).
              </p>
            </section>

            {/* International Users */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-navy-900 mb-4">8. International Data Transfers</h2>
              <p className="text-gray-700">
                AfroConnect is designed for users across Africa and globally. Your data may be transferred to and processed in countries other than your own. We ensure appropriate safeguards are in place for such transfers in compliance with applicable data protection laws.
              </p>
            </section>

            {/* Children's Privacy */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-navy-900 mb-4">9. Children's Privacy</h2>
              <p className="text-gray-700">
                AfroConnect is not intended for users under the age of 18. We do not knowingly collect information from children. If we become aware that a child has provided us with personal information, we will delete it immediately.
              </p>
            </section>

            {/* Changes to Policy */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-navy-900 mb-4">10. Changes to This Privacy Policy</h2>
              <p className="text-gray-700">
                We may update this Privacy Policy from time to time. We will notify you of significant changes by posting the new policy on this page and updating the "Last Updated" date. Your continued use of the platform after changes constitutes acceptance of the updated policy.
              </p>
            </section>

            {/* Contact */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-navy-900 mb-4">11. Contact Us</h2>
              <p className="text-gray-700 mb-3">
                If you have questions or concerns about this Privacy Policy or our data practices, please contact us:
              </p>
              <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                <p className="text-gray-700 mb-2"><strong>Email:</strong> privacy@afroconnect.io</p>
                <p className="text-gray-700 mb-2"><strong>Support:</strong> support@afroconnect.io</p>
                <p className="text-gray-700"><strong>Platform:</strong> www.afroconnect.io</p>
              </div>
            </section>

            {/* Footer Note */}
            <div className="mt-12 pt-8 border-t border-gray-200">
              <p className="text-sm text-gray-600 text-center">
                By using AfroConnect, you acknowledge that you have read and understood this Privacy Policy.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
