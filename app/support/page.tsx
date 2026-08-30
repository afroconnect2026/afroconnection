'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Mail, MessageCircle, FileQuestion, Send, CheckCircle2, Clock, Users } from 'lucide-react'
import Logo from '@/components/Logo'
import toast from 'react-hot-toast'

export default function SupportPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    category: 'general',
    subject: '',
    message: ''
  })
  const [sending, setSending] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const supportCategories = [
    { value: 'general', label: 'General Inquiry' },
    { value: 'technical', label: 'Technical Issue' },
    { value: 'account', label: 'Account & Billing' },
    { value: 'feature', label: 'Feature Request' },
    { value: 'partnership', label: 'Partnership' },
    { value: 'other', label: 'Other' }
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name || !formData.email || !formData.subject || !formData.message) {
      toast.error('Please fill in all required fields')
      return
    }

    setSending(true)

    // Simulate sending (replace with actual email service later)
    setTimeout(() => {
      setSending(false)
      setSubmitted(true)
      toast.success('Support request submitted successfully!')

      // Reset form
      setFormData({
        name: '',
        email: '',
        category: 'general',
        subject: '',
        message: ''
      })
    }, 1500)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
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

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-navy-900 via-navy-800 to-primary-900 text-white py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-display font-bold mb-4">
            How Can We Help You?
          </h1>
          <p className="text-xl text-gray-300">
            Our support team is here to assist you with any questions or issues
          </p>
        </div>
      </section>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Contact Options */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm p-6 sticky top-6">
              <h2 className="text-xl font-bold text-navy-900 mb-6">Contact Information</h2>

              <div className="space-y-6">
                {/* Email Support */}
                <div className="flex items-start space-x-4">
                  <div className="bg-primary-100 p-3 rounded-lg">
                    <Mail className="h-6 w-6 text-primary-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-navy-900 mb-1">Email Support</h3>
                    <a
                      href="mailto:support@afroconnect.io"
                      className="text-primary-600 hover:text-primary-700 text-sm"
                    >
                      support@afroconnect.io
                    </a>
                    <p className="text-xs text-gray-500 mt-1">Response within 24 hours</p>
                  </div>
                </div>

                {/* General Inquiries */}
                <div className="flex items-start space-x-4">
                  <div className="bg-gold-100 p-3 rounded-lg">
                    <MessageCircle className="h-6 w-6 text-gold-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-navy-900 mb-1">General Inquiries</h3>
                    <a
                      href="mailto:admin@afroconnect.io"
                      className="text-primary-600 hover:text-primary-700 text-sm"
                    >
                      admin@afroconnect.io
                    </a>
                    <p className="text-xs text-gray-500 mt-1">Business inquiries</p>
                  </div>
                </div>

                {/* Support Hours */}
                <div className="flex items-start space-x-4">
                  <div className="bg-blue-100 p-3 rounded-lg">
                    <Clock className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-navy-900 mb-1">Support Hours</h3>
                    <p className="text-sm text-gray-600">Monday - Friday</p>
                    <p className="text-sm text-gray-600">9:00 AM - 6:00 PM EAT</p>
                  </div>
                </div>
              </div>

              {/* Quick Links */}
              <div className="mt-8 pt-8 border-t border-gray-200">
                <h3 className="font-semibold text-navy-900 mb-4">Quick Links</h3>
                <div className="space-y-3">
                  <Link
                    href="/legal/privacy"
                    className="block text-sm text-gray-600 hover:text-primary-600 transition-colors"
                  >
                    Privacy Policy
                  </Link>
                  <Link
                    href="/legal/terms"
                    className="block text-sm text-gray-600 hover:text-primary-600 transition-colors"
                  >
                    Terms of Service
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div className="lg:col-span-2">
            {submitted ? (
              <div className="bg-white rounded-xl shadow-sm p-8 md:p-12 text-center">
                <div className="bg-green-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle2 className="h-10 w-10 text-green-600" />
                </div>
                <h2 className="text-3xl font-bold text-navy-900 mb-4">
                  Message Sent Successfully!
                </h2>
                <p className="text-gray-600 mb-8">
                  Thank you for contacting us. We've received your message and will get back to you within 24 hours.
                </p>
                <button
                  onClick={() => setSubmitted(false)}
                  className="bg-gradient-to-r from-primary-600 to-primary-700 text-white px-8 py-3 rounded-lg font-semibold hover:from-primary-700 hover:to-primary-800 transition-all"
                >
                  Send Another Message
                </button>
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-sm p-8 md:p-12">
                <div className="flex items-center space-x-3 mb-6">
                  <FileQuestion className="h-8 w-8 text-primary-600" />
                  <h2 className="text-2xl font-bold text-navy-900">Send Us a Message</h2>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Name */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Your Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="John Doe"
                      className="w-full border-2 border-gray-200 rounded-lg px-4 py-3 text-gray-900 focus:outline-none focus:border-primary-500 transition-colors"
                      required
                    />
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Email Address <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="you@example.com"
                      className="w-full border-2 border-gray-200 rounded-lg px-4 py-3 text-gray-900 focus:outline-none focus:border-primary-500 transition-colors"
                      required
                    />
                  </div>

                  {/* Category */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Category <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full border-2 border-gray-200 rounded-lg px-4 py-3 text-gray-900 focus:outline-none focus:border-primary-500 transition-colors"
                      required
                    >
                      {supportCategories.map((cat) => (
                        <option key={cat.value} value={cat.value}>
                          {cat.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Subject */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Subject <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                      placeholder="Brief description of your issue"
                      className="w-full border-2 border-gray-200 rounded-lg px-4 py-3 text-gray-900 focus:outline-none focus:border-primary-500 transition-colors"
                      required
                    />
                  </div>

                  {/* Message */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Message <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      placeholder="Please provide as much detail as possible..."
                      rows={6}
                      className="w-full border-2 border-gray-200 rounded-lg px-4 py-3 text-gray-900 focus:outline-none focus:border-primary-500 transition-colors resize-none"
                      required
                    />
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={sending}
                    className="w-full bg-gradient-to-r from-primary-600 to-primary-700 text-white py-4 rounded-lg font-bold text-lg hover:from-primary-700 hover:to-primary-800 hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                  >
                    <span>{sending ? 'Sending...' : 'Send Message'}</span>
                    {!sending && <Send className="h-5 w-5" />}
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-16">
          <h2 className="text-3xl font-bold text-navy-900 text-center mb-12">
            Frequently Asked Questions
          </h2>

          <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
            {[
              {
                q: 'How do I create an account?',
                a: 'Click "Get Started" on the homepage, choose your account type (Entrepreneur, Investor, Professional, or Company), and follow the registration steps.'
              },
              {
                q: 'Is AfroConnect free to use?',
                a: 'Yes! AfroConnect is completely free to join and use. We believe in making opportunities accessible to everyone across Africa.'
              },
              {
                q: 'How do I post an event or opportunity?',
                a: 'After signing in, navigate to the Events or Opportunities section in your dashboard and click "Create New". Fill in the details and publish!'
              },
              {
                q: 'How can I connect with other users?',
                a: 'Browse the Explore page to discover entrepreneurs, investors, and professionals. Click on profiles to view details and send connection requests.'
              },
              {
                q: 'What types of opportunities can I post?',
                a: 'You can post Jobs, Investments, Partnerships, and Mentorship opportunities. Each type has a customized form to help you provide relevant details.'
              },
              {
                q: 'How do I update my profile?',
                a: 'Go to your Profile page from the dashboard menu, click "Edit Profile", make your changes, and save. Your updates will be visible immediately.'
              }
            ].map((faq, i) => (
              <div key={i} className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
                <h3 className="font-semibold text-navy-900 mb-3">{faq.q}</h3>
                <p className="text-gray-600 text-sm">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}
