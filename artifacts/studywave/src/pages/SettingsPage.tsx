import { usePageTitle } from "@/hooks/use-page-title";
import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/lib/auth";
import { useUpdateSettings, useUploadAvatar } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { useLocation, Link } from "wouter";
import { Settings, User, Lock, Camera, ChevronLeft, CheckCircle2, Shield, Zap, Gift, Copy, Check, Globe, Twitter, Github, Linkedin, Users, Upload, Loader2, Crown, Palette, Sparkles } from "lucide-react";
import { getAuthHeaders } from "@/lib/auth";

interface Referral {
  id: number;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  points: number;
  joinedAt: string;
}

const BANNER_PRESETS = [
  { label: "Violet Dream", value: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)" },
  { label: "Sunset", value: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)" },
  { label: "Ocean", value: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)" },
  { label: "Forest", value: "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)" },
  { label: "Fire", value: "linear-gradient(135deg, #f77062 0%, #fe5196 100%)" },
  { label: "Midnight", value: "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)" },
  { label: "Gold", value: "linear-gradient(135deg, #f6d365 0%, #fda085 100%)" },
  { label: "Arctic", value: "linear-gradient(135deg, #e0c3fc 0%, #8ec5fc 100%)" },
  { label: "Emerald", value: "linear-gradient(135deg, #11998e 0%, #38ef7d 100%)" },
  { label: "Rose", value: "linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)" },
];

const NAV_ITEMS = [
  { id: "profile", icon: User, label: "Profil" },
  { id: "avatar", icon: Camera, label: "Poză de profil" },
  { id: "password", icon: Lock, label: "Parolă" },
  { id: "referral", icon: Gift, label: "Referral" },
  { id: "premium", icon: Crown, label: "Premium" },
];

export default function SettingsPage() {
  usePageTitle("Setări");
  const { user, isLoading: authLoading, updateUser } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("profile");
  const [copied, setCopied] = useState(false);

  const updateSettings = useUpdateSettings();
  const uploadAvatar = useUploadAvatar();

  const [profile, setProfile] = useState({
    displayName: user?.displayName || "",
    bio: user?.bio || "",
    email: user?.email || "",
    website: (user as any)?.website || "",
    twitter: (user as any)?.twitter || "",
    github: (user as any)?.github || "",
    linkedin: (user as any)?.linkedin || "",
  });
  const [password, setPassword] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || "");
  const [previewUrl, setPreviewUrl] = useState(user?.avatarUrl || "");
  const [saving, setSaving] = useState(false);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [referralsLoaded, setReferralsLoaded] = useState(false);
  const avatarFileInputRef = useRef<HTMLInputElement>(null);
  const [isProcessingAvatar, setIsProcessingAvatar] = useState(false);
  const [bannerColor, setBannerColor] = useState<string>((user as any)?.bannerColor || "");

  const processAvatarFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast({ title: "Te rugăm să selectezi un fișier imagine", variant: "destructive" });
      return;
    }
    setIsProcessingAvatar(true);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        const MAX = 256;
        const scale = Math.min(1, MAX / Math.max(img.width, img.height));
        const w = Math.round(img.width * scale);
        const h = Math.round(img.height * scale);
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (!ctx) { setIsProcessingAvatar(false); return; }
        ctx.drawImage(img, 0, 0, w, h);
        const dataUrl = canvas.toDataURL("image/jpeg", 0.82);
        setAvatarUrl(dataUrl);
        setPreviewUrl(dataUrl);
        setIsProcessingAvatar(false);
        toast({ title: "Poza e pregătită — apasă 'Salvează poza de profil' pentru a o aplica." });
      };
      img.onerror = () => {
        setIsProcessingAvatar(false);
        toast({ title: "Nu s-a putut citi imaginea", variant: "destructive" });
      };
      img.src = ev.target?.result as string;
    };
    reader.onerror = () => {
      setIsProcessingAvatar(false);
      toast({ title: "Nu s-a putut citi fișierul", variant: "destructive" });
    };
    reader.readAsDataURL(file);
  };

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login");
    }
  }, [authLoading, user, navigate]);

  useEffect(() => {
    if (activeTab === "referral" && !referralsLoaded && user) {
      fetch("/api/referrals", { headers: getAuthHeaders() })
        .then(r => r.json())
        .then(d => { setReferrals(d.referrals ?? []); setReferralsLoaded(true); })
        .catch(() => setReferralsLoaded(true));
    }
  }, [activeTab, referralsLoaded, user]);

  if (authLoading || !user) return null;

  const referralLink = `${window.location.origin}/register?ref=${(user as any).referralCode || ""}`;

  const copyReferralLink = () => {
    navigator.clipboard.writeText(referralLink).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({ title: "Link de referral copiat!" });
    });
  };

  const handleProfileSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    updateSettings.mutate({ data: profile }, {
      onSuccess: updated => {
        updateUser(updated);
        toast({ title: "Profilul a fost actualizat!" });
        setSaving(false);
      },
      onError: e => { toast({ title: e.message, variant: "destructive" }); setSaving(false); },
    });
  };

  const handleAvatarSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!avatarUrl.trim()) return;
    uploadAvatar.mutate({ data: { avatarUrl } }, {
      onSuccess: updated => {
        updateUser(updated);
        setPreviewUrl(avatarUrl);
        toast({ title: "Poza de profil a fost actualizată!" });
      },
      onError: e => toast({ title: e.message, variant: "destructive" }),
    });
  };

  const handlePasswordSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (password.newPassword !== password.confirmPassword) {
      toast({ title: "Parolele nu coincid", variant: "destructive" });
      return;
    }
    if (password.newPassword.length < 6) {
      toast({ title: "Parola trebuie să aibă cel puțin 6 caractere", variant: "destructive" });
      return;
    }
    updateSettings.mutate({ data: { currentPassword: password.currentPassword, newPassword: password.newPassword } }, {
      onSuccess: () => {
        setPassword({ currentPassword: "", newPassword: "", confirmPassword: "" });
        toast({ title: "Parola a fost schimbată!" });
      },
      onError: e => toast({ title: e.message, variant: "destructive" }),
    });
  };

  const handlePremiumSave = () => {
    setSaving(true);
    fetch("/api/users/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json", ...getAuthHeaders() },
      body: JSON.stringify({ bannerColor }),
    })
      .then(r => r.json())
      .then(updated => {
        updateUser(updated);
        toast({ title: "Personalizarea profilului a fost salvată!" });
        setSaving(false);
      })
      .catch(() => {
        toast({ title: "Salvare eșuată", variant: "destructive" });
        setSaving(false);
      });
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center gap-2 mb-6">
        <Link href={`/profile/${user.id}`}>
          <button className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ChevronLeft className="h-4 w-4" /> Profil
          </button>
        </Link>
        <span className="text-muted-foreground/40">/</span>
        <span className="text-sm text-muted-foreground">Setări cont</span>
      </div>

      <div className="mb-7">
        <h1 className="text-2xl font-extrabold tracking-tight">Setări cont</h1>
        <p className="text-sm text-muted-foreground mt-1">Gestionează informațiile contului și preferințele tale</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] gap-6">
        {/* Sidebar nav */}
        <div className="space-y-1">
          {NAV_ITEMS.map(item => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all text-left ${
                activeTab === item.id
                  ? "bg-primary/8 text-primary"
                  : "text-muted-foreground hover:bg-gray-100 hover:text-foreground"
              }`}
            >
              <item.icon className={`h-4 w-4 flex-shrink-0 ${activeTab === item.id ? "text-primary" : ""}`} />
              {item.label}
            </button>
          ))}

          {/* Account info card */}
          <div className="mt-4 p-4 bg-white rounded-xl border border-border/60 shadow-xs">
            <div className="flex items-center gap-2.5 mb-3">
              <Avatar className="h-9 w-9">
                <AvatarImage src={user.avatarUrl || undefined} />
                <AvatarFallback className="gradient-primary text-white text-sm font-bold">{user.displayName.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="text-xs font-semibold truncate">{user.displayName}</p>
                <p className="text-xs text-muted-foreground">@{user.username}</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 p-2 bg-primary/6 rounded-lg">
              <Zap className="h-3.5 w-3.5 text-primary" />
              <span className="text-xs font-bold text-primary">{user.points.toLocaleString()} puncte</span>
            </div>
          </div>
        </div>

        {/* Content panel */}
        <div>
          {/* Profile tab */}
          {activeTab === "profile" && (
            <div className="bg-white rounded-2xl border border-border/60 shadow-xs overflow-hidden">
              <div className="px-6 py-4 border-b border-border/50 bg-gray-50/50">
                <h2 className="font-bold flex items-center gap-2">
                  <User className="h-4 w-4 text-primary" /> Informații profil
                </h2>
              </div>
              <form onSubmit={handleProfileSave} className="p-6 space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-semibold text-foreground mb-2 block">Nume afișat</label>
                    <Input
                      value={profile.displayName}
                      onChange={e => setProfile(p => ({ ...p, displayName: e.target.value }))}
                      className="h-10 rounded-xl border-border/70"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-foreground mb-2 block">Adresă de email</label>
                    <Input
                      type="email"
                      value={profile.email}
                      onChange={e => setProfile(p => ({ ...p, email: e.target.value }))}
                      className="h-10 rounded-xl border-border/70"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-semibold text-foreground mb-2 block">Bio</label>
                  <Textarea
                    value={profile.bio}
                    onChange={e => setProfile(p => ({ ...p, bio: e.target.value }))}
                    placeholder="Spune-ne câte ceva despre tine, specializarea ta sau materiile preferate..."
                    rows={3}
                    className="resize-none rounded-xl border-border/70 text-sm"
                  />
                </div>

                <div className="pt-1">
                  <p className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                    <Globe className="h-4 w-4 text-muted-foreground" /> Linkuri sociale
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="relative">
                      <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                      <Input
                        value={profile.website}
                        onChange={e => setProfile(p => ({ ...p, website: e.target.value }))}
                        placeholder="https://siteultau.ro"
                        className="h-10 rounded-xl border-border/70 pl-8 text-sm"
                      />
                    </div>
                    <div className="relative">
                      <Twitter className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                      <Input
                        value={profile.twitter}
                        onChange={e => setProfile(p => ({ ...p, twitter: e.target.value }))}
                        placeholder="@username sau URL"
                        className="h-10 rounded-xl border-border/70 pl-8 text-sm"
                      />
                    </div>
                    <div className="relative">
                      <Github className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                      <Input
                        value={profile.github}
                        onChange={e => setProfile(p => ({ ...p, github: e.target.value }))}
                        placeholder="github.com/username"
                        className="h-10 rounded-xl border-border/70 pl-8 text-sm"
                      />
                    </div>
                    <div className="relative">
                      <Linkedin className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                      <Input
                        value={profile.linkedin}
                        onChange={e => setProfile(p => ({ ...p, linkedin: e.target.value }))}
                        placeholder="linkedin.com/in/username"
                        className="h-10 rounded-xl border-border/70 pl-8 text-sm"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <Button
                    type="submit"
                    className="gradient-primary text-white border-0 h-9 px-5 rounded-xl font-semibold shadow-sm hover:opacity-90"
                    disabled={saving}
                  >
                    {saving ? "Se salvează..." : "Salvează profilul"}
                  </Button>
                  {updateSettings.isSuccess && activeTab === "profile" && (
                    <div className="flex items-center gap-1.5 text-emerald-600 text-xs font-semibold">
                      <CheckCircle2 className="h-4 w-4" /> Salvat!
                    </div>
                  )}
                </div>
              </form>
            </div>
          )}

          {/* Avatar tab */}
          {activeTab === "avatar" && (
            <div className="bg-white rounded-2xl border border-border/60 shadow-xs overflow-hidden">
              <div className="px-6 py-4 border-b border-border/50 bg-gray-50/50">
                <h2 className="font-bold flex items-center gap-2">
                  <Camera className="h-4 w-4 text-primary" /> Poză de profil
                </h2>
              </div>
              <div className="p-6 space-y-6">
                {/* Preview */}
                <div className="flex items-center gap-5">
                  <Avatar className="h-20 w-20 border-2 border-border shadow-sm">
                    <AvatarImage src={previewUrl || user.avatarUrl || undefined} />
                    <AvatarFallback className="gradient-primary text-white text-2xl font-black">{user.displayName.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-semibold">{user.displayName}</p>
                    <p className="text-xs text-muted-foreground">@{user.username}</p>
                    <p className="text-xs text-muted-foreground mt-1">Avatarul tău este vizibil tuturor membrilor</p>
                  </div>
                </div>

                <form onSubmit={handleAvatarSave} className="space-y-4">
                  {/* Upload from computer */}
                  <div>
                    <label className="text-sm font-semibold text-foreground mb-2 block">Încarcă de pe calculator</label>
                    <input
                      ref={avatarFileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      disabled={isProcessingAvatar}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        processAvatarFile(file);
                        if (avatarFileInputRef.current) avatarFileInputRef.current.value = "";
                      }}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => avatarFileInputRef.current?.click()}
                      disabled={isProcessingAvatar}
                      className="w-full h-10 rounded-xl border-dashed border-border/70 hover:border-primary/50 hover:bg-primary/4 gap-2 text-sm font-medium"
                    >
                      {isProcessingAvatar ? (
                        <><Loader2 className="h-4 w-4 animate-spin text-primary" /> Se procesează...</>
                      ) : (
                        <><Upload className="h-4 w-4 text-primary" /> Alege poza de pe calculator</>
                      )}
                    </Button>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="flex-1 border-t border-border/40" />
                    <span className="text-xs text-muted-foreground font-medium">sau lipești URL</span>
                    <div className="flex-1 border-t border-border/40" />
                  </div>

                  <div>
                    <Input
                      value={avatarUrl}
                      onChange={e => {
                        setAvatarUrl(e.target.value);
                        setPreviewUrl(e.target.value);
                      }}
                      placeholder="https://exemplu.com/avatar.jpg"
                      className="h-10 rounded-xl border-border/70"
                    />
                    <p className="text-xs text-muted-foreground mt-1.5">Lipești un URL public de imagine (PNG, JPG, WEBP, GIF)</p>
                  </div>

                  {/* Quick avatar generators */}
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground mb-2">Sau generează unul instant:</p>
                    <div className="flex flex-wrap gap-2">
                      {[
                        { label: "Inițiale", url: `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName)}&background=6366f1&color=fff&size=200&bold=true&rounded=true` },
                        { label: "Pixel Art", url: `https://api.dicebear.com/7.x/pixel-art/svg?seed=${user.username}` },
                        { label: "Avataaars", url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}` },
                        { label: "Forme", url: `https://api.dicebear.com/7.x/shapes/svg?seed=${user.username}` },
                      ].map(preset => (
                        <button
                          key={preset.label}
                          type="button"
                          onClick={() => { setAvatarUrl(preset.url); setPreviewUrl(preset.url); }}
                          className="text-xs px-3 py-1.5 rounded-lg border border-border/70 hover:border-primary/40 hover:bg-primary/6 transition-all font-medium text-muted-foreground hover:text-primary"
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="gradient-primary text-white border-0 h-9 px-5 rounded-xl font-semibold shadow-sm hover:opacity-90"
                    disabled={!avatarUrl.trim() || uploadAvatar.isPending}
                  >
                    {uploadAvatar.isPending ? "Se actualizează..." : "Salvează poza de profil"}
                  </Button>
                  {uploadAvatar.isSuccess && (
                    <div className="flex items-center gap-1.5 text-emerald-600 text-xs font-semibold">
                      <CheckCircle2 className="h-4 w-4" /> Poză actualizată!
                    </div>
                  )}
                </form>
              </div>
            </div>
          )}

          {/* Password tab */}
          {activeTab === "password" && (
            <div className="bg-white rounded-2xl border border-border/60 shadow-xs overflow-hidden">
              <div className="px-6 py-4 border-b border-border/50 bg-gray-50/50">
                <h2 className="font-bold flex items-center gap-2">
                  <Lock className="h-4 w-4 text-primary" /> Schimbă parola
                </h2>
              </div>
              <form onSubmit={handlePasswordSave} className="p-6 space-y-4">
                <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl text-xs text-blue-700 flex items-start gap-2">
                  <Shield className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
                  Alege o parolă puternică cu cel puțin 6 caractere, combinând litere și cifre.
                </div>
                <div>
                  <label className="text-sm font-semibold text-foreground mb-2 block">Parola curentă</label>
                  <Input
                    type="password"
                    value={password.currentPassword}
                    onChange={e => setPassword(p => ({ ...p, currentPassword: e.target.value }))}
                    className="h-10 rounded-xl border-border/70"
                    placeholder="Parola ta actuală"
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold text-foreground mb-2 block">Parola nouă</label>
                  <Input
                    type="password"
                    value={password.newPassword}
                    onChange={e => setPassword(p => ({ ...p, newPassword: e.target.value }))}
                    className="h-10 rounded-xl border-border/70"
                    placeholder="Minim 6 caractere"
                    minLength={6}
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold text-foreground mb-2 block">Confirmă parola nouă</label>
                  <Input
                    type="password"
                    value={password.confirmPassword}
                    onChange={e => setPassword(p => ({ ...p, confirmPassword: e.target.value }))}
                    className={`h-10 rounded-xl ${
                      password.confirmPassword && password.newPassword !== password.confirmPassword
                        ? "border-red-300 focus-visible:ring-red-200"
                        : "border-border/70"
                    }`}
                    placeholder="Repetă noua parolă"
                  />
                  {password.confirmPassword && password.newPassword !== password.confirmPassword && (
                    <p className="text-xs text-red-500 mt-1">Parolele nu coincid</p>
                  )}
                </div>
                <Button
                  type="submit"
                  variant="outline"
                  className="h-9 px-5 rounded-xl font-semibold"
                  disabled={updateSettings.isPending}
                >
                  {updateSettings.isPending ? "Se schimbă..." : "Schimbă parola"}
                </Button>
              </form>
            </div>
          )}

          {/* Referral tab */}
          {activeTab === "referral" && (
            <div className="bg-white rounded-2xl border border-border/60 shadow-xs overflow-hidden">
              <div className="px-6 py-4 border-b border-border/50 bg-gray-50/50">
                <h2 className="font-bold flex items-center gap-2">
                  <Gift className="h-4 w-4 text-primary" /> Program de referral
                </h2>
              </div>
              <div className="p-6 space-y-6">
                {/* How it works */}
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
                  <h3 className="font-bold text-sm text-emerald-800 mb-2">Cum funcționează</h3>
                  <div className="space-y-2">
                    {[
                      "Distribuie linkul tău unic de referral prietenilor",
                      "Când se înregistrează folosind linkul tău, primești +25 puncte",
                      "Nu există limită — invită cât de mulți vrei!",
                    ].map((step, i) => (
                      <div key={i} className="flex items-start gap-2.5 text-xs text-emerald-700">
                        <span className="w-5 h-5 rounded-full bg-emerald-200 text-emerald-800 font-bold flex items-center justify-center flex-shrink-0 mt-0.5 text-[11px]">{i + 1}</span>
                        {step}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Referral code */}
                <div>
                  <label className="text-sm font-semibold text-foreground mb-2 block">Codul tău de referral</label>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-11 px-4 rounded-xl border border-border/70 bg-gray-50 flex items-center font-mono font-bold text-primary tracking-widest text-sm">
                      {(user as any).referralCode || "Se generează..."}
                    </div>
                  </div>
                </div>

                {/* Referral link */}
                <div>
                  <label className="text-sm font-semibold text-foreground mb-2 block">Linkul tău de referral</label>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-10 px-3 rounded-xl border border-border/70 bg-gray-50 flex items-center text-xs text-muted-foreground overflow-hidden">
                      <span className="truncate">{referralLink}</span>
                    </div>
                    <Button
                      type="button"
                      onClick={copyReferralLink}
                      className={`h-10 px-4 rounded-xl font-semibold text-sm gap-2 flex-shrink-0 ${
                        copied
                          ? "bg-emerald-500 text-white border-0 hover:bg-emerald-600"
                          : "gradient-primary text-white border-0 hover:opacity-90"
                      }`}
                    >
                      {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                      {copied ? "Copiat!" : "Copiază"}
                    </Button>
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-4 bg-primary/6 border border-primary/15 rounded-xl text-center">
                    <p className="text-2xl font-extrabold text-primary">{user.points.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground mt-1">Puncte totale</p>
                  </div>
                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-center">
                    <p className="text-2xl font-extrabold text-amber-600">+25</p>
                    <p className="text-xs text-muted-foreground mt-1">Per referral</p>
                  </div>
                  <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-center">
                    <p className="text-2xl font-extrabold text-emerald-600">{referrals.length}</p>
                    <p className="text-xs text-muted-foreground mt-1">Total referrals</p>
                  </div>
                </div>

                {/* Referrals list */}
                <div>
                  <h3 className="font-bold text-sm flex items-center gap-2 mb-3">
                    <Users className="h-4 w-4 text-primary" />
                    Persoane invitate de tine
                    <span className="text-xs font-normal text-muted-foreground">({referrals.length})</span>
                  </h3>
                  {!referralsLoaded ? (
                    <div className="text-center py-6 text-sm text-muted-foreground">Se încarcă...</div>
                  ) : referrals.length === 0 ? (
                    <div className="text-center py-8 bg-gray-50 rounded-xl border border-border/50">
                      <Gift className="h-8 w-8 mx-auto mb-2 text-muted-foreground/40" />
                      <p className="text-sm text-muted-foreground font-medium">Niciun referral încă</p>
                      <p className="text-xs text-muted-foreground/70 mt-1">Distribuie linkul de mai sus și începe să câștigi!</p>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1">
                      {referrals.map((r, i) => (
                        <Link key={r.id} href={`/profile/${r.id}`}>
                          <div className="flex items-center gap-3 p-3 rounded-xl border border-border/50 hover:bg-gray-50 transition-colors cursor-pointer">
                            <span className="text-xs font-bold text-muted-foreground/60 w-5 text-center">#{i + 1}</span>
                            <Avatar className="h-8 w-8 flex-shrink-0">
                              <AvatarImage src={r.avatarUrl || ""} />
                              <AvatarFallback className="text-xs bg-primary/10 text-primary font-bold">
                                {r.displayName?.[0]?.toUpperCase() ?? r.username?.[0]?.toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold truncate">{r.displayName || r.username}</p>
                              <p className="text-xs text-muted-foreground">@{r.username}</p>
                            </div>
                            <div className="text-right flex-shrink-0">
                              <p className="text-xs font-bold text-primary">{r.points.toLocaleString()} pts</p>
                              <p className="text-[11px] text-muted-foreground">
                                {new Date(r.joinedAt).toLocaleDateString("ro-RO", { month: "short", day: "numeric", year: "numeric" })}
                              </p>
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Premium Customization tab */}
          {activeTab === "premium" && (
            <div className="bg-white rounded-2xl border border-border/60 shadow-xs overflow-hidden">
              <div className="px-6 py-4 border-b border-amber-100 bg-gradient-to-r from-amber-50 to-yellow-50">
                <h2 className="font-bold flex items-center gap-2 text-amber-700">
                  <Crown className="h-4 w-4 text-amber-500" /> Personalizare Premium
                </h2>
              </div>
              {(user as any).isPremium ? (
                <div className="p-6 space-y-6">
                  {/* Expiry info */}
                  <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl flex items-center gap-2.5">
                    <Crown className="h-4 w-4 text-amber-500 flex-shrink-0" />
                    <div>
                      <p className="text-xs font-semibold text-amber-700">Premium activ</p>
                      {(user as any).premiumExpiresAt ? (
                        <p className="text-xs text-amber-600/80">
                          Expiră {new Date((user as any).premiumExpiresAt).toLocaleDateString("ro-RO", { month: "long", day: "numeric", year: "numeric" })}
                        </p>
                      ) : (
                        <p className="text-xs text-amber-600/80">Abonament activ</p>
                      )}
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-semibold mb-3 flex items-center gap-2">
                      <Palette className="h-4 w-4 text-amber-500" /> Culoare banner profil
                    </p>
                    <div
                      className={`h-16 rounded-xl mb-4 relative overflow-hidden border border-border/40${!bannerColor ? " gradient-hero" : ""}`}
                      style={bannerColor ? { background: bannerColor } : undefined}
                    >
                      <div className="absolute inset-0 dot-bg opacity-40"></div>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-white/90 text-xs font-semibold drop-shadow">Previzualizare</span>
                      </div>
                    </div>
                    <div className="grid grid-cols-5 gap-2 mb-3">
                      {BANNER_PRESETS.map(p => (
                        <button
                          key={p.value}
                          onClick={() => setBannerColor(p.value)}
                          style={{ background: p.value }}
                          title={p.label}
                          className={`h-10 rounded-lg border-2 transition-all hover:scale-105 ${bannerColor === p.value ? "border-primary shadow-md scale-105" : "border-transparent"}`}
                        />
                      ))}
                    </div>
                    {bannerColor && (
                      <button
                        onClick={() => setBannerColor("")}
                        className="text-xs text-muted-foreground hover:text-foreground underline"
                      >
                        Resetare la implicit
                      </button>
                    )}
                  </div>
                  <Button
                    onClick={handlePremiumSave}
                    disabled={saving}
                    className="gradient-primary text-white border-0 h-9 px-5 rounded-xl font-semibold shadow-sm hover:opacity-90"
                  >
                    {saving ? "Se salvează..." : "Salvează personalizarea"}
                  </Button>
                </div>
              ) : (
                <div className="p-10 text-center space-y-4">
                  <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center mx-auto">
                    <Crown className="h-8 w-8 text-amber-400" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">Deblochează avantajele Premium</h3>
                    <p className="text-sm text-muted-foreground mt-1">Actualizează la Premium pentru a personaliza bannerul profilului, a obține un inel exclusiv pentru avatar și mai multe.</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3 max-w-xs mx-auto text-left">
                    {[
                      { icon: "🎨", text: "Culori personalizate banner" },
                      { icon: "👑", text: "Inel exclusiv Premium" },
                      { icon: "∞", text: "Întrebări nelimitate/zi" },
                      { icon: "⚡", text: "Răspunsuri nelimitate/zi" },
                    ].map((f, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{f.icon}</span> {f.text}
                      </div>
                    ))}
                  </div>
                  <Button
                    onClick={() => window.location.href = "/buy-points"}
                    className="gradient-primary text-white border-0 h-9 px-6 rounded-xl font-semibold shadow-sm hover:opacity-90"
                  >
                    <Sparkles className="h-4 w-4 mr-1" /> Actualizare la Premium — $4.99/lună
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
