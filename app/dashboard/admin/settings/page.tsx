'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { useEnhancedRole } from '@/hooks/use-role-switcher'
import AppHeader from '@/components/ui/AppHeader'
import { db } from '@/lib/firebase.client'
import { doc, updateDoc, getDoc } from 'firebase/firestore'
import { 
 Settings, 
 Save, 
 Users, 
 Video, 
 Shield, 
 Bell,
 Globe,
 Database,
 Key,
 AlertTriangle,
 CheckCircle,
 XCircle
} from 'lucide-react'

interface PlatformSettings {
 contentModeration: {
  autoApprove: boolean
  requireReview: boolean
  maxVideoLength: number
  maxFileSize: number
 }
 userManagement: {
  allowRegistration: boolean
  requireEmailVerification: boolean
  maxLoginAttempts: number
  sessionTimeout: number
 }
 contentSettings: {
  allowComments: boolean
  allowRatings: boolean
  maxTagsPerContent: number
  requireThumbnail: boolean
 }
 notifications: {
  emailNotifications: boolean
  pushNotifications: boolean
  marketingEmails: boolean
  weeklyDigest: boolean
 }
 security: {
  twoFactorAuth: boolean
  passwordMinLength: number
  requireSpecialChars: boolean
  maxFailedLogins: number
 }
}

export default function AdminSettings() {
 const [settings, setSettings] = useState<PlatformSettings>({
  contentModeration: {
   autoApprove: false,
   requireReview: true,
   maxVideoLength: 60,
   maxFileSize: 500
  },
  userManagement: {
   allowRegistration: true,
   requireEmailVerification: true,
   maxLoginAttempts: 5,
   sessionTimeout: 24
  },
  contentSettings: {
   allowComments: true,
   allowRatings: true,
   maxTagsPerContent: 10,
   requireThumbnail: true
  },
  notifications: {
   emailNotifications: true,
   pushNotifications: true,
   marketingEmails: false,
   weeklyDigest: true
  },
  security: {
   twoFactorAuth: false,
   passwordMinLength: 8,
   requireSpecialChars: true,
   maxFailedLogins: 3
  }
 })
 
 const [loading, setLoading] = useState(true)
 const [saving, setSaving] = useState(false)
 const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle')
 
 const { user } = useAuth()
 const { role } = useEnhancedRole()

 useEffect(() => {
  if (user && (role === 'superadmin' || role === 'admin')) {
   loadSettings()
  }
 }, [user, role])

 const loadSettings = async () => {
  try {
   setLoading(true)
   
   // Load settings from Firestore (or use defaults)
   const settingsDoc = await getDoc(doc(db, 'admin', 'settings'))
   
   if (settingsDoc.exists()) {
    const data = settingsDoc.data()
    setSettings({ ...settings, ...data })
   }
   
  } catch (error) {
   console.error('Error loading settings:', error)
  } finally {
   setLoading(false)
  }
 }

 const saveSettings = async () => {
  try {
   setSaving(true)
   setSaveStatus('idle')
   
   // Save settings to Firestore
   await updateDoc(doc(db, 'admin', 'settings'), {
    ...settings,
    updatedAt: new Date(),
    updatedBy: user?.uid
   })
   
   setSaveStatus('success')
   setTimeout(() => setSaveStatus('idle'), 3000)
   
  } catch (error) {
   console.error('Error saving settings:', error)
   setSaveStatus('error')
   setTimeout(() => setSaveStatus('idle'), 3000)
  } finally {
   setSaving(false)
  }
 }

 const updateSetting = (category: keyof PlatformSettings, key: string, value: string | number | boolean) => {
  setSettings(prev => ({
   ...prev,
   [category]: {
    ...prev[category],
    [key]: value
   }
  }))
 }

 if (role !== 'superadmin' && role !== 'admin') {
  return (
   <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#E8E6D8' }}>
    <div className="text-center bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 p-8">
     <h1 className="text-2xl mb-4 font-heading" style={{ color: '#000000' }}>Access Denied</h1>
     <p style={{ color: '#000000', opacity: 0.7 }}>This page is only available to administrators.</p>
    </div>
   </div>
  )
 }

 if (loading) {
  return (
   <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#E8E6D8' }}>
    <div className="text-center">
     <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-black mx-auto"></div>
     <p className="mt-4" style={{ color: '#000000', opacity: 0.7 }}>Loading settings...</p>
    </div>
   </div>
  )
 }

 return (
  <div className="min-h-screen" style={{ backgroundColor: '#E8E6D8' }}>
   <AppHeader title="Platform Settings" subtitle="Configure platform behavior, security, and user experience settings" />
   <main className="max-w-6xl mx-auto px-6 py-8">
    <div className="space-y-8">

    {/* Save Status */}
    {saveStatus !== 'idle' && (
     <div className={`p-4 rounded-xl flex items-center gap-3 shadow-lg border ${
      saveStatus === 'success'
       ? 'bg-white/90 backdrop-blur-sm border-white/50'
       : 'bg-white/90 backdrop-blur-sm border-white/50'
     }`}>
      {saveStatus === 'success' ? (
       <CheckCircle className="w-5 h-5" style={{ color: '#20B2AA' }} />
      ) : (
       <XCircle className="w-5 h-5" style={{ color: '#FF6B35' }} />
      )}
      <span style={{ color: saveStatus === 'success' ? '#20B2AA' : '#FF6B35' }}>
       {saveStatus === 'success'
        ? 'Settings saved successfully!'
        : 'Error saving settings. Please try again.'}
      </span>
     </div>
    )}

    {/* Settings Form */}
    <form onSubmit={(e) => { e.preventDefault(); saveSettings(); }} className="space-y-8">
     {/* Content Moderation */}
     <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 p-8">
      <h2 className="text-2xl font-heading mb-6 flex items-center gap-2" style={{ color: '#000000' }}>
       <Video className="w-6 h-6" style={{ color: '#91A6EB' }} />
       Content Moderation
      </h2>
      
      <div className="grid md:grid-cols-2 gap-6">
       <div className="space-y-4">
        <div className="flex items-center justify-between">
         <label className="text-sm font-semibold" style={{ color: '#000000' }}>Auto-approve content</label>
         <input
          type="checkbox"
          checked={settings.contentModeration.autoApprove}
          onChange={(e) => updateSetting('contentModeration', 'autoApprove', e.target.checked)}
          className="w-4 h-4 accent-black"
         />
        </div>

        <div className="flex items-center justify-between">
         <label className="text-sm font-semibold" style={{ color: '#000000' }}>Require admin review</label>
         <input
          type="checkbox"
          checked={settings.contentModeration.requireReview}
          onChange={(e) => updateSetting('contentModeration', 'requireReview', e.target.checked)}
          className="w-4 h-4 accent-black"
         />
        </div>
       </div>

       <div className="space-y-4">
        <div>
         <label className="block text-sm font-semibold mb-2" style={{ color: '#000000' }}>Max video length (minutes)</label>
         <input
          type="number"
          value={settings.contentModeration.maxVideoLength}
          onChange={(e) => updateSetting('contentModeration', 'maxVideoLength', parseInt(e.target.value))}
          className="w-full px-4 py-2 border border-gray-300/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-black bg-white"
          style={{ color: '#000000' }}
          min="1"
          max="120"
         />
        </div>

        <div>
         <label className="block text-sm font-semibold mb-2" style={{ color: '#000000' }}>Max file size (MB)</label>
         <input
          type="number"
          value={settings.contentModeration.maxFileSize}
          onChange={(e) => updateSetting('contentModeration', 'maxFileSize', parseInt(e.target.value))}
          className="w-full px-4 py-2 border border-gray-300/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-black bg-white"
          style={{ color: '#000000' }}
          min="10"
          max="2000"
         />
        </div>
       </div>
      </div>
     </div>

     {/* User Management */}
     <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 p-8">
      <h2 className="text-2xl font-heading mb-6 flex items-center gap-2" style={{ color: '#000000' }}>
       <Users className="w-6 h-6" style={{ color: '#20B2AA' }} />
       User Management
      </h2>
      
      <div className="grid md:grid-cols-2 gap-6">
       <div className="space-y-4">
        <div className="flex items-center justify-between">
         <label className="text-sm ">Allow new registrations</label>
         <input
          type="checkbox"
          checked={settings.userManagement.allowRegistration}
          onChange={(e) => updateSetting('userManagement', 'allowRegistration', e.target.checked)}
          className="toggle"
         />
        </div>
        
        <div className="flex items-center justify-between">
         <label className="text-sm ">Require email verification</label>
         <input
          type="checkbox"
          checked={settings.userManagement.requireEmailVerification}
          onChange={(e) => updateSetting('userManagement', 'requireEmailVerification', e.target.checked)}
          className="toggle"
         />
        </div>
       </div>
       
       <div className="space-y-4">
        <div>
         <label className="block text-sm  mb-2">Max login attempts</label>
         <input
          type="number"
          value={settings.userManagement.maxLoginAttempts}
          onChange={(e) => updateSetting('userManagement', 'maxLoginAttempts', parseInt(e.target.value))}
          className="input w-full"
          min="3"
          max="10"
         />
        </div>
        
        <div>
         <label className="block text-sm  mb-2">Session timeout (hours)</label>
         <input
          type="number"
          value={settings.userManagement.sessionTimeout}
          onChange={(e) => updateSetting('userManagement', 'sessionTimeout', parseInt(e.target.value))}
          className="input w-full"
          min="1"
          max="168"
         />
        </div>
       </div>
      </div>
     </div>

     {/* Content Settings */}
     <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 p-8">
      <h2 className="text-2xl font-heading mb-6 flex items-center gap-2" style={{ color: '#000000' }}>
       <Video className="w-6 h-6" style={{ color: '#FF6B35' }} />
       Content Settings
      </h2>
      
      <div className="grid md:grid-cols-2 gap-6">
       <div className="space-y-4">
        <div className="flex items-center justify-between">
         <label className="text-sm ">Allow comments</label>
         <input
          type="checkbox"
          checked={settings.contentSettings.allowComments}
          onChange={(e) => updateSetting('contentSettings', 'allowComments', e.target.checked)}
          className="toggle"
         />
        </div>
        
        <div className="flex items-center justify-between">
         <label className="text-sm ">Allow ratings</label>
         <input
          type="checkbox"
          checked={settings.contentSettings.allowRatings}
          onChange={(e) => updateSetting('contentSettings', 'allowRatings', e.target.checked)}
          className="toggle"
         />
        </div>
        
        <div className="flex items-center justify-between">
         <label className="text-sm ">Require thumbnails</label>
         <input
          type="checkbox"
          checked={settings.contentSettings.requireThumbnail}
          onChange={(e) => updateSetting('contentSettings', 'requireThumbnail', e.target.checked)}
          className="toggle"
         />
        </div>
       </div>
       
       <div className="space-y-4">
        <div>
         <label className="block text-sm  mb-2">Max tags per content</label>
         <input
          type="number"
          value={settings.contentSettings.maxTagsPerContent}
          onChange={(e) => updateSetting('contentSettings', 'maxTagsPerContent', parseInt(e.target.value))}
          className="input w-full"
          min="1"
          max="20"
         />
        </div>
       </div>
      </div>
     </div>

     {/* Notifications */}
     <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 p-8">
      <h2 className="text-2xl font-heading mb-6 flex items-center gap-2" style={{ color: '#000000' }}>
       <Bell className="w-6 h-6" style={{ color: '#91A6EB' }} />
       Notification Settings
      </h2>
      
      <div className="grid md:grid-cols-2 gap-6">
       <div className="space-y-4">
        <div className="flex items-center justify-between">
         <label className="text-sm ">Email notifications</label>
         <input
          type="checkbox"
          checked={settings.notifications.emailNotifications}
          onChange={(e) => updateSetting('notifications', 'emailNotifications', e.target.checked)}
          className="toggle"
         />
        </div>
        
        <div className="flex items-center justify-between">
         <label className="text-sm ">Push notifications</label>
         <input
          type="checkbox"
          checked={settings.notifications.pushNotifications}
          onChange={(e) => updateSetting('notifications', 'pushNotifications', e.target.checked)}
          className="toggle"
         />
        </div>
       </div>
       
       <div className="space-y-4">
        <div className="flex items-center justify-between">
         <label className="text-sm ">Marketing emails</label>
         <input
          type="checkbox"
          checked={settings.notifications.marketingEmails}
          onChange={(e) => updateSetting('notifications', 'marketingEmails', e.target.checked)}
          className="toggle"
         />
        </div>
        
        <div className="flex items-center justify-between">
         <label className="text-sm ">Weekly digest</label>
         <input
          type="checkbox"
          checked={settings.notifications.weeklyDigest}
          onChange={(e) => updateSetting('notifications', 'weeklyDigest', e.target.checked)}
          className="toggle"
         />
        </div>
       </div>
      </div>
     </div>

     {/* Security */}
     <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 p-8">
      <h2 className="text-2xl font-heading mb-6 flex items-center gap-2" style={{ color: '#000000' }}>
       <Shield className="w-6 h-6" style={{ color: '#FF6B35' }} />
       Security Settings
      </h2>
      
      <div className="grid md:grid-cols-2 gap-6">
       <div className="space-y-4">
        <div className="flex items-center justify-between">
         <label className="text-sm ">Two-factor authentication</label>
         <input
          type="checkbox"
          checked={settings.security.twoFactorAuth}
          onChange={(e) => updateSetting('security', 'twoFactorAuth', e.target.checked)}
          className="toggle"
         />
        </div>
        
        <div className="flex items-center justify-between">
         <label className="text-sm ">Require special characters</label>
         <input
          type="checkbox"
          checked={settings.security.requireSpecialChars}
          onChange={(e) => updateSetting('security', 'requireSpecialChars', e.target.checked)}
          className="toggle"
         />
        </div>
       </div>
       
       <div className="space-y-4">
        <div>
         <label className="block text-sm  mb-2">Password min length</label>
         <input
          type="number"
          value={settings.security.passwordMinLength}
          onChange={(e) => updateSetting('security', 'passwordMinLength', parseInt(e.target.value))}
          className="input w-full"
          min="6"
          max="32"
         />
        </div>
        
        <div>
         <label className="block text-sm  mb-2">Max failed logins</label>
         <input
          type="number"
          value={settings.security.maxFailedLogins}
          onChange={(e) => updateSetting('security', 'maxFailedLogins', parseInt(e.target.value))}
          className="input w-full"
          min="3"
          max="10"
         />
        </div>
       </div>
      </div>
     </div>

     {/* Save Button */}
     <div className="flex justify-end">
      <button
       type="submit"
       disabled={saving}
       className="px-8 py-3 rounded-lg text-white font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
       style={{ backgroundColor: '#91A6EB' }}
      >
       {saving ? (
        <>
         <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
         Saving...
        </>
       ) : (
        <>
         <Save className="w-5 h-5" />
         Save Settings
        </>
       )}
      </button>
     </div>
    </form>
    </div>
   </main>
  </div>
 )
}
