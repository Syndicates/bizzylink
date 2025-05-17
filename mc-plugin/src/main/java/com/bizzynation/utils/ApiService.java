/**
 * +-------------------------------------------------+
 * |                 BIZZY NATION                    |
 * |          Crafted with ♦ by Bizzy 2025         |
 * +-------------------------------------------------+
 * 
 * @file ApiService.java
 * @description 
 * @copyright © Bizzy Nation - All Rights Reserved
 * @license Proprietary - Not for distribution
 * 
 * This file is protected intellectual property of Bizzy Nation.
 * Unauthorized use, copying, or distribution is prohibited.
 */

package com.bizzynation.utils;

import com.bizzynation.LinkPlugin;
import org.bukkit.Bukkit;
import org.bukkit.OfflinePlayer;
import org.bukkit.entity.Player;
import org.json.simple.JSONObject;
import org.json.simple.parser.JSONParser;
import net.luckperms.api.LuckPerms;
import net.luckperms.api.LuckPermsProvider;
import net.luckperms.api.model.user.User;
import net.milkbowl.vault.economy.Economy;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.InetAddress;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;
import java.util.logging.Level;

/**
 * Service for interacting with the BizzyLink API
 */
public class ApiService {
    private final LinkPlugin plugin;
    private Economy economy;
    private LuckPerms luckPerms;
    private final Map<UUID, Long> playtimeSessions = new HashMap<>();
    
    /**
     * Performs a GET request to the API
     * @param endpoint The API endpoint to call (e.g., "/api/player/123")
     * @return The response string
     * @throws IOException If an error occurs during the HTTP request
     */
    public String get(String endpoint) throws IOException {
        String apiUrl = plugin.getApiUrl() + (endpoint.startsWith("/") ? endpoint : "/" + endpoint);
        URL url = new URL(apiUrl);
        HttpURLConnection conn = (HttpURLConnection) url.openConnection();
        conn.setRequestMethod("GET");
        conn.setRequestProperty("Content-Type", "application/json");
        conn.setRequestProperty("User-Agent", "BizzyLink-Plugin/" + plugin.getDescription().getVersion());
        conn.setConnectTimeout(5000);
        conn.setReadTimeout(5000);
        
        int statusCode = conn.getResponseCode();
        if (statusCode >= 200 && statusCode < 300) {
            try (BufferedReader br = new BufferedReader(new InputStreamReader(conn.getInputStream(), StandardCharsets.UTF_8))) {
                StringBuilder response = new StringBuilder();
                String responseLine;
                while ((responseLine = br.readLine()) != null) {
                    response.append(responseLine.trim());
                }
                return response.toString();
            }
        } else {
            throw new IOException("API request failed with status code: " + statusCode);
        }
    }
    
    /**
     * Performs a POST request to the API
     * @param endpoint The API endpoint to call (e.g., "/api/player/123")
     * @param data Map of data to send as JSON
     * @return The response string
     * @throws IOException If an error occurs during the HTTP request
     */
    public String post(String endpoint, Map<String, String> data) throws IOException {
        String apiUrl = plugin.getApiUrl() + (endpoint.startsWith("/") ? endpoint : "/" + endpoint);
        URL url = new URL(apiUrl);
        HttpURLConnection conn = (HttpURLConnection) url.openConnection();
        conn.setRequestMethod("POST");
        conn.setRequestProperty("Content-Type", "application/json");
        conn.setRequestProperty("User-Agent", "BizzyLink-Plugin/" + plugin.getDescription().getVersion());
        conn.setConnectTimeout(5000);
        conn.setReadTimeout(5000);
        conn.setDoOutput(true);
        
        // Convert map to JSON
        JSONObject jsonObject = new JSONObject(data);
        String jsonPayload = jsonObject.toJSONString();
        
        // Send the data
        try (OutputStream os = conn.getOutputStream()) {
            byte[] input = jsonPayload.getBytes(StandardCharsets.UTF_8);
            os.write(input, 0, input.length);
        }
        
        int statusCode = conn.getResponseCode();
        if (statusCode >= 200 && statusCode < 300) {
            try (BufferedReader br = new BufferedReader(new InputStreamReader(conn.getInputStream(), StandardCharsets.UTF_8))) {
                StringBuilder response = new StringBuilder();
                String responseLine;
                while ((responseLine = br.readLine()) != null) {
                    response.append(responseLine.trim());
                }
                return response.toString();
            }
        } else {
            try (BufferedReader br = new BufferedReader(new InputStreamReader(conn.getErrorStream(), StandardCharsets.UTF_8))) {
                StringBuilder response = new StringBuilder();
                String responseLine;
                while ((responseLine = br.readLine()) != null) {
                    response.append(responseLine.trim());
                }
                throw new IOException("API request failed with status code: " + statusCode + ", message: " + response);
            }
        }
    }
    
    public ApiService(LinkPlugin plugin) {
        this.plugin = plugin;
        
        // Setup Vault Economy if enabled
        if (plugin.getConfig().getBoolean("data.track_economy", true) && 
            plugin.getConfig().getBoolean("dependencies.use_vault", true)) {
            try {
                if (Bukkit.getPluginManager().getPlugin("Vault") != null) {
                    if (plugin.getServer().getServicesManager().getRegistration(Economy.class) != null) {
                        this.economy = plugin.getServer().getServicesManager().getRegistration(Economy.class).getProvider();
                        MessageUtils.log(Level.INFO, "Connected to Vault Economy: " + (this.economy != null));
                    } else {
                        MessageUtils.log(Level.WARNING, "Vault found but no economy provider is registered");
                    }
                } else {
                    MessageUtils.log(Level.INFO, "Vault plugin not found. Economy features disabled.");
                }
            } catch (Exception e) {
                MessageUtils.log(Level.WARNING, "Failed to connect to Vault Economy: " + e.getMessage());
                // Continue without Vault
            }
        } else {
            MessageUtils.log(Level.INFO, "Vault integration disabled in config.");
        }
        
        // Setup LuckPerms if enabled
        if (plugin.getConfig().getBoolean("data.track_permissions", true) && 
            plugin.getConfig().getBoolean("dependencies.use_luckperms", true)) {
            try {
                if (Bukkit.getPluginManager().getPlugin("LuckPerms") != null) {
                    this.luckPerms = LuckPermsProvider.get();
                    MessageUtils.log(Level.INFO, "Connected to LuckPerms: " + (this.luckPerms != null));
                } else {
                    MessageUtils.log(Level.INFO, "LuckPerms plugin not found. Permissions features disabled.");
                }
            } catch (Exception e) {
                MessageUtils.log(Level.WARNING, "Failed to connect to LuckPerms: " + e.getMessage());
                // Continue without LuckPerms
            }
        } else {
            MessageUtils.log(Level.INFO, "LuckPerms integration disabled in config.");
        }
    }
    
    /**
     * Verifies a link code with the API
     * @param username The player's Minecraft username
     * @param code The link code to verify
     * @return True if verification was successful
     * @throws Exception If an error occurs
     */
    public boolean verifyLinkCode(String username, String code) throws Exception {
        // First check if this code is valid (not expired)
        Player player = Bukkit.getPlayer(username);
        if (player == null) {
            MessageUtils.log(Level.WARNING, "Player not found: " + username);
            return false;
        }
        
        // Check if test mode is enabled and if the code matches the test code
        if (plugin.getConfig().getBoolean("debug.test_mode", false)) {
            String testCode = plugin.getConfig().getString("debug.test_link_code", "");
            MessageUtils.log(Level.INFO, "🔍 TEST MODE ENABLED! Test code: " + testCode);
            MessageUtils.log(Level.INFO, "🔍 Player code: " + code);
            
            if (!testCode.isEmpty() && code.equalsIgnoreCase(testCode)) {
                MessageUtils.log(Level.INFO, "✅ TEST CODE MATCHED! Auto-approving link for " + username);
                Bukkit.getConsoleSender().sendMessage("§e[BizzyLink] §a✅ TEST CODE MATCHED! Auto-approving link for " + username);
                
                // Mark the player as linked in the local config
                plugin.getConfigManager().setPlayerLinked(player.getUniqueId(), true);
                
                // Store the successful link in the player meta
                player.sendMessage("§a[BizzyLink] §fYour account has been successfully linked in TEST MODE!");
                
                return true;
            }
        }
        
        // Always clear the link status before attempting to link again
        // This prevents "already linked" issues when retrying
        plugin.getConfigManager().clearLinkData(player.getUniqueId());
        
        // Print config information for debugging
        MessageUtils.log(Level.INFO, "===== DEBUG INFORMATION =====");
        MessageUtils.log(Level.INFO, "API URL from config: " + plugin.getApiUrl());
        MessageUtils.log(Level.INFO, "Verify endpoint from config: " + plugin.getVerifyEndpoint());
        
        // Log any potential environment issues
        try {
            InetAddress address = InetAddress.getByName(new URL(plugin.getApiUrl()).getHost());
            MessageUtils.log(Level.INFO, "Host resolves to: " + address.getHostAddress());
        } catch (Exception e) {
            MessageUtils.log(Level.WARNING, "Could not resolve host: " + e.getMessage());
        }
        
        // Log current directory and Java version for debugging
        MessageUtils.log(Level.INFO, "Working directory: " + System.getProperty("user.dir"));
        MessageUtils.log(Level.INFO, "Java version: " + System.getProperty("java.version"));
        MessageUtils.log(Level.INFO, "===== END DEBUG INFO =====");
        
        String apiUrl = plugin.getApiUrl() + plugin.getVerifyEndpoint();
        MessageUtils.log(Level.INFO, "🔄 VERIFICATION ATTEMPT: Code [" + code + "] for player [" + username + "]");
        MessageUtils.log(Level.INFO, "Full API URL: " + apiUrl);
        
        // This fix attempts to handle the URL correctly by ensuring it doesn't have double slashes
        String cleanApiUrl = plugin.getApiUrl().endsWith("/") ? 
                             plugin.getApiUrl().substring(0, plugin.getApiUrl().length() - 1) : 
                             plugin.getApiUrl();

        String cleanEndpoint = plugin.getVerifyEndpoint().startsWith("/") ? 
                              plugin.getVerifyEndpoint() : 
                              "/" + plugin.getVerifyEndpoint();

        apiUrl = cleanApiUrl + cleanEndpoint;
        MessageUtils.log(Level.INFO, "🔄 FIXED API URL: " + apiUrl);
        
        // Create connection
        URL url = new URL(apiUrl);
        HttpURLConnection conn = (HttpURLConnection) url.openConnection();
        conn.setRequestMethod("POST");
        conn.setRequestProperty("Content-Type", "application/json");
        conn.setRequestProperty("User-Agent", "BizzyLink-Plugin/" + plugin.getDescription().getVersion());
        conn.setConnectTimeout(15000); // Increased timeout to 15 seconds
        conn.setReadTimeout(15000);    // Increased timeout to 15 seconds
        conn.setDoOutput(true);
        
        // Create JSON payload - use uppercase for code to match server expectation
        String jsonPayload = String.format("{\"username\":\"%s\",\"code\":\"%s\",\"uuid\":\"%s\"}", 
                escapeJson(username), escapeJson(code.toUpperCase()), player.getUniqueId().toString());
        
        MessageUtils.log(Level.INFO, "📤 Sending payload: " + jsonPayload);
        Bukkit.getConsoleSender().sendMessage("§e[BizzyLink] §fSending verification request to server...");
        
        // Send request
        try (OutputStream os = conn.getOutputStream()) {
            byte[] input = jsonPayload.getBytes(StandardCharsets.UTF_8);
            os.write(input, 0, input.length);
            os.flush();
        }
        
        // Get response
        int statusCode;
        try {
            statusCode = conn.getResponseCode();
            MessageUtils.log(Level.INFO, "📥 Received response code: " + statusCode);
            Bukkit.getConsoleSender().sendMessage("§e[BizzyLink] §fReceived response: " + statusCode);
        } catch (Exception e) {
            MessageUtils.log(Level.SEVERE, "Failed to get response code: " + e.getMessage());
            Bukkit.getConsoleSender().sendMessage("§c[BizzyLink] §fConnection error: " + e.getMessage());
            player.sendMessage("§c[BizzyLink] §fCould not connect to verification server. Please try again later.");
            return false;
        }
        
        // Read the response regardless of status code
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
        } catch (Exception e) {
            MessageUtils.log(Level.WARNING, "Error reading response: " + e.getMessage());
        }
        
        String responseStr = responseContent.toString();
        MessageUtils.log(Level.INFO, "📄 Full response body: " + responseStr);
        Bukkit.getConsoleSender().sendMessage("§e[BizzyLink] §fResponse: " + responseStr);
        
        // Try to parse the response as JSON for better error reporting
        try {
            // IMPORTANT: Fix for Minecraft plugin verifications - accept 200 responses with message as success
            if (responseStr.contains("\"success\":true") || 
                (statusCode == 200 && responseStr.contains("\"message\":") && !responseStr.contains("\"error\":"))) {
                
                // Success!
                MessageUtils.log(Level.INFO, "✅ Successfully linked account for " + username);
                Bukkit.getConsoleSender().sendMessage("§a[BizzyLink] §fSuccessfully linked account for " + username);
                
                // Extract success message if possible to show to player
                String successMsg = "Your Minecraft account has been successfully linked!";
                if (responseStr.contains("\"message\":")) {
                    try {
                        int start = responseStr.indexOf("\"message\":") + 10;
                        int end = responseStr.indexOf("\"", start + 1);
                        if (end > start) {
                            successMsg = responseStr.substring(start, end);
                            successMsg = successMsg.replace("\"", "").trim();
                        }
                    } catch (Exception e) {
                        // If we can't extract the message, use the default
                    }
                }
                
                // Show success message to player
                player.sendMessage("§a[BizzyLink] §f" + successMsg);
                
                // Send initial player data to API
                plugin.getConfigManager().setPlayerLinked(player.getUniqueId(), true);
                sendPlayerData(player);
                
                return true;
            } else {
                // Extract error message if possible
                String errorMsg = "Verification failed";
                if (responseStr.contains("\"error\":")) {
                    try {
                        int start = responseStr.indexOf("\"error\":") + 8;
                        int end = responseStr.indexOf("\"", start + 1);
                        if (end > start) {
                            errorMsg = responseStr.substring(start, end);
                            errorMsg = errorMsg.replace("\"", "").trim();
                        }
                    } catch (Exception e) {
                        // If we can't extract the error, use the default
                    }
                }
                
                MessageUtils.log(Level.WARNING, "❌ Link failed: " + errorMsg);
                Bukkit.getConsoleSender().sendMessage("§c[BizzyLink] §fLink failed: " + errorMsg);
                
                // Send specific error to player if we extracted one
                if (!errorMsg.equals("Verification failed")) {
                    player.sendMessage("§c[BizzyLink] §f" + errorMsg);
                } else {
                    player.sendMessage("§c[BizzyLink] §fVerification failed. Make sure your code is correct and not expired.");
                }
                
                return false;
            }
        } catch (Exception e) {
            MessageUtils.log(Level.WARNING, "Error parsing response: " + e.getMessage());
            e.printStackTrace(); // Print full stack trace for debugging
        }
        
        if (statusCode == 200) {
            // Default success case if we couldn't parse JSON but got 200 OK
            MessageUtils.log(Level.INFO, "✅ Successfully linked account for " + username + " (default 200 OK)");
            
            // Send initial player data to API
            plugin.getConfigManager().setPlayerLinked(player.getUniqueId(), true);
            sendPlayerData(player);
            
            return true;
        } else {
            // Error handling for non-200 responses
            MessageUtils.log(Level.WARNING, "❌ API Error: HTTP " + statusCode);
            
            // Special case for common status codes
            if (statusCode == 404) {
                MessageUtils.log(Level.SEVERE, "API endpoint not found. Check that the API URL and endpoints in config.yml are correct.");
                Bukkit.getConsoleSender().sendMessage("§c[BizzyLink] §fAPI endpoint not found (404). Check server configuration.");
            } else if (statusCode == 400) {
                MessageUtils.log(Level.WARNING, "Bad request (400). The link code may be invalid or expired.");
                Bukkit.getConsoleSender().sendMessage("§c[BizzyLink] §fBad request (400). The link code may be invalid or expired.");
            } else if (statusCode == 500) {
                MessageUtils.log(Level.WARNING, "Server error (500). There might be an issue with the API server.");
                Bukkit.getConsoleSender().sendMessage("§c[BizzyLink] §fServer error (500). The API server is experiencing issues.");
            }
            
            return false;
        }
    }
    
    /**
     * Sends player data to the API
     * @param player The player to send data for
     * @return True if the data was sent successfully
     */
    public boolean sendPlayerData(Player player) {
        if (!plugin.getConfigManager().isPlayerLinked(player.getUniqueId())) {
            return false; // Don't send data for unlinked players
        }
        
        try {
            long startTime = System.currentTimeMillis();
            boolean debugMode = plugin.getConfig().getBoolean("data.debug_sync", false);
            
            // Use the comprehensive PlayerDataManager to collect all player data
            Map<String, Object> playerDataMap = plugin.getPlayerDataManager().collectPlayerData(player);
            
            // Convert to JSONObject for sending
            JSONObject playerData = new JSONObject(playerDataMap);
            
            // Ensure these core fields are always present
            if (!playerData.containsKey("uuid")) {
                playerData.put("uuid", player.getUniqueId().toString());
            }
            
            if (!playerData.containsKey("username")) {
                playerData.put("username", player.getName());
            }
            
            if (!playerData.containsKey("lastSeen")) {
                playerData.put("lastSeen", Instant.now().getEpochSecond());
            }
            
            // Add playtime data if enabled and not already included
            if (plugin.getConfig().getBoolean("data.track_playtime", true) && !playerData.containsKey("currentSession")) {
                long currentSession = 0;
                if (playtimeSessions.containsKey(player.getUniqueId())) {
                    long loginTime = playtimeSessions.get(player.getUniqueId());
                    currentSession = (System.currentTimeMillis() - loginTime) / 1000; // in seconds
                }
                playerData.put("currentSession", currentSession);
            }
            
            // Debug info
            if (debugMode) {
                MessageUtils.log(Level.INFO, "Sending data for " + player.getName() + " with " + playerData.size() + " fields");
                
                // Log important statistics but not the whole payload
                if (playerData.containsKey("blocks_mined"))
                    MessageUtils.log(Level.INFO, "  - blocks_mined: " + playerData.get("blocks_mined"));
                if (playerData.containsKey("mcmmo_data"))
                    MessageUtils.log(Level.INFO, "  - mcmmo_data: present");
                if (playerData.containsKey("balance"))
                    MessageUtils.log(Level.INFO, "  - balance: " + playerData.get("balance"));
                if (playerData.containsKey("inventory"))
                    MessageUtils.log(Level.INFO, "  - inventory: present");
            }
            
            // Send the data to the API
            String apiUrl = plugin.getApiUrl() + plugin.getPlayerUpdateEndpoint();
            URL url = new URL(apiUrl);
            HttpURLConnection conn = (HttpURLConnection) url.openConnection();
            conn.setRequestMethod("POST");
            conn.setRequestProperty("Content-Type", "application/json");
            conn.setRequestProperty("User-Agent", "BizzyLink-Plugin/" + plugin.getDescription().getVersion());
            conn.setConnectTimeout(10000); // Increased timeout
            conn.setReadTimeout(10000);   // Increased timeout
            conn.setDoOutput(true);
            
            if (debugMode) {
                MessageUtils.log(Level.INFO, "Sending data to " + apiUrl);
            }
            
            // Send the JSON data
            try (OutputStream os = conn.getOutputStream()) {
                byte[] input = playerData.toJSONString().getBytes(StandardCharsets.UTF_8);
                os.write(input, 0, input.length);
            }
            
            int statusCode = conn.getResponseCode();
            boolean success = statusCode >= 200 && statusCode < 300;
            
            long endTime = System.currentTimeMillis();
            long duration = endTime - startTime;
            
            if (success) {
                if (debugMode) {
                    MessageUtils.log(Level.INFO, "Successfully sent data for " + player.getName() + 
                                   " in " + duration + "ms (HTTP " + statusCode + ")");
                }
                
                // Update the last sync time in the config manager
                plugin.getConfigManager().updateLastSyncTime(player.getUniqueId());
                
                // Try to read some of the response for debugging
                if (debugMode) {
                    try (BufferedReader br = new BufferedReader(
                            new InputStreamReader(conn.getInputStream(), StandardCharsets.UTF_8))) {
                        String responseText = br.readLine(); // Just read the first line
                        if (responseText != null) {
                            MessageUtils.log(Level.INFO, "Response: " + 
                                           (responseText.length() > 100 ? 
                                            responseText.substring(0, 100) + "..." : responseText));
                        }
                    } catch (Exception e) {
                        // Ignore errors reading the response
                    }
                }
            } else {
                // Check for rate limit errors and provide more specific logging
                if (statusCode == 429) {
                    // For rate limit errors, reduce logging to prevent console spam
                    // Only log every 5th rate limit error to minimize log flooding
                    if (Math.random() < 0.2) {
                        MessageUtils.log(Level.WARNING, "Rate limit exceeded when sending player data for " + player.getName());
                    }
                } else {
                    MessageUtils.log(Level.WARNING, "Failed to send player data for " + player.getName() + 
                                   ": HTTP " + statusCode + " (took " + duration + "ms)");
                    
                    // Try to read error response for debugging
                    try (BufferedReader br = new BufferedReader(
                            new InputStreamReader(conn.getErrorStream(), StandardCharsets.UTF_8))) {
                        String responseText = br.readLine(); // Just read the first line
                        if (responseText != null) {
                            MessageUtils.log(Level.WARNING, "Error response: " + 
                                           (responseText.length() > 100 ? 
                                            responseText.substring(0, 100) + "..." : responseText));
                        }
                    } catch (Exception e) {
                        // Ignore errors reading the error response
                    }
                }
                
                // Skip webhook notification on errors
                return false;
            }
            
            // Send real-time update notification much less frequently to avoid flooding the frontend with notifications
            if (success && plugin.getConfig().getBoolean("api.realtime_updates", true)) {
                try {
                    // Only send notification in very limited cases (1 in 6 chance) to dramatically reduce notifications
                    // This still enables live updates but minimizes excessive notification messages
                    if (Math.random() < 0.17) {
                        notifyRealtimeUpdate(player.getUniqueId().toString());
                    }
                } catch (Exception e) {
                    // Don't fail the whole sync if just the notification fails
                    if (debugMode) {
                        MessageUtils.log(Level.WARNING, "Failed to send real-time update notification: " + e.getMessage());
                    }
                }
            }
            
            return success;
        } catch (Exception e) {
            MessageUtils.log(Level.SEVERE, "Error sending player data for " + player.getName() + ": " + e.getMessage());
            if (plugin.getConfig().getBoolean("data.debug_sync", false)) {
                e.printStackTrace();
            }
            return false;
        }
    }
    
    /**
     * Start tracking playtime for a player
     * @param player The player to track
     */
    public void startPlaytimeTracking(Player player) {
        if (plugin.getConfig().getBoolean("data.track_playtime", true)) {
            playtimeSessions.put(player.getUniqueId(), System.currentTimeMillis());
        }
    }
    
    /**
     * Stop tracking playtime for a player and sync their data
     * @param player The player to stop tracking
     */
    public void stopPlaytimeTracking(Player player) {
        if (plugin.getConfig().getBoolean("data.track_playtime", true)) {
            if (playtimeSessions.containsKey(player.getUniqueId())) {
                // Send a final update before removing from tracking
                sendPlayerData(player);
                playtimeSessions.remove(player.getUniqueId());
            }
        }
    }
    
    /**
     * Get a player's linked account data from the API
     * @param uuid The player's UUID
     * @return A JSONObject containing the player's data, or null if not found/linked
     */
    public JSONObject getPlayerData(UUID uuid) {
        if (!plugin.getConfigManager().isPlayerLinked(uuid)) {
            return null; // Player not linked
        }
        
        try {
            String apiUrl = plugin.getApiUrl() + 
                plugin.getPlayerDataEndpoint().replace("%uuid%", uuid.toString());
            
            URL url = new URL(apiUrl);
            HttpURLConnection conn = (HttpURLConnection) url.openConnection();
            conn.setRequestMethod("GET");
            conn.setRequestProperty("Content-Type", "application/json");
            conn.setRequestProperty("User-Agent", "BizzyLink-Plugin/" + plugin.getDescription().getVersion());
            conn.setConnectTimeout(5000);
            conn.setReadTimeout(5000);
            
            int statusCode = conn.getResponseCode();
            if (statusCode == 200) {
                try (BufferedReader br = new BufferedReader(
                        new InputStreamReader(conn.getInputStream(), StandardCharsets.UTF_8))) {
                    
                    StringBuilder response = new StringBuilder();
                    String responseLine;
                    while ((responseLine = br.readLine()) != null) {
                        response.append(responseLine.trim());
                    }
                    
                    JSONParser parser = new JSONParser();
                    return (JSONObject) parser.parse(response.toString());
                }
            } else {
                MessageUtils.log(Level.WARNING, "Failed to get player data: HTTP " + statusCode);
                return null;
            }
        } catch (Exception e) {
            MessageUtils.log(Level.SEVERE, "Error getting player data: " + e.getMessage());
            return null;
        }
    }
    
    /**
     * Notify the real-time update webhook about player data changes
     * This is a lightweight method that just tells the server to refresh data for a player
     * Much faster than sending the full data again
     * @param uuid The player's UUID
     * @return True if the notification was sent successfully
     */
    public boolean notifyRealtimeUpdate(String uuid) {
        // Only continue if real-time updates are enabled
        if (!plugin.getConfig().getBoolean("api.realtime_updates", true)) {
            return false;
        }
        
        try {
            // Get the webhook URL from config
            String webhookUrl = plugin.getApiUrl();
            String updateEndpoint = plugin.getConfig().getString("api.update_webhook", "/api/realtime/notify");
            
            // Make sure we have a valid URL format
            if (webhookUrl.endsWith("/") && updateEndpoint.startsWith("/")) {
                webhookUrl = webhookUrl + updateEndpoint.substring(1);
            } else if (!webhookUrl.endsWith("/") && !updateEndpoint.startsWith("/")) {
                webhookUrl = webhookUrl + "/" + updateEndpoint;
            } else {
                webhookUrl = webhookUrl + updateEndpoint;
            }
            
            // Create small JSON payload
            String jsonPayload = String.format(
                "{\"type\":\"player_update\",\"uuid\":\"%s\",\"timestamp\":%d}",
                escapeJson(uuid),
                System.currentTimeMillis()
            );
            
            // Use shorter timeouts for real-time updates to fail fast if there's an issue
            URL url = new URL(webhookUrl);
            HttpURLConnection conn = (HttpURLConnection) url.openConnection();
            conn.setRequestMethod("POST");
            conn.setRequestProperty("Content-Type", "application/json");
            conn.setRequestProperty("User-Agent", "BizzyLink-Plugin/" + plugin.getDescription().getVersion());
            conn.setRequestProperty("Accept", "application/json"); // Add Accept header
            conn.setConnectTimeout(3000); // 3-second connection timeout
            conn.setReadTimeout(3000);    // 3-second read timeout
            conn.setDoOutput(true);
            
            // Send the tiny JSON payload
            try (OutputStream os = conn.getOutputStream()) {
                byte[] input = jsonPayload.getBytes(StandardCharsets.UTF_8);
                os.write(input, 0, input.length);
            }
            
            // Check response code but don't wait for detailed response
            int statusCode = conn.getResponseCode();
            
            if (statusCode >= 200 && statusCode < 300) {
                // Success, but we don't need to read the response
                if (plugin.getConfig().getBoolean("data.debug_sync", false)) {
                    MessageUtils.log(Level.INFO, "Real-time update webhook notification sent successfully");
                }
                return true;
            } else {
                MessageUtils.log(Level.WARNING, "Failed to send real-time webhook notification: HTTP " + statusCode);
                return false;
            }
        } catch (Exception e) {
            // More detailed error logging for better debugging
            MessageUtils.log(Level.WARNING, "Error sending real-time webhook notification: " + e.getMessage());
            if (plugin.getConfig().getBoolean("data.debug_sync", false)) {
                e.printStackTrace(); // Print stack trace in debug mode
                // Don't try to use webhookUrl - it may not be in scope in this catch block
                MessageUtils.log(Level.WARNING, "API URL: " + plugin.getApiUrl());
                MessageUtils.log(Level.WARNING, "Update endpoint: " + plugin.getConfig().getString("api.update_webhook"));
                MessageUtils.log(Level.WARNING, "UUID format was: " + uuid);
            }
            return false;
        }
    }
    
    /**
     * Check for new link codes for a specific player
     * @param player The player to check for
     * @return True if a new code was found and notification sent
     */
    public boolean checkForPendingLinkCodes(Player player) {
        try {
            // Only check if the player is not already linked
            if (plugin.getConfigManager().isPlayerLinked(player.getUniqueId())) {
                return false;
            }
            
            // Create API URL for checking pending link codes for this player
            String apiUrl = plugin.getApiUrl() + "/api/linkcode/pending";
            
            // Create connection
            URL url = new URL(apiUrl);
            HttpURLConnection conn = (HttpURLConnection) url.openConnection();
            conn.setRequestMethod("POST");
            conn.setRequestProperty("Content-Type", "application/json");
            conn.setRequestProperty("User-Agent", "BizzyLink-Plugin/" + plugin.getDescription().getVersion());
            conn.setConnectTimeout(5000);
            conn.setReadTimeout(5000);
            conn.setDoOutput(true);
            
            // Create payload with player info
            String jsonPayload = String.format(
                "{\"username\":\"%s\",\"uuid\":\"%s\"}",
                escapeJson(player.getName()),
                player.getUniqueId().toString()
            );
            
            // Send request
            try (OutputStream os = conn.getOutputStream()) {
                byte[] input = jsonPayload.getBytes(StandardCharsets.UTF_8);
                os.write(input, 0, input.length);
                os.flush();
            }
            
            // Get response
            int statusCode = conn.getResponseCode();
            
            if (statusCode == 200) {
                // Read the response
                StringBuilder responseContent = new StringBuilder();
                try (BufferedReader br = new BufferedReader(
                        new InputStreamReader(conn.getInputStream(), StandardCharsets.UTF_8)
                )) {
                    String responseLine;
                    while ((responseLine = br.readLine()) != null) {
                        responseContent.append(responseLine.trim());
                    }
                }
                
                String response = responseContent.toString();
                
                // Check if there's a pending code
                if (response.contains("\"code\":")) {
                    // Extract the code and notify the player
                    try {
                        // Basic extraction - in a production environment, use a proper JSON parser
                        int codeStart = response.indexOf("\"code\":\"") + 8;
                        int codeEnd = response.indexOf("\"", codeStart);
                        if (codeEnd > codeStart) {
                            String code = response.substring(codeStart, codeEnd);
                            
                            // Send the notification to the player
                            MessageUtils.sendMessage(player, plugin.getConfig().getString("messages.pending-link",
                                    "&6[BizzyLink] &eA link code has been generated for you: &6" + code));
                            
                            // Add notification about how to verify
                            MessageUtils.sendMessage(player, plugin.getConfig().getString("messages.verify-instructions",
                                    "&6[BizzyLink] &eType &6/link " + code + " &eto verify your account!"));
                            
                            return true;
                        }
                    } catch (Exception e) {
                        MessageUtils.log(Level.WARNING, "Error parsing pending code response: " + e.getMessage());
                    }
                }
            }
            
            // No pending codes or an error occurred
            return false;
        } catch (Exception e) {
            MessageUtils.log(Level.WARNING, "Error checking pending link codes: " + e.getMessage());
            return false;
        }
    }
    
    /**
     * Escapes special characters in a string for JSON
     * @param input The input string
     * @return The escaped string
     */
    private String escapeJson(String input) {
        return input.replace("\\", "\\\\")
                .replace("\"", "\\\"")
                .replace("\b", "\\b")
                .replace("\f", "\\f")
                .replace("\n", "\\n")
                .replace("\r", "\\r")
                .replace("\t", "\\t");
    }
}