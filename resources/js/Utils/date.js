/**
 * Format a date as "DD-MM-YYYY"
 * @param {Date | string} date - The date to format.
 * @returns {string} The formatted date string.
 */
export const formatDate = (date) => {
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
  };
  
  /**
   * Format a date as "DD-MM-YYYY HH:mm:ss"
   * @param {Date | string} date - The date to format.
   * @returns {string} The formatted date string with time.
   */
  export const formatDateTime = (date) => {
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const seconds = String(d.getSeconds()).padStart(2, '0');
    return `${day}-${month}-${year} ${hours}:${minutes}:${seconds}`;
  };
  
  /**
   * Get the current date and time in "DD-MM-YYYY HH:mm:ss" format.
   * @returns {string} The current formatted date and time string.
   */
  export const getCurrentDateTime = () => {
    return formatDateTime(new Date());
  };
  
  /**
   * Get the current date in "DD-MM-YYYY" format.
   * @returns {string} The current formatted date string.
   */
  export const getCurrentDate = () => {
    return formatDate(new Date());
  };
  
  /**
   * Get the current time in "HH:mm:ss" format.
   * @returns {string} The current formatted time string.
   */
  export const getCurrentTime = () => {
    const d = new Date();
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const seconds = String(d.getSeconds()).padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
  };
  