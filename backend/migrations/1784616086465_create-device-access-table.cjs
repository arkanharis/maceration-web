/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.createType("device_access_role", ["owner", "operator", "viewer"]);

  pgm.createTable("device_access", {
    id: {
      type: "uuid",
      primaryKey: true,
      default: pgm.func("gen_random_uuid()"),
    },
    device_id: {
      type: "uuid",
      notNull: true,
      references: "devices",
      onDelete: "CASCADE",
    },
    user_id: {
      type: "uuid",
      notNull: true,
      references: "users",
      onDelete: "CASCADE",
    },
    role: { type: "device_access_role", notNull: true },
    granted_by: {
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
  });

  // One user can only have one role per device
  pgm.addConstraint("device_access", "device_access_device_user_unique", {
    unique: ["device_id", "user_id"],
  });

  pgm.createIndex("device_access", "device_id");
  pgm.createIndex("device_access", "user_id");
};

exports.down = (pgm) => {
  pgm.dropTable("device_access");
  pgm.dropType("device_access_role");
};
