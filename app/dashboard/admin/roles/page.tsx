'use client'

import { useAuth } from '@/hooks/use-auth'
import { useState, useEffect } from 'react'
import { db } from '@/lib/firebase'
import { collection, getDocs, doc, updateDoc, query, orderBy } from 'firebase/firestore'
import {
 Crown,
 Award,
 UserCheck,
 User,
 Search,
 Filter,
 MoreVertical,
 Edit,
 Save,
 X
} from 'lucide-react'

interface UserData {
 id: string
 displayName?: string
 email?: string
 role: string
 createdAt?: any
 updatedAt?: any
}

export default function RoleManagement() {
 const { user } = useAuth()
 const [users, setUsers] = useState<UserData[]>([])
 const [loading, setLoading] = useState(true)
 const [searchTerm, setSearchTerm] = useState('')
 const [roleFilter, setRoleFilter] = useState('all')
 const [editingUser, setEditingUser] = useState<string | null>(null)
 const [editingRole, setEditingRole] = useState('')

 useEffect(() => {
  const loadUsers = async () => {
   try {
    const usersRef = collection(db, 'users')
    const q = query(usersRef, orderBy('createdAt', 'desc'))
    const snapshot = await getDocs(q)
    const userData = snapshot.docs.map(doc => ({
     id: doc.id,
     ...doc.data()
    })) as UserData[]
    setUsers(userData)
   } catch (error) {
    console.error('Error loading users:', error)
   } finally {
    setLoading(false)
   }
  }

  if (user?.role === 'superadmin') {
   loadUsers()
  }
 }, [user])

 const handleRoleUpdate = async (userId: string, newRole: string) => {
  try {
   await updateDoc(doc(db, 'users', userId), {
    role: newRole,
    updatedAt: new Date()
   })

   setUsers(users.map(u =>
    u.id === userId ? { ...u, role: newRole } : u
   ))
   setEditingUser(null)
  } catch (error) {
   console.error('Error updating role:', error)
  }
 }

 const getRoleIcon = (role: string) => {
  switch (role) {
   case 'superadmin':
    return <Crown className="w-4 h-4 text-red-600" />
   case 'creator':
    return <Award className="w-4 h-4 text-black" />
   case 'assistant_coach':
    return <UserCheck className="w-4 h-4 text-indigo-600" />
   default:
    return <User className="w-4 h-4 text-teal-600" />
  }
 }

 const getRoleBadge = (role: string) => {
  const configs = {
   superadmin: { bg: 'bg-red-100', text: 'text-red-800', label: 'Super Admin' },
   creator: { bg: 'bg-black/10', text: 'text-black', label: 'Coach' },
   assistant_coach: { bg: 'bg-indigo-100', text: 'text-indigo-800', label: 'Assistant Coach' },
   user: { bg: 'bg-teal-100', text: 'text-teal-800', label: 'Athlete' }
  }
  const config = configs[role as keyof typeof configs] || configs.user
  return (
   <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs  ${config.bg} ${config.text}`}>
    {getRoleIcon(role)}
    <span className="ml-1">{config.label}</span>
   </span>
  )
 }

 const filteredUsers = users.filter(user => {
  const matchesSearch = user.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
             user.email?.toLowerCase().includes(searchTerm.toLowerCase())
  const matchesRole = roleFilter === 'all' || user.role === roleFilter
  return matchesSearch && matchesRole
 })

 if (user?.role !== 'superadmin') {
  return (
   <div className="flex items-center justify-center min-h-screen" style={{ backgroundColor: '#E8E6D8' }}>
    <div className="text-center">
     <Crown className="w-12 h-12 mx-auto mb-4 text-red-600" />
     <h1 className="text-2xl mb-2" style={{ color: '#000000' }}>
      Access Denied
     </h1>
     <p style={{ color: '#666' }}>
      This page is restricted to super administrators only.
     </p>
    </div>
   </div>
  )
 }

 if (loading) {
  return (
   <div className="flex items-center justify-center min-h-screen" style={{ backgroundColor: '#E8E6D8' }}>
    <div className="text-center">
     <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black mx-auto"></div>
     <p className="mt-2 text-black">Loading role management...</p>
    </div>
   </div>
  )
 }

 return (
  <div className="min-h-screen" style={{ backgroundColor: '#E8E6D8' }}>
   <div className="max-w-6xl mx-auto p-6">
    {/* Header */}
    <div className="mb-8">
     <div className="flex items-center gap-3 mb-4">
      <Crown className="w-8 h-8 text-red-600" />
      <h1 className="text-3xl " style={{ color: '#000000' }}>
       Role Management
      </h1>
     </div>
     <p style={{ color: '#666' }}>
      Manage user roles and permissions across the platform
     </p>
    </div>

    {/* Filters */}
    <div className="bg-white/80 rounded-xl p-6 mb-6">
     <div className="flex flex-col md:flex-row gap-4">
      <div className="flex-1">
       <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
         type="text"
         placeholder="Search users by name or email..."
         value={searchTerm}
         onChange={(e) => setSearchTerm(e.target.value)}
         className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
        />
       </div>
      </div>
      <div className="flex items-center gap-2">
       <Filter className="w-4 h-4 text-gray-500" />
       <select
        value={roleFilter}
        onChange={(e) => setRoleFilter(e.target.value)}
        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
       >
        <option value="all">All Roles</option>
        <option value="user">Athletes</option>
        <option value="creator">Coaches</option>
        <option value="assistant_coach">Assistant Coaches</option>
        <option value="superadmin">Super Admins</option>
       </select>
      </div>
     </div>
    </div>

    {/* Users Table */}
    <div className="bg-white/80 rounded-xl overflow-hidden">
     <div className="overflow-x-auto">
      <table className="w-full">
       <thead style={{ backgroundColor: '#91A6EB' }}>
        <tr>
         <th className="text-left py-4 px-6 text-white ">User</th>
         <th className="text-left py-4 px-6 text-white ">Email</th>
         <th className="text-left py-4 px-6 text-white ">Current Role</th>
         <th className="text-left py-4 px-6 text-white ">Actions</th>
        </tr>
       </thead>
       <tbody>
        {filteredUsers.map((userData, index) => (
         <tr
          key={userData.id}
          className={`border-b border-gray-100 hover:bg-gray-50/50 ${
           index % 2 === 0 ? 'bg-white/40' : 'bg-white/20'
          }`}
         >
          <td className="py-4 px-6">
           <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-sky-blue to-black flex items-center justify-center text-white ">
             {(userData.displayName || userData.email || 'U').charAt(0).toUpperCase()}
            </div>
            <div>
             <div className="" style={{ color: '#000000' }}>
              {userData.displayName || 'No name'}
             </div>
             <div className="text-sm text-gray-500">
              ID: {userData.id.substring(0, 8)}...
             </div>
            </div>
           </div>
          </td>
          <td className="py-4 px-6">
           <span style={{ color: '#666' }}>
            {userData.email || 'No email'}
           </span>
          </td>
          <td className="py-4 px-6">
           {getRoleBadge(userData.role)}
          </td>
          <td className="py-4 px-6">
           {editingUser === userData.id ? (
            <div className="flex items-center gap-2">
             <select
              value={editingRole}
              onChange={(e) => setEditingRole(e.target.value)}
              className="px-2 py-1 border border-gray-300 rounded text-sm"
             >
              <option value="user">Athlete</option>
              <option value="creator">Coach</option>
              <option value="assistant_coach">Assistant Coach</option>
              <option value="superadmin">Super Admin</option>
             </select>
             <button
              onClick={() => handleRoleUpdate(userData.id, editingRole)}
              className="p-1 text-green-600 hover:text-green-800"
             >
              <Save className="w-4 h-4" />
             </button>
             <button
              onClick={() => setEditingUser(null)}
              className="p-1 text-red-600 hover:text-red-800"
             >
              <X className="w-4 h-4" />
             </button>
            </div>
           ) : (
            <button
             onClick={() => {
              setEditingUser(userData.id)
              setEditingRole(userData.role)
             }}
             className="flex items-center gap-1 px-3 py-1 text-sm text-gray-600 hover:text-black hover:bg-gray-100 rounded transition-colors"
            >
             <Edit className="w-4 h-4" />
             Edit Role
            </button>
           )}
          </td>
         </tr>
        ))}
       </tbody>
      </table>
     </div>
    </div>

    {/* Summary Stats */}
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
     <div className="bg-white/80 rounded-xl p-4 text-center">
      <div className="text-2xl " style={{ color: '#000000' }}>
       {users.filter(u => u.role === 'user').length}
      </div>
      <div className="text-sm text-gray-600">Athletes</div>
     </div>
     <div className="bg-white/80 rounded-xl p-4 text-center">
      <div className="text-2xl " style={{ color: '#000000' }}>
       {users.filter(u => u.role === 'creator').length}
      </div>
      <div className="text-sm text-gray-600">Coaches</div>
     </div>
     <div className="bg-white/80 rounded-xl p-4 text-center">
      <div className="text-2xl " style={{ color: '#000000' }}>
       {users.filter(u => u.role === 'assistant_coach').length}
      </div>
      <div className="text-sm text-gray-600">Assistant Coaches</div>
     </div>
     <div className="bg-white/80 rounded-xl p-4 text-center">
      <div className="text-2xl " style={{ color: '#000000' }}>
       {users.filter(u => u.role === 'superadmin').length}
      </div>
      <div className="text-sm text-gray-600">Super Admins</div>
     </div>
    </div>
   </div>
  </div>
 )
}