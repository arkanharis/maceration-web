/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.createTable("device_logs", {
    id: {
      type: "bigserial",
      primaryKey: true,
    },
    device_id: {
      type: "uuid",
      notNull: true,
      references: "devices",
      onDelete: "CASCADE",
    },
    temperature: { type: "float", notNull: false },
    rpm: { type: "integer", notNull: false },
    relay_state: { type: "jsonb", notNull: false },
    recorded_at: {
      type: "timestamp",
      notNull: true,
      default: pgm.func("now()"),
    },
  });

  // Used heavily for history queries filtered by device + time range
  pgm.createIndex("device_logs", ["device_id", "recorded_at"]);
};

exports.down = (pgm) => {
  pgm.dropTable("device_logs");
};
