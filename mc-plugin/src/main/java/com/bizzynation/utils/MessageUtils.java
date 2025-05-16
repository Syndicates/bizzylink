package com.bizzynation.utils;

import com.bizzynation.LinkPlugin;
import org.bukkit.ChatColor;
import org.bukkit.command.CommandSender;
import org.bukkit.entity.Player;

import java.util.logging.Level;

/**
 * Utility for handling messages and logging
 */
public class MessageUtils {
    /**
     * Sends a colored message to a command sender
     * @param sender The recipient of the message
     * @param message The message to send (with color codes)
     */
    public static void sendMessage(CommandSender sender, String message) {
        if (sender != null && message != null && !message.isEmpty()) {
            sender.sendMessage(colorize(message));
        }
    }
    
    /**
     * Logs a message to the plugin's logger
     * @param level The log level
     * @param message The message to log
     */
    public static void log(Level level, String message) {
        if (LinkPlugin.getInstance() != null) {
            // Also print to System.out for visibility
            System.out.println("[BizzyLink] " + message);
            LinkPlugin.getInstance().getLogger().log(level, message);
        } else {
            // Fallback if plugin instance is null
            System.out.println("[BizzyLink] " + message);
        }
    }
    
    /**
     * Replaces color codes in a string
     * @param message The message with color codes
     * @return The colored message
     */
    public static String colorize(String message) {
        return ChatColor.translateAlternateColorCodes('&', message);
    }
    
    /**
     * Sends a success message to a player
     * @param player The player to send the message to
     * @param message The message to send
     */
    public static void sendSuccess(Player player, String message) {
        if (player != null && player.isOnline() && message != null) {
            player.sendMessage(colorize("&a[BizzyLink] &f" + message));
        }
    }
    
    /**
     * Sends an error message to a player
     * @param player The player to send the message to
     * @param message The message to send
     */
    public static void sendError(Player player, String message) {
        if (player != null && player.isOnline() && message != null) {
            player.sendMessage(colorize("&c[BizzyLink] &f" + message));
        }
    }
    
    /**
     * Sends an info message to a player
     * @param player The player to send the message to
     * @param message The message to send
     */
    public static void sendInfo(Player player, String message) {
        if (player != null && player.isOnline() && message != null) {
            player.sendMessage(colorize("&e[BizzyLink] &f" + message));
        }
    }
    
    /**
     * Sends a raw message to a player without any prefix
     * @param player The player to send the message to
     * @param message The message to send
     */
    public static void sendRaw(Player player, String message) {
        if (player != null && player.isOnline() && message != null) {
            player.sendMessage(colorize(message));
        }
    }
}