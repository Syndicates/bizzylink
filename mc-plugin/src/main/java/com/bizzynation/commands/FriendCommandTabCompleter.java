package com.bizzynation.commands;

import com.bizzynation.social.FriendManager;
import org.bukkit.Bukkit;
import org.bukkit.command.Command;
import org.bukkit.command.CommandSender;
import org.bukkit.command.TabCompleter;
import org.bukkit.entity.Player;

import java.util.*;
import java.util.stream.Collectors;

/**
 * Tab completer for friend-related commands to help players with auto-completion
 */
public class FriendCommandTabCompleter implements TabCompleter {
    private final FriendManager friendManager;
    private final List<String> subCommands = Arrays.asList("add", "accept", "reject", "remove", "list", "requests", "help");
    
    public FriendCommandTabCompleter(FriendManager friendManager) {
        this.friendManager = friendManager;
    }
    
    @Override
    public List<String> onTabComplete(CommandSender sender, Command command, String alias, String[] args) {
        if (!(sender instanceof Player)) {
            return Collections.emptyList();
        }
        
        Player player = (Player) sender;
        
        // Subcommand completion
        if (args.length == 1) {
            return subCommands.stream()
                    .filter(s -> s.startsWith(args[0].toLowerCase()))
                    .collect(Collectors.toList());
        }
        
        // Argument completion based on subcommand
        if (args.length == 2) {
            String subCommand = args[0].toLowerCase();
            
            switch (subCommand) {
                case "add":
                    // Complete with online players except the sender
                    return Bukkit.getOnlinePlayers().stream()
                            .filter(p -> !p.equals(player))
                            .map(Player::getName)
                            .filter(name -> name.toLowerCase().startsWith(args[1].toLowerCase()))
                            .collect(Collectors.toList());
                    
                case "accept":
                case "reject":
                    // Complete with received friend requests
                    return friendManager.getReceivedRequests(player).stream()
                            .map(request -> request.getMcUsername())
                            .filter(name -> name != null && name.toLowerCase().startsWith(args[1].toLowerCase()))
                            .collect(Collectors.toList());
                    
                case "remove":
                    // Complete with friends
                    return friendManager.getFriends(player).stream()
                            .map(friend -> friend.getMcUsername())
                            .filter(name -> name != null && name.toLowerCase().startsWith(args[1].toLowerCase()))
                            .collect(Collectors.toList());
                    
                default:
                    return Collections.emptyList();
            }
        }
        
        return Collections.emptyList();
    }
}