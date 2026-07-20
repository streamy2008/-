/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from "react";
import { 
  Activity, Shield, ListCollapse, Play, AlertTriangle, 
  HelpCircle, Sliders, Heart, CheckCircle, Flame
} from "lucide-react";
import { Patient, Gender, AsaGrade, FastingStatus, TelemetryEvent } from "./types";
import AoaMap from "./components/AoaMap";
import PdaTerminal from "./components/PdaTerminal";
import Monitor55Inch from "./components/Monitor55Inch";
import Monitor24Inch from "./components/Monitor24Inch";
import AnesthesiaRecord from "./components/AnesthesiaRecord";

// Initial mock patients bootstrap
const INITIAL_PATIENTS: Patient[] = [
  {
    id: "ID-740192",
    name: "徐淑华",
    gender: Gender.Female,
    age: 51,
    height: 162,
    weight: 56,
    bmi: 21.3,
    asaGrade: AsaGrade.II,
    fastingStatus: FastingStatus.Fasted,
    specialConditions: "无特殊合并症。青霉素皮试阴性。",
    currentStage: 5, // Area 5: Outer Waiting & BLE binding
    sensorMac: "B4:72:9F:CA:83:1E",
    sensorBattery: 95,
    sensorConnected: true,
    timeLogs: {
      registration: "2026-07-16T18:30:00Z",
      anesthesiaAssess: "2026-07-16T18:40:00Z",
      waitingLobby: "2026-07-16T18:42:00Z",
      punctureStart: "2026-07-16T18:55:00Z",
      deviceBound: "2026-07-16T19:02:00Z"
    },
    vitalsHistory: [
      { time: "19:02", pulse: 74, sbp: 118, dbp: 75, spo2: 98 },
      { time: "19:07", pulse: 76, sbp: 121, dbp: 78, spo2: 99 }
    ],
    currentVitals: {
      hr: 76,
      spo2: 99,
      resp: 16,
      sbp: 121,
      dbp: 78
    },
    isLocked: false
  },
  {
    id: "ID-309481",
    name: "陈国强",
    gender: Gender.Male,
    age: 46,
    height: 175,
    weight: 74,
    bmi: 24.2,
    asaGrade: AsaGrade.I,
    fastingStatus: FastingStatus.Fasted,
    specialConditions: "一般健康状况良好。",
    currentStage: 6, // Area 6: In Surgery
    sensorMac: "B4:72:9F:CA:83:8A",
    sensorBattery: 90,
    sensorConnected: true,
    timeLogs: {
      registration: "2026-07-16T18:05:00Z",
      anesthesiaAssess: "2026-07-16T18:15:00Z",
      waitingLobby: "2026-07-16T18:20:00Z",
      punctureStart: "2026-07-16T18:35:00Z",
      deviceBound: "2026-07-16T18:40:00Z",
      orEnter: "2026-07-16T18:50:00Z"
    },
    vitalsHistory: [
      { time: "18:40", pulse: 78, sbp: 122, dbp: 80, spo2: 98 },
      { time: "18:45", pulse: 80, sbp: 120, dbp: 78, spo2: 99 },
      { time: "18:50", pulse: 75, sbp: 115, dbp: 75, spo2: 97 },
      { time: "18:55", pulse: 76, sbp: 118, dbp: 76, spo2: 98 },
      { time: "19:00", pulse: 74, sbp: 116, dbp: 74, spo2: 98 },
      { time: "19:05", pulse: 73, sbp: 114, dbp: 73, spo2: 99 }
    ],
    currentVitals: {
      hr: 73,
      spo2: 99,
      resp: 15,
      sbp: 114,
      dbp: 73
    },
    isLocked: false
  }
];

// Technical specifications hardware details
const HARDWARE_SPECS = [
  { label: "可穿戴传感器 (医疗级 BLE 5.1+)", desc: "单/三导ECG心电、SpO2指夹、无创NIBP袖带，电池续航不低于12小时" },
  { label: "蓝牙 AOA 定位阵列天线 (AP)", desc: "部署于操作间、PACU天花板，单基站覆盖半径8-10米，精准定位" },
  { label: "边缘计算网关 (Broker)", desc: "Screen Casting Broker, AOA坐标实时解算并无线分配合规多级投屏" }
];

export default function App() {
  const [patients, setPatients] = useState<Patient[]>(INITIAL_PATIENTS);
  const [setSelectedPatientIdState, setSelectedPatientId] = useState<string>("X-NONE");
  
  // Tab control for workspace displays:
  // "pda" | "m55_area5" | "m55_area8" | "m24_area6" | "m24_area7" | "record"
  const [activeTab, setActiveTab] = useState<string>("pda");

  // System telemetry log events
  const [telemetryLogs, setTelemetryLogs] = useState<TelemetryEvent[]>([
    { id: "L-01", timestamp: new Date(Date.now() - 50000).toISOString(), type: "AOA_POSITION", message: "AOA服务初始化完成，基站 AP-01 至 AP-06 连接就绪", latencyMs: 45 },
    { id: "L-02", timestamp: new Date(Date.now() - 40000).toISOString(), type: "SENSOR_BIND", message: "徐淑华 已绑定传感器(B4:72:9F:CA:83:1E)，产生第一组基线体征" },
    { id: "L-03", timestamp: new Date(Date.now() - 35000).toISOString(), type: "CAST_TRIGGER", message: "投屏事件：徐淑华 位于【区域5】外等候区，自动投屏至55寸监测大屏", latencyMs: 380 },
    { id: "L-04", timestamp: new Date(Date.now() - 25000).toISOString(), type: "AOA_POSITION", message: "AOA网关检测到 陈国强 跨区域移动进入操作间(区域6)，防抖滤波器过滤交界瞬态" },
    { id: "L-05", timestamp: new Date(Date.now() - 22000).toISOString(), type: "CAST_TRIGGER", message: "投屏事件：区域5取消 陈国强 显示，操作间24寸 bedside 显示器独占接管并全屏渲染", latencyMs: 410 }
  ]);

  // Vitals simulation controller sliders state
  const [vitalsSliders, setVitalsSliders] = useState({
    hr: 75,
    spo2: 98,
    resp: 16,
    bpPreset: "normal" // "normal" | "hypo" | "hyper"
  });

  // Autopilot simulation interval ID
  const [isAutopilot, setIsAutopilot] = useState<boolean>(false);

  // Set selected patient from UI lists
  const selectedPatient = patients.find(p => p.id === setSelectedPatientIdState) || null;

  // Set default patient on first load
  useEffect(() => {
    if (patients.length > 0 && setSelectedPatientIdState === "X-NONE") {
      setSelectedPatientId(patients[0].id);
    }
  }, [patients, setSelectedPatientIdState]);

  // Background vitals drift simulation (keeps waves moving and values fluctuating slightly)
  useEffect(() => {
    const timer = setInterval(() => {
      setPatients(prevPatients => 
        prevPatients.map(pat => {
          if (!pat.sensorConnected || pat.currentStage === 9) return pat;
          
          // Minor random fluctuation
          const hrDelta = (Math.random() > 0.5 ? 1 : -1) * (Math.random() > 0.8 ? 1 : 0);
          const spo2Delta = Math.random() > 0.95 ? (pat.currentVitals.spo2 < 100 ? 1 : 0) : (Math.random() > 0.95 ? -1 : 0);
          const respDelta = (Math.random() > 0.5 ? 1 : -1) * (Math.random() > 0.9 ? 1 : 0);

          const updatedHr = Math.max(50, Math.min(140, pat.currentVitals.hr + hrDelta));
          const updatedSpo2 = Math.max(85, Math.min(100, pat.currentVitals.spo2 + spo2Delta));
          const updatedResp = Math.max(10, Math.min(24, pat.currentVitals.resp + respDelta));

          return {
            ...pat,
            currentVitals: {
              ...pat.currentVitals,
              hr: updatedHr,
              spo2: updatedSpo2,
              resp: updatedResp
            }
          };
        })
      );
    }, 3000);

    return () => clearInterval(timer);
  }, []);

  // Sync Slider values with currently selected patient
  useEffect(() => {
    if (selectedPatient && selectedPatient.sensorConnected) {
      setPatients(prev => prev.map(p => {
        if (p.id === selectedPatient.id) {
          let sbpVal = vitalsSliders.bpPreset === "normal" ? 120 : vitalsSliders.bpPreset === "hypo" ? 85 : 155;
          let dbpVal = vitalsSliders.bpPreset === "normal" ? 80 : vitalsSliders.bpPreset === "hypo" ? 55 : 95;
          
          // Add small jitter
          sbpVal += Math.floor(Math.random() * 3) - 1;
          dbpVal += Math.floor(Math.random() * 2) - 1;

          return {
            ...p,
            currentVitals: {
              hr: vitalsSliders.hr,
              spo2: vitalsSliders.spo2,
              resp: vitalsSliders.resp,
              sbp: sbpVal,
              dbp: dbpVal
            }
          };
        }
        return p;
      }));
    }
  }, [vitalsSliders]);

  // Handle logging telemetry events dynamically
  const handleLogEvent = (
    type: "AOA_POSITION" | "CAST_TRIGGER" | "SENSOR_BIND" | "FILTER_DAMP" | "COMPLIANCE_ALARM", 
    message: string, 
    latencyMs?: number
  ) => {
    const newLog: TelemetryEvent = {
      id: "L-" + Math.floor(1000 + Math.random() * 9000),
      timestamp: new Date().toISOString(),
      type,
      message,
      latencyMs
    };
    setTelemetryLogs(prev => [newLog, ...prev]);
  };

  // Keep refs of selectedPatient and handleAdvanceStage updated to avoid resetting the autopilot timer or closing over stale state
  const selectedPatientRef = useRef<Patient | null>(null);
  useEffect(() => {
    selectedPatientRef.current = selectedPatient;
  }, [selectedPatient]);

  const handleAdvanceStageRef = useRef<((pat: Patient, nextStage: number) => void) | null>(null);

  // Autopilot loop advancing stages periodically to show seamless screen handoffs!
  useEffect(() => {
    if (!isAutopilot) return;

    const autopilotTimer = setInterval(() => {
      const pat = selectedPatientRef.current;
      if (!pat) return;

      const currStage = pat.currentStage;
      if (currStage < 10) {
        if (handleAdvanceStageRef.current) {
          handleAdvanceStageRef.current(pat, currStage + 1);
        }
      } else {
        setIsAutopilot(false);
        handleLogEvent("COMPLIANCE_ALARM", `仿真播放结束：患者 ${pat.name} 已经达到最终的步骤10检查结束。`);
      }
    }, 4000); // Advance stage every 4 seconds in autopilot mode

    return () => clearInterval(autopilotTimer);
  }, [isAutopilot]);

  // Stage transitions handoffs logic
  const handleAdvanceStage = (pat: Patient, nextStage: number) => {
    // Generate precise times for compliance WS 329
    const nowStr = new Date().toISOString();
    const updatedTimeLogs = { ...pat.timeLogs };
    let finalConnected = pat.sensorConnected;
    let finalMac = pat.sensorMac;

    if (nextStage === 1) {
      handleLogEvent("AOA_POSITION", `AOA检测：患者 ${pat.name} 移动至登记等候区(区域1)`);
      setActiveTab("pda");
    } else if (nextStage === 2) {
      updatedTimeLogs.anesthesiaAssess = nowStr;
      handleLogEvent("AOA_POSITION", `AOA检测：患者 ${pat.name} 移动至评估室(区域2)`);
      setActiveTab("pda");
    } else if (nextStage === 3) {
      updatedTimeLogs.waitingLobby = nowStr;
      handleLogEvent("AOA_POSITION", `AOA检测：患者 ${pat.name} 移动至候诊大厅(区域3)`);
      setActiveTab("pda");
    } else if (nextStage === 4) {
      updatedTimeLogs.punctureStart = nowStr;
      handleLogEvent("AOA_POSITION", `AOA定位：患者 ${pat.name} 跨AP进入穿刺准备区(区域4)，标记[穿刺准备开始]时间戳`, 140);
      setActiveTab("pda");
    } else if (nextStage === 5) {
      // Prompt MAC binding if not bound
      if (!pat.sensorMac) {
        finalMac = `B4:72:9F:CA:83:${Math.floor(10 + Math.random() * 89)}`;
        finalConnected = true;
        updatedTimeLogs.deviceBound = nowStr;
        handleLogEvent("SENSOR_BIND", `PDA自动生成绑定：检测到患者进入操作外等候区，护士扫描二维码绑定传感器MAC: ${finalMac}`);
      }
      updatedTimeLogs.deviceBound = nowStr;
      handleLogEvent("AOA_POSITION", `AOA定位：患者 ${pat.name} 位于区域5等候，信号稳定，强度 -51dBm`);
      handleLogEvent("CAST_TRIGGER", `AOA漫游：自动将该患者监护数据投送至【区域5】55寸多床位监控大屏上。`, 320);
      setActiveTab("m55_area5"); // auto toggle screen view
    } else if (nextStage === 6) {
      updatedTimeLogs.orEnter = nowStr;
      handleLogEvent("AOA_POSITION", `AOA定位：患者 ${pat.name} 离开区域5，推入【操作手术间(区域6)】。触发基站 AP-03 -> AP-04 漫游`, 190);
      handleLogEvent("CAST_TRIGGER", `AOA投屏：【区域5】55寸监控大屏取消显示；【操作间24寸 bedside 显示器】强制独占全屏接力显示数据。`, 440);
      setActiveTab("m24_area6");
    } else if (nextStage === 7) {
      updatedTimeLogs.pacu1Enter = nowStr;
      handleLogEvent("AOA_POSITION", `AOA定位：手术完毕，患者转运至PACU复苏室12号床位(区域7)。基站 AP-05 高精度识别判定处于12号床而非13号床`, 80);
      handleLogEvent("CAST_TRIGGER", `AOA投屏：【操作间24寸】屏幕清空，【PACU 12号床上方24寸监护显示器】无线接力接管体征波形。`, 460);
      setActiveTab("m24_area7");
    } else if (nextStage === 8) {
      updatedTimeLogs.pacu2Enter = nowStr;
      handleLogEvent("AOA_POSITION", `AOA定位：患者初步苏醒，下床转座至二级PACU 14号座位(区域8)。`);
      handleLogEvent("CAST_TRIGGER", `AOA投屏：【12号床屏幕】清除数据，【二级PACU 55寸多宫格大屏】在14号座位槽位中进行宫格体征渲染。`, 390);
      setActiveTab("m55_area8");
    } else if (nextStage === 9) {
      // To reach 9, we need Aldrete score populating first.
      handleLogEvent("COMPLIANCE_ALARM", `合规核实：患者 ${pat.name} 准备办理出院。触发系统核对推送：PDA端强制限时Modified Aldrete出室评分！`);
      setActiveTab("pda");
    } else if (nextStage === 10) {
      handleLogEvent("AOA_POSITION", `AOA定位：检查结束。患者 ${pat.name} 离开二级PACU，转运入【区域10 (检查结束)】并自动生成电子麻醉记录单。`);
      setActiveTab("record");
    }

    // Save sampling points history on stage changes to populate the grid chart WS 329-2024
    const newHistoryPoint = {
      time: new Date().toLocaleTimeString("zh-CN").substring(0, 5),
      pulse: pat.currentVitals.hr,
      sbp: pat.currentVitals.sbp,
      dbp: pat.currentVitals.dbp,
      spo2: pat.currentVitals.spo2
    };

    setPatients(prevPatients => prevPatients.map(p => {
      if (p.id === pat.id) {
        return {
          ...p,
          currentStage: nextStage,
          sensorConnected: finalConnected,
          sensorMac: finalMac,
          timeLogs: updatedTimeLogs,
          vitalsHistory: [...p.vitalsHistory, newHistoryPoint]
        };
      }
      return p;
    }));
  };

  // Sync reference to current handleAdvanceStage on render
  handleAdvanceStageRef.current = handleAdvanceStage;

  // Add a brand new patient
  const handleAddNewPatient = (newPat: Patient) => {
    setPatients(prev => [...prev, newPat]);
    setSelectedPatientId(newPat.id);
  };

  // Update details of selected patient
  const handleUpdatePatient = (updated: Patient) => {
    setPatients(prev => prev.map(p => p.id === updated.id ? updated : p));
  };

  // Lock signature record
  const handleLockRecord = () => {
    if (!selectedPatient) return;
    const updated: Patient = {
      ...selectedPatient,
      isLocked: true
    };
    handleUpdatePatient(updated);
    handleLogEvent("SENSOR_BIND", `数据锁定：电子麻醉记录单已正式审核提交、护签名核销锁定，无法任意改动。符合WS 329。`);
  };

  // Real-time Dashboard variables for current area distribution ratio and waiting times
  const totalPatients = patients.length || 1;
  const prepCount = patients.filter(p => p.currentStage <= 5).length;
  const orCount = patients.filter(p => p.currentStage === 6).length;
  const pacu1Count = patients.filter(p => p.currentStage === 7).length;
  const pacu2Count = patients.filter(p => p.currentStage === 8).length;
  const endCount = patients.filter(p => p.currentStage >= 9).length;

  // Ratios based on currently simulated patients
  const prepRatio = prepCount / totalPatients;
  const orRatio = orCount / totalPatients;
  const pacu1Ratio = pacu1Count / totalPatients;
  const pacu2Ratio = pacu2Count / totalPatients;
  const endRatio = endCount / totalPatients;

  // Target specifications
  const totalOnlineTarget = 48;
  const orCapacity = 15;
  const pacu1Capacity = 17;
  const pacu2Capacity = 16;

  // Scale counts to sum to 48
  let orCountScaled = Math.round(orRatio * totalOnlineTarget);
  let pacu1CountScaled = Math.round(pacu1Ratio * totalOnlineTarget);
  let pacu2CountScaled = Math.round(pacu2Ratio * totalOnlineTarget);
  let endCountScaled = Math.round(endRatio * totalOnlineTarget);

  // Cap physical values according to real bounds
  orCountScaled = Math.min(orCapacity, orCountScaled);
  pacu1CountScaled = Math.min(pacu1Capacity, pacu1CountScaled);
  pacu2CountScaled = Math.min(pacu2Capacity, pacu2CountScaled);

  // Remainder assigned to wait/prep area
  let prepCountScaled = totalOnlineTarget - orCountScaled - pacu1CountScaled - pacu2CountScaled - endCountScaled;
  if (prepCountScaled < 0) {
    endCountScaled = Math.max(0, endCountScaled + prepCountScaled);
    prepCountScaled = 0;
  }

  // Calculate scaled percentages for progress bar rendering
  const prepPctScaled = (prepCountScaled / totalOnlineTarget) * 100;
  const orPctScaled = (orCountScaled / totalOnlineTarget) * 100;
  const pacu1PctScaled = (pacu1CountScaled / totalOnlineTarget) * 100;
  const pacu2PctScaled = (pacu2CountScaled / totalOnlineTarget) * 100;
  const endPctScaled = (endCountScaled / totalOnlineTarget) * 100;

  const getAverageWaitingTime = (stageGroup: "prep" | "or" | "pacu1" | "pacu2" | "end") => {
    let baseMin = 12.4;
    let count = 0;
    if (stageGroup === "prep") {
      baseMin = 12.4;
      count = prepCount;
    } else if (stageGroup === "or") {
      baseMin = 28.5;
      count = orCount;
    } else if (stageGroup === "pacu1") {
      baseMin = 35.2;
      count = pacu1Count;
    } else if (stageGroup === "pacu2") {
      baseMin = 24.8;
      count = pacu2Count;
    } else {
      baseMin = 5.0;
      count = endCount;
    }

    const congestionFactor = count > 0 ? 1 + (count - 1) * 0.12 : 1.0;
    const seconds = new Date().getSeconds();
    const fluctuation = Math.sin(seconds * 0.1) * 0.2;

    const finalMin = Math.max(1.5, baseMin * congestionFactor + fluctuation);
    return `${finalMin.toFixed(1)}m`;
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans selection:bg-blue-500 selection:text-white">
      
      {/* Dynamic Top Clinic Operations Control Center Header Bar */}
      <header className="bg-white border-b border-slate-200 py-4 shadow-sm select-none">
        <div className="max-w-7xl mx-auto w-full px-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <div className="relative">
                <span className="absolute -inset-1 rounded-full bg-emerald-500/20 blur-sm animate-pulse" />
                <div className="w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white animate-pulse" />
              </div>
              <h1 className="text-base sm:text-lg font-bold tracking-tight font-sans flex items-center gap-2 text-slate-900">
                智能内镜中心患者监护全流程追踪系统
                <span className="text-[10px] font-sans px-2.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200/55 font-semibold">
                  WS 329-2024 合规系统
                </span>
              </h1>
            </div>
          </div>
        </div>
      </header>

      {/* Main Workspace grid layout */}
      <main className="flex-1 grid grid-cols-12 gap-5 p-5 max-w-7xl mx-auto w-full items-stretch">
        
        {/* Real-time Monitoring Overview Dashboard (Dedicated separate row aligned with main layout) */}
        <div className="col-span-12 flex flex-wrap lg:flex-nowrap items-center gap-5 bg-slate-50 border border-slate-200 rounded-xl p-3 px-4 shadow-sm w-full">
          {/* Dashboard Header */}
          <div className="flex flex-col border-r border-slate-200 pr-4 min-w-[100px] justify-center">
            <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" />
              实时监护概览
            </span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-xl font-mono font-black text-slate-800 leading-none">48</span>
              <span className="text-[10px] text-slate-500 font-bold">人在线</span>
            </div>
          </div>

          {/* Area Distribution Segments */}
          <div className="flex flex-col gap-1.5 flex-1 min-w-[280px]">
            <div className="flex justify-between items-center text-[9px] font-medium text-slate-500 leading-none">
              <span>区域分布与容量监测</span>
              <span className="font-mono text-[8px] text-slate-400">实时饱和度监控</span>
            </div>
            
            {/* Multi-segment Segmented Progress Bar */}
            <div className="h-1.5 rounded-full overflow-hidden flex bg-slate-100 w-full min-w-[180px]">
              <div 
                className="bg-blue-500 h-full transition-all duration-500 ease-out" 
                style={{ width: `${prepPctScaled}%` }} 
                title={`等候流转: ${prepCountScaled}人`} 
              />
              <div 
                className="bg-purple-500 h-full transition-all duration-500 ease-out" 
                style={{ width: `${orPctScaled}%` }} 
                title={`手术操作: ${orCountScaled}/${orCapacity}间`} 
              />
              <div 
                className="bg-rose-500 h-full transition-all duration-500 ease-out" 
                style={{ width: `${pacu1PctScaled}%` }} 
                title={`一级复苏: ${pacu1CountScaled}/${pacu1Capacity}床`} 
              />
              <div 
                className="bg-orange-400 h-full transition-all duration-500 ease-out" 
                style={{ width: `${pacu2PctScaled}%` }} 
                title={`二级复苏: ${pacu2CountScaled}/${pacu2Capacity}床`} 
              />
              <div 
                className="bg-emerald-500 h-full transition-all duration-500 ease-out" 
                style={{ width: `${endPctScaled}%` }} 
                title={`检查结束: ${endCountScaled}人`} 
              />
            </div>

            {/* Mini Legend labels */}
            <div className="flex flex-wrap gap-x-2.5 gap-y-1 text-[8.5px] font-mono leading-none">
              <span className="text-blue-600 font-bold">● 等候 {prepCountScaled}人</span>
              <span className="text-purple-600 font-bold">● 手术 {orCountScaled}/{orCapacity}间</span>
              <span className="text-rose-600 font-bold">● 一级复苏 {pacu1CountScaled}/{pacu1Capacity}床</span>
              <span className="text-orange-600 font-bold">● 二级复苏 {pacu2CountScaled}/{pacu2Capacity}床</span>
              <span className="text-emerald-600 font-bold">● 归档 {endCountScaled}人</span>
            </div>
          </div>

          <div className="hidden lg:block w-px h-10 bg-slate-200" />

          {/* Average Wait Times Grid */}
          <div className="flex flex-col gap-1 min-w-[200px]">
            <div className="text-[9px] font-medium text-slate-500 leading-none">
              区域平均等待时长 (实时)
            </div>
            <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[9px] leading-tight">
              <div className="flex items-center justify-between gap-1 text-slate-600">
                <span className="flex items-center gap-0.5"><span className="w-1 h-1 rounded-full bg-blue-500" />等候区:</span>
                <span className="font-mono font-bold text-blue-600 bg-blue-50/50 px-1 py-0.2 rounded border border-blue-100/50">{getAverageWaitingTime("prep")}</span>
              </div>
              <div className="flex items-center justify-between gap-1 text-slate-600">
                <span className="flex items-center gap-0.5"><span className="w-1 h-1 rounded-full bg-purple-500" />手术室:</span>
                <span className="font-mono font-bold text-purple-600 bg-purple-50/50 px-1 py-0.2 rounded border border-purple-100/50">{getAverageWaitingTime("or")}</span>
              </div>
              <div className="flex items-center justify-between gap-1 text-slate-600">
                <span className="flex items-center gap-0.5"><span className="w-1 h-1 rounded-full bg-rose-500" />一级复苏:</span>
                <span className="font-mono font-bold text-rose-600 bg-rose-50/50 px-1 py-0.2 rounded border border-rose-100/50">{getAverageWaitingTime("pacu1")}</span>
              </div>
              <div className="flex items-center justify-between gap-1 text-slate-600">
                <span className="flex items-center gap-0.5"><span className="w-1 h-1 rounded-full bg-orange-400" />二级复苏:</span>
                <span className="font-mono font-bold text-orange-600 bg-orange-50/50 px-1 py-0.2 rounded border border-orange-100/50">{getAverageWaitingTime("pacu2")}</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Left Column (3 cols): Patients tracker rail & Hardware Topology specs */}
        <section className="col-span-12 lg:col-span-3 flex flex-col gap-4">
          
          {/* Active Track List container */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col gap-3.5 shadow-sm">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider font-sans border-b border-slate-150 pb-2 flex justify-between items-center">
              <span>内镜患者追踪序列 ({patients.length})</span>
              <span className="text-[10px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded border border-blue-200/50 font-semibold font-sans">
                HIS Sync
              </span>
            </h3>

            {/* Patients list box */}
            <div className="flex flex-col gap-2 max-h-[220px] overflow-y-auto custom-scrollbar">
              {patients.length === 0 ? (
                <div className="text-slate-400 italic text-center py-4 text-xs">暂无在床患者记录。</div>
              ) : (
                patients.map(pat => {
                  const isSelected = setSelectedPatientIdState === pat.id;
                  return (
                    <div
                      key={pat.id}
                      onClick={() => {
                        setSelectedPatientId(pat.id);
                        // Autotoggle tab logically depending on patient stage if appropriate
                        if (pat.currentStage === 5) setActiveTab("m55_area5");
                        else if (pat.currentStage === 6) setActiveTab("m24_area6");
                        else if (pat.currentStage === 7) setActiveTab("m24_area7");
                        else if (pat.currentStage === 8) setActiveTab("m55_area8");
                        else if (pat.currentStage === 9 && !pat.isLocked) setActiveTab("pda");
                        else if (pat.currentStage >= 9) setActiveTab("record");
                      }}
                      className={`p-3 rounded-lg border transition-all cursor-pointer flex flex-col gap-1.5 ${
                        isSelected 
                          ? "bg-emerald-50/15 border-emerald-500 shadow-sm" 
                          : "bg-white border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="font-bold text-xs text-slate-800">{pat.name}</span>
                          <span className="text-[10px] text-slate-500 ml-1.5 font-medium">
                            {pat.gender} • {pat.age}岁
                          </span>
                        </div>
                        <span className={`text-[8px] font-sans px-1.5 py-0.2 rounded font-bold ${
                          pat.currentStage >= 9 
                            ? "bg-slate-100 text-slate-500" 
                            : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        }`}>
                          步骤 {pat.currentStage}/10
                        </span>
                      </div>

                      {/* Vitals snapshot mini-badge */}
                      {pat.sensorConnected && pat.currentStage < 9 ? (
                        <div className="flex items-center justify-between text-[9px] font-mono bg-slate-50 p-1 px-1.5 rounded border border-slate-150 shadow-sm">
                          <span className="text-emerald-600 font-bold flex items-center gap-0.5 font-mono">
                            <Heart className="w-2.5 h-2.5 animate-pulse text-rose-500" />
                            {pat.currentVitals.hr}
                          </span>
                          <span className="text-cyan-600 font-bold">O2:{pat.currentVitals.spo2}%</span>
                          <span className="text-amber-600 font-bold">{pat.currentVitals.sbp}/{pat.currentVitals.dbp}</span>
                        </div>
                      ) : (
                        <div className="text-[9px] text-slate-400 italic bg-slate-50/50 p-1 rounded text-center border border-slate-150">
                          {pat.currentStage === 9 ? "监护归档・无传感器" : "未激活可穿戴监护"}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Manual ADD NEW trigger */}
            <button
              onClick={() => setSelectedPatientId("X-NONE")}
              className="text-xs border border-dashed border-slate-200 hover:border-slate-400 text-slate-500 hover:text-slate-700 bg-slate-50 hover:bg-slate-100 py-2 rounded-lg text-center cursor-pointer font-semibold transition-colors mt-1"
            >
              + 登记建档新检查患者 (HIS)
            </button>
          </div>

          {/* Connected Device Topology List */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col gap-3 shadow-sm">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider font-sans border-b border-slate-150 pb-2">
              临床设备拓扑建议 (硬件架构)
            </h3>
            <div className="flex flex-col gap-2.5">
              {HARDWARE_SPECS.map((hw, idx) => (
                <div key={idx} className="bg-slate-50 border border-slate-150 p-2.5 rounded-lg text-[10.5px]">
                  <div className="font-semibold text-slate-700">{hw.label}</div>
                  <div className="text-slate-400 text-[9.5px] mt-1 leading-snug">{hw.desc}</div>
                </div>
              ))}
            </div>
          </div>

        </section>

        {/* Center-Right Columns (9 cols): Interactive Floor map, Active Display terminals */}
        <section className="col-span-12 lg:col-span-9 flex flex-col gap-5">
          
          {/* Top Panel: High Fidelity Realtime Location Map */}
          <div className="w-full">
            <AoaMap 
              patients={patients} 
              selectedPatient={selectedPatient} 
              onSelectPatient={(p) => setSelectedPatientId(p.id)}
              onAdvanceStage={(pat, stage) => handleAdvanceStage(pat, stage)}
              telemetryLogs={telemetryLogs}
              setActiveTab={setActiveTab}
            />
          </div>

          {/* Bottom Panel: Tab switching Display workspace and Controllers */}
          <div className="grid grid-cols-12 gap-5 items-stretch flex-1">
            
            {/* The Main Screen Displays (8 cols) */}
            <div className="col-span-12 md:col-span-8 flex flex-col bg-white border border-slate-200 rounded-xl overflow-hidden min-h-[460px] shadow-sm">
              
              {/* Tabs Switcher Head */}
              <div className="bg-slate-50 border-b border-slate-200 p-1 flex overflow-x-auto gap-1 text-[10.5px] font-sans select-none scrollbar-none shrink-0">
                <button
                  onClick={() => setActiveTab("pda")}
                  className={`px-3 py-1.5 rounded-md font-bold cursor-pointer whitespace-nowrap transition-colors flex items-center gap-1 ${
                    activeTab === "pda" ? "bg-white text-blue-600 border border-slate-200 shadow-sm" : "text-slate-500 hover:text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  📱 Nurse PDA (掌上端)
                </button>
                <button
                  onClick={() => setActiveTab("m55_area5")}
                  className={`px-3 py-1.5 rounded-md font-bold cursor-pointer whitespace-nowrap transition-colors flex items-center gap-1 ${
                    activeTab === "m55_area5" ? "bg-white text-blue-600 border border-slate-200 shadow-sm" : "text-slate-500 hover:text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  📺 Area 5 (55"大屏)
                </button>
                <button
                  onClick={() => setActiveTab("m24_area6")}
                  className={`px-3 py-1.5 rounded-md font-bold cursor-pointer whitespace-nowrap transition-colors flex items-center gap-1 ${
                    activeTab === "m24_area6" ? "bg-white text-blue-600 border border-slate-200 shadow-sm" : "text-slate-500 hover:text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  🖥️ OR Bedside (24"独占)
                </button>
                <button
                  onClick={() => setActiveTab("m24_area7")}
                  className={`px-3 py-1.5 rounded-md font-bold cursor-pointer whitespace-nowrap transition-colors flex items-center gap-1 ${
                    activeTab === "m24_area7" ? "bg-white text-blue-600 border border-slate-200 shadow-sm" : "text-slate-500 hover:text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  🖥️ PACU Bed12 (24"床旁)
                </button>
                <button
                  onClick={() => setActiveTab("m55_area8")}
                  className={`px-3 py-1.5 rounded-md font-bold cursor-pointer whitespace-nowrap transition-colors flex items-center gap-1 ${
                    activeTab === "m55_area8" ? "bg-white text-blue-600 border border-slate-200 shadow-sm" : "text-slate-500 hover:text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  📺 Area 8 (55"宫格)
                </button>
                <button
                  onClick={() => setActiveTab("record")}
                  className={`px-3 py-1.5 rounded-md font-bold cursor-pointer whitespace-nowrap transition-colors flex items-center gap-1 ${
                    activeTab === "record" ? "bg-white text-blue-600 border border-slate-200 shadow-sm" : "text-slate-500 hover:text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  📄 麻醉记录单 (合规)
                </button>
              </div>

              {/* Tab Display Body viewport */}
              <div className="flex-1 p-2 relative min-h-0 bg-white">
                {activeTab === "pda" && (
                  <PdaTerminal 
                    selectedPatient={selectedPatient}
                    onUpdatePatient={handleUpdatePatient}
                    onAddNewPatient={handleAddNewPatient}
                    onLogEvent={handleLogEvent}
                  />
                )}
                {activeTab === "m55_area5" && (
                  <Monitor55Inch patients={patients} activeArea={5} />
                )}
                {activeTab === "m55_area8" && (
                  <Monitor55Inch patients={patients} activeArea={8} />
                )}
                {activeTab === "m24_area6" && (
                  <Monitor24Inch 
                    patient={patients.find(p => p.currentStage === 6 && p.sensorConnected) || null} 
                    activeArea={6} 
                  />
                )}
                {activeTab === "m24_area7" && (
                  <Monitor24Inch 
                    patient={patients.find(p => p.currentStage === 7 && p.sensorConnected) || null} 
                    activeArea={7} 
                  />
                )}
                {activeTab === "record" && (
                  <AnesthesiaRecord patient={selectedPatient} onLockRecord={handleLockRecord} />
                )}
              </div>

            </div>

            {/* Simulation Controller Panel & Vitals Tweaker (4 cols) */}
            <div className="col-span-12 md:col-span-4 flex flex-col gap-4">
              
              {/* Simulation walkdeck card */}
              <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col gap-3 select-none text-xs shadow-sm">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider font-sans border-b border-slate-150 pb-2 flex justify-between items-center">
                  <span>演示沙盒控制</span>
                  <Sliders className="w-4 h-4 text-blue-600 animate-pulse" />
                </h3>

                {selectedPatient ? (
                  <div className="flex flex-col gap-2.5">
                    
                    {/* Manual step progressor buttons */}
                    <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                      <span className="text-[10px] text-slate-500 font-bold block mb-1.5">
                        手动强制模拟 AOA 定位跨区：
                      </span>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => {
                            if (selectedPatient.currentStage > 1) {
                              handleAdvanceStage(selectedPatient, selectedPatient.currentStage - 1);
                            }
                          }}
                          disabled={selectedPatient.currentStage <= 1 || selectedPatient.isLocked}
                          className="p-1 px-2 text-[10px] bg-white hover:bg-slate-50 text-slate-600 rounded border border-slate-200 text-center font-bold cursor-pointer transition-colors disabled:opacity-45 disabled:cursor-not-allowed"
                        >
                          上一步
                        </button>
                        <button
                          onClick={() => {
                            if (selectedPatient.currentStage < 10) {
                              handleAdvanceStage(selectedPatient, selectedPatient.currentStage + 1);
                            }
                          }}
                          disabled={selectedPatient.currentStage >= 10}
                          className="p-1 px-2 text-[10px] bg-[#2563eb] hover:bg-blue-700 text-white rounded border border-blue-600 text-center font-bold cursor-pointer transition-colors"
                        >
                          下一步
                        </button>
                      </div>
                    </div>

                    {/* Autopilot Simulation button */}
                    <button
                      onClick={() => {
                        setIsAutopilot(!isAutopilot);
                        if (!isAutopilot) {
                          if (selectedPatient) {
                            handleAdvanceStage(selectedPatient, 1);
                          }
                          handleLogEvent("AOA_POSITION", `系统仿真播放启动：患者将自动按流程漫游投屏(4s/区)`);
                        } else {
                          handleLogEvent("AOA_POSITION", `系统仿真播放暂停`);
                        }
                      }}
                      className={`p-2 rounded font-bold text-center flex items-center justify-center gap-1.5 cursor-pointer shadow-sm transition-all ${
                        isAutopilot
                          ? "bg-rose-600 hover:bg-rose-700 text-white"
                          : "bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
                      }`}
                    >
                      <Play className="w-3.5 h-3.5" />
                      {isAutopilot ? "暂停流程自动演练" : "启动流程自动演练"}
                    </button>

                  </div>
                ) : (
                  <div className="text-slate-400 italic text-center py-4 text-[10.5px]">
                    请在上方或左侧选择一名患者开始流程模拟控制。
                  </div>
                )}
              </div>

              {/* Real-time vitals modifier slider controls */}
              <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col gap-3 text-xs shadow-sm">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider font-sans border-b border-slate-150 pb-2 flex justify-between items-center">
                  <span>实时体征信号源调节</span>
                  <Sliders className="w-4 h-4 text-emerald-600" />
                </h3>
                
                {selectedPatient && selectedPatient.sensorConnected && selectedPatient.currentStage !== 9 ? (
                  <div className="flex flex-col gap-3">
                    <p className="text-[10px] text-slate-500 leading-snug bg-slate-50 border border-slate-150 p-2.5 rounded">
                      📟 拖拽滑块直接改变可穿戴发射源。床旁或大屏监护仪的 <b>Canvas 心电与血氧波形</b> 将立即相应发生波段振幅变化：
                    </p>

                    {/* HR slider */}
                    <div className="flex flex-col gap-1">
                      <div className="flex justify-between font-mono font-bold">
                        <span className="text-slate-600 font-sans text-[10px]">发射端脉搏/心率 (HR)</span>
                        <span className="text-emerald-600 font-mono">{vitalsSliders.hr} bpm</span>
                      </div>
                      <input
                        type="range"
                        min="50"
                        max="140"
                        value={vitalsSliders.hr}
                        onChange={(e) => setVitalsSliders({ ...vitalsSliders, hr: parseInt(e.target.value) })}
                        className="w-full accent-emerald-500 h-1 rounded-lg cursor-pointer bg-slate-100"
                      />
                    </div>

                    {/* SpO2 slider */}
                    <div className="flex flex-col gap-1">
                      <div className="flex justify-between font-mono font-bold">
                        <span className="text-slate-600 font-sans text-[10px]">发射端血氧饱和 (SpO2)</span>
                        <span className="text-cyan-600 font-mono">{vitalsSliders.spo2} %</span>
                      </div>
                      <input
                        type="range"
                        min="80"
                        max="100"
                        value={vitalsSliders.spo2}
                        onChange={(e) => setVitalsSliders({ ...vitalsSliders, spo2: parseInt(e.target.value) })}
                        className="w-full accent-cyan-500 h-1 rounded-lg cursor-pointer bg-slate-100"
                      />
                    </div>

                    {/* Resp slider */}
                    <div className="flex flex-col gap-1">
                      <div className="flex justify-between font-mono font-bold">
                        <span className="text-slate-600 font-sans text-[10px]">物理呼吸频率 (RESP)</span>
                        <span className="text-amber-600 font-mono">{vitalsSliders.resp} /分</span>
                      </div>
                      <input
                        type="range"
                        min="10"
                        max="24"
                        value={vitalsSliders.resp}
                        onChange={(e) => setVitalsSliders({ ...vitalsSliders, resp: parseInt(e.target.value) })}
                        className="w-full accent-amber-500 h-1 rounded-lg cursor-pointer bg-slate-100"
                      />
                    </div>

                    {/* Blood Pressure Presets */}
                    <div className="flex flex-col gap-1 pt-1.5 border-t border-slate-150">
                      <span className="text-slate-500 text-[10px] font-bold block mb-1">
                        无创血压(NIBP)发射预置:
                      </span>
                      <div className="grid grid-cols-3 gap-1.5 font-sans text-[9px]">
                        {[
                          { id: "normal", label: "正常 (120/80)" },
                          { id: "hypo", label: "低血压 (85/55)" },
                          { id: "hyper", label: "高血压 (155/95)" }
                        ].map(bp => (
                          <button
                            key={bp.id}
                            onClick={() => setVitalsSliders({ ...vitalsSliders, bpPreset: bp.id })}
                            className={`p-1.5 rounded text-center border cursor-pointer font-medium transition-colors ${
                              vitalsSliders.bpPreset === bp.id
                                ? "bg-amber-50 border-amber-500 text-amber-700 font-semibold shadow-sm"
                                : "bg-white border-slate-200 hover:border-slate-300 text-slate-500"
                            }`}
                          >
                            {bp.label}
                          </button>
                        ))}
                      </div>
                    </div>

                  </div>
                ) : (
                  <div className="text-slate-400 italic text-center py-6">
                    选定患者未处于在监护状态（步骤5-8）或未配对可穿戴设备。
                  </div>
                )}
              </div>

            </div>

          </div>

        </section>

      </main>

      {/* Global alert or floating notification system (WS 329-2024 compliance watermark) */}
      <footer className="bg-white border-t border-slate-200 px-6 py-3.5 flex flex-col sm:flex-row justify-between items-center text-[10px] text-slate-400 gap-2 select-none">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-emerald-500" />
          <span>
            《WS 329-2024 麻醉记录单标准》和《智能内镜检查流程》数字孪生追踪模拟演示系统
          </span>
        </div>
        <div className="font-sans text-slate-400">
          时钟精度: ±50ms | AOA漫游判定: 时间滞后双阈值滤波 (Time Hysteresis)
        </div>
      </footer>

    </div>
  );
}
