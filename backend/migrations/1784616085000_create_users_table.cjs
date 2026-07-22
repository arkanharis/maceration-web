/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.createExtension("pgcrypto", { ifNotExists: true });

  pgm.createType("global_role", ["superadmin", "user"]);

  pgm.createTable("users", {
    id: {
      type: "uuid",
      primaryKey: true,
      default: pgm.func("gen_random_uuid()"),
    },
    name: { type: "varchar(255)", notNull: true },
    email: { type: "varchar(255)", notNull: true, unique: true },
    password_hash: { type: "varchar(255)" },
    global_role: { type: "global_role", notNull: true, default: "user" },
    created_at: {
      type: "timestamp",
      notNull: true,
      default: pgm.func("now()"),
    },
  });

  pgm.createIndex("users", "email");
};

exports.down = (pgm) => {
  pgm.dropTable("users");
  pgm.dropType("global_role");
};
