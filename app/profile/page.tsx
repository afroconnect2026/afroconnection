'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import AuthenticatedLayout from '@/components/AuthenticatedLayout'
import EntrepreneurProfileFields from '@/components/profile/EntrepreneurProfileFields'
import InvestorProfileFields from '@/components/profile/InvestorProfileFields'
import ProfessionalProfileFields from '@/components/profile/ProfessionalProfileFields'
import CompanyProfileFields from '@/components/profile/CompanyProfileFields'
import { motion } from 'framer-motion'
import {
  User,
  Mail,
  MapPin,
  Globe,
  Linkedin,
  Twitter,
  Edit,
  Camera,
  Briefcase,
  GraduationCap
} from 'lucide-react'
import toast from 'react-hot-toast'

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
}

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [uploadingCover, setUploadingCover] = useState(false)

  // Edit form state
  const [formData, setFormData] = useState({
    full_name: '',
    bio: '',
    country: '',
    city: '',
    phone: '',
    website_url: '',
    linkedin_url: '',
    twitter_url: ''
  })

  // Type-specific form data
  const [typeSpecificData, setTypeSpecificData] = useState<any>({})

  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/auth/login')
        return
      }

      setUser(user)

      // Fetch user profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      setProfile(profileData)

      // Initialize form data
      if (profileData) {
        setFormData({
          full_name: profileData.full_name || '',
          bio: profileData.bio || '',
          country: profileData.country || '',
          city: profileData.city || '',
          phone: profileData.phone || '',
          website_url: profileData.website_url || '',
          linkedin_url: profileData.linkedin_url || '',
          twitter_url: profileData.twitter_url || ''
        })

        // Load type-specific data based on user_type
        const userType = profileData.user_type
        if (userType) {
          const tableMap: any = {
            entrepreneur: 'entrepreneur_profiles',
            investor: 'investor_profiles',
            professional: 'professional_profiles',
            company: 'company_profiles'
          }

          const tableName = tableMap[userType]
          if (tableName) {
            const { data: typeData } = await supabase
              .from(tableName)
              .select('*')
              .eq('user_id', user.id)
              .maybeSingle()

            if (typeData) {
              setTypeSpecificData(typeData)
            }
          }
        }
      }

      setLoading(false)
    }

    checkAuth()
  }, [router, supabase])

  const handleSaveProfile = async () => {
    setSaving(true)
    try {
      // Save basic profile
      const { error: profileError } = await supabase
        .from('profiles')
        .update(formData)
        .eq('id', user.id)

      if (profileError) throw profileError

      // Save type-specific data
      if (profile?.user_type && Object.keys(typeSpecificData).length > 0) {
        const tableMap: any = {
          entrepreneur: 'entrepreneur_profiles',
          investor: 'investor_profiles',
          professional: 'professional_profiles',
          company: 'company_profiles'
        }

        const tableName = tableMap[profile.user_type]
        if (tableName) {
          // Try to update first, if no row exists, insert
          const { error: typeError } = await supabase
            .from(tableName)
            .upsert({
              user_id: user.id,
              ...typeSpecificData
            }, {
              onConflict: 'user_id'
            })

          if (typeError) {
            console.error('Type-specific save error:', typeError)
            // Don't throw - basic profile is saved, just warn
            toast.error('Profile saved, but some fields may not have been updated')
          }
        }
      }

      // Update local profile state
      setProfile({ ...profile, ...formData })
      setEditMode(false)
      toast.success('Profile updated successfully!')
    } catch (error: any) {
      console.error('Save error:', error)
      toast.error(error.message || 'Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  const handleTypeSpecificChange = (field: string, value: any) => {
    setTypeSpecificData({
      ...typeSpecificData,
      [field]: value
    })
  }

  const handleCancel = () => {
    // Reset form to current profile data
    setFormData({
      full_name: profile?.full_name || '',
      bio: profile?.bio || '',
      country: profile?.country || '',
      city: profile?.city || '',
      phone: profile?.phone || '',
      website_url: profile?.website_url || '',
      linkedin_url: profile?.linkedin_url || '',
      twitter_url: profile?.twitter_url || ''
    })
    setEditMode(false)
  }

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file')
      return
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image must be smaller than 2MB')
      return
    }

    setUploadingAvatar(true)
    try {
      // Delete old avatar if exists
      if (profile?.avatar_url) {
        const oldPath = profile.avatar_url.split('/').pop()
        if (oldPath) {
          await supabase.storage.from('avatars').remove([`${user.id}/${oldPath}`])
        }
      }

      // Upload new avatar
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}.${fileExt}`
      const filePath = `${user.id}/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true })

      if (uploadError) throw uploadError

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath)

      // Update profile
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', user.id)

      if (updateError) throw updateError

      setProfile({ ...profile, avatar_url: publicUrl })
      toast.success('Avatar updated!')
    } catch (error: any) {
      console.error('Avatar upload error:', error)
      toast.error(error.message || 'Failed to upload avatar')
    } finally {
      setUploadingAvatar(false)
    }
  }

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file')
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be smaller than 5MB')
      return
    }

    setUploadingCover(true)
    try {
      // Delete old cover if exists
      if (profile?.cover_url) {
        const oldPath = profile.cover_url.split('/').pop()
        if (oldPath) {
          await supabase.storage.from('covers').remove([`${user.id}/${oldPath}`])
        }
      }

      // Upload new cover
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}.${fileExt}`
      const filePath = `${user.id}/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('covers')
        .upload(filePath, file, { upsert: true })

      if (uploadError) throw uploadError

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('covers')
        .getPublicUrl(filePath)

      // Update profile
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ cover_url: publicUrl })
        .eq('id', user.id)

      if (updateError) throw updateError

      setProfile({ ...profile, cover_url: publicUrl })
      toast.success('Cover photo updated!')
    } catch (error: any) {
      console.error('Cover upload error:', error)
      toast.error(error.message || 'Failed to upload cover photo')
    } finally {
      setUploadingCover(false)
    }
  }

  if (loading) {
    return (
      <AuthenticatedLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </AuthenticatedLayout>
    )
  }

  const getUserTypeColor = () => {
    switch (profile?.user_type) {
      case 'entrepreneur': return 'from-primary-500 to-primary-600'
      case 'investor': return 'from-gold-500 to-gold-600'
      case 'professional': return 'from-blue-500 to-blue-600'
      case 'company': return 'from-purple-500 to-purple-600'
      default: return 'from-gray-500 to-gray-600'
    }
  }

  const getUserTypeLabel = () => {
    if (!profile?.user_type) return 'Member'
    return profile.user_type.charAt(0).toUpperCase() + profile.user_type.slice(1)
  }

  return (
    <AuthenticatedLayout>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeIn}
        >
          {/* Profile Header Card */}
          <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-8">
            {/* Cover Photo */}
            <div
              className="h-32 relative bg-gradient-to-r from-primary-600 to-primary-700"
              style={profile?.cover_url ? {
                backgroundImage: `url(${profile.cover_url})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center'
              } : {}}
            >
              <input
                type="file"
                id="cover-upload"
                accept="image/*"
                className="hidden"
                onChange={handleCoverUpload}
                disabled={uploadingCover}
              />
              <button
                onClick={() => document.getElementById('cover-upload')?.click()}
                disabled={uploadingCover}
                className="absolute bottom-4 right-4 bg-white/20 backdrop-blur-sm text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-white/30 transition-colors flex items-center space-x-2 disabled:opacity-50"
              >
                {uploadingCover ? (
                  <>
                    <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                    <span>Uploading...</span>
                  </>
                ) : (
                  <>
                    <Camera className="h-4 w-4" />
                    <span>Edit Cover</span>
                  </>
                )}
              </button>
            </div>

            {/* Profile Info */}
            <div className="px-6 pb-6">
              <div className="flex flex-col md:flex-row md:items-end md:justify-between -mt-16 mb-6">
                {/* Avatar */}
                <div className="relative">
                  {profile?.avatar_url ? (
                    <img
                      src={profile.avatar_url}
                      alt={profile?.full_name || 'Avatar'}
                      className="w-32 h-32 rounded-full border-4 border-white shadow-lg object-cover"
                    />
                  ) : (
                    <div className={`w-32 h-32 rounded-full bg-gradient-to-br ${getUserTypeColor()} flex items-center justify-center border-4 border-white shadow-lg`}>
                      <span className="text-4xl font-bold text-white">
                        {profile?.full_name?.charAt(0) || user?.email?.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                  <input
                    type="file"
                    id="avatar-upload"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarUpload}
                    disabled={uploadingAvatar}
                  />
                  <button
                    onClick={() => document.getElementById('avatar-upload')?.click()}
                    disabled={uploadingAvatar}
                    className="absolute bottom-2 right-2 w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-gray-50 transition-colors disabled:opacity-50"
                  >
                    {uploadingAvatar ? (
                      <div className="animate-spin h-4 w-4 border-2 border-gray-700 border-t-transparent rounded-full" />
                    ) : (
                      <Camera className="h-4 w-4 text-gray-700" />
                    )}
                  </button>
                </div>

                {/* Edit Button */}
                <button
                  onClick={() => editMode ? handleCancel() : setEditMode(true)}
                  className="mt-4 md:mt-0 bg-primary-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-primary-700 transition-colors flex items-center space-x-2"
                >
                  <Edit className="h-4 w-4" />
                  <span>{editMode ? 'Cancel' : 'Edit Profile'}</span>
                </button>
              </div>

              {/* Edit Mode - Form */}
              {editMode ? (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-navy-900 mb-6">Edit Your Profile</h2>

                  {/* Full Name */}
                  <div>
                    <label className="block text-gray-700 font-semibold mb-2">Full Name *</label>
                    <input
                      type="text"
                      value={formData.full_name}
                      onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-primary-500 focus:outline-none"
                      placeholder="Your full name"
                    />
                  </div>

                  {/* Bio */}
                  <div>
                    <label className="block text-gray-700 font-semibold mb-2">Bio</label>
                    <textarea
                      value={formData.bio}
                      onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                      rows={4}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-primary-500 focus:outline-none resize-none"
                      placeholder="Tell others about yourself, your experience, and what you're looking for..."
                    />
                  </div>

                  {/* Location */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-gray-700 font-semibold mb-2">Country</label>
                      <input
                        type="text"
                        value={formData.country}
                        onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-primary-500 focus:outline-none"
                        placeholder="e.g., Nigeria"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-700 font-semibold mb-2">City</label>
                      <input
                        type="text"
                        value={formData.city}
                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-primary-500 focus:outline-none"
                        placeholder="e.g., Lagos"
                      />
                    </div>
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="block text-gray-700 font-semibold mb-2">Phone (Optional)</label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-primary-500 focus:outline-none"
                      placeholder="+234 xxx xxx xxxx"
                    />
                  </div>

                  {/* Social Links */}
                  <div className="space-y-4">
                    <h3 className="font-semibold text-gray-900">Social & Professional Links</h3>

                    <div>
                      <label className="block text-gray-700 font-medium mb-2">Website</label>
                      <input
                        type="url"
                        value={formData.website_url}
                        onChange={(e) => setFormData({ ...formData, website_url: e.target.value })}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-primary-500 focus:outline-none"
                        placeholder="https://yourwebsite.com"
                      />
                    </div>

                    <div>
                      <label className="block text-gray-700 font-medium mb-2">LinkedIn Profile</label>
                      <input
                        type="url"
                        value={formData.linkedin_url}
                        onChange={(e) => setFormData({ ...formData, linkedin_url: e.target.value })}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-primary-500 focus:outline-none"
                        placeholder="https://linkedin.com/in/yourprofile"
                      />
                    </div>

                    <div>
                      <label className="block text-gray-700 font-medium mb-2">Twitter Profile</label>
                      <input
                        type="url"
                        value={formData.twitter_url}
                        onChange={(e) => setFormData({ ...formData, twitter_url: e.target.value })}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-primary-500 focus:outline-none"
                        placeholder="https://twitter.com/yourhandle"
                      />
                    </div>
                  </div>

                  {/* Type-Specific Fields */}
                  {profile?.user_type && (
                    <div className="pt-6 border-t">
                      {profile.user_type === 'entrepreneur' && (
                        <EntrepreneurProfileFields
                          editMode={editMode}
                          data={typeSpecificData}
                          onChange={handleTypeSpecificChange}
                        />
                      )}
                      {profile.user_type === 'investor' && (
                        <InvestorProfileFields
                          editMode={editMode}
                          data={typeSpecificData}
                          onChange={handleTypeSpecificChange}
                        />
                      )}
                      {profile.user_type === 'professional' && (
                        <ProfessionalProfileFields
                          editMode={editMode}
                          data={typeSpecificData}
                          onChange={handleTypeSpecificChange}
                        />
                      )}
                      {profile.user_type === 'company' && (
                        <CompanyProfileFields
                          editMode={editMode}
                          data={typeSpecificData}
                          onChange={handleTypeSpecificChange}
                        />
                      )}
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex space-x-4 pt-6 border-t">
                    <button
                      onClick={handleSaveProfile}
                      disabled={saving}
                      className="flex-1 bg-primary-600 text-white py-3 rounded-lg font-semibold hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                    <button
                      onClick={handleCancel}
                      disabled={saving}
                      className="px-8 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  {/* Name & Title */}
                  <div className="mb-6">
                <h1 className="text-3xl font-display font-bold text-navy-900 mb-2">
                  {profile?.full_name || 'Add your name'}
                </h1>
                <div className="flex flex-wrap gap-2 mb-4">
                  <span className={`px-3 py-1 rounded-full bg-gradient-to-r ${getUserTypeColor()} text-white text-sm font-medium`}>
                    {getUserTypeLabel()}
                  </span>
                  {profile?.country && (
                    <span className="px-3 py-1 rounded-full bg-gray-100 text-gray-700 text-sm font-medium flex items-center space-x-1">
                      <MapPin className="h-3 w-3" />
                      <span>{profile.country}</span>
                    </span>
                  )}
                </div>
                <p className="text-gray-600 text-lg">
                  {profile?.bio || 'Add a bio to tell others about yourself'}
                </p>
              </div>

              {/* Contact Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 pb-6 border-b border-gray-200">
                <div className="flex items-center space-x-3 text-gray-700">
                  <Mail className="h-5 w-5 text-gray-400" />
                  <span>{user?.email}</span>
                </div>
                {profile?.website_url && (
                  <div className="flex items-center space-x-3 text-gray-700">
                    <Globe className="h-5 w-5 text-gray-400" />
                    <a href={profile.website_url} target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline">
                      {profile.website_url.replace(/^https?:\/\//, '')}
                    </a>
                  </div>
                )}
                {profile?.linkedin_url && (
                  <div className="flex items-center space-x-3 text-gray-700">
                    <Linkedin className="h-5 w-5 text-gray-400" />
                    <a href={profile.linkedin_url} target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline">
                      LinkedIn Profile
                    </a>
                  </div>
                )}
                {profile?.twitter_url && (
                  <div className="flex items-center space-x-3 text-gray-700">
                    <Twitter className="h-5 w-5 text-gray-400" />
                    <a href={profile.twitter_url} target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline">
                      Twitter Profile
                    </a>
                  </div>
                )}
              </div>

              {/* Profile Completion */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <Briefcase className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div className="flex-1">
                    <h3 className="font-semibold text-blue-900 mb-1">Complete Your Profile</h3>
                    <p className="text-sm text-blue-700 mb-3">
                      Add more information to increase your visibility and connect with the right opportunities
                    </p>
                    <div className="w-full bg-blue-200 rounded-full h-2 mb-2">
                      <div className="bg-blue-600 h-2 rounded-full" style={{ width: '30%' }}></div>
                    </div>
                    <p className="text-xs text-blue-600 font-medium">30% Complete</p>
                  </div>
                </div>
              </div>
                </>
              )}
            </div>
          </div>

          {/* Additional Sections */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* About Section */}
            <div className="bg-white rounded-xl p-6 border border-gray-200">
              <h2 className="text-xl font-bold text-navy-900 mb-4 flex items-center space-x-2">
                <User className="h-5 w-5 text-primary-600" />
                <span>About</span>
              </h2>
              <p className="text-gray-600">
                {profile?.bio || 'Add a detailed description about yourself, your experience, and what you\'re looking for on AfroConnect.'}
              </p>
            </div>

            {/* Interests/Skills */}
            <div className="bg-white rounded-xl p-6 border border-gray-200">
              <h2 className="text-xl font-bold text-navy-900 mb-4 flex items-center space-x-2">
                <GraduationCap className="h-5 w-5 text-primary-600" />
                <span>Skills & Interests</span>
              </h2>
              <p className="text-gray-600">
                Add your skills and interests to help others find you
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </AuthenticatedLayout>
  )
}
