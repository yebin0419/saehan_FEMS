import { relations, sql } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  pgTable,
  real,
  serial,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/pg-core";

export const CAUSE_CATEGORY_CODES = [
  "BREAKDOWN",
  "MOLD",
  "MATERIAL",
  "PLANNED",
  "QUALITY",
] as const;
export type CauseCategoryCode = (typeof CAUSE_CATEGORY_CODES)[number];

export const STATE_CODES = ["run", "idle", "stop"] as const;
export type StateCode = (typeof STATE_CODES)[number];

export const emsEquipment = pgTable(
  "ems_equipment",
  {
    id: serial("id").primaryKey(),
    code: varchar("code", { length: 32 }).notNull(),
    name: varchar("name", { length: 128 }).notNull(),
    groupCode: varchar("group_code", { length: 32 }),
    active: boolean("active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    codeUniq: uniqueIndex("ems_equipment_code_uniq").on(t.code),
  }),
);

export const emsCriteria = pgTable(
  "ems_criteria",
  {
    id: serial("id").primaryKey(),
    groupCode: varchar("group_code", { length: 32 }).notNull(),
    runningAmp: real("running_amp").notNull(),
    stopAmp: real("stop_amp").notNull(),
    unitsPerMin: integer("units_per_min").notNull().default(12),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    groupUniq: uniqueIndex("ems_criteria_group_uniq").on(t.groupCode),
  }),
);

export const emsReading = pgTable(
  "ems_reading",
  {
    id: serial("id").primaryKey(),
    equipmentId: integer("equipment_id")
      .notNull()
      .references(() => emsEquipment.id, { onDelete: "cascade" }),
    ts: timestamp("ts", { withTimezone: true }).notNull(),
    currentAmp: real("current_amp").notNull(),
  },
  (t) => ({
    equipTsIdx: index("ems_reading_equip_ts_idx").on(t.equipmentId, t.ts),
    equipTsUniq: uniqueIndex("ems_reading_equip_ts_uniq").on(t.equipmentId, t.ts),
  }),
);

export const emsDowntimeEvent = pgTable(
  "ems_downtime_event",
  {
    id: serial("id").primaryKey(),
    equipmentId: integer("equipment_id")
      .notNull()
      .references(() => emsEquipment.id, { onDelete: "cascade" }),
    startTs: timestamp("start_ts", { withTimezone: true }).notNull(),
    endTs: timestamp("end_ts", { withTimezone: true }).notNull(),
    durationMin: integer("duration_min").notNull(),
    state: varchar("state", { length: 8 }).notNull(),
    causeCategory: varchar("cause_category", { length: 16 }),
    causeDetail: text("cause_detail"),
    recordedBy: varchar("recorded_by", { length: 64 }),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    equipStartIdx: index("ems_event_equip_start_idx").on(
      t.equipmentId,
      t.startTs,
    ),
    equipStartUniq: uniqueIndex("ems_event_equip_start_uniq").on(
      t.equipmentId,
      t.startTs,
    ),
    causeIdx: index("ems_event_cause_idx").on(t.causeCategory),
  }),
);

export const emsAlertRule = pgTable("ems_alert_rule", {
  id: serial("id").primaryKey(),
  type: varchar("type", { length: 32 }).notNull(),
  target: varchar("target", { length: 64 }).notNull().default("ALL"),
  threshold: real("threshold").notNull(),
  cooldownMin: integer("cooldown_min").notNull().default(60),
  active: boolean("active").notNull().default(true),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const emsAlertChannel = pgTable(
  "ems_alert_channel",
  {
    id: serial("id").primaryKey(),
    email: varchar("email", { length: 128 }).notNull(),
    name: varchar("name", { length: 64 }),
    active: boolean("active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    emailUniq: uniqueIndex("ems_alert_channel_email_uniq").on(t.email),
  }),
);

export const emsAlertLog = pgTable(
  "ems_alert_log",
  {
    id: serial("id").primaryKey(),
    ruleId: integer("rule_id").references(() => emsAlertRule.id, {
      onDelete: "set null",
    }),
    equipmentId: integer("equipment_id").references(() => emsEquipment.id, {
      onDelete: "set null",
    }),
    type: varchar("type", { length: 32 }).notNull(),
    severity: varchar("severity", { length: 16 }).notNull().default("warn"),
    message: text("message").notNull(),
    observedValue: real("observed_value"),
    recipients: text("recipients").notNull(),
    status: varchar("status", { length: 16 }).notNull().default("sent"),
    sentAt: timestamp("sent_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    sentIdx: index("ems_alert_log_sent_idx").on(t.sentAt),
    ruleEquipIdx: index("ems_alert_log_rule_equip_idx").on(
      t.ruleId,
      t.equipmentId,
    ),
  }),
);

export const emsEquipmentRelations = relations(emsEquipment, ({ many }) => ({
  readings: many(emsReading),
  downtimeEvents: many(emsDowntimeEvent),
}));

export const emsReadingRelations = relations(emsReading, ({ one }) => ({
  equipment: one(emsEquipment, {
    fields: [emsReading.equipmentId],
    references: [emsEquipment.id],
  }),
}));

export const emsDowntimeEventRelations = relations(
  emsDowntimeEvent,
  ({ one }) => ({
    equipment: one(emsEquipment, {
      fields: [emsDowntimeEvent.equipmentId],
      references: [emsEquipment.id],
    }),
  }),
);

export const emsAlertLogRelations = relations(emsAlertLog, ({ one }) => ({
  rule: one(emsAlertRule, {
    fields: [emsAlertLog.ruleId],
    references: [emsAlertRule.id],
  }),
  equipment: one(emsEquipment, {
    fields: [emsAlertLog.equipmentId],
    references: [emsEquipment.id],
  }),
}));

export type Equipment = typeof emsEquipment.$inferSelect;
export type NewEquipment = typeof emsEquipment.$inferInsert;
export type Criteria = typeof emsCriteria.$inferSelect;
export type Reading = typeof emsReading.$inferSelect;
export type NewReading = typeof emsReading.$inferInsert;
export type DowntimeEvent = typeof emsDowntimeEvent.$inferSelect;
export type NewDowntimeEvent = typeof emsDowntimeEvent.$inferInsert;
export type AlertRule = typeof emsAlertRule.$inferSelect;
export type AlertChannel = typeof emsAlertChannel.$inferSelect;
export type AlertLog = typeof emsAlertLog.$inferSelect;

export const sqlFragments = { now: sql`now()` };
