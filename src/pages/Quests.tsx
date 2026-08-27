import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Target, CheckCircle, Clock, Trophy, Star } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface Quest {
  id: string;
  title: string;
  description: string;
  type: 'daily' | 'weekly' | 'achievement';
  requirements: Record<string, number>;
  reward_xp: number;
}

interface UserQuest {
  id: string;
  quest_id: string;
  progress: Record<string, number>;
  completed_at: string | null;
  claimed_at: string | null;
}

export default function Quests() {
  const { user } = useAuth();
  const [quests, setQuests] = useState<Quest[]>([]);
  const [userQuests, setUserQuests] = useState<UserQuest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const loadData = async () => {
      const [questsRes, userQuestsRes] = await Promise.all([
        supabase.from('quests').select('*'),
        supabase.from('user_quests').select('*').eq('user_id', user.id)
      ]);

      if (questsRes.data) setQuests(questsRes.data);
      if (userQuestsRes.data) setUserQuests(userQuestsRes.data);
      setLoading(false);
    };

    loadData();
  }, [user]);

  const getProgress = (quest: Quest) => {
    const userQuest = userQuests.find(uq => uq.quest_id === quest.id);
    if (!userQuest) return { progress: 0, completed: false, claimed: false };

    const total = Object.values(quest.requirements).reduce((a, b) => a + b, 0);
    const current = Object.entries(quest.requirements).reduce((sum, [key, req]) => {
      return sum + Math.min(userQuest.progress[key] || 0, req);
    }, 0);

    return {
      progress: total > 0 ? (current / total) * 100 : 0,
      completed: userQuest.completed_at !== null,
      claimed: userQuest.claimed_at !== null
    };
  };

  const claimReward = async (questId: string) => {
    if (!user) return;

    const { error } = await supabase.rpc('claim_quest_reward', {
      p_quest_id: questId
    });

    if (error) {
      toast.error('Помилка при отриманні нагороди');
    } else {
      toast.success('Нагороду отримано!');
      // Refresh data
      const { data } = await supabase.from('user_quests').select('*').eq('user_id', user.id);
      if (data) setUserQuests(data);
    }
  };

  if (!user) {
    return (
      <div className="container py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Квести</h1>
          <p>Увійдіть щоб переглядати квести</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container py-8">
        <div className="text-center">Завантаження...</div>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
          <Target className="text-accent" />
          Квести
        </h1>
        <p className="text-muted-foreground">
          Виконуйте завдання та отримуйте XP для підвищення рівня
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {quests.map((quest) => {
          const { progress, completed, claimed } = getProgress(quest);

          return (
            <motion.div
              key={quest.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card className={`relative ${completed ? 'border-green-500/50 bg-green-500/5' : ''}`}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg flex items-center gap-2">
                        {quest.type === 'daily' && <Clock size={16} className="text-blue-500" />}
                        {quest.type === 'achievement' && <Trophy size={16} className="text-yellow-500" />}
                        {quest.title}
                      </CardTitle>
                      <CardDescription>{quest.description}</CardDescription>
                    </div>
                    {completed && <CheckCircle className="text-green-500" size={20} />}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span>Прогрес</span>
                        <span>{Math.round(progress)}%</span>
                      </div>
                      <Progress value={progress} className="h-2" />
                    </div>

                    <div className="text-sm text-muted-foreground">
                      Нагорода: <span className="font-semibold text-accent">{quest.reward_xp} XP</span>
                    </div>

                    {completed && !claimed && (
                      <Button
                        onClick={() => claimReward(quest.id)}
                        className="w-full"
                        size="sm"
                      >
                        <Star className="mr-2" size={14} />
                        Отримати нагороду
                      </Button>
                    )}

                    {claimed && (
                      <div className="text-center text-sm text-green-600 font-medium">
                        ✓ Нагороду отримано
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
