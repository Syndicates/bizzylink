# BizzyLink Database Reference

> **Last updated:** 2025-05-18

This document provides a comprehensive overview of the BizzyLink MongoDB database structure, including all collections, key fields, relationships, and index strategies. Use this as a reference when building or updating the website to ensure correct and efficient data access.

---

## **1. users Collection**

### **Key Fields**
- `username` (String, unique, required)
- `email` (String, unique, required)
- `password` (String, hashed, required)
- `createdAt` (Date)
- `lastLogin` (Date)
- `role` / `webRank` (String, e.g., 'user', 'admin', 'owner', etc.)
- `linked` (Boolean) — Is Minecraft account linked?
- `verified` (Boolean)
- `accountStatus` (String, e.g., 'active')
- `mcStats` (Object) — Minecraft stats, see below
- `mcLinkedAt` (Date)
- `mcData` (Object) — Last update info
- `settings` / `preferences` (Object) — Notifications, privacy, theme
- `friends`, `following`, `followers` (Array of user IDs)
- `postCount`, `threadCount`, `reputation`, `vouches` (Number)
- `reputationFrom`, `vouchesFrom` (Array)
- `transactions` (Array)
- `sessions` (Array)
- `refreshToken`, `refreshTokenExpiry` (String, Date)
- `registrationIp`, `lastLoginIp` (String)
- `failedLoginAttempts` (Object)
- `avatar` (String)

#### **Minecraft Integration (mcStats)**
- `balance`, `playtime`, `level`, `experience`, `rank`, `lastSeen`, `blocks_mined`, `mobs_killed`, `deaths`, `world`, `biome`, `coords`, `lastUpdated`
- `mcmmo_data` (skills, power_level)
- `jobs_data` (points, total_money_earned, jobs[])
- `economy_data` (balance, bank_balance, total_transactions, shops)
- `town_data` (name, rank, nation, mayor, residents, founded, chunks, balance)
- `advancements` (Array of strings)
- `inventory` (main_hand, armor, hotbar, valuables, etc.)

#### **Security & Status**
- `twoFactorEnabled`, `twoFactorSecret`
- `sessions`, `refreshToken`, `refreshTokenExpiry`
- `failedLoginAttempts`, `accountStatus`, `verified`

#### **Indexes**
- `{ username: 1 }` — unique
- `{ email: 1 }` — unique, sparse
- `{ mcUUID: 1 }` — unique, sparse
- `{ minecraftUsername: 1 }` — unique, sparse
- `{ webRank: 1 }`
- `{ username: 1, email: 1 }`
- `{ 'minecraft.mcUUID': 1 }` — sparse

#### **Relationships**
- Friends, followers, and following reference other user IDs
- Posts, threads, and other collections reference user IDs

---

## **2. securitylogs Collection**
- Tracks security events (login, logout, password change, Minecraft link/unlink, etc.)
- Fields: `user` (ObjectId), `action` (String), `ip`, `userAgent`, `details`, `createdAt`
- Index: `{ user: 1, action: 1, createdAt: -1 }`

---

## **3. forum Collections**
- **forumcategories**: `name`, `description`, `slug` (unique), `icon`, `order`, `isActive`, `requiredRank`, `createdAt`
- **forumtopics**: `name`, `description`, `slug`, `icon`, `order`, `category` (ref), `isActive`, `createdAt`
- **forumthreads**: `title`, `slug`, `topic` (ref), `author` (ref), `content`, `isPinned`, `isLocked`, `views`, `tags`, `createdAt`, `updatedAt`, `lastPost`
- **forumposts**: `thread` (ref), `author` (ref), `content`, `isOriginalPost`, `likes`, `edited`, `editedBy`, `editDate`, `createdAt`, `updatedAt`
- Indexes: unique on `slug` for categories/topics; refs for population

---

## **4. achievements Collection**
- Fields: `id`, `name`, `description`, `category`, `rarity`, `progress`, `maxProgress`, `unlocked`, `unlockedDate`, `icon`
- Linked to users via `achievements` array in user document

---

## **5. titles Collection**
- Fields: `id`, `name`, `description`, `rarity`, `category`, `unlocked`, `unlockedDate`, `textColor`
- Linked to users via `titles` array in user document

---

## **6. General Best Practices**
- Use **sparse unique indexes** for fields that may be missing/null (e.g., Minecraft UUID/username)
- Always hash passwords before storing
- Use references (`ObjectId`) for relationships between collections
- Enable access control/authentication in production
- Regularly back up the database
- Monitor index usage and performance

---

## **7. Example: Fetching a User for the Website**
```js
// Find by username
const user = await db.users.findOne({ username: 'bizzy' });
// Find by Minecraft UUID
const user = await db.users.findOne({ mcUUID: '...' });
// Get friends
const friends = await db.users.find({ _id: { $in: user.friends } });
// Get posts by user
const posts = await db.forumposts.find({ author: user._id });
```

---

## **8. Updating the Database**
- When adding new features, update this document with new fields, collections, or indexes.
- Always add new fields with default values or as optional to avoid breaking existing data.
- Use migrations/scripts for large-scale changes.

---

**This document should be kept up to date with all schema and index changes.** 