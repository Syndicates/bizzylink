/**
 * +-------------------------------------------------+
 * |                 BIZZY NATION                    |
 * |          Crafted with ♦ by Bizzy 2025           |
 * +-------------------------------------------------+
 *
 * @file FeedSidebar.jsx
 * @description Modern sidebar for FYP/Feed page, using real data and profile-inspired design
 * @copyright © Bizzy Nation - All Rights Reserved
 * @license Proprietary - Not for distribution
 *
 * This file is protected intellectual property of Bizzy Nation.
 * Unauthorized use, copying, or distribution is prohibited.
 */

import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { HashtagIcon, UsersIcon, FireIcon, ArrowTrendingUpIcon, SparklesIcon, HeartIcon, ArrowPathRoundedSquareIcon, UserPlusIcon, PencilIcon } from "@heroicons/react/24/solid";
import MinecraftAvatar from "./MinecraftAvatar";
import { formatDistanceToNow } from "date-fns";

const Tooltip = ({ children, text }) => (
  <div className="relative group">
    {children}
    <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 hidden group-hover:block bg-minecraft-dark text-white text-xs rounded px-2 py-1 shadow-lg z-20 whitespace-nowrap">
      {text}
    </div>
  </div>
);

const activityIcons = {
  post: <PencilIcon className="h-4 w-4 text-blue-400" />,
  like: <HeartIcon className="h-4 w-4 text-pink-400" />,
  repost: <ArrowPathRoundedSquareIcon className="h-4 w-4 text-green-400" />,
  join: <UserPlusIcon className="h-4 w-4 text-yellow-400" />,
};

const FeedSidebar = () => {
  const [topics, setTopics] = useState([]);
  const [users, setUsers] = useState([]);
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetch("/api/trending-topics").then(res => res.json()),
      fetch("/api/suggested-users").then(res => res.json()),
      fetch("/api/recent-activity").then(res => res.json()),
    ]).then(([topicsData, usersData, activityData]) => {
      setTopics(Array.isArray(topicsData) ? topicsData : []);
      setUsers(Array.isArray(usersData) ? usersData : []);
      setActivity(Array.isArray(activityData) ? activityData : []);
      setLoading(false);
    }).catch(() => {
      setTopics([]);
      setUsers([]);
      setActivity([]);
      setLoading(false);
    });
  }, []);

  return (
    <aside className="space-y-4 w-full max-w-xs">
      {/* Trending Topics */}
      <section className="bg-minecraft-dark border border-white/10 rounded-lg shadow p-4">
        <div className="flex items-center mb-2">
          <ArrowTrendingUpIcon className="h-5 w-5 text-minecraft-habbo-blue mr-2" />
          <h2 className="font-bold text-lg text-white tracking-wide">Trending Topics</h2>
        </div>
        <ul className="space-y-1">
          {loading ? (
            <li className="text-gray-400">Loading...</li>
          ) : !Array.isArray(topics) || topics.length === 0 ? (
            <li className="text-gray-400">No trending topics</li>
          ) : (
            topics.map((topic) => (
              <li key={topic} className="flex items-center">
                <HashtagIcon className="h-4 w-4 text-minecraft-habbo-blue mr-1" />
                <Link to={`/search?tag=${encodeURIComponent(topic)}`} className="text-minecraft-habbo-blue hover:underline">
                  #{topic}
                </Link>
              </li>
            ))
          )}
        </ul>
      </section>

      {/* Suggested Users */}
      <section className="bg-minecraft-dark border border-white/10 rounded-lg shadow p-4">
        <div className="flex items-center mb-2">
          <UsersIcon className="h-5 w-5 text-minecraft-habbo-green mr-2" />
          <h2 className="font-bold text-lg text-white tracking-wide">Suggested Users</h2>
        </div>
        <div className="flex flex-wrap gap-3">
          {loading ? (
            <span className="text-gray-400">Loading...</span>
          ) : users.length === 0 ? (
            <span className="text-gray-400">No suggestions</span>
          ) : (
            users.map((user) => (
              <Tooltip key={user._id} text={user.username}>
                <Link to={`/profile/${user.username}`}>
                  <MinecraftAvatar
                    username={user.mcUsername || user.minecraftUsername || user.username}
                    size={36}
                    type="head"
                    className="rounded-md border-2 border-white/20 hover:border-minecraft-habbo-blue transition"
                  />
                </Link>
              </Tooltip>
            ))
          )}
        </div>
      </section>

      {/* Recent Activity */}
      <section className="bg-minecraft-dark border border-white/10 rounded-lg shadow p-4">
        <div className="flex items-center mb-2">
          <FireIcon className="h-5 w-5 text-minecraft-habbo-orange mr-2" />
          <h2 className="font-bold text-lg text-white tracking-wide">Recent Activity</h2>
        </div>
        <ul className="divide-y divide-white/10">
          {loading ? (
            <li className="py-2 text-gray-400">Loading...</li>
          ) : activity.length === 0 ? (
            <li className="py-2">No recent activity</li>
          ) : (
            activity.map((item, idx) => (
              <li key={idx} className="flex items-center py-2 gap-2">
                {activityIcons[item.type] || <PencilIcon className="h-4 w-4 text-gray-400" />}
                <span>
                  <span className="font-semibold text-minecraft-habbo-blue">{item.username}</span>
                  {item.type === "like" && " liked a post"}
                  {item.type === "repost" && (
                    <>
                      {" reposted "}
                      <span className="italic text-gray-300">"{item.message}"</span>
                    </>
                  )}
                  {item.type === "post" && " posted"}
                  {item.type === "join" && " joined the community"}
                  {item.createdAt && (
                    <span className="ml-2 text-xs text-gray-400">
                      {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
                    </span>
                  )}
                </span>
              </li>
            ))
          )}
        </ul>
      </section>

      {/* Quick Links */}
      <section className="bg-minecraft-dark border border-white/10 rounded-lg shadow p-4">
        <div className="flex items-center mb-2">
          <SparklesIcon className="h-5 w-5 text-minecraft-habbo-yellow mr-2" />
          <h2 className="font-bold text-lg text-white tracking-wide">Quick Links</h2>
        </div>
        <ul className="space-y-1">
          <li>
            <Link to="/leaderboard" className="hover:underline text-minecraft-habbo-blue">Leaderboard</Link>
          </li>
          <li>
            <Link to="/events" className="hover:underline text-minecraft-habbo-blue">Events</Link>
          </li>
          <li>
            <Link to="/groups" className="hover:underline text-minecraft-habbo-blue">Groups</Link>
          </li>
        </ul>
      </section>
    </aside>
  );
};

export default FeedSidebar; 