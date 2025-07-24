/**
 * שירות AI משופר לניהול השיחה עם המשתמש
 * תומך בשיחות טבעיות יותר ותגובות אינטליגנטיות
 */

class AIService {
  constructor() {
    // המפתח של ה-API מוגדר כאן (לעדכן למפתח אמיתי בסביבת ייצור)
    this.apiKey = "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";
    
    // היסטוריית השיחה - נשמר כדי לאפשר הקשר
    this.conversationHistory = [];
    
    // מעקב אחרי תשובות קודמות כדי למנוע חזרות
    this.lastResponses = [];
    
    // דגל המציין אם מדובר בהודעה ראשונה
    this.isFirstMessage = true;

    // מידע על המשתמש - נשמר כדי להתאים את התשובות
    this.userInfo = {
      name: "",
      role: "",
      lastSentiment: "neutral",
      emotionalState: "normal", // normal, stressed, worried, happy
      personalDetails: {}, // לשמירת פרטים אישיים שהמשתמש חולק
      topicsDiscussed: [],
      warningFlags: [],
      contactRecommended: false,
      sessionStartTime: new Date().toISOString()
    };
    
    console.log("🚀 AIService נטען!");
    
    // טעינת היסטוריה מקומית אם קיימת
    this.loadFromLocalStorage();
    
    // רשימת מילות מפתח למצבי מצוקה
    this.distressKeywords = {
      severe: [
        "אובדני", "להתאבד", "לא רוצה לחיות", "אין טעם בחיים", "עדיף למות",
        "אני רוצה למות", "לגמור עם הכל", "לשים קץ", "לפגוע בעצמי", "אין סיבה לחיות"
      ],
      moderate: [
        "דיכאון", "חרדה", "פוסט-טראומה", "פלאשבק", "הלם קרב", "לא יכול יותר", 
        "מצוקה", "מדוכא", "אין לי כוח", "לא מסוגל", "סיוטים", "טראומה", "חרדות"
      ],
      mild: [
        "עצוב", "לחוץ", "מתוח", "קשה לי", "עייף", "בודד", "לבד", "געגועים", 
        "מתגעגע", "לא נרדם", "מפחד", "חושש", "דואג", "מוטרד"
      ]
    };
    
    // רשימת רגשות וביטויים לזיהוי
    this.emotionKeywords = {
      happy: ["שמח", "מרוצה", "נהנה", "אוהב", "מצוין", "טוב", "נפלא", "נהדר", "מאושר", "מתרגש"],
      sad: ["עצוב", "מדוכא", "נעלב", "אכזבה", "אומלל", "לא טוב", "רע", "מדוכדך", "שבור"],
      angry: ["כועס", "זועם", "עצבני", "מתוסכל", "מתעצבן", "מעצבן", "נמאס לי", "מרגיז"],
      fearful: ["מפחד", "חושש", "חרד", "מודאג", "מבוהל", "דואג", "חרדה", "פאניקה"],
      surprised: ["מופתע", "המום", "לא מאמין", "וואו", "מדהים", "מזעזע", "לא ציפיתי"],
      disgusted: ["גועל", "דוחה", "מגעיל", "סלידה", "בחילה"],
      tired: ["עייף", "מותש", "תשוש", "אין כוח", "סחוט", "מותש", "צריך לישון"]
    };
    
    // מילות מפתח לנושאי שיחה
    this.topicKeywords = {
      family: ["משפחה", "אמא", "אבא", "אח", "אחות", "ילדים", "הורים", "בית", "אישה", "בעל", "חברה", "זוגיות"],
      military: ["צבא", "צה\"ל", "שירות", "מפקד", "קצין", "חייל", "חיילת", "מילואים", "מבצע", "קרבי", "יחידה", "בסיס"],
      relationships: ["זוגיות", "חברה", "חבר", "אהבה", "יחסים", "רומנטי", "דייט", "נישואין", "פרידה", "גירושין"],
      health: ["בריאות", "כואב", "רופא", "תרופה", "טיפול", "כאב", "חולה", "פציעה", "פרוצדורה", "ניתוח"],
      sleep: ["שינה", "ישן", "נרדם", "לישון", "ערני", "עייף", "מיטה", "להירדם", "נדודי שינה", "סיוטים"],
      career: ["עבודה", "קריירה", "לימודים", "תפקיד", "משרה", "השכלה", "אוניברסיטה", "הכשרה", "קידום"],
      mentalHealth: ["מתח", "לחץ", "חרדה", "דיכאון", "מצב רוח", "טיפול", "נפשי", "פסיכולוג", "קב\"ן", "מרגיש"]
    };

    // תבניות תגובה מגוונות לשיחה טבעית יותר
    this._initializeResponseTemplates();
  }
  /**
   * איתחול תבניות תשובה
   * מאפשר תשובות יותר מגוונות ומותאמות אישית
   */
  _initializeResponseTemplates() {
    this.responseTemplates = {
      greeting: [
        "היי! איך אתה מרגיש היום?",
        "שלום! מה שלומך היום?",
        "ברוך הבא חזרה! איך עובר עליך היום?",
        "נעים לראות אותך! איך אתה מרגיש?",
        "בוקר טוב/צהריים טובים/ערב טוב! איך מתחיל/עובר/מסתיים היום שלך?",
        "היי שם! איך הולך?"
      ],
      
      nameAcknowledgement: [
        "{name}, נעים להכיר אותך! איך אוכל לעזור היום?",
        "תודה ששיתפת, {name}! איך אתה מרגיש היום?",
        "נעים להכיר, {name}! ספר לי קצת על עצמך.",
        "{name}, שם יפה! איך אני יכולה לתמוך בך היום?",
        "שמחה להכיר אותך, {name}! מה מעסיק אותך לאחרונה?"
      ],
      
      positiveFeedback: [
        "אני שמחה לשמוע שאתה מרגיש טוב!",
        "זה נהדר לשמוע, {name}!",
        "איזה יופי! משמח לשמוע.",
        "זה ממש חדשות טובות!",
        "כיף לשמוע שאתה במצב רוח טוב!"
      ],
      
      negativeFeedback: [
        "אני מצטערת לשמוע שקשה לך. רוצה לספר לי יותר?",
        "זה נשמע לא פשוט, {name}. אני כאן בשבילך.",
        "קשה להתמודד עם תחושות כאלה. אתה רוצה לדבר על זה?",
        "אני מבינה שזה קשה. מה עוזר לך להתמודד בדרך כלל?",
        "תודה ששיתפת אותי בתחושות שלך. רוצה לספר לי מה גורם לך להרגיש כך?"
      ],
      
      neutralResponse: [
        "אני מבינה. איך אני יכולה לעזור לך היום?",
        "תודה ששיתפת. יש משהו ספציפי שהיית רוצה לדבר עליו?",
        "אוקיי, {name}. על מה היית רוצה להתייעץ היום?",
        "אני כאן בשבילך. על מה נדבר היום?",
        "הבנתי. איך אתה מרגיש עם זה?"
      ],
      
      askingMore: [
        "תוכל לספר לי עוד על זה?",
        "מעניין, אשמח לשמוע יותר.",
        "איך זה משפיע עליך ביום-יום?",
        "מה עוד קורה בהקשר הזה?",
        "{name}, תוכל להרחיב על הנקודה הזו?",
        "מה גורם לך להרגיש ככה?"
      ],
      
      support: [
        "אני כאן בשבילך, {name}.",
        "אתה לא לבד בהתמודדות הזו.",
        "אני מקשיבה ומבינה אותך.",
        "תודה שאתה משתף אותי, זה אומץ אמיתי.",
        "אני מעריכה את הכנות שלך."
      ],
      
      sleepIssues: [
        "שינה טובה חיונית לבריאות הנפשית והפיזית. הנה כמה טכניקות שיכולות לעזור:\n\n• שגרת לילה קבועה - לך לישון ותקום באותה שעה\n• הימנע ממסכים (טלפון, מחשב) לפחות שעה לפני השינה\n• תרגילי נשימה עמוקה יכולים לעזור להירגע\n• סביבה חשוכה ושקטה\n• הימנע מקפאין אחר הצהריים\n\nהאם ניסית חלק מהטיפים האלה?",
        
        "קשיי שינה נפוצים מאוד בקרב חיילים. {name}, אתה יכול לנסות:\n\n1. שגרת ערב קבועה\n2. כתיבת מחשבות מטרידות לפני השינה\n3. הפחתת קפאין ואלכוהול\n4. תרגילי נשימה והרפיה\n\nמה בדרך כלל עוזר לך להירדם?",
        
        "נדודי שינה יכולים להיות מתסכלים מאוד. כמה דברים שכדאי לנסות:\n\n• תרגול הרפיית שרירים הדרגתית מכף רגל ועד ראש\n• האזנה לקולות רקע מרגיעים\n• שתיית חליטת צמחים מרגיעה (קמומיל, לבנדר)\n• קריאה קלילה לפני השינה\n\nאיזה מהטיפים האלה נשמע לך הכי מתאים לנסות?"
      ],
      
      anxietyHelp: [
        "כשאתה מרגיש חרדה, אפשר לנסות את שיטת 5-4-3-2-1:\n• מצא 5 דברים שאתה רואה\n• 4 דברים שאתה יכול לגעת בהם\n• 3 דברים שאתה שומע\n• 2 דברים שאתה מריח\n• 1 דבר שאתה טועם\n\nזה יכול לעזור להחזיר אותך לרגע הנוכחי. האם תרצה לנסות את זה עכשיו?",
        
        "חרדה יכולה להיות מאוד מאתגרת, {name}. טכניקת נשימה פשוטה שיכולה לעזור היא 4-7-8:\n• שאיפה דרך האף לספירה של 4\n• עצירת הנשימה לספירה של 7\n• נשיפה איטית דרך הפה לספירה של 8\n• חזרה על התהליך 3-5 פעמים\n\nזה יכול לעזור להרגיע את מערכת העצבים שלך.",
        
        "כשאתה מרגיש חרדה, אפשר לנסות עיגון פיזי:\n• הרגש את הרגליים שלך על הרצפה\n• הישען על משטח מוצק כמו קיר או כיסא\n• החזק משהו קר (כמו קוביית קרח) או משהו בעל מרקם מיוחד\n\nאלו שיטות שעוזרות להחזיר את המיקוד לגוף ולרגע הנוכחי. מה עוזר לך להתמודד עם חרדה?"
      ],
      
      homesickness: [
        "געגועים לבית ולמשפחה הם חלק טבעי לגמרי מהשירות הצבאי, {name}. רבים מרגישים כך. האם אתה מצליח לשמור על קשר באופן קבוע עם המשפחה? לפעמים אפילו שיחה קצרה יכולה לעשות פלאים למצב הרוח.",
        
        "הגעגועים למשפחה ולחברים יכולים להיות קשים מאוד. משהו שעוזר לרבים הוא לשתף את החברים ליחידה בתחושות - סביר להניח שהם מרגישים בדיוק כמוך. האם יש לך חברים קרובים ביחידה שאתה יכול לדבר איתם?",
        
        "געגועים הם ביטוי לאהבה ולקשרים החזקים שיש לך, {name}. דרך טובה להתמודד היא ליצור 'פינת בית' קטנה אפילו בתנאים הצבאיים - תמונה, פריט אישי, או כל דבר שמזכיר לך את הבית. האם יש לך פריטים כאלה איתך?"
      ],
      
      followUp: [
        "איך עובר עליך היום, {name}?",
        "מה שלומך מאז שדיברנו לאחרונה?",
        "האם הדברים שדיברנו עליהם בשיחה הקודמת עזרו במשהו?",
        "איך הרגשת אחרי השיחה שלנו?",
        "אני שמחה לראות אותך שוב. איך היית מאז ששוחחנו?"
       ],
       distress: {
        severe: [
          "{name}, אני מודאגת ממה שאתה משתף איתי. אני רוצה שתדע שאתה לא לבד, ויש אנשים שאכפת להם ממך ויכולים לעזור. האם תסכים לדבר עם הקב\"ן או לפנות למוקד נט\"ל בטלפון 1-800-363-363 שפעיל 24/7?",
          
          "תודה ששיתפת אותי בתחושות הקשות שלך. זה מעיד על אומץ רב. אני חושבת שחשוב מאוד שתדבר עם איש מקצוע בהקדם. האם אתה מוכן לפנות לעזרה מקצועית? אני יכולה לעזור לך לחשוב איך לעשות את זה בצורה הנוחה ביותר עבורך.",
          
          "אני שומעת שאתה במצוקה עמוקה, ואני רוצה לעזור לך, {name}. במצבים כאלה, חשוב מאוד לדבר עם מישהו שיכול לספק תמיכה מקצועית. האם תסכים לפנות לקב\"ן או למפקד שלך כדי לקבל עזרה?"
        ],
        
        moderate: [
          "אני שומעת שאתה עובר תקופה מאתגרת, {name}. האם שקלת לדבר עם הקב\"ן או גורם מקצועי אחר? הם מיומנים בעזרה במצבים כאלו.",
          
          "תודה ששיתפת את התחושות האלה איתי. תחושות כאלה יכולות להיות מאוד מציפות. לפעמים, שיחה עם איש מקצוע יכולה לתת כלים נוספים להתמודדות. האם חשבת על אפשרות כזו?",
          
          "מה שאתה מתאר נשמע קשה להתמודדות לבד. האם יש לך מישהו קרוב - חבר, בן משפחה או איש מקצוע - שאתה יכול לשתף? לפעמים שיתוף יכול להקל משמעותית."
        ],
        
        mild: [
          "נשמע שאתה מתמודד עם לא מעט קשיים לאחרונה. האם יש משהו ספציפי שאני יכולה לעזור לך לחשוב עליו?",
          
          "תקופות של קושי הן חלק מהחיים, אבל זה לא אומר שצריך להתמודד לבד. מה עוזר לך להרגיש טוב יותר בדרך כלל?",
          
          "אני מבינה שזה לא קל עכשיו. האם יש מישהו שאתה יכול לדבר איתו על התחושות האלה? לפעמים שיתוף עם אדם קרוב יכול להקל משמעותית."
        ]
      }
    };
    
    // תבניות תשובה לפי נושא
    this.topicResponses = {
      military: [
        "השירות הצבאי יכול להיות מאתגר ומתגמל כאחד. איך אתה מתמודד עם האתגרים של השירות?",
        "החוויה הצבאית שונה עבור כל אחד. האם יש משהו ספציפי בשירות שלך שאתה מתמודד איתו עכשיו?",
        "יחסים עם מפקדים וחברים ליחידה יכולים להשפיע מאוד על חווית השירות. איך היחסים שלך עם האנשים ביחידה?"
      ],
      
      family: [
        "המשפחה היא עוגן חשוב, במיוחד בתקופות מאתגרות. כמה פעמים אתה מצליח להיות בקשר עם המשפחה?",
        "הקשר עם המשפחה יכול להיות מקור לתמיכה ולפעמים גם למתח. איך המשפחה שלך מתייחסת לשירות שלך?",
        "געגועים למשפחה הם טבעיים לגמרי. האם מצאת דרכים לשמור על קשר משמעותי למרות המרחק?"
      ],
      
      relationships: [
        "מערכות יחסים בזמן השירות הצבאי יכולות להיות מורכבות. האם יש לך מערכת יחסים עכשיו? איך אתם מתמודדים עם השירות?",
        "לשמר קשר זוגי במהלך השירות דורש מאמץ מיוחד. מה עוזר לכם לשמור על הקשר?",
        "לפעמים האתגרים של השירות יכולים להשפיע על היחסים. האם השירות משפיע על הקשרים האישיים שלך?"
      ],
      
      health: [
        "בריאות פיזית משפיעה מאוד על המצב הנפשי. איך אתה שומר על הבריאות שלך במהלך השירות?",
        "כאבים או פציעות יכולים להשפיע מאוד על החוויה הצבאית. האם יש לך גישה לטיפול רפואי כשאתה צריך?",
        "שמירה על אורח חיים בריא בצבא יכולה להיות אתגר. האם אתה מצליח לשמור על תזונה נכונה ופעילות גופנית?"
      ],
      
      sleep: [
        "שינה טובה היא אחד הדברים החשובים ביותר לבריאות הנפשית והפיזית. האם אתה מצליח לישון מספיק?",
        "קשיי שינה נפוצים מאוד במהלך השירות הצבאי. האם יש משהו ספציפי שמפריע לך לישון?",
        "סדר יום לא קבוע יכול להשפיע מאוד על איכות השינה. האם יש לך שגרת לילה כלשהי שעוזרת לך להירדם?"
      ],
      
      mentalHealth: [
        "לחץ ומתח הם חלק בלתי נפרד מהשירות הצבאי. מה עוזר לך להתמודד עם המתח?",
        "שמירה על בריאות נפשית חשובה לא פחות מבריאות פיזית. האם אתה עושה דברים שעוזרים לך לשמור על איזון נפשי?",
        "לפעמים קשה לשים לב לשינויים במצב הרוח. האם שמת לב לשינויים במצב הרוח שלך לאחרונה?"
      ]
    };
    
    // הודעות פתיחה מגוונות
    this.introductionResponses = [
      "היי! אני חיילתAI. בוא נתחיל בשיחה קצרה להכיר אותך 😊 איך אתה מרגיש היום?",
      "ברוך הבא! אני כאן כדי לתמוך בך. אשמח להכיר אותך טוב יותר. איך קוראים לך?",
      "שלום! נעים להכיר. אני חיילתAI, האסיסטנטית הדיגיטלית שתלווה אותך. איך עובר עליך היום?",
      "היי שם! חיילתAI לשירותך. אני כאן כדי להקשיב, לתמוך ולעזור. איך אתה מרגיש היום?",
      "ברוכים הבאים לחיילתAI! אני אסיסטנטית דיגיטלית שנועדה לתמוך בך במהלך השירות. נעים להכיר, איך אפשר לקרוא לך?"
    ];

    // שאלות לשם המשתמש
    this.nameAskingResponses = [
      "אשמח להכיר אותך טוב יותר. איך קוראים לך?",
      "עוד לא יצא לי לשמוע את השם שלך. איך אתה מעדיף שאקרא לך?",
      "לפני שנמשיך בשיחה, איך תרצה שאפנה אליך?",
      "אני מרגישה שהשיחה שלנו תהיה יותר אישית אם אדע את שמך. איך קוראים לך?",
      "אני חושבת שהגיע הזמן שאכיר אותך בשמך. איך אוכל לקרוא לך?"
    ];

    // ברכות שלום
    this.greetingResponses = [
      "היי! איך אתה מרגיש היום?",
      "שלום! מה שלומך היום?",
      "ברוך הבא חזרה! איך עובר עליך היום?",
      "נעים לראות אותך שוב! איך מתחיל היום שלך?",
      "שלום שלום! מה חדש אצלך?",
      "היי שם! איך הולך היום?"
    ];
  }
  
  /**
   * טעינת היסטוריה מקומית
   */
  loadFromLocalStorage() {
    try {
      // נסה לטעון מידע על המשתמש
      const savedUserInfo = localStorage.getItem("userInfo");
      if (savedUserInfo) {
        this.userInfo = { ...this.userInfo, ...JSON.parse(savedUserInfo) };
        console.log("✅ טעינת מידע משתמש מ-localStorage:", this.userInfo);
      }
      
      // נסה לטעון היסטוריית שיחה
      const savedHistory = localStorage.getItem("conversationHistory");
      if (savedHistory) {
        this.conversationHistory = JSON.parse(savedHistory);
        console.log(`✅ טעינת היסטוריית שיחה מ-localStorage: ${this.conversationHistory.length} הודעות`);
        
        // מסמן שהשיחה כבר התחילה אם יש היסטוריה
        if (this.conversationHistory.length > 0) {
          this.isFirstMessage = false;
        }
      } else {
        console.log("⚠️ לא נמצאה היסטוריית שיחה ב-localStorage");
      }
    } catch (error) {
      console.warn("❌ שגיאה בטעינה מ-localStorage:", error);
    }
  }
  /**
   * שמירת מידע בלוקל סטורג'
   */
  saveToLocalStorage() {
    try {
      localStorage.setItem("userInfo", JSON.stringify(this.userInfo));
      localStorage.setItem("conversationHistory", JSON.stringify(this.conversationHistory));
      console.log("✅ מידע נשמר ב-localStorage");
    } catch (error) {
      console.warn("❌ שגיאה בשמירה ל-localStorage:", error);
    }
  }

  /**
   * מאתחל את השיחה עם מידע התחלתי
   */
  initializeChat(userName = "", role = "חייל סדיר", sentiment = "neutral") {
    console.log("🔄 מאתחל שיחה חדשה עם:", { userName, role, sentiment });
    
    // בוחר הודעת פתיחה אקראית
    const introMessage = this.introductionResponses[Math.floor(Math.random() * this.introductionResponses.length)];
    
    this.conversationHistory = [
      {
        role: "system",
        content: this.getSystemPrompt(userName, role, sentiment)
      },
      {
        role: "assistant",
        content: introMessage
      }
    ];
    
    this.userInfo = {
      name: userName,
      role: role,
      lastSentiment: sentiment,
      emotionalState: "normal",
      personalDetails: {},
      topicsDiscussed: [],
      warningFlags: [],
      contactRecommended: false,
      sessionStartTime: new Date().toISOString()
    };
    
    // איפוס דגלים
    this.isFirstMessage = true;
    this.lastResponses = [];
    
    // שמירת מידע התחלתי
    this.saveToLocalStorage();
    
    return this.conversationHistory[1].content;
  }

  /**
   * מעדכן את המידע על המשתמש
   */
  updateUserInfo(info = {}) {
    console.log("🔄 מעדכן מידע משתמש:", info);
    this.userInfo = { ...this.userInfo, ...info };
    
    // שמירת המידע המעודכן
    this.saveToLocalStorage();
    
    // בדיקה אם צריך להמליץ על פנייה לעזרה מקצועית
    this.checkIfProfessionalHelpNeeded();
    
    return this.userInfo;
  }

  /**
   * מייצר את הפרומפט הראשוני למערכת ה-AI
   */
  getSystemPrompt(userName, role, sentiment) {
    return `
    אתה חיילתAI - מערכת תמיכה נפשית לחיילים בצה"ל (צבא ההגנה לישראל). 
    אתה מדבר בעברית בלבד ומשתמש בשפה ידידותית, אמפתית וברורה.
    ${userName ? `שם המשתמש הוא ${userName}.` : ""}
    ${role ? `הוא ${role}.` : ""}

    מטרתך:
    1. להקשיב לחיילים ולספק תמיכה רגשית ראשונית
    2. לזהות סימני מצוקה נפשית ולהציע עזרה
    3. לעודד שיחה פתוחה על קשיים וחוויות
    4. להציע אסטרטגיות התמודדות פרקטיות ומותאמות אישית
    5. להפנות לעזרה מקצועית (קב"ן) במקרה הצורך

    הנחיות חשובות לשיחה טבעית:
    - עליך לדבר כמו אדם אמיתי, עם אמפתיה וחום, ולא כמו בוט
    - מדבר בעברית פשוטה וטבעית, בגוף שני
    - מגיב באופן ספציפי לתוכן שהמשתמש שיתף, תוך שימוש בפרטים מהשיחה
    - משתמש בשם המשתמש באופן טבעי מדי פעם (אם ידוע)
    - מציג סקרנות, שואל שאלות פתוחות ומעמיקות
    - נותן מרחב לשיתוף רגשות ומחשבות
    - מציע פתרונות מעשיים ואסטרטגיות התמודדות
    - נמנע מתשובות שחוקות או גנריות
    - אם המשתמש שואל שאלה, עונה באופן ישיר ואחר כך מעמיק
    - משתמש במשפטים קצרים וברורים, והימנע ממשפטים מסורבלים
    - מציג ערנות והתעניינות אמיתית

    נושאים חשובים לשים לב:
    - שינה וערנות
    - חרדה, מתח ודרכי התמודדות
    - געגועים למשפחה וחברים
    - יחסים ביחידה ומול המפקדים
    - מוטיבציה ותחושת משמעות
    - התמודדות עם קשיים במהלך השירות
    - סימני מצוקה נפשית או תשישות קרב

    דרכי תגובה במצבי מצוקה:
    - מצוקה קלה: הקשבה אמפתית והצעת טכניקות להתמודדות
    - מצוקה בינונית: הקשבה, תמיכה וציון שקב"ן יכול לעזור
    - מצוקה חמורה (דיבור על פגיעה עצמית, אובדנות): עידוד מידי לפנייה לקב"ן/מפקד/נט"ל

    זכור תמיד שאתה לא איש מקצוע בתחום בריאות הנפש, אלא כלי תמיכה ראשוני.
    
    תמיד ענה בעברית, גם אם פונים אליך באנגלית או בשפה אחרת.
    `;
  }

  /**
   * ניתוח רגשות מתוך טקסט
   */
  analyzeSentiment(text) {
    const lowerText = text.toLowerCase();
    
    // בדיקה ומשקלות לרגשות שונים
    let emotionScores = {
      positive: 0,
      negative: 0,
      neutral: 0,
      anxious: 0,
      sad: 0,
      angry: 0
    };
    
    // בדיקת רגשות חיוביים
    for (const emotion of this.emotionKeywords.happy) {
      if (lowerText.includes(emotion)) {
        emotionScores.positive += 1;
      }
    }
    
    // בדיקת רגשות שליליים
    for (const emotion of this.emotionKeywords.sad) {
      if (lowerText.includes(emotion)) {
        emotionScores.negative += 1;
        emotionScores.sad += 1;
      }
    }
    
    for (const emotion of this.emotionKeywords.angry) {
      if (lowerText.includes(emotion)) {
        emotionScores.negative += 1;
        emotionScores.angry += 1;
      }
    }
    
    for (const emotion of this.emotionKeywords.fearful) {
      if (lowerText.includes(emotion)) {
        emotionScores.negative += 1;
        emotionScores.anxious += 1;
      }
    }
    // הוספת משקל למילים שליליות עם תחיליות שלילה
    const negativePatterns = [
      "לא טוב", "לא בסדר", "לא נעים", "לא נחמד", "לא מרגיש טוב",
      "אין לי חשק", "אין לי כוח", "אין לי מצב רוח", "קשה לי", "מתקשה"
    ];
    
    for (const pattern of negativePatterns) {
      if (lowerText.includes(pattern)) {
        emotionScores.negative += 1;
      }
    }
    
    // קביעת רגש דומיננטי
    let dominantEmotion = "neutral";
    let maxScore = 0;
    
    for (const [emotion, score] of Object.entries(emotionScores)) {
      if (score > maxScore && emotion !== "neutral") {
        maxScore = score;
        dominantEmotion = emotion;
      }
    }
    
    // אם אין רגש דומיננטי, השאר ניטרלי
    if (maxScore === 0) {
      dominantEmotion = "neutral";
    }
    
    // המרה לפורמט פשוט יותר לשימוש
    let sentiment = "neutral";
    if (emotionScores.positive > emotionScores.negative) {
      sentiment = "positive";
    } else if (emotionScores.negative > emotionScores.positive) {
      sentiment = "negative";
    }
    
    // שמירת הרגש האחרון
    this.userInfo.lastSentiment = sentiment;
    
    // עדכון מצב רגשי מורחב
    if (dominantEmotion === "anxious") {
      this.userInfo.emotionalState = "worried";
    } else if (dominantEmotion === "sad") {
      this.userInfo.emotionalState = "sad";
    } else if (dominantEmotion === "angry") {
      this.userInfo.emotionalState = "angry";
    } else if (dominantEmotion === "positive") {
      this.userInfo.emotionalState = "happy";
    } else {
      this.userInfo.emotionalState = "normal";
    }
    
    this.saveToLocalStorage();
    
    console.log("🔍 ניתוח רגשות:", { 
      sentiment, 
      dominantEmotion, 
      scores: emotionScores 
    });
    
    return {
      sentiment,
      dominantEmotion,
      emotionScores
    };
  }
  
  /**
   * ניתוח נושאי שיחה מתוך טקסט
   */
  analyzeTopics(text) {
    const lowerText = text.toLowerCase();
    const detectedTopics = [];
    const topicScores = {};
    
    // בדיקת כל נושא וחישוב ציון רלוונטיות
    for (const [topic, keywords] of Object.entries(this.topicKeywords)) {
      let score = 0;
      let matchedKeywords = [];
      
      for (const keyword of keywords) {
        if (lowerText.includes(keyword)) {
          score += 1;
          matchedKeywords.push(keyword);
        }
      }
      
      if (score > 0) {
        detectedTopics.push(topic);
        topicScores[topic] = {
          score,
          matchedKeywords
        };
      }
    }
    
    // איתור נושא דומיננטי
    let dominantTopic = null;
    let highestScore = 0;
    
    for (const [topic, data] of Object.entries(topicScores)) {
      if (data.score > highestScore) {
        highestScore = data.score;
        dominantTopic = topic;
      }
    }
    
    // הוספת נושאים חדשים לרשימה
    if (detectedTopics.length > 0) {
      const uniqueTopics = [...new Set([...this.userInfo.topicsDiscussed, ...detectedTopics])];
      this.userInfo.topicsDiscussed = uniqueTopics;
      this.saveToLocalStorage();
      console.log("🔍 נושאים שזוהו:", detectedTopics, "נושא דומיננטי:", dominantTopic);
    }
    
    return {
      allTopics: detectedTopics,
      scores: topicScores,
      dominantTopic
    };
  }
  
  /**
   * ניתוח רמת מצוקה בטקסט
   */
  analyzeDistressLevel(text) {
    const lowerText = text.toLowerCase();
    let distressLevel = "none";
    let detectedKeywords = [];
    
    // בדיקת מילות מפתח למצבי מצוקה חמורים
    for (const keyword of this.distressKeywords.severe) {
      if (lowerText.includes(keyword)) {
        distressLevel = "severe";
        detectedKeywords.push(keyword);
      }
    }
    
    // אם לא נמצא חמור, בדוק בינוני
    if (distressLevel === "none") {
      for (const keyword of this.distressKeywords.moderate) {
        if (lowerText.includes(keyword)) {
          distressLevel = "moderate";
          detectedKeywords.push(keyword);
        }
      }
    }
    
    // אם לא נמצא בינוני, בדוק קל
    if (distressLevel === "none") {
      for (const keyword of this.distressKeywords.mild) {
        if (lowerText.includes(keyword)) {
          distressLevel = "mild";
          detectedKeywords.push(keyword);
        }
      }
    }
    
    // הוספת דגלי אזהרה אם נמצאו
    if (distressLevel !== "none" && detectedKeywords.length > 0) {
      // הוספת דגל אזהרה חדש לרשימה
      const warningItem = {
        level: distressLevel,
        keywords: detectedKeywords,
        timestamp: new Date().toISOString(),
        messageText: text.substring(0, 100) + (text.length > 100 ? "..." : "")
      };
      
      this.userInfo.warningFlags.push(warningItem);
      this.saveToLocalStorage();
      
      // עדכון אם יש צורך להמליץ על יצירת קשר עם גורם מקצועי
      if (distressLevel === "severe" || 
          (distressLevel === "moderate" && this.userInfo.warningFlags.length > 2)) {
        this.userInfo.contactRecommended = true;
      }
      
      console.log("⚠️ זוהתה רמת מצוקה:", { distressLevel, detectedKeywords });
    }
    
    return { level: distressLevel, keywords: detectedKeywords };
  }
  
  /**
   * חילוץ פרטים אישיים מהודעת המשתמש
   */
  extractPersonalDetails(message) {
    const details = {};
    const patterns = {
      age: {
        regex: /(?:אני בן|גיל שלי|בן)[ ]?(\d{1,2})[ ]?(?:שנים|שנה)?/i,
        field: "age"
      },
      role: {
        regex: /(?:אני|משרת כ|תפקיד שלי)[ ]?(?:חייל ב|חייל|לוחם ב|לוחם|משרת ב?)[ ]?([א-ת\s]{2,25})/i,
        field: "role" 
      },
      hometown: {
        regex: /(?:אני מ|גר ב|מ|מתגורר ב)[ ]?([א-ת\s]{2,20})/i,
        field: "hometown"
      }
    };

    // נסה למצוא פרטים לפי תבניות
    for (const [key, patternData] of Object.entries(patterns)) {
      const match = message.match(patternData.regex);
      if (match && match[1]) {
        details[patternData.field] = match[1].trim();
      }
    }

    // אם מצאנו פרטים, עדכן את המידע על המשתמש
    if (Object.keys(details).length > 0) {
      this.userInfo.personalDetails = { 
        ...this.userInfo.personalDetails, 
        ...details 
      };
      this.saveToLocalStorage();
      console.log("👤 נמצאו פרטים אישיים:", details);
    }

    return details;
  }
  /**
   * חילוץ שם המשתמש (אם אפשר)
   */
  extractUserName(message) {
    // אם כבר יש לנו שם, אין צורך להמשיך
    if (this.userInfo.name) return null;

    // רשימת ביטויים שיש להתעלם מהם (לא להתייחס אליהם כשמות)
    const ignoreExpressions = [
      "בסדר", "טוב", "מצוין", "ככה ככה", 
      "נחמד", "עייף", "שמח", "מעולה", 
      "אני בסדר", "אני טוב", "אני מצוין",
      "בסדר גמור", "סבבה", "נהדר", "אחלה", "פצצה",
      "לא", "כן", "אולי", "מה", "איך", "למה", "מתי", "איפה"
    ];

    // בדיקה אם ההודעה תואמת לביטויים שיש להתעלם מהם
    const lowerMessage = message.toLowerCase().trim();
    for (const expr of ignoreExpressions) {
      if (lowerMessage === expr.toLowerCase() || 
          lowerMessage.startsWith(expr.toLowerCase() + " ") ||
          lowerMessage === "אני " + expr.toLowerCase()) {
        console.log("⚠️ זוהה ביטוי שאינו שם:", lowerMessage);
        return null;
      }
    }

    // חיפוש דפוסים נפוצים לציון שם בעברית
    const patterns = [
      /(?:^|\s)שמי\s+([א-ת]{2,20})(?:\s|$)/i,
      /(?:^|\s)קוראים\s+לי\s+([א-ת]{2,20})(?:\s|$)/i,
      /(?:^|\s)השם\s+שלי\s+(?:הוא\s+)?([א-ת]{2,20})(?:\s|$)/i,
      /(?:^|\s)תקרא\s+לי\s+([א-ת]{2,20})(?:\s|$)/i
    ];

    for (const pattern of patterns) {
      const match = message.match(pattern);
      if (match && match[1]) {
        const extractedName = match[1].trim();
        console.log("👤 זוהה שם משתמש:", extractedName);
        return extractedName;
      }
    }

    // בדיקה מיוחדת למקרים של "אני [שם]"
    // מוודא שזה לא "אני בסדר" או ביטויים דומים
    const nameAfterAni = message.match(/(?:^|\s)אני\s+([א-ת]{2,20})(?:\s|$)/i);
    if (nameAfterAni && nameAfterAni[1]) {
      const possibleName = nameAfterAni[1].trim();
      
      // בדיקה שזה לא ביטוי רגשי או תיאור מצב
      if (!ignoreExpressions.some(expr => 
          expr.toLowerCase() === possibleName.toLowerCase())) {
        console.log("👤 זוהה שם אפשרי אחרי 'אני':", possibleName);
        return possibleName;
      }
    }

    // אם לא זוהה שם בפורמטים הרגילים, בדיקה של מילה בודדת שעשויה להיות שם
    if (message.trim().split(/\s+/).length === 1 && message.length > 1 && message.length < 20) {
      // בדיקה אם המילה הבודדת מכילה רק אותיות עבריות
      if (/^[א-ת]+$/.test(message.trim())) {
        const possibleName = message.trim();
        
        // בדיקה שזה לא ביטוי רגשי או תיאור מצב
        if (!ignoreExpressions.some(expr => 
            expr.toLowerCase() === possibleName.toLowerCase())) {
          console.log("👤 זוהה שם אפשרי משורה בודדת:", possibleName);
          return possibleName;
        }
      }
    }

    return null;
  }
  
  /**
   * התאמת תשובה לפי הנושא ומאפייני השיחה
   */
  getPersonalizedResponse(userMessage, sentiment, topics, distressLevel) {
    // אם זוהתה מצוקה ברמה חמורה, השתמש בתבנית מצוקה חמורה
    if (distressLevel && distressLevel.level === "severe") {
      const distressResponses = this.responseTemplates.distress.severe;
      return this.getUniqueResponse(distressResponses);
    }
    
    // אם זוהתה מצוקה ברמה בינונית, השתמש בתבנית מצוקה בינונית
    if (distressLevel && distressLevel.level === "moderate") {
      const distressResponses = this.responseTemplates.distress.moderate;
      return this.getUniqueResponse(distressResponses);
    }
    
    // אם זוהתה מצוקה ברמה קלה, השתמש בתבנית מצוקה קלה
    if (distressLevel && distressLevel.level === "mild") {
      const distressResponses = this.responseTemplates.distress.mild;
      return this.getUniqueResponse(distressResponses);
    }
    
    // בדיקת נושאים ספציפיים
    if (topics && topics.dominantTopic) {
      // אם יש נושא דומיננטי, בחר תשובה מותאמת אליו
      const topicResponses = this.topicResponses[topics.dominantTopic];
      
      if (topicResponses) {
        return this.getUniqueResponse(topicResponses);
      }
    }
    
    // זיהוי דפוסי שיחה ספציפיים
    const lowerText = userMessage.toLowerCase();
    
    // בעיות שינה
    if (lowerText.includes("לא ישן") || lowerText.includes("שינה") || lowerText.includes("עייף") || lowerText.includes("להירדם")) {
      return this.getUniqueResponse(this.responseTemplates.sleepIssues);
    }
    
    // חרדה ומתח
    if (lowerText.includes("לחץ") || lowerText.includes("מתח") || lowerText.includes("חרדה") || lowerText.includes("מלחיץ")) {
      return this.getUniqueResponse(this.responseTemplates.anxietyHelp);
    }
    
    // געגועים לבית
    if (lowerText.includes("בית") || lowerText.includes("משפחה") || lowerText.includes("מתגעגע") || lowerText.includes("געגוע")) {
      return this.getUniqueResponse(this.responseTemplates.homesickness);
    }
    
    // לפי סנטימנט
    if (sentiment.sentiment === "positive") {
      return this.getUniqueResponse(this.responseTemplates.positiveFeedback);
    } else if (sentiment.sentiment === "negative") {
      return this.getUniqueResponse(this.responseTemplates.negativeFeedback);
    } else {
      // ברירת מחדל - ניטרלי או לא מזוהה
      return this.getUniqueResponse(this.responseTemplates.neutralResponse);
    }
  }
  /**
   * בחירת תשובה שלא חוזרת על עצמה
   * @param {Array} responseArray - מערך של אפשרויות תשובה
   * @returns {string} תשובה נבחרת
   */
  getUniqueResponse(responseArray) {
    if (!responseArray || responseArray.length === 0) {
      return "אני מבינה. איך אני יכולה לעזור לך היום?";
    }
    
    // מסנן תשובות שכבר השתמשנו בהן לאחרונה
    const availableResponses = responseArray.filter(r => !this.lastResponses.includes(r));
    
    // אם אין תשובות זמינות, מאפס את הרשימה
    if (availableResponses.length === 0) {
      this.lastResponses = [];
      return responseArray[Math.floor(Math.random() * responseArray.length)];
    }
    
    // בוחר תשובה אקראית מהתשובות הזמינות
    const response = availableResponses[Math.floor(Math.random() * availableResponses.length)];
    
    // שומר את התשובה ברשימת התשובות האחרונות (מקסימום 3)
    this.lastResponses.push(response);
    if (this.lastResponses.length > 3) {
      this.lastResponses.shift();
    }
    
    // החלפת פלייסהולדרים בתשובה
    return this.replacePlaceholders(response);
  }
  
  /**
   * החלפת פלייסהולדרים בתשובה
   * @param {string} text - טקסט עם פלייסהולדרים
   * @returns {string} טקסט עם ערכים אמיתיים
   */
  replacePlaceholders(text) {
    // החלפת {name} בשם המשתמש
    if (this.userInfo.name) {
      text = text.replace(/\{name\}/g, this.userInfo.name);
    } else {
      text = text.replace(/\{name\}, /g, "");
      text = text.replace(/\{name\}/g, "");
    }
    
    // כאן אפשר להוסיף החלפות נוספות לפי הצורך
    
    return text;
  }
  
  /**
   * בדיקה אם יש צורך להמליץ על פנייה לעזרה מקצועית
   */
  checkIfProfessionalHelpNeeded() {
    // בדיקת מספר דגלי אזהרה
    const severeWarnings = this.userInfo.warningFlags.filter(flag => flag.level === "severe").length;
    const moderateWarnings = this.userInfo.warningFlags.filter(flag => flag.level === "moderate").length;
    
    if (severeWarnings > 0 || moderateWarnings >= 3) {
      this.userInfo.contactRecommended = true;
      console.log("⚠️ מומלץ על פנייה לעזרה מקצועית");
    }
    
    return this.userInfo.contactRecommended;
  }
  
  /**
   * שינוי וגיוון בתשובות על פי מספר ההודעות בשיחה
   * @param {string} response - התשובה הראשונית
   * @returns {string} התשובה המותאמת למיקום בשיחה
   */
  adaptResponseToConversationFlow(response) {
    const userMessages = this.conversationHistory.filter(msg => msg.role === "user").length;
    
    // הוספת שאלה בסוף התשובה אם מוקדם בשיחה
    if (userMessages < 3 && !response.includes("?")) {
      const followUpQuestions = [
        "איך זה גורם לך להרגיש?",
        "איך אתה מתמודד עם זה?",
        "האם תוכל לספר לי עוד?",
        "מה אתה חושב על זה?",
        "איך זה משפיע עליך ביום-יום?"
      ];
      
      response += " " + followUpQuestions[Math.floor(Math.random() * followUpQuestions.length)];
    }
    
    // בשיחה ארוכה - הוספת התייחסות להיסטוריה
    if (userMessages > 5 && Math.random() < 0.3) {
      const continuityPhrases = [
        "בהמשך למה שדיברנו קודם, ",
        "אני זוכרת שסיפרת לי על כך ש",
        "אם אני מקשרת לשיחה שלנו, ",
        "כפי שהזכרת קודם, "
      ];
      
      response = continuityPhrases[Math.floor(Math.random() * continuityPhrases.length)] + response.toLowerCase();
    }
    
    return response;
  }

  /**
   * בדיקה אם ההודעה היא תשובה לשאלה אוטומטית ומתן תגובה מתאימה
   * @param {string} userMessage - הודעת המשתמש
   * @returns {string|null} תשובה מתאימה או null אם לא זוהתה תשובה לשאלה אוטומטית
   */
  checkAutoResponseToQuestion(userMessage) {
    // בדיקה אם ההודעה האחרונה של המערכת הייתה שאלה
    const lastAssistantMessage = this.conversationHistory
      .filter(msg => msg.role === "assistant")
      .pop();
    
    if (!lastAssistantMessage) return null;
    
    // בדיקה אם הייתה שאלה בהודעה האחרונה של המערכת
    const lastMessageHadQuestion = lastAssistantMessage.content.includes("?");
    if (!lastMessageHadQuestion) return null;
    
    const lowerMessage = userMessage.toLowerCase().trim();
    
    // בדיקת תשובות ספציפיות לשאלות נפוצות
    
    // תשובה לשאלה על שינה
    if (lastAssistantMessage.content.includes("האם ניסית חלק מהטיפים האלה?") ||
        lastAssistantMessage.content.includes("מה בדרך כלל עוזר לך להירדם?") ||
        lastAssistantMessage.content.includes("איזה מהטיפים האלה נשמע לך הכי מתאים לנסות?")) {
      
      if (lowerMessage.includes("כן") || lowerMessage.includes("ניסיתי") || lowerMessage.includes("עוזר לי")) {
        return "אני שמחה לשמוע שניסית. האם יש משהו ספציפי שעובד טוב במיוחד עבורך? אשמח לשמוע מה הניסיון שלך כדי שאוכל ללמוד ולעזור טוב יותר גם לאחרים.";
      } else if (lowerMessage.includes("לא") || lowerMessage.includes("לא ניסיתי")) {
        return "אני מבינה שלא תמיד קל ליישם טיפים כאלה, במיוחד בסביבה צבאית. אולי כדאי לנסות את הדברים הפשוטים קודם, כמו הפחתת קפאין אחר הצהריים והימנעות ממסכים לפני השינה. אפילו שינוי קטן יכול לעשות הבדל. תרצה לנסות אחד מהטיפים ולעדכן אותי בהמשך?";
      }
    }
    
    // תשובה לשאלה על חרדה
    if (lastAssistantMessage.content.includes("האם תרצה לנסות את זה עכשיו?") ||
        lastAssistantMessage.content.includes("מה עוזר לך להתמודד עם חרדה?")) {
      
      if (lowerMessage.includes("כן") || lowerMessage.includes("בטח") || lowerMessage.includes("אשמח")) {
        return "מעולה! אז בוא ננסה את תרגיל 5-4-3-2-1 יחד:\n\n1. ציין 5 דברים שאתה יכול לראות סביבך כרגע\n2. 4 דברים שאתה יכול לגעת בהם\n3. 3 דברים שאתה יכול לשמוע\n4. 2 דברים שאתה יכול להריח\n5. דבר אחד שאתה יכול לטעום\n\nאתה יכול פשוט לציין אותם לעצמך בשקט או לכתוב לי. איך אתה מרגיש אחרי התרגיל?";
      } else if (lowerMessage.includes("לא") || lowerMessage.includes("פעם אחרת")) {
        return "אין בעיה, אני מבינה. התרגילים האלה זמינים עבורך בכל עת שתרצה להשתמש בהם. האם יש שיטה אחרת שעוזרת לך להירגע כשאתה חש חרדה או מתח?";
      }
    }
    
    // תשובה לשאלה על געגועים למשפחה
    if (lastAssistantMessage.content.includes("האם אתה מצליח לשמור על קשר באופן קבוע עם המשפחה?") ||
        lastAssistantMessage.content.includes("האם יש לך חברים קרובים ביחידה שאתה יכול לדבר איתם?") ||
        lastAssistantMessage.content.includes("האם יש לך פריטים כאלה איתך?")) {
      
      if (lowerMessage.includes("כן") || lowerMessage.includes("יש לי") || lowerMessage.includes("מצליח")) {
        return "זה נהדר לשמוע! שמירה על קשרים חברתיים ומשפחתיים היא אחת האסטרטגיות החשובות ביותר להתמודדות עם לחצים. האם יש משהו נוסף שעוזר לך להתמודד עם הגעגועים?";
      } else if (lowerMessage.includes("לא") || lowerMessage.includes("קשה לי") || lowerMessage.includes("אין לי")) {
        return "אני מבינה כמה זה יכול להיות קשה. האם היית רוצה לחשוב יחד על דרכים לשפר את המצב? לפעמים אפילו קשר קצר אבל קבוע יכול לעשות הבדל משמעותי בתחושת הגעגוע.";
      }
    }
    
    // תשובה לשאלות על שירות צבאי
    if (lastAssistantMessage.content.includes("איך אתה מתמודד עם האתגרים של השירות?") ||
        lastAssistantMessage.content.includes("האם יש משהו ספציפי בשירות שלך שאתה מתמודד איתו עכשיו?") ||
        lastAssistantMessage.content.includes("איך היחסים שלך עם האנשים ביחידה?")) {
      
      // תשובה כללית שמעודדת המשך שיתוף
      return "תודה ששיתפת. השירות הצבאי יכול להיות מאתגר במיוחד. האם תרצה לספר לי יותר על הדברים שעוזרים לך להתמודד? לפעמים שיתוף החוויות האישיות יכול להקל.";
    }
    
    return null;
  }
  /**
   * שליחת בקשה ל-OpenAI API וקבלת תשובה
   */
  async fetchOpenAIResponse(userMessage) {
    console.log("🔄 שולח בקשה ל-OpenAI:", userMessage);
    
    try {
      if (!this.apiKey) {
        console.warn("⚠️ מפתח API של OpenAI לא הוגדר. עובר למצב מקומי.");
        return await this.getSmartMockResponse(userMessage);
      }
      
      // הכנת ההיסטוריה לשליחה ל-API
      const messages = [
        {
          role: "system",
          content: this.getSystemPrompt(this.userInfo.name, this.userInfo.role, this.userInfo.lastSentiment)
        }
      ];
      
      // הוספת ההיסטוריה הקודמת (מוגבל ל-10 הודעות אחרונות למניעת חריגה ממגבלות)
      const recentMessages = this.conversationHistory
        .slice(-10)
        .filter(msg => msg.role === "user" || msg.role === "assistant");
      
      messages.push(...recentMessages);
      
      // הוספת ההודעה הנוכחית
      messages.push({
        role: "user",
        content: userMessage
      });
      
      console.log("📤 שולח ל-OpenAI את ההיסטוריה והשאלה החדשה:", {
        messageCount: messages.length,
        systemPromptLength: messages[0].content.length,
        latestUserMessage: userMessage
      });
      
      // שליחת הבקשה ל-API
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: "gpt-3.5-turbo", // ניתן להחליף ל-gpt-4 לאיכות גבוהה יותר
          messages: messages,
          temperature: 0.7,
          max_tokens: 1000
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error("❌ OpenAI API Error:", errorData);
        throw new Error(`שגיאת API: ${errorData.error?.message || "שגיאה לא ידועה"}`);
      }
      
      const data = await response.json();
      
      if (data.choices && data.choices.length > 0 && data.choices[0].message) {
        console.log("✅ התקבלה תשובה מ-OpenAI:", { 
          content: data.choices[0].message.content.substring(0, 50) + "..." 
        });
        return data.choices[0].message.content;
      } else {
        console.error("❌ תשובה לא תקינה מה-API:", data);
        throw new Error("תשובה לא תקינה מה-API");
      }
    } catch (error) {
      console.error("❌ שגיאה בתקשורת עם OpenAI:", error);
      
      // במקרה של שגיאה, עבור למצב מקומי
      console.log("🔄 עובר למצב מקומי");
      return await this.getSmartMockResponse(userMessage);
    }
  }

  /**
   * תשובות חכמות לגיבוי במקרה שה-API נכשל
   */
  async getSmartMockResponse(userMessage) {
    console.log("🤖 מייצר תשובה מקומית למצב גיבוי");
    
    // השהיה מלאכותית לסימולציית תקשורת רשת
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // ניתוח ההודעה של המשתמש
    const sentiment = this.analyzeSentiment(userMessage);
    const topics = this.analyzeTopics(userMessage);
    const distressInfo = this.analyzeDistressLevel(userMessage);
    
    // חילוץ פרטים אישיים
    const personalDetails = this.extractPersonalDetails(userMessage);
    
    // בדיקה אם מדובר בהצגה של שם
    const extractedName = this.extractUserName(userMessage);
    if (extractedName && !this.userInfo.name) {
      this.userInfo.name = extractedName;
      this.saveToLocalStorage();
      
      const nameResponse = this.getUniqueResponse(this.responseTemplates.nameAcknowledgement);
      return nameResponse;
    }
    
    // בדיקה אם ההודעה היא תשובה לשאלה אוטומטית
    const autoResponse = this.checkAutoResponseToQuestion(userMessage);
    if (autoResponse) {
      console.log("🤖 זוהתה תשובה לשאלה אוטומטית, מחזיר תגובה מותאמת");
      return autoResponse;
    }
    
    // בדיקה אם מדובר בבקשה לפתיחת מצלמה
    const lowerMessage = userMessage.toLowerCase();
    if (lowerMessage.includes("מצלמה") || 
        lowerMessage.includes("וידאו") || 
        lowerMessage.includes("לראות אותך")) {
      return "האם תרצה לפתוח שיחת וידאו? אוכל לראות ולשמוע אותך ולתת תגובות קוליות. זה יכול להיות נחמד לשוחח פנים אל פנים.";
    }
    
    // בדיקה אם מדובר בברכת שלום פשוטה
    const greetings = ["שלום", "היי", "הלו", "בוקר טוב", "ערב טוב", "צהריים טובים", "מה נשמע", "מה קורה"];
    if (greetings.some(g => lowerMessage.includes(g)) && userMessage.length < 30) {
      const greetingResponse = this.getUniqueResponse(this.responseTemplates.greeting);
      return greetingResponse;
    }
    
    // קבלת תשובה מותאמת אישית
    let response = this.getPersonalizedResponse(userMessage, sentiment, topics, distressInfo);
    
    // התאמה נוספת לפי זרימת השיחה
    response = this.adaptResponseToConversationFlow(response);
    
    return response;
  }

  /**
   * מוסיף הודעת משתמש לשיחה ומקבל תשובה חכמה מה-AI
   */
  async sendMessage(userMessage) {
    console.log("📨 התקבלה הודעה חדשה מהמשתמש:", userMessage);
    
    // בדיקה מהירה למניעת הודעות ריקות
    if (!userMessage || userMessage.trim() === "") {
      return "אני לא בטוחה שהבנתי את ההודעה שלך. אשמח אם תשתף אותי במחשבות או שאלות שיש לך.";
    }
    
    // הוספת הודעת המשתמש להיסטוריה
    this.conversationHistory.push({
      role: "user",
      content: userMessage
    });
    
    // ניתוח טקסט
    const sentiment = this.analyzeSentiment(userMessage);
    const topics = this.analyzeTopics(userMessage);
    const distressInfo = this.analyzeDistressLevel(userMessage);
    
    // חילוץ פרטים אישיים
    this.extractPersonalDetails(userMessage);
    
    // בדיקה אם זו ההודעה הראשונה של המשתמש
    if (this.isFirstMessage) {
      this.isFirstMessage = false;
      console.log("🆕 זוהתה הודעה ראשונה בשיחה");
      
      // בדיקה אם ההודעה היא שם
      const extractedName = this.extractUserName(userMessage);
      if (extractedName) {
        this.userInfo.name = extractedName;
        this.saveToLocalStorage();
        
        const response = `שמחה להכיר אותך, ${extractedName}! איך אתה מרגיש היום? אשמח לדעת מה אתה עושה ביום-יום בצבא או במילואים.`;
        
        this.conversationHistory.push({
          role: "assistant",
          content: response
        });
        
        this.saveToLocalStorage();
        return response;
      }
    }
    
    // ניסיון לזהות שם בכל הודעה (לא רק הראשונה)
    if (!this.userInfo.name) {
      const extractedName = this.extractUserName(userMessage);
      if (extractedName) {
        this.userInfo.name = extractedName;
        this.saveToLocalStorage();
      }
    }
    
    // בדיקה אם ההודעה היא תשובה לשאלה אוטומטית
    const autoResponse = this.checkAutoResponseToQuestion(userMessage);
    if (autoResponse) {
      console.log("🤖 זוהתה תשובה לשאלה אוטומטית, מחזיר תגובה מותאמת");
      
      this.conversationHistory.push({
        role: "assistant",
        content: autoResponse
      });
      
      this.saveToLocalStorage();
      return autoResponse;
    }
    /**
   * בדיקה אם יש צורך להמליץ על פנייה לעזרה מקצועית
   */
  checkIfProfessionalHelpNeeded() 
  {
    // בדיקת מספר דגלי אזהרה
    const severeWarnings = this.userInfo.warningFlags.filter(flag => flag.level === "severe").length;
    const moderateWarnings = this.userInfo.warningFlags.filter(flag => flag.level === "moderate").length;
    
    if (severeWarnings > 0 || moderateWarnings >= 3) {
      this.userInfo.contactRecommended = true;
      console.log("⚠️ מומלץ על פנייה לעזרה מקצועית");
    }
    
    return this.userInfo.contactRecommended;
  }
  
  /**
   * שינוי וגיוון בתשובות על פי מספר ההודעות בשיחה
   * @param {string} response - התשובה הראשונית
   * @returns {string} התשובה המותאמת למיקום בשיחה
   */
  adaptResponseToConversationFlow(response) 
    const userMessages = this.conversationHistory.filter(msg => msg.role === "user").length;
    
    // הוספת שאלה בסוף התשובה אם מוקדם בשיחה
    if (userMessages < 3 && !response.includes("?")) {
      const followUpQuestions = [
        "איך זה גורם לך להרגיש?",
        "איך אתה מתמודד עם זה?",
        "האם תוכל לספר לי עוד?",
        "מה אתה חושב על זה?",
        "איך זה משפיע עליך ביום-יום?"
      ];
      
      response += " " + followUpQuestions[Math.floor(Math.random() * followUpQuestions.length)];
    }
    
    // בשיחה ארוכה - הוספת התייחסות להיסטוריה
    if (userMessages > 5 && Math.random() < 0.3) {
      const continuityPhrases = [
        "בהמשך למה שדיברנו קודם, ",
        "אני זוכרת שסיפרת לי על כך ש",
        "אם אני מקשרת לשיחה שלנו, ",
        "כפי שהזכרת קודם, "
      ];
      
      response = continuityPhrases[Math.floor(Math.random() * continuityPhrases.length)] + response.toLowerCase();
    }
    
    return response;
  }

  /**
   * בדיקה אם ההודעה היא תשובה לשאלה אוטומטית ומתן תגובה מתאימה
   * @param {string} userMessage - הודעת המשתמש
   * @returns {string|null} תשובה מתאימה או null אם לא זוהתה תשובה לשאלה אוטומטית
   */
  checkAutoResponseToQuestion(userMessage) {
    // בדיקה אם ההודעה האחרונה של המערכת הייתה שאלה
    const lastAssistantMessage = this.conversationHistory
      .filter(msg => msg.role === "assistant")
      .pop();
    
    if (!lastAssistantMessage) return null;
    
    // בדיקה אם הייתה שאלה בהודעה האחרונה של המערכת
    const lastMessageHadQuestion = lastAssistantMessage.content.includes("?");
    if (!lastMessageHadQuestion) return null;
    
    const lowerMessage = userMessage.toLowerCase().trim();
    
    // בדיקת תשובות ספציפיות לשאלות נפוצות
    
    // תשובה לשאלה על שינה
    if (lastAssistantMessage.content.includes("האם ניסית חלק מהטיפים האלה?") ||
        lastAssistantMessage.content.includes("מה בדרך כלל עוזר לך להירדם?") ||
        lastAssistantMessage.content.includes("איזה מהטיפים האלה נשמע לך הכי מתאים לנסות?")) {
      
      if (lowerMessage.includes("כן") || lowerMessage.includes("ניסיתי") || lowerMessage.includes("עוזר לי")) {
        return "אני שמחה לשמוע שניסית. האם יש משהו ספציפי שעובד טוב במיוחד עבורך? אשמח לשמוע מה הניסיון שלך כדי שאוכל ללמוד ולעזור טוב יותר גם לאחרים.";
      } else if (lowerMessage.includes("לא") || lowerMessage.includes("לא ניסיתי")) {
        return "אני מבינה שלא תמיד קל ליישם טיפים כאלה, במיוחד בסביבה צבאית. אולי כדאי לנסות את הדברים הפשוטים קודם, כמו הפחתת קפאין אחר הצהריים והימנעות ממסכים לפני השינה. אפילו שינוי קטן יכול לעשות הבדל. תרצה לנסות אחד מהטיפים ולעדכן אותי בהמשך?";
      }
    }
    
    // תשובה לשאלה על חרדה
    if (lastAssistantMessage.content.includes("האם תרצה לנסות את זה עכשיו?") ||
        lastAssistantMessage.content.includes("מה עוזר לך להתמודד עם חרדה?")) {
      
      if (lowerMessage.includes("כן") || lowerMessage.includes("בטח") || lowerMessage.includes("אשמח")) {
        return "מעולה! אז בוא ננסה את תרגיל 5-4-3-2-1 יחד:\n\n1. ציין 5 דברים שאתה יכול לראות סביבך כרגע\n2. 4 דברים שאתה יכול לגעת בהם\n3. 3 דברים שאתה יכול לשמוע\n4. 2 דברים שאתה יכול להריח\n5. דבר אחד שאתה יכול לטעום\n\nאתה יכול פשוט לציין אותם לעצמך בשקט או לכתוב לי. איך אתה מרגיש אחרי התרגיל?";
      } else if (lowerMessage.includes("לא") || lowerMessage.includes("פעם אחרת")) {
        return "אין בעיה, אני מבינה. התרגילים האלה זמינים עבורך בכל עת שתרצה להשתמש בהם. האם יש שיטה אחרת שעוזרת לך להירגע כשאתה חש חרדה או מתח?";
      }
    }
    
    // תשובה לשאלה על געגועים למשפחה
    if (lastAssistantMessage.content.includes("האם אתה מצליח לשמור על קשר באופן קבוע עם המשפחה?") ||
        lastAssistantMessage.content.includes("האם יש לך חברים קרובים ביחידה שאתה יכול לדבר איתם?") ||
        lastAssistantMessage.content.includes("האם יש לך פריטים כאלה איתך?")) {
      
      if (lowerMessage.includes("כן") || lowerMessage.includes("יש לי") || lowerMessage.includes("מצליח")) {
        return "זה נהדר לשמוע! שמירה על קשרים חברתיים ומשפחתיים היא אחת האסטרטגיות החשובות ביותר להתמודדות עם לחצים. האם יש משהו נוסף שעוזר לך להתמודד עם הגעגועים?";
      } else if (lowerMessage.includes("לא") || lowerMessage.includes("קשה לי") || lowerMessage.includes("אין לי")) {
        return "אני מבינה כמה זה יכול להיות קשה. האם היית רוצה לחשוב יחד על דרכים לשפר את המצב? לפעמים אפילו קשר קצר אבל קבוע יכול לעשות הבדל משמעותי בתחושת הגעגוע.";
      }
    }
    
    // תשובה לשאלות על שירות צבאי
    if (lastAssistantMessage.content.includes("איך אתה מתמודד עם האתגרים של השירות?") ||
        lastAssistantMessage.content.includes("האם יש משהו ספציפי בשירות שלך שאתה מתמודד איתו עכשיו?") ||
        lastAssistantMessage.content.includes("איך היחסים שלך עם האנשים ביחידה?")) {
      
      // תשובה כללית שמעודדת המשך שיתוף
      return "תודה ששיתפת. השירות הצבאי יכול להיות מאתגר במיוחד. האם תרצה לספר לי יותר על הדברים שעוזרים לך להתמודד? לפעמים שיתוף החוויות האישיות יכול להקל.";
    }
    
    return null;
  }

  /**
   * שליחת בקשה ל-OpenAI API וקבלת תשובה
   */
  async fetchOpenAIResponse(userMessage) {
    console.log("🔄 שולח בקשה ל-OpenAI:", userMessage);
    
    try {
      if (!this.apiKey) {
        console.warn("⚠️ מפתח API של OpenAI לא הוגדר. עובר למצב מקומי.");
        return await this.getSmartMockResponse(userMessage);
      }
      
      // הכנת ההיסטוריה לשליחה ל-API
      const messages = [
        {
          role: "system",
          content: this.getSystemPrompt(this.userInfo.name, this.userInfo.role, this.userInfo.lastSentiment)
        }
      ];
      
      // הוספת ההיסטוריה הקודמת (מוגבל ל-10 הודעות אחרונות למניעת חריגה ממגבלות)
      const recentMessages = this.conversationHistory
        .slice(-10)
        .filter(msg => msg.role === "user" || msg.role === "assistant");
      
      messages.push(...recentMessages);
      
      // הוספת ההודעה הנוכחית
      messages.push({
        role: "user",
        content: userMessage
      });
      
      console.log("📤 שולח ל-OpenAI את ההיסטוריה והשאלה החדשה:", {
        messageCount: messages.length,
        systemPromptLength: messages[0].content.length,
        latestUserMessage: userMessage
      });
      
      // שליחת הבקשה ל-API
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: "gpt-3.5-turbo", // ניתן להחליף ל-gpt-4 לאיכות גבוהה יותר
          messages: messages,
          temperature: 0.7,
          max_tokens: 1000
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error("❌ OpenAI API Error:", errorData);
        throw new Error(`שגיאת API: ${errorData.error?.message || "שגיאה לא ידועה"}`);
      }
      
      const data = await response.json();
      
      if (data.choices && data.choices.length > 0 && data.choices[0].message) {
        console.log("✅ התקבלה תשובה מ-OpenAI:", { 
          content: data.choices[0].message.content.substring(0, 50) + "..." 
        });
        return data.choices[0].message.content;
      } else {
        console.error("❌ תשובה לא תקינה מה-API:", data);
        throw new Error("תשובה לא תקינה מה-API");
      }
    } catch (error) {
      console.error("❌ שגיאה בתקשורת עם OpenAI:", error);
      
      // במקרה של שגיאה, עבור למצב מקומי
      console.log("🔄 עובר למצב מקומי");
      return await this.getSmartMockResponse(userMessage);
    }
  }

  /**
   * תשובות חכמות לגיבוי במקרה שה-API נכשל
   */
  async getSmartMockResponse(userMessage) {
    console.log("🤖 מייצר תשובה מקומית למצב גיבוי");
    
    // השהיה מלאכותית לסימולציית תקשורת רשת
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // ניתוח ההודעה של המשתמש
    const sentiment = this.analyzeSentiment(userMessage);
    const topics = this.analyzeTopics(userMessage);
    const distressInfo = this.analyzeDistressLevel(userMessage);
    
    // חילוץ פרטים אישיים
    const personalDetails = this.extractPersonalDetails(userMessage);
    
    // בדיקה אם מדובר בהצגה של שם
    const extractedName = this.extractUserName(userMessage);
    if (extractedName && !this.userInfo.name) {
      this.userInfo.name = extractedName;
      this.saveToLocalStorage();
      
      const nameResponse = this.getUniqueResponse(this.responseTemplates.nameAcknowledgement);
      return nameResponse;
    }
    
    // בדיקה אם ההודעה היא תשובה לשאלה אוטומטית
    const autoResponse = this.checkAutoResponseToQuestion(userMessage);
    if (autoResponse) {
      console.log("🤖 זוהתה תשובה לשאלה אוטומטית, מחזיר תגובה מותאמת");
      return autoResponse;
    }
    
    // בדיקה אם מדובר בבקשה לפתיחת מצלמה
    const lowerMessage = userMessage.toLowerCase();
    if (lowerMessage.includes("מצלמה") || 
        lowerMessage.includes("וידאו") || 
        lowerMessage.includes("לראות אותך")) {
      return "האם תרצה לפתוח שיחת וידאו? אוכל לראות ולשמוע אותך ולתת תגובות קוליות. זה יכול להיות נחמד לשוחח פנים אל פנים.";
    }
    
    // בדיקה אם מדובר בברכת שלום פשוטה
    const greetings = ["שלום", "היי", "הלו", "בוקר טוב", "ערב טוב", "צהריים טובים", "מה נשמע", "מה קורה"];
    if (greetings.some(g => lowerMessage.includes(g)) && userMessage.length < 30) {
      const greetingResponse = this.getUniqueResponse(this.responseTemplates.greeting);
      return greetingResponse;
    }
    
    // קבלת תשובה מותאמת אישית
    let response = this.getPersonalizedResponse(userMessage, sentiment, topics, distressInfo);
    
    // התאמה נוספת לפי זרימת השיחה
    response = this.adaptResponseToConversationFlow(response);
    
    return response;
  }

  /**
   * מוסיף הודעת משתמש לשיחה ומקבל תשובה חכמה מה-AI
   */
  async sendMessage(userMessage) {
    console.log("📨 התקבלה הודעה חדשה מהמשתמש:", userMessage);
    
    // בדיקה מהירה למניעת הודעות ריקות
    if (!userMessage || userMessage.trim() === "") {
      return "אני לא בטוחה שהבנתי את ההודעה שלך. אשמח אם תשתף אותי במחשבות או שאלות שיש לך.";
    }
    
    // הוספת הודעת המשתמש להיסטוריה
    this.conversationHistory.push({
      role: "user",
      content: userMessage
    });
    
    // ניתוח טקסט
    const sentiment = this.analyzeSentiment(userMessage);
    const topics = this.analyzeTopics(userMessage);
    const distressInfo = this.analyzeDistressLevel(userMessage);
    
    // חילוץ פרטים אישיים
    this.extractPersonalDetails(userMessage);
    
    // בדיקה אם זו ההודעה הראשונה של המשתמש
    if (this.isFirstMessage) {
      this.isFirstMessage = false;
      console.log("🆕 זוהתה הודעה ראשונה בשיחה");
      
      // בדיקה אם ההודעה היא שם
      const extractedName = this.extractUserName(userMessage);
      if (extractedName) {
        this.userInfo.name = extractedName;
        this.saveToLocalStorage();
        
        const response = `שמחה להכיר אותך, ${extractedName}! איך אתה מרגיש היום? אשמח לדעת מה אתה עושה ביום-יום בצבא או במילואים.`;
        
        this.conversationHistory.push({
          role: "assistant",
          content: response
        });
        
        this.saveToLocalStorage();
        return response;
      }
    }
    
    // ניסיון לזהות שם בכל הודעה (לא רק הראשונה)
    if (!this.userInfo.name) {
      const extractedName = this.extractUserName(userMessage);
      if (extractedName) {
        this.userInfo.name = extractedName;
        this.saveToLocalStorage();
      }
    }
    
    // בדיקה אם ההודעה היא תשובה לשאלה אוטומטית
    const autoResponse = this.checkAutoResponseToQuestion(userMessage);
    if (autoResponse) {
      console.log("🤖 זוהתה תשובה לשאלה אוטומטית, מחזיר תגובה מותאמת");
      
      this.conversationHistory.push({
        role: "assistant",
        content: autoResponse
      });
      
      this.saveToLocalStorage();
      return autoResponse;
    }
    
    try {
      // בדיקת מצבי מצוקה חמורים לפני פנייה ל-API
      if (distressInfo.level === "severe") {
        this.userInfo.contactRecommended = true;
        this.saveToLocalStorage();
        
        const severePhrases = this.responseTemplates.distress.severe;
        const response = this.replacePlaceholders(this.getUniqueResponse(severePhrases));
        
        this.conversationHistory.push({
          role: "assistant",
          content: response
        });
        
        this.saveToLocalStorage();
        return response;
      }
      
      // אם אין שם ויש מספיק הודעות, ננסה לבקש שם
      if (!this.userInfo.name && this.conversationHistory.length >= 4) {
        // בדיקה אם כבר שאלנו על השם בהודעה האחרונה
        const lastAssistantMsg = this.conversationHistory
          .filter(msg => msg.role === "assistant")
          .pop();
          
        if (lastAssistantMsg && !this.nameAskingResponses.some(resp => lastAssistantMsg.content.includes(resp))) {
          // שאל פעם ב-4 הודעות בערך (אקראי)
          if (Math.random() < 0.25) {
            const nameResponse = this.getUniqueResponse(this.nameAskingResponses);
            
            this.conversationHistory.push({
              role: "assistant",
              content: nameResponse
            });
            
            this.saveToLocalStorage();
            return nameResponse;
          }
        }
      }
      
      // קבלת תשובה מ-OpenAI
      console.log("🔄 מבקש תשובה מ-OpenAI");
      const apiResponse = await this.fetchOpenAIResponse(userMessage);
      
      // שמירת התשובה בהיסטוריה
      this.conversationHistory.push({
        role: "assistant",
        content: apiResponse
      });
      
      this.saveToLocalStorage();
      return apiResponse;
    } catch (error) {
      console.error("❌ שגיאה כללית בטיפול בהודעה:", error);
      
      // במקרה של שגיאה כללית, החזר תשובה מגיבוי חכם
      const backupResponse = await this.getSmartMockResponse(userMessage);
      
      this.conversationHistory.push({
        role: "assistant",
        content: backupResponse
      });
      
      this.saveToLocalStorage();
      return backupResponse;
    }
  }

  /**
   * ניקוי השיחה ומתחיל מחדש
   */
  clearConversation() {
    console.log("🧹 מנקה היסטוריית שיחה");
    
    // שמירת המידע על המשתמש
    const userName = this.userInfo.name;
    const role = this.userInfo.role;
    
    // איפוס הנתונים
    this.conversationHistory = [];
    this.userInfo = {
      name: userName,
      role: role,
      lastSentiment: "neutral",
      emotionalState: "normal",
      personalDetails: {},
      topicsDiscussed: [],
      warningFlags: [],
      contactRecommended: false,
      sessionStartTime: new Date().toISOString()
    };
    
    // שמירת המידע המאופס
    this.saveToLocalStorage();
    
    // אתחול השיחה מחדש
    return this.initializeChat(userName, role, "neutral");
  }
  
  /**
   * קבלת סיכום של מצב המשתמש
   */
  getUserStatusSummary() {
    // יצירת סיכום של מצב המשתמש
    const summary = {
      name: this.userInfo.name || "לא ידוע",
      role: this.userInfo.role || "לא ידוע",
      emotionalState: this.translateEmotionalState(this.userInfo.emotionalState),
      topicsDiscussed: this.translateTopics(this.userInfo.topicsDiscussed),
      warningLevel: this.calculateOverallWarningLevel(),
      contactRecommended: this.userInfo.contactRecommended,
      messageCount: this.conversationHistory.filter(msg => msg.role === "user").length,
      sessionDuration: this.calculateSessionDuration()
    };
    
    console.log("📊 סיכום מצב המשתמש:", summary);
    return summary;
  }
  
  /**
   * חישוב משך השיחה
   */
  calculateSessionDuration() {
    if (!this.userInfo.sessionStartTime) return "לא ידוע";
    
    const start = new Date(this.userInfo.sessionStartTime);
    const now = new Date();
    const durationMs = now - start;
    
    // המרה למבנה קריא
    const minutes = Math.floor(durationMs / 60000);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours} שעות ו-${minutes % 60} דקות`;
    } else {
      return `${minutes} דקות`;
    }
  }
  
  /**
   * תרגום מצב רגשי לעברית
   */
  translateEmotionalState(state) {
    const translations = {
      "normal": "רגיל",
      "stressed": "לחוץ",
      "worried": "מודאג",
      "happy": "שמח",
      "sad": "עצוב",
      "angry": "כועס",
      "fearful": "חרד"
    };
    
    return translations[state] || "לא ידוע";
  }
  
  /**
   * תרגום נושאים לעברית
   */
  translateTopics(topics) {
    const translations = {
      "family": "משפחה",
      "military": "צבא",
      "relationships": "יחסים",
      "health": "בריאות",
      "sleep": "שינה",
      "career": "קריירה",
      "mentalHealth": "בריאות נפשית"
    };
    
    return topics.map(topic => translations[topic] || topic);
  }
  
  /**
   * חישוב רמת אזהרה כללית
   */
  calculateOverallWarningLevel() {
    if (this.userInfo.warningFlags.length === 0) {
      return "נמוכה";
    }
    
    const severeCount = this.userInfo.warningFlags.filter(f => f.level === "severe").length;
    const moderateCount = this.userInfo.warningFlags.filter(f => f.level === "moderate").length;
    
    if (severeCount > 0) {
      return "גבוהה";
    } else if (moderateCount >= 3) {
      return "בינונית-גבוהה";
    } else if (moderateCount > 0) {
      return "בינונית";
    } else {
      return "נמוכה";
    }
  }
}

export default new AIService();