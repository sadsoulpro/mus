import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { api } from "@/App";
import { toast } from "sonner";
import { ArrowLeft, Eye, MousePointer, TrendingUp } from "lucide-react";
import { FaSpotify, FaApple, FaYoutube, FaSoundcloud, FaLink } from "react-icons/fa";
import { SiTidal } from "react-icons/si";
import { motion } from "framer-motion";

const PLATFORMS = {
  spotify: { name: "Spotify", icon: FaSpotify, color: "#1DB954" },
  apple: { name: "Apple Music", icon: FaApple, color: "#FA233B" },
  youtube: { name: "YouTube", icon: FaYoutube, color: "#FF0000" },
  soundcloud: { name: "SoundCloud", icon: FaSoundcloud, color: "#FF5500" },
  tidal: { name: "Tidal", icon: SiTidal, color: "#000000" },
  deezer: { name: "Deezer", icon: FaLink, color: "#00C7F2" },
  custom: { name: "Custom Link", icon: FaLink, color: "#888888" },
};

export default function Analytics() {
  const { pageId } = useParams();
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, [pageId]);

  const fetchAnalytics = async () => {
    try {
      const response = await api.get(`/analytics/${pageId}`);
      setAnalytics(response.data);
    } catch (error) {
      toast.error("Failed to load analytics");
    } finally {
      setLoading(false);
    }
  };

  const getPlatformInfo = (platformId) => {
    return PLATFORMS[platformId] || PLATFORMS.custom;
  };

  const ctr = analytics && analytics.views > 0 
    ? ((analytics.total_clicks / analytics.views) * 100).toFixed(1)
    : 0;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary"></div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Аналитика не найдена</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center gap-4">
          <Link to="/dashboard">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <h1 className="font-semibold">Статистика страницы</h1>
        </div>
      </header>
      
      <main className="max-w-4xl mx-auto p-6">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-6 rounded-2xl bg-zinc-900/50 border border-white/5"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Eye className="w-5 h-5 text-primary" />
              </div>
              <span className="text-muted-foreground">Просмотры страниц</span>
            </div>
            <p className="text-4xl font-semibold" data-testid="page-views">
              {analytics.views.toLocaleString()}
            </p>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="p-6 rounded-2xl bg-zinc-900/50 border border-white/5"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center">
                <MousePointer className="w-5 h-5 text-green-500" />
              </div>
              <span className="text-muted-foreground">Всего кликов</span>
            </div>
            <p className="text-4xl font-semibold" data-testid="total-clicks">
              {analytics.total_clicks.toLocaleString()}
            </p>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="p-6 rounded-2xl bg-zinc-900/50 border border-white/5"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-blue-500" />
              </div>
              <span className="text-muted-foreground">Коэффициент кликов</span>
            </div>
            <p className="text-4xl font-semibold" data-testid="click-rate">
              {ctr}%
            </p>
          </motion.div>
        </div>
        
        {/* Clicks by Platform */}
        <section>
          <h2 className="text-lg font-semibold mb-4">Clicks by Platform</h2>
          <div className="space-y-3">
            {analytics.links?.map((link, i) => {
              const platform = getPlatformInfo(link.platform);
              const Icon = platform.icon;
              const percentage = analytics.total_clicks > 0 
                ? ((link.clicks / analytics.total_clicks) * 100).toFixed(1)
                : 0;
              
              return (
                <motion.div
                  key={link.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="p-4 rounded-xl bg-zinc-900/50 border border-white/5"
                  data-testid={`platform-stat-${link.platform}`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-10 h-10 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: platform.color }}
                      >
                        <Icon className="w-5 h-5 text-white" />
                      </div>
                      <span className="font-medium">{platform.name}</span>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{link.clicks.toLocaleString()}</p>
                      <p className="text-sm text-muted-foreground">{percentage}%</p>
                    </div>
                  </div>
                  
                  {/* Progress Bar */}
                  <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${percentage}%` }}
                      transition={{ duration: 0.5, delay: 0.3 + i * 0.05 }}
                      className="h-full rounded-full"
                      style={{ backgroundColor: platform.color }}
                    />
                  </div>
                </motion.div>
              );
            })}
            
            {(!analytics.links || analytics.links.length === 0) && (
              <p className="text-center text-muted-foreground py-8 border border-dashed border-zinc-800 rounded-xl">
                Данные по платформе пока отсутствуют. Добавьте ссылки на свою страницу, чтобы начать отслеживание.
              </p>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
