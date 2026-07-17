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
  const respCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Stable temp simulation based on id hash so it stays stable
  const getTemp = (idStr: string) => {
    let hash = 0;
    for (let i = 0; i < idStr.length; i++) {
      hash = idStr.charCodeAt(i) + ((hash << 5) - hash);
    }
    const tempOffset = (Math.abs(hash) % 10) / 10; // 0.0 to 0.9
    return (36.3 + tempOffset).toFixed(1);
  };
  const temp = getTemp(patientId);

  // Animate ECG, SpO2, and RESP curves on separate canvas elements
  useEffect(() => {
    const ecgCanvas = ecgCanvasRef.current;
    const spo2Canvas = spo2CanvasRef.current;
    const respCanvas = respCanvasRef.current;
    if (!ecgCanvas || !spo2Canvas || !respCanvas) return;

    const ecgCtx = ecgCanvas.getContext("2d");
    const spo2Ctx = spo2Canvas.getContext("2d");
    const respCtx = respCanvas.getContext("2d");
    if (!ecgCtx || !spo2Ctx || !respCtx) return;

    let animationFrameId: number;
    let x = 0;
    const width = ecgCanvas.width;
    const height = ecgCanvas.height;

    // Buffers for seamless sweep drawing
    const ecgYBuffer = new Array(width).fill(height / 2);
    const spo2YBuffer = new Array(width).fill(height / 2);
    const respYBuffer = new Array(width).fill(height * 0.7);

    // Dynamic wave settings based on heart rate & resp rate
    let beatTimer = 0;
    const beatInterval = (60 / hr) * 60; // Approximate frames per beat at 60fps
    const respInterval = (60 / resp) * 60; // Approximate frames per breath at 60fps

    const draw = () => {
      beatTimer++;
      
      // ECG simulation: flat line with occasional PQRST peaks
      let ecgY = height / 2;
      const t = beatTimer % Math.floor(beatInterval);
      
      if (t > 10 && t < 14) {
        // P-wave
        ecgY -= height * 0.12;
      } else if (t >= 14 && t <= 16) {
        // flat
      } else if (t === 18) {
        // Q-dip
        ecgY += height * 0.15;
      } else if (t >= 19 && t <= 21) {
        // R-peak (tall)
        ecgY -= height * 0.42;
      } else if (t >= 22 && t <= 24) {
        // S-dip (deep)
        ecgY += height * 0.22;
      } else if (t >= 25 && t <= 28) {
        // flat
      } else if (t > 29 && t < 37) {
        // T-wave
        ecgY -= height * 0.15;
      }

      // Add minor high-frequency electrical noise
      ecgY += (Math.random() - 0.5) * 0.8;

      // SpO2 Pleth wave simulation
      const angle = (beatTimer / beatInterval) * Math.PI * 2;
      let spo2Y = height / 2 + Math.sin(angle) * (height * 0.22);
      // Dicrotic notch representation
      const phase = angle % (Math.PI * 2);
      if (phase > Math.PI * 0.9 && phase < Math.PI * 1.3) {
        spo2Y += height * 0.08; // notch dip
      }
      spo2Y += (Math.random() - 0.5) * 0.5;

      // RESP wave simulation (Slower sine wave)
      const respAngle = (beatTimer / respInterval) * Math.PI * 2;
      let respY = height * 0.65 + Math.sin(respAngle) * (height * 0.25);
      respY += (Math.random() - 0.5) * 0.4;

      // Update sweep positions
      ecgYBuffer[Math.floor(x)] = ecgY;
      spo2YBuffer[Math.floor(x)] = spo2Y;
      respYBuffer[Math.floor(x)] = respY;

      // Render ECG Canvas
      ecgCtx.fillStyle = "#090d16";
      ecgCtx.fillRect(0, 0, width, height);

      // Draw faint grid
      ecgCtx.strokeStyle = "rgba(239, 68, 68, 0.06)"; // faint red grids like real paper
      ecgCtx.lineWidth = 0.5;
      for (let j = 0; j < width; j += 10) {
        ecgCtx.beginPath();
        ecgCtx.moveTo(j, 0);
        ecgCtx.lineTo(j, height);
        ecgCtx.stroke();
      }
      for (let j = 0; j < height; j += 10) {
        ecgCtx.beginPath();
        ecgCtx.moveTo(0, j);
        ecgCtx.lineTo(width, j);
        ecgCtx.stroke();
      }

      // Drawing sweep trace
      ecgCtx.strokeStyle = isActivePatient ? "#22c55e" : "#16a34a"; // Glowing neon green
      ecgCtx.shadowColor = isActivePatient ? "#22c55e" : "transparent";
      ecgCtx.shadowBlur = isActivePatient ? 3 : 0;
      ecgCtx.lineWidth = 1.5;
      ecgCtx.beginPath();
      for (let i = 0; i < width; i++) {
        // Draw gap ahead of scan-bar
        if (Math.abs(i - x) < 6) continue;
        if (i === 0) ecgCtx.moveTo(i, ecgYBuffer[i]);
        else ecgCtx.lineTo(i, ecgYBuffer[i]);
      }
      ecgCtx.stroke();
      ecgCtx.shadowBlur = 0;

      // Render SpO2 Canvas
      spo2Ctx.fillStyle = "#090d16";
      spo2Ctx.fillRect(0, 0, width, height);

      // Draw faint SpO2 grid
      spo2Ctx.strokeStyle = "rgba(6, 182, 212, 0.06)";
      spo2Ctx.lineWidth = 0.5;
      for (let j = 0; j < width; j += 10) {
        spo2Ctx.beginPath();
        spo2Ctx.moveTo(j, 0);
        spo2Ctx.lineTo(j, height);
        spo2Ctx.stroke();
      }

      spo2Ctx.strokeStyle = isActivePatient ? "#06b6d4" : "#0891b2"; // Glowing cyan
      spo2Ctx.shadowColor = isActivePatient ? "#06b6d4" : "transparent";
      spo2Ctx.shadowBlur = isActivePatient ? 3 : 0;
      spo2Ctx.lineWidth = 1.5;
      spo2Ctx.beginPath();
      for (let i = 0; i < width; i++) {
        if (Math.abs(i - x) < 6) continue;
        if (i === 0) spo2Ctx.moveTo(i, spo2YBuffer[i]);
        else spo2Ctx.lineTo(i, spo2YBuffer[i]);
      }
      spo2Ctx.stroke();
      spo2Ctx.shadowBlur = 0;

      // Render RESP Canvas
      respCtx.fillStyle = "#090d16";
      respCtx.fillRect(0, 0, width, height);

      // Draw faint RESP grid
      respCtx.strokeStyle = "rgba(234, 179, 8, 0.06)";
      respCtx.lineWidth = 0.5;
      for (let j = 0; j < width; j += 10) {
        respCtx.beginPath();
        respCtx.moveTo(j, 0);
        respCtx.lineTo(j, height);
        respCtx.stroke();
      }

      respCtx.strokeStyle = isActivePatient ? "#eab308" : "#ca8a04"; // Glowing yellow
      respCtx.shadowColor = isActivePatient ? "#eab308" : "transparent";
      respCtx.shadowBlur = isActivePatient ? 3 : 0;
      respCtx.lineWidth = 1.5;
      respCtx.beginPath();
      for (let i = 0; i < width; i++) {
        if (Math.abs(i - x) < 6) continue;
        if (i === 0) respCtx.moveTo(i, respYBuffer[i]);
        else respCtx.lineTo(i, respYBuffer[i]);
      }
      respCtx.stroke();
      respCtx.shadowBlur = 0;

      // Increment scan bar
      x = (x + 1.2) % width;

      animationFrameId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [hr, resp, isActivePatient]);

  return (
    <div className={`bg-[#050a15] border rounded-lg p-2.5 flex flex-col justify-between overflow-hidden relative shadow-md transition-all ${
      isActivePatient 
        ? "border-emerald-500 ring-2 ring-emerald-500/30" 
        : "border-slate-800"
    }`}>
      {/* Top Details bar inside slot */}
      <div className="flex justify-between items-center mb-1.5 border-b border-slate-800/80 pb-1">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className={`text-[9px] px-1.5 py-0.2 rounded font-sans font-bold ${
            isActivePatient ? "bg-emerald-600 text-white" : "bg-slate-800 text-slate-400"
          }`}>
            {bedNo}
          </span>
          <span className="font-bold text-white text-[11px] truncate max-w-[65px]">
            {patientName}
          </span>
          <span className="text-[9px] text-slate-400 shrink-0">{age}岁</span>
        </div>
        
        {isActivePatient ? (
          <span className="text-[8px] px-1 py-0.2 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-sans font-medium shrink-0 animate-pulse">
            实时监护中
          </span>
        ) : (
          <span className="text-[8px] px-1 py-0.2 rounded bg-slate-800 text-slate-500 font-sans shrink-0">
            常规床旁
          </span>
        )}
      </div>

      {/* Main clinical metrics grid + waves layout */}
      <div className="grid grid-cols-12 gap-2 flex-1 items-stretch">
        {/* Waveforms (Left 7 cols) - Clean header block separating text label from canvas drawings to prevent overlap */}
        <div className="col-span-7 flex flex-col gap-1.5 justify-between py-0.5">
          {/* ECG Trace container */}
          <div className="flex flex-col bg-[#090d16] rounded overflow-hidden flex-1 border border-slate-800/50">
            <div className="flex items-center justify-between px-1.5 py-0.5 bg-[#0c1220] select-none leading-none border-b border-slate-800/30">
              <span className="text-[7px] text-emerald-400 font-bold flex items-center gap-0.5">
                <Heart className="w-1.5 h-1.5 text-emerald-400 animate-pulse" />
                ECG II
              </span>
              <span className="text-[5px] text-slate-500 font-mono">X1.0</span>
            </div>
            <div className="flex-1 relative min-h-0">
              <canvas ref={ecgCanvasRef} width={150} height={20} className="w-full h-full block" />
            </div>
          </div>
          
          {/* SpO2 Trace container */}
          <div className="flex flex-col bg-[#090d16] rounded overflow-hidden flex-1 border border-slate-800/50">
            <div className="flex items-center justify-between px-1.5 py-0.5 bg-[#0c1220] select-none leading-none border-b border-slate-800/30">
              <span className="text-[7px] text-cyan-400 font-bold">SPO2</span>
              <span className="text-[5px] text-slate-500 font-mono">X1.0</span>
            </div>
            <div className="flex-1 relative min-h-0">
              <canvas ref={spo2CanvasRef} width={150} height={20} className="w-full h-full block" />
            </div>
          </div>

          {/* RESP Trace container */}
          <div className="flex flex-col bg-[#090d16] rounded overflow-hidden flex-1 border border-slate-800/50">
            <div className="flex items-center justify-between px-1.5 py-0.5 bg-[#0c1220] select-none leading-none border-b border-slate-800/30">
              <span className="text-[7px] text-yellow-500 font-bold">RESP</span>
              <span className="text-[5px] text-slate-500 font-mono">X1.0</span>
            </div>
            <div className="flex-1 relative min-h-0">
              <canvas ref={respCanvasRef} width={150} height={20} className="w-full h-full block" />
            </div>
          </div>
        </div>

        {/* Vitals Digital readout (Right 5 cols) - Fully stacked with TEMP removed */}
        <div className="col-span-5 flex flex-col gap-1 justify-between font-mono py-0.5">
          {/* HR block */}
          <div className="bg-slate-900/80 border border-slate-800/80 rounded px-1.5 py-1.5 flex items-center justify-between flex-1">
            <span className="text-[7.5px] text-emerald-500 font-sans font-bold">HR</span>
            <div className="flex items-baseline gap-0.5">
              <span className="text-sm font-bold text-emerald-400 leading-none">{hr}</span>
              <span className="text-[5.5px] text-slate-500 font-sans leading-none">bpm</span>
            </div>
          </div>

          {/* SPO2 block */}
          <div className="bg-slate-900/80 border border-slate-800/80 rounded px-1.5 py-1.5 flex items-center justify-between flex-1">
            <span className="text-[7.5px] text-cyan-400 font-sans font-bold">SPO2</span>
            <div className="flex items-baseline gap-0.5">
              <span className="text-sm font-bold text-cyan-400 leading-none">{spo2}</span>
              <span className="text-[5.5px] text-slate-500 font-sans leading-none">%</span>
            </div>
          </div>

          {/* NIBP Block */}
          <div className="bg-slate-900/80 border border-slate-800/80 rounded px-1.5 py-1.5 flex items-center justify-between flex-1">
            <span className="text-[7.5px] text-amber-500 font-sans font-bold">NIBP</span>
            <div className="flex items-baseline gap-0.5">
              <span className="text-xs font-bold text-amber-400 leading-none">{sbp}/{dbp}</span>
              <span className="text-[5.5px] text-slate-500 font-sans leading-none">mmHg</span>
            </div>
          </div>

          {/* RESP block */}
          <div className="bg-slate-900/80 border border-slate-800/80 rounded px-1.5 py-1.5 flex items-center justify-between flex-1">
            <span className="text-[7.5px] text-yellow-500 font-sans font-bold">RR</span>
            <div className="flex items-baseline gap-0.5">
              <span className="text-sm font-bold text-yellow-400 leading-none">{resp}</span>
              <span className="text-[5.5px] text-slate-500 font-sans leading-none">/min</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Footer Tracker ID and signal strength */}
      <div className="flex justify-between items-center text-[8px] text-slate-500 mt-1.5 pt-1 border-t border-slate-800/80 font-mono">
        <span>AOA标签: {patientId.slice(0, 8)}...</span>
        <span className="text-emerald-500/60 flex items-center gap-0.5 font-bold">
          <Wifi className="w-2 h-2" />
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
              {activeArea === 5 
                ? "智能大屏：【区域5】操作间外55寸监护显示屏" 
                : "智能大屏：【区域8】二级PACU复苏区55寸监护显示屏"}
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
      <div className="bg-[#0b0f19] flex-1 p-3 grid grid-cols-2 md:grid-cols-4 gap-3">
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
