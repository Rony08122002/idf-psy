import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import VoiceService from "../services/voiceservice";
import AIService from "../services/AIService";

const AnimatedFaceChat = ({ onClose, userName, onResetConversation }) => {
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
  
  const videoRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const userStreamRef = useRef(null);
  const containerRef = useRef(null);
  const mouthAnimationRef = useRef(null);
  const blinkAnimationRef = useRef(null);
  
  useEffect(() => {
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
  
  useEffect(() => {
    const startBlinking = () => {
      blinkAnimationRef.current = setInterval(() => {
        setBlinkState("closed");
        
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
    
    return () => {
      if (userStreamRef.current) {
        userStreamRef.current.getTracks().forEach(track => track.stop());
      }
      VoiceService.stopSpeaking();
      VoiceService.stopListening();
    };
  }, []);
  
  useEffect(() => {
    const welcomeMessage = userName 
      ? `שלום ${userName}, נעים להכיר אותך פנים אל פנים. איך אני יכולה לעזור לך היום?` 
      : "שלום! נעים להכיר אותך פנים אל פנים. איך אני יכולה לעזור לך היום?";
    
    setMessages([{ 
      from: "bot", 
      text: welcomeMessage 
    }]);
    
    setTimeout(() => {
      speakText(welcomeMessage);
    }, 1000);
  }, [userName]);
  
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
  
  useEffect(() => {
    const handleFullscreenChange = () => {
      setFullScreen(!!document.fullscreenElement);
    };
    
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);
  
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
            text: `שגיאה: ${error}`
          }]);
        }
      );
      
      if (success) {
        setIsRecording(true);
      }
    }
  };
  
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
  
  // רינדור פני החיילת
  const renderSoldierFace = () => {
    return (
      <div className="relative w-full h-full">
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
              initial={{ scaleY: 1 }}
              animate={{ scaleY: blinkState === "closed" ? 0.1 : 1 }}
              transition={{ duration: 0.1 }}
            />
            <div className="absolute inset-0 flex justify-around items-center">
              <div className="bg-blue-900 rounded-full w-1/4 h-1/2"></div>
              <div className="bg-blue-900 rounded-full w-1/4 h-1/2"></div>
            </div>
          </div>
        </div>
        
        {/* אנימציית פה */}
        <div className="absolute" style={{ bottom: '30%', left: '40%', width: '20%', height: '10%' }}>
          <motion.div
            className="bg-pink-800 rounded-full w-full"
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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <motion.div 
        ref={containerRef}
        className="bg-white rounded-xl w-full max-w-4xl overflow-hidden shadow-xl"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <div className="p-4 bg-blue-600 text-white flex justify-between items-center">
          <h3 className="text-lg font-medium">שיחת וידאו עם חיילתAI</h3>
          <div className="flex items-center gap-2">
            <button 
              onClick={toggleFullScreen} 
              className="text-white hover:text-blue-200"
              title={fullScreen ? "צא ממסך מלא" : "מסך מלא"}
            >
              {fullScreen ? "⊞" : "⛶"}
            </button>
            <button 
              onClick={onClose} 
              className="text-white hover:text-red-200"
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
                  />
                  {!isVideoOn && (
                    <div className="absolute inset-0 flex items-center justify-center text-white">
                      <div className="text-4xl">🎥 ❌</div>
                    </div>
                  )}
                </div>
                
                {/* אנימציית פני החיילת */}
                <div className="aspect-video bg-blue-100 rounded-lg overflow-hidden">
                  {renderSoldierFace()}
                </div>
              </div>
              
              {/* כפתורי שליטה */}
              <div className="mt-3 flex justify-center gap-4">
                <button 
                  onClick={toggleVideo}
                  className={`rounded-full p-3 ${isVideoOn ? 'bg-blue-500 text-white' : 'bg-red-500 text-white'}`}
                  title={isVideoOn ? "כבה מצלמה" : "הפעל מצלמה"}
                >
                  {isVideoOn ? "🎥" : "🎥 ❌"}
                </button>
                <button 
                  onClick={toggleAudio}
                  className={`rounded-full p-3 ${isAudioOn ? 'bg-blue-500 text-white' : 'bg-red-500 text-white'}`}
                  title={isAudioOn ? "השתק מיקרופון" : "הפעל מיקרופון"}
                >
                  {isAudioOn ? "🎤" : "🎤 ❌"}
                </button>
                <button 
                  onClick={toggleRecording}
                  className={`rounded-full p-3 ${isRecording ? 'bg-red-500 animate-pulse text-white' : 'bg-green-500 text-white'}`}
                  title={isRecording ? "עצור הקלטה" : "התחל הקלטה"}
                >
                  {isRecording ? "⏹️" : "🗣️"}
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
                        className={`p-2 rounded-lg max-w-[80%] ${
                          message.from === 'user' 
                            ? 'bg-blue-500 text-white self-end' 
                            : message.from === 'bot' 
                              ? 'bg-gray-200 text-gray-800 self-start' 
                              : 'bg-red-100 text-red-800 self-start'
                        }`}
                      >
                        {message.text}
                      </div>
                    ))}
                    {isLoading && (
                      <div className="bg-gray-200 text-gray-800 self-start p-2 rounded-lg">
                        <span className="animate-pulse">...</span>
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

export default AnimatedFaceChat;