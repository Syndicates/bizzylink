package com.bizzynation;

import org.bukkit.command.Command;
import org.bukkit.command.CommandExecutor;
import org.bukkit.command.CommandSender;
import org.bukkit.entity.Player;
import org.bukkit.ChatColor;

import java.io.OutputStream;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.util.Scanner;

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
            URL url = new URL("http://localhost:3000/verify"); // Update if hosted remotely
            HttpURLConnection conn = (HttpURLConnection) url.openConnection();
            conn.setRequestMethod("POST");
            conn.setRequestProperty("Content-Type", "application/json");
            conn.setDoOutput(true);

            String jsonInput = "{ \"username\": \"" + player.getName() + "\", \"code\": \"" + code + "\" }";
            try (OutputStream os = conn.getOutputStream()) {
                byte[] input = jsonInput.getBytes(StandardCharsets.UTF_8);
                os.write(input, 0, input.length);
            }

            // Read server response
            int responseCode = conn.getResponseCode();
            InputStream responseStream = (responseCode == 200) ? conn.getInputStream() : conn.getErrorStream();

            Scanner scanner = new Scanner(responseStream, StandardCharsets.UTF_8.name());
            String jsonResponse = scanner.useDelimiter("\\A").next();
            scanner.close();

            if (responseCode == 200) {
                player.sendMessage(ChatColor.GREEN + "Your Minecraft account is now linked!");
            } else if (jsonResponse.contains("already linked")) {
                player.sendMessage(ChatColor.YELLOW + "Your account is already linked!");
            } else {
                player.sendMessage(ChatColor.RED + "Error: " + jsonResponse);  // Shows actual error message
            }
        } catch (Exception e) {
            player.sendMessage(ChatColor.RED + "Error connecting to the linking server.");
        }

        return true;
    }
}
