import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { CheckoutButton } from '@/components/subscription/CheckoutButton'

// Mock Firebase functions
const mockHttpsCallable = jest.fn()
jest.mock('firebase/functions', () => ({
  getFunctions: jest.fn(),
  httpsCallable: () => mockHttpsCallable,
}))

describe('CheckoutButton', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders checkout button with correct text', () => {
    render(<CheckoutButton />)
    
    const button = screen.getByRole('button', { name: /subscribe/i })
    expect(button).toBeInTheDocument()
  })

  it('shows loading state when clicked', async () => {
    mockHttpsCallable.mockResolvedValue({
      data: { url: 'https://checkout.stripe.com/test' }
    })

    // Mock window.open
    const mockOpen = jest.fn()
    Object.defineProperty(window, 'open', {
      value: mockOpen,
    })

    render(<CheckoutButton />)
    
    const button = screen.getByRole('button', { name: /subscribe/i })
    fireEvent.click(button)

    expect(screen.getByText(/processing/i)).toBeInTheDocument()

    await waitFor(() => {
      expect(mockHttpsCallable).toHaveBeenCalledWith({ plan: 'basic' })
      expect(mockOpen).toHaveBeenCalledWith(
        'https://checkout.stripe.com/test',
        '_blank'
      )
    })
  })

  it('handles checkout error gracefully', async () => {
    mockHttpsCallable.mockRejectedValue(new Error('Checkout failed'))

    // Mock console.error to avoid noise in tests
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation()

    render(<CheckoutButton />)
    
    const button = screen.getByRole('button', { name: /subscribe/i })
    fireEvent.click(button)

    await waitFor(() => {
      expect(button).not.toBeDisabled()
      expect(screen.getByText(/subscribe/i)).toBeInTheDocument()
    })

    consoleSpy.mockRestore()
  })

  it('accepts custom plan prop', async () => {
    mockHttpsCallable.mockResolvedValue({
      data: { url: 'https://checkout.stripe.com/test' }
    })

    const mockOpen = jest.fn()
    Object.defineProperty(window, 'open', {
      value: mockOpen,
    })

    render(<CheckoutButton plan="premium" />)
    
    const button = screen.getByRole('button')
    fireEvent.click(button)

    await waitFor(() => {
      expect(mockHttpsCallable).toHaveBeenCalledWith({ plan: 'premium' })
    })
  })
})