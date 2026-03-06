# Free Deployment Guide (Myanmar Language) 🇲🇲

သင့်ရဲ့ Video Downloader app ကို ပိုက်ဆံမကုန်ဘဲ free deploy လုပ်ဖို့ အကောင်းဆုံးနည်းလမ်းတွေကို အောက်မှာ အသေးစိတ် ရှင်းပြပေးထားပါတယ်။

ဒီ app က `yt-dlp` နဲ့ `ffmpeg` လိုမျိုး binary တွေ လိုအပ်တဲ့အတွက် သာမန် hosting တွေမှာ run ရတာ ခက်နိုင်ပါတယ်။ ဒါကြောင့် **Docker** ကို အခြေခံပြီး deploy လုပ်တာက အသေချာဆုံးပါ။

## ၁။ Backend အားလုံးအတွက် အကောင်းဆုံး Free Hosting (Koyeb သို့မဟုတ် Render)

### **Render.com (အသုံးအများဆုံး)**
Render ရဲ့ Free Tier မှာ Docker ကို သုံးပြီး deploy လုပ်လို့ရပါတယ်။ 

1. **GitHub သို့ တင်ပါ**: သင့် code တွေကို GitHub repository တစ်ခုထဲ အရင်တင်ထားပါ။
2. **New Web Service**: Render dashboard မှာ "New Web Service" ကို နှိပ်ပြီး GitHub repo ကို ချိတ်ပါ။
3. **Environment**: Runtime နေရာမှာ **Docker** ကို ရွေးပါ။
4. **Environment Variables**: `.env` ထဲမှာရှိတဲ့ variable တွေ (MONGO_URI, CLOUDINARY_...) အားလုံးကို Render ရဲ့ 'Environment' tab မှာ ထည့်ပေးပါ။
5. **Deploy**: Render က backend Dockerfile ကို ဖတ်ပြီး အလိုအလျောက် setup လုပ်ပေးသွားမှာပါ။

### **Koyeb.com (ပိုမြန်ပြီး resource ပိုရနိုင်)**
Koyeb က Docker အတွက် အရမ်းကောင်းပါတယ်။

---

## ၂။ Database (MongoDB Atlas)

Database အတွက် **MongoDB Atlas (M0 Free Tier)** ကို သုံပါ။ 
- Cloud မှာ database အခမဲ့ ဆောက်ပြီး ရလာတဲ့ connection string (MONGO_URI) ကို backend မှာ ထည့်ပေးရမှာပါ။

---

## ၃။ Frontend (Vercel သို့မဟုတ် Netlify)

Frontend ကတော့ Static Site ဖြစ်တဲ့အတွက် **Vercel** ဒါမှမဟုတ် **Netlify** မှာ deploy လုပ်တာ အကောင်းဆုံးပါ။

1. Vercel မှာ GitHub repo ကို ချိတ်ပါ။
2. **Base Directory**: `frontend` လို့ ရွေးပေးပါ။
3. **Build Command**: `npm run build`
4. **Output Directory**: `dist`
5. **Environment Variables**: `VITE_API_BASE_URL` နေရာမှာ စောစောက deploy ထားတဲ့ Backend URL ကို ထည့်ပေးပါ။

---

## အကျဉ်းချုပ် လုပ်ဆောင်ရမယ့် အဆင့်များ (Steps Summary)

၁။ Code တွေကို GitHub မှာ private repo နဲ့ အရင်တင်ပါ။
၂။ MongoDB Atlas မှာ အခမဲ့ Account ဖွင့်ပြီး connection string ယူပါ။
၃။ Render (သို့မဟုတ်) Koyeb မှာ Backend ကို Docker သုံးပြီးတင်ပါ။
၄။ Vercel မှာ Frontend ကိုတင်ပြီး Backend URL နဲ့ ချိတ်ပါ။

**မှတ်ချက်**: Free hosting တွေဖြစ်တဲ့အတွက် web traffic အရမ်းများရင် ဒါမှမဟုတ် video အကြီးကြီးတွေ ဆွဲရင်တော့ slow ဖြစ်နိုင်ပါတယ်။ ဒါပေမဲ့ တစ်ကိုယ်ရေသုံးဖို့အတွက်ကတော့ ဒီနည်းလမ်းတွေက အရမ်းအဆင်ပြေပါတယ်။

နောက်ထပ် အသေးစိတ် သိချင်တာ ရှိရင်လည်း မေးလို့ရပါတယ်!
