import React from "react";

const tabs = [
  { key: "fyp", label: "For You" },
  { key: "following", label: "Following" },
  { key: "newest", label: "Newest" },
];

const FYPFilterBar = ({ filter, setFilter }) => (
  <div className="flex justify-center mb-8">
    <div className="bg-minecraft-dark border border-white/10 rounded-lg shadow px-2 py-2 flex gap-2">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          onClick={() => setFilter(tab.key)}
          className={`px-5 py-2 rounded font-bold text-lg transition-colors duration-150 focus:outline-none
            ${filter === tab.key
              ? "bg-gradient-to-r from-minecraft-habbo-blue to-minecraft-habbo-green text-white shadow"
              : "bg-transparent text-minecraft-habbo-green hover:bg-minecraft-habbo-blue/20 hover:text-white"
            }`}
          aria-current={filter === tab.key ? "page" : undefined}
        >
          {tab.label}
        </button>
      ))}
    </div>
  </div>
);

export default FYPFilterBar; 