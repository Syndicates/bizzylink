# BizzyLink FYP (For You Page) Design & Implementation

## Overview
The For You Page (FYP) is a personalized, dynamic feed of wall posts inspired by TikTok, Instagram, and X (Twitter). It surfaces the most relevant, engaging, and recent content from across the BizzyLink community, tailored to each user. The FYP is a core social feature designed to maximize discovery, engagement, and retention.

---

## Goals
- **Personalized feed**: Show each user a unique, relevant mix of posts.
- **Real-time & fresh**: Prioritize new and trending content.
- **Engagement-driven**: Boost posts with high likes, comments, reposts.
- **Social graph aware**: Prefer posts from followed/friended users, but not exclusively.
- **Scalable & performant**: Support infinite scroll, caching, and efficient queries.
- **Accessible & beautiful**: Responsive, accessible, and on-brand UI.

---

## Backend/API Design

### Endpoint
- `GET /api/wall/fyp?page=1&limit=10`
- Authenticated (JWT/session)
- Returns: `{ posts: [ ... ], pagination: { page, totalPages, ... } }`

### Post Data Structure
- `_id`, `content`, `author`, `createdAt`, `likes`, `comments`, `reposts`, `isRepost`, `originalPost`, etc.
- All fields needed for rendering, engagement, and repost context.

### Feed Algorithm (MVP)
1. **Recency**: Prefer newer posts (decay older ones).
2. **Engagement**: Boost posts with more likes, comments, reposts.
3. **Social Graph**: Boost posts from followed/friended users.
4. **Diversity**: Avoid showing too many posts from the same user in a row.
5. **Personalization** (future): Use user interests, past engagement, ML, etc.

#### Example Scoring Formula
```
score = (recency_weight * freshness) + (engagement_weight * (likes + comments + reposts)) + (social_weight * isFollowed)
```
- Tune weights for best results.
- Use MongoDB aggregation or SQL window functions for efficient queries.

### Pagination
- Cursor or page-based (start with page-based for simplicity).
- Support infinite scroll on frontend.

### Real-time
- SSE or WebSocket for new post notifications (optional for MVP).

---

## Frontend Architecture

### Directory Structure
```
src/components/fyp/
  FYPPage.jsx
  FYPFeed.jsx
  FYPPost.jsx
  FYPRepost.jsx
  FYPPostSkeleton.jsx
  FYPError.jsx
  FYPEmpty.jsx
  FYPFilterBar.jsx
src/hooks/useFYPFeed.js
```

### Components
- **FYPPage**: Main route/page, orchestrates the feed and filter bar.
- **FYPFeed**: Handles fetching, infinite scroll, loading/error/empty states.
- **FYPPost**: Renders a single post (with media, actions, etc.).
- **FYPRepost**: Renders a repost, referencing the original post.
- **FYPPostSkeleton**: Loading skeleton for posts.
- **FYPError**: Error state.
- **FYPEmpty**: Empty state.
- **FYPFilterBar**: (Optional) Trending, Following, Recommended tabs.

### Custom Hook
- **useFYPFeed**: Fetches and manages FYP feed state, pagination, loading, error, etc.

### Features
- Infinite scroll (intersection observer or manual "Load more")
- Like, comment, repost, follow actions (with optimistic UI)
- Real-time updates (optional)
- Responsive and accessible
- No mock data in production
- Memoization and performance optimizations

---

## Accessibility & UX
- Semantic HTML, alt text, keyboard navigation
- Focus management for modals/actions
- Responsive for mobile and desktop
- Clear loading, error, and empty states

---

## Testing
- Unit tests for core logic and components
- Integration tests for feed interactions
- Edge case and error state coverage

---

## Next Steps
1. **Backend**: Implement `/api/wall/fyp` endpoint and scoring algorithm.
2. **Frontend**: Scaffold FYP components and hook, connect to API.
3. **Iterate**: Tune algorithm, polish UI/UX, add advanced features.

---

## References
- [RULES.md](./RULES.md) for BizzyLink best practices
- TikTok, Instagram, X FYP/Feed design patterns

---

# END OF PLAN 