/**
 * News & breakthroughs shown on the farmer home screen.
 * ILLUSTRATIVE content for the prototype: summaries of widely used Kharif
 * practices and forecasting ideas, not reports of specific real events.
 * A real deployment would load these from a curated, reviewed feed.
 */
import type { Lang } from "@/types";

export type NewsCategory = "research" | "weather" | "scheme" | "technique" | "water";

export interface NewsItem {
  id: string;
  category: NewsCategory;
  date: string; // ISO
  source: string;
  readMin: number;
  title: Record<Lang, string>;
  summary: Record<Lang, string>;
  body: Record<Lang, string[]>;
  takeaways: Record<Lang, string[]>;
}

export const NEWS: NewsItem[] = [
  {
    id: "short-duration-soybean",
    category: "research",
    date: "2026-06-10",
    source: "Agri research digest",
    readMin: 2,
    title: {
      en: "Short-duration soybean handles monsoon breaks better",
      hi: "कम अवधि की सोयाबीन मानसून के अंतराल को बेहतर झेलती है",
      mr: "कमी कालावधीचे सोयाबीन पावसाचा खंड अधिक चांगला सहन करते",
    },
    summary: {
      en: "Field trials in Marathwada show 90-day varieties lose less yield when a dry spell follows sowing.",
      hi: "मराठवाड़ा के खेत परीक्षणों में 90 दिन की किस्मों में बुवाई के बाद सूखा पड़ने पर कम नुकसान हुआ।",
      mr: "मराठवाड्यातील प्रयोगांत पेरणीनंतर खंड पडल्यास ९० दिवसांच्या वाणांचे उत्पादन कमी घटले.",
    },
    body: {
      en: [
        "Across several Marathwada villages, farmers compared short-duration soybean varieties (about 90 days) with longer ones in seasons that had a two- to three-week dry spell soon after sowing.",
        "The shorter varieties finished pod filling before the late-season moisture ran out, and plots sown on broad beds kept more water in the root zone.",
        "Researchers say variety choice works best together with correct sowing time: wait for enough rain and check the outlook for a dry spell before you sow.",
      ],
      hi: [
        "मराठवाड़ा के कई गाँवों में किसानों ने उन मौसमों में कम अवधि (लगभग 90 दिन) और लंबी अवधि की सोयाबीन की तुलना की, जिनमें बुवाई के तुरंत बाद दो से तीन सप्ताह का सूखा अंतराल आया।",
        "कम अवधि की किस्मों में देर के मौसम में नमी खत्म होने से पहले फलियाँ भर गईं, और चौड़ी क्यारी पर बोए खेतों में जड़ों के पास ज़्यादा नमी रही।",
        "शोधकर्ताओं के अनुसार किस्म का चुनाव सही बुवाई समय के साथ सबसे अच्छा काम करता है: पर्याप्त बारिश का इंतज़ार करें और बोने से पहले सूखे अंतराल का पूर्वानुमान देखें।",
      ],
      mr: [
        "मराठवाड्यातील अनेक गावांत, पेरणीनंतर लगेच दोन ते तीन आठवड्यांचा खंड पडलेल्या हंगामांत शेतकऱ्यांनी कमी कालावधीचे (सुमारे ९० दिवस) आणि जास्त कालावधीचे सोयाबीन यांची तुलना केली.",
        "कमी कालावधीच्या वाणांत उशिराचा ओलावा संपण्यापूर्वी शेंगा भरल्या, आणि रुंद वरंब्यावर पेरलेल्या शेतात मुळांजवळ जास्त ओलावा टिकला.",
        "संशोधकांच्या मते वाणाची निवड योग्य पेरणी वेळेसोबत सर्वात चांगली ठरते: पुरेशा पावसाची वाट पहा आणि पेरणीपूर्वी खंडाचा अंदाज तपासा.",
      ],
    },
    takeaways: {
      en: ["Ask your seed dealer for a 90-day soybean variety.", "Combine it with BBF sowing to hold moisture.", "Still wait for the right sowing window."],
      hi: ["बीज विक्रेता से 90 दिन की सोयाबीन किस्म माँगें।", "नमी बचाने के लिए इसे चौड़ी क्यारी (BBF) बुवाई के साथ अपनाएँ।", "फिर भी बुवाई के सही समय का इंतज़ार करें।"],
      mr: ["बियाणे विक्रेत्याकडे ९० दिवसांचे सोयाबीन वाण मागा.", "ओलावा टिकवण्यासाठी रुंद वरंबा सरी (BBF) पेरणीसोबत वापरा.", "तरीही पेरणीच्या योग्य वेळेची वाट पहा."],
    },
  },
  {
    id: "mjo-early-warning",
    category: "weather",
    date: "2026-06-08",
    source: "Monsoon science explainer",
    readMin: 3,
    title: {
      en: "How a rain pulse over the ocean warns of dry spells weeks ahead",
      hi: "समुद्र पर बारिश की एक लहर हफ़्तों पहले सूखे की चेतावनी कैसे देती है",
      mr: "समुद्रावरील पावसाची लाट आठवडे आधी खंडाचा इशारा कसा देते",
    },
    summary: {
      en: "Tracking the Madden-Julian Oscillation (MJO) helps forecasters spot monsoon breaks 2-3 weeks in advance.",
      hi: "मैडेन-जूलियन ऑसिलेशन (MJO) पर नज़र रखकर मानसून के अंतराल 2-3 सप्ताह पहले पहचाने जा सकते हैं।",
      mr: "मॅडेन-ज्युलियन ऑसिलेशन (MJO) चा मागोवा घेऊन पावसाचे खंड २-३ आठवडे आधी ओळखता येतात.",
    },
    body: {
      en: [
        "The MJO is a large band of clouds and rain that moves eastward around the tropics every 30 to 60 days. When it sits over the Indian Ocean, India often gets active monsoon rain.",
        "When the pulse moves away towards the Pacific, rain over India usually weakens and a break can follow. Because the movement is fairly regular, it gives a useful signal two to three weeks ahead.",
        "VarshaVani combines this signal with the Pacific (El Niño) and Indian Ocean Dipole conditions, then downscales it to your block. That is why the app sometimes says 'wait' even after good early rain.",
      ],
      hi: [
        "MJO बादलों और बारिश की एक बड़ी पट्टी है जो हर 30 से 60 दिनों में उष्ण कटिबंध के चारों ओर पूर्व की ओर बढ़ती है। जब यह हिंद महासागर पर होती है, तब भारत में अक्सर अच्छी मानसून बारिश होती है।",
        "जब यह लहर प्रशांत महासागर की ओर चली जाती है, तो भारत में बारिश आमतौर पर कमज़ोर होती है और अंतराल आ सकता है। इसकी चाल काफ़ी नियमित होने से यह दो से तीन सप्ताह पहले उपयोगी संकेत देती है।",
        "वर्षावाणी इस संकेत को प्रशांत (एल नीनो) और हिंद महासागर द्विध्रुव की स्थिति के साथ जोड़कर आपके ब्लॉक तक पहुँचाता है। इसलिए अच्छी शुरुआती बारिश के बाद भी ऐप कभी-कभी 'रुकें' कहता है।",
      ],
      mr: [
        "MJO हा ढग आणि पावसाचा मोठा पट्टा आहे जो दर ३० ते ६० दिवसांनी उष्ण कटिबंधाभोवती पूर्वेकडे सरकतो. तो हिंदी महासागरावर असताना भारतात अनेकदा चांगला मान्सून पाऊस पडतो.",
        "ही लाट प्रशांत महासागराकडे सरकली की भारतात पाऊस साधारणपणे कमी होतो आणि खंड पडू शकतो. तिची हालचाल बऱ्यापैकी नियमित असल्याने ती दोन ते तीन आठवडे आधी उपयुक्त संकेत देते.",
        "वर्षावाणी हा संकेत प्रशांत (एल निनो) आणि हिंदी महासागर द्विध्रुव स्थितीसोबत जोडून तुमच्या तालुक्यापर्यंत आणतो. म्हणूनच चांगल्या सुरुवातीच्या पावसानंतरही ॲप कधी कधी 'थांबा' सांगते.",
      ],
    },
    takeaways: {
      en: ["Early rain is not always the monsoon.", "Check the 4-week outlook before sowing.", "Weeks 3-4 are less certain; look again each week."],
      hi: ["शुरुआती बारिश हमेशा मानसून नहीं होती।", "बुवाई से पहले 4 सप्ताह का पूर्वानुमान देखें।", "सप्ताह 3-4 कम निश्चित हैं; हर सप्ताह फिर देखें।"],
      mr: ["सुरुवातीचा पाऊस नेहमी मान्सून नसतो.", "पेरणीपूर्वी ४ आठवड्यांचा अंदाज पहा.", "आठवडे ३-४ कमी निश्चित असतात; दर आठवड्याला पुन्हा पहा."],
    },
  },
  {
    id: "bbf-sowing",
    category: "technique",
    date: "2026-06-05",
    source: "Krishi extension notes",
    readMin: 2,
    title: {
      en: "Broad bed furrow sowing: one method for both dry and wet weeks",
      hi: "चौड़ी क्यारी-नाली बुवाई: सूखे और गीले दोनों सप्ताहों के लिए एक तरीका",
      mr: "रुंद वरंबा सरी पेरणी: कोरड्या आणि ओल्या दोन्ही आठवड्यांसाठी एक पद्धत",
    },
    summary: {
      en: "Raised beds hold rain in a dry spell and drain extra water during heavy rain.",
      hi: "ऊँची क्यारियाँ सूखे में बारिश का पानी रोकती हैं और भारी बारिश में अतिरिक्त पानी निकालती हैं।",
      mr: "उंच वरंबे खंडात पावसाचे पाणी धरून ठेवतात आणि मुसळधार पावसात जास्तीचे पाणी काढतात.",
    },
    body: {
      en: [
        "In broad bed furrow (BBF) sowing, crops are planted on raised beds about 1 to 1.5 metres wide, with a furrow on each side.",
        "During a dry spell, the furrows catch and hold rain so it soaks into the beds. During heavy rain, the same furrows carry extra water away so roots do not sit in water.",
        "A BBF planter can make beds and sow in one pass. Many agriculture offices and farmer groups rent them out during Kharif.",
      ],
      hi: [
        "चौड़ी क्यारी-नाली (BBF) बुवाई में फ़सल लगभग 1 से 1.5 मीटर चौड़ी ऊँची क्यारियों पर बोई जाती है, और दोनों तरफ़ नाली होती है।",
        "सूखे अंतराल में नालियाँ बारिश का पानी रोकती हैं ताकि वह क्यारियों में समा जाए। भारी बारिश में यही नालियाँ अतिरिक्त पानी बाहर निकालती हैं ताकि जड़ें पानी में न डूबें।",
        "BBF प्लांटर एक ही बार में क्यारी बनाकर बुवाई कर सकता है। कई कृषि कार्यालय और किसान समूह खरीफ में इसे किराए पर देते हैं।",
      ],
      mr: [
        "रुंद वरंबा सरी (BBF) पेरणीत पीक सुमारे १ ते १.५ मीटर रुंद उंच वरंब्यावर पेरले जाते, आणि दोन्ही बाजूला सरी असते.",
        "खंडाच्या काळात सऱ्या पावसाचे पाणी धरून ठेवतात त्यामुळे ते वरंब्यात मुरते. मुसळधार पावसात त्याच सऱ्या जास्तीचे पाणी बाहेर काढतात त्यामुळे मुळे पाण्यात राहत नाहीत.",
        "BBF यंत्र एकाच फेरीत वरंबे तयार करून पेरणी करू शकते. अनेक कृषी कार्यालये आणि शेतकरी गट खरिपात ते भाड्याने देतात.",
      ],
    },
    takeaways: {
      en: ["Works well for soybean, tur and cotton.", "Ask your agriculture office about renting a BBF planter.", "Keep furrow ends open during heavy rain."],
      hi: ["सोयाबीन, तुअर और कपास के लिए अच्छा।", "BBF प्लांटर किराए पर लेने के लिए कृषि कार्यालय से पूछें।", "भारी बारिश में नाली के सिरे खुले रखें।"],
      mr: ["सोयाबीन, तूर आणि कापसासाठी उपयुक्त.", "BBF यंत्र भाड्याने घेण्यासाठी कृषी कार्यालयाकडे विचारा.", "मुसळधार पावसात सरीची टोके उघडी ठेवा."],
    },
  },
  {
    id: "crop-insurance-sowing",
    category: "scheme",
    date: "2026-06-03",
    source: "Farmer scheme guide",
    readMin: 2,
    title: {
      en: "Crop insurance: know your cover before you sow",
      hi: "फ़सल बीमा: बुवाई से पहले अपना कवर जानें",
      mr: "पीक विमा: पेरणीपूर्वी तुमचे संरक्षण जाणून घ्या",
    },
    summary: {
      en: "Schemes like PMFBY can cover prevented sowing and local losses, if you enrol in time and report quickly.",
      hi: "PMFBY जैसी योजनाएँ रुकी हुई बुवाई और स्थानीय नुकसान को कवर कर सकती हैं, अगर आप समय पर जुड़ें और जल्दी सूचना दें।",
      mr: "PMFBY सारख्या योजना पेरणी न होणे आणि स्थानिक नुकसान यांना संरक्षण देऊ शकतात, जर वेळेत नोंदणी केली आणि लवकर कळवले तर.",
    },
    body: {
      en: [
        "Under crop insurance schemes such as the Pradhan Mantri Fasal Bima Yojana (PMFBY), farmers pay a small share of the premium and the government pays the rest.",
        "Cover can include sowing that was prevented by poor rain, and local losses such as waterlogging after heavy rain. Enrolment has a deadline each season, through your bank, a common service centre or the scheme portal.",
        "If your crop is damaged, report it quickly, usually within 72 hours, to the insurer, your bank or the agriculture office. Keep photos and your sowing details ready.",
      ],
      hi: [
        "प्रधानमंत्री फ़सल बीमा योजना (PMFBY) जैसी योजनाओं में किसान प्रीमियम का छोटा हिस्सा देते हैं और बाकी सरकार देती है।",
        "कवर में कम बारिश के कारण न हो पाई बुवाई और भारी बारिश के बाद जलभराव जैसे स्थानीय नुकसान शामिल हो सकते हैं। हर मौसम में नामांकन की अंतिम तारीख होती है, बैंक, कॉमन सर्विस सेंटर या योजना पोर्टल के ज़रिए।",
        "फ़सल को नुकसान हो तो जल्दी, आमतौर पर 72 घंटे के भीतर, बीमा कंपनी, बैंक या कृषि कार्यालय को सूचना दें। फ़ोटो और बुवाई की जानकारी तैयार रखें।",
      ],
      mr: [
        "प्रधानमंत्री पीक विमा योजना (PMFBY) सारख्या योजनांत शेतकरी हप्त्याचा लहान भाग भरतात आणि उरलेला सरकार भरते.",
        "संरक्षणात कमी पावसामुळे न झालेली पेरणी आणि मुसळधार पावसानंतर पाणी साचणे यांसारखे स्थानिक नुकसान येऊ शकते. प्रत्येक हंगामात नोंदणीची अंतिम तारीख असते, बँक, सामायिक सेवा केंद्र किंवा योजनेच्या पोर्टलद्वारे.",
        "पिकाचे नुकसान झाल्यास लवकर, साधारणपणे ७२ तासांच्या आत, विमा कंपनी, बँक किंवा कृषी कार्यालयाला कळवा. फोटो आणि पेरणीची माहिती तयार ठेवा.",
      ],
    },
    takeaways: {
      en: ["Check this season's enrolment deadline.", "Report crop loss within about 72 hours.", "Kisan Call Centre: 1800-180-1551."],
      hi: ["इस मौसम की नामांकन अंतिम तारीख जाँचें।", "फ़सल नुकसान की सूचना लगभग 72 घंटे में दें।", "किसान कॉल सेंटर: 1800-180-1551।"],
      mr: ["या हंगामाची नोंदणीची अंतिम तारीख तपासा.", "पीक नुकसान सुमारे ७२ तासांत कळवा.", "किसान कॉल सेंटर: 1800-180-1551."],
    },
  },
  {
    id: "farm-pond-lifesaving",
    category: "water",
    date: "2026-06-01",
    source: "Water conservation stories",
    readMin: 2,
    title: {
      en: "One life-saving irrigation from a farm pond can save a Kharif crop",
      hi: "खेत तालाब से एक जीवनरक्षक सिंचाई खरीफ फ़सल बचा सकती है",
      mr: "शेततळ्यातून एक संरक्षक पाणी खरीप पीक वाचवू शकते",
    },
    summary: {
      en: "Stored runoff from early showers gives one irrigation at the most critical stage during a long break.",
      hi: "शुरुआती बारिश का जमा पानी लंबे अंतराल में सबसे नाज़ुक अवस्था पर एक सिंचाई देता है।",
      mr: "सुरुवातीच्या पावसाचे साठवलेले पाणी लांब खंडात सर्वात नाजूक अवस्थेत एक पाणी देते.",
    },
    body: {
      en: [
        "A lined farm pond collects runoff from the first heavy showers. Even a small pond can store enough for one light irrigation of an acre or two.",
        "The biggest benefit comes when that water is given at flowering or pod filling during a dry spell, the stages where yield drops most.",
        "Many states support farm ponds under water-conservation programmes. Your agriculture office can tell you about current support in your block.",
      ],
      hi: [
        "प्लास्टिक से ढका खेत तालाब पहली भारी बारिश का बहता पानी जमा करता है। छोटा तालाब भी एक-दो एकड़ की एक हल्की सिंचाई के लिए पानी रख सकता है।",
        "सबसे ज़्यादा फ़ायदा तब होता है जब यह पानी सूखे अंतराल में फूल आने या फलियाँ भरने के समय दिया जाए, जब उपज सबसे ज़्यादा घटती है।",
        "कई राज्य जल संरक्षण कार्यक्रमों के तहत खेत तालाब में मदद देते हैं। आपके ब्लॉक में मौजूदा सहायता के बारे में कृषि कार्यालय बता सकता है।",
      ],
      mr: [
        "अस्तरीकरण केलेले शेततळे पहिल्या मोठ्या पावसाचे वाहून जाणारे पाणी साठवते. लहान तळेसुद्धा एक-दोन एकरांना एक हलके पाणी देण्याइतके पाणी साठवू शकते.",
        "सर्वात जास्त फायदा तेव्हा होतो जेव्हा हे पाणी खंडाच्या काळात फुलोरा किंवा शेंगा भरण्याच्या अवस्थेत दिले जाते, जेव्हा उत्पादन सर्वाधिक घटते.",
        "अनेक राज्ये जलसंधारण कार्यक्रमांतर्गत शेततळ्यासाठी मदत देतात. तुमच्या तालुक्यातील सध्याच्या मदतीबद्दल कृषी कार्यालय सांगू शकते.",
      ],
    },
    takeaways: {
      en: ["Save stored water for flowering or pod filling.", "Give a light irrigation (about 25 mm).", "Ask about farm pond support in your block."],
      hi: ["जमा पानी फूल या फलियाँ भरने के समय के लिए बचाएँ।", "हल्की सिंचाई (लगभग 25 मिमी) दें।", "अपने ब्लॉक में खेत तालाब सहायता के बारे में पूछें।"],
      mr: ["साठवलेले पाणी फुलोरा किंवा शेंगा भरण्यासाठी राखा.", "हलके पाणी (सुमारे २५ मिमी) द्या.", "तुमच्या तालुक्यात शेततळे मदतीबद्दल विचारा."],
    },
  },
];

export const NEWS_BY_ID: Record<string, NewsItem> = Object.fromEntries(NEWS.map((n) => [n.id, n]));
