import React, { createContext, useContext, useRef, useState, useEffect } from 'react';

interface CameraContextType {
  videoRef: React.RefObject<HTMLVideoElement>;
  stream: MediaStream | null;
  isActive: boolean;
  startCamera: () => Promise<void>;
  stopCamera: () => void;
}

const CameraContext = createContext<CameraContextType | undefined>(undefined);

export const CameraProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isActive, setIsActive] = useState(false);

  const startCamera = async () => {
    if (stream) return;
    
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { width: 640, height: 480 } 
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setIsActive(true);
    } catch (err) {
      console.error('Camera access error:', err);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
      setIsActive(false);
    }
  };

  useEffect(() => {
    return () => stopCamera();
  }, []);

  return (
    <CameraContext.Provider value={{ videoRef, stream, isActive, startCamera, stopCamera }}>
      {children}
    </CameraContext.Provider>
  );
};

export const useCamera = () => {
  const context = useContext(CameraContext);
  if (!context) {
    throw new Error('useCamera must be used within CameraProvider');
  }
  return context;
};
