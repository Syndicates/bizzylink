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

import { useState, useCallback } from 'react';

/**
 * Custom hook for managing the guided tour state
 * @returns {Object} - { tourActive, startTour, endTour }
 */
export default function useGuidedTour() {
  const [tourActive, setTourActive] = useState(false);

  // Handle starting the tour
  const startTour = useCallback(() => {
    console.log('Starting guided tour...');
    setTourActive(true);
  }, []);

  // Handle ending the tour
  const endTour = useCallback(() => {
    console.log('Ending guided tour...');
    setTourActive(false);
  }, []);

  return {
    tourActive,
    startTour,
    endTour
  };
} 