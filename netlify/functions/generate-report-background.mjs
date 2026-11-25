import nodemailer from "nodemailer";

export default async function handler(req) {
  try {
    const cronSecret = process.env.CRON_SECRET;
    if (cronSecret) {
      const authHeader = req.headers.get("authorization");
      const providedSecret =
        req.headers.get("x-cron-secret") ||
        (authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null);

      if (providedSecret !== cronSecret) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
          headers: { "Content-Type": "application/json" },
        });
      }
    }

    const groqApiKey = process.env.GROQ_API_KEY;
    const gmailUser = process.env.GMAIL_USER;
    const gmailAppPassword = process.env.GMAIL_APP_PASSWORD;

    if (!groqApiKey || !gmailUser || !gmailAppPassword) {
      throw new Error(
        "Missing required environment variables (GROQ_API_KEY, GMAIL_USER, GMAIL_APP_PASSWORD)."
      );
    }

    const systemPrompt =
      "شما دستیار پژوهش و آموزش هوش مصنوعی برای دکتر محمد آرمش هستید. گزارش روزانه را به زبان فارسی روان، دقیق، ساختاریافته و کاربردی بنویسید.";

    const userPrompt = `
یک بسته آموزشی و گزارش روزانه حرفه‌ای با عنوان «بسته روزانه هوش مصنوعی» تهیه کن که شامل بخش‌های زیر باشد:
1. مهم‌ترین اخبار و تحولات دنیای هوش مصنوعی
2. ابزارهای کاربردی جدید و روش استفاده عملی آن‌ها در تدریس و تولید محتوا
3. پرامپت‌های تخصصی و آماده استفاده در سه حوزه:
   - عکاسی و آتلیه
   - معدن و صنایع معدنی
   - پژوهش و نگارش علمی دانشجویان
خروجی را با تیترهای منظم و خوانا ارائه بده.
`;

    const groqResponse = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${groqApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          temperature: 0.7,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
        }),
      }
    );

    if (!groqResponse.ok) {
      const errorText = await groqResponse.text();
      throw new Error(`Groq API error (${groqResponse.status}): ${errorText}`);
    }

    const groqData = await groqResponse.json();
    const reportText =
      groqData?.choices?.[0]?.message?.content?.trim() ||
      "گزارش امروز تولید نشد.";

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: gmailUser,
        pass: gmailAppPassword,
      },
    });

    const todayStr = new Date().toISOString().slice(0, 10);

    await transporter.sendMail({
      from: `"بسته روزانه هوش مصنوعی" <${gmailUser}>`,
      to: "mohammadarmeshai@gmail.com",
      subject: `بسته روزانه هوش مصنوعی - ${todayStr}`,
      text: reportText,
    });

    return new Response(
      JSON.stringify({ ok: true, message: "Report generated and sent." }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    console.error("Error in generate-report-background:", err);
    return new Response(
      JSON.stringify({ ok: false, error: err?.message || "Unknown error" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
