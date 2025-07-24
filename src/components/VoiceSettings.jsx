import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import VoiceService from "../services/voiceservice";

const VoiceSettings = ({ onClose }) => {
  const [pitch, setPitch] = useState(1.2);
  const [rate, setRate] = useState(1.0);
  const [volume, setVolume] = useState(1.0);
  const [testText, setTestText] = useState("שלום, איך אני נשמעת? זוהי הדגמה של הקול שלי.");
  const [voices, setVoices] = useState([]);
  const [selectedVoice, setSelectedVoice] = useState("");
  
  // טעינת הגדרות קול נוכחיות
  useEffect(() => {
    try {
      const settings = VoiceService.changeVoiceSettings({});
      setPitch(settings.pitch);
      setRate(settings.rate);
      setVolume(settings.volume);
      
      if (settings.selectedVoice) {
        setSelectedVoice(settings.selectedVoice);
      }
      
      // קבלת רשימת קולות
      setVoices(VoiceService.getAvailableVoices());
    } catch (error) {
      console.error("Error loading voice settings:", error);
    }
  }, []);
  
  // שמירת הגדרות
  const saveSettings = () => {
    VoiceService.changeVoiceSettings({
      pitch,
      rate,
      volume
    });
    
    onClose();
  };
  
  // בחירת קול נשי
  const selectFemaleVoice = () => {
    VoiceService.changeVoiceSettings({
      useFemaleVoice: true
    });
    
    const settings = VoiceService.changeVoiceSettings({});
    if (settings.selectedVoice) {
      setSelectedVoice(settings.selectedVoice);
    }
  };
  
  // בדיקת ההגדרות הנוכחיות
  const testCurrentVoice = () => {
    VoiceService.speak(testText, {
      pitch,
      rate,
      volume
    });
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <motion.div
        className="bg-white rounded-xl max-w-lg w-full shadow-xl overflow-hidden"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        <div className="bg-blue-600 text-white p-4 flex justify-between items-center">
          <h2 className="text-lg font-medium">הגדרות קול</h2>
          <button onClick={onClose} className="text-white hover:text-red-200">✕</button>
        </div>
        
        <div className="p-6 space-y-4">
          <div className="mb-4">
            <label className="block text-gray-700 mb-2 text-right">
              גובה קול (גבוה = קול נשי יותר)
            </label>
            <div className="flex items-center gap-4">
              <span className="text-gray-600">נמוך</span>
              <input 
                type="range" 
                min="0.5" 
                max="2" 
                step="0.1" 
                value={pitch}
                onChange={(e) => setPitch(parseFloat(e.target.value))}
                className="w-full"
              />
              <span className="text-gray-600">גבוה</span>
              <span className="text-blue-600 font-medium w-10 text-left">{pitch}</span>
            </div>
          </div>
          
          <div className="mb-4">
            <label className="block text-gray-700 mb-2 text-right">
              מהירות דיבור
            </label>
            <div className="flex items-center gap-4">
              <span className="text-gray-600">איטי</span>
              <input 
                type="range" 
                min="0.5" 
                max="1.5" 
                step="0.1" 
                value={rate}
                onChange={(e) => setRate(parseFloat(e.target.value))}
                className="w-full"
              />
              <span className="text-gray-600">מהיר</span>
              <span className="text-blue-600 font-medium w-10 text-left">{rate}</span>
            </div>
          </div>
          
          <div className="mb-4">
            <label className="block text-gray-700 mb-2 text-right">
              עוצמת קול
            </label>
            <div className="flex items-center gap-4">
              <span className="text-gray-600">חלש</span>
              <input 
                type="range" 
                min="0.1" 
                max="1" 
                step="0.1" 
                value={volume}
                onChange={(e) => setVolume(parseFloat(e.target.value))}
                className="w-full"
              />
              <span className="text-gray-600">חזק</span>
              <span className="text-blue-600 font-medium w-10 text-left">{volume}</span>
            </div>
          </div>
          
          <div className="mb-2">
            <label className="block text-gray-700 mb-2 text-right">
              קול נבחר
            </label>
            <div className="text-right bg-gray-100 p-2 rounded">
              {selectedVoice || "קול ברירת מחדל"}
            </div>
          </div>
          
          <div className="mb-4">
            <button
              onClick={selectFemaleVoice}
              className="bg-pink-500 text-white px-3 py-2 rounded hover:bg-pink-600 transition w-full text-right"
            >
              בחר קול נשי (אוטומטי)
            </button>
          </div>
          
          <div className="border-t pt-4 mt-4">
            <div className="mb-2 text-right">
              <label className="block text-gray-700 mb-2">
                טקסט לבדיקה
              </label>
              <textarea
                value={testText}
                onChange={(e) => setTestText(e.target.value)}
                className="w-full border p-2 rounded text-right"
                rows="2"
              />
            </div>
            
            <button
              onClick={testCurrentVoice}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition w-full mb-4"
            >
              בדוק קול
            </button>
          </div>
        </div>
        
        <div className="bg-gray-100 p-4 flex justify-between">
          <button
            onClick={onClose}
            className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 transition"
          >
            ביטול
          </button>
          <button
            onClick={saveSettings}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition"
          >
            שמור הגדרות
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default VoiceSettings;