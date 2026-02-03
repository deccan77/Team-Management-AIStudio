import React, { useState, useMemo } from 'react';
import { WorkTask, WorkTaskStatus, TaskRecurrence, TeamMember } from '../types';

interface TaskListProps {
  tasks: WorkTask[];
  team: TeamMember[];
  onAddTask: (task: WorkTask) => void;
  onUpdateTask: (id: string, updates: Partial<WorkTask>) => void;
  onRemoveTask: (id: string) => void;
}

const TaskList: React.FC<TaskListProps> = ({ tasks, team, onAddTask, onUpdateTask, onRemoveTask }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [parentTaskId, setParentTaskId] = useState<string | null>(null);
  const [editingTask, setEditingTask] = useState<WorkTask | null>(null);
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<string | null>(null);
  
  // Filter states
  const [filterTaskId, setFilterTaskId] = useState('');
  const [filterAssignee, setFilterAssignee] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  const [formData, setFormData] = useState({
    title: '',
    category: 'CTB' as 'CTB' | 'RTB' | 'SSP' | 'BAU' | 'Other',
    assignedTo: team[0]?.id || '',
    effortHours: 4,
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(new Date().getFullYear(), 11, 31).toISOString().split('T')[0],
    status: WorkTaskStatus.TODO,
    recurrence: TaskRecurrence.NONE
  });

  const toggleExpand = (taskId: string) => {
    const newExpanded = new Set(expandedTasks);
    if (newExpanded.has(taskId)) {
      newExpanded.delete(taskId);
    } else {
      newExpanded.add(taskId);
    }
    setExpandedTasks(newExpanded);
  };

  const clearFilters = () => {
    setFilterTaskId('');
    setFilterAssignee('');
    setFilterStatus('');
  };

  const isFiltered = filterTaskId !== '' || filterAssignee !== '' || filterStatus !== '';

  const generateTaskId = (category: string, isSubtask: boolean, parentId?: string | null) => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    
    if (isSubtask && parentId) {
      const existingSubtasks = tasks.filter(t => t.parentId === parentId);
      const subtaskNumber = existingSubtasks.length + 1;
      return `${parentId}-${subtaskNumber}`;
    } else {
      const mainTasksCount = tasks.filter(t => !t.parentId && t.category === category).length;
      const sequence = String(mainTasksCount + 1).padStart(4, '0');
      return `${category}-${year}-${month}-${sequence}`;
    }
  };

  const handleSaveTask = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingTask) {
      onUpdateTask(editingTask.id, {
        ...formData
      });
    } else {
      const taskId = generateTaskId(formData.category, !!parentTaskId, parentTaskId);
      const newTask: WorkTask = {
        ...formData,
        id: taskId,
        parentId: parentTaskId
      };
      onAddTask(newTask);
      
      if (parentTaskId) {
        const newExpanded = new Set(expandedTasks);
        newExpanded.add(parentTaskId);
        setExpandedTasks(newExpanded);
      }
    }
    
    closeModal();
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setParentTaskId(null);
    setEditingTask(null);
    setFormData({
      title: '',
      category: 'CTB',
      assignedTo: team[0]?.id || '',
      effortHours: 4,
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(new Date().getFullYear(), 11, 31).toISOString().split('T')[0],
      status: WorkTaskStatus.TODO,
      recurrence: TaskRecurrence.NONE
    });
  };

  const openEditModal = (task: WorkTask) => {
    setEditingTask(task);
    setFormData({
      title: task.title,
      category: task.category,
      assignedTo: task.assignedTo,
      effortHours: task.effortHours,
      startDate: task.startDate,
      endDate: task.endDate,
      status: task.status,
      recurrence: task.recurrence
    });
    setIsModalOpen(true);
  };

  const openSubtaskModal = (pId: string) => {
    const parent = tasks.find(t => t.id === pId);
    if (parent) {
      setFormData(prev => ({ ...prev, category: parent.category }));
      setParentTaskId(pId);
      setIsModalOpen(true);
    }
  };

  const confirmDelete = (taskId: string) => {
    setTaskToDelete(taskId);
    setIsDeleteConfirmOpen(true);
  };

  const handleDelete = () => {
    if (taskToDelete) {
      onRemoveTask(taskToDelete);
      setTaskToDelete(null);
      setIsDeleteConfirmOpen(false);
    }
  };

  // Visibility logic: handles both hierarchical expansion and flat filtering
  const visibleTasks = useMemo(() => {
    if (isFiltered) {
      return tasks.filter(task => {
        const matchId = !filterTaskId || task.id.toLowerCase().includes(filterTaskId.toLowerCase());
        const matchAssignee = !filterAssignee || task.assignedTo === filterAssignee;
        const matchStatus = !filterStatus || task.status === filterStatus;
        return matchId && matchAssignee && matchStatus;
      });
    }

    const mainTasks = tasks.filter(t => !t.parentId);
    const result: WorkTask[] = [];
    
    mainTasks.forEach(main => {
      result.push(main);
      if (expandedTasks.has(main.id)) {
        const subtasks = tasks.filter(sub => sub.parentId === main.id);
        result.push(...subtasks);
      }
    });
    
    return result;
  }, [tasks, expandedTasks, filterTaskId, filterAssignee, filterStatus, isFiltered]);

  const getStatusStyle = (status: WorkTaskStatus) => {
    switch (status) {
      case WorkTaskStatus.DONE: return 'bg-emerald-100 text-emerald-700';
      case WorkTaskStatus.IN_PROGRESS: return 'bg-amber-100 text-amber-700';
      case WorkTaskStatus.CANCELLED: return 'bg-gray-100 text-gray-400';
      default: return 'bg-indigo-100 text-indigo-700';
    }
  };

  const getCategoryColor = (cat: string) => {
    switch (cat) {
      case 'CTB': return 'bg-indigo-500';
      case 'RTB': return 'bg-emerald-500';
      case 'SSP': return 'bg-amber-500';
      case 'BAU': return 'bg-slate-600';
      default: return 'bg-gray-400';
    }
  };

  const stats = useMemo(() => {
    const total = tasks.length;
    const done = tasks.filter(t => t.status === WorkTaskStatus.DONE).length;
    return {
      total,
      done,
      pct: total > 0 ? Math.round((done / total) * 100) : 0
    };
  }, [tasks]);

  const subtaskCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    tasks.forEach(t => {
      if (t.parentId) {
        counts[t.parentId] = (counts[t.parentId] || 0) + 1;
      }
    });
    return counts;
  }, [tasks]);

  const isTaskBlockedFromClosing = (taskId: string) => {
    const children = tasks.filter(t => t.parentId === taskId);
    if (children.length === 0) return false;
    return children.some(c => c.status !== WorkTaskStatus.DONE && c.status !== WorkTaskStatus.CANCELLED);
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      <header className="flex flex-col lg:flex-row lg:justify-between lg:items-end gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Task Management</h1>
          <p className="text-sm text-gray-500 font-medium mt-1">Structured execution tracking for team deliverables.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-6">
          <div className="text-right">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Queue Completion</p>
            <div className="flex items-center gap-3">
              <span className="text-lg font-black text-indigo-600">{stats.pct}%</span>
              <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full bg-indigo-600 transition-all duration-700" style={{ width: `${stats.pct}%` }}></div>
              </div>
            </div>
          </div>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3.5 rounded-2xl font-bold flex items-center gap-2 transition-all shadow-xl shadow-indigo-100"
          >
            <i className="fas fa-plus-circle"></i>
            New Main Task
          </button>
        </div>
      </header>

      {/* Filter Bar */}
      <div className="bg-white border border-gray-200 rounded-3xl p-4 shadow-sm flex flex-wrap items-center gap-4">
        <div className="flex-1 min-w-[200px] relative">
          <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"></i>
          <input 
            type="text" 
            placeholder="Search by Task ID..."
            className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-bold text-black"
            value={filterTaskId}
            onChange={(e) => setFilterTaskId(e.target.value)}
          />
        </div>

        <div className="min-w-[180px]">
          <select 
            className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-bold text-black appearance-none cursor-pointer"
            value={filterAssignee}
            onChange={(e) => setFilterAssignee(e.target.value)}
          >
            <option value="">All Assignees</option>
            {team.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>
        </div>

        <div className="min-w-[160px]">
          <select 
            className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-bold text-black appearance-none cursor-pointer"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="">All Statuses</option>
            {Object.values(WorkTaskStatus).map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        {isFiltered && (
          <button 
            onClick={clearFilters}
            className="px-4 py-3 text-sm font-black text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors flex items-center gap-2"
          >
            <i className="fas fa-times"></i>
            Clear
          </button>
        )}
      </div>

      <div className="bg-white border border-gray-200 rounded-[2.5rem] shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50/50 border-b border-gray-100">
              <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest w-48">Task ID</th>
              <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Projects/Tasks {isFiltered && <span className="text-indigo-400">(Search Results)</span>}</th>
              <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest w-48 text-center">Assignee</th>
              <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest w-24 text-center">Effort</th>
              <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest w-40 text-center text-nowrap">Status</th>
              <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest w-32 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {visibleTasks.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-20 text-center">
                  <div className="flex flex-col items-center gap-3 opacity-20">
                    <i className={`fas ${isFiltered ? 'fa-search-minus' : 'fa-layer-group'} text-6xl`}></i>
                    <p className="font-bold">{isFiltered ? 'No tasks match your filter criteria.' : 'No tasks recorded in current queue.'}</p>
                  </div>
                </td>
              </tr>
            ) : (
              visibleTasks.map((task) => {
                const assignee = team.find(m => m.id === task.assignedTo);
                const isSubtask = !!task.parentId;
                const hasChildren = (subtaskCounts[task.id] || 0) > 0;
                const isExpanded = expandedTasks.has(task.id);
                const blockedFromClosing = !isSubtask && isTaskBlockedFromClosing(task.id);
                
                return (
                  <tr key={task.id} className={`group hover:bg-gray-50/80 transition-all ${isSubtask ? 'bg-gray-50/30' : ''}`}>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2">
                        {!isFiltered && !isSubtask && hasChildren && (
                          <button 
                            onClick={() => toggleExpand(task.id)}
                            className="w-5 h-5 flex items-center justify-center rounded-md hover:bg-gray-200 text-gray-400 transition-colors"
                          >
                            <i className={`fas ${isExpanded ? 'fa-chevron-down' : 'fa-chevron-right'} text-[10px]`}></i>
                          </button>
                        )}
                        {(!isSubtask || isFiltered) && !hasChildren && <div className="w-5" />}
                        <span className={`text-[11px] font-black tracking-tight ${isSubtask ? 'text-indigo-400' : 'text-gray-900'} ${isSubtask && !isFiltered ? 'ml-6' : ''}`}>
                          {task.id}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        {isSubtask && !isFiltered ? (
                          <div className="flex items-center gap-2 ml-4">
                            <div className="w-4 h-4 border-l-2 border-b-2 border-gray-200 rounded-bl-lg -mt-4"></div>
                            <p className="text-sm font-bold text-gray-600">{task.title}</p>
                          </div>
                        ) : (
                          <div className="flex items-center gap-3">
                            <div className={`w-2.5 h-2.5 rounded-full ${getCategoryColor(task.category)}`}></div>
                            <div>
                               <p className={`text-sm ${isSubtask ? 'font-bold text-gray-600' : 'font-black text-gray-900'}`}>{task.title}</p>
                               {isFiltered && isSubtask && <p className="text-[9px] text-indigo-400 font-bold uppercase mt-0.5">Subtask of {task.parentId}</p>}
                            </div>
                            {!isFiltered && hasChildren && (
                              <span className="text-[10px] font-bold text-indigo-400 bg-indigo-50/50 px-1.5 py-0.5 rounded">
                                {subtaskCounts[task.id]} Subtasks
                              </span>
                            )}
                            {!isSubtask && (
                                <button 
                                  onClick={() => openSubtaskModal(task.id)}
                                  className="opacity-0 group-hover:opacity-100 px-2 py-0.5 rounded-md bg-indigo-50 text-[10px] font-black text-indigo-600 hover:bg-indigo-100 transition-all uppercase"
                                >
                                  + Sub
                                </button>
                            )}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-5 text-center">
                      <div className="inline-flex items-center gap-2 bg-gray-50/50 hover:bg-gray-100 p-1.5 rounded-xl transition-colors">
                        <img src={assignee?.avatar} className="w-6 h-6 rounded-full ring-1 ring-gray-100 shrink-0" alt="" />
                        <select
                          value={task.assignedTo}
                          onChange={(e) => onUpdateTask(task.id, { assignedTo: e.target.value })}
                          className="text-xs font-bold text-gray-600 bg-transparent border-none outline-none focus:ring-0 cursor-pointer appearance-none pr-1"
                        >
                          {team.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                        </select>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-center">
                      <div className="inline-flex items-center gap-1">
                        {!isSubtask && hasChildren && (
                          <i className="fas fa-sigma text-[10px] text-indigo-400" title="Calculated Sum"></i>
                        )}
                        <span className={`text-xs font-black ${!isSubtask && hasChildren ? 'text-indigo-600' : 'text-gray-900'}`}>
                          {task.effortHours}h
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-center">
                      <div className="flex items-center justify-center gap-2">
                        {blockedFromClosing && (
                           <i className="fas fa-lock text-[10px] text-amber-500" title="Subtasks must be Done or Cancelled before closing this task."></i>
                        )}
                        <select 
                          value={task.status}
                          onChange={(e) => onUpdateTask(task.id, { status: e.target.value as WorkTaskStatus })}
                          className={`text-[10px] font-black px-2.5 py-1.5 rounded-lg border-none ring-1 ring-gray-200 focus:ring-2 focus:ring-indigo-500 appearance-none cursor-pointer text-black ${getStatusStyle(task.status)}`}
                        >
                          {Object.values(WorkTaskStatus).map(s => {
                            const isClosingStatus = s === WorkTaskStatus.DONE || s === WorkTaskStatus.CANCELLED;
                            const isDisabled = blockedFromClosing && isClosingStatus && task.status !== s;
                            return (
                              <option key={s} value={s} disabled={isDisabled} className="text-black">
                                {s} {isDisabled ? '(Subtasks Open)' : ''}
                              </option>
                            );
                          })}
                        </select>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <div className="flex justify-end gap-2">
                        <button 
                          onClick={() => openEditModal(task)}
                          className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                          title="Edit Task"
                        >
                          <i className="fas fa-edit text-xs"></i>
                        </button>
                        {isSubtask && (
                          <button 
                            onClick={() => confirmDelete(task.id)}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                            title="Delete Task"
                          >
                            <i className="fas fa-trash-alt text-xs"></i>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Delete Confirmation Modal */}
      {isDeleteConfirmOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-[2.5rem] w-full max-w-sm overflow-hidden shadow-2xl p-8 text-center animate-scaleIn">
            <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <i className="fas fa-exclamation-triangle text-2xl"></i>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Confirm Removal</h3>
            <p className="text-sm text-gray-500 mb-8">
              Are you sure you want to remove this task? 
              {tasks.some(t => t.parentId === taskToDelete) && " Removing this parent task will also delete all associated subtasks."}
            </p>
            <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={() => setIsDeleteConfirmOpen(false)}
                className="px-4 py-4 bg-gray-100 text-gray-600 font-bold rounded-2xl hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleDelete}
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
          <div className="bg-white rounded-[2.5rem] w-full max-w-xl overflow-hidden shadow-2xl animate-scaleIn">
            <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  {editingTask ? 'Edit Task' : parentTaskId ? 'Create Subtask' : 'Create New Task'}
                </h2>
                {(parentTaskId || (editingTask && editingTask.parentId)) && (
                  <p className="text-xs font-bold text-indigo-500 uppercase mt-1 tracking-widest">
                    Parent: {parentTaskId || (editingTask && editingTask.parentId)}
                  </p>
                )}
                {editingTask && (
                   <p className="text-xs font-bold text-gray-400 uppercase mt-1 tracking-widest">
                    Task ID: {editingTask.id}
                  </p>
                )}
              </div>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600 transition-colors">
                <i className="fas fa-times text-xl"></i>
              </button>
            </div>
            
            <form onSubmit={handleSaveTask} className="p-8 space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="col-span-2 space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Task Title</label>
                  <input 
                    type="text" required
                    className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none text-black font-bold"
                    value={formData.title}
                    onChange={e => setFormData({...formData, title: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Category</label>
                  <select 
                    className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none text-black font-bold"
                    value={formData.category}
                    onChange={e => setFormData({...formData, category: e.target.value as any})}
                    disabled={!!parentTaskId || (!!editingTask && !!editingTask.parentId)}
                  >
                    <option value="CTB">CTB (Change the Biz)</option>
                    <option value="RTB">RTB (Run the Biz)</option>
                    <option value="SSP">SSP (Single Service Project)</option>
                    <option value="BAU">BAU (Business as Usual)</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Assigned To</label>
                  <select 
                    className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none text-black font-bold"
                    value={formData.assignedTo}
                    onChange={e => setFormData({...formData, assignedTo: e.target.value})}
                  >
                    {team.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Effort (Hours)</label>
                  <input 
                    type="number" required
                    className={`w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none text-black font-bold ${(!parentTaskId && !editingTask?.parentId && tasks.some(t => t.parentId === (editingTask?.id))) ? 'opacity-50 cursor-not-allowed' : ''}`}
                    value={formData.effortHours}
                    onChange={e => setFormData({...formData, effortHours: parseInt(e.target.value)})}
                    readOnly={!parentTaskId && !editingTask?.parentId && tasks.some(t => t.parentId === (editingTask?.id))}
                    title={(!parentTaskId && !editingTask?.parentId && tasks.some(t => t.parentId === (editingTask?.id))) ? "Effort is calculated from subtasks" : ""}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Recurrence</label>
                  <select 
                    className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none text-black font-bold"
                    value={formData.recurrence}
                    onChange={e => setFormData({...formData, recurrence: e.target.value as TaskRecurrence})}
                  >
                    {Object.values(TaskRecurrence).map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Start Date</label>
                  <input 
                    type="date" required
                    className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none text-black font-bold"
                    value={formData.startDate}
                    onChange={e => setFormData({...formData, startDate: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">End Date</label>
                  <input 
                    type="date" required
                    className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none text-black font-bold"
                    value={formData.endDate}
                    onChange={e => setFormData({...formData, endDate: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Status</label>
                  <select 
                    className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none text-black font-bold"
                    value={formData.status}
                    onChange={e => setFormData({...formData, status: e.target.value as WorkTaskStatus})}
                  >
                    {Object.values(WorkTaskStatus).map(s => {
                       const isClosingStatus = s === WorkTaskStatus.DONE || s === WorkTaskStatus.CANCELLED;
                       const blocked = editingTask && !editingTask.parentId && isTaskBlockedFromClosing(editingTask.id);
                       const isDisabled = blocked && isClosingStatus && formData.status !== s;
                       return (
                        <option key={s} value={s} disabled={isDisabled}>
                          {s} {isDisabled ? '(Subtasks Open)' : ''}
                        </option>
                       );
                    })}
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={closeModal} className="px-6 py-4 rounded-2xl font-bold text-gray-500 hover:bg-gray-100 transition-colors">Cancel</button>
                <button type="submit" className="px-10 py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 shadow-xl shadow-indigo-100 transition-all active:scale-95">
                  {editingTask ? 'Save Changes' : 'Confirm & Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track { background: #f1f1f1; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #ddd; border-radius: 10px; }
        @keyframes scaleIn { from { opacity: 0; transform: scale(0.95) translateY(10px); } to { opacity: 1; transform: scale(1) translateY(0); } }
        .animate-scaleIn { animation: scaleIn 0.2s ease-out forwards; }
      `}</style>
    </div>
  );
};

export default TaskList;