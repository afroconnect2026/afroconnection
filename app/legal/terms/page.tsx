import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import Logo from '@/components/Logo'

export const metadata = {
  title: 'Terms of Service',
  description: 'AfroConnect Terms of Service - Rules and guidelines for using our platform'
}

export default function TermsOfServicePage() {
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
            Terms of Service
          </h1>
          <p className="text-gray-600 mb-8">
            Last Updated: August 7, 2026
          </p>

          <div className="prose prose-lg max-w-none">
            {/* Introduction */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-navy-900 mb-4">1. Agreement to Terms</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                By accessing or using AfroConnect ("the Platform", "we", "our", "us"), you agree to be bound by these Terms of Service ("Terms"). If you do not agree to these Terms, you may not access or use the Platform.
              </p>
              <p className="text-gray-700 leading-relaxed">
                These Terms apply to all users, including entrepreneurs, investors, professionals, and companies. We reserve the right to update these Terms at any time. Your continued use of the Platform after changes constitutes acceptance of the new Terms.
              </p>
            </section>

            {/* Eligibility */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-navy-900 mb-4">2. Eligibility</h2>
              <p className="text-gray-700 mb-3">To use AfroConnect, you must:</p>
              <ul className="list-disc pl-6 mb-4 text-gray-700 space-y-2">
                <li>Be at least 18 years of age</li>
                <li>Have the legal capacity to enter into binding contracts</li>
                <li>Not be prohibited from using the Platform under applicable laws</li>
                <li>Provide accurate and truthful information during registration</li>
                <li>Maintain the security of your account credentials</li>
              </ul>
              <p className="text-gray-700">
                You are responsible for all activity that occurs under your account.
              </p>
            </section>

            {/* User Accounts */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-navy-900 mb-4">3. User Accounts and Registration</h2>

              <h3 className="text-xl font-semibold text-navy-800 mb-3">3.1 Account Types</h3>
              <p className="text-gray-700 mb-3">AfroConnect offers four user types:</p>
              <ul className="list-disc pl-6 mb-4 text-gray-700 space-y-2">
                <li><strong>Entrepreneur:</strong> Individuals building startups or seeking funding</li>
                <li><strong>Investor:</strong> Individuals or firms seeking investment opportunities</li>
                <li><strong>Professional:</strong> Consultants, mentors, and service providers</li>
                <li><strong>Company:</strong> Established businesses seeking talent or partnerships</li>
              </ul>

              <h3 className="text-xl font-semibold text-navy-800 mb-3">3.2 Account Responsibilities</h3>
              <ul className="list-disc pl-6 mb-4 text-gray-700 space-y-2">
                <li>You must provide accurate, current, and complete information</li>
                <li>You must update your profile to reflect any changes</li>
                <li>You are responsible for maintaining the confidentiality of your password</li>
                <li>You must notify us immediately of any unauthorized access</li>
                <li>One person or entity may only create one account</li>
              </ul>
            </section>

            {/* User Conduct */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-navy-900 mb-4">4. User Conduct and Prohibited Activities</h2>
              <p className="text-gray-700 mb-3">You agree NOT to:</p>
              <ul className="list-disc pl-6 mb-4 text-gray-700 space-y-2">
                <li>Post false, misleading, or fraudulent information</li>
                <li>Impersonate another person or entity</li>
                <li>Harass, abuse, or harm other users</li>
                <li>Use the Platform for illegal activities or scams</li>
                <li>Spam users with unsolicited messages or opportunities</li>
                <li>Scrape, copy, or extract data from the Platform without permission</li>
                <li>Attempt to gain unauthorized access to accounts or systems</li>
                <li>Upload malicious code, viruses, or harmful content</li>
                <li>Violate intellectual property rights</li>
                <li>Use automated tools (bots) to interact with the Platform</li>
                <li>Sell or transfer your account to another party</li>
              </ul>
              <p className="text-gray-700">
                Violation of these rules may result in immediate account suspension or termination.
              </p>
            </section>

            {/* Content and Intellectual Property */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-navy-900 mb-4">5. Content and Intellectual Property</h2>

              <h3 className="text-xl font-semibold text-navy-800 mb-3">5.1 Your Content</h3>
              <p className="text-gray-700 mb-4">
                You retain ownership of all content you post on AfroConnect (profile information, messages, pitch decks, etc.). By posting content, you grant AfroConnect a non-exclusive, worldwide, royalty-free license to use, display, and distribute your content for the purpose of operating and promoting the Platform.
              </p>

              <h3 className="text-xl font-semibold text-navy-800 mb-3">5.2 Platform Content</h3>
              <p className="text-gray-700 mb-4">
                All Platform features, design, code, branding, and trademarks are owned by AfroConnect and protected by intellectual property laws. You may not copy, modify, or reverse-engineer any part of the Platform.
              </p>

              <h3 className="text-xl font-semibold text-navy-800 mb-3">5.3 Content Removal</h3>
              <p className="text-gray-700 mb-4">
                We reserve the right to remove any content that violates these Terms, is reported by users, or is deemed inappropriate at our discretion.
              </p>
            </section>

            {/* Privacy and Data */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-navy-900 mb-4">6. Privacy and Data Protection</h2>
              <p className="text-gray-700 mb-3">
                Your use of AfroConnect is also governed by our <Link href="/legal/privacy" className="text-primary-600 hover:underline font-semibold">Privacy Policy</Link>, which explains:
              </p>
              <ul className="list-disc pl-6 mb-4 text-gray-700 space-y-2">
                <li>What information we collect</li>
                <li>How we use and protect your data</li>
                <li>What information is visible to other users</li>
                <li>Your rights regarding your personal data</li>
              </ul>
              <p className="text-gray-700">
                By using the Platform, you consent to our collection and use of information as described in the Privacy Policy.
              </p>
            </section>

            {/* Matching and Networking */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-navy-900 mb-4">7. Matching and Networking Services</h2>

              <h3 className="text-xl font-semibold text-navy-800 mb-3">7.1 No Guarantee of Results</h3>
              <p className="text-gray-700 mb-4">
                AfroConnect provides a platform to connect users based on shared interests and criteria. We do not guarantee that you will find specific opportunities, funding, partnerships, or employment through the Platform.
              </p>

              <h3 className="text-xl font-semibold text-navy-800 mb-3">7.2 User Responsibility</h3>
              <p className="text-gray-700 mb-4">
                You are solely responsible for evaluating the suitability of any connections, opportunities, or transactions made through the Platform. We do not vet, verify, or endorse users or opportunities.
              </p>

              <h3 className="text-xl font-semibold text-navy-800 mb-3">7.3 Due Diligence</h3>
              <p className="text-gray-700 mb-4">
                Before entering into any business relationship, investment, or transaction with another user, you should conduct your own due diligence, seek professional advice, and verify all information independently.
              </p>
            </section>

            {/* Fees and Payments */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-navy-900 mb-4">8. Fees and Payments</h2>
              <p className="text-gray-700 mb-4">
                AfroConnect currently offers free access to core platform features. We reserve the right to introduce premium features or subscription plans in the future. Any paid features will be clearly disclosed, and you will have the option to opt-in.
              </p>
              <p className="text-gray-700">
                If premium features are introduced, payment terms, refund policies, and cancellation procedures will be provided at that time.
              </p>
            </section>

            {/* Disclaimer of Warranties */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-navy-900 mb-4">9. Disclaimer of Warranties</h2>
              <p className="text-gray-700 mb-3">
                <strong>THE PLATFORM IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND.</strong> We disclaim all warranties, express or implied, including:
              </p>
              <ul className="list-disc pl-6 mb-4 text-gray-700 space-y-2">
                <li>Warranties of merchantability or fitness for a particular purpose</li>
                <li>Warranties that the Platform will be uninterrupted or error-free</li>
                <li>Warranties regarding the accuracy or reliability of user content</li>
                <li>Warranties that the Platform will meet your specific requirements</li>
              </ul>
              <p className="text-gray-700">
                You use the Platform at your own risk.
              </p>
            </section>

            {/* Limitation of Liability */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-navy-900 mb-4">10. Limitation of Liability</h2>
              <p className="text-gray-700 mb-4">
                <strong>TO THE MAXIMUM EXTENT PERMITTED BY LAW, AFROCONNECT SHALL NOT BE LIABLE FOR:</strong>
              </p>
              <ul className="list-disc pl-6 mb-4 text-gray-700 space-y-2">
                <li>Any indirect, incidental, special, or consequential damages</li>
                <li>Loss of profits, revenue, data, or business opportunities</li>
                <li>Damages arising from user interactions or transactions</li>
                <li>Damages resulting from unauthorized access to your account</li>
                <li>Damages from errors, bugs, or platform downtime</li>
              </ul>
              <p className="text-gray-700">
                Our total liability to you shall not exceed the amount you paid to us (if any) in the past 12 months, or $100 USD, whichever is greater.
              </p>
            </section>

            {/* Indemnification */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-navy-900 mb-4">11. Indemnification</h2>
              <p className="text-gray-700">
                You agree to indemnify, defend, and hold harmless AfroConnect, its officers, directors, employees, and agents from any claims, liabilities, damages, or expenses (including legal fees) arising from:
              </p>
              <ul className="list-disc pl-6 mt-3 text-gray-700 space-y-2">
                <li>Your use of the Platform</li>
                <li>Your violation of these Terms</li>
                <li>Your violation of any rights of another user</li>
                <li>Content you post on the Platform</li>
              </ul>
            </section>

            {/* Termination */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-navy-900 mb-4">12. Termination</h2>
              <p className="text-gray-700 mb-4">
                We reserve the right to suspend or terminate your account at any time, without notice, for:
              </p>
              <ul className="list-disc pl-6 mb-4 text-gray-700 space-y-2">
                <li>Violation of these Terms</li>
                <li>Fraudulent or illegal activity</li>
                <li>Harm to other users or the Platform</li>
                <li>Prolonged inactivity (12+ months)</li>
              </ul>
              <p className="text-gray-700 mb-4">
                You may also delete your account at any time through your account settings.
              </p>
              <p className="text-gray-700">
                Upon termination, your right to use the Platform ceases immediately. We may retain certain data as required by law or for legitimate business purposes.
              </p>
            </section>

            {/* Dispute Resolution */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-navy-900 mb-4">13. Dispute Resolution and Governing Law</h2>
              <p className="text-gray-700 mb-4">
                These Terms shall be governed by and construed in accordance with the laws of [Your Jurisdiction], without regard to conflict of law principles.
              </p>
              <p className="text-gray-700 mb-4">
                In the event of any dispute arising from these Terms or your use of the Platform, you agree to first attempt to resolve the dispute informally by contacting us at <strong>legal@afroconnect.com</strong>.
              </p>
              <p className="text-gray-700">
                If informal resolution fails, disputes shall be resolved through binding arbitration in accordance with the rules of [Arbitration Body], unless otherwise required by local law.
              </p>
            </section>

            {/* General Provisions */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-navy-900 mb-4">14. General Provisions</h2>

              <h3 className="text-xl font-semibold text-navy-800 mb-3">14.1 Entire Agreement</h3>
              <p className="text-gray-700 mb-4">
                These Terms, together with our Privacy Policy, constitute the entire agreement between you and AfroConnect.
              </p>

              <h3 className="text-xl font-semibold text-navy-800 mb-3">14.2 Severability</h3>
              <p className="text-gray-700 mb-4">
                If any provision of these Terms is found to be invalid or unenforceable, the remaining provisions shall remain in full force and effect.
              </p>

              <h3 className="text-xl font-semibold text-navy-800 mb-3">14.3 Waiver</h3>
              <p className="text-gray-700 mb-4">
                Our failure to enforce any right or provision of these Terms shall not constitute a waiver of such right or provision.
              </p>

              <h3 className="text-xl font-semibold text-navy-800 mb-3">14.4 Assignment</h3>
              <p className="text-gray-700 mb-4">
                You may not assign or transfer these Terms or your account without our prior written consent. We may assign these Terms without restriction.
              </p>
            </section>

            {/* Contact */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-navy-900 mb-4">15. Contact Information</h2>
              <p className="text-gray-700 mb-3">
                If you have questions about these Terms, please contact us:
              </p>
              <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                <p className="text-gray-700 mb-2"><strong>Legal Inquiries:</strong> legal@afroconnect.com</p>
                <p className="text-gray-700 mb-2"><strong>General Support:</strong> support@afroconnect.com</p>
                <p className="text-gray-700"><strong>Platform:</strong> www.afroconnect.com</p>
              </div>
            </section>

            {/* Footer Note */}
            <div className="mt-12 pt-8 border-t border-gray-200">
              <p className="text-sm text-gray-600 text-center">
                By clicking "I Agree" during registration or by using AfroConnect, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
