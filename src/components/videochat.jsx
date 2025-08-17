import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import VoiceService from "../services/VoiceService";
import AIService from "../services/AIService";

/**
 * קומפוננטת שיחת וידאו משופרת עם אנימציית פנים לחיילת
 */
const ImprovedVideoChat = ({ onClose, userName, onResetConversation }) => {
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isAudioOn, setIsAudioOn] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [hasPermission, setHasPermission] = useState(null);
  const [transcript, setTranscript] = useState("");
  const [botResponse, setBotResponse] = useState("");
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [fullScreen, setFullScreen] = useState(false);
  const [mouthAnimation, setMouthAnimation] = useState("closed");
  const [blinkState, setBlinkState] = useState("open");
  const [videoFilter, setVideoFilter] = useState("none");
  const [showFilters, setShowFilters] = useState(false);
  const [emotionState, setEmotionState] = useState("neutral");
  
  const videoRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const userStreamRef = useRef(null);
  const containerRef = useRef(null);
  const mouthAnimationRef = useRef(null);
  const blinkAnimationRef = useRef(null);
  const canvasRef = useRef(null);
  
  // אנימציית פה
  useEffect(() => {
    // אנימציית פה אקראית כשהחיילת מדברת
    if (isSpeaking) {
      mouthAnimationRef.current = setInterval(() => {
        setMouthAnimation(prev => {
          const states = ["slightly-open", "open", "wide-open", "closed"];
          const currentIndex = states.indexOf(prev);
          const nextIndex = Math.floor(Math.random() * states.length);
          return states[nextIndex];
        });
      }, 150);
    } else {
      if (mouthAnimationRef.current) {
        clearInterval(mouthAnimationRef.current);
        mouthAnimationRef.current = null;
        setMouthAnimation("closed");
      }
    }
    
    return () => {
      if (mouthAnimationRef.current) {
        clearInterval(mouthAnimationRef.current);
        mouthAnimationRef.current = null;
      }
    };
  }, [isSpeaking]);
  
  // אנימציית מצמוץ
  useEffect(() => {
    // מצמוץ אקראי
    const startBlinking = () => {
      blinkAnimationRef.current = setInterval(() => {
        setBlinkState("closed");
        
        // פתיחת עיניים לאחר 150 מילישניות
        setTimeout(() => {
          setBlinkState("open");
        }, 150);
      }, 3000 + Math.random() * 2000); // מצמוץ כל 3-5 שניות
    };
    
    startBlinking();
    
    return () => {
      if (blinkAnimationRef.current) {
        clearInterval(blinkAnimationRef.current);
        blinkAnimationRef.current = null;
      }
    };
  }, []);
  
  // בקשת הרשאות למצלמה ומיקרופון
  useEffect(() => {
    const requestPermissions = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: true,
          audio: true 
        });
        
        userStreamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        
        setHasPermission(true);
      } catch (err) {
        console.error("Error accessing media devices:", err);
        setHasPermission(false);
      }
    };
    
    requestPermissions();
    
    // ניקוי בעת סגירת הקומפוננטה
    return () => {
      if (userStreamRef.current) {
        userStreamRef.current.getTracks().forEach(track => track.stop());
      }
      VoiceService.stopSpeaking();
      VoiceService.stopListening();
    };
  }, []);
  
  // פונקציה לקבלת מסך מלא
  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      if (containerRef.current.requestFullscreen) {
        containerRef.current.requestFullscreen();
        setFullScreen(true);
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
        setFullScreen(false);
      }
    }
  };
  
  // האזנה ליציאה ממסך מלא
  useEffect(() => {
    const handleFullscreenChange = () => {
      setFullScreen(!!document.fullscreenElement);
    };
    
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  // שינוי אנימציית פנים לפי מצב רגשי
  useEffect(() => {
    // התאמת הבעת פנים לפי מצב רגשי הבוט
    if (messages.length > 0) {
      const lastBotMessage = [...messages].reverse().find(msg => msg.from === 'bot');
      if (lastBotMessage) {
        // ניתוח רגש בסיסי מההודעה
        let newEmotionState = "neutral";
        const text = lastBotMessage.text.toLowerCase();
        
        if (text.includes("שמח") || text.includes("נפלא") || text.includes("מצוין")) {
          newEmotionState = "happy";
        } else if (text.includes("מצטער") || text.includes("סליחה")) {
          newEmotionState = "sad";
        } else if (text.includes("מודאג") || text.includes("חשוב") || text.includes("רציני")) {
          newEmotionState = "concerned";
        }
        
        setEmotionState(newEmotionState);
      }
    }
  }, [messages]);
  
  // הוספת הודעת ברוכים הבאים
  useEffect(() => {
    const welcomeMessage = userName 
      ? `שלום ${userName}, נעים להכיר אותך פנים אל פנים. איך אני יכולה לעזור לך היום?` 
      : "שלום! נעים להכיר אותך פנים אל פנים. איך אני יכולה לעזור לך היום?";
    
    setMessages([{ 
      from: "bot", 
      text: welcomeMessage 
    }]);
    
    // הקראת הודעת הפתיחה
    setTimeout(() => {
      speakText(welcomeMessage);
    }, 1000);
  }, [userName]);
  
  // הפעלת/עצירת הקלטת קול
  const toggleRecording = () => {
    if (isRecording) {
      VoiceService.stopListening();
      setIsRecording(false);
      
      // אם יש טקסט שזוהה, שליחתו כהודעה
      if (transcript) {
        handleSpeechInput(transcript);
      }
    } else {
      setTranscript("");
      
      const success = VoiceService.startListening(
        (result) => {
          setTranscript(result.finalTranscript || result.interimTranscript);
          
          // אם יש טקסט סופי עם אורך סביר, שלח אוטומטית
          if (result.finalTranscript && result.finalTranscript.length > 2) {
            handleSpeechInput(result.finalTranscript);
            VoiceService.stopListening();
            setIsRecording(false);
            setTranscript("");
          }
        },
        (error) => {
          console.error("Voice recognition error:", error);
          setIsRecording(false);
          
          // הוספת הודעת שגיאה לצ'אט
          setMessages(prev => [...prev, { 
            from: "system", 
            text: `שגיאה: ${error.message || "בעיה בזיהוי קולי"}`
          }]);
        }
      );
      
      if (success) {
        setIsRecording(true);
      }
    }
  };
  
  // הקראת טקסט עם אנימציית פה
  const speakText = (text) => {
    setIsSpeaking(true);
    
    VoiceService.speak(text, {
      onEnd: () => {
        setIsSpeaking(false);
      },
      onError: (error) => {
        console.error("Speech error:", error);
        setIsSpeaking(false);
        
        // הוספת הודעת שגיאה לצ'אט
        setMessages(prev => [...prev, { 
          from: "system", 
          text: "לא ניתן להקריא את ההודעה. נסה שוב מאוחר יותר."
        }]);
      }
    });
  };
  
  // טיפול בטקסט שזוהה מדיבור
  const handleSpeechInput = async (text) => {
    if (!text.trim()) return;
    
    // הוספת הודעת המשתמש
    setMessages(prev => [...prev, { from: "user", text }]);
    setIsLoading(true);
    
    try {
      // קבלת תשובה מה-AI
      const response = await AIService.sendMessage(text);
      
      // הוספת תשובת הבוט
      setMessages(prev => [...prev, { from: "bot", text: response }]);
      
      // הקראת התשובה
      speakText(response);
    } catch (error) {
      console.error("Error getting response:", error);
      const errorMessage = "סליחה, היתה בעיה בקבלת תשובה. אפשר לנסות שוב?";
      setMessages(prev => [...prev, { from: "bot", text: errorMessage }]);
      speakText(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };
  
  // הפעלת/כיבוי מצלמה
  const toggleVideo = () => {
    if (userStreamRef.current) {
      userStreamRef.current.getVideoTracks().forEach(track => {
        track.enabled = !isVideoOn;
      });
      setIsVideoOn(!isVideoOn);
    }
  };
  
  // הפעלת/כיבוי מיקרופון
  const toggleAudio = () => {
    if (userStreamRef.current) {
      userStreamRef.current.getAudioTracks().forEach(track => {
        track.enabled = !isAudioOn;
      });
      setIsAudioOn(!isAudioOn);
    }
  };
  
  // אפשרות להתחיל שיחה מחדש
  const handleResetConversation = () => {
    if (window.confirm("האם אתה בטוח שברצונך להתחיל שיחה חדשה?")) {
      // ניקוי היסטוריה מקומית
      setMessages([]);
      setTranscript("");
      
      // אם יש פונקציית איפוס חיצונית
      if (onResetConversation) {
        onResetConversation();
      }
      
      // הוספת הודעת פתיחה חדשה
      const welcomeMessage = "שיחה חדשה התחילה. איך אני יכולה לעזור לך?";
      setMessages([{ from: "bot", text: welcomeMessage }]);
      
      // הקראת הודעת הפתיחה החדשה
      speakText(welcomeMessage);
    }
  };
  
  // החלפת פילטר וידאו
  const changeVideoFilter = (filter) => {
    setVideoFilter(filter);
    setShowFilters(false);
  };
  
  // רינדור פני החיילת
  const renderSoldierFace = () => {
    let eyeStyle = {};
    let mouthStyle = {};
    let faceStyle = {};
    
    // התאמת סגנון לפי מצב רגשי
    switch (emotionState) {
      case "happy":
        eyeStyle = { transform: 'scale(0.9)', borderRadius: '30% 30% 50% 50%' };
        mouthStyle = { borderRadius: '50% 50% 30% 30%' };
        break;
      case "sad":
        eyeStyle = { transform: 'scale(0.9) rotate(10deg)' };
        mouthStyle = { borderRadius: '30% 30% 50% 50%', transform: 'rotate(180deg) translateY(-5px)' };
        break;
      case "concerned":
        eyeStyle = { transform: 'scaleY(0.7)' };
        mouthStyle = { transform: 'scaleX(0.8)', height: '20%' };
        break;
      default:
        // neutral
        break;
    }
    
    return (
      <div className="relative w-full h-full bg-pink-50 rounded-lg overflow-hidden">
        {/* תמונת רקע וראש */}
        <img 
          src="/src/assets/soldierWithPins.png"
          alt="חיילת"
          className="absolute inset-0 w-full h-full object-cover"
        />
        
        {/* אנימציית עיניים */}
        <div className="absolute" style={{ top: '40%', left: '40%', width: '20%', height: '10%' }}>
          <div className="relative w-full h-full">
            <motion.div
              className="absolute inset-0 bg-white rounded-full"
              style={eyeStyle}
              initial={{ scaleY: 1 }}
              animate={{ scaleY: blinkState === "closed" ? 0.1 : 1 }}
              transition={{ duration: 0.1 }}
            />
            <div className="absolute inset-0 flex justify-around items-center overflow-hidden">
              <div className="bg-blue-900 rounded-full w-1/4 h-1/2"></div>
              <div className="bg-blue-900 rounded-full w-1/4 h-1/2"></div>
            </div>
          </div>
        </div>
        
        {/* אנימציית פה */}
        <div className="absolute" style={{ bottom: '30%', left: '40%', width: '20%', height: '10%' }}>
          <motion.div
            className="bg-pink-800 rounded-full w-full"
            style={mouthStyle}
            animate={{ 
              height: mouthAnimation === "closed" ? '10%' : 
                     mouthAnimation === "slightly-open" ? '30%' : 
                     mouthAnimation === "open" ? '50%' : '70%'
            }}
            transition={{ duration: 0.1 }}
          />
        </div>
      </div>
    );
  };
  
  // פילטרים לוידאו
  const videoFilters = {
    none: {},
    grayscale: { filter: 'grayscale(1)' },
    sepia: { filter: 'sepia(0.8)' },
    warm: { filter: 'sepia(0.3) brightness(1.1) saturate(1.3)' },
    cool: { filter: 'hue-rotate(180deg) brightness(1.1) contrast(1.1)' },
    blur: { filter: 'blur(3px)' }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <motion.div 
        ref={containerRef}
        className="bg-white rounded-xl w-full max-w-4xl overflow-hidden shadow-xl"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <div className="p-4 bg-gradient-to-r from-blue-600 to-pink-500 text-white flex justify-between items-center">
          <h3 className="text-lg font-medium">שיחת וידאו עם חיילתAI</h3>
          <div className="flex items-center gap-2">
            <button 
              onClick={toggleFullScreen} 
              className="text-white hover:text-blue-200 p-1 rounded hover:bg-white/10"
              title={fullScreen ? "צא ממסך מלא" : "מסך מלא"}
            >
              {fullScreen ? "⊞" : "⛶"}
            </button>
            <button 
              onClick={onClose} 
              className="text-white hover:text-red-200 p-1 rounded hover:bg-white/10"
              title="סגור"
            >
              ✕
            </button>
          </div>
        </div>
        
        <div className="p-4">
          {/* תצוגת הרשאות */}
          {hasPermission === false && (
            <div className="bg-red-100 text-red-700 p-3 rounded mb-4 text-center">
              נדרשת הרשאה למצלמה ולמיקרופון כדי להשתמש בשיחת וידאו.
              <button onClick={() => window.location.reload()} className="bg-red-600 text-white px-3 py-1 rounded mt-2">
                נסה שוב
              </button>
            </div>
          )}
          
          {/* אזור התצוגה */}
          <div className="flex flex-col md:flex-row gap-4">
            {/* מצלמה ופני החיילת */}
            <div className="w-full md:w-1/2">
              <div className="grid grid-cols-2 gap-2">
                {/* וידאו של המשתמש */}
                <div className="aspect-video bg-gray-900 rounded-lg overflow-hidden relative">
                  <video 
                    ref={videoRef}
                    autoPlay
                    muted
                    playsInline
                    className={`w-full h-full object-cover ${isVideoOn ? '' : 'hidden'}`}
                    style={videoFilters[videoFilter] || {}}
                  />
                  {!isVideoOn && (
                    <div className="absolute inset-0 flex items-center justify-center text-white">
                      <div className="text-4xl">🎥 ❌</div>
                    </div>
                  )}
                  
                  {/* הצגת פילטרים */}
                  {showFilters && (
                    <div className="absolute bottom-2 left-2 right-2 flex flex-wrap justify-center gap-1 bg-black/50 p-1 rounded">
                      <button 
                        onClick={() => changeVideoFilter('none')} 
                        className={`text-xs px-2 py-1 rounded ${videoFilter === 'none' ? 'bg-blue-500 text-white' : 'bg-white/30 text-white'}`}
                      >
                        רגיל
                      </button>
                      <button 
                        onClick={() => changeVideoFilter('grayscale')} 
                        className={`text-xs px-2 py-1 rounded ${videoFilter === 'grayscale' ? 'bg-blue-500 text-white' : 'bg-white/30 text-white'}`}
                      >
                        שחור-לבן
                      </button>
                      <button 
                        onClick={() => changeVideoFilter('sepia')} 
                        className={`text-xs px-2 py-1 rounded ${videoFilter === 'sepia' ? 'bg-blue-500 text-white' : 'bg-white/30 text-white'}`}
                      >
                        וינטג'
                      </button>
                      <button 
                        onClick={() => changeVideoFilter('warm')} 
                        className={`text-xs px-2 py-1 rounded ${videoFilter === 'warm' ? 'bg-blue-500 text-white' : 'bg-white/30 text-white'}`}
                      >
                        חם
                      </button>
                      <button 
                        onClick={() => changeVideoFilter('cool')} 
                        className={`text-xs px-2 py-1 rounded ${videoFilter === 'cool' ? 'bg-blue-500 text-white' : 'bg-white/30 text-white'}`}
                      >
                        קר
                      </button>
                    </div>
                  )}
                </div>
                
                {/* אנימציית פני החיילת */}
                <div className="aspect-video bg-blue-100 rounded-lg overflow-hidden">
                  {renderSoldierFace()}
                </div>
              </div>
              
              {/* כפתורי שליטה */}
              <div className="mt-3 flex justify-center gap-3">
                <button 
                  onClick={toggleVideo}
                  className={`rounded-full p-3 ${isVideoOn ? 'bg-blue-500 text-white' : 'bg-red-500 text-white'} hover:opacity-90 transition`}
                  title={isVideoOn ? "כבה מצלמה" : "הפעל מצלמה"}
                >
                  {isVideoOn ? "🎥" : "🎥 ❌"}
                </button>
                <button 
                  onClick={toggleAudio}
                  className={`rounded-full p-3 ${isAudioOn ? 'bg-blue-500 text-white' : 'bg-red-500 text-white'} hover:opacity-90 transition`}
                  title={isAudioOn ? "השתק מיקרופון" : "הפעל מיקרופון"}
                >
                  {isAudioOn ? "🎤" : "🎤 ❌"}
                </button>
                <button 
                  onClick={toggleRecording}
                  className={`rounded-full p-3 ${isRecording ? 'bg-red-500 animate-pulse text-white' : 'bg-green-500 text-white'} hover:opacity-90 transition`}
                  title={isRecording ? "עצור הקלטה" : "התחל הקלטה"}
                >
                  {isRecording ? "⏹️" : "🗣️"}
                </button>
                <button 
                  onClick={() => setShowFilters(!showFilters)}
                  className={`rounded-full p-3 ${showFilters ? 'bg-purple-500 text-white' : 'bg-gray-200 text-gray-700'} hover:opacity-90 transition`}
                  title="פילטרים"
                >
                  🎨
                </button>
              </div>
            </div>
            
            {/* אזור צ'אט */}
            <div className="w-full md:w-1/2 flex flex-col">
              <div className="bg-gray-100 rounded-lg p-3 flex-1 h-64 md:h-auto overflow-y-auto">
                {messages.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-gray-500">
                    <span>שיחה חדשה עם חיילתAI</span>
                  </div>
                ) : (
                  <div className="space-y-3 flex flex-col">
                    {messages.map((message, index) => (
                      <div 
                        key={index} 
                        className={`p-2 rounded-lg max-w-[85%] ${
                          message.from === 'user' 
                            ? 'bg-blue-500 text-white self-end' 
                            : message.from === 'bot' 
                              ? 'bg-pink-100 text-gray-800 self-start' 
                              : 'bg-red-100 text-red-800 self-start'
                        }`}
                      >
                        {message.text}
                        <div className="text-xs opacity-60 mt-1 text-right">
                          {new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </div>
                      </div>
                    ))}
                    {isLoading && (
                      <div className="bg-pink-100 text-gray-800 self-start p-2 rounded-lg">
                        <div className="flex gap-1 justify-end">
                          <div className="w-2 h-2 bg-pink-500 rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-pink-500 rounded-full animate-bounce" style={{animationDelay: "0.2s"}}></div>
                          <div className="w-2 h-2 bg-pink-500 rounded-full animate-bounce" style={{animationDelay: "0.4s"}}></div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
              
              {/* אזור הקלטה והזנה */}
              <div className="mt-3">
                <div className="relative">
                  <input
                    type="text"
                    value={transcript}
                    onChange={(e) => setTranscript(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && transcript.trim() && handleSpeechInput(transcript)}
                    className="w-full p-3 pr-12 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder={isRecording ? "מקליט..." : "הקלד הודעה או לחץ על כפתור ההקלטה..."}
                    disabled={isRecording}
                  />
                  <button
                    onClick={() => transcript.trim() && handleSpeechInput(transcript)}
                    disabled={!transcript.trim() || isRecording}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-blue-500 disabled:text-gray-400"
                    title="שלח הודעה"
                  >
                    ➤
                  </button>
                </div>
                
                <div className="mt-2 flex justify-between">
                  <button
                    onClick={handleResetConversation}
                    className="text-sm text-red-600 hover:text-red-800"
                  >
                    התחל שיחה חדשה
                  </button>
                  
                  {transcript && !isRecording && (
                    <span className="text-xs text-gray-500">
                      לחץ על Enter לשליחה
                    </span>
                  )}
                  
                  {isRecording && (
                    <span className="text-xs text-red-500 animate-pulse">
                      מקליט...
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default ImprovedVideoChat;