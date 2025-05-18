/**
 * +-------------------------------------------------+
 * |                 BIZZY NATION                    |
 * |          Crafted with ♦ by Bizzy 2025           |
 * +-------------------------------------------------+
 *
 * @file SocketIOClientManager.java
 * @description Handles real-time socket.io communication for Minecraft plugin
 * @copyright © Bizzy Nation - All Rights Reserved
 * @license Proprietary - Not for distribution
 *
 * This file is protected intellectual property of Bizzy Nation.
 * Unauthorized use, copying, or distribution is prohibited.
 */

package com.bizzynation.integrations;

import io.socket.client.IO;
import io.socket.client.Socket;
import io.socket.emitter.Emitter;
import org.bukkit.Bukkit;
import org.bukkit.entity.Player;
import org.bukkit.plugin.Plugin;
import org.json.JSONObject;

import java.net.URI;
import java.util.UUID;
import java.util.logging.Level;

/**
 * Manages the socket.io client connection for real-time events from the backend.
 * Listens for 'player_unlinked' and shows in-game alerts to affected players.
 */
public class SocketIOClientManager {
    private final Plugin plugin;
    private Socket socket;
    private final String serverUrl;

    public SocketIOClientManager(Plugin plugin, String serverUrl) {
        this.plugin = plugin;
        this.serverUrl = serverUrl;
    }

    /**
     * Starts the socket.io client and sets up event listeners.
     */
    public void start() {
        try {
            IO.Options options = new IO.Options();
            options.reconnection = true;
            options.reconnectionAttempts = Integer.MAX_VALUE;
            options.reconnectionDelay = 2000;
            options.timeout = 10000;
            // Add authentication if needed: options.query = "token=...";

            socket = IO.socket(new URI(serverUrl), options);

            socket.on(Socket.EVENT_CONNECT, args ->
                plugin.getLogger().info("[SocketIO] Connected to backend server: " + serverUrl)
            );

            socket.on(Socket.EVENT_DISCONNECT, args ->
                plugin.getLogger().warning("[SocketIO] Disconnected from backend server.")
            );

            socket.on(Socket.EVENT_CONNECT_ERROR, args ->
                plugin.getLogger().log(Level.SEVERE, "[SocketIO] Connection error: " + args[0])
            );

            socket.on("player_unlinked", onPlayerUnlinked);

            socket.connect();
        } catch (Exception e) {
            plugin.getLogger().log(Level.SEVERE, "[SocketIO] Failed to start client: " + e.getMessage(), e);
        }
    }

    /**
     * Handles the 'player_unlinked' event from the backend.
     * If the event's mcUUID matches an online player, shows an in-game alert.
     */
    private final Emitter.Listener onPlayerUnlinked = args -> {
        if (args.length == 0) return;
        try {
            JSONObject data = new JSONObject(args[0].toString());
            String mcUUID = data.optString("mcUUID", null);
            String message = data.optString("message", "Your Minecraft account has been unlinked.");
            if (mcUUID == null) return;
            UUID uuid = UUID.fromString(mcUUID);
            Player player = Bukkit.getPlayer(uuid);
            if (player != null && player.isOnline()) {
                player.sendMessage("§c[BizzyLink] §f" + message);
                player.sendTitle("§cAccount Unlinked", "§7Your account is no longer linked.", 10, 60, 10);
                plugin.getLogger().info("[SocketIO] Alerted player " + player.getName() + " of unlink event.");
            }
        } catch (Exception e) {
            plugin.getLogger().log(Level.WARNING, "[SocketIO] Error handling player_unlinked event: " + e.getMessage(), e);
        }
    };

    /**
     * Stops the socket.io client and cleans up resources.
     */
    public void stop() {
        if (socket != null) {
            socket.disconnect();
            socket.close();
            socket = null;
            plugin.getLogger().info("[SocketIO] Socket client stopped.");
        }
    }
} 