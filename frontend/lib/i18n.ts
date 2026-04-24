import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  en: {
    translation: {
      "app_name": "BAGA",
      "app_subtitle": "Governance Agent",
      "ai_online": "AI Online",
      "logout": "Logout",
      "welcome": "Welcome back",
      "submit_complaint": "Submit a Complaint",
      "track_complaint": "Track Complaint",
      "track_status": "Track Status",
      "built_for_india": "Built for Digital India",
      "select_language": "Language",
      "hero_badge": "Powered by Agentic AI",
      "hero_title_1": "Bharat Autonomous",
      "hero_title_2": "Governance Agent",
      "hero_desc_1": "Submit your complaint in any language. Our AI automatically identifies the issue, routes it to the correct",
      "hero_desc_highlight": "government department",
      "hero_desc_2": ", and predicts resolution time.",
      "feat_classification": "AI Classification",
      "feat_routing": "Auto Routing",
      "feat_prediction": "Time Prediction",
      "home": "Home",
      "dashboard": "Dashboard",
      "complaints": "Complaints",
      "settings": "Settings",
      "marathi": "Marathi",
      "hindi": "Hindi",
      "english": "English"
    }
  },
  hi: {
    translation: {
      "app_name": "बागा",
      "app_subtitle": "शासन एजेंट",
      "ai_online": "एआई ऑनलाइन",
      "logout": "लॉगआउट",
      "welcome": "वापसी पर स्वागत है",
      "submit_complaint": "शिकायत दर्ज करें",
      "track_complaint": "शिकायत ट्रैक करें",
      "track_status": "ट्रैक स्थिति",
      "built_for_india": "डिजिटल इंडिया के लिए निर्मित",
      "select_language": "भाषा",
      "hero_badge": "एजेंटिक एआई द्वारा संचालित",
      "hero_title_1": "भारत स्वायत्त",
      "hero_title_2": "शासन एजेंट",
      "hero_desc_1": "अपनी शिकायत किसी भी भाषा में दर्ज करें। हमारा एआई स्वचालित रूप से समस्या की पहचान करता है, इसे सही",
      "hero_desc_highlight": "सरकारी विभाग",
      "hero_desc_2": " को भेजता है, और समाधान के समय का अनुमान लगाता है।",
      "feat_classification": "एआई वर्गीकरण",
      "feat_routing": "ऑटो रूटिंग",
      "feat_prediction": "समय का अनुमान",
      "home": "होम",
      "dashboard": "डैशबोर्ड",
      "complaints": "शिकायतें",
      "settings": "सेटिंग्स",
      "marathi": "मराठी",
      "hindi": "हिंदी",
      "english": "अंग्रेज़ी"
    }
  },
  mr: {
    translation: {
      "app_name": "बागा",
      "app_subtitle": "प्रशासन एजंट",
      "ai_online": "एआय ऑनलाइन",
      "logout": "बाहेर पडा",
      "welcome": "पुन्हा स्वागत आहे",
      "submit_complaint": "तक्रार नोंदवा",
      "track_complaint": "तक्रार ट्रॅक करा",
      "track_status": "स्थिती ट्रॅक करा",
      "built_for_india": "डिजिटल इंडियासाठी बनवलेले",
      "select_language": "भाषा",
      "hero_badge": "एजंट एआय द्वारे समर्थित",
      "hero_title_1": "भारत स्वायत्त",
      "hero_title_2": "प्रशासन एजंट",
      "hero_desc_1": "तुमची तक्रार कोणत्याही भाषेत नोंदवा. आमचे एआय आपोआप समस्या ओळखते, ती योग्य",
      "hero_desc_highlight": "सरकारी विभागाकडे",
      "hero_desc_2": " पाठवते आणि निराकरणाच्या वेळेचा अंदाज लावते.",
      "feat_classification": "एआय वर्गीकरण",
      "feat_routing": "ऑटो रूटिंग",
      "feat_prediction": "वेळेचा अंदाज",
      "home": "होम",
      "dashboard": "डॅशबोर्ड",
      "complaints": "तक्रारी",
      "settings": "सेटिंग्ज",
      "marathi": "मराठी",
      "hindi": "हिंदी",
      "english": "इंग्रजी"
    }
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'en',
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;
