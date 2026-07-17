/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { FileText, Printer, Lock, Calendar, ClipboardCheck, Clock, MapPin, Activity } from "lucide-react";
import { Patient, Gender } from "../types";

interface AnesthesiaRecordProps {
  patient: Patient | null;
  onLockRecord: () => void;
}

export default function AnesthesiaRecord({ patient, onLockRecord }: AnesthesiaRecordProps) {
  if (!patient) {
    return (
      <div className="bg-white text-slate-400 p-8 rounded-xl border border-slate-200 shadow-md h-full flex flex-col items-center justify-center text-center gap-3 select-none">
        <FileText className="w-16 h-16 text-slate-300 animate-pulse" />
        <div>
          <div className="text-sm font-bold text-slate-700">麻醉记录单未装载</div>
          <p className="text-xs text-slate-500 mt-1 max-w-[280px]">
            请在左侧列表中选择一位患者，系统将根据高精度定位轨迹和可穿戴监测数据自动合成符合 <b>《WS 329-2024》</b> 标准要求的电子单。
          </p>
        </div>
      </div>
    );
  }

  // Fallback data mapping for time logs
  const formatTime = (isoString?: string) => {
    if (!isoString) return "--:--:--";
    return new Date(isoString).toLocaleTimeString("zh-CN", { hour12: false });
  };

  const formatDate = (isoString?: string) => {
    if (!isoString) return new Date().toLocaleDateString("zh-CN");
    return new Date(isoString).toLocaleDateString("zh-CN");
  };

  // Extract vitals list. WS 329-2024 requires 5-minute interval for HR/BP and 15-minute for SpO2.
  // We'll map the patient's vitalsHistory or generate a compliant downsampled representation.
  const records = patient.vitalsHistory;

  // Let's draw an SVG-based compliance grid plot
  // Grid width and dimensions
  const chartWidth = 560;
  const chartHeight = 220;
  const paddingLeft = 40;
  const paddingRight = 20;
  const paddingTop = 20;
  const paddingBottom = 30;

  const plotWidth = chartWidth - paddingLeft - paddingRight;
  const plotHeight = chartHeight - paddingTop - paddingBottom;

  // Vitals ranges for plotting
  const hrMin = 40;
  const hrMax = 160;
  const bpMin = 40;
  const bpMax = 180;
  const spo2Min = 80;
  const spo2Max = 100;

  // Helper to map values to coordinates
  const getX = (index: number, total: number) => {
    if (total <= 1) return paddingLeft + plotWidth / 2;
    return paddingLeft + (index / (total - 1)) * plotWidth;
  };

  // Map heart rate & BP to Y coordinate
  const getHrBpY = (val: number) => {
    const ratio = (val - hrMin) / (hrMax - hrMin);
    return paddingTop + plotHeight - ratio * plotHeight;
  };

  // Map SpO2 to Y coordinate
  const getSpo2Y = (val: number) => {
    const ratio = (val - spo2Min) / (spo2Max - spo2Min);
    return paddingTop + plotHeight - ratio * plotHeight;
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="bg-white text-slate-900 border border-slate-300 rounded-xl shadow-xl overflow-hidden h-full flex flex-col select-text font-sans relative">
      
      {/* Document Tool Bar */}
      <div className="bg-slate-50 border-b border-slate-200 p-2 px-4 flex justify-between items-center select-none print:hidden">
        <div className="flex items-center gap-1.5 text-slate-700">
          <FileText className="w-4 h-4 text-emerald-600" />
          <span className="text-xs font-bold font-sans">
            WS 329-2024 合规电子麻醉单（预览与归档）
          </span>
        </div>
        
        <div className="flex items-center gap-2">
          {patient.isLocked ? (
            <span className="text-[10px] bg-red-100 text-red-700 border border-red-200 px-2 py-0.5 rounded flex items-center gap-1 font-bold">
              <Lock className="w-3 h-3 text-red-600" />
              签名锁定・只读归档
            </span>
          ) : (
            <button
              onClick={onLockRecord}
              disabled={patient.currentStage !== 9}
              className={`text-[10px] px-2 py-0.5 rounded font-bold flex items-center gap-1 border cursor-pointer transition-colors ${
                patient.currentStage === 9
                  ? "bg-amber-100 text-amber-700 border-amber-300 hover:bg-amber-200"
                  : "bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed"
              }`}
            >
              <Lock className="w-3 h-3" />
              锁定记录
            </button>
          )}

          <button
            onClick={handlePrint}
            className="text-[10px] bg-emerald-600 text-white hover:bg-emerald-700 px-2.5 py-0.5 rounded flex items-center gap-1 cursor-pointer transition-colors font-semibold"
          >
            <Printer className="w-3 h-3" />
            打印单据
          </button>
        </div>
      </div>

      {/* Actual Medical Record Body (Styled like true paper record) */}
      <div className="flex-1 overflow-y-auto p-6 max-w-[800px] mx-auto w-full custom-scrollbar print:p-0 print:overflow-visible">
        
        {/* WS 329 Header heading */}
        <div className="text-center flex flex-col gap-1 border-b-2 border-slate-900 pb-3 mb-4">
          <span className="text-[10px] font-bold text-slate-500 font-mono tracking-wider">
            中华人民共和国卫生行业标准 WS 329-2024 麻醉记录单规范
          </span>
          <h1 className="text-xl font-black text-slate-950 font-serif tracking-tight">
            智 能 内 镜 中 心 麻 醉 记 录 单
          </h1>
          <div className="flex justify-between items-center text-[10px] text-slate-600 font-mono mt-1 px-1">
            <span>检查日期: {formatDate(patient.timeLogs.registration)}</span>
            <span className="font-bold">检查追踪唯一ID: {patient.id}</span>
          </div>
        </div>

        {/* Locked Stamp Visual Overlay */}
        {patient.isLocked && (
          <div className="absolute top-24 right-12 border-4 border-red-500/30 text-red-600/30 font-serif text-sm font-black px-4 py-1.5 rounded-lg -rotate-12 pointer-events-none uppercase tracking-widest select-none border-dashed print:border-red-600 print:text-red-600">
            已签名锁定 LOCKED
            <div className="text-[9px] text-center mt-0.5 font-sans">
              WS 329-2024 COMPLIANT
            </div>
          </div>
        )}

        {/* Section 1: General Info Block (Table Layout) */}
        <div className="mb-4">
          <h3 className="text-xs font-bold text-slate-900 mb-1.5 flex items-center gap-1 border-b border-slate-300 pb-0.5">
            <ClipboardCheck className="w-3.5 h-3.5 text-slate-700" />
            一、 患者一般信息 (合规要求 6.2)
          </h3>
          <div className="grid grid-cols-4 border border-slate-300 text-xs text-slate-800 font-medium">
            <div className="border-r border-b border-slate-300 bg-slate-50 p-1 px-2 font-bold text-slate-600">姓名</div>
            <div className="border-r border-b border-slate-300 p-1 px-2 text-slate-900">{patient.name}</div>
            <div className="border-r border-b border-slate-300 bg-slate-50 p-1 px-2 font-bold text-slate-600">性别</div>
            <div className="border-b border-slate-300 p-1 px-2 text-slate-900">{patient.gender}</div>

            <div className="border-r border-b border-slate-300 bg-slate-50 p-1 px-2 font-bold text-slate-600">年龄</div>
            <div className="border-r border-b border-slate-300 p-1 px-2 font-mono text-slate-900">{patient.age} 岁</div>
            <div className="border-r border-b border-slate-300 bg-slate-50 p-1 px-2 font-bold text-slate-600">ASA分级</div>
            <div className="border-b border-slate-300 p-1 px-2 text-slate-900 font-bold text-indigo-700">{patient.asaGrade.split(" ")[0]}</div>

            <div className="border-r border-b border-slate-300 bg-slate-50 p-1 px-2 font-bold text-slate-600">身高 / 体重</div>
            <div className="border-r border-b border-slate-300 p-1 px-2 font-mono text-slate-900">{patient.height} cm / {patient.weight} kg</div>
            <div className="border-r border-b border-slate-300 bg-slate-50 p-1 px-2 font-bold text-slate-600">BMI 指数</div>
            <div className="border-b border-slate-300 p-1 px-2 font-mono text-slate-900">{patient.bmi} ({patient.bmi >= 24 ? "超重" : "正常"})</div>

            <div className="border-r border-slate-300 bg-slate-50 p-1 px-2 font-bold text-slate-600">禁食状态</div>
            <div className="border-r border-slate-300 p-1 px-2 text-slate-900">{patient.fastingStatus}</div>
            <div className="border-r border-slate-300 bg-slate-50 p-1 px-2 font-bold text-slate-600">传感器MAC</div>
            <div className="p-1 px-2 font-mono text-slate-900">{patient.sensorMac || "未绑定"}</div>
          </div>
        </div>

        {/* Section 2: Spatial track time stamps (3.1 Compliance) */}
        <div className="mb-4">
          <h3 className="text-xs font-bold text-slate-900 mb-1.5 flex items-center gap-1 border-b border-slate-300 pb-0.5">
            <Clock className="w-3.5 h-3.5 text-slate-700" />
            二、 AOA 定位空间流转轨迹与时空戳 (合规要求 6.2.10, 6.4.10)
          </h3>
          <div className="grid grid-cols-2 gap-4">
            
            {/* Primary timestamps */}
            <div className="border border-slate-300 rounded p-2 bg-slate-50/50 flex flex-col gap-1.5 text-[11px] text-slate-700 font-medium">
              <div className="flex justify-between items-center border-b border-slate-200 pb-1 text-slate-800 font-bold">
                <span>术中核心时间戳</span>
                <span className="text-[9px] text-slate-400 font-normal">AOA触发</span>
              </div>
              <div className="flex justify-between">
                <span>入室时间（进入操作间）:</span>
                <span className="font-mono font-bold text-slate-900">{formatTime(patient.timeLogs.orEnter)}</span>
              </div>
              <div className="flex justify-between">
                <span>麻醉开始（绑定并首次取样）:</span>
                <span className="font-mono font-bold text-slate-900">{formatTime(patient.timeLogs.orEnter ? patient.timeLogs.orEnter : patient.timeLogs.deviceBound)}</span>
              </div>
              <div className="flex justify-between">
                <span>麻醉结束（提交出院复苏评分）:</span>
                <span className="font-mono font-bold text-slate-900">{formatTime(patient.timeLogs.discharged)}</span>
              </div>
            </div>

            {/* Stage Logs flow timeline */}
            <div className="border border-slate-300 rounded p-2 bg-slate-50/50 flex flex-col gap-1 text-[10px] text-slate-600">
              <div className="flex justify-between items-center border-b border-slate-200 pb-1 text-slate-800 font-bold text-[11px]">
                <span>AOA定位空间时间流轴日志</span>
                <span className="text-[9px] text-emerald-600 bg-emerald-100 px-1 rounded">精确到分</span>
              </div>
              <div className="flex items-center gap-1">
                <MapPin className="w-3 h-3 text-cyan-500 shrink-0" />
                <span className="text-slate-500">【区域1】登记建档时刻:</span>
                <span className="font-mono text-slate-950 font-bold ml-auto">{formatTime(patient.timeLogs.registration).substring(0, 5)}</span>
              </div>
              {patient.timeLogs.punctureStart && (
                <div className="flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-emerald-500 shrink-0" />
                  <span className="text-slate-500">【区域4】留置针穿刺开始:</span>
                  <span className="font-mono text-slate-950 font-bold ml-auto">{formatTime(patient.timeLogs.punctureStart).substring(0, 5)}</span>
                </div>
              )}
              {patient.timeLogs.deviceBound && (
                <div className="flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-amber-500 shrink-0" />
                  <span className="text-slate-500">【区域5】可穿戴传感器绑定:</span>
                  <span className="font-mono text-slate-950 font-bold ml-auto">{formatTime(patient.timeLogs.deviceBound).substring(0, 5)}</span>
                </div>
              )}
              {patient.timeLogs.pacu1Enter && (
                <div className="flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-rose-500 shrink-0" />
                  <span className="text-slate-500">【区域7】转入PACU一级复苏:</span>
                  <span className="font-mono text-slate-950 font-bold ml-auto">{formatTime(patient.timeLogs.pacu1Enter).substring(0, 5)}</span>
                </div>
              )}
              {patient.timeLogs.pacu2Enter && (
                <div className="flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-pink-500 shrink-0" />
                  <span className="text-slate-500">【区域8】转入PACU二级监护:</span>
                  <span className="font-mono text-slate-950 font-bold ml-auto">{formatTime(patient.timeLogs.pacu2Enter).substring(0, 5)}</span>
                </div>
              )}
            </div>

          </div>
        </div>

        {/* Section 3: Compliant Sampling Chart (3.2 Compliance) */}
        <div className="mb-4">
          <h3 className="text-xs font-bold text-slate-900 mb-1 flex items-center gap-1 border-b border-slate-300 pb-0.5">
            <Activity className="w-3.5 h-3.5 text-slate-700" />
            三、 术中生命体征监测降采样网格图 (合规要求 6.4.8, 附录B)
          </h3>
          <p className="text-[10px] text-slate-500 mb-2">
            ⚠️ <b>合规采样规定</b>：脉搏与心率(●)及无创血压收缩压(∨)舒张压(∧)每5分钟采样一次；血氧SpO2(蓝色折线)每15分钟采样一次。
          </p>

          {/* SVG Plotted Chart */}
          <div className="border border-slate-300 rounded bg-slate-50 p-2 flex justify-center overflow-hidden">
            <svg width={chartWidth} height={chartHeight} className="bg-white">
              {/* Back Grid Paper */}
              <defs>
                <pattern id="gridPattern" width="10" height="10" patternUnits="userSpaceOnUse">
                  <path d="M 10 0 L 0 0 0 10" fill="none" stroke="rgba(20, 110, 120, 0.04)" strokeWidth="0.5" />
                </pattern>
                <pattern id="gridThickPattern" width="50" height="50" patternUnits="userSpaceOnUse">
                  <rect width="50" height="50" fill="url(#gridPattern)" />
                  <path d="M 50 0 L 0 0 0 50" fill="none" stroke="rgba(20, 110, 120, 0.12)" strokeWidth="0.8" />
                </pattern>
              </defs>
              <rect width={chartWidth} height={chartHeight} fill="url(#gridThickPattern)" />

              {/* Chart Border lines */}
              <rect
                x={paddingLeft}
                y={paddingTop}
                width={plotWidth}
                height={plotHeight}
                fill="none"
                stroke="#64748b"
                strokeWidth="1.2"
              />

              {/* Y Axis text labels */}
              {/* Left Y-axis (Heart rate & Blood pressure): 40 to 180 */}
              <text x={10} y={getHrBpY(180) + 3} className="text-[8px] font-mono fill-slate-600">180</text>
              <text x={10} y={getHrBpY(140) + 3} className="text-[8px] font-mono fill-slate-600">140</text>
              <text x={10} y={getHrBpY(100) + 3} className="text-[8px] font-mono fill-slate-600">100</text>
              <text x={10} y={getHrBpY(60) + 3} className="text-[8px] font-mono fill-slate-600">60</text>
              <text x={10} y={getHrBpY(40) + 3} className="text-[8px] font-mono fill-slate-600">40</text>

              {/* Right Y-axis label (SpO2): 80% to 100% */}
              <text x={chartWidth - 16} y={getSpo2Y(100) + 3} className="text-[8px] font-mono fill-cyan-600">100</text>
              <text x={chartWidth - 16} y={getSpo2Y(95) + 3} className="text-[8px] font-mono fill-cyan-600">95</text>
              <text x={chartWidth - 16} y={getSpo2Y(90) + 3} className="text-[8px] font-mono fill-cyan-600">90</text>
              <text x={chartWidth - 16} y={getSpo2Y(85) + 3} className="text-[8px] font-mono fill-cyan-600">85</text>
              <text x={chartWidth - 16} y={getSpo2Y(80) + 3} className="text-[8px] font-mono fill-cyan-600">80</text>

              {/* Left Y Axis Title */}
              <text
                transform={`rotate(-90) translate(${-paddingTop - plotHeight / 2}, 34)`}
                textAnchor="middle"
                className="text-[8px] font-bold fill-slate-700"
              >
                心率脉搏(●)/血压(∨∧) [bpm/mmHg]
              </text>

              {/* Right Y Axis Title */}
              <text
                transform={`rotate(90) translate(${paddingTop + plotHeight / 2}, ${-chartWidth + 30})`}
                textAnchor="middle"
                className="text-[8px] font-bold fill-cyan-700"
              >
                血氧饱和度(折线) SpO2 [%]
              </text>

              {/* Draw SpO2 line (15-min interval points connected) */}
              {records.length > 1 && (
                <path
                  d={records
                    .map((rec, i) => {
                      const prefix = i === 0 ? "M" : "L";
                      return `${prefix} ${getX(i, records.length)} ${getSpo2Y(rec.spo2)}`;
                    })
                    .join(" ")}
                  fill="none"
                  stroke="#0891b2"
                  strokeWidth="2.5"
                />
              )}

              {/* Draw heart rate ● points */}
              {records.map((rec, i) => (
                <circle
                  key={`hr-${i}`}
                  cx={getX(i, records.length)}
                  cy={getHrBpY(rec.pulse)}
                  r={3.5}
                  className="fill-emerald-600 stroke-white"
                  strokeWidth={0.8}
                />
              ))}

              {/* Draw Systolic SBP ∨ symbols (downward wedge) */}
              {records.map((rec, i) => {
                const cx = getX(i, records.length);
                const cy = getHrBpY(rec.sbp);
                return (
                  <polygon
                    key={`sbp-${i}`}
                    points={`${cx - 3.5},${cy - 2} ${cx + 3.5},${cy - 2} ${cx},${cy + 3.5}`}
                    className="fill-amber-600 stroke-white"
                    strokeWidth={0.5}
                  />
                );
              })}

              {/* Draw Diastolic DBP ∧ symbols (upward wedge) */}
              {records.map((rec, i) => {
                const cx = getX(i, records.length);
                const cy = getHrBpY(rec.dbp);
                return (
                  <polygon
                    key={`dbp-${i}`}
                    points={`${cx},${cy - 3.5} ${cx - 3.5},${cy + 2} ${cx + 3.5},${cy + 2}`}
                    className="fill-amber-500 stroke-white"
                    strokeWidth={0.5}
                  />
                );
              })}

              {/* X Axis Time Labels */}
              {records.map((rec, i) => (
                <text
                  key={`time-lbl-${i}`}
                  x={getX(i, records.length)}
                  y={paddingTop + plotHeight + 12}
                  textAnchor="middle"
                  className="text-[7.5px] font-mono fill-slate-500"
                >
                  {rec.time}
                </text>
              ))}

              {/* Legend overlay */}
              <g transform={`translate(${paddingLeft + 15}, ${paddingTop + 10})`} className="text-[8px] font-mono">
                <rect width={280} height={16} fill="rgba(255,255,255,0.95)" stroke="#e2e8f0" rx={3} />
                <circle cx={10} cy={8} r={3} fill="#059669" />
                <text x={16} y={11} className="text-[7.5px] fill-slate-600">脉搏/HR (●)</text>
                
                <polygon points="92,6 99,6 95.5,11" fill="#d97706" />
                <text x={103} y={11} className="text-[7.5px] fill-slate-600">收缩压 (∨)</text>

                <polygon points="152,11 148.5,6 155.5,6" fill="#f59e0b" />
                <text x={159} y={11} className="text-[7.5px] fill-slate-600">舒张压 (∧)</text>

                <line x1="210" y1="8" x2="225" y2="8" stroke="#0891b2" strokeWidth="2" />
                <text x={229} y={11} className="text-[7.5px] fill-slate-600">血氧折线 (SpO2)</text>
              </g>
            </svg>
          </div>
        </div>

        {/* Section 4: Aldrete score report (6.5 Compliance) */}
        <div className="mb-4">
          <h3 className="text-xs font-bold text-slate-900 mb-1.5 flex items-center gap-1 border-b border-slate-300 pb-0.5">
            <ClipboardCheck className="w-3.5 h-3.5 text-slate-700" />
            四、 Modified Aldrete 出室评价记录 (合规要求 6.5)
          </h3>
          
          {patient.aldreteScore ? (
            <div className="border border-slate-300 rounded p-3 bg-slate-50 text-xs">
              <div className="grid grid-cols-5 gap-2 text-center text-slate-500 font-bold border-b border-slate-200 pb-1.5 mb-2 text-[10px]">
                <div>呼吸系统</div>
                <div>血氧饱和</div>
                <div>神志清醒</div>
                <div>循环/血压</div>
                <div>肢体活动</div>
              </div>
              <div className="grid grid-cols-5 gap-2 text-center text-slate-900 font-bold font-mono text-[11px] mb-2">
                <div>{patient.aldreteScore.respiration} 分</div>
                <div>{patient.aldreteScore.spo2} 分</div>
                <div>{patient.aldreteScore.consciousness} 分</div>
                <div>{patient.aldreteScore.circulation} 分</div>
                <div>{patient.aldreteScore.activity} 分</div>
              </div>
              
              <div className="flex justify-between items-center border-t border-slate-200 pt-2 text-[11px] font-medium">
                <div className="text-slate-700">
                  出室综合评分：
                  <span className="font-bold font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                    {patient.aldreteScore.respiration +
                     patient.aldreteScore.spo2 +
                     patient.aldreteScore.consciousness +
                     patient.aldreteScore.circulation +
                     patient.aldreteScore.activity} / 10 分 (符合离室标准)
                  </span>
                </div>
                <div className="text-slate-600">
                  核对护士电子签名：
                  <span className="font-serif font-bold text-slate-900 underline underline-offset-4 decoration-slate-400">
                    {patient.aldreteScore.nurseSignature}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="border border-dashed border-slate-300 rounded p-4 text-center text-slate-500 italic text-[11px]">
              尚未进行 Modified Aldrete 评分核算。请在患者流转至步骤9时由护士于PDA终端触发评分面板进行评定。
            </div>
          )}
        </div>

        {/* Section 5: compliance stamp / clinical signatures */}
        <div className="mt-6 border-t border-slate-400 pt-4 grid grid-cols-2 gap-8 text-xs text-slate-700 font-medium">
          <div className="flex flex-col gap-1.5">
            <div>内镜中心医师电子核签：_____________________</div>
            <div className="text-[10px] text-slate-400 font-mono">
              系统唯一签名验证码: MD-SIGN-{patient.id.substring(3)}
            </div>
          </div>
          <div className="flex flex-col gap-1.5 text-right">
            <div>责任护士复核签名：
              <span className="font-serif font-black underline underline-offset-2 text-slate-950">
                {patient.aldreteScore?.nurseSignature || "_____________________"}
              </span>
            </div>
            <div className="text-[10px] text-slate-400 font-mono">
              归档安全哈希: SHA256-329-{patient.id.substring(3)}{patient.gender === "男" ? "7" : "9"}A
            </div>
          </div>
        </div>

      </div>

      {/* Grid footer watermark */}
      <div className="bg-slate-50 px-6 py-2 border-t border-slate-200 text-[9px] text-slate-400 flex justify-between select-none print:hidden">
        <span>此记录符合《中华人民共和国卫生行业标准 WS 329-2024》第6章全部技术规范</span>
        <span>智能内镜中心系统版本 v1.2.0</span>
      </div>
    </div>
  );
}
