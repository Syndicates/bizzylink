package com.bizzynation.integrations;

import com.bizzynation.LinkPlugin;
import org.bukkit.Bukkit;
import org.bukkit.entity.Player;

import java.lang.reflect.Method;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;
import java.util.logging.Level;

/**
 * Handles integration with EssentialsX
 */
public class EssentialsIntegration {
    private final LinkPlugin plugin;
    private Object essentials = null;
    private boolean enabled = false;
    
    // Cached reflection methods
    private Method getUser = null;
    private Method getUserByUuid = null;
    private Method getUserMail = null;
    private Method getUserLastLogin = null;
    private Method getUserNickname = null;
    private Method getUserAfk = null;
    private Method getUserHomeCount = null;
    private Method getUserBanned = null;
    private Method getUserIpAddress = null;
    
    public EssentialsIntegration(LinkPlugin plugin) {
        this.plugin = plugin;
        setupIntegration();
    }
    
    /**
     * Sets up the Essentials integration
     */
    private void setupIntegration() {
        if (!plugin.getConfig().getBoolean("dependencies.use_essentials", true)) {
            plugin.getLogger().info("Essentials integration disabled in config");
            return;
        }
        
        if (Bukkit.getPluginManager().getPlugin("Essentials") == null) {
            plugin.getLogger().warning("Essentials plugin not found! Integration disabled.");
            return;
        }
        
        try {
            // Get Essentials plugin instance using reflection
            Class<?> essentialsClass = Class.forName("com.earth2me.essentials.Essentials");
            essentials = essentialsClass.getMethod("getPlugin").invoke(null);
            
            // Get essential methods using reflection
            getUser = essentialsClass.getMethod("getUser", String.class);
            getUserByUuid = essentialsClass.getMethod("getUser", UUID.class);
            
            // Get User class to access its methods
            Class<?> userClass = Class.forName("com.earth2me.essentials.User");
            getUserMail = userClass.getMethod("getMails");
            getUserLastLogin = userClass.getMethod("getLastLogin");
            getUserNickname = userClass.getMethod("getNickname");
            getUserAfk = userClass.getMethod("isAfk");
            getUserHomeCount = userClass.getMethod("getHomes");
            getUserBanned = userClass.getMethod("isBanned");
            
            try {
                // This method might not exist in all versions
                getUserIpAddress = userClass.getMethod("getLastLoginAddress");
            } catch (Exception e) {
                plugin.getLogger().warning("Could not find getLastLoginAddress method in Essentials, IP address will not be available");
            }
            
            enabled = true;
            plugin.getLogger().info("Essentials integration enabled! Version: " + 
                    Bukkit.getPluginManager().getPlugin("Essentials").getDescription().getVersion());
        } catch (Exception e) {
            plugin.getLogger().log(Level.SEVERE, "Error setting up Essentials integration: " + e.getMessage(), e);
        }
    }
    
    /**
     * Checks if Essentials integration is enabled
     * @return true if enabled
     */
    public boolean isEnabled() {
        return enabled && essentials != null;
    }
    
    /**
     * Gets player data from Essentials
     * @param player the player
     * @return Map of player data
     */
    public Map<String, Object> getPlayerData(Player player) {
        Map<String, Object> data = new HashMap<>();
        
        if (!isEnabled()) return data;
        
        try {
            // Get User instance
            Object user = getUserByUuid.invoke(essentials, player.getUniqueId());
            
            // Get basic data
            data.put("username", player.getName());
            data.put("uuid", player.getUniqueId().toString());
            
            // Get Essentials data
            try {
                data.put("nickname", getUserNickname.invoke(user));
            } catch (Exception e) {
                data.put("nickname", null);
            }
            
            try {
                data.put("last_login", getUserLastLogin.invoke(user));
            } catch (Exception e) {
                data.put("last_login", null);
            }
            
            try {
                data.put("afk", getUserAfk.invoke(user));
            } catch (Exception e) {
                data.put("afk", false);
            }
            
            try {
                data.put("home_count", ((java.util.List<?>) getUserHomeCount.invoke(user)).size());
            } catch (Exception e) {
                data.put("home_count", 0);
            }
            
            try {
                data.put("mail_count", ((java.util.List<?>) getUserMail.invoke(user)).size());
            } catch (Exception e) {
                data.put("mail_count", 0);
            }
            
            try {
                data.put("banned", getUserBanned.invoke(user));
            } catch (Exception e) {
                data.put("banned", false);
            }
            
            try {
                if (getUserIpAddress != null) {
                    data.put("ip_address", getUserIpAddress.invoke(user));
                }
            } catch (Exception e) {
                data.put("ip_address", null);
            }
        } catch (Exception e) {
            plugin.getLogger().warning("Error getting Essentials data for " + player.getName() + ": " + e.getMessage());
        }
        
        return data;
    }
    
    /**
     * Sends mail to a player
     * @param player the player's name
     * @param message the message
     * @return true if successful
     */
    public boolean sendMail(String player, String message) {
        if (!isEnabled()) return false;
        
        try {
            // Get User instance
            Object user = getUser.invoke(essentials, player);
            
            // Get User class to access the addMail method
            Method addMail = user.getClass().getMethod("addMail", String.class);
            
            // Send mail
            addMail.invoke(user, message);
            return true;
        } catch (Exception e) {
            plugin.getLogger().warning("Error sending mail to " + player + ": " + e.getMessage());
            return false;
        }
    }
}