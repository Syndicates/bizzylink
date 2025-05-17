/**
 * +-------------------------------------------------+
 * |                 BIZZY NATION                    |
 * |          Crafted with ♦ by Bizzy 2025         |
 * +-------------------------------------------------+
 * 
 * @file VaultIntegration.java
 * @description 
 * @copyright © Bizzy Nation - All Rights Reserved
 * @license Proprietary - Not for distribution
 * 
 * This file is protected intellectual property of Bizzy Nation.
 * Unauthorized use, copying, or distribution is prohibited.
 */

package com.bizzynation.integrations;

import com.bizzynation.LinkPlugin;
import net.milkbowl.vault.economy.Economy;
import net.milkbowl.vault.permission.Permission;
import org.bukkit.Bukkit;
import org.bukkit.OfflinePlayer;
import org.bukkit.entity.Player;
import org.bukkit.plugin.RegisteredServiceProvider;

import java.util.logging.Level;

/**
 * Handles integration with Vault for economy and permissions
 */
public class VaultIntegration {
    private final LinkPlugin plugin;
    private Economy economy = null;
    private Permission permission = null;
    private boolean economyEnabled = false;
    private boolean permissionEnabled = false;

    public VaultIntegration(LinkPlugin plugin) {
        this.plugin = plugin;
        setupIntegration();
    }

    /**
     * Sets up the Vault integration
     */
    private void setupIntegration() {
        if (!plugin.getConfig().getBoolean("dependencies.use_vault", true)) {
            plugin.getLogger().info("Vault integration disabled in config");
            return;
        }

        if (Bukkit.getPluginManager().getPlugin("Vault") == null) {
            plugin.getLogger().warning("Vault plugin not found! Economy and permission integration disabled.");
            return;
        }

        setupEconomy();

        // Setup Permissions
        try {
            RegisteredServiceProvider<Permission> permissionProvider = Bukkit.getServicesManager().getRegistration(Permission.class);
            if (permissionProvider != null) {
                permission = permissionProvider.getProvider();
                permissionEnabled = true;
                plugin.getLogger().info("Vault Permission integration enabled! Provider: " + permission.getName());
            } else {
                plugin.getLogger().warning("No permission provider found for Vault!");
            }
        } catch (Exception e) {
            plugin.getLogger().log(Level.SEVERE, "Error setting up Vault Permissions: " + e.getMessage(), e);
        }
    }

    /**
     * Sets up the economy integration
     * @return true if economy is enabled
     */
    public boolean setupEconomy() {
        try {
            RegisteredServiceProvider<Economy> economyProvider = Bukkit.getServicesManager().getRegistration(Economy.class);
            if (economyProvider != null) {
                economy = economyProvider.getProvider();
                economyEnabled = true;
                plugin.getLogger().info("Vault Economy integration enabled! Provider: " + economy.getName());
                return true;
            } else {
                plugin.getLogger().warning("No economy provider found for Vault!");
                economyEnabled = false;
                return false;
            }
        } catch (Exception e) {
            plugin.getLogger().log(Level.SEVERE, "Error setting up Vault Economy: " + e.getMessage(), e);
            economyEnabled = false;
            return false;
        }
    }
    
    /**
     * Checks if economy integration is enabled
     * @return true if economy is enabled
     */
    public boolean isEconomyEnabled() {
        return economyEnabled && economy != null;
    }

    /**
     * Checks if permission integration is enabled
     * @return true if permission is enabled
     */
    public boolean isPermissionEnabled() {
        return permissionEnabled && permission != null;
    }

    /**
     * Gets the player's balance
     * @param player the player
     * @return the player's balance or 0 if economy is disabled
     */
    public double getBalance(OfflinePlayer player) {
        if (!isEconomyEnabled()) return 0;
        try {
            return economy.getBalance(player);
        } catch (Exception e) {
            plugin.getLogger().warning("Error getting balance for " + player.getName() + ": " + e.getMessage());
            return 0;
        }
    }

    /**
     * Gets the player's primary group
     * @param player the player
     * @return the player's primary group or "default" if permission is disabled
     */
    public String getPrimaryGroup(Player player) {
        if (!isPermissionEnabled()) return "default";
        try {
            return permission.getPrimaryGroup(player);
        } catch (Exception e) {
            plugin.getLogger().warning("Error getting primary group for " + player.getName() + ": " + e.getMessage());
            return "default";
        }
    }

    /**
     * Gets all groups the player is in
     * @param player the player
     * @return array of groups or empty array if permission is disabled
     */
    public String[] getPlayerGroups(Player player) {
        if (!isPermissionEnabled()) return new String[0];
        try {
            return permission.getPlayerGroups(player);
        } catch (Exception e) {
            plugin.getLogger().warning("Error getting groups for " + player.getName() + ": " + e.getMessage());
            return new String[0];
        }
    }

    /**
     * Adds a player to a group
     * @param player the player
     * @param group the group
     * @return true if successful
     */
    public boolean addToGroup(Player player, String group) {
        if (!isPermissionEnabled()) return false;
        try {
            return permission.playerAddGroup(player, group);
        } catch (Exception e) {
            plugin.getLogger().warning("Error adding " + player.getName() + " to group " + group + ": " + e.getMessage());
            return false;
        }
    }

    /**
     * Removes a player from a group
     * @param player the player
     * @param group the group
     * @return true if successful
     */
    public boolean removeFromGroup(Player player, String group) {
        if (!isPermissionEnabled()) return false;
        try {
            return permission.playerRemoveGroup(player, group);
        } catch (Exception e) {
            plugin.getLogger().warning("Error removing " + player.getName() + " from group " + group + ": " + e.getMessage());
            return false;
        }
    }
}