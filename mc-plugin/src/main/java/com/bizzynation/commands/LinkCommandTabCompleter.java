/**
 * +-------------------------------------------------+
 * |                 BIZZY NATION                    |
 * |          Crafted with ♦ by Bizzy 2025         |
 * +-------------------------------------------------+
 * 
 * @file LinkCommandTabCompleter.java
 * @description 
 * @copyright © Bizzy Nation - All Rights Reserved
 * @license Proprietary - Not for distribution
 * 
 * This file is protected intellectual property of Bizzy Nation.
 * Unauthorized use, copying, or distribution is prohibited.
 */

package com.bizzynation.commands;

import com.bizzynation.LinkPlugin;
import org.bukkit.command.Command;
import org.bukkit.command.CommandSender;
import org.bukkit.command.TabCompleter;
import org.bukkit.entity.Player;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Provides tab completion for the link command
 */
public class LinkCommandTabCompleter implements TabCompleter {
    private final LinkPlugin plugin;
    private final List<String> subCommands = Arrays.asList(
            "help", "status", "reload", "unlink", "sync"
    );
    
    public LinkCommandTabCompleter(LinkPlugin plugin) {
        this.plugin = plugin;
    }
    
    @Override
    public List<String> onTabComplete(CommandSender sender, Command command, String alias, String[] args) {
        if (!(sender instanceof Player)) {
            return null;
        }
        
        List<String> completions = new ArrayList<>();
        
        if (args.length == 1) {
            String partialArg = args[0].toLowerCase();
            
            // Filter sub-commands by permission
            List<String> availableCommands = subCommands.stream()
                    .filter(cmd -> {
                        // Only show reload command for admins
                        if (cmd.equals("reload")) {
                            return sender.hasPermission("bizzylink.admin");
                        }
                        return true;
                    })
                    .filter(cmd -> cmd.toLowerCase().startsWith(partialArg))
                    .collect(Collectors.toList());
            
            completions.addAll(availableCommands);
            
            // If we're typing a link code
            if (partialArg.length() > 0 && !subCommands.contains(partialArg)) {
                // If this looks like a verification code 
                // (add your specific pattern check if necessary)
                if (partialArg.matches("[a-zA-Z0-9]*")) {
                    // No completions for verification codes, but show a hint
                    completions.add("<6-character code>");
                }
            }
        }
        
        return completions;
    }
}