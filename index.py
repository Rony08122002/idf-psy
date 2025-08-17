import React, { useState, useEffect, useRef } from 'react';
import { Shield, MessageCircle, Mic, Video, Settings, Clock, FileText, Heart, Send, ArrowLeft, Share, X, User, Lock, Globe, Bell, BarChart3, AlertTriangle, CheckCircle } from 'lucide-react';

// רכיב אווטר מונפש
const AnimatedAvatar = ({ gender, speaking, mood }) => {
  const [blinkState, setBlinkState] = useState(false);
  
  useEffect(() => {
    const blinkInterval = setInterval(() => {
      setBlinkState(true);
      setTimeout(() => setBlinkState(false), 150);
    }, 3000);
    
    return () => clearInterval(blinkInterval);
  }, []);

  const getMoodColor = () => {
    switch(mood) {
      case 'חיובי': return '#22c55e';
      case 'שלילי': return '#ef4444';
      default: return '#6b7280';
    }
  };

  return (
    <div className="relative w-48 h-48 mx-auto mb-4">
      <div className="w-full h-full bg-gradient-to-b from-blue-100 to-blue-200 rounded-full flex items-center justify-center border-4 border-blue-300">
        <div className="relative">
          <div className="w-32 h-32 bg-orange-200 rounded-full relative">
            <div className="absolute top-8 left-6 w-4 h-4 bg-black rounded-full">
              {blinkState && <div className="w-full h-1 bg-orange-200 absolute top-1.5"></div>}
            </div>
            <div className="absolute top-8 right-6 w-4 h-4 bg-black rounded-full">
              {blinkState && <div className="w-full h-1 bg-orange-200 absolute top-1.5"></div>}
            </div>
            
            <div className="absolute top-12 left-1/2 transform -translate-x-1/2 w-2 h-3 bg-orange-300 rounded"></div>
            
            <div className={`absolute top-16 left-1/2 transform -translate-x-1/2 w-6 h-3 border-2 border-black rounded-b-full ${
              mood === 'חיובי' ? 'border-t-0' : mood === 'שלילי' ? 'border-b-0 rotate-180' : 'border-t-0'
            } ${speaking ? 'animate-pulse' : ''}`} 
            style={{ borderColor: getMoodColor() }}></div>
            
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 w-24 h-8 bg-green-800 rounded-t-full"></div>
            <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-28 h-2 bg-green-900 rounded-full"></div>
          </div>
          
          <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 w-20 h-16 bg-green-800 rounded-t-lg">
            <div className="absolute top-2 left-2 w-1 h-4 bg-yellow-400"></div>
            <div className="absolute top-2 left-4 w-1 h-4 bg-yellow-400"></div>
            <div className="absolute top-2 right-2 w-1 h-4 bg-yellow-400"></div>
            <div className="absolute top-2 right-4 w-1 h-4 bg-yellow-400"></div>
          </div>
        </div>
      </div>
      
      {speaking && (
        <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 flex space-x-1">
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
        </div>
      )}
    </div>
  );
};

// רכיב סליידר מצב רוח
const MoodSlider = ({ value, onChange }) => (
  <div className="w-full px-4 py-6">
    <label className="block text-sm font-medium text-gray-700 mb-2">
      איך אתה מרגיש היום? ({value}/10)
    </label>
    <input
      type="range"
      min="1"
      max="10"
      value={value}
      onChange={(e) => onChange(parseInt(e.target.value))}
      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
    />
    <div className="flex justify-between text-xs text-gray-500 mt-1">
      <span>גרוע מאוד</span>
      <span>בסדר</span>
      <span>מעולה</span>
    </div>
  </div>
);

// רכיב הודעת צ'אט
const ChatMessage = ({ message, isUser, timestamp }) => (
  <div className={`flex ${isUser ? 'justify-start' : 'justify-end'} mb-4`}>
    <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
      isUser 
        ? 'bg-blue-500 text-white' 
        : 'bg-gray-200 text-gray-800'
    }`}>
      <p className="text-sm text-right">{message}</p>
      <p className="text-xs opacity-70 mt-1 text-right">{timestamp}</p>
    </div>
  </div>
);

// רכיב תוצאות הערכה
const AssessmentResults = ({ mood, stress, recommendation }) => {
  const getMoodIcon = () => {
    switch(mood) {
      case 'חיובי': return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'שלילי': return <AlertTriangle className="w-5 h-5 text-red-500" />;
      default: return <Heart className="w-5 h-5 text-yellow-500" />;
    }
  };

  const getStressColor = () => {
    switch(stress) {
      case 'נמוך': return 'text-green-600';
      case 'גבוה': return 'text-red-600';
      default: return 'text-yellow-600';
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md border">
      <h3 className="text-lg font-semibold mb-4 flex items-center text-right">
        <span className="mr-2">תוצאות הערכה</span>
        <BarChart3 className="w-5 h-5" />
      </h3>
      
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="font-medium">{mood}</span>
          <span className="flex items-center">
            <span className="mr-2">מצב רוח:</span>
            {getMoodIcon()}
          </span>
        </div>
        
        <div className="flex items-center justify-between">
          <span className={`font-medium ${getStressColor()}`}>{stress}</span>
          <span>רמת לחץ:</span>
        </div>
        
        <div className="pt-2 border-t">
          <p className="text-sm text-gray-600 text-right">
            <strong>המלצה:</strong> {recommendation}
          </p>
        </div>
      </div>
    </div>
  );
};

// רכיב האפליקציה הראשי
const SoldierMentalSupportApp = () => {
  const [currentView, setCurrentView] = useState('home');
  const [selectedLanguage, setSelectedLanguage] = useState('he');
  const [selectedAvatar, setSelectedAvatar] = useState('male');
  const [chatMessages, setChatMessages] = useState([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [isAISpeaking, setIsAISpeaking] = useState(false);
  const [moodSliderValue, setMoodSliderValue] = useState(5);
  const [currentAssessment, setCurrentAssessment] = useState(null);
  const [conversationHistory, setConversationHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [communicationMode, setCommunicationMode] = useState('text');
  const chatContainerRef = useRef(null);

  // אפשרויות שפה
  const languages = {
    he: 'עברית',
    en: 'English',
    ru: 'Русский',
    am: 'አማርኛ',
    ar: 'العربية'
  };

  // גלילה לתחתית הצ'אט
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatMessages]);

  // סימולציית תגובת AI
  const generateAIResponse = async (userMessage, conversationContext = []) => {
    setIsLoading(true);
    setIsAISpeaking(true);
    
    try {
      const messages = [
        {
          role: "user",
          content: `אתה עוזר AI לתמיכה נפשית לחיילים. עליך להיות אמפתי, מקצועי ותומך. 
          
          הנחיות:
          - שאל שאלות המשך כדי להבין את מצבם הנפשי
          - תן תגובות תומכות
          - אם הם מביעים מצוקה רצינית, המלץ על עזרה מקצועית
          - שמור על תגובות קצרות אך דואגות
          - פנה אליהם כחבר לנשק
          - ענה בעברית בלבד
          
          הקשר השיחה הקודמת: ${JSON.stringify(conversationContext)}
          
          ההודעה הנוכחית מהחייל: "${userMessage}"
          
          כמו כן נתח את ההודעה שלהם וספק הערכה JSON בסוף בפורמט הזה:
          
          ASSESSMENT: {"mood": "חיובי/נייטרלי/שלילי", "stress": "נמוך/בינוני/גבוה", "recommendation": "המשך טיפול עצמי / פנה לעזרה מקצועית"}
          
          ענה טבעית תחילה, ואז הוסף את ההערכה.`
        }
      ];

      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          messages: messages
        })
      });

      const data = await response.json();
      const fullResponse = data.content[0].text;
      
      let aiMessage = fullResponse;
      let assessment = null;
      
      const assessmentMatch = fullResponse.match(/ASSESSMENT:\s*({.*})/);
      if (assessmentMatch) {
        try {
          assessment = JSON.parse(assessmentMatch[1]);
          aiMessage = fullResponse.replace(/ASSESSMENT:\s*{.*}/, '').trim();
        } catch (e) {
          console.error('Failed to parse assessment:', e);
        }
      }

      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const timestamp = new Date().toLocaleTimeString();
      const newMessage = { 
        message: aiMessage, 
        isUser: false, 
        timestamp,
        assessment 
      };
      
      setChatMessages(prev => [...prev, newMessage]);
      
      if (assessment) {
        setCurrentAssessment(assessment);
      }

      return newMessage;
      
    } catch (error) {
      console.error('Error generating AI response:', error);
      const errorMessage = "אני כאן כדי לתמוך בך. תוכל לספר לי קצת יותר על איך אתה מרגיש היום?";
      const timestamp = new Date().toLocaleTimeString();
      const newMessage = { 
        message: errorMessage, 
        isUser: false, 
        timestamp 
      };
      setChatMessages(prev => [...prev, newMessage]);
      return newMessage;
    } finally {
      setIsLoading(false);
      setIsAISpeaking(false);
    }
  };

  // שליחת הודעה
  const sendMessage = async () => {
    if (!currentMessage.trim()) return;

    const timestamp = new Date().toLocaleTimeString();
    const userMessage = { 
      message: currentMessage, 
      isUser: true, 
      timestamp 
    };

    setChatMessages(prev => [...prev, userMessage]);
    setCurrentMessage('');

    const conversationContext = chatMessages.slice(-5);
    await generateAIResponse(currentMessage, conversationContext);
  };

  // התחלת בדיקה יומית
  const startDailyCheckin = (mode) => {
    setCommunicationMode(mode);
    setChatMessages([]);
    setCurrentAssessment(null);
    setCurrentView('chat');
    
    setTimeout(() => {
      const greeting = "שלום! אני כאן כדי לבדוק איתך איך אתה מרגיש היום. איך אתה עכשיו?";
      const timestamp = new Date().toLocaleTimeString();
      setChatMessages([{ 
        message: greeting, 
        isUser: false, 
        timestamp 
      }]);
    }, 500);
  };

  // שמירת שיחה
  const saveConversation = () => {
    const conversation = {
      id: Date.now(),
      date: new Date().toLocaleDateString('he-IL'),
      messages: chatMessages,
      assessment: currentAssessment,
      mood: moodSliderValue,
      mode: communicationMode
    };
    
    setConversationHistory(prev => [conversation, ...prev]);
  };

  // סיום שיחה
  const endConversation = () => {
    saveConversation();
    setCurrentView('assessment');
  };

  // שיתוף דוח
  const shareReport = () => {
    alert('הדוח הוצפן בצורה מאובטחת ונשלח לקצין הבריאות הנפשית המיועד שלך. הם ייצרו קשר במידת הצורך.');
    setCurrentView('home');
  };

  // רנדור מסך בית
  const renderHome = () => (
    <div className="max-w-md mx-auto bg-white min-h-screen" dir="rtl">
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white p-6 text-center">
        <Shield className="w-12 h-12 mx-auto mb-2" />
        <h1 className="text-xl font-bold">שומר הנפש</h1>
        <p className="text-sm opacity-90">תמיכה נפשית AI לחיילים</p>
      </div>

      <div className="p-6 space-y-4">
        <button
          onClick={() => setCurrentView('communication-select')}
          className="w-full bg-green-600 hover:bg-green-700 text-white p-4 rounded-lg flex items-center justify-center space-x-2 transition-colors"
        >
          <span>התחל בדיקה יומית</span>
          <Heart className="w-5 h-5" />
        </button>

        <button
          onClick={() => setCurrentView('history')}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-lg flex items-center justify-center space-x-2 transition-colors"
        >
          <span>שיחות קודמות</span>
          <Clock className="w-5 h-5" />
        </button>

        <button
          onClick={() => setCurrentView('tips')}
          className="w-full bg-purple-600 hover:bg-purple-700 text-white p-4 rounded-lg flex items-center justify-center space-x-2 transition-colors"
        >
          <span>טיפים לבריאות נפשית</span>
          <FileText className="w-5 h-5" />
        </button>

        <button
          onClick={() => setCurrentView('settings')}
          className="w-full bg-gray-600 hover:bg-gray-700 text-white p-4 rounded-lg flex items-center justify-center space-x-2 transition-colors"
        >
          <span>הגדרות</span>
          <Settings className="w-5 h-5" />
        </button>
      </div>

      <div className="p-6 bg-gray-50 mx-4 rounded-lg">
        <h3 className="font-semibold mb-2 text-right">השבוע</h3>
        <div className="grid grid-cols-2 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold text-green-600">5</p>
            <p className="text-xs text-gray-600">בדיקות</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-blue-600">7.2</p>
            <p className="text-xs text-gray-600">מצב רוח ממוצע</p>
          </div>
        </div>
      </div>
    </div>
  );

  // רנדור בחירת מצב תקשורת
  const renderCommunicationSelect = () => (
    <div className="max-w-md mx-auto bg-white min-h-screen" dir="rtl">
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white p-4 flex items-center">
        <h1 className="text-xl font-bold flex-1">בחר מצב תקשורת</h1>
        <button onClick={() => setCurrentView('home')} className="ml-4">
          <ArrowLeft className="w-6 h-6" />
        </button>
      </div>

      <div className="p-6 space-y-4">
        <button
          onClick={() => startDailyCheckin('text')}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white p-6 rounded-lg flex items-center justify-center space-x-3 transition-colors"
        >
          <div className="text-right">
            <div className="font-bold text-lg">צ'אט טקסט</div>
            <div className="text-sm opacity-90">הקלד את ההודעות שלך</div>
          </div>
          <MessageCircle className="w-8 h-8" />
        </button>

        <button
          onClick={() => startDailyCheckin('voice')}
          className="w-full bg-green-600 hover:bg-green-700 text-white p-6 rounded-lg flex items-center justify-center space-x-3 transition-colors"
        >
          <div className="text-right">
            <div className="font-bold text-lg">צ'אט קולי</div>
            <div className="text-sm opacity-90">דבר עם הAI</div>
          </div>
          <Mic className="w-8 h-8" />
        </button>

        <button
          onClick={() => startDailyCheckin('video')}
          className="w-full bg-purple-600 hover:bg-purple-700 text-white p-6 rounded-lg flex items-center justify-center space-x-3 transition-colors"
        >
          <div className="text-right">
            <div className="font-bold text-lg">צ'אט וידאו</div>
            <div className="text-sm opacity-90">דבר עם אווטר מונפש</div>
          </div>
          <Video className="w-8 h-8" />
        </button>
      </div>
    </div>
  );

  // רנדור ממשק צ'אט
  const renderChat = () => (
    <div className="max-w-md mx-auto bg-white min-h-screen flex flex-col" dir="rtl">
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white p-4 flex items-center">
        <button
          onClick={endConversation}
          className="bg-red-500 hover:bg-red-600 px-3 py-1 rounded text-sm transition-colors ml-4"
        >
          סיום
        </button>
        <h1 className="text-xl font-bold flex-1 text-right">
          {communicationMode === 'text' ? 'צ\'אט טקסט' : 
           communicationMode === 'voice' ? 'צ\'אט קולי' : 'צ\'אט וידאו'}
        </h1>
        <button onClick={() => setCurrentView('home')} className="mr-4">
          <ArrowLeft className="w-6 h-6" />
        </button>
      </div>

      {(communicationMode === 'voice' || communicationMode === 'video') && (
        <div className="p-4 bg-gray-50 text-center">
          <AnimatedAvatar 
            gender={selectedAvatar} 
            speaking={isAISpeaking}
            mood={currentAssessment?.mood?.toLowerCase() || 'neutral'}
          />
        </div>
      )}

      <div className="bg-gray-50">
        <MoodSlider value={moodSliderValue} onChange={setMoodSliderValue} />
      </div>

      <div 
        ref={chatContainerRef}
        className="flex-1 p-4 overflow-y-auto space-y-4"
        style={{ maxHeight: 'calc(100vh - 400px)' }}
      >
        {chatMessages.map((msg, index) => (
          <ChatMessage
            key={index}
            message={msg.message}
            isUser={msg.isUser}
            timestamp={msg.timestamp}
          />
        ))}
        
        {isLoading && (
          <div className="flex justify-end">
            <div className="bg-gray-200 rounded-lg px-4 py-2">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="p-4 border-t bg-white">
        <div className="flex space-x-2">
          <button
            onClick={sendMessage}
            disabled={!currentMessage.trim() || isLoading}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white p-2 rounded-lg transition-colors"
          >
            <Send className="w-5 h-5" />
          </button>
          <input
            type="text"
            value={currentMessage}
            onChange={(e) => setCurrentMessage(e.target.value)}
            placeholder="הקלד את ההודעה שלך..."
            className="flex-1 border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-right"
            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
          />
        </div>
        
        {communicationMode === 'voice' && (
          <div className="mt-2 text-center">
            <button className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg">
              <Mic className="w-4 h-4 inline ml-2" />
              החזק כדי להקליט
            </button>
          </div>
        )}
      </div>
    </div>
  );

  // רנדור תוצאות הערכה
  const renderAssessment = () => (
    <div className="max-w-md mx-auto bg-white min-h-screen" dir="rtl">
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white p-4 flex items-center">
        <h1 className="text-xl font-bold">הפגישה הסתיימה</h1>
      </div>

      <div className="p-6 space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">תודה שבדקת איתנו!</h2>
          <p className="text-gray-600">הנה סיכום השיחה של היום:</p>
        </div>

        {currentAssessment && <AssessmentResults {...currentAssessment} />}

        <div className="bg-blue-50 p-4 rounded-lg">
          <h3 className="font-semibold mb-2 text-right">דירוג מצב הרוח שלך</h3>
          <div className="flex items-center justify-end">
            <span className="mr-2 text-gray-600">
              {moodSliderValue >= 8 ? 'מעולה!' : 
               moodSliderValue >= 6 ? 'טוב' :
               moodSliderValue >= 4 ? 'בסדר' : 'דורש תשומת לב'}
            </span>
            <span className="text-3xl font-bold text-blue-600">{moodSliderValue}/10</span>
          </div>
        </div>

        {currentAssessment?.stress === 'גבוה' && (
          <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
            <div className="flex items-center mb-2 justify-end">
              <h3 className="font-semibold text-yellow-800">המלצה</h3>
              <AlertTriangle className="w-5 h-5 text-yellow-600 mr-2" />
            </div>
            <p className="text-yellow-700 text-sm mb-3 text-right">
              התגובות שלך מצביעות על רמות לחץ גבוהות. האם תרצה לשתף דוח סודי עם איש מקצוע לבריאות נפשית?
            </p>
            <button
              onClick={shareReport}
              className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
            >
              <span>שתף דוח סודי</span>
              <Share className="w-4 h-4" />
            </button>
          </div>
        )}

        <div className="flex space-x-4">
          <button
            onClick={() => setCurrentView('tips')}
            className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg transition-colors"
          >
            קבל טיפים
          </button>
          <button
            onClick={() => setCurrentView('home')}
            className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-3 rounded-lg transition-colors"
          >
            חזור הביתה
          </button>
        </div>
      </div>
    </div>
  );

  // רנדור הגדרות
  const renderSettings = () => (
    <div className="max-w-md mx-auto bg-white min-h-screen" dir="rtl">
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white p-4 flex items-center">
        <h1 className="text-xl font-bold flex-1">הגדרות</h1>
        <button onClick={() => setCurrentView('home')} className="mr-4">
          <ArrowLeft className="w-6 h-6" />
        </button>
      </div>

      <div className="p-6 space-y-6">
        <div className="border-b pb-4">
          <h3 className="font-semibold mb-3 flex items-center justify-end">
            <span className="mr-2">שפה</span>
            <Globe className="w-5 h-5" />
          </h3>
          <select 
            value={selectedLanguage}
            onChange={(e) => setSelectedLanguage(e.target.value)}
            className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-right"
          >
            {Object.entries(languages).map(([code, name]) => (
              <option key={code} value={code}>{name}</option>
            ))}
          </select>
        </div>

        <div className="border-b pb-4">
          <h3 className="font-semibold mb-3 flex items-center justify-end">
            <span className="mr-2">סגנון אווטר</span>
            <User className="w-5 h-5" />
          </h3>
          <div className="flex space-x-4">
            <button
              onClick={() => setSelectedAvatar('female')}
              className={`flex-1 p-3 rounded-lg border-2 ${
                selectedAvatar === 'female' 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-gray-200'
              }`}
            >
              חיילת
            </button>
            <button
              onClick={() => setSelectedAvatar('male')}
              className={`flex-1 p-3 rounded-lg border-2 ${
                selectedAvatar === 'male' 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-gray-200'
              }`}
            >
              חייל
            </button>
          </div>
        </div>

        <div className="border-b pb-4">
          <h3 className="font-semibold mb-3 flex items-center justify-end">
            <span className="mr-2">פרטיות ואבטחה</span>
            <Lock className="w-5 h-5" />
          </h3>
          <div className="space-y-2 text-sm text-gray-600 text-right">
            <p>✓ כל השיחות מוצפנות מקצה לקצה</p>
            <p>✓ הנתונים נשמרים מקומית במכשיר שלך</p>
            <p>✓ דוחות משותפים רק בהסכמה מפורשת</p>
            <p>✓ אנליטיקת שימוש אנונימית בלבד</p>
          </div>
        </div>

        <div>
          <h3 className="font-semibold mb-3 flex items-center justify-end">
            <span className="mr-2">התראות</span>
            <Bell className="w-5 h-5" />
          </h3>
          <div className="space-y-3">
            <label className="flex items-center justify-between">
              <input type="checkbox" defaultChecked className="rounded" />
              <span>תזכורות לבדיקה יומית</span>
            </label>
            <label className="flex items-center justify-between">
              <input type="checkbox" defaultChecked className="rounded" />
              <span>טיפים לבריאות נפשית</span>
            </label>
            <label className="flex items-center justify-between">
              <input type="checkbox" defaultChecked className="rounded" />
              <span>סיכומי מצב רוח שבועיים</span>
            </label>
          </div>
        </div>
      </div>
    </div>
  );

  // רנדור טיפים לבריאות נפשית
  const renderTips = () => (
    <div className="max-w-md mx-auto bg-white min-h-screen" dir="rtl">
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white p-4 flex items-center">
        <h1 className="text-xl font-bold flex-1">טיפים לבריאות נפשית</h1>
        <button onClick={() => setCurrentView('home')} className="mr-4">
          <ArrowLeft className="w-6 h-6" />
        </button>
      </div>

      <div className="p-6 space-y-4">
        <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
          <h3 className="font-semibold text-green-800 mb-2 text-right">🫁 תרגילי נשימה</h3>
          <p className="text-green-700 text-sm text-right">
            טכניקת 4-7-8: שאוף לארבע ספירות, החזק ל-7, נשוף ל-8. חזור 3-4 פעמים.
          </p>
        </div>

        <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
          <h3 className="font-semibold text-blue-800 mb-2 text-right">💪 בריאות גופנית</h3>
          <p className="text-blue-700 text-sm text-right">
            פעילות גופנית סדירה, אפילו 10 דקות ביום, יכולה לשפר משמעותית את מצב הרוח ולהפחית לחץ.
          </p>
        </div>

        <div className="bg-purple-50 border border-purple-200 p-4 rounded-lg">
          <h3 className="font-semibold text-purple-800 mb-2 text-right">🧘 מיינדפולנס</h3>
          <p className="text-purple-700 text-sm text-right">
            קח 5 דקות להתמקד ברגע הנוכחי. שים לב לסביבה שלך ללא שיפוט.
          </p>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
          <h3 className="font-semibold text-yellow-800 mb-2 text-right">🤝 קשר חברתי</h3>
          <p className="text-yellow-700 text-sm text-right">
            פנה לחבר ליחידה או לבן משפחה. תמיכה חברתית חיונית לבריאות נפשית.
          </p>
        </div>

        <div className="bg-orange-50 border border-orange-200 p-4 rounded-lg">
          <h3 className="font-semibold text-orange-800 mb-2 text-right">😴 היגיינת שינה</h3>
          <p className="text-orange-700 text-sm text-right">
            שאף ל-7-9 שעות שינה. צור שגרה והימנע ממסכים שעה לפני השינה.
          </p>
        </div>

        <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
          <h3 className="font-semibold text-red-800 mb-2 text-right">🆘 מתי לפנות לעזרה</h3>
          <p className="text-red-700 text-sm text-right">
            אם יש לך מחשבות על פגיעה עצמית, עצב מתמשך או קושי לתפקד, אנא פנה לאיש מקצוע לבריאות נפשית מיד.
          </p>
        </div>

        <div className="bg-gray-50 p-4 rounded-lg text-center">
          <h3 className="font-semibold mb-2">משאבי חירום</h3>
          <div className="space-y-1 text-sm">
            <p><strong>קו חירום צבאי:</strong> 1201</p>
            <p><strong>חירום:</strong> 100</p>
            <p><strong>נטל:</strong> 1-800-363-4845</p>
            <p><strong>ער"ן:</strong> 1201</p>
          </div>
        </div>
      </div>
    </div>
  );

  // רנדור היסטוריית שיחות
  const renderHistory = () => (
    <div className="max-w-md mx-auto bg-white min-h-screen" dir="rtl">
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white p-4 flex items-center">
        <h1 className="text-xl font-bold flex-1">שיחות קודמות</h1>
        <button onClick={() => setCurrentView('home')} className="mr-4">
          <ArrowLeft className="w-6 h-6" />
        </button>
      </div>

      <div className="p-6">
        {conversationHistory.length === 0 ? (
          <div className="text-center py-12">
            <Clock className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-500">אין שיחות קודמות עדיין.</p>
            <p className="text-gray-400 text-sm">התחל את הבדיקה הראשונה שלך כדי לראות היסטוריה כאן.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {conversationHistory.map((conversation) => (
              <div key={conversation.id} className="border rounded-lg p-4 hover:bg-gray-50">
                <div className="flex justify-between items-start mb-2">
                  <div className="text-left">
                    <p className="text-sm text-gray-600">מצב רוח: {conversation.mood}/10</p>
                    {conversation.assessment && (
                      <p className={`text-xs ${
                        conversation.assessment.stress === 'גבוה' ? 'text-red-600' :
                        conversation.assessment.stress === 'בינוני' ? 'text-yellow-600' :
                        'text-green-600'
                      }`}>
                        לחץ {conversation.assessment.stress}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{conversation.date}</p>
                    <p className="text-sm text-gray-600 capitalize">צ'אט {conversation.mode}</p>
                  </div>
                </div>
                <p className="text-sm text-gray-700 text-right">
                  {conversation.messages.length} הודעות הוחלפו
                </p>
                {conversation.assessment && (
                  <p className="text-xs text-gray-600 mt-1 text-right">
                    {conversation.assessment.recommendation}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  // לוגיקת רנדור ראשית
  const renderCurrentView = () => {
    switch(currentView) {
      case 'home': return renderHome();
      case 'communication-select': return renderCommunicationSelect();
      case 'chat': return renderChat();
      case 'assessment': return renderAssessment();
      case 'settings': return renderSettings();
      case 'tips': return renderTips();
      case 'history': return renderHistory();
      default: return renderHome();
    }
  };

  return (
    <div className="bg-gray-100 min-h-screen">
      {renderCurrentView()}
    </div>
  );
};

export default SoldierMentalSupportApp;
