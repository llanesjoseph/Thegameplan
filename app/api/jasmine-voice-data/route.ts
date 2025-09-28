import { NextRequest, NextResponse } from 'next/server'
import { getJasminePrePopulatedData } from '@/lib/jasmine-provisioning'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const ingestionId = searchParams.get('ingestionId')

    if (!ingestionId) {
      return NextResponse.json(
        { error: 'Ingestion ID is required' },
        { status: 400 }
      )
    }

    // Only provide data for Jasmine's special ingestion links
    if (!ingestionId.startsWith('jasmine-special-')) {
      return NextResponse.json(
        { error: 'Pre-populated data not available for this invitation' },
        { status: 403 }
      )
    }

    const prePopulatedData = getJasminePrePopulatedData()

    return NextResponse.json({
      success: true,
      data: prePopulatedData
    })

  } catch (error) {
    console.error('Jasmine voice data API error:', error)

    return NextResponse.json(
      { error: 'Failed to retrieve pre-populated data' },
      { status: 500 }
    )
  }
}