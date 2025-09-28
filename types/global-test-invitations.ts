declare global {
  // In-memory store for test invitations used by mock/testing API routes
  // Using broad types to avoid friction across call sites
  var testInvitations: Map<any, any> | undefined
}

export {}


