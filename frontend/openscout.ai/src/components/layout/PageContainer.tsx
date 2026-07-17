import React from 'react';

interface PageContainerProps {
  children: React.ReactNode;
  className?: string;
}

export function PageContainer({ children, className = '' }: PageContainerProps) {
  return (
    <div className={`relative min-h-screen w-full overflow-hidden bg-[#03050c] flex flex-col ${className}`}>
      {/* Moving Ambient Mesh Glow objects to simulate video's glass glow */}
      <div className="absolute top-[-10%] left-[-15%] w-[50vw] h-[50vw] rounded-full bg-blue-600/10 blur-[120px] animate-[pulse_12s_infinite_alternate] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-15%] w-[60vw] h-[60vw] rounded-full bg-purple-600/8 blur-[140px] animate-[pulse_15s_infinite_alternate_2s] pointer-events-none" />
      <div className="absolute top-[30%] right-[10%] w-[35vw] h-[35vw] rounded-full bg-amber-500/5 blur-[110px] animate-[pulse_10s_infinite_alternate_4s] pointer-events-none" />
      
      {/* Core Layout Content */}
      <div className="relative z-10 flex-1 flex flex-col">
        {children}
      </div>
    </div>
  );
}
