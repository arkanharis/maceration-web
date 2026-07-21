/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.createTable("device_events", {
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
    user_id: {
      type: "uuid",
      notNull: false,
      references: "users",
      onDelete: "SET NULL",
    },
    event_type: { type: "varchar(100)", notNull: true },
    detail: { type: "jsonb", notNull: false },
    created_at: {
      type: "timestamp",
      notNull: true,
      default: pgm.func("now()"),
    },
  });

  pgm.createIndex("device_events", ["device_id", "created_at"]);
  pgm.createIndex("device_events", "event_type");
};

exports.down = (pgm) => {
  pgm.dropTable("device_events");
};
