import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { useUpdateSettings, useUploadAvatar, getGetMeQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { Settings, User, Lock, Camera } from "lucide-react";

export default function SettingsPage() {
  const { user, updateUser } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const updateSettings = useUpdateSettings();
  const uploadAvatar = useUploadAvatar();

  const [profile, setProfile] = useState({
    displayName: user?.displayName || "",
    bio: user?.bio || "",
    email: user?.email || "",
  });
  const [password, setPassword] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [avatarUrl, setAvatarUrl] = useState("");

  if (!user) { navigate("/login"); return null; }

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings.mutate({ data: profile }, {
      onSuccess: (updated) => {
        updateUser(updated);
        toast({ title: "Profil actualizat cu succes!" });
      },
      onError: (e) => toast({ title: e.message, variant: "destructive" }),
    });
  };

  const handlePasswordSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.newPassword !== password.confirmPassword) {
      toast({ title: "Parolele nu coincid", variant: "destructive" });
      return;
    }
    if (password.newPassword.length < 6) {
      toast({ title: "Parola trebuie sa aiba minim 6 caractere", variant: "destructive" });
      return;
    }
    updateSettings.mutate({ data: { currentPassword: password.currentPassword, newPassword: password.newPassword } }, {
      onSuccess: () => {
        setPassword({ currentPassword: "", newPassword: "", confirmPassword: "" });
        toast({ title: "Parola schimbata cu succes!" });
      },
      onError: (e) => toast({ title: e.message, variant: "destructive" }),
    });
  };

  const handleAvatarSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!avatarUrl.trim()) return;
    uploadAvatar.mutate({ data: { avatarUrl } }, {
      onSuccess: (updated) => {
        updateUser(updated);
        setAvatarUrl("");
        toast({ title: "Avatar actualizat!" });
      },
      onError: (e) => toast({ title: e.message, variant: "destructive" }),
    });
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <Settings className="h-5 w-5 text-primary" />
        </div>
        <h1 className="text-2xl font-bold">Setari cont</h1>
      </div>

      {/* Avatar */}
      <div className="bg-card border border-border rounded-2xl p-6 mb-6">
        <h2 className="font-semibold mb-4 flex items-center gap-2"><Camera className="h-4 w-4 text-primary" /> Avatar</h2>
        <div className="flex items-center gap-4 mb-4">
          <Avatar className="h-16 w-16">
            <AvatarImage src={user.avatarUrl || undefined} />
            <AvatarFallback className="bg-primary text-primary-foreground text-xl font-bold">
              {user.displayName.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="text-sm font-medium">{user.displayName}</p>
            <p className="text-xs text-muted-foreground">@{user.username}</p>
            <p className="text-xs text-primary mt-1">{user.points} puncte</p>
          </div>
        </div>
        <form onSubmit={handleAvatarSave} className="flex gap-2">
          <Input
            value={avatarUrl}
            onChange={e => setAvatarUrl(e.target.value)}
            placeholder="URL imagine (https://...)"
            className="flex-1"
          />
          <Button type="submit" variant="secondary" disabled={!avatarUrl.trim()}>
            Salveaza
          </Button>
        </form>
      </div>

      {/* Profile info */}
      <div className="bg-card border border-border rounded-2xl p-6 mb-6">
        <h2 className="font-semibold mb-4 flex items-center gap-2"><User className="h-4 w-4 text-primary" /> Informatii profil</h2>
        <form onSubmit={handleProfileSave} className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Nume afisat</label>
            <Input
              value={profile.displayName}
              onChange={e => setProfile(p => ({ ...p, displayName: e.target.value }))}
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">Email</label>
            <Input
              type="email"
              value={profile.email}
              onChange={e => setProfile(p => ({ ...p, email: e.target.value }))}
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">Biografie</label>
            <Textarea
              value={profile.bio}
              onChange={e => setProfile(p => ({ ...p, bio: e.target.value }))}
              placeholder="Spune ceva despre tine..."
              rows={3}
            />
          </div>
          <Button type="submit" disabled={updateSettings.isPending}>
            {updateSettings.isPending ? "Se salveaza..." : "Salveaza profilul"}
          </Button>
        </form>
      </div>

      {/* Password */}
      <div className="bg-card border border-border rounded-2xl p-6">
        <h2 className="font-semibold mb-4 flex items-center gap-2"><Lock className="h-4 w-4 text-primary" /> Schimba parola</h2>
        <form onSubmit={handlePasswordSave} className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Parola actuala</label>
            <Input
              type="password"
              value={password.currentPassword}
              onChange={e => setPassword(p => ({ ...p, currentPassword: e.target.value }))}
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">Parola noua</label>
            <Input
              type="password"
              value={password.newPassword}
              onChange={e => setPassword(p => ({ ...p, newPassword: e.target.value }))}
              minLength={6}
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">Confirma parola noua</label>
            <Input
              type="password"
              value={password.confirmPassword}
              onChange={e => setPassword(p => ({ ...p, confirmPassword: e.target.value }))}
            />
          </div>
          <Button type="submit" variant="outline" disabled={updateSettings.isPending}>
            Schimba parola
          </Button>
        </form>
      </div>
    </div>
  );
}
