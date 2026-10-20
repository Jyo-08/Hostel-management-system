import React, { useState } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import {
  Menu,
  Search,
  ChevronRight,
  GraduationCap
} from 'lucide-react';

interface TopNavProps {
  onOpenMobile: () => void;
}

export const TopNav: React.FC<TopNavProps> = ({ onOpenMobile }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  // Route labels
  const getRouteInfo = (pathname: string) => {
    switch (pathname) {
      case '/':
        return { title: 'Dashboard Overview', category: 'HostelOS' };
      case '/students':
        return { title: 'Student Management', category: 'Directory' };
      case '/hostels-rooms':
        return { title: 'Hostels & Room Inventory', category: 'Property' };
      case '/allocations':
        return { title: 'Room Allocations', category: 'Allocations' };
      case '/payments':
        return { title: 'Fee Transactions & Ledger', category: 'Finance' };
      case '/complaints':
        return { title: 'Complaints Desk', category: 'Student Welfare' };
      case '/maintenance':
        return { title: 'Maintenance Requests', category: 'Operations' };
      case '/visitors':
        return { title: 'Visitor Logbook', category: 'Security' };
      case '/staff':
        return { title: 'Staff & Wardens', category: 'Personnel' };
      case '/emergency-contacts':
        return { title: 'Emergency Contacts', category: 'Safety' };
      case '/graph-explorer':
        return { title: 'Neo4j Graph Relationship Explorer', category: 'Graph DB' };
      case '/settings':
        return { title: 'System & Database Configuration', category: 'Settings' };
      default:
        return { title: 'HostelOS Portal', category: 'System' };
    }
  };

  const routeInfo = getRouteInfo(location.pathname);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/students?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-14 px-4 sm:px-6 bg-white border-b border-gray-200">
      {/* Left side: Menu button + Title & Breadcrumb */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobile}
          className="lg:hidden p-1.5 rounded text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors"
          aria-label="Open navigation"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex flex-col">
          <nav className="flex items-center gap-1 text-[11px] text-gray-500">
            <Link to="/" className="hover:text-blue-600 transition-colors">
              HostelOS
            </Link>
            <ChevronRight className="w-3 h-3 text-gray-400" />
            <span className="text-gray-500">{routeInfo.category}</span>
          </nav>
          <h1 className="text-sm sm:text-base font-bold text-gray-900 tracking-tight leading-tight">
            {routeInfo.title}
          </h1>
        </div>
      </div>

      {/* Right side: Search + Student Credentials */}
      <div className="flex items-center gap-3">
        <form onSubmit={handleSearchSubmit} className="relative hidden md:block">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search students, rooms, records..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-48 lg:w-64 pl-8 pr-3 py-1 text-xs rounded border border-gray-300 text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white"
          />
        </form>

        {/* Academic Attribution Badge */}
        <div className="flex items-center gap-2 pl-2 border-l border-gray-200">
          <div className="w-7 h-7 rounded border border-blue-200 bg-blue-50 text-blue-700 font-bold text-xs flex items-center justify-center">
            DA
          </div>
          <div className="hidden sm:flex flex-col text-left">
            <span className="text-xs font-semibold text-gray-900 leading-tight">
              Digital Assignment
            </span>
            <span className="text-[10px] text-gray-500 font-mono leading-tight">
              BACSE202 Database Systems • DA3
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};

