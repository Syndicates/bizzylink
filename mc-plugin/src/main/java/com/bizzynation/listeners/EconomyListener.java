/**
 * +-------------------------------------------------+
 * |                 BIZZY NATION                    |
 * |          Crafted with ♦ by Bizzy 2025         |
 * +-------------------------------------------------+
 * 
 * @file EconomyListener.java
 * @description 
 * @copyright © Bizzy Nation - All Rights Reserved
 * @license Proprietary - Not for distribution
 * 
 * This file is protected intellectual property of Bizzy Nation.
 * Unauthorized use, copying, or distribution is prohibited.
 */

package com.bizzynation.listeners;

import com.bizzynation.LinkPlugin;
import com.bizzynation.utils.ApiService;
import com.bizzynation.utils.MessageUtils;
import org.bukkit.Bukkit;
import org.bukkit.entity.Player;
import org.bukkit.event.EventHandler;
import org.bukkit.event.EventPriority;
import org.bukkit.event.Listener;
import org.bukkit.event.server.PluginEnableEvent;
import org.bukkit.scheduler.BukkitTask;

import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

/**
 * Listener for economy-related events and balance changes
 * This uses a polling approach to detect balance changes since
 * many economy plugins don't have direct events for transactions
 */
public class EconomyListener implements Listener {
    private final LinkPlugin plugin;
    private final ApiService apiService;
    private BukkitTask economyMonitorTask;
    
    // Store last known balances for comparison
    private final Map<UUID, Double> lastKnownBalances = new HashMap<>();
    // Track when the last notification was sent for each player
    private final Map<UUID, Long> lastNotificationTimes = new HashMap<>();
    
    // Configuration
    private int balanceCheckInterval;
    private boolean realTimeEconomyUpdates;
    private double balanceChangeThreshold;
    private int minimumNotificationDelay;

    public EconomyListener(LinkPlugin plugin) {
        this.plugin = plugin;
        this.apiService = new ApiService(plugin);
        loadConfiguration();
        setupEconomyMonitor();
    }
    
    /**
     * Load configuration values
     */
    private void loadConfiguration() {
        balanceCheckInterval = plugin.getConfig().getInt("api.realtime_sync_interval", 3);
        // Make sure interval is at least 1 second
        if (balanceCheckInterval < 1) {
            balanceCheckInterval = 1;
        }
        
        realTimeEconomyUpdates = plugin.getConfig().getBoolean("api.realtime_updates", true) &&
                                plugin.getConfig().getBoolean("api.economy_sync", true);
                                
        balanceChangeThreshold = plugin.getConfig().getDouble("data.sync_economy_threshold", 100.0);
        minimumNotificationDelay = plugin.getConfig().getInt("data.sync_economy_minimum_delay", 15);
        
        if (minimumNotificationDelay < 1) {
            minimumNotificationDelay = 1; // At least 1 second between updates
        }
    }
    
    /**
     * Set up the economy monitoring task
     */
    private void setupEconomyMonitor() {
        // Only set up monitoring if real-time updates are enabled
        if (!realTimeEconomyUpdates) {
            return;
        }
        
        // Cancel any existing task
        if (economyMonitorTask != null) {
            economyMonitorTask.cancel();
        }
        
        // Convert seconds to ticks (20 ticks = 1 second)
        int ticks = balanceCheckInterval * 20;
        
        // Create a new monitoring task
        economyMonitorTask = plugin.getServer().getScheduler().runTaskTimerAsynchronously(
            plugin,
            this::checkPlayerBalances,
            ticks,  // Initial delay
            ticks   // Repeat interval
        );
        
        MessageUtils.log(java.util.logging.Level.INFO, 
            "Economy monitoring started with " + balanceCheckInterval + " second interval");
    }
    
    /**
     * Stops the economy monitor task
     */
    public void stopMonitoring() {
        if (economyMonitorTask != null) {
            economyMonitorTask.cancel();
            economyMonitorTask = null;
        }
    }
    
    /**
     * Check player balances and detect changes
     */
    private void checkPlayerBalances() {
        // Skip if vault economy is not enabled
        if (!plugin.getVaultIntegration().isEconomyEnabled()) {
            return;
        }
        
        // For each online player
        for (Player player : Bukkit.getOnlinePlayers()) {
            UUID playerUUID = player.getUniqueId();
            
            // Skip if player isn't linked
            if (!plugin.getConfigManager().isPlayerLinked(playerUUID)) {
                continue;
            }
            
            try {
                // Get current balance
                double currentBalance = plugin.getVaultIntegration().getBalance(player);
                
                // Debug log every check for this player
                if (plugin.getConfig().getBoolean("data.debug_sync", false)) {
                    MessageUtils.log(java.util.logging.Level.INFO, 
                        "Economy check for " + player.getName() + 
                        " - Current balance: " + currentBalance);
                }
                
                // If we have a previous balance to compare
                if (lastKnownBalances.containsKey(playerUUID)) {
                    double previousBalance = lastKnownBalances.get(playerUUID);
                    double difference = Math.abs(currentBalance - previousBalance);
                    
                    // Debug log
                    MessageUtils.log(java.util.logging.Level.INFO, 
                        "Economy check for " + player.getName() + 
                        " - Previous: " + previousBalance + ", Current: " + currentBalance + 
                        ", Diff: " + difference + ", Threshold: " + balanceChangeThreshold);
                    
                    // FORCE SEND UPDATE FOR TESTING
                    // Remove this in production - for testing only
                    if (currentBalance != previousBalance) {
                        MessageUtils.log(java.util.logging.Level.INFO, 
                            "🔄 Force triggering update - values different");
                    }
                    
                    // If the balance has changed AT ALL
                    // Changed condition from >= to > for more sensitivity
                    if (difference > 0.0) {
                        // Check if enough time has passed since last notification
                        long now = System.currentTimeMillis();
                        long lastNotification = lastNotificationTimes.getOrDefault(playerUUID, 0L);
                        long elapsedSeconds = (now - lastNotification) / 1000;
                        
                        // ALWAYS NOTIFY - REMOVE THE TIME CHECK FOR TESTING
                        //if (elapsedSeconds >= minimumNotificationDelay) {
                            // Trigger sync for the player
                            MessageUtils.log(java.util.logging.Level.INFO, 
                                "🔄 Balance change detected for " + player.getName() + 
                                ": " + previousBalance + " -> " + currentBalance + 
                                " (diff: " + difference + ")");
                                
                            // Send webhook notification for immediate update
                            boolean webhookSuccess = apiService.notifyRealtimeUpdate(playerUUID.toString());
                            MessageUtils.log(java.util.logging.Level.INFO, 
                                "🔄 Webhook notification sent: " + (webhookSuccess ? "SUCCESS" : "FAILED"));
                            
                            // Record notification time
                            lastNotificationTimes.put(playerUUID, now);
                            
                            // Send player data IMMEDIATELY for faster updates
                            boolean dataSuccess = apiService.sendPlayerData(player);
                            MessageUtils.log(java.util.logging.Level.INFO, 
                                "🔄 Player data sent: " + (dataSuccess ? "SUCCESS" : "FAILED"));
                            
                            // Send MULTIPLE notifications to ensure delivery
                            for (int i = 0; i < 3; i++) {
                                final int attemptNumber = i + 1;
                                plugin.getServer().getScheduler().runTaskLaterAsynchronously(
                                    plugin, 
                                    () -> {
                                        boolean success = apiService.notifyRealtimeUpdate(playerUUID.toString());
                                        MessageUtils.log(java.util.logging.Level.INFO, 
                                            "🔄 Additional webhook notification #" + attemptNumber + ": " + 
                                            (success ? "SUCCESS" : "FAILED"));
                                    },
                                    (i + 1) * 5L // Spaced out by 5 ticks each
                                );
                            }
                            
                            // Send player data AGAIN after a short delay to ensure latest data
                            plugin.getServer().getScheduler().runTaskLaterAsynchronously(
                                plugin, 
                                () -> {
                                    boolean success = apiService.sendPlayerData(player);
                                    MessageUtils.log(java.util.logging.Level.INFO, 
                                        "🔄 Delayed player data sent: " + (success ? "SUCCESS" : "FAILED"));
                                },
                                10L // 0.5 second delay (10 ticks)
                            );
                        //}
                    }
                }
                
                // Update the last known balance
                lastKnownBalances.put(playerUUID, currentBalance);
                
            } catch (Exception e) {
                // Log and ignore errors, don't break the monitoring loop
                MessageUtils.log(java.util.logging.Level.WARNING, 
                    "Error checking balance for " + player.getName() + ": " + e.getMessage());
            }
        }
    }
    
    /**
     * Update a player's stored balance
     * @param playerUUID The player's UUID
     * @param balance The new balance
     */
    public void updateStoredBalance(UUID playerUUID, double balance) {
        lastKnownBalances.put(playerUUID, balance);
    }
    
    /**
     * Listen for plugin enable events to detect economy plugin loading
     * @param event The plugin enable event
     */
    @EventHandler(priority = EventPriority.MONITOR)
    public void onPluginEnable(PluginEnableEvent event) {
        // If Vault or an economy plugin is enabled, reload the economy integration
        if (event.getPlugin().getName().equals("Vault") || 
            event.getPlugin().getName().contains("Economy")) {
            
            // Short delay to let the plugin fully initialize
            plugin.getServer().getScheduler().runTaskLater(plugin, () -> {
                // Re-check if Vault is available and reload configuration
                plugin.getVaultIntegration().setupEconomy();
                loadConfiguration();
                
                // Re-setup economy monitoring if needed
                if (realTimeEconomyUpdates && plugin.getVaultIntegration().isEconomyEnabled()) {
                    setupEconomyMonitor();
                }
            }, 40L); // 2-second delay (40 ticks)
        }
    }
}