package com.bizzynation;

import org.bukkit.plugin.java.JavaPlugin;

public class LinkPlugin extends JavaPlugin {
    @Override
    public void onEnable() {
        this.getCommand("link").setExecutor(new LinkCommand());
        getLogger().info("BizzyLink Plugin Enabled!");
    }

    @Override
    public void onDisable() {
        getLogger().info("BizzyLink Plugin Disabled!");
    }
}