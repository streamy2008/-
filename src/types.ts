/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export enum Gender {
  Male = "男",
  Female = "女"
}

export enum AsaGrade {
  I = "ASA I (正常健康)",
  II = "ASA II (轻度系统疾病)",
  III = "ASA III (重度系统疾病，受限)",
  IV = "ASA IV (严重系统疾病，威胁生命)",
  V = "ASA V (濒死，不手术难以存活)"
}

export enum FastingStatus {
  Fasted = "已禁食水（>8小时）",
  NotFasted = "未足额禁食",
  Special = "特殊禁食指令"
}

export interface Patient {
  id: string; // Tracker ID
  name: string;
  gender: Gender;
  age: number;
  height: number; // cm
  weight: number; // kg
  bmi: number;
  asaGrade: AsaGrade;
  fastingStatus: FastingStatus;
  specialConditions: string; // 术前特殊情况
  currentStage: number; // 1 to 9
  sensorMac: string; // Wearable BLE MAC address
  sensorBattery: number; // BLE battery %, >= 12h
  sensorConnected: boolean;
  
  // Time logs for spatial tracking (AOA)
  timeLogs: {
    registration?: string;      // 步骤1
    anesthesiaAssess?: string;  // 步骤2
    waitingLobby?: string;      // 步骤3
    punctureStart?: string;     // 步骤4
    deviceBound?: string;        // 步骤5
    orEnter?: string;           // 步骤6 (入室时间/麻醉开始)
    pacu1Enter?: string;        // 步骤7
    pacu2Enter?: string;        // 步骤8
    discharged?: string;        // 步骤9 (麻醉结束)
  };
  
  // Historical vitals records (saved every 5 mins for pulse/BP, 15 mins for SpO2)
  vitalsHistory: {
    time: string;
    pulse: number; // ●
    sbp: number; // ∨
    dbp: number; // ∧
    spo2: number;
  }[];

  // Current real-time vitals value
  currentVitals: {
    hr: number;
    spo2: number;
    resp: number;
    sbp: number;
    dbp: number;
  };

  // Modified Aldrete Score (0-2 for each, total 10)
  aldreteScore?: {
    respiration: number; // 0, 1, 2
    spo2: number;        // 0, 1, 2
    consciousness: number; // 0, 1, 2
    circulation: number;   // 0, 1, 2
    activity: number;      // 0, 1, 2
    submittedAt?: string;
    nurseSignature?: string;
  };

  isLocked: boolean; // Anesthetic record locked
}

export interface TelemetryEvent {
  id: string;
  timestamp: string;
  type: "AOA_POSITION" | "CAST_TRIGGER" | "SENSOR_BIND" | "FILTER_DAMP" | "COMPLIANCE_ALARM";
  message: string;
  latencyMs?: number; // Handoff delay < 200ms, cast delay < 500ms
}
