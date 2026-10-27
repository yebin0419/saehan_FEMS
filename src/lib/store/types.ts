import type { CauseCategoryCode, StateCode } from "@/lib/db/schema";
import type { ReadingPoint, Thresholds } from "@/lib/analysis/classify";

export type StoredEquipment = {
  id: number;
  code: string;
  name: string;
  groupCode: string | null;
  thresholds: Thresholds;
};

export type StoredReading = {
  equipmentId: number;
  ts: Date;
  currentAmp: number;
};

export type StoredEvent = {
  id: number;
  equipmentId: number;
  equipmentCode: string;
  equipmentName: string;
  startTs: Date;
  endTs: Date;
  durationMin: number;
  state: StateCode;
  causeCategory: CauseCategoryCode | null;
  causeDetail: string;
  updatedAt: Date;
};

export type IngestEquipmentInput = {
  code: string;
  name?: string;
  thresholds: Thresholds;
  readings: ReadingPoint[];
};

export type IngestSummary = {
  equipmentsUpserted: number;
  readingsStored: number;
  eventsStored: number;
};

export interface AnalysisStore {
  reset(): Promise<void>;
  listEquipments(): Promise<StoredEquipment[]>;
  getEquipmentByCode(code: string): Promise<StoredEquipment | null>;
  getReadings(equipmentId: number): Promise<StoredReading[]>;
  getEvents(filter?: {
    equipmentId?: number;
    stateIn?: StateCode[];
  }): Promise<StoredEvent[]>;
  getEventById(id: number): Promise<StoredEvent | null>;
  ingest(equipments: IngestEquipmentInput[]): Promise<IngestSummary>;
  updateEventCause(
    id: number,
    patch: { causeCategory: CauseCategoryCode | null; causeDetail: string },
  ): Promise<StoredEvent | null>;
}
