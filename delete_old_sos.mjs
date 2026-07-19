const DB_URL = "https://aivisionassistant-default-rtdb.firebaseio.com";

async function run() {
  console.log("Đang lấy danh sách các phiên kết nối từ Firebase...");
  const res = await fetch(`${DB_URL}/pairings.json`);
  const data = await res.json();
  if (!data) {
    console.log("Không có dữ liệu pairings.");
    return;
  }
  
  // Cutoff = 2026-07-18 23:59:59
  const cutoff = new Date('2026-07-19T00:00:00+07:00').getTime();

  const updates = {};
  let count = 0;
  for (const [key, value] of Object.entries(data)) {
    // Xóa những phần tử có status là SOS_ACTIVE (hoặc đã từng SOS) và timestamp <= ngày 18/7/2026
    if (value.status === 'SOS_ACTIVE' && value.timestamp < cutoff) {
      updates[key] = null; // null to delete in PATCH
      count++;
    }
  }

  if (count === 0) {
    console.log("Không tìm thấy phiên SOS cũ nào cần xóa.");
    return;
  }

  console.log(`Đang tiến hành xóa ${count} phiên SOS cũ...`);
  const patchRes = await fetch(`${DB_URL}/pairings.json`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates)
  });

  if (patchRes.ok) {
    console.log("✅ Đã xóa thành công tất cả SOS cũ!");
  } else {
    console.error("❌ Xóa thất bại:", await patchRes.text());
  }
}

run();
