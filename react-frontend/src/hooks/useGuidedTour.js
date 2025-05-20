/**
 * +-------------------------------------------------+
 * |                 BIZZY NATION                    |
 * |          Crafted with ♦ by Bizzy 2025         |
 * +-------------------------------------------------+
 * 
 * @file useGuidedTour.js
 * @description 
 * @copyright © Bizzy Nation - All Rights Reserved
 * @license Proprietary - Not for distribution
 * 
 * This file is protected intellectual property of Bizzy Nation.
 * Unauthorized use, copying, or distribution is prohibited.
 */

import React, { createContext, useContext, useState, useCallback } from 'react';

const GuidedTourContext = createContext();

export function GuidedTourProvider({ children }) {
  const [tourActive, setTourActive] = useState(false);

  const startTour = useCallback(() => {
    setTourActive(true);
  }, []);

  const endTour = useCallback(() => {
    setTourActive(false);
  }, []);

  return (
    <GuidedTourContext.Provider value={{ tourActive, startTour, endTour }}>
      {children}
    </GuidedTourContext.Provider>
  );
}

export default function useGuidedTour() {
  const context = useContext(GuidedTourContext);
  if (!context) {
    throw new Error('useGuidedTour must be used within a GuidedTourProvider');
  }
  return context;
} 