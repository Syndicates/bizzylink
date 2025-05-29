import React from "react";
import FeedSidebar from "../../components/FeedSidebar";
// ...other imports...

const FYPPage = () => {
  return (
    <div className="flex flex-col md:flex-row md:items-start gap-6 w-full max-w-7xl mx-auto px-2 md:px-6 py-6">
      {/* Main Feed */}
      <div className="flex-1 min-w-0">
        {/* ...existing FYP feed content... */}
      </div>
      {/* Sidebar */}
      <div className="w-full md:w-80 flex-shrink-0">
        <FeedSidebar />
      </div>
    </div>
  );
};

export default FYPPage; 