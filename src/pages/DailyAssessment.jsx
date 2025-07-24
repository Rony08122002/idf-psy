import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import Chart from 'chart.js/auto';

export default function DailyAssessment() {
  const navigate = useNavigate();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [completed, setCompleted] = useState(false);
  const [score, setScore] = useState(0);
  const [previousAssessments, setPreviousAssessments] = useState([]);
  const [userName, setUserName] = useState("");
  const [chartInstance, setChartInstance] = useState(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [showTips, setShowTips] = useState(false);

  const questions = [
    { 
      id: "sleep", 
      text: "איך ישנת בלילה האחרון?", 
      icon: "😴",
      options: [
        { value: 0, label: "לא ישנתי בכלל", color: "#ff4d4f" },
        { value: 1, label: "ישנתי מעט מאוד", color: "#ff7a45" },
        { value: 2, label: "ישנתי בינוני", color: "#ffc53d" },
        { value: 3, label: "ישנתי טוב", color: "#73d13d" },
        { value: 4, label: "ישנתי מצוין", color: "#52c41a" }
      ],
      tips: [
        "נסו לישון ולהתעורר באותה שעה כל יום, גם בסופי שבוע",
        "הימנעו ממסכים (טלפון, טלוויזיה) שעה לפני השינה",
        "עשו פעילות גופנית במהלך היום, אך לא סמוך לזמן השינה",
        "הקפידו על סביבת שינה נוחה, חשוכה ושקטה"
      ]
    },
    { 
      id: "anxiety", 
      text: "כמה חרדה או מתח אתה מרגיש היום?", 
      icon: "😰",
      options: [
        { value: 4, label: "בכלל לא", color: "#52c41a" },
        { value: 3, label: "מעט", color: "#73d13d" },
        { value: 2, label: "במידה בינונית", color: "#ffc53d" },
        { value: 1, label: "הרבה", color: "#ff7a45" },
        { value: 0, label: "מתח קיצוני", color: "#ff4d4f" }
      ],
      tips: [
        "תרגול נשימות עמוקות יכול להפחית חרדה במהירות",
        "שתפו חבר או בן משפחה בתחושות שלכם",
        "תרגילי הרפיה כמו הרפיית שרירים הדרגתית יכולים לסייע",
        "הגבילו צריכת קפאין ואלכוהול שיכולים להגביר חרדה"
      ]
    },
    { 
      id: "mood", 
      text: "איך המצב רוח שלך היום?", 
      icon: "😊",
      options: [
        { value: 0, label: "ירוד מאוד", color: "#ff4d4f" },
        { value: 1, label: "לא טוב", color: "#ff7a45" },
        { value: 2, label: "סביר", color: "#ffc53d" },
        { value: 3, label: "טוב", color: "#73d13d" },
        { value: 4, label: "מצוין", color: "#52c41a" }
      ],
      tips: [
        "פעילות גופנית משחררת אנדורפינים שמשפרים את מצב הרוח",
        "צרו לעצמכם זמן לפעילויות שאתם נהנים מהן",
        "בלו זמן בחוץ ובאור השמש",
        "שימו לב גם להישגים קטנים במהלך היום"
      ]
    },
    { 
      id: "support", 
      text: "האם אתה מרגיש שיש לך תמיכה מספקת סביבך?", 
      icon: "🤝",
      options: [
        { value: 0, label: "בכלל לא", color: "#ff4d4f" },
        { value: 1, label: "מעט מאוד", color: "#ff7a45" },
        { value: 2, label: "במידה מסוימת", color: "#ffc53d" },
        { value: 3, label: "כן, ברוב הזמן", color: "#73d13d" },
        { value: 4, label: "כן, תמיד", color: "#52c41a" }
      ],
      tips: [
        "אל תהססו לבקש עזרה כשאתם זקוקים לה",
        "נסו להשתתף בפעילויות חברתיות גם כשקשה",
        "שמרו על קשר עם חברים ומשפחה, גם בטלפון או וידאו",
        "שקלו להצטרף לקבוצות תמיכה או לפנות למוקדי תמיכה"
      ]
    },
    { 
      id: "motivation", 
      text: "איך המוטיבציה שלך לפעילויות יומיות?", 
      icon: "🚀",
      options: [
        { value: 0, label: "אין לי מוטיבציה", color: "#ff4d4f" },
        { value: 1, label: "מוטיבציה נמוכה", color: "#ff7a45" },
        { value: 2, label: "מוטיבציה בינונית", color: "#ffc53d" },
        { value: 3, label: "מוטיבציה טובה", color: "#73d13d" },
        { value: 4, label: "מוטיבציה גבוהה מאוד", color: "#52c41a" }
      ],
      tips: [
        "הציבו לעצמכם מטרות קטנות וברות השגה",
        "פרקו משימות גדולות לצעדים קטנים יותר",
        "תגמלו את עצמכם על התקדמות",
        "מצאו משמעות אישית במה שאתם עושים"
      ]
    },
  ];

  // טעינת נתונים קודמים בעת טעינת הדף
  useEffect(() => {
    const savedUserName = localStorage.getItem("userName");
    if (savedUserName) {
      setUserName(savedUserName);
    }
    
    const savedAssessments = JSON.parse(localStorage.getItem("assessments") || "[]");
    setPreviousAssessments(savedAssessments);
  }, []);

  // יצירת גרף המגמה כאשר יש נתונים
  useEffect(() => {
    if (completed && previousAssessments.length > 0) {
      createTrendChart();
    }
    
    return () => {
      if (chartInstance) {
        chartInstance.destroy();
      }
    };
  }, [completed, previousAssessments]);

  // פונקציה ליצירת גרף מגמה
  const createTrendChart = () => {
    if (chartInstance) {
      chartInstance.destroy();
    }
    
    const ctx = document.getElementById('trendChart');
    if (!ctx) return;
    
    // הכנת נתונים לגרף
    const last7Assessments = [...previousAssessments.slice(-7), { date: new Date().toISOString(), score }];
    
    const chartData = {
      labels: last7Assessments.map(a => {
        const date = new Date(a.date);
        return `${date.getDate()}/${date.getMonth() + 1}`;
      }),
      datasets: [
        {
          label: 'ציון הערכה',
          data: last7Assessments.map(a => a.score),
          fill: true,
          backgroundColor: 'rgba(75, 123, 236, 0.2)',
          borderColor: 'rgba(75, 123, 236, 1)',
          borderWidth: 2,
          pointBackgroundColor: 'rgba(75, 123, 236, 1)',
          pointRadius: 4,
          tension: 0.4
        }
      ]
    };
    
    const newChartInstance = new Chart(ctx, {
      type: 'line',
      data: chartData,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            max: 100,
            ticks: {
              color: '#475569'
            },
            grid: {
              color: 'rgba(0, 0, 0, 0.05)'
            }
          },
          x: {
            ticks: {
              color: '#475569'
            },
            grid: {
              display: false
            }
          }
        },
        plugins: {
          tooltip: {
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            titleColor: '#1e293b',
            bodyColor: '#475569',
            borderColor: 'rgba(75, 123, 236, 0.3)',
            borderWidth: 1,
            displayColors: false,
            callbacks: {
              title: function(tooltipItems) {
                const date = new Date(last7Assessments[tooltipItems[0].dataIndex].date);
                return date.toLocaleDateString('he-IL');
              }
            }
          },
          legend: {
            display: false
          }
        }
      }
    });
    
    setChartInstance(newChartInstance);
  };

  // טיפול בבחירת תשובה
  const handleAnswer = (value) => {
    setIsAnimating(true);
    
    // עדכון התשובות
    const newAnswers = {...answers, [questions[currentQuestion].id]: value};
    setAnswers(newAnswers);
    
    // המתנה לאנימציה
    setTimeout(() => {
      if (currentQuestion < questions.length - 1) {
        setCurrentQuestion(currentQuestion + 1);
      } else {
        finishAssessment(newAnswers);
      }
      setIsAnimating(false);
    }, 400);
  };
  
  // סיום ההערכה וחישוב תוצאות
  const finishAssessment = (newAnswers) => {
    // חישוב ציון כולל
    const totalScore = Object.values(newAnswers).reduce((sum, val) => sum + val, 0);
    const maxPossibleScore = questions.length * 4;
    const percentage = Math.round((totalScore / maxPossibleScore) * 100);
    setScore(percentage);
    
    // שמירת נתוני ההערכה
    const assessmentData = {
      date: new Date().toISOString(),
      answers: newAnswers,
      score: percentage
    };
    
    // שמירה בלוקל סטורג'
    const newAssessments = [...previousAssessments, assessmentData];
    localStorage.setItem("assessments", JSON.stringify(newAssessments));
    setPreviousAssessments(newAssessments);
    
    setCompleted(true);
  };

  // המלצות לפי הציון הכולל
  const getRecommendation = () => {
    if (score < 40) {
      return {
        text: "אנחנו מזהים שאתה עובר תקופה מאתגרת. מומלץ לפנות לקב\"ן או לגורם מקצועי בהקדם.",
        icon: "⚠️",
        color: "#ff4d4f",
        severity: "גבוהה"
      };
    } else if (score < 60) {
      return {
        text: "אנו מזהים שיש לך כמה קשיים. האם תרצה לדבר עם קב\"ן או גורם מקצועי?",
        icon: "⚠️",
        color: "#faad14",
        severity: "בינונית"
      };
    } else if (score < 80) {
      return {
        text: "נראה שמצבך סביר, אך יש מקום לשיפור. אנחנו כאן בשבילך אם תרצה לדבר.",
        icon: "📝",
        color: "#52c41a",
        severity: "נמוכה"
      };
    } else {
      return {
        text: "נראה שמצבך הנפשי טוב! המשך כך, ואל תשכח שאנחנו תמיד כאן בשבילך.",
        icon: "🌟",
        color: "#1890ff",
        severity: "תקין"
      };
    }
  };

  // התחלת הערכה חדשה
  const restartAssessment = () => {
    setCurrentQuestion(0);
    setAnswers({});
    setCompleted(false);
    setScore(0);
    setShowTips(false);
  };

  // יצירת חיווי צבעוני לציון
  const getScoreColor = () => {
    if (score < 40) return "#ff4d4f";
    if (score < 60) return "#faad14";
    if (score < 80) return "#52c41a";
    return "#1890ff";
  };

  return (
    <div className="min-h-screen p-4 bg-gradient-to-br from-blue-50 to-purple-50">
      <div className="max-w-xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <button 
            onClick={() => navigate("/")} 
            className="bg-white px-4 py-2 rounded-full shadow-sm border border-gray-200 hover:bg-gray-50 transition flex items-center gap-2"
          >
            <span className="text-blue-600">🏠</span> חזרה לעמוד הראשי
          </button>
          <h2 className="text-2xl font-bold text-center text-blue-800">הערכת מצב יומית</h2>
          <div className="w-24"></div> {/* שומר מקום לאיזון */}
        </div>
        
        {!completed ? (
          <motion.div
            key={currentQuestion}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.3 }}
            className="bg-white rounded-xl p-6 shadow-lg flex-grow flex flex-col"
          >
            <div className="text-center mb-1 text-blue-600">
              שאלה {currentQuestion + 1} מתוך {questions.length}
            </div>
            <div className="h-2 w-full bg-gray-100 rounded-full mb-6">
              <motion.div 
                className="h-2 bg-blue-600 rounded-full" 
                initial={{ width: `${((currentQuestion) / questions.length) * 100}%` }}
                animate={{ width: `${((currentQuestion + 1) / questions.length) * 100}%` }}
                transition={{ duration: 0.5 }}
              ></motion.div>
            </div>
            
            <div className="text-center mb-8">
              <div className="text-5xl mb-4">{questions[currentQuestion].icon}</div>
              <h3 className="text-xl font-medium text-gray-800">{questions[currentQuestion].text}</h3>
            </div>
            
            <div className="space-y-3 flex-grow">
              {questions[currentQuestion].options.map((option) => (
                <motion.button
                  key={option.value}
                  onClick={() => !isAnimating && handleAnswer(option.value)}
                  className="w-full text-right p-4 rounded-lg border border-gray-200 hover:bg-blue-50 transition shadow-sm hover:shadow-md"
                  style={{ backgroundColor: `${option.color}15` }} /* צבע קלוש של האפשרות */
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="flex items-center justify-between">
                    <span>{option.label}</span>
                    <span className="w-4 h-4 rounded-full" style={{ backgroundColor: option.color }}></span>
                  </div>
                </motion.button>
              ))}
            </div>
            
            <div className="mt-4">
              <button 
                onClick={() => setShowTips(!showTips)}
                className="text-blue-600 text-sm hover:text-blue-800 flex items-center gap-1"
              >
                <span>{showTips ? "הסתר" : "הצג"} טיפים</span>
                <span>{showTips ? "🔼" : "🔽"}</span>
              </button>
              
              {showTips && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-100"
                >
                  <h4 className="font-medium text-blue-700 mb-2">טיפים מועילים:</h4>
                  <ul className="list-disc list-inside space-y-1 text-sm text-blue-800">
                    {questions[currentQuestion].tips.map((tip, index) => (
                      <li key={index}>{tip}</li>
                    ))}
                  </ul>
                </motion.div>
              )}
            </div>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl shadow-lg overflow-hidden"
          >
            {/* כותרת התוצאות */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 text-center">
              <h3 className="text-2xl font-bold mb-2">תוצאות ההערכה</h3>
              <p className="opacity-90">{userName ? `${userName}, ` : ""}תודה שהשלמת את ההערכה היומית!</p>
            </div>
            
            <div className="p-6">
              {/* חיווי ציון */}
              <div className="mb-8">
                <div className="flex justify-between mb-1 text-sm">
                  <span>0</span>
                  <span>הציון שלך: {score}</span>
                  <span>100</span>
                </div>
                
                <div className="relative h-6 bg-gray-200 rounded-full overflow-hidden">
                  <motion.div 
                    className="h-full rounded-full"
                    style={{ backgroundColor: getScoreColor() }}
                    initial={{ width: 0 }}
                    animate={{ width: `${score}%` }}
                    transition={{ duration: 1, delay: 0.2 }}
                  ></motion.div>
                  
                  <motion.div
                    className="absolute top-0 right-0 h-full w-1 bg-white"
                    initial={{ right: 0 }}
                    animate={{ right: `${score}%` }}
                    transition={{ duration: 1, delay: 0.2 }}
                  >
                    <div 
                      className="absolute top-full right-0 transform translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full border-2 border-white shadow-md"
                      style={{ backgroundColor: getScoreColor() }}
                    ></div>
                  </motion.div>
                </div>
                
                <div className="flex justify-between mt-1 text-xs text-gray-600">
                  <span>נמוך</span>
                  <span>בינוני</span>
                  <span>גבוה</span>
                </div>
              </div>
              
              {/* המלצות */}
              <div className="mb-8 bg-gray-50 rounded-lg p-4 border-r-4" style={{ borderColor: getRecommendation().color }}>
                <div className="flex gap-3">
                  <div className="text-2xl">{getRecommendation().icon}</div>
                  <div>
                    <div className="font-medium mb-1">
                      רמת דחיפות: <span style={{ color: getRecommendation().color }}>{getRecommendation().severity}</span>
                    </div>
                    <p>{getRecommendation().text}</p>
                  </div>
                </div>
              </div>
              
              {/* גרף מגמה */}
              {previousAssessments.length > 0 && (
                <div className="mb-8">
                  <h4 className="font-medium text-gray-700 mb-2">מגמה לאורך זמן:</h4>
                  <div className="bg-white rounded-lg p-2 border border-gray-200 shadow-sm" style={{ height: "200px" }}>
                    <canvas id="trendChart"></canvas>
                  </div>
                </div>
              )}
              
              {/* כפתורים */}
              <div className="flex flex-col space-y-3 mt-6">
                <button 
                  onClick={restartAssessment}
                  className="bg-blue-600 text-white px-4 py-3 rounded-xl hover:bg-blue-700 transition shadow-md hover:shadow-lg flex items-center justify-center gap-2"
                >
                  <span>🔄</span> בצע הערכה חדשה
                </button>
                
                {score < 60 && (
                  <button 
                    className="bg-pink-600 text-white px-4 py-3 rounded-xl hover:bg-pink-700 transition shadow-md hover:shadow-lg flex items-center justify-center gap-2"
                    onClick={() => navigate("/chat")}
                  >
                    <span>💬</span> דבר עם חיילתAI
                  </button>
                )}
                
                <button 
                  onClick={() => navigate("/stats")}
                  className="bg-green-600 text-white px-4 py-3 rounded-xl hover:bg-green-700 transition shadow-md hover:shadow-lg flex items-center justify-center gap-2"
                >
                  <span>📊</span> צפה בהיסטוריה שלך
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}