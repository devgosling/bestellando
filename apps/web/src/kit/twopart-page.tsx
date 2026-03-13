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
  <div className="w-full relative min-h-screen md:h-screen" >
    <div
      className="w-[60%] h-full top-0 absolute z-0 opacity-[0.8]"
      style={{ background: `url('${HERO_IMG}') center/cover no-repeat` }}
    ></div>
    <div
      className={`flex flex-col md:flex-row w-full min-h-screen items-center ${className}`}
    >
      <div className="flex flex-col items-center justify-center p-6 text-white text-center w-full md:w-1/2 min-h-[40vh] md:min-h-screen md:sticky md:top-0">
        <h1 className="text-3xl md:text-5xl" style={{ fontWeight: "800" }}>
          {title}
        </h1>
        {subtitle && <p className="mt-4 text-lg text-gray">{subtitle}</p>}
      </div>
      <div className="w-full md:w-1/2 p-8 md:p-12 overflow-y-auto">
        {children}
      </div>
    </div>
  </div>
);

export default TwoPartPage;
