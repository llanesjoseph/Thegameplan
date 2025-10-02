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
   <div className="min-h-screen flex items-center justify-center">
    <div className="text-center">
     <h1 className="text-2xl mb-4">Access Denied</h1>
     <p className="text-brand-grey">This page is only available to administrators.</p>
    </div>
   </div>
  )
 }

 if (loading) {
  return (
   <div className="min-h-screen flex items-center justify-center">
    <div className="text-center">
     <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500 mx-auto"></div>
     <p className="mt-4 text-brand-grey">Loading settings...</p>
    </div>
   </div>
  )
 }

 return (
  <div className="min-h-screen bg-gray-50">
   <AppHeader />
   <main className="py-16">
    <div className="max-w-6xl mx-auto px-6">
    {/* Header */}
    <div className="mb-12">
     <h1 className="text-4xl mb-4">Platform Settings</h1>
     <p className="text-xl text-brand-grey">
      Configure platform behavior, security, and user experience settings
     </p>
    </div>

    {/* Save Status */}
    {saveStatus !== 'idle' && (
     <div className={`mb-8 p-4 rounded-lg flex items-center gap-3 ${
      saveStatus === 'success' 
       ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
       : 'bg-red-500/20 text-red-400 border border-red-500/30'
     }`}>
      {saveStatus === 'success' ? (
       <CheckCircle className="w-5 h-5" />
      ) : (
       <XCircle className="w-5 h-5" />
      )}
      <span>
       {saveStatus === 'success' 
        ? 'Settings saved successfully!' 
        : 'Error saving settings. Please try again.'}
      </span>
     </div>
    )}

    {/* Settings Form */}
    <form onSubmit={(e) => { e.preventDefault(); saveSettings(); }} className="space-y-8">
     {/* Content Moderation */}
     <div className="card">
      <h2 className="text-2xl  mb-6 flex items-center gap-2">
       <Video className="w-6 h-6 text-blue-400" />
       Content Moderation
      </h2>
      
      <div className="grid md:grid-cols-2 gap-6">
       <div className="space-y-4">
        <div className="flex items-center justify-between">
         <label className="text-sm ">Auto-approve content</label>
         <input
          type="checkbox"
          checked={settings.contentModeration.autoApprove}
          onChange={(e) => updateSetting('contentModeration', 'autoApprove', e.target.checked)}
          className="toggle"
         />
        </div>
        
        <div className="flex items-center justify-between">
         <label className="text-sm ">Require admin review</label>
         <input
          type="checkbox"
          checked={settings.contentModeration.requireReview}
          onChange={(e) => updateSetting('contentModeration', 'requireReview', e.target.checked)}
          className="toggle"
         />
        </div>
       </div>
       
       <div className="space-y-4">
        <div>
         <label className="block text-sm  mb-2">Max video length (minutes)</label>
         <input
          type="number"
          value={settings.contentModeration.maxVideoLength}
          onChange={(e) => updateSetting('contentModeration', 'maxVideoLength', parseInt(e.target.value))}
          className="input w-full"
          min="1"
          max="120"
         />
        </div>
        
        <div>
         <label className="block text-sm  mb-2">Max file size (MB)</label>
         <input
          type="number"
          value={settings.contentModeration.maxFileSize}
          onChange={(e) => updateSetting('contentModeration', 'maxFileSize', parseInt(e.target.value))}
          className="input w-full"
          min="10"
          max="2000"
         />
        </div>
       </div>
      </div>
     </div>

     {/* User Management */}
     <div className="card">
      <h2 className="text-2xl  mb-6 flex items-center gap-2">
       <Users className="w-6 h-6 text-green-400" />
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
     <div className="card">
      <h2 className="text-2xl  mb-6 flex items-center gap-2">
       <Video className="w-6 h-6 text-purple-400" />
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
     <div className="card">
      <h2 className="text-2xl  mb-6 flex items-center gap-2">
       <Bell className="w-6 h-6 text-orange-400" />
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
     <div className="card">
      <h2 className="text-2xl  mb-6 flex items-center gap-2">
       <Shield className="w-6 h-6 text-red-400" />
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
       className="btn btn-accent btn-lg px-8"
      >
       {saving ? (
        <>
         <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
         Saving...
        </>
       ) : (
        <>
         <Save className="w-5 h-5 mr-2" />
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
