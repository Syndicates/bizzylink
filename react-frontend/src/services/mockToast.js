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