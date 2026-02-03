
import React from 'react';

interface SidebarProps {
  currentView: 'dashboard' | 'orders' | 'team' | 'tasks';
  setView: (view: 'dashboard' | 'orders' | 'team' | 'tasks') => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, setView }) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: 'fa-chart-line' },
    { id: 'orders', label: 'Order Book', icon: 'fa-book' },
    { id: 'team', label: 'Team', icon: 'fa-users' },
    { id: 'tasks', label: 'Tasks', icon: 'fa-list-check' },
  ];

  return (
    <aside className="w-64 bg-white border-r border-gray-200 flex flex-col h-screen sticky top-0 shrink-0">
      <div className="p-6">
        <div className="flex items-center gap-3 text-indigo-600 font-bold text-xl">
          <div className="bg-indigo-600 text-white p-2 rounded-lg">
            <i className="fas fa-layer-group"></i>
          </div>
          <span>TeamPulse</span>
        </div>
      </div>

      <nav className="flex-1 px-4 py-4 space-y-1">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setView(item.id as any)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
              currentView === item.id
                ? 'bg-indigo-50 text-indigo-700'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            }`}
          >
            <i className={`fas ${item.icon} w-5 text-center`}></i>
            {item.label}
          </button>
        ))}
      </nav>

      <div className="p-4 border-t border-gray-100">
        <div className="bg-gray-50 rounded-xl p-4 flex items-center gap-3">
          <img
            src="https://picsum.photos/seed/admin/40"
            alt="Admin"
            className="w-10 h-10 rounded-full border-2 border-white shadow-sm"
          />
          <div className="overflow-hidden">
            <p className="text-sm font-semibold text-gray-900 truncate">Alex Rivera</p>
            <p className="text-xs text-gray-500 truncate">Workspace Admin</p>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
