import { GoogleGenAI } from "@google/genai";
import nodemailer from "nodemailer";

export default async (req) => {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

  const today = new Date().toLocaleDateString("fa-IR", {
    timeZone: "Asia/Tehran",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const prompt = `
امروز ${today} است. تو دستیار تخصصی پژوهش و آموزش هوش مصنوعی برای «دکتر محمد آرمش» (مدرس هوش مصنوعی و فناوری‌های نوین) هستی.
با استفاده از جستجوی زنده گوگل، جدیدترین ابزارها و اخبار هوش مصنوعی رونمایی‌شده در ۲۴ تا ۴۸ ساعت گذشته را پیدا کن و یک جزوه آموزشی جامع، ساختاریافته و کاربردی به زبان فارسی بنویس که شامل بخش‌های زیر باشد:

1. **جدیدترین اخبار و ابزارهای هوش مصنوعی رونمایی‌شده:**
   - معرفی ۳ تا ۴ ابزار یا مدل جدید و مهم روز، لینک یا نام دقیق، کاربرد اصلی و نحوه کار کردن با هر کدام به زبان ساده و آموزشی برای تدریس در کارگاه‌ها.

2. **بخش تخصصی عکاسی عروس و داماد و آتلیه:**
   - معرفی ترفند یا ابزار روز برای روتوش، نورپردازی، ساخت دکور یا ویدئوهای سینمایی عروسی.
   - ارائه ۳ پرامپت حرفه‌ای و آماده (به زبان انگلیسی همراه با توضیح فارسی کاربرد هرکدام) برای عکاسی آتلیه، ژست عروس و داماد و فضاسازی لوکس.

3. **بخش تخصصی دانشجویان و پژوهشگران:**
   - معرفی روش یا ابزار کاربردی برای مقاله‌نویسی، تحلیل داده، پایان‌نامه و یادگیری عمیق.
   - ارائه ۲ پرامپت تخصصی و ساختاریافته برای پژوهش، خلاصه‌سازی مقالات و تحلیل علمی.

4. **بخش تخصصی معادن و صنایع معدنی:**
   - کاربرد جدید هوش مصنوعی در اکتشاف، تحلیل داده‌های زمین‌شناسی، پایش ایمنی یا بهینه‌سازی فرآیندهای معدنی.
   - ارائه ۲ پرامپت تخصصی برای تحلیل گزارش‌های اکتشافی، داده‌های ژئوشیمی و بهره‌وری معدن.

خروجی را با HTML تمیز، راست‌به‌چپ (dir="rtl")، فونت خوانا و تیتربندی حرفه‌ای آماده کن تا مستقیم در ایمیل نمایش داده شود. از نوشتن کدهای اضافه مثل \`\`\`html در ابتدا و انتها خودداری کن.
`;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
    config: {
      tools: [{ googleSearch: {} }],
    },
  });

  const htmlReport = response.text;

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
  });

  const isoDate = new Date().toISOString().split("T")[0];

  await transporter.sendMail({
    from: `"دستیار هوشمند مورب" <${process.env.GMAIL_USER}>`,
    to: "mohammadarmeshai@gmail.com",
    subject: `گزارش روزانه هوش مصنوعی و جزوه آموزشی - ${isoDate}`,
    html: `<div dir="rtl" style="font-family: Tahoma, Arial, sans-serif; line-height: 1.8; color: #1f2937; max-width: 800px; margin: auto;">${htmlReport}</div>`,
  });

  return new Response("Report sent successfully", { status: 200 });
};