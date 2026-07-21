/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.createType("device_status", ["unclaimed", "claimed"]);
  pgm.createType("connection_status", ["online", "offline"]);

  pgm.createTable("devices", {
    id: {
      type: "uuid",
      primaryKey: true,
      default: pgm.func("gen_random_uuid()"),
    },
    device_code: { type: "varchar(50)", notNull: true, unique: true },
    device_secret_hash: { type: "varchar(255)", notNull: true },
    name: { type: "varchar(255)", notNull: true },
    status: { type: "device_status", notNull: true, default: "unclaimed" },
    connection_status: {
      type: "connection_status",
      notNull: true,
      default: "offline",
    },
    last_seen_at: { type: "timestamp", notNull: false },
    owner_id: {
      type: "uuid",
      notNull: false,
      references: "users",
      onDelete: "SET NULL",
    },
    created_at: {
      type: "timestamp",
      notNull: true,
      default: pgm.func("now()"),
    },
    claimed_at: { type: "timestamp", notNull: false },
  });

  pgm.createIndex("devices", "device_code");
  pgm.createIndex("devices", "owner_id");
};

exports.down = (pgm) => {
  pgm.dropTable("devices");
  pgm.dropType("device_status");
  pgm.dropType("connection_status");
};
