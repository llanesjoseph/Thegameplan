declare global {
  // In-memory store for test invitations used by mock/testing API routes
  // Using broad types to avoid friction across call sites
  let testInvitations: Map<string, unknown> | undefined
}

export {}


