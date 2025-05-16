// Mock user data for development
const mockUsers = [
  {
    id: 'admin1',
    username: 'admin',
    email: 'admin@example.com',
    role: 'admin',
    forum_rank: 'admin',
    linked: true,
    mcUsername: 'AdminPlayer',
    mcUUID: '550e8400-e29b-41d4-a716-446655440000',
    createdAt: '2024-01-01T00:00:00.000Z',
    lastLogin: '2024-03-04T12:00:00.000Z',
  },
  {
    id: 'mod1',
    username: 'moderator',
    email: 'mod@example.com',
    role: 'moderator',
    linked: true,
    mcUsername: 'ModPlayer',
    mcUUID: '550e8400-e29b-41d4-a716-446655440001',
    createdAt: '2024-01-02T00:00:00.000Z',
    lastLogin: '2024-03-03T12:00:00.000Z',
  },
  {
    id: 'user1',
    username: 'user',
    email: 'user@example.com',
    role: 'user',
    linked: true,
    mcUsername: 'RegularPlayer',
    mcUUID: '550e8400-e29b-41d4-a716-446655440002',
    createdAt: '2024-01-03T00:00:00.000Z',
    lastLogin: '2024-03-02T12:00:00.000Z',
  }
];

export default mockUsers;