import React, { useEffect, useState } from 'react';
import { AdminPortalRouter } from './app/AdminPortalRouter';
import { AuthSession, authService, SignInPage } from './features/auth';
import { NotFoundPage } from './features/not-found';
import { PortalSectionId } from './shared/layouts/portal-layout';
import { ThemeProvider } from './theme';

const getNormalizedPath = (): string => {
  const path = window.location.pathname.toLowerCase().replace(/\/+$/, '');
  return path === '' ? '/' : path;
};

const SECTION_MAP: Record<string, PortalSectionId> = {
  '/': 'dashboard',
  '/dashboard': 'dashboard',
  '/projects': 'projects',
  '/project': 'projects',
  '/mail': 'mail',
  '/domains': 'domains',
  '/domain': 'domains',
  '/tmail': 'domains',
  '/two-factor': 'two-factor',
  '/2fa': 'two-factor',
  '/notes': 'notes',
  '/settings': 'settings',
};

const KNOWN_PATHS = new Set([
  '/',
  '/dashboard',
  '/projects',
  '/project',
  '/mail',
  '/domains',
  '/domain',
  '/tmail',
  '/two-factor',
  '/2fa',
  '/notes',
  '/settings',
  '/login',
  '/signin',
]);

export const App: React.FC = () => {
  const [session, setSession] = useState<AuthSession | null>(() =>
    authService.getSession()
  );
  const [currentPath, setCurrentPath] = useState<string>(getNormalizedPath);

  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(getNormalizedPath());
    };
    const handleSessionUpdate = () => {
      setSession(authService.getSession());
    };

    window.addEventListener('popstate', handlePopState);
    window.addEventListener('onevault-session-updated', handleSessionUpdate);
    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('onevault-session-updated', handleSessionUpdate);
    };
  }, []);

  const handleGoHome = () => {
    window.history.pushState(null, '', '/');
    setCurrentPath('/');
  };

  const handleSelectSection = (section: PortalSectionId) => {
    const nextPath = section === 'dashboard' ? '/' : `/${section}`;
    window.history.pushState(null, '', nextPath);
    setCurrentPath(nextPath);
  };

  const handleSignOut = () => {
    authService.clearSession();
    setSession(null);
    window.history.pushState(null, '', '/');
    setCurrentPath('/');
  };

  const handleSignInSuccess = (newSession: AuthSession) => {
    setSession(newSession);
    window.history.pushState(null, '', '/');
    setCurrentPath('/');
  };

  const handleNavigatePath = (nextPath: string) => {
    window.history.pushState(null, '', nextPath);
    setCurrentPath(nextPath.toLowerCase().replace(/\/+$/, '') || '/');
  };

  // Support /projects/:slug deep-linking for dedicated project insights
  const pathSegments = currentPath.split('/').filter(Boolean);
  const isProjectPath =
    (pathSegments[0] === 'projects' || pathSegments[0] === 'project') &&
    pathSegments.length <= 2;
  const projectSlug = isProjectPath && pathSegments.length === 2 ? pathSegments[1] : undefined;

  let activeSection: PortalSectionId = 'dashboard';
  if (isProjectPath) {
    activeSection = 'projects';
  } else if (SECTION_MAP[currentPath]) {
    activeSection = SECTION_MAP[currentPath];
  }

  // Check if current path is an invalid, hidden, or unmapped URL
  const isNotFound =
    (!KNOWN_PATHS.has(currentPath) && !isProjectPath) ||
    currentPath.includes('..') ||
    /(?:^|\/)\.[^/]/.test(currentPath);

  return (
    <ThemeProvider>
      {isNotFound ? (
        <NotFoundPage onGoHome={handleGoHome} />
      ) : session ? (
        <AdminPortalRouter
          userEmail={session.email}
          onSignOut={handleSignOut}
          activeSection={activeSection}
          onSelectSection={handleSelectSection}
          projectSlug={projectSlug}
          onNavigatePath={handleNavigatePath}
        />
      ) : (
        <SignInPage onSignInSuccess={handleSignInSuccess} />
      )}
    </ThemeProvider>
  );
};

export default App;

