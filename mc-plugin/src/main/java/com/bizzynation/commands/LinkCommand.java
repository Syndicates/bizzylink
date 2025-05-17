/**
 * +-------------------------------------------------+
 * |                 BIZZY NATION                    |
 * |          Crafted with ♦ by Bizzy 2025         |
 * +-------------------------------------------------+
 * 
 * @file LinkCommand.java
 * @description 
 * @copyright © Bizzy Nation - All Rights Reserved
 * @license Proprietary - Not for distribution
 * 
 * This file is protected intellectual property of Bizzy Nation.
 * Unauthorized use, copying, or distribution is prohibited.
 */

package com.bizzynation.commands;

import com.bizzynation.LinkPlugin;
import com.bizzynation.utils.ApiService;
import com.bizzynation.utils.MessageUtils;
import org.bukkit.Bukkit;
import org.bukkit.command.Command;
import org.bukkit.command.CommandExecutor;
import org.bukkit.command.CommandSender;
import org.bukkit.command.TabCompleter;
import org.bukkit.entity.Player;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;

public class LinkCommand implements CommandExecutor, TabCompleter {
    private final LinkPlugin plugin;
    private final ApiService apiService;
    private final HashSet<UUID> unlinkConfirmations = new HashSet<>();

    public LinkCommand(LinkPlugin plugin) {
        this.plugin = plugin;
        this.apiService = new ApiService(plugin);
    }

    @Override
    public boolean onCommand(CommandSender sender, Command command, String label, String[] args) {
        if (!(sender instanceof Player)) {
            MessageUtils.sendMessage(sender, "&cThis command can only be used by players.");
            return true;
        }

        Player player = (Player) sender;
        UUID playerUUID = player.getUniqueId();

        // Check permission
        if (!player.hasPermission("bizzylink.use")) {
            MessageUtils.sendMessage(player, plugin.getConfig().getString("messages.no-permission", 
                    "&cYou don't have permission to use this command."));
            return true;
        }

        // Check if already linked - but only if not trying to link with a code and not using other commands
        if (args.length > 0 && !args[0].matches("^[a-zA-Z0-9]{6}$") && 
            !args[0].equalsIgnoreCase("sync") && 
            !args[0].equalsIgnoreCase("status") &&
            !args[0].equalsIgnoreCase("help") &&
            !args[0].equalsIgnoreCase("unlink") &&
            !args[0].equalsIgnoreCase("reload") &&
            plugin.getConfigManager().isPlayerLinked(playerUUID)) {
            
            MessageUtils.sendMessage(player, plugin.getConfig().getString("messages.already-linked", 
                    "&6[BizzyLink] &cYour account is already linked!"));
            return true;
        }

        // If no arguments provided, show help
        if (args.length == 0) {
            showHelp(player);
            return true;
        }

        // Handle subcommands
        switch (args[0].toLowerCase()) {
            case "help":
                showHelp(player);
                break;
                
            case "status":
                showStatus(player);
                break;
                
            case "sync":
                handleSync(player);
                break;
                
            case "unlink":
                handleUnlink(player);
                break;
                
            case "reload":
                if (player.hasPermission("bizzylink.admin")) {
                    plugin.reloadPluginConfig();
                    MessageUtils.sendMessage(player, "&6[BizzyLink] &aConfiguration reloaded successfully!");
                } else {
                    MessageUtils.sendMessage(player, plugin.getConfig().getString("messages.no-permission", 
                            "&cYou don't have permission to use this command."));
                }
                break;
                
            default:
                // Assume the argument is a verification code
                String code = args[0];
                
                // Validate code format (alphanumeric, 6 characters)
                if (!code.matches("^[a-zA-Z0-9]{6}$")) {
                    MessageUtils.sendMessage(player, plugin.getConfig().getString("messages.invalid-code", 
                            "&6[BizzyLink] &cInvalid verification code. Codes are 6 characters (letters and numbers)."));
                    return true;
                }
                
                // Show verification in progress message
                MessageUtils.sendMessage(player, plugin.getConfig().getString("messages.verifying", 
                        "&6[BizzyLink] &eVerifying your account, please wait..."));
                
                // Log the verification attempt to console
                plugin.getLogger().info("===== LINK ATTEMPT STARTED =====");
                plugin.getLogger().info("Player: " + player.getName());
                plugin.getLogger().info("UUID: " + player.getUniqueId());
                plugin.getLogger().info("Code: " + code);
                plugin.getLogger().info("Time: " + java.time.LocalDateTime.now());
                
                // Perform verification asynchronously
                CompletableFuture.runAsync(() -> {
                    try {
                        // Reset link status first to avoid "already linked" issues
                        plugin.getConfigManager().clearLinkData(playerUUID);
                        plugin.getLogger().info("Cleared previous link data for " + player.getName());
                        
                        // Send colorful message to console for visibility
                        Bukkit.getConsoleSender().sendMessage("§e[BizzyLink] §fProcessing link request for §b" + player.getName() + "§f with code §6" + code);
                        
                        boolean success = apiService.verifyLinkCode(player.getName(), code);
                        plugin.getLogger().info("Verification result: " + (success ? "SUCCESS" : "FAILED"));
                        
                        if (success) {
                            // Update local cache
                            plugin.getConfigManager().setPlayerLinked(playerUUID, true);
                            plugin.getLogger().info("Player marked as linked in local cache");
                            
                            // Show success message
                            MessageUtils.sendMessage(player, plugin.getConfig().getString("messages.link-success", 
                                    "&6[BizzyLink] &aYour Minecraft account has been successfully linked!"));
                            
                            // Execute post-link commands if configured
                            if (plugin.getConfig().getBoolean("execute-commands-on-link", false)) {
                                List<String> commands = plugin.getConfig().getStringList("on-link-commands");
                                plugin.getLogger().info("Executing " + commands.size() + " post-link commands");
                                
                                for (String cmd : commands) {
                                    String finalCmd = cmd.replace("%player%", player.getName());
                                    plugin.getLogger().info("Executing command: " + finalCmd);
                                    
                                    plugin.getServer().getScheduler().runTask(plugin, () -> {
                                        plugin.getServer().dispatchCommand(
                                                plugin.getServer().getConsoleSender(), 
                                                finalCmd
                                        );
                                    });
                                }
                            }
                            
                            // Log success to console
                            Bukkit.getConsoleSender().sendMessage("§a[BizzyLink] §fAccount successfully linked for §b" + player.getName());
                        } else {
                            // Ensure player is marked as unlinked in the local cache
                            plugin.getConfigManager().setPlayerLinked(playerUUID, false);
                            plugin.getLogger().info("Player marked as NOT linked in local cache");
                            
                            MessageUtils.sendMessage(player, plugin.getConfig().getString("messages.link-failed", 
                                    "&6[BizzyLink] &cVerification failed. Make sure your code is correct and not expired."));
                            
                            // Log failure to console
                            Bukkit.getConsoleSender().sendMessage("§c[BizzyLink] §fAccount linking failed for §b" + player.getName());
                        }
                    } catch (Exception e) {
                        // Ensure player is marked as unlinked in the local cache on error
                        plugin.getConfigManager().setPlayerLinked(playerUUID, false);
                        
                        // Detailed error logging
                        plugin.getLogger().severe("Error verifying link code: " + e.getMessage());
                        plugin.getLogger().severe("Stack trace:");
                        for (StackTraceElement element : e.getStackTrace()) {
                            plugin.getLogger().severe("  at " + element.toString());
                        }
                        
                        MessageUtils.sendMessage(player, plugin.getConfig().getString("messages.link-error", 
                                "&6[BizzyLink] &cAn error occurred while linking your account. Please try again later."));
                        
                        Bukkit.getConsoleSender().sendMessage("§4[BizzyLink] §fError during account linking for §b" + 
                                player.getName() + "§f: §c" + e.getMessage());
                    } finally {
                        plugin.getLogger().info("===== LINK ATTEMPT FINISHED =====");
                    }
                });
                break;
        }

        return true;
    }

    private void showHelp(Player player) {
        MessageUtils.sendMessage(player, "&6---------- &eBizzyLink Help &6----------");
        MessageUtils.sendMessage(player, "&6/link <code> &7- Link your Minecraft account with a verification code");
        MessageUtils.sendMessage(player, "&6/link status &7- Check your account linking status");
        MessageUtils.sendMessage(player, "&6/link sync &7- Sync your data with the website"); 
        MessageUtils.sendMessage(player, "&6/link unlink &7- Unlink your account (if needed)");
        MessageUtils.sendMessage(player, "&6/link help &7- Show this help message");
        
        if (player.hasPermission("bizzylink.admin")) {
            MessageUtils.sendMessage(player, "&6/link reload &7- Reload the plugin configuration");
        }
        
        // Show website URL
        String websiteUrl = plugin.getConfig().getString("website-url", "https://bizzynation.co.uk");
        MessageUtils.sendMessage(player, String.format(
            plugin.getConfig().getString("messages.website-url", "&6Website: &b%s"), 
            websiteUrl
        ));
        
        MessageUtils.sendMessage(player, "&6-----------------------------------");
    }

    private void showStatus(Player player) {
        UUID playerUUID = player.getUniqueId();
        
        // First check locally
        boolean locallyLinked = plugin.getConfigManager().isPlayerLinked(playerUUID);
        
        // Show a message that we're checking
        MessageUtils.sendMessage(player, "&6[BizzyLink] &eChecking your account status...");
        
        // Run an async task to check with the backend too
        plugin.getServer().getScheduler().runTaskAsynchronously(plugin, () -> {
            try {
                // Try to get player data from the API
                // This is a simplified version - in a real implementation, you'd call an API endpoint
                boolean backendLinked = checkLinkedStatusWithBackend(player);
                
                if (backendLinked) {
                    // If they're linked on the backend but not locally, update local state
                    if (!locallyLinked) {
                        plugin.getConfigManager().setPlayerLinked(playerUUID, true);
                        plugin.getLogger().info("Updated local link status for " + player.getName() + " based on backend");
                    }
                    
                    // Show the linked message
                    MessageUtils.sendMessage(player, plugin.getConfig().getString("messages.status-linked", 
                            "&6[BizzyLink] &aYour Minecraft account is linked to the website!"));
                } else {
                    // If they're not linked on the backend but are locally, update local state
                    if (locallyLinked) {
                        plugin.getConfigManager().clearLinkData(playerUUID);
                        plugin.getLogger().info("Cleared local link status for " + player.getName() + " based on backend");
                    }
                    
                    // Show the not linked message
                    MessageUtils.sendMessage(player, plugin.getConfig().getString("messages.status-not-linked", 
                            "&6[BizzyLink] &eYour account is not linked. Visit the website to get a link code."));
                    MessageUtils.sendMessage(player, String.format(
                        plugin.getConfig().getString("messages.website-url", 
                            "&6Website: &b%s"), 
                        plugin.getConfig().getString("website-url", "https://bizzynation.co.uk")));
                }
            } catch (Exception e) {
                // If we can't reach the backend, just use the local status
                plugin.getLogger().warning("Error checking link status: " + e.getMessage());
                
                if (locallyLinked) {
                    MessageUtils.sendMessage(player, "&6[BizzyLink] &eAccording to local data, your account is linked.");
                    MessageUtils.sendMessage(player, "&6[BizzyLink] &7(Could not verify with website)");
                } else {
                    MessageUtils.sendMessage(player, plugin.getConfig().getString("messages.status-not-linked", 
                            "&6[BizzyLink] &eYour account is not linked. Visit the website to get a link code."));
                    MessageUtils.sendMessage(player, String.format(
                        plugin.getConfig().getString("messages.website-url", 
                            "&6Website: &b%s"), 
                        plugin.getConfig().getString("website-url", "https://bizzynation.co.uk")));
                }
            }
        });
    }
    
    /**
     * Checks if the player's account is linked on the backend
     * @param player The player to check
     * @return True if the account is linked
     */
    private boolean checkLinkedStatusWithBackend(Player player) {
        try {
            // Create the API URL for checking link status
            String apiUrl = plugin.getApiUrl() + "/api/player/status";
            
            plugin.getLogger().info("Checking link status at API: " + apiUrl);
            
            // Create connection
            URL url = new URL(apiUrl);
            HttpURLConnection conn = (HttpURLConnection) url.openConnection();
            conn.setRequestMethod("POST");
            conn.setRequestProperty("Content-Type", "application/json");
            conn.setRequestProperty("User-Agent", "BizzyLink-Plugin");
            conn.setConnectTimeout(10000);
            conn.setReadTimeout(10000);
            conn.setDoOutput(true);
            
            // Create JSON payload with player info
            String jsonInput = "{\"username\":\"" + player.getName() + "\",\"uuid\":\"" + player.getUniqueId() + "\"}";
            
            // Send data to server
            try (OutputStream os = conn.getOutputStream()) {
                byte[] input = jsonInput.getBytes(StandardCharsets.UTF_8);
                os.write(input, 0, input.length);
            }
            
            // Get response
            int statusCode = conn.getResponseCode();
            plugin.getLogger().info("Status check response code: " + statusCode);
            
            // Read response content
            StringBuilder responseContent = new StringBuilder();
            try (BufferedReader br = new BufferedReader(
                    new InputStreamReader(
                        statusCode >= 200 && statusCode < 300 ? 
                        conn.getInputStream() : conn.getErrorStream(), 
                        StandardCharsets.UTF_8
                    )
                )) {
                
                String responseLine;
                while ((responseLine = br.readLine()) != null) {
                    responseContent.append(responseLine.trim());
                }
            }
            
            String jsonResponse = responseContent.toString();
            plugin.getLogger().info("Status check response: " + jsonResponse);
            
            // Check if the response indicates the player is linked
            boolean isLinked = jsonResponse.contains("\"linked\":true") || jsonResponse.contains("\"isLinked\":true");
            
            // If the player is linked according to the backend, update our local state
            if (isLinked) {
                plugin.getConfigManager().setPlayerLinked(player.getUniqueId(), true);
            }
            
            return isLinked;
        } catch (Exception e) {
            plugin.getLogger().warning("Error checking link status: " + e.getMessage());
            return false;
        }
    }

    private void handleUnlink(Player player) {
        try {
            UUID playerUUID = player.getUniqueId();
            // First check if the player is actually linked in our local data
            boolean isLinkedLocally = plugin.getConfigManager().isPlayerLinked(playerUUID);
            
            if (!isLinkedLocally) {
                // Player is not linked according to our data
                MessageUtils.sendMessage(player, "&6[BizzyLink] &eYou are not currently linked to any account.");
                return;
            }
            
            MessageUtils.sendMessage(player, "&6[BizzyLink] &eUnlinking your account, please wait...");
            
            // Try to notify backend about unlink
            try {
                // Call the unlink API endpoint
                boolean success = unlinkWithBackend(player);
                
                if (success) {
                    // Only clear local data after successful backend unlink
                    plugin.getConfigManager().clearLinkData(playerUUID);
                    MessageUtils.sendMessage(player, "&6[BizzyLink] &aYour account has been unlinked successfully!");
                    plugin.getLogger().info("Player " + player.getName() + " unlinked their account");
                } else {
                    // If backend unlink failed but we still thought they were linked
                    MessageUtils.sendMessage(player, "&6[BizzyLink] &cFailed to unlink your account. Please try again or contact an admin.");
                    plugin.getLogger().warning("Failed to unlink account for " + player.getName() + " via API");
                }
            } catch (Exception e) {
                // If there was an error, we'll still unlink locally
                plugin.getConfigManager().clearLinkData(playerUUID);
                MessageUtils.sendMessage(player, "&6[BizzyLink] &eYour account has been unlinked locally, but there was an error communicating with the website.");
                plugin.getLogger().warning("Error unlinking account for " + player.getName() + ": " + e.getMessage());
            }
            
            // Ensure unlinkConfirmations is cleared
            unlinkConfirmations.remove(playerUUID);
        } catch (Exception e) {
            plugin.getLogger().severe("Unexpected error in handleUnlink: " + e.getMessage());
            e.printStackTrace();
            MessageUtils.sendMessage(player, "&6[BizzyLink] &cAn unexpected error occurred. Please try again later.");
        }
    }
    
    /**
     * Calls the backend API to unlink the player's account
     * @param player The player to unlink
     * @return True if the account was successfully unlinked
     */
    private boolean unlinkWithBackend(Player player) {
        try {
            String apiUrl = plugin.getApiUrl() + plugin.getUnlinkEndpoint();
            plugin.getLogger().info("Calling unlink API at: " + apiUrl);
            
            // Create connection
            URL url = new URL(apiUrl);
            HttpURLConnection conn = (HttpURLConnection) url.openConnection();
            conn.setRequestMethod("POST");  // Using POST for our special endpoint
            conn.setRequestProperty("Content-Type", "application/json");
            conn.setRequestProperty("User-Agent", "BizzyLink-Plugin");
            conn.setConnectTimeout(10000);
            conn.setReadTimeout(10000);
            conn.setDoOutput(true);
            
            // Create payload
            String jsonPayload = String.format("{\"username\":\"%s\",\"uuid\":\"%s\"}", 
                    player.getName(), player.getUniqueId().toString());
            
            plugin.getLogger().info("Sending unlink payload: " + jsonPayload);
            
            // Send request
            try (OutputStream os = conn.getOutputStream()) {
                byte[] input = jsonPayload.getBytes(StandardCharsets.UTF_8);
                os.write(input, 0, input.length);
                os.flush();
            }
            
            // Get response
            int statusCode = conn.getResponseCode();
            plugin.getLogger().info("Unlink response code: " + statusCode);
            
            // Read response content
            StringBuilder responseContent = new StringBuilder();
            try (BufferedReader br = new BufferedReader(
                    new InputStreamReader(
                        statusCode >= 200 && statusCode < 300 ? 
                        conn.getInputStream() : conn.getErrorStream(), 
                        StandardCharsets.UTF_8
                    )
                )) {
                
                String responseLine;
                while ((responseLine = br.readLine()) != null) {
                    responseContent.append(responseLine.trim());
                }
            }
            
            String response = responseContent.toString();
            plugin.getLogger().info("Unlink response: " + response);
            
            // Check if the unlink was successful
            boolean success = statusCode == 200 && response.contains("\"success\":true");
            
            // Also check for the "alreadyUnlinked" case which the backend might return
            boolean alreadyUnlinked = statusCode == 200 && response.contains("\"alreadyUnlinked\":true");
            
            // Consider both cases a success
            return success || alreadyUnlinked;
        } catch (Exception e) {
            plugin.getLogger().severe("Error calling unlink API: " + e.getMessage());
            return false;
        }
    }
    
    /**
     * Handles syncing player data with the website
     * Fast immediate sync with minimal debug output
     * @param player The player
     */
    private void handleSync(Player player) {
        // Check permissions first
        if (!player.hasPermission("bizzylink.sync")) {
            MessageUtils.sendMessage(player, plugin.getConfig().getString("messages.no-permission"));
            return;
        }
        
        // Check if player is linked
        boolean isLinked = plugin.getConfigManager().isPlayerLinked(player.getUniqueId());
        if (!isLinked) {
            MessageUtils.sendMessage(player, plugin.getConfig().getString("messages.status-not-linked"));
            return;
        }
        
        // Show minimal sync message
        MessageUtils.sendMessage(player, "&6[BizzyLink] &eSynchronizing your data...");
        
        // Check if real-time updates are enabled
        boolean realtimeEnabled = plugin.getConfig().getBoolean("api.realtime_updates", true);
        // Check if debug mode is enabled
        boolean debugMode = plugin.getConfig().getBoolean("data.debug_sync", false);
        
        if (debugMode) {
            plugin.getLogger().info("Sync request from " + player.getName() + " (" + player.getUniqueId() + ")");
            plugin.getLogger().info("Realtime updates: " + (realtimeEnabled ? "ENABLED" : "DISABLED"));
            
            // Direct message to player about integration status in debug mode only
            player.sendMessage("§e[Debug] Economy: " + plugin.getVaultIntegration().isEconomyEnabled() + 
                               " | Permissions: " + plugin.getVaultIntegration().isPermissionEnabled() + 
                               " | LuckPerms: " + plugin.getLuckPermsIntegration().isEnabled());
        }
        
        // Perform sync in async task with highest priority for immediate execution
        plugin.getServer().getScheduler().runTaskAsynchronously(plugin, () -> {
            try {
                // Use a connection timeout appropriate for immediate sync
                int timeout = plugin.getConfig().getInt("api.sync_timeout", 3000); // 3 second default
                
                // Force clear the cache before syncing to ensure fresh data
                plugin.getConfigManager().clearCache(player.getUniqueId());
                
                // Set a flag in player metadata to prevent spam-clicking
                if (player.hasMetadata("bizzylink_syncing")) {
                    // Only show message if last sync was within 1 second (faster response)
                    long lastSync = player.getMetadata("bizzylink_syncing").get(0).asLong();
                    if (System.currentTimeMillis() - lastSync < 1000) {
                        MessageUtils.sendMessage(player, "&6[BizzyLink] &eSync already in progress, please wait...");
                        return;
                    }
                }
                
                // Set syncing metadata
                player.setMetadata("bizzylink_syncing", 
                    new org.bukkit.metadata.FixedMetadataValue(plugin, System.currentTimeMillis()));
                
                // First do a direct webhook notification for real-time updates if enabled
                // This wakes up the server-side event stream immediately
                if (realtimeEnabled) {
                    try {
                        // Try to trigger real-time update first for immediate UI refresh
                        // Failure here won't stop the main sync
                        triggerWebsiteUpdate(player);
                        
                        // SEND MULTIPLE NOTIFICATIONS to wake up the server
                        for (int i = 0; i < 3; i++) {
                            Thread.sleep(100); // Small delay between notifications
                            triggerWebsiteUpdate(player);
                        }
                    } catch (Exception e) {
                        // Ignore errors, this is just a preliminary notification
                    }
                }
                
                // Perform the main sync with shorter timeout
                long startTime = System.currentTimeMillis();
                boolean success = plugin.getPlayerDataManager().syncPlayerData(player);
                long syncTime = System.currentTimeMillis() - startTime;
                
                // Remove syncing metadata
                player.removeMetadata("bizzylink_syncing", plugin);
                
                if (success) {
                    // Get balance and group for display
                    String balanceDisplay = "";
                    String groupDisplay = "";
                    
                    try {
                        double balance = plugin.getVaultIntegration().getBalance(player);
                        balanceDisplay = String.format("%.2f", balance);
                    } catch (Exception e) {
                        balanceDisplay = "N/A";
                    }
                    
                    try {
                        String group = plugin.getVaultIntegration().getPrimaryGroup(player);
                        groupDisplay = group;
                    } catch (Exception e) {
                        groupDisplay = "N/A";
                    }
                    
                    // Show success message with real-time status
                    if (debugMode) {
                        MessageUtils.sendMessage(player, String.format(
                            "&6[BizzyLink] &aSync complete! &7(%.1fs)&a Balance: &f%s &a| Rank: &f%s &7| Realtime: %s",
                            syncTime/1000.0, balanceDisplay, groupDisplay, realtimeEnabled ? "✓" : "✗"));
                    } else {
                        if (realtimeEnabled) {
                            MessageUtils.sendMessage(player, String.format(
                                "&6[BizzyLink] &aSync complete! Website updated instantly &7(%dms)",
                                syncTime));
                        } else {
                            MessageUtils.sendMessage(player, String.format(
                                "&6[BizzyLink] &aSync complete! Balance: &f%s &a| Rank: &f%s",
                                balanceDisplay, groupDisplay));
                        }
                    }
                    
                    // Do a second trigger to ensure the website refreshes
                    if (realtimeEnabled) {
                        try {
                            // This is a follow-up notification to ensure the data is fresh
                            triggerWebsiteUpdate(player);
                            
                            // Send only one follow-up notification with longer delay to avoid rate limiting
                            Thread.sleep(2000); // 2 second delay to avoid rate limiting
                            triggerWebsiteUpdate(player);
                        } catch (Exception e) {
                            // Log but don't worry too much, the main sync was successful
                            if (debugMode) {
                                plugin.getLogger().warning("Failed to send follow-up webhook: " + e.getMessage());
                            }
                        }
                    }
                } else {
                    MessageUtils.sendMessage(player, "&6[BizzyLink] &cSync failed. Please try again in a moment.");
                    
                    if (debugMode) {
                        plugin.getLogger().severe("Sync failed for " + player.getName() + " after " + syncTime + "ms");
                    }
                }
            } catch (Exception e) {
                plugin.getLogger().severe("Error syncing player data: " + e.getMessage());
                if (debugMode) {
                    e.printStackTrace();
                }
                MessageUtils.sendMessage(player, "&6[BizzyLink] &cAn error occurred: " + e.getMessage());
                
                // Remove syncing metadata in case of error
                player.removeMetadata("bizzylink_syncing", plugin);
            }
        });
    }
    
    /**
     * Triggers a website update for the player via WebSocket if configured
     * This helps the website refresh without waiting for polling
     * @param player The player
     */
    private void triggerWebsiteUpdate(Player player) {
        try {
            // Check if real-time updates are enabled
            if (!plugin.getConfig().getBoolean("api.realtime_updates", false)) {
                return;
            }
            
            // Get the webhook URL for real-time updates
            String webhookUrl = plugin.getConfig().getString("api.update_webhook", "");
            if (webhookUrl.isEmpty()) {
                return;
            }
            
            // Run this in a separate thread to not block the sync response
            new Thread(() -> {
                try {
                    // Create payload with player UUID
                    String payload = "{\"type\":\"player_update\",\"uuid\":\"" + 
                                     player.getUniqueId().toString() + "\"}";
                                     
                    // Open connection
                    URL url = new URL(webhookUrl);
                    HttpURLConnection conn = (HttpURLConnection) url.openConnection();
                    conn.setRequestMethod("POST");
                    conn.setRequestProperty("Content-Type", "application/json");
                    conn.setRequestProperty("User-Agent", "BizzyLink-Plugin");
                    conn.setConnectTimeout(2000); // Short timeout - 2 seconds
                    conn.setReadTimeout(2000);    // Short read timeout - 2 seconds
                    conn.setDoOutput(true);
                    
                    // Send payload
                    try (java.io.OutputStream os = conn.getOutputStream()) {
                        byte[] input = payload.getBytes(java.nio.charset.StandardCharsets.UTF_8);
                        os.write(input, 0, input.length);
                    }
                    
                    // Get response code (but don't wait for content)
                    int responseCode = conn.getResponseCode();
                    
                    // Log result if in debug mode
                    if (plugin.getConfig().getBoolean("data.debug_sync", false)) {
                        plugin.getLogger().info("Website update trigger result: " + responseCode);
                    }
                } catch (Exception e) {
                    // Just log but don't show to player - this is a silent background operation
                    plugin.getLogger().fine("Error triggering website update: " + e.getMessage());
                }
            }).start();
            
        } catch (Exception e) {
            // Just log but don't show to player
            plugin.getLogger().fine("Error preparing website update: " + e.getMessage());
        }
    }

    @Override
    public List<String> onTabComplete(CommandSender sender, Command command, String alias, String[] args) {
        if (args.length == 1) {
            List<String> completions = new ArrayList<>(Arrays.asList("help", "status", "unlink"));
            
            // Add sync subcommand if player has permission
            if (sender.hasPermission("bizzylink.sync")) {
                completions.add("sync");
            }
            
            if (sender.hasPermission("bizzylink.admin")) {
                completions.add("reload");
            }
            
            // Filter based on current input
            if (args[0].length() > 0) {
                return completions.stream()
                        .filter(s -> s.toLowerCase().startsWith(args[0].toLowerCase()))
                        .collect(java.util.stream.Collectors.toList());
            }
            
            return completions;
        }
        
        // Tab complete for second arguments
        if (args.length == 2) {
            if (args[0].equalsIgnoreCase("unlink") && 
                    plugin.getConfigManager().isPlayerLinked(((Player) sender).getUniqueId())) {
                List<String> subCompletions = new ArrayList<>();
                subCompletions.add("confirm");
                return subCompletions;
            }
        }
        
        return new ArrayList<>();
    }
}