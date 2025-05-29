import { useState, useCallback } from 'react';

const useCopyToClipboard = (defaultText = '') => {
  const [copySuccess, setCopySuccess] = useState(false);

  const legacyCopyToClipboard = (text) => {
    try {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);
      if (successful) {
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
      }
    } catch (err) {
      console.error('Fallback: Failed to copy', err);
    }
  };

  const copyToClipboard = useCallback((text = defaultText) => {
    if (!text) return;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text)
        .then(() => {
          setCopySuccess(true);
          setTimeout(() => setCopySuccess(false), 2000);
        })
        .catch(err => {
          console.error('Failed to copy: ', err);
          legacyCopyToClipboard(text);
        });
    } else {
      legacyCopyToClipboard(text);
    }
  }, [defaultText]);

  return { copySuccess, copyToClipboard };
};

export default useCopyToClipboard; 