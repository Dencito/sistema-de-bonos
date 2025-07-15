/**
 * Format a date as "DD-MM-YYYY"
 * @param {Date | string} date - The date to format.
 * @returns {string} The formatted date string.
 */

const timeZone = 'America/Santiago';


export const formatDate = (date) => {
    const d = new Date(date);
    const day = String(d.getDate());
    const month = String(d.getMonth() + 1);
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
};

/**
 * Format a date as "DD-MM-YYYY HH:mm:ss"
 * @param {Date | string} date - The date to format.
 * @returns {string} The formatted date string with time.
 */
export const formatDateTime = (date) => {
    // Return a placeholder if date is undefined or null
    if (!date) {
        return 'N/A';
    }
    
    const d = new Date(date);
    
    // Check if date is valid
    if (isNaN(d.getTime())) {
        return 'Invalid Date';
    }
    
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const seconds = String(d.getSeconds()).padStart(2, '0');
    
    // Format the date using the constructed values instead of relying on toString()
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
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
    const hours = String(d.getHours());
    const minutes = String(d.getMinutes());
    const seconds = String(d.getSeconds());
    return `${hours}:${minutes}:${seconds}`;
};
