"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useProfileStore } from "@/stores/profile-store";
import { useAppStore } from "@/stores/app-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";
import type { Education, WorkExperience, UserProfile } from "@/types";

export default function ProfilePage() {
  const router = useRouter();
  const {
    profile, _hasHydrated,
    updateField, addSkill, removeSkill,
    addLanguage, removeLanguage,
    addEducation, removeEducation, updateEducation,
    addWorkExperience, removeWorkExperience, updateWorkExperience,
    addCertification, removeCertification,
  } = useProfileStore();
  const language = useAppStore((s) => s.language);

  // ── Resume parse states ──
  const [resumeLoading, setResumeLoading] = useState(false);
  const [resumeError, setResumeError] = useState("");
  const [resumeSuccess, setResumeSuccess] = useState(false);
  const [pasteText, setPasteText] = useState("");

  // ── Form input states ──
  const [skillInput, setSkillInput] = useState("");
  const [langInput, setLangInput] = useState("");
  const [langProf, setLangProf] = useState("");
  const [eduInput, setEduInput] = useState({ institution: "", degree: "", field: "", startDate: "", endDate: "" });
  const [expInput, setExpInput] = useState({ company: "", position: "", startDate: "", endDate: "", current: false, description: "", achievements: "" });
  const [certInput, setCertInput] = useState({ name: "", issuer: "", date: "" });

  // ── Edit dialog states ──
  const [editEdu, setEditEdu] = useState<Education | null>(null);
  const [editExp, setEditExp] = useState<WorkExperience | null>(null);
  const [editExpAchievements, setEditExpAchievements] = useState("");

  if (!_hasHydrated) return <div className="py-20 text-center text-gray-400">Loading...</div>;

  const t = (en: string, zh: string) => (language === "zh-TW" ? zh : en);

  const handleParseResume = async () => {
    const text = pasteText.trim();
    if (!text) {
      setResumeError("Please paste your CV text first.");
      return;
    }
    if (text.length < 20) {
      setResumeError("Text is too short. Please paste the full CV content.");
      return;
    }
    setResumeLoading(true); setResumeError(""); setResumeSuccess(false);
    try {
      const formData = new FormData();
      formData.append("text", text);

      const res = await fetch("/api/parse-resume", { method: "POST", body: formData });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Parse failed" }));
        throw new Error(err.error || "Parse failed");
      }

      const data = await res.json();
      const p = data.profile as UserProfile;
      updateField("fullName", p.fullName || "");
      updateField("email", p.email || "");
      updateField("phone", p.phone || "");
      updateField("location", p.location || "");
      updateField("linkedIn", p.linkedIn || "");
      updateField("website", p.website || "");
      updateField("summary", p.summary || "");
      p.education?.forEach((edu) => addEducation({ ...edu, id: crypto.randomUUID() }));
      p.workExperience?.forEach((exp) => addWorkExperience({ ...exp, id: crypto.randomUUID(), current: exp.current || false }));
      p.skills?.forEach((s) => { if (!profile.skills.includes(s)) addSkill(s); });
      p.certifications?.forEach((cert) => addCertification({ ...cert, id: crypto.randomUUID() }));
      p.languages?.forEach((lang) => { if (!profile.languages.find((l) => l.language === lang.language)) addLanguage(lang); });
      setResumeSuccess(true);
      setTimeout(() => setResumeSuccess(false), 4000);
    } catch (e) {
      setResumeError(e instanceof Error ? e.message : "Parse failed");
    } finally {
      setResumeLoading(false);
    }
  };

  const handleAddSkill = () => {
    const s = skillInput.trim();
    if (s && !profile.skills.includes(s)) { addSkill(s); setSkillInput(""); }
  };
  const handleAddLanguage = () => {
    const l = langInput.trim(); const p = langProf.trim();
    if (l && p && !profile.languages.find((x) => x.language === l)) {
      addLanguage({ language: l, proficiency: p }); setLangInput(""); setLangProf("");
    }
  };
  const handleAddEducation = () => {
    const e = eduInput;
    if (e.institution && e.degree) {
      addEducation({ ...e, id: crypto.randomUUID() });
      setEduInput({ institution: "", degree: "", field: "", startDate: "", endDate: "" });
    }
  };
  const handleAddExperience = () => {
    const e = expInput;
    if (e.company && e.position) {
      addWorkExperience({
        id: crypto.randomUUID(), company: e.company, position: e.position,
        startDate: e.startDate, endDate: e.endDate, current: e.current,
        description: e.description,
        achievements: e.achievements.split("\n").filter(Boolean),
      });
      setExpInput({ company: "", position: "", startDate: "", endDate: "", current: false, description: "", achievements: "" });
    }
  };
  const handleAddCert = () => {
    const c = certInput;
    if (c.name) {
      addCertification({ ...c, id: crypto.randomUUID() });
      setCertInput({ name: "", issuer: "", date: "" });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t("Your Profile", "個人檔案")}</h1>
        <p className="text-gray-500 text-sm mt-1">{t("Save your background once, reuse for every application.", "填寫一次，每次應徵自動重複使用。")}</p>
      </div>

      {/* ── Auto-fill from CV text ── */}
      <Card className="border-blue-200 bg-blue-50/50">
        <CardHeader><CardTitle className="text-lg flex items-center gap-2"><span>📄</span>{t("Auto-Fill from CV", "從履歷自動填寫")}</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <p className="text-xs text-gray-500">
            {t(
              "Open your CV (PDF, Word, etc.), select all text (⌘A / Ctrl+A), copy (⌘C / Ctrl+C), and paste it below. AI will extract your info and fill the form. You can then edit everything.",
              "打開你的履歷（PDF、Word 等），全選文字（⌘A / Ctrl+A），複製（⌘C / Ctrl+C），貼到下方。AI 將自動提取資料填入表單，之後你可以逐項編輯。"
            )}
          </p>
          <div className="flex gap-2">
            <Textarea
              value={pasteText}
              onChange={(e) => setPasteText(e.target.value)}
              placeholder={t(
                "Paste your full CV text here...",
                "在此貼上你的完整履歷文字..."
              )}
              rows={5}
              className="text-xs"
            />
          </div>
          <div className="flex items-center gap-3">
            <Button onClick={handleParseResume} disabled={resumeLoading || !pasteText.trim()}>
              {resumeLoading ? t("Parsing...", "解析中...") : t("Parse CV", "解析履歷")}
            </Button>
            {resumeLoading && <div className="animate-spin w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full" />}
            {resumeError && <p className="text-red-500 text-sm">{resumeError}</p>}
            {resumeSuccess && <p className="text-green-600 text-sm font-medium">✅ {t("Parsed! Review and edit below.", "解析完成！請檢查下方並編輯。")}</p>}
          </div>
        </CardContent>
      </Card>

      {/* ── Form Tabs ── */}
      <Tabs defaultValue="basic" className="w-full">
        <TabsList className="w-full flex overflow-x-auto">
          <TabsTrigger value="basic">{t("Basic Info", "基本資料")}</TabsTrigger>
          <TabsTrigger value="education">{t("Education", "學歷")}</TabsTrigger>
          <TabsTrigger value="experience">{t("Experience", "工作經驗")}</TabsTrigger>
          <TabsTrigger value="skills">{t("Skills", "技能")}</TabsTrigger>
          <TabsTrigger value="certifications">{t("Certs & More", "證書與其他")}</TabsTrigger>
        </TabsList>

        {/* ── Basic Info ── */}
        <TabsContent value="basic">
          <Card>
            <CardHeader><CardTitle className="text-lg">{t("Basic Information", "基本資料")}</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div><Label>{t("Full Name", "姓名")} *</Label><Input value={profile.fullName} onChange={(e) => updateField("fullName", e.target.value)} placeholder={t("e.g. John Smith", "例：張三")} /></div>
                <div><Label>{t("Email", "電郵")} *</Label><Input value={profile.email} onChange={(e) => updateField("email", e.target.value)} placeholder="you@example.com" /></div>
                <div><Label>{t("Phone", "電話")}</Label><Input value={profile.phone} onChange={(e) => updateField("phone", e.target.value)} placeholder="+852 1234 5678" /></div>
                <div><Label>{t("Location", "所在地")}</Label><Input value={profile.location} onChange={(e) => updateField("location", e.target.value)} placeholder={t("e.g. Hong Kong", "例：香港")} /></div>
                <div><Label>{t("LinkedIn URL", "LinkedIn 連結")}</Label><Input value={profile.linkedIn} onChange={(e) => updateField("linkedIn", e.target.value)} placeholder="https://linkedin.com/in/..." /></div>
                <div><Label>{t("Website / Portfolio", "個人網站")}</Label><Input value={profile.website} onChange={(e) => updateField("website", e.target.value)} placeholder="https://..." /></div>
              </div>
              <div>
                <Label>{t("Professional Summary", "個人簡介")}</Label>
                <Textarea value={profile.summary} onChange={(e) => updateField("summary", e.target.value)} placeholder={t("Brief 2-3 sentence summary", "2-3句簡介你的背景和職業目標")} rows={3} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Education ── */}
        <TabsContent value="education">
          <Card>
            <CardHeader><CardTitle className="text-lg">{t("Education", "學歷")}</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {profile.education.map((edu) => (
                <div key={edu.id} className="flex items-start justify-between border rounded-lg p-3 hover:bg-gray-50">
                  <div className="flex-1 cursor-pointer" onClick={() => setEditEdu({ ...edu })}>
                    <p className="font-semibold text-sm">{edu.institution}</p>
                    <p className="text-sm text-gray-600">{edu.degree} in {edu.field}</p>
                    <p className="text-xs text-gray-400">{edu.startDate} – {edu.endDate}</p>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" onClick={() => setEditEdu({ ...edu })} className="text-blue-600">{t("Edit", "編輯")}</Button>
                    <Button variant="ghost" size="sm" onClick={() => removeEducation(edu.id)} className="text-red-500">✕</Button>
                  </div>
                </div>
              ))}
              {profile.education.length === 0 && <p className="text-xs text-gray-400 py-3 text-center">{t("No education added yet", "尚未添加學歷")}</p>}
              <Separator />
              <div className="grid grid-cols-2 gap-3">
                <div><Label>{t("Institution", "學校")}</Label><Input value={eduInput.institution} onChange={(e) => setEduInput({ ...eduInput, institution: e.target.value })} placeholder="e.g. HKU" /></div>
                <div><Label>{t("Degree", "學位")}</Label><Input value={eduInput.degree} onChange={(e) => setEduInput({ ...eduInput, degree: e.target.value })} placeholder="e.g. MSc" /></div>
                <div><Label>{t("Field", "專業")}</Label><Input value={eduInput.field} onChange={(e) => setEduInput({ ...eduInput, field: e.target.value })} placeholder="e.g. STEM Education" /></div>
                <div className="grid grid-cols-2 gap-2">
                  <div><Label>{t("Start", "開始")}</Label><Input value={eduInput.startDate} onChange={(e) => setEduInput({ ...eduInput, startDate: e.target.value })} placeholder="YYYY-MM" /></div>
                  <div><Label>{t("End", "結束")}</Label><Input value={eduInput.endDate} onChange={(e) => setEduInput({ ...eduInput, endDate: e.target.value })} placeholder="YYYY-MM" /></div>
                </div>
              </div>
              <Button onClick={handleAddEducation} size="sm">{t("+ Add Education", "+ 新增學歷")}</Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Education Edit Dialog ── */}
        {editEdu && (
          <Dialog open={!!editEdu} onOpenChange={() => setEditEdu(null)}>
            <DialogContent>
              <DialogHeader><DialogTitle>{t("Edit Education", "編輯學歷")}</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div><Label>{t("Institution", "學校")}</Label><Input value={editEdu.institution} onChange={(e) => setEditEdu({ ...editEdu, institution: e.target.value })} /></div>
                <div><Label>{t("Degree", "學位")}</Label><Input value={editEdu.degree} onChange={(e) => setEditEdu({ ...editEdu, degree: e.target.value })} /></div>
                <div><Label>{t("Field", "專業")}</Label><Input value={editEdu.field} onChange={(e) => setEditEdu({ ...editEdu, field: e.target.value })} /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>{t("Start", "開始")}</Label><Input value={editEdu.startDate} onChange={(e) => setEditEdu({ ...editEdu, startDate: e.target.value })} /></div>
                  <div><Label>{t("End", "結束")}</Label><Input value={editEdu.endDate} onChange={(e) => setEditEdu({ ...editEdu, endDate: e.target.value })} /></div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setEditEdu(null)}>{t("Cancel", "取消")}</Button>
                <Button onClick={() => { updateEducation(editEdu.id, editEdu); setEditEdu(null); }}>{t("Save", "儲存")}</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}

        {/* ── Work Experience ── */}
        <TabsContent value="experience">
          <Card>
            <CardHeader><CardTitle className="text-lg">{t("Work Experience", "工作經驗")}</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {profile.workExperience.map((exp) => (
                <div key={exp.id} className="flex items-start justify-between border rounded-lg p-3 hover:bg-gray-50">
                  <div className="flex-1 cursor-pointer" onClick={() => { setEditExp({ ...exp }); setEditExpAchievements(exp.achievements?.join("\n") || ""); }}>
                    <p className="font-semibold text-sm">{exp.position} — {exp.company}</p>
                    <p className="text-xs text-gray-400">{exp.startDate} – {exp.current ? t("Present", "至今") : exp.endDate}</p>
                    <p className="text-xs text-gray-500 mt-1 line-clamp-2">{exp.description}</p>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" onClick={() => { setEditExp({ ...exp }); setEditExpAchievements(exp.achievements?.join("\n") || ""); }} className="text-blue-600">{t("Edit", "編輯")}</Button>
                    <Button variant="ghost" size="sm" onClick={() => removeWorkExperience(exp.id)} className="text-red-500">✕</Button>
                  </div>
                </div>
              ))}
              {profile.workExperience.length === 0 && <p className="text-xs text-gray-400 py-3 text-center">{t("No experience added yet", "尚未添加工作經驗")}</p>}
              <Separator />
              <div className="grid grid-cols-2 gap-3">
                <div><Label>{t("Company", "公司")}</Label><Input value={expInput.company} onChange={(e) => setExpInput({ ...expInput, company: e.target.value })} /></div>
                <div><Label>{t("Position", "職位")}</Label><Input value={expInput.position} onChange={(e) => setExpInput({ ...expInput, position: e.target.value })} /></div>
                <div><Label>{t("Start", "開始")}</Label><Input value={expInput.startDate} onChange={(e) => setExpInput({ ...expInput, startDate: e.target.value })} placeholder="YYYY-MM" /></div>
                <div><Label>{t("End", "結束")}</Label><Input value={expInput.endDate} onChange={(e) => setExpInput({ ...expInput, endDate: e.target.value })} disabled={expInput.current} /></div>
              </div>
              <div className="flex items-center gap-2"><Checkbox id="current" checked={expInput.current} onCheckedChange={(v) => setExpInput({ ...expInput, current: !!v })} /><Label htmlFor="current" className="text-sm cursor-pointer">{t("Currently working here", "現職")}</Label></div>
              <div><Label>{t("Description", "描述")}</Label><Textarea value={expInput.description} onChange={(e) => setExpInput({ ...expInput, description: e.target.value })} rows={2} /></div>
              <div><Label>{t("Achievements (one per line)", "成就（每行一個）")}</Label><Textarea value={expInput.achievements} onChange={(e) => setExpInput({ ...expInput, achievements: e.target.value })} rows={3} /></div>
              <Button onClick={handleAddExperience} size="sm">{t("+ Add Experience", "+ 新增經驗")}</Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Experience Edit Dialog ── */}
        {editExp && (
          <Dialog open={!!editExp} onOpenChange={() => setEditExp(null)}>
            <DialogContent className="max-h-[80vh] overflow-y-auto">
              <DialogHeader><DialogTitle>{t("Edit Experience", "編輯工作經驗")}</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>{t("Company", "公司")}</Label><Input value={editExp.company} onChange={(e) => setEditExp({ ...editExp, company: e.target.value })} /></div>
                  <div><Label>{t("Position", "職位")}</Label><Input value={editExp.position} onChange={(e) => setEditExp({ ...editExp, position: e.target.value })} /></div>
                  <div><Label>{t("Start", "開始")}</Label><Input value={editExp.startDate} onChange={(e) => setEditExp({ ...editExp, startDate: e.target.value })} /></div>
                  <div><Label>{t("End", "結束")}</Label><Input value={editExp.endDate} onChange={(e) => setEditExp({ ...editExp, endDate: e.target.value })} disabled={editExp.current} /></div>
                </div>
                <div className="flex items-center gap-2"><Checkbox id="edit-current" checked={editExp.current} onCheckedChange={(v) => setEditExp({ ...editExp, current: !!v })} /><Label htmlFor="edit-current">{t("Currently working here", "現職")}</Label></div>
                <div><Label>{t("Description", "描述")}</Label>
                  <Textarea
                    value={editExp.description}
                    onChange={(e) => setEditExp({ ...editExp, description: e.target.value })}
                    rows={3}
                  />
                </div>
                <div><Label>{t("Achievements (one per line)", "成就（每行一個）")}</Label>
                  <Textarea
                    value={editExpAchievements}
                    onChange={(e) => setEditExpAchievements(e.target.value)}
                    rows={4}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setEditExp(null)}>{t("Cancel", "取消")}</Button>
                <Button onClick={() => {
                  updateWorkExperience(editExp.id, {
                    ...editExp,
                    achievements: editExpAchievements.split("\n").filter(Boolean),
                  });
                  setEditExp(null);
                }}>{t("Save", "儲存")}</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}

        {/* ── Skills ── */}
        <TabsContent value="skills">
          <Card>
            <CardHeader><CardTitle className="text-lg">{t("Skills & Languages", "技能與語言")}</CardTitle></CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label>{t("Skills", "技能")}</Label>
                <div className="flex flex-wrap gap-2 mb-3 min-h-[32px]">
                  {profile.skills.map((s) => (<Badge key={s} variant="secondary" className="cursor-pointer" onClick={() => removeSkill(s)}>{s} ✕</Badge>))}
                  {profile.skills.length === 0 && <span className="text-xs text-gray-400">{t("No skills added yet", "尚未添加技能")}</span>}
                </div>
                <div className="flex gap-2"><Input value={skillInput} onChange={(e) => setSkillInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddSkill())} placeholder={t("Type a skill and press Enter", "輸入技能後按 Enter")} /><Button onClick={handleAddSkill} size="sm">{t("Add", "新增")}</Button></div>
              </div>
              <Separator />
              <div>
                <Label>{t("Languages", "語言")}</Label>
                <div className="flex flex-wrap gap-2 mb-3">
                  {profile.languages.map((l) => (<Badge key={l.language} variant="outline" className="cursor-pointer" onClick={() => removeLanguage(l.language)}>{l.language}: {l.proficiency} ✕</Badge>))}
                </div>
                <div className="flex gap-2"><Input value={langInput} onChange={(e) => setLangInput(e.target.value)} placeholder={t("Language", "語言")} className="w-1/3" /><Input value={langProf} onChange={(e) => setLangProf(e.target.value)} placeholder={t("Proficiency", "程度")} className="w-1/3" /><Button onClick={handleAddLanguage} size="sm">{t("Add", "新增")}</Button></div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Certifications ── */}
        <TabsContent value="certifications">
          <Card>
            <CardHeader><CardTitle className="text-lg">{t("Certifications", "證書與資格")}</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {profile.certifications.map((cert) => (
                <div key={cert.id} className="flex items-start justify-between border rounded-lg p-3">
                  <div><p className="font-semibold text-sm">{cert.name}</p><p className="text-xs text-gray-500">{cert.issuer} · {cert.date}</p></div>
                  <Button variant="ghost" size="sm" onClick={() => removeCertification(cert.id)} className="text-red-500">✕</Button>
                </div>
              ))}
              <Separator />
              <div className="grid grid-cols-3 gap-3">
                <div><Label>{t("Name", "名稱")}</Label><Input value={certInput.name} onChange={(e) => setCertInput({ ...certInput, name: e.target.value })} /></div>
                <div><Label>{t("Issuer", "頒發機構")}</Label><Input value={certInput.issuer} onChange={(e) => setCertInput({ ...certInput, issuer: e.target.value })} /></div>
                <div><Label>{t("Date", "日期")}</Label><Input value={certInput.date} onChange={(e) => setCertInput({ ...certInput, date: e.target.value })} /></div>
              </div>
              <Button onClick={handleAddCert} size="sm">{t("+ Add Certification", "+ 新增證書")}</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end">
        <Button onClick={() => router.push("/jd-analysis")}>{t("Next: Analyze JD →", "下一步：分析 JD →")}</Button>
      </div>
    </div>
  );
}
