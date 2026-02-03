import React, { useMemo, useState } from 'react';
import { Order, TeamMember, OrderStatus, WorkTask, WorkTaskStatus } from '../types';

interface DashboardProps {
  orders: Order[];
  team: TeamMember[];
  tasks: WorkTask[];
}

const Dashboard: React.FC<DashboardProps> = ({ orders, team, tasks }) => {
  // Month Selection State
  const [currentDate, setCurrentDate] = useState(new Date());

  // Constants for calculation
  const HOURS_PER_DAY = 8;
  const DAYS_PER_WEEK = 5;

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  // Calculate working days in the selected month (excluding weekends)
  const monthInfo = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    // monthStr format: YYYY-MM
    const monthStr = `${year}-${String(month + 1).padStart(2, '0')}`;

    let workingDays = 0;
    const workDateStrings: string[] = [];

    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(year, month, i);
      const dayOfWeek = date.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        workingDays++;
        workDateStrings.push(date.toISOString().split('T')[0]);
      }
    }

    return {
      workingDays,
      workDateStrings,
      monthStr,
      monthName: currentDate.toLocaleString('default', { month: 'long' }),
      year
    };
  }, [currentDate]);

  // Calculate detailed metrics for each team member
  const teamMetrics = useMemo(() => {
    return team.map(member => {
      // 1. Get leave days for this member in the selected month that fall on working days
      const leaveDaysInMonth = member.leaveDates.filter(ld => 
        ld.startsWith(monthInfo.monthStr) && monthInfo.workDateStrings.includes(ld)
      ).length;

      // 2. Net available working days from calendar
      const netWorkingDays = Math.max(0, monthInfo.workingDays - leaveDaysInMonth);
      
      // 3. Total capacity in hours (based on their specific weekly hours spread over 5 days)
      const hoursPerDayForMember = member.weeklyHours / DAYS_PER_WEEK;
      const totalCapacityHours = netWorkingDays * hoursPerDayForMember;

      // 4. Effort assigned from tasks
      // Filter tasks that overlap with the selected month
      const activeEffortHours = tasks
        .filter(t => {
          const isAssigned = t.assignedTo === member.id;
          const isNotDone = t.status !== WorkTaskStatus.DONE && t.status !== WorkTaskStatus.CANCELLED;
          // Check if task dates fall within the month string prefix
          const taskStartsInMonth = t.startDate.startsWith(monthInfo.monthStr);
          const taskEndsInMonth = t.endDate.startsWith(monthInfo.monthStr);
          return isAssigned && isNotDone && (taskStartsInMonth || taskEndsInMonth);
        })
        .reduce((sum, t) => sum + t.effortHours, 0);

      // 5. Availability percentage
      const remainingHours = Math.max(0, totalCapacityHours - activeEffortHours);
      const availabilityPct = totalCapacityHours > 0 
        ? Math.round((remainingHours / totalCapacityHours) * 100) 
        : 0;

      return {
        ...member,
        leaveDaysInMonth,
        netWorkingDays,
        totalCapacityHours,
        activeEffortHours,
        availabilityPct,
        isOverloaded: activeEffortHours > totalCapacityHours
      };
    });
  }, [team, tasks, monthInfo]);

  // Aggregate stats for the "Business Capacity" block
  const aggregateMetrics = useMemo(() => {
    const totalWorkingMemberDays = team.length * monthInfo.workingDays;
    const netAvailableDays = teamMetrics.reduce((sum, m) => sum + m.netWorkingDays, 0);
    const capacityPercentage = totalWorkingMemberDays > 0 
      ? Math.round((netAvailableDays / totalWorkingMemberDays) * 100) 
      : 0;

    return {
      totalWorkingMemberDays,
      netAvailableDays,
      capacityPercentage
    };
  }, [team, monthInfo, teamMetrics]);

  const stats = {
    total: orders.length,
    completed: orders.filter(o => o.status === OrderStatus.COMPLETED).length,
    inProgress: orders.filter(o => o.status === OrderStatus.IN_PROGRESS).length,
    avgAvailability: teamMetrics.length > 0 
      ? Math.round(teamMetrics.reduce((acc, m) => acc + m.availabilityPct, 0) / teamMetrics.length) 
      : 0
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Workspace Overview</h1>
          <p className="text-gray-500 mt-1 italic">Reporting and analytics for {monthInfo.monthName} {monthInfo.year}.</p>
        </div>

        {/* Month Navigation Control */}
        <div className="flex items-center gap-3 bg-white p-2 border border-gray-200 rounded-2xl shadow-sm">
          <div className="flex items-center gap-1">
            <button 
              onClick={handlePrevMonth} 
              className="p-2.5 hover:bg-gray-50 rounded-xl transition-colors text-gray-400 hover:text-indigo-600"
              title="Previous Month"
            >
              <i className="fas fa-chevron-left text-sm"></i>
            </button>
            <div className="px-6 py-1.5 text-center min-w-[160px]">
              <span className="text-sm font-bold text-gray-900">{monthInfo.monthName}</span>
              <span className="text-xs font-medium text-gray-400 ml-2">{monthInfo.year}</span>
            </div>
            <button 
              onClick={handleNextMonth} 
              className="p-2.5 hover:bg-gray-50 rounded-xl transition-colors text-gray-400 hover:text-indigo-600"
              title="Next Month"
            >
              <i className="fas fa-chevron-right text-sm"></i>
            </button>
          </div>
          <div className="w-px h-6 bg-gray-100 mx-1"></div>
          <button 
            onClick={handleToday} 
            className="px-5 py-2 text-xs font-black text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors uppercase tracking-widest"
          >
            Today
          </button>
        </div>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Projects" value={stats.total} icon="fa-clipboard-list" color="indigo" />
        <StatCard title="In Progress" value={stats.inProgress} icon="fa-spinner" color="blue" />
        <StatCard title="Confirmed" value={stats.completed} icon="fa-check-double" color="green" />
        <StatCard title="Avg. Availability" value={`${stats.avgAvailability}%`} icon="fa-bolt" color="yellow" />
      </div>

      {/* Business Capacity Summary */}
      <div className="bg-indigo-900 text-white p-8 lg:p-10 rounded-[2.5rem] shadow-xl relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-8 min-h-[260px]">
        <div className="relative z-10 space-y-4">
          <h3 className="text-2xl font-bold flex items-center gap-3">
            <i className="fas fa-business-time text-indigo-300"></i>
            Monthly Business Capacity
          </h3>
          <p className="text-indigo-200 text-sm max-w-md leading-relaxed">
            Raw potential for <span className="text-white font-bold">{monthInfo.monthName} {monthInfo.year}</span>. This reflects working days available after accounting for weekends and scheduled team leaves.
          </p>
          
          <div className="flex flex-wrap items-center gap-4 mt-6">
            <div className="bg-white/10 backdrop-blur-md px-6 py-5 rounded-3xl border border-white/10 group hover:bg-white/15 transition-colors">
              <p className="text-[10px] uppercase font-black opacity-50 mb-1 tracking-widest">Potential Resource Days</p>
              <p className="text-2xl font-black">{aggregateMetrics.totalWorkingMemberDays}</p>
            </div>
            <div className="bg-white/10 backdrop-blur-md px-6 py-5 rounded-3xl border border-white/10 group hover:bg-white/15 transition-colors">
              <p className="text-[10px] uppercase font-black opacity-50 mb-1 tracking-widest">Net Deliverable Days</p>
              <p className="text-2xl font-black text-indigo-300">
                {aggregateMetrics.netAvailableDays}
              </p>
            </div>
          </div>
        </div>
        
        <div className="relative z-10 flex flex-col items-center gap-4">
          <div className="relative w-44 h-44 flex items-center justify-center">
            <svg className="w-full h-full -rotate-90">
              <circle cx="88" cy="88" r="78" stroke="currentColor" strokeWidth="14" fill="transparent" className="text-white/10" />
              <circle cx="88" cy="88" r="78" stroke="currentColor" strokeWidth="14" fill="transparent" 
                strokeDasharray={490} 
                strokeDashoffset={490 - (490 * (aggregateMetrics.capacityPercentage / 100))}
                strokeLinecap="round" className="text-indigo-400 transition-all duration-1000 ease-in-out" />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-4xl font-black">{aggregateMetrics.capacityPercentage}%</span>
              <span className="text-[9px] font-black uppercase opacity-60 tracking-widest mt-1">Net Utilization</span>
            </div>
          </div>
        </div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/20 rounded-full -translate-y-1/2 translate-x-1/3 blur-[80px]"></div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {/* Team Capacity Section */}
        <div className="bg-white border border-gray-200 rounded-[2.5rem] p-8 lg:p-10 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-4">
            <div>
              <h3 className="text-xl font-bold text-gray-900">Individual Resource Health</h3>
              <p className="text-xs text-gray-400 font-bold mt-1 uppercase tracking-widest">
                Resource allocation for {monthInfo.monthName} | {HOURS_PER_DAY}h Standard Day
              </p>
            </div>
            <div className="flex items-center gap-4 bg-gray-50 px-4 py-2 rounded-xl">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-green-500"></div>
                <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Available</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-amber-500"></div>
                <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Optimized</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-rose-500"></div>
                <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest">At Risk</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-12">
            {teamMetrics.map(member => {
              const consumedDays = (member.activeEffortHours / HOURS_PER_DAY).toFixed(1);
              const availableDays = member.netWorkingDays.toFixed(1);
              
              return (
                <div key={member.id} className="space-y-4 group">
                  <div className="flex justify-between items-end">
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <img src={member.avatar} alt="" className="w-14 h-14 rounded-2xl border-2 border-white shadow-md transition-transform group-hover:scale-105 group-hover:-rotate-2" />
                        {member.isOverloaded && (
                          <div className="absolute -top-1.5 -right-1.5 bg-rose-500 text-white w-6 h-6 rounded-full flex items-center justify-center border-2 border-white shadow-sm">
                            <i className="fas fa-exclamation text-[10px]"></i>
                          </div>
                        )}
                      </div>
                      <div>
                        <span className="font-bold text-gray-900 block text-lg leading-none mb-1.5">{member.name}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-gray-400 font-black uppercase tracking-widest">
                            <i className="fas fa-hourglass-half mr-1 text-indigo-400"></i>
                            {consumedDays} / {availableDays} Days Allocation
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                       <div className="flex items-center justify-end gap-2">
                        <span className={`text-lg font-black ${
                          member.availabilityPct > 60 ? 'text-green-600' : member.availabilityPct > 20 ? 'text-amber-500' : 'text-rose-500'
                        }`}>
                          {member.availabilityPct}%
                        </span>
                        <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Avail.</span>
                       </div>
                       <p className="text-[9px] text-gray-400 font-bold uppercase mt-1 tracking-tighter">
                        {Math.max(0, member.totalCapacityHours - member.activeEffortHours).toFixed(1)}h Remaining in {monthInfo.monthName}
                       </p>
                    </div>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-4 overflow-hidden p-1 shadow-inner relative">
                    <div 
                      className={`h-full rounded-full transition-all duration-1000 ease-out shadow-sm ${
                        member.availabilityPct > 60 ? 'bg-green-500' : member.availabilityPct > 20 ? 'bg-amber-500' : 'bg-rose-500'
                      }`}
                      style={{ width: `${member.availabilityPct}%` }}
                    ></div>
                    {/* Tick marks for visual aid */}
                    <div className="absolute inset-0 flex justify-between px-2 pointer-events-none opacity-20">
                      {[1,2,3,4].map(i => <div key={i} className="w-px h-full bg-black/10"></div>)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          
          <div className="mt-14 p-6 bg-indigo-50/50 rounded-3xl border border-indigo-100/30 flex items-center gap-6">
            <div className="bg-indigo-600 text-white w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-200 shrink-0">
               <i className="fas fa-lightbulb text-lg"></i>
            </div>
            <div>
              <p className="text-sm font-black text-indigo-900 uppercase tracking-tight">Resource Optimization Tip</p>
              <p className="text-xs text-indigo-700/80 mt-1 leading-relaxed">
                The <b>Business Capacity</b> for {monthInfo.monthName} accounts for scheduled leaves. Ensure high-priority CTB tasks are allocated to team members with >40% availability to maintain delivery velocity.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ title, value, icon, color }: any) => {
  const colorMap: any = {
    indigo: 'text-indigo-600 bg-indigo-50 shadow-indigo-100',
    blue: 'text-blue-600 bg-blue-50 shadow-blue-100',
    green: 'text-green-600 bg-green-50 shadow-green-100',
    yellow: 'text-yellow-600 bg-yellow-50 shadow-yellow-100',
  };

  return (
    <div className="bg-white border border-gray-100 p-7 rounded-[2rem] shadow-sm hover:shadow-lg transition-all hover:-translate-y-1">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{title}</p>
          <p className="text-3xl font-black text-gray-900">{value}</p>
        </div>
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-md ${colorMap[color]}`}>
          <i className={`fas ${icon} text-lg`}></i>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;