'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { useEnhancedRole } from '@/hooks/use-role-switcher'
import AppHeader from '@/components/ui/AppHeader'
import { db } from '@/lib/firebase.client'
import { collection, query, getDocs, orderBy, limit, where, doc, updateDoc } from 'firebase/firestore'
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
 Calendar
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
 
 const { user } = useAuth()
 const { role, loading: roleLoading } = useEnhancedRole()

 const loadUsers = useCallback(async () => {
  try {
   setLoading(true)
   
   // Load users from Firestore
   const usersQuery = query(
    collection(db, 'users'),
    orderBy('createdAt', 'desc'),
    limit(100)
   )
   
   const usersSnapshot = await getDocs(usersQuery)
   const usersData: User[] = []
   
   usersSnapshot.forEach(doc => {
    const data = doc.data()
    usersData.push({
     uid: doc.id,
     email: data.email || '',
     displayName: data.displayName || '',
     role: data.role || 'user',
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
  }
 }, [user, role, loadUsers])

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
   await updateDoc(doc(db, 'users', uid), {
    role: newRole,
    updatedAt: new Date()
   })
   setUsers(users.map(u => u.uid === uid ? { ...u, role: newRole } : u))
   setSelectedUser(null)
  } catch (error) {
   console.error('Error updating user role:', error)
  }
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
   case 'creator': return <Star className="w-4 h-4 text-purple-400" />
   case 'admin': return <Shield className="w-4 h-4 text-orange-400" />
   case 'superadmin': return <Shield className="w-4 h-4 text-red-400" />
   default: return <Users className="w-4 h-4 text-blue-400" />
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
     <p className="mt-4" style={{ color: '#000000', opacity: 0.7 }}>Loading users...</p>
    </div>
   </div>
  )
 }

 return (
  <div className="min-h-screen" style={{ backgroundColor: '#E8E6D8' }}>
   <AppHeader title="User Management" subtitle="Manage user accounts, roles, and support requests" />
   <main className="max-w-7xl mx-auto px-6 py-8">
    <div>
     {/* Stats Overview */}
    <div className="grid md:grid-cols-4 gap-6 mb-8">
     <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 p-6 text-center">
      <div className="text-4xl font-heading mb-2" style={{ color: '#91A6EB' }}>
       {users.filter(u => u.status === 'active').length}
      </div>
      <div className="text-sm" style={{ color: '#000000', opacity: 0.7 }}>Active Athletes</div>
     </div>
     <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 p-6 text-center">
      <div className="text-4xl font-heading mb-2" style={{ color: '#20B2AA' }}>
       {users.filter(u => u.role === 'creator').length}
      </div>
      <div className="text-sm" style={{ color: '#000000', opacity: 0.7 }}>Coaches</div>
     </div>
     <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 p-6 text-center">
      <div className="text-4xl font-heading mb-2" style={{ color: '#FF6B35' }}>
       {users.filter(u => u.status === 'pending').length}
      </div>
      <div className="text-sm" style={{ color: '#000000', opacity: 0.7 }}>Pending</div>
     </div>
     <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 p-6 text-center">
      <div className="text-4xl font-heading mb-2" style={{ color: '#000000' }}>
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
        <option value="user">Athletes</option>
        <option value="creator">Coaches</option>
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
         <th className="text-left p-4 font-semibold" style={{ color: '#000000' }}>User</th>
         <th className="text-left p-4 font-semibold" style={{ color: '#000000' }}>Role</th>
         <th className="text-left p-4 font-semibold" style={{ color: '#000000' }}>Status</th>
         <th className="text-left p-4 font-semibold" style={{ color: '#000000' }}>Sport/Level</th>
         <th className="text-left p-4 font-semibold" style={{ color: '#000000' }}>Location</th>
         <th className="text-left p-4 font-semibold" style={{ color: '#000000' }}>Joined</th>
         <th className="text-left p-4 font-semibold" style={{ color: '#000000' }}>Last Active</th>
         <th className="text-center p-4 font-semibold" style={{ color: '#000000' }}>Actions</th>
        </tr>
       </thead>
       <tbody>
        {filteredUsers.map((user) => (
         <tr key={user.uid} className="border-t border-gray-300/30 hover:bg-white/30 transition-colors">
          <td className="p-4">
           <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-md" style={{ backgroundColor: user.role === 'creator' ? '#20B2AA' : '#91A6EB' }}>
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
           <div className="flex items-center gap-2" style={{ color: '#000000' }}>
            {getRoleIcon(user.role)}
            <span className="capitalize">{user.role}</span>
           </div>
          </td>

          <td className="p-4">
           <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(user.status)}`}>
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

    {/* User Actions Modal */}
    {selectedUser && (
     <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-2xl border border-white/50 max-w-md w-full mx-4 p-6">
       <h3 className="text-2xl font-heading mb-6" style={{ color: '#000000' }}>User Actions</h3>

       <div className="space-y-3 mb-6">
        <div className="flex items-center gap-3 p-3 rounded-lg bg-white/60 border border-gray-300/30">
         <Mail className="w-5 h-5" style={{ color: '#91A6EB' }} />
         <span className="text-sm" style={{ color: '#000000' }}>{selectedUser.email}</span>
        </div>

        <div className="flex items-center gap-3 p-3 rounded-lg bg-white/60 border border-gray-300/30">
         <Shield className="w-5 h-5" style={{ color: '#20B2AA' }} />
         <span className="text-sm capitalize" style={{ color: '#000000' }}>{selectedUser.role}</span>
        </div>

        <div className="flex items-center gap-3 p-3 rounded-lg bg-white/60 border border-gray-300/30">
         <Calendar className="w-5 h-5" style={{ color: '#FF6B35' }} />
         <span className="text-sm" style={{ color: '#000000' }}>Joined {selectedUser.createdAt.toLocaleDateString()}</span>
        </div>
       </div>
       
       <div className="space-y-4">
        {/* Role Selector */}
        <div className="space-y-2">
         <label className="text-sm font-semibold" style={{ color: '#000000' }}>Change Role</label>
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
          <option value="user">Athlete</option>
          <option value="creator">Coach</option>
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
             updateUserRole(selectedUser.uid, 'creator')
            }
           }}
           disabled={selectedUser.role === 'creator'}
           className="px-4 py-2 rounded-lg text-white font-semibold transition-all disabled:opacity-50"
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
             updateUserRole(selectedUser.uid, 'user')
            }
           }}
           disabled={selectedUser.role === 'user'}
           className="px-4 py-2 rounded-lg text-white font-semibold transition-all disabled:opacity-50"
           style={{ backgroundColor: '#91A6EB' }}
          >
           <div className="flex items-center justify-center gap-1">
            <Users className="w-4 h-4" />
            <span className="text-sm">Make Athlete</span>
           </div>
          </button>
         </div>
        </div>

        {/* Status Actions */}
        <div className="border-t border-gray-300/30 pt-4 space-y-2">
         <button
          onClick={() => updateUserStatus(selectedUser.uid, 'active')}
          disabled={selectedUser.status === 'active'}
          className="w-full px-4 py-2 border border-gray-300/50 rounded-lg font-semibold transition-all hover:bg-black/5 disabled:opacity-50"
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
          className="w-full px-4 py-2 border border-gray-300/50 rounded-lg font-semibold transition-all hover:bg-black/5 disabled:opacity-50"
          style={{ color: '#000000' }}
         >
          <div className="flex items-center justify-center gap-2">
           <UserX className="w-4 h-4" />
           <span>Suspend User</span>
          </div>
         </button>
        </div>

        <button
         onClick={() => setSelectedUser(null)}
         className="w-full px-4 py-3 bg-black text-white rounded-lg font-semibold hover:bg-black/90 transition-all mt-4"
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
