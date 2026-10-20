import React from 'react';
import { Users2, Award, BookOpen, Database, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';

interface TeamMember {
  sNo: number;
  regNo: string;
  name: string;
  department: string;
  role: string;
}

const TEAM_MEMBERS: TeamMember[] = [
  {
    sNo: 1,
    regNo: '25BAI1012',
    name: 'JESSICA KATHERINE K',
    department: 'Computer Science & Engineering (AI & ML)',
    role: 'Database Modeling & Graph Schema Design'
  },
  {
    sNo: 2,
    regNo: '25BAI1150',
    name: 'G S JANANI',
    department: 'Computer Science & Engineering (AI & ML)',
    role: 'Data Integrity, Relations & Validation Testing'
  },
  {
    sNo: 3,
    regNo: '25BAI1176',
    name: 'JYOTISH N',
    department: 'Computer Science & Engineering (AI & ML)',
    role: 'Neo4j Backend Integration & Frontend Architecture'
  }
];

export const TeamPage: React.FC = () => {
  return (
    <div className="space-y-6 max-w-5xl">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-gray-200">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold tracking-tight text-gray-900">
              Project Team & Academic Attribution
            </h2>
            <Badge variant="info" size="sm">
              BACSE202 DA3
            </Badge>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Digital Assignment 3 — BACSE202 Database Systems • School of Computer Science & Engineering, VIT Chennai
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="success" size="sm">
            <CheckCircle2 className="w-3 h-3 mr-1 inline" />
            3 Active Team Members
          </Badge>
        </div>
      </div>

      {/* Team Table Card */}
      <Card className="overflow-hidden border border-gray-200 shadow-none">
        <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users2 className="w-4 h-4 text-blue-600" />
            <h3 className="text-sm font-semibold text-gray-900">
              Project Team Members
            </h3>
          </div>
          <span className="text-[11px] text-gray-500 font-mono">
            College Hostel Management System
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50 text-[11px] font-semibold text-gray-600 uppercase tracking-wider">
                <th className="py-2.5 px-4 w-12 text-center">#</th>
                <th className="py-2.5 px-4 w-36">Registration Number</th>
                <th className="py-2.5 px-4">Team Member</th>
                <th className="py-2.5 px-4 hidden md:table-cell">Department / Program</th>
                <th className="py-2.5 px-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-xs">
              {TEAM_MEMBERS.map((member) => (
                <tr key={member.regNo} className="hover:bg-gray-50/80 transition-colors">
                  <td className="py-3 px-4 text-center font-mono text-gray-400">
                    {member.sNo}
                  </td>
                  <td className="py-3 px-4">
                    <span className="font-mono font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                      {member.regNo}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="font-bold text-gray-900 block text-xs tracking-tight">
                      {member.name}
                    </span>
                    <span className="text-[11px] text-gray-500 md:hidden block mt-0.5">
                      {member.department}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-gray-600 hidden md:table-cell text-xs">
                    {member.department}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-green-50 text-green-700 border border-green-200">
                      Verified Contributor
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Project Meta Information Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4 border border-gray-200 shadow-none">
          <div className="flex items-center gap-2.5 mb-2">
            <BookOpen className="w-4 h-4 text-blue-600 shrink-0" />
            <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wide">
              Course Details
            </h4>
          </div>
          <p className="text-xs font-semibold text-gray-800">BACSE202 — Database Systems</p>
          <p className="text-[11px] text-gray-500 mt-0.5">Digital Assignment 3 (DA-3)</p>
          <p className="text-[11px] text-gray-500">School of Computer Science & Engineering</p>
        </Card>

        <Card className="p-4 border border-gray-200 shadow-none">
          <div className="flex items-center gap-2.5 mb-2">
            <Database className="w-4 h-4 text-blue-600 shrink-0" />
            <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wide">
              Database System
            </h4>
          </div>
          <p className="text-xs font-semibold text-gray-800">Neo4j Property Graph Database</p>
          <p className="text-[11px] text-gray-500 mt-0.5">Community Server 2026 / Bolt Protocol</p>
          <p className="text-[11px] text-gray-500">Modern NoSQL Evolution from Oracle DDL</p>
        </Card>

        <Card className="p-4 border border-gray-200 shadow-none">
          <div className="flex items-center gap-2.5 mb-2">
            <Award className="w-4 h-4 text-blue-600 shrink-0" />
            <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wide">
              Institution
            </h4>
          </div>
          <p className="text-xs font-semibold text-gray-800">Vellore Institute of Technology</p>
          <p className="text-[11px] text-gray-500 mt-0.5">Chennai Campus, Tamil Nadu, India</p>
          <p className="text-[11px] text-gray-500">Vandalur-Kelambakkam Road</p>
        </Card>
      </div>
    </div>
  );
};
