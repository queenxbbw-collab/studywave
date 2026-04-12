import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { useUpdateSettings, useUploadAvatar } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { useLocation, Link } from "wouter";
import { Settings, User, Lock, Camera, ChevronLeft, CheckCircle2, Shield, Bell, Zap } from "lucide-react";

const NAV_ITEMS = [
  { id: "profile", icon: User, label: "Profil" },
  { id: "avatar", icon: Camera, label: "Avatar" },
  { id: "password", icon: Lock, label: "Parola" },
];

export default function SettingsPage() {
  const { user, updateUser } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("profile");

  const updateSettings = useUpdateSettings();
  const uploadAvatar = useUploadAvatar();

  const [profile, setProfile] = useState({
    displayName: user?.displayName || "",
    bio: user?.bio || "",
    email: user?.email || "",
  });
  const [password, setPassword] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || "");
  const [saving, setSaving] = useState(false);

  if (!user) { navigate("/login"); return null; }

  const handleProfileSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    updateSettings.mutate({ data: profile }, {
      onSuccess: updated => {
        updateUser(updated);
        toast({ title: "Profil actualizat cu succes!" });
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
        toast({ title: "Avatar actualizat!" });
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
    updateSettings.mutate({ data: { currentPassword: password.currentPassword, newPassword: password.newPassword } }, {
      onSuccess: () => {
        setPassword({ currentPassword: "", newPassword: "", confirmPassword: "" });
        toast({ title: "Parola schimbata cu succes!" });
      },
      onError: e => toast({ title: e.message, variant: "destructive" }),
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
        <span className="text-sm text-muted-foreground">Setari cont</span>
      </div>

      <div className="mb-7">
        <h1 className="text-2xl font-extrabold tracking-tight">Setari cont</h1>
        <p className="text-sm text-muted-foreground mt-1">Gestioneaza informatiile si preferintele contului tau</p>
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
                  <User className="h-4 w-4 text-primary" /> Informatii profil
                </h2>
              </div>
              <form onSubmit={handleProfileSave} className="p-6 space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-semibold text-foreground mb-2 block">Nume afisat</label>
                    <Input
                      value={profile.displayName}
                      onChange={e => setProfile(p => ({ ...p, displayName: e.target.value }))}
                      className="h-10 rounded-xl border-border/70"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-foreground mb-2 block">Email</label>
                    <Input
                      type="email"
                      value={profile.email}
                      onChange={e => setProfile(p => ({ ...p, email: e.target.value }))}
                      className="h-10 rounded-xl border-border/70"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-semibold text-foreground mb-2 block">Biografie</label>
                  <Textarea
                    value={profile.bio}
                    onChange={e => setProfile(p => ({ ...p, bio: e.target.value }))}
                    placeholder="Spune ceva despre tine, specializarea ta sau ce materii iti plac..."
                    rows={3}
                    className="resize-none rounded-xl border-border/70 text-sm"
                  />
                </div>
                <div className="flex items-center gap-3 pt-2">
                  <Button
                    type="submit"
                    className="gradient-primary text-white border-0 h-9 px-5 rounded-xl font-semibold shadow-sm hover:opacity-90"
                    disabled={saving}
                  >
                    {saving ? "Se salveaza..." : "Salveaza profilul"}
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
                  <Camera className="h-4 w-4 text-primary" /> Foto de profil
                </h2>
              </div>
              <div className="p-6 space-y-6">
                {/* Preview */}
                <div className="flex items-center gap-5">
                  <Avatar className="h-20 w-20 border-2 border-border shadow-sm">
                    <AvatarImage src={avatarUrl || user.avatarUrl || undefined} />
                    <AvatarFallback className="gradient-primary text-white text-2xl font-black">{user.displayName.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-semibold">{user.displayName}</p>
                    <p className="text-xs text-muted-foreground">@{user.username}</p>
                    <p className="text-xs text-muted-foreground mt-1">Avatarul tau este vizibil pentru toti membrii</p>
                  </div>
                </div>

                <form onSubmit={handleAvatarSave} className="space-y-3">
                  <div>
                    <label className="text-sm font-semibold text-foreground mb-2 block">URL imagine</label>
                    <Input
                      value={avatarUrl}
                      onChange={e => setAvatarUrl(e.target.value)}
                      placeholder="https://example.com/avatar.jpg"
                      className="h-10 rounded-xl border-border/70"
                    />
                    <p className="text-xs text-muted-foreground mt-1.5">Suporta imagini PNG, JPG, WEBP</p>
                  </div>
                  <Button
                    type="submit"
                    className="gradient-primary text-white border-0 h-9 px-5 rounded-xl font-semibold shadow-sm hover:opacity-90"
                    disabled={!avatarUrl.trim() || uploadAvatar.isPending}
                  >
                    {uploadAvatar.isPending ? "Se actualizeaza..." : "Actualizeaza avatarul"}
                  </Button>
                </form>
              </div>
            </div>
          )}

          {/* Password tab */}
          {activeTab === "password" && (
            <div className="bg-white rounded-2xl border border-border/60 shadow-xs overflow-hidden">
              <div className="px-6 py-4 border-b border-border/50 bg-gray-50/50">
                <h2 className="font-bold flex items-center gap-2">
                  <Lock className="h-4 w-4 text-primary" /> Schimba parola
                </h2>
              </div>
              <form onSubmit={handlePasswordSave} className="p-6 space-y-4">
                <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl text-xs text-blue-700 flex items-start gap-2">
                  <Shield className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
                  Alege o parola puternica cu cel putin 6 caractere, combinand litere si cifre.
                </div>
                <div>
                  <label className="text-sm font-semibold text-foreground mb-2 block">Parola actuala</label>
                  <Input
                    type="password"
                    value={password.currentPassword}
                    onChange={e => setPassword(p => ({ ...p, currentPassword: e.target.value }))}
                    className="h-10 rounded-xl border-border/70"
                    placeholder="Parola ta actuala"
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold text-foreground mb-2 block">Parola noua</label>
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
                  <label className="text-sm font-semibold text-foreground mb-2 block">Confirma parola noua</label>
                  <Input
                    type="password"
                    value={password.confirmPassword}
                    onChange={e => setPassword(p => ({ ...p, confirmPassword: e.target.value }))}
                    className={`h-10 rounded-xl ${
                      password.confirmPassword && password.newPassword !== password.confirmPassword
                        ? "border-red-300 focus-visible:ring-red-200"
                        : "border-border/70"
                    }`}
                    placeholder="Repeta parola noua"
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
                  {updateSettings.isPending ? "Se schimba..." : "Schimba parola"}
                </Button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
