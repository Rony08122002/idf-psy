import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

/**
 * מרכיב לייאאוט ראשי לאפליקציית חיילתAI
 * עם תיקונים לבעיות תצוגה וז-אינדקס
 */
const Layout = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [userName, setUserName] = useState("");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // טעינת שם משתמש ומצב תצוגה
  useEffect(() => {
    const savedUserName = localStorage.getItem("userName") || "";
    setUserName(savedUserName);
    
    const darkModePreference = localStorage.getItem("darkMode") === "true";
    setIsDarkMode(darkModePreference);
    
    // הוספת מחלקת dark-theme לפי הצורך
    if (darkModePreference) {
      document.documentElement.classList.add('dark-theme');
    } else {
      document.documentElement.classList.remove('dark-theme');
    }
    
    // סימולציה של טעינה
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 800);
    
    return () => clearTimeout(timer);
  }, []);

  // עדכון מצב תצוגה כהה/בהירה
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark-theme');
    } else {
      document.documentElement.classList.remove('dark-theme');
    }
    localStorage.setItem("darkMode", isDarkMode);
  }, [isDarkMode]);

  // פונקציה להחלפת מצב תצוגה
  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
  };

  // פונקציה לסגירת התפריט הנייד
  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  // אייקונים לתפריט
  const menuItems = [
    { path: "/", label: "דף הבית", icon: "🏠" },
    { path: "/chat", label: "שיחה עם חיילתAI", icon: "💬" },
    { path: "/assessment", label: "הערכת מצב יומית", icon: "📋" },
    { path: "/stats", label: "היסטוריה וסטטיסטיקות", icon: "📊" },
  ];

  // בדיקה אם הקישור פעיל
  const isActive = (path) => {
    return location.pathname === path;
  };

  // אנימציות למעבר בין דפים
  const pageVariants = {
    initial: {
      opacity: 0,
      y: 20,
    },
    in: {
      opacity: 1,
      y: 0,
    },
    out: {
      opacity: 0,
      y: -20,
    },
  };

  const pageTransition = {
    type: "tween",
    ease: "easeInOut",
    duration: 0.3,
  };

  return (
    <div className={`app-layout ${isDarkMode ? 'dark-theme' : ''}`}>
      {isLoading ? (
        <div className="loading-screen">
          <div className="loader-container">
            <div className="spinner"></div>
            <p className="loading-text">טוען את האפליקציה...</p>
          </div>
        </div>
      ) : (
        <>
          {/* תפריט צד נייד */}
          <AnimatePresence>
            {isMenuOpen && (
              <motion.div
                className="mobile-menu-overlay"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                onClick={closeMenu}
              >
                <motion.div
                  className="mobile-menu"
                  initial={{ x: "-100%" }}
                  animate={{ x: 0 }}
                  exit={{ x: "-100%" }}
                  transition={{ type: "tween", duration: 0.3 }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="mobile-menu-header">
                    <img
                      src="/src/assets/soldierWithPins.png"
                      alt="חיילתAI"
                      className="mobile-menu-logo"
                    />
                    <button className="close-menu-btn" onClick={closeMenu}>
                      ✕
                    </button>
                  </div>

                  <div className="mobile-menu-user">
                    {userName ? (
                      <p>שלום, {userName}!</p>
                    ) : (
                      <p>שלום, אורח!</p>
                    )}
                  </div>

                  <nav className="mobile-nav">
                    <ul>
                      {menuItems.map((item) => (
                        <li key={item.path}>
                          <Link
                            to={item.path}
                            className={`mobile-nav-link ${
                              isActive(item.path) ? "active" : ""
                            }`}
                            onClick={closeMenu}
                          >
                            <span className="mobile-nav-icon">{item.icon}</span>
                            <span>{item.label}</span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </nav>

                  <div className="mobile-menu-footer">
                    <button
                      className="theme-toggle-btn"
                      onClick={toggleDarkMode}
                    >
                      {isDarkMode ? "☀️ מצב בהיר" : "🌙 מצב כהה"}
                    </button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* תפריט ראשי */}
          <header className="app-header">
            <div className="header-container">
              <button
                className="menu-toggle-btn"
                onClick={() => setIsMenuOpen(true)}
              >
                ☰
              </button>

              <div className="logo-container">
                <img
                  src="/src/assets/soldierWithPins.png"
                  alt="חיילתAI"
                  className="header-logo"
                  onClick={() => navigate("/")}
                />
                <h1 className="header-title" onClick={() => navigate("/")}>
                  חיילתAI
                </h1>
              </div>

              <nav className="desktop-nav">
                <ul>
                  {menuItems.map((item) => (
                    <li key={item.path}>
                      <Link
                        to={item.path}
                        className={`nav-link ${
                          isActive(item.path) ? "active" : ""
                        }`}
                      >
                        <span className="nav-icon">{item.icon}</span>
                        <span className="nav-label">{item.label}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>

              <div className="header-actions">
                <button
                  className="theme-toggle-btn desktop-only"
                  onClick={toggleDarkMode}
                  title={isDarkMode ? "עבור למצב בהיר" : "עבור למצב כהה"}
                >
                  {isDarkMode ? "☀️" : "🌙"}
                </button>
              </div>
            </div>
          </header>

          {/* תוכן העמוד */}
          <main className="app-main">
            <AnimatePresence mode="wait">
              <motion.div
                key={location.pathname}
                className="page-container"
                initial="initial"
                animate="in"
                exit="out"
                variants={pageVariants}
                transition={pageTransition}
              >
                {children}
              </motion.div>
            </AnimatePresence>
          </main>

          {/* כותרת תחתונה */}
          <footer className="app-footer">
            <div className="footer-container">
              <p className="copyright">
                © {new Date().getFullYear()} חיילתAI - כל הזכויות שמורות
              </p>
              <p className="footer-note">
                פותח לתמיכה בחיילי ומשרתי צה"ל
              </p>
            </div>
          </footer>
        </>
      )}
    </div>
  );
};

export default Layout;