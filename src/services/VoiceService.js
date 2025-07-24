/**
 * שירות משופר לטיפול בהקראה וזיהוי קול
 * עם תמיכה טובה יותר בשפה העברית וטיפול בשגיאות
 */
class VoiceService {
  constructor() {
    this.speechRecognition = null;
    this.isRecognitionSupported = 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
    this.isSynthesisSupported = 'speechSynthesis' in window;
    this.voices = [];
    this.isSpeaking = false;
    this.defaultVoiceRate = 1.0; // מהירות דיבור רגילה
    this.defaultVoicePitch = 1.2; // גובה צליל קצת גבוה יותר לקול נשי
    this.voiceVolume = 1.0; // עוצמת קול מקסימלית
    this.selectedVoice = null; // קול שנבחר
    this.useFemaleVoice = true; // להשתמש בקול נשי
    this.isInitialized = false; // האם האובייקט אותחל
    this.languageCode = 'he-IL'; // קוד שפה לעברית
    this.fallbackLanguage = 'en-US'; // שפת גיבוי אם עברית לא זמינה
    
    // טיימר להתאוששות מבעיות
    this.recoveryTimer = null;
    this.retryCount = 0;
    this.maxRetries = 3;
    
    if (this.isSynthesisSupported) {
      // טעינת קולות זמינים
      this.loadVoices();
      
      // האזנה לעדכון הקולות אם הם לא היו זמינים מיד
      if (typeof speechSynthesis !== 'undefined' && speechSynthesis.onvoiceschanged !== undefined) {
        try {
          speechSynthesis.onvoiceschanged = this.loadVoices.bind(this);
        } catch (error) {
          console.warn("Error setting onvoiceschanged handler:", error);
        }
      }
    }
  }
  
  /**
   * בדיקת יכולות זיהוי הדיבור
   */
  async checkRecognitionSupport() {
    try {
      // בדיקה אם יש תמיכה בסיסית בזיהוי דיבור
      if (!this.isRecognitionSupported) {
        return { supported: false, message: "הדפדפן שלך לא תומך בזיהוי דיבור" };
      }
      
      // בדיקת הרשאת מיקרופון
      if (navigator.permissions) {
        const permissionStatus = await navigator.permissions.query({ name: 'microphone' });
        
        if (permissionStatus.state === 'denied') {
          return { supported: false, message: "אין הרשאת גישה למיקרופון" };
        }
      }
      
      try {
        // ניסיון להפעיל זיהוי דיבור לרגע קצר
        const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition;
        const testRecognition = new SpeechRecognition();
        testRecognition.lang = this.languageCode;
        
        testRecognition.start();
        setTimeout(() => {
          try {
            testRecognition.stop();
          } catch (err) {}
        }, 500);
        
        return { supported: true, message: "יש תמיכה בזיהוי דיבור" };
      } catch (error) {
        console.warn("Error testing speech recognition:", error);
        return { supported: false, message: "שגיאה בהפעלת זיהוי דיבור: " + error.message };
      }
    } catch (error) {
      console.error("Error checking recognition support:", error);
      return { supported: false, message: "שגיאה כללית בבדיקת תמיכה: " + error.message };
    }
  }
  
  /**
   * טעינת קולות זמינים
   */
  loadVoices() {
    // בדיקה אם speechSynthesis זמין
    if (typeof speechSynthesis === 'undefined') {
      console.warn("speechSynthesis API is not available");
      return;
    }
    
    try {
      // נסה לקבל את הקולות הזמינים
      this.voices = speechSynthesis.getVoices() || [];
      
      // חיפוש קול נשי איכותי
      this.findBestFemaleVoice();
      
      // רישום פרטי הקולות לצורכי דיבוג
      if (this.voices.length > 0) {
        console.log("קולות זמינים:", this.voices.map(v => `${v.name} (${v.lang})`));
        if (this.selectedVoice) {
          console.log(`נבחר קול: ${this.selectedVoice.name} (${this.selectedVoice.lang})`);
        }
      } else {
        console.warn("לא נטענו קולות. ייתכן שהמערכת עדיין טוענת אותם.");
        
        // ניסיון נוסף לטעון קולות לאחר השהייה
        setTimeout(() => {
          this.voices = speechSynthesis.getVoices() || [];
          this.findBestFemaleVoice();
        }, 1000);
      }
      
    } catch (error) {
      console.error("Error loading voices:", error);
    }
  }
  
  /**
   * מוצא את הקול הנשי הטוב ביותר הזמין
   */
  findBestFemaleVoice() {
    if (!this.voices || this.voices.length === 0) return;
    
    // פונקציה לבדיקה האם קול הוא קול נשי
    const isFemaleVoice = (voice) => {
      if (!voice || !voice.name) return false;
      
      const name = voice.name.toLowerCase();
      return name.includes('female') || 
             name.includes('woman') || 
             name.includes('girl') ||
             name.includes('ava') ||
             name.includes('samantha') ||
             name.includes('alice') ||
             name.includes('victoria') ||
             name.includes('karen') ||
             // לבדוק שמות נשיים בעברית
             name.includes('נשי') ||
             name.includes('נקבה');
    };
    
    // ניסיון למצוא קול נשי עברי
    let femaleHebrewVoice = this.voices.find(v => 
      v.lang && v.lang.includes('he') && isFemaleVoice(v)
    );
    
    if (femaleHebrewVoice) {
      this.selectedVoice = femaleHebrewVoice;
      return;
    }
    
    // ניסיון למצוא קול עברי כלשהו
    let hebrewVoice = this.voices.find(v => v.lang && v.lang.includes('he'));
    if (hebrewVoice) {
      this.selectedVoice = hebrewVoice;
      return;
    }
    
    // קולות נשיים מועדפים
    const preferredVoices = [
      // קולות Google שבדרך כלל באיכות גבוהה
      this.voices.find(v => v.name && v.name.includes('Google') && isFemaleVoice(v)),
      // קולות באנגלית בריטית/אמריקאית
      this.voices.find(v => v.lang && v.lang.includes('en-GB') && isFemaleVoice(v)),
      this.voices.find(v => v.lang && v.lang.includes('en-US') && isFemaleVoice(v)),
      // קולות בשפות אחרות דומות
      this.voices.find(v => v.lang && v.lang.includes('es') && isFemaleVoice(v)),
      this.voices.find(v => v.lang && v.lang.includes('fr') && isFemaleVoice(v)),
      // קול נשי כלשהו
      this.voices.find(isFemaleVoice)
    ].filter(Boolean);
    
    // בחירת הקול הראשון מהרשימה המועדפת
    if (preferredVoices.length > 0) {
      this.selectedVoice = preferredVoices[0];
      return;
    }
    
    // אם לא נמצא קול מתאים, ניקח את הקול הראשון
    if (this.voices.length > 0) {
      this.selectedVoice = this.voices[0];
    }
  }
  
  /**
   * התחלת האזנה לדיבור, עם ניסיונות מרובים ושפות שונות
   * @param {function} onResult - פונקציה שתופעל כשיש תוצאות
   * @param {function} onError - פונקציה שתופעל במקרה של שגיאה
   * @param {boolean} isOneTime - האם לבצע האזנה חד פעמית או רציפה
   * @returns {boolean} - האם ההאזנה התחילה בהצלחה
   */
  startRecognition(onResult, onError, isOneTime = true) {
    if (!this.isRecognitionSupported) {
      if (onError) onError({ code: 'not-supported', message: "זיהוי דיבור אינו נתמך בדפדפן זה" });
      return false;
    }
    
    try {
      // עצירת זיהוי קודם אם קיים
      if (this.speechRecognition) {
        try {
          this.speechRecognition.stop();
        } catch (stopError) {
          console.warn("Error stopping previous recognition:", stopError);
        }
        this.speechRecognition = null;
      }
      
      // יצירת אובייקט זיהוי דיבור חדש
      const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition;
      this.speechRecognition = new SpeechRecognition();
      
      // הגדרות בסיסיות
      this.speechRecognition.lang = this.languageCode; // ניסיון עם עברית
      this.speechRecognition.continuous = !isOneTime; // האם להמשיך להקשיב
      this.speechRecognition.interimResults = true; // לקבל תוצאות ביניים
      this.speechRecognition.maxAlternatives = 3; // מספר אפשרויות זיהוי
      
      // טיפול בתוצאות
      this.speechRecognition.onresult = (event) => {
        if (!event || !event.results) {
          return;
        }
        
        let interimTranscript = '';
        let finalTranscript = '';
        let confidence = 0;
        
        try {
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            const result = event.results[i];
            if (!result) continue;
            
            if (result.isFinal) {
              finalTranscript += result[0].transcript;
              confidence = result[0].confidence;
            } else {
              interimTranscript += result[0].transcript;
            }
          }
          
          if (onResult) {
            onResult({
              finalTranscript,
              interimTranscript,
              confidence
            });
          }
        } catch (resultError) {
          console.error("Error processing recognition results:", resultError);
        }
      };
      
      // טיפול בשגיאות
      this.speechRecognition.onerror = (event) => {
        console.warn("Recognition error:", event.error);
        
        // נסה שוב עם שפה אחרת אם מתקבלת שגיאה
        if (event.error === 'language-not-supported' || event.error === 'not-allowed') {
          this.retryWithDifferentLanguage(onResult, onError, isOneTime);
          return;
        }
        
        if (onError) onError({ 
          code: event.error, 
          message: this.getErrorMessage(event.error) 
        });
        
        // התאוששות אוטומטית במצב רציף
        if (!isOneTime && this.retryCount < this.maxRetries) {
          this.retryCount++;
          this.recoveryTimer = setTimeout(() => {
            console.log(`Attempting to restart recognition (retry ${this.retryCount}/${this.maxRetries})`);
            this.startRecognition(onResult, onError, isOneTime);
          }, 1000);
        } else {
          this.retryCount = 0;
        }
      };
      
      // טיפול בסיום
      this.speechRecognition.onend = () => {
        // ניסיון להפעיל שוב אם צריך במצב רציף
        if (!isOneTime) {
          try {
            this.speechRecognition.start();
          } catch (restartError) {
            console.warn("Error restarting continuous recognition:", restartError);
            
            // אם נכשל, ננסה שוב באמצעות טיימר
            if (this.retryCount < this.maxRetries) {
              this.retryCount++;
              this.recoveryTimer = setTimeout(() => {
                this.startRecognition(onResult, onError, isOneTime);
              }, 1000);
            } else {
              this.retryCount = 0;
              if (onError) onError({ 
                code: 'restart-failed', 
                message: "לא ניתן להפעיל מחדש את זיהוי הדיבור" 
              });
            }
          }
        }
      };
      
      // התחלת ההאזנה
      this.speechRecognition.start();
      this.retryCount = 0; // איפוס מונה הניסיונות החוזרים
      return true;
      
    } catch (error) {
      console.error("Error starting speech recognition:", error);
      if (onError) onError({ 
        code: 'general-error', 
        message: "שגיאה בהפעלת זיהוי הדיבור: " + error.message 
      });
      return false;
    }
  }
  
  /**
   * ניסיון עם שפה אחרת אם נכשל זיהוי בעברית
   */
  retryWithDifferentLanguage(onResult, onError, isOneTime) {
    // אם כבר ניסינו עם עברית, ננסה עם אנגלית
    if (this.languageCode === 'he-IL') {
      console.log("Hebrew recognition failed, trying English");
      this.languageCode = this.fallbackLanguage;
    } else if (this.languageCode === this.fallbackLanguage) {
      // אם כבר ניסינו עם אנגלית, ננסה עם ערבית (השפה השנייה הרשמית בישראל)
      console.log("English recognition failed, trying Arabic");
      this.languageCode = 'ar-SA';
    } else {
      // אם כבר ניסינו עם כל השפות, נחזור לעברית
      console.log("All language recognition failed, going back to Hebrew");
      this.languageCode = 'he-IL';
    }
    
    // ניסיון חדש עם השפה החדשה
    setTimeout(() => {
      this.startRecognition(onResult, onError, isOneTime);
    }, 300);
  }
  
  /**
   * הודעות שגיאה ידידותיות למשתמש
   */
  getErrorMessage(errorCode) {
    const errorMessages = {
      'not-allowed': 'אין הרשאה לשימוש במיקרופון. נא לאשר גישה למיקרופון בהגדרות הדפדפן.',
      'not-supported': 'הדפדפן שלך לא תומך בזיהוי דיבור.',
      'network': 'בעיית רשת. נא לבדוק את חיבור האינטרנט שלך.',
      'no-speech': 'לא זיהיתי דיבור. אנא נסה לדבר חזק וברור יותר.',
      'audio-capture': 'לא נמצא מיקרופון. אנא וודא שהמיקרופון מחובר ופועל.',
      'aborted': 'ההקלטה הופסקה.',
      'language-not-supported': 'השפה שנבחרה אינה נתמכת, מנסה שפה אחרת.',
      'service-not-allowed': 'שירות זיהוי הדיבור לא מאושר על ידי הדפדפן.',
      'bad-grammar': 'בעיה במנוע זיהוי הדיבור.',
      'no-match': 'לא הצלחתי להבין מה אמרת. אנא נסה שוב.'
    };
    
    return errorMessages[errorCode] || `שגיאה בזיהוי דיבור: ${errorCode}`;
  }
  
  /**
   * התחלת האזנה רציפה
   */
  startContinuousListening(onResult, onError) {
    return this.startRecognition(onResult, onError, false);
  }
  
  /**
   * התחלת האזנה בודדת
   */
  startListening(onResult, onError) {
    return this.startRecognition(onResult, onError, true);
  }
  
  /**
   * הפסקת האזנה לדיבור
   */
  stopListening() {
    // ניקוי טיימרים להתאוששות
    if (this.recoveryTimer) {
      clearTimeout(this.recoveryTimer);
      this.recoveryTimer = null;
    }
    
    // עצירת זיהוי הדיבור
    if (this.speechRecognition) {
      try {
        this.speechRecognition.stop();
      } catch (error) {
        console.warn("Error stopping speech recognition:", error);
      }
      this.speechRecognition = null;
    }
    
    this.retryCount = 0;
  }
  
  /**
   * הפסקת האזנה רציפה (אותו דבר כמו stopListening)
   */
  stopContinuousListening() {
    this.stopListening();
  }
  
  /**
   * הקראת טקסט
   * @param {string} text - הטקסט להקראה
   * @param {Object} options - אפשרויות הקראה
   * @returns {Promise} - Promise שמסתיים כאשר ההקראה מסתיימת
   */
  speak(text, options = {}) {
    return new Promise((resolve, reject) => {
      if (!this.isSynthesisSupported) {
        console.error("הקראת טקסט אינה נתמכת בדפדפן זה");
        
        // שימוש באלטרנטיבה אם האפשרות ההעדפה לא נתמכת
        this.speakAlternative(text, options)
          .then(resolve)
          .catch(reject);
          
        return;
      }
      
      // עצירת הקראה קודמת אם קיימת
      this.stopSpeaking();
      
      try {
        // יצירת אובייקט הקראה חדש
        const utterance = new SpeechSynthesisUtterance(text);
        
        // הגדרת שפה עברית
        utterance.lang = 'he-IL';
        
        // בדיקה אם יש צורך לטעון מחדש את הקולות
        if ((!this.selectedVoice || this.voices.length === 0) && typeof speechSynthesis !== 'undefined') {
          this.voices = speechSynthesis.getVoices() || [];
          this.findBestFemaleVoice();
        }
        
        // שימוש בקול שנבחר
        if (this.selectedVoice) {
          utterance.voice = this.selectedVoice;
        }
        
        // הגדרת אפשרויות נוספות
        utterance.rate = options.rate || this.defaultVoiceRate;
        utterance.pitch = options.pitch || this.defaultVoicePitch;
        utterance.volume = options.volume || this.voiceVolume;
        
        // האזנה לסיום ההקראה
        utterance.onend = () => {
          this.isSpeaking = false;
          if (options.onEnd) options.onEnd();
          resolve();
        };
        
        utterance.onerror = (error) => {
          console.error("Speech synthesis error:", error);
          this.isSpeaking = false;
          
          // אם יש שגיאה, ננסה שיטה חליפית
          this.speakAlternative(text, options)
            .then(resolve)
            .catch(() => {
              if (options.onError) options.onError(error);
              reject(error);
            });
        };
        
        // הפעלת ההקראה
        this.isSpeaking = true;
        window.speechSynthesis.speak(utterance);
        
        // תיקון לבעיה ידועה בכרום שבה הקראה ארוכה נעצרת
        if (text.length > 100) {
          this.fixChromeSpeechBug();
        }
      } catch (error) {
        console.error("Error in speech synthesis:", error);
        
        // ניסיון לשימוש באלטרנטיבה
        this.speakAlternative(text, options)
          .then(resolve)
          .catch(() => {
            if (options.onError) options.onError(error);
            reject(error);
          });
      }
    });
  }
  
  /**
   * אלטרנטיבה להקראת טקסט אם הדרך הראשית נכשלת
   * למשל, שימוש ב-audio API
   */
  speakAlternative(text, options = {}) {
    return new Promise((resolve, reject) => {
      // נסה להשתמש בשירות TTS חיצוני
      try {
        // יצירת אלמנט אודיו (אפשר להשתמש בשירות TTS חיצוני במוצר סופי)
        const audio = new Audio();
        audio.volume = options.volume || this.voiceVolume;
        
        // צור טקסט "ביפ" קצר כאינדיקציה
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);
        
        oscillator.type = 'sine';
        oscillator.frequency.value = 800; // הרץ
        gainNode.gain.value = 0.3; // עוצמה
        
        this.isSpeaking = true;
        
        // השמעת צליל קצר
        oscillator.start();
        
        setTimeout(() => {
          oscillator.stop();
          this.isSpeaking = false;
          if (options.onEnd) options.onEnd();
          resolve();
        }, 300); // 300 מילישניות
        
      } catch (error) {
        console.error("Alternative speech method failed:", error);
        if (options.onError) options.onError(error);
        reject(error);
      }
    });
  }
  
  /**
   * תיקון לבעיה ידועה בכרום שבה הקראה ארוכה נעצרת
   */
  fixChromeSpeechBug() {
    if (typeof speechSynthesis === 'undefined') return;
    
    const isChromeOrEdge = /Chrome|Edge/.test(navigator.userAgent);
    if (!isChromeOrEdge) return;
    
    // פתרון לבעיה שבה Chrome מפסיק לדבר אחרי 15 שניות
    // מבוסס על https://stackoverflow.com/questions/21947730/chrome-speech-synthesis-with-longer-texts
    
    window.speechSynthesis.pause();
    window.speechSynthesis.resume();
    
    const resumeTimer = setInterval(() => {
      if (!this.isSpeaking) {
        clearInterval(resumeTimer);
        return;
      }
      
      window.speechSynthesis.pause();
      window.speechSynthesis.resume();
    }, 10000);
  }
  
  /**
   * עצירת הקראה
   */
  stopSpeaking() {
    if (typeof speechSynthesis !== 'undefined') {
      try {
        if (this.isSpeaking || speechSynthesis.speaking) {
          speechSynthesis.cancel();
          this.isSpeaking = false;
        }
      } catch (error) {
        console.warn("Error stopping speech synthesis:", error);
      }
    }
  }
  
  /**
   * שינוי הגדרות הקול
   * @param {Object} settings - הגדרות הקול
   */
  changeVoiceSettings(settings) {
    if (settings.pitch !== undefined) {
      this.defaultVoicePitch = settings.pitch;
    }
    
    if (settings.rate !== undefined) {
      this.defaultVoiceRate = settings.rate;
    }
    
    if (settings.volume !== undefined) {
      this.voiceVolume = settings.volume;
    }
    
    // אם נדרשת החלפה לקול נשי או גברי
    if (settings.useFemaleVoice !== undefined) {
      this.useFemaleVoice = settings.useFemaleVoice;
      this.findBestFemaleVoice();
    }
    
    // אם יש קול ספציפי שנבחר
    if (settings.voiceName && this.voices) {
      const selectedVoice = this.voices.find(v => v.name === settings.voiceName);
      if (selectedVoice) {
        this.selectedVoice = selectedVoice;
      }
    }
    
    return {
      pitch: this.defaultVoicePitch,
      rate: this.defaultVoiceRate,
      volume: this.voiceVolume,
      selectedVoice: this.selectedVoice ? 
        `${this.selectedVoice.name} (${this.selectedVoice.lang})` : 
        'default'
    };
  }
  
  /**
   * בדיקה האם מתבצעת הקראה כרגע
   */
  isCurrentlySpeaking() {
    return this.isSpeaking;
  }
  
  /**
   * בדיקה האם הדפדפן תומך בזיהוי דיבור
   */
  isVoiceRecognitionSupported() {
    return this.isRecognitionSupported;
  }
  
  /**
   * בדיקה האם הדפדפן תומך בהקראת טקסט
   */
  isVoiceSynthesisSupported() {
    return this.isSynthesisSupported;
  }
  
  /**
   * קבלת רשימת הקולות הזמינים
   */
  getAvailableVoices() {
    // רענון רשימת הקולות
    if (typeof speechSynthesis !== 'undefined') {
      this.voices = speechSynthesis.getVoices() || [];
    }
    
    // סינון והמרה לפורמט פשוט
    return this.voices
      .filter(v => v && v.name)
      .map(v => ({
        name: v.name,
        lang: v.lang || 'unknown',
        isFemale: this.detectFemaleVoice(v.name)
      }));
  }
  
  /**
   * זיהוי אם קול הוא נשי לפי שמו
   */
  detectFemaleVoice(name) {
    if (!name) return false;
    
    const lowerName = name.toLowerCase();
    return lowerName.includes('female') || 
           lowerName.includes('woman') || 
           lowerName.includes('girl') ||
           lowerName.includes('ava') ||
           lowerName.includes('samantha') ||
           lowerName.includes('alice') ||
           lowerName.includes('victoria') ||
           lowerName.includes('karen') ||
           lowerName.includes('נשי') ||
           lowerName.includes('נקבה') ||
           lowerName.includes('אישה') ||
/**
 * החלק האחרון של VoiceService.js
 */

// המשך הפונקציה detectFemaleVoice:
name.includes('alice') ||
name.includes('victoria') ||
name.includes('karen') ||
name.includes('נשי') ||
name.includes('נקבה');
}

/**
 * קבלת שם קול בפורמט קריא לאדם
 */
getVoiceName(voice) {
  if (!voice) return 'ברירת מחדל';
  return `${voice.name} (${voice.lang})`;
}

/**
 * בדיקה אם הדפדפן יכול לשלוט בעוצמת השמע
 */
canControlVolume() {
  return 'AudioContext' in window || 'webkitAudioContext' in window;
}

/**
 * בדיקה אם הדפדפן יכול להשמיע צליל בכלל
 */
canPlayAudio() {
  try {
    const audio = new Audio();
    return (audio && typeof audio.play === 'function');
  } catch (error) {
    console.warn("Browser can't create Audio element:", error);
    return false;
  }
}

/**
 * מונע את הבעיה של הקראה חוזרת אם המשתמש לחץ על כפתור פעמיים
 */
preventDoubleSpeak(text, options = {}) {
  // אם כבר מקריא, בטל את ההקראה הקודמת
  if (this.isSpeaking) {
    this.stopSpeaking();
    
    // המתן רגע קצר לפני התחלת הקראה חדשה
    setTimeout(() => {
      this.speak(text, options);
    }, 100);
    
    return;
  }
  
  // אחרת, התחל הקראה כרגיל
  this.speak(text, options);
}

/**
 * הכנת הפונקציונליות של זיהוי הדיבור
 */
prepareRecognition() {
  // בדיקה אם כבר הוכן
  if (this.isInitialized) return true;
  
  if (!this.isRecognitionSupported) {
    console.warn("Speech recognition is not supported in this browser");
    return false;
  }
  
  try {
    // ניסיון להפעיל זיהוי דיבור לרגע קצר
    const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition;
    const testRecognition = new SpeechRecognition();
    testRecognition.lang = this.languageCode;
    
    // זה יכול להיכשל אם אין הרשאות מיקרופון
    testRecognition.start();
    setTimeout(() => {
      try {
        testRecognition.stop();
        this.isInitialized = true;
      } catch (err) {}
    }, 100);
    
    return true;
  } catch (error) {
    console.warn("Error preparing speech recognition:", error);
    return false;
  }
}

/**
 * בדיקה אם מערכת זיהוי הדיבור אותחלה
 */
isRecognitionInitialized() {
  return this.isInitialized;
}

/**
 * קבלת השפה הנוכחית לזיהוי דיבור
 */
getCurrentLanguage() {
  return this.languageCode;
}

/**
 * החלפת שפת זיהוי דיבור
 */
setRecognitionLanguage(languageCode) {
  // בדיקת תקינות קוד שפה
  if (!languageCode || typeof languageCode !== 'string' || languageCode.length < 2) {
    console.warn("Invalid language code:", languageCode);
    return false;
  }
  
  this.languageCode = languageCode;
  console.log(`Recognition language set to: ${languageCode}`);
  return true;
}

/**
 * החלפת שפת הקראה
 */
setSpeechLanguage(languageCode) {
  // בדיקת תקינות קוד שפה
  if (!languageCode || typeof languageCode !== 'string' || languageCode.length < 2) {
    console.warn("Invalid language code:", languageCode);
    return false;
  }
  
  // מציאת קול חדש בשפה הנבחרת
  const voiceInLanguage = this.voices.find(v => v.lang && v.lang.includes(languageCode.substring(0, 2)));
  
  if (voiceInLanguage) {
    this.selectedVoice = voiceInLanguage;
    console.log(`Speech language set to: ${languageCode} with voice: ${voiceInLanguage.name}`);
    return true;
  } else {
    console.warn(`No voice found for language: ${languageCode}`);
    return false;
  }
}

/**
 * קבלת נתונים על הקול הנוכחי
 */
getCurrentVoiceInfo() {
  return {
    name: this.selectedVoice ? this.selectedVoice.name : 'default',
    lang: this.selectedVoice ? this.selectedVoice.lang : 'unknown',
    isFemale: this.selectedVoice ? this.detectFemaleVoice(this.selectedVoice.name) : false,
    rate: this.defaultVoiceRate,
    pitch: this.defaultVoicePitch,
    volume: this.voiceVolume
  };
}

/**
 * החלפת קול לפי שם
 */
setVoiceByName(voiceName) {
  if (!this.voices || this.voices.length === 0) {
    this.voices = speechSynthesis.getVoices() || [];
  }
  
  const voice = this.voices.find(v => v.name === voiceName);
  
  if (voice) {
    this.selectedVoice = voice;
    console.log(`Voice set to: ${voice.name}`);
    return true;
  } else {
    console.warn(`Voice not found: ${voiceName}`);
    return false;
  }
}

/**
 * השהייה בדיבור (למשל בשביל פיסוק)
 */
async pause(milliseconds = 500) {
  return new Promise(resolve => setTimeout(resolve, milliseconds));
}

/**
 * הוספת אפשרות להקריא אות אחר אות (למצב למידה)
 */
async speakLetterByLetter(text, options = {}) {
  const letters = text.split('');
  const delay = options.delay || 300; // השהייה בין אותיות
  
  for (const letter of letters) {
    await this.speak(letter, options);
    await this.pause(delay);
  }
}

}

// יצוא ברירת המחדל של שירות הקול
export default new VoiceService();
