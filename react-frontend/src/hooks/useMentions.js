/**
 * +-------------------------------------------------+
 * |                 BIZZY NATION                    |
 * |          Crafted with ♦ by Bizzy 2025         |
 * +-------------------------------------------------+
 * 
 * @file useMentions.js
 * @description Custom hook for managing @mentions in text areas
 * @copyright © Bizzy Nation - All Rights Reserved
 * @license Proprietary - Not for distribution
 * 
 * This file is protected intellectual property of Bizzy Nation.
 * Unauthorized use, copying, or distribution is prohibited.
 */

import { useState, useCallback, useRef, useEffect } from 'react';

const useMentions = (initialValue = '') => {
  const [text, setText] = useState(initialValue);
  const [mentionActive, setMentionActive] = useState(false);
  const [mentionText, setMentionText] = useState('');
  const [mentionPosition, setMentionPosition] = useState({ top: 0, left: 0 });
  const inputRef = useRef(null);
  
  // Track cursor position and text selection
  const [cursorPosition, setCursorPosition] = useState(0);
  
  // Handle text changes and detect @ mentions
  const handleTextChange = useCallback((e) => {
    const newText = e.target.value;
    const currentPosition = e.target.selectionStart;
    
    setText(newText);
    setCursorPosition(currentPosition);
    
    // Find the start of a potential @mention
    let mentionStart = -1;
    for (let i = currentPosition - 1; i >= 0; i--) {
      if (newText[i] === '@') {
        mentionStart = i;
        break;
      } else if (newText[i] === ' ' || newText[i] === '\n') {
        break;
      }
    }
    
    if (mentionStart !== -1) {
      const mentionStr = newText.substring(mentionStart + 1, currentPosition);
      
      // Only activate mention dropdown if there's valid text after the @
      if (mentionStr.length > 0) {
        setMentionActive(true);
        setMentionText(mentionStr);
        
        // Calculate dropdown position based on textarea's cursor position
        if (inputRef.current) {
          // This requires a more complex approach to get exact cursor coordinates
          // For now, we'll approximate based on the textarea's position
          const textareaRect = inputRef.current.getBoundingClientRect();
          
          // Create a temporary hidden div to measure text width
          const tempDiv = document.createElement('div');
          tempDiv.style.position = 'absolute';
          tempDiv.style.visibility = 'hidden';
          tempDiv.style.whiteSpace = 'pre-wrap';
          tempDiv.style.fontSize = window.getComputedStyle(inputRef.current).fontSize;
          tempDiv.style.fontFamily = window.getComputedStyle(inputRef.current).fontFamily;
          tempDiv.style.lineHeight = window.getComputedStyle(inputRef.current).lineHeight;
          tempDiv.style.width = window.getComputedStyle(inputRef.current).width;
          
          // Get text before cursor
          const textBeforeCursor = newText.substring(0, currentPosition);
          tempDiv.textContent = textBeforeCursor;
          document.body.appendChild(tempDiv);
          
          // Calculate position based on textarea and text width
          // This is a simplified approach and might need refinement for more precise positioning
          const textBeforeMention = newText.substring(0, mentionStart);
          tempDiv.textContent = textBeforeMention;
          
          // Get the text coordinates
          const lastLineIndex = textBeforeCursor.lastIndexOf('\n');
          const lastLineText = lastLineIndex === -1 ? textBeforeCursor : textBeforeCursor.substring(lastLineIndex + 1);
          
          tempDiv.textContent = lastLineText;
          const approxWidth = tempDiv.clientWidth;
          
          // Line height calculation for vertical positioning
          const lineHeight = parseInt(window.getComputedStyle(inputRef.current).lineHeight, 10) || 20;
          const lines = textBeforeCursor.split('\n').length;
          
          document.body.removeChild(tempDiv);
          
          setMentionPosition({
            top: textareaRect.top + (lines * lineHeight) + window.scrollY + 20, // add offset for better positioning
            left: textareaRect.left + Math.min(approxWidth, textareaRect.width - 300) + window.scrollX // limit to prevent overflow
          });
        }
      } else {
        setMentionActive(false);
      }
    } else {
      setMentionActive(false);
    }
  }, []);
  
  // Handle mention selection
  const handleSelectMention = useCallback((user) => {
    if (!inputRef.current) return;
    
    // Get the current text and positions
    const currentText = text;
    const currentPosition = cursorPosition;
    
    // Find the @ symbol's position before cursor
    let mentionStart = -1;
    for (let i = currentPosition - 1; i >= 0; i--) {
      if (currentText[i] === '@') {
        mentionStart = i;
        break;
      } else if (currentText[i] === ' ' || currentText[i] === '\n') {
        break;
      }
    }
    
    if (mentionStart !== -1) {
      // Replace the @mention text with the selected username
      const beforeMention = currentText.substring(0, mentionStart);
      const afterMention = currentText.substring(currentPosition);
      const newText = `${beforeMention}@${user.username} ${afterMention}`;
      
      setText(newText);
      
      // Calculate new cursor position after the inserted mention
      const newPosition = mentionStart + user.username.length + 2; // +2 for @ and space
      
      // Update cursor position after state update
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
          inputRef.current.selectionStart = newPosition;
          inputRef.current.selectionEnd = newPosition;
          setCursorPosition(newPosition);
        }
      }, 0);
    }
    
    // Hide the dropdown
    setMentionActive(false);
  }, [text, cursorPosition]);
  
  // Custom event handler for cursor position changes
  const handleSelectionChange = useCallback(() => {
    if (inputRef.current) {
      setCursorPosition(inputRef.current.selectionStart);
    }
  }, []);
  
  // Set up event listeners for cursor position changes
  useEffect(() => {
    const inputElement = inputRef.current;
    if (inputElement) {
      inputElement.addEventListener('click', handleSelectionChange);
      inputElement.addEventListener('keyup', handleSelectionChange);
      
      return () => {
        inputElement.removeEventListener('click', handleSelectionChange);
        inputElement.removeEventListener('keyup', handleSelectionChange);
      };
    }
  }, [handleSelectionChange]);
  
  return {
    text,
    setText,
    handleTextChange,
    mentionActive,
    setMentionActive,
    mentionText,
    mentionPosition,
    handleSelectMention,
    inputRef
  };
};

export default useMentions; 