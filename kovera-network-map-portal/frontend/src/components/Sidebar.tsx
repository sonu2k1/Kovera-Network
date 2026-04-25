/**
 * @file frontend/src/components/Sidebar.tsx
 * @description Sidebar with Kovera green design system.
 * Layers & Filters powered by all network API data.
 * Includes: Exclude Internal toggle (PUT internal-users)
 *           Refresh Geocode button (POST /refresh)
 */

import React from 'react';
import { useNetworkContext } from '../context/NetworkContext';
import ChainList from './ChainList';
import { motion } from 'motion/react';
import { Layers, Home, Building2, Heart, UserCheck, Link2, Target, MapPin, EyeOff, Eye, RotateCw } from 'lucide-react';

const Sidebar: React.FC = () => {
  const {
    filter, setFilter, graphData, networkStats, clusters, addressCycles,
    sidebarOpen, excludeInternal, toggleExcludeInternal, refreshGeocode, refreshing, isAdmin
  } = useNetworkContext();

  const filters = [
    { key: 'All',             label: 'All Nodes',        icon: Layers,    color: 'bg-kovera' },
    { key: 'User Homes',      label: 'User Homes',       icon: Home,      color: 'bg-blue-node' },
    { key: 'Seeded Listings',  label: 'Seeded Listings',  icon: Building2, color: 'bg-kovera' },
    { key: 'Dream Homes',     label: 'Dream Homes',      icon: Heart,     color: 'bg-pink-node' },
    { key: 'Pure Buyers',     label: 'Pure Buyers',      icon: UserCheck, color: 'bg-amber-node' },
    { key: 'Chains',          label: 'Active Chains',    icon: Link2,     color: 'bg-purple-node' },
    { key: 'Clusters',        label: 'Demand Clusters',  icon: Target,    color: 'bg-cyan-400' },
    { key: 'Address Cycles',  label: 'Address Cycles',   icon: MapPin,    color: 'bg-orange-400' },
  ];

  const getCount = (key: string): string | number => {
    if (!graphData?.nodes) return '—';
    switch (key) {
      case 'All':
        return networkStats?.nodes?.total ?? graphData.nodes.length;
      case 'User Homes':
        return networkStats?.nodes?.userHome ?? graphData.nodes.filter(n => n.type === 'user_home').length;
      case 'Seeded Listings':
        return networkStats?.nodes?.seededListing ?? graphData.nodes.filter(n => n.type === 'seeded_listing').length;
      case 'Dream Homes':
        return networkStats?.nodes?.dreamAddress ?? graphData.nodes.filter(n => n.type === 'dream_address').length;
      case 'Pure Buyers':
        return networkStats?.nodes?.pureBuyer ?? graphData.nodes.filter(n => n.type === 'pure_buyer').length;
      case 'Chains':
        return networkStats?.chains?.active ?? graphData.chains?.length ?? 0;
      case 'Clusters':
        return networkStats?.demandClusters ?? clusters.length;
      case 'Address Cycles':
        return networkStats?.addressCycles ?? addressCycles.length;
      default:
        return '—';
    }
  };

  return (
    <motion.div 
      initial={false}
      animate={{ 
        width: sidebarOpen ? 250 : 0,
        opacity: sidebarOpen ? 1 : 0,
        marginRight: sidebarOpen ? 0 : -20
      }}
      transition={{ type: 'spring', damping: 25, stiffness: 120 }}
      className="bg-bg2/60 backdrop-blur-sm border-r border-border2 flex flex-col h-full overflow-hidden shrink-0"
    >
      <div className="p-4 flex-1 space-y-5 overflow-y-auto w-[250px]">
        {/* Filters */}
        <section>
          <h3 className="text-[10px] uppercase text-text3 font-semibold mb-3 tracking-widest">
            Layers & Filters
          </h3>
          <div className="space-y-1">
            {filters.map(f => {
              const Icon = f.icon;
              const count = getCount(f.key);
              return (
                <button
                  key={f.key}
                  onClick={() => setFilter(f.key)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs transition-all ${
                    filter === f.key 
                      ? 'bg-kovera/10 border border-kovera/30 text-kovera font-medium' 
                      : 'text-text2 hover:bg-white/[0.03] border border-transparent'
                  }`}
                >
                  <span className="flex items-center gap-2.5">
                    <div className={`w-2 h-2 rounded-full ${f.color}`} />
                    <Icon className="w-3.5 h-3.5 opacity-60" />
                    {f.label}
                  </span>
                  <span className="font-mono text-[10px] text-text3 tabular-nums">
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        {/* Exclude Internal Toggle — uses PUT /internal-users via graph param */}
        <section>
          <h3 className="text-[10px] uppercase text-text3 font-semibold mb-3 tracking-widest">
            Visibility
          </h3>
          <button
            onClick={toggleExcludeInternal}
            className={`w-full flex items-center justify-between px-3 py-3 rounded-xl text-xs transition-all border ${
              excludeInternal
                ? 'bg-kovera/10 border-kovera/30 text-kovera'
                : 'bg-amber-node/10 border-amber-node/30 text-amber-node'
            }`}
          >
            <span className="flex items-center gap-2.5">
              {excludeInternal ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              <span className="font-medium">Internal Users</span>
            </span>
            <span className={`text-[9px] px-2 py-0.5 rounded-full font-semibold uppercase tracking-wider ${
              excludeInternal ? 'bg-kovera/20 text-kovera' : 'bg-amber-node/20 text-amber-node'
            }`}>
              {excludeInternal ? 'HIDDEN' : 'VISIBLE'}
            </span>
          </button>
          <p className="text-[9px] text-text3 mt-1.5 px-1 leading-relaxed">
            {excludeInternal 
              ? `Hiding ${networkStats?.filteredInternalUsers ?? 0} internal accounts from the graph` 
              : 'Showing all users including internal accounts'}
          </p>
        </section>

        {/* Edge Breakdown from /stats */}
        {networkStats && (
          <section>
            <h3 className="text-[10px] uppercase text-text3 font-semibold mb-3 tracking-widest">
              Edge Breakdown
            </h3>
            <div className="grid grid-cols-2 gap-1.5">
              {[
                { label: 'Like Listing', value: networkStats.edges?.likeListing, color: 'text-blue-node' },
                { label: 'Like Home', value: networkStats.edges?.likeUserHome, color: 'text-kovera' },
                { label: 'Dream', value: networkStats.edges?.dream, color: 'text-pink-node' },
                { label: 'Chain Ready', value: networkStats.edges?.chainReady, color: 'text-amber-node' },
              ].map(e => (
                <div key={e.label} className="kovera-card p-2.5 flex flex-col items-center">
                  <span className={`text-lg font-bold font-mono ${e.color}`}>{e.value ?? 0}</span>
                  <span className="text-[9px] text-text3 uppercase tracking-wider mt-0.5">{e.label}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Chain List */}
        <section className="flex flex-col overflow-hidden">
          <h3 className="text-[10px] uppercase text-text3 font-semibold mb-3 tracking-widest">
            Active Move Chains
          </h3>
          <ChainList />
        </section>

        {/* Refresh Geocode — POST /refresh */}
        {isAdmin && (
          <section>
            <h3 className="text-[10px] uppercase text-text3 font-semibold mb-3 tracking-widest">
              System Actions
            </h3>
            <button
              onClick={refreshGeocode}
              disabled={refreshing}
              className="w-full kovera-btn-outline text-[11px] py-2.5 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <RotateCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
              {refreshing ? 'Geocoding...' : 'Refresh Geocode'}
            </button>
            <p className="text-[9px] text-text3 mt-1.5 px-1 leading-relaxed">
              Re-geocodes all addresses and refreshes the network map coordinates.
            </p>
          </section>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-border2 text-[10px] text-text3 font-mono leading-relaxed space-y-0.5">
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-kovera animate-pulse" />
          <span>CONNECTED</span>
        </div>
        <div>INTERNAL USERS: <span className="text-kovera">{networkStats?.filteredInternalUsers ?? '—'}</span></div>
        <div>GEOCODING: <span className="text-kovera">OK</span></div>
      </div>
    </motion.div>
  );
};

export default Sidebar;
