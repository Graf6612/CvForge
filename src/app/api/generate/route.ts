import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { createClient } from "@/lib/supabase/server";

// Ignore TypeScript errors for pdf-parse, CommonJS import works best dynamically
const pdfParse = require("pdf-parse");

export const maxDuration = 60; // This tells Vercel to allow up to 60s for OpenAI generation

// OpenAI is initialized inside the request to catch missing API key errors safely

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();

    // Initialize OpenAI client inside try/catch so missing keys are reported nicely
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "API Ключ OpenAI не налаштовано на сервері (Vercel)." },
        { status: 500 }
      );
    }
    
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    
    // 1. Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: "Ви повинні бути авторизовані для цього запиту" },
        { status: 401 }
      );
    }

    const contentType = req.headers.get("content-type") || "";
    let resumeText = "";
    let jobDescription = "";
    let tone = "";
    let type = "";
    let builderData: any = null;

    if (contentType.includes("application/json")) {
      const body = await req.json();
      type = "cv-builder";
      builderData = body.data;
      jobDescription = body.goal || "";
    } else {
      const formData = await req.formData();
      const resumeFile = formData.get("resume") as File;
      jobDescription = formData.get("jobDescription") as string;
      tone = formData.get("tone") as string;
      type = formData.get("type") as string;

      if (!resumeFile || !jobDescription) {
        return NextResponse.json(
          { error: "Resume and job description are required" },
          { status: 400 }
        );
      }

      const bytes = await resumeFile.arrayBuffer();
      const buffer = Buffer.from(bytes);
      
      try {
        const data = await pdfParse(buffer);
        resumeText = data.text;
        
        if (!resumeText || resumeText.trim().length === 0) {
          throw new Error("Не вдалося прочитати текст з цього PDF. Файл може бути пошкодженим або мати лише зображення.");
        }
      } catch (pdfError: any) {
        console.error("PDF Parse error:", pdfError);
        return NextResponse.json(
          { error: "Не вдалося розпізнати PDF-файл. Переконайтеся, що файл містить текст, а не лише картинку (або скасуйте пароль)." },
          { status: 400 }
        );
      }
    }

    let systemPrompt = "";
    let userPrompt = "";

    if (type === "cv-builder") {
      systemPrompt = `Ти — дизайнер та HR-експерт. Твоя задача:
1. Перетворити сирі дані кандидата на професійне резюме.
2. Покращити тексти (використовуй активні дієслова, додай структуру).
3. Повернути результат ВИКЛЮЧНО у вигляді чистого, семантичного HTML-коду з Tailwind CSS (без тегів \`\`\`html).
4. Дизайн має бути преміальним, на білому фоні (як аркуш А4), з чіткими заголовками та ідеальними відступами.
Використовуй класи Tailwind для стилізації (наприклад, text-gray-900, mb-4, font-bold).`;

      userPrompt = `Дані кандидата: ${JSON.stringify(builderData)}\n\nВакансія: ${jobDescription}`;
    } else if (type === "cover-letter") {
      systemPrompt = `Ти — експерт-рекрутер. Напиши лаконічний супровідний лист (до 200 слів) на основі резюме кандидата та вакансії. Використовуй тон: ${tone}. Починай одразу з того, яку користь кандидат принесе компанії. Без кліше.`;
      userPrompt = `Резюме:\n${resumeText}\n\nОпис вакансії:\n${jobDescription}`;
    } else if (type === "resume") {
      systemPrompt = `Ти — експерт зі складання резюме. Твоє завдання — переписати досвід кандидата так, щоб він ідеально відповідав вимогам вакансії. Виділи релевантні навички. КРИТИЧНО: Поверни результат ВИКЛЮЧНО у вигляді чистого, семантичного HTML-коду (без тегів \`\`\`html). Використовуй класи Tailwind CSS для стилізації. Зроби дизайн сучасним та мінімалістичним.`;
      userPrompt = `Резюме:\n${resumeText}\n\nОпис вакансії:\n${jobDescription}`;
    } else {
      return NextResponse.json({ error: "Invalid generation type" }, { status: 400 });
    }

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.7,
    });

    const result = response.choices[0].message.content;

    // 3. Deduct 1 credit from profile (DISABLED FOR GOD MODE)
    // if (result) {
    //   const { error: updateError } = await supabase
    //     .from("profiles")
    //     .update({ credits: profile.credits - 1 })
    //     .eq("id", user.id);
    // 
    //   if (updateError) {
    //     console.error("Credit deduction error:", updateError);
    //   }
    // }

    return NextResponse.json({ result });
  } catch (error: any) {
    console.error("Generation error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate content" },
      { status: 500 }
    );
  }
}
