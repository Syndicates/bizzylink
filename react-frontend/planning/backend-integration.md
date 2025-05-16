# BizzyLink Backend Integration Plan

## 1. Database Schemas

### User Schema Extension
```javascript
const UserSchema = new mongoose.Schema({
  // Core user data
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  
  // Minecraft integration
  minecraftUUID: { type: String, unique: true, sparse: true },
  minecraftUsername: { type: String, unique: true, sparse: true },
  linkCode: { type: String },
  linkExpiryDate: { type: Date },
  
  // Rank system
  webRank: { 
    type: String, 
    enum: ['user', 'helper', 'moderator', 'admin', 'owner', 'developer', 'content_creator', 'tiktok_sub', 'donor'],
    default: 'user'
  },
  
  // LuckPerms integration
  minecraftRanks: [{
    server: { type: String },
    rank: { type: String },
    prefix: { type: String },
    suffix: { type: String },
    isOperator: { type: Boolean, default: false },
    permissions: [String]
  }],
  
  // Titles system
  titles: [{
    id: { type: String, required: true },
    name: { type: String, required: true },
    description: { type: String },
    rarity: { 
      type: String, 
      enum: ['common', 'uncommon', 'rare', 'epic', 'legendary', 'mythic', 'godly', 'divine'],
      default: 'common'
    },
    category: { type: String },
    unlocked: { type: Boolean, default: false },
    unlockedDate: { type: Date },
    textColor: { type: String, default: 'text-white' }
  }],
  activeTitle: { type: String },
  
  // Achievements system
  achievements: [{
    id: { type: String, required: true },
    name: { type: String, required: true },
    description: { type: String },
    category: { type: String },
    rarity: { 
      type: String, 
      enum: ['common', 'uncommon', 'rare', 'epic', 'legendary'],
      default: 'common'
    },
    progress: { type: Number, default: 0 },
    maxProgress: { type: Number, default: 100 },
    unlocked: { type: Boolean, default: false },
    unlockedDate: { type: Date },
    icon: { type: String }
  }],
  
  // Security & session management
  twoFactorEnabled: { type: Boolean, default: false },
  twoFactorSecret: { type: String },
  lastLogin: { type: Date },
  loginAttempts: { type: Number, default: 0 },
  lockUntil: { type: Date },
  
  // IP tracking for security
  knownIPs: [{
    ip: { type: String },
    firstSeen: { type: Date, default: Date.now },
    lastSeen: { type: Date, default: Date.now },
    trusted: { type: Boolean, default: false }
  }],
  
  // User preferences
  preferences: {
    theme: { type: String, default: 'dark' },
    emailNotifications: { type: Boolean, default: true },
    showOnlineStatus: { type: Boolean, default: true }
  }
});

// Add index for faster queries
UserSchema.index({ username: 1, email: 1, minecraftUUID: 1 });
```

### Forum Schemas

```javascript
const ForumCategorySchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  slug: { type: String, required: true, unique: true },
  icon: { type: String },
  order: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
  requiresAuth: { type: Boolean, default: false },
  requiredRank: { type: String },
  createdAt: { type: Date, default: Date.now },
  topics: [{ type: mongoose.Schema.Types.ObjectId, ref: 'ForumTopic' }]
});

const ForumTopicSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  slug: { type: String, required: true },
  icon: { type: String },
  order: { type: Number, default: 0 },
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'ForumCategory', required: true },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  threads: [{ type: mongoose.Schema.Types.ObjectId, ref: 'ForumThread' }]
});

const ForumThreadSchema = new mongoose.Schema({
  title: { type: String, required: true },
  slug: { type: String, required: true },
  topic: { type: mongoose.Schema.Types.ObjectId, ref: 'ForumTopic', required: true },
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String, required: true },
  isPinned: { type: Boolean, default: false },
  isLocked: { type: Boolean, default: false },
  views: { type: Number, default: 0 },
  tags: [String],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  lastPost: {
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    date: { type: Date }
  }
});

const ForumPostSchema = new mongoose.Schema({
  thread: { type: mongoose.Schema.Types.ObjectId, ref: 'ForumThread', required: true },
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String, required: true },
  isOriginalPost: { type: Boolean, default: false },
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  edited: { type: Boolean, default: false },
  editedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  editDate: { type: Date },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});
```

## 2. LuckPerms Integration

### Rank Sync Service
```javascript
/**
 * Service to synchronize LuckPerms data with our system.
 * This can be implemented in multiple ways:
 * 1. Direct MySQL/database access to LuckPerms tables
 * 2. LuckPerms API plugin with webhooks
 * 3. Regular export from LuckPerms and import to our database
 */
const LuckPermsSync = {
  // Mapping from LuckPerms groups to website ranks
  rankMapping: {
    'owner': 'owner',
    'admin': 'admin',
    'moderator': 'moderator',
    'helper': 'helper',
    'developer': 'developer',
    'builder': 'content_creator',
    'donor': 'donor',
    'tiktok': 'tiktok_sub',
    'default': 'user'
  },

  /**
   * Fetches and syncs player rank from LuckPerms
   * @param {string} uuid Minecraft UUID
   * @returns {Promise} Promise resolving to updated player data
   */
  async syncPlayerRank(uuid) {
    try {
      // Option 1: Direct DB query (if LuckPerms uses MySQL/MariaDB)
      // Example: const playerGroups = await db.query('SELECT * FROM luckperms_user_permissions WHERE uuid = ? AND permission LIKE "group.%"', [uuid]);
      
      // Option 2: REST API call to LuckPerms API plugin endpoint
      const playerGroups = await axios.get(`${config.LUCKPERMS_API_URL}/player/${uuid}/groups`);
      
      // Process groups to determine highest rank
      const highestRank = this.determineHighestRank(playerGroups);
      const isOperator = playerGroups.some(perm => perm.permission === 'minecraft.command.op');
      
      // Update user in database
      const user = await User.findOne({ minecraftUUID: uuid });
      if (!user) return null;
      
      // Map LuckPerms rank to website rank
      user.minecraftRanks = playerGroups.map(group => ({
        server: group.server || 'global',
        rank: group.group,
        prefix: group.prefix,
        suffix: group.suffix,
        isOperator
      }));
      
      // If player is operator, force admin web rank
      if (isOperator) {
        user.webRank = 'admin';
      } else {
        // Use mapped rank or default to 'user'
        user.webRank = this.rankMapping[highestRank] || 'user';
      }
      
      await user.save();
      return user;
    } catch (error) {
      console.error('Error syncing LuckPerms data:', error);
      return null;
    }
  },
  
  /**
   * Determine highest rank from player's groups
   * @param {Array} groups - Player's groups from LuckPerms
   * @returns {string} The highest rank group name
   */
  determineHighestRank(groups) {
    // Define rank priority (higher index = higher rank)
    const rankPriority = ['default', 'tiktok', 'donor', 'builder', 'helper', 'moderator', 'admin', 'developer', 'owner'];
    
    let highestRank = 'default';
    let highestPriority = -1;
    
    groups.forEach(group => {
      const groupName = group.group || group;
      const priority = rankPriority.indexOf(groupName);
      if (priority > highestPriority) {
        highestPriority = priority;
        highestRank = groupName;
      }
    });
    
    return highestRank;
  },
  
  /**
   * Sync all active players at once
   */
  async syncAllPlayers() {
    try {
      const activeUsers = await User.find({ minecraftUUID: { $exists: true, $ne: null } });
      
      for (const user of activeUsers) {
        await this.syncPlayerRank(user.minecraftUUID);
      }
      
      console.log(`Synced ranks for ${activeUsers.length} players`);
    } catch (error) {
      console.error('Error in bulk rank sync:', error);
    }
  }
};
```

## 3. API Endpoints

### Authentication with Rank Awareness
```javascript
// Login endpoint with rank checking
router.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // Find user
    const user = await User.findOne({ username });
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });
    
    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      // Security: Increment failed login attempts
      user.loginAttempts += 1;
      
      // Lock account after 5 failed attempts
      if (user.loginAttempts >= 5) {
        user.lockUntil = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
      }
      
      await user.save();
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    // Check if account is locked
    if (user.lockUntil && user.lockUntil > Date.now()) {
      return res.status(403).json({ 
        message: 'Account locked due to multiple failed attempts',
        lockExpires: user.lockUntil
      });
    }
    
    // Reset login attempts
    user.loginAttempts = 0;
    user.lastLogin = Date.now();
    
    // Save IP address for security tracking
    const clientIP = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    
    // Check if IP already exists in knownIPs
    const existingIP = user.knownIPs.find(entry => entry.ip === clientIP);
    
    if (existingIP) {
      // Update lastSeen time
      existingIP.lastSeen = Date.now();
    } else {
      // Add new IP to known list
      user.knownIPs.push({
        ip: clientIP,
        firstSeen: Date.now(),
        lastSeen: Date.now()
      });
      
      // If this is a new IP and the user has 2FA enabled, require verification
      if (user.twoFactorEnabled) {
        // Generate and send 2FA code here
        return res.status(200).json({ 
          requiresTwoFactor: true,
          message: 'Login from new IP requires 2FA verification'
        });
      }
    }
    
    await user.save();
    
    // Sync player rank if they have a linked Minecraft account
    if (user.minecraftUUID) {
      // Run in background to avoid delaying login
      LuckPermsSync.syncPlayerRank(user.minecraftUUID).catch(err => {
        console.error('Error syncing player rank during login:', err);
      });
    }
    
    // Generate token with rank information
    const token = jwt.sign(
      { 
        id: user._id, 
        username: user.username,
        rank: user.webRank,
        isAdmin: user.webRank === 'admin' || user.webRank === 'owner',
        isLinked: !!user.minecraftUUID
      }, 
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    // Return user data and token
    return res.status(200).json({
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        rank: user.webRank,
        minecraftUsername: user.minecraftUsername,
        titles: user.titles,
        activeTitle: user.activeTitle,
        isAdmin: user.webRank === 'admin' || user.webRank === 'owner'
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
});
```

### Forum API Endpoints
```javascript
// Get forum categories
router.get('/api/forum/categories', async (req, res) => {
  try {
    // Find active categories
    const categories = await ForumCategory.find({ isActive: true })
      .sort({ order: 1 })
      .lean();
      
    // For each category, get stats
    for (const category of categories) {
      // Count topics
      category.topicCount = await ForumTopic.countDocuments({ 
        category: category._id,
        isActive: true 
      });
      
      // Count threads
      const topics = await ForumTopic.find({ category: category._id }).select('_id');
      const topicIds = topics.map(t => t._id);
      
      category.threadCount = await ForumThread.countDocuments({
        topic: { $in: topicIds }
      });
      
      // Count posts
      const threads = await ForumThread.find({ topic: { $in: topicIds } }).select('_id');
      const threadIds = threads.map(t => t._id);
      
      category.postCount = await ForumPost.countDocuments({
        thread: { $in: threadIds }
      });
      
      // Get last post info
      const lastPost = await ForumPost.findOne({ thread: { $in: threadIds } })
        .sort({ createdAt: -1 })
        .populate('thread', 'title')
        .populate('author', 'username')
        .lean();
        
      if (lastPost) {
        category.lastPost = {
          title: lastPost.thread.title,
          author: lastPost.author.username,
          date: lastPost.createdAt
        };
      }
    }
    
    return res.status(200).json(categories);
  } catch (error) {
    console.error('Error fetching forum categories:', error);
    return res.status(500).json({ message: 'Server error' });
  }
});

// Get topics in a category
router.get('/api/forum/category/:slug/topics', async (req, res) => {
  try {
    const { slug } = req.params;
    
    // Find category by slug
    const category = await ForumCategory.findOne({ slug, isActive: true });
    if (!category) return res.status(404).json({ message: 'Category not found' });
    
    // Check if category requires authentication
    if (category.requiresAuth && !req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    // Check if category requires specific rank
    if (category.requiredRank && req.user && !hasRequiredRank(req.user.rank, category.requiredRank)) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }
    
    // Find topics in this category
    const topics = await ForumTopic.find({ 
      category: category._id,
      isActive: true 
    }).sort({ order: 1 }).lean();
    
    // Get stats for each topic
    for (const topic of topics) {
      // Count threads
      topic.threadCount = await ForumThread.countDocuments({ topic: topic._id });
      
      // Count posts
      const threads = await ForumThread.find({ topic: topic._id }).select('_id');
      const threadIds = threads.map(t => t._id);
      
      topic.postCount = await ForumPost.countDocuments({
        thread: { $in: threadIds }
      });
      
      // Get last post info
      const lastPost = await ForumPost.findOne({ thread: { $in: threadIds } })
        .sort({ createdAt: -1 })
        .populate('thread', 'title')
        .populate('author', 'username')
        .lean();
        
      if (lastPost) {
        topic.lastPost = {
          title: lastPost.thread.title,
          author: lastPost.author.username,
          date: lastPost.createdAt
        };
      }
    }
    
    return res.status(200).json({
      category,
      topics
    });
  } catch (error) {
    console.error('Error fetching forum topics:', error);
    return res.status(500).json({ message: 'Server error' });
  }
});

// Additional forum endpoints would be implemented similarly
```

### Title System API
```javascript
// Get available titles for current user
router.get('/api/titles', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get user with titles
    const user = await User.findById(userId).select('titles activeTitle');
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    return res.status(200).json({
      titles: user.titles || [],
      activeTitle: user.activeTitle
    });
  } catch (error) {
    console.error('Error fetching titles:', error);
    return res.status(500).json({ message: 'Server error' });
  }
});

// Set active title
router.post('/api/titles/active', authMiddleware, async (req, res) => {
  try {
    const { titleId } = req.body;
    const userId = req.user.id;
    
    // Validate request
    if (!titleId) return res.status(400).json({ message: 'Title ID is required' });
    
    // Find user
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    // Check if title exists and is unlocked
    const titleExists = user.titles.some(t => t.id === titleId && t.unlocked);
    if (!titleExists) {
      return res.status(400).json({ message: 'Title not found or not unlocked' });
    }
    
    // Update active title
    user.activeTitle = titleId;
    await user.save();
    
    return res.status(200).json({
      message: 'Title updated successfully',
      activeTitle: titleId
    });
  } catch (error) {
    console.error('Error setting active title:', error);
    return res.status(500).json({ message: 'Server error' });
  }
});
```

### Achievement System API
```javascript
// Get achievements for current user
router.get('/api/achievements', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get user with achievements
    const user = await User.findById(userId).select('achievements minecraftUUID');
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    // If user has linked Minecraft account, fetch advancements
    let minecraftAchievements = [];
    if (user.minecraftUUID) {
      // Fetch from Minecraft server using API or database
      minecraftAchievements = await MinecraftService.getPlayerAdvancements(user.minecraftUUID);
    }
    
    return res.status(200).json({
      achievements: user.achievements || [],
      minecraftAchievements
    });
  } catch (error) {
    console.error('Error fetching achievements:', error);
    return res.status(500).json({ message: 'Server error' });
  }
});

// Unlock achievement (admin only)
router.post('/api/achievements/:id/unlock', adminMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;
    
    // Find user
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    // Find achievement
    const achievementIndex = user.achievements.findIndex(a => a.id === id);
    if (achievementIndex === -1) {
      return res.status(404).json({ message: 'Achievement not found' });
    }
    
    // Update achievement
    user.achievements[achievementIndex].unlocked = true;
    user.achievements[achievementIndex].unlockedDate = new Date();
    user.achievements[achievementIndex].progress = 100;
    
    await user.save();
    
    // Check if achievement unlocks a title
    await checkForUnlockedTitles(user);
    
    return res.status(200).json({
      message: 'Achievement unlocked successfully'
    });
  } catch (error) {
    console.error('Error unlocking achievement:', error);
    return res.status(500).json({ message: 'Server error' });
  }
});
```

## 4. Admin Panel Security

### Secure Admin Middleware
```javascript
/**
 * Middleware to protect admin routes
 * Implements multiple layers of security:
 * 1. JWT validation
 * 2. Admin role check
 * 3. IP validation
 * 4. Rate limiting
 * 5. Request logging
 */
const adminMiddleware = async (req, res, next) => {
  try {
    // Check if token exists
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    // Verify token
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded;
    } catch (error) {
      return res.status(401).json({ message: 'Invalid or expired token' });
    }
    
    // Check if user exists and has admin privileges
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Admin role check
    if (user.webRank !== 'admin' && user.webRank !== 'owner') {
      // Log unauthorized access attempt
      console.warn(`Unauthorized admin access attempt: ${user.username} (${user.webRank})`);
      
      // Create security audit log
      await SecurityLog.create({
        user: user._id,
        action: 'UNAUTHORIZED_ADMIN_ACCESS',
        ip: req.ip,
        userAgent: req.headers['user-agent'],
        path: req.originalUrl,
        details: {
          userRank: user.webRank,
          tokenIssued: new Date(req.user.iat * 1000)
        }
      });
      
      return res.status(403).json({ message: 'Insufficient permissions' });
    }
    
    // IP validation for admins
    const clientIP = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    const knownIP = user.knownIPs.find(ip => ip.ip === clientIP && ip.trusted);
    
    // If IP is unknown or untrusted, require 2FA verification
    if (!knownIP && user.twoFactorEnabled) {
      return res.status(403).json({
        message: 'Admin access from new IP requires 2FA verification',
        requiresTwoFactor: true
      });
    }
    
    // Add user to request
    req.adminUser = user;
    
    // Log admin action (audit trail)
    await AdminActionLog.create({
      user: user._id,
      action: req.method,
      resource: req.originalUrl,
      ip: clientIP,
      userAgent: req.headers['user-agent']
    });
    
    // Continue to route handler
    next();
  } catch (error) {
    console.error('Admin middleware error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};
```

### Admin Two-Factor Authentication
```javascript
// Generate 2FA secret for admin
router.post('/api/admin/2fa/setup', adminMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Find user
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    // Generate new secret
    const secret = speakeasy.generateSecret({
      name: `BizzyLink:${user.username}`
    });
    
    // Save secret to user
    user.twoFactorSecret = secret.base32;
    user.twoFactorEnabled = false; // Not verified yet
    await user.save();
    
    // Generate QR code
    const qrCode = await qrcode.toDataURL(secret.otpauth_url);
    
    return res.status(200).json({
      message: '2FA setup initiated',
      secret: secret.base32,
      qrCode
    });
  } catch (error) {
    console.error('Error setting up 2FA:', error);
    return res.status(500).json({ message: 'Server error' });
  }
});

// Verify and enable 2FA
router.post('/api/admin/2fa/verify', adminMiddleware, async (req, res) => {
  try {
    const { token } = req.body;
    const userId = req.user.id;
    
    // Find user
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    // Verify token
    const verified = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token
    });
    
    if (!verified) {
      return res.status(400).json({ message: 'Invalid verification code' });
    }
    
    // Enable 2FA
    user.twoFactorEnabled = true;
    await user.save();
    
    // Log action
    await SecurityLog.create({
      user: user._id,
      action: 'ENABLE_2FA',
      ip: req.ip,
      userAgent: req.headers['user-agent']
    });
    
    return res.status(200).json({
      message: '2FA enabled successfully'
    });
  } catch (error) {
    console.error('Error verifying 2FA:', error);
    return res.status(500).json({ message: 'Server error' });
  }
});
```

## 5. LuckPerms Integration Method

The most effective way to integrate with LuckPerms depends on your Minecraft server setup. Here are the options:

### Option 1: Direct Database Query
If LuckPerms uses MySQL/MariaDB and you can safely connect to it:

```javascript
// Setup database connection
const luckpermsDB = mysql.createPool({
  host: process.env.LUCKPERMS_DB_HOST,
  user: process.env.LUCKPERMS_DB_USER,
  password: process.env.LUCKPERMS_DB_PASSWORD,
  database: process.env.LUCKPERMS_DB_NAME
});

// Query player groups
async function getPlayerGroups(uuid) {
  const [rows] = await luckpermsDB.query(
    'SELECT permission FROM luckperms_user_permissions WHERE uuid = ? AND permission LIKE "group.%"',
    [uuid]
  );
  
  return rows.map(row => {
    const groupName = row.permission.replace('group.', '');
    return { group: groupName };
  });
}
```

### Option 2: LuckPerms API (Plugin)
If you have the LuckPerms API plugin installed:

```javascript
async function getPlayerGroups(uuid) {
  const response = await axios.get(`${process.env.LUCKPERMS_API_URL}/user/${uuid}`);
  return response.data.groups || [];
}
```

### Option 3: Minecraft Plugin Bridge
Create a custom plugin that exposes LuckPerms data via a secured API endpoint:

```java
// Java plugin code (LuckPermsAPIPlugin.java)
@Plugin(id = "luckperms_bridge")
public class LuckPermsAPIPlugin extends JavaPlugin {
  private final LuckPerms luckPerms;
  
  @Inject
  public LuckPermsAPIPlugin(LuckPerms luckPerms) {
    this.luckPerms = luckPerms;
  }
  
  @Override
  public void onEnable() {
    // Create API endpoint
    getServer().createHttpServer()
      .path("/api/player/{uuid}/groups")
      .handler(this::handleGroupRequest)
      .register();
  }
  
  private void handleGroupRequest(HttpExchange exchange) {
    String uuid = exchange.getPathParams().get("uuid");
    
    // Get user from LuckPerms
    User user = luckPerms.getUserManager().getUser(UUID.fromString(uuid));
    if (user == null) {
      exchange.sendResponseHeaders(404, 0);
      return;
    }
    
    // Get user's groups
    Collection<Group> groups = user.getInheritedGroups(QueryOptions.nonContextual());
    
    // Convert to JSON
    JSONArray jsonGroups = new JSONArray();
    for (Group group : groups) {
      JSONObject jsonGroup = new JSONObject();
      jsonGroup.put("name", group.getName());
      jsonGroup.put("weight", group.getWeight().orElse(0));
      
      // Get metadata
      MetaData metaData = group.getCachedData().getMetaData();
      jsonGroup.put("prefix", metaData.getPrefix());
      jsonGroup.put("suffix", metaData.getSuffix());
      
      jsonGroups.put(jsonGroup);
    }
    
    // Send response
    exchange.getResponseHeaders().set("Content-Type", "application/json");
    exchange.sendResponseHeaders(200, jsonGroups.toString().length());
    exchange.getResponseBody().write(jsonGroups.toString().getBytes());
    exchange.close();
  }
}
```

## 6. Updates to Frontend Components

### Updating Achievement System to Use Real Data
```javascript
// In AchievementSystem.js
useEffect(() => {
  const fetchAchievements = async () => {
    setIsLoading(true);
    
    try {
      // Fetch from API instead of using placeholder data
      const response = await axios.get('/api/achievements');
      
      // Combine website achievements with Minecraft advancements
      const allAchievements = [
        ...response.data.achievements,
        ...processMinecraftAchievements(response.data.minecraftAchievements)
      ];
      
      setAchievements(allAchievements);
      
      // Extract unique categories
      const uniqueCategories = [...new Set(allAchievements.map(a => a.category))];
      setCategories(['all', ...uniqueCategories]);
    } catch (error) {
      console.error('Error fetching achievements:', error);
      // Fallback to processing data directly if API fails
      if (playerData) {
        const extractedAchievements = processAchievements(playerData);
        setAchievements(extractedAchievements);
        
        const uniqueCategories = [...new Set(extractedAchievements.map(a => a.category))];
        setCategories(['all', ...uniqueCategories]);
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  fetchAchievements();
}, [playerData]);
```

### Updating Title System to Use Real Data
```javascript
// In TitleSystem.js
useEffect(() => {
  const fetchTitles = async () => {
    setIsLoading(true);
    
    try {
      // Fetch from API instead of processing from playerData
      const response = await axios.get('/api/titles');
      setTitles(response.data.titles || []);
      
      // Set active title from API response
      if (response.data.activeTitle) {
        setActiveTitle(response.data.activeTitle);
      } else if (response.data.titles && response.data.titles.length > 0) {
        // Default to first title if none is active
        setActiveTitle(response.data.titles[0].id);
      }
    } catch (error) {
      console.error('Error fetching titles:', error);
      // Fallback to processing data directly if API fails
      if (playerData) {
        const availableTitles = processTitles(playerData);
        setTitles(availableTitles);
        
        if (playerData.activeTitle) {
          setActiveTitle(playerData.activeTitle);
        } else if (availableTitles.length > 0) {
          setActiveTitle(availableTitles[0].id);
        }
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  fetchTitles();
}, [playerData, selectedTitle]);
```

### Updating Forum System to Use Real API
```javascript
// In ForumSystem.js
useEffect(() => {
  setIsLoading(true);
  setError(null);
  
  // Fetch appropriate data based on current view
  switch(view) {
    case 'categories':
      fetchCategoriesFromAPI();
      break;
    case 'topics':
      if (activeCategory) {
        fetchTopicsFromAPI(activeCategory);
      } else {
        setError('No category selected');
        setIsLoading(false);
      }
      break;
    // Add other cases...
  }
}, [view, activeCategory, activeThread, pageNumber, sortOrder]);

const fetchCategoriesFromAPI = async () => {
  try {
    const response = await axios.get('/api/forum/categories');
    setCategories(response.data);
    setIsLoading(false);
  } catch (error) {
    console.error('Error fetching categories:', error);
    
    if (error.response?.status === 401) {
      setError('Please log in to view the forum');
    } else {
      setError('Failed to load forum categories');
      // Fallback to mock data in development
      if (process.env.NODE_ENV === 'development') {
        setCategories(mockCategories);
      }
    }
    
    setIsLoading(false);
  }
};
```

## 7. MongoDB Indexes for Performance

To ensure good performance with these data models, create these indexes:

```javascript
// User collection indexes
db.users.createIndex({ "username": 1 }, { unique: true });
db.users.createIndex({ "email": 1 }, { unique: true });
db.users.createIndex({ "minecraftUUID": 1 }, { unique: true, sparse: true });
db.users.createIndex({ "minecraftUsername": 1 }, { unique: true, sparse: true });
db.users.createIndex({ "webRank": 1 });

// Forum collection indexes
db.forumcategories.createIndex({ "slug": 1 }, { unique: true });
db.forumtopics.createIndex({ "category": 1, "slug": 1 }, { unique: true });
db.forumthreads.createIndex({ "topic": 1, "createdAt": -1 });
db.forumposts.createIndex({ "thread": 1, "createdAt": 1 });
db.forumposts.createIndex({ "author": 1 });

// Security log indexes
db.securitylogs.createIndex({ "user": 1, "action": 1, "createdAt": -1 });
db.adminactionlogs.createIndex({ "user": 1, "createdAt": -1 });
```