import React, { createContext, useState, useContext, ReactNode } from 'react';

interface CongestionThresholdContextType {
  congestionThreshold: number;
  setCongestionThreshold: (threshold: number) => void;
}

const CongestionThresholdContext = createContext<CongestionThresholdContextType | undefined>(undefined);

export const CongestionThresholdProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [congestionThreshold, setCongestionThreshold] = useState(3); // Default value

  return (
    <CongestionThresholdContext.Provider value={{ congestionThreshold, setCongestionThreshold }}>
      {children}
    </CongestionThresholdContext.Provider>
  );
};

export const useCongestionThreshold = () => {
  const context = useContext(CongestionThresholdContext);
  if (context === undefined) {
    throw new Error('useCongestionThreshold must be used within a CongestionThresholdProvider');
  }
  return context;
};
