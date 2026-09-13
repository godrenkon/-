import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useI18n } from '@/lib/i18n';
import { useAuth } from '@/lib/AuthContext';
import { rpgStore } from '@/lib/rpgStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/components/ui/use-toast';
import { Plus, Users, Trash2, ChevronRight } from 'lucide-react';

export default function Teams() {
  const { t } = useI18n();
  const { user } = useAuth();
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newTeam, setNewTeam] = useState({ name: '', description: '' });

  useEffect(() => { loadTeams(); }, []);

  const loadTeams = async () => {
    try {
      const data = await rpgStore.entities.Team.filter({}, '-created_date', 50);
      setTeams(data || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const createTeam = async () => {
    if (!newTeam.name) return;
    try {
      const team = await rpgStore.entities.Team.create({
        ...newTeam,
        members: [user.id],
        member_roles: { [user.id]: 'admin' },
        shared_assets: [],
      });
      setTeams([team, ...teams]);
      setNewTeam({ name: '', description: '' });
      setShowCreate(false);
      toast({ title: t('saved') });
    } catch (e) { toast({ title: t('error'), variant: 'destructive' }); }
  };

  const deleteTeam = async (id, e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm(t('deleteConfirm'))) return;
    try {
      await rpgStore.entities.Team.delete(id);
      setTeams(teams.filter(t => t.id !== id));
    } catch (e) { toast({ title: t('error'), variant: 'destructive' }); }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Users size={24} className="text-violet-400" /> {t('team_title')}
        </h1>
        <Button onClick={() => setShowCreate(!showCreate)} className="bg-violet-600 hover:bg-violet-500">
          <Plus size={16} className="mr-1" /> {t('team_create')}
        </Button>
      </div>

      {showCreate && (
        <div className="bg-zinc-900/50 rounded-xl border border-zinc-800 p-5 mb-5 space-y-3">
          <div>
            <Label className="text-xs text-zinc-400">{t('team_name')}</Label>
            <Input value={newTeam.name} onChange={(e) => setNewTeam({ ...newTeam, name: e.target.value })} className="bg-zinc-800 border-zinc-700 text-sm" />
          </div>
          <div>
            <Label className="text-xs text-zinc-400">{t('db_description')}</Label>
            <Input value={newTeam.description} onChange={(e) => setNewTeam({ ...newTeam, description: e.target.value })} className="bg-zinc-800 border-zinc-700 text-sm" />
          </div>
          <Button onClick={createTeam} size="sm" className="bg-violet-600 hover:bg-violet-500">{t('team_create')}</Button>
        </div>
      )}

      {loading ? (
        <p className="text-zinc-500 text-sm">{t('loading')}</p>
      ) : teams.length === 0 ? (
        <p className="text-zinc-500 text-sm">{t('noData')}</p>
      ) : (
        <div className="space-y-3">
          {teams.map(team => (
            <Link
              key={team.id}
              to={`/team/${team.id}`}
              className="block bg-zinc-900/50 rounded-xl border border-zinc-800 p-4 hover:border-violet-500/30 transition group"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-sm text-zinc-200">{team.name}</h3>
                  {team.description && <p className="text-xs text-zinc-500 mt-1">{team.description}</p>}
                  <div className="flex items-center gap-1 mt-2 text-xs text-zinc-500">
                    <Users size={12} /> {(team.members || []).length} {t('team_members')}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {team.created_by_id === user.id && (
                    <button onClick={(e) => deleteTeam(team.id, e)} className="text-zinc-500 hover:text-red-400">
                      <Trash2 size={14} />
                    </button>
                  )}
                  <ChevronRight size={18} className="text-zinc-600 group-hover:text-violet-400 transition" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}