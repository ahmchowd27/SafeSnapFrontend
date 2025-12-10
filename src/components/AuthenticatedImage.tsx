import React, { useState, useEffect } from 'react';
import { apiClient } from '@/api/client';

interface AuthenticatedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
}

const AuthenticatedImage: React.FC<AuthenticatedImageProps> = ({ src, alt, className, ...props }) => {
  const [imageSrc, setImageSrc] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchImage = async () => {
      try {
        setLoading(true);
        setError(false);

        // Extract the path from the full URL if needed
        // If src is like "https://backend.com/api/s3/image-proxy/filename.jpg"
        // we need to make the request to "/s3/image-proxy/filename.jpg" (without /api since apiClient base URL already includes it)
        let requestUrl = src;
        if (src.startsWith('http://') || src.startsWith('https://')) {
          const urlObj = new URL(src);
          requestUrl = urlObj.pathname; // This gives us "/api/s3/image-proxy/filename.jpg"
          
          // Remove the /api prefix since apiClient base URL already includes it
          if (requestUrl.startsWith('/api/')) {
            requestUrl = requestUrl.substring(4); // Remove "/api" to get "/s3/image-proxy/filename.jpg"
          }
        }

        // Fetch the image with authentication headers
        const response = await apiClient.get(requestUrl, {
          responseType: 'blob',
        });

        // Convert blob to data URL
        const blob = response.data;
        const reader = new FileReader();
        reader.onloadend = () => {
          setImageSrc(reader.result as string);
          setLoading(false);
        };
        reader.readAsDataURL(blob);
      } catch (err) {
        setError(true);
        setLoading(false);
      }
    };

    if (src) {
      fetchImage();
    }
  }, [src]);

  if (loading) {
    return (
      <div className={`${className} flex items-center justify-center bg-gray-100 animate-pulse`}>
        <div className="text-gray-400 text-xs">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`${className} flex items-center justify-center bg-gray-100`}>
        <div className="text-gray-400 text-xs">Failed to load</div>
      </div>
    );
  }

  return <img src={imageSrc} alt={alt} className={className} {...props} />;
};

export default AuthenticatedImage;
