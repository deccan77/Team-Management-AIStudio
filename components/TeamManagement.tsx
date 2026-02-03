
import React, { useState, useMemo } from 'react';
import { TeamMember, Order } from '../types';

interface TeamManagementProps {
  team: TeamMember[];
  orders: Order[];
  onAddMember: (member: TeamMember) => void;
  onUpdateMember: (id: string, updates: Partial<TeamMember>) => void;
  onRemoveMember: (id: string) => void;
}

const TeamManagement: React.FC<TeamManagementProps> = ({ team, orders, onAddMember, onUpdateMember, onRemoveMember }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [memberToDelete, setMemberToDelete] = useState<string | null>(null);
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  
  const [formData, setFormData] = useState({
    name: '',
    role: '',
    weeklyHours: 40,
    email: '',
    skills: ''
  });

  const monthData = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    const dates = [];
    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(year, month, i);
      const isWeekend = date.getDay() === 0 || date.getDay() === 6;
      dates.push({
        dateStr: date.toISOString().split('T')[0],
        dayNumber: i,
        dayName: date.toLocaleString('default', { weekday: 'short' }),
        isWeekend,
        isToday: new Date().toISOString().split('T')[0] === date.toISOString().split('T')[0]
      });
    }
    
    return {
      year,
      monthName: currentDate.toLocaleString('default', { month: 'long' }),
      dates
    };
  }, [currentDate]);

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const openDeleteConfirmation = (id: string) => {
    setMemberToDelete(id);
    setIsDeleteConfirmOpen(true);
  };

  const confirmDelete = () => {
    if (memberToDelete) {
      onRemoveMember(memberToDelete);
      setMemberToDelete(null);
      setIsDeleteConfirmOpen(false);
    }
  };

  const handleSubmitMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingMember) {
      onUpdateMember(editingMember.id, {
        name: formData.name,
        role: formData.role,
        weeklyHours: formData.weeklyHours,
        email: formData.email,
        skills: formData.skills.split(',').map(s => s.trim())
      });
    } else {
      const newMember: TeamMember = {
        id: `m-${Date.now()}`,
        name: formData.name,
        role: formData.role,
        weeklyHours: formData.weeklyHours,
        availability: 100,
        email: formData.email,
        skills: formData.skills.split(',').map(s => s.trim()),
        avatar: `https://picsum.photos/seed/${Date.now()}/200`,
        leaveDates: []
      };
      onAddMember(newMember);
    }
    setIsModalOpen(false);
    resetForm();
  };

  const resetForm = () => {
    setFormData({ name: '', role: '', weeklyHours: 40, email: '', skills: '' });
    setEditingMember(null);
  };

  const handleEdit = (member: TeamMember) => {
    setEditingMember(member);
    setFormData({
      name: member.name,
      role: member.role,
      weeklyHours: member.weeklyHours,
      email: member.email,
      skills: member.skills.join(', ')
    });
    setIsModalOpen(true);
  };

  const toggleLeaveDay = (memberId: string, dateStr: string) => {
    const member = team.find(m => m.id === memberId);
    if (!member) return;

    const newLeaveDates = member.leaveDates.includes(dateStr)
      ? member.leaveDates.filter(d => d !== dateStr)
      : [...member.leaveDates, dateStr];
    
    onUpdateMember(memberId, { leaveDates: newLeaveDates });
  };

  const currentMonthStr = currentDate.toISOString().slice(0, 7);
  
  // Advanced Leave Conflict Detection
  const leaveEntries = useMemo(() => {
    const allLeaves: { name: string; date: string; memberId: string }[] = [];
    team.forEach(m => {
      m.leaveDates.filter(d => d.startsWith(currentMonthStr)).forEach(date => {
        allLeaves.push({ name: m.name, date, memberId: m.id });
      });
    });

    // Count leaves per date to find conflicts
    const dateCounts: Record<string, number> = {};
    allLeaves.forEach(l => {
      dateCounts[l.date] = (dateCounts[l.date] || 0) + 1;
    });

    return allLeaves.map(l => ({
      ...l,
      hasConflict: dateCounts[l.date] > 1
    })).sort((a, b) => a.date.localeCompare(b.date));
  }, [team, currentMonthStr]);

  return (
    <div className="space-y-6 animate-fadeIn h-full flex flex-col">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shrink-0">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Team Planner</h1>
          <p className="text-sm text-gray-500 font-medium mt-1">Manage availability and leave schedules across working days.</p>
        </div>
        
        <div className="flex items-center gap-3 bg-white p-1.5 border border-gray-200 rounded-2xl shadow-sm">
          <div className="flex items-center gap-1">
            <button onClick={handlePrevMonth} className="p-2 hover:bg-gray-100 rounded-xl transition-colors text-gray-500">
              <i className="fas fa-chevron-left text-sm"></i>
            </button>
            <div className="px-4 py-1.5 text-center min-w-[140px]">
              <span className="text-sm font-bold text-gray-900">{monthData.monthName}</span>
              <span className="text-xs font-medium text-gray-400 ml-1.5">{monthData.year}</span>
            </div>
            <button onClick={handleNextMonth} className="p-2 hover:bg-gray-100 rounded-xl transition-colors text-gray-500">
              <i className="fas fa-chevron-right text-sm"></i>
            </button>
          </div>
          <div className="w-px h-6 bg-gray-100 mx-1"></div>
          <button onClick={handleToday} className="px-4 py-1.5 text-xs font-bold text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors uppercase tracking-wider">
            Today
          </button>
        </div>

        <button 
          onClick={() => { resetForm(); setIsModalOpen(true); }}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-indigo-100 transition-all active:scale-95"
        >
          <i className="fas fa-user-plus"></i>
          Add Member
        </button>
      </header>

      <div className="flex-1 min-h-[400px] bg-white border border-gray-200 rounded-[2rem] shadow-sm overflow-hidden flex flex-col">
        <div className="overflow-auto flex-1 custom-scrollbar">
          <table className="border-collapse table-fixed w-full min-w-max">
            <thead className="sticky top-0 z-30 bg-white border-b border-gray-200">
              <tr>
                <th className="sticky left-0 z-40 bg-white w-64 border-r border-gray-200 px-6 py-5 text-left text-[11px] font-black text-gray-400 uppercase tracking-widest">
                  Team Member
                </th>
                <th className="sticky left-64 z-40 bg-white w-28 border-r border-gray-100 px-4 py-5 text-center text-[11px] font-black text-gray-400 uppercase tracking-widest">
                  Available
                </th>
                <th className="sticky left-[352px] z-40 bg-white w-24 border-r border-gray-200 px-4 py-5 text-center text-[11px] font-black text-gray-400 uppercase tracking-widest">
                  Leave
                </th>
                {monthData.dates.map((d, idx) => (
                  <th 
                    key={idx} 
                    className={`w-[42px] border-r border-gray-100 py-3 transition-colors ${d.isWeekend ? 'bg-gray-50 pattern-diagonal' : 'bg-white'} ${d.isToday ? 'bg-indigo-50 ring-2 ring-inset ring-indigo-500' : ''}`}
                  >
                    <div className="flex flex-col items-center gap-0.5">
                      <span className={`text-[10px] font-bold ${d.isWeekend ? 'text-gray-400' : 'text-gray-500'}`}>{d.dayName}</span>
                      <span className={`text-sm font-black ${d.isToday ? 'text-indigo-600' : d.isWeekend ? 'text-gray-400' : 'text-gray-900'}`}>{d.dayNumber}</span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {team.map((member) => {
                const monthDates = monthData.dates.map(d => d.dateStr);
                const workingDaysInMonth = monthData.dates.filter(d => !d.isWeekend);
                const leaveOnWorkingDays = member.leaveDates.filter(ld => {
                  const dateInfo = monthData.dates.find(d => d.dateStr === ld);
                  return dateInfo && !dateInfo.isWeekend;
                }).length;

                const availableInMonth = workingDaysInMonth.length - leaveOnWorkingDays;
                const totalLeaveInMonth = member.leaveDates.filter(ld => monthDates.includes(ld)).length;

                return (
                  <tr key={member.id} className="group hover:bg-gray-50/50 transition-colors">
                    <td className="sticky left-0 z-20 bg-white group-hover:bg-gray-50 border-r border-gray-200 p-4 transition-colors">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 overflow-hidden">
                          <div className="relative shrink-0">
                            <img src={member.avatar} alt="" className="w-10 h-10 rounded-2xl border-2 border-white shadow-sm object-cover" />
                          </div>
                          <div className="overflow-hidden">
                            <p className="text-sm font-bold text-gray-900 truncate leading-tight">{member.name}</p>
                            <p className="text-[10px] text-gray-400 font-semibold truncate uppercase mt-0.5">{member.role}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleEdit(member); }}
                            className="opacity-0 group-hover:opacity-100 p-1.5 text-gray-400 hover:text-indigo-600 transition-all rounded-lg hover:bg-indigo-50"
                          >
                            <i className="fas fa-edit text-xs"></i>
                          </button>
                          <button 
                            onClick={(e) => { e.stopPropagation(); openDeleteConfirmation(member.id); }}
                            className="opacity-0 group-hover:opacity-100 p-1.5 text-gray-400 hover:text-red-500 transition-all rounded-lg hover:bg-red-50"
                          >
                            <i className="fas fa-trash-alt text-xs"></i>
                          </button>
                        </div>
                      </div>
                    </td>
                    
                    <td className="sticky left-64 z-20 bg-white group-hover:bg-gray-50 border-r border-gray-100 text-center transition-colors">
                      <div className="inline-flex flex-col">
                        <span className="text-xs font-black text-green-600">{availableInMonth}d</span>
                        <span className="text-[8px] font-bold text-gray-400 uppercase">Work Days</span>
                      </div>
                    </td>

                    <td className="sticky left-[352px] z-20 bg-white group-hover:bg-gray-50 border-r border-gray-200 text-center transition-colors">
                      <div className="inline-flex flex-col">
                        <span className={`text-xs font-black ${totalLeaveInMonth > 0 ? 'text-red-600' : 'text-gray-300'}`}>{totalLeaveInMonth}d</span>
                        <span className="text-[8px] font-bold text-gray-400 uppercase">Total Leave</span>
                      </div>
                    </td>

                    {monthData.dates.map((d, idx) => {
                      const isLeave = member.leaveDates.includes(d.dateStr);
                      return (
                        <td 
                          key={idx}
                          onClick={() => toggleLeaveDay(member.id, d.dateStr)}
                          className={`group/cell h-[64px] cursor-pointer border-r border-gray-100 transition-all relative overflow-hidden ${
                            d.isWeekend ? 'bg-gray-50/70 pattern-diagonal cursor-not-allowed' : ''
                          } ${d.isToday ? 'bg-indigo-50/30 ring-1 ring-inset ring-indigo-100' : ''}`}
                        >
                          <div className={`absolute inset-1.5 rounded-lg flex items-center justify-center transition-all duration-300 ${
                            isLeave 
                              ? 'bg-rose-500 text-white shadow-sm ring-1 ring-rose-600 scale-100' 
                              : d.isWeekend
                                ? 'bg-gray-200/50 opacity-0'
                                : 'bg-emerald-500/10 text-emerald-600 group-hover/cell:bg-emerald-500/20 scale-95 hover:scale-100 opacity-60 group-hover/cell:opacity-100'
                          }`}>
                            {isLeave ? (
                              <i className="fas fa-times text-[10px] drop-shadow-sm"></i>
                            ) : !d.isWeekend ? (
                              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 group-hover/cell:animate-pulse"></div>
                            ) : null}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-1 gap-6 shrink-0 pb-4">
        <div className="bg-white p-6 rounded-[2rem] border border-gray-200 shadow-sm flex flex-col h-full min-h-[240px]">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Active Leave List</h3>
            <span className="text-[10px] font-bold bg-rose-50 text-rose-600 px-2.5 py-1 rounded-lg">Conflicts Highlighted</span>
          </div>
          <div className="space-y-2 overflow-y-auto pr-2 custom-scrollbar flex-1">
            {leaveEntries.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <i className="fas fa-calendar-check text-gray-100 text-4xl mb-2"></i>
                <p className="text-[11px] text-gray-400 italic">No leave scheduled for this month.</p>
              </div>
            ) : (
              leaveEntries.slice(0, 15).map((leave, i) => (
                <div key={i} className={`flex justify-between items-center p-3 rounded-2xl border transition-all ${
                  leave.hasConflict 
                    ? 'bg-rose-50 border-rose-100 ring-1 ring-rose-200/50' 
                    : 'bg-gray-50 border-gray-100'
                }`}>
                  <div className="flex flex-col">
                    <span className={`text-[11px] font-black ${leave.hasConflict ? 'text-rose-600' : 'text-gray-700'}`}>
                      {leave.name} {leave.hasConflict && <i className="fas fa-exclamation-circle ml-1 animate-pulse"></i>}
                    </span>
                    {leave.hasConflict && <span className="text-[8px] font-black text-rose-400 uppercase mt-0.5">Leave Overlap</span>}
                  </div>
                  <span className={`text-[11px] font-black font-mono ${leave.hasConflict ? 'text-rose-600' : 'text-gray-400'}`}>
                    {leave.date.split('-').slice(1).reverse().join('/')}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {isDeleteConfirmOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-[2.5rem] w-full max-sm overflow-hidden shadow-2xl p-8 text-center animate-scaleIn">
            <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <i className="fas fa-exclamation-triangle text-2xl"></i>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Confirm Removal</h3>
            <p className="text-sm text-gray-500 mb-8">Are you sure you want to remove this member? This will clear their planner data permanently.</p>
            <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={() => setIsDeleteConfirmOpen(false)}
                className="px-4 py-4 bg-gray-100 text-gray-600 font-bold rounded-2xl hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={confirmDelete}
                className="px-4 py-4 bg-red-600 text-white font-bold rounded-2xl hover:bg-red-700 transition-colors shadow-lg shadow-red-100"
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-[2.5rem] w-full max-w-lg overflow-hidden shadow-2xl animate-scaleIn">
            <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h2 className="text-2xl font-bold text-gray-900">{editingMember ? 'Edit Profile' : 'Add Team Member'}</h2>
              <button onClick={() => { setIsModalOpen(false); resetForm(); }} className="text-gray-400 hover:text-gray-600 transition-colors">
                <i className="fas fa-times text-xl"></i>
              </button>
            </div>
            <form onSubmit={handleSubmitMember} className="p-8 space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="col-span-2 space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase ml-1 tracking-widest">Full Name</label>
                  <input
                    type="text" required
                    className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-black"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase ml-1 tracking-widest">Role</label>
                  <input
                    type="text" required
                    className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-black"
                    value={formData.role}
                    onChange={e => setFormData({ ...formData, role: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase ml-1 tracking-widest">Weekly Hours</label>
                  <input
                    type="number" required
                    className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-black"
                    value={formData.weeklyHours}
                    onChange={e => setFormData({ ...formData, weeklyHours: parseInt(e.target.value) })}
                  />
                </div>
                <div className="col-span-2 space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase ml-1 tracking-widest">Email</label>
                  <input
                    type="email" required
                    className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-black"
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
                <div className="col-span-2 space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase ml-1 tracking-widest">Skills (comma separated)</label>
                  <textarea
                    className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-black resize-none h-24"
                    value={formData.skills}
                    onChange={e => setFormData({ ...formData, skills: e.target.value })}
                    placeholder="React, Design, Strategy..."
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => { setIsModalOpen(false); resetForm(); }} className="px-6 py-4 rounded-2xl font-bold text-gray-500 hover:bg-gray-100 transition-colors">Cancel</button>
                <button type="submit" className="px-10 py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 shadow-xl shadow-indigo-100 transition-all active:scale-95">
                  {editingMember ? 'Update Profile' : 'Add Member'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #ddd;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #ccc;
        }
        .pattern-diagonal {
          background-image: repeating-linear-gradient(
            45deg,
            transparent,
            transparent 10px,
            rgba(0,0,0,0.02) 10px,
            rgba(0,0,0,0.02) 20px
          );
        }
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.95) translateY(10px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        .animate-scaleIn {
          animation: scaleIn 0.2s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default TeamManagement;
