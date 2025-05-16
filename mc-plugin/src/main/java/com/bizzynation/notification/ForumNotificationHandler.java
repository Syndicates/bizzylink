package com.bizzynation.notification;

import com.bizzynation.LinkPlugin;
import org.bukkit.ChatColor;
import org.bukkit.entity.Player;
import org.bukkit.scheduler.BukkitRunnable;
import org.json.simple.JSONObject;
import org.json.simple.parser.JSONParser;
import org.json.simple.parser.ParseException;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.logging.Level;

/**
 * Handles forum notifications sent from the BizzyLink website
 * Used to display notifications to players about important forum posts
 */
public class ForumNotificationHandler {
    private final LinkPlugin plugin;
    private final Map<String, JSONObject> recentNotifications = new HashMap<>();
    private final List<String> pendingUrlClicks = new ArrayList<>();

    public ForumNotificationHandler(LinkPlugin plugin) {
        this.plugin = plugin;
    }

    /**
     * Process a notification from the website
     * @param notificationJson The JSON notification data as a string
     */
    public void processNotification(String notificationJson) {
        try {
            // Parse the notification JSON
            JSONParser parser = new JSONParser();
            JSONObject notification = (JSONObject) parser.parse(notificationJson);
            
            // Check if we have the required fields
            if (!notification.containsKey("message") || !notification.containsKey("type")) {
                plugin.getLogger().warning("Received invalid notification format: missing required fields");
                return;
            }
            
            String type = (String) notification.get("type");
            String message = (String) notification.get("message");
            String sender = notification.containsKey("sender") ? (String) notification.get("sender") : "System";
            String priority = notification.containsKey("priority") ? (String) notification.get("priority") : "NORMAL";
            String link = notification.containsKey("link") ? (String) notification.get("link") : null;
            
            // For forum notifications
            if (type.startsWith("FORUM_")) {
                handleForumNotification(notification, type, message, sender, priority, link);
            }
            
        } catch (ParseException e) {
            plugin.getLogger().log(Level.WARNING, "Failed to parse notification JSON", e);
        } catch (Exception e) {
            plugin.getLogger().log(Level.SEVERE, "Error processing notification", e);
        }
    }
    
    /**
     * Handle forum-specific notifications
     */
    private void handleForumNotification(JSONObject notification, String type, String message, 
                                        String sender, String priority, String link) {
        // Store notification for later retrieval
        String notificationId = "forum_" + System.currentTimeMillis();
        recentNotifications.put(notificationId, notification);
        
        // Clean up old notifications (keep only last 20)
        if (recentNotifications.size() > 20) {
            String oldestKey = recentNotifications.keySet().iterator().next();
            recentNotifications.remove(oldestKey);
        }
        
        // Determine broadcast scope
        boolean broadcast = notification.containsKey("broadcast") ? 
                            (boolean) notification.get("broadcast") : true;
        
        // If targeting specific players
        List<String> targets = new ArrayList<>();
        if (notification.containsKey("targets") && notification.get("targets") instanceof List) {
            targets.addAll((List<String>) notification.get("targets"));
        }
        
        // Create a formatted message
        boolean hasLink = link != null && !link.isEmpty();
        String formattedMessage = formatMessage(message, hasLink ? "Click to view" : null);
        
        // Send notification
        if (broadcast) {
            if (hasLink) {
                // Add link to pending clicks
                pendingUrlClicks.add(link);
                
                // Broadcast to all players with link
                broadcastWithLink(formattedMessage, link);
            } else {
                // Simple broadcast
                plugin.getServer().broadcastMessage(formattedMessage);
            }
        } else if (!targets.isEmpty()) {
            // Send only to specific players
            for (String target : targets) {
                Player player = plugin.getServer().getPlayerExact(target);
                if (player != null && player.isOnline()) {
                    if (hasLink) {
                        sendMessageWithLink(player, formattedMessage, link);
                    } else {
                        player.sendMessage(formattedMessage);
                    }
                }
            }
        }
        
        // For high priority posts, also show title
        if (priority.equals("HIGH") || priority.equals("CRITICAL")) {
            String title = ChatColor.GOLD + "Important Post";
            String subtitle = ChatColor.WHITE + sender + ChatColor.GRAY + " posted on the forum";
            
            // Show title to all online players or specific targets
            if (broadcast) {
                for (Player player : plugin.getServer().getOnlinePlayers()) {
                    player.sendTitle(title, subtitle, 10, 70, 20);
                }
            } else if (!targets.isEmpty()) {
                for (String target : targets) {
                    Player player = plugin.getServer().getPlayerExact(target);
                    if (player != null && player.isOnline()) {
                        player.sendTitle(title, subtitle, 10, 70, 20);
                    }
                }
            }
        }
    }
    
    /**
     * Format a notification message with Minecraft color codes
     */
    private String formatMessage(String message, String clickText) {
        // Add prefix
        String formatted = ChatColor.DARK_GRAY + "[" + ChatColor.GREEN + "BizzyLink" + 
                          ChatColor.DARK_GRAY + "] " + ChatColor.RESET;
        
        // Add message (may already contain color codes)
        formatted += message;
        
        // Add click prompt if needed
        if (clickText != null) {
            formatted += " " + ChatColor.YELLOW + ChatColor.ITALIC + clickText;
        }
        
        return formatted;
    }
    
    /**
     * Broadcast a message with clickable link to all online players
     */
    private void broadcastWithLink(String message, String link) {
        // Store link for click handling
        final String clickId = "click_" + System.currentTimeMillis();
        pendingUrlClicks.add(link);
        
        // Schedule removal of the link after 5 minutes
        new BukkitRunnable() {
            @Override
            public void run() {
                pendingUrlClicks.remove(link);
            }
        }.runTaskLater(plugin, 6000); // 5 minutes = 6000 ticks
        
        // Send to all players
        for (Player player : plugin.getServer().getOnlinePlayers()) {
            sendMessageWithLink(player, message, link);
        }
    }
    
    /**
     * Send a message with clickable link to a specific player
     */
    private void sendMessageWithLink(Player player, String message, String link) {
        // Implementation depends on your server version
        // For modern servers with JSON support:
        
        // Using net.md_5.bungee.api.chat API for JSON messages (Available in Spigot)
        // This would usually be implemented with TextComponent, but keeping it simple
        // for compatibility with older versions
        
        // Simple implementation using /tellraw
        String command = String.format(
            "tellraw %s {\"text\":\"%s\",\"clickEvent\":{\"action\":\"open_url\",\"value\":\"%s\"}}",
            player.getName(),
            message.replace("\"", "\\\""),
            link
        );
        
        // Execute the command
        plugin.getServer().dispatchCommand(plugin.getServer().getConsoleSender(), command);
    }
    
    /**
     * Check if a URL is in the pending clicks list
     */
    public boolean isValidPendingUrl(String url) {
        return pendingUrlClicks.contains(url);
    }
    
    /**
     * Process a player's click on a URL
     */
    public void handleUrlClick(Player player, String url) {
        if (isValidPendingUrl(url)) {
            // Log the click
            plugin.getLogger().info(player.getName() + " clicked on forum notification URL: " + url);
            
            // You can add additional logic here, like tracking which players
            // have seen important announcements
            
            // Remove from pending list after use
            pendingUrlClicks.remove(url);
        } else {
            player.sendMessage(ChatColor.RED + "This link has expired or is not valid.");
        }
    }
}