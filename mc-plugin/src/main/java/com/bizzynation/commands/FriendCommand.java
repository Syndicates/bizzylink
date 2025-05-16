package com.bizzynation.commands;

import com.bizzynation.LinkPlugin;
import com.bizzynation.social.FriendManager;
import com.bizzynation.utils.MessageUtils;
import org.bukkit.command.Command;
import org.bukkit.command.CommandExecutor;
import org.bukkit.command.CommandSender;
import org.bukkit.entity.Player;

import java.util.Arrays;
import java.util.HashSet;
import java.util.Set;

/**
 * Command handler for friend-related commands in the Minecraft server
 */
public class FriendCommand implements CommandExecutor {
    private final LinkPlugin plugin;
    private final FriendManager friendManager;
    private final Set<String> subCommands = new HashSet<>(Arrays.asList(
            "add", "accept", "reject", "remove", "list", "requests", "help"
    ));
    
    public FriendCommand(LinkPlugin plugin, FriendManager friendManager) {
        this.plugin = plugin;
        this.friendManager = friendManager;
    }
    
    @Override
    public boolean onCommand(CommandSender sender, Command command, String label, String[] args) {
        if (!(sender instanceof Player)) {
            sender.sendMessage("This command can only be used by players.");
            return true;
        }
        
        Player player = (Player) sender;
        
        // No arguments, show list by default
        if (args.length == 0) {
            showHelp(player);
            return true;
        }
        
        String subCommand = args[0].toLowerCase();
        
        if (!subCommands.contains(subCommand)) {
            MessageUtils.sendError(player, "Unknown command. Use /friend help for a list of commands.");
            return true;
        }
        
        switch (subCommand) {
            case "add":
                handleAddCommand(player, args);
                break;
            case "accept":
                handleAcceptCommand(player, args);
                break;
            case "reject":
                handleRejectCommand(player, args);
                break;
            case "remove":
                handleRemoveCommand(player, args);
                break;
            case "list":
                handleListCommand(player);
                break;
            case "requests":
                handleRequestsCommand(player);
                break;
            case "help":
            default:
                showHelp(player);
                break;
        }
        
        return true;
    }
    
    private void handleAddCommand(Player player, String[] args) {
        if (args.length < 2) {
            MessageUtils.sendError(player, "Usage: /friend add <player>");
            return;
        }
        
        String targetName = args[1];
        
        // Check if player is trying to add themselves
        if (targetName.equalsIgnoreCase(player.getName())) {
            MessageUtils.sendError(player, "You cannot add yourself as a friend.");
            return;
        }
        
        // Send the friend request
        friendManager.sendFriendRequest(player, targetName);
    }
    
    private void handleAcceptCommand(Player player, String[] args) {
        if (args.length < 2) {
            MessageUtils.sendError(player, "Usage: /friend accept <player>");
            return;
        }
        
        String senderName = args[1];
        
        // Accept the friend request
        friendManager.acceptFriendRequest(player, senderName);
    }
    
    private void handleRejectCommand(Player player, String[] args) {
        if (args.length < 2) {
            MessageUtils.sendError(player, "Usage: /friend reject <player>");
            return;
        }
        
        String senderName = args[1];
        
        // Reject the friend request
        friendManager.rejectFriendRequest(player, senderName);
    }
    
    private void handleRemoveCommand(Player player, String[] args) {
        if (args.length < 2) {
            MessageUtils.sendError(player, "Usage: /friend remove <player>");
            return;
        }
        
        String friendName = args[1];
        
        // Remove the friend
        friendManager.removeFriend(player, friendName);
    }
    
    private void handleListCommand(Player player) {
        // List friends
        friendManager.listFriends(player);
    }
    
    private void handleRequestsCommand(Player player) {
        // List pending friend requests
        friendManager.listRequests(player);
    }
    
    private void showHelp(Player player) {
        MessageUtils.sendInfo(player, "§d=== BizzyLink Friend Commands ===");
        MessageUtils.sendRaw(player, "§d/friend list §7- View your friends list");
        MessageUtils.sendRaw(player, "§d/friend requests §7- View pending friend requests");
        MessageUtils.sendRaw(player, "§d/friend add <player> §7- Send a friend request");
        MessageUtils.sendRaw(player, "§d/friend accept <player> §7- Accept a friend request");
        MessageUtils.sendRaw(player, "§d/friend reject <player> §7- Reject a friend request");
        MessageUtils.sendRaw(player, "§d/friend remove <player> §7- Remove a friend");
    }
}