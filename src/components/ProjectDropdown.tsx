import { useState, useEffect, useRef } from 'react';
import { Save, Plus, Trash2, ChevronDown } from 'lucide-react';
import { Button } from './ui/button';
import { useStore } from '../store/subtitleStore';
import { useTranslation } from '../i18n';

export function ProjectDropdown() {
  const [open, setOpen] = useState(false);
  const { savedProjects, currentProjectId, newProject, saveProject, loadProject, deleteProject, refreshProjects } = useStore();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { t } = useTranslation();

  useEffect(() => {
    refreshProjects();
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  const currentProject = savedProjects.find((p) => p.id === currentProjectId);

  return (
    <div className="relative" ref={dropdownRef}>
      <Button
        variant="ghost"
        size="sm"
        className="flex items-center gap-1 text-sm text-gray-400 hover:text-white"
        onClick={() => setOpen(!open)}
      >
        {currentProject ? currentProject.name : t('project.noProject')}
        <ChevronDown size={14} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </Button>

      {open && (
        <div className="absolute top-full left-0 mt-1 w-72 rounded-lg border border-border-custom bg-surface shadow-xl z-50">
          <div className="p-2 border-b border-border-custom">
            <div className="flex gap-1">
              <Button
                variant="outline"
                size="sm"
                className="flex-1 text-xs"
                onClick={() => { newProject(); setOpen(false); }}
              >
                <Plus size={12} /> {t('project.new')}
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex-1 text-xs"
                onClick={() => { saveProject(); setOpen(false); }}
              >
                <Save size={12} /> {t('project.save')}
              </Button>
            </div>
          </div>
          <div className="max-h-64 overflow-y-auto">
            {savedProjects.length === 0 ? (
              <div className="p-4 text-center text-xs text-gray-500">{t('project.empty')}</div>
            ) : (
              savedProjects.map((project) => (
                <div
                  key={project.id}
                  className={`flex items-center justify-between px-3 py-2 hover:bg-surface-hover cursor-pointer ${
                    project.id === currentProjectId ? 'bg-surface-hover border-l-2 border-brand' : ''
                  }`}
                >
                  <button
                    type="button"
                    className="flex-1 text-left"
                    onClick={() => { loadProject(project.id); setOpen(false); }}
                  >
                    <div className="text-sm">{project.name}</div>
                    <div className="text-xs text-gray-500">
                      {new Date(project.updatedAt).toLocaleDateString('pt-BR')} {new Date(project.updatedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </button>
                  <button
                    type="button"
                    className="text-gray-500 hover:text-red-400 p-1"
                    onClick={(e) => { e.stopPropagation(); deleteProject(project.id); }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}