package com.bizzynation;

import org.bukkit.Bukkit;
import org.bukkit.command.Command;
import org.bukkit.command.CommandExecutor;
import org.bukkit.command.CommandSender;
import org.bukkit.entity.Player;
import org.bukkit.ChatColor;

import java.io.OutputStream;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.BufferedReader;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.util.Scanner;
import java.util.logging.Level;

public class LinkCommand implements CommandExecutor {
    @Override
    public boolean onCommand(CommandSender sender, Command command, String label, String[] args) {
        if (!(sender instanceof Player)) {
            sender.sendMessage("This command can only be used by players.");
            return true;
        }

        Player player = (Player) sender;

        if (args.length != 1) {
            player.sendMessage(ChatColor.RED + "Usage: /link <code>");
            return true;
        }

        String code = args[0];

        try {
            // DETAILED DEBUG: Print class and method info to help diagnose issues
            Bukkit.getLogger().info("========= LINK DEBUGGING =========");
            Bukkit.getLogger().info("Current Class: " + this.getClass().getName());
            Bukkit.getLogger().info("Current Thread: " + Thread.currentThread().getName());
            
            // Check if LinkPlugin.getInstance() is null
            if (LinkPlugin.getInstance() == null) {
                Bukkit.getLogger().severe("[BizzyLink] ERROR: LinkPlugin.getInstance() is NULL!");
                player.sendMessage(ChatColor.RED + "Internal plugin error: Could not access plugin instance");
                return true;
            }
            
            // Get API URL from plugin config instead of hardcoding
            // HARDCODED FALLBACK VALUES in case config is not available
            String apiUrl = "http://localhost:8090";
            String verifyEndpoint = "/api/linkcode/validate";
            
            try {
                apiUrl = LinkPlugin.getInstance().getApiUrl();
                Bukkit.getLogger().info("Retrieved API URL from config: " + apiUrl);
            } catch (Exception e) {
                Bukkit.getLogger().severe("[BizzyLink] Failed to get API URL from config: " + e.getMessage());
                Bukkit.getLogger().info("[BizzyLink] Using fallback URL: " + apiUrl);
            }
            
            try {
                verifyEndpoint = LinkPlugin.getInstance().getVerifyEndpoint();
                Bukkit.getLogger().info("Retrieved verify endpoint from config: " + verifyEndpoint);
            } catch (Exception e) {
                Bukkit.getLogger().severe("[BizzyLink] Failed to get verify endpoint from config: " + e.getMessage());
                Bukkit.getLogger().info("[BizzyLink] Using fallback endpoint: " + verifyEndpoint);
            }
            
            // Check for trailing slash in URL and leading slash in endpoint
            boolean urlHasTrailingSlash = apiUrl.endsWith("/");
            boolean endpointHasLeadingSlash = verifyEndpoint.startsWith("/");
            
            String fullUrl;
            if (urlHasTrailingSlash && endpointHasLeadingSlash) {
                // Remove duplicate slash
                fullUrl = apiUrl + verifyEndpoint.substring(1);
            } else if (!urlHasTrailingSlash && !endpointHasLeadingSlash) {
                // Add missing slash
                fullUrl = apiUrl + "/" + verifyEndpoint;
            } else {
                // Correctly formatted
                fullUrl = apiUrl + verifyEndpoint;
            }
            
            Bukkit.getLogger().info("Final API URL: " + fullUrl);
            
            // Log the verification attempt
            Bukkit.getLogger().info("[BizzyLink] Attempting verification for player " + player.getName() + " with code " + code);
            Bukkit.getLogger().info("[BizzyLink] Using API URL: " + fullUrl);
            
            // Show message to player
            player.sendMessage(ChatColor.YELLOW + "Verifying your account, please wait...");
            
            // Create connection to API
            URL url = new URL(fullUrl);
            HttpURLConnection conn = (HttpURLConnection) url.openConnection();
            conn.setRequestMethod("POST");
            conn.setRequestProperty("Content-Type", "application/json");
            conn.setRequestProperty("User-Agent", "BizzyLink-Plugin");
            conn.setConnectTimeout(10000); // 10 second timeout
            conn.setReadTimeout(10000);
            conn.setDoOutput(true);

            // Create JSON payload with uppercase code to match server expectations
            String jsonInput = "{\"username\":\"" + player.getName() + "\",\"code\":\"" + code.toUpperCase() + "\",\"uuid\":\"" + player.getUniqueId() + "\"}";
            Bukkit.getLogger().info("[BizzyLink] Sending payload: " + jsonInput);
            
            // Send data to server
            try (OutputStream os = conn.getOutputStream()) {
                byte[] input = jsonInput.getBytes(StandardCharsets.UTF_8);
                os.write(input, 0, input.length);
            }

            // Read server response
            int responseCode = conn.getResponseCode();
            Bukkit.getLogger().info("[BizzyLink] Received response code: " + responseCode);
            
            // Read response content
            StringBuilder responseContent = new StringBuilder();
            try (BufferedReader br = new BufferedReader(
                    new InputStreamReader(
                        responseCode >= 200 && responseCode < 300 ? 
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
            Bukkit.getLogger().info("[BizzyLink] Response: " + jsonResponse);

            if (responseCode >= 200 && responseCode < 300) {
                // Success case - check for specific error message in response
                if (jsonResponse.contains("error")) {
                    // Extract error message if present
                    String errorMsg = "Unknown error";
                    if (jsonResponse.contains("\"error\":")) {
                        int start = jsonResponse.indexOf("\"error\":") + 8;
                        int end = jsonResponse.indexOf("\"", start + 1);
                        if (end > start) {
                            errorMsg = jsonResponse.substring(start, end).replace("\"", "").trim();
                        }
                    }
                    
                    Bukkit.getLogger().warning("[BizzyLink] API returned error despite 200 status: " + errorMsg);
                    player.sendMessage(ChatColor.RED + "Error: " + errorMsg);
                } else {
                    // Extract success message if present
                    String successMsg = "Your Minecraft account is now linked!";
                    if (jsonResponse.contains("\"message\":")) {
                        int start = jsonResponse.indexOf("\"message\":") + 10;
                        int end = jsonResponse.indexOf("\"", start + 1);
                        if (end > start) {
                            successMsg = jsonResponse.substring(start, end).replace("\"", "").trim();
                        }
                    }
                    
                    Bukkit.getLogger().info("[BizzyLink] Account linked successfully for " + player.getName());
                    player.sendMessage(ChatColor.GREEN + successMsg);
                }
            } else if (jsonResponse.contains("already linked")) {
                Bukkit.getLogger().info("[BizzyLink] Account already linked for " + player.getName());
                player.sendMessage(ChatColor.YELLOW + "Your account is already linked!");
            } else {
                // Extract error message if present
                String errorMsg = jsonResponse;
                if (jsonResponse.contains("\"error\":")) {
                    int start = jsonResponse.indexOf("\"error\":") + 8;
                    int end = jsonResponse.indexOf("\"", start + 1);
                    if (end > start) {
                        errorMsg = jsonResponse.substring(start, end).replace("\"", "").trim();
                    }
                }
                
                Bukkit.getLogger().warning("[BizzyLink] API returned error: " + errorMsg);
                player.sendMessage(ChatColor.RED + "Error: " + errorMsg);
            }
        } catch (Exception e) {
            // Log the full exception with COMPLETE details
            Bukkit.getLogger().severe("========= LINK ERROR DETAILS =========");
            Bukkit.getLogger().severe("[BizzyLink] Error type: " + e.getClass().getName());
            Bukkit.getLogger().severe("[BizzyLink] Error message: " + e.getMessage());
            
            // Get detailed network error info if available
            if (e instanceof java.net.ConnectException) {
                Bukkit.getLogger().severe("[BizzyLink] CONNECTION ERROR - Server is likely not running or wrong port");
            } else if (e instanceof java.net.UnknownHostException) {
                Bukkit.getLogger().severe("[BizzyLink] UNKNOWN HOST ERROR - Hostname cannot be resolved");
            } else if (e instanceof java.net.SocketTimeoutException) {
                Bukkit.getLogger().severe("[BizzyLink] TIMEOUT ERROR - Server took too long to respond");
            } else if (e instanceof java.net.MalformedURLException) {
                Bukkit.getLogger().severe("[BizzyLink] MALFORMED URL ERROR - URL format is incorrect");
            }
            
            // Print FULL stack trace to console for debugging
            Bukkit.getLogger().severe("[BizzyLink] Stack trace:");
            for (StackTraceElement element : e.getStackTrace()) {
                Bukkit.getLogger().severe("    at " + element.toString());
            }
            
            // Show detailed error to player
            player.sendMessage(ChatColor.RED + "Error connecting to the API: " + e.getMessage());
            player.sendMessage(ChatColor.YELLOW + "Please ask an admin to check the server logs!");
            
            // Print final debugging tips
            Bukkit.getLogger().severe("========= TROUBLESHOOTING TIPS =========");
            Bukkit.getLogger().severe("1. Make sure Node.js server is running");
            Bukkit.getLogger().severe("2. Check the URL and port in config.yml");
            Bukkit.getLogger().severe("3. Verify the endpoint path is correct");
            Bukkit.getLogger().severe("4. Make sure there are no firewall issues");
            Bukkit.getLogger().severe("5. Try connecting to the API manually with curl or similar tool");
            Bukkit.getLogger().severe("=========================================");
        }

        return true;
    }
}
