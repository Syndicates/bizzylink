import React from 'react';

const FYPCommunityPanel = () => (
  <aside className="bg-minecraft-dark rounded-lg shadow p-4 flex flex-col gap-6">
    {/* Trending Topics */}
    <section>
      <h3 className="font-minecraft text-minecraft-green mb-2 text-lg">Trending Topics</h3>
      <ul className="space-y-1">
        <li className="text-minecraft-green">#Minecraft</li>
        <li className="text-minecraft-green">#BizzyNation</li>
        <li className="text-minecraft-green">#FYP</li>
        <li className="text-minecraft-green">#Community</li>
      </ul>
    </section>
    {/* Suggested Users */}
    <section>
      <h3 className="font-minecraft text-minecraft-green mb-2 text-lg">Suggested Users</h3>
      <ul className="space-y-1">
        <li className="text-minecraft-green">@Steve</li>
        <li className="text-minecraft-green">@Alex</li>
        <li className="text-minecraft-green">@BizzyBot</li>
      </ul>
    </section>
    {/* Recent Activity */}
    <section>
      <h3 className="font-minecraft text-minecraft-green mb-2 text-lg">Recent Activity</h3>
      <ul className="space-y-1">
        <li className="text-minecraft-green">Dexter liked a post</li>
        <li className="text-minecraft-green">bizzy reposted "repost this"</li>
        <li className="text-minecraft-green">Steve joined the community</li>
      </ul>
    </section>
    {/* Quick Links */}
    <section>
      <h3 className="font-minecraft text-minecraft-green mb-2 text-lg">Quick Links</h3>
      <ul className="space-y-1">
        <li><a href="/leaderboard" className="text-minecraft-green hover:underline">Leaderboard</a></li>
        <li><a href="/events" className="text-minecraft-green hover:underline">Events</a></li>
        <li><a href="/groups" className="text-minecraft-green hover:underline">Groups</a></li>
      </ul>
    </section>
  </aside>
);

export default FYPCommunityPanel; 