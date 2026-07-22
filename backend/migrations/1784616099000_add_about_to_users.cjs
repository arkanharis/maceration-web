/* eslint-disable camelcase */
exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.addColumn("users", {
    about: { type: "text", default: null },
  });
};

exports.down = (pgm) => {
  pgm.dropColumn("users", "about");
};
