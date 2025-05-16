package com.bizzynation.integrations;

import com.bizzynation.LinkPlugin;
import net.luckperms.api.LuckPerms;
import net.luckperms.api.LuckPermsProvider;
import net.luckperms.api.model.group.Group;
import net.luckperms.api.model.user.User;
import net.luckperms.api.node.Node;
import net.luckperms.api.node.NodeType;
import net.luckperms.api.node.types.InheritanceNode;
import net.luckperms.api.node.types.MetaNode;
import org.bukkit.Bukkit;
import org.bukkit.entity.Player;

import java.util.*;
import java.util.concurrent.CompletableFuture;
import java.util.logging.Level;
import java.util.stream.Collectors;

/**
 * Handles integration with LuckPerms for more detailed permission management
 */
public class LuckPermsIntegration {
    private final LinkPlugin plugin;
    private LuckPerms luckPermsApi = null;
    private boolean enabled = false;

    // Group metadata keys
    private static final String META_WEBSITE_RANK = "website_rank";
    private static final String META_WEBSITE_DISPLAY = "website_display";
    private static final String META_WEBSITE_COLOR = "website_color";
    private static final String META_WEBSITE_PRIORITY = "website_priority";

    public LuckPermsIntegration(LinkPlugin plugin) {
        this.plugin = plugin;
        setupIntegration();
    }

    /**
     * Sets up the LuckPerms integration
     */
    private void setupIntegration() {
        if (!plugin.getConfig().getBoolean("dependencies.use_luckperms", true)) {
            plugin.getLogger().info("LuckPerms integration disabled in config");
            return;
        }

        if (Bukkit.getPluginManager().getPlugin("LuckPerms") == null) {
            plugin.getLogger().warning("LuckPerms plugin not found! Advanced permission integration disabled.");
            return;
        }

        try {
            luckPermsApi = LuckPermsProvider.get();
            enabled = true;
            plugin.getLogger().info("LuckPerms integration enabled! Version: " + 
                    Bukkit.getPluginManager().getPlugin("LuckPerms").getDescription().getVersion());
        } catch (Exception e) {
            plugin.getLogger().log(Level.SEVERE, "Error setting up LuckPerms integration: " + e.getMessage(), e);
        }
    }

    /**
     * Checks if LuckPerms integration is enabled
     * @return true if enabled
     */
    public boolean isEnabled() {
        return enabled && luckPermsApi != null;
    }

    /**
     * Gets all groups a player is in with their website metadata
     * @param player the player
     * @return Map of group names to their website display name (if set)
     */
    public Map<String, String> getPlayerGroupsWithMeta(Player player) {
        if (!isEnabled()) return Collections.emptyMap();
        
        Map<String, String> groups = new HashMap<>();
        
        try {
            plugin.getLogger().info("Getting LuckPerms groups for " + player.getName());
            User user = luckPermsApi.getUserManager().getUser(player.getUniqueId());
            if (user == null) {
                plugin.getLogger().warning("No LuckPerms user found for " + player.getName());
                return groups;
            }
            
            // Get primary group first to ensure it takes priority
            String primaryGroup = user.getPrimaryGroup();
            plugin.getLogger().info("Primary group for " + player.getName() + ": " + primaryGroup);
            
            // Get all inheritance nodes
            Set<InheritanceNode> groupNodes = user.getNodes().stream()
                    .filter(NodeType.INHERITANCE::matches)
                    .map(NodeType.INHERITANCE::cast)
                    .collect(Collectors.toSet());
            
            plugin.getLogger().info("Found " + groupNodes.size() + " group nodes for " + player.getName());
            
            // Process primary group first
            Group primaryGroupObj = luckPermsApi.getGroupManager().getGroup(primaryGroup);
            if (primaryGroupObj != null) {
                String displayName = primaryGroupObj.getCachedData().getMetaData().getMetaValue(META_WEBSITE_DISPLAY);
                groups.put(primaryGroup, displayName != null ? displayName : primaryGroup);
                plugin.getLogger().info("Added primary group: " + primaryGroup + " -> " + groups.get(primaryGroup));
            }
            
            // For each other group, get its website display name
            for (InheritanceNode groupNode : groupNodes) {
                String groupName = groupNode.getGroupName();
                
                // Skip primary group as we already added it
                if (groupName.equals(primaryGroup)) continue;
                
                Group group = luckPermsApi.getGroupManager().getGroup(groupName);
                
                if (group != null) {
                    // Try to get website display name from metadata
                    String displayName = group.getCachedData().getMetaData().getMetaValue(META_WEBSITE_DISPLAY);
                    groups.put(groupName, displayName != null ? displayName : groupName);
                    plugin.getLogger().info("Added group: " + groupName + " -> " + groups.get(groupName));
                }
            }
        } catch (Exception e) {
            plugin.getLogger().warning("Error getting LuckPerms groups for " + player.getName() + ": " + e.getMessage());
            plugin.getLogger().warning("Stack trace: " + e.getStackTrace()[0]);
        }
        
        return groups;
    }

    /**
     * Gets a map of all group data for website sync
     * @return Map of group names to their metadata
     */
    public Map<String, Map<String, String>> getAllGroupsData() {
        if (!isEnabled()) return Collections.emptyMap();
        
        Map<String, Map<String, String>> groupsData = new HashMap<>();
        
        try {
            // Get all groups
            Collection<Group> groups = luckPermsApi.getGroupManager().getLoadedGroups();
            
            for (Group group : groups) {
                Map<String, String> groupData = new HashMap<>();
                
                // Get metadata
                String displayName = group.getCachedData().getMetaData().getMetaValue(META_WEBSITE_DISPLAY);
                String color = group.getCachedData().getMetaData().getMetaValue(META_WEBSITE_COLOR);
                String priority = group.getCachedData().getMetaData().getMetaValue(META_WEBSITE_PRIORITY);
                String websiteRank = group.getCachedData().getMetaData().getMetaValue(META_WEBSITE_RANK);
                
                // Add to group data
                groupData.put("name", group.getName());
                groupData.put("display", displayName != null ? displayName : group.getName());
                groupData.put("color", color != null ? color : "#FFFFFF");
                groupData.put("priority", priority != null ? priority : "0");
                groupData.put("website_rank", websiteRank != null ? websiteRank : "false");
                
                groupsData.put(group.getName(), groupData);
            }
        } catch (Exception e) {
            plugin.getLogger().warning("Error getting LuckPerms groups data: " + e.getMessage());
        }
        
        return groupsData;
    }

    /**
     * Sets a player's primary group
     * @param player the player's UUID
     * @param groupName the group name
     * @return CompletableFuture that completes when operation is done
     */
    public CompletableFuture<Void> setPlayerPrimaryGroup(UUID player, String groupName) {
        if (!isEnabled()) return CompletableFuture.completedFuture(null);
        
        try {
            return luckPermsApi.getUserManager().modifyUser(player, user -> {
                // We don't need to manually clear primary groups
                // The setPrimaryGroup method will handle that for us
                
                // Add new primary group directly
                InheritanceNode node = InheritanceNode.builder(groupName).build();
                
                // Set as primary group using a different approach
                user.data().add(node);
                
                // Then manually set it as primary
                user.setPrimaryGroup(groupName);
            });
        } catch (Exception e) {
            plugin.getLogger().warning("Error setting LuckPerms primary group for " + player + ": " + e.getMessage());
            return CompletableFuture.completedFuture(null);
        }
    }

    /**
     * Adds a player to a group
     * @param player the player's UUID
     * @param groupName the group name
     * @return CompletableFuture that completes when operation is done
     */
    public CompletableFuture<Void> addPlayerToGroup(UUID player, String groupName) {
        if (!isEnabled()) return CompletableFuture.completedFuture(null);
        
        try {
            return luckPermsApi.getUserManager().modifyUser(player, user -> {
                // Add group
                user.data().add(InheritanceNode.builder(groupName).build());
            });
        } catch (Exception e) {
            plugin.getLogger().warning("Error adding LuckPerms group for " + player + ": " + e.getMessage());
            return CompletableFuture.completedFuture(null);
        }
    }

    /**
     * Removes a player from a group
     * @param player the player's UUID
     * @param groupName the group name
     * @return CompletableFuture that completes when operation is done
     */
    public CompletableFuture<Void> removePlayerFromGroup(UUID player, String groupName) {
        if (!isEnabled()) return CompletableFuture.completedFuture(null);
        
        try {
            return luckPermsApi.getUserManager().modifyUser(player, user -> {
                // Remove group
                user.data().remove(InheritanceNode.builder(groupName).build());
            });
        } catch (Exception e) {
            plugin.getLogger().warning("Error removing LuckPerms group for " + player + ": " + e.getMessage());
            return CompletableFuture.completedFuture(null);
        }
    }

    /**
     * Sets a metadata value on a player
     * @param player the player's UUID
     * @param key the metadata key
     * @param value the metadata value
     * @return CompletableFuture that completes when operation is done
     */
    public CompletableFuture<Void> setPlayerMeta(UUID player, String key, String value) {
        if (!isEnabled()) return CompletableFuture.completedFuture(null);
        
        try {
            return luckPermsApi.getUserManager().modifyUser(player, user -> {
                // Remove existing meta with this key using a different approach
                user.data().clear(node -> {
                    if (node.getType() == NodeType.META) {
                        MetaNode metaNode = (MetaNode) node;
                        return metaNode.getMetaKey().equals(key);
                    }
                    return false;
                });
                
                // Add new meta using MetaNode builder
                user.data().add(net.luckperms.api.node.types.MetaNode.builder()
                        .key(key)
                        .value(value)
                        .build());
            });
        } catch (Exception e) {
            plugin.getLogger().warning("Error setting LuckPerms meta for " + player + ": " + e.getMessage());
            return CompletableFuture.completedFuture(null);
        }
    }
}