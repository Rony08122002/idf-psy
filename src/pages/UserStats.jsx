import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

export default function UserStats() {
  const navigate = useNavigate();
  const [assessments, setAssessments] = useState([]);
  const [trend, setTrend] = useState("stable");
  const [userName, setUserName] = useState("");
  const [days, setDays] = useState(0);

  useEffect(() => {
    // Load data from localStorage
    const savedAssessments = JSON.parse(localStorage.getItem("assessments") || "[]");
    const savedName = localStorage.getItem("userName") || "";
    
    setAssessments(savedAssessments);
    setUserName(savedName);
    
    // Calculate days using app
    if (savedAssessments.length > 0) {
      const firstUseDate = new Date(savedAssessments[0].date);
      const today = new Date();
      const diffTime = Math.abs(today - firstUseDate);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      setDays(diffDays);
    }
    
    // Calculate trend
    if (savedAssessments.length > 1) {
      const recentScores = savedAssessments.slice(-3).map(a => a.score);
      const average = recentScores.reduce((sum, score) => sum + score, 0) / recentScores.length;
      const firstAvg = savedAssessments.slice(0, 3).map(a => a.score).reduce((sum, score) => sum + score, 0) / Math.min(3, savedAssessments.length);
      
      if (average > firstAvg + 5) setTrend("improving");
      else if (average < firstAvg - 5) setTrend("declining");
      else setTrend("stable");
    }
  }, []);

  const getMostRecentScore = () => {
    if (assessments.length === 0) return 0;
    return assessments[assessments.length - 1].score;
  };

  const getAverageScore = () => {
    if (assessments.length === 0) return 0;
    const sum = assessments.reduce((total, assessment) => total + assessment.score, 0);
    return Math.round(sum / assessments.length);
  };

  const getTrendIcon = () => {
    switch(trend) {
      case "improving": return "📈";
      case "declining": return "📉";
      case "stable": return "📊";
      default: return "📊";
    }
  };

  const getTrendMessage = () => {
    switch(trend) {
      case "improving": 
        return "מצבך הנפשי משתפר עם הזמן. המשך כך!";
      case "declining": 
        return "שים לב, יש ירידה במצבך הנפשי לאחרונה. שקול לדבר עם גורם מקצועי.";
      case "stable": 
        return "מצבך הנפשי יציב יחסית לאורך זמן.";
      default: 
        return "אין מספיק נתונים עדיין להערכת מגמה.";
    }
  };

  return (
    <div className="p-4 max-w-xl mx-auto min-h-screen flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <button 
          onClick={() => navigate("/")} 
          className="text-blue-600 flex items-center"
        >
          <span className="mr-1">🏠</span> חזרה לעמוד הראשי
        </button>
        <h2 className="text-2xl font-bold text-center">נתונים והיסטוריה</h2>
        <div className="w-24"></div> {/* שומר מקום לאיזון */}
      </div>
      
      <div className="bg-white rounded-xl p-6 shadow-md flex-grow">
        <div className="text-center mb-6">
          {userName && <h3 className="text-xl mb-2">שלום {userName}</h3>}
          <p className="text-gray-600">
            {days > 0 ? `${days} ימים` : "פחות מיום"} מאז תחילת השימוש באפליקציה
          </p>
        </div>
        
        {assessments.length === 0 ? (
          <div className="text-center p-8">
            <p className="text-gray-500 mb-4">עדיין אין נתונים להצגה.</p>
            <button 
              onClick={() => navigate("/assessment")} 
              className="bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700 transition"
            >
              בצע הערכה ראשונה
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-blue-50 p-4 rounded-lg text-center">
                <div className="text-3xl font-bold text-blue-600">{assessments.length}</div>
                <div className="text-sm text-gray-700">הערכות שהושלמו</div>
              </div>
              
              <div className="bg-green-50 p-4 rounded-lg text-center">
                <div className="text-3xl font-bold text-green-600">{getAverageScore()}%</div>
                <div className="text-sm text-gray-700">ציון ממוצע</div>
              </div>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg mb-6">
              <div className="flex items-center justify-between mb-2">
                <div className="text-lg">מגמה לאורך זמן</div>
                <div className="text-2xl">{getTrendIcon()}</div>
              </div>
              <p className="text-gray-700">{getTrendMessage()}</p>
            </div>
            
            <div>
              <h3 className="font-bold mb-2">היסטוריית הערכות</h3>
              <div className="max-h-40 overflow-y-auto space-y-2">
                {assessments.slice().reverse().map((assessment, index) => (
                  <div key={index} className="flex justify-between p-2 border-b">
                    <div className="text-gray-600">
                      {new Date(assessment.date).toLocaleDateString('he-IL')}
                    </div>
                    <div className={`font-medium ${
                      assessment.score < 40 ? 'text-red-600' : 
                      assessment.score < 60 ? 'text-yellow-600' : 
                      assessment.score < 80 ? 'text-blue-600' : 
                      'text-green-600'
                    }`}>
                      {assessment.score}%
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
      
      {assessments.length > 0 && getMostRecentScore() < 50 && (
        <motion.div 
          className="bg-red-50 border border-red-200 p-4 rounded-lg mt-4"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
        >
          <div className="font-bold text-red-700 mb-1">שים לב</div>
          <p className="text-red-700">
            מצבך הנפשי עלול להצביע על קושי. שקול לפנות לקב"ן או איש מקצוע.
          </p>
          <button 
            className="mt-2 bg-red-600 text-white px-4 py-1 rounded-lg hover:bg-red-700 transition"
            onClick={() => navigate("/chat")}
          >
            דבר עם חיילתAI
          </button>
        </motion.div>
      )}
      
      <div className="flex gap-3 mt-4">
        <button 
          onClick={() => navigate("/assessment")} 
          className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700 transition"
        >
          הערכה חדשה
        </button>
        <button 
          onClick={() => navigate("/chat")} 
          className="flex-1 bg-pink-600 text-white px-4 py-2 rounded-xl hover:bg-pink-700 transition"
        >
          דבר עם חיילתAI
        </button>
      </div>
    </div>
  );
}