import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, BarChart3, Target } from "lucide-react";

export default function Onboarding({ onFinish }) {
  const [index, setIndex] = useState(0);

  const slides = [
    {
      title: "Organize Everything",
      description: "Create, manage, and execute your tasks beautifully.",
      icon: <Sparkles size={80} className="text-white drop-shadow-xl" />,
    },
    {
      title: "Visual Insights",
      description: "Track your productivity trends and weekly efficiency.",
      icon: <BarChart3 size={80} className="text-white drop-shadow-xl" />,
    },
    {
      title: "Daily Consistency",
      description: "Hit your targets and maintain your productive streak.",
      icon: <Target size={80} className="text-white drop-shadow-xl" />,
    },
  ];

  const handleNext = () => {
    if (index < slides.length - 1) {
      setIndex(index + 1);
    } else {
      localStorage.setItem("onboardingDone", "true");
      onFinish();
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-between p-6 sm:p-10 bg-(--bg) text-(--text-primary) overflow-hidden relative">
      
      {/* Dynamic Background */}
      <div className="absolute top-[-10%] right-[-10%] w-[120vw] h-[120vw] sm:w-[600px] sm:h-[600px] bg-linear-to-bl from-(--gradient-start)/20 to-(--gradient-end)/10 rounded-full blur-[80px] pointer-events-none transition-all duration-1000 ease-in-out"></div>
      <div className="absolute bottom-[-10%] left-[-10%] w-[120vw] h-[120vw] sm:w-[600px] sm:h-[600px] bg-linear-to-tr from-(--gradient-end)/20 to-(--gradient-start)/10 rounded-full blur-[80px] pointer-events-none transition-all duration-1000 ease-in-out" style={{ transform: `scale(${1 + index * 0.1})` }}></div>
      
      <div className="flex-1 flex flex-col items-center justify-center relative z-10 w-full max-w-sm mx-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={index}
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: -20 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="w-full flex flex-col items-center"
          >
            {/* Visual Icon Box */}
            <div className="w-40 h-40 sm:w-48 sm:h-48 mb-10 rounded-full bg-linear-to-br from-(--gradient-start) to-(--gradient-end) shadow-2xl shadow-(--gradient-start)/30 flex items-center justify-center p-8 relative">
              <div className="absolute inset-0 rounded-full border-4 border-white/20 animate-[spin_6s_linear_infinite]"></div>
              {slides[index].icon}
            </div>

            {/* Textual Content */}
            <div className="text-center space-y-4">
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
                {slides[index].title}
              </h1>
              <p className="text-base sm:text-lg font-medium opacity-70 leading-relaxed px-4">
                {slides[index].description}
              </p>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom Section */}
      <div className="relative z-10 w-full max-w-sm mx-auto space-y-10 pb-8 tracking-wide">
        {/* Pagination Dots */}
        <div className="flex justify-center gap-3">
          {slides.map((_, i) => (
            <div
              key={i}
              className={`h-2.5 rounded-full transition-all duration-500 ease-out border border-transparent
                ${i === index 
                  ? "w-10 bg-(--accent) shadow-md shadow-(--gradient-start)/40" 
                  : "w-2.5 bg-(--border) hover:bg-(--border)/80"
                }`}
            />
          ))}
        </div>

        {/* Action Button */}
        <button
          onClick={handleNext}
          className="w-full py-4 rounded-2xl bg-linear-to-r from-(--gradient-start) to-(--gradient-end) text-white font-bold text-lg transition-all duration-300 shadow-xl shadow-(--gradient-start)/20 hover:shadow-2xl hover:brightness-110 active:scale-95 focus:outline-none"
        >
          {index === slides.length - 1 ? "Start Workspace" : "Continue"}
        </button>
      </div>
    </div>
  );
}