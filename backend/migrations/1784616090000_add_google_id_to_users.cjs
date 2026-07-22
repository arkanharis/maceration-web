/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.addColumns("users", {
    google_id: { type: "varchar(255)" },
  });
  pgm.createIndex("users", "google_id", { ifNotExists: true });
};

exports.down = (pgm) => {
  pgm.dropIndex("users", "google_id");
  pgm.dropColumns("users", ["google_id"]);
};
