import React from 'react';

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
    <div className="space-y-6 max-w-4xl">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-gray-300 gap-2">
        <div>
          <h1 className="text-lg font-bold text-gray-900">Project Team Details</h1>
          <p className="text-xs text-gray-500">
            Digital Assignment 3 — BACSE202 Database Systems • School of Computer Science & Engineering
          </p>
        </div>
        <div className="text-xs font-mono text-gray-600 bg-gray-100 border border-gray-300 px-2.5 py-1 rounded">
          3 Team Members
        </div>
      </div>

      {/* Team Members Table */}
      <div className="bg-white border border-gray-300 rounded overflow-hidden">
        <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-300">
          <h2 className="text-xs font-bold text-gray-800 uppercase tracking-wider">
            Team Members Roster
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-gray-100 border-b border-gray-300 text-gray-700 font-semibold">
                <th className="py-2.5 px-3 border-r border-gray-300 w-12 text-center">S.No</th>
                <th className="py-2.5 px-3 border-r border-gray-300 w-32">Registration No</th>
                <th className="py-2.5 px-3 border-r border-gray-300">Student Name</th>
                <th className="py-2.5 px-3 border-r border-gray-300">Department / Program</th>
                <th className="py-2.5 px-3">Project Responsibility</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {TEAM_MEMBERS.map((m) => (
                <tr key={m.regNo} className="hover:bg-gray-50">
                  <td className="py-2.5 px-3 text-center font-mono text-gray-500 border-r border-gray-200">
                    {m.sNo}
                  </td>
                  <td className="py-2.5 px-3 font-mono font-bold text-blue-700 border-r border-gray-200">
                    {m.regNo}
                  </td>
                  <td className="py-2.5 px-3 font-semibold text-gray-900 border-r border-gray-200">
                    {m.name}
                  </td>
                  <td className="py-2.5 px-3 text-gray-700 border-r border-gray-200">
                    {m.department}
                  </td>
                  <td className="py-2.5 px-3 text-gray-600">
                    {m.role}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Academic Project Details Box */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-3 bg-white border border-gray-300 rounded">
          <div className="text-[11px] font-bold text-gray-600 uppercase">Course Information</div>
          <div className="text-xs font-semibold text-gray-900 mt-1">BACSE202 — Database Systems</div>
          <div className="text-[11px] text-gray-500 mt-0.5">Digital Assignment 3 (DA-3) • 10 Marks</div>
        </div>

        <div className="p-3 bg-white border border-gray-300 rounded">
          <div className="text-[11px] font-bold text-gray-600 uppercase">Database Technology</div>
          <div className="text-xs font-semibold text-gray-900 mt-1">Neo4j Property Graph Database</div>
          <div className="text-[11px] text-gray-500 mt-0.5">Community Edition • Cypher Query Language</div>
        </div>

        <div className="p-3 bg-white border border-gray-300 rounded">
          <div className="text-[11px] font-bold text-gray-600 uppercase">Institution</div>
          <div className="text-xs font-semibold text-gray-900 mt-1">Vellore Institute of Technology</div>
          <div className="text-[11px] text-gray-500 mt-0.5">Chennai Campus, Tamil Nadu, India</div>
        </div>
      </div>
    </div>
  );
};
export default TeamPage;
