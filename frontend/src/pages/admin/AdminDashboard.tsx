import React, { useEffect, useState } from 'react';
import { adminApi } from '../../api';
import { PlatformAnalytics } from '../../types';
import { 
  Store, 
  Users, 
  ShieldCheck, 
  FileText, 
  Clock, 
  TrendingUp, 
  PieChart, 
  CheckCircle2, 
  AlertCircle, 
  XCircle 
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<PlatformAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  // Interactive chart state
  const [hoveredClaimIndex, setHoveredClaimIndex] = useState<number | null>(null);
  const [hoveredPointIndex, setHoveredPointIndex] = useState<number | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await adminApi.getDashboard();
        setStats(data);
      } catch (err) {
        console.error('Failed to load admin stats', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  const statCards = [
    {
      title: 'Total Retailers',
      value: stats?.totalRetailers || 0,
      sub: `${stats?.pendingRetailers || 0} pending review`,
      icon: Store,
      color: 'bg-blue-50 text-blue-700',
      to: '/admin/retailers',
    },
    {
      title: 'Registered Customers',
      value: stats?.totalCustomers || 0,
      sub: 'Verified global accounts',
      icon: Users,
      color: 'bg-emerald-50 text-emerald-700',
      to: '/admin/customers',
    },
    {
      title: 'Digital Warranties',
      value: stats?.totalWarranties || 0,
      sub: 'QR verifiable records',
      icon: ShieldCheck,
      color: 'bg-amber-50 text-amber-700',
      to: '#',
    },
    {
      title: 'Total Claims',
      value: stats?.totalClaims || 0,
      sub: `${stats?.claimsByStatus?.SUBMITTED || 0} awaiting review`,
      icon: FileText,
      color: 'bg-rose-50 text-rose-700',
      to: '/admin/claims',
    },
  ];

  // 1. CLAIMS DONUT CHART CALCULATION
  const claimsByStatus = stats?.claimsByStatus || {};
  const acceptedCount = (claimsByStatus['APPROVED'] || 0) + (claimsByStatus['IN_PROGRESS'] || 0) + (claimsByStatus['COMPLETED'] || 0);
  const pendingCount = (claimsByStatus['SUBMITTED'] || 0) + (claimsByStatus['UNDER_REVIEW'] || 0) + (claimsByStatus['ADDITIONAL_INFO_REQUIRED'] || 0);
  const rejectedCount = (claimsByStatus['REJECTED'] || 0) + (claimsByStatus['CANCELLED'] || 0);
  const totalClaims = acceptedCount + pendingCount + rejectedCount;

  const donutCategories = [
    {
      name: 'Accepted & Resolved',
      key: 'ACCEPTED',
      count: acceptedCount,
      color: '#10b981', // emerald-500
      bgColor: 'bg-emerald-500',
      lightBg: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      icon: CheckCircle2,
      sub: 'Approved, in progress & completed',
    },
    {
      name: 'Pending Review',
      key: 'PENDING',
      count: pendingCount,
      color: '#f59e0b', // amber-500
      bgColor: 'bg-amber-500',
      lightBg: 'bg-amber-50 text-amber-800 border-amber-200',
      icon: AlertCircle,
      sub: 'Submitted, under review & awaiting info',
    },
    {
      name: 'Rejected & Cancelled',
      key: 'REJECTED',
      count: rejectedCount,
      color: '#f43f5e', // rose-500
      bgColor: 'bg-rose-500',
      lightBg: 'bg-rose-50 text-rose-800 border-rose-200',
      icon: XCircle,
      sub: 'Declined or cancelled by customer',
    },
  ];

  // SVG Donut geometry
  const donutRadius = 56;
  const donutStrokeWidth = 20;
  const donutCircumference = 2 * Math.PI * donutRadius; // ~351.858

  let accumulatedPercent = 0;
  const donutSlices = donutCategories.map((cat, idx) => {
    const fraction = totalClaims > 0 ? cat.count / totalClaims : 0;
    const strokeDasharray = `${fraction * donutCircumference} ${donutCircumference}`;
    const strokeDashoffset = -(accumulatedPercent * donutCircumference);
    accumulatedPercent += fraction;

    return {
      ...cat,
      fraction,
      percentage: Math.round(fraction * 100),
      strokeDasharray,
      strokeDashoffset,
      index: idx,
    };
  });

  // 2. MONTH-WISE CUSTOMER REGISTRATIONS LINE CHART CALCULATION
  const monthlyData: { month: string; count: number }[] = [];
  if (stats?.monthlyCustomerRegistrations && Object.keys(stats.monthlyCustomerRegistrations).length > 0) {
    Object.entries(stats.monthlyCustomerRegistrations).forEach(([month, count]) => {
      monthlyData.push({ month: month.split(' ')[0], count: Number(count) });
    });
  } else {
    // Generate default 6 months if not returned
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const mName = monthNames[d.getMonth()];
      // If current month, put total customers, else 0 or previous
      const cnt = (i === 0) ? (stats?.totalCustomers || 0) : 0;
      monthlyData.push({ month: mName, count: cnt });
    }
  }

  // SVG Line Chart coordinates
  const chartWidth = 520;
  const chartHeight = 220;
  const padLeft = 45;
  const padRight = 25;
  const padTop = 30;
  const padBottom = 35;
  const plotWidth = chartWidth - padLeft - padRight;
  const plotHeight = chartHeight - padTop - padBottom;

  const maxVal = Math.max(...monthlyData.map((d) => d.count), 5);
  const yTicks = [0, Math.ceil(maxVal * 0.33), Math.ceil(maxVal * 0.66), maxVal];

  const points = monthlyData.map((d, i) => {
    const x = padLeft + (i / Math.max(1, monthlyData.length - 1)) * plotWidth;
    const y = padTop + (1 - d.count / maxVal) * plotHeight;
    return { x, y, month: d.month, count: d.count };
  });

  // SVG Bezier Smooth Curve Path generator
  const createSmoothPath = (pts: typeof points) => {
    if (pts.length === 0) return '';
    if (pts.length === 1) return `M ${pts[0].x} ${pts[0].y}`;
    let path = `M ${pts[0].x} ${pts[0].y}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i];
      const p1 = pts[i + 1];
      const cpX1 = p0.x + (p1.x - p0.x) / 2;
      const cpY1 = p0.y;
      const cpX2 = p0.x + (p1.x - p0.x) / 2;
      const cpY2 = p1.y;
      path += ` C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${p1.x} ${p1.y}`;
    }
    return path;
  };

  const linePath = createSmoothPath(points);
  const areaPath = points.length > 0
    ? `${linePath} L ${points[points.length - 1].x} ${chartHeight - padBottom} L ${points[0].x} ${chartHeight - padBottom} Z`
    : '';

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Platform Administrator Dashboard</h1>
        <p className="text-sm text-slate-500">Monitor multi-tenant activity, retailers, warranties, and claim workflows</p>
      </div>

      {/* Pending Retailers Alert Banner */}
      {(stats?.pendingRetailers || 0) > 0 && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500 text-white rounded-lg">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <div className="font-semibold text-amber-900">
                {stats?.pendingRetailers} Retailer Registration Application{stats?.pendingRetailers! > 1 ? 's' : ''} Pending
              </div>
              <div className="text-xs text-amber-700">
                New retail businesses are waiting for verification and approval.
              </div>
            </div>
          </div>
          <Link
            to="/admin/retailers?status=PENDING"
            className="px-4 py-2 bg-amber-600 text-white text-xs font-semibold rounded-lg hover:bg-amber-700 transition"
          >
            Review Applications
          </Link>
        </div>
      )}

      {/* Grid of 4 Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <Link
              key={card.title}
              to={card.to}
              className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs hover:border-slate-300 transition flex items-start justify-between"
            >
              <div>
                <span className="text-xs font-semibold text-slate-500 uppercase">{card.title}</span>
                <div className="text-3xl font-extrabold text-slate-900 mt-1">{card.value}</div>
                <div className="text-xs text-slate-500 mt-1">{card.sub}</div>
              </div>
              <div className={`p-3 rounded-xl ${card.color}`}>
                <Icon className="w-6 h-6" />
              </div>
            </Link>
          );
        })}
      </div>

      {/* Analytics Charts Section (Donut Chart & Line Chart) - 1:1 Equal Ratio */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
        {/* DONUT CHART: Claim Resolution Distribution */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-rose-50 text-rose-600 rounded-lg">
                  <PieChart className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Claim Status Distribution</h3>
                  <p className="text-[11px] text-slate-400">Accepted, pending & rejected claims</p>
                </div>
              </div>
              <Link to="/admin/claims" className="text-xs font-semibold text-indigo-600 hover:underline">
                View Claims &rarr;
              </Link>
            </div>

            {/* Donut Visual & Center Stats */}
            <div className="py-4 flex flex-col sm:flex-row items-center justify-center gap-6">
              <div className="relative w-40 h-40 shrink-0">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 140 140">
                  {/* Background Empty Ring */}
                  <circle
                    cx="70"
                    cy="70"
                    r={donutRadius}
                    fill="none"
                    stroke="#f1f5f9"
                    strokeWidth={donutStrokeWidth}
                  />

                  {/* Slices */}
                  {totalClaims > 0 ? (
                    donutSlices.map((slice, idx) => {
                      if (slice.count === 0) return null;
                      const isHovered = hoveredClaimIndex === idx;
                      return (
                        <circle
                          key={slice.name}
                          cx="70"
                          cy="70"
                          r={donutRadius}
                          fill="none"
                          stroke={slice.color}
                          strokeWidth={isHovered ? donutStrokeWidth + 4 : donutStrokeWidth}
                          strokeDasharray={slice.strokeDasharray}
                          strokeDashoffset={slice.strokeDashoffset}
                          className="transition-all duration-300 cursor-pointer"
                          onMouseEnter={() => setHoveredClaimIndex(idx)}
                          onMouseLeave={() => setHoveredClaimIndex(null)}
                        />
                      );
                    })
                  ) : (
                    <circle
                      cx="70"
                      cy="70"
                      r={donutRadius}
                      fill="none"
                      stroke="#e2e8f0"
                      strokeWidth={donutStrokeWidth}
                      strokeDasharray="4 4"
                    />
                  )}
                </svg>

                {/* Donut Center Display */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
                  {hoveredClaimIndex !== null && totalClaims > 0 ? (
                    <>
                      <span className="text-2xl font-black text-slate-900 leading-none">
                        {donutSlices[hoveredClaimIndex].count}
                      </span>
                      <span className="text-[10px] font-bold uppercase text-slate-500 mt-0.5">
                        {donutSlices[hoveredClaimIndex].percentage}%
                      </span>
                    </>
                  ) : (
                    <>
                      <span className="text-2xl font-black text-slate-900 leading-none">{totalClaims}</span>
                      <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mt-0.5">
                        Total Claims
                      </span>
                    </>
                  )}
                </div>
              </div>

              {/* Legend List */}
              <div className="space-y-2 w-full max-w-xs text-xs">
                {donutSlices.map((item, idx) => {
                  const isHovered = hoveredClaimIndex === idx;
                  return (
                    <div
                      key={item.name}
                      onMouseEnter={() => setHoveredClaimIndex(idx)}
                      onMouseLeave={() => setHoveredClaimIndex(null)}
                      className={`p-2 rounded-xl transition cursor-pointer border ${
                        isHovered ? 'bg-slate-50 border-slate-300 shadow-xs' : 'border-transparent hover:bg-slate-50/50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className={`w-2.5 h-2.5 rounded-full ${item.bgColor}`}></span>
                          <span className="font-semibold text-slate-800">{item.name}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-slate-900">{item.count}</span>
                          <span className="text-[10px] text-slate-400 font-medium">({item.percentage}%)</span>
                        </div>
                      </div>
                      <div className="text-[10px] text-slate-400 pl-4">{item.sub}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
            <span>Aggregated across all verified retailers</span>
            <span>Live status telemetry</span>
          </div>
        </div>

        {/* LINE CHART: Month-wise Customer Registrations */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Month-Wise Customer Registrations</h3>
                  <p className="text-[11px] text-slate-400">Monthly new customer signup trend</p>
                </div>
              </div>
              <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 font-bold text-xs rounded-full border border-emerald-200">
                +{stats?.totalCustomers || 0} Registered Users
              </span>
            </div>

            {/* SVG Interactive Line Chart */}
            <div className="relative pt-3">
              <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-auto overflow-visible">
                <defs>
                  {/* Area Gradient */}
                  <linearGradient id="customerGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6366f1" stopOpacity="0.28" />
                    <stop offset="100%" stopColor="#6366f1" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Y-Axis Gridlines & Labels */}
                {yTicks.map((val, idx) => {
                  const yPos = padTop + (1 - val / maxVal) * plotHeight;
                  return (
                    <g key={idx}>
                      <line
                        x1={padLeft}
                        y1={yPos}
                        x2={chartWidth - padRight}
                        y2={yPos}
                        stroke="#f1f5f9"
                        strokeDasharray={val === 0 ? '0' : '4 4'}
                        strokeWidth="1"
                      />
                      <text
                        x={padLeft - 8}
                        y={yPos + 3}
                        textAnchor="end"
                        fontSize="10"
                        fill="#94a3b8"
                        fontFamily="sans-serif"
                      >
                        {val}
                      </text>
                    </g>
                  );
                })}

                {/* Gradient Area under curve */}
                {areaPath && (
                  <path d={areaPath} fill="url(#customerGrad)" />
                )}

                {/* The Main Line */}
                {linePath && (
                  <path
                    d={linePath}
                    fill="none"
                    stroke="#4f46e5"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                )}

                {/* Data Points and Interactivity */}
                {points.map((pt, idx) => {
                  const isHovered = hoveredPointIndex === idx;
                  return (
                    <g key={idx}>
                      {/* Pulse circle on hover */}
                      {isHovered && (
                        <circle
                          cx={pt.x}
                          cy={pt.y}
                          r="10"
                          fill="#4f46e5"
                          fillOpacity="0.2"
                          className="animate-ping"
                        />
                      )}
                      {/* Data Point Dot */}
                      <circle
                        cx={pt.x}
                        cy={pt.y}
                        r={isHovered ? '6' : '4.5'}
                        fill="#ffffff"
                        stroke="#4f46e5"
                        strokeWidth={isHovered ? '3.5' : '2.5'}
                        className="cursor-pointer transition-all duration-150"
                        onMouseEnter={() => setHoveredPointIndex(idx)}
                        onMouseLeave={() => setHoveredPointIndex(null)}
                      />

                      {/* Tooltip on hover */}
                      {isHovered && (
                        <g pointerEvents="none" className="transition-all duration-150">
                          <rect
                            x={pt.x - 36}
                            y={pt.y - 32}
                            width="72"
                            height="24"
                            rx="6"
                            fill="#1e293b"
                          />
                          <polygon
                            points={`${pt.x - 4},${pt.y - 8} ${pt.x + 4},${pt.y - 8} ${pt.x},${pt.y - 3}`}
                            fill="#1e293b"
                          />
                          <text
                            x={pt.x}
                            y={pt.y - 16}
                            textAnchor="middle"
                            fontSize="10"
                            fontWeight="bold"
                            fill="#ffffff"
                            fontFamily="sans-serif"
                          >
                            {pt.count} Users
                          </text>
                        </g>
                      )}

                      {/* X-Axis Month Label */}
                      <text
                        x={pt.x}
                        y={chartHeight - 12}
                        textAnchor="middle"
                        fontSize="10"
                        fontWeight={isHovered ? 'bold' : 'normal'}
                        fill={isHovered ? '#1e293b' : '#64748b'}
                        fontFamily="sans-serif"
                      >
                        {pt.month}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
            <span>Hover points to view monthly registered users</span>
            <span className="font-semibold text-indigo-600">Growth Tracking</span>
          </div>
        </div>
      </div>

      {/* Claims Breakdown Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-4">
        <h3 className="text-base font-bold text-slate-900">Platform Claims by Status</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {stats?.claimsByStatus &&
            Object.entries(stats.claimsByStatus).map(([status, count]) => (
              <div key={status} className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                <div className="text-xs font-medium text-slate-500">{status.replace(/_/g, ' ')}</div>
                <div className="text-xl font-bold text-slate-800 mt-1">{count}</div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
};
