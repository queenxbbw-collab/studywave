import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { useUpdateSettings, useUploadAvatar } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { useLocation, Link } from "wouter";
import { Settings, User, Lock, Camera, ChevronLeft, CheckCircle2, Shield, Zap, Gift, Copy, Check } from "lucide-react";

const NAV_ITEMS = [
  { id: "profile", icon: User, label: "Profile" },
  { id: "avatar", icon: Camera, label: "Profile Picture" },
  { id: "password", icon: Lock, label: "Password" },
  { id: "referral", icon: Gift, label: "Referral" },
];

export default function SettingsPage() {
  const { user, updateUser } = useAuth();
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
  });
  const [password, setPassword] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || "");
  const [previewUrl, setPreviewUrl] = useState(user?.avatarUrl || "");
  const [saving, setSaving] = useState(false);

  if (!user) { navigate("/login"); return null; }

  const referralLink = `${window.location.origin}/register?ref=${(user as any).referralCode || ""}`;

  const copyReferralLink = () => {
    navigator.clipboard.writeText(referralLink).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({ title: "Referral link copied to clipboard!" });
    });
  };

  const handleProfileSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    updateSettings.mutate({ data: profile }, {
      onSuccess: updated => {
        updateUser(updated);
        toast({ title: "Profile updated successfully!" });
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
        toast({ title: "Profile picture updated!" });
      },
      onError: e => toast({ title: e.message, variant: "destructive" }),
    });
  };

  const handlePasswordSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (password.newPassword !== password.confirmPassword) {
      toast({ title: "Passwords do not match", variant: "destructive" });
      return;
    }
    if (password.newPassword.length < 6) {
      toast({ title: "Password must be at least 6 characters", variant: "destructive" });
      return;
    }
    updateSettings.mutate({ data: { currentPassword: password.currentPassword, newPassword: password.newPassword } }, {
      onSuccess: () => {
        setPassword({ currentPassword: "", newPassword: "", confirmPassword: "" });
        toast({ title: "Password changed successfully!" });
      },
      onError: e => toast({ title: e.message, variant: "destructive" }),
    });
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center gap-2 mb-6">
        <Link href={`/profile/${user.id}`}>
          <button className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ChevronLeft className="h-4 w-4" /> Profile
          </button>
        </Link>
        <span className="text-muted-foreground/40">/</span>
        <span className="text-sm text-muted-foreground">Account Settings</span>
      </div>

      <div className="mb-7">
        <h1 className="text-2xl font-extrabold tracking-tight">Account Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage your account information and preferences</p>
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
              <span className="text-xs font-bold text-primary">{user.points.toLocaleString()} points</span>
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
                  <User className="h-4 w-4 text-primary" /> Profile Information
                </h2>
              </div>
              <form onSubmit={handleProfileSave} className="p-6 space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-semibold text-foreground mb-2 block">Display name</label>
                    <Input
                      value={profile.displayName}
                      onChange={e => setProfile(p => ({ ...p, displayName: e.target.value }))}
                      className="h-10 rounded-xl border-border/70"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-foreground mb-2 block">Email address</label>
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
                    placeholder="Tell us a bit about yourself, your specialization or subjects you enjoy..."
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
                    {saving ? "Saving..." : "Save profile"}
                  </Button>
                  {updateSettings.isSuccess && activeTab === "profile" && (
                    <div className="flex items-center gap-1.5 text-emerald-600 text-xs font-semibold">
                      <CheckCircle2 className="h-4 w-4" /> Saved!
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
                  <Camera className="h-4 w-4 text-primary" /> Profile Picture
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
                    <p className="text-xs text-muted-foreground mt-1">Your avatar is visible to all members</p>
                  </div>
                </div>

                <form onSubmit={handleAvatarSave} className="space-y-4">
                  <div>
                    <label className="text-sm font-semibold text-foreground mb-2 block">Image URL</label>
                    <Input
                      value={avatarUrl}
                      onChange={e => {
                        setAvatarUrl(e.target.value);
                        setPreviewUrl(e.target.value);
                      }}
                      placeholder="https://example.com/avatar.jpg"
                      className="h-10 rounded-xl border-border/70"
                    />
                    <p className="text-xs text-muted-foreground mt-1.5">Paste a public image URL (PNG, JPG, WEBP, GIF)</p>
                  </div>

                  {/* Quick avatar generators */}
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground mb-2">Or generate one instantly:</p>
                    <div className="flex flex-wrap gap-2">
                      {[
                        { label: "Initials", url: `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName)}&background=6366f1&color=fff&size=200&bold=true&rounded=true` },
                        { label: "Pixel Art", url: `https://api.dicebear.com/7.x/pixel-art/svg?seed=${user.username}` },
                        { label: "Avataaars", url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}` },
                        { label: "Shapes", url: `https://api.dicebear.com/7.x/shapes/svg?seed=${user.username}` },
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
                    {uploadAvatar.isPending ? "Updating..." : "Save profile picture"}
                  </Button>
                  {uploadAvatar.isSuccess && (
                    <div className="flex items-center gap-1.5 text-emerald-600 text-xs font-semibold">
                      <CheckCircle2 className="h-4 w-4" /> Picture updated!
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
                  <Lock className="h-4 w-4 text-primary" /> Change Password
                </h2>
              </div>
              <form onSubmit={handlePasswordSave} className="p-6 space-y-4">
                <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl text-xs text-blue-700 flex items-start gap-2">
                  <Shield className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
                  Choose a strong password with at least 6 characters, combining letters and numbers.
                </div>
                <div>
                  <label className="text-sm font-semibold text-foreground mb-2 block">Current password</label>
                  <Input
                    type="password"
                    value={password.currentPassword}
                    onChange={e => setPassword(p => ({ ...p, currentPassword: e.target.value }))}
                    className="h-10 rounded-xl border-border/70"
                    placeholder="Your current password"
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold text-foreground mb-2 block">New password</label>
                  <Input
                    type="password"
                    value={password.newPassword}
                    onChange={e => setPassword(p => ({ ...p, newPassword: e.target.value }))}
                    className="h-10 rounded-xl border-border/70"
                    placeholder="Minimum 6 characters"
                    minLength={6}
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold text-foreground mb-2 block">Confirm new password</label>
                  <Input
                    type="password"
                    value={password.confirmPassword}
                    onChange={e => setPassword(p => ({ ...p, confirmPassword: e.target.value }))}
                    className={`h-10 rounded-xl ${
                      password.confirmPassword && password.newPassword !== password.confirmPassword
                        ? "border-red-300 focus-visible:ring-red-200"
                        : "border-border/70"
                    }`}
                    placeholder="Repeat new password"
                  />
                  {password.confirmPassword && password.newPassword !== password.confirmPassword && (
                    <p className="text-xs text-red-500 mt-1">Passwords do not match</p>
                  )}
                </div>
                <Button
                  type="submit"
                  variant="outline"
                  className="h-9 px-5 rounded-xl font-semibold"
                  disabled={updateSettings.isPending}
                >
                  {updateSettings.isPending ? "Changing..." : "Change password"}
                </Button>
              </form>
            </div>
          )}

          {/* Referral tab */}
          {activeTab === "referral" && (
            <div className="bg-white rounded-2xl border border-border/60 shadow-xs overflow-hidden">
              <div className="px-6 py-4 border-b border-border/50 bg-gray-50/50">
                <h2 className="font-bold flex items-center gap-2">
                  <Gift className="h-4 w-4 text-primary" /> Referral Program
                </h2>
              </div>
              <div className="p-6 space-y-6">
                {/* How it works */}
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
                  <h3 className="font-bold text-sm text-emerald-800 mb-2">How it works</h3>
                  <div className="space-y-2">
                    {[
                      "Share your unique referral link with friends",
                      "When they register using your link, you earn +25 points",
                      "There's no limit — invite as many people as you want!",
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
                  <label className="text-sm font-semibold text-foreground mb-2 block">Your referral code</label>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-11 px-4 rounded-xl border border-border/70 bg-gray-50 flex items-center font-mono font-bold text-primary tracking-widest text-sm">
                      {(user as any).referralCode || "Generating..."}
                    </div>
                  </div>
                </div>

                {/* Referral link */}
                <div>
                  <label className="text-sm font-semibold text-foreground mb-2 block">Your referral link</label>
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
                      {copied ? "Copied!" : "Copy"}
                    </Button>
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-primary/6 border border-primary/15 rounded-xl text-center">
                    <p className="text-2xl font-extrabold text-primary">{user.points.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground mt-1">Total points earned</p>
                  </div>
                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-center">
                    <p className="text-2xl font-extrabold text-amber-600">+25</p>
                    <p className="text-xs text-muted-foreground mt-1">Points per referral</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
