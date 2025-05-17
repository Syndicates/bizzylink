/**
 * +-------------------------------------------------+
 * |                 BIZZY NATION                    |
 * |          Crafted with ♦ by Bizzy 2025         |
 * +-------------------------------------------------+
 * 
 * @file mockToast.js
 * @description 
 * @copyright © Bizzy Nation - All Rights Reserved
 * @license Proprietary - Not for distribution
 * 
 * This file is protected intellectual property of Bizzy Nation.
 * Unauthorized use, copying, or distribution is prohibited.
 */

/**
 * Mock version of react-toastify that uses console logs and alerts
 * Used as a fallback when react-toastify is not installed
 */

export const toast = {
  success: (message) => {
    console.log('✅ Success:', message);
    // Optional alert for visibility
    // alert('Success: ' + message);
  },
  
  error: (message) => {
    console.error('❌ Error:', message);
    // Optional alert for visibility
    // alert('Error: ' + message);
  },
  
  info: (message) => {
    console.info('ℹ️ Info:', message);
    // Optional alert for visibility
    // alert('Info: ' + message);
  },
  
  warning: (message) => {
    console.warn('⚠️ Warning:', message);
    // Optional alert for visibility
    // alert('Warning: ' + message);
  }
};

export const ToastContainer = () => null;

export default { toast, ToastContainer };