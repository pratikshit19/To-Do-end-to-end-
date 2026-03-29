import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import "../Onboarding.css";

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
    <div className="onboarding-container">
      <AnimatePresence mode="wait">
        <motion.div
          key={index}
          className="onboarding-content"
          initial={{ opacity: 0, x: 80 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -80 }}
          transition={{ duration: 0.4 }}
        >
          <h1>{slides[index].title}</h1>
          <p>{slides[index].description}</p>
        </motion.div>
      </AnimatePresence>

      <div className="bottom-section">
        <div className="dots">
          {slides.map((_, i) => (
            <div
              key={i}
              className={`dot ${i === index ? "active" : ""}`}
            />
          ))}
        </div>

        <button onClick={handleNext} className="onboarding-btn">
          {index === slides.length - 1 ? "Get Started" : "Next"}
        </button>
      </div>
    </div>
  );
}