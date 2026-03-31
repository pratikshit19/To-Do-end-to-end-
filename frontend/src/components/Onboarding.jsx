import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const slides = [
  {
    title: "Organize Your Tasks",
    description: "Create, manage and complete tasks effortlessly.",
  },
  {
    title: "Track Productivity",
    description: "Visual insights to measure your progress.",
  },
  {
    title: "Stay Consistent",
    description: "Build habits and stay ahead every day.",
  },
];

export default function Onboarding({ onFinish }) {
  const [index, setIndex] = useState(0);

  const handleNext = () => {
    if (index < slides.length - 1) {
      setIndex(index + 1);
    } else {
      localStorage.setItem("onboardingDone", "true");
      onFinish();
    }
  };

  return (
    <div
      className="
        min-h-screen 
        flex flex-col 
        justify-between 
        px-6 py-12
        bg-white dark:bg-[#0f172a]
        text-gray-900 dark:text-gray-100
      "
    >
      {/* Center Content */}
      <div className="flex-1 flex items-center justify-center">
        <div className="w-full max-w-xl text-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={index}
              initial={{ opacity: 0, x: 80 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -80 }}
              transition={{ duration: 0.4 }}
              className="space-y-6"
            >
              <h1 className="text-3xl md:text-5xl font-bold leading-tight">
                {slides[index].title}
              </h1>

              <p className="text-base md:text-lg opacity-70 max-w-md mx-auto">
                {slides[index].description}
              </p>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Bottom Section */}
      <div className="space-y-8">
        {/* Dots */}
        <div className="flex justify-center gap-3">
          {slides.map((_, i) => (
            <div
              key={i}
              className={`
                h-2 rounded-full transition-all duration-300
                ${i === index 
                  ? "w-8 bg-cyan-500" 
                  : "w-2 bg-gray-300 dark:bg-slate-600"}
              `}
            />
          ))}
        </div>

        {/* Button */}
        <div className="flex justify-center">
          <button
            onClick={handleNext}
            className="
              w-full max-w-xs
              py-3 rounded-xl
              bg-cyan-500 hover:bg-cyan-600
              text-white font-semibold
              transition-all duration-200
              shadow-md
              active:scale-95
            "
          >
            {index === slides.length - 1 ? "Get Started" : "Next"}
          </button>
        </div>
      </div>
    </div>
  );
}