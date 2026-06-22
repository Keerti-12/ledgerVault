import React, { useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Trash2, Edit3, X, Check, ArrowLeft, Users, UserPlus, ShieldAlert } from 'lucide-react';
import { addMember, deleteMember, editMember } from '../services/db';
import { Member } from '../types';
import { useNavigate } from 'react-router-dom';

export default function ManageMembers() {
  const { members, activeMember, isAdminAuthenticated, familyId } = useAppStore();
  const navigate = useNavigate();

  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberRole, setNewMemberRole] = useState<Member['role']>('Kid');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editRole, setEditRole] = useState<Member['role']>('Kid');

  if (!isAdminAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] text-center px-4">
        <div className="w-20 h-20 bg-rose-100 text-rose-500 rounded-full flex items-center justify-center mb-6 shadow-sm">
          <ShieldAlert size={36} />
        </div>
        <h2 className="text-3xl font-black text-slate-800 mb-3 tracking-tight">Access Denied</h2>
        <p className="text-slate-500 mb-8 max-w-xs text-lg">You must be logged in as an administrator to manage family members.</p>
        <Button onClick={() => navigate('/settings')} size="lg" className="rounded-full px-8 shadow-lg shadow-emerald-500/20">
          <ArrowLeft size={18} className="mr-2" /> Return to Settings
        </Button>
      </div>
    );
  }

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!familyId || !newMemberName.trim()) return;
    setIsSubmitting(true);
    const success = await addMember(familyId, {
      name: newMemberName.trim(),
      role: newMemberRole,
      avatar: '👤'
    });
    if (success) {
      setNewMemberName('');
    } else {
      alert('Failed to add member.');
    }
    setIsSubmitting(false);
  };

  const handleDeleteMember = async (memberId: string, memberName: string) => {
    if (!familyId) return;
    if (window.confirm(`Are you sure you want to permanently delete ${memberName}?`)) {
      const success = await deleteMember(familyId, memberId);
      if (!success) {
        alert('Failed to delete member. Make sure you have a stable connection.');
      }
    }
  };

  const handleEditClick = (member: any) => {
    setEditingId(member.id);
    setEditName(member.name);
    setEditRole(member.role);
  };

  const handleEditSubmit = async (memberId: string) => {
    if (!editName.trim() || !familyId) return;
    await editMember(familyId, memberId, {
      name: editName.trim(),
      role: editRole
    });
    setEditingId(null);
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">
      
      {/* Header Area */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-500 to-teal-700 p-6 text-white shadow-xl shadow-emerald-500/20">
        <div className="absolute top-0 right-0 p-4 opacity-10 transform translate-x-4 -translate-y-4">
          <Users size={120} />
        </div>
        <div className="relative z-10 flex items-start gap-4">
          <button 
            onClick={() => navigate('/settings')} 
            className="p-2.5 bg-white/20 hover:bg-white/30 backdrop-blur-md rounded-full shadow-sm text-white transition-all transform hover:scale-105"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h2 className="text-3xl font-black tracking-tight mb-1">Family Roster</h2>
            <p className="text-emerald-50 font-medium opacity-90">Manage who has access to the ledger.</p>
          </div>
        </div>
      </div>

      {/* Add Member Card */}
      <Card className="p-7 border border-slate-100 shadow-xl shadow-slate-200/40 bg-white relative overflow-hidden group">
        <div className="absolute top-0 left-0 w-1.5 h-full bg-emerald-500 transition-all duration-300 group-hover:w-2"></div>
        <div className="absolute top-0 right-0 p-6 opacity-[0.03] transform translate-x-4 -translate-y-4 pointer-events-none transition-transform duration-500 group-hover:scale-110">
          <UserPlus size={120} />
        </div>
        
        <div className="relative z-10 mb-6">
          <h3 className="font-bold text-slate-800 text-xl tracking-tight mb-1 flex items-center gap-2">
            <div className="bg-emerald-50 p-2 rounded-xl text-emerald-600 shadow-sm border border-emerald-100"><UserPlus size={20} /></div> 
            Add New Member
          </h3>
          <p className="text-slate-500 text-sm font-medium ml-[44px]">Invite someone to your family vault.</p>
        </div>

        <form onSubmit={handleAddMember} className="flex flex-col sm:flex-row sm:flex-wrap gap-4 relative z-10 pl-[44px]">
          <div className="flex w-full sm:flex-1 relative">
            <input 
              type="text" 
              placeholder="e.g. Grandma, Uncle Joe" 
              value={newMemberName}
              onChange={(e) => setNewMemberName(e.target.value)}
              className="w-full h-14 px-4 rounded-xl border-2 border-slate-100 bg-slate-50 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all font-bold text-slate-800 shadow-sm text-lg placeholder:text-slate-400 placeholder:font-medium"
            />
          </div>
          <div className="flex gap-3 w-full sm:w-auto">
            <select 
              value={newMemberRole}
              onChange={(e) => setNewMemberRole(e.target.value as Member['role'])}
              className="flex-1 sm:w-36 h-14 px-4 rounded-xl border-2 border-slate-100 bg-slate-50 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all font-bold text-slate-700 shadow-sm min-w-0"
            >
              <option value="Kid">Kid</option>
              <option value="Parent">Parent</option>
            </select>
            <Button type="submit" disabled={isSubmitting || !newMemberName.trim()} className="flex-1 sm:w-auto h-14 px-8 rounded-xl shadow-lg shadow-emerald-500/25 shrink-0 bg-emerald-600 hover:bg-emerald-700 transition-all transform hover:-translate-y-0.5 active:translate-y-0">
              <span className="font-black tracking-wide text-lg whitespace-nowrap">ADD</span>
            </Button>
          </div>
        </form>
      </Card>

      {/* Current Members Grid */}
      <div className="space-y-4">
        <h3 className="font-bold text-slate-400 uppercase tracking-widest text-xs ml-2 flex items-center gap-2">
          Current Members <span className="bg-slate-200 text-slate-500 px-2 py-0.5 rounded-full">{members.length}</span>
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {members.map(member => (
            <Card key={member.id} className="group relative overflow-hidden p-5 border border-slate-100 shadow-sm hover:shadow-md transition-all duration-300">
              {/* Subtle background decoration based on role */}
              <div className={`absolute -right-6 -top-6 w-24 h-24 rounded-full opacity-10 ${member.role === 'Parent' ? 'bg-indigo-500' : 'bg-emerald-500'}`}></div>
              
              {editingId === member.id ? (
                <div className="space-y-3 relative z-10 animate-in fade-in zoom-in-95 duration-200">
                  <div className="flex justify-between items-center border-b border-slate-100 pb-2 mb-2">
                    <h4 className="font-bold text-slate-700 text-sm flex items-center gap-1.5"><Edit3 size={16} className="text-emerald-500"/> Manage Member</h4>
                    <button onClick={(e) => { e.stopPropagation(); setEditingId(null); }} className="p-1 text-slate-400 hover:text-slate-600 rounded-md transition-colors"><X size={18} /></button>
                  </div>
                  
                  <div className="flex gap-2">
            <input 
              type="text" 
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="w-full h-12 px-4 rounded-lg border border-slate-200 font-medium bg-white shadow-sm focus:ring-2 focus:ring-emerald-500 outline-none"
            />
          </div>
                  
                  <select 
                    value={editRole}
                    onChange={(e) => setEditRole(e.target.value as Member['role'])}
                    className="w-full h-12 px-3 rounded-lg border border-slate-200 font-medium bg-white shadow-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                  >
                    <option value="Kid">Kid</option>
                    <option value="Parent">Parent</option>
                  </select>
                  
                  <div className="flex gap-2 pt-1">
                    {activeMember?.id !== member.id && (
                      <button 
                        onClick={() => handleDeleteMember(member.id!, member.name)}
                        className="flex-1 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg font-bold shadow-sm flex justify-center items-center gap-2 transition-colors py-2.5"
                      >
                        <Trash2 size={18} /> Delete
                      </button>
                    )}
                    <button 
                      onClick={() => handleEditSubmit(member.id!)}
                      disabled={!editName.trim()}
                      className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-bold shadow-sm flex justify-center items-center gap-2 transition-colors disabled:opacity-50 py-2.5"
                    >
                      <Check size={18} /> Save
                    </button>
                  </div>
                </div>
              ) : (
                <div 
                  onClick={() => handleEditClick(member)}
                  className="flex justify-between items-center relative z-10 w-full cursor-pointer group-hover:opacity-80 transition-opacity"
                >
                  <div className="flex items-center gap-4 w-full">
                    <div className="flex-1 break-words">
                      <p className="font-bold text-slate-800 text-xl leading-tight tracking-tight">{member.name}</p>
                      <span className={`inline-block mt-1.5 px-2.5 py-0.5 rounded-full text-[10px] uppercase tracking-wider font-bold ${member.role === 'Parent' ? 'bg-indigo-100 text-indigo-700' : 'bg-emerald-100 text-emerald-700'}`}>
                        {member.role}
                      </span>
                    </div>
                    <div className="text-slate-300 shrink-0">
                      <Edit3 size={20} />
                    </div>
                  </div>
                </div>
              )}
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
