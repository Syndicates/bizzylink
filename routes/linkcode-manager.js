/**
 * Link Code Manager
 * 
 * Manages link codes with proper expiration and cleanup
 */
const crypto = require('crypto');
const mongoose = require('mongoose');

// Define a schema for link codes
const linkCodeSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true },
  userId: { type: String, required: true },
  expires: { type: Date, required: true },
  created: { type: Date, default: Date.now }
});

// Create a model if it doesn't exist already
const LinkCode = mongoose.models.LinkCode || mongoose.model('LinkCode', linkCodeSchema);

class LinkCodeManager {
  constructor() {
    this.activeCodes = new Map(); // Keep this for backward compatibility
    this.setupCleanupInterval();
  }
  
  /**
   * Generate a new link code for a user
   * @param {string} userId - The user ID to associate with the code
   * @param {number} expiryMinutes - How long the code should be valid in minutes (default: 30)
   * @returns {Object} The generated code and expiry information
   */
  async generateCode(userId, expiryMinutes = 1440) {
    // Generate a random 6-character code
    const code = crypto.randomBytes(3).toString('hex').toUpperCase();
    const expiryTime = Date.now() + (expiryMinutes * 60 * 1000);
    const expiryDate = new Date(expiryTime);
    
    console.log(`Generating new link code: ${code} for user ${userId}, expires at ${expiryDate.toISOString()}`);
    
    // Store the code in MongoDB
    try {
      // First, delete any existing active codes for this user
      console.log(`Deleting any existing link codes for user ${userId}`);
      const deleteResult = await LinkCode.deleteMany({ userId });
      if (deleteResult.deletedCount > 0) {
        console.log(`Deleted ${deleteResult.deletedCount} existing link codes for user ${userId}`);
      }
      
      // Create the new code in MongoDB
      console.log(`Creating new link code in MongoDB: ${code}`);
      const newLinkCode = await LinkCode.create({
        code,
        userId,
        expires: expiryDate
      });
      
      console.log(`✅ Successfully created link code in MongoDB with ID: ${newLinkCode._id}`);
      
      // Also store in memory map for backward compatibility
      this.activeCodes.set(code, {
        userId,
        expires: expiryTime
      });
      
      console.log(`✅ Link code also stored in memory map`);
      console.log(`Generated link code ${code} for user ${userId}, expires in ${expiryMinutes} minutes`);
      
      return {
        code,
        expires: expiryDate.toISOString(),
        expiryMinutes
      };
    } catch (error) {
      console.error(`Error storing link code in database: ${error.message}`);
      // Fallback to in-memory storage if database fails
      this.activeCodes.set(code, {
        userId,
        expires: expiryTime
      });
      
      console.log(`⚠️ Link code stored only in memory due to database error`);
      
      return {
        code,
        expires: expiryDate.toISOString(),
        expiryMinutes,
        warning: 'Stored in memory only due to database error'
      };
    }
  }
  
  /**
   * Get active code for a user
   * @param {string} userId - The user ID to find codes for
   * @returns {Object|null} The code information or null if no active code
   */
  async getActiveCodeForUser(userId) {
    try {
      // Find the active code for this user in MongoDB
      const now = new Date();
      const linkCode = await LinkCode.findOne({ 
        userId, 
        expires: { $gt: now } 
      }).sort({ created: -1 });
      
      if (linkCode) {
        return {
          code: linkCode.code,
          expires: linkCode.expires.toISOString()
        };
      }
      
      // If no code found in DB, check the memory map (backward compatibility)
      let userCode = null;
      let expiryTime = null;
      
      for (const [code, data] of this.activeCodes.entries()) {
        if (data.userId === userId) {
          // Check if the code is still valid
          if (data.expires > Date.now()) {
            userCode = code;
            expiryTime = data.expires;
            break;
          } else {
            // Code expired, remove it
            this.activeCodes.delete(code);
          }
        }
      }
      
      if (userCode) {
        return {
          code: userCode,
          expires: new Date(expiryTime).toISOString()
        };
      }
      
      return null;
    } catch (error) {
      console.error(`Error getting active code from database: ${error.message}`);
      
      // Fallback to in-memory only if database fails
      let userCode = null;
      let expiryTime = null;
      
      for (const [code, data] of this.activeCodes.entries()) {
        if (data.userId === userId) {
          // Check if the code is still valid
          if (data.expires > Date.now()) {
            userCode = code;
            expiryTime = data.expires;
            break;
          } else {
            // Code expired, remove it
            this.activeCodes.delete(code);
          }
        }
      }
      
      if (userCode) {
        return {
          code: userCode,
          expires: new Date(expiryTime).toISOString()
        };
      }
      
      return null;
    }
  }
  
  /**
   * Validate a link code
   * @param {string} code - The code to validate
   * @returns {Object|null} The user ID and expiry if valid, null if invalid
   */
  async validateCode(code) {
    if (!code) {
      console.log('validateCode called with empty code');
      return null;
    }
    
    // Convert code to uppercase for case-insensitive comparison
    const upperCode = code.toUpperCase();
    console.log(`Validating code: ${code} (normalized to ${upperCode})`);
    
    try {
      // Check MongoDB first
      const now = new Date();
      console.log(`Looking for code ${upperCode} in MongoDB with expiry > ${now.toISOString()}`);
      
      const linkCode = await LinkCode.findOne({ 
        code: upperCode, 
        expires: { $gt: now } 
      });
      
      if (linkCode) {
        // Valid code found in DB
        console.log(`✅ Found valid link code in MongoDB: ${linkCode.code} for user ${linkCode.userId}`);
        return {
          userId: linkCode.userId,
          expires: linkCode.expires
        };
      } else {
        console.log(`❌ No valid link code found in MongoDB with code: ${upperCode}`);
      }
      
      // If not in DB, check memory map (backward compatibility)
      console.log(`Checking memory map for code: ${upperCode}`);
      const linkData = this.activeCodes.get(upperCode);
      
      if (!linkData) {
        console.log(`❌ Code not found in memory map: ${upperCode}`);
        return null;
      }
      
      if (linkData.expires < Date.now()) {
        // Code expired, remove it
        console.log(`⏰ Code found in memory but expired: ${upperCode}, expires: ${new Date(linkData.expires).toISOString()}`);
        this.activeCodes.delete(upperCode);
        return null;
      }
      
      // Valid code in memory, return the user ID
      console.log(`✅ Found valid link code in memory: ${upperCode} for user ${linkData.userId}`);
      return {
        userId: linkData.userId,
        expires: linkData.expires
      };
    } catch (error) {
      console.error(`Error validating code in database: ${error.message}`);
      
      // Fallback to in-memory if database fails
      const linkData = this.activeCodes.get(upperCode);
      
      if (!linkData) {
        return null;
      }
      
      if (linkData.expires < Date.now()) {
        // Code expired, remove it
        this.activeCodes.delete(upperCode);
        return null;
      }
      
      // Valid code, return the user ID
      return {
        userId: linkData.userId,
        expires: linkData.expires
      };
    }
  }
  
  /**
   * Remove a code after it's been used
   * @param {string} code - The code to remove
   */
  async removeCode(code) {
    const upperCode = code.toUpperCase();
    
    try {
      // Remove from MongoDB
      await LinkCode.deleteOne({ code: upperCode });
      
      // Also remove from memory map
      this.activeCodes.delete(upperCode);
      console.log(`Removed link code ${upperCode} after use`);
    } catch (error) {
      console.error(`Error removing code from database: ${error.message}`);
      // At least remove from memory
      this.activeCodes.delete(upperCode);
    }
  }
  
  /**
   * Setup interval to clean up expired codes
   */
  setupCleanupInterval() {
    // Run cleanup every 5 minutes
    setInterval(async () => {
      try {
        // Clean up expired codes in MongoDB
        const now = new Date();
        const result = await LinkCode.deleteMany({ expires: { $lt: now } });
        
        if (result.deletedCount > 0) {
          console.log(`Removed ${result.deletedCount} expired link codes from database`);
        }
        
        // Also clean up memory map
        if (this.activeCodes.size === 0) return;
        
        console.log(`Cleaning up expired link codes in memory. Current count: ${this.activeCodes.size}`);
        let cleanupCount = 0;
        
        // Check all codes and remove expired ones
        for (const [code, data] of this.activeCodes.entries()) {
          if (data.expires < Date.now()) {
            this.activeCodes.delete(code);
            cleanupCount++;
          }
        }
        
        if (cleanupCount > 0) {
          console.log(`Removed ${cleanupCount} expired link codes from memory. Remaining: ${this.activeCodes.size}`);
        }
      } catch (error) {
        console.error(`Error during link code cleanup: ${error.message}`);
        
        // Continue with memory cleanup even if DB cleanup fails
        if (this.activeCodes.size === 0) return;
        
        let cleanupCount = 0;
        
        // Check all codes and remove expired ones
        for (const [code, data] of this.activeCodes.entries()) {
          if (data.expires < Date.now()) {
            this.activeCodes.delete(code);
            cleanupCount++;
          }
        }
        
        if (cleanupCount > 0) {
          console.log(`Removed ${cleanupCount} expired link codes from memory. Remaining: ${this.activeCodes.size}`);
        }
      }
    }, 5 * 60 * 1000); // 5 minutes
    
    console.log('Link code cleanup interval started');
  }
  
  /**
   * Get all active codes (for debugging)
   */
  async getAllCodes() {
    try {
      // Get codes from MongoDB
      const now = new Date();
      const dbCodes = await LinkCode.find({ expires: { $gt: now } });
      
      const codeInfo = dbCodes.map(code => ({
        code: code.code,
        userId: code.userId,
        expires: code.expires.toISOString(),
        isExpired: code.expires < now,
        source: 'database'
      }));
      
      // Also get codes from memory (for any that might not be in DB)
      for (const [code, data] of this.activeCodes.entries()) {
        // Check if this code is already in the results (from DB)
        const existingIndex = codeInfo.findIndex(c => c.code === code);
        
        if (existingIndex === -1) {
          // Not found in DB results, add it
          codeInfo.push({
            code,
            userId: data.userId,
            expires: new Date(data.expires).toISOString(),
            isExpired: data.expires < Date.now(),
            source: 'memory'
          });
        }
      }
      
      return codeInfo;
    } catch (error) {
      console.error(`Error getting all codes from database: ${error.message}`);
      
      // Fallback to memory only
      const codeInfo = [];
      for (const [code, data] of this.activeCodes.entries()) {
        codeInfo.push({
          code,
          userId: data.userId,
          expires: new Date(data.expires).toISOString(),
          isExpired: data.expires < Date.now(),
          source: 'memory'
        });
      }
      return codeInfo;
    }
  }
}

// Create and export a singleton instance
const linkCodeManager = new LinkCodeManager();
module.exports = linkCodeManager;