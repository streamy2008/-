/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef } from "react";
import { Tv, Activity, Percent, Gauge, Heart, ShieldAlert, Wifi } from "lucide-react";
import { Patient } from "../types";

interface Monitor55InchProps {
  patients: Patient[]; // All active tracked patients
  activeArea: 5 | 8; // Shown in Area 5 or Area 8
}

// Simulated background patients to demonstrate the 6-8 patient grid capability
const STATIC_BEDS_DATA = [
  { id: "ID-102948", name: "王永成", age: 53, hr: 72, spo2: 99, resp: 18, sbp: 118, dbp: 76, bedNo: "A-01", status: "稳定" },
  { id: "ID-839401", name: "刘淑琴", age: 67, hr: 85, spo2: 96, resp: 20, sbp: 135, dbp: 82, bedNo: "A-02", status: "苏醒中" },
  { id: "ID-294019", name: "陈志强", age: 41, hr: 64, spo2: 100, resp: 14, sbp: 110, dbp: 70, bedNo: "A-03", status: "稳定" },
  { id: "ID-593021", name: "孙少平", age: 31, hr: 91, spo2: 97, resp: 17, sbp: 125, dbp: 78, bedNo: "A-04", status: "监护中" },
  { id: "ID-402948", name: "林玉英", age: 59, hr: 68, spo2: 98, resp: 16, sbp: 115, dbp: 72, bedNo: "A-05", status: "稳定" }
];

// Single Grid Box Component with Real-Time Waveform
const BedMonitorBox = ({ 
  patientName, 
  patientId, 
  age, 
  hr, 
  spo2, 
  resp, 
  sbp, 
  dbp, 
  bedNo, 
  isActivePatient,
  stage
}: { 
  patientName: string; 
  patientId: string; 
  age: number; 
  hr: number; 
  spo2: number; 
  resp: number; 
  sbp: number; 
  dbp: number; 
  bedNo: string;
  isActivePatient?: boolean;
  stage?: number;
  key?: string;
}) => {
  const ecgCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const spo2CanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Animate ECG and SpO2 curves on separate canvas elements
  useEffect(() => {
    const ecgCanvas = ecgCanvasRef.current;
    const spo2Canvas = spo2CanvasRef.current;
    if (!ecgCanvas || !spo2Canvas) return;

    const ecgCtx = ecgCanvas.getContext("2d");
    const spo2Ctx = spo2Canvas.getContext("2d");
    if (!ecgCtx || !spo2Ctx) return;

    let animationFrameId: number;
    let x = 0;
    const width = ecgCanvas.width;
    const height = ecgCanvas.height;

    // Buffers for seamless sweep drawing
    const ecgYBuffer = new Array(width).fill(height / 2);
    const spo2YBuffer = new Array(width).fill(height / 2);

    // Dynamic wave settings based on heart rate
    let beatTimer = 0;
    const beatInterval = 60 / hr * 60; // Approximate frames per beat at 60fps

    const draw = () => {
      beatTimer++;
      
      // ECG simulation: flat line with occasional PQRST peaks
      let ecgY = height / 2;
      const t = beatTimer % Math.floor(beatInterval);
      
      if (t > 10 && t < 14) {
        // P-wave
        ecgY -= 4;
      } else if (t >= 14 && t <= 16) {
        // flat
      } else if (t === 18) {
        // Q-dip
        ecgY += 6;
      } else if (t >= 19 && t <= 21) {
        // R-peak (tall)
        ecgY -= 28;
      } else if (t >= 22 && t <= 24) {
        // S-dip (deep)
        ecgY += 12;
      } else if (t >= 25 && t <= 28) {
        // flat
      } else if (t > 29 && t < 37) {
        // T-wave
        ecgY -= 8;
      }

      // Add minor high-frequency electrical noise
      ecgY += (Math.random() - 0.5) * 1.5;

      // SpO2 Pleth wave simulation
      const angle = (beatTimer / beatInterval) * Math.PI * 2;
      // Dicrotic notch representation
      let spo2Y = height / 2 + Math.sin(angle) * 10;
      if (angle % (Math.PI * 2) > Math.PI * 0.8 && angle % (Math.PI * 2) < Math.PI * 1.2) {
        spo2Y += 3; // notch dip
      }
      spo2Y += (Math.random() - 0.5) * 0.8;

      // Update sweep positions
      ecgYBuffer[x] = ecgY;
      spo2YBuffer[x] = spo2Y;

      // Render ECG Canvas
      ecgCtx.fillStyle = "#fafafa";
      ecgCtx.fillRect(0, 0, width, height);

      // Draw faint grid grid
      ecgCtx.strokeStyle = "rgba(16, 185, 129, 0.06)";
      ecgCtx.lineWidth = 1;
      for (let j = 0; j < width; j += 15) {
        ecgCtx.beginPath();
        ecgCtx.moveTo(j, 0);
        ecgCtx.lineTo(j, height);
        ecgCtx.stroke();
      }
      for (let j = 0; j < height; j += 15) {
        ecgCtx.beginPath();
        ecgCtx.moveTo(0, j);
        ecgCtx.lineTo(width, j);
        ecgCtx.stroke();
      }

      // Drawing sweep trace
      ecgCtx.strokeStyle = isActivePatient ? "#10b981" : "#059669";
      ecgCtx.lineWidth = 1.8;
      ecgCtx.beginPath();
      for (let i = 0; i < width; i++) {
        // Draw gap ahead of scan-bar
        if (Math.abs(i - x) < 8) continue;
        if (i === 0) ecgCtx.moveTo(i, ecgYBuffer[i]);
        else ecgCtx.lineTo(i, ecgYBuffer[i]);
      }
      ecgCtx.stroke();

      // Render SpO2 Canvas
      spo2Ctx.fillStyle = "#fafafa";
      spo2Ctx.fillRect(0, 0, width, height);

      // Draw faint SpO2 grid
      spo2Ctx.strokeStyle = "rgba(6, 182, 212, 0.06)";
      spo2Ctx.lineWidth = 1;
      for (let j = 0; j < width; j += 15) {
        spo2Ctx.beginPath();
        spo2Ctx.moveTo(j, 0);
        spo2Ctx.lineTo(j, height);
        spo2Ctx.stroke();
      }

      spo2Ctx.strokeStyle = isActivePatient ? "#06b6d4" : "#0891b2";
      spo2Ctx.lineWidth = 1.8;
      spo2Ctx.beginPath();
      for (let i = 0; i < width; i++) {
        if (Math.abs(i - x) < 8) continue;
        if (i === 0) spo2Ctx.moveTo(i, spo2YBuffer[i]);
        else spo2Ctx.lineTo(i, spo2YBuffer[i]);
      }
      spo2Ctx.stroke();

      // Increment scan bar
      x = (x + 1.5) % width;

      animationFrameId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [hr, isActivePatient]);

  return (
    <div className={`bg-white border rounded-lg p-2.5 flex flex-col justify-between overflow-hidden relative shadow-sm ${
      isActivePatient 
        ? "border-emerald-500 ring-1 ring-emerald-500/20 bg-emerald-50/10" 
        : "border-slate-200"
    }`}>
      {/* Top Details bar inside slot */}
      <div className="flex justify-between items-center mb-1.5 border-b border-slate-100 pb-1">
        <div className="flex items-center gap-1.5">
          <span className={`text-[10px] px-1.5 py-0.2 rounded font-sans font-bold ${
            isActivePatient ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-600"
          }`}>
            {bedNo}
          </span>
          <span className="font-bold text-slate-800 text-[11px] truncate max-w-[55px]">
            {patientName}
          </span>
          <span className="text-[9px] text-slate-400">{age}岁</span>
        </div>
        
        {isActivePatient && (
          <span className="text-[8px] px-1 py-0.2 rounded bg-amber-50 text-amber-700 border border-amber-200 font-sans animate-pulse">
            区域{stage} AOA投屏中
          </span>
        )}
      </div>

      {/* Main clinical metrics grid + waves layout */}
      <div className="grid grid-cols-12 gap-2 flex-1 items-stretch">
        {/* Waveforms (Left 7 cols) */}
        <div className="col-span-7 flex flex-col gap-1 justify-center">
          {/* ECG Trace container */}
          <div className="flex flex-col relative bg-slate-50 rounded overflow-hidden flex-1 border border-slate-100">
            <span className="absolute top-0.5 left-1 text-[7px] text-emerald-600 font-bold z-10 flex items-center gap-0.5">
              <Heart className="w-2 h-2 text-emerald-500 animate-pulse" />
              ECG II
            </span>
            <canvas ref={ecgCanvasRef} width={130} height={40} className="w-full h-full block" />
          </div>
          
          {/* SpO2 Trace container */}
          <div className="flex flex-col relative bg-slate-50 rounded overflow-hidden flex-1 border border-slate-100">
            <span className="absolute top-0.5 left-1 text-[7px] text-cyan-600 font-bold z-10">
              SPO2 PLETH
            </span>
            <canvas ref={spo2CanvasRef} width={130} height={40} className="w-full h-full block" />
          </div>
        </div>

        {/* Vitals Digital readout (Right 5 cols) */}
        <div className="col-span-5 grid grid-rows-3 gap-1 text-[10px] font-mono leading-none">
          {/* HR readout */}
          <div className="bg-slate-50/50 border border-slate-150 rounded p-1 flex justify-between items-center">
            <div className="flex flex-col">
              <span className="text-[7px] text-emerald-600 font-sans font-bold">心率 HR</span>
              <span className="text-[7px] text-slate-400">bpm</span>
            </div>
            <span className="text-sm font-bold text-emerald-600">{hr}</span>
          </div>

          {/* SpO2 readout */}
          <div className="bg-slate-50/50 border border-slate-150 rounded p-1 flex justify-between items-center">
            <div className="flex flex-col">
              <span className="text-[7px] text-cyan-600 font-sans font-bold">血氧 SpO2</span>
              <span className="text-[7px] text-slate-400">%</span>
            </div>
            <span className="text-sm font-bold text-cyan-600">{spo2}</span>
          </div>

          {/* BP readout */}
          <div className="bg-slate-50/50 border border-slate-150 rounded p-1 flex flex-col justify-center">
            <span className="text-[7px] text-amber-600 font-sans font-bold mb-0.5">血压 NIBP</span>
            <div className="flex justify-between items-baseline">
              <span className="text-[7px] text-slate-400">mmHg</span>
              <span className="text-[11px] font-bold text-amber-600 leading-none">
                {sbp}/{dbp}
              </span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Footer Tracker ID and signal strength */}
      <div className="flex justify-between items-center text-[8px] text-slate-400 mt-1 pt-1 border-t border-slate-100 font-mono">
        <span>追踪号: {patientId}</span>
        <span className="text-emerald-500/60 flex items-center gap-0.5 font-bold">
          <Wifi className="w-2.5 h-2.5" />
          -48dBm
        </span>
      </div>
    </div>
  );
};

export default function Monitor55Inch({ patients, activeArea }: Monitor55InchProps) {
  // Filters active patients that belong to the specified area
  const areaPatients = patients.filter(p => p.currentStage === activeArea && p.sensorConnected);

  // Pad remaining grid spaces up to 8 slots to show system capabilities
  const gridSlotsCount = 8;
  const activeSlots = areaPatients.map((p, idx) => ({
    patientName: p.name,
    patientId: p.id,
    age: p.age,
    hr: p.currentVitals.hr,
    spo2: p.currentVitals.spo2,
    resp: p.currentVitals.resp,
    sbp: p.currentVitals.sbp,
    dbp: p.currentVitals.dbp,
    bedNo: activeArea === 5 ? `等候-${idx + 1}` : `14号座`, // Stage 8 is 14号座 in specification
    isActivePatient: true,
    stage: activeArea
  }));

  // Map other static beds in the center to fill slots and show multi-patient grid layout
  const staticSlots = STATIC_BEDS_DATA.slice(0, gridSlotsCount - activeSlots.length).map((b, idx) => ({
    patientName: b.name,
    patientId: b.id,
    age: b.age,
    hr: b.hr,
    spo2: b.spo2,
    resp: b.resp,
    sbp: b.sbp,
    dbp: b.dbp,
    bedNo: activeArea === 5 ? `等候-${activeSlots.length + idx + 1}` : `床位-${b.bedNo}`,
    isActivePatient: false,
    stage: undefined
  }));

  const allSlots = [...activeSlots, ...staticSlots];

  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden h-full flex flex-col font-sans select-none shadow-sm">
      
      {/* 55-inch Monitor bezel bar */}
      <div className="bg-slate-50 p-3.5 border-b border-slate-200 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <Tv className="w-5 h-5 text-blue-600 animate-pulse" />
          <div>
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider font-sans">
              智能大屏: {activeArea === 5 ? "【区域5】操作间外等候区" : "【区域8】二级PACU复苏区"} 55寸物理大屏幕
            </h3>
            <span className="text-[9px] text-slate-400 font-sans">
              位置接力投屏终端 (AOA Screen Casting Broker Client)
            </span>
          </div>
        </div>

        {/* Dynamic casting indicator alerts */}
        <div className="flex items-center gap-3">
          {areaPatients.length > 0 ? (
            <div className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded text-[10px] text-emerald-700 font-sans font-semibold">
              <Activity className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
              <span>发现 {areaPatients.length} 名患者 AOA 智能投屏投射中</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 bg-slate-100 border border-slate-200 px-2.5 py-0.5 rounded text-[10px] text-slate-500 font-sans">
              <span>等待 AOA 定位事件触发</span>
            </div>
          )}
          <span className="text-[10px] font-sans text-blue-600 font-bold bg-blue-50 px-2 py-0.5 rounded border border-blue-200/50">
            55" Multi-Bed Grid
          </span>
        </div>
      </div>

      {/* Screen area with 8 bento-grid monitors */}
      <div className="bg-slate-50/50 flex-1 p-3 grid grid-cols-2 md:grid-cols-4 gap-3">
        {allSlots.map((slot, index) => (
          <BedMonitorBox
            key={slot.patientId + index}
            patientName={slot.patientName}
            patientId={slot.patientId}
            age={slot.age}
            hr={slot.hr}
            spo2={slot.spo2}
            resp={slot.resp}
            sbp={slot.sbp}
            dbp={slot.dbp}
            bedNo={slot.bedNo}
            isActivePatient={slot.isActivePatient}
            stage={slot.stage}
          />
        ))}
      </div>

      {/* Footer warning bar */}
      <div className="bg-slate-50 px-3.5 py-1.5 border-t border-slate-200 flex justify-between text-[8px] text-slate-400 font-mono">
        <span>投屏代理: Screen Casting Broker (AP-Client Connected)</span>
        <span>刷新率: 60fps | 网卡流转延迟: &lt;50ms</span>
      </div>
    </div>
  );
}
