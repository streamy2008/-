/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { Compass, Wifi, Crosshair, HelpCircle, Info } from "lucide-react";
import { Patient, TelemetryEvent } from "../types";

interface AoaMapProps {
  patients: Patient[];
  selectedPatient: Patient | null;
  onSelectPatient: (patient: Patient) => void;
  telemetryLogs: TelemetryEvent[];
  setActiveTab?: (tab: string) => void;
}

// Region boundary definition with Clean Minimalism pastel colors for light background
const REGIONS = [
  { id: 1, name: "区域1: 登记建档处", x: 10, y: 12, w: 25, h: 22, color: "border-blue-200 bg-blue-50/50", desc: "HIS拉取、主ID生成" },
  { id: 2, name: "区域2: 麻醉评估室", x: 40, y: 12, w: 22, h: 22, color: "border-cyan-200 bg-cyan-50/50", desc: "ASA评估、禁食核对" },
  { id: 3, name: "区域3: 候诊大厅", x: 67, y: 12, w: 25, h: 22, color: "border-indigo-200 bg-indigo-50/50", desc: "等候排队状态" },
  { id: 4, name: "区域4: 穿刺准备区", x: 10, y: 40, w: 25, h: 22, color: "border-emerald-200 bg-emerald-50/50", desc: "静脉留置针操作" },
  { id: 5, name: "区域5: 操作外等候区", x: 40, y: 40, w: 22, h: 22, color: "border-amber-200 bg-amber-50/50", desc: "可穿戴绑定、55\"投屏" },
  { id: 6, name: "区域6: 手术操作间", x: 67, y: 40, w: 25, h: 22, color: "border-purple-200 bg-purple-50/50", desc: "内镜检查、24\"独占投屏" },
  { id: 7, name: "区域7: 一级复苏PACU", x: 10, y: 68, w: 25, h: 24, color: "border-rose-200 bg-rose-50/50", desc: "12号床、24\"独立监护" },
  { id: 8, name: "区域8: 二级复苏PACU", x: 38, y: 68, w: 23, h: 24, color: "border-pink-200 bg-pink-50/50", desc: "14号座、55\"多格监护" },
  { id: 9, name: "区域9: 自动记录归档", x: 64, y: 68, w: 16, h: 24, color: "border-teal-200 bg-teal-50/50", desc: "评分、解绑、自动记录生成" },
  { id: 10, name: "区域10: 检查结束", x: 83, y: 68, w: 14, h: 24, color: "border-emerald-200 bg-emerald-50/50", desc: "点击生成麻醉记录单" }
];

// AP Anchor positions (AOA Locator system)
const AP_ANCHORS = [
  { id: "AP-01", name: "基站 01 (区域1/2)", x: 30, y: 18 },
  { id: "AP-02", name: "基站 02 (区域3)", x: 80, y: 18 },
  { id: "AP-03", name: "基站 03 (区域4/5)", x: 35, y: 48 },
  { id: "AP-04", name: "基站 04 (区域6)", x: 80, y: 48 },
  { id: "AP-05", name: "基站 05 (一级PACU-床12/13)", x: 22, y: 78 },
  { id: "AP-06", name: "基站 06 (二级PACU-座14/15)", x: 49, y: 78 }
];

// Map patient stage to concrete x/y coordinates inside the region for visualization
export const getPatientCoordinates = (stage: number, patId: string) => {
  const offset = (patId.charCodeAt(patId.length - 1) % 5) - 2; 
  const offset2 = (patId.charCodeAt(patId.length - 2) % 5) - 2;

  switch (stage) {
    case 1: 
      return { x: 22 + offset, y: 23 + offset2 };
    case 2: 
      return { x: 51 + offset, y: 23 + offset2 };
    case 3: 
      return { x: 79 + offset, y: 23 + offset2 };
    case 4: 
      return { x: 22 + offset, y: 51 + offset2 };
    case 5: 
      return { x: 51 + offset, y: 51 + offset2 };
    case 6: 
      return { x: 79 + offset, y: 51 + offset2 };
    case 7: 
      return { x: 22 + offset * 0.6, y: 76 + offset2 * 0.8 }; 
    case 8: 
      return { x: 49 + offset * 0.6, y: 76 + offset2 * 0.8 };
    case 9: 
      return { x: 72, y: 80 };
    case 10:
      return { x: 90, y: 80 };
    default:
      return { x: 50, y: 50 };
  }
};

export default function AoaMap({ patients, selectedPatient, onSelectPatient, telemetryLogs, setActiveTab }: AoaMapProps) {
  const [hoveredRegion, setHoveredRegion] = useState<number | null>(null);
  const [showTooltip, setShowTooltip] = useState<string | null>(null);

  // Latest position events for visualization
  const lastAoaLogs = telemetryLogs
    .filter(log => log.type === "AOA_POSITION" || log.type === "FILTER_DAMP" || log.type === "CAST_TRIGGER")
    .slice(0, 5);

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 h-full flex flex-col justify-between select-none shadow-sm shadow-slate-100/50">
      {/* Header section with technical indicators */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-150 pb-3 mb-4">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-pulse" />
          <h2 className="text-sm font-semibold text-slate-800 tracking-tight font-sans flex items-center gap-1.5">
            蓝牙 AOA 高精度定位网关
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-blue-50 text-blue-600 border border-blue-200/60 font-medium">
              AOA Server
            </span>
          </h2>
        </div>
        
        {/* Metric Pill Badges */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-[11px] text-slate-600 bg-slate-50 px-2.5 py-1 rounded-md border border-slate-200">
            <Crosshair className="w-3.5 h-3.5 text-blue-600" />
            <span>静态精度:</span>
            <span className="text-emerald-600 font-mono font-bold">≤0.3m</span>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-slate-600 bg-slate-50 px-2.5 py-1 rounded-md border border-slate-200">
            <Wifi className="w-3.5 h-3.5 text-blue-600 animate-pulse" />
            <span>基站切换:</span>
            <span className="text-emerald-600 font-mono font-bold">&lt;200ms</span>
          </div>
        </div>
      </div>

      {/* Map visual stage container */}
      <div className="relative flex-1 min-h-[380px] bg-slate-50/70 rounded-lg border border-slate-200 overflow-hidden font-mono text-[10px]">
        {/* Architectural grid overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a04_1px,transparent_1px),linear-gradient(to_bottom,#0f172a04_1px,transparent_1px)] bg-[size:16px_16px]" />
        
        {/* Compass element */}
        <div className="absolute top-3 right-3 text-slate-400 flex items-center gap-1 pointer-events-none font-sans text-[11px] font-medium">
          <Compass className="w-3.5 h-3.5" />
          <span>智能内镜检查流程</span>
        </div>

        {/* Areas / Regions Map Blocks */}
        {REGIONS.map((region) => {
          const isSelectedStage = selectedPatient && selectedPatient.currentStage === region.id;
          const isHovered = hoveredRegion === region.id;
          
          return (
            <div
              key={region.id}
              className={`absolute border transition-all duration-300 rounded-md flex flex-col justify-between p-2 cursor-pointer ${region.color} ${
                isSelectedStage 
                  ? "border-blue-600 bg-blue-50/80 shadow-[0_2px_8px_rgba(37,99,235,0.08)] ring-1 ring-blue-500/20" 
                  : isHovered 
                  ? "border-slate-300 bg-slate-100/40" 
                  : "hover:border-slate-300"
              }`}
              style={{
                left: `${region.x}%`,
                top: `${region.y}%`,
                width: `${region.w}%`,
                height: `${region.h}%`
              }}
              onMouseEnter={() => setHoveredRegion(region.id)}
              onMouseLeave={() => setHoveredRegion(null)}
              onClick={() => {
                const pat = patients.find(p => p.currentStage === region.id);
                if (pat) {
                  onSelectPatient(pat);
                }
                if (region.id === 10 && setActiveTab) {
                  setActiveTab("record");
                }
              }}
            >
              {/* Region Label */}
              <div className="flex items-center justify-between">
                <span className={`font-semibold tracking-wide text-[11px] ${isSelectedStage ? "text-blue-700 font-bold" : "text-slate-600"}`}>
                  {region.name}
                </span>
                <span className="text-[9px] text-slate-400 font-bold">AP</span>
              </div>

              {/* Specific clinical layout elements mapped to areas */}
              {region.id === 7 && (
                <div className="flex justify-around gap-1 text-[8px] text-slate-400 border-t border-dashed border-slate-200 pt-1 pointer-events-none">
                  <div className="border border-slate-200 px-1 py-0.5 rounded bg-white text-center flex-1">
                    <div className="text-slate-700 font-bold">12床</div>
                    <div className="text-[7px] text-slate-400">静态≤0.3米</div>
                  </div>
                  <div className="border border-slate-200 px-1 py-0.5 rounded text-center flex-1">
                    <div>13床</div>
                    <div className="text-[7px]">亚米隔离</div>
                  </div>
                </div>
              )}

              {region.id === 8 && (
                <div className="flex justify-around gap-1 text-[8px] text-slate-400 border-t border-dashed border-slate-200 pt-1 pointer-events-none">
                  <div className="border border-slate-200 px-1 py-0.5 rounded text-center flex-1">
                    <div>13号座</div>
                  </div>
                  <div className="border border-slate-200 px-1 py-0.5 rounded bg-white text-center flex-1">
                    <div className="text-slate-700 font-bold">14号座</div>
                    <div className="text-[7px] text-slate-400">55寸格化</div>
                  </div>
                </div>
              )}

              {region.id === 5 && (
                <div className="text-[8.5px] text-amber-700 pointer-events-none text-center bg-amber-50 border border-amber-200/80 rounded py-0.5 px-1 font-sans">
                  📺 Area 5 (55寸大屏联动)
                </div>
              )}

              {region.id === 6 && (
                <div className="text-[8.5px] text-purple-700 pointer-events-none text-center bg-purple-50 border border-purple-200/80 rounded py-0.5 px-1 font-sans">
                  🖥️ OR Bedside(24“)
                </div>
              )}

              {region.id === 10 && (
                <div className="text-[8.5px] text-emerald-700 pointer-events-none text-center bg-emerald-50 border border-emerald-200/80 rounded py-0.5 px-1 font-sans font-bold flex items-center justify-center gap-0.5">
                  📄 点击生成记录单
                </div>
              )}

              {/* Brief details on hover */}
              {isHovered && (
                <div className="absolute inset-0 bg-white/95 backdrop-blur-sm p-2 rounded-md border border-slate-200 flex flex-col justify-center gap-1 z-20 shadow-lg">
                  <span className="text-slate-800 font-bold text-[10px]">{region.name}</span>
                  <span className="text-slate-600 text-[9px] font-sans">{region.desc}</span>
                  <div className="text-[8px] text-slate-400 flex items-center gap-1 mt-1 border-t border-slate-100 pt-1 font-sans">
                    <Info className="w-2.5 h-2.5 text-blue-500" />
                    <span>AOA定位实时捕获，触发系统流转</span>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {/* Ceiling AP Anchors Icons and visual range */}
        {AP_ANCHORS.map((ap) => (
          <div
            key={ap.id}
            className="absolute -translate-x-1/2 -translate-y-1/2 group z-10"
            style={{ left: `${ap.x}%`, top: `${ap.y}%` }}
            onMouseEnter={() => setShowTooltip(ap.id)}
            onMouseLeave={() => setShowTooltip(null)}
          >
            {/* Visual antenna signal radiation circle */}
            <div className="absolute -inset-4 rounded-full border border-dashed border-blue-500/15 animate-ping opacity-40 pointer-events-none" />
            <div className="absolute -inset-8 rounded-full border border-blue-500/5 pointer-events-none" />
            
            <div className="w-4 h-4 rounded-full bg-white border border-blue-400/70 flex items-center justify-center cursor-help hover:bg-slate-50 hover:border-blue-500 transition-colors shadow-sm">
              <Wifi className="w-2.5 h-2.5 text-blue-600" />
            </div>

            {/* AP Label */}
            <span className="absolute left-5 top-1/2 -translate-y-1/2 bg-white border border-slate-200 text-[8px] text-blue-600 font-bold px-1 rounded whitespace-nowrap opacity-80 pointer-events-none shadow-sm">
              {ap.id}
            </span>

            {/* AP Tooltip */}
            {showTooltip === ap.id && (
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-white border border-slate-200 text-[9px] text-slate-700 p-2 rounded shadow-xl whitespace-nowrap z-50">
                <div className="font-bold text-slate-800">{ap.name}</div>
                <div className="text-blue-600 font-semibold font-sans">BLE 5.1 AOA 阵列天线</div>
                <div className="text-[8px] text-slate-400 font-sans">动态刷新延迟 &lt; 50ms</div>
              </div>
            )}
          </div>
        ))}

        {/* Signal transmission paths & Patients positioning */}
        {patients.map((pat) => {
          const coords = getPatientCoordinates(pat.currentStage, pat.id);
          const isSelected = selectedPatient && selectedPatient.id === pat.id;
          
          let nearestAp = AP_ANCHORS[0];
          if (pat.currentStage === 3) nearestAp = AP_ANCHORS[1]; 
          else if (pat.currentStage === 4 || pat.currentStage === 5) nearestAp = AP_ANCHORS[2]; 
          else if (pat.currentStage === 6) nearestAp = AP_ANCHORS[3]; 
          else if (pat.currentStage === 7) nearestAp = AP_ANCHORS[4]; 
          else if (pat.currentStage === 8) nearestAp = AP_ANCHORS[5]; 

          return (
            <React.Fragment key={pat.id}>
              {/* Dynamic dashed path */}
              {pat.sensorConnected && pat.currentStage !== 9 && pat.currentStage !== 10 && (
                <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
                  <line
                    x1={`${coords.x}%`}
                    y1={`${coords.y}%`}
                    x2={`${nearestAp.x}%`}
                    y2={`${nearestAp.y}%`}
                    className={`stroke-2 stroke-dashed ${
                      isSelected ? "stroke-blue-500/40" : "stroke-slate-300/30"
                    }`}
                    style={{ strokeDasharray: "4, 4" }}
                  />
                </svg>
              )}

              {/* Patient visual tracker dot */}
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectPatient(pat);
                }}
                className={`absolute -translate-x-1/2 -translate-y-1/2 flex items-center gap-1.5 p-1 px-1.5 rounded-full border transition-all duration-300 cursor-pointer z-30 ${
                  isSelected
                    ? "bg-[#2563eb] text-white border-white font-bold scale-110 shadow-[0_2px_8px_rgba(37,99,235,0.4)]"
                    : (pat.currentStage === 9 || pat.currentStage === 10)
                    ? "bg-slate-200 text-slate-500 border-slate-300"
                    : "bg-white text-slate-800 border-slate-300 hover:border-blue-500 shadow-sm"
                }`}
                style={{
                  left: `${coords.x}%`,
                  top: `${coords.y}%`
                }}
                title={`${pat.name} - 阶段${pat.currentStage}`}
              >
                {pat.sensorConnected && pat.currentStage !== 9 && pat.currentStage !== 10 && (
                  <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? "bg-white" : "bg-emerald-500"} animate-pulse`} />
                )}
                
                <span className="text-[9px] max-w-[42px] truncate font-sans font-medium">{pat.name}</span>
                
                <span className={`text-[8px] px-1 py-0.2 rounded font-mono ${isSelected ? "bg-blue-700/80 text-white" : "bg-slate-100 text-slate-500"}`}>
                  {pat.currentStage}
                </span>
              </div>
            </React.Fragment>
          );
        })}
      </div>

      {/* Real-time AOA positioning log feed */}
      <div className="mt-4 bg-slate-50 rounded-lg p-2.5 border border-slate-200 text-[9px] text-slate-600 flex flex-col gap-1.5">
        <div className="flex justify-between items-center text-slate-500 border-b border-slate-200 pb-1.5">
          <span className="font-bold flex items-center gap-1 font-sans">
            <Compass className="w-3 h-3 text-blue-500" />
            AOA 空间轨迹日志 (实时解算)
          </span>
          <span className="font-mono text-[8px] text-emerald-700 bg-emerald-50 px-1 rounded border border-emerald-200">
            Time Hysteresis: ENABLED
          </span>
        </div>
        <div className="font-mono flex flex-col gap-1 h-20 overflow-y-auto custom-scrollbar">
          {lastAoaLogs.length === 0 ? (
            <div className="text-slate-400 italic text-center py-2 font-sans">暂无定位运动日志...</div>
          ) : (
            lastAoaLogs.map((log) => (
              <div key={log.id} className="flex justify-between hover:bg-slate-100 px-1 py-0.5 rounded">
                <div className="flex items-center gap-1.5 truncate">
                  <span className="text-slate-400">{log.timestamp.split("T")[1].substring(0, 8)}</span>
                  <span className={`w-1.5 h-1.5 rounded-full ${
                    log.type === "AOA_POSITION" ? "bg-blue-500" : log.type === "FILTER_DAMP" ? "bg-amber-500" : "bg-purple-500"
                  }`} />
                  <span className="text-slate-700 truncate font-sans">{log.message}</span>
                </div>
                {log.latencyMs && (
                  <span className={`font-bold ${log.latencyMs > 300 ? "text-amber-600" : "text-emerald-600"}`}>
                    {log.latencyMs}ms
                  </span>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
