import React, { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Users2,
  Building2,
  KeyRound,
  CreditCard,
  MessageSquareWarning,
  Wrench,
  UserCheck,
  ShieldCheck,
  PhoneCall,
  Network,
  Settings,
  ChevronLeft,
  ChevronRight,
  Building
} from 'lucide-react';
import { api } from '../../api/client';
import { SystemHealth } from '../../types';

interface SidebarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  collapsed,
  onToggleCollapse,
  mobileOpen,
  onCloseMobile,
}) => {
  const [health, setHealth] = useState<SystemHealth | null>(null);

  useEffect(() => {
    let isMounted = true;
    const checkDb = async () => {
      try {
        const h = await api.getHealth();
        if (isMounted) {
          setHealth(h);
        }
      } catch (err: any) {
        if (isMounted) {
          setHealth(null);
        }
      }
    };

    checkDb();
    const interval = setInterval(checkDb, 15000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const navSections = [
    {
      group: 'Overview',
      items: [
        { name: 'Dashboard', path: '/', icon: LayoutDashboard },
        { name: 'Team Members', path: '/team', icon: Users2 },
        { name: 'Students', path: '/students', icon: Users },
      ],
    },
    {
      group: 'Hostel & Rooms',
      items: [
        { name: 'Hostels & Rooms', path: '/hostels-rooms', icon: Building2 },
        { name: 'Room Allocations', path: '/allocations', icon: KeyRound },
      ],
    },
    {
      group: 'Operations',
      items: [
        { name: 'Payments', path: '/payments', icon: CreditCard },
        { name: 'Complaints', path: '/complaints', icon: MessageSquareWarning },
        { name: 'Maintenance', path: '/maintenance', icon: Wrench },
        { name: 'Visitors', path: '/visitors', icon: UserCheck },
        { name: 'Staff & Wardens', path: '/staff', icon: ShieldCheck },
        { name: 'Emergency Contacts', path: '/emergency-contacts', icon: PhoneCall },
      ],
    },
    {
      group: 'Graph Database',
      items: [
        { name: 'Relationship Explorer', path: '/graph-explorer', icon: Network },
        { name: 'Settings', path: '/settings', icon: Settings },
      ],
    },
  ];

  return (
    <>
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/30 lg:hidden"
          onClick={onCloseMobile}
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 flex flex-col bg-white text-gray-700 transition-all duration-200 border-r border-gray-200 select-none ${
          collapsed ? 'w-16' : 'w-60'
        } ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        {/* Simple Brand Header */}
        <div className="flex items-center justify-between h-14 px-3.5 border-b border-gray-200 bg-gray-50/50">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="flex items-center justify-center w-8 h-8 rounded border border-blue-200 bg-blue-50 text-blue-600 shrink-0">
              <Building className="w-4 h-4" />
            </div>
            {!collapsed && (
              <div className="flex flex-col truncate">
                <span className="font-bold text-gray-900 text-sm tracking-tight flex items-center gap-1">
                  Hostel<span className="text-blue-600 font-bold">OS</span>
                </span>
                <span className="text-[10px] text-gray-500 font-normal truncate">
                  Digital Assignment 3 • BACSE202
                </span>
              </div>
            )}
          </div>

          <button
            onClick={onToggleCollapse}
            className="hidden lg:flex items-center justify-center w-6 h-6 rounded text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
            title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            {collapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* Navigation list */}
        <div className="flex-1 overflow-y-auto px-2.5 py-3 space-y-4">
          {navSections.map((section, idx) => (
            <div key={idx} className="space-y-0.5">
              {!collapsed && (
                <div className="px-2 text-[10px] font-bold tracking-wider uppercase text-gray-400 mb-1">
                  {section.group}
                </div>
              )}
              {section.items.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={onCloseMobile}
                  className={({ isActive }) =>
                    `flex items-center gap-2.5 px-2.5 py-1.5 rounded text-xs font-medium transition-colors ${
                      isActive
                        ? 'bg-blue-50 text-blue-700 font-semibold border-l-2 border-blue-600'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    } ${collapsed ? 'justify-center px-0' : ''}`
                  }
                  title={collapsed ? item.name : undefined}
                >
                  <item.icon className={`w-4 h-4 shrink-0 ${collapsed ? 'mx-auto' : ''}`} />
                  {!collapsed && <span className="truncate">{item.name}</span>}
                </NavLink>
              ))}
            </div>
          ))}
        </div>

        {/* Simple Database Status Indicator */}
        <div className="p-2.5 border-t border-gray-200 bg-gray-50/50">
          <div
            className={`flex items-center gap-2 p-1.5 rounded border border-gray-200 bg-white ${
              collapsed ? 'justify-center' : ''
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full shrink-0 ${
                health ? 'bg-green-600' : 'bg-red-500'
              }`}
            />

            {!collapsed && (
              <div className="flex flex-col min-w-0 flex-1">
                <span className="text-[11px] font-medium text-gray-800 leading-tight">
                  {health ? 'Backend: Online' : 'Backend: Offline'}
                </span>
                <span className="text-[10px] text-gray-500 truncate leading-tight">
                  {health?.neo4j?.connected ? 'Neo4j Graph Active' : 'Connecting...'}
                </span>
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
};

