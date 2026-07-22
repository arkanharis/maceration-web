/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.alterColumn("users", "password_hash", {
    type: "varchar(255)",
    notNull: false,
  });
};

exports.down = (pgm) => {
  pgm.alterColumn("users", "password_hash", {
    type: "varchar(255)",
    notNull: true,
  });
};
