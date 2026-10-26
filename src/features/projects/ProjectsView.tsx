import React, { useState, useEffect, useMemo } from 'react';
import {
  Plus,
  ArrowClockwise,
  ShieldCheck,
  MagnifyingGlass,
  X,
  Globe,
  Database,
  Browsers,
} from '@phosphor-icons/react';
import { projectsService } from './services/projects.service';
import { ProjectRow } from './components/ProjectRow';
import { ProjectConfigModal } from './components/ProjectConfigModal';
import { ProjectIntegrationModal } from './components/ProjectIntegrationModal';
import { ProjectTelemetryModal } from './components/ProjectTelemetryModal';
import { UnplugModal } from './components/UnplugModal';
import { DeleteProjectModal } from './components/DeleteProjectModal';
import type {
  ProjectItem,
  CreateProjectPayload,
  UpdateProjectPayload,
} from './types/projects.types';

export const ProjectsView: React.FC = () => {
  const [projects, setProjects] = useState<ProjectItem[]>(() =>
    projectsService.getCachedProjects()
  );
  const [filter, setFilter] = useState<'all' | 'active' | 'connecting' | 'disabled'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<ProjectItem | null>(null);
  const [integratingProject, setIntegratingProject] = useState<ProjectItem | null>(null);
  const [telemetryProject, setTelemetryProject] = useState<ProjectItem | null>(null);
  const [unplugCandidate, setUnplugCandidate] = useState<ProjectItem | null>(null);
  const [deleteCandidate, setDeleteCandidate] = useState<ProjectItem | null>(null);

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isProcessingAction, setIsProcessingAction] = useState(false);

  const loadProjects = async () => {
    setIsRefreshing(true);
    try {
      const data = await projectsService.getProjects();
      setProjects([...data]);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadProjects();
  }, []);

  const handleToggleClick = async (project: ProjectItem) => {
    if (project.status === 'active') {
      // Open clean OneVault Unplug Modal instead of instant change
      setUnplugCandidate(project);
    } else if (project.status === 'connecting') {
      // Show token and pairing guide
      setIntegratingProject(project);
    } else {
      // Re-activate
      const updated = await projectsService.toggleProjectStatus(project.id, 'active');
      if (updated) {
        setProjects((prev) => prev.map((p) => (p.id === project.id ? updated : p)));
      }
    }
  };

  const handleConfirmUnplug = async () => {
    if (!unplugCandidate) return;
    setIsProcessingAction(true);
    try {
      const updated = await projectsService.toggleProjectStatus(unplugCandidate.id, 'disabled');
      if (updated) {
        setProjects((prev) => prev.map((p) => (p.id === unplugCandidate.id ? updated : p)));
      }
      setUnplugCandidate(null);
    } finally {
      setIsProcessingAction(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteCandidate) return;
    setIsProcessingAction(true);
    try {
      await projectsService.deleteProject(deleteCandidate.id);
      setProjects((prev) => prev.filter((p) => p.id !== deleteCandidate.id));
      setDeleteCandidate(null);
    } finally {
      setIsProcessingAction(false);
    }
  };

  const handleSaveProject = async (
    payload: CreateProjectPayload | UpdateProjectPayload
  ) => {
    if (editingProject) {
      const updated = await projectsService.updateProject(editingProject.id, payload);
      if (updated) {
        setProjects((prev) =>
          prev.map((p) => (p.id === editingProject.id ? updated : p))
        );
      }
    } else {
      const created = await projectsService.createProject(
        payload as CreateProjectPayload
      );
      setProjects((prev) => [created, ...prev.filter((p) => p.id !== created.id)]);
      // Automatically open the pairing modal so user can copy token!
      setIntegratingProject(created);
    }
  };

  const filteredProjects = useMemo(() => {
    let result = projects;
    if (filter !== 'all') {
      result = result.filter((p) => p.status === filter);
    }
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          p.slug.toLowerCase().includes(query) ||
          p.description.toLowerCase().includes(query) ||
          p.domains.some((d) => d.toLowerCase().includes(query)) ||
          p.upstreamApi.toLowerCase().includes(query)
      );
    }
    return result;
  }, [projects, filter, searchQuery]);

  const activeCount = projects.filter((p) => p.status === 'active').length;
  const connectingCount = projects.filter((p) => p.status === 'connecting').length;
  const unpluggedCount = projects.filter((p) => p.status === 'disabled').length;

  return (
    <section className="flex-1 flex flex-col gap-3.5">
      {/* Top Header: Title, Live Pulse Badge, Status Pills, and Action Button */}
      <header className="flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="font-display text-lg sm:text-xl font-bold tracking-tight text-fg-primary leading-tight">
                Projects & Gateways
              </h1>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 px-2 py-0.5 text-[10px] font-semibold">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>{activeCount} Protected</span>
              </span>
              {connectingCount > 0 && (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/25 px-2 py-0.5 text-[10px] font-semibold animate-pulse">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                  <span>{connectingCount} Pairing</span>
                </span>
              )}
            </div>
            <p className="mt-0.5 text-xs text-fg-secondary">
              Centralized anti-scraping shield, concealed upstream API reverse-proxy, and real-time telemetry.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap shrink-0">
            {/* Gateway Status Pill */}
            <div className="hidden lg:inline-flex items-center gap-1.5 rounded-lg border border-default bg-surface px-2.5 py-1.5 text-[11px] font-medium text-fg-secondary shadow-2xs shrink-0">
              <Globe size={14} weight="duotone" className="text-emerald-400 shrink-0" />
              <span>
                Gateway: <strong className="text-fg-primary font-semibold">Edge Active</strong>
              </span>
            </div>

            {/* D1 Storage Pill */}
            <div className="hidden xl:inline-flex items-center gap-1.5 rounded-lg border border-default bg-surface px-2.5 py-1.5 text-[11px] font-medium text-fg-secondary shadow-2xs shrink-0">
              <Database size={14} weight="duotone" className="text-cyan-400 shrink-0" />
              <span>
                Storage: <strong className="text-fg-primary font-semibold">D1 Connected</strong>
              </span>
            </div>

            {/* Connect Project Primary Action Button */}
            <button
              type="button"
              onClick={() => {
                setEditingProject(null);
                setIsConfigModalOpen(true);
              }}
              className="group inline-flex justify-center items-center gap-1.5 rounded-lg bg-accent hover:bg-accent-hover text-accent-fg px-3 py-2 sm:py-1.5 text-xs font-semibold shadow-xs transition-all duration-200 cursor-pointer"
            >
              <Plus
                size={14}
                weight="bold"
                className="transition-transform duration-200 group-hover:rotate-90"
              />
              <span className="leading-none">Connect Project</span>
            </button>
          </div>
        </div>

        {/* Control Toolbar: Filter Switcher & Search Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 pt-0.5">
          {/* Filter Switcher Tabs */}
          <div className="inline-flex items-center gap-1 p-0.5 rounded-lg bg-surface border border-default w-full sm:w-auto shrink-0 overflow-x-auto flex-nowrap scrollbar-none">
            {/* All Projects Tab */}
            <button
              type="button"
              onClick={() => setFilter('all')}
              className={`flex-1 sm:flex-initial inline-flex justify-center items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all duration-150 cursor-pointer shrink-0 whitespace-nowrap ${
                filter === 'all'
                  ? 'bg-sky-500/18 text-sky-400 border border-sky-500/40 shadow-[0_0_12px_rgba(56,189,248,0.22)]'
                  : 'text-fg-secondary hover:text-fg-primary border border-transparent'
              }`}
            >
              <Browsers size={14} weight="bold" />
              <span>All Projects</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                  filter === 'all'
                    ? 'bg-sky-500/25 text-sky-300'
                    : 'bg-elevated text-fg-secondary'
                }`}
              >
                {projects.length}
              </span>
            </button>

            {/* Protected Tab */}
            <button
              type="button"
              onClick={() => setFilter('active')}
              className={`flex-1 sm:flex-initial inline-flex justify-center items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all duration-150 cursor-pointer shrink-0 whitespace-nowrap ${
                filter === 'active'
                  ? 'bg-emerald-500/18 text-emerald-400 border border-emerald-500/40 shadow-[0_0_12px_rgba(16,185,129,0.22)]'
                  : 'text-fg-secondary hover:text-fg-primary border border-transparent'
              }`}
            >
              <ShieldCheck size={14} weight="duotone" />
              <span>Protected</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                  filter === 'active'
                    ? 'bg-emerald-500/25 text-emerald-300'
                    : 'bg-elevated text-fg-secondary'
                }`}
              >
                {activeCount}
              </span>
            </button>

            {/* Connecting Tab (if any) */}
            {connectingCount > 0 && (
              <button
                type="button"
                onClick={() => setFilter('connecting')}
                className={`flex-1 sm:flex-initial inline-flex justify-center items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all duration-150 cursor-pointer shrink-0 whitespace-nowrap ${
                  filter === 'connecting'
                    ? 'bg-amber-500/18 text-amber-400 border border-amber-500/40'
                    : 'text-fg-secondary hover:text-fg-primary border border-transparent'
                }`}
              >
                <span>Pairing</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full font-mono bg-amber-500/25 text-amber-300">
                  {connectingCount}
                </span>
              </button>
            )}

            {/* Unplugged Tab */}
            <button
              type="button"
              onClick={() => setFilter('disabled')}
              className={`flex-1 sm:flex-initial inline-flex justify-center items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all duration-150 cursor-pointer shrink-0 whitespace-nowrap ${
                filter === 'disabled'
                  ? 'bg-zinc-500/20 text-zinc-300 border border-zinc-500/40'
                  : 'text-fg-secondary hover:text-fg-primary border border-transparent'
              }`}
            >
              <span>Unplugged</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full font-mono bg-elevated text-fg-secondary">
                {unpluggedCount}
              </span>
            </button>
          </div>

          {/* Right side controls: Search input & Refresh */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex items-center flex-1 sm:w-72">
              <span className="pointer-events-none absolute left-3 inline-flex items-center justify-center text-fg-muted">
                <MagnifyingGlass size={14} weight="bold" />
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search project, slug, domain..."
                aria-label="Search projects"
                className="w-full rounded-lg bg-surface hover:bg-elevated focus:bg-surface-solid pl-8 pr-7 py-1.5 text-xs text-fg-primary placeholder:text-fg-placeholder border border-default focus:border-emerald-500/50 focus:outline-none transition-colors"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  title="Clear search"
                  className="absolute right-2 inline-flex h-4 w-4 items-center justify-center rounded text-fg-muted hover:text-fg-primary cursor-pointer"
                >
                  <X size={11} weight="bold" />
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={loadProjects}
              disabled={isRefreshing}
              title="Refresh D1 telemetry"
              className="p-1.5 rounded-lg border border-default bg-surface hover:bg-elevated text-fg-muted hover:text-fg-primary transition-colors cursor-pointer"
            >
              <ArrowClockwise
                size={14}
                weight="bold"
                className={isRefreshing ? 'animate-spin text-emerald-400' : ''}
              />
            </button>
          </div>
        </div>
      </header>

      {/* Main List Table */}
      <div className="relative flex-1 flex flex-col justify-between rounded-xl bg-surface-solid border border-default shadow-card overflow-hidden">
        <div className="flex-1 flex flex-col">
          {/* Subtle multi-color top edge gradient accent */}
          <div className="h-[1.5px] w-full bg-gradient-to-r from-emerald-500/40 via-sky-500/40 to-indigo-500/40" />

          {/* Table Header */}
          <div className="hidden sm:grid sm:grid-cols-12 items-center gap-3 border-b border-default bg-elevated/60 px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-fg-muted">
            <div className="col-span-5 flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              <span>Project / Application</span>
            </div>
            <div className="col-span-3 flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-sky-400" />
              <span>Concealed Upstream API</span>
            </div>
            <div className="col-span-2 flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
              <span>Live Telemetry (D1)</span>
            </div>
            <div className="col-span-2 flex items-center justify-end gap-1.5 text-right">
              <span className="h-1.5 w-1.5 rounded-full bg-zinc-400" />
              <span>Status & Actions</span>
            </div>
          </div>

          {/* Project Rows */}
          {filteredProjects.length === 0 ? (
            <div className="px-4 py-14 text-center text-xs text-fg-muted">
              {searchQuery.trim()
                ? `No projects matching "${searchQuery.trim()}".`
                : 'No projects connected yet. Click "Connect Project" to protect your site.'}
            </div>
          ) : (
            <div className="divide-y divide-subtle">
              {filteredProjects.map((project) => (
                <ProjectRow
                  key={project.id}
                  project={project}
                  onToggleStatus={handleToggleClick}
                  onEdit={(p) => {
                    setEditingProject(p);
                    setIsConfigModalOpen(true);
                  }}
                  onIntegrate={(p) => setIntegratingProject(p)}
                  onRequestDelete={(p) => setDeleteCandidate(p)}
                  onViewTelemetry={(p) => setTelemetryProject(p)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Configuration & Integration Modals */}
      <ProjectConfigModal
        isOpen={isConfigModalOpen}
        onClose={() => {
          setIsConfigModalOpen(false);
          setEditingProject(null);
        }}
        onSave={handleSaveProject}
        editingProject={editingProject}
      />

      <ProjectIntegrationModal
        isOpen={Boolean(integratingProject)}
        onClose={() => setIntegratingProject(null)}
        project={integratingProject}
        onProjectUpdated={(updated) => {
          setProjects((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
        }}
      />

      {/* Live Telemetry & User Insights Modal */}
      <ProjectTelemetryModal
        isOpen={Boolean(telemetryProject)}
        onClose={() => setTelemetryProject(null)}
        project={telemetryProject}
      />

      {/* Shared Reusable Modal: Unplug Confirmation */}
      <UnplugModal
        isOpen={Boolean(unplugCandidate)}
        onClose={() => setUnplugCandidate(null)}
        onConfirmUnplug={handleConfirmUnplug}
        project={unplugCandidate}
        isProcessing={isProcessingAction}
      />

      {/* Shared Reusable Modal: Delete Confirmation (Replaces native browser prompt) */}
      <DeleteProjectModal
        isOpen={Boolean(deleteCandidate)}
        onClose={() => setDeleteCandidate(null)}
        onConfirmDelete={handleConfirmDelete}
        project={deleteCandidate}
        isProcessing={isProcessingAction}
      />
    </section>
  );
};
