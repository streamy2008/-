/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef } from "react";
import { Monitor, Heart, Activity, Percent, Clock, AlertTriangle } from "lucide-react";
import { Patient } from "../types";

interface Monitor24InchProps {
  patient: Patient | null; // Single active patient to show in full screen
  activeArea: 6 | 7; // Operation Room (6) or PACU Bed 12 (7)
}

export default function Monitor24Inch({ patient, activeArea }: Monitor24InchProps) {
  const ecgCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const plethCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const respCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // High Fidelity Waveforms Animator using standard canvas & requestAnimationFrame
  useEffect(() => {
    const ecgCanvas = ecgCanvasRef.current;
    const plethCanvas = plethCanvasRef.current;
    const respCanvas = respCanvasRef.current;
    if (!ecgCanvas || !plethCanvas || !respCanvas) return;

    const ecgCtx = ecgCanvas.getContext("2d");
    const plethCtx = plethCanvas.getContext("2d");
    const respCtx = respCanvas.getContext("2d");
    if (!ecgCtx || !plethCtx || !respCtx) return;

    let animationId: number;
    let x = 0;
    
    // Grab dimensions
    const width = ecgCanvas.width;
    const height = ecgCanvas.height;

    // Buffer values for sweeping traces
    const ecgY = new Array(width).fill(height / 2);
    const plethY = new Array(width).fill(height / 2);
    const respY = new Array(width).fill(height / 2);

    let frameCount = 0;
    const hr = patient?.currentVitals.hr || 75;
    const beatInterval = 60 / hr * 60; // Approximate frames per beat at 60fps

    const draw = () => {
      frameCount++;
      
      // 1. ECG Signal Simulation
      let currentEcgVal = height / 2;
      const ecgPhase = frameCount % Math.floor(beatInterval);
      
      if (ecgPhase > 8 && ecgPhase < 12) {
        currentEcgVal -= 5; // P-wave
      } else if (ecgPhase === 15) {
        currentEcgVal += 8; // Q-dip
      } else if (ecgPhase === 16) {
        currentEcgVal -= 42; // R-peak (taller for high fidelity)
      } else if (ecgPhase === 17) {
        currentEcgVal += 16; // S-dip
      } else if (ecgPhase > 20 && ecgPhase < 28) {
        currentEcgVal -= 10; // T-wave
      }
      // Minor electrical buzz
      currentEcgVal += (Math.random() - 0.5) * 1.8;
      ecgY[x] = currentEcgVal;

      // 2. Pleth Waveform (SpO2 wave)
      const angle = (frameCount / beatInterval) * Math.PI * 2;
      let currentPlethVal = height / 2 + Math.sin(angle) * 14;
      if (angle % (Math.PI * 2) > Math.PI * 0.9 && angle % (Math.PI * 2) < Math.PI * 1.1) {
        currentPlethVal += 4; // dicrotic notch
      }
      currentPlethVal += (Math.random() - 0.5) * 0.8;
      plethY[x] = currentPlethVal;

      // 3. Respiration Waveform (Smooth slow breathing sine wave)
      const respRate = patient?.currentVitals.resp || 16;
      const respInterval = 60 / respRate * 60;
      const respAngle = (frameCount / respInterval) * Math.PI * 2;
      let currentRespVal = height / 2 + Math.sin(respAngle) * 12 + (Math.random() - 0.5) * 0.5;
      respY[x] = currentRespVal;

      // Render ECG Trace
      ecgCtx.fillStyle = "#fafafa";
      ecgCtx.fillRect(0, 0, width, height);
      
      // ECG Grid
      ecgCtx.strokeStyle = "rgba(16, 185, 129, 0.05)";
      ecgCtx.lineWidth = 0.8;
      for (let j = 0; j < width; j += 15) {
        ecgCtx.beginPath(); ecgCtx.moveTo(j, 0); ecgCtx.lineTo(j, height); ecgCtx.stroke();
      }
      for (let j = 0; j < height; j += 15) {
        ecgCtx.beginPath(); ecgCtx.moveTo(0, j); ecgCtx.lineTo(width, j); ecgCtx.stroke();
      }

      ecgCtx.strokeStyle = "#10b981";
      ecgCtx.lineWidth = 2;
      ecgCtx.beginPath();
      for (let i = 0; i < width; i++) {
        if (Math.abs(i - x) < 12) continue; // scanbar gap
        if (i === 0) ecgCtx.moveTo(i, ecgY[i]);
        else ecgCtx.lineTo(i, ecgY[i]);
      }
      ecgCtx.stroke();

      // Render Pleth Trace
      plethCtx.fillStyle = "#fafafa";
      plethCtx.fillRect(0, 0, width, height);

      plethCtx.strokeStyle = "rgba(6, 182, 212, 0.05)";
      plethCtx.lineWidth = 0.8;
      for (let j = 0; j < width; j += 15) {
        plethCtx.beginPath(); plethCtx.moveTo(j, 0); plethCtx.lineTo(j, height); plethCtx.stroke();
      }

      plethCtx.strokeStyle = "#06b6d4";
      plethCtx.lineWidth = 2;
      plethCtx.beginPath();
      for (let i = 0; i < width; i++) {
        if (Math.abs(i - x) < 12) continue;
        if (i === 0) plethCtx.moveTo(i, plethY[i]);
        else plethCtx.lineTo(i, plethY[i]);
      }
      plethCtx.stroke();

      // Render Resp Trace
      respCtx.fillStyle = "#fafafa";
      respCtx.fillRect(0, 0, width, height);

      respCtx.strokeStyle = "rgba(234, 179, 8, 0.05)";
      respCtx.lineWidth = 0.8;
      for (let j = 0; j < width; j += 15) {
        respCtx.beginPath(); respCtx.moveTo(j, 0); respCtx.lineTo(j, height); respCtx.stroke();
      }

      respCtx.strokeStyle = "#eab308";
      respCtx.lineWidth = 2;
      respCtx.beginPath();
      for (let i = 0; i < width; i++) {
        if (Math.abs(i - x) < 12) continue;
        if (i === 0) respCtx.moveTo(i, respY[i]);
        else respCtx.lineTo(i, respY[i]);
      }
      respCtx.stroke();

      // Sweep increment (adjust speed)
      x = (x + 2) % width;

      animationId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [patient?.currentVitals.hr, patient?.currentVitals.resp]);

  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden h-full flex flex-col font-sans select-none shadow-sm">
      
      {/* 24-inch Bedside Monitor Bezel Frame Bar */}
      <div className="bg-slate-50 border-b border-slate-200 p-3.5 flex justify-between items-center text-slate-800">
        <div className="flex items-center gap-2">
          <Monitor className="w-5 h-5 text-blue-600" />
          <div>
            <span className="text-xs font-bold font-sans tracking-wider text-blue-600 block">
              {activeArea === 6 ? "BEDSIDE-OR-MONITOR" : "BEDSIDE-PACU-MONITOR (12号床)"}
            </span>
            <span className="text-[9px] text-slate-400 font-sans">
              24寸高采样床旁监护终端 (独占式全屏物理投屏)
            </span>
          </div>
        </div>

        {/* Alarm and Connection Banner */}
        <div className="flex items-center gap-3">
          {patient && patient.sensorConnected ? (
            <div className="bg-emerald-50 text-emerald-700 border border-emerald-200 rounded px-2.5 py-1 text-[10px] font-sans flex items-center gap-1.5 font-bold shadow-sm">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>AOA 独占式投屏接管成功 (MAC: {patient.sensorMac})</span>
            </div>
          ) : (
            <div className="bg-rose-50 text-rose-700 border border-rose-200 rounded px-2.5 py-1 text-[10px] font-sans flex items-center gap-1.5 font-bold shadow-sm">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-500 animate-bounce" />
              <span>等候 AOA 传感器入域无感投屏接管信号...</span>
            </div>
          )}
          <span className="text-[10px] font-sans text-blue-600 font-bold bg-blue-50 px-2 py-1 rounded border border-blue-200/50">
            24" Bedside Exclusive
          </span>
        </div>
      </div>

      {/* Actual Monitor Grid Canvas Area */}
      {patient && patient.sensorConnected ? (
        <div className="flex-1 grid grid-cols-12 bg-slate-50/20">
          
          {/* Waves Display Section (Left 8 cols) */}
          <div className="col-span-8 p-3 flex flex-col gap-3 border-r border-slate-200 justify-around">
            
            {/* ECG WAVE */}
            <div className="flex-1 flex flex-col relative bg-white border border-slate-100 rounded p-1.5 min-h-[90px] shadow-sm">
              <div className="absolute top-1 left-2 flex items-center gap-1.5 text-[9px] text-emerald-600 font-bold font-sans z-10">
                <Heart className="w-3 h-3 text-emerald-500 animate-pulse" />
                <span>ECG II (导联II)</span>
                <span className="text-slate-400 font-normal">X1.0</span>
              </div>
              <div className="absolute top-1 right-2 text-[8px] text-slate-400 font-mono">60Hz Notch</div>
              <div className="flex-1 w-full mt-3 overflow-hidden">
                <canvas ref={ecgCanvasRef} width={450} height={70} className="w-full h-full block" />
              </div>
            </div>

            {/* PLETH WAVE */}
            <div className="flex-1 flex flex-col relative bg-white border border-slate-100 rounded p-1.5 min-h-[90px] shadow-sm">
              <div className="absolute top-1 left-2 flex items-center gap-1.5 text-[9px] text-cyan-600 font-bold font-sans z-10">
                <Activity className="w-3 h-3 text-cyan-500" />
                <span>SPO2 PLETH (光电容积波)</span>
              </div>
              <div className="flex-1 w-full mt-3 overflow-hidden">
                <canvas ref={plethCanvasRef} width={450} height={70} className="w-full h-full block" />
              </div>
            </div>

            {/* RESP WAVE */}
            <div className="flex-1 flex flex-col relative bg-white border border-slate-100 rounded p-1.5 min-h-[90px] shadow-sm">
              <div className="absolute top-1 left-2 flex items-center gap-1.5 text-[9px] text-amber-600 font-bold font-sans z-10">
                <Activity className="w-3 h-3 text-amber-500" />
                <span>RESP (阻抗呼吸波)</span>
                <span className="text-slate-400 font-normal">X2.0</span>
              </div>
              <div className="flex-1 w-full mt-3 overflow-hidden">
                <canvas ref={respCanvasRef} width={450} height={70} className="w-full h-full block" />
              </div>
            </div>

          </div>

          {/* Vitals Numbers Readout (Right 4 cols) */}
          <div className="col-span-4 p-3 flex flex-col gap-3 justify-between bg-slate-50/50 font-mono">
            
            {/* HR Number block */}
            <div className="border border-emerald-200 bg-emerald-50/30 rounded-lg p-2.5 flex justify-between items-center relative overflow-hidden shadow-sm">
              <div className="flex flex-col">
                <span className="text-[10px] text-emerald-700 font-bold font-sans">心率 HR</span>
                <span className="text-[8px] text-slate-400">bpm</span>
                <span className="text-[8px] text-emerald-600/60 mt-1 font-bold">H: 120 / L: 50</span>
              </div>
              <span className="text-4xl font-extrabold text-emerald-600 leading-none tracking-tighter">
                {patient.currentVitals.hr}
              </span>
            </div>

            {/* SpO2 Number block */}
            <div className="border border-cyan-200 bg-cyan-50/30 rounded-lg p-2.5 flex justify-between items-center relative overflow-hidden shadow-sm">
              <div className="flex flex-col">
                <span className="text-[10px] text-cyan-700 font-bold font-sans">血氧 SPO2</span>
                <span className="text-[8px] text-slate-400">%</span>
                <span className="text-[8px] text-cyan-600/60 mt-1 font-bold">H: 100 / L: 90</span>
              </div>
              <span className="text-4xl font-extrabold text-cyan-600 leading-none tracking-tighter">
                {patient.currentVitals.spo2}
              </span>
            </div>

            {/* RESP Number block */}
            <div className="border border-amber-200 bg-amber-50/30 rounded-lg p-2.5 flex justify-between items-center relative overflow-hidden shadow-sm">
              <div className="flex flex-col">
                <span className="text-[10px] text-amber-700 font-bold font-sans">呼吸 RESP</span>
                <span className="text-[8px] text-slate-400">/min</span>
                <span className="text-[8px] text-amber-600/60 mt-1 font-bold">H: 24 / L: 10</span>
              </div>
              <span className="text-4xl font-extrabold text-amber-600 leading-none tracking-tighter">
                {patient.currentVitals.resp}
              </span>
            </div>

            {/* NIBP Number block */}
            <div className="border border-amber-200 bg-amber-50/30 rounded-lg p-2.5 flex flex-col justify-center relative overflow-hidden shadow-sm">
              <span className="text-[10px] text-amber-700 font-bold font-sans mb-1">无创血压 NIBP</span>
              <div className="flex justify-between items-baseline">
                <span className="text-[8px] text-slate-400">SYS / DIA (mmHg)</span>
                <span className="text-2xl font-extrabold text-amber-600 leading-none tracking-tighter">
                  {patient.currentVitals.sbp} / {patient.currentVitals.dbp}
                </span>
              </div>
              <div className="flex justify-between items-center mt-1 text-[8px] text-slate-400">
                <span>平均 MAP: {Math.floor((patient.currentVitals.sbp + 2 * patient.currentVitals.dbp) / 3)}</span>
                <span className="flex items-center gap-0.5 font-sans font-semibold text-[8px]">
                  <Clock className="w-2.5 h-2.5 text-slate-400" />
                  自动采集: 3分钟前
                </span>
              </div>
            </div>

          </div>

          {/* Bottom Patient banner bar inside monitor */}
          <div className="col-span-12 bg-slate-50 border-t border-slate-200 p-2.5 px-3.5 flex justify-between items-center text-xs text-slate-600 font-medium">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <span className="text-slate-400">患者:</span>
                <span className="text-slate-800 font-bold text-sm">{patient.name}</span>
                <span className="text-slate-400">({patient.gender === "男" ? "M" : "F"} • {patient.age}岁)</span>
              </div>
              <div className="w-px h-3 bg-slate-200" />
              <div>
                <span className="text-slate-400">ASA分级:</span>
                <span className="text-cyan-700 font-bold ml-1">{patient.asaGrade.split(" ")[0]}</span>
              </div>
              <div className="w-px h-3 bg-slate-200" />
              <div>
                <span className="text-slate-400">BMI:</span>
                <span className="text-slate-700 ml-1 font-mono font-bold">{patient.bmi}</span>
              </div>
            </div>
            
            <div className="text-[10px] font-mono text-slate-400">
              AOA定位基站覆盖: AP-05 (视距 8.5m)
            </div>
          </div>

        </div>
      ) : (
        /* Empty Idle Screen */
        <div className="flex-1 bg-slate-50/20 flex flex-col items-center justify-center text-slate-400 gap-3 text-center p-8">
          <Monitor className="w-16 h-16 text-slate-200 animate-pulse" />
          <div>
            <div className="text-sm font-bold text-slate-600 font-sans">床旁监护仪处于空闲待机模式</div>
            <p className="text-xs text-slate-400 mt-1 max-w-[320px] mx-auto leading-relaxed font-sans">
              请点击下方控制台中的“仿真操作”或在PDA终端将患者流转至 <b>步骤6（操作间内手术）</b> 或 <b>步骤7（PACU一级复苏床位12）</b>，AOA定位基站将自动漫游并无线接力投屏。
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
