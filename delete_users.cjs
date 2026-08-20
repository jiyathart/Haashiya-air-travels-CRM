const fs = require('fs');
const path = require('path');
const dbPath = path.join(__dirname, 'data', 'db.json');

if (fs.existsSync(dbPath)) {
  const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
  const emailsToRemove = [
    'admin@haashiyatravels.com',
    'mdsha7576@gmail.com',
    'haashiyacsc@gmail.com'
  ];
  
  if (db.staff) {
    const originalCount = db.staff.length;
    db.staff = db.staff.filter(s => !emailsToRemove.includes(s.email));
    console.log(`Removed ${originalCount - db.staff.length} staff from local DB.`);
    fs.writeFileSync(dbPath, JSON.stringify(db, null, 2), 'utf8');
  }
} else {
  console.log('db.json not found');
}
