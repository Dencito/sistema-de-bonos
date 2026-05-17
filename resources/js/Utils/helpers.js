/**
 * Get the company prefix from the current URL
 */
export const getCompanyFromUrl = () => {
  const path = window.location.pathname;
  const segments = path.split('/');
  return segments[1] || null;
};

/**
 * Get route parameters with company included
 */
export const getRouteParams = (params = {}) => {
  return {
    company: getCompanyFromUrl(),
    ...params,
  };
};
