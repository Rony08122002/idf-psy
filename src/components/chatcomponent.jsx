// המשך מהקוד הקודם
const errorMessage = { 
    from: "bot", 
    text: "סליחה, נתקלתי בבעיה בעת הניסיון להשיב. האם תוכל לנסות שוב?" 
  };
setMessages(prev => [...prev, errorMessage]);

if (isVoiceMode) {
  try {
    try {
      VoiceService.speak(errorMessage.text);
    } catch (error) {
      console.warn("Error speaking:", error);
    }
  } finally {
    setIsTyping(false);
  }
}

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
    handleSend();
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
          const errorMessage = { 
            from: "bot", 
            text: "נתקלתי בבעיה בזיהוי הדיבור. נסה שוב או המשך בהקלדה." 
          };
          setMessages(prev => [...prev, errorMessage]);
        }
      }
    );
    
    if (success) {
      setIsListening(true);
      
      // אם מצב קולי לא פעיל, הפעל אותו
      if (!isVoiceMode) {
        setIsVoiceMode(true);
      }
    } else {
      // הודעת שגיאה אם לא מצליח להפעיל זיהוי קול
      const lastMessages = messages.slice(-3);
      const hasRecentError = lastMessages.some(msg => 
        msg.from === "bot" && msg.text.includes("לא ניתן להפעיל זיהוי קול")
      );
      
      if (!hasRecentError) {
        const errorMessage = { 
          from: "bot", 
          text: "לא ניתן להפעיל זיהוי קול. ייתכן שהדפדפן שלך אינו תומך בתכונה זו או שלא אישרת גישה למיקרופון." 
        };
        setMessages(prev => [...prev, errorMessage]);
      }
    }
  } catch (error) {
    console.error("Error starting voice recognition:", error);
    
    // הודעת שגיאה למשתמש
    const errorMessage = { 
      from: "bot", 
      text: "לא הצלחתי להפעיל את זיהוי הדיבור. נסה להשתמש בהקלדה." 
    };
    setMessages(prev => [...prev, errorMessage]);
  }
}
};

// החלפת מצב קולי
const toggleVoiceMode = () => {
const newVoiceMode = !isVoiceMode;
setIsVoiceMode(newVoiceMode);

// עצירת הקראה נוכחית אם יש
if (isVoiceMode) {
  try {
    VoiceService.stopSpeaking();
  } catch (error) {
    console.warn("Error stopping speaking:", error);
  }
}

// הודעה על מצב קולי חדש
const botMessage = { 
  from: "bot", 
  text: newVoiceMode ? 
    "מצב קולי הופעל. אני אקריא את התשובות שלי בקול רם." :
    "מצב קולי כובה."
};

setMessages(prev => [...prev, botMessage]);

// הקראת ההודעה אם מצב קולי הופעל
if (newVoiceMode) {
  try {
    VoiceService.speak(botMessage.text);
  } catch (error) {
    console.warn("Error speaking:", error);
  }
}
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
  AIService.clearConversation();
  
  const welcomeMessages = [
    { from: "bot", text: "היי! אני חיילתAI. בוא נתחיל בשיחה חדשה 😊" },
    { from: "bot", text: "איך אתה מרגיש היום?" }
  ];
  
  setMessages(welcomeMessages);
  
  // הקראת ההודעה הראשונה אם במצב קולי
  if (isVoiceMode) {
    try {
      VoiceService.speak(welcomeMessages[0].text + " " + welcomeMessages[1].text);
    } catch (error) {
      console.warn("Error speaking:", error);
    }
  }
}
};

// האזנה להקראת בוט
const handleSpeakLastMessage = () => {
const lastBotMessage = [...messages].reverse().find(msg => msg.from === "bot");

if (lastBotMessage) {
  try {
    VoiceService.speak(lastBotMessage.text);
  } catch (error) {
    console.warn("Error speaking:", error);
    
    // הודעה אם לא ניתן להקריא
    const lastMessages = messages.slice(-3);
    const hasRecentError = lastMessages.some(msg => 
      msg.from === "bot" && msg.text.includes("לא הצלחתי להקריא")
    );
    
    if (!hasRecentError) {
      const errorMessage = { 
        from: "bot", 
        text: "לא הצלחתי להקריא את ההודעה. נסה להפעיל את מצב הקולי." 
      };
      setMessages(prev => [...prev, errorMessage]);
    }
  }
}
};

// החלפת מצב תצוגה (רגיל/חשוך)
const toggleDarkMode = () => {
setDarkMode(!darkMode);
};

// אימוג'ים נפוצים לשימוש בצ'אט
const emojis = ['😊', '😁', '😔', '😢', '😎', '❤️', '👍', '👎', '🙏', '🤔', '😴', '🥱', '🤢', '🤮', '🤕', '🤒'];

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
          className="input-improved dark:bg-transparent dark:text-white"
          placeholder={isListening ? "מקליט..." : "כתוב הודעה..."}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
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
          className="absolute bottom-full right-0 bg-white dark:bg-gray-700 shadow-lg p-2 rounded-lg mb-2 border border-gray-200 dark:border-gray-600 grid grid-cols-4 gap-2 max-w-xs z-10"
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

export default ChatComponent;