'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { useEnhancedRole } from '@/hooks/use-role-switcher'
import AppHeader from '@/components/ui/AppHeader'
import { db } from '@/lib/firebase.client'
import { collection, query, getDocs, orderBy, where, doc, updateDoc } from 'firebase/firestore'
import {
 Users,
 Search,
 Filter,
 MoreHorizontal,
 UserCheck,
 UserX,
 Shield,
 Star,
 Clock,
 Mail,
 Phone,
 Calendar,
 Trash2,
 AlertTriangle
} from 'lucide-react'

interface User {
 uid: string
 email: string
 displayName?: string
 role: string
 status: string
 createdAt: Date
 lastActive: Date
 sport?: string
 level?: string
 location?: string
}

export default function AdminUserManagement() {
 const [users, setUsers] = useState<User[]>([])
 const [filteredUsers, setFilteredUsers] = useState<User[]>([])
 const [loading, setLoading] = useState(true)
 const [searchTerm, setSearchTerm] = useState('')
 const [statusFilter, setStatusFilter] = useState('all')
 const [roleFilter, setRoleFilter] = useState('all')
 const [selectedUser, setSelectedUser] = useState<User | null>(null)
 const [isRoleChangeInProgress, setIsRoleChangeInProgress] = useState(false)
 const [editingRoleUid, setEditingRoleUid] = useState<string | null>(null)
 const [tempRole, setTempRole] = useState('')
 const [coaches, setCoaches] = useState<{uid: string, name: string}[]>([])
 const [selectedCoachId, setSelectedCoachId] = useState('')
 const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
 const [deleteStep, setDeleteStep] = useState(1)
 const [isDeletingUser, setIsDeletingUser] = useState(false)

 const { user } = useAuth()
 const { role, loading: roleLoading } = useEnhancedRole()

 const loadUsers = useCallback(async () => {
  try {
   setLoading(true)

   // Load users from Firestore
   const usersQuery = query(
    collection(db, 'users'),
    orderBy('createdAt', 'desc')
   )

   const usersSnapshot = await getDocs(usersQuery)
   const usersData: User[] = []

   usersSnapshot.forEach(doc => {
    const data = doc.data()
    usersData.push({
     uid: doc.id,
     email: data.email || '',
     displayName: data.displayName || '',
     role: data.role || 'athlete',
     status: data.status || 'active',
     createdAt: data.createdAt?.toDate() || new Date(),
     lastActive: data.lastActive?.toDate() || new Date(),
     sport: data.sport || '',
     level: data.level || '',
     location: data.location || ''
    })
   })

   setUsers(usersData)

  } catch (error) {
   console.error('Error loading users:', error)
  } finally {
   setLoading(false)
  }
 }, [])

 const loadCoaches = useCallback(async () => {
  try {
   // Load all coaches for assignment dropdown
   const coachesQuery = query(
    collection(db, 'users'),
    where('role', '==', 'coach')
   )

   const coachesSnapshot = await getDocs(coachesQuery)
   const coachesData: {uid: string, name: string}[] = []

   coachesSnapshot.forEach(doc => {
    const data = doc.data()
    coachesData.push({
     uid: doc.id,
     name: data.displayName || data.email || 'Unnamed Coach'
    })
   })

   setCoaches(coachesData)
  } catch (error) {
   console.error('Error loading coaches:', error)
  }
 }, [])

 const filterUsers = useCallback(() => {
  let filtered = users

  // Search filter
  if (searchTerm) {
   filtered = filtered.filter(user => 
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (user.displayName && user.displayName.toLowerCase().includes(searchTerm.toLowerCase())) ||
    user.sport?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.location?.toLowerCase().includes(searchTerm.toLowerCase())
   )
  }

  // Status filter
  if (statusFilter !== 'all') {
   filtered = filtered.filter(user => user.status === statusFilter)
  }

  // Role filter
  if (roleFilter !== 'all') {
   filtered = filtered.filter(user => user.role === roleFilter)
  }

  setFilteredUsers(filtered)
 }, [users, searchTerm, statusFilter, roleFilter])

 useEffect(() => {
  if (user && (role === 'superadmin' || role === 'admin')) {
   loadUsers()
   loadCoaches()
  }
 }, [user, role, loadUsers, loadCoaches])

 useEffect(() => {
  filterUsers()
 }, [filterUsers])

 const updateUserStatus = async (uid: string, newStatus: string) => {
  try {
   await updateDoc(doc(db, 'users', uid), {
    status: newStatus,
    updatedAt: new Date()
   })

   // Update local state
   setUsers(users.map(u => u.uid === uid ? { ...u, status: newStatus } : u))

  } catch (error) {
   console.error('Error updating user status:', error)
  }
 }

 const updateUserRole = async (uid: string, newRole: string) => {
  try {
   // BULLETPROOF: Update BOTH role AND invitationRole to ensure change persists
   await updateDoc(doc(db, 'users', uid), {
    role: newRole,
    invitationRole: newRole, // Update the bulletproof field
    roleSource: 'admin_manual_change',
    roleUpdatedAt: new Date(),
    manuallySetRole: true,
    roleProtected: true,
    updatedAt: new Date()
   })
   setUsers(users.map(u => u.uid === uid ? { ...u, role: newRole } : u))
   setSelectedUser(null)
  } catch (error) {
   console.error('Error updating user role:', error)
  }
 }

 const assignCoach = async (athleteUid: string, coachId: string) => {
  try {
   // Update athlete's coach assignment
   await updateDoc(doc(db, 'users', athleteUid), {
    coachId: coachId,
    assignedCoachId: coachId,
    updatedAt: new Date()
   })

   console.log(`✅ Assigned coach ${coachId} to athlete ${athleteUid}`)
   alert('Coach assigned successfully!')
   setSelectedUser(null)
   loadUsers() // Reload to show updated data
  } catch (error) {
   console.error('Error assigning coach:', error)
   alert('Failed to assign coach. Please try again.')
  }
 }

 const deleteUser = async (uid: string, email: string) => {
  setIsDeletingUser(true)
  try {
   console.log(`🗑️ Deleting user: ${email} (${uid})`)

   // Call API to delete from both Firebase Auth and Firestore
   const response = await fetch('/api/admin/delete-user', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ uid, email })
   })

   const result = await response.json()

   if (!response.ok || !result.success) {
    throw new Error(result.error || 'Failed to delete user')
   }

   console.log('✅ User deleted successfully')
   alert('User deleted successfully from both Firebase Auth and Database!')

   // Remove from local state
   setUsers(users.filter(u => u.uid !== uid))
   setSelectedUser(null)
   setShowDeleteConfirm(false)
   setDeleteStep(1)
  } catch (error) {
   console.error('❌ Error deleting user:', error)
   alert(error instanceof Error ? error.message : 'Failed to delete user. Please try again.')
  } finally {
   setIsDeletingUser(false)
  }
 }

 const handleDeleteClick = () => {
  setShowDeleteConfirm(true)
  setDeleteStep(1)
 }

 const handleDeleteConfirm = () => {
  if (deleteStep === 1) {
   setDeleteStep(2)
  } else if (deleteStep === 2 && selectedUser) {
   deleteUser(selectedUser.uid, selectedUser.email)
  }
 }

 const handleDeleteCancel = () => {
  setShowDeleteConfirm(false)
  setDeleteStep(1)
 }

 const getStatusColor = (status: string) => {
  switch (status) {
   case 'active': return 'text-green-400 bg-green-400/10'
   case 'suspended': return 'text-red-400 bg-red-400/10'
   case 'pending': return 'text-yellow-400 bg-yellow-400/10'
   default: return 'text-gray-400 bg-gray-400/10'
  }
 }

 const getRoleIcon = (userRole: string) => {
  switch (userRole) {
   case 'coach': return <Star className="w-4 h-4 text-purple-400" />
   case 'assistant_coach': return <Star className="w-4 h-4 text-indigo-400" />
   case 'admin': return <Shield className="w-4 h-4 text-orange-400" />
   case 'superadmin': return <Shield className="w-4 h-4 text-red-400" />
   default: return <Users className="w-4 h-4 text-blue-400" />
  }
 }

 const getRoleLabel = (userRole: string) => {
  switch (userRole) {
   case 'athlete': return 'Athlete'
   case 'coach': return 'Coach'
   case 'assistant_coach': return 'Assistant Coach'
   case 'admin': return 'Admin'
   case 'superadmin': return 'Super Admin'
   default: return userRole.charAt(0).toUpperCase() + userRole.slice(1)
  }
 }

 if (roleLoading) {
  return (
   <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#E8E6D8' }}>
    <div className="text-center">
     <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-black mx-auto"></div>
     <p className="mt-4" style={{ color: '#000000', opacity: 0.7 }}>Loading user permissions...</p>
    </div>
   </div>
  )
 }

 if (role !== 'superadmin' && role !== 'admin') {
  return (
   <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#E8E6D8' }}>
    <div className="text-center bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 p-8">
     <h1 className="text-2xl mb-4" style={{ color: '#000000' }}>Access Denied</h1>
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
     <p className="mt-4" style={{ color: '#000000', opacity: 0.7 }}>Loading users...</p>
    </div>
   </div>
  )
 }

 return (
  <div className="min-h-screen" style={{ backgroundColor: '#E8E6D8' }}>
   <AppHeader title="User & Role Management" subtitle="Manage user accounts, roles, permissions, and status. Click any role to edit inline." />
   <main className="max-w-7xl mx-auto px-6 py-8">
    <div>
     {/* Stats Overview */}
    <div className="grid md:grid-cols-4 gap-6 mb-8">
     <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 p-6 text-center">
      <div className="text-4xl mb-2" style={{ color: '#91A6EB' }}>
       {users.filter(u => u.status === 'active').length}
      </div>
      <div className="text-sm" style={{ color: '#000000', opacity: 0.7 }}>Active Athletes</div>
     </div>
     <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 p-6 text-center">
      <div className="text-4xl mb-2" style={{ color: '#20B2AA' }}>
       {users.filter(u => u.role === 'coach').length}
      </div>
      <div className="text-sm" style={{ color: '#000000', opacity: 0.7 }}>Coaches</div>
     </div>
     <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 p-6 text-center">
      <div className="text-4xl mb-2" style={{ color: '#FF6B35' }}>
       {users.filter(u => u.status === 'pending').length}
      </div>
      <div className="text-sm" style={{ color: '#000000', opacity: 0.7 }}>Pending</div>
     </div>
     <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 p-6 text-center">
      <div className="text-4xl mb-2" style={{ color: '#000000' }}>
       {users.filter(u => u.status === 'suspended').length}
      </div>
      <div className="text-sm" style={{ color: '#000000', opacity: 0.7 }}>Suspended</div>
     </div>
    </div>

    {/* Filters and Search */}
    <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 p-6 mb-8">
     <div className="flex flex-col md:flex-row gap-4">
      <div className="flex-1">
       <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5" style={{ color: '#000000', opacity: 0.5 }} />
        <input
         type="text"
         placeholder="Search users by name, email, sport, or location..."
         value={searchTerm}
         onChange={(e) => setSearchTerm(e.target.value)}
         className="w-full pl-10 px-4 py-2 border border-gray-300/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-black bg-white"
         style={{ color: '#000000' }}
        />
       </div>
      </div>

      <div className="flex gap-2">
       <select
        value={statusFilter}
        onChange={(e) => setStatusFilter(e.target.value)}
        className="px-4 py-2 border border-gray-300/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-black bg-white"
        style={{ color: '#000000' }}
       >
        <option value="all">All Status</option>
        <option value="active">Active</option>
        <option value="pending">Pending</option>
        <option value="suspended">Suspended</option>
       </select>

       <select
        value={roleFilter}
        onChange={(e) => setRoleFilter(e.target.value)}
        className="px-4 py-2 border border-gray-300/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-black bg-white"
        style={{ color: '#000000' }}
       >
        <option value="all">All Roles</option>
        <option value="athlete">Athletes</option>
        <option value="coach">Coaches</option>
        <option value="admin">Admins</option>
        <option value="superadmin">Super Admins</option>
       </select>
      </div>
     </div>
    </div>

    {/* Users Table */}
    <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 overflow-hidden">
     <div className="overflow-x-auto">
      <table className="w-full">
       <thead>
        <tr className="border-b border-gray-300/50">
         <th className="text-left p-4" style={{ color: '#000000' }}>User</th>
         <th className="text-left p-4" style={{ color: '#000000' }}>Role</th>
         <th className="text-left p-4" style={{ color: '#000000' }}>Status</th>
         <th className="text-left p-4" style={{ color: '#000000' }}>Sport/Level</th>
         <th className="text-left p-4" style={{ color: '#000000' }}>Location</th>
         <th className="text-left p-4" style={{ color: '#000000' }}>Joined</th>
         <th className="text-left p-4" style={{ color: '#000000' }}>Last Active</th>
         <th className="text-center p-4" style={{ color: '#000000' }}>Actions</th>
        </tr>
       </thead>
       <tbody>
        {filteredUsers.map((user) => (
         <tr key={user.uid} className="border-t border-gray-300/30 hover:bg-white/30 transition-colors">
          <td className="p-4">
           <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-md" style={{ backgroundColor: user.role === 'coach' ? '#20B2AA' : '#91A6EB' }}>
             {getRoleIcon(user.role)}
            </div>
            <div>
             <div className="font-semibold" style={{ color: '#000000' }}>
              {user.displayName || 'No Name'}
             </div>
             <div className="text-sm" style={{ color: '#000000', opacity: 0.6 }}>{user.email}</div>
            </div>
           </div>
          </td>

          <td className="p-4">
           {editingRoleUid === user.uid ? (
            <div className="flex items-center gap-2">
             <select
              value={tempRole}
              onChange={(e) => setTempRole(e.target.value)}
              className="px-3 py-1 border border-gray-300/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-black bg-white text-sm"
              style={{ color: '#000000' }}
             >
              <option value="athlete">Athlete</option>
              <option value="coach">Coach</option>
              <option value="creator">Creator</option>
              <option value="assistant">Assistant</option>
              <option value="admin">Admin</option>
              {role === 'superadmin' && <option value="superadmin">Super Admin</option>}
             </select>
             <button
              onClick={() => {
               updateUserRole(user.uid, tempRole)
               setEditingRoleUid(null)
              }}
              className="p-1 hover:bg-green-500/10 rounded transition-colors"
              title="Save"
             >
              <span className="text-green-600 text-lg">✓</span>
             </button>
             <button
              onClick={() => setEditingRoleUid(null)}
              className="p-1 hover:bg-red-500/10 rounded transition-colors"
              title="Cancel"
             >
              <span className="text-red-600 text-lg">✕</span>
             </button>
            </div>
           ) : (
            <button
             onClick={() => {
              setEditingRoleUid(user.uid)
              setTempRole(user.role)
             }}
             className="flex items-center gap-2 hover:bg-black/5 px-2 py-1 rounded-lg transition-colors"
             style={{ color: '#000000' }}
             title="Click to edit role"
            >
             {getRoleIcon(user.role)}
             <span>{getRoleLabel(user.role)}</span>
            </button>
           )}
          </td>

          <td className="p-4">
           <span className={`px-3 py-1 rounded-full text-xs ${getStatusColor(user.status)}`}>
            {user.status}
           </span>
          </td>

          <td className="p-4">
           <div className="text-sm" style={{ color: '#000000' }}>
            <div>{user.sport || 'Not specified'}</div>
            <div style={{ opacity: 0.6 }}>{user.level || ''}</div>
           </div>
          </td>

          <td className="p-4">
           <div className="text-sm" style={{ color: '#000000' }}>{user.location || 'Not specified'}</div>
          </td>

          <td className="p-4">
           <div className="text-sm" style={{ color: '#000000', opacity: 0.7 }}>
            {user.createdAt.toLocaleDateString()}
           </div>
          </td>

          <td className="p-4">
           <div className="text-sm" style={{ color: '#000000', opacity: 0.7 }}>
            {user.lastActive.toLocaleDateString()}
           </div>
          </td>

          <td className="p-4">
           <div className="flex items-center justify-center gap-2">
            <button
             onClick={() => setSelectedUser(user)}
             className="p-2 hover:bg-black/10 rounded-lg transition-colors"
            >
             <MoreHorizontal className="w-4 h-4" style={{ color: '#000000' }} />
            </button>
           </div>
          </td>
         </tr>
        ))}
       </tbody>
      </table>
     </div>
    </div>

    {/* User Count */}
    <div className="mt-6 text-center text-sm" style={{ color: '#000000', opacity: 0.7 }}>
     Showing {filteredUsers.length} of {users.length} users
    </div>

    {/* Detailed Role Statistics */}
    <div className="mt-8">
     <h2 className="text-xl mb-4" style={{ color: '#000000' }}>Role Distribution</h2>
     <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
      <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 p-6 text-center">
       <div className="text-3xl mb-2" style={{ color: '#91A6EB' }}>
        {users.filter(u => u.role === 'athlete').length}
       </div>
       <div className="text-sm" style={{ color: '#000000', opacity: 0.7 }}>Athletes</div>
      </div>
      <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 p-6 text-center">
       <div className="text-3xl mb-2" style={{ color: '#20B2AA' }}>
        {users.filter(u => u.role === 'coach').length}
       </div>
       <div className="text-sm" style={{ color: '#000000', opacity: 0.7 }}>Coaches</div>
      </div>
      <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 p-6 text-center">
       <div className="text-3xl mb-2" style={{ color: '#FF6B35' }}>
        {users.filter(u => u.role === 'creator').length}
       </div>
       <div className="text-sm" style={{ color: '#000000', opacity: 0.7 }}>Creators</div>
      </div>
      <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 p-6 text-center">
       <div className="text-3xl mb-2" style={{ color: '#8B4513' }}>
        {users.filter(u => u.role === 'assistant').length}
       </div>
       <div className="text-sm" style={{ color: '#000000', opacity: 0.7 }}>Assistants</div>
      </div>
      <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 p-6 text-center">
       <div className="text-3xl mb-2" style={{ color: '#DC143C' }}>
        {users.filter(u => u.role === 'admin' || u.role === 'superadmin').length}
       </div>
       <div className="text-sm" style={{ color: '#000000', opacity: 0.7 }}>Admins</div>
      </div>
     </div>
    </div>

    {/* User Actions Modal */}
    {selectedUser && (
     <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-2xl border border-white/50 max-w-md w-full mx-4 p-6">
       <h3 className="text-2xl mb-6" style={{ color: '#000000' }}>User Actions</h3>

       <div className="space-y-3 mb-6">
        <div className="flex items-center gap-3 p-3 rounded-lg bg-white/60 border border-gray-300/30">
         <Mail className="w-5 h-5" style={{ color: '#91A6EB' }} />
         <span className="text-sm" style={{ color: '#000000' }}>{selectedUser.email}</span>
        </div>

        <div className="flex items-center gap-3 p-3 rounded-lg bg-white/60 border border-gray-300/30">
         <Shield className="w-5 h-5" style={{ color: '#20B2AA' }} />
         <span className="text-sm" style={{ color: '#000000' }}>{getRoleLabel(selectedUser.role)}</span>
        </div>

        <div className="flex items-center gap-3 p-3 rounded-lg bg-white/60 border border-gray-300/30">
         <Calendar className="w-5 h-5" style={{ color: '#FF6B35' }} />
         <span className="text-sm" style={{ color: '#000000' }}>Joined {selectedUser.createdAt.toLocaleDateString()}</span>
        </div>
       </div>
       
       <div className="space-y-4">
        {/* Role Selector */}
        <div className="space-y-2">
         <label className="text-sm" style={{ color: '#000000' }}>Change Role</label>
         <select
          value={selectedUser.role}
          onChange={(e) => {
           const newRole = e.target.value
           console.log('🎯 ADMIN: Role dropdown changed to:', newRole, 'for user:', selectedUser.uid)

           // Prevent multiple rapid changes
           if (isRoleChangeInProgress) {
            console.log('⚠️ ADMIN: Role change already in progress, ignoring')
            return
           }

           setIsRoleChangeInProgress(true)

           // Set flag immediately to prevent any flicker
           localStorage.setItem('admin_role_change_in_progress', 'true')
           console.log('🚨 ADMIN: Set admin_role_change_in_progress flag to prevent flicker')

           if (selectedUser.uid === user?.uid) {
            console.log('⚠️ ADMIN: Self role change detected, showing confirmation')
            const confirmChange = confirm(`You are about to change your own role to "${newRole}". The page will reload after the change. Continue?`)
            if (!confirmChange) {
             // Clear flag if user cancels
             localStorage.removeItem('admin_role_change_in_progress')
             setIsRoleChangeInProgress(false)
             console.log('❌ ADMIN: User cancelled role change, cleared flag')
             return
            }
            console.log('✅ ADMIN: User confirmed self role change')
           }

           console.log('🚀 ADMIN: Calling updateUserRole function')
           updateUserRole(selectedUser.uid, newRole)
          }}
          className="w-full px-4 py-2 border border-gray-300/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-black bg-white"
          style={{ color: '#000000' }}
         >
          <option value="athlete">Athlete</option>
          <option value="coach">Coach</option>
          <option value="admin">Admin</option>
          {role === 'superadmin' && (
           <option value="superadmin">Super Admin</option>
          )}
         </select>
         <p className="text-xs" style={{ color: '#000000', opacity: 0.6 }}>
          {role === 'superadmin'
           ? 'You can assign any role including Super Admin'
           : 'You can assign Athlete, Coach, or Admin roles'
          }
         </p>
        </div>

        {/* Quick Actions */}
        <div className="border-t border-gray-300/30 pt-4 space-y-2">
         <div className="grid grid-cols-2 gap-2">
          <button
           onClick={() => {
            if (confirm(`Make ${selectedUser.displayName || selectedUser.email} a coach?`)) {
             updateUserRole(selectedUser.uid, 'coach')
            }
           }}
           disabled={selectedUser.role === 'coach'}
           className="px-4 py-2 rounded-lg text-white transition-all disabled:opacity-50"
           style={{ backgroundColor: '#20B2AA' }}
          >
           <div className="flex items-center justify-center gap-1">
            <Star className="w-4 h-4" />
            <span className="text-sm">Make Coach</span>
           </div>
          </button>

          <button
           onClick={() => {
            if (confirm(`Make ${selectedUser.displayName || selectedUser.email} an athlete?`)) {
             updateUserRole(selectedUser.uid, 'athlete')
            }
           }}
           disabled={selectedUser.role === 'athlete'}
           className="px-4 py-2 rounded-lg text-white transition-all disabled:opacity-50"
           style={{ backgroundColor: '#91A6EB' }}
          >
           <div className="flex items-center justify-center gap-1">
            <Users className="w-4 h-4" />
            <span className="text-sm">Make Athlete</span>
           </div>
          </button>
         </div>
        </div>

        {/* Assign Coach (Athletes Only) */}
        {selectedUser.role === 'athlete' && (
         <div className="border-t border-gray-300/30 pt-4 space-y-2">
          <label className="text-sm font-medium" style={{ color: '#000000' }}>Assign Coach</label>
          <select
           value={selectedCoachId}
           onChange={(e) => setSelectedCoachId(e.target.value)}
           className="w-full px-4 py-2 border border-gray-300/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-black bg-white"
           style={{ color: '#000000' }}
          >
           <option value="">Select a coach...</option>
           {coaches.map(coach => (
            <option key={coach.uid} value={coach.uid}>{coach.name}</option>
           ))}
          </select>
          <button
           onClick={() => {
            if (!selectedCoachId) {
             alert('Please select a coach first')
             return
            }
            assignCoach(selectedUser.uid, selectedCoachId)
           }}
           disabled={!selectedCoachId}
           className="w-full px-4 py-2 rounded-lg text-white transition-all disabled:opacity-50"
           style={{ backgroundColor: '#20B2AA' }}
          >
           <div className="flex items-center justify-center gap-2">
            <Star className="w-4 h-4" />
            <span>Assign Coach</span>
           </div>
          </button>
         </div>
        )}

        {/* Status Actions */}
        <div className="border-t border-gray-300/30 pt-4 space-y-2">
         <button
          onClick={() => updateUserStatus(selectedUser.uid, 'active')}
          disabled={selectedUser.status === 'active'}
          className="w-full px-4 py-2 border border-gray-300/50 rounded-lg transition-all hover:bg-black/5 disabled:opacity-50"
          style={{ color: '#000000' }}
         >
          <div className="flex items-center justify-center gap-2">
           <UserCheck className="w-4 h-4" />
           <span>Activate User</span>
          </div>
         </button>

         <button
          onClick={() => updateUserStatus(selectedUser.uid, 'suspended')}
          disabled={selectedUser.status === 'suspended'}
          className="w-full px-4 py-2 border border-gray-300/50 rounded-lg transition-all hover:bg-black/5 disabled:opacity-50"
          style={{ color: '#000000' }}
         >
          <div className="flex items-center justify-center gap-2">
           <UserX className="w-4 h-4" />
           <span>Suspend User</span>
          </div>
         </button>
        </div>

        {/* Delete User Section */}
        {!showDeleteConfirm ? (
         <div className="border-t border-red-300/30 pt-4">
          <button
           onClick={handleDeleteClick}
           className="w-full px-4 py-2 border-2 border-red-500 text-red-600 rounded-lg transition-all hover:bg-red-50"
          >
           <div className="flex items-center justify-center gap-2">
            <Trash2 className="w-4 h-4" />
            <span className="font-semibold">Delete User Permanently</span>
           </div>
          </button>
          <p className="text-xs text-center mt-2" style={{ color: '#DC143C', opacity: 0.8 }}>
           This will delete the user from both authentication and database
          </p>
         </div>
        ) : (
         <div className="border-t border-red-300/30 pt-4 space-y-3">
          <div className="p-4 bg-red-50 rounded-lg border-2 border-red-300">
           <div className="flex items-start gap-3">
            <AlertTriangle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
             <h4 className="font-bold text-red-800 mb-2">
              {deleteStep === 1 ? 'Confirm Deletion - Step 1 of 2' : 'FINAL CONFIRMATION - Step 2 of 2'}
             </h4>
             {deleteStep === 1 ? (
              <div className="text-sm text-red-700 space-y-2">
               <p>You are about to permanently delete:</p>
               <div className="bg-white/50 p-2 rounded border border-red-200">
                <p className="font-semibold">{selectedUser.displayName || 'No Name'}</p>
                <p className="text-xs">{selectedUser.email}</p>
               </div>
               <p className="font-semibold mt-2">This action will:</p>
               <ul className="list-disc list-inside space-y-1 pl-2">
                <li>Remove user from Firebase Authentication</li>
                <li>Delete all user data from Firestore</li>
                <li>This action CANNOT be undone</li>
               </ul>
              </div>
             ) : (
              <div className="text-sm text-red-700 space-y-2">
               <p className="font-bold text-base">ARE YOU ABSOLUTELY SURE?</p>
               <p>This is your final chance to cancel.</p>
               <p className="font-semibold">
                User <span className="bg-white px-2 py-0.5 rounded">{selectedUser.email}</span> will be permanently deleted.
               </p>
              </div>
             )}
            </div>
           </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
           <button
            onClick={handleDeleteCancel}
            disabled={isDeletingUser}
            className="px-4 py-2 border-2 border-gray-400 text-gray-700 rounded-lg transition-all hover:bg-gray-100 disabled:opacity-50"
           >
            Cancel
           </button>
           <button
            onClick={handleDeleteConfirm}
            disabled={isDeletingUser}
            className="px-4 py-2 bg-red-600 text-white rounded-lg transition-all hover:bg-red-700 disabled:opacity-50 font-semibold"
           >
            {isDeletingUser ? (
             <div className="flex items-center justify-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              <span>Deleting...</span>
             </div>
            ) : (
             deleteStep === 1 ? 'Continue to Step 2' : 'DELETE PERMANENTLY'
            )}
           </button>
          </div>
         </div>
        )}

        <button
         onClick={() => {
          setSelectedUser(null)
          setShowDeleteConfirm(false)
          setDeleteStep(1)
         }}
         disabled={isDeletingUser}
         className="w-full px-4 py-3 bg-black text-white rounded-lg hover:bg-black/90 transition-all mt-4 disabled:opacity-50"
        >
         Close
        </button>
       </div>
      </div>
     </div>
    )}
     </div>
   </main>
  </div>
 )
}
