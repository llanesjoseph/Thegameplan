'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { useEnhancedRole } from '@/hooks/use-role-switcher'
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
  
  const { user } = useAuth()
  const { role } = useEnhancedRole()

  useEffect(() => {
    if (user && (role === 'admin' || role === 'superadmin')) {
      loadUsers()
    }
  }, [user, role])

  useEffect(() => {
    filterUsers()
  }, [users, searchTerm, statusFilter, roleFilter])

  const loadUsers = async () => {
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
  }

  const filterUsers = () => {
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
  }

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
      const response = await fetch('/api/set-user-role', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          targetUserId: uid,
          newRole: newRole
        })
      })

      if (response.ok) {
        // Update local state
        setUsers(users.map(u => u.uid === uid ? { ...u, role: newRole } : u))
        console.log(`User role updated to ${newRole}`)
      } else {
        console.error('Failed to update user role')
      }
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

  if (role !== 'admin' && role !== 'superadmin') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
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
          <p className="mt-4 text-brand-grey">Loading users...</p>
        </div>
      </div>
    )
  }

  return (
    <main className="min-h-screen py-16">
      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold mb-4">User Management</h1>
          <p className="text-xl text-brand-grey">
            Manage user accounts, roles, and support requests
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <div className="card text-center">
            <div className="text-3xl font-bold text-blue-400 mb-2">
              {users.filter(u => u.status === 'active').length}
            </div>
            <div className="text-sm text-brand-grey">Active Users</div>
          </div>
          <div className="card text-center">
            <div className="text-3xl font-bold text-purple-400 mb-2">
              {users.filter(u => u.role === 'creator').length}
            </div>
            <div className="text-sm text-brand-grey">Creators</div>
          </div>
          <div className="card text-center">
            <div className="text-3xl font-bold text-green-400 mb-2">
              {users.filter(u => u.status === 'pending').length}
            </div>
            <div className="text-sm text-brand-grey">Pending</div>
          </div>
          <div className="card text-center">
            <div className="text-3xl font-bold text-orange-400 mb-2">
              {users.filter(u => u.status === 'suspended').length}
            </div>
            <div className="text-sm text-brand-grey">Suspended</div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="card mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-brand-grey" />
                <input
                  type="text"
                  placeholder="Search users by name, email, sport, or location..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="input w-full pl-10"
                />
              </div>
            </div>
            
            <div className="flex gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="input"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="pending">Pending</option>
                <option value="suspended">Suspended</option>
              </select>
              
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="input"
              >
                <option value="all">All Roles</option>
                <option value="user">Users</option>
                <option value="creator">Creators</option>
                <option value="admin">Admins</option>
                <option value="superadmin">Super Admins</option>
              </select>
            </div>
          </div>
        </div>

        {/* Users Table */}
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-white/5">
                <tr>
                  <th className="text-left p-4 font-medium">User</th>
                  <th className="text-left p-4 font-medium">Role</th>
                  <th className="text-left p-4 font-medium">Status</th>
                  <th className="text-left p-4 font-medium">Sport/Level</th>
                  <th className="text-left p-4 font-medium">Location</th>
                  <th className="text-left p-4 font-medium">Joined</th>
                  <th className="text-left p-4 font-medium">Last Active</th>
                  <th className="text-center p-4 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr key={user.uid} className="border-t border-white/10 hover:bg-white/5">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center">
                          {getRoleIcon(user.role)}
                        </div>
                        <div>
                          <div className="font-medium">
                            {user.displayName || 'No Name'}
                          </div>
                          <div className="text-sm text-brand-grey">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        {getRoleIcon(user.role)}
                        <span className="capitalize">{user.role}</span>
                      </div>
                    </td>
                    
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(user.status)}`}>
                        {user.status}
                      </span>
                    </td>
                    
                    <td className="p-4">
                      <div className="text-sm">
                        <div>{user.sport || 'Not specified'}</div>
                        <div className="text-brand-grey">{user.level || ''}</div>
                      </div>
                    </td>
                    
                    <td className="p-4">
                      <div className="text-sm">{user.location || 'Not specified'}</div>
                    </td>
                    
                    <td className="p-4">
                      <div className="text-sm text-brand-grey">
                        {user.createdAt.toLocaleDateString()}
                      </div>
                    </td>
                    
                    <td className="p-4">
                      <div className="text-sm text-brand-grey">
                        {user.lastActive.toLocaleDateString()}
                      </div>
                    </td>
                    
                    <td className="p-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => setSelectedUser(user)}
                          className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                        >
                          <MoreHorizontal className="w-4 h-4" />
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
        <div className="mt-6 text-center text-sm text-brand-grey">
          Showing {filteredUsers.length} of {users.length} users
        </div>

        {/* User Actions Modal */}
        {selectedUser && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="card max-w-md w-full mx-4">
              <h3 className="text-xl font-semibold mb-4">User Actions</h3>
              
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-white/5">
                  <Mail className="w-5 h-5 text-blue-400" />
                  <span className="text-sm">{selectedUser.email}</span>
                </div>
                
                <div className="flex items-center gap-3 p-3 rounded-lg bg-white/5">
                  <Shield className="w-5 h-5 text-purple-400" />
                  <span className="text-sm capitalize">{selectedUser.role}</span>
                </div>
                
                <div className="flex items-center gap-3 p-3 rounded-lg bg-white/5">
                  <Calendar className="w-5 h-5 text-green-400" />
                  <span className="text-sm">Joined {selectedUser.createdAt.toLocaleDateString()}</span>
                </div>
              </div>
              
              <div className="mt-6 space-y-3">
                {/* Role Selector */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Change Role</label>
                  <select
                    value={selectedUser.role}
                    onChange={(e) => updateUserRole(selectedUser.uid, e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cardinal focus:border-cardinal bg-white text-gray-900"
                  >
                    <option value="user">User</option>
                    <option value="creator">Creator</option>
                    <option value="admin">Admin</option>
                    {role === 'superadmin' && (
                      <option value="superadmin">Super Admin</option>
                    )}
                  </select>
                  <p className="text-xs text-gray-500">
                    {role === 'superadmin'
                      ? 'You can assign any role including Super Admin'
                      : 'You can assign User, Creator, or Admin roles'
                    }
                  </p>
                </div>

                {/* Status Actions */}
                <div className="border-t pt-3 space-y-2">
                  <button
                    onClick={() => updateUserStatus(selectedUser.uid, 'active')}
                    disabled={selectedUser.status === 'active'}
                    className="btn btn-sm btn-outline w-full disabled:opacity-50"
                  >
                    <UserCheck className="w-4 h-4 mr-2" />
                    Activate User
                  </button>

                  <button
                    onClick={() => updateUserStatus(selectedUser.uid, 'suspended')}
                    disabled={selectedUser.status === 'suspended'}
                    className="btn btn-sm btn-outline w-full disabled:opacity-50"
                  >
                    <UserX className="w-4 h-4 mr-2" />
                    Suspend User
                  </button>
                </div>

                <button
                  onClick={() => setSelectedUser(null)}
                  className="btn btn-sm w-full mt-4"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
