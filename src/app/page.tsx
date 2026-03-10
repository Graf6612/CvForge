"use client";

import React, { useState, useRef, useEffect } from "react";
import { 
  UploadCloud, 
  X, 
  Copy, 
  RefreshCcw, 
  Zap, 
  Check, 
  Printer,
  FileText,
  FileSearch,
  User,
  LogOut,
  Sparkles,
  Menu
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

import { createClient } from "@/lib/supabase/client";

export default function Home() {
  const supabase = createClient();
  
  // --- States ---
  const [user, setUser] = useState<any>(null);
  const [credits, setCredits] = useState<number | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [vacancy, setVacancy] = useState("");
  const [tone, setTone] = useState("професійний");
  const [genType, setGenType] = useState("cover-letter");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState("");
  const [isCopied, setIsCopied] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // CV Builder States
  const [personalInfo, setPersonalInfo] = useState({
    name: "",
    role: "",
    email: "",
    phone: "",
    city: ""
  });
  const [experience, setExperience] = useState([
    { id: 1, company: "", role: "", period: "", description: "" }
  ]);
  const [skills, setSkills] = useState("");
  const [goal, setGoal] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- Auth & Credits ---
  useEffect(() => {
    const getUserData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
        fetchCredits(session.user.id);
      }
    };

    getUserData();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        setUser(session.user);
        fetchCredits(session.user.id);
      } else {
        setUser(null);
        setCredits(null);
      }
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  const fetchCredits = async (userId: string) => {
    const { data, error } = await supabase
      .from("profiles")
      .select("credits")
      .eq("id", userId)
      .single();
    
    if (!error && data) {
      // God mode: always grant 9999 credits for testing visually
      setCredits(9999);
      // setCredits(data.credits);
    }
  };

  const handleGoogleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: window.location.origin,
      },
    });
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  // --- Handlers ---
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const removeFile = () => {
    setFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const addExperience = () => {
    setExperience([...experience, { 
      id: Date.now(), 
      company: "", 
      role: "", 
      period: "", 
      description: "" 
    }]);
  };

  const removeExperience = (id: number) => {
    setExperience(experience.filter(exp => exp.id !== id));
  };

  const updateExperience = (id: number, field: string, value: string) => {
    setExperience(experience.map(exp => 
      exp.id === id ? { ...exp, [field]: value } : exp
    ));
  };

  const handleGenerate = async () => {
    if (!user) {
      alert("Будь ласка, авторизуйтеся через Google");
      return;
    }

    if (credits !== null && credits < 1) {
      alert("У вас закінчилися кредити");
      return;
    }

    // Validation
    if (genType === "cv-builder") {
      if (!personalInfo.name || !goal) {
        alert("Будь ласка, заповніть ПІБ та Ціль");
        return;
      }
    } else {
      if (!vacancy || !file) {
        alert("Будь ласка, завантажте резюме та вставте опис вакансії");
        return;
      }
    }
    
    setIsLoading(true);
    setResult("");

    try {
      let body: any;
      let headers: Record<string, string> = {};

      if (genType === "cv-builder") {
        body = JSON.stringify({
          data: {
            personal: personalInfo,
            experience: experience,
            skills: skills
          },
          goal: goal
        });
        headers["Content-Type"] = "application/json";
      } else {
        const formData = new FormData();
        formData.append("resume", file!);
        formData.append("jobDescription", vacancy);
        formData.append("tone", tone);
        formData.append("type", genType);
        body = formData;
      }

      const response = await fetch("/api/generate", {
        method: "POST",
        headers: headers,
        body: body,
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Помилка генерації");
      }

      const data = await response.json();
      setResult(data.result);
      
      // Refresh credits after generation
      fetchCredits(user.id);
    } catch (error: any) {
      console.error(error);
      alert(error.message || "Щось пішло не так при генерації. Перевірте консоль або спробуйте ще раз.");
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(result);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const reset = () => {
    setResult("");
    setVacancy("");
    setFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-[#FAFAFC] text-slate-900 font-sans selection:bg-indigo-100 print:bg-white print:text-black relative overflow-hidden">
      
      {/* Premium Animated Background */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none print:hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-violet-300/20 blur-[120px] animate-blob"></div>
        <div className="absolute top-[20%] right-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-300/20 blur-[120px] animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-[-10%] left-[20%] w-[50%] h-[50%] rounded-full bg-fuchsia-300/10 blur-[120px] animate-blob animation-delay-4000"></div>
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] mix-blend-overlay"></div>
      </div>

      <div className="relative z-10 flex flex-col min-h-screen">
        {/* --- Header --- */}
        <header className="border-b border-white/20 bg-white/60 backdrop-blur-2xl sticky top-0 z-50 shadow-[0_4px_30px_rgba(0,0,0,0.03)] print:hidden">
          <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
            <div className="flex items-center gap-2 group cursor-pointer">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-violet-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200 group-hover:scale-105 transition-transform">
                <Sparkles className="w-6 h-6 text-white animate-pulse" />
              </div>
              <span className="text-2xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-700">
                CvForge
              </span>
          </div>
          <div className="flex items-center gap-4">
            {user ? (
              <div className="hidden md:flex items-center gap-4">
                <div className="flex items-center gap-3 px-4 py-2 rounded-2xl bg-slate-50 border border-slate-200 shadow-sm">
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-amber-500 fill-amber-500" />
                    <span className="text-sm font-semibold text-slate-700">
                      {credits ?? 0} {credits === 1 ? "кредит" : credits !== null && credits < 5 && credits > 0 ? "кредити" : "кредитів"}
                    </span>
                  </div>
                  <div className="w-px h-4 bg-slate-200" />
                  <div className="flex items-center gap-2">
                    {user.user_metadata?.avatar_url ? (
                      <img src={user.user_metadata.avatar_url} alt="User" className="w-7 h-7 rounded-full border border-white shadow-sm" />
                    ) : (
                      <User className="w-5 h-5 text-slate-400" />
                    )}
                    <span className="text-sm font-medium text-slate-600 max-w-[120px] truncate hidden lg:block">
                      {user.email}
                    </span>
                  </div>
                </div>
                <Button 
                  onClick={handleSignOut} 
                  variant="ghost" 
                  size="sm" 
                  className="text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors font-bold"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Вийти
                </Button>
              </div>
            ) : (
              <div className="hidden md:block">
                <Button 
                  onClick={handleGoogleLogin} 
                  className="bg-slate-900 hover:bg-slate-800 text-white rounded-xl px-5 h-11 flex items-center gap-3 font-semibold transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:scale-95"
                >
                  <div className="w-5 h-5 bg-white rounded-full flex items-center justify-center p-1">
                    <svg viewBox="0 0 24 24" className="w-full h-full">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.27.81-.57z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                    </svg>
                  </div>
                  Увійти через Google
                </Button>
              </div>
            )}

            {/* Burger Menu Button (Mobile) */}
            <Button 
              variant="ghost" 
              size="icon" 
              className="md:hidden text-slate-600 hover:bg-slate-100 rounded-xl"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </Button>
          </div>
        </div>

        {/* Mobile Menu Overlay */}
        {isMenuOpen && (
          <div className="md:hidden absolute top-20 inset-x-0 bg-white/90 backdrop-blur-2xl border-b border-slate-200 shadow-xl animate-in fade-in slide-in-from-top-4 duration-300 z-40 p-6 space-y-6">
            {user ? (
              <>
                <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100">
                  <div className="flex items-center gap-3">
                    {user.user_metadata?.avatar_url ? (
                      <img src={user.user_metadata.avatar_url} alt="User" className="w-10 h-10 rounded-full border-2 border-white shadow-sm" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
                        <User className="w-6 h-6" />
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-bold text-slate-800 truncate max-w-[180px]">{user.email}</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <Zap className="w-3 h-3 text-amber-500 fill-amber-500" />
                        <p className="text-xs font-bold text-slate-500">{credits ?? 0} кредитів</p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <Button 
                    onClick={() => { handleSignOut(); setIsMenuOpen(false); }} 
                    variant="outline" 
                    className="w-full justify-start h-12 rounded-xl border-slate-200 text-slate-600 font-bold"
                  >
                    <LogOut className="w-4 h-4 mr-3" />
                    Вийти з акаунту
                  </Button>
                </div>
              </>
            ) : (
              <Button 
                onClick={() => { handleGoogleLogin(); setIsMenuOpen(false); }} 
                className="w-full h-12 bg-slate-900 hover:bg-slate-800 text-white rounded-xl flex items-center justify-center gap-3 font-bold"
              >
                <div className="w-5 h-5 bg-white rounded-full flex items-center justify-center p-1">
                  <svg viewBox="0 0 24 24" className="w-full h-full">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.27.81-.57z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                </div>
                Увійти через Google
              </Button>
            )}
          </div>
        )}
      </header>

      <main className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-6 py-12 md:py-20 print:p-0 print:m-0 print:max-w-none">
        
        {/* --- Hero Section --- */}
        <section className="text-center mb-16 md:mb-24 space-y-8 animate-in fade-in slide-in-from-top-4 duration-1000 print:hidden relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/80 backdrop-blur-sm border border-indigo-100/50 text-indigo-700 text-xs sm:text-sm font-bold tracking-wide uppercase shadow-sm">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
            </span>
            AI-powered Career Expert
          </div>
          
          <div className="relative">
            <div className="absolute -left-4 top-10 w-12 h-12 bg-white rounded-2xl shadow-xl flex items-center justify-center rotate-[-12deg] animate-float hidden md:flex">
              <FileText className="w-6 h-6 text-violet-500" />
            </div>
            <div className="absolute -right-4 bottom-0 w-14 h-14 bg-white rounded-full shadow-xl flex items-center justify-center rotate-[15deg] animate-float-delayed hidden md:flex">
              <Zap className="w-7 h-7 text-amber-500 fill-amber-500" />
            </div>

            <h1 className="text-5xl sm:text-6xl md:text-8xl font-black tracking-tighter text-slate-900 leading-[1.05]">
              CvForge — Ваш <br className="hidden sm:block" />
              ШІ-помічник <br className="block sm:hidden" />
              <span className="relative inline-block mt-2 sm:mt-0">
                <span className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-fuchsia-500 blur-2xl opacity-20 rounded-full"></span>
                <span className="relative text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-600">
                  для ідеальної кар'єри.
                </span>
              </span>
            </h1>
          </div>
          
          <p className="text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto font-medium leading-relaxed px-4">
            Створюйте професійні резюме та супровідні листи, які відкривають двері в топові компанії світу. <strong className="text-indigo-600 font-semibold">Оптимізовано ШІ для 100% Match.</strong>
          </p>
        </section>

        {/* --- Main Action Card --- */}
        {!result && (
          <div className="animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-200 relative z-10 px-2 sm:px-0">
            <div className="glass-card rounded-[2rem] sm:rounded-[3rem] p-6 sm:p-8 md:p-14 transition-all duration-700 space-y-10 print:hidden relative overflow-hidden">
              <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 bg-indigo-500/10 blur-[80px] rounded-full pointer-events-none"></div>
              
              <Tabs defaultValue="cover-letter" onValueChange={setGenType} className="w-full relative z-10">
                <TabsList className="flex w-full flex-col sm:flex-row bg-slate-100/50 backdrop-blur-md border border-white/40 p-1.5 h-auto sm:h-18 rounded-[1.5rem] mb-10 shadow-inner gap-2 sm:gap-0">
                  <TabsTrigger value="cover-letter" className="w-full sm:flex-1 rounded-[1.2rem] data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-md data-[state=active]:scale-[1.02] transition-all duration-300 text-sm md:text-base font-bold text-slate-500 py-3 sm:py-0">
                    <FileText className="w-4 h-4 mr-2" />
                    Cover Letter (Супровідний)
                  </TabsTrigger>
                  <TabsTrigger value="resume" className="w-full sm:flex-1 rounded-[1.2rem] data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-md data-[state=active]:scale-[1.02] transition-all duration-300 text-sm md:text-base font-bold text-slate-500 py-3 sm:py-0">
                    <RefreshCcw className="w-4 h-4 mr-2" />
                    Резюме під вакансію
                  </TabsTrigger>
                  <TabsTrigger value="cv-builder" className="w-full sm:flex-1 rounded-[1.2rem] data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-md data-[state=active]:scale-[1.02] transition-all duration-300 text-sm md:text-base font-bold text-slate-500 py-3 sm:py-0">
                    <Zap className="w-4 h-4 mr-2" />
                    Створити з нуля
                  </TabsTrigger>
                </TabsList>

                {/* --- Feature Explanations --- */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
                  <div className={`p-5 rounded-[1.5rem] border transition-all ${genType === 'cover-letter' ? 'bg-indigo-50/50 border-indigo-200' : 'bg-slate-50/30 border-slate-100 opacity-50'}`}>
                    <h4 className="font-bold text-slate-800 mb-2 flex items-center gap-2">
                      <FileText className="w-4 h-4 text-indigo-500" />
                      Cover Letter
                    </h4>
                    <p className="text-sm text-slate-500 leading-relaxed">
                      Генерує ідеальний супровідний лист. Аналізує ваше резюме та вакансію, щоб підкреслити саме ті навички, які шукає роботодавець.
                    </p>
                  </div>
                  <div className={`p-5 rounded-[1.5rem] border transition-all ${genType === 'resume' ? 'bg-indigo-50/50 border-indigo-200' : 'bg-slate-50/30 border-slate-100 opacity-50'}`}>
                    <h4 className="font-bold text-slate-800 mb-2 flex items-center gap-2">
                      <RefreshCcw className="w-4 h-4 text-indigo-500" />
                      Адаптація резюме
                    </h4>
                    <p className="text-sm text-slate-500 leading-relaxed">
                      Переписує ваше старе резюме так, щоб воно на 100% відповідало вимогам конкретної вакансії. Додає правильні ключові слова для ATS систем обробки.
                    </p>
                  </div>
                  <div className={`p-5 rounded-[1.5rem] border transition-all ${genType === 'cv-builder' ? 'bg-indigo-50/50 border-indigo-200' : 'bg-slate-50/30 border-slate-100 opacity-50'}`}>
                    <h4 className="font-bold text-slate-800 mb-2 flex items-center gap-2">
                      <Zap className="w-4 h-4 text-indigo-500" />
                      Створити з нуля
                    </h4>
                    <p className="text-sm text-slate-500 leading-relaxed">
                      Немає резюме? Введіть основну інформацію про себе, свій досвід та ціль, і ШІ згенерує професійне структуроване резюме з чистого аркуша.
                    </p>
                  </div>
                </div>

                <div className="space-y-10">
                  {/* --- Adaptation Tabs (Cover Letter & Resume Adapter) --- */}
                  {(genType === "cover-letter" || genType === "resume") && (
                    <div className="grid gap-10 animate-in fade-in duration-500">
                      {/* PDF Upload */}
                      <div className="space-y-4">
                        <Label className="text-lg font-bold text-slate-800 flex items-center gap-3">
                          <span className="w-7 h-7 rounded-full bg-slate-900 flex items-center justify-center text-[11px] font-bold text-white">1</span>
                          Твоє поточне резюме (PDF)
                        </Label>
                        
                        {!file ? (
                          <div 
                            onClick={() => fileInputRef.current?.click()}
                            className="glass-input rounded-[2rem] p-10 sm:p-14 flex flex-col items-center justify-center gap-4 cursor-pointer hover:border-indigo-400 hover:bg-white/80 transition-all duration-300 group border-dashed border-2 bg-slate-50/30"
                          >
                            <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center shadow-[0_8px_30px_rgb(0,0,0,0.06)] group-hover:scale-110 group-hover:-translate-y-2 transition-all duration-500">
                              <div className="absolute inset-0 rounded-3xl bg-indigo-500/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                              <UploadCloud className="w-10 h-10 text-indigo-500 relative z-10" />
                            </div>
                            <div className="text-center mt-2">
                              <p className="text-slate-800 font-extrabold text-xl">
                                Натисніть, щоб завантажити
                              </p>
                              <p className="text-slate-500 text-sm mt-2 font-medium">
                                PDF, DOCX (до 10MB)
                              </p>
                            </div>
                            <input 
                              type="file" 
                              ref={fileInputRef} 
                              className="hidden" 
                              accept=".pdf"
                              onChange={handleFileChange}
                            />
                          </div>
                        ) : (
                          <div className="flex items-center justify-between p-5 bg-indigo-50/50 border border-indigo-100 rounded-[1.5rem] animate-in zoom-in-95 duration-300">
                            <div className="flex items-center gap-4 overflow-hidden">
                              <div className="bg-indigo-600 p-2.5 rounded-xl text-white shadow-lg shadow-indigo-100">
                                <FileText className="w-5 h-5" />
                              </div>
                              <span className="truncate font-bold text-slate-800">{file.name}</span>
                            </div>
                            <button 
                              onClick={removeFile}
                              className="p-2.5 hover:bg-white rounded-xl text-slate-400 hover:text-red-500 transition-all shadow-sm hover:shadow-md"
                            >
                              <X className="w-5 h-5" />
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Vacancy */}
                      <div className="space-y-4">
                        <Label className="text-lg font-bold text-slate-800 flex items-center gap-3">
                          <span className="w-7 h-7 rounded-full bg-slate-900 flex items-center justify-center text-[11px] font-bold text-white">2</span>
                          Опис вакансії
                        </Label>
                        <Textarea 
                          value={vacancy}
                          onChange={(e) => setVacancy(e.target.value)}
                          placeholder="Вставте текст вакансії, вимоги або посилання на неї..."
                          className="min-h-[220px] glass-input rounded-[1.5rem] p-6 text-slate-800 focus-visible:ring-indigo-500/20 focus-visible:border-indigo-500/50 transition-all placeholder:text-slate-400 text-base leading-relaxed resize-none shadow-sm"
                        />
                      </div>
                    </div>
                  )}

                  {/* --- CV Builder Tab --- */}
                  {genType === "cv-builder" && (
                    <div className="space-y-12 animate-in fade-in slide-in-from-left-4 duration-500">
                      {/* Personal Info */}
                      <div className="space-y-8">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shadow-sm">
                            <User className="w-5 h-5" />
                          </div>
                          <h3 className="text-xl font-bold text-slate-800">Персональні дані</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-2.5">
                            <Label className="text-slate-500 font-semibold ml-1">ПІБ</Label>
                            <input 
                              value={personalInfo.name}
                              onChange={(e) => setPersonalInfo({ ...personalInfo, name: e.target.value })}
                              className="w-full bg-slate-50/50 border border-slate-200 rounded-2xl px-5 py-3.5 outline-none focus:border-indigo-500 focus:bg-white transition-all shadow-sm focus:shadow-md h-13"
                              placeholder="Іван Іванов"
                            />
                          </div>
                          <div className="space-y-2.5">
                            <Label className="text-slate-500 font-semibold ml-1">Посада</Label>
                            <input 
                              value={personalInfo.role}
                              onChange={(e) => setPersonalInfo({ ...personalInfo, role: e.target.value })}
                              className="w-full bg-slate-50/50 border border-slate-200 rounded-2xl px-5 py-3.5 outline-none focus:border-indigo-500 focus:bg-white transition-all shadow-sm focus:shadow-md h-13"
                              placeholder="Frontend Developer"
                            />
                          </div>
                          <div className="space-y-2.5">
                            <Label className="text-slate-500 font-semibold ml-1">Email</Label>
                            <input 
                              value={personalInfo.email}
                              onChange={(e) => setPersonalInfo({ ...personalInfo, email: e.target.value })}
                              className="w-full bg-slate-50/50 border border-slate-200 rounded-2xl px-5 py-3.5 outline-none focus:border-indigo-500 focus:bg-white transition-all shadow-sm focus:shadow-md h-13"
                              placeholder="ivan@example.com"
                            />
                          </div>
                          <div className="space-y-2.5">
                            <Label className="text-slate-500 font-semibold ml-1">Телефон</Label>
                            <input 
                              value={personalInfo.phone}
                              onChange={(e) => setPersonalInfo({ ...personalInfo, phone: e.target.value })}
                              className="w-full bg-slate-50/50 border border-slate-200 rounded-2xl px-5 py-3.5 outline-none focus:border-indigo-500 focus:bg-white transition-all shadow-sm focus:shadow-md h-13"
                              placeholder="+380..."
                            />
                          </div>
                        </div>
                      </div>

                      {/* Experience */}
                      <div className="space-y-8">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shadow-sm">
                              <FileSearch className="w-5 h-5" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-800">Досвід роботи</h3>
                          </div>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={addExperience}
                            className="bg-indigo-50 text-indigo-600 border-indigo-100 hover:bg-indigo-100 hover:border-indigo-200 rounded-xl px-4 font-bold"
                          >
                            + Додати місце
                          </Button>
                        </div>
                        
                        <div className="space-y-6">
                          {experience.map((exp) => (
                            <div key={exp.id} className="p-8 bg-slate-50/50 border border-slate-200 rounded-[2rem] relative group animate-in slide-in-from-top-4 duration-500 shadow-sm hover:shadow-md transition-all hover:bg-white">
                              {experience.length > 1 && (
                                <button 
                                  onClick={() => removeExperience(exp.id)}
                                  className="absolute top-6 right-6 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all p-2 hover:bg-red-50 rounded-lg"
                                >
                                  <X className="w-5 h-5" />
                                </button>
                              )}
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                <div className="space-y-2">
                                  <Label className="text-xs text-slate-400 font-bold uppercase tracking-widest ml-1">Компанія</Label>
                                  <input 
                                    value={exp.company}
                                    onChange={(e) => updateExperience(exp.id, "company", e.target.value)}
                                    className="w-full bg-transparent border-b border-slate-200 py-2 outline-none focus:border-indigo-500 transition-all font-semibold text-slate-800 placeholder:text-slate-300"
                                    placeholder="Google"
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label className="text-xs text-slate-400 font-bold uppercase tracking-widest ml-1">Період</Label>
                                  <input 
                                    value={exp.period}
                                    onChange={(e) => updateExperience(exp.id, "period", e.target.value)}
                                    className="w-full bg-transparent border-b border-slate-200 py-2 outline-none focus:border-indigo-500 transition-all font-semibold text-slate-800 placeholder:text-slate-300"
                                    placeholder="2022 - present"
                                  />
                                </div>
                              </div>
                              <div className="space-y-2">
                                <Label className="text-xs text-slate-400 font-bold uppercase tracking-widest ml-1">Що робили</Label>
                                <Textarea 
                                  value={exp.description}
                                  onChange={(e) => updateExperience(exp.id, "description", e.target.value)}
                                  className="min-h-[100px] bg-white/50 border-slate-200 focus:border-indigo-400 transition-all resize-none rounded-xl"
                                  placeholder="Опишіть ваші досягнення та обов'язки..."
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Skills & Goal */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                        <div className="space-y-4">
                          <Label className="text-lg font-bold text-slate-800 flex items-center gap-3">Навички</Label>
                          <Textarea 
                            value={skills}
                            onChange={(e) => setSkills(e.target.value)}
                            placeholder="React, Next.js, TypeScript, UI design..."
                            className="min-h-[140px] bg-slate-50/50 border-slate-200 rounded-[1.5rem] p-5 focus:shadow-inner"
                          />
                        </div>
                        <div className="space-y-4">
                          <Label className="text-lg font-bold flex items-center gap-3 text-indigo-600">Ціль (Вакансія)</Label>
                          <Textarea 
                            value={goal}
                            onChange={(e) => setGoal(e.target.value)}
                            placeholder="Опис вакансії, на яку подаєтесь..."
                            className="min-h-[140px] bg-indigo-50/30 border-indigo-100 rounded-[1.5rem] p-5 border-dashed"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Tone Select for Cover Letter */}
                  {genType === "cover-letter" && (
                    <div className="space-y-4 animate-in fade-in duration-700 delay-300">
                      <Label className="text-lg font-bold text-slate-800 flex items-center gap-3">
                        <span className="w-7 h-7 rounded-full bg-slate-900 flex items-center justify-center text-[11px] font-bold text-white">3</span>
                        Тон листа
                      </Label>
                      <Select value={tone} onValueChange={setTone}>
                        <SelectTrigger className="h-14 bg-slate-50/50 border-slate-200 rounded-2xl text-slate-700 focus:ring-indigo-600/10 font-semibold px-6">
                          <SelectValue placeholder="Оберіть тон" />
                        </SelectTrigger>
                        <SelectContent className="bg-white border-slate-200 text-slate-700 rounded-2xl">
                          <SelectItem value="професійний">Професійний</SelectItem>
                          <SelectItem value="енергійний джун">Енергійний Джун</SelectItem>
                          <SelectItem value="впевнений сеньйор">Впевнений Сеньйор</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {/* Info Box for Resume Adapter (Removed visually, covered by feature explanation) */}
                </div>
              </Tabs>

              {/* Credits Empty Message */}
              {user && credits === 0 && (
                <div className="flex items-center justify-center gap-3 p-5 bg-red-50/80 backdrop-blur-sm text-red-600 rounded-2xl border border-red-200 text-sm font-bold animate-in fade-in zoom-in-95 shadow-sm">
                  <span className="text-xl animate-bounce">⚠️</span>
                  У вас закінчилися кредити. Очікуйте оновлення або зверніться в підтримку.
                </div>
              )}

              {/* Generate Button */}
              <div className="pt-6">
                <Button 
                  disabled={isLoading || !user || (credits !== null && credits < 1)}
                  onClick={handleGenerate}
                  className={`w-full h-16 sm:h-20 rounded-[1.5rem] sm:rounded-[2rem] text-lg sm:text-xl font-bold transition-all duration-500 flex items-center justify-center gap-3 relative overflow-hidden group ${
                    isLoading || !user || (credits !== null && credits < 1)
                      ? "bg-slate-100/50 text-slate-400 cursor-not-allowed border border-white max-sm:shadow-none" 
                      : "bg-gradient-to-r from-indigo-600 via-violet-600 to-indigo-600 bg-[length:200%_auto] hover:bg-right text-white shadow-[0_20px_40px_-15px_rgba(79,70,229,0.5)] hover:shadow-[0_20px_50px_-15px_rgba(79,70,229,0.7)] hover:-translate-y-1 active:scale-[0.98]"
                  }`}
                >
                  {user && !isLoading && credits !== null && credits > 0 && (
                     <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-out z-0"></div>
                  )}
                  <span className="relative z-10 flex items-center justify-center gap-3">
                  {!user ? (
                    <>
                      <LogOut className="w-5 h-5" />
                      🔐 Авторизуйтеся для генерації
                    </>
                  ) : isLoading ? (
                    <>
                      <RefreshCcw className="w-6 h-6 animate-spin" />
                      Магія триває...
                    </>
                  ) : credits === 0 ? (
                    "Недостатньо кредитів"
                  ) : (
                    <>
                      <Sparkles className="w-6 h-6" />
                      Згенерувати ідеальний Match
                    </>
                  )}
                  </span>
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* --- Output Section --- */}
        {result && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-12 duration-1000">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6 print:hidden">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-green-50 rounded-2xl flex items-center justify-center shadow-sm">
                  <Check className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <h2 className="text-3xl font-bold text-slate-900">Результат готовий!</h2>
                  <p className="text-slate-500">Ми використали ШІ для найкращого результату</p>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
                {genType === "cover-letter" ? (
                  <Button 
                    onClick={copyToClipboard}
                    variant="outline" 
                    className="flex-1 sm:flex-none glass-input hover:bg-white gap-2 h-14 px-8 rounded-2xl font-bold shadow-sm hover:shadow-md transition-all text-indigo-700"
                  >
                    {isCopied ? <Check className="w-5 h-5 text-green-500" /> : <Copy className="w-5 h-5" />}
                    {isCopied ? "Скопійовано" : "Скопіювати"}
                  </Button>
                ) : (
                  <Button 
                    onClick={handlePrint}
                    variant="outline" 
                    className="flex-1 sm:flex-none glass-input hover:bg-white gap-2 h-14 px-8 rounded-2xl font-bold shadow-sm hover:shadow-md transition-all text-indigo-700"
                  >
                    <Printer className="w-5 h-5" />
                    Завантажити PDF
                  </Button>
                )}
                <Button 
                  onClick={reset}
                  variant="ghost" 
                  className="flex-1 sm:flex-none text-slate-500 hover:text-indigo-600 hover:bg-indigo-50/50 h-14 px-6 font-bold rounded-2xl"
                >
                  <RefreshCcw className="w-5 h-5 mr-2" />
                  Новий запит
                </Button>
              </div>
            </div>
            
            {genType === "cover-letter" ? (
              <div className="glass-card p-8 md:p-14 rounded-[2.5rem] shadow-2xl min-h-[400px] leading-[1.8] text-slate-700 whitespace-pre-wrap text-lg animate-in fade-in duration-1000">
                {result}
              </div>
            ) : (
              <div className="print:block scale-animation">
                <div className="glass-card p-4 md:p-10 rounded-[2.5rem] print:p-0 print:border-none print:shadow-none min-h-[800px] shadow-inner overflow-x-auto">
                  <div 
                    className="bg-white text-slate-900 p-8 sm:p-10 md:p-16 shadow-2xl min-h-[1100px] w-full min-w-[700px] max-w-[816px] mx-auto print:shadow-none print:p-0 rounded-lg card-glow"
                    dangerouslySetInnerHTML={{ __html: result }}
                  />
                </div>
              </div>
            )}
          </div>
        )}

      </main>
      </div>

      {/* --- Footer (Simple) --- */}
      <footer className="py-20 text-center border-t border-slate-100 mt-20 print:hidden">
        <div className="max-w-7xl mx-auto px-6 space-y-4">
          <div className="flex items-center justify-center gap-2 opacity-30">
            <Sparkles className="w-4 h-4" />
            <span className="text-sm font-bold tracking-widest uppercase">CvForge</span>
          </div>
          <p className="text-sm text-slate-400 font-medium">© 2026 CvForge. Створення успішних кар'єр за допомогою інтелектуальних технологій.</p>
        </div>
      </footer>

      <style jsx global>{`
        @keyframes subtle-glow {
          0% { box-shadow: 0 0 0px rgba(79, 70, 229, 0); }
          50% { box-shadow: 0 0 30px rgba(79, 70, 229, 0.05); }
          100% { box-shadow: 0 0 0px rgba(79, 70, 229, 0); }
        }
        .card-glow {
          animation: subtle-glow 4s infinite ease-in-out;
        }
        .scale-animation {
          animation: scale-up 0.8s cubic-bezier(0.16, 1, 0.3, 1);
        }
        @keyframes scale-up {
          from { transform: scale(0.98); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        @media print {
          body {
            background: white !important;
            color: black !important;
          }
          header, section, .print\\:hidden, footer {
            display: none !important;
          }
          main {
            padding: 0 !important;
            margin: 0 !important;
            max-width: none !important;
          }
          .min-h-screen {
            min-height: auto !important;
          }
          @page {
            margin: 0;
            size: auto;
          }
        }
      `}</style>
    </div>
  );
}
