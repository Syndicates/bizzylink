/**
 * +-------------------------------------------------+
 * |                 BIZZY NATION                    |
 * |          Crafted with ♦ by Bizzy 2025         |
 * +-------------------------------------------------+
 * 
 * @file FriendManager.java
 * @description 
 * @copyright © Bizzy Nation - All Rights Reserved
 * @license Proprietary - Not for distribution
 * 
 * This file is protected intellectual property of Bizzy Nation.
 * Unauthorized use, copying, or distribution is prohibited.
 */

package com.bizzynation.social;

import com.bizzynation.LinkPlugin;
import com.bizzynation.utils.ApiService;
import com.bizzynation.utils.MessageUtils;
import org.bukkit.Bukkit;
import org.bukkit.entity.Player;
import org.json.simple.JSONArray;
import org.json.simple.JSONObject;
import org.json.simple.parser.JSONParser;
import org.json.simple.parser.ParseException;

import java.io.IOException;
import java.util.*;
import java.util.concurrent.CompletableFuture;
import java.util.logging.Level;
import java.util.stream.Collectors;

/**
 * Manages friend relationships between players in the Minecraft server
 * and synchronizes with the BizzyLink web platform.
 */
public class FriendManager {
    private final LinkPlugin plugin;
    private final ApiService apiService;
    private final Map<UUID, List<FriendData>> friendCache = new HashMap<>();
    private final Map<UUID, List<FriendRequest>> requestCache = new HashMap<>();
    
    public FriendManager(LinkPlugin plugin) {
        this.plugin = plugin;
        this.apiService = plugin.getApiService();
    }
    
    /**
     * Loads a player's friends from the API
     * @param player The player to load friends for
     * @return A CompletableFuture that completes when the friends are loaded
     */
    public CompletableFuture<List<FriendData>> loadFriends(Player player) {
        return CompletableFuture.supplyAsync(() -> {
            String playerUUID = player.getUniqueId().toString();
            List<FriendData> friends = new ArrayList<>();
            
            try {
                String endpoint = "/api/mc/friends/" + playerUUID;
                String response = apiService.get(endpoint);
                
                JSONParser parser = new JSONParser();
                JSONObject json = (JSONObject) parser.parse(response);
                
                if (json.containsKey("error")) {
                    plugin.getLogger().warning("Error loading friends for " + player.getName() + ": " + json.get("error"));
                    return friends;
                }
                
                JSONArray friendsArray = (JSONArray) json.get("friends");
                for (Object obj : friendsArray) {
                    JSONObject friendObj = (JSONObject) obj;
                    String username = (String) friendObj.get("username");
                    String mcUsername = (String) friendObj.get("mcUsername");
                    String mcUUID = (String) friendObj.get("mcUUID");
                    boolean online = (Boolean) friendObj.getOrDefault("online", false);
                    
                    if (mcUUID != null && !mcUUID.isEmpty()) {
                        UUID uuid = UUID.fromString(mcUUID);
                        FriendData friendData = new FriendData(username, mcUsername, uuid);
                        friendData.setOnline(online);
                        friends.add(friendData);
                    }
                }
                
                // Cache the friends
                friendCache.put(player.getUniqueId(), friends);
                
                return friends;
            } catch (IOException | ParseException e) {
                plugin.getLogger().log(Level.WARNING, "Failed to load friends for " + player.getName(), e);
                return friends;
            }
        });
    }
    
    /**
     * Loads a player's friend requests from the API
     * @param player The player to load requests for
     * @return A CompletableFuture that completes when the requests are loaded
     */
    public CompletableFuture<Map<String, List<FriendRequest>>> loadFriendRequests(Player player) {
        return CompletableFuture.supplyAsync(() -> {
            String playerUUID = player.getUniqueId().toString();
            List<FriendRequest> sent = new ArrayList<>();
            List<FriendRequest> received = new ArrayList<>();
            Map<String, List<FriendRequest>> requests = new HashMap<>();
            
            try {
                String endpoint = "/api/mc/friends/requests/" + playerUUID;
                String response = apiService.get(endpoint);
                
                JSONParser parser = new JSONParser();
                JSONObject json = (JSONObject) parser.parse(response);
                
                if (json.containsKey("error")) {
                    plugin.getLogger().warning("Error loading friend requests for " + player.getName() + ": " + json.get("error"));
                    requests.put("sent", sent);
                    requests.put("received", received);
                    return requests;
                }
                
                // Parse sent requests
                JSONArray sentArray = (JSONArray) json.get("sent");
                for (Object obj : sentArray) {
                    JSONObject requestObj = (JSONObject) obj;
                    String username = (String) requestObj.get("username");
                    String mcUsername = (String) requestObj.get("mcUsername");
                    String mcUUID = (String) requestObj.get("mcUUID");
                    
                    if (mcUUID != null && !mcUUID.isEmpty()) {
                        UUID uuid = UUID.fromString(mcUUID);
                        FriendRequest request = new FriendRequest(player.getUniqueId(), uuid, FriendRequest.Type.SENT);
                        request.setUsername(username);
                        request.setMcUsername(mcUsername);
                        sent.add(request);
                    }
                }
                
                // Parse received requests
                JSONArray receivedArray = (JSONArray) json.get("received");
                for (Object obj : receivedArray) {
                    JSONObject requestObj = (JSONObject) obj;
                    String username = (String) requestObj.get("username");
                    String mcUsername = (String) requestObj.get("mcUsername");
                    String mcUUID = (String) requestObj.get("mcUUID");
                    
                    if (mcUUID != null && !mcUUID.isEmpty()) {
                        UUID uuid = UUID.fromString(mcUUID);
                        FriendRequest request = new FriendRequest(uuid, player.getUniqueId(), FriendRequest.Type.RECEIVED);
                        request.setUsername(username);
                        request.setMcUsername(mcUsername);
                        received.add(request);
                    }
                }
                
                requests.put("sent", sent);
                requests.put("received", received);
                
                // Cache received requests for quick accept/deny
                requestCache.put(player.getUniqueId(), received);
                
                return requests;
            } catch (IOException | ParseException e) {
                plugin.getLogger().log(Level.WARNING, "Failed to load friend requests for " + player.getName(), e);
                requests.put("sent", sent);
                requests.put("received", received);
                return requests;
            }
        });
    }
    
    /**
     * Sends a friend request to another player
     * @param sender The player sending the request
     * @param targetName The name of the target player
     * @return A CompletableFuture that completes when the request is sent
     */
    public CompletableFuture<Boolean> sendFriendRequest(Player sender, String targetName) {
        return CompletableFuture.supplyAsync(() -> {
            // Try to find the target player first
            Player targetPlayer = Bukkit.getPlayerExact(targetName);
            
            if (targetPlayer == null) {
                // Player not online, check UUID based on name
                return sendOfflineFriendRequest(sender, targetName);
            }
            
            // Both players are online
            String senderUUID = sender.getUniqueId().toString();
            String receiverUUID = targetPlayer.getUniqueId().toString();
            
            try {
                String endpoint = "/api/mc/friends/request";
                Map<String, String> params = new HashMap<>();
                params.put("senderUUID", senderUUID);
                params.put("receiverUUID", receiverUUID);
                
                String response = apiService.post(endpoint, params);
                
                JSONParser parser = new JSONParser();
                JSONObject json = (JSONObject) parser.parse(response);
                
                if (json.containsKey("error")) {
                    String error = (String) json.get("error");
                    MessageUtils.sendError(sender, "Friend request failed: " + error);
                    return false;
                }
                
                // Notify the target player
                MessageUtils.sendInfo(targetPlayer, 
                        "§d" + sender.getName() + "§f has sent you a friend request!");
                MessageUtils.sendInfo(targetPlayer, 
                        "Use §d/friend accept " + sender.getName() + "§f to accept.");
                
                // Notify the sender
                MessageUtils.sendSuccess(sender, 
                        "Friend request sent to §d" + targetPlayer.getName() + "§f!");
                
                return true;
            } catch (IOException | ParseException e) {
                plugin.getLogger().log(Level.WARNING, "Failed to send friend request", e);
                MessageUtils.sendError(sender, "Failed to send friend request: " + e.getMessage());
                return false;
            }
        });
    }
    
    /**
     * Sends a friend request to a player who is offline
     * @param sender The player sending the request
     * @param targetName The name of the target player
     * @return Whether the request was sent successfully
     */
    private boolean sendOfflineFriendRequest(Player sender, String targetName) {
        // This requires additional API call to resolve the UUID from the username
        try {
            // Try to find the player in the database
            String endpoint = "/api/player/" + targetName;
            String response = apiService.get(endpoint);
            
            JSONParser parser = new JSONParser();
            JSONObject json = (JSONObject) parser.parse(response);
            
            if (json.containsKey("error")) {
                MessageUtils.sendError(sender, "Player not found: " + targetName);
                return false;
            }
            
            String targetUUID = (String) json.get("uuid");
            if (targetUUID == null || targetUUID.isEmpty()) {
                MessageUtils.sendError(sender, "Could not get UUID for player: " + targetName);
                return false;
            }
            
            // Now send the friend request
            String senderUUID = sender.getUniqueId().toString();
            endpoint = "/api/mc/friends/request";
            Map<String, String> params = new HashMap<>();
            params.put("senderUUID", senderUUID);
            params.put("receiverUUID", targetUUID);
            
            response = apiService.post(endpoint, params);
            json = (JSONObject) parser.parse(response);
            
            if (json.containsKey("error")) {
                String error = (String) json.get("error");
                MessageUtils.sendError(sender, "Friend request failed: " + error);
                return false;
            }
            
            MessageUtils.sendSuccess(sender, 
                    "Friend request sent to §d" + targetName + "§f!");
            return true;
            
        } catch (IOException | ParseException e) {
            plugin.getLogger().log(Level.WARNING, "Failed to send offline friend request", e);
            MessageUtils.sendError(sender, "Failed to send friend request: " + e.getMessage());
            return false;
        }
    }
    
    /**
     * Accepts a friend request
     * @param player The player accepting the request
     * @param senderName The name of the player who sent the request
     * @return A CompletableFuture that completes when the request is accepted
     */
    public CompletableFuture<Boolean> acceptFriendRequest(Player player, String senderName) {
        return CompletableFuture.supplyAsync(() -> {
            // First check if there's a request from this player
            List<FriendRequest> receivedRequests = requestCache.getOrDefault(player.getUniqueId(), new ArrayList<>());
            
            // Find the request by sender name
            Optional<FriendRequest> requestOpt = receivedRequests.stream()
                    .filter(r -> r.getMcUsername() != null && r.getMcUsername().equalsIgnoreCase(senderName))
                    .findFirst();
            
            if (!requestOpt.isPresent()) {
                MessageUtils.sendError(player, "No friend request from " + senderName);
                return false;
            }
            
            FriendRequest request = requestOpt.get();
            String accepterUUID = player.getUniqueId().toString();
            String requesterUUID = request.getSender().toString();
            
            try {
                String endpoint = "/api/mc/friends/accept";
                Map<String, String> params = new HashMap<>();
                params.put("accepterUUID", accepterUUID);
                params.put("requesterUUID", requesterUUID);
                
                String response = apiService.post(endpoint, params);
                
                JSONParser parser = new JSONParser();
                JSONObject json = (JSONObject) parser.parse(response);
                
                if (json.containsKey("error")) {
                    String error = (String) json.get("error");
                    MessageUtils.sendError(player, "Failed to accept friend request: " + error);
                    return false;
                }
                
                // Update local caches
                receivedRequests.remove(request);
                requestCache.put(player.getUniqueId(), receivedRequests);
                
                // If the requester is online, notify them
                Player requester = Bukkit.getPlayer(request.getSender());
                if (requester != null && requester.isOnline()) {
                    MessageUtils.sendSuccess(requester, 
                            "§d" + player.getName() + "§f has accepted your friend request!");
                }
                
                // Notify the accepter
                MessageUtils.sendSuccess(player, 
                        "You are now friends with §d" + senderName + "§f!");
                
                // Force refresh the friend cache
                loadFriends(player);
                
                return true;
            } catch (IOException | ParseException e) {
                plugin.getLogger().log(Level.WARNING, "Failed to accept friend request", e);
                MessageUtils.sendError(player, "Failed to accept friend request: " + e.getMessage());
                return false;
            }
        });
    }
    
    /**
     * Rejects a friend request
     * @param player The player rejecting the request
     * @param senderName The name of the player who sent the request
     * @return A CompletableFuture that completes when the request is rejected
     */
    public CompletableFuture<Boolean> rejectFriendRequest(Player player, String senderName) {
        return CompletableFuture.supplyAsync(() -> {
            // Implementation similar to acceptFriendRequest, but with different API endpoint
            // For now, reusing the accept endpoint with additional flag
            return true; // Replace with actual implementation
        });
    }
    
    /**
     * Removes a friend
     * @param player The player removing the friend
     * @param friendName The name of the friend to remove
     * @return A CompletableFuture that completes when the friend is removed
     */
    public CompletableFuture<Boolean> removeFriend(Player player, String friendName) {
        return CompletableFuture.supplyAsync(() -> {
            // First check if this is actually a friend
            List<FriendData> friends = friendCache.getOrDefault(player.getUniqueId(), new ArrayList<>());
            
            // Find the friend by name
            Optional<FriendData> friendOpt = friends.stream()
                    .filter(f -> f.getMcUsername() != null && f.getMcUsername().equalsIgnoreCase(friendName))
                    .findFirst();
            
            if (!friendOpt.isPresent()) {
                MessageUtils.sendError(player, friendName + " is not in your friends list");
                return false;
            }
            
            FriendData friend = friendOpt.get();
            String userUUID = player.getUniqueId().toString();
            String friendUUID = friend.getUuid().toString();
            
            try {
                String endpoint = "/api/mc/friends/remove";
                Map<String, String> params = new HashMap<>();
                params.put("userUUID", userUUID);
                params.put("friendUUID", friendUUID);
                
                String response = apiService.post(endpoint, params);
                
                JSONParser parser = new JSONParser();
                JSONObject json = (JSONObject) parser.parse(response);
                
                if (json.containsKey("error")) {
                    String error = (String) json.get("error");
                    MessageUtils.sendError(player, "Failed to remove friend: " + error);
                    return false;
                }
                
                // Update local cache
                friends.remove(friend);
                friendCache.put(player.getUniqueId(), friends);
                
                // If the friend is online, notify them
                Player friendPlayer = Bukkit.getPlayer(friend.getUuid());
                if (friendPlayer != null && friendPlayer.isOnline()) {
                    MessageUtils.sendInfo(friendPlayer, 
                            "§d" + player.getName() + "§f has removed you from their friends list");
                    
                    // Also update their cache
                    List<FriendData> friendsFriends = friendCache.getOrDefault(friendPlayer.getUniqueId(), new ArrayList<>());
                    friendsFriends.removeIf(f -> f.getUuid().equals(player.getUniqueId()));
                    friendCache.put(friendPlayer.getUniqueId(), friendsFriends);
                }
                
                // Notify the player
                MessageUtils.sendSuccess(player, 
                        "§d" + friendName + "§f has been removed from your friends list");
                
                return true;
            } catch (IOException | ParseException e) {
                plugin.getLogger().log(Level.WARNING, "Failed to remove friend", e);
                MessageUtils.sendError(player, "Failed to remove friend: " + e.getMessage());
                return false;
            }
        });
    }
    
    /**
     * Lists a player's friends
     * @param player The player to list friends for
     */
    public void listFriends(Player player) {
        List<FriendData> friends = friendCache.getOrDefault(player.getUniqueId(), new ArrayList<>());
        
        if (friends.isEmpty()) {
            // If cache is empty, try to load from API first
            loadFriends(player).thenAccept(loadedFriends -> {
                if (loadedFriends.isEmpty()) {
                    MessageUtils.sendInfo(player, "You don't have any friends yet");
                    return;
                }
                
                displayFriendsList(player, loadedFriends);
            });
        } else {
            displayFriendsList(player, friends);
        }
    }
    
    /**
     * Displays a formatted list of friends to a player
     * @param player The player to display the list to
     * @param friends The list of friends to display
     */
    private void displayFriendsList(Player player, List<FriendData> friends) {
        MessageUtils.sendInfo(player, "§d=== Your Friends (" + friends.size() + ") ===");
        
        // Sort by online status first, then by name
        friends.sort((a, b) -> {
            if (a.isOnline() != b.isOnline()) {
                return a.isOnline() ? -1 : 1; // Online friends first
            }
            return a.getMcUsername().compareToIgnoreCase(b.getMcUsername());
        });
        
        for (FriendData friend : friends) {
            String status = friend.isOnline() ? "§a[Online]" : "§7[Offline]";
            MessageUtils.sendRaw(player, status + " §f" + friend.getMcUsername());
        }
    }
    
    /**
     * Lists a player's pending friend requests
     * @param player The player to list requests for
     */
    public void listRequests(Player player) {
        loadFriendRequests(player).thenAccept(requests -> {
            List<FriendRequest> sent = requests.get("sent");
            List<FriendRequest> received = requests.get("received");
            
            if (sent.isEmpty() && received.isEmpty()) {
                MessageUtils.sendInfo(player, "You don't have any pending friend requests");
                return;
            }
            
            // Display received requests first
            if (!received.isEmpty()) {
                MessageUtils.sendInfo(player, "§d=== Friend Requests (" + received.size() + ") ===");
                for (FriendRequest request : received) {
                    String name = request.getMcUsername() != null ? request.getMcUsername() : "Unknown";
                    MessageUtils.sendRaw(player, "§e• §f" + name + " §7(use §f/friend accept " + name + "§7)");
                }
            }
            
            // Then display sent requests
            if (!sent.isEmpty()) {
                MessageUtils.sendInfo(player, "§d=== Sent Requests (" + sent.size() + ") ===");
                for (FriendRequest request : sent) {
                    String name = request.getMcUsername() != null ? request.getMcUsername() : "Unknown";
                    MessageUtils.sendRaw(player, "§7• §f" + name);
                }
            }
        });
    }
    
    /**
     * Gets a list of a player's friends
     * @param player The player to get friends for
     * @return The list of friends
     */
    public List<FriendData> getFriends(Player player) {
        return friendCache.getOrDefault(player.getUniqueId(), new ArrayList<>());
    }
    
    /**
     * Checks if two players are friends
     * @param player The player to check
     * @param otherPlayer The other player to check
     * @return Whether the players are friends
     */
    public boolean areFriends(Player player, Player otherPlayer) {
        List<FriendData> friends = getFriends(player);
        return friends.stream().anyMatch(f -> f.getUuid().equals(otherPlayer.getUniqueId()));
    }
    
    /**
     * Gets a list of players that have sent friend requests to a player
     * @param player The player to get requests for
     * @return The list of received friend requests
     */
    public List<FriendRequest> getReceivedRequests(Player player) {
        return requestCache.getOrDefault(player.getUniqueId(), new ArrayList<>());
    }
    
    /**
     * Gets a list of players that have sent friend requests to a player
     * @param player The player to get requests for
     * @return The list of players that have sent requests
    }
    
    public FriendRequest(UUID sender, UUID receiver, Type type) {
        this.sender = sender;
        this.receiver = receiver;
        this.type = type;
    }
    
    public UUID getSender() {
        return sender;
    public void clearCache(Player player) {
        friendCache.remove(player.getUniqueId());
        requestCache.remove(player.getUniqueId());
    }
    
    /**
     * Gets a list of online friends for a player
     * @param player The player to get online friends for
     * @return A list of online friends
     */
    public List<Player> getOnlineFriends(Player player) {
        List<FriendData> friends = getFriends(player);
        return friends.stream()
                .filter(FriendData::isOnline)
                .map(f -> Bukkit.getPlayer(f.getUuid()))
                .filter(Objects::nonNull)
                .collect(Collectors.toList());
    }
    
    /**
     * Updates the online status of a player's friends
     * @param player The player whose friends to update
     */
    public void updateFriendStatus(Player player) {
        List<Player> onlinePlayers = new ArrayList<>(Bukkit.getOnlinePlayers());
        List<FriendData> friends = getFriends(player);
        
        for (FriendData friend : friends) {
            boolean isOnline = onlinePlayers.stream()
                    .anyMatch(p -> p.getUniqueId().equals(friend.getUuid()));
            friend.setOnline(isOnline);
        }
    }
    
    /**
     * Represents a friend of a player
     */
    public static class FriendData {
        private final String username;
        private final String mcUsername;
        private final UUID uuid;
        private boolean online;
        
        public FriendData(String username, String mcUsername, UUID uuid) {
            this.username = username;
            this.mcUsername = mcUsername;
            this.uuid = uuid;
            this.online = false;
        }
        
        public String getUsername() {
            return username;
        }
        
        public String getMcUsername() {
            return mcUsername;
        }
        
        public UUID getUuid() {
            return uuid;
        }
        
        public boolean isOnline() {
            return online;
        }
        
        public void setOnline(boolean online) {
            this.online = online;
        }
    }
    
    /**
     * Represents a friend request between two players
     */
    public static class FriendRequest {
        private final UUID sender;
        private final UUID receiver;
        private final Type type;
        private String username;
        private String mcUsername;
        
        public enum Type {
            SENT,
            RECEIVED
        }
        
        public FriendRequest(UUID sender, UUID receiver, Type type) {
            this.sender = sender;
            this.receiver = receiver;
            this.type = type;
        }
        
        public UUID getSender() {
            return sender;
        }
        
        public UUID getReceiver() {
            return receiver;
        }
        
        public Type getType() {
            return type;
        }
        
        public String getUsername() {
            return username;
        }
        
        public void setUsername(String username) {
            this.username = username;
        }
        
        public String getMcUsername() {
            return mcUsername;
        }
        
        public void setMcUsername(String mcUsername) {
            this.mcUsername = mcUsername;
        }
    }
}