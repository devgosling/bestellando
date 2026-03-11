import React from "react";

type TwoPartPageProps = {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  className?: string;
};

const HERO_IMG =
  "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&q=80";

const TwoPartPage: React.FC<TwoPartPageProps> = ({
  children,
  title,
  subtitle,
  className = "",
}) => (
  <div className={`flex flex-col md:flex-row w-full min-h-screen ${className}`}>
    <div
      className="flex flex-col items-center justify-center p-8 text-white w-full md:w-1/2 min-h-[40vh] md:min-h-screen md:sticky md:top-0"
      style={{
        background: `linear-gradient(rgba(0,0,0,.45), rgba(0,0,0,.45)), url('${HERO_IMG}') center/cover no-repeat`,
      }}
    >
      <h1 className="text-4xl md:text-6xl" style={{ fontWeight: "800" }}>
        {title}
      </h1>
      {subtitle && <p className="mt-4 text-lg text-gray-300">{subtitle}</p>}
    </div>
    <div className="w-full md:w-1/2 p-6 md:p-10 overflow-y-auto">
      {children}
    </div>
  </div>
);

export default TwoPartPage;
