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
import com.bizzynation.config.ConfigManager;
import com.bizzynation.utils.ApiService;
import com.bizzynation.utils.MessageUtils;
import org.bukkit.Bukkit;
import org.bukkit.entity.Player;
import org.bukkit.event.EventHandler;
import org.bukkit.event.EventPriority;
import org.bukkit.event.Listener;
import org.bukkit.event.player.PlayerCommandPreprocessEvent;
import org.bukkit.event.server.PluginEnableEvent;
import org.bukkit.scheduler.BukkitTask;

import java.util.HashMap;
import java.util.Map;
import java.util.UUID;
import java.util.Collections;

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
    // Track daily earnings for each player
    private final Map<UUID, Double> moneyEarnedToday = new HashMap<>();
    // Track daily spending for each player
    private final Map<UUID, Double> moneySpentToday = new HashMap<>();
    
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
        scheduleDailyEarningsReset();
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
            if (!((ConfigManager)plugin.getConfigManager()).isPlayerLinked(playerUUID)) {
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
                    Double previousBalance = lastKnownBalances.get(playerUUID);
                    if (previousBalance != null) {
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
                        
                        // If the balance has changed AT ALL - ALWAYS send WebSocket updates like XP
                        if (true) { // Always evaluate this block to be more like XP/level updates
                            // Send WebSocket events for balance (just like we do with XP)
                            apiService.notifyRealtimeUpdate(playerUUID.toString(), "balance", currentBalance);
                            
                            MessageUtils.log(java.util.logging.Level.INFO, 
                                "Balance WebSocket update sent for " + player.getName() + ": " + currentBalance);
                            
                            // Only do the API update if it meets the minimum change requirements
                            double minChange = plugin.getConfig().getDouble("data.min_balance_change", 1.0);
                            int minInterval = plugin.getConfig().getInt("data.min_balance_sync_interval", 10); // seconds
                            if (Math.abs(difference) >= minChange) {
                                long now = System.currentTimeMillis();
                                long lastNotification = lastNotificationTimes.getOrDefault(playerUUID, 0L);
                                long elapsedSeconds = (now - lastNotification) / 1000;
                                if (elapsedSeconds >= minInterval) {
                                    // BizzyLink rules: Only sync on significant change and with debounce
                                    MessageUtils.log(java.util.logging.Level.INFO, 
                                        "🔄 Balance change detected for " + player.getName() + 
                                        ": " + previousBalance + " -> " + currentBalance + 
                                        " (diff: " + difference + ")");
                                    boolean webhookSuccess = apiService.notifyRealtimeUpdate(playerUUID.toString());
                                    MessageUtils.log(java.util.logging.Level.INFO, 
                                        "🔄 Webhook notification sent: " + (webhookSuccess ? "SUCCESS" : "FAILED"));
                                    lastNotificationTimes.put(playerUUID, now);
                                    boolean dataSuccess = apiService.sendPlayerData(player);
                                    MessageUtils.log(java.util.logging.Level.INFO, 
                                        "🔄 Player data sent: " + (dataSuccess ? "SUCCESS" : "FAILED"));
                                }
                            }
                        }
                        // After detecting a balance change:
                        if (currentBalance > previousBalance) {
                            double earned = currentBalance - previousBalance;
                            moneyEarnedToday.put(playerUUID, moneyEarnedToday.getOrDefault(playerUUID, 0.0) + earned);
                        } else if (currentBalance < previousBalance) {
                            double spent = previousBalance - currentBalance;
                            moneySpentToday.put(playerUUID, moneySpentToday.getOrDefault(playerUUID, 0.0) + spent);
                        }
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

    // Schedule a reset of daily earnings at midnight UK time
    public void scheduleDailyEarningsReset() {
        java.time.ZoneId ukZone = java.time.ZoneId.of("Europe/London");
        java.time.LocalDateTime now = java.time.LocalDateTime.now(ukZone);
        java.time.LocalDateTime nextMidnight = now.toLocalDate().plusDays(1).atStartOfDay();
        long delaySeconds = java.time.Duration.between(now, nextMidnight).getSeconds();
        // Schedule the reset
        plugin.getServer().getScheduler().runTaskLaterAsynchronously(plugin, () -> {
            moneyEarnedToday.clear();
            moneySpentToday.clear();
            MessageUtils.log(java.util.logging.Level.INFO, "Reset all players' money_earned_today and money_spent_today at midnight UK time");
            // Reschedule for the next day
            scheduleDailyEarningsReset();
        }, delaySeconds * 20L); // Convert seconds to ticks
    }

    // Add a public getter for moneyEarnedToday
    public Map<UUID, Double> getMoneyEarnedToday() {
        return moneyEarnedToday;
    }

    // Add a public getter for moneySpentToday
    public Map<UUID, Double> getMoneySpentToday() {
        return Collections.unmodifiableMap(moneySpentToday);
    }
    
    /**
     * Listen for economy-related commands to update balance immediately
     * This captures commands like /eco, /money, /pay, etc. that modify player balances
     * Works EXACTLY like XP with real-time updates
     */
    @EventHandler(priority = EventPriority.MONITOR, ignoreCancelled = true)
    public void onPlayerCommand(PlayerCommandPreprocessEvent event) {
        String command = event.getMessage().toLowerCase();
        
        // Only process economy-related commands
        if (command.startsWith("/eco ") || 
            command.startsWith("/economy ") ||
            command.startsWith("/money ") ||
            command.startsWith("/bal ") ||
            command.startsWith("/balance ") ||
            command.startsWith("/pay ")) {
            
            Player player = event.getPlayer();
            UUID playerUUID = player.getUniqueId();
            
            // Schedule a delayed check to allow the command to complete first
            plugin.getServer().getScheduler().runTaskLater(plugin, () -> {
                if (player.isOnline() && ((com.bizzynation.config.ConfigManager)plugin.getConfigManager()).isPlayerLinked(playerUUID)) {
                    // Get the current balance from Vault EXACTLY like the XP system
                    double currentBalance = 0.0;
                    if (plugin.getVaultIntegration() != null) {
                        // Use the getBalance method instead of accessing economy directly
                        currentBalance = plugin.getVaultIntegration().getBalance(player);
                    }
                    
                    // CRITICAL FIX: This MUST use the exact same structure as XP updates
                    // Use ONLY the socketManager's sendPlayerStatUpdate method which has the proper debug output
                    plugin.getLogger().info("DEBUG: sendPlayerStatUpdate called - Player: " + player.getName() + " (UUID: " + player.getUniqueId() + "), Stat: balance, Value: " + currentBalance);
                    
                    // Use Socket.IO manager first - this is what works for XP updates!
                    apiService.notifyRealtimeUpdate(playerUUID.toString(), "balance", currentBalance);
                    
                    // Store for tracking purposes
                    double previousBalance = lastKnownBalances.getOrDefault(playerUUID, currentBalance);
                    lastKnownBalances.put(playerUUID, currentBalance);
                    
                    // Track spending/earning if balance changed
                    if (currentBalance > previousBalance) {
                        double earned = currentBalance - previousBalance;
                        moneyEarnedToday.put(playerUUID, moneyEarnedToday.getOrDefault(playerUUID, 0.0) + earned);
                    } else if (currentBalance < previousBalance) {
                        double spent = previousBalance - currentBalance;
                        moneySpentToday.put(playerUUID, moneySpentToday.getOrDefault(playerUUID, 0.0) + spent);
                    }
                }
            }, 5L); // 5 tick delay (0.25 seconds) to ensure command processes first
        }
    }
}