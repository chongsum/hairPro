/**
 * Translations for HairPro App
 * Supports: English (en), Traditional Chinese (zh-TW)
 */

export type Language = "en" | "zh-TW";

export const translations = {
  // ============ APP GENERAL ============
  appName: {
    en: "HairPro",
    "zh-TW": "髮型專家",
  },
  appSubtitle: {
    en: "AI Hairstyle Preview",
    "zh-TW": "AI 髮型預覽",
  },

  // ============ INITIAL SCREEN ============
  iAm: {
    en: "I am",
    "zh-TW": "我是",
  },
  male: {
    en: "Male",
    "zh-TW": "男性",
  },
  female: {
    en: "Female",
    "zh-TW": "女性",
  },
  iWantTo: {
    en: "I want to",
    "zh-TW": "我想要",
  },
  browseStyles: {
    en: "Browse Styles",
    "zh-TW": "瀏覽髮型",
  },
  browseStylesDesc: {
    en: "Choose from our curated collection of hairstyles",
    "zh-TW": "從我們精選的髮型系列中選擇",
  },
  useRefImage: {
    en: "Use Reference Image",
    "zh-TW": "使用參考圖片",
  },
  useRefImageDesc: {
    en: "Upload a photo of the hairstyle you want",
    "zh-TW": "上傳你想要的髮型照片",
  },
  continue: {
    en: "Continue",
    "zh-TW": "繼續",
  },
  myHairstyles: {
    en: "My Hairstyles",
    "zh-TW": "我的髮型",
  },

  // ============ PHOTO CAPTURE ============
  takeYourPhoto: {
    en: "Take Your Photo",
    "zh-TW": "拍攝你的照片",
  },
  photoSubtitle: {
    en: "We need a clear front-facing photo of you",
    "zh-TW": "我們需要一張清晰的正面照片",
  },
  takeSelfie: {
    en: "Take Selfie",
    "zh-TW": "自拍",
  },
  useCamera: {
    en: "Use your camera",
    "zh-TW": "使用相機",
  },
  uploadPhoto: {
    en: "Upload Photo",
    "zh-TW": "上傳照片",
  },
  fromGallery: {
    en: "From your gallery",
    "zh-TW": "從相簿選擇",
  },
  forBestResults: {
    en: "For Best Results",
    "zh-TW": "為獲得最佳效果",
  },
  tipLighting: {
    en: "Good, even lighting",
    "zh-TW": "良好均勻的光線",
  },
  tipFaceCamera: {
    en: "Face the camera directly",
    "zh-TW": "正對相機",
  },
  tipShowFace: {
    en: "Show your full face and hairline",
    "zh-TW": "展示完整的臉部和髮際線",
  },
  tipBackground: {
    en: "Neutral background preferred",
    "zh-TW": "建議使用素色背景",
  },
  useDemoPhoto: {
    en: "Use Demo Photo (Dev)",
    "zh-TW": "使用示範照片 (開發)",
  },
  back: {
    en: "Back",
    "zh-TW": "返回",
  },

  // ============ PHOTO CONFIRM ============
  confirmYourPhoto: {
    en: "Confirm Your Photo",
    "zh-TW": "確認你的照片",
  },
  confirmSubtitle: {
    en: "Make sure your face and hair are clearly visible",
    "zh-TW": "確保你的臉部和頭髮清晰可見",
  },
  retakePhoto: {
    en: "Retake Photo",
    "zh-TW": "重新拍攝",
  },
  looksGood: {
    en: "Looks Good ✓",
    "zh-TW": "看起來不錯 ✓",
  },

  // ============ STYLE SELECT ============
  chooseYourStyle: {
    en: "Choose Your Style",
    "zh-TW": "選擇你的髮型",
  },
  hairColor: {
    en: "Hair Color",
    "zh-TW": "髮色",
  },
  generatePreview: {
    en: "Generate Preview ✨",
    "zh-TW": "生成預覽 ✨",
  },

  // ============ REF UPLOAD ============
  referenceHairstyle: {
    en: "Reference Hairstyle",
    "zh-TW": "參考髮型",
  },
  refSubtitle: {
    en: "Upload or paste a URL of the hairstyle you want",
    "zh-TW": "上傳或貼上你想要的髮型圖片網址",
  },
  targetHairColor: {
    en: "Target Hair Color",
    "zh-TW": "目標髮色",
  },
  uploadRefImage: {
    en: "Upload Reference Image",
    "zh-TW": "上傳參考圖片",
  },
  orPasteUrl: {
    en: "— or paste URL —",
    "zh-TW": "— 或貼上網址 —",
  },
  load: {
    en: "Load",
    "zh-TW": "載入",
  },
  aiAnalysis: {
    en: "AI Analysis:",
    "zh-TW": "AI 分析：",
  },
  analyzingHairstyle: {
    en: "Analyzing hairstyle...",
    "zh-TW": "分析髮型中...",
  },
  analysisFailedTitle: {
    en: "Could not analyze this image. Please try a different reference photo with a clearer view of the hairstyle.",
    "zh-TW": "無法分析此圖片。請嘗試使用髮型更清晰的參考照片。",
  },
  tryAnotherImage: {
    en: "Try Another Image",
    "zh-TW": "嘗試其他圖片",
  },
  refTip1: {
    en: "Use a close-up face shot showing the full hairstyle",
    "zh-TW": "使用展示完整髮型的特寫照片",
  },
  refTip2: {
    en: "Front-facing reference images work best",
    "zh-TW": "正面參考圖片效果最佳",
  },
  refTip3: {
    en: "Ensure the hair is clearly visible",
    "zh-TW": "確保頭髮清晰可見",
  },
  refTip4: {
    en: "Side or angled photos may produce less accurate results",
    "zh-TW": "側面或斜角照片可能產生較不準確的結果",
  },

  // ============ GENERATING ============
  creatingYourLook: {
    en: "Creating Your Look",
    "zh-TW": "正在創建你的造型",
  },
  preparingPhoto: {
    en: "Preparing your photo...",
    "zh-TW": "準備你的照片中...",
  },
  analyzingHair: {
    en: "Analyzing your hair characteristics...",
    "zh-TW": "分析你的頭髮特徵中...",
  },
  creatingHairstyle: {
    en: "Creating your new hairstyle...",
    "zh-TW": "創建你的新髮型中...",
  },
  savingToHistory: {
    en: "Saving to history...",
    "zh-TW": "儲存到歷史記錄中...",
  },
  complete: {
    en: "Complete!",
    "zh-TW": "完成！",
  },
  estimatedTimeRemaining: {
    en: "Estimated time remaining",
    "zh-TW": "預計剩餘時間",
  },
  almostDone: {
    en: "Almost done!",
    "zh-TW": "即將完成！",
  },
  funFact1: {
    en: "Analyzing your unique hair characteristics...",
    "zh-TW": "分析你獨特的頭髮特徵中...",
  },
  funFact2: {
    en: "AI is learning your facial features...",
    "zh-TW": "AI 正在學習你的面部特徵...",
  },
  funFact3: {
    en: "Crafting the perfect hairstyle for you...",
    "zh-TW": "為你打造完美髮型中...",
  },
  funFact4: {
    en: "Putting on the finishing touches...",
    "zh-TW": "進行最後修飾中...",
  },

  // ============ RESULT ============
  yourNewLook: {
    en: "Your New Look",
    "zh-TW": "你的新造型",
  },
  before: {
    en: "BEFORE",
    "zh-TW": "之前",
  },
  after: {
    en: "AFTER",
    "zh-TW": "之後",
  },
  tryAnother: {
    en: "Try Another",
    "zh-TW": "嘗試其他",
  },
  startOver: {
    en: "Start Over",
    "zh-TW": "重新開始",
  },
  viewHistory: {
    en: "View History",
    "zh-TW": "查看歷史",
  },

  // ============ HISTORY ============
  noHairstylesYet: {
    en: "No hairstyles yet",
    "zh-TW": "尚無髮型記錄",
  },
  hairstylesWillAppear: {
    en: "Your generated hairstyles will appear here",
    "zh-TW": "你生成的髮型將顯示在這裡",
  },
  createFirstLook: {
    en: "Create Your First Look",
    "zh-TW": "創建你的第一個造型",
  },
  clearAll: {
    en: "Clear All",
    "zh-TW": "清除全部",
  },
  deleteAllHistory: {
    en: "Delete all hairstyles from history?",
    "zh-TW": "刪除所有髮型記錄？",
  },
  cancel: {
    en: "Cancel",
    "zh-TW": "取消",
  },
  delete: {
    en: "Delete",
    "zh-TW": "刪除",
  },
  deleteFromHistory: {
    en: "from history?",
    "zh-TW": "從歷史記錄中刪除？",
  },
  style: {
    en: "Style",
    "zh-TW": "髮型",
  },
  date: {
    en: "Date",
    "zh-TW": "日期",
  },
  type: {
    en: "Type",
    "zh-TW": "類型",
  },
  referenceImage: {
    en: "Reference Image",
    "zh-TW": "參考圖片",
  },
  styleSelection: {
    en: "Style Selection",
    "zh-TW": "髮型選擇",
  },

  // ============ CAMERA ============
  cameraPermissionRequired: {
    en: "Camera permission is required",
    "zh-TW": "需要相機權限",
  },
  grantPermission: {
    en: "Grant Permission",
    "zh-TW": "授予權限",
  },
  positionFace: {
    en: "Position your face in the circle",
    "zh-TW": "將臉部放在圓圈內",
  },

  // ============ MODEL SELECTOR ============
  aiModel: {
    en: "AI Model",
    "zh-TW": "AI 模型",
  },
  selectModel: {
    en: "Select Model",
    "zh-TW": "選擇模型",
  },
  currentModel: {
    en: "Current Model",
    "zh-TW": "當前模型",
  },
  modelSelected: {
    en: "Selected",
    "zh-TW": "已選擇",
  },

  // ============ ERRORS ============
  error: {
    en: "Error",
    "zh-TW": "錯誤",
  },
  permissionNeeded: {
    en: "Permission needed",
    "zh-TW": "需要權限",
  },
  allowPhotoLibrary: {
    en: "Please allow access to your photo library",
    "zh-TW": "請允許訪問你的相簿",
  },
  failedToCapture: {
    en: "Failed to capture photo. Please try again.",
    "zh-TW": "拍照失敗。請重試。",
  },
  failedToPickImage: {
    en: "Failed to pick image",
    "zh-TW": "選擇圖片失敗",
  },
  failedToLoadDemo: {
    en: "Failed to load demo photo.",
    "zh-TW": "載入示範照片失敗。",
  },
  generationError: {
    en: "Generation Error",
    "zh-TW": "生成錯誤",
  },
  failedToGenerate: {
    en: "Failed to generate hairstyle image",
    "zh-TW": "生成髮型圖片失敗",
  },
  analysisFailed: {
    en: "Analysis Failed",
    "zh-TW": "分析失敗",
  },
  cameraAccessRequired: {
    en: "Camera access required",
    "zh-TW": "需要相機權限",
  },

  // ============ HAIR LENGTH FILTERS ============
  filterAll: {
    en: "All",
    "zh-TW": "全部",
  },
  filterBuzz: {
    en: "Buzz",
    "zh-TW": "極短",
  },
  filterShort: {
    en: "Short",
    "zh-TW": "短髮",
  },
  filterMedium: {
    en: "Medium",
    "zh-TW": "中長",
  },
  filterShoulder: {
    en: "Shoulder",
    "zh-TW": "及肩",
  },
  filterLong: {
    en: "Long",
    "zh-TW": "長髮",
  },

  // ============ HAIR COLORS ============
  colorNatural: {
    en: "Natural",
    "zh-TW": "自然色",
  },
  colorJetBlack: {
    en: "Jet Black",
    "zh-TW": "烏黑",
  },
  colorBlack: {
    en: "Black",
    "zh-TW": "黑色",
  },
  colorDarkBrown: {
    en: "Dark Brown",
    "zh-TW": "深棕",
  },
  colorChocolate: {
    en: "Chocolate",
    "zh-TW": "巧克力",
  },
  colorChestnut: {
    en: "Chestnut",
    "zh-TW": "栗色",
  },
  colorAuburn: {
    en: "Auburn",
    "zh-TW": "赤褐",
  },
  colorMedBrown: {
    en: "Med Brown",
    "zh-TW": "中棕",
  },
  colorLightBrown: {
    en: "Light Brown",
    "zh-TW": "淺棕",
  },
  colorCaramel: {
    en: "Caramel",
    "zh-TW": "焦糖",
  },
  colorHoney: {
    en: "Honey",
    "zh-TW": "蜜糖",
  },
  colorGolden: {
    en: "Golden",
    "zh-TW": "金色",
  },
  colorAsh: {
    en: "Ash",
    "zh-TW": "灰棕",
  },
  colorPlatinum: {
    en: "Platinum",
    "zh-TW": "白金",
  },
  colorStrawberry: {
    en: "Strawberry",
    "zh-TW": "草莓",
  },
  colorGinger: {
    en: "Ginger",
    "zh-TW": "薑黃",
  },
  colorCopper: {
    en: "Copper",
    "zh-TW": "銅色",
  },
  colorSilver: {
    en: "Silver",
    "zh-TW": "銀色",
  },
};

// ============ HAIRSTYLE NAMES ============
export const hairstyleNames: Record<string, { en: string; "zh-TW": string }> = {
  // ============ MALE BUZZ ============
  "Buzz Cut": { en: "Buzz Cut", "zh-TW": "平頭" },
  "Crew Cut": { en: "Crew Cut", "zh-TW": "圓寸頭" },
  "Butch Cut": { en: "Butch Cut", "zh-TW": "板寸頭" },
  "Induction Cut": { en: "Induction Cut", "zh-TW": "光頭寸" },
  "High and Tight": { en: "High and Tight", "zh-TW": "高緊短髮" },

  // ============ MALE SHORT ============
  "Classic Side Part": { en: "Classic Side Part", "zh-TW": "經典側分" },
  "Textured Crop": { en: "Textured Crop", "zh-TW": "紋理短髮" },
  "French Crop": { en: "French Crop", "zh-TW": "法式短髮" },
  "Ivy League": { en: "Ivy League", "zh-TW": "常春藤頭" },
  "Caesar Cut": { en: "Caesar Cut", "zh-TW": "凱撒頭" },
  "Taper Fade": { en: "Taper Fade", "zh-TW": "漸層削邊" },
  "Skin Fade": { en: "Skin Fade", "zh-TW": "漸層光邊" },
  "Edgar Cut": { en: "Edgar Cut", "zh-TW": "艾德加頭" },

  // ============ MALE MEDIUM ============
  "Quiff": { en: "Quiff", "zh-TW": "蓬鬆油頭" },
  "Pompadour": { en: "Pompadour", "zh-TW": "龐巴度頭" },
  "Slicked Back": { en: "Slicked Back", "zh-TW": "後梳油頭" },
  "Undercut": { en: "Undercut", "zh-TW": "削邊髮型" },
  "Textured Fringe": { en: "Textured Fringe", "zh-TW": "紋理瀏海" },
  "Modern Mullet": { en: "Modern Mullet", "zh-TW": "現代鯔魚頭" },
  "Curtain Hair": { en: "Curtain Hair", "zh-TW": "窗簾瀏海" },
  "Messy Textured": { en: "Messy Textured", "zh-TW": "凌亂紋理" },

  // ============ MALE SHOULDER ============
  "Flow Hairstyle": { en: "Flow Hairstyle", "zh-TW": "飄逸長髮" },
  "Surfer Hair": { en: "Surfer Hair", "zh-TW": "衝浪髮型" },
  "Layered Shag": { en: "Layered Shag", "zh-TW": "層次搖滾" },
  "Bro Flow": { en: "Bro Flow", "zh-TW": "型男長髮" },

  // ============ MALE LONG ============
  "Man Bun": { en: "Man Bun", "zh-TW": "男士丸子頭" },
  "Long Layers": { en: "Long Layers", "zh-TW": "長層次" },
  "Samurai Top Knot": { en: "Samurai Top Knot", "zh-TW": "武士髻" },
  "Viking Style": { en: "Viking Style", "zh-TW": "維京風格" },
  "Classic Long": { en: "Classic Long", "zh-TW": "經典長髮" },
  "Bohemian Waves": { en: "Bohemian Waves", "zh-TW": "波西米亞捲" },

  // ============ FEMALE BUZZ ============
  "Pixie Buzz": { en: "Pixie Buzz", "zh-TW": "精靈極短" },
  "Tapered Buzz": { en: "Tapered Buzz", "zh-TW": "漸層極短" },

  // ============ FEMALE SHORT ============
  "Pixie Cut": { en: "Pixie Cut", "zh-TW": "精靈短髮" },
  "Choppy Pixie": { en: "Choppy Pixie", "zh-TW": "層次精靈" },
  "Asymmetric Pixie": { en: "Asymmetric Pixie", "zh-TW": "不對稱精靈" },
  "French Bob": { en: "French Bob", "zh-TW": "法式鮑伯" },
  "Ear-Length Bob": { en: "Ear-Length Bob", "zh-TW": "齊耳鮑伯" },
  "Bowl Cut Modern": { en: "Bowl Cut Modern", "zh-TW": "現代蘑菇頭" },
  "Bixie Cut": { en: "Bixie Cut", "zh-TW": "精靈鮑伯" },
  "Textured Pixie": { en: "Textured Pixie", "zh-TW": "紋理精靈" },

  // ============ FEMALE MEDIUM ============
  "Classic Bob": { en: "Classic Bob", "zh-TW": "經典鮑伯" },
  "Layered Bob": { en: "Layered Bob", "zh-TW": "層次鮑伯" },
  "Blunt Bob": { en: "Blunt Bob", "zh-TW": "齊切鮑伯" },
  "A-Line Bob": { en: "A-Line Bob", "zh-TW": "A字鮑伯" },
  "Shaggy Bob": { en: "Shaggy Bob", "zh-TW": "搖滾鮑伯" },
  "Chin-Length Lob": { en: "Chin-Length Lob", "zh-TW": "齊下巴長鮑伯" },
  "Wavy Bob": { en: "Wavy Bob", "zh-TW": "波浪鮑伯" },
  "Curtain Bangs Bob": { en: "Curtain Bangs Bob", "zh-TW": "窗簾瀏海鮑伯" },

  // ============ FEMALE SHOULDER ============
  "Lob (Long Bob)": { en: "Lob (Long Bob)", "zh-TW": "長鮑伯" },
  "Shoulder-Length Layers": { en: "Shoulder-Length Layers", "zh-TW": "及肩層次" },
  "Shag Cut": { en: "Shag Cut", "zh-TW": "搖滾層次" },
  "Wolf Cut": { en: "Wolf Cut", "zh-TW": "狼尾頭" },
  "Butterfly Cut": { en: "Butterfly Cut", "zh-TW": "蝴蝶層次" },
  "Curtain Bangs": { en: "Curtain Bangs", "zh-TW": "窗簾瀏海" },
  "Textured Layers": { en: "Textured Layers", "zh-TW": "紋理層次" },
  "Blunt Cut": { en: "Blunt Cut", "zh-TW": "齊切髮型" },

  // ============ FEMALE LONG ============
  "Face Framing Layers": { en: "Face Framing Layers", "zh-TW": "修容層次" },
  "Beach Waves": { en: "Beach Waves", "zh-TW": "海灘波浪" },
  "Straight Sleek": { en: "Straight Sleek", "zh-TW": "柔順直髮" },
  "V-Cut Layers": { en: "V-Cut Layers", "zh-TW": "V型層次" },
  "U-Cut Layers": { en: "U-Cut Layers", "zh-TW": "U型層次" },
  "Feathered Layers": { en: "Feathered Layers", "zh-TW": "羽毛層次" },
  "Mermaid Waves": { en: "Mermaid Waves", "zh-TW": "美人魚捲" },
  "Bohemian Long": { en: "Bohemian Long", "zh-TW": "波西米亞長髮" },
  "Rapunzel Layers": { en: "Rapunzel Layers", "zh-TW": "長髮公主" },
};

// ============ HAIRSTYLE DESCRIPTIONS (Traditional Chinese) ============
export const hairstyleDescriptions: Record<string, { en: string; "zh-TW": string }> = {
  // ============ MALE BUZZ ============
  "Buzz Cut": {
    en: "Ultra-short uniform length all over, clipper cut at #1-#2 guard (3-6mm). Clean, military-inspired cut with visible scalp through hair. Sharp defined hairline at forehead, temples, and nape. No styling required, natural hair texture visible.",
    "zh-TW": "全頭超短均勻長度，使用1-2號推剪（3-6毫米）。乾淨的軍人風格，頭皮微微可見。前額、鬢角和後頸髮際線清晰分明。無需造型，展現自然髮質。",
  },
  "Crew Cut": {
    en: "Classic tapered cut with 1-2 inches on top gradually fading shorter on sides. Top hair stands upright with textured finish, sides clipper-faded from #2 at top to #1 at temples. Front hairline slightly longer, brushed forward or to the side. Clean neckline taper.",
    "zh-TW": "經典漸層剪裁，頭頂1-2英寸逐漸向兩側變短。頂部頭髮直立帶紋理，兩側從上方2號漸變到鬢角1號。前髮際線稍長，可向前或向側梳理。後頸線條乾淨。",
  },
  "Butch Cut": {
    en: "Very short uniform buzz, slightly longer than induction cut at #2-#3 guard (6-10mm). Even length throughout with no fade, squared-off hairline. Military regulation style, minimal maintenance cut.",
    "zh-TW": "非常短的均勻平頭，比光頭寸稍長，使用2-3號推剪（6-10毫米）。全頭均勻長度無漸層，方正髮際線。軍規風格，極低維護。",
  },
  "Induction Cut": {
    en: "Shortest possible clipper cut at #0-#1 guard (1-3mm), nearly bald appearance. Uniform length all over with defined sharp hairline. Military boot camp style, scalp clearly visible throughout.",
    "zh-TW": "最短的推剪長度，使用0-1號（1-3毫米），近乎光頭。全頭均勻長度，髮際線清晰分明。軍隊新兵風格，頭皮清晰可見。",
  },
  "High and Tight": {
    en: "Dramatic contrast cut with longer top (1-2 inches) and extremely short sides/back buzzed to skin or #0 guard. Sharp horizontal demarcation line between top and sides. Top can be styled forward, spiked, or brushed to side.",
    "zh-TW": "強烈對比剪裁，頂部較長（1-2英寸），兩側和後方極短至貼膚或0號。頂部和兩側之間有清晰的水平分界線。頂部可向前梳、豎起或側梳。",
  },

  // ============ MALE SHORT ============
  "Classic Side Part": {
    en: "Timeless gentleman's cut with 2-3 inches on top, tapered sides. Deep side part with hair combed smoothly to one side. Gradual fade on sides and back, clean around ears. Polished, professional finish with slight shine from pomade.",
    "zh-TW": "永恆紳士剪裁，頭頂2-3英寸，兩側漸層。深側分，頭髮順滑梳向一側。兩側和後方漸層，耳周乾淨。使用髮油呈現拋光專業質感。",
  },
  "Textured Crop": {
    en: "Modern choppy top with 2-3 inches of length, heavy texture throughout. Disconnected undercut or fade on sides. Messy, piece-y finish on top with defined individual strands. Forward-styled fringe with textured ends.",
    "zh-TW": "現代層次頂部，2-3英寸長度，全頭重紋理。兩側斷層削邊或漸層。頂部凌亂、分明的髮束效果。前瀏海向前造型，髮尾帶紋理。",
  },
  "French Crop": {
    en: "Short textured top with signature blunt-cut fringe falling across forehead. Sides faded tight (#1-#2), top kept 1-2 inches with choppy texture. Fringe cut straight across, hitting mid-forehead. European minimal aesthetic.",
    "zh-TW": "短紋理頂部配標誌性齊切瀏海橫過前額。兩側緊密漸層（1-2號），頂部保持1-2英寸帶層次紋理。瀏海直剪，落在前額中部。歐式極簡美學。",
  },
  "Ivy League": {
    en: "Longer crew cut variant with 2-3 inches on top allowing side part. Tapered sides with scissor-over-comb finish. Preppy, polished look that can be parted or brushed back. Clean professional appearance.",
    "zh-TW": "較長的圓寸變體，頂部2-3英寸可側分。兩側漸層配剪刀過梳修飾。學院派拋光造型，可分線或後梳。乾淨專業外觀。",
  },
  "Caesar Cut": {
    en: "Short horizontal fringe (bangs) with uniform 1-2 inch length on top. Hair brushed forward throughout, fringe sits flat on forehead. Tapered or faded sides, named after Julius Caesar's iconic style.",
    "zh-TW": "短水平瀏海，頂部均勻1-2英寸長度。全頭向前梳理，瀏海平貼前額。兩側漸層或削邊，以凱撒大帝標誌性髮型命名。",
  },
  "Taper Fade": {
    en: "Gradual length transition from longer top to shorter sides/back. Top maintains 2-4 inches, sides blend from skin to top length. Seamless gradient effect, clean around ears and neckline. Versatile styling on top.",
    "zh-TW": "從較長頂部到較短兩側/後方的漸進過渡。頂部保持2-4英寸，兩側從貼膚漸變到頂部長度。無縫漸層效果，耳周和頸線乾淨。頂部造型多變。",
  },
  "Skin Fade": {
    en: "Dramatic fade starting at skin (bald) at temples/neckline, blending up to longer top. Sharp contrast between bald lower portion and textured top. High, mid, or low fade variations. Modern barbershop signature cut.",
    "zh-TW": "戲劇性漸層，從鬢角/頸線的貼膚（光滑）漸變到較長頂部。光滑下部與紋理頂部形成強烈對比。有高、中、低漸層變化。現代理髮店標誌性剪裁。",
  },
  "Edgar Cut": {
    en: "Bold statement cut with straight-across blunt fringe, high skin fade on sides. Sharp geometric lines, fringe sits flat and heavy on forehead. Undercut sides with dramatic contrast. Trendy, edgy aesthetic.",
    "zh-TW": "大膽聲明剪裁，直線齊切瀏海，兩側高漸層光邊。銳利幾何線條，瀏海厚重平貼前額。兩側削邊形成戲劇性對比。時尚前衛美學。",
  },

  // ============ MALE MEDIUM ============
  "Quiff": {
    en: "Voluminous front-swept style with 3-4 inches on top, shorter sides. Hair lifted and swept back at front creating height and volume. Tapered or faded sides, back swept smoothly. Classic rockabilly-inspired, modern adaptation.",
    "zh-TW": "蓬鬆前掃造型，頂部3-4英寸，兩側較短。前方頭髮向上提起後掃，創造高度和蓬鬆感。兩側漸層或削邊，後方順滑後掃。經典搖滾風格的現代演繹。",
  },
  "Pompadour": {
    en: "Iconic volume-focused style with 4-5 inches on top swept up and back. Maximum height at front, gradually tapering back. Sides slicked or faded, dramatic front elevation. Retro glamour meets modern edge.",
    "zh-TW": "標誌性蓬鬆造型，頂部4-5英寸向上後掃。前方最大高度，逐漸向後漸變。兩側油頭或漸層，前方戲劇性高聳。復古魅力遇上現代前衛。",
  },
  "Slicked Back": {
    en: "All hair combed straight back from forehead with wet-look or matte finish. Medium length 3-4 inches throughout top, tapered sides. Smooth, sleek surface with no part. Sophisticated, polished appearance.",
    "zh-TW": "所有頭髮從前額直接向後梳，呈現濕髮或霧面效果。頂部中等長度3-4英寸，兩側漸層。光滑流線表面無分線。精緻拋光外觀。",
  },
  "Undercut": {
    en: "Disconnected style with 3-4 inches on top, dramatically short buzzed sides (#0-#1). Sharp line of demarcation between top and sides. Top can be worn slicked back, side-parted, or textured. High contrast look.",
    "zh-TW": "斷層造型，頂部3-4英寸，兩側極短推剪（0-1號）。頂部和兩側之間有清晰分界線。頂部可後梳、側分或紋理造型。高對比造型。",
  },
  "Textured Fringe": {
    en: "Choppy, piece-y front with 3-4 inches falling forward onto forehead. Heavy texture throughout with point-cut ends. Faded or tapered sides, messy intentional bedhead styling. Modern, youthful aesthetic.",
    "zh-TW": "層次分明的前方，3-4英寸向前落在前額。全頭重紋理配點剪髮尾。兩側漸層或削邊，刻意凌亂的睡醒造型。現代年輕美學。",
  },
  "Modern Mullet": {
    en: "Contemporary take on classic mullet - textured short front and sides with longer back (4-6 inches). Shaggy layers, face-framing pieces, tapered sides. Edgy, fashion-forward revival style.",
    "zh-TW": "經典鯔魚頭的當代演繹 - 前方和兩側短紋理，後方較長（4-6英寸）。蓬鬆層次，修容髮片，兩側漸層。前衛時尚復興風格。",
  },
  "Curtain Hair": {
    en: "Center-parted medium length (4-5 inches) framing face on both sides. Soft layers with ends flipping outward or tucked behind ears. 90s revival style, effortless romantic aesthetic.",
    "zh-TW": "中分中長髮（4-5英寸）兩側修容。柔和層次，髮尾向外翻或塞耳後。90年代復興風格，輕鬆浪漫美學。",
  },
  "Messy Textured": {
    en: "Intentionally disheveled 3-4 inch length with maximum texture and movement. Choppy layers, piece-y finish, no defined shape. Tousled bedhead appearance with matte product. Effortless casual style.",
    "zh-TW": "刻意凌亂的3-4英寸長度，最大紋理和動感。層次分明，髮束效果，無固定形狀。使用霧面產品的蓬亂睡醒造型。輕鬆休閒風格。",
  },

  // ============ MALE SHOULDER ============
  "Flow Hairstyle": {
    en: "Shoulder-length (5-7 inches) with natural movement and soft layers. Hair flows freely, often swept back from face. Healthy shine, minimal styling for natural wave pattern. Athletic, surfer-influenced aesthetic.",
    "zh-TW": "及肩長度（5-7英寸），自然動感和柔和層次。頭髮自由飄逸，常從臉部後掃。健康光澤，最小造型呈現自然波紋。運動員、衝浪風格美學。",
  },
  "Surfer Hair": {
    en: "Sun-kissed shoulder-length waves with beachy texture. Natural, undone appearance with salt-spray texture. Layers for movement, often lighter at ends. Relaxed, coastal lifestyle look.",
    "zh-TW": "陽光親吻的及肩波浪，海灘質感。自然不刻意的外觀，海鹽噴霧紋理。層次增添動感，髮尾常較淺色。輕鬆海岸生活造型。",
  },
  "Layered Shag": {
    en: "Heavy layers throughout shoulder-length hair creating volume and movement. Face-framing pieces, choppy ends, 70s rock-inspired texture. Messy, lived-in appearance with maximum body.",
    "zh-TW": "及肩髮全頭重層次，創造蓬鬆和動感。修容髮片，層次髮尾，70年代搖滾風紋理。凌亂、自然生活感的最大蓬鬆度。",
  },
  "Bro Flow": {
    en: "Slicked-back shoulder-length style with volume at crown. Hair swept back off face, tucked behind ears or flowing freely. Polished yet relaxed, requires healthy thick hair.",
    "zh-TW": "後梳及肩造型，頭頂有蓬鬆感。頭髮從臉部後掃，塞耳後或自由飄逸。精緻又輕鬆，需要健康濃密的頭髮。",
  },

  // ============ MALE LONG ============
  "Man Bun": {
    en: "Long hair (8+ inches) gathered and tied at crown or back of head. Can be full bun or half-up style. Clean sides or undercut variation. Practical yet stylish for long hair.",
    "zh-TW": "長髮（8英寸以上）在頭頂或後方束起。可全束或半束造型。兩側乾淨或削邊變化。長髮的實用時尚選擇。",
  },
  "Long Layers": {
    en: "Past-shoulder length with graduated layers for movement. Face-framing pieces, healthy ends, natural texture. Versatile styling options, rock-star influenced aesthetic.",
    "zh-TW": "過肩長度配漸進層次增添動感。修容髮片，健康髮尾，自然紋理。多變造型選擇，搖滾巨星風格美學。",
  },
  "Samurai Top Knot": {
    en: "Traditional Japanese-inspired with undercut sides, long top tied in knot at crown. Sharp contrast between shaved sides and tied-up top. Cultural fusion, warrior aesthetic.",
    "zh-TW": "傳統日式風格，兩側削邊，長頂部在頭頂束成髻。剃邊兩側與束起頂部形成強烈對比。文化融合，武士美學。",
  },
  "Viking Style": {
    en: "Long, textured hair often with braids or half-up styles. Rugged, masculine appearance with intentional messiness. Can include beard coordination. Norse warrior inspired.",
    "zh-TW": "長紋理髮常配辮子或半束造型。粗獷陽剛外觀帶刻意凌亂感。可搭配鬍子造型。北歐維京戰士風格。",
  },
  "Classic Long": {
    en: "Simple shoulder-length or longer with minimal layers. One-length appearance, natural part, healthy sleek finish. Timeless, uncomplicated long hair look.",
    "zh-TW": "簡約及肩或更長，最少層次。一長度外觀，自然分線，健康順滑質感。永恆不複雜的長髮造型。",
  },
  "Bohemian Waves": {
    en: "Long flowing waves with natural, undone texture. Soft romantic movement, center or side parted. Artistic, free-spirited aesthetic with effortless beauty.",
    "zh-TW": "長飄逸波浪，自然不刻意紋理。柔和浪漫動感，中分或側分。藝術自由風格，輕鬆自然美。",
  },

  // ============ FEMALE BUZZ ============
  "Buzz Cut_female": {
    en: "Bold ultra-short clipper cut at #1-#2 guard. Uniform length showing head shape, defined feminine hairline. Statement androgynous style, emphasizes facial features.",
    "zh-TW": "大膽超短推剪，1-2號。均勻長度展現頭型，清晰女性髮際線。聲明式中性風格，強調面部特徵。",
  },
  "Pixie Buzz": {
    en: "Very short pixie variation with slight length on top (0.5-1 inch). Tapered sides, feminine softness despite short length. Elfin, gamine quality.",
    "zh-TW": "極短精靈變體，頂部稍長（0.5-1英寸）。兩側漸層，短髮中帶女性柔和感。精靈般俏皮氣質。",
  },
  "Tapered Buzz": {
    en: "Graduated buzz longer at crown, shorter at sides and nape. Soft feminine shape despite extreme shortness. Artistic, editorial-inspired cut.",
    "zh-TW": "漸層極短髮，頭頂較長，兩側和後頸較短。極短中帶柔和女性輪廓。藝術時尚編輯風格。",
  },

  // ============ FEMALE SHORT ============
  "Pixie Cut": {
    en: "Classic short cut with 1-3 inches on top, cropped sides and back. Versatile styling - sleek, textured, or tousled. Feminine yet edgy, emphasizes bone structure.",
    "zh-TW": "經典短髮，頂部1-3英寸，兩側和後方修短。多變造型 - 順滑、紋理或蓬亂。女性化又前衛，強調骨骼輪廓。",
  },
  "Choppy Pixie": {
    en: "Heavily textured pixie with razored, piece-y ends. Maximum movement and edge, messy intentional finish. Punk-influenced, modern attitude.",
    "zh-TW": "重紋理精靈頭配削刀、髮束效果髮尾。最大動感和前衛感，刻意凌亂效果。龐克影響的現代態度。",
  },
  "Asymmetric Pixie": {
    en: "Dramatic uneven length - longer on one side, shorter on other. Geometric, avant-garde silhouette. High-fashion editorial statement.",
    "zh-TW": "戲劇性不對稱長度 - 一側較長，另一側較短。幾何前衛輪廓。高級時尚編輯聲明。",
  },
  "French Bob": {
    en: "Chin-length blunt bob with full fringe (bangs). Parisian chic with clean lines, slight inward curl at ends. Effortlessly sophisticated, timeless elegance.",
    "zh-TW": "齊下巴齊切鮑伯配厚瀏海。巴黎時尚的乾淨線條，髮尾微內彎。輕鬆精緻，永恆優雅。",
  },
  "Ear-Length Bob": {
    en: "Cropped bob hitting just at or above ears. Clean geometric shape, can be blunt or slightly layered. Bold, modern, face-framing cut.",
    "zh-TW": "修短鮑伯剛好在耳朵或耳上。乾淨幾何形狀，可齊切或微層次。大膽現代的修容剪裁。",
  },
  "Bowl Cut Modern": {
    en: "Updated bowl shape with soft edges and texture. Rounded silhouette, fringe integrated into shape. Avant-garde, fashion-forward interpretation.",
    "zh-TW": "現代蘑菇頭配柔和邊緣和紋理。圓潤輪廓，瀏海融入造型。前衛時尚的詮釋。",
  },
  "Bixie Cut": {
    en: "Hybrid between bob and pixie - longer than pixie, shorter than bob. Textured, layered, versatile length. Modern transitional style.",
    "zh-TW": "鮑伯和精靈的混合 - 比精靈長，比鮑伯短。紋理、層次、多變長度。現代過渡風格。",
  },
  "Textured Pixie": {
    en: "Pixie with maximum texture and movement. Piece-y, choppy finish with varying lengths. Dimensional, lived-in appearance.",
    "zh-TW": "最大紋理和動感的精靈頭。髮束、層次效果配不同長度。立體、自然生活感外觀。",
  },

  // ============ FEMALE MEDIUM ============
  "Classic Bob": {
    en: "Timeless chin-to-jaw length bob with blunt ends. One-length or minimal layers, sleek finish. Can be worn straight or with soft wave. Elegant simplicity.",
    "zh-TW": "永恆齊下巴到下顎鮑伯配齊切髮尾。一長度或最少層次，順滑質感。可直髮或柔波造型。優雅簡約。",
  },
  "Layered Bob": {
    en: "Bob with graduated layers adding movement and volume. Face-framing pieces, bouncy finish. Lighter, more dynamic than blunt bob.",
    "zh-TW": "鮑伯配漸進層次增添動感和蓬鬆。修容髮片，彈性效果。比齊切鮑伯更輕盈動感。",
  },
  "Blunt Bob": {
    en: "Sharp, precise one-length cut at chin or jaw. No layers, clean horizontal line. Graphic, modern, high-impact style.",
    "zh-TW": "銳利精確的一長度剪裁在下巴或下顎。無層次，乾淨水平線條。圖形化、現代、高衝擊力風格。",
  },
  "A-Line Bob": {
    en: "Angular bob shorter in back, longer toward face. Graduated cutting creates dramatic angle. Flattering face-framing shape.",
    "zh-TW": "角度鮑伯後短前長。漸進剪裁創造戲劇性角度。討喜的修容形狀。",
  },
  "Shaggy Bob": {
    en: "Bob with heavy layers and razored texture. 70s-inspired, messy-chic appearance. Maximum volume and movement.",
    "zh-TW": "鮑伯配重層次和削刀紋理。70年代風格，凌亂時尚外觀。最大蓬鬆和動感。",
  },
  "Chin-Length Lob": {
    en: "Longer bob (lob) sitting at chin level. Versatile length for styling variety. Modern classic, universally flattering.",
    "zh-TW": "較長鮑伯在下巴位置。多變長度適合各種造型。現代經典，百搭討喜。",
  },
  "Wavy Bob": {
    en: "Bob styled with soft waves or curls. Romantic, beachy texture. Can be natural wave or heat-styled.",
    "zh-TW": "鮑伯配柔波或捲髮造型。浪漫海灘紋理。可自然波浪或熱造型。",
  },
  "Curtain Bangs Bob": {
    en: "Bob featuring face-framing curtain bangs parted at center. 70s-inspired, soft feminine framing. Universally flattering addition.",
    "zh-TW": "鮑伯配中分修容窗簾瀏海。70年代風格，柔和女性修容。百搭討喜的添加。",
  },

  // ============ FEMALE SHOULDER ============
  "Lob (Long Bob)": {
    en: "Collarbone-length bob - longer than classic bob, shorter than long hair. Versatile, low-maintenance, modern staple. Blunt or slightly layered ends.",
    "zh-TW": "鎖骨長度鮑伯 - 比經典鮑伯長，比長髮短。多變、低維護、現代必備。齊切或微層次髮尾。",
  },
  "Shoulder-Length Layers": {
    en: "Hair hitting shoulders with graduated layers throughout. Movement and volume, face-framing pieces. Classic versatile length.",
    "zh-TW": "及肩髮配全頭漸進層次。動感和蓬鬆，修容髮片。經典多變長度。",
  },
  "Shag Cut": {
    en: "Heavy layering creating volume at crown, wispy ends. 70s rock-inspired, lots of movement. Face-framing bangs often included.",
    "zh-TW": "重層次在頭頂創造蓬鬆，輕盈髮尾。70年代搖滾風格，大量動感。常配修容瀏海。",
  },
  "Wolf Cut": {
    en: "Mullet-shag hybrid with heavy layers and face-framing. Shorter at crown, longer at back and sides. Edgy, viral TikTok-famous style.",
    "zh-TW": "鯔魚頭和搖滾層次的混合，重層次和修容。頭頂較短，後方和兩側較長。前衛、TikTok爆紅風格。",
  },
  "Butterfly Cut": {
    en: "Dramatic face-framing layers creating butterfly wing effect. Shorter layers at face, longer underneath. Voluminous, bouncy silhouette.",
    "zh-TW": "戲劇性修容層次創造蝴蝶翅膀效果。臉部較短層次，下方較長。蓬鬆彈性輪廓。",
  },
  "Curtain Bangs": {
    en: "Shoulder-length with signature center-parted face-framing bangs. Soft, feathered pieces framing cheekbones. 70s revival, universally flattering.",
    "zh-TW": "及肩配標誌性中分修容瀏海。柔和羽毛髮片修飾顴骨。70年代復興，百搭討喜。",
  },
  "Textured Layers": {
    en: "Shoulder-length with choppy, piece-y layers throughout. Maximum texture and movement. Effortless, lived-in aesthetic.",
    "zh-TW": "及肩配全頭層次、髮束效果。最大紋理和動感。輕鬆自然生活感美學。",
  },
  "Blunt Cut": {
    en: "One-length shoulder cut with no layers. Clean, sharp horizontal line. Sleek, polished, modern minimalism.",
    "zh-TW": "一長度及肩剪裁無層次。乾淨銳利水平線條。順滑拋光現代極簡。",
  },

  // ============ FEMALE LONG ============
  "Long Layers": {
    en: "Long hair with graduated layers starting mid-length. Movement and body without sacrificing length. Classic versatile style.",
    "zh-TW": "長髮配從中段開始的漸進層次。動感和蓬鬆不犧牲長度。經典多變風格。",
  },
  "Face Framing Layers": {
    en: "Long hair with shorter pieces framing face. Subtle dimension, flattering around features. Soft, romantic effect.",
    "zh-TW": "長髮配修容較短髮片。微妙立體感，討喜修飾面部。柔和浪漫效果。",
  },
  "Beach Waves": {
    en: "Long hair with relaxed, tousled wave pattern. Salt-spray texture, sun-kissed appearance. Effortless coastal beauty.",
    "zh-TW": "長髮配輕鬆蓬亂波浪。海鹽噴霧紋理，陽光親吻外觀。輕鬆海岸美人。",
  },
  "Straight Sleek": {
    en: "Long, pin-straight hair with mirror-like shine. One-length or minimal layers, polished finish. Sophisticated, high-maintenance glamour.",
    "zh-TW": "長直髮如鏡面般光澤。一長度或最少層次，拋光效果。精緻高維護魅力。",
  },
  "V-Cut Layers": {
    en: "Long layers cut to form V-shape at back. Dramatic point at center back, graduated sides. Adds interest to long hair.",
    "zh-TW": "長層次剪裁形成後方V形。後中央戲劇性尖端，漸進兩側。為長髮增添趣味。",
  },
  "U-Cut Layers": {
    en: "Long layers forming soft U-shape at back. Rounded, softer alternative to V-cut. Classic, natural appearance.",
    "zh-TW": "長層次形成後方柔和U形。圓潤柔和的V型替代。經典自然外觀。",
  },
  "Feathered Layers": {
    en: "Long hair with soft, wispy layered ends flipping outward. 70s Farrah Fawcett-inspired. Bouncy, voluminous finish.",
    "zh-TW": "長髮配柔和輕盈層次髮尾向外翻。70年代Farrah Fawcett風格。彈性蓬鬆效果。",
  },
  "Mermaid Waves": {
    en: "Long flowing waves with maximum length and romance. Fairy-tale inspired, cascading curls. Fantasy, ethereal beauty.",
    "zh-TW": "長飄逸波浪，最大長度和浪漫感。童話風格，瀑布捲髮。夢幻空靈美。",
  },
  "Bohemian Long": {
    en: "Long, natural-textured hair with effortless styling. Soft waves, center part, artistic vibe. Free-spirited, organic beauty.",
    "zh-TW": "長自然紋理髮配輕鬆造型。柔波、中分、藝術氛圍。自由奔放、有機美。",
  },
  "Rapunzel Layers": {
    en: "Extra-long hair with minimal layers. Fairy-tale length, healthy sleek finish. Statement length, high maintenance.",
    "zh-TW": "超長髮配最少層次。童話長度，健康順滑效果。聲明式長度，高維護。",
  },
};

// Helper function to get translated text
export const t = (key: keyof typeof translations, lang: Language): string => {
  return translations[key]?.[lang] || translations[key]?.en || key;
};

// Helper function to get translated hairstyle name
export const getHairstyleName = (styleName: string, lang: Language): string => {
  return hairstyleNames[styleName]?.[lang] || styleName;
};

// Helper function to get translated hairstyle description
export const getHairstyleDesc = (styleName: string, gender: string, lang: Language): string => {
  // Try gender-specific key first
  const genderKey = `${styleName}_${gender}`;
  if (hairstyleDescriptions[genderKey]) {
    return hairstyleDescriptions[genderKey][lang] || hairstyleDescriptions[genderKey].en;
  }
  // Try generic key
  if (hairstyleDescriptions[styleName]) {
    return hairstyleDescriptions[styleName][lang] || hairstyleDescriptions[styleName].en;
  }
  // Fallback
  return `${styleName} hairstyle`;
};

// Hair length filter translations
export const getFilterLabel = (filterId: string, lang: Language): string => {
  const filterMap: Record<string, keyof typeof translations> = {
    all: "filterAll",
    buzz: "filterBuzz",
    short: "filterShort",
    medium: "filterMedium",
    shoulder: "filterShoulder",
    long: "filterLong",
  };
  const key = filterMap[filterId];
  return key ? t(key, lang) : filterId;
};

// Hair color translations
export const getColorName = (colorId: string, lang: Language): string => {
  const colorMap: Record<string, keyof typeof translations> = {
    natural: "colorNatural",
    jetBlack: "colorJetBlack",
    naturalBlack: "colorBlack",
    darkBrown: "colorDarkBrown",
    chocolateBrown: "colorChocolate",
    chestnut: "colorChestnut",
    auburn: "colorAuburn",
    mediumBrown: "colorMedBrown",
    lightBrown: "colorLightBrown",
    caramel: "colorCaramel",
    honeyBlonde: "colorHoney",
    goldenBlonde: "colorGolden",
    ashBlonde: "colorAsh",
    platinumBlonde: "colorPlatinum",
    strawberryBlonde: "colorStrawberry",
    ginger: "colorGinger",
    copper: "colorCopper",
    silver: "colorSilver",
  };
  const key = colorMap[colorId];
  return key ? t(key, lang) : colorId;
};

