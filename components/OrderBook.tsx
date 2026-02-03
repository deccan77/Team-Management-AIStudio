
import React, { useState, useMemo } from 'react';
import { Project, ProjectStatus, ProjectCategory, TeamMember, ProjectTemplate, Task } from '../types';
import { PROJECT_TEMPLATES } from '../constants';

interface OrderBookProps {
  projects: Project[];
  team: TeamMember[];
  onAddProject: (project: Project) => void;
  onUpdateProject: (id: string, updates: Partial<Project>) => void;
}

const OrderBook: React.FC<OrderBookProps> = ({ projects, team, onAddProject, onUpdateProject }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [entryMode, setEntryMode] = useState<'template' | 'manual'>('template');
  const [selectedTemplate, setSelectedTemplate] = useState<ProjectTemplate | null>(null);
  
  // Filter States
  const [filterSearch, setFilterSearch] = useState('');
  const [filterOwner, setFilterOwner] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    ownerId: team[0]?.id || '',
    startDate: new Date().toISOString().split('T')[0],
    category: ProjectCategory.CTB,
    description: '',
    status: ProjectStatus.PENDING
  });

  const clearFilters = () => {
    setFilterSearch('');
    setFilterOwner('');
    setFilterCategory('');
    setFilterStatus('');
  };

  const isFiltered = filterSearch !== '' || filterOwner !== '' || filterCategory !== '' || filterStatus !== '';

  const filteredProjects = useMemo(() => {
    return projects.filter(project => {
      const matchSearch = !filterSearch || 
        project.name.toLowerCase().includes(filterSearch.toLowerCase()) || 
        project.description.toLowerCase().includes(filterSearch.toLowerCase());
      const matchOwner = !filterOwner || project.ownerId === filterOwner;
      const matchCategory = !filterCategory || project.category === filterCategory;
      const matchStatus = !filterStatus || project.status === filterStatus;
      
      return matchSearch && matchOwner && matchCategory && matchStatus;
    });
  }, [projects, filterSearch, filterOwner, filterCategory, filterStatus]);

  const handleTemplateSelect = (templateId: string) => {
    const tpl = PROJECT_TEMPLATES.find(t => t.id === templateId) || null;
    setSelectedTemplate(tpl);
    if (tpl) {
      setFormData(prev => ({ 
        ...prev, 
        name: tpl.name, 
        category: tpl.category 
      }));
    }
  };

  const handleCreateProject = () => {
    if (!formData.name) return;

    let generatedTasks: Task[] = [];
    if (entryMode === 'template' && selectedTemplate) {
      generatedTasks = selectedTemplate.defaultTasks.map((dt, idx) => ({
        id: `task-${Date.now()}-${idx}`,
        projectId: '', // will be set
        title: dt.title,
        effortDays: dt.effortEstimate,
        status: 'Todo'
      }));
    }

    const newProject: Project = {
      id: `prj-${Date.now()}`,
      ...formData,
      endDate: formData.startDate,
      tasks: generatedTasks,
      createdAt: new Date().toISOString().split('T')[0]
    };

    newProject.tasks = newProject.tasks.map(t => ({ ...t, projectId: newProject.id }));
    
    onAddProject(newProject);
    setIsModalOpen(false);
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      name: '',
      ownerId: team[0]?.id || '',
      startDate: new Date().toISOString().split('T')[0],
      category: ProjectCategory.CTB,
      description: '',
      status: ProjectStatus.PENDING
    });
    setSelectedTemplate(null);
  };

  const getStatusColor = (status: ProjectStatus) => {
    switch (status) {
      case ProjectStatus.WISHLIST: return 'bg-purple-100 text-purple-700';
      case ProjectStatus.PENDING: return 'bg-yellow-100 text-yellow-700';
      case ProjectStatus.CONFIRMED: return 'bg-green-100 text-green-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getCategoryColor = (cat: ProjectCategory) => {
    switch (cat) {
      case ProjectCategory.CTB: return 'bg-blue-600';
      case ProjectCategory.RTB: return 'bg-teal-600';
      case ProjectCategory.SSP: return 'bg-amber-600';
      case ProjectCategory.BAU: return 'bg-slate-600';
      case ProjectCategory.OTHER: return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Project Order Book</h1>
          <p className="text-sm text-gray-500 font-medium mt-1">Central registry for all team initiatives and wishlists.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-indigo-100"
        >
          <i className="fas fa-plus"></i>
          Register New Project
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white border border-gray-200 rounded-3xl p-4 shadow-sm flex flex-wrap items-center gap-4">
        <div className="flex-1 min-w-[240px] relative">
          <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"></i>
          <input 
            type="text" 
            placeholder="Search projects..."
            className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-bold text-black"
            value={filterSearch}
            onChange={(e) => setFilterSearch(e.target.value)}
          />
        </div>

        <div className="min-w-[160px]">
          <select 
            className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-bold text-black appearance-none cursor-pointer"
            value={filterOwner}
            onChange={(e) => setFilterOwner(e.target.value)}
          >
            <option value="">All Owners</option>
            {team.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>
        </div>

        <div className="min-w-[140px]">
          <select 
            className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-bold text-black appearance-none cursor-pointer"
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
          >
            <option value="">All Categories</option>
            {Object.values(ProjectCategory).map(cat => <option key={cat} value={cat}>{cat}</option>)}
          </select>
        </div>

        <div className="min-w-[140px]">
          <select 
            className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-bold text-black appearance-none cursor-pointer"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="">All Statuses</option>
            {Object.values(ProjectStatus).map(status => <option key={status} value={status}>{status}</option>)}
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

      <div className="bg-white border border-gray-200 rounded-3xl shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Project Details</th>
              <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Owner</th>
              <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Category</th>
              <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Timeline</th>
              <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredProjects.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-20 text-center text-gray-400 italic font-medium">
                  No projects match the selected filters.
                </td>
              </tr>
            ) : (
              filteredProjects.map((project) => {
                const owner = team.find(t => t.id === project.ownerId);
                return (
                  <tr key={project.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${getCategoryColor(project.category)}`}></div>
                        <div>
                          <p className="font-bold text-gray-900">{project.name}</p>
                          <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{project.description}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="inline-flex items-center gap-2 bg-gray-50 hover:bg-gray-100 p-2 rounded-xl transition-colors">
                        <img src={owner?.avatar} className="w-6 h-6 rounded-full border border-gray-200 shrink-0" alt="" />
                        <select
                          value={project.ownerId}
                          onChange={(e) => onUpdateProject(project.id, { ownerId: e.target.value })}
                          className="text-sm font-medium text-gray-700 bg-transparent border-none outline-none focus:ring-0 cursor-pointer appearance-none pr-1"
                        >
                          {team.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                        </select>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <span className={`text-[10px] font-black text-white px-2 py-1 rounded-md ${getCategoryColor(project.category)}`}>
                        {project.category}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-center">
                      <div className="text-xs text-gray-600 font-medium">
                        <p className="font-bold">{project.startDate}</p>
                        <p className="text-gray-400 text-[10px]">to {project.endDate}</p>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <select
                        value={project.status}
                        onChange={(e) => onUpdateProject(project.id, { status: e.target.value as ProjectStatus })}
                        className={`text-[11px] font-black px-3 py-2 rounded-xl border-none ring-1 ring-inset ring-gray-200 focus:ring-2 focus:ring-indigo-500 cursor-pointer appearance-none text-black ${getStatusColor(project.status)}`}
                      >
                        {Object.values(ProjectStatus).map(s => <option key={s} value={s} className="text-black">{s}</option>)}
                      </select>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-[2.5rem] w-full max-w-2xl overflow-hidden shadow-2xl animate-scaleIn">
            <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                <i className="fas fa-file-invoice text-indigo-600"></i>
                Register Project
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                <i className="fas fa-times text-xl"></i>
              </button>
            </div>

            <div className="p-8 space-y-6">
              <div className="flex bg-gray-100 p-1 rounded-2xl">
                <button 
                  onClick={() => setEntryMode('template')}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${entryMode === 'template' ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  Template Project
                </button>
                <button 
                  onClick={() => setEntryMode('manual')}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${entryMode === 'manual' ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  Manual Entry
                </button>
              </div>

              <div className="grid grid-cols-2 gap-6">
                {entryMode === 'template' ? (
                  <div className="col-span-2 space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase ml-1 tracking-widest">Select Template</label>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {PROJECT_TEMPLATES.map(tpl => (
                        <button
                          key={tpl.id}
                          onClick={() => handleTemplateSelect(tpl.id)}
                          className={`p-4 rounded-2xl border-2 text-left transition-all ${selectedTemplate?.id === tpl.id ? 'border-indigo-600 bg-indigo-50/50' : 'border-gray-100 hover:border-gray-200'}`}
                        >
                          <p className="text-sm font-bold text-gray-900">{tpl.name}</p>
                          <p className="text-[10px] text-indigo-600 font-bold mt-1">{tpl.category}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="col-span-2 space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase ml-1 tracking-widest">Project Name</label>
                    <input
                      type="text"
                      className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none text-black font-bold placeholder:font-normal"
                      placeholder="Enter project name..."
                      value={formData.name}
                      onChange={e => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase ml-1 tracking-widest">Owner</label>
                  <select
                    className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none text-black font-bold"
                    value={formData.ownerId}
                    onChange={e => setFormData({ ...formData, ownerId: e.target.value })}
                  >
                    {team.map(m => <option key={m.id} value={m.id} className="text-black">{m.name}</option>)}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase ml-1 tracking-widest">Category</label>
                  <select
                    className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none text-black font-bold"
                    value={formData.category}
                    onChange={e => setFormData({ ...formData, category: e.target.value as ProjectCategory })}
                    disabled={entryMode === 'template'}
                  >
                    {Object.values(ProjectCategory).map(c => <option key={c} value={c} className="text-black">{c}</option>)}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase ml-1 tracking-widest">Start Date</label>
                  <input
                    type="date"
                    className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none text-black font-bold"
                    value={formData.startDate}
                    onChange={e => setFormData({ ...formData, startDate: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase ml-1 tracking-widest">Initial Status</label>
                  <select
                    className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none text-black font-bold"
                    value={formData.status}
                    onChange={e => setFormData({ ...formData, status: e.target.value as ProjectStatus })}
                  >
                    {Object.values(ProjectStatus).map(s => <option key={s} value={s} className="text-black">{s}</option>)}
                  </select>
                </div>

                <div className="col-span-2 space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase ml-1 tracking-widest">Description</label>
                  <textarea
                    className="w-full h-24 p-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none resize-none text-black font-bold placeholder:font-normal"
                    placeholder="Briefly describe project scope..."
                    value={formData.description}
                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>
              </div>

              {entryMode === 'template' && selectedTemplate && (
                <div className="bg-indigo-50 p-6 rounded-3xl border border-indigo-100">
                  <p className="text-[10px] font-black text-indigo-400 uppercase mb-4 tracking-widest">Auto-Generated Task List</p>
                  <div className="space-y-2 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
                    {selectedTemplate.defaultTasks.map((t, idx) => (
                      <div key={idx} className="flex justify-between items-center text-xs bg-white p-3 rounded-xl shadow-sm border border-indigo-50">
                        <span className="font-bold text-gray-700">{t.title}</span>
                        <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-lg">~{t.effortEstimate}d effort</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="p-8 pt-0 flex justify-end gap-3">
              <button 
                onClick={() => setIsModalOpen(false)}
                className="px-6 py-4 rounded-2xl font-bold text-gray-500 hover:bg-gray-100 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleCreateProject}
                className="px-10 py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 shadow-xl shadow-indigo-100 transition-all active:scale-95"
                disabled={!formData.name}
              >
                Create Project
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderBook;
