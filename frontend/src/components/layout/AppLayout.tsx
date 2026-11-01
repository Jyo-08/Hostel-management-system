import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, Link } from 'react-router-dom';
import { api } from '../../api/client';
import { SystemHealth } from '../../types';

export const AppLayout: React.FC = () => {
  const [health, setHealth] = useState<SystemHealth | null>(null);

  useEffect(() => {
    let isMounted = true;
    const checkDb = async () => {
      try {
        const h = await api.getHealth();
        if (isMounted) setHealth(h);
      } catch {
        if (isMounted) setHealth(null);
      }
    };
    checkDb();
    const interval = setInterval(checkDb, 15000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const navItems = [
    { name: 'Dashboard', path: '/' },
    { name: 'Students', path: '/students' },
    { name: 'Rooms', path: '/rooms' },
    { name: 'Allocations', path: '/allocations' },
    { name: 'Graph View', path: '/graph' },
    { name: 'Team', path: '/team' },
  ];

  return (
    <div className="min-h-screen bg-white text-gray-900 flex flex-col font-sans">
      {/* Top Academic Header */}
      <header className="border-b border-gray-300 bg-white">
        <div className="max-w-6xl mx-auto px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <Link to="/" className="text-lg font-bold text-gray-900 hover:text-blue-600">
              College Hostel Management System
            </Link>
            <p className="text-xs text-gray-500">
              Digital Assignment 3 — BACSE202 Database Systems • VIT Chennai
            </p>
          </div>

          <div className="flex items-center gap-3 self-start sm:self-center">
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs border ${
                health?.neo4j?.connected
                  ? 'bg-green-50 text-green-800 border-green-300'
                  : 'bg-red-50 text-red-800 border-red-300'
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  health?.neo4j?.connected ? 'bg-green-600' : 'bg-red-600'
                }`}
              />
              {health?.neo4j?.connected ? 'Neo4j Connected' : 'Database Offline'}
            </span>
            <span className="text-xs text-gray-500 border border-gray-200 bg-gray-50 px-2 py-1 rounded">
              Digital Assignment
            </span>
          </div>
        </div>

        {/* Clean Navigation Bar */}
        <nav className="border-t border-gray-200 bg-gray-50">
          <div className="max-w-6xl mx-auto px-4 flex items-center gap-1 overflow-x-auto">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/'}
                className={({ isActive }) =>
                  `px-3.5 py-2 text-xs font-medium border-b-2 transition-colors whitespace-nowrap ${
                    isActive
                      ? 'border-blue-600 text-blue-700 bg-white font-semibold'
                      : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`
                }
              >
                {item.name}
              </NavLink>
            ))}
          </div>
        </nav>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-6">
        <Outlet />
      </main>

      {/* Simple Academic Footer */}
      <footer className="border-t border-gray-200 bg-gray-50 py-3 text-center text-xs text-gray-500">
        College Hostel Management System • BACSE202 Database Systems (DA-3) • VIT Chennai
      </footer>
    </div>
  );
};
