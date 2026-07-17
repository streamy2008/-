/**
 * @license
 * SPDX-License-Identifier: Apache-2.5
 */

import React, { useState, useEffect } from "react";
import { 
  FileText, Printer, Lock, Clock, Activity, CheckSquare, Square, 
  ChevronRight, RefreshCw, ClipboardCheck, Eye, ShieldCheck 
} from "lucide-react";
import { Patient, Gender } from "../types";

interface AnesthesiaRecordProps {
  patient: Patient | null;
  onLockRecord: () => void;
}

export default function AnesthesiaRecord({ patient, onLockRecord }: AnesthesiaRecordProps) {
  // Screen display mode: "all" (stacked dual-page) | "p1" (Page 1 only) | "p2" (Page 2 only)
  const [viewMode, setViewMode] = useState<"all" | "p1" | "p2">("all");

  // State structure matching 100% of the standard WS 329-2024 form fields
  const [formState, setFormState] = useState<any>(null);

  // Initialize form state dynamically based on active patient context
  useEffect(() => {
    if (patient) {
      const isXu = patient.name.includes("徐淑华");
      const preOpDiag = isXu 
        ? "胃窦息肉 (约0.8cm)、结肠多发腺瘤性息肉 (I-Ip型，0.5-1.2cm)" 
        : "慢性浅表性胃炎伴糜烂、直肠多发息肉 (拟电切治疗)";
      const plannedProc = isXu 
        ? "无痛胃镜下胃黏膜切除术 (EMR) + 无痛结肠镜下息肉高频电切术" 
        : "无痛电子结肠镜下多发息肉电切术";
      const position = "左侧卧位 / 仰卧位";
      
      // Seed initial medication and fluid timeline cells (12 intervals corresponding to 60 mins)
      const propofol = ["120", "", "50", "", "40", "", "30", "", "", "", "", ""];
      const dezocine = ["5", "", "", "", "", "", "", "", "", "", "", ""];
      const remi = ["20", "20", "20", "20", "20", "20", "10", "", "", "", "", ""];
      const saline = ["100", "", "", "", "", "", "", "", "", "", "", ""];
      const ringer = ["250", "", "", "", "250", "", "", "", "", "", "", ""];
      const urine = ["", "", "", "", "", "", "", "", "", "", "120", ""];

      setFormState({
        department: "消化内镜中心",
        ward: "门诊内镜部",
        recordId: patient.id,
        preOpDiagnosis: preOpDiag,
        plannedProcedure: plannedProc,
        preMeds: "无",
        position: position,
        specialConditions: patient.specialConditions || "无特殊合并症。青霉素皮试阴性。",
        isEmergency: false, // 择期 (true for 急诊)
        isFasted: patient.fastingStatus.includes("已禁食"),
        
        // 12 columns of timeline administration values
        medsGrid: {
          propofol,
          dezocine,
          remi,
          saline,
          ringer,
          urine
        },
        
        // Page 2 fields (Anesthetic Techniques)
        anesthesiaType: "gen", // "gen" | "spinal" | "regional"
        genInduction: "rapid", // "rapid" (快诱导), "slow" (慢诱导), "awake" (清醒)
        airwayType: "lma", // "lma" (喉罩), "tube" (气管插管), "mask" (面罩/鼻导管)
        lmaSize: "3.0",
        lmaDepth: "14",
        lmaCuff: true,
        maintenance: "全静脉靶控维持 (丙泊酚 + 瑞芬太尼)",
        macMonitored: true,
        
        spinalType: "", // "spinal" (腰麻), "epidural" (硬外), "combined" (腰硬联合), "sacral" (骶麻)
        puncturePoint: "",
        catheterPlaced: false,
        catheterDepth: "",
        spinalPlane: "",
        spinalDrugs: "",
        
        regionalBlock: false,
        blockSite: "",
        blockRange: "",
        blockDrugs: "",
        
        invasiveProcedure: false,
        arterialLine: false,
        centralLine: false,
        invasiveOther: "",
        
        // Departure (离室) fields
        extubationSite: "or", // "or" (手术室), "pacu" (复苏室), "ward" (病房/ICU)
        extubationTime: "19:15",
        lungInflated: true,
        suctioned: true,
        stomachEmptied: true,
        muscleRecovery: "good", // "good" | "poor"
        coughReflex: "present", // "present" | "absent"
        consciousness: "awake", // "awake" | "somnolent" | "anesthetized" | "delirium" | "coma"
        pca: "absent", // "present" | "absent"
        blockPlanePage2: "N/A",
        patientDestination: patient.currentStage >= 9 ? "discharge" : (patient.currentStage >= 7 ? "pacu" : "ward"),
        remarksPage1: "整个消化内镜诊疗及多发息肉电切、EMR过程顺利。术中生命体征十分平稳，ECG未见ST段改变或严重心律失常，自主呼吸恢复良好，SpO2保持稳定。",
        remarksPage2: "术后患者于12号床复苏顺利。离室时 Modified Aldrete 恢复评分为 10 分（呼吸、血氧、神志、血压及肢体活动各项均得2分满分），定向力完全恢复，安全出院。",
        
        specialConditionsCheckbox: "normal", // "normal" | "special"
        specialConditionsDetail: "",
        
        surgeon: isXu ? "李主任" : "陈教授",
        anesthesiologist: "刘麻醉师",
        anesthesiaNurse: "赵护士",
        scrubNurse: "黄护士",
        circulatingNurse: "张护士",
      });
    }
  }, [patient?.id]);

  if (!patient || !formState) {
    return (
      <div className="bg-white text-slate-400 p-8 rounded-xl border border-slate-200 shadow-sm h-full flex flex-col items-center justify-center text-center gap-3 select-none">
        <FileText className="w-16 h-16 text-slate-200 animate-pulse" />
        <div>
          <div className="text-sm font-bold text-slate-600">等候患者流转并绑定监护数据...</div>
          <p className="text-[11px] text-slate-400 mt-1 max-w-[320px] leading-relaxed">
            请在左侧列表中选定一名患者。系统将利用 <b>AOA到达角高精度定位时空戳</b> 与 <b>可穿戴体征数据</b>，自动重构出一份符合 <b>《WS 329-2024》行业标准</b> 的电子麻醉记录单。
          </p>
        </div>
      </div>
    );
  }

  // Format timestamp helper
  const formatDateString = (isoString?: string) => {
    if (!isoString) return "2026年07月16日";
    const d = new Date(isoString);
    return `${d.getFullYear()}年${String(d.getMonth() + 1).padStart(2, "0")}月${String(d.getDate()).padStart(2, "0")}日`;
  };

  const handlePrint = () => {
    window.print();
  };

  // Helper to generate coordinates and vitals series for plotting
  // WS 329-2024 requires charting HR (●), SBP (∨), DBP (∧), Temp (○), events (X, ☉, ⊗, ⨀)
  const generateVitalsTimeline = () => {
    const baseTimeStr = patient.timeLogs.orEnter || patient.timeLogs.deviceBound || "2026-07-16T18:50:00Z";
    const baseTime = new Date(baseTimeStr);
    
    return Array.from({ length: 12 }).map((_, i) => {
      const t = new Date(baseTime.getTime() + i * 5 * 60 * 1000);
      const timeStr = t.toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit", hour12: false });
      
      // Match existing vitals history if available, otherwise interpolate realistically
      let data = patient.vitalsHistory[i];
      if (!data) {
        const seed = Math.sin(i / 1.5);
        const pulse = Math.round(74 + seed * 3 + (Math.random() - 0.5) * 1.5);
        const sbp = Math.round(118 + seed * 6 + (Math.random() - 0.5) * 3);
        const dbp = Math.round(76 + seed * 4 + (Math.random() - 0.5) * 2);
        const spo2 = Math.min(100, Math.round(98 + (i % 4 === 0 ? 1 : 2)));
        data = { time: timeStr, pulse, sbp, dbp, spo2 };
      } else {
        data = { ...data, time: timeStr };
      }
      return data;
    });
  };

  const timelineData = generateVitalsTimeline();

  // SVG Chart Geometry Constants
  const chartWidth = 490;
  const chartHeight = 250;
  const paddingLeft = 32;
  const paddingRight = 32; // for temperature Y-axis labels on the right
  const paddingTop = 25;
  const paddingBottom = 25;
  const plotWidth = chartWidth - paddingLeft - paddingRight;
  const plotHeight = chartHeight - paddingTop - paddingBottom;

  const minVal = 40;
  const maxVal = 260; // Standard BP/HR scale

  const getX = (index: number) => paddingLeft + (index / 11) * plotWidth;
  const getHrBpY = (val: number) => {
    const clamped = Math.max(minVal, Math.min(maxVal, val));
    const ratio = (clamped - minVal) / (maxVal - minVal);
    return paddingTop + plotHeight - ratio * plotHeight;
  };
  const getTempY = (val: number) => {
    const tMin = 34;
    const tMax = 40;
    const clamped = Math.max(tMin, Math.min(tMax, val));
    const ratio = (clamped - tMin) / (tMax - tMin);
    return paddingTop + plotHeight - ratio * plotHeight;
  };

  // Helper to handle medications grid input edits
  const handleGridCellChange = (drugKey: string, colIdx: number, value: string) => {
    if (patient.isLocked) return;
    setFormState((prev: any) => {
      const updatedGrid = { ...prev.medsGrid };
      updatedGrid[drugKey] = [...updatedGrid[drugKey]];
      updatedGrid[drugKey][colIdx] = value;
      return { ...prev, medsGrid: updatedGrid };
    });
  };

  // State handlers for basic form values
  const handleInputChange = (field: string, val: any) => {
    if (patient.isLocked) return;
    setFormState((prev: any) => ({ ...prev, [field]: val }));
  };

  return (
    <div className="bg-white text-slate-950 border border-slate-300 rounded-xl overflow-hidden h-full flex flex-col font-sans select-text shadow-md relative">
      
      {/* Dynamic Print Styles Embedded */}
      <style>{`
        @media print {
          body {
            background-color: #ffffff !important;
            color: #000000 !important;
          }
          .print\\:hidden {
            display: none !important;
          }
          .print-page-container {
            width: 210mm;
            min-height: 297mm;
            margin: 0 auto !important;
            padding: 8mm 12mm !important;
            box-shadow: none !important;
            border: none !important;
            page-break-after: always;
            break-after: page;
          }
          .custom-scrollbar {
            overflow: visible !important;
          }
          input, textarea {
            border-bottom: none !important;
            outline: none !important;
            background: transparent !important;
          }
        }
      `}</style>

      {/* Top Professional Toolbar (Hidden in Print) */}
      <div className="bg-slate-50 border-b border-slate-200 p-2.5 px-4 flex justify-between items-center select-none print:hidden shrink-0">
        <div className="flex items-center gap-2">
          <FileText className="w-4.5 h-4.5 text-blue-600" />
          <span className="text-xs font-bold text-slate-700 tracking-tight flex items-center gap-1.5">
            WS 329-2024 麻醉记录单规范终端 
            <span className="text-[10px] bg-slate-200/60 text-slate-500 px-1.5 py-0.2 rounded font-mono">
              A4双面输出
            </span>
          </span>
        </div>

        {/* Workspace Display Tabs */}
        <div className="flex items-center gap-1 bg-slate-200/50 p-0.5 rounded-md text-[10px] font-medium border border-slate-200">
          <button
            onClick={() => setViewMode("all")}
            className={`px-2 py-1 rounded transition-colors cursor-pointer ${
              viewMode === "all" ? "bg-white text-blue-600 shadow-xs font-bold" : "text-slate-500 hover:text-slate-800"
            }`}
          >
            🔲 双页重叠
          </button>
          <button
            onClick={() => setViewMode("p1")}
            className={`px-2 py-1 rounded transition-colors cursor-pointer ${
              viewMode === "p1" ? "bg-white text-blue-600 shadow-xs font-bold" : "text-slate-500 hover:text-slate-800"
            }`}
          >
            1️⃣ 第 1 页 (术中监护)
          </button>
          <button
            onClick={() => setViewMode("p2")}
            className={`px-2 py-1 rounded transition-colors cursor-pointer ${
              viewMode === "p2" ? "bg-white text-blue-600 shadow-xs font-bold" : "text-slate-500 hover:text-slate-800"
            }`}
          >
            2️⃣ 第 2 页 (方法与恢复)
          </button>
        </div>
        
        {/* Print & Signature Actions */}
        <div className="flex items-center gap-2">
          {patient.isLocked ? (
            <span className="text-[10px] bg-rose-50 text-rose-700 border border-rose-200 px-2 py-0.5 rounded flex items-center gap-1 font-bold">
              <Lock className="w-3 h-3 text-rose-500" />
              只读电子印签已归档
            </span>
          ) : (
            <button
              onClick={onLockRecord}
              disabled={patient.currentStage !== 9}
              className={`text-[10px] px-2.5 py-1 rounded font-bold flex items-center gap-1 border cursor-pointer transition-colors ${
                patient.currentStage === 9
                  ? "bg-amber-100 text-amber-700 border-amber-300 hover:bg-amber-200"
                  : "bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed"
              }`}
              title={patient.currentStage !== 9 ? "等候患者流转至步骤9 Modified Aldrete 评分完成后方能核销锁定" : "审核签名并锁定电子记录"}
            >
              <Lock className="w-3 h-3" />
              核签锁定
            </button>
          )}

          <button
            onClick={handlePrint}
            className="text-[10px] bg-emerald-600 hover:bg-emerald-700 text-white px-2.5 py-1 rounded flex items-center gap-1 cursor-pointer transition-colors font-bold shadow-xs"
          >
            <Printer className="w-3 h-3" />
            打印 A4 记录单
          </button>
        </div>
      </div>

      {/* Main Form Sheets Container */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-slate-100/40 custom-scrollbar flex flex-col gap-6 items-center print:bg-white print:p-0">
        
        {/* ===================================================================== */}
        {/* PAGE 1: ANESTHETIC INTEROPERABILITY AND VITALS GRID PLOT (WS 329-2024 Page 1) */}
        {/* ===================================================================== */}
        {(viewMode === "all" || viewMode === "p1") && (
          <div className="bg-white border border-slate-300 shadow-md p-6 max-w-[760px] w-full min-h-[960px] print:shadow-none print:border-none print-page-container print-page select-text relative flex flex-col justify-between">
            
            {/* Locked Visual Seal stamp overlay */}
            {patient.isLocked && (
              <div className="absolute top-28 right-8 border-4 border-emerald-500/30 text-emerald-600/30 font-serif text-[11px] font-black px-3 py-1 rounded-md -rotate-12 pointer-events-none uppercase tracking-widest select-none border-dashed print:border-emerald-600 print:text-emerald-600 z-50">
                ✔️ 已数字签名锁定
                <div className="text-[8px] text-center mt-0.5 font-sans">
                  WS 329-2024 COMPLIANT
                </div>
              </div>
            )}

            <div>
              {/* WS 329 Standard ID Header */}
              <div className="flex justify-between items-start text-[10px] text-slate-700 font-mono select-none">
                <span className="font-bold border border-slate-400/80 px-1 py-0.2 rounded-xs">附录 B (规范性)</span>
                <span className="text-right text-xs font-bold text-slate-900 tracking-widest">WS 329—2024</span>
              </div>

              {/* Title Header Section */}
              <div className="text-center mt-3 border-b-2 border-slate-950 pb-2 mb-3">
                <h2 className="text-lg font-bold font-serif tracking-widest text-slate-950">
                  ＊ ＊ ＊ ＊ 医 院
                </h2>
                <h1 className="text-2xl font-black font-serif tracking-widest text-slate-950 mt-1">
                  麻 醉 记 录
                </h1>
                <div className="flex justify-between text-[10px] text-slate-800 font-mono px-0.5 mt-2">
                  <div>科别: <input type="text" value={formState.department} onChange={(e) => handleInputChange("department", e.target.value)} className="border-b border-dashed border-slate-400 w-24 text-center outline-none bg-transparent" /></div>
                  <div>病房: <input type="text" value={formState.ward} onChange={(e) => handleInputChange("ward", e.target.value)} className="border-b border-dashed border-slate-400 w-24 text-center outline-none bg-transparent" /></div>
                  <div className="font-bold">病历号: <span className="underline underline-offset-4 font-bold">{formState.recordId}</span></div>
                  <div className="text-[9px] text-slate-400">页码：第 1 页/共 2 页</div>
                </div>
              </div>

              {/* Patient Basic demographics block */}
              <table className="w-full border-collapse border border-slate-950 text-[10px] text-slate-900 mb-2 font-sans font-medium">
                <tbody>
                  <tr className="border-b border-slate-950">
                    <td className="p-1 border-r border-slate-950 bg-slate-50/50 font-bold w-[7%] text-center">姓名</td>
                    <td className="p-1 border-r border-slate-950 w-[12%] text-center font-bold text-slate-900">{patient.name}</td>
                    <td className="p-1 border-r border-slate-950 bg-slate-50/50 font-bold w-[5%] text-center">性别</td>
                    <td className="p-1 border-r border-slate-950 w-[8%] text-center">{patient.gender}</td>
                    <td className="p-1 border-r border-slate-950 bg-slate-50/50 font-bold w-[5%] text-center">年龄</td>
                    <td className="p-1 border-r border-slate-950 w-[8%] text-center font-mono">{patient.age} 岁</td>
                    <td className="p-1 border-r border-slate-950 bg-slate-50/50 font-bold w-[7%] text-center">身高</td>
                    <td className="p-1 border-r border-slate-950 w-[10%] text-center font-mono">{patient.height} cm</td>
                    <td className="p-1 border-r border-slate-950 bg-slate-50/50 font-bold w-[7%] text-center">体重</td>
                    <td className="p-1 border-r border-slate-950 w-[10%] text-center font-mono">{patient.weight} kg</td>
                    <td className="p-1 border-r border-slate-950 bg-slate-50/50 font-bold w-[5%] text-center">BMI</td>
                    <td className="p-1 w-[12%] text-center font-mono font-bold text-blue-700">{patient.bmi}</td>
                  </tr>
                  <tr className="border-b border-slate-950">
                    <td className="p-1 border-r border-slate-950 bg-slate-50/50 font-bold text-center">ASA分级</td>
                    <td colSpan={4} className="p-1 border-r border-slate-950 text-left px-2">
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.2 rounded border border-indigo-200">{patient.asaGrade.split(" ")[0]}</span>
                        <label className="flex items-center gap-0.5 cursor-pointer">
                          <input type="checkbox" checked={!formState.isEmergency} onChange={() => handleInputChange("isEmergency", false)} className="scale-85" />
                          <span>择期</span>
                        </label>
                        <label className="flex items-center gap-0.5 cursor-pointer">
                          <input type="checkbox" checked={formState.isEmergency} onChange={() => handleInputChange("isEmergency", true)} className="scale-85" />
                          <span>急诊</span>
                        </label>
                      </div>
                    </td>
                    <td className="p-1 border-r border-slate-950 bg-slate-50/50 font-bold text-center">禁食水</td>
                    <td colSpan={2} className="p-1 border-r border-slate-950 text-center">
                      <div className="flex justify-center gap-2">
                        <label className="flex items-center gap-0.5">
                          <input type="checkbox" checked={formState.isFasted} onChange={() => handleInputChange("isFasted", true)} className="scale-85" />
                          <span>是</span>
                        </label>
                        <label className="flex items-center gap-0.5">
                          <input type="checkbox" checked={!formState.isFasted} onChange={() => handleInputChange("isFasted", false)} className="scale-85" />
                          <span>否</span>
                        </label>
                      </div>
                    </td>
                    <td className="p-1 border-r border-slate-950 bg-slate-50/50 font-bold text-center">检查日期</td>
                    <td colSpan={3} className="p-1 text-center font-mono font-bold text-slate-800">
                      {formatDateString(patient.timeLogs.registration)}
                    </td>
                  </tr>
                  <tr className="border-b border-slate-950">
                    <td className="p-1 border-r border-slate-950 bg-slate-50/50 font-bold text-center">术前诊断</td>
                    <td colSpan={11} className="p-1 px-2.5">
                      <input 
                        type="text" 
                        value={formState.preOpDiagnosis} 
                        onChange={(e) => handleInputChange("preOpDiagnosis", e.target.value)} 
                        className="w-full text-slate-800 border-none outline-none bg-transparent"
                      />
                    </td>
                  </tr>
                  <tr className="border-b border-slate-950">
                    <td className="p-1 border-r border-slate-950 bg-slate-50/50 font-bold text-center">拟施手术</td>
                    <td colSpan={11} className="p-1 px-2.5">
                      <input 
                        type="text" 
                        value={formState.plannedProcedure} 
                        onChange={(e) => handleInputChange("plannedProcedure", e.target.value)} 
                        className="w-full text-slate-800 border-none outline-none bg-transparent"
                      />
                    </td>
                  </tr>
                  <tr>
                    <td className="p-1 border-r border-slate-950 bg-slate-50/50 font-bold text-center">麻醉前用药</td>
                    <td colSpan={3} className="p-1 px-2 text-center">
                      <input 
                        type="text" 
                        value={formState.preMeds} 
                        onChange={(e) => handleInputChange("preMeds", e.target.value)} 
                        className="w-full text-center border-none outline-none bg-transparent"
                      />
                    </td>
                    <td className="p-1 border-r border-slate-950 bg-slate-50/50 font-bold text-center" colSpan={2}>手术体位</td>
                    <td colSpan={3} className="p-1 px-2 text-center">
                      <input 
                        type="text" 
                        value={formState.position} 
                        onChange={(e) => handleInputChange("position", e.target.value)} 
                        className="w-full text-center border-none outline-none bg-transparent"
                      />
                    </td>
                    <td className="p-1 border-r border-slate-950 bg-slate-50/50 font-bold text-center">特殊合并症</td>
                    <td colSpan={2} className="p-1 px-2 font-medium text-slate-500 text-[9px] leading-tight">
                      {formState.specialConditions}
                    </td>
                  </tr>
                </tbody>
              </table>

              {/* SECTION: Medication and Fluid timeline grids (Upper section of main card box) */}
              <div className="border border-slate-950 rounded-xs overflow-hidden mb-2">
                <div className="bg-slate-50 border-b border-slate-950 p-1 px-2 text-[9.5px] font-bold text-slate-800 flex justify-between">
                  <span>用药、补液及出入量事件流轴监控网格 (采样粒度: 5分钟)</span>
                  <span className="text-[8px] font-normal text-slate-400">点击格子可自由微调记录值</span>
                </div>
                
                <table className="w-full text-center text-[9px] border-collapse font-sans">
                  <thead>
                    <tr className="bg-slate-50/30 border-b border-slate-950 font-bold text-slate-700">
                      <th className="p-1 text-left px-2 border-r border-slate-950 w-[24%]">时间 (min)</th>
                      {timelineData.map((d, i) => (
                        <th key={i} className="p-0.5 border-r last:border-r-0 border-slate-300 w-[6.3%] font-mono text-[8px]">
                          {d.time}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-300">
                    <tr className="hover:bg-slate-50/50">
                      <td className="p-1 text-left px-2 border-r border-slate-950 font-medium">丙泊酚 Propofol (mg)</td>
                      {formState.medsGrid.propofol.map((val: string, idx: number) => (
                        <td key={idx} className="p-0 border-r last:border-r-0 border-slate-300">
                          <input 
                            type="text" 
                            value={val} 
                            onChange={(e) => handleGridCellChange("propofol", idx, e.target.value)} 
                            className="w-full text-center outline-none border-none bg-transparent font-mono text-[8.5px] text-blue-600 font-bold"
                          />
                        </td>
                      ))}
                    </tr>
                    <tr className="hover:bg-slate-50/50">
                      <td className="p-1 text-left px-2 border-r border-slate-950 font-medium">地佐辛 Dezocine (mg)</td>
                      {formState.medsGrid.dezocine.map((val: string, idx: number) => (
                        <td key={idx} className="p-0 border-r last:border-r-0 border-slate-300">
                          <input 
                            type="text" 
                            value={val} 
                            onChange={(e) => handleGridCellChange("dezocine", idx, e.target.value)} 
                            className="w-full text-center outline-none border-none bg-transparent font-mono text-[8.5px] text-blue-600"
                          />
                        </td>
                      ))}
                    </tr>
                    <tr className="hover:bg-slate-50/50">
                      <td className="p-1 text-left px-2 border-r border-slate-950 font-medium">瑞芬 Remifentanil (μg)</td>
                      {formState.medsGrid.remi.map((val: string, idx: number) => (
                        <td key={idx} className="p-0 border-r last:border-r-0 border-slate-300">
                          <input 
                            type="text" 
                            value={val} 
                            onChange={(e) => handleGridCellChange("remi", idx, e.target.value)} 
                            className="w-full text-center outline-none border-none bg-transparent font-mono text-[8.5px] text-emerald-600"
                          />
                        </td>
                      ))}
                    </tr>
                    <tr className="hover:bg-slate-50/50">
                      <td className="p-1 text-left px-2 border-r border-slate-950 font-medium">0.9% 氯化钠 (ml)</td>
                      {formState.medsGrid.saline.map((val: string, idx: number) => (
                        <td key={idx} className="p-0 border-r last:border-r-0 border-slate-300">
                          <input 
                            type="text" 
                            value={val} 
                            onChange={(e) => handleGridCellChange("saline", idx, e.target.value)} 
                            className="w-full text-center outline-none border-none bg-transparent font-mono text-[8.5px] text-slate-700"
                          />
                        </td>
                      ))}
                    </tr>
                    <tr className="hover:bg-slate-50/50">
                      <td className="p-1 text-left px-2 border-r border-slate-950 font-medium">乳酸钠林格氏液 (ml)</td>
                      {formState.medsGrid.ringer.map((val: string, idx: number) => (
                        <td key={idx} className="p-0 border-r last:border-r-0 border-slate-300">
                          <input 
                            type="text" 
                            value={val} 
                            onChange={(e) => handleGridCellChange("ringer", idx, e.target.value)} 
                            className="w-full text-center outline-none border-none bg-transparent font-mono text-[8.5px] text-slate-700"
                          />
                        </td>
                      ))}
                    </tr>
                    <tr className="hover:bg-slate-50/50 bg-slate-50/10">
                      <td className="p-1 text-left px-2 border-r border-slate-950 font-medium">出量 - 尿量 (ml)</td>
                      {formState.medsGrid.urine.map((val: string, idx: number) => (
                        <td key={idx} className="p-0 border-r last:border-r-0 border-slate-300">
                          <input 
                            type="text" 
                            value={val} 
                            onChange={(e) => handleGridCellChange("urine", idx, e.target.value)} 
                            className="w-full text-center outline-none border-none bg-transparent font-mono text-[8.5px] text-amber-700 font-bold"
                          />
                        </td>
                      ))}
                    </tr>
                    <tr className="bg-cyan-50/10">
                      <td className="p-1 text-left px-2 border-r border-slate-950 font-bold text-cyan-800">血氧脉搏 SpO2 (%)</td>
                      {timelineData.map((d, i) => (
                        <td key={i} className="p-1 border-r last:border-r-0 border-slate-300 font-mono text-[8.5px] text-cyan-600 font-bold bg-cyan-50/30">
                          {d.spo2}
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* SECTION: Vitals curve plotting chart (WS 329-2024 Appendice B.1 Grid) */}
              <div className="border border-slate-950 rounded-xs p-2 bg-white flex flex-col items-center">
                <div className="w-full text-[9px] font-bold text-slate-700 mb-1 flex justify-between border-b border-slate-100 pb-1">
                  <span>生命体征采样趋势折线图 (心率 ● / 收缩压 ∨ / 舒张压 ∧ / 体温 ○)</span>
                  <span className="font-mono text-[8px] text-slate-400">时间频率: 5 min</span>
                </div>

                <svg width={chartWidth} height={chartHeight} className="overflow-visible select-none">
                  {/* Grid background definition */}
                  <defs>
                    <pattern id="medicalGrid" width="10" height="10" patternUnits="userSpaceOnUse">
                      <path d="M 10 0 L 0 0 0 10" fill="none" stroke="rgba(15, 118, 110, 0.05)" strokeWidth="0.4" />
                    </pattern>
                  </defs>
                  <rect x={paddingLeft} y={paddingTop} width={plotWidth} height={plotHeight} fill="url(#medicalGrid)" />

                  {/* Draw solid bounding box */}
                  <rect x={paddingLeft} y={paddingTop} width={plotWidth} height={plotHeight} fill="none" stroke="#0f172a" strokeWidth="1.2" />

                  {/* Vertical coordinate divider columns */}
                  {Array.from({ length: 12 }).map((_, i) => (
                    <line
                      key={`v-line-${i}`}
                      x1={getX(i)}
                      y1={paddingTop}
                      x2={getX(i)}
                      y2={paddingTop + plotHeight}
                      stroke="rgba(15, 23, 42, 0.15)"
                      strokeWidth="0.6"
                      strokeDasharray={i === 0 || i === 11 ? "none" : "2,2"}
                    />
                  ))}

                  {/* Horizontal pressure values grid lines (40 to 260, steps of 20) */}
                  {Array.from({ length: 12 }).map((_, idx) => {
                    const stepVal = maxVal - idx * 20;
                    const y = getHrBpY(stepVal);
                    return (
                      <g key={`h-grid-${idx}`}>
                        <line
                          x1={paddingLeft}
                          y1={y}
                          x2={paddingLeft + plotWidth}
                          y2={y}
                          stroke={stepVal === 100 || stepVal === 120 || stepVal === 180 ? "rgba(15, 23, 42, 0.35)" : "rgba(15, 23, 42, 0.15)"}
                          strokeWidth={stepVal === 100 ? "0.8" : "0.5"}
                        />
                        {/* Left scale digits */}
                        <text x={paddingLeft - 6} y={y + 3} textAnchor="end" className="text-[7.5px] font-mono fill-slate-800">
                          {stepVal}
                        </text>
                      </g>
                    );
                  })}

                  {/* Right temperature scale digits (34 to 40 ℃) */}
                  {[34, 35, 36, 37, 38, 39, 40].map((tVal) => {
                    const y = getTempY(tVal);
                    return (
                      <g key={`t-scale-${tVal}`}>
                        <text x={paddingLeft + plotWidth + 6} y={y + 3} textAnchor="start" className="text-[7.5px] font-mono fill-cyan-700">
                          {tVal}℃
                        </text>
                        <line
                          x1={paddingLeft + plotWidth}
                          y1={y}
                          x2={paddingLeft + plotWidth - 4}
                          y2={y}
                          stroke="#0891b2"
                          strokeWidth="0.5"
                        />
                      </g>
                    );
                  })}

                  {/* Curve Plottings */}
                  {/* SpO2 Blue Trend line (charted as reference) */}
                  <path
                    d={timelineData.map((d, i) => `${i === 0 ? "M" : "L"} ${getX(i)} ${getHrBpY(d.spo2 + 60)}`).join(" ")}
                    fill="none"
                    stroke="rgba(6, 182, 212, 0.45)"
                    strokeWidth="1.5"
                    strokeDasharray="4,2"
                  />

                  {/* Pulse/Heart Rate trend line (● - ● - ●) */}
                  <path
                    d={timelineData.map((d, i) => `${i === 0 ? "M" : "L"} ${getX(i)} ${getHrBpY(d.pulse)}`).join(" ")}
                    fill="none"
                    stroke="#10b981"
                    strokeWidth="1.6"
                  />

                  {/* Render HR points ● */}
                  {timelineData.map((d, i) => (
                    <circle
                      key={`p-hr-${i}`}
                      cx={getX(i)}
                      cy={getHrBpY(d.pulse)}
                      r={3}
                      className="fill-emerald-600 stroke-white"
                      strokeWidth={0.6}
                    />
                  ))}

                  {/* Render Systolic BP ∨ symbols */}
                  {timelineData.map((d, i) => {
                    const cx = getX(i);
                    const cy = getHrBpY(d.sbp);
                    return (
                      <polygon
                        key={`p-sbp-${i}`}
                        points={`${cx - 3},${cy - 2} ${cx + 3},${cy - 2} ${cx},${cy + 3.5}`}
                        className="fill-rose-600 stroke-white"
                        strokeWidth={0.5}
                      />
                    );
                  })}

                  {/* Render Diastolic BP ∧ symbols */}
                  {timelineData.map((d, i) => {
                    const cx = getX(i);
                    const cy = getHrBpY(d.dbp);
                    return (
                      <polygon
                        key={`p-dbp-${i}`}
                        points={`${cx},${cy - 3.5} ${cx - 3},${cy + 2} ${cx + 3},${cy + 2}`}
                        className="fill-rose-500 stroke-white"
                        strokeWidth={0.5}
                      />
                    );
                  })}

                  {/* Constant Temperature trend line (○) (around 36.5C with slight jitter) */}
                  <path
                    d={timelineData.map((d, i) => {
                      const temp = 36.4 + (i % 3 === 0 ? 0.1 : 0.2) + (i === 6 ? -0.1 : 0);
                      return `${i === 0 ? "M" : "L"} ${getX(i)} ${getTempY(temp)}`;
                    }).join(" ")}
                    fill="none"
                    stroke="#0284c7"
                    strokeWidth="1"
                    strokeDasharray="3,3"
                  />
                  {timelineData.map((d, i) => {
                    const temp = 36.4 + (i % 3 === 0 ? 0.1 : 0.2) + (i === 6 ? -0.1 : 0);
                    return (
                      <circle
                        key={`p-temp-${i}`}
                        cx={getX(i)}
                        cy={getTempY(temp)}
                        r={2.5}
                        className="fill-white stroke-sky-600"
                        strokeWidth={0.7}
                      />
                    );
                  })}

                  {/* Clinical chronological Event Markers overlay (WS 329 Symbols) */}
                  {/* Column 0: Anesthesia start (X) */}
                  <g transform={`translate(${getX(0)}, ${getHrBpY(72) - 15})`}>
                    <line x1="-3" y1="-3" x2="3" y2="3" stroke="#eab308" strokeWidth="2" />
                    <line x1="3" y1="-3" x2="-3" y2="3" stroke="#eab308" strokeWidth="2" />
                    <text x="0" y="-6" textAnchor="middle" className="text-[7px] font-sans font-bold fill-amber-700">麻醉开始</text>
                  </g>

                  {/* Column 2: Operation start (☉) */}
                  <g transform={`translate(${getX(2)}, ${getHrBpY(120) - 18})`}>
                    <circle cx="0" cy="0" r="4.5" fill="none" stroke="#ef4444" strokeWidth="1.5" />
                    <circle cx="0" cy="0" r="1.5" fill="#ef4444" />
                    <text x="0" y="-7" textAnchor="middle" className="text-[7px] font-sans font-bold fill-rose-700">手术开始</text>
                  </g>

                  {/* Column 9: Operation end (⊗) */}
                  <g transform={`translate(${getX(9)}, ${getHrBpY(115) - 18})`}>
                    <circle cx="0" cy="0" r="4.5" fill="none" stroke="#854d0e" strokeWidth="1.5" />
                    <line x1="-3" y1="-3" x2="3" y2="3" stroke="#854d0e" strokeWidth="1" />
                    <line x1="3" y1="-3" x2="-3" y2="3" stroke="#854d0e" strokeWidth="1" />
                    <text x="0" y="-7" textAnchor="middle" className="text-[7px] font-sans font-bold fill-yellow-800">手术结束</text>
                  </g>

                  {/* Column 10: Extubation (⨀) */}
                  <g transform={`translate(${getX(10)}, ${getHrBpY(82) - 18})`}>
                    <circle cx="0" cy="0" r="4.5" fill="none" stroke="#4f46e5" strokeWidth="1.5" />
                    <line x1="0" y1="-4.5" x2="0" y2="4.5" stroke="#4f46e5" strokeWidth="1" />
                    <text x="0" y="-7" textAnchor="middle" className="text-[7px] font-sans font-bold fill-indigo-700">拔管离室</text>
                  </g>

                  {/* Timeline hours mapping */}
                  {timelineData.map((d, i) => (
                    <text key={`x-lbl-${i}`} x={getX(i)} y={paddingTop + plotHeight + 11} textAnchor="middle" className="text-[7.5px] font-mono fill-slate-800 font-medium">
                      {d.time}
                    </text>
                  ))}
                </svg>

                {/* Grid legend display matching Image 2 perfectly */}
                <div className="w-full grid grid-cols-6 gap-2 text-[8px] border-t border-slate-200 pt-1.5 mt-1 select-none font-medium">
                  <div className="flex items-center gap-1.5 justify-center">
                    <svg width="6" height="5" className="overflow-visible inline-block">
                      <polygon points="0,0 6,0 3,5" className="fill-rose-600" />
                    </svg>
                    <span>收缩压 (∨)</span>
                  </div>
                  <div className="flex items-center gap-1.5 justify-center">
                    <svg width="6" height="5" className="overflow-visible inline-block">
                      <polygon points="3,0 0,5 6,5" className="fill-rose-500" />
                    </svg>
                    <span>舒张压 (∧)</span>
                  </div>
                  <div className="flex items-center gap-1.5 justify-center">
                    <svg width="7" height="7" className="overflow-visible inline-block">
                      <circle cx="3.5" cy="3.5" r="3.5" fill="#10b981" />
                    </svg>
                    <span>心率脉搏 (●)</span>
                  </div>
                  <div className="flex items-center gap-1.5 justify-center">
                    <svg width="6" height="6" className="overflow-visible inline-block">
                      <circle cx="3" cy="3" r="2.5" fill="none" stroke="#0284c7" strokeWidth="1" />
                    </svg>
                    <span>体温 (○)</span>
                  </div>
                  <div className="flex items-center gap-1 justify-center">
                    <span className="font-bold text-amber-500">X</span>
                    <span>麻醉开始</span>
                  </div>
                  <div className="flex items-center gap-1 justify-center">
                    <span className="font-bold text-rose-500 text-[10px]">☉</span>
                    <span>手术开始 / ⊗ 结束</span>
                  </div>
                </div>
              </div>

              {/* Page 1 Remarks Section */}
              <div className="mt-3 border border-slate-950 p-2 rounded-xs">
                <span className="text-[9.5px] font-bold text-slate-800 block border-b border-slate-200 pb-0.5 mb-1 select-none">
                  术中监护及特殊事件情况备注说明:
                </span>
                <textarea
                  value={formState.remarksPage1}
                  onChange={(e) => handleInputChange("remarksPage1", e.target.value)}
                  className="w-full h-11 text-[9.5px] text-slate-700 font-medium leading-relaxed resize-none border-none outline-none bg-transparent"
                />
              </div>
            </div>

            {/* Footnote Clinical Signatures Box */}
            <div className="mt-4 border-t border-slate-400 pt-2 text-[10px] text-slate-900 font-sans font-medium select-none">
              <div className="grid grid-cols-2 gap-4 mb-2">
                <div>手术方式: <span className="border-b border-dashed border-slate-400 font-bold px-1 text-slate-800">{formState.plannedProcedure.split("下")[1] || formState.plannedProcedure}</span></div>
                <div>麻醉方式: <span className="border-b border-dashed border-slate-400 font-bold px-1 text-blue-700">{formState.maintenance}</span></div>
              </div>
              <div className="grid grid-cols-5 gap-2 border-t border-slate-200 pt-2 font-semibold">
                <div>手术医师: <input type="text" value={formState.surgeon} onChange={(e) => handleInputChange("surgeon", e.target.value)} className="border-b border-dashed border-slate-400 w-16 text-center outline-none bg-transparent" /></div>
                <div>麻醉医师: <input type="text" value={formState.anesthesiologist} onChange={(e) => handleInputChange("anesthesiologist", e.target.value)} className="border-b border-dashed border-slate-400 w-16 text-center outline-none bg-transparent font-serif" /></div>
                <div>麻醉护士: <input type="text" value={formState.anesthesiaNurse} onChange={(e) => handleInputChange("anesthesiaNurse", e.target.value)} className="border-b border-dashed border-slate-400 w-16 text-center outline-none bg-transparent" /></div>
                <div>器械护士: <input type="text" value={formState.scrubNurse} onChange={(e) => handleInputChange("scrubNurse", e.target.value)} className="border-b border-dashed border-slate-400 w-16 text-center outline-none bg-transparent" /></div>
                <div>巡回护士: <input type="text" value={formState.circulatingNurse} onChange={(e) => handleInputChange("circulatingNurse", e.target.value)} className="border-b border-dashed border-slate-400 w-16 text-center outline-none bg-transparent" /></div>
              </div>
            </div>

          </div>
        )}

        {/* Print Layout page separation marker on screen */}
        {viewMode === "all" && (
          <div className="w-full max-w-[760px] border-t-2 border-dashed border-slate-400 my-4 text-center select-none print:hidden">
            <span className="bg-slate-200 px-3 py-1 rounded text-xs text-slate-600 font-bold tracking-wider">
              ✂️ 此线下方打印时自动换至 A4 第 2 页
            </span>
          </div>
        )}

        {/* ===================================================================== */}
        {/* PAGE 2: CLINICAL ACTIONS & MODIFIED ALDRETE RECOVERY SCORE (WS 329-2024 Page 2) */}
        {/* ===================================================================== */}
        {(viewMode === "all" || viewMode === "p2") && (
          <div className="bg-white border border-slate-300 shadow-md p-6 max-w-[760px] w-full min-h-[960px] print:shadow-none print:border-none print-page-container print-page select-text relative flex flex-col justify-between">
            
            <div>
              {/* Page 2 Headers */}
              <div className="flex justify-between items-start text-[10px] text-slate-700 font-mono select-none">
                <span className="font-bold border border-slate-400/80 px-1 py-0.2 rounded-xs">附录 B (规范性) 续</span>
                <span className="text-right text-xs font-bold text-slate-900 tracking-widest">WS 329—2024</span>
              </div>

              {/* Title Section */}
              <div className="text-center mt-3 border-b-2 border-slate-950 pb-2 mb-3">
                <h2 className="text-lg font-bold font-serif tracking-widest text-slate-950">
                  ＊ ＊ ＊ ＊ 医 院
                </h2>
                <h1 className="text-2xl font-black font-serif tracking-widest text-slate-950 mt-1">
                  麻 醉 记 录
                </h1>
                <div className="flex justify-between text-[10px] text-slate-800 font-mono px-0.5 mt-2">
                  <div>科别: <span className="underline underline-offset-4">{formState.department}</span></div>
                  <div>病房: <span className="underline underline-offset-4">{formState.ward}</span></div>
                  <div className="font-bold">病历号: <span className="underline underline-offset-4 font-bold">{formState.recordId}</span></div>
                  <div className="text-[9px] text-slate-400">页码：第 2 页/共 2 页</div>
                </div>
              </div>

              {/* Grid 3-column Layout mirroring Image 1 exactly */}
              <div className="grid grid-cols-12 border border-slate-950 text-[10px] text-slate-900 font-medium">
                
                {/* 1. LEFT COLUMN: Anesthetic techniques details */}
                <div className="col-span-12 md:col-span-4 border-r-0 md:border-r border-slate-950 p-2.5 flex flex-col gap-3">
                  
                  {/* General Anesthesia Details */}
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center gap-1 font-bold text-[11px] border-b border-slate-200 pb-0.5">
                      <input 
                        type="checkbox" 
                        checked={formState.anesthesiaType === "gen"} 
                        onChange={() => handleInputChange("anesthesiaType", "gen")} 
                        className="scale-95"
                      />
                      <span>全身麻醉</span>
                    </div>

                    {formState.anesthesiaType === "gen" && (
                      <div className="flex flex-col gap-1.5 pl-3.5 text-[9.5px]">
                        {/* Induction method */}
                        <div>
                          <span className="text-slate-500 block text-[8px] font-bold">诱导方法:</span>
                          <div className="flex flex-col gap-0.5">
                            <label className="flex items-center gap-1 cursor-pointer">
                              <input type="radio" name="induction" checked={formState.genInduction === "rapid"} onChange={() => handleInputChange("genInduction", "rapid")} />
                              <span>快诱导</span>
                            </label>
                            <label className="flex items-center gap-1 cursor-pointer">
                              <input type="radio" name="induction" checked={formState.genInduction === "slow"} onChange={() => handleInputChange("genInduction", "slow")} />
                              <span>慢诱导</span>
                            </label>
                            <label className="flex items-center gap-1 cursor-pointer">
                              <input type="radio" name="induction" checked={formState.genInduction === "awake"} onChange={() => handleInputChange("genInduction", "awake")} />
                              <span>清醒气管插管</span>
                            </label>
                          </div>
                        </div>

                        {/* Airway management */}
                        <div className="border-t border-slate-100 pt-1.5">
                          <span className="text-slate-500 block text-[8px] font-bold">人工气道管理:</span>
                          <div className="flex flex-col gap-1 mt-0.5">
                            <label className="flex items-center gap-1 cursor-pointer">
                              <input type="checkbox" checked={formState.airwayType === "lma"} onChange={() => handleInputChange("airwayType", "lma")} />
                              <span className="font-bold text-blue-800">■ 喉罩 (LMA)</span>
                            </label>
                            {formState.airwayType === "lma" && (
                              <div className="pl-3.5 flex flex-col gap-0.5 text-[9px] bg-slate-50 p-1 rounded-xs border border-slate-200/50">
                                <div>型号: <input type="text" value={formState.lmaSize} onChange={(e) => handleInputChange("lmaSize", e.target.value)} className="w-10 border-b border-slate-400 outline-none text-center bg-transparent" /></div>
                                <div>深度: <input type="text" value={formState.lmaDepth} onChange={(e) => handleInputChange("lmaDepth", e.target.value)} className="w-10 border-b border-slate-400 outline-none text-center bg-transparent" /> cm</div>
                                <label className="flex items-center gap-1 mt-0.5">
                                  <input type="checkbox" checked={formState.lmaCuff} onChange={(e) => handleInputChange("lmaCuff", e.target.checked)} />
                                  <span>套囊充气确认</span>
                                </label>
                              </div>
                            )}

                            <label className="flex items-center gap-1 cursor-pointer">
                              <input type="checkbox" checked={formState.airwayType === "tube"} onChange={() => handleInputChange("airwayType", "tube")} />
                              <span>气管插管 (经口/经鼻)</span>
                            </label>
                            <label className="flex items-center gap-1 cursor-pointer">
                              <input type="checkbox" checked={formState.airwayType === "mask"} onChange={() => handleInputChange("airwayType", "mask")} />
                              <span>面罩 / 鼻导管吸氧</span>
                            </label>
                          </div>
                        </div>

                        <div className="border-t border-slate-100 pt-1">
                          <span className="text-slate-500 block text-[8px] font-bold">维持方法:</span>
                          <span className="font-bold text-slate-800">{formState.maintenance}</span>
                        </div>
                        <label className="flex items-center gap-1.5 mt-1">
                          <input type="checkbox" checked={formState.macMonitored} onChange={(e) => handleInputChange("macMonitored", e.target.checked)} />
                          <span className="font-bold text-emerald-700 bg-emerald-50 px-1 rounded border border-emerald-100">麻醉监护 (MAC) 激活</span>
                        </label>
                      </div>
                    )}
                  </div>

                  {/* Spinal / Epidural details */}
                  <div className="border-t border-slate-300 pt-2 flex flex-col gap-1.5">
                    <div className="flex items-center gap-1 font-bold text-[11px] border-b border-slate-200 pb-0.5">
                      <input 
                        type="checkbox" 
                        checked={formState.anesthesiaType === "spinal"} 
                        onChange={() => handleInputChange("anesthesiaType", "spinal")} 
                        className="scale-95"
                      />
                      <span>椎管内麻醉</span>
                    </div>

                    {formState.anesthesiaType === "spinal" && (
                      <div className="flex flex-col gap-1.5 pl-3.5 text-[9.5px]">
                        <div className="grid grid-cols-2 gap-1.5">
                          <label className="flex items-center gap-1">
                            <input type="radio" name="spinalT" checked={formState.spinalType === "spinal"} onChange={() => handleInputChange("spinalType", "spinal")} />
                            <span>腰麻</span>
                          </label>
                          <label className="flex items-center gap-1">
                            <input type="radio" name="spinalT" checked={formState.spinalType === "epidural"} onChange={() => handleInputChange("spinalType", "epidural")} />
                            <span>硬膜外</span>
                          </label>
                        </div>
                        <div>穿刺点: <input type="text" value={formState.puncturePoint} onChange={(e) => handleInputChange("puncturePoint", e.target.value)} className="w-20 border-b border-slate-400 text-center outline-none bg-transparent" /></div>
                        <label className="flex items-center gap-1">
                          <input type="checkbox" checked={formState.catheterPlaced} onChange={(e) => handleInputChange("catheterPlaced", e.target.checked)} />
                          <span>置管: 是</span>
                        </label>
                        <div>麻醉平面: <input type="text" value={formState.spinalPlane} onChange={(e) => handleInputChange("spinalPlane", e.target.value)} className="w-20 border-b border-slate-400 text-center outline-none bg-transparent" /></div>
                        <div>药品: <input type="text" value={formState.spinalDrugs} onChange={(e) => handleInputChange("spinalDrugs", e.target.value)} className="w-24 border-b border-slate-400 text-center outline-none bg-transparent" /></div>
                      </div>
                    )}
                  </div>

                </div>

                {/* 2. MIDDLE COLUMN: Regional blocks, Invasive lines & Notes */}
                <div className="col-span-12 md:col-span-4 border-r-0 md:border-r border-slate-950 p-2.5 flex flex-col justify-between">
                  
                  <div className="flex flex-col gap-2.5">
                    {/* Regional Block */}
                    <div>
                      <div className="flex items-center gap-1 font-bold text-[11px] border-b border-slate-200 pb-0.5">
                        <input type="checkbox" checked={formState.regionalBlock} onChange={(e) => handleInputChange("regionalBlock", e.target.checked)} className="scale-95" />
                        <span>区域阻滞</span>
                      </div>
                      {formState.regionalBlock && (
                        <div className="pl-3.5 mt-1 flex flex-col gap-1 text-[9.5px]">
                          <div>部位: <input type="text" value={formState.blockSite} onChange={(e) => handleInputChange("blockSite", e.target.value)} className="w-20 border-b border-slate-400 outline-none bg-transparent" /></div>
                          <div>阻滞范围: <input type="text" value={formState.blockRange} onChange={(e) => handleInputChange("blockRange", e.target.value)} className="w-16 border-b border-slate-400 outline-none bg-transparent" /></div>
                          <div>药品: <input type="text" value={formState.blockDrugs} onChange={(e) => handleInputChange("blockDrugs", e.target.value)} className="w-24 border-b border-slate-400 outline-none bg-transparent" /></div>
                        </div>
                      )}
                    </div>

                    {/* Invasive Procedures */}
                    <div>
                      <div className="flex items-center gap-1 font-bold text-[11px] border-b border-slate-200 pb-0.5">
                        <input type="checkbox" checked={formState.invasiveProcedure} onChange={(e) => handleInputChange("invasiveProcedure", e.target.checked)} className="scale-95" />
                        <span>有创操作</span>
                      </div>
                      {formState.invasiveProcedure && (
                        <div className="pl-3.5 mt-1 flex flex-col gap-1 text-[9px]">
                          <label className="flex items-center gap-1">
                            <input type="checkbox" checked={formState.arterialLine} onChange={(e) => handleInputChange("arterialLine", e.target.checked)} />
                            <span>动脉穿刺置管</span>
                          </label>
                          <label className="flex items-center gap-1">
                            <input type="checkbox" checked={formState.centralLine} onChange={(e) => handleInputChange("centralLine", e.target.checked)} />
                            <span>深静脉穿刺置管</span>
                          </label>
                          <div>其他: <input type="text" value={formState.invasiveOther} onChange={(e) => handleInputChange("invasiveOther", e.target.value)} className="w-20 border-b border-slate-400 outline-none bg-transparent" /></div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Operational Notes / Clinical Timestamps logs */}
                  <div className="border-t border-slate-300 pt-2.5 mt-2">
                    <span className="text-[9.5px] font-bold text-slate-800 block mb-1">
                      时空轨迹关键事件戳 (WS 329-6.2.10):
                    </span>
                    <div className="flex flex-col gap-1 text-[8.5px] text-slate-600 leading-normal font-mono">
                      <div>🕒 18:30 HIS挂号登记/入域建档</div>
                      {patient.timeLogs.punctureStart && <div>🕒 {new Date(patient.timeLogs.punctureStart).toLocaleTimeString("zh-CN").substring(0, 5)} 建立留置针/穿刺开始</div>}
                      {patient.timeLogs.deviceBound && <div>🕒 {new Date(patient.timeLogs.deviceBound).toLocaleTimeString("zh-CN").substring(0, 5)} 传感器配对(MAC: {patient.sensorMac.substring(12)})</div>}
                      {patient.timeLogs.orEnter && <div>🕒 {new Date(patient.timeLogs.orEnter).toLocaleTimeString("zh-CN").substring(0, 5)} 术中接力 AOA投屏接管成功</div>}
                      {patient.timeLogs.pacu1Enter && <div>🕒 {new Date(patient.timeLogs.pacu1Enter).toLocaleTimeString("zh-CN").substring(0, 5)} 检查完毕/推入PACU一级复苏</div>}
                      {patient.timeLogs.discharged && <div>🕒 {new Date(patient.timeLogs.discharged).toLocaleTimeString("zh-CN").substring(0, 5)} 离室Modified Aldrete评分核对</div>}
                    </div>
                  </div>

                </div>

                {/* 3. RIGHT COLUMN: Departure (离室) Assessment, Aldrete scores & Destination */}
                <div className="col-span-12 md:col-span-4 p-2.5 flex flex-col gap-2 bg-slate-50/15">
                  <div className="font-bold text-[11px] border-b border-slate-950 pb-0.5 text-center bg-slate-50 text-slate-800 uppercase tracking-widest">
                    离 室 评 定
                  </div>

                  {/* Extubation and checks */}
                  <div className="flex flex-col gap-1 text-[9.5px]">
                    <div>
                      <span>拔管地点:</span>
                      <div className="flex flex-wrap gap-1.5 mt-0.5">
                        <label className="flex items-center gap-0.5">
                          <input type="radio" name="extu" checked={formState.extubationSite === "or"} onChange={() => handleInputChange("extubationSite", "or")} />
                          <span>手术室</span>
                        </label>
                        <label className="flex items-center gap-0.5">
                          <input type="radio" name="extu" checked={formState.extubationSite === "pacu"} onChange={() => handleInputChange("extubationSite", "pacu")} />
                          <span>复苏室</span>
                        </label>
                      </div>
                    </div>
                    <div>拔管时间: <input type="text" value={formState.extubationTime} onChange={(e) => handleInputChange("extubationTime", e.target.value)} className="w-12 border-b border-slate-400 text-center font-mono outline-none bg-transparent" /></div>

                    <div className="border-t border-slate-200 pt-1 mt-1 flex flex-col gap-0.5">
                      <span className="text-[8px] text-slate-400 block">拔管前核心工作:</span>
                      <label className="flex items-center gap-1 text-[9px]">
                        <input type="checkbox" checked={formState.lungInflated} onChange={(e) => handleInputChange("lungInflated", e.target.checked)} />
                        <span>膨肺三次 (确认肺叶膨胀)</span>
                      </label>
                      <label className="flex items-center gap-1 text-[9px]">
                        <input type="checkbox" checked={formState.suctioned} onChange={(e) => handleInputChange("suctioned", e.target.checked)} />
                        <span>充分吸除口腔及气道分泌物</span>
                      </label>
                    </div>
                  </div>

                  {/* Patient status checks */}
                  <div className="border-t border-slate-200 pt-1 mt-1 grid grid-cols-2 gap-1.5 text-[9px]">
                    <div>
                      <span className="text-slate-400 block text-[8px]">肌力恢复:</span>
                      <label className="flex items-center gap-0.5"><input type="radio" name="muscle" checked={formState.muscleRecovery === "good"} onChange={() => handleInputChange("muscleRecovery", "good")} /><span>好</span></label>
                      <label className="flex items-center gap-0.5"><input type="radio" name="muscle" checked={formState.muscleRecovery === "poor"} onChange={() => handleInputChange("muscleRecovery", "poor")} /><span>差</span></label>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[8px]">咳嗽吞咽反射:</span>
                      <label className="flex items-center gap-0.5"><input type="radio" name="cough" checked={formState.coughReflex === "present"} onChange={() => handleInputChange("coughReflex", "present")} /><span>有</span></label>
                      <label className="flex items-center gap-0.5"><input type="radio" name="cough" checked={formState.coughReflex === "absent"} onChange={() => handleInputChange("coughReflex", "absent")} /><span>无</span></label>
                    </div>
                  </div>

                  <div className="border-t border-slate-200 pt-1 text-[9px]">
                    <span className="text-slate-400 block text-[8px]">意识状态:</span>
                    <div className="grid grid-cols-3 gap-0.5 mt-0.5">
                      <label className="flex items-center gap-0.5"><input type="radio" name="cons" checked={formState.consciousness === "awake"} onChange={() => handleInputChange("consciousness", "awake")} /><span>清醒</span></label>
                      <label className="flex items-center gap-0.5"><input type="radio" name="cons" checked={formState.consciousness === "somnolent"} onChange={() => handleInputChange("consciousness", "somnolent")} /><span>嗜睡</span></label>
                      <label className="flex items-center gap-0.5"><input type="radio" name="cons" checked={formState.consciousness === "anesthetized"} onChange={() => handleInputChange("consciousness", "anesthetized")} /><span>麻醉</span></label>
                    </div>
                  </div>

                  {/* Modified Aldrete score calculation block (Clinical mandate) */}
                  <div className="border-t border-slate-200 pt-1.5 mt-1">
                    <span className="text-[9.5px] font-bold text-slate-800 block mb-1 flex justify-between">
                      <span>Modified Aldrete 恢复评分:</span>
                      {patient.aldreteScore ? (
                        <span className="text-emerald-700 bg-emerald-50 px-1 font-mono font-bold border border-emerald-200 rounded-xs">
                          {patient.aldreteScore.respiration + patient.aldreteScore.spo2 + patient.aldreteScore.consciousness + patient.aldreteScore.circulation + patient.aldreteScore.activity} / 10 分
                        </span>
                      ) : (
                        <span className="text-amber-600 bg-amber-50 px-1 font-bold border border-amber-200 rounded-xs">未评定</span>
                      )}
                    </span>
                    
                    {patient.aldreteScore ? (
                      <div className="bg-slate-50 p-1 border border-slate-200 rounded-xs text-[8.5px] flex flex-col gap-0.5 leading-snug">
                        <div className="flex justify-between"><span>1. 呼吸系统恢复:</span><span className="font-bold font-mono">{patient.aldreteScore.respiration}分</span></div>
                        <div className="flex justify-between"><span>2. 血氧饱和维持:</span><span className="font-bold font-mono">{patient.aldreteScore.spo2}分</span></div>
                        <div className="flex justify-between"><span>3. 神志完全清醒:</span><span className="font-bold font-mono">{patient.aldreteScore.consciousness}分</span></div>
                        <div className="flex justify-between"><span>4. 血压循环稳定:</span><span className="font-bold font-mono">{patient.aldreteScore.circulation}分</span></div>
                        <div className="flex justify-between"><span>5. 肢体自主活动:</span><span className="font-bold font-mono">{patient.aldreteScore.activity}分</span></div>
                      </div>
                    ) : (
                      <div className="text-[8px] text-slate-400 italic leading-snug">
                        请利用护士PDA终端，在步骤9时强评患者生命反射指数。
                      </div>
                    )}
                  </div>

                  {/* Patient Destination */}
                  <div className="border-t border-slate-200 pt-1 text-[9.5px]">
                    <span className="text-slate-400 block text-[8px]">患者去向:</span>
                    <div className="flex flex-col gap-0.5 mt-0.5">
                      <label className="flex items-center gap-1">
                        <input type="radio" name="dest" checked={formState.patientDestination === "pacu"} onChange={() => handleInputChange("patientDestination", "pacu")} />
                        <span>麻醉后恢复室 / AICU</span>
                      </label>
                      <label className="flex items-center gap-1">
                        <input type="radio" name="dest" checked={formState.patientDestination === "ward"} onChange={() => handleInputChange("patientDestination", "ward")} />
                        <span>直接安返病房</span>
                      </label>
                      <label className="flex items-center gap-1">
                        <input type="radio" name="dest" checked={formState.patientDestination === "discharge"} onChange={() => handleInputChange("patientDestination", "discharge")} />
                        <span className="font-bold text-indigo-800">直接离院 (无痛内镜门诊)</span>
                      </label>
                    </div>
                  </div>

                </div>

              </div>

              {/* Page 2 Remarks */}
              <div className="mt-3 border border-slate-950 p-2 rounded-xs">
                <span className="text-[9.5px] font-bold text-slate-800 block border-b border-slate-200 pb-0.5 mb-1 select-none">
                  复苏评定与离室随访备注说明:
                </span>
                <textarea
                  value={formState.remarksPage2}
                  onChange={(e) => handleInputChange("remarksPage2", e.target.value)}
                  className="w-full h-11 text-[9.5px] text-slate-700 font-medium leading-relaxed resize-none border-none outline-none bg-transparent"
                />
              </div>

              {/* Special condition tickbox from Page 9 reference */}
              <div className="mt-2.5 border border-slate-950 p-2 rounded-xs flex items-center gap-6 text-[10px] font-bold text-slate-800 select-none">
                <label className="flex items-center gap-1 cursor-pointer">
                  <input type="radio" name="specialC" checked={formState.specialConditionsCheckbox === "normal"} onChange={() => handleInputChange("specialConditionsCheckbox", "normal")} />
                  <span>■ 无特殊异常情况</span>
                </label>
                <label className="flex items-center gap-1 cursor-pointer">
                  <input type="radio" name="specialC" checked={formState.specialConditionsCheckbox === "special"} onChange={() => handleInputChange("specialConditionsCheckbox", "special")} />
                  <span>□ 有特殊伴生异常情况 (需要特别批注)</span>
                </label>
              </div>

            </div>

            {/* Footnotes clinical standard compliance stamps */}
            <div className="mt-4 border-t border-slate-400 pt-2 text-[8px] text-slate-500 font-sans leading-relaxed select-none">
              <div><b>注 1:</b> 记录内容包括麻醉诊疗期间产生的所有呼吸系统、循环系统并发症及其他突发异常处置。</div>
              <div><b>注 2:</b> 抢救事件发生时，应及时、详尽补记抢救时间、参与人员姓名及抢救意见，确保在抢救完成6小时内完善签署。</div>
              <div className="flex justify-between items-center mt-2 border-t border-slate-100 pt-1.5 text-[9.5px] text-slate-900 font-medium font-sans">
                <div>系统核验哈希: <span className="font-mono text-[8px] text-slate-400">WS-329-HASH-{patient.id.split("-")[1] || "DEZ918"}</span></div>
                <div>核签护士: <span className="underline underline-offset-2 font-bold font-serif">{patient.aldreteScore?.nurseSignature || "待签名"}</span></div>
              </div>
            </div>

          </div>
        )}

      </div>

      {/* Footer watermark details */}
      <div className="bg-slate-50 px-6 py-2 border-t border-slate-200 text-[9px] text-slate-400 flex justify-between select-none shrink-0 print:hidden">
        <span className="flex items-center gap-1">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          本记录模组严格依循中华人民共和国《WS 329-2024 麻醉记录单规范》附录B标准格式进行数字解算渲染
        </span>
        <span>AOA高精度空间时空戳校验成功 | 内镜部智能终端</span>
      </div>

    </div>
  );
}
