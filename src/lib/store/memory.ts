import { detectEvents } from "@/lib/analysis/classify";
import type { CauseCategoryCode, StateCode } from "@/lib/db/schema";
import type {
  AnalysisStore,
  IngestEquipmentInput,
  IngestSummary,
  StoredEquipment,
  StoredEvent,
  StoredReading,
} from "./types";

type MemState = {
  nextEquipId: number;
  nextEventId: number;
  equipments: Map<number, StoredEquipment>;
  equipByCode: Map<string, number>;
  readings: Map<number, StoredReading[]>;
  events: Map<number, StoredEvent>;
};

declare global {
  // eslint-disable-next-line no-var
  var __emsMemState: MemState | undefined;
}

function state(): MemState {
  if (!globalThis.__emsMemState) {
    globalThis.__emsMemState = {
      nextEquipId: 1,
      nextEventId: 1,
      equipments: new Map(),
      equipByCode: new Map(),
      readings: new Map(),
      events: new Map(),
    };
  }
  return globalThis.__emsMemState;
}

export const memoryStore: AnalysisStore = {
  async reset() {
    const s = state();
    s.nextEquipId = 1;
    s.nextEventId = 1;
    s.equipments.clear();
    s.equipByCode.clear();
    s.readings.clear();
    s.events.clear();
  },

  async listEquipments() {
    return Array.from(state().equipments.values()).sort((a, b) =>
      a.code.localeCompare(b.code),
    );
  },

  async getEquipmentByCode(code: string) {
    const s = state();
    const id = s.equipByCode.get(code);
    return id ? (s.equipments.get(id) ?? null) : null;
  },

  async getReadings(equipmentId: number) {
    return state().readings.get(equipmentId) ?? [];
  },

  async getEvents(filter) {
    const s = state();
    let items = Array.from(s.events.values());
    if (filter?.equipmentId !== undefined) {
      items = items.filter((e) => e.equipmentId === filter.equipmentId);
    }
    if (filter?.stateIn?.length) {
      items = items.filter((e) =>
        (filter.stateIn as StateCode[]).includes(e.state),
      );
    }
    return items.sort((a, b) => a.startTs.getTime() - b.startTs.getTime());
  },

  async getEventById(id) {
    return state().events.get(id) ?? null;
  },

  async ingest(inputs: IngestEquipmentInput[]): Promise<IngestSummary> {
    const s = state();
    let readingsStored = 0;
    let eventsStored = 0;

    for (const input of inputs) {
      let id = s.equipByCode.get(input.code);
      if (!id) {
        id = s.nextEquipId++;
        s.equipByCode.set(input.code, id);
      }
      const equip: StoredEquipment = {
        id,
        code: input.code,
        name: input.name ?? input.code,
        groupCode: null,
        thresholds: input.thresholds,
      };
      s.equipments.set(id, equip);

      const readings: StoredReading[] = input.readings
        .map((r) => ({ equipmentId: id!, ts: r.ts, currentAmp: r.current }))
        .sort((a, b) => a.ts.getTime() - b.ts.getTime());
      s.readings.set(id, readings);
      readingsStored += readings.length;

      // 기존 이벤트는 설비 단위로 완전 교체
      for (const [eid, ev] of s.events) {
        if (ev.equipmentId === id) s.events.delete(eid);
      }

      const classified = detectEvents({
        code: input.code,
        name: equip.name,
        thresholds: input.thresholds,
        readings: input.readings,
      });

      for (const ev of classified) {
        const stored: StoredEvent = {
          id: s.nextEventId++,
          equipmentId: id,
          equipmentCode: equip.code,
          equipmentName: equip.name,
          startTs: ev.start,
          endTs: ev.end,
          durationMin: ev.durationMin,
          state: ev.state,
          causeCategory: null,
          causeDetail: "",
          updatedAt: new Date(),
        };
        s.events.set(stored.id, stored);
        eventsStored++;
      }
    }

    return {
      equipmentsUpserted: inputs.length,
      readingsStored,
      eventsStored,
    };
  },

  async updateEventCause(
    id: number,
    patch: {
      causeCategory: CauseCategoryCode | null;
      causeDetail: string;
    },
  ) {
    const s = state();
    const existing = s.events.get(id);
    if (!existing) return null;
    const updated: StoredEvent = {
      ...existing,
      causeCategory: patch.causeCategory,
      causeDetail: patch.causeDetail,
      updatedAt: new Date(),
    };
    s.events.set(id, updated);
    return updated;
  },
};
