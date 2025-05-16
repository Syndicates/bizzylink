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