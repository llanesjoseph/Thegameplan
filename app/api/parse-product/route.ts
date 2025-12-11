import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

export const dynamic = 'force-dynamic'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

/**
 * AI-Powered Product Link Parser
 *
 * Takes a product URL and uses Gemini to extract:
 * - Product name
 * - Price
 * - Description
 * - Image URL
 * - Category
 * - Tags
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { productUrl } = body

    if (!productUrl || typeof productUrl !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Product URL is required' },
        { status: 400 }
      )
    }

    // Validate URL format
    try {
      new URL(productUrl)
    } catch {
      return NextResponse.json(
        { success: false, error: 'Invalid URL format' },
        { status: 400 }
      )
    }

    console.log('🔍 Parsing product URL:', productUrl)

    // Fetch the product page HTML
    let pageContent: string
    try {
      const response = await fetch(productUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      })
      pageContent = await response.text()

      // Truncate if too long (Gemini has token limits)
      if (pageContent.length > 30000) {
        pageContent = pageContent.substring(0, 30000)
      }
    } catch (fetchError) {
      console.error('Error fetching product page:', fetchError)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch product page. The URL may be invalid or blocked.' },
        { status: 400 }
      )
    }

    // Use Gemini to parse product details
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' })

    const prompt = `You are a product information extractor. Analyze this product webpage and extract the following information in JSON format:

{
  "name": "Product name",
  "price": "Price (format: $XXX or $XX.XX)",
  "description": "Brief product description (2-3 sentences max)",
  "imageUrl": "Main product image URL (full URL, not relative)",
  "category": "One of: Cleats, Shoes, Apparel, Protective Gear, Equipment, Accessories, Training Aids, Recovery, Nutrition, Technology",
  "tags": ["tag1", "tag2", "tag3"] (3-5 descriptive tags like "lightweight", "professional", "durable")
}

IMPORTANT RULES:
1. Extract the actual price in the format $XXX.XX or $XXX (e.g., "$185.99" or "$49")
2. Description should be concise, highlighting key features
3. Image URL must be a complete URL starting with http:// or https://
4. Category must be one of the exact categories listed above
5. Tags should be specific characteristics (not generic words)
6. If any field cannot be found, use null

Product URL: ${productUrl}

HTML Content (truncated):
${pageContent}

Return ONLY the JSON object, no other text.`

    const result = await model.generateContent(prompt)
    const response = result.response
    const text = response.text()

    console.log('🤖 AI Response:', text)

    // Parse the JSON response
    let productData
    try {
      // Extract JSON from markdown code blocks if present
      const jsonMatch = text.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/)
      const jsonString = jsonMatch ? jsonMatch[1] : text
      productData = JSON.parse(jsonString.trim())
    } catch (parseError) {
      console.error('Error parsing AI response:', parseError)
      return NextResponse.json(
        { success: false, error: 'Failed to parse product details. Please try again or enter manually.' },
        { status: 500 }
      )
    }

    // Validate extracted data
    if (!productData.name) {
      return NextResponse.json(
        { success: false, error: 'Could not extract product name. Please enter details manually.' },
        { status: 400 }
      )
    }

    console.log('✅ Successfully parsed product:', productData.name)

    return NextResponse.json({
      success: true,
      product: {
        name: productData.name || '',
        price: productData.price || '',
        description: productData.description || '',
        imageUrl: productData.imageUrl || null,
        category: productData.category || '',
        tags: Array.isArray(productData.tags) ? productData.tags : [],
        affiliateLink: productUrl // Original URL becomes the affiliate link
      }
    })

  } catch (error) {
    console.error('Error in parse-product API:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error. Please try again or enter details manually.',
        details: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
      },
      { status: 500 }
    )
  }
}
