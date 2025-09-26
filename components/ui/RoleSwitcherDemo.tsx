'use client'

import { useEnhancedRole } from '@/hooks/use-role-switcher'
import { Shield, AlertCircle, CheckCircle } from 'lucide-react'

export default function RoleSwitcherDemo() {
 const { 
  effectiveRole, 
  originalRole, 
  isTestingMode, 
  canSwitchRoles 
 } = useEnhancedRole()

 if (!canSwitchRoles) {
  return null
 }

 return (
  <div className="fixed bottom-4 right-4 z-40 group">
   {/* Compact Debug Indicator */}
   <div className="bg-red-500/90 hover:bg-red-500 text-white px-3 py-2 rounded-full shadow-lg transition-all duration-300 cursor-pointer">
    <div className="flex items-center gap-2">
     <Shield className="w-4 h-4" />
     <span className="text-xs ">
      {isTestingMode ? `${effectiveRole.charAt(0).toUpperCase() + effectiveRole.slice(1)} (Testing)` : 'SA'}
     </span>
     {isTestingMode && (
      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
     )}
    </div>
   </div>

   {/* Detailed Panel (shows on hover) */}
   <div className="absolute bottom-full right-0 mb-2 bg-gray-900/95 backdrop-blur-sm border border-white/20 rounded-lg p-4 shadow-xl min-w-64 opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none group-hover:pointer-events-auto">
    <div className="flex items-center gap-2 mb-3">
     <Shield className="w-5 h-5 text-red-400" />
     <span className=" text-red-400">Super Admin Debug</span>
    </div>
    
    <div className="space-y-2 text-sm">
     <div className="flex justify-between">
      <span className="text-gray-400">Your Role:</span>
      <span className=" text-blue-400">{originalRole}</span>
     </div>
     
     <div className="flex justify-between">
      <span className="text-gray-400">Current View:</span>
      <span className=" text-white">{effectiveRole}</span>
     </div>
     
     <div className="flex justify-between items-center">
      <span className="text-gray-400">Testing Mode:</span>
      <div className="flex items-center gap-1">
       {isTestingMode ? (
        <CheckCircle className="w-4 h-4 text-green-400" />
       ) : (
        <AlertCircle className="w-4 h-4 text-gray-400" />
       )}
       <span className={` ${
        isTestingMode ? 'text-green-400' : 'text-gray-400'
       }`}>
        {isTestingMode ? 'Active' : 'Inactive'}
       </span>
      </div>
     </div>
     
     {isTestingMode && (
      <div className="mt-3 p-2 bg-yellow-500/20 border border-yellow-500/30 rounded text-xs text-yellow-300">
       Note: You&apos;re viewing as {effectiveRole}. 
       Use the profile dropdown to switch roles.
      </div>
     )}
    </div>
    
    {/* Arrow pointing to the compact indicator */}
    <div className="absolute bottom-0 right-4 transform translate-y-1/2">
     <div className="w-2 h-2 bg-gray-900 rotate-45 border-r border-b border-white/20"></div>
    </div>
   </div>
  </div>
 )
}