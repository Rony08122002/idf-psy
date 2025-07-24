import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import AIService from "../services/AIService";

/**
 * רכיב צ'אט פשוט לשימוש כאשר תכונות הקול אינן זמינות
 */
const PlainChat = ({ userName, onClose }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isChatInitialized, setIsChatInitialized] = useState(false);
  const messagesEndRef = useRef(null);

  // אתחול השיחה
  useEffect(() => {
    // הוספת הודעת פתיחה
    const welcomeMessage = userName 
      ? `שלום ${userName}, אני חיילתAI. איך אני יכולה לעזור לך היום?` 
      : "שלום! אני חיילתAI. איך אני יכולה לעזור לך היום?";
    
    setMessages([{ 
      from: "bot", 
      text: welcomeMessage 
    }]);
    
    setIsChatInitialized(true);
  }, [userName]);

  // גלילה אוטומטית לסוף השיחה כשיש הודעות חדשות
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ניתוח בסיסי של רגשות
  const analyzeFeeling = (text) => {
    const positiveWords = ["טוב", "מצוין", "נהדר", "שמח", "רגוע", "נפלא"];
    const negativeWords = ["רע", "עצוב", "קשה", "מדוכא", "עייף", "לחוץ", "מתוח"];
    
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
    
    AIService.updateUserInfo({ lastSentiment: sentiment });
    return sentiment;
  };

  // טיפול בשליחת הודעה
  const handleSend = async () => {
    if (!input.trim()) return;
    
    // הוספת הודעת המשתמש
    const userMessage = { from: "user", text: input };
    setMessages(prev => [...prev, userMessage]);
    setInput("");
    
    // ניתוח רגשות
    analyzeFeeling(input);
    
    // סימולציה של הקלדת הבוט
    setIsTyping(true);
    
    try {
      // קבלת תשובה מה-AI
      const response = await AIService.sendMessage(input);
      
      // המתנה קצרה לפני תגובה (נראה יותר טבעי)
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // הוספת התשובה להודעות
      const botMessage = { from: "bot", text: response };
      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error("Error getting AI response:", error);
      const errorMessage = { 
        from: "bot", 
        text: "סליחה, נתקלתי בבעיה. האם תוכל לנסות שוב?" 
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };
  
  // שליחת הודעה בלחיצה על Enter
  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      handleSend();
    }
  };

  // ניקוי היסטוריית השיחה והתחלה מחדש
  const clearConversation = () => {
    // הוספת הודעת פתיחה חדשה
    const welcomeMessage = "שיחה חדשה התחילה. איך אני יכולה לעזור לך?";
    setMessages([{ from: "bot", text: welcomeMessage }]);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <motion.div 
        className="bg-white rounded-xl w-full max-w-xl overflow-hidden shadow-xl flex flex-col"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.3 }}
        style={{ height: '70vh' }}
      >
        <div className="p-4 bg-blue-600 text-white flex justify-between items-center">
          <h3 className="text-lg font-medium">שיחה עם חיילתAI</h3>
          <button 
            onClick={onClose} 
            className="text-white hover:text-red-200"
            title="סגור"
          >
            ✕
          </button>
        </div>
        
        <div className="flex-grow overflow-y-auto p-4">
          {isChatInitialized ? (
            <div className="space-y-4">
              {messages.map((msg, i) => (
                <motion.div
                  key={i}
                  className={`p-3 rounded-xl max-w-[80%] whitespace-pre-wrap ${
                    msg.from === "bot"
                      ? "bg-pink-100 mr-auto text-right"
                      : "bg-blue-100 ml-auto text-left"
                  }`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  {msg.text}
                </motion.div>
              ))}
              
              {isTyping && (
                <motion.div 
                  className="bg-pink-100 mr-auto text-right p-3 rounded-xl max-w-[80%]"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <div className="flex gap-1 justify-end">
                    <div className="w-2 h-2 bg-pink-500 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-pink-500 rounded-full animate-bounce" style={{animationDelay: "0.2s"}}></div>
                    <div className="w-2 h-2 bg-pink-500 rounded-full animate-bounce" style={{animationDelay: "0.4s"}}></div>
                  </div>
                </motion.div>
              )}
              
              <div ref={messagesEndRef} />
            </div>
          ) : (
            <div className="flex-grow flex justify-center items-center">
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
                <p>טוען את השיחה...</p>
              </div>
            </div>
          )}
        </div>
        
        <div className="border-t p-4">
          <div className="flex gap-2">
            <input
              className="flex-1 border rounded-xl p-3 focus:outline-none text-right"
              placeholder="כתוב הודעה..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
            />
            <button
              onClick={handleSend}
              className="bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700 transition"
              disabled={!input.trim() || isTyping}
            >
              שלח
            </button>
          </div>
          
          <div className="flex justify-center mt-3">
            <button
              onClick={clearConversation}
              className="text-gray-500 text-sm flex items-center"
            >
              <span className="mr-1">🔄</span> התחל שיחה חדשה
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default PlainChat;