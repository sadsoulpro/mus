import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api, useAuth } from "@/App";
import { toast } from "sonner";
import { User, Mail, Lock, Trash2, AlertTriangle } from "lucide-react";
import { motion } from "framer-motion";
import Sidebar from "@/components/Sidebar";
import { useLanguage } from "@/contexts/LanguageContext";

export default function Settings() {
  const { user, logout, refreshUser } = useAuth();
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  
  const [profileForm, setProfileForm] = useState({
    username: user?.username || "",
    email: user?.email || ""
  });
  const [profileLoading, setProfileLoading] = useState(false);
  
  const [passwordForm, setPasswordForm] = useState({
    current_password: "",
    new_password: "",
    confirm_password: ""
  });
  const [passwordLoading, setPasswordLoading] = useState(false);
  
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Get delete confirmation word based on language
  const getDeleteWord = () => {
    if (language === 'ru') return 'УДАЛИТЬ';
    if (language === 'es') return 'ELIMINAR';
    return 'DELETE';
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    if (!profileForm.username.trim()) { toast.error(t('auth', 'usernameRequired')); return; }
    if (!profileForm.email.trim()) { toast.error(t('auth', 'emailRequired')); return; }
    
    setProfileLoading(true);
    try {
      const response = await api.put("/settings/profile", { username: profileForm.username, email: profileForm.email });
      toast.success(t('settings', 'settingsSaved'));
      if (refreshUser) await refreshUser();
    } catch (error) {
      toast.error(typeof (error.response?.data?.detail) === "string" ? error.response.data.detail : t('errors', 'saveFailed'));
    } finally {
      setProfileLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (!passwordForm.current_password) { toast.error(t('auth', 'passwordRequired')); return; }
    if (passwordForm.new_password.length < 6) { toast.error(t('auth', 'passwordMinLength')); return; }
    if (passwordForm.new_password !== passwordForm.confirm_password) { toast.error(t('errors', 'validationError')); return; }
    
    setPasswordLoading(true);
    try {
      const response = await api.put("/settings/password", { current_password: passwordForm.current_password, new_password: passwordForm.new_password });
      toast.success(t('settings', 'settingsSaved'));
      setPasswordForm({ current_password: "", new_password: "", confirm_password: "" });
    } catch (error) {
      toast.error(typeof (error.response?.data?.detail) === "string" ? error.response.data.detail : t('errors', 'saveFailed'));
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== getDeleteWord()) { toast.error(t('errors', 'validationError')); return; }
    setDeleteLoading(true);
    try {
      await api.delete("/settings/account");
      toast.success(t('common', 'success'));
      logout();
      navigate("/");
    } catch (error) {
      toast.error(typeof (error.response?.data?.detail) === "string" ? error.response.data.detail : t('errors', 'deleteFailed'));
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <Sidebar>
      <div className="max-w-2xl mx-auto p-4 sm:p-6 lg:p-10">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-xl sm:text-2xl font-display mb-2">{t('settings', 'title')}</h1>
          <p className="text-sm sm:text-base text-muted-foreground">{t('settings', 'profile')} & {t('settings', 'security')}</p>
        </div>
        
        {/* Profile Section */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="p-4 sm:p-6 rounded-2xl panel-card mb-4 sm:mb-6">
          <div className="flex items-center gap-3 mb-4 sm:mb-6">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
              <User className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500" />
            </div>
            <div>
              <h2 className="font-semibold text-sm sm:text-base">{t('settings', 'profile')}</h2>
              <p className="text-xs sm:text-sm text-muted-foreground">{t('settings', 'changeEmail')}</p>
            </div>
          </div>
          
          <form onSubmit={handleProfileSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username" className="text-sm">{t('common', 'username')}</Label>
              <Input id="username" value={profileForm.username} onChange={(e) => setProfileForm(prev => ({ ...prev, username: e.target.value }))} className="bg-zinc-800 border-zinc-700" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm">{t('common', 'email')}</Label>
              <Input id="email" type="email" value={profileForm.email} onChange={(e) => setProfileForm(prev => ({ ...prev, email: e.target.value }))} className="bg-zinc-800 border-zinc-700" />
            </div>
            <Button type="submit" disabled={profileLoading} className="w-full sm:w-auto bg-primary hover:bg-primary/90">
              {profileLoading ? t('common', 'loading') : t('common', 'save')}
            </Button>
          </form>
        </motion.div>
        
        {/* Password Section */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="p-4 sm:p-6 rounded-2xl panel-card mb-4 sm:mb-6">
          <div className="flex items-center gap-3 mb-4 sm:mb-6">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
              <Lock className="w-4 h-4 sm:w-5 sm:h-5 text-purple-500" />
            </div>
            <div>
              <h2 className="font-semibold text-sm sm:text-base">{t('settings', 'security')}</h2>
              <p className="text-xs sm:text-sm text-muted-foreground">{t('settings', 'changePassword')}</p>
            </div>
          </div>
          
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="current_password" className="text-sm">{t('settings', 'currentPassword')}</Label>
              <Input id="current_password" type="password" value={passwordForm.current_password} onChange={(e) => setPasswordForm(prev => ({ ...prev, current_password: e.target.value }))} className="bg-zinc-800 border-zinc-700" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new_password" className="text-sm">{t('settings', 'newPassword')}</Label>
              <Input id="new_password" type="password" value={passwordForm.new_password} onChange={(e) => setPasswordForm(prev => ({ ...prev, new_password: e.target.value }))} className="bg-zinc-800 border-zinc-700" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm_password" className="text-sm">{t('settings', 'confirmNewPassword')}</Label>
              <Input id="confirm_password" type="password" value={passwordForm.confirm_password} onChange={(e) => setPasswordForm(prev => ({ ...prev, confirm_password: e.target.value }))} className="bg-zinc-800 border-zinc-700" />
            </div>
            <Button type="submit" disabled={passwordLoading} className="w-full sm:w-auto bg-primary hover:bg-primary/90">
              {passwordLoading ? t('common', 'loading') : t('settings', 'changePassword')}
            </Button>
          </form>
        </motion.div>
        
        {/* Danger Zone */}
        {user?.role !== "admin" && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="p-4 sm:p-6 rounded-2xl bg-red-500/5 border border-red-500/20">
            <div className="flex items-center gap-3 mb-4 sm:mb-6">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-red-500/10 flex items-center justify-center">
                <Trash2 className="w-4 h-4 sm:w-5 sm:h-5 text-red-500" />
              </div>
              <div>
                <h2 className="font-semibold text-sm sm:text-base text-red-400">{t('settings', 'deleteAccount')}</h2>
                <p className="text-xs sm:text-sm text-red-400/70">{t('settings', 'deleteAccountWarning')}</p>
              </div>
            </div>
            
            {!showDeleteConfirm ? (
              <Button variant="outline" onClick={() => setShowDeleteConfirm(true)} className="w-full sm:w-auto border-red-500/30 text-red-400 hover:bg-red-500/10">
                {t('settings', 'deleteAccount')}
              </Button>
            ) : (
              <div className="space-y-4">
                <div className="p-3 sm:p-4 bg-red-500/10 rounded-xl flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <p className="text-xs sm:text-sm text-red-400">{t('settings', 'deleteAccountWarning')} {getDeleteWord()}</p>
                </div>
                <Input value={deleteConfirmText} onChange={(e) => setDeleteConfirmText(e.target.value)} placeholder={getDeleteWord()} className="bg-zinc-800 border-red-500/30" />
                <div className="flex flex-col sm:flex-row gap-2">
                  <Button onClick={handleDeleteAccount} disabled={deleteLoading} className="bg-red-500 hover:bg-red-600">
                    {deleteLoading ? t('common', 'loading') : t('common', 'confirm')}
                  </Button>
                  <Button variant="ghost" onClick={() => { setShowDeleteConfirm(false); setDeleteConfirmText(""); }}>
                    {t('common', 'cancel')}
                  </Button>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </div>
    </Sidebar>
  );
}
