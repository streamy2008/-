/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { 
  Smartphone, UserCheck, ShieldAlert, Award, 
  Wifi, Bluetooth, CheckCircle, Flame, Save, Key, RefreshCw,
  UploadCloud, Camera, FileImage, X, Maximize2, Trash2, Paperclip, Info
} from "lucide-react";
import { Patient, Gender, AsaGrade, FastingStatus } from "../types";

interface PdaTerminalProps {
  selectedPatient: Patient | null;
  onUpdatePatient: (updatedPatient: Patient) => void;
  onAddNewPatient: (patient: Patient) => void;
  onLogEvent: (type: "AOA_POSITION" | "CAST_TRIGGER" | "SENSOR_BIND" | "FILTER_DAMP" | "COMPLIANCE_ALARM", message: string, latencyMs?: number) => void;
  onDeselectPatient?: () => void;
}

// Preset mock patient profiles from HIS
const HIS_MOCK_PROFILES = [
  { name: "张明德", gender: Gender.Male, age: 48, height: 172, weight: 70 },
  { name: "李秀兰", gender: Gender.Female, age: 62, height: 158, weight: 58 },
  { name: "王建国", gender: Gender.Male, age: 35, height: 180, weight: 85 },
  { name: "赵敏静", gender: Gender.Female, age: 29, height: 165, weight: 50 },
  { name: "钱福海", gender: Gender.Male, age: 74, height: 168, weight: 64 }
];

export default function PdaTerminal({ selectedPatient, onUpdatePatient, onAddNewPatient, onLogEvent, onDeselectPatient }: PdaTerminalProps) {
  // Local state for adding/editing patient
  const [formData, setFormData] = useState({
    name: "",
    gender: Gender.Male,
    age: 45,
    height: 170,
    weight: 65,
    asaGrade: AsaGrade.I,
    fastingStatus: FastingStatus.Fasted,
    specialConditions: "无特殊过敏史及合并症。",
    sensorMac: "",
    patientPhoto: "",
    consentPhoto: ""
  });

  // Local state for Modified Aldrete scoring (0-2 for each)
  const [aldrete, setAldrete] = useState({
    respiration: 2,
    spo2: 2,
    consciousness: 2,
    circulation: 2,
    activity: 1,
    nurseSignature: ""
  });

  // Update local form state when selected patient changes
  useEffect(() => {
    if (selectedPatient) {
      setFormData({
        name: selectedPatient.name,
        gender: selectedPatient.gender,
        age: selectedPatient.age,
        height: selectedPatient.height,
        weight: selectedPatient.weight,
        asaGrade: selectedPatient.asaGrade,
        fastingStatus: selectedPatient.fastingStatus,
        specialConditions: selectedPatient.specialConditions,
        sensorMac: selectedPatient.sensorMac,
        patientPhoto: selectedPatient.patientPhoto || "",
        consentPhoto: selectedPatient.consentPhoto || ""
      });
      if (selectedPatient.aldreteScore) {
        setAldrete({
          respiration: selectedPatient.aldreteScore.respiration,
          spo2: selectedPatient.aldreteScore.spo2,
          consciousness: selectedPatient.aldreteScore.consciousness,
          circulation: selectedPatient.aldreteScore.circulation,
          activity: selectedPatient.aldreteScore.activity,
          nurseSignature: selectedPatient.aldreteScore.nurseSignature || ""
        });
      } else {
        setAldrete({
          respiration: 2,
          spo2: 2,
          consciousness: 2,
          circulation: 2,
          activity: 1,
          nurseSignature: ""
        });
      }
    }
  }, [selectedPatient]);

  // Handle BMI automatic calculation
  const calculateBmi = (w: number, h: number) => {
    const hMeter = h / 100;
    return parseFloat((w / (hMeter * hMeter)).toFixed(1));
  };

  const bmiValue = calculateBmi(formData.weight, formData.height);

  // Generate unique tracking ID
  const generateTrackerId = () => {
    return "ID-" + Math.floor(100000 + Math.random() * 900000);
  };

  // Pull from HIS handler
  const handleHisPull = () => {
    const randomProfile = HIS_MOCK_PROFILES[Math.floor(Math.random() * HIS_MOCK_PROFILES.length)];
    setFormData(prev => ({
      ...prev,
      name: randomProfile.name,
      gender: randomProfile.gender,
      age: randomProfile.age,
      height: randomProfile.height,
      weight: randomProfile.weight,
      specialConditions: "无特殊合并症。HIS系统同步正常。"
    }));
    onLogEvent("SENSOR_BIND", "HIS系统拉取患者身份数据完成: " + randomProfile.name);
  };

  // Submit Step 1: Create New Patient
  const handleCreatePatient = () => {
    if (!formData.name.trim()) return;
    const newId = generateTrackerId();
    const newPat: Patient = {
      id: newId,
      name: formData.name,
      gender: formData.gender,
      age: formData.age,
      height: formData.height,
      weight: formData.weight,
      bmi: bmiValue,
      asaGrade: formData.asaGrade,
      fastingStatus: formData.fastingStatus,
      specialConditions: formData.specialConditions,
      currentStage: 1,
      sensorMac: "",
      sensorBattery: 100,
      sensorConnected: false,
      timeLogs: {
        registration: new Date().toISOString()
      },
      vitalsHistory: [
        {
          time: new Date(Date.now() - 30 * 60 * 1000).toLocaleTimeString().substring(0, 5),
          pulse: 78,
          sbp: 120,
          dbp: 80,
          spo2: 98
        }
      ],
      currentVitals: {
        hr: 78,
        spo2: 98,
        resp: 16,
        sbp: 120,
        dbp: 80
      },
      isLocked: false,
      patientPhoto: formData.patientPhoto,
      consentPhoto: formData.consentPhoto
    };

    onAddNewPatient(newPat);
    onLogEvent("SENSOR_BIND", `登记建档：新建检查追踪。患者: ${newPat.name}, 唯一追踪ID: ${newPat.id}`);
  };

  // Save changes to current patient
  const handleSaveChanges = () => {
    if (!selectedPatient) return;
    const updated: Patient = {
      ...selectedPatient,
      name: formData.name,
      gender: formData.gender,
      age: formData.age,
      height: formData.height,
      weight: formData.weight,
      bmi: bmiValue,
      asaGrade: formData.asaGrade,
      fastingStatus: formData.fastingStatus,
      specialConditions: formData.specialConditions,
      patientPhoto: formData.patientPhoto,
      consentPhoto: formData.consentPhoto
    };
    onUpdatePatient(updated);
    onLogEvent("SENSOR_BIND", `修改信息：更新患者 ${updated.name} 信息与评估等级`);
  };

  // Bind BLE sensor
  const handleBindSensor = () => {
    if (!selectedPatient) return;
    const mac = formData.sensorMac || `B4:72:9F:CA:83:${Math.floor(10 + Math.random() * 89)}`;
    const updated: Patient = {
      ...selectedPatient,
      sensorMac: mac,
      sensorConnected: true,
      sensorBattery: 98,
      timeLogs: {
        ...selectedPatient.timeLogs,
        deviceBound: new Date().toISOString()
      }
    };
    onUpdatePatient(updated);
    setFormData(prev => ({ ...prev, sensorMac: mac }));
    onLogEvent("SENSOR_BIND", `可穿戴绑定：患者 ${selectedPatient.name} 成功绑定MAC为 ${mac} 的医疗传感器（电池耐受12h+）`);
    onLogEvent("CAST_TRIGGER", `投屏事件：AOA网关识别患者位于【区域5】外等候区，数据自动无线投屏至该区域55寸多床位大屏`, 420);
  };

  // Unbind sensor & submit Aldrete score
  const handleAldreteScoreSubmit = () => {
    if (!selectedPatient) return;
    
    const scoreVal = aldrete.respiration + aldrete.spo2 + aldrete.consciousness + aldrete.circulation + aldrete.activity;
    
    if (!aldrete.nurseSignature.trim()) {
      alert("请输入护士签名以完成离室出院确认。");
      return;
    }

    if (scoreVal < 9) {
      onLogEvent("COMPLIANCE_ALARM", `合规报警：患者 ${selectedPatient.name} 的 Modified Aldrete 评分为 ${scoreVal}分，低于安全出室标准(>=9分)！`);
    }

    const updated: Patient = {
      ...selectedPatient,
      sensorConnected: false,
      currentStage: 9,
      timeLogs: {
        ...selectedPatient.timeLogs,
        discharged: new Date().toISOString()
      },
      aldreteScore: {
        respiration: aldrete.respiration,
        spo2: aldrete.spo2,
        consciousness: aldrete.consciousness,
        circulation: aldrete.circulation,
        activity: aldrete.activity,
        submittedAt: new Date().toISOString(),
        nurseSignature: aldrete.nurseSignature
      },
      isLocked: true 
    };

    onUpdatePatient(updated);
    onLogEvent("SENSOR_BIND", `解绑并出室：提交Modified Aldrete评分(${scoreVal}分)，护士[${aldrete.nurseSignature}]电子签名，解绑传感器，归档麻醉单`);
    onLogEvent("CAST_TRIGGER", `投屏注销：14号座位屏幕清屏，退出二级PACU监护大屏投屏显示`, 240);
  };

  // Move patient to Area 10 (End of process, generate anesthesia record)
  const handleTransitionToStage10 = () => {
    if (!selectedPatient) return;
    const updated: Patient = {
      ...selectedPatient,
      currentStage: 10
    };
    onUpdatePatient(updated);
    onLogEvent("AOA_POSITION", `AOA定位：检查结束，患者 ${selectedPatient.name} 离开二级PACU，流转至区域10 (检查结束) 并自动生成最终电子麻醉记录单。`);
  };

  // Drag and drop / file change handlers for patients photo uploads
  const handleFileDrop = (e: React.DragEvent<HTMLDivElement>, field: "patientPhoto" | "consentPhoto") => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file, field);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, field: "patientPhoto" | "consentPhoto") => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file, field);
    }
  };

  const processFile = (file: File, field: "patientPhoto" | "consentPhoto") => {
    if (file.size > 5 * 1024 * 1024) {
      alert("文件大小不能超过 5MB");
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        const base64Data = event.target.result as string;
        setFormData(prev => ({
          ...prev,
          [field]: base64Data
        }));

        // If a patient is selected, auto-save immediately
        if (selectedPatient) {
          const updated: Patient = {
            ...selectedPatient,
            [field]: base64Data
          };
          onUpdatePatient(updated);
        }

        onLogEvent("SENSOR_BIND", `上传资料：患者 ${selectedPatient?.name || formData.name || '新患者'} 成功上传了 ${field === "patientPhoto" ? "身份核对照" : "知情同意书"}`);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSimulatePhoto = (field: "patientPhoto" | "consentPhoto") => {
    let mockImg = "";
    if (field === "patientPhoto") {
      mockImg = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100"><rect width="100" height="100" fill="%23eff6ff"/><circle cx="50" cy="40" r="18" fill="%23bfdbfe"/><path d="M25,75 C25,60 75,60 75,75" fill="%233b82f6"/><rect x="42" y="80" width="16" height="4" fill="%233b82f6" rx="1"/><text x="50" y="93" font-family="sans-serif" font-size="7" fill="%231e3a8a" text-anchor="middle" font-weight="bold">AI-CHECKED</text></svg>`;
      onLogEvent("SENSOR_BIND", `设备拍照：已激活 5G PDA 摄像头，成功采集患者 ${selectedPatient?.name || formData.name || "新患者"} 的现场高清核对人像`);
    } else {
      mockImg = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 280" width="200" height="280"><rect width="200" height="280" fill="white" stroke="%233b82f6" stroke-width="2"/><rect x="20" y="20" width="160" height="15" fill="%232563eb" rx="2"/><text x="100" y="31" fill="white" font-family="sans-serif" font-size="8" font-weight="bold" text-anchor="middle">麻醉知情同意书 (电子存档)</text><rect x="20" y="55" width="100" height="6" fill="%2364748b"/><rect x="20" y="70" width="160" height="3" fill="%23cbd5e1"/><rect x="20" y="80" width="140" height="3" fill="%23cbd5e1"/><rect x="20" y="90" width="150" height="3" fill="%23cbd5e1"/><rect x="20" y="105" width="80" height="6" fill="%2364748b"/><rect x="20" y="120" width="160" height="3" fill="%23cbd5e1"/><rect x="20" y="130" width="130" height="3" fill="%23cbd5e1"/><rect x="20" y="145" width="150" height="3" fill="%23cbd5e1"/><rect x="20" y="160" width="120" height="3" fill="%23cbd5e1"/><rect x="20" y="180" width="60" height="10" fill="%23d1fae5" rx="1"/><text x="50" y="188" fill="%23065f46" font-family="sans-serif" font-size="6" font-weight="bold" text-anchor="middle">患者已手写签名</text><path d="M30,230 Q50,210 70,240 T110,220" fill="none" stroke="%23dc2626" stroke-width="1.5"/><circle cx="150" cy="225" r="16" fill="none" stroke="%23dc2626" stroke-width="1.5" stroke-dasharray="4,2"/><text x="150" y="228" fill="%23dc2626" font-family="sans-serif" font-size="6" font-weight="bold" text-anchor="middle">麻醉科印章</text></svg>`;
      onLogEvent("SENSOR_BIND", `文档扫描：已激活 5G PDA 扫描头，成功扫描并结构化归档患者的纸质《术前麻醉知情同意书》`);
    }

    setFormData(prev => ({
      ...prev,
      [field]: mockImg
    }));

    if (selectedPatient) {
      const updated: Patient = {
        ...selectedPatient,
        [field]: mockImg
      };
      onUpdatePatient(updated);
    }
  };

  const handleClearPhoto = (field: "patientPhoto" | "consentPhoto") => {
    setFormData(prev => ({
      ...prev,
      [field]: ""
    }));

    if (selectedPatient) {
      const updated: Patient = {
        ...selectedPatient,
        [field]: ""
      };
      onUpdatePatient(updated);
    }
    onLogEvent("SENSOR_BIND", `清除档案：已移除患者 ${selectedPatient?.name || formData.name || '当前患者'} 的 ${field === "patientPhoto" ? "身份识别照" : "纸质知情同意书"}`);
  };

  const renderImageUploaders = () => {
    return (
      <div className="flex flex-col gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200 shadow-inner">
        <span className="font-bold text-slate-700 text-xs flex items-center gap-1.5">
          <Paperclip className="w-4 h-4 text-blue-600" />
          报到资料附件管理 (精细化扫描)
        </span>
        
        {/* Drop zones grid */}
        <div className="grid grid-cols-2 gap-3">
          
          {/* Uploader 1: Patient Portrait */}
          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] text-slate-500 font-bold flex items-center gap-1">
              <Camera className="w-3.5 h-3.5 text-blue-500" />
              1. 患者身份核对照 *
            </span>
            
            <input 
              type="file" 
              id="patientPhotoInput" 
              accept="image/*" 
              className="hidden" 
              onChange={(e) => handleFileChange(e, "patientPhoto")}
            />
            
            {formData.patientPhoto ? (
              <div className="relative border border-blue-200 bg-blue-50/20 rounded-lg p-2 flex flex-col items-center justify-between h-[120px] shadow-sm">
                <img 
                  src={formData.patientPhoto} 
                  alt="Patient Face" 
                  className="h-14 w-14 rounded-full object-cover border border-blue-300 shadow-sm"
                  referrerPolicy="no-referrer"
                />
                <div className="flex gap-1 w-full justify-center mt-1.5">
                  <button 
                    onClick={() => handleSimulatePhoto("patientPhoto")}
                    className="text-[9px] bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 px-1.5 py-0.5 rounded cursor-pointer"
                  >
                    重拍
                  </button>
                  <button 
                    onClick={() => handleClearPhoto("patientPhoto")}
                    className="text-[9px] bg-red-50 border border-red-100 hover:bg-red-100 text-red-600 px-1.5 py-0.5 rounded flex items-center gap-0.5 cursor-pointer"
                  >
                    <Trash2 className="w-2.5 h-2.5" />
                    清除
                  </button>
                </div>
              </div>
            ) : (
              <div 
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => handleFileDrop(e, "patientPhoto")}
                onClick={() => document.getElementById("patientPhotoInput")?.click()}
                className="border border-dashed border-slate-300 hover:border-blue-400 hover:bg-blue-50/10 transition-colors rounded-lg p-3 flex flex-col items-center justify-center gap-1.5 cursor-pointer h-[120px] text-center"
              >
                <UploadCloud className="w-6 h-6 text-slate-400 group-hover:text-blue-500" />
                <span className="text-[10px] text-slate-500 font-medium leading-tight">
                  拖拽或点击上传<br/><span className="text-[9px] text-slate-400 font-normal">(人像照片)</span>
                </span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSimulatePhoto("patientPhoto");
                  }}
                  className="text-[9px] bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold px-2 py-0.5 rounded border border-blue-200 transition-colors cursor-pointer mt-0.5"
                >
                  模拟拍照
                </button>
              </div>
            )}
          </div>

          {/* Uploader 2: Consent Form */}
          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] text-slate-500 font-bold flex items-center gap-1">
              <FileImage className="w-3.5 h-3.5 text-emerald-500" />
              2. 麻醉知情同意书 *
            </span>
            
            <input 
              type="file" 
              id="consentPhotoInput" 
              accept="image/*" 
              className="hidden" 
              onChange={(e) => handleFileChange(e, "consentPhoto")}
            />
            
            {formData.consentPhoto ? (
              <div className="relative border border-emerald-200 bg-emerald-50/20 rounded-lg p-2 flex flex-col items-center justify-between h-[120px] shadow-sm">
                <img 
                  src={formData.consentPhoto} 
                  alt="Consent Form" 
                  className="h-14 w-10 object-contain border border-emerald-300 shadow-sm rounded bg-white"
                  referrerPolicy="no-referrer"
                />
                <div className="flex gap-1 w-full justify-center mt-1.5">
                  <button 
                    onClick={() => handleSimulatePhoto("consentPhoto")}
                    className="text-[9px] bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 px-1.5 py-0.5 rounded cursor-pointer"
                  >
                    重扫
                  </button>
                  <button 
                    onClick={() => handleClearPhoto("consentPhoto")}
                    className="text-[9px] bg-red-50 border border-red-100 hover:bg-red-100 text-red-600 px-1.5 py-0.5 rounded flex items-center gap-0.5 cursor-pointer"
                  >
                    <Trash2 className="w-2.5 h-2.5" />
                    清除
                  </button>
                </div>
              </div>
            ) : (
              <div 
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => handleFileDrop(e, "consentPhoto")}
                onClick={() => document.getElementById("consentPhotoInput")?.click()}
                className="border border-dashed border-slate-300 hover:border-emerald-400 hover:bg-emerald-50/10 transition-colors rounded-lg p-3 flex flex-col items-center justify-center gap-1.5 cursor-pointer h-[120px] text-center"
              >
                <UploadCloud className="w-6 h-6 text-slate-400 group-hover:text-emerald-500" />
                <span className="text-[10px] text-slate-500 font-medium leading-tight">
                  拖拽或点击上传<br/><span className="text-[9px] text-slate-400 font-normal">(纸质同意书)</span>
                </span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSimulatePhoto("consentPhoto");
                  }}
                  className="text-[9px] bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-semibold px-2 py-0.5 rounded border border-emerald-200 transition-colors cursor-pointer mt-0.5"
                >
                  模拟扫描
                </button>
              </div>
            )}
          </div>

        </div>

        <div className="text-[9px] text-slate-400 leading-normal border-t border-slate-200/60 pt-1.5 font-sans">
          🛡️ 已开启端到端双重加密，所有上传的附件将按照《WS 329-2024》规范自动归档并与电子麻醉记录单深度绑定。
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden h-full flex flex-col font-sans select-none shadow-sm">
      {/* Handheld Case Header */}
      <div className="bg-slate-50 p-3.5 border-b border-slate-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Smartphone className="w-4 h-4 text-blue-600" />
          <span className="text-xs font-bold text-slate-800 uppercase tracking-wider font-sans">
            PDA 护士掌上终端 (移动端)
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[10px] font-mono text-blue-600 font-bold bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200/50">
            WS-PDA 5G
          </span>
        </div>
      </div>

      {/* Touch Screen body container */}
      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar bg-slate-50/20 text-xs text-slate-700">
        
        {/* If no patient is registered or selected */}
        {!selectedPatient ? (
          <div className="flex flex-col gap-4">
            <div className="bg-white border border-slate-200 rounded-lg p-3.5 flex flex-col gap-3 shadow-sm shadow-slate-100/30">
              <div className="flex justify-between items-center border-b border-slate-150 pb-2">
                <span className="font-bold text-slate-800 flex items-center gap-1.5">
                  <UserCheck className="w-4 h-4 text-blue-600" />
                  步骤1：新患者报到处（建档）
                </span>
                <button 
                  onClick={handleHisPull}
                  className="text-[10px] bg-blue-50 border border-blue-200 hover:bg-blue-100 text-blue-700 px-2 py-1 rounded flex items-center gap-1 cursor-pointer transition-colors font-semibold"
                >
                  <RefreshCw className="w-3 h-3 text-blue-600" />
                  HIS一键拉取
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-slate-500 font-bold">姓名 *</label>
                  <input
                    type="text"
                    placeholder="输入患者姓名"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="bg-white border border-slate-200 rounded p-1.5 text-slate-900 font-medium focus:border-blue-500 outline-none text-xs"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-slate-500 font-bold">性别</label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value as Gender })}
                    className="bg-white border border-slate-200 rounded p-1.5 text-slate-900 focus:border-blue-500 outline-none text-xs"
                  >
                    <option value={Gender.Male}>男</option>
                    <option value={Gender.Female}>女</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-slate-500 font-bold">年龄 (岁)</label>
                  <input
                    type="number"
                    value={formData.age}
                    onChange={(e) => setFormData({ ...formData, age: parseInt(e.target.value) || 0 })}
                    className="bg-white border border-slate-200 rounded p-1.5 text-slate-900 font-mono text-xs outline-none"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-slate-500 font-bold">身高 (cm)</label>
                  <input
                    type="number"
                    value={formData.height}
                    onChange={(e) => setFormData({ ...formData, height: parseInt(e.target.value) || 0 })}
                    className="bg-white border border-slate-200 rounded p-1.5 text-slate-900 font-mono text-xs outline-none"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-slate-500 font-bold">体重 (kg)</label>
                  <input
                    type="number"
                    value={formData.weight}
                    onChange={(e) => setFormData({ ...formData, weight: parseInt(e.target.value) || 0 })}
                    className="bg-white border border-slate-200 rounded p-1.5 text-slate-900 font-mono text-xs outline-none"
                  />
                </div>
              </div>

              <div className="bg-slate-50 rounded p-2 border border-slate-200 flex justify-between items-center text-[10px]">
                <span className="text-slate-500 font-medium">身体质量指数 BMI:</span>
                <span className={`font-mono font-bold px-2 py-0.5 rounded ${
                  bmiValue >= 28 ? "bg-red-50 text-red-700 border border-red-200" :
                  bmiValue >= 24 ? "bg-amber-50 text-amber-700 border border-amber-200" :
                  "bg-emerald-50 text-emerald-700 border border-emerald-200"
                }`}>
                  {bmiValue} ({bmiValue >= 28 ? "肥胖" : bmiValue >= 24 ? "超重" : "正常"})
                </span>
              </div>

              {renderImageUploaders()}

              <button
                onClick={handleCreatePatient}
                disabled={!formData.name.trim()}
                className={`p-2 rounded text-center font-bold text-xs shadow-sm flex items-center justify-center gap-1 cursor-pointer transition-all ${
                  formData.name.trim() 
                    ? "bg-[#2563eb] hover:bg-blue-700 text-white" 
                    : "bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed"
                }`}
              >
                <Save className="w-4 h-4" />
                患者登记建档 (进入追踪流程)
              </button>
            </div>
            <div className="text-center text-slate-400 text-[10px] p-4 border border-dashed border-slate-200 rounded-lg">
              请在左侧列表中选择一个正在追踪的患者，或在此新建患者。
            </div>
          </div>
        ) : (
          /* Active Selected Patient Workflow Handling */
          <div className="flex flex-col gap-4">
            
            {/* Quick Status Bar */}
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 flex justify-between items-center shadow-sm">
              <div>
                <div className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                  <span>{selectedPatient.name}</span>
                  <span className={`text-[9px] px-1.5 py-0.2 rounded-full ${
                    selectedPatient.gender === Gender.Male ? "bg-blue-50 text-blue-600" : "bg-pink-50 text-pink-600"
                  }`}>
                    {selectedPatient.gender} • {selectedPatient.age}岁
                  </span>
                  {onDeselectPatient && (
                    <button
                      onClick={onDeselectPatient}
                      className="text-[9px] text-slate-400 hover:text-blue-600 ml-2 border border-slate-200 hover:border-blue-200 px-1.5 py-0.2 rounded bg-white transition-colors cursor-pointer font-medium"
                    >
                      取消选择
                    </button>
                  )}
                </div>
                <div className="text-[10px] text-slate-400 font-mono mt-1">
                  唯一检查追踪号: <span className="text-blue-600 font-bold">{selectedPatient.id}</span>
                </div>
              </div>
              <div className="text-right">
                <span className="text-[9px] text-slate-400 block font-medium">当前流程位置</span>
                <span className="font-mono text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  步骤 {selectedPatient.currentStage} / 9
                </span>
              </div>
            </div>

            {/* Stages specific editing fields */}
            
            {/* Step 1: Registration Check-in & Documents */}
            {selectedPatient.currentStage === 1 && (
              <div className="bg-white border border-slate-200 rounded-lg p-3.5 flex flex-col gap-3.5 shadow-sm">
                <div className="font-bold text-slate-800 border-b border-slate-150 pb-1.5 flex items-center gap-1.5">
                  <UserCheck className="w-4 h-4 text-blue-600" />
                  步骤1：患者报到
                </div>

                <div className="grid grid-cols-2 gap-3.5 text-[11px] bg-slate-50 p-2.5 rounded border border-slate-200">
                  <div>
                    <span className="text-slate-400 block font-semibold text-[9px] uppercase">姓名</span>
                    <span className="font-bold text-slate-800 text-xs">{selectedPatient.name}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-semibold text-[9px] uppercase">年龄 / 性别</span>
                    <span className="font-bold text-slate-800 text-xs">{selectedPatient.age} 岁 / {selectedPatient.gender}</span>
                  </div>
                </div>

                {renderImageUploaders()}

                <button
                  onClick={handleSaveChanges}
                  className="bg-[#2563eb] hover:bg-blue-700 text-white p-2 rounded text-center font-bold text-xs transition-colors flex items-center justify-center gap-1 cursor-pointer shadow-sm"
                >
                  <Save className="w-4 h-4" />
                  同步并保存登记附件 (HIS/EMR同步)
                </button>
                
                <div className="text-[10px] text-amber-700 bg-amber-50 border border-amber-200/60 p-2.5 rounded-lg flex flex-col gap-1">
                  <span className="font-bold flex items-center gap-1">
                    <Info className="w-3.5 h-3.5" />
                    下一步指引
                  </span>
                  <span>完成资料附件核对后，请引导患者移步至 **麻醉评估室 (区域2)**。网关将自动通过 AOA 高精度信标捕捉流转事件。</span>
                </div>
              </div>
            )}

            {/* Step 2: Preoperative Assessment */}
            {selectedPatient.currentStage === 2 && (
              <div className="bg-white border border-slate-200 rounded-lg p-3.5 flex flex-col gap-3 shadow-sm">
                <div className="font-bold text-slate-800 border-b border-slate-150 pb-1.5 flex items-center gap-1.5">
                  <UserCheck className="w-4 h-4 text-blue-600" />
                  步骤2：术前评估与禁食核查
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-slate-500 font-bold">麻醉医生访视 ASA 评估分级</label>
                  <select
                    value={formData.asaGrade}
                    onChange={(e) => setFormData({ ...formData, asaGrade: e.target.value as AsaGrade })}
                    className="bg-white border border-slate-200 rounded p-1.5 text-slate-800 text-xs focus:border-blue-500 outline-none"
                  >
                    <option value={AsaGrade.I}>{AsaGrade.I}</option>
                    <option value={AsaGrade.II}>{AsaGrade.II}</option>
                    <option value={AsaGrade.III}>{AsaGrade.III}</option>
                    <option value={AsaGrade.IV}>{AsaGrade.IV}</option>
                    <option value={AsaGrade.V}>{AsaGrade.V}</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-slate-500 font-bold">术前禁食水核对</label>
                  <select
                    value={formData.fastingStatus}
                    onChange={(e) => setFormData({ ...formData, fastingStatus: e.target.value as FastingStatus })}
                    className="bg-white border border-slate-200 rounded p-1.5 text-slate-800 text-xs focus:border-blue-500 outline-none"
                  >
                    <option value={FastingStatus.Fasted}>{FastingStatus.Fasted}</option>
                    <option value={FastingStatus.NotFasted}>{FastingStatus.NotFasted}</option>
                    <option value={FastingStatus.Special}>{FastingStatus.Special}</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-slate-500 font-bold">术前特殊情况或既往史</label>
                  <textarea
                    rows={2}
                    value={formData.specialConditions}
                    onChange={(e) => setFormData({ ...formData, specialConditions: e.target.value })}
                    className="bg-white border border-slate-200 rounded p-1.5 text-slate-800 text-xs outline-none focus:border-blue-500 resize-none font-sans"
                  />
                </div>

                <button
                  onClick={handleSaveChanges}
                  className="bg-[#2563eb] hover:bg-blue-700 text-white p-1.5 rounded text-center font-semibold text-xs transition-colors flex items-center justify-center gap-1 cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  保存评估数据 (同步至电子病历)
                </button>
              </div>
            )}

            {/* Step 3 & 4 Waiting & Puncture area */}
            {selectedPatient.currentStage >= 3 && selectedPatient.currentStage <= 4 && (
              <div className="bg-white border border-slate-200 rounded-lg p-3.5 flex flex-col gap-3 shadow-sm">
                <div className="font-bold text-slate-800 border-b border-slate-150 pb-1.5 flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4 text-emerald-600" />
                  {selectedPatient.currentStage === 3 ? "步骤3：等候大厅候诊" : "步骤4：穿刺就绪确认"}
                </div>
                
                {selectedPatient.currentStage === 3 ? (
                  <div className="p-3 bg-slate-50 rounded border border-slate-200 flex flex-col gap-2">
                    <span className="text-slate-600">患者当前正在等候大厅候诊。导诊大屏同步展示该患者处于【等候检查】排队序列。</span>
                    <div className="text-[10px] text-slate-400 font-mono mt-1">
                      等候起始时间：{selectedPatient.timeLogs.registration ? new Date(selectedPatient.timeLogs.registration).toLocaleTimeString() : "-"}
                    </div>
                  </div>
                ) : (
                  <div className="p-3 bg-emerald-50 rounded border border-emerald-200 flex flex-col gap-2">
                    <span className="text-emerald-700 font-semibold flex items-center gap-1">
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                      静脉穿刺就绪
                    </span>
                    <p className="text-slate-600">已呼叫并进入穿刺区（区域4）进行静脉留置针操作。AOA系统已捕捉进入该区域的时间戳：</p>
                    <div className="text-[10px] text-emerald-700 font-mono bg-white p-1.5 rounded border border-emerald-200">
                      穿刺开始：{selectedPatient.timeLogs.punctureStart ? new Date(selectedPatient.timeLogs.punctureStart).toLocaleTimeString() : "-"}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Step 5: Wearable device pairing */}
            {selectedPatient.currentStage === 5 && (
              <div className="bg-white border border-slate-200 rounded-lg p-3.5 flex flex-col gap-3 shadow-sm">
                <div className="font-bold text-slate-800 border-b border-slate-150 pb-1.5 flex items-center gap-1.5">
                  <Bluetooth className="w-4 h-4 text-blue-600 animate-pulse" />
                  步骤5：操作外等候与传感器绑定
                </div>

                <div className="p-3 bg-amber-50 rounded border border-amber-200/80 flex flex-col gap-2 mb-1">
                  <p className="text-slate-600 text-[11px] leading-relaxed">
                    患者在操作外等候区（区域5）佩戴可穿戴心电、血氧、血压传感器。护士使用PDA读取传感器MAC地址进行身份绑定：
                  </p>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-slate-500 font-bold">传感器 MAC 地址 *</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="如: B4:72:9F:CA:83:1E"
                      value={formData.sensorMac}
                      onChange={(e) => setFormData({ ...formData, sensorMac: e.target.value })}
                      className="bg-white border border-slate-200 rounded p-1.5 text-slate-800 font-mono text-xs outline-none flex-1 focus:border-blue-500"
                    />
                    <button
                      onClick={() => setFormData({ ...formData, sensorMac: `B4:72:9F:CA:83:${Math.floor(10 + Math.random() * 89)}` })}
                      className="bg-slate-100 border border-slate-200 hover:bg-slate-200 text-slate-600 px-2 py-1 rounded text-[10px] cursor-pointer"
                    >
                      扫码MAC
                    </button>
                  </div>
                </div>

                {selectedPatient.sensorConnected ? (
                  <div className="bg-emerald-50 text-emerald-700 border border-emerald-200 rounded p-2.5 flex items-center justify-between shadow-sm">
                    <div className="flex items-center gap-1.5">
                      <CheckCircle className="w-4 h-4 text-emerald-600" />
                      <div>
                        <div className="font-bold text-[11px]">传感器物理连接已激活</div>
                        <div className="text-[9px] font-mono text-emerald-800">MAC: {selectedPatient.sensorMac}</div>
                      </div>
                    </div>
                    <span className="font-mono font-bold text-[10px] bg-emerald-100 px-1.5 py-0.5 rounded text-emerald-800 flex items-center gap-1">
                      <Wifi className="w-3 h-3 text-emerald-600" />
                      🔋98%
                    </span>
                  </div>
                ) : (
                  <button
                    onClick={handleBindSensor}
                    className="bg-[#2563eb] hover:bg-blue-700 text-white font-semibold p-2 rounded text-center text-xs shadow-sm cursor-pointer transition-all"
                  >
                    绑定可穿戴传感器并开始投屏
                  </button>
                )}

                {selectedPatient.sensorConnected && (
                  <div className="text-[10px] text-amber-700 bg-amber-50 border border-amber-200/80 p-2.5 rounded flex items-center gap-1.5">
                    <CheckCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    <span>自动投屏机制：AOA识别到该绑定设备处于区域5，已将实时体征推送至该区55寸监控大屏。</span>
                  </div>
                )}
              </div>
            )}

            {/* Step 6 to 8: Vitals monitoring & auto-casting displays */}
            {selectedPatient.currentStage >= 6 && selectedPatient.currentStage <= 8 && (
              <div className="bg-white border border-slate-200 rounded-lg p-3.5 flex flex-col gap-3 shadow-sm">
                <div className="font-bold text-slate-800 border-b border-slate-150 pb-1.5 flex items-center gap-1.5">
                  <Wifi className="w-4 h-4 text-blue-600 animate-pulse" />
                  智能定位投屏流转控制中
                </div>

                <div className="p-3 bg-slate-50 rounded border border-slate-200 flex flex-col gap-2 text-[11px]">
                  <div className="flex justify-between items-center text-slate-500 font-bold border-b border-slate-200 pb-1.5 mb-1">
                    <span>当前物理定位：</span>
                    <span className="text-blue-600 font-semibold font-sans">
                      {selectedPatient.currentStage === 6 ? "区域6 (操作手术间)" :
                       selectedPatient.currentStage === 7 ? "区域7 (PACU一级复苏12床)" :
                       "区域8 (二级PACU 14号座)"}
                    </span>
                  </div>

                  {selectedPatient.currentStage === 6 && (
                    <p className="text-slate-600 leading-relaxed">
                      📡 <b>AOA无感投屏动作</b>：操作外55寸屏幕已<b>注销</b>该患者，自动将其实时体征投射至<b>操作间内24寸床旁监护仪</b>全屏显示。
                    </p>
                  )}

                  {selectedPatient.currentStage === 7 && (
                    <p className="text-slate-600 leading-relaxed">
                      📡 <b>AOA无感投屏动作</b>：自动将患者监护信号接力至<b>PACU 12号床上方24寸监护显示器</b>（静态精度≤0.3m亚米级精细定位）。
                    </p>
                  )}

                  {selectedPatient.currentStage === 8 && (
                    <p className="text-slate-600 leading-relaxed">
                      📡 <b>AOA无感投屏动作</b>：12号床屏幕清除，自动接力推送至<b>二级PACU墙面55寸大屏的多宫格</b>中（14号座位）。
                    </p>
                  )}

                  <div className="grid grid-cols-2 gap-2 mt-1 border-t border-slate-200 pt-2 font-mono text-[10px]">
                    <div className="flex justify-between bg-white border border-slate-150 p-1 px-1.5 rounded shadow-sm">
                      <span className="text-slate-400">心率 HR:</span>
                      <span className="text-emerald-600 font-bold">{selectedPatient.currentVitals.hr} bpm</span>
                    </div>
                    <div className="flex justify-between bg-white border border-slate-150 p-1 px-1.5 rounded shadow-sm">
                      <span className="text-slate-400">血氧 SpO2:</span>
                      <span className="text-blue-600 font-bold">{selectedPatient.currentVitals.spo2}%</span>
                    </div>
                    <div className="flex justify-between bg-white border border-slate-150 p-1 px-1.5 rounded col-span-2 shadow-sm">
                      <span className="text-slate-400">血压 NIBP:</span>
                      <span className="text-amber-600 font-bold">
                        {selectedPatient.currentVitals.sbp} / {selectedPatient.currentVitals.dbp} mmHg
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 9: Discharge scoring & device unpairing */}
            {selectedPatient.currentStage === 9 && selectedPatient.isLocked && (
              <div className="bg-white border border-slate-200 rounded-lg p-3.5 flex flex-col gap-3 shadow-sm">
                <div className="font-bold text-slate-800 border-b border-slate-150 pb-1.5 flex items-center gap-1.5">
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                  步骤9：监护结束，已归档保存
                </div>
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded flex flex-col gap-2">
                  <span className="font-bold">电子麻醉记录单已锁定保存！</span>
                  <p className="text-slate-600 text-[11px] leading-relaxed">
                    已成功采集所有AOA轨迹点和连续生命体征。依照<b>《WS 329-2024》</b>行业规范对脉搏心率、无创血压、血氧数据进行了5-15分钟降采样归档。
                  </p>
                  <div className="border-t border-emerald-200 pt-1.5 text-[10px] text-slate-500 font-mono">
                    <div>护士电子签名: {selectedPatient.aldreteScore?.nurseSignature}</div>
                    <div>出室时间: {selectedPatient.timeLogs.discharged ? new Date(selectedPatient.timeLogs.discharged).toLocaleTimeString() : "-"}</div>
                  </div>
                </div>

                <button
                  onClick={handleTransitionToStage10}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded text-center text-xs shadow-sm cursor-pointer flex items-center justify-center gap-1 transition-all border border-emerald-600 mt-1 animate-pulse"
                >
                  <CheckCircle className="w-4 h-4" />
                  检查结束，点击生成麻醉记录单 (区域10)
                </button>
              </div>
            )}

            {/* Step 10: Process finished */}
            {selectedPatient.currentStage === 10 && (
              <div className="bg-white border border-slate-200 rounded-lg p-3.5 flex flex-col gap-3 shadow-sm">
                <div className="font-bold text-slate-800 border-b border-slate-150 pb-1.5 flex items-center gap-1.5">
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                  步骤10：智能内镜检查结束
                </div>
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded flex flex-col gap-2">
                  <span className="font-bold">🎉 检查流转已全部结束</span>
                  <p className="text-slate-600 text-[11px] leading-relaxed">
                    患者已完成全部检查、复苏与评定流转。电子麻醉记录单已按国家 <b>《WS 329-2024》</b> 规范成功生成，点击页面上方 <b>【电子麻醉记录单】</b> 标签可打印、导出或留存。
                  </p>
                  <div className="border-t border-emerald-200 pt-1.5 text-[10px] text-slate-500 font-mono">
                    <div>当前状态: 检查流程结束</div>
                    <div>归档状态: 电子麻醉记录单生成完毕</div>
                  </div>
                </div>
              </div>
            )}

            {/* Discharge/Aldrete Score evaluation drawer/popup in PDA */}
            {selectedPatient.currentStage === 9 && !selectedPatient.isLocked && (
              <div className="bg-white border border-rose-200 rounded-lg p-3.5 flex flex-col gap-3 shadow-sm bg-rose-50/10">
                <div className="font-bold text-rose-700 border-b border-rose-100 pb-1.5 flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-rose-600" />
                  国家标准 Modified Aldrete 出室评分核准
                </div>

                <p className="text-slate-600 text-[10px] bg-rose-50 border border-rose-100/70 p-2.5 rounded leading-relaxed">
                  ⚠️ <b>国家合规性标准 WS 329-2024第6.5条强制要求</b>：在离开二级PACU（步骤9）前，护士终端必须推送 Modified Aldrete 评分窗口进行出室评分核准。
                </p>

                {/* Score inputs 5 items */}
                <div className="flex flex-col gap-2 text-[10.5px]">
                  
                  {/* Respiration */}
                  <div className="flex flex-col gap-1 border-b border-slate-100 pb-1.5">
                    <div className="flex justify-between font-bold text-slate-700">
                      <span>1. 呼吸系统 (Respiration)</span>
                      <span className="text-blue-600 font-semibold">{aldrete.respiration}分</span>
                    </div>
                    <div className="grid grid-cols-3 gap-1 mt-1 font-mono text-[9px]">
                      {[
                        { val: 2, label: "深呼吸自如" },
                        { val: 1, label: "呼吸受限" },
                        { val: 0, label: "呼吸暂停" }
                      ].map(item => (
                        <button
                          key={item.val}
                          onClick={() => setAldrete({ ...aldrete, respiration: item.val })}
                          className={`p-1 rounded text-center border cursor-pointer ${
                            aldrete.respiration === item.val
                              ? "bg-blue-50 border-blue-500 text-blue-700 font-bold"
                              : "bg-white border-slate-200 hover:border-slate-300 text-slate-500"
                          }`}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* SpO2 */}
                  <div className="flex flex-col gap-1 border-b border-slate-100 pb-1.5">
                    <div className="flex justify-between font-bold text-slate-700">
                      <span>2. 血氧饱和度 (Oxygen Saturation)</span>
                      <span className="text-blue-600 font-semibold">{aldrete.spo2}分</span>
                    </div>
                    <div className="grid grid-cols-3 gap-1 mt-1 font-mono text-[9px]">
                      {[
                        { val: 2, label: "未吸氧SpO2>92%" },
                        { val: 1, label: "吸氧维持>90%" },
                        { val: 0, label: "吸氧SpO2<90%" }
                      ].map(item => (
                        <button
                          key={item.val}
                          onClick={() => setAldrete({ ...aldrete, spo2: item.val })}
                          className={`p-1 rounded text-center border cursor-pointer ${
                            aldrete.spo2 === item.val
                              ? "bg-blue-50 border-blue-500 text-blue-700 font-bold"
                              : "bg-white border-slate-200 hover:border-slate-300 text-slate-500"
                          }`}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Consciousness */}
                  <div className="flex flex-col gap-1 border-b border-slate-100 pb-1.5">
                    <div className="flex justify-between font-bold text-slate-700">
                      <span>3. 神志清醒度 (Consciousness)</span>
                      <span className="text-blue-600 font-semibold">{aldrete.consciousness}分</span>
                    </div>
                    <div className="grid grid-cols-3 gap-1 mt-1 font-mono text-[9px]">
                      {[
                        { val: 2, label: "完全清醒" },
                        { val: 1, label: "呼之有反应" },
                        { val: 0, label: "无任何反应" }
                      ].map(item => (
                        <button
                          key={item.val}
                          onClick={() => setAldrete({ ...aldrete, consciousness: item.val })}
                          className={`p-1 rounded text-center border cursor-pointer ${
                            aldrete.consciousness === item.val
                              ? "bg-blue-50 border-blue-500 text-blue-700 font-bold"
                              : "bg-white border-slate-200 hover:border-slate-300 text-slate-500"
                          }`}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Circulation */}
                  <div className="flex flex-col gap-1 border-b border-slate-100 pb-1.5">
                    <div className="flex justify-between font-bold text-slate-700">
                      <span>4. 血压与循环 (Circulation)</span>
                      <span className="text-blue-600 font-semibold">{aldrete.circulation}分</span>
                    </div>
                    <div className="grid grid-cols-3 gap-1 mt-1 font-mono text-[9px]">
                      {[
                        { val: 2, label: "BP波动±20%内" },
                        { val: 1, label: "波动20%-50%" },
                        { val: 0, label: "波动>50%以上" }
                      ].map(item => (
                        <button
                          key={item.val}
                          onClick={() => setAldrete({ ...aldrete, circulation: item.val })}
                          className={`p-1 rounded text-center border cursor-pointer ${
                            aldrete.circulation === item.val
                              ? "bg-blue-50 border-blue-500 text-blue-700 font-bold"
                              : "bg-white border-slate-200 hover:border-slate-300 text-slate-500"
                          }`}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Activity */}
                  <div className="flex flex-col gap-1 border-b border-slate-100 pb-1.5">
                    <div className="flex justify-between font-bold text-slate-700">
                      <span>5. 肢体活动度 (Activity)</span>
                      <span className="text-blue-600 font-semibold">{aldrete.activity}分</span>
                    </div>
                    <div className="grid grid-cols-3 gap-1 mt-1 font-mono text-[9px]">
                      {[
                        { val: 2, label: "可自活动4肢" },
                        { val: 1, label: "可活动双肢" },
                        { val: 0, label: "肢体均无活动" }
                      ].map(item => (
                        <button
                          key={item.val}
                          onClick={() => setAldrete({ ...aldrete, activity: item.val })}
                          className={`p-1 rounded text-center border cursor-pointer ${
                            aldrete.activity === item.val
                              ? "bg-blue-50 border-blue-500 text-blue-700 font-bold"
                              : "bg-white border-slate-200 hover:border-slate-300 text-slate-500"
                          }`}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>

                </div>

                {/* Total Score Display and Nurse Signature */}
                <div className="bg-slate-50 border border-slate-200 p-2.5 rounded flex flex-col gap-2 mt-1">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-slate-500 text-[11px]">综合评分值:</span>
                    <span className={`text-xs font-bold font-mono px-2 py-0.5 rounded ${
                      (aldrete.respiration + aldrete.spo2 + aldrete.consciousness + aldrete.circulation + aldrete.activity) >= 9
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        : "bg-rose-50 text-rose-700 border border-rose-200"
                    }`}>
                      {aldrete.respiration + aldrete.spo2 + aldrete.consciousness + aldrete.circulation + aldrete.activity} / 10 分
                    </span>
                  </div>
                  <div className="flex flex-col gap-1 mt-1">
                    <label className="text-[10px] text-slate-500 font-bold">责任护士电子核对签名 *</label>
                    <input
                      type="text"
                      placeholder="输入护士名字，例: 王护士"
                      value={aldrete.nurseSignature}
                      onChange={(e) => setAldrete({ ...aldrete, nurseSignature: e.target.value })}
                      className="bg-white border border-slate-200 rounded p-1.5 text-slate-800 font-medium focus:border-blue-500 outline-none text-xs shadow-sm"
                    />
                  </div>
                </div>

                <button
                  onClick={handleAldreteScoreSubmit}
                  className="bg-[#2563eb] hover:bg-blue-700 text-white font-bold py-2 rounded text-center text-xs shadow-sm cursor-pointer flex items-center justify-center gap-1 transition-all border border-blue-600/10"
                >
                  <CheckCircle className="w-4 h-4" />
                  提核评分 &amp; 解绑传感器
                </button>
              </div>
            )}
            
          </div>
        )}
      </div>

      {/* PDA Virtual Navigation Bar */}
      <div className="bg-slate-50 border-t border-slate-200 p-2.5 flex justify-around text-[9px] text-slate-400 font-mono">
        <div className="flex flex-col items-center cursor-pointer text-blue-600 font-semibold">
          <Smartphone className="w-4 h-4 mb-0.5" />
          <span>采集主页</span>
        </div>
        <div className="flex flex-col items-center opacity-40">
          <Bluetooth className="w-4 h-4 mb-0.5" />
          <span>设备配对</span>
        </div>
        <div className="flex flex-col items-center opacity-40">
          <UserCheck className="w-4 h-4 mb-0.5" />
          <span>巡检记录</span>
        </div>
      </div>
    </div>
  );
}
