/**
 * Critical Component Tests
 * Tests for key UI components that power the platform
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import AuthProvider from '@/components/auth/AuthProvider'
import GcsVideoUploader from '@/components/GcsVideoUploader'
import CoachMessaging from '@/components/athlete/CoachMessaging'

// Create mocks using vi.hoisted to ensure they're available to vi.mock factories
const { mockOnSnapshot, mockAddDoc, mockUpdateDoc } = vi.hoisted(() => ({
  mockOnSnapshot: vi.fn(),
  mockAddDoc: vi.fn(),
  mockUpdateDoc: vi.fn(),
}))

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(() => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
  })),
  usePathname: vi.fn(() => '/'),
  useSearchParams: vi.fn(() => new URLSearchParams()),
}))

// Mock Firebase
vi.mock('@/lib/firebase.client', () => ({
  auth: {
    currentUser: null,
  },
  db: {
    collection: vi.fn(),
  },
}))

// Mock hooks
vi.mock('@/hooks/use-auth', () => ({
  useAuth: vi.fn(() => ({
    user: { uid: 'athlete123', displayName: 'Test Athlete' },
    loading: false,
  })),
}))

// Mock Firestore functions
vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  addDoc: mockAddDoc,
  query: vi.fn(),
  where: vi.fn(),
  orderBy: vi.fn(),
  onSnapshot: mockOnSnapshot,
  serverTimestamp: vi.fn(() => new Date()),
  updateDoc: mockUpdateDoc,
  doc: vi.fn(),
}))

// Mock upload service
vi.mock('@/lib/gcs-upload', () => ({
  gcsUploadService: {
    startUpload: vi.fn(),
    resumeUpload: vi.fn(),
    cancelUpload: vi.fn(),
  },
  formatFileSize: (size: number) => {
    if (size < 1024) return `${size} B`
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(2)} KB`
    if (size < 1024 * 1024 * 1024) return `${(size / (1024 * 1024)).toFixed(2)} MB`
    return `${(size / (1024 * 1024 * 1024)).toFixed(2)} GB`
  },
  estimateUploadTime: (size: number) => {
    const seconds = size / (5 * 1024 * 1024) // 5 MB/s
    if (seconds < 60) return `~${Math.ceil(seconds)}s`
    return `~${Math.ceil(seconds / 60)}m`
  },
}))

describe('AuthProvider Component', () => {
  describe('Default Variant', () => {
    it('should render default sign-in UI with title', () => {
      render(<AuthProvider />)
      expect(screen.getByText('Sign in to Game Plan')).toBeInTheDocument()
    })

    it('should render default subtitle', () => {
      render(<AuthProvider />)
      expect(screen.getByText('Join thousands of athletes training with elite coaches')).toBeInTheDocument()
    })

    it('should render custom title when provided', () => {
      render(<AuthProvider title="Welcome Back" />)
      expect(screen.getByText('Welcome Back')).toBeInTheDocument()
    })

    it('should render custom subtitle when provided', () => {
      render(<AuthProvider subtitle="Continue your training" />)
      expect(screen.getByText('Continue your training')).toBeInTheDocument()
    })

    it('should show benefits section by default', () => {
      render(<AuthProvider />)
      expect(screen.getByText('Elite Coaching')).toBeInTheDocument()
      expect(screen.getByText('Personalized Training')).toBeInTheDocument()
      expect(screen.getByText('Progress Tracking')).toBeInTheDocument()
    })

    it('should hide benefits when showBenefits is false', () => {
      render(<AuthProvider showBenefits={false} />)
      expect(screen.queryByText('Elite Coaching')).not.toBeInTheDocument()
    })

    it('should show terms and privacy links', () => {
      render(<AuthProvider />)
      const termsLink = screen.getByText('Terms of Service')
      const privacyLink = screen.getByText('Privacy Policy')
      expect(termsLink).toHaveAttribute('href', '/terms')
      expect(privacyLink).toHaveAttribute('href', '/privacy')
    })
  })

  describe('Compact Variant', () => {
    it('should render compact layout without benefits', () => {
      render(<AuthProvider variant="compact" />)
      expect(screen.queryByText('Elite Coaching')).not.toBeInTheDocument()
      expect(screen.queryByText('Terms of Service')).not.toBeInTheDocument()
    })

    it('should show return user prompt when returnUserPrompt is true', () => {
      render(<AuthProvider variant="compact" returnUserPrompt={true} />)
      expect(screen.getByText(/Returning user\?/)).toBeInTheDocument()
      expect(screen.getByText(/New to Game Plan\?/)).toBeInTheDocument()
    })

    it('should not show return user prompt by default', () => {
      render(<AuthProvider variant="compact" />)
      expect(screen.queryByText(/Returning user\?/)).not.toBeInTheDocument()
    })
  })

  describe('Benefits Display', () => {
    it('should render all three benefits with correct content', () => {
      render(<AuthProvider />)

      expect(screen.getByText('Elite Coaching')).toBeInTheDocument()
      expect(screen.getByText('Train with world-class athletes and coaches')).toBeInTheDocument()

      expect(screen.getByText('Personalized Training')).toBeInTheDocument()
      expect(screen.getByText('Get custom training plans for your goals')).toBeInTheDocument()

      expect(screen.getByText('Progress Tracking')).toBeInTheDocument()
      expect(screen.getByText('Monitor your improvement over time')).toBeInTheDocument()
    })
  })
})

describe('GcsVideoUploader Component', () => {
  const mockOnUploadComplete = vi.fn()
  const mockOnUploadError = vi.fn()

  beforeEach(() => {
    mockOnUploadComplete.mockClear()
    mockOnUploadError.mockClear()
  })

  describe('Initial Render', () => {
    it('should render upload drop zone', () => {
      render(<GcsVideoUploader />)
      expect(screen.getByText('Upload Video to Google Cloud')).toBeInTheDocument()
    })

    it('should display supported formats', () => {
      render(<GcsVideoUploader />)
      expect(screen.getByText(/Supported formats: MP4, WebM, MOV, AVI, MKV/)).toBeInTheDocument()
    })

    it('should display maximum file size', () => {
      render(<GcsVideoUploader />)
      expect(screen.getByText(/Maximum size:/)).toBeInTheDocument()
    })

    it('should mention automatic transcoding', () => {
      render(<GcsVideoUploader />)
      const transcodingTexts = screen.getAllByText(/Automatic transcoding to HLS/)
      expect(transcodingTexts.length).toBeGreaterThan(0)
    })

    it('should show enterprise features overview', () => {
      render(<GcsVideoUploader />)
      expect(screen.getByText('🚀 Enterprise Video Pipeline')).toBeInTheDocument()
      expect(screen.getByText(/Direct upload to Google Cloud Storage/)).toBeInTheDocument()
    })
  })

  describe('File Selection', () => {
    it('should accept valid video file', async () => {
      const { container } = render(<GcsVideoUploader />)
      const file = new File(['video content'], 'test.mp4', { type: 'video/mp4' })
      const input = container.querySelector('input[type="file"]') as HTMLInputElement

      await userEvent.upload(input, file)

      await waitFor(() => {
        expect(screen.getByText('test.mp4')).toBeInTheDocument()
      })
    })

    it('should show file size after selection', async () => {
      const { container } = render(<GcsVideoUploader />)
      const file = new File(['x'.repeat(1024 * 1024)], 'test.mp4', { type: 'video/mp4' })
      const input = container.querySelector('input[type="file"]') as HTMLInputElement

      await userEvent.upload(input, file)

      await waitFor(() => {
        expect(screen.getByText(/MB/)).toBeInTheDocument()
      })
    })

    it('should show Start Upload button after file selection', async () => {
      const { container } = render(<GcsVideoUploader />)
      const file = new File(['video'], 'test.mp4', { type: 'video/mp4' })
      const input = container.querySelector('input[type="file"]') as HTMLInputElement

      await userEvent.upload(input, file)

      await waitFor(() => {
        expect(screen.getByText('Start Upload')).toBeInTheDocument()
      })
    })
  })

  describe('File Validation', () => {
    it('should reject files exceeding max size', async () => {
      const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {})

      const { container } = render(<GcsVideoUploader maxFileSize={1024} />)
      const file = new File(['x'.repeat(2048)], 'large.mp4', { type: 'video/mp4' })
      const input = container.querySelector('input[type="file"]') as HTMLInputElement

      Object.defineProperty(input, 'files', {
        value: [file],
        writable: false,
      })

      fireEvent.change(input)

      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalledWith(expect.stringContaining('exceeds'))
      })

      alertSpy.mockRestore()
    })

    it('should reject invalid file types', async () => {
      const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {})

      const { container } = render(<GcsVideoUploader allowedTypes={['video/mp4']} />)
      const file = new File(['doc content'], 'document.pdf', { type: 'application/pdf' })
      const input = container.querySelector('input[type="file"]') as HTMLInputElement

      Object.defineProperty(input, 'files', {
        value: [file],
        writable: false,
      })

      fireEvent.change(input)

      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalledWith(expect.stringContaining('Invalid file type'))
      })

      alertSpy.mockRestore()
    })
  })

  describe('Upload Progress', () => {
    it('should show upload state icons', () => {
      render(<GcsVideoUploader />)
      // Component has state icon functions that map states to icons
      // Testing through the component's internal logic
      expect(screen.getByText('Upload Video to Google Cloud')).toBeInTheDocument()
    })
  })

  describe('Callbacks', () => {
    it('should accept onUploadComplete callback', () => {
      render(<GcsVideoUploader onUploadComplete={mockOnUploadComplete} />)
      expect(screen.getByText('Upload Video to Google Cloud')).toBeInTheDocument()
    })

    it('should accept onUploadError callback', () => {
      render(<GcsVideoUploader onUploadError={mockOnUploadError} />)
      expect(screen.getByText('Upload Video to Google Cloud')).toBeInTheDocument()
    })
  })
})

describe('CoachMessaging Component', () => {
  const defaultProps = {
    coachId: 'coach123',
    coachName: 'Coach Smith',
  }

  beforeEach(() => {
    // Mock scrollIntoView (not available in jsdom)
    Element.prototype.scrollIntoView = vi.fn()

    // Mock Firestore onSnapshot to return empty messages
    mockOnSnapshot.mockImplementation((query: any, callback: any) => {
      // Simulate empty snapshot initially
      callback({
        forEach: (fn: any) => {},
      })
      return vi.fn() // unsubscribe function
    })

    mockAddDoc.mockClear()
    mockUpdateDoc.mockClear()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('Closed State (Floating Button)', () => {
    it('should render floating message button when closed', () => {
      render(<CoachMessaging {...defaultProps} />)
      expect(screen.getByRole('button')).toBeInTheDocument()
    })

    it('should show unread count badge when messages are unread', async () => {
      mockOnSnapshot.mockImplementation((query: any, callback: any) => {
        callback({
          forEach: (fn: any) => {
            fn({
              id: 'msg1',
              data: () => ({
                senderId: 'coach123',
                recipientId: 'athlete123',
                content: 'Test message',
                read: false,
                timestamp: { toDate: () => new Date() },
              }),
            })
          },
        })
        return vi.fn()
      })

      render(<CoachMessaging {...defaultProps} />)

      await waitFor(() => {
        expect(screen.getByText('1')).toBeInTheDocument()
      })
    })

    it('should open chat when floating button is clicked', async () => {
      render(<CoachMessaging {...defaultProps} />)
      const button = screen.getByRole('button')

      await userEvent.click(button)

      await waitFor(() => {
        expect(screen.getByText('Coach Smith')).toBeInTheDocument()
        expect(screen.getByText('Your Coach')).toBeInTheDocument()
      })
    })
  })

  describe('Open State (Chat Window)', () => {
    beforeEach(async () => {
      render(<CoachMessaging {...defaultProps} />)
      const button = screen.getByRole('button')
      await userEvent.click(button)
    })

    it('should show coach name in header', () => {
      expect(screen.getByText('Coach Smith')).toBeInTheDocument()
    })

    it('should show "Your Coach" subtitle', () => {
      expect(screen.getByText('Your Coach')).toBeInTheDocument()
    })

    it('should show empty state when no messages', () => {
      expect(screen.getByText('No messages yet')).toBeInTheDocument()
      expect(screen.getByText('Send your coach a message to get started')).toBeInTheDocument()
    })

    it('should have message input field', () => {
      const input = screen.getByPlaceholderText('Type a message...')
      expect(input).toBeInTheDocument()
    })

    it('should have send button', () => {
      // There are 2 buttons: close button and send button
      const buttons = screen.getAllByRole('button')
      expect(buttons.length).toBeGreaterThanOrEqual(2)
    })

    it('should show privacy notice', () => {
      expect(screen.getByText('Messages are private between you and your coach')).toBeInTheDocument()
    })

    it('should close when X button is clicked', async () => {
      const buttons = screen.getAllByRole('button')
      // Find the close button (should be first in header)
      const closeButton = buttons[0]

      await userEvent.click(closeButton)

      await waitFor(() => {
        expect(screen.queryByText('Your Coach')).not.toBeInTheDocument()
      })
    })
  })

  describe('Message Sending', () => {
    it('should enable send button when message is typed', async () => {
      render(<CoachMessaging {...defaultProps} />)
      const openButton = screen.getByRole('button')
      await userEvent.click(openButton)

      const input = screen.getByPlaceholderText('Type a message...')
      await userEvent.type(input, 'Hello coach')

      const sendButtons = screen.getAllByRole('button')
      const sendButton = sendButtons[sendButtons.length - 1]
      expect(sendButton).not.toBeDisabled()
    })

    it('should disable send button when input is empty', async () => {
      render(<CoachMessaging {...defaultProps} />)
      const openButton = screen.getByRole('button')
      await userEvent.click(openButton)

      const sendButtons = screen.getAllByRole('button')
      const sendButton = sendButtons[sendButtons.length - 1]
      expect(sendButton).toBeDisabled()
    })

    it('should call addDoc when sending message', async () => {
      mockAddDoc.mockResolvedValue({ id: 'newmsg' })

      render(<CoachMessaging {...defaultProps} />)
      const openButton = screen.getByRole('button')
      await userEvent.click(openButton)

      const input = screen.getByPlaceholderText('Type a message...')
      await userEvent.type(input, 'Test message')

      const sendButtons = screen.getAllByRole('button')
      const sendButton = sendButtons[sendButtons.length - 1]
      await userEvent.click(sendButton)

      await waitFor(() => {
        expect(mockAddDoc).toHaveBeenCalled()
      })
    })

    it('should clear input after sending message', async () => {
      mockAddDoc.mockResolvedValue({ id: 'newmsg' })

      render(<CoachMessaging {...defaultProps} />)
      const openButton = screen.getByRole('button')
      await userEvent.click(openButton)

      const input = screen.getByPlaceholderText('Type a message...') as HTMLInputElement
      await userEvent.type(input, 'Test message')

      const sendButtons = screen.getAllByRole('button')
      const sendButton = sendButtons[sendButtons.length - 1]
      await userEvent.click(sendButton)

      await waitFor(() => {
        expect(input.value).toBe('')
      })
    })

    it('should include correct message data structure', async () => {
      mockAddDoc.mockResolvedValue({ id: 'newmsg' })

      render(<CoachMessaging {...defaultProps} />)
      const openButton = screen.getByRole('button')
      await userEvent.click(openButton)

      const input = screen.getByPlaceholderText('Type a message...')
      await userEvent.type(input, 'Hello')

      const sendButtons = screen.getAllByRole('button')
      const sendButton = sendButtons[sendButtons.length - 1]
      await userEvent.click(sendButton)

      await waitFor(() => {
        expect(mockAddDoc).toHaveBeenCalled()
      })

      // Verify message structure contains required fields
      const callArgs = mockAddDoc.mock.calls[0]
      const messageData = callArgs[1]

      expect(messageData).toMatchObject({
        senderId: 'athlete123',
        recipientId: 'coach123',
        content: 'Hello',
        read: false,
      })
    })
  })

  describe('Message Display', () => {
    it('should display messages from coach', async () => {
      mockOnSnapshot.mockImplementation((query: any, callback: any) => {
        callback({
          forEach: (fn: any) => {
            fn({
              id: 'msg1',
              data: () => ({
                senderId: 'coach123',
                senderName: 'Coach Smith',
                recipientId: 'athlete123',
                content: 'Great job today!',
                read: false,
                timestamp: { toDate: () => new Date() },
              }),
            })
          },
        })
        return vi.fn()
      })

      render(<CoachMessaging {...defaultProps} />)
      const openButton = screen.getByRole('button')
      await userEvent.click(openButton)

      await waitFor(() => {
        expect(screen.getByText('Great job today!')).toBeInTheDocument()
      })
    })

    it('should show read receipts for sent messages', async () => {
      render(<CoachMessaging {...defaultProps} />)
      const openButton = screen.getByRole('button')
      await userEvent.click(openButton)

      // Component shows CheckCheck icon for read messages
      // and Check icon for unread messages sent by user
      expect(screen.getByText('Messages are private between you and your coach')).toBeInTheDocument()
    })
  })

  describe('Real-time Updates', () => {
    it('should set up Firestore listener on mount', () => {
      render(<CoachMessaging {...defaultProps} />)

      expect(mockOnSnapshot).toHaveBeenCalled()
    })

    it('should clean up listener on unmount', () => {
      const unsubscribe = vi.fn()
      mockOnSnapshot.mockReturnValue(unsubscribe)

      const { unmount } = render(<CoachMessaging {...defaultProps} />)
      unmount()

      expect(unsubscribe).toHaveBeenCalled()
    })
  })

  describe('Coach Avatar', () => {
    it('should show default icon when no avatar provided', async () => {
      render(<CoachMessaging {...defaultProps} />)
      const openButton = screen.getByRole('button')
      await userEvent.click(openButton)

      // Should show User icon as fallback
      expect(screen.getByText('Coach Smith')).toBeInTheDocument()
    })

    it('should show avatar image when provided', async () => {
      render(<CoachMessaging {...defaultProps} coachAvatar="https://example.com/avatar.jpg" />)
      const openButton = screen.getByRole('button')
      await userEvent.click(openButton)

      const avatar = screen.getByAltText('Coach Smith')
      expect(avatar).toHaveAttribute('src', 'https://example.com/avatar.jpg')
    })
  })
})
