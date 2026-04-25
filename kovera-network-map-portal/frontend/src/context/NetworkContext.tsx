/**
 * @file frontend/src/context/NetworkContext.tsx
 * @description Provides global state for the Network Map Portal.
 * Integrates all Kovera network API endpoints including:
 * - GET graph, stats, chains, clusters, address-cycles, node detail
 * - PUT internal-users (toggle exclude)
 * - POST refresh (geocode refresh)
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { analyticsApi } from '../services/api';

interface NetworkContextType {
  graphData: any;
  networkStats: any;
  clusters: any[];
  addressCycles: any[];
  excludeInternal: boolean;
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  selectedNode: any | null;
  activeChain: any | null;
  filter: string;
  role: 'admin' | 'user' | null;
  isAdmin: boolean;
  theme: 'light' | 'dark';
  sidebarOpen: boolean;
  detailsOpen: boolean;
  toggleTheme: () => void;
  toggleSidebar: () => void;
  toggleDetails: () => void;
  toggleExcludeInternal: () => void;
  setSelectedNode: (node: any | null) => void;
  setActiveChain: (chain: any | null) => void;
  setFilter: (filter: string) => void;
  refreshGraph: () => Promise<void>;
  regenerateGraph: () => Promise<void>;
  refreshGeocode: () => Promise<void>;
  logout: () => void;
}

const NetworkContext = createContext<NetworkContextType | undefined>(undefined);

export const NetworkProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [graphData, setGraphData] = useState<any>(null);
  const [networkStats, setNetworkStats] = useState<any>(null);
  const [clusters, setClusters] = useState<any[]>([]);
  const [addressCycles, setAddressCycles] = useState<any[]>([]);
  const [excludeInternal, setExcludeInternal] = useState<boolean>(
    localStorage.getItem('kovera_exclude_internal') !== 'false'
  );
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<any | null>(null);
  const [activeChain, setActiveChain] = useState<any | null>(null);
  const [filter, setFilter] = useState('All');
  const [role, setRole] = useState<'admin' | 'user' | null>(
    (localStorage.getItem('kovera_role') as 'admin' | 'user') || null
  );
  const [theme, setTheme] = useState<'light' | 'dark'>(
    (localStorage.getItem('kovera_theme') as 'light' | 'dark') || 'dark'
  );
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(
    localStorage.getItem('kovera_sidebar_open') !== 'false'
  );
  const [detailsOpen, setDetailsOpen] = useState<boolean>(
    localStorage.getItem('kovera_details_open') !== 'false'
  );

  const isAdmin = role === 'admin';

  const toggleTheme = useCallback(() => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('kovera_theme', newTheme);
  }, [theme]);

  const toggleSidebar = useCallback(() => {
    setSidebarOpen(prev => {
      const newVal = !prev;
      localStorage.setItem('kovera_sidebar_open', String(newVal));
      return newVal;
    });
  }, []);

  const toggleDetails = useCallback(() => {
    setDetailsOpen(prev => {
      const newVal = !prev;
      localStorage.setItem('kovera_details_open', String(newVal));
      return newVal;
    });
  }, []);

  const toggleExcludeInternal = useCallback(() => {
    setExcludeInternal(prev => {
      const newVal = !prev;
      localStorage.setItem('kovera_exclude_internal', String(newVal));
      return newVal;
    });
  }, []);

  // Handle theme sync with document
  useEffect(() => {
    if (theme === 'light') {
      document.documentElement.classList.add('light');
    } else {
      document.documentElement.classList.remove('light');
    }
  }, [theme]);

  /**
   * Fetch all network data in parallel:
   * 1. Graph (nodes + edges) — uses excludeInternal toggle
   * 2. Chains
   * 3. Stats
   * 4. Clusters
   * 5. Address Cycles
   */
  const fetchAllData = useCallback(async (excludeInternalVal: boolean, refresh = false) => {
    setLoading(true);
    try {
      const [graphRes, chainsRes, statsRes, clustersRes, cyclesRes] = await Promise.allSettled([
        analyticsApi.getNetworkGraph(excludeInternalVal, refresh),
        analyticsApi.getNetworkChains(2),
        analyticsApi.getNetworkStats(),
        analyticsApi.getNetworkClusters(3),
        analyticsApi.getAddressCycles()
      ]);

      if (graphRes.status === 'fulfilled') {
        const chainsData = chainsRes.status === 'fulfilled' ? chainsRes.value.data.chains || [] : [];
        setGraphData({
          nodes: graphRes.value.data.nodes || [],
          edges: graphRes.value.data.edges || [],
          chains: chainsData,
        });
      }

      if (statsRes.status === 'fulfilled') setNetworkStats(statsRes.value.data);
      if (clustersRes.status === 'fulfilled') setClusters(clustersRes.value.data.clusters || []);
      if (cyclesRes.status === 'fulfilled') setAddressCycles(cyclesRes.value.data.cycles || []);

      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch network data');
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshGraph = useCallback(async () => {
    await fetchAllData(excludeInternal, false);
  }, [fetchAllData, excludeInternal]);

  const regenerateGraph = async () => {
    if (!isAdmin) return;
    await fetchAllData(excludeInternal, true);
  };

  /**
   * POST /analytics/network/refresh — triggers geocode refresh on server,
   * then reloads all data with fresh coordinates.
   */
  const refreshGeocode = async () => {
    setRefreshing(true);
    try {
      await analyticsApi.refreshGeocode();
      // After geocode completes, fetch fresh data
      await fetchAllData(excludeInternal, true);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Geocode refresh failed');
    } finally {
      setRefreshing(false);
    }
  };

  // Re-fetch when excludeInternal toggles
  useEffect(() => {
    const token = localStorage.getItem('kovera_token');
    if (token && graphData) {
      fetchAllData(excludeInternal, false);
    }
  }, [excludeInternal]);

  const logout = () => {
    localStorage.removeItem('kovera_token');
    localStorage.removeItem('kovera_role');
    setRole(null);
    setGraphData(null);
    setNetworkStats(null);
    setClusters([]);
    setAddressCycles([]);
    window.location.href = '/login';
  };

  useEffect(() => {
    const token = localStorage.getItem('kovera_token');
    if (token) {
      fetchAllData(excludeInternal, false);
    }
  }, []);

  return (
    <NetworkContext.Provider
      value={{
        graphData,
        networkStats,
        clusters,
        addressCycles,
        excludeInternal,
        loading,
        refreshing,
        error,
        selectedNode,
        activeChain,
        filter,
        role,
        isAdmin,
        theme,
        sidebarOpen,
        detailsOpen,
        toggleTheme,
        toggleSidebar,
        toggleDetails,
        toggleExcludeInternal,
        setSelectedNode,
        setActiveChain,
        setFilter,
        refreshGraph,
        regenerateGraph,
        refreshGeocode,
        logout
      }}
    >
      {children}
    </NetworkContext.Provider>
  );
};

export const useNetworkContext = () => {
  const context = useContext(NetworkContext);
  if (context === undefined) {
    throw new Error('useNetworkContext must be used within a NetworkProvider');
  }
  return context;
};
