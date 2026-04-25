/**
 * @file frontend/src/components/TopBar.tsx
 * @description Top navigation bar with Kovera branding and green accent design.
 */

import React from 'react';
import { useNetworkContext } from '../context/NetworkContext';
import { LogOut, RefreshCw, Moon, Sun, PanelLeft, PanelRight, Zap, MapPinned } from 'lucide-react';

const TopBar: React.FC = () => {
  const { 
    isAdmin, role, loading, regenerateGraph, logout, theme, toggleTheme, 
    sidebarOpen, toggleSidebar, detailsOpen, toggleDetails, networkStats,
    refreshGeocode, refreshing
  } = useNetworkContext();

  return (
    <div className="h-[56px] bg-bg2/80 backdrop-blur-xl border-b border-border2 flex items-center justify-between px-5 z-50 shrink-0">
      <div className="flex items-center gap-4">
        <button 
          onClick={toggleSidebar}
          className={`p-2 rounded-lg transition-all ${sidebarOpen ? 'text-kovera bg-kovera-glow' : 'text-text3 hover:text-text hover:bg-white/5'}`}
          title={sidebarOpen ? 'Close Sidebar' : 'Open Sidebar'}
        >
          <PanelLeft className="w-4 h-4" />
        </button>

        {/* Kovera Logo */}
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-0.5">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-kovera" />
              <path d="M12 2c5.52 0 10 4.48 10 10s-4.48 10-10 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-text3" strokeDasharray="4 4" />
            </svg>
            <h1 className="text-sm font-bold tracking-[0.2em] text-text ml-1">
              KOVERA
            </h1>
          </div>
          <div className="h-4 w-px bg-border2" />
          <span className="text-[10px] font-medium tracking-widest text-text3 uppercase">Admin</span>
        </div>
        
        <div className="hidden md:flex items-center gap-2 ml-2">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-kovera/20 bg-kovera/5">
            <Zap className="w-3 h-3 text-kovera" />
            <span className="text-[10px] font-semibold text-kovera tracking-wide">LIVE</span>
          </div>
          {networkStats && (
            <div className="flex gap-3 ml-2 text-[10px] text-text3 font-mono">
              <span>{networkStats.nodes?.total || 0} Nodes</span>
              <span>{networkStats.edges?.total || 0} Edges</span>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        {/* Session Info */}
        <div className="hidden md:block text-right mr-2">
          <div className="text-[9px] text-text3 uppercase tracking-widest">Session</div>
          <div className="text-[11px] font-semibold text-text2 uppercase">{role}</div>
        </div>

        {isAdmin && (
          <>
            <button 
              onClick={refreshGeocode}
              disabled={refreshing || loading}
              className="kovera-btn-outline text-[11px] py-2 px-3 flex items-center gap-1.5 disabled:opacity-50"
              title="Refresh geocode data"
            >
              <MapPinned className={`w-3 h-3 ${refreshing ? 'animate-pulse' : ''}`} />
              {refreshing ? 'Geocoding...' : 'Geocode'}
            </button>
            <button 
              onClick={regenerateGraph}
              disabled={loading}
              className="kovera-btn text-[11px] py-2 px-4 flex items-center gap-1.5"
            >
              <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
              {loading ? 'Working...' : 'Regenerate'}
            </button>
          </>
        )}
        
        <button 
          onClick={toggleDetails}
          className={`p-2 rounded-lg transition-all ${detailsOpen ? 'text-kovera bg-kovera-glow' : 'text-text3 hover:text-text hover:bg-white/5'}`}
          title={detailsOpen ? 'Close Panel' : 'Open Panel'}
        >
          <PanelRight className="w-4 h-4" />
        </button>

        <div className="h-5 w-px bg-border2" />

        <button 
          onClick={toggleTheme}
          className="p-2 rounded-lg hover:bg-white/5 transition-colors text-text3 hover:text-text"
          title={theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
        >
          {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        <button 
          onClick={logout}
          className="p-2 rounded-lg hover:bg-pink-node/10 transition-colors text-text3 hover:text-pink-node"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default TopBar;
