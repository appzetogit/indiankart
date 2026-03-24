/**
 * Optimizes an image URL for better performance.
 * Specifically handles Cloudinary URLs by injecting transformation parameters.
 * 
 * @param {string} url - The original image URL.
 * @param {object} options - Optimization options.
 * @param {number} options.width - The target width for the image.
 * @param {number} options.height - The target height for the image.
 * @param {string} options.crop - The crop mode (e.g., 'fill', 'scale', 'thumb').
 * @param {string} options.quality - The quality setting (default: 'auto').
 * @param {string} options.format - The image format (default: 'auto').
 * @returns {string} - The optimized image URL.
 */
export const optimizeImage = (url, options = {}) => {
    if (!url || typeof url !== 'string') return url;

    // Check if it's a Cloudinary URL
    if (url.includes('res.cloudinary.com')) {
        const {
            width = 400,
            height,
            crop = 'fill',
            quality = 'auto',
            format = 'auto'
        } = options;

        // Build transformation string
        const transformations = [
            `f_${format}`,
            `q_${quality}`,
            `c_${crop}`,
            `w_${width}`
        ];
        if (height) transformations.push(`h_${height}`);

        const transformationString = transformations.join(',');

        // Cloudinary URL structure: .../upload/[transformations]/v123...
        // If there's already a transformation, we might need to be careful, 
        // but for app-uploaded images, they usually don't have them yet.
        if (url.includes('/upload/')) {
            // Check if there's already a transformation (not starting with 'v')
            const parts = url.split('/upload/');
            const afterUpload = parts[1];
            
            // If the next part doesn't start with 'v' and doesn't look like a version number, 
            // it might be a transformation. 
            // Simplified: insert our transformation right after /upload/
            return `${parts[0]}/upload/${transformationString}/${afterUpload}`;
        }
    }

    // Google Shopping thumbnails optimization (if detected)
    if (url.includes('googleusercontent.com') || url.includes('gstatic.com')) {
        // Many Google images support =wXXX-hXXX parameters
        if (url.includes('=') && !url.includes('width')) {
             return `${url.split('=')[0]}=w${options.width || 400}`;
        }
    }

    return url;
};

export const getPlaceholderImage = (width = 400, height = 400) => {
    return `https://placehold.co/${width}x${height}/F3F4F6/9CA3AF?text=Image`;
};
