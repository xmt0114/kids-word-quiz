// Mock for Gatekeeper component
export const fetchGuestConfig = jest.fn(() => Promise.resolve({
  app_settings: { theme: 'light' },
  default_collection_id: 'test-collection'
}));

export const fetchUserData = jest.fn(() => Promise.resolve({
  profile: {
    id: 'test-user',
    role: 'student',
    display_name: 'Test User',
    has_password_set: true
  },
  settings: {
    guess_word: { questionType: 'text' }
  }
}));