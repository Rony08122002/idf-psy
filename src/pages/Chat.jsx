import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import AIService from "../services/AIService";
import VoiceService from "../services/VoiceService";
import VideoChat from "../components/VideoChat";

/**
 * קומפוננטת צ'אט משופרת עם ממשק משתמש טבעי יותר
 * וטיפול משופר בתשובות
 */
export default function Chat() {
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [userName, setUserName] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isChatInitialized, setIsChatInitialized] = useState(false);
  const [showVideoChat, setShowVideoChat] = useState(false);
  const [isVoiceMode, setIsVoiceMode] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [showEmojis, setShowEmojis] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [typingTimeout, setTypingTimeout] = useState(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  
  const messagesEndRef = useRef(null);
  const chatBodyRef = useRef(null);
  const inputRef = useRef(null);
  
  // בדיקה אם מדובר במסך גדול (מחשב) או קטן (מובייל)
  const isLargeScreen = window.innerWidth > 768;

  // טעינת היסטוריית צ'אט אם קיימת
  useEffect(() => {
    const loadChatHistory = async () => {
      try {
        setIsTyping(true);
        
        const savedMessages = localStorage.getItem("chatHistory");
        const savedName = localStorage.getItem("userName");
        const savedDarkMode = localStorage.getItem("darkMode") === "true";
        
        // שמירת מצב העיצוב
        setDarkMode(savedDarkMode);
        document.body.classList.toggle('dark-theme', savedDarkMode);
        
        // כדי לבדוק אם VoiceService זמין
        const voiceSupport = VoiceService.isVoiceSynthesisSupported && 
                          VoiceService.isVoiceRecognitionSupported;
        
        // אם פונקציות אלה קיימות ב-VoiceService
        if (typeof voiceSupport === 'function') {
          setIsVoiceMode(voiceSupport() && localStorage.getItem("voiceMode") === "true");
        } else {
          setIsVoiceMode(localStorage.getItem("voiceMode") === "true");
        }
        
        if (savedName) {
          setUserName(savedName);
          AIService.updateUserInfo({ name: savedName });
        }
        
        if (savedMessages) {
          const parsedMessages = JSON.parse(savedMessages);
          setMessages(parsedMessages);
          
          // הוספת המשך שיחה אם יש צורך
          if (parsedMessages.length > 0) {
            setTimeout(() => {
              simulateTyping();
              setTimeout(() => {
                const continueMessage = { 
                  from: "bot", 
                  text: savedName ? 
                    `היי ${savedName}, נחמד לראות אותך שוב! איך אני יכולה לעזור לך היום?` : 
                    "היי שם! נחמד לראות אותך שוב. איך אני יכולה לעזור לך היום?"
                };
                setMessages(prev => [...prev, continueMessage]);
                setIsTyping(false);
                scrollToBottom();
                
                // הקראת ההודעה אם במצב קולי
                if (isVoiceMode) {
                  try {
                    VoiceService.speak(continueMessage.text);
                  } catch (error) {
                    console.warn("Error speaking:", error);
                  }
                }
              }, 1500);
            }, 800);
          }
          
          setIsChatInitialized(true);
        } else {
          // אתחול שיחה חדשה
          initializeNewChat(savedName);
        }
        
        // יצירת הצעות חכמות
        generateSmartSuggestions();
      } catch (error) {
        console.error("Error loading chat history:", error);
        initializeNewChat();
      }
    };

    loadChatHistory();
  }, []);

  // אתחול שיחה חדשה
  const initializeNewChat = async (name = "") => {
    try {
      simulateTyping();
      
      const initialMessage = await AIService.initializeChat(name);
      
      setMessages([
        { from: "bot", text: "היי! אני חיילתAI. אני כאן כדי לתמוך ולהקשיב 😊" },
        { from: "bot", text: "איך אתה מרגיש היום?" }
      ]);
      
      setIsChatInitialized(true);
      setIsTyping(false);
    } catch (error) {
      console.error("Error initializing chat:", error);
      
      // גיבוי במקרה של שגיאה
      setMessages([
        { from: "bot", text: "היי! אני חיילתAI. אני כאן כדי לתמוך ולהקשיב 😊" },
        { from: "bot", text: "איך אתה מרגיש היום?" }
      ]);
      
      setIsChatInitialized(true);
      setIsTyping(false);
    }
  };

  // גלילה אוטומטית לסוף השיחה כשיש הודעות חדשות
  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  // פונקציית גלילה לסוף הצ'אט
  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    } else if (chatBodyRef.current) {
      chatBodyRef.current.scrollTop = chatBodyRef.current.scrollHeight;
    }
  };

  // שמירת היסטוריית הצ'אט ב-localStorage
  useEffect(() => {
    if (messages.length > 0 && isChatInitialized) {
      try {
        localStorage.setItem("chatHistory", JSON.stringify(messages));
      } catch (error) {
        console.warn("Error saving chat history:", error);
      }
    }
  }, [messages, isChatInitialized]);

  // ניקוי האזנה לקול בעת יציאה
  useEffect(() => {
    return () => {
      cleanupVoiceServices();
    };
  }, [isListening]);

  // פונקציית ניקוי שירותי קול
  const cleanupVoiceServices = () => {
    if (isListening) {
      try {
        VoiceService.stopListening();
      } catch (error) {
        console.warn("Error stopping listening:", error);
      }
    }
    
    try {
      VoiceService.stopSpeaking();
    } catch (error) {
      console.warn("Error stopping speaking:", error);
    }
  };
  
  // סימולציה של הקלדה בצד הבוט
  const simulateTyping = () => {
    setIsTyping(true);
    
    // ניקוי טיימר קודם אם קיים
    if (typingTimeout) {
      clearTimeout(typingTimeout);
    }
    
    // הגדרת זמן ההקלדה בהתאם לאורך ההודעה האחרונה
    const lastMessage = messages[messages.length - 1];
    const typingTime = lastMessage ? Math.min(1500, Math.max(800, lastMessage.text.length * 15)) : 1000;
    
    const newTimeout = setTimeout(() => {
      setIsTyping(false);
    }, typingTime);
    
    setTypingTimeout(newTimeout);
  };

  // יצירת הצעות חכמות לפי ההיסטוריה והמצב
  const generateSmartSuggestions = () => {
    // הצעות בסיסיות
    const basicSuggestions = [
      "איך אני יכול להתמודד עם לחץ במהלך המשמרת?",
      "קשה לי להירדם בלילה, מה אפשר לעשות?",
      "מתגעגע למשפחה, איך מתמודדים עם זה?",
      "יש לי קושי עם המפקד שלי, איך לגשת לזה?"
    ];
    
    // שילוב ההצעות ובחירה אקראית של 3
    const shuffled = basicSuggestions.sort(() => 0.5 - Math.random());
    setSuggestions(shuffled.slice(0, 3));
  };

  // ניתוח בסיסי של רגשות
  const analyzeFeeling = (text) => {
    try {
      const positiveWords = ["טוב", "מצוין", "נהדר", "שמח", "רגוע", "נפלא", "מדהים", "כיף"];
      const negativeWords = ["רע", "עצוב", "קשה", "מדוכא", "עייף", "לחוץ", "מתוח", "לא טוב"];
      
      let sentiment = "neutral";
      
      for (const word of positiveWords) {
        if (text.toLowerCase().includes(word)) {
          sentiment = "positive";
          break;
        }
      }
      
      for (const word of negativeWords) {
        if (text.toLowerCase().includes(word)) {
          sentiment = "negative";
          break;
        }
      }
      
      localStorage.setItem("userSentiment", sentiment);
      if (AIService.updateUserInfo) {
        AIService.updateUserInfo({ lastSentiment: sentiment });
      }
      return sentiment;
    } catch (error) {
      console.warn("Error analyzing sentiment:", error);
      return "neutral";
    }
  };

  // טיפול בבקשה לפתיחת וידאו
  const handleVideoRequest = () => {
    if (!messages.length) return;
    
    const lastUserMessage = messages[messages.length - 1]?.text?.toLowerCase() || "";
    
    if (
      lastUserMessage.includes("כן") || 
      lastUserMessage.includes("בטח") || 
      lastUserMessage.includes("אוקיי") || 
      lastUserMessage.includes("בשמחה")
    ) {
      // המשתמש הסכים לשיחת וידאו
      setShowVideoChat(true);
      
      // הוספת הודעה מהבוט
      const botResponse = { 
        from: "bot", 
        text: "מעולה! פותח שיחת וידאו..." 
      };
      setMessages(prev => [...prev, botResponse]);
    } else {
      // המשתמש סירב או שלא מדובר בתשובה לבקשת וידאו
      handleSend();
    }
  };

  // טיפול בסיום שיחת וידאו
  const handleVideoClose = () => {
    setShowVideoChat(false);
    
    // הוספת הודעת סיכום לשיחה
    simulateTyping();
    
    setTimeout(() => {
      const botResponse = { 
        from: "bot", 
        text: "שיחת הווידאו הסתיימה. אני שמחה שדיברנו פנים אל פנים! האם יש עוד משהו שתרצה לשתף או לשאול?" 
      };
      setMessages(prev => [...prev, botResponse]);
      setIsTyping(false);
      
      if (isVoiceMode) {
        try {
          VoiceService.speak(botResponse.text);
        } catch (error) {
          console.warn("Error speaking:", error);
        }
      }
    }, 1000);
  };

  // הוספת אימוג'י להודעה
  const addEmoji = (emoji) => {
    setInput(prev => prev + emoji);
    setShowEmojis(false);
    
    // התמקדות בשדה הקלט לאחר הוספת האימוג'י
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  // טיפול בשליחת הודעה
  const handleSend = async () => {
    if ((!input.trim() && !transcript) || isTyping) return;
    
    const messageText = transcript || input.trim();
    setTranscript("");
    setInput("");
    
    // בדיקה אם מדובר בבקשה לפתיחת מצלמה
    if (messageText.toLowerCase().includes("מצלמה") || 
        messageText.toLowerCase().includes("וידאו") || 
        messageText.toLowerCase().includes("לראות אותך")) {
      
      const userMessage = { from: "user", text: messageText };
      
      setMessages(prev => [...prev, userMessage]);
      simulateTyping();
      
      setTimeout(() => {
        const botResponse = { 
          from: "bot", 
          text: "האם תרצה לפתוח שיחת וידאו? אוכל לראות ולשמוע אותך ולתת תגובות קוליות." 
        };
        
        setMessages(prev => [...prev, botResponse]);
        setIsTyping(false);
        
        if (isVoiceMode) {
          try {
            VoiceService.speak(botResponse.text);
          } catch (error) {
            console.warn("Error speaking:", error);
          }
        }
      }, 1000);
      
      return;
    }
    
    // הוספת הודעת המשתמש
    const userMessage = { from: "user", text: messageText };
    setMessages(prev => [...prev, userMessage]);
    
    // ניתוח רגשות
    analyzeFeeling(messageText);
    
    // שמירת שם המשתמש אם זמין וטרם נשמר
    if (messages.length <= 3 && messageText.length > 1 && !userName) {
      const possibleName = extractName(messageText);
      if (possibleName) {
        localStorage.setItem("userName", possibleName);
        setUserName(possibleName);
        if (AIService.updateUserInfo) {
          AIService.updateUserInfo({ name: possibleName });
        }
      }
    }
    
    // סימולציה של הקלדת הבוט
    simulateTyping();
    
    try {
      // קבלת תשובה מה-AI
      const response = await AIService.sendMessage(messageText);
      
      // מניעת הוספת תשובה אם הקומפוננטה לא מורכבת יותר
      if (!isChatInitialized) return;
      
      // הוספת התשובה להודעות
      const botMessage = { from: "bot", text: response };
      setMessages(prev => [...prev, botMessage]);
      setIsTyping(false);
      
      // אם במצב קולי, הקראת התשובה
      if (isVoiceMode) {
        try {
          VoiceService.speak(response);
        } catch (error) {
          console.warn("Error speaking:", error);
        }
      }
      
      // יצירת הצעות חכמות חדשות
      generateSmartSuggestions();
    } catch (error) {
      console.error("Error getting AI response:", error);
      
      // במקרה של שגיאה, שלח הודעת שגיאה ידידותית
      const errorMessage = { 
        from: "bot", 
        text: "סליחה, נתקלתי בבעיה בעת הניסיון להשיב. האם תוכל לנסות שוב?" 
      };
      setMessages(prev => [...prev, errorMessage]);
      setIsTyping(false);
      
      if (isVoiceMode) {
        try {
          VoiceService.speak(errorMessage.text);
        } catch (error) {
          console.warn("Error speaking:", error);
        }
      }
    }
  };

  // חילוץ שם מתוך הודעה
  const extractName = (text) => {
    const namePatterns = [
      /שמי ([א-ת]+)/i,
      /קוראים לי ([א-ת]+)/i,
      /אני ([א-ת]+)/i
    ];
    
    for (const pattern of namePatterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        return match[1].trim();
      }
    }
    
    // אם הטקסט קצר מאוד (מילה אחת/שתיים) - ייתכן שזה שם
    const words = text.trim().split(/\s+/);
    if (words.length === 1 && words[0].length > 1) {
      return words[0];
    }
    
    return null;
  };
  
  // הפעלה/עצירה של זיהוי קול
  const toggleVoiceRecognition = () => {
    if (isListening) {
      // עצירת האזנה
      try {
        VoiceService.stopListening();
      } catch (error) {
        console.warn("Error stopping listening:", error);
      }
      setIsListening(false);
      
      // אם יש טקסט שזוהה, שליחתו כהודעה
      if (transcript) {
        setInput(transcript);
        setTimeout(() => handleSend(), 300);
      }
    } else {
      // התחלת האזנה
      try {
        const success = VoiceService.startListening(
          (result) => {
            if (result.finalTranscript) {
              setTranscript(result.finalTranscript);
            } else if (result.interimTranscript) {
              setTranscript(result.interimTranscript);
            }
            
            // אם יש טקסט סופי וארוך מספיק, שליחה אוטומטית
            if (result.finalTranscript && result.finalTranscript.length > 2) {
              setTimeout(() => {
                setInput(result.finalTranscript);
                handleSend();
              }, 300);
            }
          },
          (error) => {
            console.error("Voice recognition error:", error);
            setIsListening(false);
            
            // הוספת הודעת שגיאה רק אם משתמש באמת ניסה להשתמש בזיהוי קול
            if (error.code !== 'not-allowed') {
              simulateTyping();
              setTimeout(() => {
                const errorMessage = { 
                  from: "bot", 
                  text: "נתקלתי בבעיה בזיהוי הדיבור. נסה שוב או המשך בהקלדה." 
                };
                setMessages(prev => [...prev, errorMessage]);
                setIsTyping(false);
              }, 800);
            }
          }
        );
        
        if (success) {
          setIsListening(true);
          
          // אם מצב קולי לא פעיל, הפעל אותו
          if (!isVoiceMode) {
            setIsVoiceMode(true);
            localStorage.setItem("voiceMode", "true");
          }
        } else {
          // הודעת שגיאה אם לא מצליח להפעיל זיהוי קול
          const lastMessages = messages.slice(-3);
          const hasRecentError = lastMessages.some(msg => 
            msg.from === "bot" && msg.text.includes("לא ניתן להפעיל זיהוי קול")
          );
          
          if (!hasRecentError) {
            simulateTyping();
            setTimeout(() => {
              const errorMessage = { 
                from: "bot", 
                text: "לא ניתן להפעיל זיהוי קול. ייתכן שהדפדפן שלך אינו תומך בתכונה זו או שלא אישרת גישה למיקרופון." 
              };
              setMessages(prev => [...prev, errorMessage]);
              setIsTyping(false);
            }, 800);
          }
        }
      } catch (error) {
        console.error("Error starting voice recognition:", error);
        
        // הודעת שגיאה למשתמש
        simulateTyping();
        setTimeout(() => {
          const errorMessage = { 
            from: "bot", 
            text: "לא הצלחתי להפעיל את זיהוי הדיבור. נסה להשתמש בהקלדה." 
          };
          setMessages(prev => [...prev, errorMessage]);
          setIsTyping(false);
        }, 800);
      }
    }
  };
  
  // החלפת מצב קולי
  const toggleVoiceMode = () => {
    const newVoiceMode = !isVoiceMode;
    setIsVoiceMode(newVoiceMode);
    localStorage.setItem("voiceMode", newVoiceMode.toString());
    
    // עצירת הקראה נוכחית אם יש
    if (isVoiceMode) {
      try {
        VoiceService.stopSpeaking();
      } catch (error) {
        console.warn("Error stopping speaking:", error);
      }
    }
    
    // הודעה על מצב קולי חדש
    simulateTyping();
    
    setTimeout(() => {
      const botMessage = { 
        from: "bot", 
        text: newVoiceMode ? 
          "מצב קולי הופעל. אני אקריא את התשובות שלי בקול רם." :
          "מצב קולי כובה."
      };
      
      setMessages(prev => [...prev, botMessage]);
      setIsTyping(false);
      
      // הקראת ההודעה אם מצב קולי הופעל
      if (newVoiceMode) {
        try {
          VoiceService.speak(botMessage.text);
        } catch (error) {
          console.warn("Error speaking:", error);
        }
      }
    }, 800);
  };
  
  // שליחת הודעה בלחיצה על Enter
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // ניקוי היסטוריית השיחה
  const clearConversation = () => {
    if (window.confirm("האם אתה בטוח שברצונך למחוק את היסטוריית השיחה?")) {
      // עצירת הקראה אם יש
      cleanupVoiceServices();
      
      // ניקוי היסטוריה
      localStorage.removeItem("chatHistory");
      
      if (AIService.clearConversation) {
        AIService.clearConversation();
      }
      
      simulateTyping();
      
      setTimeout(() => {
        const welcomeMessages = [
          { from: "bot", text: "היי! אני חיילתAI. שמחה לפתוח בשיחה חדשה 😊" },
          { from: "bot", text: "איך אתה מרגיש היום?" }
        ];
        
        setMessages(welcomeMessages);
        setIsTyping(false);
        
        // הקראת ההודעה הראשונה אם במצב קולי
        if (isVoiceMode) {
          try {
            VoiceService.speak(welcomeMessages[0].text + " " + welcomeMessages[1].text);
          } catch (error) {
            console.warn("Error speaking:", error);
          }
        }
        
        // עדכון הצעות חכמות
        generateSmartSuggestions();
      }, 1000);
    }
  };
  
  // האזנה להקראת בוט
  const handleSpeakLastMessage = () => {
    if (!isVoiceMode) {
      toggleVoiceMode();
      return;
    }
    
    const lastBotMessage = [...messages].reverse().find(msg => msg.from === "bot");
    
    if (lastBotMessage) {
      try {
        VoiceService.speak(lastBotMessage.text);
      } catch (error) {
        console.warn("Error speaking:", error);
        
        // הודעה אם לא ניתן להקריא רק אם המשתמש טרם ראה הודעת שגיאה דומה
        const lastMessages = messages.slice(-3);
        const hasRecentError = lastMessages.some(msg => 
          msg.from === "bot" && msg.text.includes("לא הצלחתי להקריא")
        );
        
        if (!hasRecentError) {
          simulateTyping();
          setTimeout(() => {
            const errorMessage = { 
              from: "bot", 
              text: "לא הצלחתי להקריא את ההודעה. נסה להפעיל את מצב הקולי." 
            };
            setMessages(prev => [...prev, errorMessage]);
            setIsTyping(false);
          }, 800);
        }
      }
    }
  };
  
  // החלפת מצב תצוגה (רגיל/חשוך)
  const toggleDarkMode = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    localStorage.setItem("darkMode", newDarkMode.toString());
    document.body.classList.toggle('dark-theme', newDarkMode);
  };
  
  // טיפול בבחירת הצעה
  const handleSuggestionClick = (suggestion) => {
    setInput(suggestion);
    setShowSuggestions(false);
    
    // התמקדות בשדה הקלט
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  // אימוג'ים נפוצים לשימוש בצ'אט
  const emojis = ['😊', '😁', '😔', '😢', '😎', '❤️', '👍', '👎', '🙏', '🤔', '😴', '🥱', '🤢', '😷', '🤒'];

  // בדיקה אם השיחה מאותחלת
  if (!isChatInitialized) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-700 dark:text-gray-300">טוען את השיחה...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`p-4 max-w-xl mx-auto min-h-screen flex flex-col ${darkMode ? 'dark-theme' : ''}`}>
      <div className="flex justify-between items-center mb-4 bg-white dark:bg-gray-800 p-3 rounded-lg shadow-md">
        <button 
          onClick={() => navigate("/")} 
          className="btn-modern btn-outline-modern"
        >
          <span className="mr-1">🏠</span> חזרה
        </button>
        <h2 className="text-xl md:text-2xl font-bold text-center">💬 שיחה עם חיילתAI</h2>
        <div className="flex gap-1">
          <button 
            onClick={toggleDarkMode} 
            className="text-gray-500 dark:text-gray-300 text-sm p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
            title={darkMode ? "מצב בהיר" : "מצב חשוך"}
          >
            {darkMode ? '☀️' : '🌙'}
          </button>
          <button 
            onClick={clearConversation} 
            className="text-gray-500 dark:text-gray-300 text-sm p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
            title="מחק היסטוריה"
          >
            🗑️
          </button>
        </div>
      </div>

      <div className="flex justify-center mb-4">
        <div className="relative">
          <motion.img
            src="/src/assets/soldierWithPins.png"
            alt="חיילת תומכת"
            className="avatar-improved w-24 md:w-32 h-24 md:h-32"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            onClick={handleSpeakLastMessage}
            title="לחץ כדי לשמוע את ההודעה האחרונה שוב"
            style={{ cursor: 'pointer' }}
            whileHover={{ scale: 1.05 }}
          />
          {isVoiceMode && (
            <motion.div 
              className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 bg-pink-500 text-white px-2 py-1 text-xs rounded-full font-bold"
              animate={{ opacity: [0.7, 1, 0.7] }}
              transition={{ repeat: Infinity, duration: 2 }}
            >
              מצב קולי פעיל
            </motion.div>
          )}
        </div>
      </div>

      <div 
        ref={chatBodyRef} 
        className="flex-grow overflow-y-auto border rounded-lg p-3 md:p-4 bg-white dark:bg-gray-800 shadow-md mb-4"
        style={{ maxHeight: isLargeScreen ? "calc(100vh - 300px)" : "calc(100vh - 270px)" }}
      >
        <div className="space-y-3 md:space-y-4">
          <AnimatePresence>
            {messages.map((msg, i) => (
              <motion.div
                key={i}
                className={`message-improved ${msg.from === "bot" ? "message-bot-improved" : "message-user-improved"}`}
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.3 }}
              >
                {msg.text}
                <div className="text-xs opacity-50 mt-1 text-left">
                  {new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          
          {isTyping && (
            <motion.div 
              className="message-improved message-bot-improved"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <div className="typing-indicator">
                <div className="typing-dot"></div>
                <div className="typing-dot"></div>
                <div className="typing-dot"></div>
              </div>
            </motion.div>
          )}

          {/* חלונית הדיבור */}
          {isListening && transcript && (
            <motion.div 
              className="message-improved message-user-improved"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <div className="text-sm opacity-70 mb-1">מקליט...</div>
              <div>{transcript || "..."}</div>
            </motion.div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* הצעות חכמות */}
      {showSuggestions && suggestions.length > 0 && (
        <motion.div 
          className="mb-2"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="text-xs text-gray-500 dark:text-gray-400 mb-1 mr-1">שאלות מוצעות:</div>
          <div className="flex flex-wrap gap-2">
            {suggestions.map((suggestion, index) => (
              <button
                key={index}
                onClick={() => handleSuggestionClick(suggestion)}
                className="text-sm bg-blue-50 dark:bg-gray-700 text-blue-600 dark:text-blue-300 py-1 px-3 rounded-full hover:bg-blue-100 dark:hover:bg-gray-600 transition"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </motion.div>
      )}

      {/* תחתית הצ'אט - אזור הקלט */}
      <div className="p-3 bg-white dark:bg-gray-800 rounded-lg shadow-md">
        {/* שורת הקלט */}
        <div className="flex gap-2 mb-2 relative">
          <div className="input-group-improved flex-1">
            <button
              onClick={() => setShowEmojis(!showEmojis)}
              className="p-2 text-gray-500 dark:text-gray-300 hover:text-gray-700 dark:hover:text-gray-100"
              title="הוסף אימוג'י"
            >
              😊
            </button>
            
            <input
              ref={inputRef}
              className="input-improved dark:bg-transparent dark:text-white"
              placeholder={isListening ? "מקליט..." : "כתוב הודעה..."}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              disabled={isListening}
            />
            
            <button
              onClick={toggleVoiceRecognition}
              className={`p-2 ${isListening ? 'text-red-600 animate-pulse' : 'text-gray-500 dark:text-gray-300 hover:text-gray-700 dark:hover:text-gray-100'}`}
              title={isListening ? "עצור הקלטה" : "הקלט הודעה קולית"}
            >
              {isListening ? '⏹️' : '🎤'}
            </button>
          </div>
          
          <button
            onClick={handleSend}
            className="btn-modern btn-primary-modern"
            disabled={(!input.trim() && !transcript) || isTyping}
          >
            שלח
          </button>
          
          {/* תיבת האימוג'ים */}
          {showEmojis && (
            <motion.div 
              className="absolute bottom-full right-0 bg-white dark:bg-gray-700 shadow-lg p-2 rounded-lg mb-2 border border-gray-200 dark:border-gray-600 grid grid-cols-5 gap-2 max-w-xs z-10"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              {emojis.map(emoji => (
                <button 
                  key={emoji} 
                  onClick={() => addEmoji(emoji)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-600 rounded"
                >
                  {emoji}
                </button>
              ))}
            </motion.div>
          )}
        </div>
        
        {/* שורת הכפתורים והפעולות */}
        <div className="flex flex-wrap justify-center gap-2 mt-3">
          <button
            onClick={() => setShowVideoChat(true)}
            className="btn-modern btn-outline-modern"
          >
            <span className="ml-1">📹</span> {isLargeScreen ? "פתח שיחת וידאו" : "וידאו"}
          </button>
          
          <button
            onClick={toggleVoiceMode}
            className={`btn-modern ${isVoiceMode ? 'btn-secondary-modern' : 'btn-outline-modern'}`}
          >
            <span className="ml-1">🔊</span> {isLargeScreen ? "מצב קולי" : "קול"}
          </button>
          
          <button
            onClick={clearConversation}
            className="btn-modern btn-outline-modern"
          >
            <span className="ml-1">🔄</span> {isLargeScreen ? "התחל מחדש" : "ניקוי"}
          </button>
        </div>
        
        <div className="text-center text-gray-500 dark:text-gray-400 text-xs mt-3">
          <p>כל הנתונים נשמרים רק במכשיר שלך ומוגנים בפרטיות מלאה</p>
        </div>
      </div>
      
      {/* מודל שיחת וידאו */}
      {showVideoChat && (
        <VideoChat 
          onClose={handleVideoClose} 
          userName={userName}
          onResetConversation={clearConversation}
        />
      )}
    </div>
  );
}