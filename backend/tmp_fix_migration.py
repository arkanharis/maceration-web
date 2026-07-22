from pathlib import Path
path = Path('migrations/1784616090000_add_google_id_to_users.cjs')
path.write_text('''/* eslint-disable camelcase */

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
''', encoding='utf-8')
print('migration fixed')
