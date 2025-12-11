import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-utils'
import { adminDb as db } from '@/lib/firebase.admin'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * PUT /api/admin/update-baked-profile
 * 
 * Update a baked profile. Only allowed if status is 'pending' (not ready yet).
 * Admin only.
 */
export async function PUT(request: NextRequest) {
  try {
    // Require admin authentication
    const authResult = await requireAuth(request, ['admin', 'superadmin'])
    
    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      )
    }
    
    const body = await request.json()
    const { bakedProfileId, ...updateData } = body
    
    if (!bakedProfileId) {
      return NextResponse.json(
        { error: 'Missing bakedProfileId' },
        { status: 400 }
      )
    }
    
    // Get current baked profile
    const bakedProfileRef = db.collection('baked_profiles').doc(bakedProfileId)
    const bakedProfileDoc = await bakedProfileRef.get()
    
    if (!bakedProfileDoc.exists) {
      return NextResponse.json(
        { error: 'Baked profile not found' },
        { status: 404 }
      )
    }
    
    const currentData = bakedProfileDoc.data()
    
    // SECURITY: Only allow updates if status is 'pending' (not ready yet)
    if (currentData?.status === 'ready') {
      return NextResponse.json(
        { error: 'Cannot update baked profile that is marked as ready. Profile is locked for editing.' },
        { status: 403 }
      )
    }
    
    if (currentData?.status === 'transferred') {
      return NextResponse.json(
        { error: 'Cannot update baked profile that has been transferred' },
        { status: 403 }
      )
    }
    
    // AIRTIGHT: Normalize and validate email if provided
    if (updateData.targetEmail) {
      const normalizedEmail = updateData.targetEmail.toLowerCase().trim()
      if (!normalizedEmail || !normalizedEmail.includes('@')) {
        return NextResponse.json(
          { error: 'Invalid email address' },
          { status: 400 }
        )
      }
      updateData.targetEmail = normalizedEmail
      updateData.email = normalizedEmail
    }
    
    // AIRTIGHT: Use transaction to ensure atomic update
    await db.runTransaction(async (transaction) => {
      // Re-read to ensure status hasn't changed
      const latestDoc = await transaction.get(bakedProfileRef)
      if (!latestDoc.exists) {
        throw new Error('Baked profile not found')
      }
      
      const latestData = latestDoc.data()
      
      // Double-check status
      if (latestData?.status === 'ready') {
        throw new Error('Cannot update baked profile that is marked as ready. Profile is locked for editing.')
      }
      
      if (latestData?.status === 'transferred') {
        throw new Error('Cannot update baked profile that has been transferred')
      }
      
      transaction.update(bakedProfileRef, {
        ...updateData,
        updatedAt: new Date()
      })
    })
    
    console.log(`✅ Baked profile updated: ${bakedProfileId}`)
    
    return NextResponse.json({
      success: true,
      message: 'Baked profile updated successfully'
    })
    
  } catch (error) {
    console.error('Error updating baked profile:', error)
    return NextResponse.json(
      { error: 'Failed to update baked profile' },
      { status: 500 }
    )
  }
}

