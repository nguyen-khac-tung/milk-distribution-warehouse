import React from "react"
import { Building2, CheckCircle, XCircle } from "lucide-react"

export default function StatsCards({
  totalCount = 0,
  activeCount = 0,
  inactiveCount = 0,
  totalLabel = "Tổng mặt hàng",
  activeLabel = "Đang hoạt động",
  inactiveLabel = "Không hoạt động",
  className = ""
}) {
  return (
    <div className={`grid grid-cols-1 md:grid-cols-3 gap-4 ${className}`}>
      {/* Total Count Card */}
      <div className="bg-white border border-slate-200 rounded-lg shadow-sm hover:shadow-md transition-shadow h-24 flex items-center justify-center">
        <div className="flex items-center w-full h-full">
          <div className="w-14 h-14 bg-orange-500 rounded-lg flex items-center justify-center mr-4 ml-6">
            <Building2 className="h-7 w-7 text-white" />
          </div>
          <div className="flex-1">
            <div className="text-lg font-medium text-slate-600 mb-1">{totalLabel}</div>
            <div className="text-2xl font-bold text-slate-900">{totalCount}</div>
          </div>
          <div className="w-16 h-8 relative group mr-6">
            <svg width="64" height="32" viewBox="0 0 64 32" className="w-full h-full">
              <defs>
                <linearGradient id="trendGradient1" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#f97316" stopOpacity="0.2" />
                  <stop offset="50%" stopColor="#f97316" stopOpacity="0.6" />
                  <stop offset="100%" stopColor="#f97316" stopOpacity="0.9" />
                </linearGradient>
              </defs>
              <path
                d="M2,24 Q8,18 16,22 T24,16 T32,20 T40,14 T48,18 T56,12 T62,16 L62,32 L2,32 Z"
                fill="url(#trendGradient1)"
                opacity="0.1"
              />
              <path
                d="M2,24 Q8,18 16,22 T24,16 T32,20 T40,14 T48,18 T56,12 T62,16"
                stroke="#f97316"
                strokeWidth="2"
                fill="none"
                strokeDasharray="100"
                strokeDashoffset="100"
                className="animate-draw"
              />
              <circle cx="2" cy="24" r="1.5" fill="#f97316" className="opacity-0 animate-fadeIn hover:r-2 transition-all cursor-pointer" style={{ animationDelay: '0.5s' }} />
              <circle cx="8" cy="18" r="1.5" fill="#f97316" className="opacity-0 animate-fadeIn hover:r-2 transition-all cursor-pointer" style={{ animationDelay: '0.8s' }} />
              <circle cx="16" cy="22" r="1.5" fill="#f97316" className="opacity-0 animate-fadeIn hover:r-2 transition-all cursor-pointer" style={{ animationDelay: '1.1s' }} />
              <circle cx="24" cy="16" r="1.5" fill="#f97316" className="opacity-0 animate-fadeIn hover:r-2 transition-all cursor-pointer" style={{ animationDelay: '1.4s' }} />
              <circle cx="32" cy="20" r="2" fill="#f97316" className="opacity-0 animate-fadeIn hover:r-3 transition-all cursor-pointer" style={{ animationDelay: '1.7s' }} />
              <circle cx="40" cy="14" r="1.5" fill="#f97316" className="opacity-0 animate-fadeIn hover:r-2 transition-all cursor-pointer" style={{ animationDelay: '2s' }} />
              <circle cx="48" cy="18" r="1.5" fill="#f97316" className="opacity-0 animate-fadeIn hover:r-2 transition-all cursor-pointer" style={{ animationDelay: '2.3s' }} />
              <circle cx="56" cy="12" r="1.5" fill="#f97316" className="opacity-0 animate-fadeIn hover:r-2 transition-all cursor-pointer" style={{ animationDelay: '2.6s' }} />
              <circle cx="62" cy="16" r="1.5" fill="#f97316" className="opacity-0 animate-fadeIn hover:r-2 transition-all cursor-pointer" style={{ animationDelay: '2.9s' }} />
            </svg>
            <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-slate-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
              {totalCount} {totalLabel.toLowerCase()}
            </div>
          </div>
        </div>
      </div>

      {/* Active Count Card */}
      <div className="bg-white border border-slate-200 rounded-lg shadow-sm hover:shadow-md transition-shadow h-24 flex items-center justify-center">
        <div className="flex items-center w-full h-full">
          <div className="w-14 h-14 bg-green-500 rounded-lg flex items-center justify-center mr-4 ml-6">
            <CheckCircle className="h-7 w-7 text-white" />
          </div>
          <div className="flex-1">
            <div className="text-lg font-medium text-slate-600 mb-1">{activeLabel}</div>
            <div className="text-2xl font-bold text-green-600">{activeCount}</div>
          </div>
          <div className="w-16 h-8 relative group mr-6">
            <svg width="64" height="32" viewBox="0 0 64 32" className="w-full h-full">
              <defs>
                <linearGradient id="trendGradient2" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#22c55e" stopOpacity="0.2" />
                  <stop offset="50%" stopColor="#22c55e" stopOpacity="0.6" />
                  <stop offset="100%" stopColor="#22c55e" stopOpacity="0.9" />
                </linearGradient>
              </defs>
              <path
                d="M2,20 Q8,26 16,22 T24,28 T32,24 T40,30 T48,26 T56,32 T62,28 L62,32 L2,32 Z"
                fill="url(#trendGradient2)"
                opacity="0.1"
              />
              <path
                d="M2,20 Q8,26 16,22 T24,28 T32,24 T40,30 T48,26 T56,32 T62,28"
                stroke="#22c55e"
                strokeWidth="2"
                fill="none"
                strokeDasharray="100"
                strokeDashoffset="100"
                className="animate-draw"
              />
              <circle cx="2" cy="20" r="1.5" fill="#22c55e" className="opacity-0 animate-fadeIn hover:r-2 transition-all cursor-pointer" style={{ animationDelay: '0.5s' }} />
              <circle cx="8" cy="26" r="1.5" fill="#22c55e" className="opacity-0 animate-fadeIn hover:r-2 transition-all cursor-pointer" style={{ animationDelay: '0.8s' }} />
              <circle cx="16" cy="22" r="1.5" fill="#22c55e" className="opacity-0 animate-fadeIn hover:r-2 transition-all cursor-pointer" style={{ animationDelay: '1.1s' }} />
              <circle cx="24" cy="28" r="1.5" fill="#22c55e" className="opacity-0 animate-fadeIn hover:r-2 transition-all cursor-pointer" style={{ animationDelay: '1.4s' }} />
              <circle cx="32" cy="24" r="2" fill="#22c55e" className="opacity-0 animate-fadeIn hover:r-3 transition-all cursor-pointer" style={{ animationDelay: '1.7s' }} />
              <circle cx="40" cy="30" r="1.5" fill="#22c55e" className="opacity-0 animate-fadeIn hover:r-2 transition-all cursor-pointer" style={{ animationDelay: '2s' }} />
              <circle cx="48" cy="26" r="1.5" fill="#22c55e" className="opacity-0 animate-fadeIn hover:r-2 transition-all cursor-pointer" style={{ animationDelay: '2.3s' }} />
              <circle cx="56" cy="32" r="1.5" fill="#22c55e" className="opacity-0 animate-fadeIn hover:r-2 transition-all cursor-pointer" style={{ animationDelay: '2.6s' }} />
              <circle cx="62" cy="28" r="1.5" fill="#22c55e" className="opacity-0 animate-fadeIn hover:r-2 transition-all cursor-pointer" style={{ animationDelay: '2.9s' }} />
            </svg>
            <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-slate-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
              {activeCount} {activeLabel.toLowerCase()}
            </div>
          </div>
        </div>
      </div>

      {/* Inactive Count Card */}
      <div className="bg-white border border-slate-200 rounded-lg shadow-sm hover:shadow-md transition-shadow h-24 flex items-center justify-center">
        <div className="flex items-center w-full h-full">
          <div className="w-14 h-14 bg-red-500 rounded-lg flex items-center justify-center mr-4 ml-6">
            <XCircle className="h-7 w-7 text-white" />
          </div>
          <div className="flex-1">
            <div className="text-lg font-medium text-slate-600 mb-1">{inactiveLabel}</div>
            <div className="text-2xl font-bold text-red-600">{inactiveCount}</div>
          </div>
          <div className="w-16 h-8 relative group mr-6">
            <svg width="64" height="32" viewBox="0 0 64 32" className="w-full h-full">
              <defs>
                <linearGradient id="trendGradient3" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#ef4444" stopOpacity="0.2" />
                  <stop offset="50%" stopColor="#ef4444" stopOpacity="0.6" />
                  <stop offset="100%" stopColor="#ef4444" stopOpacity="0.9" />
                </linearGradient>
              </defs>
              <path
                d="M2,28 Q8,24 16,26 T24,22 T32,24 T40,20 T48,22 T56,18 T62,20 L62,32 L2,32 Z"
                fill="url(#trendGradient3)"
                opacity="0.1"
              />
              <path
                d="M2,28 Q8,24 16,26 T24,22 T32,24 T40,20 T48,22 T56,18 T62,20"
                stroke="#ef4444"
                strokeWidth="2"
                fill="none"
                strokeDasharray="100"
                strokeDashoffset="100"
                className="animate-draw"
              />
              <circle cx="2" cy="28" r="1.5" fill="#ef4444" className="opacity-0 animate-fadeIn hover:r-2 transition-all cursor-pointer" style={{ animationDelay: '0.5s' }} />
              <circle cx="8" cy="24" r="1.5" fill="#ef4444" className="opacity-0 animate-fadeIn hover:r-2 transition-all cursor-pointer" style={{ animationDelay: '0.8s' }} />
              <circle cx="16" cy="26" r="1.5" fill="#ef4444" className="opacity-0 animate-fadeIn hover:r-2 transition-all cursor-pointer" style={{ animationDelay: '1.1s' }} />
              <circle cx="24" cy="22" r="1.5" fill="#ef4444" className="opacity-0 animate-fadeIn hover:r-2 transition-all cursor-pointer" style={{ animationDelay: '1.4s' }} />
              <circle cx="32" cy="24" r="2" fill="#ef4444" className="opacity-0 animate-fadeIn hover:r-3 transition-all cursor-pointer" style={{ animationDelay: '1.7s' }} />
              <circle cx="40" cy="20" r="1.5" fill="#ef4444" className="opacity-0 animate-fadeIn hover:r-2 transition-all cursor-pointer" style={{ animationDelay: '2s' }} />
              <circle cx="48" cy="22" r="1.5" fill="#ef4444" className="opacity-0 animate-fadeIn hover:r-2 transition-all cursor-pointer" style={{ animationDelay: '2.3s' }} />
              <circle cx="56" cy="18" r="1.5" fill="#ef4444" className="opacity-0 animate-fadeIn hover:r-2 transition-all cursor-pointer" style={{ animationDelay: '2.6s' }} />
              <circle cx="62" cy="20" r="1.5" fill="#ef4444" className="opacity-0 animate-fadeIn hover:r-2 transition-all cursor-pointer" style={{ animationDelay: '2.9s' }} />
            </svg>
            <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-slate-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
              {inactiveCount} {inactiveLabel.toLowerCase()}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}