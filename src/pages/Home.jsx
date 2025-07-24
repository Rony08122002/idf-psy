import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

export default function Home() {
  const navigate = useNavigate();
  const [userName, setUserName] = useState("");
  const [hasHistory, setHasHistory] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [animateAvatar, setAnimateAvatar] = useState(false);

  useEffect(() => {
    // בדיקה אם יש כבר היסטוריה של שיחות
    const chatHistory = localStorage.getItem("chatHistory");
    const storedName = localStorage.getItem("userName");
    
    if (storedName) {
      setUserName(storedName);
    }
    
    if (chatHistory) {
      setHasHistory(true);
    }
    
    // סימולציה של טעינה
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 800);
    
    return () => clearTimeout(timer);
  }, []);

  // טריגר האנימציה של האוואטר כל 10 שניות
  useEffect(() => {
    const intervalId = setInterval(() => {
      setAnimateAvatar(true);
      setTimeout(() => setAnimateAvatar(false), 2000);
    }, 10000);
    
    return () => clearInterval(intervalId);
  }, []);

  // וריאנטים לאנימציות כרטיסים
  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: {
        type: "spring",
        stiffness: 250,
        damping: 20,
        delay: 0.3
      }
    },
    hover: {
      y: -5,
      boxShadow: "0 10px 25px rgba(0, 0, 0, 0.12)"
    }
  };

  // וריאנטים לאנימציות כפתורים
  const buttonVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: i => ({ 
      opacity: 1, 
      y: 0,
      transition: {
        type: "spring",
        stiffness: 250,
        damping: 20,
        delay: 0.6 + (i * 0.1)
      }
    }),
    hover: {
      scale: 1.05,
      transition: {
        duration: 0.2
      }
    },
    tap: {
      scale: 0.95
    }
  };

  // וריאנטים לאנימציית אוואטר
  const avatarVariants = {
    normal: { rotate: 0, scale: 1 },
    wave: {
      rotate: [0, 10, -10, 10, 0],
      scale: [1, 1.1, 1.1, 1.1, 1],
      transition: {
        duration: 1.5
      }
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="loader-container">
          <div className="spinner"></div>
          <p className="mt-4 text-primary-color">טוען את האפליקציה...</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen flex flex-col justify-center items-center py-8 px-4"
    >
      <motion.div
        variants={cardVariants}
        initial="hidden"
        animate="visible"
        whileHover="hover"
        className="card-modern w-full max-w-md mb-8"
      >
        <div className="card-header-gradient relative overflow-hidden">
          <motion.div 
            className="absolute inset-0 bg-blue-600 opacity-20"
            animate={{ 
              background: [
                "radial-gradient(circle at 20% 20%, rgba(255, 255, 255, 0.3) 0%, rgba(255, 255, 255, 0) 70%)",
                "radial-gradient(circle at 80% 80%, rgba(255, 255, 255, 0.3) 0%, rgba(255, 255, 255, 0) 70%)"
              ]
            }}
            transition={{ 
              duration: 8, 
              repeat: Infinity, 
              repeatType: "reverse" 
            }}
          />
          
          <div className="relative z-10 py-6">
            <motion.div
              className="mb-4 relative mx-auto w-32 h-32"
              variants={avatarVariants}
              animate={animateAvatar ? "wave" : "normal"}
            >
              <div className="avatar-modern avatar-modern-xl overflow-hidden">
                <img
                  src="/src/assets/soldierWithPins.png"
                  alt="חיילת"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="absolute -top-1 -right-1 bg-green-500 w-4 h-4 rounded-full border-2 border-white"></div>
            </motion.div>
            
            <h1 className="text-2xl font-bold mb-1 text-white">
              {userName ? `ברוך שובך, ${userName}!` : "ברוכים הבאים לחיילתAI"}
            </h1>
            <p className="text-gray-100 text-sm">
              מערכת תמיכה נפשית לחיילים ומשרתי צה"ל
            </p>
          </div>
        </div>
        
        <div className="card-content">
          <p className="text-center mb-6">
            האפליקציה כאן כדי לבדוק מה שלומך כל יום, להקשיב, לאבחן ולהציע עזרה במידת הצורך.
            <span className="block mt-2 text-primary-color font-medium">יחד דואגים שאף אחד לא נשאר לבד 💙</span>
          </p>
          
          <div className="flex flex-col gap-4">
            <motion.button
              variants={buttonVariants}
              custom={0}
              initial="hidden"
              animate="visible"
              whileHover="hover"
              whileTap="tap"
              onClick={() => navigate("/chat")}
              className="btn-modern btn-primary-modern w-full"
            >
              <span className="text-xl">💬</span>
              {hasHistory ? "המשך שיחה" : "התחל שיחה"}
            </motion.button>
            
            <motion.button
              variants={buttonVariants}
              custom={1}
              initial="hidden"
              animate="visible"
              whileHover="hover"
              whileTap="tap"
              onClick={() => navigate("/assessment")}
              className="btn-modern btn-secondary-modern w-full"
            >
              <span className="text-xl">📋</span>
              הערכת מצב יומית
            </motion.button>
            
            {hasHistory && (
              <motion.button
                variants={buttonVariants}
                custom={2}
                initial="hidden"
                animate="visible"
                whileHover="hover"
                whileTap="tap"
                onClick={() => navigate("/stats")}
                className="btn-modern btn-outline-modern w-full"
              >
                <span className="text-xl">📊</span>
                היסטוריה וסטטיסטיקות
              </motion.button>
            )}
          </div>
        </div>
        
        <div className="card-footer flex justify-center">
          <div className="flex space-x-2 rtl:space-x-reverse">
            <span className="badge-modern badge-primary-modern badge-modern-pill">AI</span>
            <span className="badge-modern badge-secondary-modern badge-modern-pill">צה"ל</span>
            <span className="badge-modern badge-success-modern badge-modern-pill">תמיכה נפשית</span>
          </div>
        </div>
      </motion.div>
      
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
        className="glass-effect p-3 rounded-lg text-center text-sm text-gray-600 max-w-md"
      >
        <div className="flex items-center justify-center gap-2 mb-1">
          <span className="w-2 h-2 bg-green-500 rounded-full"></span>
          <p>פיתוח ע"י צוות חיילתAI - כל הנתונים נשמרים באופן מאובטח</p>
        </div>
        <p className="text-xs opacity-75">גרסה 1.0 - עדכון אחרון: {new Date().toLocaleDateString()}</p>
      </motion.div>
    </motion.div>
  );
}