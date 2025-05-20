package com.bizzynation.listeners;

import com.bizzynation.LinkPlugin;
import com.bizzynation.config.ConfigManager; // Assuming this import is needed for the cast
import com.bizzynation.social.FriendManager;
import com.bizzynation.utils.ApiService;
import org.bukkit.Bukkit;
import org.bukkit.ChatColor;
import org.bukkit.Location;
import org.bukkit.Statistic;
import org.bukkit.entity.Player;
import org.bukkit.event.EventHandler;
import org.bukkit.event.EventPriority;
import org.bukkit.event.Listener;
import org.bukkit.event.entity.EntityDeathEvent;
import org.bukkit.event.entity.PlayerDeathEvent;
import org.bukkit.event.player.*;
import org.bukkit.event.block.BlockBreakEvent;
import org.bukkit.scheduler.BukkitTask;

import java.util.HashMap;
import java.util.Map;
import java.util.UUID;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public class PlayerListener implements Listener {
    private final LinkPlugin plugin;
    private final ApiService apiService;
    private final FriendManager friendManager;

    private final Map<UUID, BukkitTask> dataSyncTasks = new HashMap<>();
    private final Map<UUID, Long> lastSyncTime = new HashMap<>(); // Used for general API call rate limiting
    private final Map<UUID, Location> lastSyncLocation = new HashMap<>();
    private final Map<UUID, Long> lastWebSocketUpdateTime = new HashMap<>(); // Separate cooldown for WebSocket updates

    private static final long API_SYNC_COOLDOWN_MS = 60000; // e.g., 1 minute for general API sync
    private static final long WEBSOCKET_UPDATE_COOLDOWN_MS = 500; // e.g., 0.5 seconds for WebSocket

    public PlayerListener(LinkPlugin plugin) {
        this.plugin = plugin;
        this.apiService = plugin.getApiService();
        this.friendManager = plugin.getFriendManager();
    }

    @EventHandler
    public void onPlayerJoin(PlayerJoinEvent event) {
        Player player = event.getPlayer();
        plugin.getLogger().info(player.getName() + " joined the server.");
        if (((ConfigManager)plugin.getConfigManager()).isPlayerLinked(player.getUniqueId())) {
            apiService.sendPlayerData(player); // Initial sync
            startDataSyncTask(player);
        }
    }

    @EventHandler
    public void onPlayerQuit(PlayerQuitEvent event) {
        Player player = event.getPlayer();
        UUID playerUUID = player.getUniqueId();
        plugin.getLogger().info(player.getName() + " left the server.");
        BukkitTask task = dataSyncTasks.remove(playerUUID);
        if (task != null) {
            task.cancel();
        }
        lastSyncTime.remove(playerUUID);
        lastSyncLocation.remove(playerUUID);
        lastWebSocketUpdateTime.remove(playerUUID);
    }
    
    @EventHandler
    public void onPlayerChangedWorld(PlayerChangedWorldEvent event) {
        Player player = event.getPlayer();
        if (((ConfigManager)plugin.getConfigManager()).isPlayerLinked(player.getUniqueId())) {
            if (shouldSync(player.getUniqueId())) {
                 plugin.getServer().getScheduler().runTaskAsynchronously(plugin, () -> {
                    apiService.sendPlayerData(player);
                    updateSyncTracking(player);
                });
            }
        }
    }

    @EventHandler
    public void onPlayerGameModeChange(PlayerGameModeChangeEvent event) {
        Player player = event.getPlayer();
        if (((ConfigManager)plugin.getConfigManager()).isPlayerLinked(player.getUniqueId())) {
           if (shouldSendWebSocketUpdate(player.getUniqueId())) {
                apiService.notifyRealtimeUpdate(player.getUniqueId().toString(), "gamemode", event.getNewGameMode().toString());
                lastWebSocketUpdateTime.put(player.getUniqueId(), System.currentTimeMillis());
           }
        }
    }
    
    @EventHandler
    public void onPlayerLevelChange(PlayerLevelChangeEvent event) {
        Player player = event.getPlayer();
        if (((ConfigManager)plugin.getConfigManager()).isPlayerLinked(player.getUniqueId())) {
            if (shouldSendWebSocketUpdate(player.getUniqueId())) {
                apiService.notifyRealtimeUpdate(player.getUniqueId().toString(), "level", event.getNewLevel());
                lastWebSocketUpdateTime.put(player.getUniqueId(), System.currentTimeMillis());
            }
        }
    }

    @EventHandler
    public void onPlayerExpChange(PlayerExpChangeEvent event) {
        Player player = event.getPlayer();
        UUID playerUUID = player.getUniqueId();
        if (((ConfigManager)plugin.getConfigManager()).isPlayerLinked(playerUUID)) {
            if (shouldSendWebSocketUpdate(playerUUID)) {
                apiService.notifyRealtimeUpdate(playerUUID.toString(), "total_experience", player.getTotalExperience());
                apiService.notifyRealtimeUpdate(playerUUID.toString(), "experience", player.getExp());
                lastWebSocketUpdateTime.put(playerUUID, System.currentTimeMillis());
            }
        }
    }

    @EventHandler
    public void onPlayerDeath(PlayerDeathEvent event) {
        Player player = event.getEntity();
        UUID playerUUID = player.getUniqueId();

        if (plugin.getConfig().getBoolean("data.sync_on_death", true) &&
            ((com.bizzynation.config.ConfigManager) plugin.getConfigManager()).isPlayerLinked(playerUUID)) {
            
            if (shouldSync(playerUUID)) { // For API sync
                plugin.getServer().getScheduler().runTaskAsynchronously(plugin, () -> {
                    apiService.sendPlayerData(player); 
                    updateSyncTracking(player); 
                });
            }

            apiService.notifyRealtimeUpdate(playerUUID.toString(), "deaths", player.getStatistic(Statistic.DEATHS));
            lastWebSocketUpdateTime.put(playerUUID, System.currentTimeMillis());
        }
    }

    @EventHandler
    public void onEntityDeath(EntityDeathEvent event) {
        if (event.getEntity().getKiller() != null) {
            Player player = event.getEntity().getKiller();
            UUID playerUUID = player.getUniqueId();

            if (((com.bizzynation.config.ConfigManager) plugin.getConfigManager()).isPlayerLinked(playerUUID)) {
                apiService.notifyRealtimeUpdate(playerUUID.toString(), "mobs_killed", player.getStatistic(Statistic.MOB_KILLS));
                lastWebSocketUpdateTime.put(playerUUID, System.currentTimeMillis());
            }
        }
    }

    @EventHandler
    public void onPlayerAdvancementDone(PlayerAdvancementDoneEvent event) {
        Player player = event.getPlayer();
        UUID playerUUID = player.getUniqueId();
        if (plugin.getConfig().getBoolean("data.sync_on_advancement", true) &&
            ((ConfigManager)plugin.getConfigManager()).isPlayerLinked(playerUUID)) { 
            
            if (shouldSync(playerUUID)) {
                plugin.getServer().getScheduler().runTaskAsynchronously(plugin, () -> {
                    apiService.sendPlayerData(player);
                    updateSyncTracking(player);
                });
            }
            
            String advancementName = event.getAdvancement().getKey().getKey();
            if (shouldSendWebSocketUpdate(playerUUID)) {
                if (!advancementName.startsWith("recipes/")) {
                    apiService.notifyRealtimeUpdate(playerUUID.toString(), "achievement", advancementName);
                    lastWebSocketUpdateTime.put(playerUUID, System.currentTimeMillis());
                }
            }
        }
    }
    
    @EventHandler
    public void onPlayerMove(PlayerMoveEvent event) {
        if (!plugin.getConfig().getBoolean("data.sync_on_distance", true)) return;
        
        Player player = event.getPlayer();
        UUID playerUUID = player.getUniqueId();

        if (!((ConfigManager)plugin.getConfigManager()).isPlayerLinked(playerUUID)) return;

        Location to = event.getTo();
        Location from = event.getFrom();

        if (to == null || (to.getWorld() != null && from.getWorld() != null && to.getWorld().equals(from.getWorld()) && to.distanceSquared(from) < 0.1)) {
            return; 
        }
        
        Location lastKnownLoc = lastSyncLocation.get(playerUUID);
        double minDistance = plugin.getConfig().getDouble("data.sync_distance", 100.0);

        if (lastKnownLoc == null || (to.getWorld() != null && lastKnownLoc.getWorld() != null && !to.getWorld().equals(lastKnownLoc.getWorld())) || to.distance(lastKnownLoc) >= minDistance) {
            if (shouldSync(playerUUID)) { 
                 plugin.getServer().getScheduler().runTaskAsynchronously(plugin, () -> {
                    apiService.sendPlayerData(player);
                    updateSyncTracking(player); 
                    lastSyncLocation.put(playerUUID, player.getLocation()); 
                });
            }
        }
    }

    @EventHandler
    public void onPlayerTeleport(PlayerTeleportEvent event) {
        Player player = event.getPlayer();
         if (((ConfigManager)plugin.getConfigManager()).isPlayerLinked(player.getUniqueId())) {
            if (shouldSync(player.getUniqueId())) {
                plugin.getServer().getScheduler().runTaskAsynchronously(plugin, () -> {
                    apiService.sendPlayerData(player);
                    updateSyncTracking(player);
                    lastSyncLocation.put(player.getUniqueId(), player.getLocation());
                });
            }
        }
    }

    public void startDataSyncTask(Player player) {
        UUID playerUUID = player.getUniqueId();
        long syncInterval = plugin.getConfig().getLong("data.sync_interval_seconds", 300) * 20L; 

        if (dataSyncTasks.containsKey(playerUUID)) {
            dataSyncTasks.get(playerUUID).cancel();
        }

        BukkitTask task = plugin.getServer().getScheduler().runTaskTimerAsynchronously(plugin, () -> {
            if (player.isOnline() && ((ConfigManager)plugin.getConfigManager()).isPlayerLinked(playerUUID)) {
                apiService.sendPlayerData(player);
            } else {
                BukkitTask currentTask = dataSyncTasks.remove(playerUUID);
                if (currentTask != null) {
                    currentTask.cancel();
                }
            }
        }, syncInterval, syncInterval); 
        dataSyncTasks.put(playerUUID, task);
    }
    
    private boolean shouldSync(UUID playerId) {
        long now = System.currentTimeMillis();
        long lastApiCallTime = lastSyncTime.getOrDefault(playerId, 0L);
        if ((now - lastApiCallTime) > API_SYNC_COOLDOWN_MS) {
            return true;
        }
        return false;
    }

    private boolean shouldSendWebSocketUpdate(UUID playerId) {
        long now = System.currentTimeMillis();
        long lastWsCallTime = lastWebSocketUpdateTime.getOrDefault(playerId, 0L);
        if ((now - lastWsCallTime) > WEBSOCKET_UPDATE_COOLDOWN_MS) {
            return true;
        }
        return false;
    }
    
    private void updateSyncTracking(Player player) {
        lastSyncTime.put(player.getUniqueId(), System.currentTimeMillis());
    }
    
    /**
     * Handle block break events to track blocks mined in real-time
     * Send immediate WebSocket updates similar to XP/level updates
     */
    @EventHandler
    public void onBlockBreak(BlockBreakEvent event) {
        Player player = event.getPlayer();
        UUID playerUUID = player.getUniqueId();
        
        if (((ConfigManager)plugin.getConfigManager()).isPlayerLinked(playerUUID)) {
            apiService.notifyRealtimeUpdate(playerUUID.toString(), "blocks_mined", player.getStatistic(Statistic.MINE_BLOCK));
            lastWebSocketUpdateTime.put(playerUUID, System.currentTimeMillis());
        }
    }

    @EventHandler(priority = EventPriority.NORMAL, ignoreCancelled = true)
    public void onPlayerChat(AsyncPlayerChatEvent event) {
        Player sender = event.getPlayer();
        String message = event.getMessage();

        if (plugin.getConfig().getBoolean("features.friend_highlight.enabled", true)) {
            String highlightColorStr = plugin.getConfig().getString("features.friend_highlight.color", "&b");
            String highlightColor = ChatColor.translateAlternateColorCodes('&', highlightColorStr);
            Pattern mentionPattern = Pattern.compile("@(\\w+)");
            Matcher matcher = mentionPattern.matcher(message);
            StringBuffer sb = new StringBuffer();
            boolean replacementMade = false;

            while (matcher.find()) {
                String mentionedName = matcher.group(1);
                Player mentionedPlayer = Bukkit.getPlayerExact(mentionedName);
                if (mentionedPlayer != null && friendManager.areFriends(sender, mentionedPlayer)) {
                    String colorPrefix = ChatColor.getLastColors(message.substring(0, matcher.start()));
                    matcher.appendReplacement(sb, highlightColor + "@" + mentionedName + colorPrefix);
                    replacementMade = true;
                } else {
                    matcher.appendReplacement(sb, matcher.group(0));
                }
            }
            matcher.appendTail(sb);

            if (replacementMade) {
                event.setMessage(sb.toString());
            }
        }
    }

}
