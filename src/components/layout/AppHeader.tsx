import { useEffect, useState, useRef } from 'react';
import {
  Header,
  HeaderContainer,
  HeaderName,
  HeaderNavigation,
  HeaderMenuItem,
  HeaderMenuButton,
  HeaderGlobalBar,
  HeaderGlobalAction,
  SkipToContent,
  SideNav,
  SideNavItems,
  SideNavLink,
  SideNavDivider,
} from '@carbon/react';
import { Search, Notification, UserAvatar, Dashboard, WarningAlt, Home, Login } from '@carbon/icons-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { GlobalSearch } from './GlobalSearch';

interface AppHeaderProps {
  className?: string;
}

/**
 * Carbon breakpoints for responsive behavior
 * @see https://carbondesignsystem.com/elements/2x-grid/overview/#breakpoints
 */
const XS_BREAKPOINT = 410;  // Below this: only hamburger + logo + search
const MD_BREAKPOINT = 672;  // Below this: hide notifications/profile, keep search
const LG_BREAKPOINT = 1056; // Hide navigation below this

/**
 * AppHeader Component
 *
 * Uses Carbon's HeaderContainer render prop pattern for proper responsive behavior.
 * - Below 672px (sm): Only logo + hamburger menu, everything else in SideNav
 * - 672px-1056px (md): Logo + hamburger + global actions, nav in SideNav
 * - Above 1056px (lg): Full header with navigation + global actions
 *
 * Search bar pattern: IBM-style search that expands in the header row
 * @see https://carbondesignsystem.com/components/UI-shell-header/usage/
 */
export function AppHeader({ className }: AppHeaderProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const closeSideNavRef = useRef<(() => void) | null>(null);

  // Track window width for responsive global actions
  const [windowWidth, setWindowWidth] = useState(
    typeof window !== 'undefined' ? window.innerWidth : LG_BREAKPOINT
  );

  useEffect(() => {
    const handleResize = () => {
      const newWidth = window.innerWidth;
      const oldWidth = windowWidth;
      setWindowWidth(newWidth);

      // Force close sidebar when resizing from mobile to desktop
      if (oldWidth < LG_BREAKPOINT && newWidth >= LG_BREAKPOINT && closeSideNavRef.current) {
        closeSideNavRef.current();
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [windowWidth]);

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  // Responsive visibility for global actions
  const showSearch = windowWidth >= XS_BREAKPOINT;
  const showNotificationsAndProfile = windowWidth >= MD_BREAKPOINT;

  return (
    <>
      <HeaderContainer
        render={({ isSideNavExpanded, onClickSideNavExpand }) => {
          // Store close function in ref
          closeSideNavRef.current = isSideNavExpanded ? onClickSideNavExpand : null;

          const handleNavClick = (path: string) => {
            if (isSideNavExpanded) {
              onClickSideNavExpand();
            }
            navigate(path);
          };

          return (
            <Header aria-label="IBM watsonx Alerts" className={className}>
              <SkipToContent />

              {/* Hamburger menu button - visible on mobile/tablet */}
              <HeaderMenuButton
                aria-label={isSideNavExpanded ? 'Close menu' : 'Open menu'}
                onClick={onClickSideNavExpand}
                isActive={isSideNavExpanded}
                aria-expanded={isSideNavExpanded}
              />

              <HeaderName as={Link} to="/" prefix="IBM">
                watsonx Alerts
              </HeaderName>

              {/* Desktop navigation - hidden on mobile via Carbon's responsive styles */}
              <HeaderNavigation aria-label="Main navigation">
                <HeaderMenuItem
                  as={Link}
                  to="/dashboard"
                  isCurrentPage={isActive('/dashboard')}
                >
                  Dashboard
                </HeaderMenuItem>
                <HeaderMenuItem
                  as={Link}
                  to="/alerts"
                  isCurrentPage={isActive('/alerts')}
                >
                  Alerts
                </HeaderMenuItem>
              </HeaderNavigation>

              {/* Global actions - responsive visibility */}
              <HeaderGlobalBar>
                {/* Search visible down to 410px */}
                {showSearch && (
                  <HeaderGlobalAction
                    aria-label="Search"
                    tooltipAlignment="end"
                    onClick={() => setIsSearchOpen(true)}
                    isActive={isSearchOpen}
                  >
                    <Search size={20} />
                  </HeaderGlobalAction>
                )}
                {/* Notifications and Profile hidden on smaller screens */}
                {showNotificationsAndProfile && (
                  <>
                    <HeaderGlobalAction
                      aria-label="Notifications"
                      tooltipAlignment="end"
                    >
                      <Notification size={20} />
                    </HeaderGlobalAction>
                    <HeaderGlobalAction aria-label="User" tooltipAlignment="end">
                      <UserAvatar size={20} />
                    </HeaderGlobalAction>
                  </>
                )}
              </HeaderGlobalBar>

              {/* Mobile/Tablet side navigation */}
              <SideNav
                aria-label="Side navigation"
                expanded={isSideNavExpanded}
                isPersistent={false}
                onOverlayClick={onClickSideNavExpand}
                onSideNavBlur={onClickSideNavExpand}
              >
                <SideNavItems>
                  {/* Search link - only show on very small screens */}
                  {!showSearch && (
                    <SideNavLink
                      renderIcon={Search}
                      onClick={() => {
                        if (isSideNavExpanded) onClickSideNavExpand();
                        setIsSearchOpen(true);
                      }}
                    >
                      Search
                    </SideNavLink>
                  )}

                  {/* Navigation Links */}
                  <SideNavLink
                    renderIcon={Home}
                    onClick={() => handleNavClick('/')}
                    isActive={isActive('/')}
                  >
                    Home
                  </SideNavLink>
                  <SideNavLink
                    renderIcon={Dashboard}
                    onClick={() => handleNavClick('/dashboard')}
                    isActive={isActive('/dashboard')}
                  >
                    Dashboard
                  </SideNavLink>
                  <SideNavLink
                    renderIcon={WarningAlt}
                    onClick={() => handleNavClick('/alerts')}
                    isActive={isActive('/alerts')}
                  >
                    Alerts
                  </SideNavLink>

                  {/* Divider before account section */}
                  <SideNavDivider />

                  {/* Notifications - show in sidebar when hidden from header */}
                  {!showNotificationsAndProfile && (
                    <SideNavLink renderIcon={Notification}>
                      Notifications
                    </SideNavLink>
                  )}

                  {/* Account section - always visible in SideNav */}
                  <SideNavLink renderIcon={UserAvatar}>
                    Profile
                  </SideNavLink>
                  <SideNavLink renderIcon={Login}>
                    Log in
                  </SideNavLink>
                </SideNavItems>
              </SideNav>
            </Header>
          );
        }}
      />

      {/* Global Search - IBM-style header search bar */}
      <GlobalSearch isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </>
  );
}
