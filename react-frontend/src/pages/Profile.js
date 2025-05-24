/**
 * +-------------------------------------------------+
 * |                 BIZZY NATION                    |
 * |          Crafted with ♦ by Bizzy 2025         |
 * +-------------------------------------------------+
 *
 * @file Profile.js
 * @description
 * @copyright © Bizzy Nation - All Rights Reserved
 * @license Proprietary - Not for distribution
 *
 * This file is protected intellectual property of Bizzy Nation.
 * Unauthorized use, copying, or distribution is prohibited.
 */

import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import VerificationCelebration from "../components/VerificationCelebration";
import { motion, AnimatePresence } from "framer-motion";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useSocial } from "../contexts/SocialContext";
import { MinecraftService } from "../services/api";
import API from "../services/api";
import LoadingSpinner from "../components/LoadingSpinner";
import Notification from "../components/Notification";
import MinecraftAvatar from "../components/MinecraftAvatar";
import MinecraftInventory from "../components/MinecraftInventory";
import MinecraftAchievements from "../components/MinecraftAchievements";
import MinecraftPluginIntegrations from "../components/MinecraftPluginIntegrations";
import LevelProgressBar from "../components/LevelProgressBar";
import TitleSystem from "../components/TitleSystem";
import MinecraftPlayerModel3D from "../components/MinecraftPlayerModel3D";
import FriendButton from "../components/social/FriendButton";
import FollowButton from "../components/social/FollowButton";
import {
  UserIcon,
  CalendarIcon,
  ClockIcon,
  CubeIcon,
  CurrencyDollarIcon,
  ChatBubbleLeftIcon,
  UsersIcon,
  GlobeAltIcon,
  ChartBarIcon,
  PhotoIcon,
  PencilIcon,
  MapPinIcon,
  BriefcaseIcon,
  BookmarkIcon,
  GiftIcon,
  HeartIcon,
  HandThumbUpIcon,
  ChatBubbleOvalLeftIcon,
  HomeIcon,
  TrophyIcon,
  CheckIcon,
  UserPlusIcon,
  XMarkIcon,
  Cog6ToothIcon,
  EyeIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  ArrowPathIcon,
  FaceSmileIcon,
} from "@heroicons/react/24/outline";
import AnimatedPlayerStats from "../components/AnimatedPlayerStats";
// Import WallService after all React, UI and context imports
import WallService from "../services/wallService";
import { SocialService } from "../services/api";
// Import timeUtils explicitly
import { formatRelativeTime as timeAgo, formatDate } from "../utils/timeUtils";
// Import the useSocialStats hook after all service imports
import useSocialStats from "../hooks/useSocialStats";
import { useEventSource } from "../contexts/EventSourceContext";

// Using imported timeAgo from utils

// Predefined wallpaper options (id, label)
const WALLPAPERS = [
  { id: "herobrine_hill", label: "Herobrine Hill", external: true },
  { id: "quick_hide", label: "Quick Hide", external: true },
  { id: "malevolent", label: "Malevolent", external: true },
  { id: "sunset_lake", label: "Sunset Lake", custom: true },
  { id: "pink_sky", label: "Pink Sky", custom: true },
  { id: "night_adventure", label: "Night Adventure", custom: true },
  // Removed unavailable wallpapers wallpaper_1, wallpaper_2, and wallpaper_3
];

// Helper to get wallpaper URL for a given id and username
const getWallpaperUrl = (id, username) => {
  // Check if wallpaper exists
  const wallpaper = WALLPAPERS.find((wp) => wp.id === id);

  // If wallpaper doesn't exist, use default
  if (!wallpaper) {
    return `/minecraft-assets/wallpapers/night_adventure.jpg`;
  }

  // Check if this is one of our custom wallpapers
  if (wallpaper.custom) {
    return `/minecraft-assets/wallpapers/${id}.jpg`;
  }

  // Use the external service for standard wallpapers if we mark it as external
  if (wallpaper.external) {
    // If no username provided, use Steve as default
    const safeUsername = username || "Steve";
    return `https://starlightskins.lunareclipse.studio/render/wallpaper/${id}/${safeUsername}`;
  }

  // Fallback to default wallpaper
  return `/minecraft-assets/wallpapers/night_adventure.jpg`;
};

// Helper to get thumbnail (use a default player for preview)
const getWallpaperThumb = (id) => {
  // Check if wallpaper exists
  const wallpaper = WALLPAPERS.find((wp) => wp.id === id);

  // If wallpaper doesn't exist, use default
  if (!wallpaper) {
    return `/minecraft-assets/wallpapers/night_adventure.jpg`;
  }

  // Check if this is one of our custom wallpapers
  if (wallpaper.custom) {
    return `/minecraft-assets/wallpapers/${id}.jpg`;
  }

  // Use the external service for standard wallpapers
  if (wallpaper.external) {
    return `https://starlightskins.lunareclipse.studio/render/wallpaper/${id}/Steve?thumb=1`;
  }

  // Fallback to default wallpaper
  return `/minecraft-assets/wallpapers/night_adventure.jpg`;
};

// Map usernames to default covers to make each profile feel unique
const getDefaultCover = (username) => {
  // Always use a valid wallpaperId and username
  return getWallpaperUrl("herobrine_hill", username || "Steve");
};

// Activity feed item component
const ActivityItem = ({
  icon,
  title,
  description,
  time,
  children,
  type = "default",
}) => {
  return (
    <div className="bg-white/10 rounded-md p-4 mb-4">
      <div className="flex items-start">
        <div
          className={`w-10 h-10 rounded-md flex items-center justify-center mr-3 
          ${
            type === "achievement"
              ? "bg-yellow-600/50"
              : type === "kill"
                ? "bg-red-600/50"
                : type === "build"
                  ? "bg-blue-600/50"
                  : type === "mine"
                    ? "bg-green-600/50"
                    : "bg-gray-600/50"
          }`}
        >
          {icon}
        </div>
        <div className="flex-1">
          <div className="flex justify-between items-start">
            <h3 className="text-lg font-minecraft">{title}</h3>
            <span className="text-xs text-gray-400">{time}</span>
          </div>
          <p className="text-sm text-gray-300 mt-1">{description}</p>
          {children && (
            <div className="mt-3 border-t border-white/10 pt-3">{children}</div>
          )}
          <div className="flex items-center mt-3 text-sm text-gray-400">
            <button className="flex items-center hover:text-white mr-4">
              <HandThumbUpIcon className="h-4 w-4 mr-1" />
              Like
            </button>
            <button className="flex items-center hover:text-white">
              <ChatBubbleOvalLeftIcon className="h-4 w-4 mr-1" />
              Comment
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Friend component
const FriendItem = ({ username, avatar, status, online }) => {
  return (
    <div className="flex items-center mb-3">
      <div className="relative">
        <MinecraftAvatar
          username={username}
          size={40}
          className="mr-3"
          type="head"
        />
        {online && (
          <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border border-gray-800"></span>
        )}
      </div>
      <div>
        <p className="text-sm font-medium">{username}</p>
        <p className="text-xs text-gray-400">{status}</p>
      </div>
    </div>
  );
};

// Generate inventory items from player data
const generateInventoryItems = (inventoryData) => {
  if (!inventoryData) return [];

  const items = [];

  // Add main hand item if available
  if (inventoryData.main_hand && inventoryData.main_hand.name) {
    items.push({
      name: inventoryData.main_hand.name,
      count: inventoryData.main_hand.amount || 1,
      durability: inventoryData.main_hand.durability,
      label: inventoryData.main_hand.name
        .replace(/_/g, " ")
        .split(" ")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" "),
    });
  }

  // Add hotbar and inventory items if available
  if (inventoryData.contents && Array.isArray(inventoryData.contents)) {
    inventoryData.contents.forEach((item) => {
      if (item && item.name) {
        items.push({
          name: item.name,
          count: item.amount || 1,
          durability: item.durability,
          label: item.name
            .replace(/_/g, " ")
            .split(" ")
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(" "),
        });
      }
    });
  }

  // Add valuables as items if available and not already added
  if (inventoryData.valuables) {
    if (inventoryData.valuables.diamond > 0) {
      items.push({
        name: "diamond",
        count: inventoryData.valuables.diamond,
        label: "Diamond",
      });
    }

    if (inventoryData.valuables.emerald > 0) {
      items.push({
        name: "emerald",
        count: inventoryData.valuables.emerald,
        label: "Emerald",
      });
    }

    if (inventoryData.valuables.gold > 0) {
      items.push({
        name: "gold_ingot",
        count: inventoryData.valuables.gold,
        label: "Gold Ingot",
      });
    }

    if (inventoryData.valuables.netherite > 0) {
      items.push({
        name: "netherite_ingot",
        count: inventoryData.valuables.netherite,
        label: "Netherite Ingot",
      });
    }
  }

  return items;
};

// Add this at the beginning of the file to define animations
const fadeInAnimation = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0 },
  transition: { duration: 0.3 },
};

// Enhanced CommentItem with animation and fixed avatar/username issues
const CommentItem = ({ comment, postId, onDelete, currentUser }) => {
  // Format the date to display
  const formattedDate = timeAgo(comment.createdAt);

  // Check if the current user is the author of the comment
  const isCommentAuthor =
    currentUser &&
    (currentUser._id === comment.author?._id ||
      currentUser.username === comment.author?.username);

  // Ensure author exists or provide fallback
  const author = comment.author || {
    username: "Unknown User",
    mcUsername: "Steve",
  };

  // Create exact timestamp for hover
  const exactTimestamp = comment.createdAt
    ? new Date(comment.createdAt).toLocaleString()
    : "Unknown date";

  // Log comment author info for debugging
  console.log(`[CommentItem] Comment author data:`, author);

  // Ensure we have a valid username for the avatar
  // Fixed: ensure mcUsername is properly used (in server responses it might be minecraftUsername)
  const avatarUsername =
    author.mcUsername || author.minecraftUsername || author.username;
  console.log(
    `[CommentItem] Using avatar username: ${avatarUsername} for author: ${author.username}`,
  );

  return (
    <motion.div
      className="flex items-start py-2 group hover:bg-minecraft-navy/20 rounded-md px-2 -mx-2 transition-colors"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Link to={`/profile/${author.username}`} className="flex-shrink-0">
        <MinecraftAvatar
          username={avatarUsername}
          size={28}
          type="head"
          className="rounded-md hover:ring-2 hover:ring-minecraft-habbo-blue transition-all"
        />
      </Link>
      <div className="ml-2 flex-1">
        <div className="flex justify-between items-start">
          <div>
            <Link
              to={`/profile/${author.username}`}
              className="font-medium text-sm hover:text-minecraft-habbo-blue transition-colors"
            >
              {author.username}
            </Link>
            <span
              className="text-gray-400 text-xs ml-2 cursor-default"
              title={exactTimestamp}
            >
              {formattedDate}
            </span>
          </div>
          {isCommentAuthor && (
            <button
              onClick={() => onDelete(postId, comment._id)}
              className="text-gray-400 opacity-0 group-hover:opacity-100 hover:text-red-400 transition-all duration-200"
              title="Delete comment"
            >
              <XMarkIcon className="h-4 w-4" />
            </button>
          )}
        </div>
        <p className="text-sm text-gray-200 mt-1 break-words">
          {comment.content}
        </p>
      </div>
    </motion.div>
  );
};

// Enhanced CommentSection with animations and improved styling
const CommentSection = ({
  post,
  commentInput,
  commentLoading,
  commentError,
  onCommentChange,
  onAddComment,
  onDeleteComment,
  currentUser,
  isExpanded,
  onToggleExpand,
}) => {
  // Get comments from post or default to empty array
  const comments = post.comments || [];
  const postId = post._id;

  // Reference to input field for focusing
  const inputRef = useRef(null);

  // State to track emoji picker visibility
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  // State to track if the comment input is visible
  const [showCommentInput, setShowCommentInput] = useState(false);

  // Focus input when expanded
  useEffect(() => {
    if (isExpanded && showCommentInput && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isExpanded, showCommentInput]);

  // Handle Enter key press
  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey && commentInput.trim()) {
      e.preventDefault();
      onAddComment(postId);
      setShowCommentInput(false); // Hide input after posting
    }
  };

  // Handle emoji insertion
  const handleEmojiSelect = (emoji) => {
    onCommentChange(postId, commentInput + emoji);
    setShowEmojiPicker(false);
    inputRef.current?.focus();
  };

  // Common emojis for quick selection
  const quickEmojis = ["😊", "👍", "❤️", "😂", "😎", "🎮", "🧱", "⛏️", "🗡️"];

  // In CommentSection, add state for comment deletion modal and pending comment
  const [showDeleteCommentModal, setShowDeleteCommentModal] = useState(false);
  const [commentToDelete, setCommentToDelete] = useState(null);

  // Handler to trigger modal
  const handleDeleteCommentWithConfirm = (commentId) => {
    setCommentToDelete(commentId);
    setShowDeleteCommentModal(true);
  };

  // Handler to confirm deletion
  const confirmDeleteComment = () => {
    if (commentToDelete) {
      onDeleteComment(postId, commentToDelete);
      setShowDeleteCommentModal(false);
      setCommentToDelete(null);
    }
  };

  // Handler to cancel deletion
  const cancelDeleteComment = () => {
    setShowDeleteCommentModal(false);
    setCommentToDelete(null);
  };

  return (
    <div className="mt-4">
      {/* Comment toggle button */}
      <button
        onClick={onToggleExpand}
        className="flex items-center text-sm text-gray-400 hover:text-white transition-colors group"
      >
        <div className="flex items-center relative">
          <ChatBubbleOvalLeftIcon className="h-4 w-4 mr-1" />
          {comments.length > 0 && (
            <span className="absolute -top-2 -right-1 bg-minecraft-habbo-blue text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
              {comments.length > 99 ? "99+" : comments.length}
            </span>
          )}
        </div>
        <span className="ml-1 group-hover:text-white transition-colors">
          {comments.length === 0
            ? "Add Comment"
            : isExpanded
              ? "Hide Comments"
              : "Show Comments"}
        </span>
      </button>

      {/* Expanded comment section */}
      {isExpanded && (
        <motion.div
          className="mt-3 pt-3 border-t border-white/10 comment-section rounded-md transition-colors duration-200"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* Comment list with animation */}
          <div className="mb-4 space-y-3">
            <AnimatePresence>
              {comments.map((comment) => (
                <motion.div
                  key={comment._id}
                  initial={{ opacity: 1, x: 0 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 40 }}
                  transition={{ duration: 0.3 }}
                >
                  <CommentItem
                    comment={comment}
                    postId={postId}
                    onDelete={() => handleDeleteCommentWithConfirm(comment._id)}
                    currentUser={currentUser}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Add Comment button or comment input form */}
          {currentUser && (
            <>
              {!showCommentInput ? (
                <motion.button
                  className="flex items-center text-sm text-minecraft-habbo-blue hover:text-minecraft-habbo-green transition-colors mt-2"
                  onClick={() => setShowCommentInput(true)}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.2 }}
                >
                  <span className="mr-1">+</span> Write a comment...
                </motion.button>
              ) : (
                <motion.div
                  className="flex items-start mt-2"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <MinecraftAvatar
                    username={currentUser.mcUsername || currentUser.username}
                    size={30}
                    type="head"
                    className="rounded-md mr-2 flex-shrink-0"
                  />
                  <div className="flex-1">
                    <div className="relative">
                      <input
                        ref={inputRef}
                        type="text"
                        value={commentInput}
                        onChange={(e) =>
                          onCommentChange(postId, e.target.value)
                        }
                        onKeyPress={handleKeyPress}
                        placeholder="Write a comment..."
                        className="w-full bg-minecraft-navy/50 text-white rounded-md py-2 px-3 pr-16 
                          focus:outline-none focus:ring-1 focus:ring-minecraft-habbo-blue
                          transition-all duration-200 hover:bg-minecraft-navy/70"
                      />

                      {/* Quick Emoji Picker (now appears below the new emoji button) */}
                      {showEmojiPicker && (
                        <div className="absolute right-0 top-full mt-2 bg-minecraft-navy-dark rounded-md p-2 shadow-lg border border-minecraft-habbo-blue/30 z-10">
                          <div className="flex flex-wrap gap-1 max-w-[200px]">
                            {quickEmojis.map((emoji) => (
                              <button
                                key={emoji}
                                onClick={() => handleEmojiSelect(emoji)}
                                className="hover:bg-minecraft-navy p-1 rounded-md transition-colors"
                              >
                                {emoji}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex gap-1">
                        <button
                          onClick={() => setShowCommentInput(false)}
                          className="text-gray-400 hover:text-white"
                          title="Cancel"
                        >
                          <XMarkIcon className="h-5 w-5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                          className="text-gray-400 hover:text-white transition-colors p-1"
                          title="Add emoji"
                        >
                          😊
                        </button>
                        <button
                          onClick={() => {
                            if (commentInput.trim()) {
                              onAddComment(postId);
                              setShowCommentInput(false);
                            }
                          }}
                          disabled={!commentInput?.trim() || commentLoading}
                          className={`px-2 py-1 rounded-md text-sm transition-all duration-200
                            ${
                              !commentInput?.trim() || commentLoading
                                ? "bg-gray-700 text-gray-400 cursor-not-allowed"
                                : "bg-minecraft-habbo-blue text-white hover:bg-minecraft-habbo-blue-dark"
                            }`}
                        >
                          {commentLoading ? (
                            <span className="flex items-center">
                              <svg
                                className="animate-spin -ml-1 mr-2 h-3 w-3 text-white"
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                              >
                                <circle
                                  className="opacity-25"
                                  cx="12"
                                  cy="12"
                                  r="10"
                                  stroke="currentColor"
                                  strokeWidth="4"
                                ></circle>
                                <path
                                  className="opacity-75"
                                  fill="currentColor"
                                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                ></path>
                              </svg>
                              Posting
                            </span>
                          ) : (
                            "Post"
                          )}
                        </button>
                      </div>
                    </div>

                    {commentError && (
                      <motion.p
                        className="text-red-400 text-xs mt-1"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.3 }}
                      >
                        {commentError}
                      </motion.p>
                    )}
                  </div>
                </motion.div>
              )}
            </>
          )}
        </motion.div>
      )}
      {showDeleteCommentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
          <div className="bg-minecraft-navy-dark rounded-md p-5 max-w-md w-full border border-minecraft-habbo-blue shadow-lg">
            <h3 className="text-lg font-minecraft text-minecraft-habbo-blue mb-3">
              Delete Comment?
            </h3>
            <p className="text-gray-300 mb-4">
              Are you sure you want to delete this comment? This action cannot
              be undone.
            </p>
            <div className="mt-5 flex justify-end gap-3">
              <button
                onClick={cancelDeleteComment}
                className="px-4 py-2 rounded bg-gray-700 text-gray-200 hover:bg-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteComment}
                className="habbo-btn px-4 py-2"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Stat Card component - Moved here before Profile component
const StatCard = ({ icon, label, value }) => (
  <div className="bg-minecraft-navy-light p-3 rounded-md text-center">
    <div className="flex items-center justify-center mb-2">{icon}</div>
    <p className="text-xs text-gray-400 mb-1">{label}</p>
    <p className="text-lg font-bold">{value}</p>
  </div>
);

// Main Profile Component
const Profile = () => {
  // Router hooks
  const { username } = useParams();
  const navigate = useNavigate();

  // Context hooks
  const { user } = useAuth();
  const socialContext = useSocial() || {};

  // Get context with fallbacks
  const {
    getRelationship = async () => ({ status: "not_friends", following: false }),
    friendRequests = [],
    sendFriendRequest,
    acceptFriendRequest,
    rejectFriendRequest,
    followUser,
    unfollowUser,
  } = socialContext;

  // Custom hooks
  const socialStats = useSocialStats(username);

  // State hooks
  const [profileUser, setProfileUser] = useState(null);
  const [playerStats, setPlayerStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState({
    show: false,
    type: "",
    message: "",
  });
  const [selectedTab, setSelectedTab] = useState("wall");
  const [coverImage, setCoverImage] = useState(null);
  const [isOwnProfile, setIsOwnProfile] = useState(false);
  const [wallPosts, setWallPosts] = useState([]);
  const [wallLoading, setWallLoading] = useState(true);
  const [wallError, setWallError] = useState(null);
  const [wallPage, setWallPage] = useState(1);
  const [wallTotalPages, setWallTotalPages] = useState(1);
  const [newWallPost, setNewWallPost] = useState("");
  const [friends, setFriends] = useState([]);
  const [viewMode, setViewMode] = useState("avatar");
  const [relationship, setRelationship] = useState(null);
  const [showCelebration, setShowCelebration] = useState(false);
  const [mcUsername, setMcUsername] = useState("");
  const [notFound, setNotFound] = useState(false);
  const [wallpaperId, setWallpaperId] = useState(null);
  const [savingWallpaper, setSavingWallpaper] = useState(false);
  const [wallpaperLoaded, setWallpaperLoaded] = useState(false);
  const [availableWallpapers, setAvailableWallpapers] = useState([]);
  const [showWallpaperModal, setShowWallpaperModal] = useState(false);
  const [pendingWallpaperId, setPendingWallpaperId] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [postToDelete, setPostToDelete] = useState(null);
  const [commentInputs, setCommentInputs] = useState({}); // { [postId]: "" }
  const [commentLoading, setCommentLoading] = useState({}); // { [postId]: false }
  const [commentError, setCommentError] = useState({}); // { [postId]: "" }
  const [expandedComments, setExpandedComments] = useState({});
  const [wallPostsRefreshKey, setWallPostsRefreshKey] = useState(0);
  const { addEventListener, isConnected } = useEventSource();
  // --- Moved up to fix React Hook order ---
  const [showManagePostsModal, setShowManagePostsModal] = useState(false);
  const [bulkDeleteLoading, setBulkDeleteLoading] = useState(false);
  const [bulkDeleteError, setBulkDeleteError] = useState("");

  // Social modals state
  const [showFollowersModal, setShowFollowersModal] = useState(false);
  const [showFollowingModal, setShowFollowingModal] = useState(false);
  const [showFriendsModal, setShowFriendsModal] = useState(false);
  const [followersData, setFollowersData] = useState([]);
  const [followingData, setFollowingData] = useState([]);
  const [friendsData, setFriendsData] = useState([]);
  const [socialModalLoading, setSocialModalLoading] = useState(false);

  // Repost and view tracking state
  const [repostStatuses, setRepostStatuses] = useState({}); // { [postId]: { hasReposted, repostCount, reposts } }
  const [repostLoading, setRepostLoading] = useState({}); // { [postId]: boolean }
  const [viewCounts, setViewCounts] = useState({}); // { [postId]: number }

  // Verification alert state
  const [verificationAlertDismissed, setVerificationAlertDismissed] =
    useState(false);

  const profileUserRef = useRef();
  const userRef = useRef();

  // Check if profile should be displayed - Setting this at the top level
  const shouldDisplayProfile = username || user?.username;

  // ALL useEffect hooks moved here, before any conditional returns

  // Check verification alert dismissal status
  useEffect(() => {
    const dismissalTime = localStorage.getItem("verification_alert_dismissed");
    if (dismissalTime) {
      const dismissalTimestamp = parseInt(dismissalTime, 10);
      const currentTime = Date.now();
      // If less than 24 hours have passed, keep it dismissed
      if (currentTime < dismissalTimestamp) {
        setVerificationAlertDismissed(true);
      } else {
        // Remove expired dismissal
        localStorage.removeItem("verification_alert_dismissed");
        setVerificationAlertDismissed(false);
      }
    }
  }, []);

  // Check which wallpapers are available
  useEffect(() => {
    // Skip if not showing profile
    if (!shouldDisplayProfile) return;

    const checkWallpaperAvailability = async () => {
      // First detect which local wallpapers actually exist
      const localWallpapers = WALLPAPERS.filter((wp) => wp.custom);
      const availableLocalWallpapers = [];

      // Reset available wallpapers array to start fresh
      setAvailableWallpapers([]);

      // Check each local wallpaper and add it if it exists
      for (const wallpaper of localWallpapers) {
        const img = new Image();
        const src = getWallpaperUrl(wallpaper.id, "Steve");
        console.log(`Checking wallpaper: ${wallpaper.id} at ${src}`);
        img.onload = () => {
          console.log(`Wallpaper ${wallpaper.id} loaded successfully`);
          setAvailableWallpapers((prev) => {
            if (!prev.some((wp) => wp.id === wallpaper.id)) {
              return [...prev, wallpaper];
            }
            return prev;
          });
        };
        img.onerror = () => {
          console.warn(`Wallpaper ${wallpaper.id} failed to load`);
        };
        img.src = src;
      }

      // In parallel, check external wallpapers
      const checkExternalWallpapers = async () => {
        const externalWallpapers = WALLPAPERS.filter((wp) => !wp.custom);
        if (externalWallpapers.length === 0) return;

        try {
          const testUrl = getWallpaperUrl(externalWallpapers[0].id, "Steve");
          const response = await fetch(testUrl, {
            method: "HEAD",
            timeout: 3000,
          });

          if (response.ok) {
            // Add external wallpapers to the available list
            setAvailableWallpapers((prev) => [...prev, ...externalWallpapers]);
          }
        } catch (error) {
          console.warn("External wallpapers not available:", error);
        }
      };

      // Start checking external wallpapers without awaiting
      checkExternalWallpapers();
    };

    checkWallpaperAvailability();
  }, [shouldDisplayProfile]);

  // Fetch profile data
  useEffect(() => {
    // Skip if not showing profile
    if (!shouldDisplayProfile) return;

    let isMounted = true;
    let controller = new AbortController(); // For cleanup of fetch requests
    const signal = controller.signal;

    // Define fetchProfileData function first before using it
    const fetchProfileData = async () => {
      if (!isMounted) return;
      try {
        setLoading(true);
        setNotFound(false);
        // Check if viewing own profile
        const isOwn =
          user && (user.username === username || (!username && user));
        setIsOwnProfile(isOwn);
        // Use currently logged in user for "me" profile
        const targetUsername = username || (user ? user.username : null);
        if (!targetUsername) {
          if (isMounted) {
            setNotFound(true);
            setLoading(false);
          }
          return;
        }
        setCoverImage(getDefaultCover(targetUsername));
        // Try to fetch user by website username first
        let websiteUser = null;
        try {
          const userRes = await API.get(
            `/api/user/by-username/${targetUsername}`,
          );
          websiteUser =
            userRes.data && userRes.data.user ? userRes.data.user : null;
        } catch (e) {
          websiteUser = null;
        }
        let mcUsernameToUse = targetUsername;
        if (websiteUser && websiteUser.minecraftUsername) {
          mcUsernameToUse = websiteUser.minecraftUsername;
        }
        // Now fetch player stats using the correct Minecraft username
        let completeStats = {
          playtime: "0h",
          lastSeen: "Never",
          balance: 0,
          blocksMined: 0,
          mobsKilled: 0,
          deaths: 0,
          joinDate: websiteUser ? formatDate(websiteUser.createdAt) : "N/A",
          achievements: 0,
          level: 1,
          experience: 0,
          rank: "Member",
          group: "default",
          groups: ["default"],
          world: "world",
          gamemode: "SURVIVAL",
          online: false,
        };

        try {
          // Add a debounce flag to prevent overlapping calls
          if (window.__FETCHING_PLAYER_STATS) {
            console.log("Skipping player stats fetch - already in progress");
            // Wait for the previous fetch to complete
            await new Promise((resolve) => setTimeout(resolve, 1000));
            if (!isMounted) return;
          }

          window.__FETCHING_PLAYER_STATS = true;
          const playerStatsRes =
            await MinecraftService.getPlayerStats(mcUsernameToUse);
          window.__FETCHING_PLAYER_STATS = false;

          console.log("Player Stats API Response:", playerStatsRes.data);
          // Merge API data, prioritizing API values
          completeStats = {
            ...completeStats,
            ...playerStatsRes.data.data, // Access the nested 'data' object
            // Ensure specific fields are handled correctly after merge if needed
            // Example: playtime might need specific formatting
          };
          console.log("Using completeStats:", completeStats);
          if (isMounted) {
            setPlayerStats(completeStats);
          }
        } catch (playerStatsError) {
          window.__FETCHING_PLAYER_STATS = false;
          console.error("Failed to fetch player stats:", playerStatsError);
          // Use fallback stats if API fails
          if (isMounted) {
            setPlayerStats({
              playtime: "0h",
              lastSeen: "Never",
              balance: 0,
              blocksMined: 0,
              mobsKilled: 0,
              deaths: 0,
              joinDate: websiteUser ? formatDate(websiteUser.createdAt) : "N/A",
              achievements: 0,
              level: 1,
              experience: 0,
              rank: "Member",
              group: "default",
            });
          }
        }
        setCoverImage(getDefaultCover(targetUsername));
        // Set profile user data
        let userProfileData;
        if (isOwn && user) {
          userProfileData = user;
          setProfileUser(user);
        } else if (websiteUser) {
          userProfileData = websiteUser;
          setProfileUser(websiteUser);
        } else {
          userProfileData = {
            username: mcUsernameToUse,
            mcUsername: mcUsernameToUse,
            createdAt: completeStats.joinDate,
            role: completeStats.rank || "Member",
            titles: completeStats.titles || [],
            activeTitle: completeStats.activeTitle,
            _id:
              completeStats.userId ||
              "user-" + Math.random().toString(36).substr(2, 9),
          };
          setProfileUser(userProfileData);
        }
        // Prevent excessive API calls for relationship status
        let relationshipData = { status: "not_friends", following: false };

        if (!isOwn && isMounted) {
          try {
            // Only fetch relationship data if we're viewing someone else's profile and component is still mounted
            // Remove all special-case logic for n0t_awake and bizzy
            const userAccountName = userProfileData.username;
            const userMinecraftName = userProfileData.mcUsername;
            console.log(
              `Getting relationship for user ${userAccountName} (MC: ${userMinecraftName})`,
            );
            try {
              // Always fetch from API
              const relationshipResponse = await getRelationship(
                userAccountName,
                userMinecraftName,
              );
              console.log("API relationship response:", relationshipResponse);
              if (relationshipResponse) {
                relationshipData = {
                  status: relationshipResponse.status || "not_friends",
                  following: relationshipResponse.following || false,
                  followsYou: relationshipResponse.followsYou || false,
                };
              }
            } catch (err) {
              console.warn("Error fetching relationship, using default");
            }
            if (isMounted) {
              setRelationship(relationshipData);
            }
          } catch (relationshipError) {
            console.error(
              "Error fetching relationship status:",
              relationshipError,
            );
            if (isMounted) {
              setRelationship({ status: "not_friends", following: false });
            }
          }
        }

        // Fetch or generate friend data
        let friendsList = [];
        try {
          // Remove all special-case logic for n0t_awake and bizzy. Always use real data from the API or generic fallback.
          friendsList = await fetchFriends(targetUsername);
          if (isMounted) {
            setFriends(friendsList);
          }
        } catch (err) {
          console.warn("Error with friends, using defaults");
          // Use generic fallback but don't re-fetch
        }

        // Generate or fetch wall posts
        let posts = [];
        try {
          // Remove all special-case logic for n0t_awake and bizzy. Always use real data from the API or generic fallback.
          posts = await generateWallPosts(targetUsername, completeStats);
          // Do NOT setWallPosts here; let the wall posts effect handle it
        } catch (err) {
          console.warn("Error with wall posts, using defaults:", err);
          // Do NOT setWallPosts here
        }

        // Cache the full profile data to prevent repeated API calls
        if (isMounted) {
          try {
            // Convert wall posts to a cacheable format
            const cachablePosts = posts.map((post) => {
              let iconType = "UserIcon";
              if (post.icon && post.icon.type && post.icon.type.name) {
                iconType = post.icon.type.name;
              }

              return {
                ...post,
                icon: iconType,
              };
            });

            const cacheData = {
              profileUser: userProfileData,
              playerStats: completeStats,
              relationship: relationshipData,
              friends: friendsList,
              wallPosts: cachablePosts,
            };

            sessionStorage.setItem(profileCacheKey, JSON.stringify(cacheData));
            sessionStorage.setItem(
              `${profileCacheKey}_timestamp`,
              now.toString(),
            );
          } catch (err) {
            console.warn("Failed to cache profile data:", err);
          }

          setLoading(false);
        }
      } catch (error) {
        console.error("Error in profile data fetch:", error);
        if (isMounted) {
          setNotFound(true);
          setLoading(false);
        }
      }
    };

    // Cache mechanism
    const CACHE_DURATION = 30000; // 30 seconds (reduced from 60s)
    const profileCacheKey = `profile_${username || "me"}`;
    const cachedData = sessionStorage.getItem(profileCacheKey);
    const cachedTimestamp = sessionStorage.getItem(
      `${profileCacheKey}_timestamp`,
    );
    const now = Date.now();
    const isCacheValid =
      cachedData &&
      cachedTimestamp &&
      now - parseInt(cachedTimestamp, 10) < CACHE_DURATION;

    // Check if we already have valid cached data
    if (isCacheValid && isMounted) {
      try {
        const parsedData = JSON.parse(cachedData);
        setProfileUser(parsedData.profileUser);
        setPlayerStats(parsedData.playerStats);
        setRelationship(parsedData.relationship);
        setFriends(parsedData.friends);

        // Do NOT set wallPosts from cache - always fetch these fresh
        console.log(
          "[Profile] Loading profile from cache, but fetching wall posts separately",
        );

        setLoading(false);
        // Use cached data but still fetch wall posts immediately
        setTimeout(() => {
          if (isMounted) fetchWallPosts();
        }, 100);

        // Also fetch full profile data in the background after a delay
        setTimeout(() => {
          if (isMounted) fetchProfileData();
        }, 5000);
        return;
      } catch (e) {
        console.warn("[Profile] Error parsing cached profile data:", e);
        // Continue to fetch if cache parsing fails
      }
    }

    // Only fetch if component is mounted
    if (isMounted) {
      fetchProfileData();
    }

    return () => {
      isMounted = false;
      controller.abort();
      // Clean up debounce flag
      window.__FETCHING_PLAYER_STATS = false;
    };
    // We need to include the shouldDisplayProfile, username, and user deps
    // but exclude getRelationship as it can change between renders and cause issues
  }, [user, username, shouldDisplayProfile]);

  useEffect(() => {
    profileUserRef.current = profileUser;
    userRef.current = user;
  }, [profileUser, user]);

  // Listen for minecraft_linked events to refresh the profile
  useEffect(() => {
    // Skip if not showing profile
    if (!shouldDisplayProfile) return;

    const handleMinecraftLinked = (event) => {
      console.log("🎮 Minecraft account linked event received:", event.detail);
      // Show celebration notification
      setNotification({
        show: true,
        type: "success",
        message: `Your Minecraft account (${event.detail.mcUsername}) has been successfully linked!`,
      });
      // Enable celebration animation
      setShowCelebration(true);
      setMcUsername(event.detail.mcUsername);
      // Force the celebration to show with a slight delay to ensure DOM is ready
      setTimeout(() => {
        console.log("Showing celebration modal...");
        // Make sure the modal is visible in the DOM
        const modal = document.querySelector(".celebration-container");
        if (modal) {
          console.log("Modal found in DOM, ensuring visibility");
          modal.style.display = "block";
          modal.style.opacity = "1";
          modal.style.zIndex = "9999";
        } else {
          console.log("Modal not found in DOM");
        }
        // Play a sound effect
        try {
          const audio = new Audio("/sounds/level-up.mp3");
          audio.volume = 0.5;
          audio
            .play()
            .catch((e) =>
              console.log("Audio play prevented by browser policy", e),
            );
        } catch (e) {
          console.log("Audio not supported", e);
        }
      }, 500);
      // Refresh profile data
      if (user && (user.username === username || !username)) {
        // Use direct state updates instead
        setPlayerStats((prevStats) => ({
          ...prevStats,
          mcUsername: event.detail.mcUsername,
          linked: true,
          balance: prevStats?.balance || 500,
          playtime: prevStats?.playtime || "10h",
          achievements: prevStats?.achievements || 42,
        }));
        setProfileUser((prevUser) => ({
          ...prevUser,
          mcUsername: event.detail.mcUsername,
          minecraft: {
            ...prevUser?.minecraft,
            linked: true,
            mcUsername: event.detail.mcUsername,
          },
        }));
      }
      // Hide celebration after 5 seconds
      setTimeout(() => {
        setShowCelebration(false);
      }, 8000);
    };
    // Add event listener
    window.addEventListener("minecraft_linked", handleMinecraftLinked);
    // Cleanup
    return () => {
      window.removeEventListener("minecraft_linked", handleMinecraftLinked);
    };
  }, [user, username, shouldDisplayProfile]);

  // On profileUser or wallpaperId change, update cover image
  useEffect(() => {
    // Skip if not showing profile or if profileUser not loaded
    if (!shouldDisplayProfile || !profileUser) return;

    if (profileUser && (profileUser.wallpaperId || wallpaperId)) {
      const id = profileUser.wallpaperId || wallpaperId || WALLPAPERS[0].id;
      const uname = profileUser.mcUsername || profileUser.username || "Steve";
      setWallpaperId(id);
      setCoverImage(getWallpaperUrl(id, uname));
    } else if (profileUser) {
      setWallpaperId(null);
      setCoverImage(
        getWallpaperUrl(
          WALLPAPERS[0].id,
          profileUser.mcUsername || profileUser.username || "Steve",
        ),
      );
    }
  }, [profileUser, wallpaperId, shouldDisplayProfile]);

  // Preload wallpaper image when coverImage changes
  useEffect(() => {
    // Skip if not showing profile or no cover image
    if (!shouldDisplayProfile || !coverImage) return;

    setWallpaperLoaded(false);
    const img = new window.Image();
    img.src = coverImage;
    img.onload = () => setWallpaperLoaded(true);
  }, [coverImage, shouldDisplayProfile]);

  // Refactored wall post fetching (no fallback unless API fails and no posts)
  const fetchWallPosts = useCallback(async () => {
    console.log("[DEBUG] fetchWallPosts called");
    if (!username) return;
    setWallLoading(true);
    setWallError(null);
    try {
      console.log(
        "[Profile] Fetching wall posts for",
        username,
        "page",
        wallPage,
      );
      // Always fetch fresh data from the API
      const res = await WallService.getWallPosts(username, wallPage, 10);
      console.log("[Profile] Wall posts API response:", res);

      let postsToSet = [];

      if (res && Array.isArray(res.posts) && res.posts.length > 0) {
        // Ensure each post has required properties before setting state
        postsToSet = res.posts.map((post) => ({
          ...post,
          // Ensure post has author information
          author: post.author || {
            username: username,
            mcUsername: username,
            _id: post.author_id || `user-${Date.now()}`,
          },
          // Defensive patch: ensure every comment has a valid author object
          comments: (post.comments || []).map((comment) => ({
            ...comment,
            author:
              comment.author && comment.author.username
                ? comment.author
                : {
                    username: "Unknown User",
                    mcUsername: "Steve",
                  },
          })),
        }));

        console.log("[Profile] Processed", postsToSet.length, "wall posts");
      } else {
        console.warn(
          "[Profile] No posts found in API response, using fallback",
        );
        postsToSet = [
          {
            _id: `fallback-${Date.now()}`,
            content:
              "Welcome to your wall! Start posting to see your content here.",
            author: {
              username: username,
              mcUsername: username,
            },
            createdAt: new Date().toISOString(),
            likes: [],
            comments: [],
          },
        ];
      }

      // Force clear any cached wall posts before setting state
      try {
        sessionStorage.removeItem(`wall_posts_${username}`);
        sessionStorage.removeItem(`profile_${username}`);
      } catch (e) {
        console.warn("[Profile] Failed to clear cached wall posts:", e);
      }

      // Set state all at once after processing
      console.log(
        "[Profile] Setting wall posts state with",
        postsToSet.length,
        "posts",
      );
      setWallPosts(postsToSet);
      setWallTotalPages(res?.pagination?.totalPages || 1);
    } catch (err) {
      console.error("[Profile] Error fetching wall posts:", err);
      setWallError(err.message || "Failed to load wall posts");

      // Use fallback on error
      const fallbackPost = {
        _id: `fallback-${Date.now()}`,
        content:
          "Welcome to your wall! Start posting to see your content here.",
        author: {
          username: username,
          mcUsername: username,
        },
        createdAt: new Date().toISOString(),
        likes: [],
        comments: [],
      };

      setWallPosts([fallbackPost]);
      setWallTotalPages(1);
    } finally {
      setWallLoading(false);
    }
  }, [username, wallPage]);

  // Function to refresh wall posts
  const refreshWallPosts = async () => {
    console.log("[DEBUG] refreshWallPosts called");
    if (!username) return;

    // Always reset to page 1 before fetching
    setWallPage(1);

    try {
      setWallLoading(true);

      // Save current expanded comment sections before refresh
      const currentExpandedComments = { ...expandedComments };

      // Clear any cached wall posts data
      try {
        const cacheKey = `wall_posts_${username}`;
        sessionStorage.removeItem(cacheKey);
        console.log("[Profile] Cleared wall posts cache for", username);
      } catch (e) {
        console.warn("[Profile] Failed to clear wall posts cache:", e);
      }

      console.log("[Profile] Refreshing wall posts for", username);
      const res = await WallService.getWallPosts(username, 1, 10);
      console.log("[Profile][SSE] Wall posts refresh response:", res);

      let postsToSet = [];

      if (res && Array.isArray(res.posts) && res.posts.length > 0) {
        // Ensure each post has required properties before setting state
        postsToSet = res.posts.map((post) => ({
          ...post,
          // Ensure post has author information
          author: post.author || {
            username: post.author_username || username,
            mcUsername: post.author_mcUsername || username,
            _id: post.author_id || `user-${Date.now()}`,
          },
          // Ensure likes array exists
          likes: post.likes || [],
          // Ensure comments array exists
          comments: post.comments || [],
        }));

        console.log(
          "[Profile] Processed posts for state update:",
          postsToSet.length,
        );
      } else {
        // Fallback post
        postsToSet = [
          {
            _id: `fallback-${Date.now()}`,
            content:
              "Welcome to your wall! Start posting to see your content here.",
            author: {
              username: username,
              mcUsername: username,
            },
            createdAt: new Date().toISOString(),
            likes: [],
            comments: [],
          },
        ];
        console.log("[Profile] Using fallback post for empty response");
      }

      // Do a direct update with the prepared array
      setWallPosts(postsToSet);
      setWallPage(1);
      setWallTotalPages(res?.pagination?.totalPages || 1);

      // Restore expanded comments state for posts that still exist
      const newExpandedCommentsState = { ...currentExpandedComments };
      postsToSet.forEach((post) => {
        // If the post had comments expanded before, keep it expanded
        if (post._id && currentExpandedComments[post._id]) {
          newExpandedCommentsState[post._id] = true;
        }

        // Auto-expand any posts with new activity (new comments since last refresh)
        if (
          post.comments &&
          post.comments.length > 0 &&
          post.comments[0].createdAt
        ) {
          const latestCommentTime = new Date(
            post.comments[0].createdAt,
          ).getTime();
          const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;

          // If the latest comment is less than 5 minutes old, auto-expand
          if (latestCommentTime > fiveMinutesAgo) {
            newExpandedCommentsState[post._id] = true;
          }
        }
      });

      setExpandedComments(newExpandedCommentsState);
    } catch (err) {
      console.error("[Profile] Failed to refresh wall posts:", err);
      // Use fallback on error
      setWallPosts([
        {
          _id: `fallback-${Date.now()}`,
          content:
            "Welcome to your wall! Start posting to see your content here.",
          author: {
            username: username,
            mcUsername: username,
          },
          createdAt: new Date().toISOString(),
          likes: [],
          comments: [],
        },
      ]);
      setWallTotalPages(1);
    } finally {
      setWallLoading(false);
    }
  };

  // Fetch wall posts for the profile user
  useEffect(() => {
    if (!isConnected || !user || !username) return;
    fetchWallPosts();
  }, [isConnected, user, username, fetchWallPosts]);

  // Fetch repost statuses and track views when wall posts change
  useEffect(() => {
    if (wallPosts.length > 0) {
      // Fetch repost statuses for all posts
      fetchRepostStatuses(wallPosts);

      // Track views for all posts (with a small delay to avoid overwhelming the server)
      wallPosts.forEach((post, index) => {
        if (post._id) {
          setTimeout(() => {
            // Track view for the post itself
            trackPostView(post._id);
            // If it's a repost, also track view for the original post
            if (post.isRepost && post.originalPost?._id) {
              trackPostView(post.originalPost._id);
            }
          }, index * 100); // Stagger the requests
        }
      });
    }
  }, [wallPosts, user]);

  // Friend request handlers
  const handleSendFriendRequest = async (username) => {
    try {
      await sendFriendRequest(username);
      setNotification({
        show: true,
        type: "success",
        message: "Friend request sent!",
      });
      socialStats.refetch();
      invalidateRelationshipCache(username);
    } catch (error) {
      setNotification({
        show: true,
        type: "error",
        message: "Failed to send friend request",
      });
    } finally {
      if (profileUser?.username) {
        const updated = await getRelationship(
          profileUser.username,
          profileUser.mcUsername,
        );
        setRelationship(updated);
      }
    }
  };

  const handleAcceptFriendRequest = async (username) => {
    try {
      await acceptFriendRequest(username);
      setNotification({
        show: true,
        type: "success",
        message: "Friend request accepted!",
      });
      socialStats.refetch();
      invalidateRelationshipCache(username);
    } catch (error) {
      setNotification({
        show: true,
        type: "error",
        message: "Failed to accept friend request",
      });
    } finally {
      if (profileUser?.username) {
        const updated = await getRelationship(
          profileUser.username,
          profileUser.mcUsername,
        );
        setRelationship(updated);
      }
    }
  };

  const handleRejectFriendRequest = async (username) => {
    try {
      await rejectFriendRequest(username);
      setNotification({
        show: true,
        type: "success",
        message: "Friend request declined",
      });
      socialStats.refetch();
      invalidateRelationshipCache(username);
    } catch (error) {
      setNotification({
        show: true,
        type: "error",
        message: "Failed to decline friend request",
      });
    } finally {
      if (profileUser?.username) {
        const updated = await getRelationship(
          profileUser.username,
          profileUser.mcUsername,
        );
        setRelationship(updated);
      }
    }
  };

  // Follow handlers
  const handleFollowUser = async (username) => {
    try {
      await followUser(username);
      setRelationship((prev) => ({ ...prev, following: true }));
      setNotification({
        show: true,
        type: "success",
        message: `Now following ${profileUser?.username}`,
      });
      socialStats.refetch();
      invalidateRelationshipCache(username);
    } catch (error) {
      console.error(
        "[Profile] Failed to follow user:",
        error,
        error?.response?.data,
        { username },
      );
      setNotification({
        show: true,
        type: "error",
        message: "Failed to follow user",
      });
      console.debug("[Profile] Toast error: Failed to follow user", {
        error,
        username,
      });
    } finally {
      if (profileUser?.username) {
        const updated = await getRelationship(
          profileUser.username,
          profileUser.mcUsername,
        );
        setRelationship(updated);
      }
    }
  };

  const handleUnfollowUser = async (username) => {
    try {
      await unfollowUser(username);
      setRelationship((prev) => ({ ...prev, following: false }));
      setNotification({
        show: true,
        type: "success",
        message: `Unfollowed ${profileUser?.username}`,
      });
      socialStats.refetch();
      invalidateRelationshipCache(username);
    } catch (error) {
      console.error(
        "[Profile] Failed to unfollow user:",
        error,
        error?.response?.data,
        { username },
      );
      setNotification({
        show: true,
        type: "error",
        message: "Failed to unfollow user",
      });
      console.debug("[Profile] Toast error: Failed to unfollow user", {
        error,
        username,
      });
    } finally {
      if (profileUser?.username) {
        const updated = await getRelationship(
          profileUser.username,
          profileUser.mcUsername,
        );
        setRelationship(updated);
      }
    }
  };

  // Predefined cover banner options
  const coverOptions = [];

  // Fetch real friends with memoization to prevent re-renders
  const fetchFriends = async (username) => {
    // Use session storage cache to prevent repeated API calls
    const cacheKey = `friends_${username}`;
    const cachedFriends = sessionStorage.getItem(cacheKey);

    if (cachedFriends) {
      try {
        return JSON.parse(cachedFriends);
      } catch (e) {
        // Invalid cache, continue to fetch
        console.warn("Error parsing cached friends data:", e);
      }
    }

    try {
      // Try to get real friends data first
      const response = await SocialService.getFriends();
      if (response && response.data && Array.isArray(response.data.friends)) {
        // Cache the response
        try {
          sessionStorage.setItem(
            cacheKey,
            JSON.stringify(response.data.friends),
          );
        } catch (e) {
          // Failed to cache, but we can still use the data
          console.warn("Failed to cache friends data:", e);
        }
        return response.data.friends;
      }

      // If the response doesn't have the expected structure, throw an error
      throw new Error("Invalid friends data structure");
    } catch (error) {
      console.warn("Error fetching friends, using fallback:", error.message);

      // Fallback with reasonable data if API fails
      const fallbackFriends = [
        {
          _id: "f1",
          username: "DiamondDigger",
          status: "Mining diamonds",
          online: true,
        },
        {
          _id: "f2",
          username: "CreeperSlayer",
          status: "Fighting mobs",
          online: true,
        },
        {
          _id: "f3",
          username: "RedstoneWizard",
          status: "Building circuits",
          online: false,
        },
        {
          _id: "f4",
          username: "MinerSteve",
          status: "Last seen 2 hours ago",
          online: false,
        },
      ];

      // Cache the fallback data to prevent repeated API calls
      try {
        sessionStorage.setItem(cacheKey, JSON.stringify(fallbackFriends));
      } catch (e) {
        // Failed to cache, but we can still use the data
        console.warn("Failed to cache fallback friends data:", e);
      }

      return fallbackFriends;
    }
  };

  // Generate wall posts with memoization to prevent re-renders
  const generateWallPosts = async (username, stats) => {
    // Use session storage cache to prevent repeated API calls
    const cacheKey = `wall_posts_${username}`;
    const cachedPosts = sessionStorage.getItem(cacheKey);

    if (cachedPosts) {
      try {
        // When loading from cache, we need to convert any stored icon objects back to React elements
        const parsedPosts = JSON.parse(cachedPosts);
        return parsedPosts.map((post) => ({
          ...post,
          // Recreate the icon element if it was stringified
          icon:
            typeof post.icon === "object" ? (
              <UserIcon className="h-5 w-5 text-white" />
            ) : (
              post.icon
            ),
          // Ensure post has a valid author
          author: post.author || {
            username: username,
            mcUsername: username,
          },
        }));
      } catch (e) {
        console.warn("Error parsing cached wall posts:", e);
      }
    }

    try {
      // Try to get real wall posts first
      const response = await SocialService.getWallPosts(username);
      if (response && response.posts && Array.isArray(response.posts)) {
        // Cache the response
        try {
          sessionStorage.setItem(cacheKey, JSON.stringify(response.posts));
        } catch (e) {
          console.warn("Failed to cache wall posts:", e);
        }
        return response.posts;
      }

      // If the response doesn't have the expected structure, throw an error
      throw new Error("Invalid wall posts data structure");
    } catch (error) {
      console.warn("Error fetching wall posts, using fallback:", error.message);

      // Fallback with reasonable wall post data if API fails
      const fallbackPosts = [
        {
          _id: "post1",
          content: `Welcome to ${username}'s profile! This is a sample wall post. 🎮`,
          author: { username: "System", mcUsername: "Server" },
          createdAt: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
          likes: [],
          comments: [],
        },
        {
          _id: "post2",
          content: "Great to see you in the server! Keep up the good work!",
          author: { username: "ModerationTeam", mcUsername: "Staff" },
          createdAt: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
          likes: [],
          comments: [],
        },
      ];

      // Cache fallback data to prevent repeated API calls
      try {
        sessionStorage.setItem(cacheKey, JSON.stringify(fallbackPosts));
      } catch (e) {
        console.warn("Failed to cache fallback wall posts:", e);
      }

      return fallbackPosts;
    }
  };

  // View tracking function - track post views
  async function trackPostView(postId) {
    if (!postId) return;

    try {
      const response = await SocialService.trackWallPostView(postId, user?._id);
      if (response.success && response.viewCount) {
        setViewCounts((prev) => ({
          ...prev,
          [postId]: response.viewCount,
        }));
      }
    } catch (error) {
      // Silently fail for view tracking
      console.warn("Failed to track view:", error);
    }
  }

  // Fetch repost status for posts
  async function fetchRepostStatuses(posts) {
    if (!user || !posts.length) return;

    // Get all unique post IDs, including original posts from reposts
    const postIdsToCheck = new Set();
    posts.forEach((post) => {
      if (post.isRepost && post.originalPost?._id) {
        postIdsToCheck.add(post.originalPost._id);
      } else if (post._id) {
        postIdsToCheck.add(post._id);
      }
    });

    const statusPromises = Array.from(postIdsToCheck).map(async (postId) => {
      try {
        const response = await SocialService.getRepostStatus(postId);
        return {
          postId: postId,
          status: {
            hasReposted: response.hasReposted || false,
            repostCount: response.repostCount || 0,
            reposts: response.reposts || [],
          },
        };
      } catch (error) {
        console.warn(
          `Failed to fetch repost status for post ${postId}:`,
          error,
        );
        // Find the post to get fallback data
        const post = posts.find(
          (p) =>
            p._id === postId || (p.isRepost && p.originalPost?._id === postId),
        );
        return {
          postId: postId,
          status: {
            hasReposted: false,
            repostCount:
              post?.repostCount ||
              (post?.isRepost ? post.originalPost?.repostCount : 0) ||
              0,
            reposts:
              post?.reposts ||
              (post?.isRepost ? post.originalPost?.reposts : []) ||
              [],
          },
        };
      }
    });

    const results = await Promise.all(statusPromises);
    const statusMap = {};

    results.forEach((result) => {
      if (result) {
        statusMap[result.postId] = result.status;
      }
    });

    setRepostStatuses(statusMap);
  }

  // Optimistic update for adding a comment
  const handleAddComment = async (postId) => {
    const content = (commentInputs[postId] || "").trim();
    if (!content) return;

    setCommentLoading((prev) => ({ ...prev, [postId]: true }));
    setCommentError((prev) => ({ ...prev, [postId]: "" }));

    // Optimistically add a temporary comment
    const tempCommentId = `temp-${Date.now()}`;
    const optimisticComment = {
      _id: tempCommentId,
      content,
      author: {
        username: user?.username || "You",
        mcUsername:
          user?.mcUsername ||
          user?.minecraftUsername ||
          user?.username ||
          "Steve",
        _id: user?._id || "me",
      },
      createdAt: new Date().toISOString(),
      isOptimistic: true,
    };
    setWallPosts((prevPosts) =>
      prevPosts.map((post) =>
        post._id === postId
          ? { ...post, comments: [...(post.comments || []), optimisticComment] }
          : post,
      ),
    );
    setExpandedComments((prev) => ({ ...prev, [postId]: true }));
    setCommentInputs((prev) => ({ ...prev, [postId]: "" }));

    try {
      const response = await WallService.addComment(postId, content);
      // Remove the optimistic comment and add the real one from the response
      setWallPosts((prevPosts) =>
        prevPosts.map((post) => {
          if (post._id !== postId) return post;
          let comments = (post.comments || []).filter(
            (c) => c._id !== tempCommentId,
          );
          if (response && response.comments) {
            comments = response.comments;
          }
          return { ...post, comments };
        }),
      );
      setNotification({
        show: true,
        type: "success",
        message: "Comment added successfully",
      });
      try {
        const audio = new Audio("/sounds/notification.mp3");
        audio.volume = 0.2;
        audio
          .play()
          .catch((e) =>
            console.log("Audio play prevented by browser policy", e),
          );
      } catch (e) {
        console.log("Audio not supported", e);
      }
    } catch (err) {
      setWallPosts((prevPosts) =>
        prevPosts.map((post) =>
          post._id === postId
            ? {
                ...post,
                comments: (post.comments || []).filter(
                  (c) => c._id !== tempCommentId,
                ),
              }
            : post,
        ),
      );
      setCommentError((prev) => ({
        ...prev,
        [postId]:
          err?.response?.data?.error ||
          "Failed to add comment. Please try again.",
      }));
      setNotification({
        show: true,
        type: "error",
        message: "Failed to add comment",
      });
    } finally {
      setCommentLoading((prev) => ({ ...prev, [postId]: false }));
    }
  };

  // Optimistic update for deleting a comment
  const handleDeleteComment = async (postId, commentId) => {
    let removedComment = null;
    setWallPosts((prevPosts) =>
      prevPosts.map((post) => {
        if (post._id !== postId) return post;
        const comments = post.comments || [];
        removedComment = comments.find((c) => c._id === commentId);
        return {
          ...post,
          comments: comments.filter((c) => c._id !== commentId),
        };
      }),
    );
    setCommentLoading((prev) => ({ ...prev, [postId]: true }));
    setCommentError((prev) => ({ ...prev, [postId]: "" }));

    try {
      await WallService.deleteComment(postId, commentId);
      setNotification({
        show: true,
        type: "success",
        message: "Comment deleted successfully",
      });
    } catch (err) {
      setWallPosts((prevPosts) =>
        prevPosts.map((post) => {
          if (post._id !== postId) return post;
          return {
            ...post,
            comments: [...(post.comments || []), removedComment].sort(
              (a, b) => new Date(a.createdAt) - new Date(b.createdAt),
            ),
          };
        }),
      );
      setCommentError((prev) => ({
        ...prev,
        [postId]:
          err?.response?.data?.error ||
          "Failed to delete comment. Please try again.",
      }));
      setNotification({
        show: true,
        type: "error",
        message: "Failed to delete comment",
      });
    } finally {
      setCommentLoading((prev) => ({ ...prev, [postId]: false }));
    }
  };

  // Optimistic update for creating a wall post
  const handleCreateWallPost = async (content, image) => {
    if (!content?.trim()) return Promise.reject(new Error("Empty content"));
    setWallError(null);
    const tempPostId = `temp-${Date.now()}`;
    const optimisticPost = {
      _id: tempPostId,
      content,
      author: profileUser || user || { username: "You", mcUsername: "Steve" },
      createdAt: new Date().toISOString(),
      likes: [],
      comments: [],
      isOptimistic: true,
    };
    setWallPosts((prev) => {
      const newPosts = [optimisticPost, ...prev];
      console.log(
        "[DEBUG] Optimistic post added. wallPosts now:",
        newPosts.map((p) => p._id),
      );
      return newPosts;
    });
    try {
      const response = await WallService.createWallPost(
        username,
        content,
        image,
      );
      console.log("[DEBUG] WallService.createWallPost response:", response);
      if (response && response.post) {
        setWallPosts((prev) => {
          const newPosts = [
            response.post,
            ...prev.filter((p) => p._id !== tempPostId),
          ];
          console.log(
            "[DEBUG] Backend post added. wallPosts now:",
            newPosts.map((p) => p._id),
          );
          return newPosts;
        });
      } else {
        setWallPosts((prev) => prev);
      }
      if (response && response.post && response.post._id) {
        setExpandedComments((prev) => ({
          ...prev,
          [response.post._id]: true,
        }));
      }
      setNotification({
        show: true,
        type: "success",
        message: "Post created successfully!",
      });
      if (socialStats && socialStats.refetch) socialStats.refetch();
      return Promise.resolve();
    } catch (err) {
      setWallPosts((prev) => prev.filter((p) => p._id !== tempPostId));
      setWallError(err.message || "Failed to create wall post");
      setNotification({
        show: true,
        type: "error",
        message: "Failed to create post. Please try again.",
      });
      return Promise.reject(err);
    }
  };

  // Refactored handleDeleteWallPost: always fetch fresh after
  const handleDeleteWallPost = async (postId) => {
    try {
      console.log("[Profile] Deleting post:", postId);
      await WallService.deleteWallPost(postId);

      // Clear cache and refresh
      try {
        sessionStorage.removeItem(`wall_posts_${username}`);
      } catch (e) {
        console.warn(
          "[Profile] Failed to clear wall posts cache for post deletion:",
          e,
        );
      }

      // Use refreshWallPosts for consistency
      await refreshWallPosts();

      setNotification({
        show: true,
        type: "success",
        message: "Post deleted successfully",
      });
    } catch (err) {
      console.error("[Profile] Error deleting post:", err);
      setWallError(err.message || "Failed to delete wall post");
      setNotification({
        show: true,
        type: "error",
        message: "Failed to delete post",
      });
    }
  };

  // Handler to like a wall post
  const handleLikeWallPost = async (postId) => {
    try {
      await WallService.likeWallPost(postId);
      await fetchWallPostsDirectly(); // Always refetch after like
    } catch (err) {
      setWallError(err.message || "Failed to like wall post");
    }
  };

  // Handler to unlike a wall post
  const handleUnlikeWallPost = async (postId) => {
    try {
      await WallService.unlikeWallPost(postId);
      await fetchWallPostsDirectly(); // Always refetch after unlike
    } catch (err) {
      setWallError(err.message || "Failed to unlike wall post");
    }
  };

  // Add handleDeleteWallPostWithConfirm
  const handleDeleteWallPostWithConfirm = (postId) => {
    setPostToDelete(postId);
    setShowDeleteModal(true);
  };

  const confirmDeleteWallPost = async () => {
    if (postToDelete) {
      await handleDeleteWallPost(postToDelete);
      setPostToDelete(null);
      setShowDeleteModal(false);
    }
  };

  const cancelDeleteWallPost = () => {
    setShowDeleteModal(false);
    setPostToDelete(null);
  };

  // Toggle comment section expansion
  const toggleCommentSection = (postId) => {
    setExpandedComments((prev) => ({
      ...prev,
      [postId]: !prev[postId],
    }));
  };

  // Update comment input handler
  const handleCommentInputChange = (postId, value) => {
    setCommentInputs((prev) => ({
      ...prev,
      [postId]: value,
    }));
  };

  // Add this before the return statement in Profile
  useEffect(() => {
    console.log(
      "[Profile] About to render",
      wallPosts.length,
      "posts, array:",
      JSON.stringify(
        wallPosts.map((p) => ({ id: p._id, author: p.author?.username })),
      ),
    );
  }, [wallPosts]);

  // Unified, smoother wall post animation variants
  const postVariants = {
    hidden: { opacity: 0, y: 30, scale: 0.98 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: { type: "spring", stiffness: 300, damping: 35, mass: 0.9 },
    },
    exit: {
      opacity: 0,
      y: -20,
      scale: 0.95,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 35,
        mass: 0.9,
        duration: 0.35,
        ease: "easeInOut",
      },
    },
  };

  // Smoother, more relaxed stagger for wall posts (applies to both enter and exit)
  const staggerContainer = {
    visible: { transition: { staggerChildren: 0.12 } },
    exit: { transition: { staggerChildren: 0.12 } },
    hidden: {},
  };

  // Render wall posts with a single AnimatePresence and motion.div, layout everywhere, unique keys, and mode='wait'
  const renderedWallPosts = useMemo(
    () => (
      <AnimatePresence mode="wait">
        <motion.div
          initial="hidden"
          animate="visible"
          exit="exit"
          variants={staggerContainer}
          layout
        >
          {wallPosts.map((post, index) => {
            if (!post) return null;
            if (!post.author) {
              post = {
                ...post,
                author: {
                  username: profileUser.username || username,
                  mcUsername: profileUser.mcUsername || username,
                  _id: post.author_id || `user-${Date.now()}`,
                },
              };
            }
            const avatarUsername =
              post.author.mcUsername || post.author.username;
            const postId = post._id || `post-${Date.now()}-${Math.random()}`;
            return (
              <motion.div
                key={postId}
                variants={postVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                layout
                className="bg-white/10 rounded-md p-4 mb-2"
              >
                {/* Repost Indicator */}
                {post.isRepost && (
                  <div className="flex items-center text-sm text-gray-400 mb-3 pb-2 border-b border-white/10">
                    <svg
                      className="h-4 w-4 mr-2"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                      />
                    </svg>
                    <Link
                      to={`/profile/${post.author.username}`}
                      className="hover:text-white"
                    >
                      {post.author.username}
                    </Link>
                    <span className="ml-1">reposted</span>
                    {post.repostMessage && (
                      <span className="ml-2 text-gray-300">
                        "{post.repostMessage}"
                      </span>
                    )}
                  </div>
                )}

                <div className="flex items-start">
                  <Link
                    to={`/profile/${post.isRepost ? post.originalPost?.author?.username : post.author.username}`}
                    className="flex-shrink-0"
                  >
                    <MinecraftAvatar
                      username={
                        post.isRepost
                          ? post.originalPost?.author?.mcUsername ||
                            post.originalPost?.author?.username
                          : avatarUsername
                      }
                      size={40}
                      type="head"
                      className="rounded-md"
                    />
                  </Link>
                  <div className="flex-1 ml-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <Link
                          to={`/profile/${post.isRepost ? post.originalPost?.author?.username : post.author.username}`}
                          className="font-medium hover:text-minecraft-habbo-blue"
                        >
                          {post.isRepost
                            ? post.originalPost?.author?.username
                            : post.author.username}
                        </Link>
                        <span className="text-gray-400 text-sm ml-2">
                          {timeAgo(
                            post.isRepost
                              ? post.originalPost?.createdAt
                              : post.createdAt || Date.now(),
                          )}
                        </span>
                      </div>
                      {(isOwnProfile ||
                        (user &&
                          (post.author.username === user.username ||
                            (post.isRepost &&
                              post.originalPost?.author?.username ===
                                user.username)))) && (
                        <button
                          onClick={() => {
                            if (
                              post.isRepost &&
                              post.author.username === user.username
                            ) {
                              // This is the user's own repost, call unrepost instead of delete
                              handleUnrepost(post.originalPost._id);
                            } else {
                              // This is a regular post or original post, use delete
                              handleDeleteWallPostWithConfirm(post._id);
                            }
                          }}
                          className="text-gray-400 hover:text-red-400"
                          title={
                            post.isRepost &&
                            post.author.username === user.username
                              ? "Remove repost"
                              : "Delete post"
                          }
                        >
                          <svg
                            className="h-5 w-5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                        </button>
                      )}
                    </div>
                    <p className="mt-2 text-gray-200 whitespace-pre-wrap break-all overflow-x-auto">
                      {post.isRepost
                        ? post.originalPost?.content
                        : post.content || ""}
                    </p>
                    {(post.isRepost
                      ? post.originalPost?.image
                      : post.image) && (
                      <div className="mt-3">
                        <img
                          src={
                            post.isRepost ? post.originalPost.image : post.image
                          }
                          alt=""
                          className="rounded-md max-h-96 w-auto"
                        />
                      </div>
                    )}
                    <div className="flex items-center mt-3 text-sm text-gray-400">
                      <button
                        className={`flex items-center hover:text-white mr-4 ${
                          post.likes && user && post.likes.includes(user._id)
                            ? "text-minecraft-habbo-blue"
                            : ""
                        }`}
                        onClick={() => {
                          if (!user || !post._id) return;
                          if (post.likes && post.likes.includes(user._id)) {
                            handleUnlikeWallPost(post._id);
                          } else {
                            handleLikeWallPost(post._id);
                          }
                        }}
                      >
                        <HandThumbUpIcon className="h-4 w-4 mr-1" />
                        {post.likes?.length || 0}{" "}
                        {post.likes?.length === 1 ? "Like" : "Likes"}
                      </button>

                      {/* Repost Button */}
                      {user && post._id && (
                        <button
                          className={`flex items-center hover:text-white mr-4 ${
                            repostStatuses[
                              post.isRepost ? post.originalPost._id : post._id
                            ]?.hasReposted
                              ? "text-green-400"
                              : ""
                          } ${repostLoading[post.isRepost ? post.originalPost._id : post._id] ? "opacity-50 cursor-not-allowed" : ""}`}
                          onClick={() => {
                            const targetPostId = post.isRepost
                              ? post.originalPost._id
                              : post._id;
                            if (repostLoading[targetPostId]) return;
                            if (repostStatuses[targetPostId]?.hasReposted) {
                              handleUnrepost(targetPostId);
                            } else {
                              handleRepost(targetPostId);
                            }
                          }}
                          disabled={
                            repostLoading[
                              post.isRepost ? post.originalPost._id : post._id
                            ]
                          }
                          title={
                            repostStatuses[
                              post.isRepost ? post.originalPost._id : post._id
                            ]?.hasReposted
                              ? "Remove repost"
                              : "Repost to your profile"
                          }
                        >
                          <svg
                            className="h-4 w-4 mr-1"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                            />
                          </svg>
                          {repostStatuses[
                            post.isRepost ? post.originalPost._id : post._id
                          ]?.repostCount ||
                            (post.isRepost
                              ? post.originalPost?.repostCount
                              : post.repostCount) ||
                            0}
                        </button>
                      )}

                      {/* View Count */}
                      {(viewCounts[post._id] || post.viewCount) && (
                        <div className="flex items-center mr-4">
                          <svg
                            className="h-4 w-4 mr-1"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                            />
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                            />
                          </svg>
                          {viewCounts[post._id] || post.viewCount || 0} views
                        </div>
                      )}

                      {post.comments && post.comments.length > 0 && (
                        <div className="relative h-2 w-2 mr-2">
                          <span className="absolute inset-0 inline-flex h-2 w-2 rounded-full bg-minecraft-habbo-blue opacity-75 animate-ping"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-minecraft-habbo-blue"></span>
                        </div>
                      )}
                    </div>
                    <CommentSection
                      post={post}
                      commentInput={commentInputs[postId] || ""}
                      commentLoading={commentLoading[postId] || false}
                      commentError={commentError[postId] || ""}
                      onCommentChange={handleCommentInputChange}
                      onAddComment={handleAddComment}
                      onDeleteComment={handleDeleteComment}
                      currentUser={user}
                      isExpanded={expandedComments[postId] || false}
                      onToggleExpand={() => toggleCommentSection(postId)}
                    />
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </AnimatePresence>
    ),
    [
      wallPosts,
      user,
      isOwnProfile,
      commentInputs,
      commentLoading,
      commentError,
      expandedComments,
      profileUser,
      username,
    ],
  );

  useEffect(() => {
    if (!profileUser) return; // Only set up listener if profileUser is loaded
    const handleNotification = (event) => {
      const notification = event.detail;
      if (
        notification.type === "notification" &&
        (notification.subtype === "FOLLOW" ||
          notification.subtype === "UNFOLLOW")
      ) {
        if (
          notification.sender?.username === profileUser.username ||
          notification.recipient?.username === profileUser.username
        ) {
          getRelationship(profileUser.username, profileUser.mcUsername).then(
            setRelationship,
          );
        }
      }
      // Existing friend request logic
      if (
        notification.type === "friend_request" ||
        notification.type === "friend_accept" ||
        notification.type === "friend_decline"
      ) {
        if (
          notification.sender?.username === profileUser.username ||
          notification.recipient?.username === profileUser.username
        ) {
          getRelationship(profileUser.username, profileUser.mcUsername).then(
            setRelationship,
          );
        }
      }
    };
    window.addEventListener("notification", handleNotification);
    return () => window.removeEventListener("notification", handleNotification);
  }, [profileUser?.username, profileUser?.mcUsername]);

  // Add this function near other fetch functions
  const fetchWallPostsDirectly = async () => {
    try {
      console.log("[DEBUG][fetchWallPostsDirectly] Called for", username);
      // Clear sessionStorage for wall posts before fetching
      try {
        const cacheKey = `wall_posts_${username}`;
        sessionStorage.removeItem(cacheKey);
        console.log("[Profile][SSE] Cleared wall posts cache for", username);
      } catch (e) {
        console.warn("[Profile][SSE] Failed to clear wall posts cache:", e);
      }
      // Add a 300ms delay to ensure backend commit
      await new Promise((resolve) => setTimeout(resolve, 300));
      console.log(
        "[Profile][SSE] Fetching wall posts for",
        username,
        "after SSE event",
      );
      const res = await WallService.getWallPosts(username, 1, 10);
      console.log("[DEBUG][fetchWallPostsDirectly] API response:", res);
      if (res && Array.isArray(res.posts)) {
        // PATCH: Normalize posts and comments just like fetchWallPosts
        const postsToSet = res.posts.map((post) => ({
          ...post,
          author: post.author || {
            username: username,
            mcUsername: username,
            _id: post.author_id || `user-${Date.now()}`,
          },
          comments: (post.comments || []).map((comment) => ({
            ...comment,
            author:
              comment.author && comment.author.username
                ? comment.author
                : {
                    username: "Unknown User",
                    mcUsername: "Steve",
                  },
          })),
        }));
        console.log(
          "[DEBUG][fetchWallPostsDirectly] Setting wall posts:",
          postsToSet,
        );
        setWallPosts(postsToSet);
        setWallPage(1);
        setWallTotalPages(res?.pagination?.totalPages || 1);
      }
    } catch (err) {
      // Optionally handle error
      console.error("[Profile][SSE] Failed to fetch wall posts directly:", err);
    }
  };

  // --- PATCH: Real-time wall_post event handler (top-level) ---
  const handleWallPostEvent = (event) => {
    const currentProfileUser = profileUserRef.current;
    // Debug log all event fields
    console.log("[SSE][WALL_POST][DEBUG] Event received:", event);
    if (!event) return;
    // Check if the event is relevant to the wall currently being viewed
    const viewedUsername =
      currentProfileUser?.username || currentProfileUser?.mcUsername;
    console.log(
      "[SSE][WALL_POST][DEBUG] wallOwnerUsername:",
      event.wallOwnerUsername,
      "viewedUsername:",
      viewedUsername,
    );
    if (event.wallOwnerUsername === viewedUsername) {
      if (event.type === "new_post") {
        setNotification({
          show: true,
          type: "success",
          message: `New wall post received!`,
        });
      }
      if (event.type === "delete_post") {
        setNotification({
          show: true,
          type: "success",
          message: `A wall post was deleted.`,
        });
      }
      fetchWallPostsDirectly(); // Always fetch fresh wall posts after SSE event
    }
  };
  // ... existing code ...
  // In the useEffect for wall_post, remove the inner definition and use the top-level handleWallPostEvent
  useEffect(() => {
    if (!addEventListener) return;
    const removeWallPost = addEventListener("wall_post", handleWallPostEvent);
    const removeNewPost = addEventListener("new_post", handleWallPostEvent);
    const removeDeletePost = addEventListener(
      "delete_post",
      handleWallPostEvent,
    );
    return () => {
      if (removeWallPost) removeWallPost();
      if (removeNewPost) removeNewPost();
      if (removeDeletePost) removeDeletePost();
    };
  }, [addEventListener]);
  // ... existing code ...

  // --- PATCH: Real-time wall_comment event handler (top-level) ---
  const handleWallCommentEvent = (event) => {
    console.log("[DEBUG][SSE] handleWallCommentEvent fired:", event);
    const currentProfileUser = profileUserRef.current;
    const viewedUsername =
      currentProfileUser?.username || currentProfileUser?.mcUsername;
    if (event.wallOwnerUsername === viewedUsername) {
      setNotification({
        show: true,
        type: "success",
        message: "New comment received!",
      });
      fetchWallPostsDirectly();
    }
  };
  // ... existing code ...
  // In the useEffect for wall_comment, remove the inner definition and use the top-level handleWallCommentEvent
  useEffect(() => {
    if (!addEventListener || !isConnected) return;
    addEventListener("wall_comment", handleWallCommentEvent);
    return () => {
      if (addEventListener) addEventListener("wall_comment", null);
    };
  }, [addEventListener, isConnected, fetchWallPostsDirectly]);
  // ... existing code ...

  useEffect(() => {
    if (!addEventListener || !isConnected) return;
    const removeWallLike = addEventListener("wall_like", handleWallLikeEvent);
    return () => {
      if (removeWallLike) removeWallLike();
    };
  }, [addEventListener, isConnected]);

  useEffect(() => {
    if (!addEventListener || !isConnected) return;
    const removeLikeAdded = addEventListener("like_added", handleWallLikeEvent);
    const removeLikeRemoved = addEventListener(
      "like_removed",
      handleWallLikeEvent,
    );
    return () => {
      if (removeLikeAdded) removeLikeAdded();
      if (removeLikeRemoved) removeLikeRemoved();
    };
  }, [addEventListener, isConnected]);

  useEffect(() => {
    if (!addEventListener || !isConnected) return;
    // Listen for delete_post events (real-time post deletion)
    const removeDeletePost = addEventListener(
      "delete_post",
      handleWallPostEvent,
    );
    return () => {
      if (removeDeletePost) removeDeletePost();
    };
  }, [addEventListener, isConnected]);

  // --- PATCH: Real-time wall_like event handler (top-level) ---
  const handleWallLikeEvent = (event) => {
    console.log("[DEBUG][SSE] handleWallLikeEvent fired:", event);
    const currentProfileUser = profileUserRef.current;
    const viewedUsername =
      currentProfileUser?.username || currentProfileUser?.mcUsername;
    if (event.wallOwnerUsername === viewedUsername) {
      setNotification({
        show: true,
        type: "success",
        message: "A post was liked!",
      });
      fetchWallPostsDirectly();
    }
  };

  useEffect(() => {
    if (!addEventListener || !isConnected) return;
    const removeCommentAdded = addEventListener(
      "comment_added",
      handleWallCommentEvent,
    );
    return () => {
      if (removeCommentAdded) removeCommentAdded();
    };
  }, [addEventListener, isConnected]);

  if (!shouldDisplayProfile) {
    return (
      <div className="min-h-screen pt-24 py-20 minecraft-grid-bg bg-habbo-pattern text-center">
        <div className="max-w-2xl mx-auto px-4">
          <h1 className="text-3xl font-minecraft text-minecraft-habbo-blue mb-6">
            Profile Not Found
          </h1>
          <p className="text-gray-300 mb-8">
            Please log in to view your profile or specify a username.
          </p>
          <Link to="/login" className="habbo-btn text-center px-6 py-2">
            Login
          </Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return <LoadingSpinner fullScreen />;
  }

  if (notFound) {
    return (
      <div className="min-h-screen pt-24 py-20 minecraft-grid-bg bg-habbo-pattern text-center">
        <div className="max-w-2xl mx-auto px-4">
          <h1 className="text-3xl font-minecraft text-minecraft-habbo-blue mb-6">
            User Not Found
          </h1>
          <p className="text-gray-300 mb-8">
            The user profile you are looking for does not exist.
          </p>
          <Link to="/" className="habbo-btn text-center px-6 py-2">
            Return Home
          </Link>
        </div>
      </div>
    );
  }

  if (!profileUser) {
    return <LoadingSpinner fullScreen />;
  }

  // Custom skull icon
  const SkullIcon = () => (
    <svg
      className="h-5 w-5 text-gray-400"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
      />
    </svg>
  );

  // Old post method and wallpaper functions that were removed
  // Handle posting to wall
  const handleWallPost = async (e) => {
    e.preventDefault();
    if (!newWallPost.trim()) return;
    await handleCreateWallPost(newWallPost);
  };

  // Toggle between 3D model and regular avatar
  const toggleViewMode = () => {
    console.log(
      "Toggling view mode from",
      viewMode,
      "to",
      viewMode === "3d" ? "avatar" : "3d",
    );
    setViewMode((prevMode) => (prevMode === "3d" ? "avatar" : "3d"));
  };

  // Change cover image
  const handleCoverChange = (imagePath) => {
    setCoverImage(imagePath);

    setNotification({
      show: true,
      type: "success",
      message: "Cover image updated!",
    });
  };

  // Change wallpaper handler
  const handleWallpaperSelect = async (id) => {
    if (savingWallpaper || wallpaperId === id) return;

    // Show confirmation dialog instead of immediately changing
    setPendingWallpaperId(id);
    setShowWallpaperModal(true);
  };

  // Confirm wallpaper change
  const confirmWallpaperChange = async () => {
    const id = pendingWallpaperId;
    setShowWallpaperModal(false);

    if (!id) return;

    setWallpaperId(id);
    const uname = profileUser.mcUsername || profileUser.username || "Steve";
    setCoverImage(getWallpaperUrl(id, uname));
    setSavingWallpaper(true);

    try {
      await API.put("/api/user/profile", { wallpaperId: id });

      // Play sound effect on successful change
      try {
        const audio = new Audio("/sounds/level-up.mp3");
        audio.volume = 0.3; // Lower volume for this sound
        audio
          .play()
          .catch((e) =>
            console.log("Audio play prevented by browser policy", e),
          );
      } catch (e) {
        console.log("Audio not supported", e);
      }

      setNotification({
        show: true,
        type: "success",
        message: "Wallpaper updated!",
      });
    } catch (err) {
      setNotification({
        show: true,
        type: "error",
        message: "Failed to update wallpaper.",
      });
      // Revert to previous
      setWallpaperId(profileUser.wallpaperId || null);
      setCoverImage(
        getWallpaperUrl(profileUser.wallpaperId || WALLPAPERS[0].id, uname),
      );
    } finally {
      setSavingWallpaper(false);
      setPendingWallpaperId(null);
    }
  };

  const invalidateRelationshipCache = (username) => {
    // Remove all possible relationship cache keys for this user
    const keys = Object.keys(sessionStorage).filter((k) =>
      k.startsWith(`relationship_${username}_`),
    );
    keys.forEach((k) => sessionStorage.removeItem(k));
  };

  // Add state for manage posts modal and loading
  const openManagePostsModal = () => {
    setShowManagePostsModal(true);
    setBulkDeleteError("");
  };

  // Handler to close modal
  const closeManagePostsModal = () => {
    setShowManagePostsModal(false);
    setBulkDeleteError("");
  };

  // Handler to delete all posts
  const handleDeleteAllPosts = async () => {
    setBulkDeleteLoading(true);
    setBulkDeleteError("");
    try {
      const allPostIds = wallPosts.map((p) => p._id);
      if (allPostIds.length === 0) {
        setBulkDeleteError("No posts to delete.");
        setBulkDeleteLoading(false);
        return;
      }
      await API.delete(`/api/wall/${username}/bulk-delete`, {
        data: { postIds: allPostIds },
      });
      await refreshWallPosts();
      setShowManagePostsModal(false);
      setBulkDeleteLoading(false);
      setNotification({
        show: true,
        type: "success",
        message: "All posts deleted!",
      });
    } catch (err) {
      setBulkDeleteError(
        err?.response?.data?.error || "Failed to delete posts.",
      );
      setBulkDeleteLoading(false);
    }
  };

  // Social modal handlers
  const fetchFollowersData = async () => {
    setSocialModalLoading(true);
    try {
      const response = await SocialService.getFollowers(profileUser?.username);
      setFollowersData(response?.data?.followers || []);
    } catch (err) {
      console.error("Failed to fetch followers:", err);
      setFollowersData([]);
    } finally {
      setSocialModalLoading(false);
    }
  };

  const fetchFollowingData = async () => {
    setSocialModalLoading(true);
    try {
      const response = await SocialService.getFollowing(profileUser?.username);
      setFollowingData(response?.data?.following || []);
    } catch (err) {
      console.error("Failed to fetch following:", err);
      setFollowingData([]);
    } finally {
      setSocialModalLoading(false);
    }
  };

  const fetchFriendsData = async () => {
    setSocialModalLoading(true);
    try {
      const response = await SocialService.getFriends(profileUser?.username);
      setFriendsData(response?.data?.friends || []);
    } catch (err) {
      console.error("Failed to fetch friends:", err);
      setFriendsData([]);
    } finally {
      setSocialModalLoading(false);
    }
  };

  const handleOpenFollowersModal = () => {
    setShowFollowersModal(true);
    fetchFollowersData();
  };

  const handleOpenFollowingModal = () => {
    setShowFollowingModal(true);
    fetchFollowingData();
  };

  const handleOpenFriendsModal = () => {
    setShowFriendsModal(true);
    fetchFriendsData();
  };

  const closeSocialModals = () => {
    setShowFollowersModal(false);
    setShowFollowingModal(false);
    setShowFriendsModal(false);
    setFollowersData([]);
    setFollowingData([]);
    setFriendsData([]);
  };

  // Repost handlers
  async function handleRepost(postId, message = "") {
    if (!user || !postId) return;

    console.log("[DEBUG] handleRepost called with postId:", postId);

    try {
      setRepostLoading((prev) => ({ ...prev, [postId]: true }));

      const response = await SocialService.repostWallPost(postId, message);
      console.log("[DEBUG] Repost response:", response);

      if (response.success) {
        // Update repost status
        setRepostStatuses((prev) => ({
          ...prev,
          [postId]: {
            hasReposted: true,
            repostCount: (prev[postId]?.repostCount || 0) + 1,
            reposts: [...(prev[postId]?.reposts || []), user._id],
          },
        }));

        // Refresh wall posts to show the new repost
        await refreshWallPosts();

        setNotification({
          show: true,
          type: "success",
          message: "Post reposted!",
        });
      }
    } catch (error) {
      console.error("Failed to repost:", error);
      setWallError(error.message || "Failed to repost");
      setNotification({
        show: true,
        type: "error",
        message: "Failed to repost",
      });
    } finally {
      setRepostLoading((prev) => ({ ...prev, [postId]: false }));
    }
  }

  async function handleUnrepost(postId) {
    if (!user || !postId) return;

    console.log("[DEBUG] handleUnrepost called with postId:", postId);

    try {
      setRepostLoading((prev) => ({ ...prev, [postId]: true }));

      const response = await SocialService.unrepostWallPost(postId);
      console.log("[DEBUG] Unrepost response:", response);

      if (response.success) {
        // Update repost status
        setRepostStatuses((prev) => ({
          ...prev,
          [postId]: {
            hasReposted: false,
            repostCount: Math.max((prev[postId]?.repostCount || 1) - 1, 0),
            reposts: (prev[postId]?.reposts || []).filter(
              (id) => id !== user._id,
            ),
          },
        }));

        // Refresh wall posts to remove the repost
        await refreshWallPosts();

        setNotification({
          show: true,
          type: "success",
          message: "Repost removed!",
        });
      }
    } catch (error) {
      console.error("Failed to unrepost:", error);
      setWallError(error.message || "Failed to unrepost");
      setNotification({
        show: true,
        type: "error",
        message: "Failed to unrepost",
      });
    } finally {
      setRepostLoading((prev) => ({ ...prev, [postId]: false }));
    }
  }

  // Comprehensive advancement mapping based on Minecraft 1.21
  const ADVANCEMENT_DATA = {
    // Minecraft/Story Tab
    "minecraft:story/root": {
      name: "Minecraft",
      description: "The heart and story of the game",
      requirement: "Make a Crafting Table",
      category: "story",
      icon: "📖",
    },
    "minecraft:story/mine_stone": {
      name: "Stone Age",
      description: "Mine stone with your new pickaxe",
      requirement: "Get Cobblestone",
      category: "story",
      icon: "⛏️",
    },
    "minecraft:story/upgrade_tools": {
      name: "Getting an Upgrade",
      description: "Construct a better pickaxe",
      requirement: "Make Stone Pickaxe",
      category: "story",
      icon: "🔧",
    },
    "minecraft:story/smelt_iron": {
      name: "Acquire Hardware",
      description: "Smelt an iron ingot",
      requirement: "Get Iron Ingot",
      category: "story",
      icon: "🔥",
    },
    "minecraft:story/obtain_armor": {
      name: "Suit Up",
      description: "Protect yourself with a piece of iron armor",
      requirement: "Get Iron Armor",
      category: "story",
      icon: "🛡️",
    },
    "minecraft:story/lava_bucket": {
      name: "Hot Stuff",
      description: "Fill a bucket with lava",
      requirement: "Get Lava Bucket",
      category: "story",
      icon: "🪣",
    },
    "minecraft:story/iron_tools": {
      name: "Isn't It Iron Pick",
      description: "Upgrade your pickaxe",
      requirement: "Make Iron Pickaxe",
      category: "story",
      icon: "⛏️",
    },
    "minecraft:story/deflect_arrow": {
      name: "Not Today, Thank You",
      description: "Deflect a projectile with a shield",
      requirement: "Deflect Arrow with Shield",
      category: "story",
      icon: "🛡️",
    },
    "minecraft:story/form_obsidian": {
      name: "Ice Bucket Challenge",
      description: "Form and mine a block of Obsidian",
      requirement: "Get Obsidian",
      category: "story",
      icon: "🧊",
    },
    "minecraft:story/mine_diamond": {
      name: "Diamonds!",
      description: "Acquire diamonds",
      requirement: "Get Diamond",
      category: "story",
      icon: "💎",
    },
    "minecraft:story/enter_the_nether": {
      name: "We Need to Go Deeper",
      description: "Build, light and enter a Nether Portal",
      requirement: "Enter Nether",
      category: "story",
      icon: "🌋",
    },
    "minecraft:story/shiny_gear": {
      name: "Cover Me with Diamonds",
      description: "Diamond armor saves lives",
      requirement: "Get Diamond Armor",
      category: "story",
      icon: "💎",
    },
    "minecraft:story/enchant_item": {
      name: "Enchanter",
      description: "Enchant an item at an Enchanting Table",
      requirement: "Enchant an Item",
      category: "story",
      icon: "✨",
    },
    "minecraft:story/cure_zombie_villager": {
      name: "Zombie Doctor",
      description: "Weaken and then cure a Zombie Villager",
      requirement: "Cure Zombie Villager",
      category: "story",
      icon: "🧟",
    },
    "minecraft:story/follow_ender_eye": {
      name: "Eye Spy",
      description: "Follow an Ender Eye",
      requirement: "Enter a Stronghold",
      category: "story",
      icon: "👁️",
    },
    "minecraft:story/enter_the_end": {
      name: "The End?",
      description: "Enter the End Portal",
      requirement: "Enter the End",
      category: "story",
      icon: "🌟",
    },

    // Nether Tab
    "minecraft:nether/root": {
      name: "Nether",
      description: "Bring summer clothes",
      requirement: "Enter the Nether",
      category: "nether",
      icon: "🔥",
    },
    "minecraft:nether/return_to_sender": {
      name: "Return to Sender",
      description: "Destroy a Ghast with a fireball",
      requirement: "Kill a Ghast By Deflecting its Fireball",
      category: "nether",
      icon: "👻",
    },
    "minecraft:nether/find_bastion": {
      name: "Those Were the Days",
      description: "Enter a Bastion Remnant",
      requirement: "Enter a Bastion",
      category: "nether",
      icon: "🏰",
    },
    "minecraft:nether/obtain_ancient_debris": {
      name: "Hidden in the Depths",
      description: "Obtain Ancient Debris",
      requirement: "Obtain Ancient Debris",
      category: "nether",
      icon: "⚫",
    },
    "minecraft:nether/fast_travel": {
      name: "Subspace Bubble",
      description: "Use the Nether to travel 7 km in the Overworld",
      requirement: "Travel 7km in the Overworld using the Nether",
      category: "nether",
      icon: "🚀",
    },
    "minecraft:nether/find_fortress": {
      name: "A Terrible Fortress",
      description: "Break your way into a Nether Fortress",
      requirement: "Enter a Nether Fortress",
      category: "nether",
      icon: "🏛️",
    },
    "minecraft:nether/obtain_crying_obsidian": {
      name: "Who is Cutting Onions?",
      description: "Obtain Crying Obsidian",
      requirement: "Obtain Crying Obsidian",
      category: "nether",
      icon: "😢",
    },
    "minecraft:nether/distract_piglin": {
      name: "Oh Shiny",
      description: "Distract Piglins with gold",
      requirement: "Distract a aggravated Piglin with Gold",
      category: "nether",
      icon: "🏆",
    },
    "minecraft:nether/ride_strider": {
      name: "This Boat Has Legs",
      description: "Ride a Strider with a Warped Fungus on a Stick",
      requirement: "Ride a Strider with a warped Fungus on a stick",
      category: "nether",
      icon: "🦵",
    },
    "minecraft:nether/uneasy_alliance": {
      name: "Uneasy Alliance",
      description:
        "Rescue a Ghast from the Nether, bring it safely home to the Overworld... and then kill it",
      requirement: "Kill a Ghast in the Overworld",
      category: "nether",
      icon: "🤝",
    },
    "minecraft:nether/loot_bastion": {
      name: "War Pigs",
      description: "Loot a chest in a Bastion Remnant",
      requirement: "Loot a Chest in a Bastion",
      category: "nether",
      icon: "💰",
    },
    "minecraft:nether/use_lodestone": {
      name: "Country Lode, Take Me Home",
      description: "Use a Compass on a Lodestone",
      requirement: "Use a Compass on a Lodestone",
      category: "nether",
      icon: "🧭",
    },
    "minecraft:nether/netherite_armor": {
      name: "Cover me in Debris",
      description: "Get a full suit of Netherite armor",
      requirement: "Get a Full Suit of Netherite Armor",
      category: "nether",
      icon: "⚫",
    },
    "minecraft:nether/get_wither_skull": {
      name: "Spooky Scary Skeleton",
      description: "Obtain a Wither Skeleton Skull",
      requirement: "Obtain a Wither Skeleton Skull",
      category: "nether",
      icon: "💀",
    },
    "minecraft:nether/obtain_blaze_rod": {
      name: "Into Fire",
      description: "Relieve a Blaze of its rod",
      requirement: "Obtain a Blaze Rod",
      category: "nether",
      icon: "🔥",
    },
    "minecraft:nether/charge_respawn_anchor": {
      name: 'Not Quite "Nine" Lives',
      description: "Charge a Respawn Anchor to the maximum",
      requirement: "Charge a Respawn Anchor to Max using Glowstone",
      category: "nether",
      icon: "⚡",
    },
    "minecraft:nether/ride_strider_in_overworld_lava": {
      name: "Feels like Home",
      description:
        "Take a Strider for a loooong ride on a lava lake in the Overworld",
      requirement: "Ride a Strider 50 Blocks in the Overworld on Lava",
      category: "nether",
      icon: "🏠",
    },
    "minecraft:nether/explore_nether": {
      name: "Hot Tourist Destinations",
      description: "Explore all Nether biomes",
      requirement: "Visit all 5 Nether Biomes",
      category: "nether",
      icon: "🗺️",
    },
    "minecraft:nether/summon_wither": {
      name: "Withering Heights",
      description: "Summon the Wither",
      requirement: "Summon The Wither",
      category: "nether",
      icon: "💀",
    },
    "minecraft:nether/brew_potion": {
      name: "Local Brewery",
      description: "Brew a potion",
      requirement: "Brew a Potion",
      category: "nether",
      icon: "🧪",
    },
    "minecraft:nether/create_beacon": {
      name: "Bring Home the Beacon",
      description: "Construct and place a Beacon",
      requirement: "Construct and Activate a Beacon",
      category: "nether",
      icon: "🔆",
    },
    "minecraft:nether/all_potions": {
      name: "A Furious Cocktail",
      description: "Have every potion effect applied at the same time",
      requirement: "Have all Potion Status Effects at once",
      category: "nether",
      icon: "🍸",
    },
    "minecraft:nether/create_full_beacon": {
      name: "Beaconator",
      description: "Bring a beacon to full power",
      requirement: "Construct a Full Power Beacon",
      category: "nether",
      icon: "🔆",
    },
    "minecraft:nether/all_effects": {
      name: "How Did We Get Here?",
      description: "Have every effect applied at the same time",
      requirement: "Have fun and see other sheet",
      category: "nether",
      icon: "🤯",
    },

    // End Tab
    "minecraft:end/root": {
      name: "The End",
      description: "Or the beginning?",
      requirement: "Enter The End",
      category: "end",
      icon: "🌟",
    },
    "minecraft:end/kill_dragon": {
      name: "Free the End",
      description: "Good luck",
      requirement: "Get the Last Hit on the Ender Dragon",
      category: "end",
      icon: "🐉",
    },
    "minecraft:end/dragon_egg": {
      name: "The Next Generation",
      description: "Hold the Dragon Egg",
      requirement: "Obtain the Dragon Egg",
      category: "end",
      icon: "🥚",
    },
    "minecraft:end/enter_end_gateway": {
      name: "Remote Getaway",
      description: "Escape the island",
      requirement: "Travel Through a End gateway",
      category: "end",
      icon: "🌀",
    },
    "minecraft:end/respawn_dragon": {
      name: "The End... Again...",
      description: "Respawn the Ender Dragon",
      requirement: "Respawn the Ender Dragon",
      category: "end",
      icon: "🔄",
    },
    "minecraft:end/dragon_breath": {
      name: "You Need a Mint",
      description: "Collect dragon breath in a glass bottle",
      requirement: "Collect Dragons Breath in a Glass Bottle",
      category: "end",
      icon: "💨",
    },
    "minecraft:end/find_end_city": {
      name: "The City at the End of the Game",
      description: "Go on in, what could happen?",
      requirement: "Enter an End City",
      category: "end",
      icon: "🏙️",
    },
    "minecraft:end/elytra": {
      name: "Sky's the Limit",
      description: "Find Elytra",
      requirement: "Obtain an Elytra",
      category: "end",
      icon: "🪶",
    },
    "minecraft:end/levitate": {
      name: "Great View From Up Here",
      description: "Levitate up 50 blocks from the attacks of a Shulker",
      requirement: "Move 50 Blocks Vertically From Shulker Levitation",
      category: "end",
      icon: "📈",
    },

    // Adventure Tab
    "minecraft:adventure/root": {
      name: "Adventure",
      description: "Adventure, exploration and combat",
      requirement: "Kill any Hostile Mob",
      category: "adventure",
      icon: "⚔️",
    },
    "minecraft:adventure/voluntary_exile": {
      name: "Voluntary Exile",
      description:
        "Kill a raid captain. Maybe consider staying away from villages for the time being...",
      requirement: "Kill a Raid Captain",
      category: "adventure",
      icon: "🏴‍☠️",
    },
    "minecraft:adventure/spyglass_at_parrot": {
      name: "Is It a Bird?",
      description: "Look at a Parrot through a Spyglass",
      requirement: "Look at a Parrot Through a Spyglass",
      category: "adventure",
      icon: "🔭",
    },
    "minecraft:adventure/kill_a_mob": {
      name: "Monster Hunter",
      description: "Kill any hostile monster",
      requirement: "Kill any Hostile Monster",
      category: "adventure",
      icon: "🗡️",
    },
    "minecraft:adventure/read_power_of_chiseled_bookshelf": {
      name: "The Power of Books",
      description: "Read the power of a Chiseled Bookshelf with a Comparator",
      requirement: "Place a Comparator Next to a Chiseled Bookshelf",
      category: "adventure",
      icon: "📚",
    },
    "minecraft:adventure/trade": {
      name: "What a Deal!",
      description: "Successfully trade with a Villager",
      requirement: "Trade with a Villager",
      category: "adventure",
      icon: "💱",
    },
    "minecraft:adventure/honey_block_slide": {
      name: "Sticky Situation",
      description: "Jump into a Honey Block to break your fall",
      requirement: "Break your fall with a side of a honey block",
      category: "adventure",
      icon: "🍯",
    },
    "minecraft:adventure/ol_betsy": {
      name: "Ol' Betsy",
      description: "Shoot a Crossbow",
      requirement: "Shoot a Crossbow",
      category: "adventure",
      icon: "🏹",
    },
    "minecraft:adventure/lightning_rod_with_villager_no_fire": {
      name: "Surge Protector",
      description:
        "Protect a Villager from an undesired shock without starting a fire",
      requirement: "Use a Lightning rod to redirect a bolt in a village",
      category: "adventure",
      icon: "⚡",
    },
    "minecraft:adventure/fall_from_world_height": {
      name: "Caves & Cliffs",
      description:
        "Free fall from the top of the world (build limit) to the bottom of the world and survive",
      requirement: "Fall from build limit to bedrock and survive",
      category: "adventure",
      icon: "🏔️",
    },
    "minecraft:adventure/salvage_sherd": {
      name: "Respecting the Remnants",
      description: "Brush a Suspicious block to obtain a Pottery Sherd",
      requirement: "Brush a suspicious block of or pottery shard",
      category: "adventure",
      icon: "🏺",
    },
    "minecraft:adventure/avoid_vibration": {
      name: "Sneak 100",
      description:
        "Sneak near a Sculk Sensor or Warden to prevent it from detecting you",
      requirement: "Sneak past a warden or sculk sensor",
      category: "adventure",
      icon: "🤫",
    },
    "minecraft:adventure/sleep_in_bed": {
      name: "Sweet Dreams",
      description: "Sleep in a bed to change your respawn point",
      requirement: "Sleep in a bed",
      category: "adventure",
      icon: "🛏️",
    },
    "minecraft:adventure/hero_of_the_village": {
      name: "Hero of the Village",
      description: "Successfully defend a village from a raid",
      requirement: "Defend a village from a raid",
      category: "adventure",
      icon: "🏆",
    },
    "minecraft:adventure/spyglass_at_ghast": {
      name: "Is it a Balloon?",
      description: "Look at a Ghast through a Spyglass",
      requirement: "Look at a Ghast Through a Spyglass",
      category: "adventure",
      icon: "👻",
    },
    "minecraft:adventure/throw_trident": {
      name: "A Throwaway Joke",
      description:
        "Throw a Trident at something. Note: Throwing away your only weapon is not a good idea.",
      requirement: "Hit a mob with a Trident",
      category: "adventure",
      icon: "🔱",
    },
    "minecraft:adventure/shoot_arrow": {
      name: "Take Aim",
      description: "Shoot something with an Arrow",
      requirement: "Shoot a mob with an arrow",
      category: "adventure",
      icon: "🏹",
    },
    "minecraft:adventure/kill_all_mobs": {
      name: "Monsters Hunted",
      description: "Kill one of every hostile monster",
      requirement: "Kill every Hostile Monster",
      category: "adventure",
      icon: "🏴‍☠️",
    },
    "minecraft:adventure/totem_of_undying": {
      name: "Postmortal",
      description: "Use a Totem of Undying to cheat death",
      requirement: "Kill a evoker or undying",
      category: "adventure",
      icon: "🪬",
    },
    "minecraft:adventure/summon_iron_golem": {
      name: "Hired Help",
      description: "Summon an Iron Golem to help defend a village",
      requirement: "Summon an Iron Golem",
      category: "adventure",
      icon: "🤖",
    },
    "minecraft:adventure/trade_at_world_height": {
      name: "Star Trader",
      description: "Trade with a Villager at the build height limit",
      requirement: "Trade with a villager at build height",
      category: "adventure",
      icon: "⭐",
    },
    "minecraft:adventure/two_birds_one_arrow": {
      name: "Two Birds, One Arrow",
      description: "Kill two Phantoms with a piercing arrow",
      requirement: "Kill two phantoms with a piercing crossbow",
      category: "adventure",
      icon: "🏹",
    },
    "minecraft:adventure/whos_the_pillager_now": {
      name: "Who's the Pillager Now?",
      description: "Give a Pillager a taste of their own medicine",
      requirement: "Kill a pillager with a crossbow",
      category: "adventure",
      icon: "🏹",
    },
    "minecraft:adventure/arbalistic": {
      name: "Arbalistic",
      description: "Kill five unique mobs with one crossbow shot",
      requirement: "Kill 5 unique mobs with one crossbow shot",
      category: "adventure",
      icon: "🎯",
    },
    "minecraft:adventure/adventuring_time": {
      name: "Adventuring Time",
      description: "Discover every biome",
      requirement: "Visit all 63 Biomes (Separate Sheet)",
      category: "adventure",
      icon: "🗺️",
    },
    "minecraft:adventure/play_jukebox_in_meadows": {
      name: "Sound of Music",
      description:
        "Make the Meadows come alive with the sound of music from a Jukebox",
      requirement: "Play a jukebox in a meadow biome",
      category: "adventure",
      icon: "🎵",
    },
    "minecraft:adventure/walk_on_powder_snow_with_leather_boots": {
      name: "Light as a Rabbit",
      description: "Walk on Powder Snow... without sinking in it",
      requirement: "Walk on powder snow with leather boots",
      category: "adventure",
      icon: "👢",
    },
    "minecraft:adventure/spyglass_at_dragon": {
      name: "Is it a Plane?",
      description: "Look at the Ender Dragon through a Spyglass",
      requirement: "Look at the Ender Dragon through a spyglass",
      category: "adventure",
      icon: "🔭",
    },
    "minecraft:adventure/very_very_frightening": {
      name: "Very Very Frightening",
      description: "Strike a Villager with lightning",
      requirement: "Kill a villager with lightning from a trident",
      category: "adventure",
      icon: "⚡",
    },
    "minecraft:adventure/sniper_duel": {
      name: "Sniper Duel",
      description: "Kill a Skeleton from at least 50 meters away",
      requirement: "Hit a mob a skeleton from 50+ blocks",
      category: "adventure",
      icon: "🎯",
    },
    "minecraft:adventure/bullseye": {
      name: "Bullseye",
      description:
        "Hit the bullseye of a Target block from at least 30 meters away",
      requirement: "Hit the bullseye of a target block from 30 blocks",
      category: "adventure",
      icon: "🎯",
    },

    // Husbandry Tab
    "minecraft:husbandry/root": {
      name: "Husbandry",
      description: "The world is full of friends and food",
      requirement: "Eat Something",
      category: "husbandry",
      icon: "🌾",
    },
    "minecraft:husbandry/safely_harvest_honey": {
      name: "Bee Our Guest",
      description:
        "Use a Campfire to collect Honey from a Beehive using a Bottle without aggravating the bees",
      requirement: "Use a Glass Bottle on a beehive with a campfire underneath",
      category: "husbandry",
      icon: "🐝",
    },
    "minecraft:husbandry/breed_an_animal": {
      name: "The Parrots and the Bats",
      description: "Breed two animals together",
      requirement: "Breed any two Animals",
      category: "husbandry",
      icon: "💕",
    },
    "minecraft:husbandry/allay_deliver_item_to_player": {
      name: "You've Got a Friend in Me",
      description: "Have an Allay deliver items to you",
      requirement:
        "Give an allay an item and have it return to you with more of the same item",
      category: "husbandry",
      icon: "🤝",
    },
    "minecraft:husbandry/fishy_business": {
      name: "Fishy Business",
      description: "Catch a fish",
      requirement: "Get Fish with a Coat",
      category: "husbandry",
      icon: "🐟",
    },
    "minecraft:husbandry/silk_touch_nest": {
      name: "Total Beelocation",
      description: "Move a Bee Nest, with 3 bees inside, using Silk Touch",
      requirement: "Use silk touch to relocate a bee nest with bees",
      category: "husbandry",
      icon: "🏠",
    },
    "minecraft:husbandry/ride_a_boat_with_a_goat": {
      name: "Whatever Floats Your Goat!",
      description: "Get in a boat and float with a goat",
      requirement: "Tame a Goat",
      category: "husbandry",
      icon: "🛥️",
    },
    "minecraft:husbandry/tame_an_animal": {
      name: "Best Friends Forever",
      description: "Tame an animal",
      requirement: "Tame an Animal",
      category: "husbandry",
      icon: "❤️",
    },
    "minecraft:husbandry/make_a_sign_glow": {
      name: "Glow and Behold!",
      description: "Make the text of a sign glow",
      requirement: "Use an Ink Sac on a Sign",
      category: "husbandry",
      icon: "✨",
    },
    "minecraft:husbandry/obtain_netherite_hoe": {
      name: "Serious Dedication",
      description:
        "Use a Netherite ingot to upgrade a hoe, and then reevaluate your life choices",
      requirement: "Obtain a Netherite Hoe",
      category: "husbandry",
      icon: "🌾",
    },
    "minecraft:husbandry/balanced_diet": {
      name: "A Balanced Diet",
      description:
        "Eat everything that is edible, even if it's not good for you",
      requirement: "Eat everything edible",
      category: "husbandry",
      icon: "🍽️",
    },
    "minecraft:husbandry/obtain_sniffer_egg": {
      name: "Little Sniffs",
      description: "Obtain a Sniffer Egg",
      requirement: "Obtain a Sniffer Egg",
      category: "husbandry",
      icon: "🥚",
    },
    "minecraft:husbandry/feed_snifflet": {
      name: "Planting the Past",
      description: "Plant any Sniffer seed",
      requirement: "Plant a Sniffer Seed",
      category: "husbandry",
      icon: "🌱",
    },
    "minecraft:husbandry/complete_catalogue": {
      name: "A Complete Catalogue",
      description: "Tame all cat variants",
      requirement: "Tame all Cat Variants (Find in villages)",
      category: "husbandry",
      icon: "🐱",
    },
    "minecraft:husbandry/tactical_fishing": {
      name: "Tactical Fishing",
      description: "Catch a fish... without a fishing rod!",
      requirement: "Use a Bucket to Get a Fish",
      category: "husbandry",
      icon: "🪣",
    },
    "minecraft:husbandry/leash_all_frog_variants": {
      name: "When the Squad Hops into Town",
      description: "Get each Frog variant on a Lead",
      requirement: "Get each frog variant on a lead",
      category: "husbandry",
      icon: "🐸",
    },
    "minecraft:husbandry/axolotl_in_a_bucket": {
      name: "The Cutest Predator",
      description: "Catch an Axolotl in a Bucket",
      requirement: "Use an axe on a wood Copper block",
      category: "husbandry",
      icon: "🪣",
    },
    "minecraft:husbandry/kill_axolotl_target": {
      name: "The Healing Power of Friendship!",
      description: "Team up with an Axolotl and win a fight",
      requirement:
        "Assist a player in killing a mob and get Regeneration from it",
      category: "husbandry",
      icon: "💙",
    },
    "minecraft:husbandry/all_effects": {
      name: "How Did We Get Here?",
      description: "Have every effect applied at the same time",
      requirement: "Set a Player Statef: A Player Should",
      category: "husbandry",
      icon: "🤯",
    },
  };

  // Categories for organizing achievements in the UI
  const ADVANCEMENT_CATEGORIES = {
    story: {
      name: "Story",
      description: "Main progression through the game",
      icon: "📖",
      color: "bg-gradient-to-r from-green-500 to-green-400",
      advancements: Object.values(ADVANCEMENT_DATA).filter(
        (adv) => adv.category === "story",
      ),
    },
    nether: {
      name: "Nether",
      description: "Adventures in the fiery dimension",
      icon: "🔥",
      color: "bg-gradient-to-r from-red-500 to-orange-400",
      advancements: Object.values(ADVANCEMENT_DATA).filter(
        (adv) => adv.category === "nether",
      ),
    },
    end: {
      name: "The End",
      description: "Endgame challenges and dragon slaying",
      icon: "🌟",
      color: "bg-gradient-to-r from-purple-500 to-purple-400",
      advancements: Object.values(ADVANCEMENT_DATA).filter(
        (adv) => adv.category === "end",
      ),
    },
    adventure: {
      name: "Adventure",
      description: "Exploration, combat, and discoveries",
      icon: "⚔️",
      color: "bg-gradient-to-r from-blue-500 to-blue-400",
      advancements: Object.values(ADVANCEMENT_DATA).filter(
        (adv) => adv.category === "adventure",
      ),
    },
    husbandry: {
      name: "Husbandry",
      description: "Farming, animals, and food",
      icon: "🌾",
      color: "bg-gradient-to-r from-yellow-500 to-yellow-400",
      advancements: Object.values(ADVANCEMENT_DATA).filter(
        (adv) => adv.category === "husbandry",
      ),
    },
  };

  // Function to get advancement details
  const getAdvancementDetails = (advancementId) => {
    // Handle recipe advancements
    if (advancementId.includes("recipes/")) {
      const parts = advancementId.split("/");
      const category = parts[2] || "crafting";
      const item = parts[3] || parts[2] || "unknown";
      return {
        name: `Recipe: ${item.replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase())}`,
        description: `Learned how to craft ${item.replace(/_/g, " ")}`,
        requirement: `Craft or obtain the recipe`,
        category: "recipes",
        icon:
          category === "combat"
            ? "⚔️"
            : category === "tools"
              ? "🔧"
              : category === "decorations"
                ? "🎨"
                : category === "food"
                  ? "🍞"
                  : category === "redstone"
                    ? "🔴"
                    : category === "building_blocks"
                      ? "🧱"
                      : category === "transportation"
                        ? "🚂"
                        : "📋",
      };
    }

    // Return mapped advancement or create a fallback
    return (
      ADVANCEMENT_DATA[advancementId] || {
        name: advancementId
          .split("/")
          .pop()
          .replace(/_/g, " ")
          .replace(/^\w/, (c) => c.toUpperCase()),
        description: "Achievement unlocked",
        requirement: "Complete the required task",
        category: advancementId.includes("nether")
          ? "nether"
          : advancementId.includes("end")
            ? "end"
            : advancementId.includes("adventure")
              ? "adventure"
              : advancementId.includes("husbandry")
                ? "husbandry"
                : "story",
        icon: "🏆",
      }
    );
  };

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-minecraft-navy-dark via-minecraft-navy to-minecraft-navy-dark">
      {/* Celebration overlay */}
      {showCelebration && (
        <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
          <div className="absolute inset-0 bg-black bg-opacity-70"></div>
          <div className="celebration-container relative z-50">
            <div className="celebration-title text-4xl font-bold text-green-500 mb-4 animate-bounce">
              🎮 Minecraft Account Linked! 🎉
            </div>
            <div className="celebration-subtitle text-2xl font-semibold text-white mb-6">
              {profileUser?.minecraft?.mcUsername
                ? `Welcome, ${profileUser.minecraft.mcUsername}!`
                : "Welcome, Minecrafter!"}
            </div>
            <div className="celebration-items flex justify-center space-x-4">
              {[...Array(30)].map((_, i) => (
                <div
                  key={i}
                  className="celebration-item"
                  style={{
                    position: "absolute",
                    top: `${Math.random() * 100}%`,
                    left: `${Math.random() * 100}%`,
                    animation: `fall ${3 + Math.random() * 5}s linear infinite`,
                    animationDelay: `${Math.random() * 2}s`,
                    fontSize: `${Math.random() * 2 + 1}rem`,
                    opacity: 0.7,
                  }}
                >
                  {
                    [
                      "🎮",
                      "⛏️",
                      "🗡️",
                      "🏹",
                      "🧪",
                      "🌳",
                      "💎",
                      "🏆",
                      "🧱",
                      "🔥",
                    ][Math.floor(Math.random() * 10)]
                  }
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      {/* Add celebration CSS */}
      {showCelebration && (
        <style jsx="true">{`
          @keyframes fall {
            0% {
              transform: translateY(-20vh) rotate(0deg);
              opacity: 1;
            }
            100% {
              transform: translateY(100vh) rotate(360deg);
              opacity: 0;
            }
          }
          .celebration-container {
            text-align: center;
            z-index: 9999;
            background-color: rgba(0, 0, 0, 0.8);
            padding: 2rem;
            border-radius: 1rem;
            animation: pulse 2s infinite;
            box-shadow: 0 0 20px rgba(0, 255, 0, 0.5);
            border: 2px solid #4ade80;
            max-width: 90%;
            width: 600px;
            pointer-events: auto;
          }
          @keyframes pulse {
            0% {
              transform: scale(1);
              box-shadow: 0 0 20px rgba(0, 255, 0, 0.5);
            }
            50% {
              transform: scale(1.05);
              box-shadow: 0 0 30px rgba(0, 255, 0, 0.8);
            }
            100% {
              transform: scale(1);
              box-shadow: 0 0 20px rgba(0, 255, 0, 0.5);
            }
          }
        `}</style>
      )}
      {/* Notification system */}
      <Notification
        show={notification.show}
        type={notification.type}
        message={notification.message}
        onClose={() => setNotification({ ...notification, show: false })}
      />
      {/* Enhanced Tab Styling */}
      <style jsx>{`
        .profile-tab {
          position: relative;
          overflow: hidden;
        }

        .profile-tab::before {
          content: "";
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(
            90deg,
            transparent,
            rgba(255, 255, 255, 0.1),
            transparent
          );
          transition: left 0.5s;
        }

        .profile-tab:hover::before {
          left: 100%;
        }

        .profile-tab.active {
          box-shadow:
            0 0 10px rgba(74, 222, 128, 0.3),
            inset 0 1px 0 rgba(255, 255, 255, 0.1);
        }

        .profile-tab.active::after {
          content: "";
          position: absolute;
          bottom: -1px;
          left: 50%;
          transform: translateX(-50%);
          width: 0;
          height: 0;
          border-left: 6px solid transparent;
          border-right: 6px solid transparent;
          border-bottom: 6px solid var(--tab-color, #4ade80);
        }

        .tab-glow {
          animation: tabGlow 2s ease-in-out infinite alternate;
        }

        @keyframes tabGlow {
          from {
            box-shadow: 0 0 5px rgba(74, 222, 128, 0.3);
          }
          to {
            box-shadow: 0 0 15px rgba(74, 222, 128, 0.6);
          }
        }

        .minecraft-texture {
          background-image:
            linear-gradient(
              45deg,
              rgba(255, 255, 255, 0.1) 25%,
              transparent 25%
            ),
            linear-gradient(
              -45deg,
              rgba(255, 255, 255, 0.1) 25%,
              transparent 25%
            );
          background-size: 4px 4px;
          background-position:
            0 0,
            2px 2px;
        }
      `}</style>
      <div className="min-h-screen text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Profile Header */}
          <div className="relative">
            {/* Cover Image */}
            <div className="h-48 bg-minecraft-navy-dark rounded-t-md overflow-hidden relative">
              {coverImage ? (
                <img
                  src={coverImage}
                  alt="Profile Cover"
                  className="w-full h-full object-cover"
                  onLoad={() => setWallpaperLoaded(true)}
                />
              ) : (
                <div className="w-full h-full bg-minecraft-navy-dark flex items-center justify-center">
                  <img
                    src={getDefaultCover(profileUser?.username)}
                    alt="Default Cover"
                    className="w-full h-full object-cover opacity-50"
                  />
                </div>
              )}

              {/* Instagram/TikTok Style Social Stats Overlay */}
              <div className="absolute top-3 right-3 sm:top-4 sm:right-4 flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                {socialStats.loading ? (
                  <div className="bg-white/10 backdrop-blur-md border-2 border-white/20 rounded-md px-4 py-3 min-w-[90px] text-center shadow-card">
                    <LoadingSpinner size="small" />
                  </div>
                ) : socialStats.error ? (
                  <div className="bg-red-900/60 backdrop-blur-md border-2 border-red-500/40 rounded-md px-4 py-3 min-w-[90px] text-center shadow-card">
                    <div className="text-red-300 text-xs font-medium">
                      Error
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Followers */}
                    <button
                      onClick={handleOpenFollowersModal}
                      className="bg-white/10 backdrop-blur-md border-2 border-white/20 rounded-md px-4 py-3 min-w-[90px] text-center hover:bg-white/15 hover:border-minecraft-habbo-blue/50 transition-all duration-300 cursor-pointer group hover:scale-105 hover:-translate-y-1 transform shadow-card hover:shadow-card-hover"
                    >
                      <div className="text-white font-bold text-xl leading-none">
                        {socialStats.followersCount || 0}
                      </div>
                      <div className="text-gray-300 text-xs font-medium uppercase tracking-wider mt-1 group-hover:text-minecraft-habbo-blue transition-colors">
                        Followers
                      </div>
                    </button>

                    {/* Following */}
                    <button
                      onClick={handleOpenFollowingModal}
                      className="bg-white/10 backdrop-blur-md border-2 border-white/20 rounded-md px-4 py-3 min-w-[90px] text-center hover:bg-white/15 hover:border-minecraft-habbo-green/50 transition-all duration-300 cursor-pointer group hover:scale-105 hover:-translate-y-1 transform shadow-card hover:shadow-card-hover"
                    >
                      <div className="text-white font-bold text-xl leading-none">
                        {socialStats.followingCount || 0}
                      </div>
                      <div className="text-gray-300 text-xs font-medium uppercase tracking-wider mt-1 group-hover:text-minecraft-habbo-green transition-colors">
                        Following
                      </div>
                    </button>

                    {/* Friends */}
                    <button
                      onClick={handleOpenFriendsModal}
                      className="bg-white/10 backdrop-blur-md border-2 border-white/20 rounded-md px-4 py-3 min-w-[90px] text-center hover:bg-white/15 hover:border-minecraft-habbo-blue/50 transition-all duration-300 cursor-pointer group hover:scale-105 hover:-translate-y-1 transform shadow-card hover:shadow-card-hover"
                    >
                      <div className="text-white font-bold text-xl leading-none">
                        {socialStats.friendsCount || 0}
                      </div>
                      <div className="text-gray-300 text-xs font-medium uppercase tracking-wider mt-1 group-hover:text-minecraft-habbo-blue transition-colors">
                        Friends
                      </div>
                    </button>
                  </>
                )}
              </div>

              {/* Cover Image Change Button */}
              {isOwnProfile && (
                <button
                  onClick={() => setShowWallpaperModal(true)}
                  className="absolute bottom-4 right-4 bg-black/50 hover:bg-black/70 text-white px-3 py-1 rounded-md flex items-center text-sm"
                >
                  <PhotoIcon className="h-4 w-4 mr-1" />
                  Change Cover
                </button>
              )}
            </div>

            {/* Profile Info */}
            <div className="px-6 pb-4">
              <div className="flex flex-col md:flex-row md:items-end -mt-16 relative z-10">
                {/* Avatar */}
                <div className="flex-shrink-0 relative group">
                  <div className="w-32 h-32 rounded-md overflow-hidden border-4 border-minecraft-navy-dark bg-minecraft-navy-light">
                    {viewMode === "avatar" ? (
                      <MinecraftAvatar
                        username={
                          profileUser?.mcUsername || profileUser?.username
                        }
                        size={128}
                        className="w-full h-full"
                      />
                    ) : (
                      <MinecraftPlayerModel3D
                        username={
                          profileUser?.mcUsername || profileUser?.username
                        }
                        width={128}
                        height={128}
                      />
                    )}
                  </div>
                  <button
                    onClick={toggleViewMode}
                    className="absolute bottom-2 right-2 bg-black/50 hover:bg-black/70 text-white p-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity"
                    title={
                      viewMode === "avatar" ? "Show 3D Model" : "Show Avatar"
                    }
                  >
                    <CubeIcon className="h-4 w-4" />
                  </button>
                </div>

                {/* Profile Info & Actions */}
                <div className="flex-1 md:ml-6 mt-4 md:mt-0">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                    <div>
                      <h1 className="text-2xl font-minecraft flex items-center">
                        {profileUser?.username}
                        {profileUser?.verified && (
                          <span
                            className="ml-2 text-minecraft-habbo-blue"
                            title="Verified"
                          >
                            <svg
                              className="h-5 w-5"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                clipRule="evenodd"
                              />
                            </svg>
                          </span>
                        )}
                      </h1>
                      <div className="text-gray-400 text-sm mt-1">
                        {profileUser?.title || "Adventurer"}
                      </div>
                    </div>

                    {/* Profile Actions */}
                    <div className="flex items-center space-x-3 mt-4 md:mt-0">
                      {!isOwnProfile && (
                        <>
                          <FriendButton username={profileUser?.username} />
                          {/* Replace the manual Follow/Unfollow button with the modern FollowButton component */}
                          <FollowButton
                            username={profileUser?.username}
                            mcUsername={profileUser?.mcUsername}
                            initialFollowing={relationship?.following}
                            followsYou={relationship?.followsYou}
                          />
                          <button
                            onClick={() =>
                              navigate(`/messages/new/${profileUser?.username}`)
                            }
                            className="message-btn flex items-center px-4 py-2 rounded-lg border border-blue-500 bg-transparent text-blue-300 font-semibold shadow-sm hover:bg-blue-600 hover:text-white hover:shadow-lg focus:ring-2 focus:ring-blue-400 transition-all duration-150 scale-100 hover:scale-105 active:scale-95"
                            aria-label="Send Message"
                            tabIndex={0}
                          >
                            <ChatBubbleLeftIcon className="h-5 w-5 mr-2" />
                            Message
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Friend Request Notification */}
                  {relationship?.status === "pending_received" && (
                    <div className="mt-4 bg-minecraft-navy-light p-4 rounded-md">
                      <p className="text-sm mb-2">
                        {profileUser?.username} sent you a friend request
                      </p>
                      <div className="flex space-x-2">
                        <button
                          onClick={() =>
                            handleAcceptFriendRequest(profileUser?.username)
                          }
                          className="habbo-btn-success text-sm px-3 py-1"
                        >
                          Accept
                        </button>
                        <button
                          onClick={() =>
                            handleRejectFriendRequest(profileUser?.username)
                          }
                          className="habbo-btn-danger text-sm px-3 py-1"
                        >
                          Decline
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Account Verification Alert - Only show for own profile if not verified */}
          {isOwnProfile &&
            profileUser &&
            !profileUser.verified &&
            !profileUser.isVerified &&
            !verificationAlertDismissed && (
              <div className="mt-6 animate-in slide-in-from-top duration-300 verification-alert">
                <div className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/30 rounded-lg p-4 shadow-lg backdrop-blur-sm">
                  <div className="flex items-start space-x-3">
                    {/* Warning Icon */}
                    <div className="flex-shrink-0">
                      <svg
                        className="h-6 w-6 text-yellow-500"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M8.485 3.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.19-1.458-1.515-2.625L8.485 3.495zM10 6a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 6zm0 9a1 1 0 100-2 1 1 0 000 2z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>

                    {/* Alert Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-sm font-medium text-yellow-300 mb-1">
                            🔐 Account Verification Required
                          </h3>
                          <p className="text-sm text-gray-300">
                            Your account is not verified yet. Verify your
                            account to access all features, build trust with
                            other users, and unlock exclusive benefits.
                          </p>

                          {/* Benefits List */}
                          <div className="mt-3">
                            <p className="text-xs text-gray-400 mb-2">
                              Benefits of verification:
                            </p>
                            <div className="flex flex-wrap gap-2">
                              <span className="inline-flex items-center px-2 py-1 text-xs bg-green-500/20 text-green-300 rounded-full border border-green-500/30">
                                ✓ Blue checkmark badge
                              </span>
                              <span className="inline-flex items-center px-2 py-1 text-xs bg-blue-500/20 text-blue-300 rounded-full border border-blue-500/30">
                                🔒 Enhanced security
                              </span>
                              <span className="inline-flex items-center px-2 py-1 text-xs bg-purple-500/20 text-purple-300 rounded-full border border-purple-500/30">
                                🎮 Full Minecraft integration
                              </span>
                              <span className="inline-flex items-center px-2 py-1 text-xs bg-yellow-500/20 text-yellow-300 rounded-full border border-yellow-500/30">
                                🏆 Access to leaderboards
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-col sm:flex-row gap-2 ml-4">
                          <Link
                            to="/verify-account"
                            className="inline-flex items-center px-4 py-2 text-sm font-medium text-black bg-yellow-500 hover:bg-yellow-400 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 focus:ring-offset-gray-900"
                          >
                            Verify Now
                            <svg
                              className="ml-1 h-4 w-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 5l7 7-7 7"
                              />
                            </svg>
                          </Link>
                          <button
                            onClick={() => {
                              // Store dismissal in localStorage with expiry (show again after 24 hours)
                              const dismissalTime =
                                Date.now() + 24 * 60 * 60 * 1000;
                              localStorage.setItem(
                                "verification_alert_dismissed",
                                dismissalTime.toString(),
                              );
                              // Update state to hide the alert
                              setVerificationAlertDismissed(true);
                            }}
                            className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-400 hover:text-gray-300 transition-colors focus:outline-none"
                            title="Remind me later (24 hours)"
                          >
                            Later
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

          {/* Profile Tabs */}
          <div className="flex mt-6 border-b border-white/10 overflow-x-auto pb-px relative bg-gradient-to-r from-minecraft-navy-dark via-minecraft-navy to-minecraft-navy-dark rounded-t-lg">
            {/* Wall Tab */}
            <button
              onClick={() => setSelectedTab("wall")}
              className={`profile-tab relative flex items-center px-5 py-3 font-medium text-sm transition-all duration-300 transform hover:scale-105 hover:-translate-y-1 ${
                selectedTab === "wall"
                  ? "text-white bg-gradient-to-t from-minecraft-habbo-blue/20 to-transparent border-b-2 border-minecraft-habbo-blue -mb-px shadow-lg minecraft-texture"
                  : "text-gray-400 hover:text-white hover:bg-white/5"
              } rounded-t-lg group`}
              style={selectedTab === "wall" ? { "--tab-color": "#4ade80" } : {}}
            >
              <ChatBubbleOvalLeftIcon
                className={`h-5 w-5 mr-2 transition-all duration-300 ${
                  selectedTab === "wall"
                    ? "text-minecraft-habbo-blue animate-pulse"
                    : "text-gray-500 group-hover:text-minecraft-habbo-blue group-hover:scale-110"
                }`}
              />
              <span className="font-minecraft">Wall</span>
              {selectedTab === "wall" && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-minecraft-habbo-blue to-transparent animate-pulse"></div>
              )}
              {/* Tab notification indicator */}
              {selectedTab !== "wall" && wallPosts.length > 0 && (
                <div className="absolute top-1 right-1 w-2 h-2 bg-minecraft-habbo-blue rounded-full animate-ping opacity-75"></div>
              )}
            </button>

            {/* Info Tab */}
            <button
              onClick={() => setSelectedTab("info")}
              className={`profile-tab relative flex items-center px-5 py-3 font-medium text-sm transition-all duration-300 transform hover:scale-105 hover:-translate-y-1 ${
                selectedTab === "info"
                  ? "text-white bg-gradient-to-t from-minecraft-habbo-green/20 to-transparent border-b-2 border-minecraft-habbo-green -mb-px shadow-lg minecraft-texture"
                  : "text-gray-400 hover:text-white hover:bg-white/5"
              } rounded-t-lg group`}
              style={selectedTab === "info" ? { "--tab-color": "#22c55e" } : {}}
            >
              <UserIcon
                className={`h-5 w-5 mr-2 transition-all duration-300 ${
                  selectedTab === "info"
                    ? "text-minecraft-habbo-green animate-pulse"
                    : "text-gray-500 group-hover:text-minecraft-habbo-green group-hover:scale-110"
                }`}
              />
              <span className="font-minecraft">Info</span>
              {selectedTab === "info" && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-minecraft-habbo-green to-transparent animate-pulse"></div>
              )}
            </button>

            {/* Stats Tab */}
            <button
              onClick={() => setSelectedTab("stats")}
              className={`profile-tab relative flex items-center px-5 py-3 font-medium text-sm transition-all duration-300 transform hover:scale-105 hover:-translate-y-1 ${
                selectedTab === "stats"
                  ? "text-white bg-gradient-to-t from-minecraft-habbo-yellow/20 to-transparent border-b-2 border-minecraft-habbo-yellow -mb-px shadow-lg minecraft-texture"
                  : "text-gray-400 hover:text-white hover:bg-white/5"
              } rounded-t-lg group`}
              style={
                selectedTab === "stats" ? { "--tab-color": "#eab308" } : {}
              }
            >
              <ChartBarIcon
                className={`h-5 w-5 mr-2 transition-all duration-300 ${
                  selectedTab === "stats"
                    ? "text-minecraft-habbo-yellow animate-pulse"
                    : "text-gray-500 group-hover:text-minecraft-habbo-yellow group-hover:scale-110"
                }`}
              />
              <span className="font-minecraft">Stats</span>
              {selectedTab === "stats" && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-minecraft-habbo-yellow to-transparent animate-pulse"></div>
              )}
            </button>

            {/* Inventory Tab */}
            <button
              onClick={() => setSelectedTab("inventory")}
              className={`profile-tab relative flex items-center px-5 py-3 font-medium text-sm transition-all duration-300 transform hover:scale-105 hover:-translate-y-1 ${
                selectedTab === "inventory"
                  ? "text-white bg-gradient-to-t from-purple-500/20 to-transparent border-b-2 border-purple-500 -mb-px shadow-lg minecraft-texture"
                  : "text-gray-400 hover:text-white hover:bg-white/5"
              } rounded-t-lg group`}
              style={
                selectedTab === "inventory" ? { "--tab-color": "#a855f7" } : {}
              }
            >
              <CubeIcon
                className={`h-5 w-5 mr-2 transition-all duration-300 ${
                  selectedTab === "inventory"
                    ? "text-purple-500 animate-pulse"
                    : "text-gray-500 group-hover:text-purple-500 group-hover:scale-110"
                }`}
              />
              <span className="font-minecraft">Inventory</span>
              {selectedTab === "inventory" && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-purple-500 to-transparent animate-pulse"></div>
              )}
            </button>

            {/* Achievements Tab */}
            <button
              onClick={() => setSelectedTab("achievements")}
              className={`profile-tab relative flex items-center px-5 py-3 font-medium text-sm transition-all duration-300 transform hover:scale-105 hover:-translate-y-1 ${
                selectedTab === "achievements"
                  ? "text-white bg-gradient-to-t from-yellow-500/20 to-transparent border-b-2 border-yellow-500 -mb-px shadow-lg minecraft-texture"
                  : "text-gray-400 hover:text-white hover:bg-white/5"
              } rounded-t-lg group`}
              style={
                selectedTab === "achievements"
                  ? { "--tab-color": "#eab308" }
                  : {}
              }
            >
              <TrophyIcon
                className={`h-5 w-5 mr-2 transition-all duration-300 ${
                  selectedTab === "achievements"
                    ? "text-yellow-500 animate-pulse"
                    : "text-gray-500 group-hover:text-yellow-500 group-hover:scale-110"
                }`}
              />
              <span className="font-minecraft">Achievements</span>
              {selectedTab === "achievements" && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-yellow-500 to-transparent animate-pulse"></div>
              )}
              {/* Achievement notification */}
              {selectedTab !== "achievements" &&
                playerStats?.achievements > 0 && (
                  <div className="absolute top-1 right-1 w-2 h-2 bg-yellow-500 rounded-full animate-ping opacity-75"></div>
                )}
            </button>

            {/* Screenshots Tab */}
            <button
              onClick={() => setSelectedTab("photos")}
              className={`profile-tab relative flex items-center px-5 py-3 font-medium text-sm transition-all duration-300 transform hover:scale-105 hover:-translate-y-1 ${
                selectedTab === "photos"
                  ? "text-white bg-gradient-to-t from-pink-500/20 to-transparent border-b-2 border-pink-500 -mb-px shadow-lg minecraft-texture"
                  : "text-gray-400 hover:text-white hover:bg-white/5"
              } rounded-t-lg group`}
              style={
                selectedTab === "photos" ? { "--tab-color": "#ec4899" } : {}
              }
            >
              <PhotoIcon
                className={`h-5 w-5 mr-2 transition-all duration-300 ${
                  selectedTab === "photos"
                    ? "text-pink-500 animate-pulse"
                    : "text-gray-500 group-hover:text-pink-500 group-hover:scale-110"
                }`}
              />
              <span className="font-minecraft">Screenshots</span>
              {selectedTab === "photos" && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-pink-500 to-transparent animate-pulse"></div>
              )}
            </button>

            {/* Minecraft-themed decorative elements */}
            <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>

            {/* Animated background particles */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className="absolute w-1 h-1 bg-white/20 rounded-full animate-pulse"
                  style={{
                    left: `${15 + i * 15}%`,
                    top: `${20 + (i % 2) * 60}%`,
                    animationDelay: `${i * 0.5}s`,
                    animationDuration: `${2 + (i % 3)}s`,
                  }}
                ></div>
              ))}
            </div>
          </div>

          {/* Main Content Area */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Left Sidebar */}
            <div className="lg:col-span-1 space-y-6">
              {/* Basic Info Box */}
              <div className="habbo-card p-5 rounded-md">
                <h2 className="text-lg font-minecraft text-minecraft-habbo-blue mb-4 border-b border-white/10 pb-2">
                  ℹ️ Information
                </h2>

                <div className="space-y-3 text-sm">
                  <div className="flex">
                    <MapPinIcon className="h-5 w-5 text-gray-400 mr-3 flex-shrink-0" />
                    <div>
                      <p className="text-gray-400">Location:</p>
                      <p>{playerStats?.world || "Overworld"}</p>
                    </div>
                  </div>

                  <div className="flex">
                    <BriefcaseIcon className="h-5 w-5 text-gray-400 mr-3 flex-shrink-0" />
                    <div>
                      <p className="text-gray-400">Rank:</p>
                      <p>{playerStats?.rank || profileUser.role || "Member"}</p>
                    </div>
                  </div>

                  <div className="flex">
                    <GlobeAltIcon className="h-5 w-5 text-gray-400 mr-3 flex-shrink-0" />
                    <div>
                      <p className="text-gray-400">Gamemode:</p>
                      <p>{playerStats?.gamemode || "SURVIVAL"}</p>
                    </div>
                  </div>

                  <div className="flex">
                    <ClockIcon className="h-5 w-5 text-gray-400 mr-3 flex-shrink-0" />
                    <div>
                      <p className="text-gray-400">Playtime:</p>
                      <p>{playerStats?.playtime || "0h"}</p>
                    </div>
                  </div>

                  <div className="flex">
                    <CurrencyDollarIcon className="h-5 w-5 text-gray-400 mr-3 flex-shrink-0" />
                    <div>
                      <p className="text-gray-400">Balance:</p>
                      <p className="text-minecraft-habbo-yellow">
                        ${playerStats?.balance || 0}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Social Stats Box - Now moved to cover image overlay */}

              {/* Level Display Box */}
              <div className="habbo-card p-5 rounded-md">
                <h2 className="text-lg font-minecraft text-minecraft-habbo-blue mb-4 border-b border-white/10 pb-2">
                  ⭐ Level
                </h2>

                <LevelProgressBar
                  level={playerStats?.level || 1}
                  experience={playerStats?.experience || 0}
                />

                <div className="mt-3 text-center">
                  <span className="text-xl font-minecraft">
                    Level {playerStats?.level || 1}
                  </span>
                </div>
              </div>

              {/* Friends Box */}
              <div className="habbo-card p-5 rounded-md">
                <h2 className="text-lg font-minecraft text-minecraft-habbo-blue mb-4 border-b border-white/10 pb-2">
                  👥 Friends
                </h2>

                <div className="flex justify-between items-center mb-3">
                  <span className="text-sm text-gray-400">
                    {socialStats.friendsCount || 0} friends
                  </span>
                  <Link
                    to="/friends"
                    className="text-xs bg-minecraft-habbo-green/20 text-minecraft-habbo-green px-2 py-1 rounded hover:bg-minecraft-habbo-green/30 transition-colors"
                  >
                    See All
                  </Link>
                </div>

                <div className="space-y-1">
                  {socialStats.loading ? (
                    <div className="text-center py-4">
                      <LoadingSpinner size="small" />
                    </div>
                  ) : socialStats.error ? (
                    <div className="text-center text-red-400 py-4">
                      Failed to load friends
                    </div>
                  ) : socialStats.friends.length === 0 ? (
                    <div className="text-center text-gray-400 py-4">
                      No friends yet
                    </div>
                  ) : (
                    socialStats.friends
                      .slice(0, 5)
                      .map((friend) => (
                        <FriendItem
                          key={friend._id}
                          username={friend.username}
                          status={friend.status}
                          online={friend.online}
                        />
                      ))
                  )}
                </div>
              </div>
            </div>

            {/* Main Content Area */}
            <div className="lg:col-span-2">
              {/* Wall Tab */}
              {selectedTab === "wall" && (
                <div>
                  {/* Post to Wall Form */}
                  <div className="habbo-card p-5 rounded-md mb-6">
                    <h2 className="text-lg font-minecraft text-minecraft-habbo-blue mb-4">
                      {isOwnProfile
                        ? "Update Your Status"
                        : `Write on ${profileUser.username}'s Wall`}
                    </h2>

                    <form
                      onSubmit={async (e) => {
                        e.preventDefault();
                        if (!newWallPost.trim()) return;
                        try {
                          await handleCreateWallPost(newWallPost);
                          setNewWallPost("");
                        } catch (err) {
                          setNotification({
                            show: true,
                            type: "error",
                            message: "Failed to create post. Please try again.",
                          });
                          setNewWallPost(newWallPost); // restore input if failed
                        }
                      }}
                    >
                      <textarea
                        value={newWallPost}
                        onChange={(e) => setNewWallPost(e.target.value)}
                        className="w-full p-3 bg-minecraft-navy-light border border-white/10 rounded-md text-white placeholder-gray-500 focus:border-minecraft-habbo-blue focus:ring focus:ring-minecraft-habbo-blue focus:ring-opacity-50"
                        placeholder={
                          isOwnProfile
                            ? "What's on your mind?"
                            : `Write something to ${profileUser.username}...`
                        }
                        rows={3}
                      ></textarea>
                      <div className="flex justify-between items-center mt-3">
                        <div className="flex items-center space-x-2">
                          <button
                            type="button"
                            className="bg-minecraft-navy-light hover:bg-minecraft-navy p-2 rounded-md"
                            title="Add Image"
                          >
                            <PhotoIcon className="h-5 w-5 text-gray-400" />
                          </button>
                          <button
                            type="button"
                            className="bg-minecraft-navy-light hover:bg-minecraft-navy p-2 rounded-md"
                            title="Add Emoji"
                          >
                            <span className="text-xl">😊</span>
                          </button>
                        </div>
                        <button
                          type="submit"
                          className="habbo-btn px-4 py-2"
                          disabled={!newWallPost.trim() || wallLoading}
                        >
                          {wallLoading ? "Posting..." : "Post"}
                        </button>
                      </div>
                    </form>
                  </div>
                  {/* Manage Posts Icon Button (only for profile owner) */}
                  {isOwnProfile && (
                    <div className="flex justify-end mb-2">
                      <button
                        onClick={openManagePostsModal}
                        className="p-2 rounded-full bg-minecraft-navy-light hover:bg-minecraft-habbo-blue transition-colors relative group"
                        title="Manage Posts"
                        aria-label="Manage Posts"
                      >
                        <Cog6ToothIcon className="h-6 w-6 text-gray-300 group-hover:text-white" />
                        <span className="absolute right-full mr-2 top-1/2 -translate-y-1/2 bg-black text-white text-xs rounded px-2 py-1 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
                          Manage Posts
                        </span>
                      </button>
                    </div>
                  )}

                  {/* Wall Posts */}
                  <div className="space-y-4">
                    {wallError && (
                      <div className="bg-red-500/10 text-red-400 p-4 rounded-md mb-4">
                        {wallError}
                      </div>
                    )}

                    {wallLoading ? (
                      <div className="text-center py-8">
                        <LoadingSpinner />
                      </div>
                    ) : wallPosts.length === 0 ? (
                      <div className="text-center py-12">
                        <ChatBubbleOvalLeftIcon className="h-16 w-16 text-gray-600 mx-auto mb-4" />
                        <p className="text-lg text-gray-400">
                          No wall posts yet
                        </p>
                        <p className="text-sm text-gray-500 max-w-md mx-auto mt-2">
                          {isOwnProfile
                            ? "Share what's on your mind or what you've been up to in Minecraft!"
                            : `Be the first to write on ${profileUser.username}'s wall!`}
                        </p>
                      </div>
                    ) : (
                      <>
                        {renderedWallPosts}

                        {/* Pagination */}
                        {wallTotalPages > 1 && (
                          <div className="flex justify-center mt-6 space-x-2">
                            <button
                              onClick={() =>
                                setWallPage((prev) => Math.max(prev - 1, 1))
                              }
                              disabled={wallPage === 1}
                              className={`px-3 py-1 rounded-md ${
                                wallPage === 1
                                  ? "bg-gray-700 text-gray-500 cursor-not-allowed"
                                  : "bg-minecraft-navy-light hover:bg-minecraft-navy text-white"
                              }`}
                            >
                              Previous
                            </button>
                            <span className="px-3 py-1 bg-minecraft-navy-dark text-white rounded-md">
                              Page {wallPage} of {wallTotalPages}
                            </span>
                            <button
                              onClick={() =>
                                setWallPage((prev) =>
                                  Math.min(prev + 1, wallTotalPages),
                                )
                              }
                              disabled={wallPage === wallTotalPages}
                              className={`px-3 py-1 rounded-md ${
                                wallPage === wallTotalPages
                                  ? "bg-gray-700 text-gray-500 cursor-not-allowed"
                                  : "bg-minecraft-navy-light hover:bg-minecraft-navy text-white"
                              }`}
                            >
                              Next
                            </button>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Info Tab */}
              {selectedTab === "info" && (
                <div className="habbo-card p-5 rounded-md">
                  <h2 className="text-lg font-minecraft text-minecraft-habbo-blue mb-4 border-b border-white/10 pb-2">
                    Player Information
                  </h2>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Account Information */}
                    <div>
                      <h3 className="text-md font-minecraft text-minecraft-habbo-green mb-3 flex items-center">
                        <UserIcon className="h-5 w-5 mr-2" />
                        Account Information
                      </h3>

                      <div className="space-y-3 text-sm">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-400">Username:</span>
                          <span className="flex items-center">
                            {profileUser.username}
                            {profileUser.verified && (
                              <CheckIcon
                                className="h-4 w-4 text-green-500 ml-1"
                                title="Verified Account"
                              />
                            )}
                          </span>
                        </div>

                        {profileUser.email && isOwnProfile && (
                          <div className="flex justify-between">
                            <span className="text-gray-400">Email:</span>
                            <span className="text-sm">{profileUser.email}</span>
                          </div>
                        )}

                        <div className="flex justify-between">
                          <span className="text-gray-400">Web Rank:</span>
                          <span className="text-minecraft-habbo-yellow">
                            {profileUser.webRank || "Member"}
                          </span>
                        </div>

                        <div className="flex justify-between">
                          <span className="text-gray-400">Joined:</span>
                          <span>{formatDate(profileUser.createdAt)}</span>
                        </div>

                        <div className="flex justify-between">
                          <span className="text-gray-400">Last Login:</span>
                          <span>
                            {profileUser.lastLogin
                              ? formatDate(profileUser.lastLogin)
                              : "Unknown"}
                          </span>
                        </div>

                        {profileUser.twoFactorEnabled !== undefined &&
                          isOwnProfile && (
                            <div className="flex justify-between">
                              <span className="text-gray-400">
                                2FA Enabled:
                              </span>
                              <span
                                className={
                                  profileUser.twoFactorEnabled
                                    ? "text-green-500"
                                    : "text-red-500"
                                }
                              >
                                {profileUser.twoFactorEnabled ? "Yes" : "No"}
                              </span>
                            </div>
                          )}
                      </div>
                    </div>

                    {/* Minecraft Connection */}
                    <div>
                      <h3 className="text-md font-minecraft text-minecraft-habbo-green mb-3 flex items-center">
                        <CubeIcon className="h-5 w-5 mr-2" />
                        Minecraft Connection
                      </h3>

                      <div className="space-y-3 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-400">
                            Minecraft Linked:
                          </span>
                          <span
                            className={
                              profileUser.isLinked || profileUser.linked
                                ? "text-green-500"
                                : "text-red-500"
                            }
                          >
                            {profileUser.isLinked || profileUser.linked
                              ? "Yes"
                              : "No"}
                          </span>
                        </div>

                        {(profileUser.mcUsername ||
                          profileUser.minecraftUsername) && (
                          <div className="flex justify-between">
                            <span className="text-gray-400">MC Username:</span>
                            <span>
                              {profileUser.mcUsername ||
                                profileUser.minecraftUsername}
                            </span>
                          </div>
                        )}

                        {(profileUser.mcUUID || profileUser.minecraftUUID) && (
                          <div className="flex justify-between">
                            <span className="text-gray-400">MC UUID:</span>
                            <span className="font-mono text-xs break-all">
                              {profileUser.mcUUID || profileUser.minecraftUUID}
                            </span>
                          </div>
                        )}

                        {profileUser.mcLinkedAt && (
                          <div className="flex justify-between">
                            <span className="text-gray-400">Linked At:</span>
                            <span>{formatDate(profileUser.mcLinkedAt)}</span>
                          </div>
                        )}

                        {playerStats?.minecraft?.stats && (
                          <>
                            <div className="flex justify-between">
                              <span className="text-gray-400">
                                Server Status:
                              </span>
                              <span
                                className={
                                  playerStats.minecraft.stats.online
                                    ? "text-green-500"
                                    : "text-gray-500"
                                }
                              >
                                {playerStats.minecraft.stats.online
                                  ? "Online"
                                  : "Offline"}
                              </span>
                            </div>

                            <div className="flex justify-between">
                              <span className="text-gray-400">
                                Current World:
                              </span>
                              <span>
                                {playerStats.minecraft.stats.world ||
                                  playerStats.world ||
                                  "Unknown"}
                              </span>
                            </div>

                            <div className="flex justify-between">
                              <span className="text-gray-400">Gamemode:</span>
                              <span>
                                {playerStats.minecraft.stats.gamemode ||
                                  playerStats.gamemode ||
                                  "SURVIVAL"}
                              </span>
                            </div>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Ranks and Permissions */}
                    <div>
                      <h3 className="text-md font-minecraft text-minecraft-habbo-green mb-3 flex items-center">
                        <TrophyIcon className="h-5 w-5 mr-2" />
                        Ranks & Groups
                      </h3>

                      <div className="space-y-3 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-400">Primary Group:</span>
                          <span className="text-minecraft-habbo-yellow">
                            {playerStats?.minecraft?.stats?.group ||
                              playerStats?.group ||
                              "default"}
                          </span>
                        </div>

                        {playerStats?.minecraft?.stats?.groups && (
                          <div>
                            <span className="text-gray-400 block mb-1">
                              All Groups:
                            </span>
                            <div className="flex flex-wrap gap-1">
                              {playerStats.minecraft.stats.groups.map(
                                (group, index) => (
                                  <span
                                    key={index}
                                    className="bg-minecraft-navy-light px-2 py-1 rounded text-xs"
                                  >
                                    {group}
                                  </span>
                                ),
                              )}
                            </div>
                          </div>
                        )}

                        {profileUser.minecraftRanks &&
                          profileUser.minecraftRanks.length > 0 && (
                            <div>
                              <span className="text-gray-400 block mb-2">
                                Server Ranks:
                              </span>
                              <div className="space-y-2">
                                {profileUser.minecraftRanks.map(
                                  (rank, index) => (
                                    <div
                                      key={index}
                                      className="bg-minecraft-navy-light p-2 rounded"
                                    >
                                      <div className="flex justify-between">
                                        <span className="font-medium">
                                          {rank.rank}
                                        </span>
                                        <span className="text-xs text-gray-400">
                                          {rank.server}
                                        </span>
                                      </div>
                                      {rank.isOperator && (
                                        <span className="text-xs text-red-400">
                                          Operator
                                        </span>
                                      )}
                                    </div>
                                  ),
                                )}
                              </div>
                            </div>
                          )}

                        {playerStats?.minecraft?.stats?.op && (
                          <div className="flex justify-between">
                            <span className="text-gray-400">
                              Server Operator:
                            </span>
                            <span className="text-red-400">Yes</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Preferences & Settings */}
                    {profileUser.preferences && isOwnProfile && (
                      <div>
                        <h3 className="text-md font-minecraft text-minecraft-habbo-green mb-3 flex items-center">
                          <Cog6ToothIcon className="h-5 w-5 mr-2" />
                          Preferences
                        </h3>

                        <div className="space-y-3 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-400">Theme:</span>
                            <span className="capitalize">
                              {profileUser.preferences.theme || "default"}
                            </span>
                          </div>

                          <div className="flex justify-between">
                            <span className="text-gray-400">
                              Email Notifications:
                            </span>
                            <span
                              className={
                                profileUser.preferences.emailNotifications
                                  ? "text-green-500"
                                  : "text-red-500"
                              }
                            >
                              {profileUser.preferences.emailNotifications
                                ? "Enabled"
                                : "Disabled"}
                            </span>
                          </div>

                          <div className="flex justify-between">
                            <span className="text-gray-400">
                              Show Online Status:
                            </span>
                            <span
                              className={
                                profileUser.preferences.showOnlineStatus
                                  ? "text-green-500"
                                  : "text-red-500"
                              }
                            >
                              {profileUser.preferences.showOnlineStatus
                                ? "Public"
                                : "Private"}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Location & Activity */}
                    {playerStats?.minecraft?.stats?.location && (
                      <div>
                        <h3 className="text-md font-minecraft text-minecraft-habbo-green mb-3 flex items-center">
                          <MapPinIcon className="h-5 w-5 mr-2" />
                          Current Location
                        </h3>

                        <div className="space-y-3 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-400">World:</span>
                            <span>
                              {playerStats.minecraft.stats.location.world}
                            </span>
                          </div>

                          <div className="flex justify-between">
                            <span className="text-gray-400">Dimension:</span>
                            <span className="capitalize">
                              {playerStats.minecraft.stats.location.dimension}
                            </span>
                          </div>

                          <div className="flex justify-between">
                            <span className="text-gray-400">Biome:</span>
                            <span className="capitalize">
                              {playerStats.minecraft.stats.location.biome?.replace(
                                /_/g,
                                " ",
                              )}
                            </span>
                          </div>

                          <div className="flex justify-between">
                            <span className="text-gray-400">Coordinates:</span>
                            <span className="font-mono text-xs">
                              {Math.round(
                                playerStats.minecraft.stats.location.x,
                              )}
                              ,{" "}
                              {Math.round(
                                playerStats.minecraft.stats.location.y,
                              )}
                              ,{" "}
                              {Math.round(
                                playerStats.minecraft.stats.location.z,
                              )}
                            </span>
                          </div>

                          <div className="flex justify-between">
                            <span className="text-gray-400">Direction:</span>
                            <span className="capitalize">
                              {playerStats.minecraft.stats.location.direction}
                            </span>
                          </div>

                          <div className="flex justify-between">
                            <span className="text-gray-400">Light Level:</span>
                            <span>
                              {playerStats.minecraft.stats.location.light_level}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* External Links */}
                    <div>
                      <h3 className="text-md font-minecraft text-minecraft-habbo-green mb-3 flex items-center">
                        <GlobeAltIcon className="h-5 w-5 mr-2" />
                        External Links
                      </h3>

                      <div className="space-y-3 text-sm">
                        <a
                          href={`https://namemc.com/profile/${profileUser.mcUsername || profileUser.minecraftUsername || profileUser.username}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block bg-minecraft-navy-light hover:bg-minecraft-navy-dark p-3 rounded-md text-minecraft-habbo-blue"
                        >
                          <div className="flex items-center">
                            <GlobeAltIcon className="h-4 w-4 mr-2" />
                            View on NameMC
                          </div>
                        </a>

                        <a
                          href={`https://mc-heads.net/body/${profileUser.mcUsername || profileUser.minecraftUsername || profileUser.username}/right`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block bg-minecraft-navy-light hover:bg-minecraft-navy-dark p-3 rounded-md text-minecraft-habbo-blue"
                        >
                          <div className="flex items-center">
                            <PhotoIcon className="h-4 w-4 mr-2" />
                            View Full Skin
                          </div>
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Stats Tab */}
              {selectedTab === "stats" && (
                <div className="space-y-6">
                  {/* Header Stats Overview */}
                  <div className="habbo-card p-5 rounded-md">
                    <h2 className="text-lg font-minecraft text-minecraft-habbo-blue mb-4 border-b border-white/10 pb-2">
                      Player Statistics Overview
                    </h2>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <StatCard
                        icon={<ClockIcon className="h-5 w-5" />}
                        label="Playtime"
                        value={
                          playerStats?.minecraft?.stats?.playtime ||
                          playerStats?.playtime ||
                          "0h"
                        }
                      />
                      <StatCard
                        icon={<TrophyIcon className="h-5 w-5" />}
                        label="Level"
                        value={
                          playerStats?.minecraft?.stats?.level ||
                          playerStats?.level ||
                          playerStats?.minecraft?.stats?.exp_level ||
                          0
                        }
                      />
                      <StatCard
                        icon={<CurrencyDollarIcon className="h-5 w-5" />}
                        label="Balance"
                        value={`$${(playerStats?.minecraft?.stats?.balance || 0).toLocaleString()}`}
                      />
                      <StatCard
                        icon={<HeartIcon className="h-5 w-5" />}
                        label="Health"
                        value={`${playerStats?.minecraft?.stats?.health || 20}/20`}
                      />
                    </div>
                  </div>

                  {/* Core Game Statistics */}
                  <div className="habbo-card p-5 rounded-md">
                    <h3 className="text-lg font-minecraft text-minecraft-habbo-green mb-4 flex items-center">
                      <ChartBarIcon className="h-5 w-5 mr-2" />
                      Core Game Statistics
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {/* Mining & Building */}
                      <div>
                        <h4 className="text-sm font-minecraft text-minecraft-habbo-yellow mb-3">
                          Mining & Building
                        </h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-400">Blocks Mined:</span>
                            <span>
                              {(
                                playerStats?.minecraft?.stats?.blocks_mined || 0
                              ).toLocaleString()}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">
                              Items Crafted:
                            </span>
                            <span>
                              {(
                                playerStats?.minecraft?.stats?.items_crafted ||
                                0
                              ).toLocaleString()}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">
                              Distance Traveled:
                            </span>
                            <span>
                              {Math.round(
                                (playerStats?.minecraft?.stats
                                  ?.distance_traveled || 0) / 1000,
                              )}
                              km
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Jumps:</span>
                            <span>
                              {(
                                playerStats?.minecraft?.stats?.jumps || 0
                              ).toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Combat & Survival */}
                      <div>
                        <h4 className="text-sm font-minecraft text-minecraft-habbo-yellow mb-3">
                          Combat & Survival
                        </h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-400">Mobs Killed:</span>
                            <span>
                              {(
                                playerStats?.minecraft?.stats?.mobs_killed || 0
                              ).toLocaleString()}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Player Kills:</span>
                            <span>
                              {(
                                playerStats?.minecraft?.stats?.player_kills || 0
                              ).toLocaleString()}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Deaths:</span>
                            <span>
                              {(
                                playerStats?.minecraft?.stats?.deaths || 0
                              ).toLocaleString()}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Damage Dealt:</span>
                            <span>
                              {Math.round(
                                (playerStats?.minecraft?.stats?.damage_dealt ||
                                  0) / 100,
                              )}
                              ❤
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Damage Taken:</span>
                            <span>
                              {Math.round(
                                (playerStats?.minecraft?.stats?.damage_taken ||
                                  0) / 100,
                              )}
                              ❤
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Exploration & Activities */}
                      <div>
                        <h4 className="text-sm font-minecraft text-minecraft-habbo-yellow mb-3">
                          Exploration & Activities
                        </h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-400">Fish Caught:</span>
                            <span>
                              {(
                                playerStats?.minecraft?.stats?.fish_caught || 0
                              ).toLocaleString()}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Animals Bred:</span>
                            <span>
                              {(
                                playerStats?.minecraft?.stats?.animals_bred || 0
                              ).toLocaleString()}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Raids Won:</span>
                            <span>
                              {(
                                playerStats?.minecraft?.stats?.raids_won || 0
                              ).toLocaleString()}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Experience:</span>
                            <span>
                              {(
                                playerStats?.minecraft?.stats?.experience || 0
                              ).toLocaleString()}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Achievements:</span>
                            <span>
                              {playerStats?.minecraft?.stats?.achievements ||
                                playerStats?.minecraft?.stats
                                  ?.achievement_percentage ||
                                0}
                              %
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Activity Status */}
                  {playerStats?.minecraft?.stats?.activity && (
                    <div className="habbo-card p-5 rounded-md">
                      <h3 className="text-lg font-minecraft text-minecraft-habbo-green mb-4 flex items-center">
                        <UserIcon className="h-5 w-5 mr-2" />
                        Current Activity
                      </h3>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="text-center">
                          <div
                            className={`text-2xl mb-1 ${playerStats.minecraft.stats.activity.flying ? "text-blue-400" : "text-gray-500"}`}
                          >
                            🪶
                          </div>
                          <div className="text-sm">
                            <div
                              className={
                                playerStats.minecraft.stats.activity.flying
                                  ? "text-blue-400"
                                  : "text-gray-500"
                              }
                            >
                              Flying
                            </div>
                            <div className="text-xs text-gray-400">
                              {Math.round(
                                playerStats.minecraft.stats.activity
                                  .avg_fly_speed * 100,
                              ) / 100}{" "}
                              m/s
                            </div>
                          </div>
                        </div>

                        <div className="text-center">
                          <div
                            className={`text-2xl mb-1 ${playerStats.minecraft.stats.activity.swimming ? "text-blue-400" : "text-gray-500"}`}
                          >
                            🏊
                          </div>
                          <div className="text-sm">
                            <div
                              className={
                                playerStats.minecraft.stats.activity.swimming
                                  ? "text-blue-400"
                                  : "text-gray-500"
                              }
                            >
                              Swimming
                            </div>
                            <div className="text-xs text-gray-400">
                              {Math.round(
                                playerStats.minecraft.stats.activity
                                  .avg_swim_speed * 100,
                              ) / 100}{" "}
                              m/s
                            </div>
                          </div>
                        </div>

                        <div className="text-center">
                          <div
                            className={`text-2xl mb-1 ${playerStats.minecraft.stats.activity.sprinting ? "text-green-400" : "text-gray-500"}`}
                          >
                            🏃
                          </div>
                          <div className="text-sm">
                            <div
                              className={
                                playerStats.minecraft.stats.activity.sprinting
                                  ? "text-green-400"
                                  : "text-gray-500"
                              }
                            >
                              Sprinting
                            </div>
                            <div className="text-xs text-gray-400">
                              {Math.round(
                                playerStats.minecraft.stats.activity
                                  .avg_walk_speed * 100,
                              ) / 100}{" "}
                              m/s
                            </div>
                          </div>
                        </div>

                        <div className="text-center">
                          <div
                            className={`text-2xl mb-1 ${playerStats.minecraft.stats.activity.sneaking ? "text-yellow-400" : "text-gray-500"}`}
                          >
                            🤫
                          </div>
                          <div className="text-sm">
                            <div
                              className={
                                playerStats.minecraft.stats.activity.sneaking
                                  ? "text-yellow-400"
                                  : "text-gray-500"
                              }
                            >
                              Sneaking
                            </div>
                          </div>
                        </div>
                      </div>

                      {playerStats.minecraft.stats.activity.last_activity && (
                        <div className="mt-4 p-3 bg-minecraft-navy-light rounded">
                          <div className="text-sm">
                            <span className="text-gray-400">
                              Last Activity:
                            </span>{" "}
                            {
                              playerStats.minecraft.stats.activity.last_activity
                                .activity
                            }
                          </div>
                          <div className="text-xs text-gray-400 mt-1">
                            {
                              playerStats.minecraft.stats.activity.last_activity
                                .location
                            }
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* mcMMO Skills */}
                  {playerStats?.minecraft?.stats?.mcmmo_data && (
                    <div className="habbo-card p-5 rounded-md">
                      <h3 className="text-lg font-minecraft text-minecraft-habbo-green mb-4 flex items-center">
                        <TrophyIcon className="h-5 w-5 mr-2" />
                        mcMMO Skills
                        <span className="ml-auto text-minecraft-habbo-yellow text-sm">
                          Power Level:{" "}
                          {playerStats.minecraft.stats.mcmmo_data.power_level}
                        </span>
                      </h3>

                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {Object.entries(
                          playerStats.minecraft.stats.mcmmo_data.skills,
                        ).map(([skill, level]) => (
                          <div
                            key={skill}
                            className="bg-minecraft-navy-light p-3 rounded"
                          >
                            <div className="text-sm font-medium capitalize mb-1">
                              {skill.replace(/_/g, " ")}
                            </div>
                            <div className="text-lg font-minecraft text-minecraft-habbo-blue">
                              {level}
                            </div>
                            <div className="w-full bg-gray-700 rounded-full h-2 mt-2">
                              <div
                                className="bg-minecraft-habbo-blue h-2 rounded-full"
                                style={{
                                  width: `${Math.min((level / 100) * 100, 100)}%`,
                                }}
                              ></div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Economy Statistics */}
                  <div className="habbo-card p-5 rounded-md">
                    <h3 className="text-lg font-minecraft text-minecraft-habbo-green mb-4 flex items-center">
                      <CurrencyDollarIcon className="h-5 w-5 mr-2" />
                      Economy Statistics
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="text-center p-4 bg-minecraft-navy-light rounded">
                        <div className="text-2xl font-minecraft text-green-400 mb-2">
                          $
                          {(
                            playerStats?.minecraft?.stats?.balance || 0
                          ).toLocaleString()}
                        </div>
                        <div className="text-sm text-gray-400">
                          Current Balance
                        </div>
                      </div>

                      <div className="text-center p-4 bg-minecraft-navy-light rounded">
                        <div className="text-2xl font-minecraft text-blue-400 mb-2">
                          $
                          {(
                            playerStats?.minecraft?.stats?.money_earned_today ||
                            0
                          ).toLocaleString()}
                        </div>
                        <div className="text-sm text-gray-400">
                          Earned Today
                        </div>
                      </div>

                      <div className="text-center p-4 bg-minecraft-navy-light rounded">
                        <div className="text-2xl font-minecraft text-red-400 mb-2">
                          $
                          {(
                            playerStats?.minecraft?.stats?.money_spent_today ||
                            0
                          ).toLocaleString()}
                        </div>
                        <div className="text-sm text-gray-400">Spent Today</div>
                      </div>
                    </div>
                  </div>

                  {/* Progress & Achievements */}
                  <div className="habbo-card p-5 rounded-md">
                    <h3 className="text-lg font-minecraft text-minecraft-habbo-green mb-4 flex items-center">
                      <CheckIcon className="h-5 w-5 mr-2" />
                      Progress & Achievements
                    </h3>

                    <div className="space-y-4">
                      {/* Achievement Progress */}
                      <div>
                        <div className="flex justify-between mb-2">
                          <span className="text-sm text-gray-400">
                            Achievement Progress
                          </span>
                          <span className="text-sm text-minecraft-habbo-blue">
                            {playerStats?.minecraft?.stats
                              ?.achievement_percentage || 0}
                            %
                          </span>
                        </div>
                        <div className="w-full bg-gray-700 rounded-full h-3">
                          <div
                            className="bg-gradient-to-r from-minecraft-habbo-blue to-minecraft-habbo-green h-3 rounded-full transition-all duration-300"
                            style={{
                              width: `${playerStats?.minecraft?.stats?.achievement_percentage || 0}%`,
                            }}
                          ></div>
                        </div>
                      </div>

                      {/* Level Progress */}
                      {playerStats?.minecraft?.stats?.exp_level && (
                        <div>
                          <div className="flex justify-between mb-2">
                            <span className="text-sm text-gray-400">
                              Level Progress
                            </span>
                            <span className="text-sm text-minecraft-habbo-blue">
                              Level {playerStats.minecraft.stats.exp_level}
                            </span>
                          </div>
                          <div className="w-full bg-gray-700 rounded-full h-3">
                            <div
                              className="bg-gradient-to-r from-green-400 to-blue-400 h-3 rounded-full transition-all duration-300"
                              style={{
                                width: `${
                                  playerStats.minecraft.stats.exp_to_level
                                    ? ((playerStats.minecraft.stats.experience %
                                        1000) /
                                        1000) *
                                      100
                                    : 50
                                }%`,
                              }}
                            ></div>
                          </div>
                        </div>
                      )}

                      {/* Recent Advancements */}
                      {playerStats?.minecraft?.stats?.advancements &&
                        playerStats.minecraft.stats.advancements.length > 0 && (
                          <div>
                            <div className="text-sm text-gray-400 mb-2">
                              Recent Advancements
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                              {playerStats.minecraft.stats.advancements
                                .slice(-6)
                                .map((advancement, index) => (
                                  <div
                                    key={index}
                                    className="bg-minecraft-navy-light p-2 rounded text-xs"
                                  >
                                    {advancement
                                      .replace(/minecraft:|_/g, " ")
                                      .replace(/^\w/, (c) => c.toUpperCase())}
                                  </div>
                                ))}
                            </div>
                          </div>
                        )}
                    </div>
                  </div>

                  {/* Server Information */}
                  {playerStats?.minecraft?.stats?.placeholders && (
                    <div className="habbo-card p-5 rounded-md">
                      <h3 className="text-lg font-minecraft text-minecraft-habbo-green mb-4 flex items-center">
                        <GlobeAltIcon className="h-5 w-5 mr-2" />
                        Server Information
                      </h3>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-400">Server TPS:</span>
                          <span className="text-green-400">
                            {
                              playerStats.minecraft.stats.placeholders
                                .server_tps
                            }
                          </span>
                        </div>

                        <div className="flex justify-between">
                          <span className="text-gray-400">Online Players:</span>
                          <span>
                            {
                              playerStats.minecraft.stats.placeholders
                                .server_online
                            }
                            /
                            {
                              playerStats.minecraft.stats.placeholders
                                .server_max_players
                            }
                          </span>
                        </div>

                        <div className="flex justify-between">
                          <span className="text-gray-400">Player Ping:</span>
                          <span>
                            {
                              playerStats.minecraft.stats.placeholders
                                .player_ping
                            }
                            ms
                          </span>
                        </div>

                        <div className="flex justify-between">
                          <span className="text-gray-400">Server Uptime:</span>
                          <span>
                            {
                              playerStats.minecraft.stats.placeholders
                                .server_uptime
                            }
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Inventory Tab */}
              {selectedTab === "inventory" && (
                <div className="space-y-6">
                  {playerStats?.minecraft?.stats?.inventory ? (
                    <>
                      {/* Inventory Overview */}
                      <div className="habbo-card p-5 rounded-md">
                        <h2 className="text-lg font-minecraft text-minecraft-habbo-blue mb-4 border-b border-white/10 pb-2">
                          Inventory Overview
                        </h2>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                          <StatCard
                            icon={<CurrencyDollarIcon className="h-5 w-5" />}
                            label="Estimated Value"
                            value={`$${(playerStats.minecraft.stats.inventory.estimated_value || 0).toLocaleString()}`}
                          />
                          <StatCard
                            icon={<CubeIcon className="h-5 w-5" />}
                            label="Total Items"
                            value={
                              playerStats.minecraft.stats.inventory.valuables
                                ?.total_items || 0
                            }
                          />
                          <StatCard
                            icon={<PhotoIcon className="h-5 w-5" />}
                            label="Enchanted Items"
                            value={
                              playerStats.minecraft.stats.inventory.valuables
                                ?.enchanted_items || 0
                            }
                          />
                          <StatCard
                            icon={<UserIcon className="h-5 w-5" />}
                            label="Tools & Weapons"
                            value={
                              (playerStats.minecraft.stats.inventory.valuables
                                ?.tools || 0) +
                              (playerStats.minecraft.stats.inventory.valuables
                                ?.weapons || 0)
                            }
                          />
                        </div>
                      </div>

                      {/* Valuable Items Breakdown */}
                      {playerStats.minecraft.stats.inventory.valuables && (
                        <div className="habbo-card p-5 rounded-md">
                          <h3 className="text-lg font-minecraft text-minecraft-habbo-green mb-4 flex items-center">
                            <GiftIcon className="h-5 w-5 mr-2" />
                            Valuable Items
                          </h3>

                          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            <div className="bg-minecraft-navy-light p-4 rounded text-center">
                              <div className="text-2xl mb-2">💎</div>
                              <div className="text-lg font-minecraft text-blue-400">
                                {
                                  playerStats.minecraft.stats.inventory
                                    .valuables.diamond
                                }
                              </div>
                              <div className="text-xs text-gray-400">
                                Diamond
                              </div>
                            </div>

                            <div className="bg-minecraft-navy-light p-4 rounded text-center">
                              <div className="text-2xl mb-2">🟦</div>
                              <div className="text-lg font-minecraft text-gray-300">
                                {
                                  playerStats.minecraft.stats.inventory
                                    .valuables.netherite
                                }
                              </div>
                              <div className="text-xs text-gray-400">
                                Netherite
                              </div>
                            </div>

                            <div className="bg-minecraft-navy-light p-4 rounded text-center">
                              <div className="text-2xl mb-2">💚</div>
                              <div className="text-lg font-minecraft text-green-400">
                                {
                                  playerStats.minecraft.stats.inventory
                                    .valuables.emerald
                                }
                              </div>
                              <div className="text-xs text-gray-400">
                                Emerald
                              </div>
                            </div>

                            <div className="bg-minecraft-navy-light p-4 rounded text-center">
                              <div className="text-2xl mb-2">🟨</div>
                              <div className="text-lg font-minecraft text-yellow-400">
                                {
                                  playerStats.minecraft.stats.inventory
                                    .valuables.gold
                                }
                              </div>
                              <div className="text-xs text-gray-400">Gold</div>
                            </div>

                            <div className="bg-minecraft-navy-light p-4 rounded text-center">
                              <div className="text-2xl mb-2">🤎</div>
                              <div className="text-lg font-minecraft text-orange-300">
                                {
                                  playerStats.minecraft.stats.inventory
                                    .valuables.iron
                                }
                              </div>
                              <div className="text-xs text-gray-400">Iron</div>
                            </div>

                            <div className="bg-minecraft-navy-light p-4 rounded text-center">
                              <div className="text-2xl mb-2">🔵</div>
                              <div className="text-lg font-minecraft text-blue-500">
                                {
                                  playerStats.minecraft.stats.inventory
                                    .valuables.lapis
                                }
                              </div>
                              <div className="text-xs text-gray-400">Lapis</div>
                            </div>

                            <div className="bg-minecraft-navy-light p-4 rounded text-center">
                              <div className="text-2xl mb-2">🔴</div>
                              <div className="text-lg font-minecraft text-red-400">
                                {
                                  playerStats.minecraft.stats.inventory
                                    .valuables.redstone
                                }
                              </div>
                              <div className="text-xs text-gray-400">
                                Redstone
                              </div>
                            </div>

                            <div className="bg-minecraft-navy-light p-4 rounded text-center">
                              <div className="text-2xl mb-2">⚫</div>
                              <div className="text-lg font-minecraft text-gray-600">
                                {
                                  playerStats.minecraft.stats.inventory
                                    .valuables.coal
                                }
                              </div>
                              <div className="text-xs text-gray-400">Coal</div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Hotbar */}
                      {playerStats.minecraft.stats.inventory.hotbar && (
                        <div className="habbo-card p-5 rounded-md">
                          <h3 className="text-lg font-minecraft text-minecraft-habbo-green mb-4 flex items-center">
                            <BookmarkIcon className="h-5 w-5 mr-2" />
                            Hotbar
                          </h3>

                          <div className="grid grid-cols-9 gap-2">
                            {playerStats.minecraft.stats.inventory.hotbar.map(
                              (slot, index) => (
                                <div
                                  key={index}
                                  className={`aspect-square border-2 rounded ${
                                    slot.empty
                                      ? "border-gray-600 bg-gray-800/50"
                                      : "border-minecraft-habbo-blue bg-minecraft-navy-light"
                                  } flex items-center justify-center relative`}
                                >
                                  <div className="absolute top-1 left-1 text-xs text-gray-400">
                                    {slot.slot + 1}
                                  </div>
                                  {!slot.empty && (
                                    <div className="text-center">
                                      <div className="text-xs text-minecraft-habbo-blue mb-1">
                                        {slot.type
                                          ?.replace("minecraft:", "")
                                          .replace(/_/g, " ")}
                                      </div>
                                      {slot.amount && slot.amount > 1 && (
                                        <div className="text-xs text-gray-300">
                                          {slot.amount}
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              ),
                            )}
                          </div>
                        </div>
                      )}

                      {/* Main Inventory Preview */}
                      {playerStats.minecraft.stats.inventory.main_inventory && (
                        <div className="habbo-card p-5 rounded-md">
                          <h3 className="text-lg font-minecraft text-minecraft-habbo-green mb-4 flex items-center">
                            <CubeIcon className="h-5 w-5 mr-2" />
                            Main Inventory
                          </h3>

                          <div className="grid grid-cols-9 gap-1">
                            {playerStats.minecraft.stats.inventory.main_inventory
                              .slice(0, 27)
                              .map((slot, index) => (
                                <div
                                  key={index}
                                  className={`aspect-square border rounded text-xs ${
                                    slot.empty
                                      ? "border-gray-600 bg-gray-800/30"
                                      : "border-minecraft-habbo-blue bg-minecraft-navy-light"
                                  } flex items-center justify-center`}
                                >
                                  {!slot.empty && (
                                    <div className="w-2 h-2 bg-minecraft-habbo-blue rounded"></div>
                                  )}
                                </div>
                              ))}
                          </div>

                          <div className="mt-4 text-center text-sm text-gray-400">
                            {
                              playerStats.minecraft.stats.inventory.main_inventory.filter(
                                (slot) => !slot.empty,
                              ).length
                            }{" "}
                            /{" "}
                            {
                              playerStats.minecraft.stats.inventory
                                .main_inventory.length
                            }{" "}
                            slots occupied
                          </div>
                        </div>
                      )}

                      {/* Equipment Stats */}
                      {playerStats.minecraft.stats.inventory.valuables && (
                        <div className="habbo-card p-5 rounded-md">
                          <h3 className="text-lg font-minecraft text-minecraft-habbo-green mb-4 flex items-center">
                            <BriefcaseIcon className="h-5 w-5 mr-2" />
                            Equipment & Supplies
                          </h3>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="text-center">
                              <div className="text-3xl mb-2">⚔️</div>
                              <div className="text-lg font-minecraft text-red-400">
                                {
                                  playerStats.minecraft.stats.inventory
                                    .valuables.weapons
                                }
                              </div>
                              <div className="text-sm text-gray-400">
                                Weapons
                              </div>
                            </div>

                            <div className="text-center">
                              <div className="text-3xl mb-2">🔧</div>
                              <div className="text-lg font-minecraft text-blue-400">
                                {
                                  playerStats.minecraft.stats.inventory
                                    .valuables.tools
                                }
                              </div>
                              <div className="text-sm text-gray-400">Tools</div>
                            </div>

                            <div className="text-center">
                              <div className="text-3xl mb-2">🍖</div>
                              <div className="text-lg font-minecraft text-green-400">
                                {
                                  playerStats.minecraft.stats.inventory
                                    .valuables.food
                                }
                              </div>
                              <div className="text-sm text-gray-400">
                                Food Items
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="habbo-card p-5 rounded-md">
                      <h2 className="text-lg font-minecraft text-minecraft-habbo-blue mb-4">
                        Inventory
                      </h2>
                      <div className="text-center text-gray-400 py-8">
                        <CubeIcon className="h-16 w-16 mx-auto mb-4 opacity-50" />
                        <p>Inventory data not available</p>
                        <p className="text-sm mt-2">
                          Connect your Minecraft account to view inventory
                          details
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Achievements Tab */}
              {selectedTab === "achievements" && (
                <div className="space-y-6">
                  {/* Achievement Overview */}
                  <div className="habbo-card p-5 rounded-md">
                    <h2 className="text-lg font-minecraft text-minecraft-habbo-blue mb-4 border-b border-white/10 pb-2 flex justify-between items-center">
                      <span>Minecraft Advancements</span>
                      <span className="text-minecraft-habbo-yellow">
                        {playerStats?.advancements?.length || 0} Total Unlocked
                      </span>
                    </h2>

                    {/* Achievement vs Recipe Breakdown */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                      <div className="bg-gradient-to-r from-blue-600/20 to-blue-400/20 p-4 rounded border border-blue-400/30">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-blue-400 text-sm">
                              🏆 Achievement Milestones
                            </p>
                            <p className="text-2xl font-bold text-white">
                              {
                                (playerStats?.advancements || []).filter(
                                  (advancement) =>
                                    !advancement.includes("recipes/") &&
                                    ADVANCEMENT_DATA[advancement],
                                ).length
                              }
                            </p>
                            <p className="text-xs text-gray-400 mt-1">
                              {Math.round(
                                ((playerStats?.advancements || []).filter(
                                  (advancement) =>
                                    !advancement.includes("recipes/") &&
                                    ADVANCEMENT_DATA[advancement],
                                ).length /
                                  Object.keys(ADVANCEMENT_DATA).length) *
                                  100,
                              )}
                              % of tracked achievements
                            </p>
                          </div>
                          <TrophyIcon className="h-8 w-8 text-blue-400" />
                        </div>
                      </div>

                      <div className="bg-gradient-to-r from-green-600/20 to-green-400/20 p-4 rounded border border-green-400/30">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-green-400 text-sm">
                              📋 Recipe Discoveries
                            </p>
                            <p className="text-2xl font-bold text-white">
                              {
                                (playerStats?.advancements || []).filter(
                                  (advancement) =>
                                    advancement.includes("recipes/"),
                                ).length
                              }
                            </p>
                            <p className="text-xs text-gray-400 mt-1">
                              Crafting recipes unlocked
                            </p>
                          </div>
                          <GiftIcon className="h-8 w-8 text-green-400" />
                        </div>
                      </div>
                    </div>

                    {/* Progress Bars */}
                    <div className="space-y-4">
                      {/* Achievement Progress */}
                      <div>
                        <div className="flex justify-between text-sm text-gray-400 mb-2">
                          <span>🏆 Achievement Progress</span>
                          <span>
                            {
                              (playerStats?.advancements || []).filter(
                                (advancement) =>
                                  !advancement.includes("recipes/") &&
                                  ADVANCEMENT_DATA[advancement],
                              ).length
                            }{" "}
                            / {Object.keys(ADVANCEMENT_DATA).length}
                          </span>
                        </div>
                        <div className="w-full bg-gray-700 rounded-full h-2">
                          <div
                            className="bg-gradient-to-r from-blue-500 to-blue-400 h-2 rounded-full transition-all duration-500"
                            style={{
                              width: `${Math.min(
                                ((playerStats?.advancements || []).filter(
                                  (advancement) =>
                                    !advancement.includes("recipes/") &&
                                    ADVANCEMENT_DATA[advancement],
                                ).length /
                                  Object.keys(ADVANCEMENT_DATA).length) *
                                  100,
                                100,
                              )}%`,
                            }}
                          ></div>
                        </div>
                      </div>

                      {/* Total Progress */}
                      <div>
                        <div className="flex justify-between text-sm text-gray-400 mb-2">
                          <span>📊 Total Advancement Progress</span>
                          <span>
                            {playerStats?.advancements?.length || 0} unlocked
                          </span>
                        </div>
                        <div className="w-full bg-gray-700 rounded-full h-2">
                          <div
                            className="bg-gradient-to-r from-minecraft-habbo-blue to-minecraft-habbo-green h-2 rounded-full transition-all duration-500"
                            style={{
                              width: `${Math.min(((playerStats?.advancements?.length || 0) / 1000) * 100, 100)}%`,
                            }}
                          ></div>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          Includes both achievements and recipe discoveries
                        </p>
                      </div>
                    </div>

                    {/* Info Box */}
                    <div className="bg-minecraft-navy-light/30 border border-minecraft-habbo-blue/30 p-4 rounded mt-6">
                      <div className="flex items-start space-x-3">
                        <div className="text-minecraft-habbo-blue text-lg">
                          ℹ️
                        </div>
                        <div className="text-sm">
                          <p className="text-gray-300 mb-2">
                            <strong className="text-minecraft-habbo-blue">
                              What are Advancements?
                            </strong>
                          </p>
                          <p className="text-gray-400 mb-2">
                            Minecraft tracks two types of advancements:
                          </p>
                          <ul className="text-gray-400 text-xs space-y-1 ml-4">
                            <li>
                              •{" "}
                              <strong className="text-blue-400">
                                Achievement Milestones
                              </strong>{" "}
                              - Gameplay challenges you complete
                            </li>
                            <li>
                              •{" "}
                              <strong className="text-green-400">
                                Recipe Discoveries
                              </strong>{" "}
                              - Crafting recipes automatically unlocked
                            </li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Achievement Categories */}
                  <div className="space-y-4">
                    <h3 className="text-xl font-minecraft text-minecraft-habbo-blue mb-4">
                      🏆 Achievement Milestones
                    </h3>
                    {Object.entries(ADVANCEMENT_CATEGORIES).map(
                      ([categoryKey, categoryData]) => {
                        // Filter earned advancements for this category (exclude recipes)
                        const earnedInCategory = (
                          playerStats?.advancements || []
                        ).filter(
                          (advancement) =>
                            !advancement.includes("recipes/") &&
                            ADVANCEMENT_DATA[advancement] &&
                            ADVANCEMENT_DATA[advancement].category ===
                              categoryKey,
                        );

                        const totalInCategory =
                          categoryData.advancements.length;
                        const completionPercentage =
                          totalInCategory > 0
                            ? Math.round(
                                (earnedInCategory.length / totalInCategory) *
                                  100,
                              )
                            : 0;

                        return (
                          <div
                            key={categoryKey}
                            className="habbo-card p-5 rounded-md"
                          >
                            <div className="flex items-center justify-between mb-4">
                              <div className="flex items-center space-x-3">
                                <span className="text-2xl">
                                  {categoryData.icon}
                                </span>
                                <div>
                                  <h3 className="text-lg font-minecraft text-minecraft-habbo-blue">
                                    {categoryData.name}
                                  </h3>
                                  <p className="text-sm text-gray-400">
                                    {categoryData.description}
                                  </p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="text-minecraft-habbo-yellow font-bold">
                                  {earnedInCategory.length}/{totalInCategory}
                                </p>
                                <p className="text-sm text-gray-400">
                                  {completionPercentage}% Complete
                                </p>
                              </div>
                            </div>

                            {/* Category Progress Bar */}
                            <div className="mb-4">
                              <div className="w-full bg-gray-700 rounded-full h-2">
                                <div
                                  className={`h-2 rounded-full transition-all duration-500 ${categoryData.color}`}
                                  style={{ width: `${completionPercentage}%` }}
                                ></div>
                              </div>
                            </div>

                            {/* Show earned advancements in this category */}
                            {earnedInCategory.length > 0 && (
                              <div className="space-y-2">
                                <h4 className="text-sm font-semibold text-gray-300 mb-2">
                                  Earned Achievements:
                                </h4>
                                <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto">
                                  {earnedInCategory.map((advancementId) => {
                                    const advancementData =
                                      ADVANCEMENT_DATA[advancementId];
                                    if (!advancementData) return null;

                                    return (
                                      <div
                                        key={advancementId}
                                        className="bg-gray-800/50 p-3 rounded border border-gray-600/30 hover:border-minecraft-habbo-blue/50 transition-colors"
                                      >
                                        <div className="flex items-start space-x-3">
                                          <span className="text-lg">
                                            {advancementData.icon}
                                          </span>
                                          <div className="flex-1 min-w-0">
                                            <h5 className="font-semibold text-white text-sm">
                                              {advancementData.name}
                                            </h5>
                                            <p className="text-xs text-gray-400 mb-1">
                                              {advancementData.description}
                                            </p>
                                            <p className="text-xs text-minecraft-habbo-yellow">
                                              <span className="font-medium">
                                                Requirement:
                                              </span>{" "}
                                              {advancementData.requirement}
                                            </p>
                                          </div>
                                          <CheckIcon className="h-5 w-5 text-green-400 flex-shrink-0" />
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            )}

                            {earnedInCategory.length === 0 && (
                              <p className="text-gray-500 text-sm italic">
                                No achievements earned in this category yet.
                              </p>
                            )}
                          </div>
                        );
                      },
                    )}
                  </div>

                  {/* Recipe Discoveries Section */}
                  <div className="space-y-4">
                    <h3 className="text-xl font-minecraft text-minecraft-habbo-green mb-4">
                      📋 Recipe Discoveries
                    </h3>

                    {/* Recipe Overview */}
                    <div className="habbo-card p-5 rounded-md">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-lg font-minecraft text-minecraft-habbo-green">
                          Unlocked Recipes
                        </h4>
                        <span className="text-minecraft-habbo-yellow font-bold">
                          {
                            (playerStats?.advancements || []).filter(
                              (advancement) => advancement.includes("recipes/"),
                            ).length
                          }{" "}
                          Total
                        </span>
                      </div>

                      {(playerStats?.advancements || []).filter((advancement) =>
                        advancement.includes("recipes/"),
                      ).length > 0 ? (
                        <div className="space-y-4">
                          {/* Recipe Categories */}
                          {(() => {
                            const recipeAdvancement = (
                              playerStats?.advancements || []
                            ).filter((advancement) =>
                              advancement.includes("recipes/"),
                            );
                            const recipeCategories = {
                              combat: recipeAdvancement.filter((recipe) =>
                                recipe.includes("combat/"),
                              ),
                              tools: recipeAdvancement.filter((recipe) =>
                                recipe.includes("tools/"),
                              ),
                              building_blocks: recipeAdvancement.filter(
                                (recipe) => recipe.includes("building_blocks/"),
                              ),
                              decorations: recipeAdvancement.filter((recipe) =>
                                recipe.includes("decorations/"),
                              ),
                              redstone: recipeAdvancement.filter((recipe) =>
                                recipe.includes("redstone/"),
                              ),
                              transportation: recipeAdvancement.filter(
                                (recipe) => recipe.includes("transportation/"),
                              ),
                              food: recipeAdvancement.filter((recipe) =>
                                recipe.includes("food/"),
                              ),
                              misc: recipeAdvancement.filter((recipe) =>
                                recipe.includes("misc/"),
                              ),
                            };

                            return Object.entries(recipeCategories).map(
                              ([category, recipes]) => {
                                if (recipes.length === 0) return null;

                                const categoryInfo = {
                                  combat: {
                                    name: "Combat & Weapons",
                                    icon: "⚔️",
                                    color: "text-red-400",
                                  },
                                  tools: {
                                    name: "Tools & Equipment",
                                    icon: "🔧",
                                    color: "text-blue-400",
                                  },
                                  building_blocks: {
                                    name: "Building Blocks",
                                    icon: "🧱",
                                    color: "text-yellow-400",
                                  },
                                  decorations: {
                                    name: "Decorations",
                                    icon: "🎨",
                                    color: "text-purple-400",
                                  },
                                  redstone: {
                                    name: "Redstone",
                                    icon: "🔴",
                                    color: "text-red-500",
                                  },
                                  transportation: {
                                    name: "Transportation",
                                    icon: "🚂",
                                    color: "text-green-400",
                                  },
                                  food: {
                                    name: "Food & Cooking",
                                    icon: "🍖",
                                    color: "text-orange-400",
                                  },
                                  misc: {
                                    name: "Miscellaneous",
                                    icon: "📦",
                                    color: "text-gray-400",
                                  },
                                };

                                const info = categoryInfo[category] || {
                                  name: category,
                                  icon: "📋",
                                  color: "text-gray-400",
                                };

                                return (
                                  <div
                                    key={category}
                                    className="border border-gray-600/30 rounded p-4"
                                  >
                                    <div className="flex items-center justify-between mb-3">
                                      <div className="flex items-center space-x-2">
                                        <span className="text-xl">
                                          {info.icon}
                                        </span>
                                        <h5
                                          className={`font-minecraft ${info.color}`}
                                        >
                                          {info.name}
                                        </h5>
                                      </div>
                                      <span className="text-minecraft-habbo-yellow text-sm font-bold">
                                        {recipes.length} recipes
                                      </span>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                                      {recipes.map((recipe) => {
                                        // Extract item name from recipe path
                                        const itemName = recipe
                                          .split("/")
                                          .pop()
                                          .replace(/_/g, " ")
                                          .replace(/from .*/, "")
                                          .trim();
                                        const capitalizedName =
                                          itemName.charAt(0).toUpperCase() +
                                          itemName.slice(1);

                                        return (
                                          <div
                                            key={recipe}
                                            className="bg-gray-800/40 p-2 rounded text-xs"
                                          >
                                            <p className="text-gray-300 font-medium">
                                              {capitalizedName}
                                            </p>
                                            <p className="text-gray-500 text-xs truncate">
                                              {recipe.replace(
                                                "minecraft:recipes/",
                                                "",
                                              )}
                                            </p>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>
                                );
                              },
                            );
                          })()}
                        </div>
                      ) : (
                        <div className="text-center text-gray-400 py-8">
                          <span className="text-4xl mb-4 block">📋</span>
                          <p>No recipes discovered yet</p>
                          <p className="text-sm mt-2">
                            Play Minecraft to unlock crafting recipes!
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Right Sidebar */}
            <div className="lg:col-span-1 space-y-6">
              {/* Quick Stats Overview */}
              <div className="habbo-card p-5 rounded-md">
                <h2 className="text-lg font-minecraft text-minecraft-habbo-blue mb-4 border-b border-white/10 pb-2">
                  📊 Quick Stats
                </h2>

                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400 text-sm">Achievements</span>
                    <span className="text-minecraft-habbo-yellow font-bold">
                      {
                        (playerStats?.advancements || []).filter(
                          (advancement) =>
                            !advancement.includes("recipes/") &&
                            ADVANCEMENT_DATA[advancement],
                        ).length
                      }
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-gray-400 text-sm">Recipes</span>
                    <span className="text-minecraft-habbo-green font-bold">
                      {
                        (playerStats?.advancements || []).filter(
                          (advancement) => advancement.includes("recipes/"),
                        ).length
                      }
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-gray-400 text-sm">Level</span>
                    <span className="text-minecraft-habbo-blue font-bold">
                      {playerStats?.level || 1}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-gray-400 text-sm">Deaths</span>
                    <span className="text-red-400 font-bold">
                      {playerStats?.deaths || 0}
                    </span>
                  </div>
                </div>
              </div>

              {/* Achievement Progress */}
              <div className="habbo-card p-5 rounded-md">
                <h2 className="text-lg font-minecraft text-minecraft-habbo-yellow mb-4 border-b border-white/10 pb-2">
                  📈 Progress
                </h2>

                <div className="space-y-4">
                  {/* Achievement Progress */}
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-400">Achievements</span>
                      <span className="text-minecraft-habbo-yellow">
                        {Math.round(
                          ((playerStats?.advancements || []).filter(
                            (advancement) =>
                              !advancement.includes("recipes/") &&
                              ADVANCEMENT_DATA[advancement],
                          ).length /
                            Object.keys(ADVANCEMENT_DATA).length) *
                            100,
                        )}
                        %
                      </span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-yellow-500 to-yellow-400 h-2 rounded-full transition-all duration-500"
                        style={{
                          width: `${Math.min(
                            ((playerStats?.advancements || []).filter(
                              (advancement) =>
                                !advancement.includes("recipes/") &&
                                ADVANCEMENT_DATA[advancement],
                            ).length /
                              Object.keys(ADVANCEMENT_DATA).length) *
                              100,
                            100,
                          )}%`,
                        }}
                      ></div>
                    </div>
                  </div>

                  {/* Recipe Progress */}
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-400">Recipes</span>
                      <span className="text-minecraft-habbo-green">
                        {
                          (playerStats?.advancements || []).filter(
                            (advancement) => advancement.includes("recipes/"),
                          ).length
                        }
                      </span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-green-500 to-green-400 h-2 rounded-full transition-all duration-500"
                        style={{
                          width: `${Math.min(
                            ((playerStats?.advancements || []).filter(
                              (advancement) => advancement.includes("recipes/"),
                            ).length /
                              600) *
                              100,
                            100,
                          )}%`,
                        }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent Activity */}
              <div className="habbo-card p-5 rounded-md">
                <h2 className="text-lg font-minecraft text-minecraft-habbo-green mb-4 border-b border-white/10 pb-2">
                  🎮 Activity
                </h2>

                <div className="space-y-3 text-sm">
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <div>
                      <p className="text-gray-300">
                        Currently {playerStats?.gamemode || "SURVIVAL"}
                      </p>
                      <p className="text-gray-500 text-xs">Game mode</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <div>
                      <p className="text-gray-300">
                        {playerStats?.playtime || "0h"}
                      </p>
                      <p className="text-gray-500 text-xs">Total playtime</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                    <div>
                      <p className="text-gray-300">
                        {playerStats?.blocks_mined || 0} blocks
                      </p>
                      <p className="text-gray-500 text-xs">Blocks mined</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    <div>
                      <p className="text-gray-300">
                        {playerStats?.mobs_killed || 0} mobs
                      </p>
                      <p className="text-gray-500 text-xs">Mobs defeated</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Server Info */}
              {playerStats?.minecraft?.stats?.placeholders && (
                <div className="habbo-card p-5 rounded-md">
                  <h2 className="text-lg font-minecraft text-minecraft-habbo-blue mb-4 border-b border-white/10 pb-2">
                    🖥️ Server Info
                  </h2>

                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Online Players</span>
                      <span className="text-green-400">
                        {playerStats.minecraft.stats.placeholders
                          .server_online || 0}
                      </span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-gray-400">Server TPS</span>
                      <span className="text-blue-400">20.0</span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-gray-400">Your Ping</span>
                      <span className="text-yellow-400">
                        {playerStats.minecraft.stats.placeholders.player_ping ||
                          0}
                        ms
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      {/* Social Modals */}
      {/* Followers Modal */}
      {showFollowersModal && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-lg max-w-4xl w-full max-h-[80vh] overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b border-gray-700">
              <h2 className="text-xl font-bold text-white">
                👥 Followers ({followersData.length})
              </h2>
              <button
                onClick={closeSocialModals}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[calc(80vh-120px)]">
              {socialModalLoading ? (
                <div className="flex justify-center py-8">
                  <LoadingSpinner size="lg" />
                </div>
              ) : followersData.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-400">No followers yet</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {followersData.map((follower) => (
                    <div
                      key={follower.username}
                      className="bg-gray-700 rounded-lg p-4 flex items-center space-x-3"
                    >
                      <MinecraftAvatar
                        username={follower.mcUsername || follower.username}
                        size={48}
                        className="rounded-md"
                      />
                      <div className="flex-1 min-w-0">
                        <h3 className="text-white font-medium truncate">
                          {follower.username}
                        </h3>
                        {follower.mcUsername &&
                          follower.mcUsername !== follower.username && (
                            <p className="text-gray-400 text-sm truncate">
                              {follower.mcUsername}
                            </p>
                          )}
                      </div>
                      <Link
                        to={`/profile/${follower.username}`}
                        className="text-blue-400 hover:text-blue-300 transition-colors"
                        onClick={closeSocialModals}
                      >
                        View
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      {/* Following Modal */}
      {showFollowingModal && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-lg max-w-4xl w-full max-h-[80vh] overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b border-gray-700">
              <h2 className="text-xl font-bold text-white">
                💚 Following ({followingData.length})
              </h2>
              <button
                onClick={closeSocialModals}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[calc(80vh-120px)]">
              {socialModalLoading ? (
                <div className="flex justify-center py-8">
                  <LoadingSpinner size="lg" />
                </div>
              ) : followingData.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-400">Not following anyone yet</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {followingData.map((followedUser) => (
                    <div
                      key={followedUser.username}
                      className="bg-gray-700 rounded-lg p-4 flex items-center space-x-3"
                    >
                      <MinecraftAvatar
                        username={
                          followedUser.mcUsername || followedUser.username
                        }
                        size={48}
                        className="rounded-md"
                      />
                      <div className="flex-1 min-w-0">
                        <h3 className="text-white font-medium truncate">
                          {followedUser.username}
                        </h3>
                        {followedUser.mcUsername &&
                          followedUser.mcUsername !== followedUser.username && (
                            <p className="text-gray-400 text-sm truncate">
                              {followedUser.mcUsername}
                            </p>
                          )}
                      </div>
                      <Link
                        to={`/profile/${followedUser.username}`}
                        className="text-blue-400 hover:text-blue-300 transition-colors"
                        onClick={closeSocialModals}
                      >
                        View
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      {/* Friends Modal */}
      {showFriendsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-lg max-w-4xl w-full max-h-[80vh] overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b border-gray-700">
              <h2 className="text-xl font-bold text-white">
                🤝 Friends ({friendsData.length})
              </h2>
              <button
                onClick={closeSocialModals}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[calc(80vh-120px)]">
              {socialModalLoading ? (
                <div className="flex justify-center py-8">
                  <LoadingSpinner size="lg" />
                </div>
              ) : friendsData.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-400">No friends yet</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {friendsData.map((friend) => (
                    <div
                      key={friend.username}
                      className="bg-gray-700 rounded-lg p-4 flex items-center space-x-3"
                    >
                      <MinecraftAvatar
                        username={friend.mcUsername || friend.username}
                        size={48}
                        className="rounded-md"
                      />
                      <div className="flex-1 min-w-0">
                        <h3 className="text-white font-medium truncate">
                          {friend.username}
                        </h3>
                        {friend.mcUsername &&
                          friend.mcUsername !== friend.username && (
                            <p className="text-gray-400 text-sm truncate">
                              {friend.mcUsername}
                            </p>
                          )}
                      </div>
                      <Link
                        to={`/profile/${friend.username}`}
                        className="text-blue-400 hover:text-blue-300 transition-colors"
                        onClick={closeSocialModals}
                      >
                        View
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      {/* Wallpaper Selection Modal */}
      {showWallpaperModal && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-lg max-w-4xl w-full max-h-[80vh] overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b border-gray-700">
              <h2 className="text-xl font-bold text-white">
                🖼️ Change Cover Image
              </h2>
              <button
                onClick={() => setShowWallpaperModal(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[calc(80vh-120px)]">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {WALLPAPERS.map((wallpaper) => (
                  <div key={wallpaper.id} className="relative group">
                    <button
                      onClick={() => {
                        setPendingWallpaperId(wallpaper.id);
                        confirmWallpaperChange();
                      }}
                      className="w-full aspect-video rounded-lg overflow-hidden border-2 border-transparent hover:border-blue-500 transition-colors"
                      disabled={savingWallpaper}
                    >
                      <img
                        src={getWallpaperThumb(wallpaper.id)}
                        alt={wallpaper.name}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-opacity flex items-center justify-center">
                        <span className="text-white font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                          {wallpaper.name}
                        </span>
                      </div>
                    </button>
                    {wallpaperId === wallpaper.id && (
                      <div className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded">
                        Current
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}{" "}
    </div>
  );
};

export default Profile;
