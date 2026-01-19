// Subdomain utilities for Mus.Link

const MAIN_DOMAIN = 'mus.link';

/**
 * Extract subdomain from current hostname
 * @returns {string|null} subdomain or null if on main domain
 */
export function getSubdomain() {
  const host = window.location.hostname.toLowerCase();
  
  // Check for localhost, IP, or preview domain (development)
  if (host === 'localhost' || /^\d+\.\d+\.\d+\.\d+$/.test(host) || host.includes('preview.emergentagent.com')) {
    // Check for subdomain in URL params for testing
    const params = new URLSearchParams(window.location.search);
    return params.get('subdomain') || null;
  }
  
  // Check if host ends with main domain
  if (host.endsWith(`.${MAIN_DOMAIN}`)) {
    const subdomain = host.replace(`.${MAIN_DOMAIN}`, '');
    // Exclude www
    if (subdomain && subdomain !== 'www') {
      return subdomain;
    }
  }
  
  return null;
}

/**
 * Check if we're on a subdomain
 * @returns {boolean}
 */
export function isSubdomain() {
  return getSubdomain() !== null;
}

/**
 * Build URL for a subdomain
 * @param {string} subdomain 
 * @param {string} path 
 * @returns {string}
 */
export function buildSubdomainUrl(subdomain, path = '') {
  const protocol = window.location.protocol;
  return `${protocol}//${subdomain}.${MAIN_DOMAIN}${path}`;
}

/**
 * Get main domain URL
 * @param {string} path 
 * @returns {string}
 */
export function getMainDomainUrl(path = '') {
  const protocol = window.location.protocol;
  return `${protocol}//${MAIN_DOMAIN}${path}`;
}

export default {
  getSubdomain,
  isSubdomain,
  buildSubdomainUrl,
  getMainDomainUrl,
  MAIN_DOMAIN
};
