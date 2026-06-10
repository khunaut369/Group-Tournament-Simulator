// tab5.js

// 1. ฟังก์ชันสร้างข้อความ Export และแสดงลงใน Textarea
// tab5.js (เวอร์ชันอัปเดตระดมข้อมูลส่งออกคู่ขนาน)

// 1. ฟังก์ชันสร้างข้อความส่งออก (ดึงข้อมูลแสดงผลทั้ง 2 กล่องพร้อมกัน)
// ฟังก์ชันสร้างข้อความส่งออก (เวอร์ชันเพิ่มฟีฟ่าเดย์นำหน้าผลในเวลา)
function renderExportData() {
    const outputArea = document.getElementById('exportDataOutput');
    const scoresArea = document.getElementById('exportScoresOutput');
    
    // ตรวจสอบว่ามีข้อมูลการแข่งขันในระบบหรือยัง
    if (!fixturesData || Object.keys(fixturesData).length === 0) {
        const fallbackMsg = "ยังไม่มีข้อมูลการแข่งขัน กรุณาจัดโปรแกรมในแท็บที่ 3 ก่อนครับ";
        if (outputArea) outputArea.value = fallbackMsg;
        if (scoresArea) scoresArea.value = fallbackMsg;
        return;
    }

    let exportLines = []; // เก็บข้อความรหัสอ้างอิงเดิม
    let scoreLines = [];  // เก็บข้อความผลสกอร์ในเวลา (fd,id1,score1,score2,id2)

    // เรียงลำดับชื่อกลุ่มให้ออกมาเป็นระเบียบ
    const sortedGroups = Object.keys(fixturesData).sort((a, b) => a.localeCompare(b, undefined, {numeric: true}));

    // วนลูปสแกนตามลำดับ: กลุ่ม -> รอบ -> คู่
    sortedGroups.forEach(group => {
        fixturesData[group].forEach((roundMatches, roundIndex) => {
            
            // 1. ดึงค่าฟีฟ่าเดย์ของรอบนั้นๆ มารอไว้ก่อนคำนวณรายคู่
            const roundNum = roundIndex + 1;
            const fdInput = document.getElementById(`fifaDayInput_R${roundNum}`);
            const fdValue = fdInput ? (fdInput.value || "...") : "...";

            roundMatches.forEach((match, matchIndex) => {
                // คัดกรองเอาเฉพาะคู่การแข่งขันที่มีการสุ่มผลสกอร์เรียบร้อยแล้ว
                if (match.scoreHome !== null && match.scoreAway !== null) {
                    
                    // แถวรหัสอ้างอิงเดิม (ตัวบน)
                    if (match.resultExport) {
                        exportLines.push(match.resultExport);
                    }
                    
                    // แถวผลสกอร์ในเวลา: เติม fdValue นำหน้า และห้อยท้ายด้วย ,x,x 
                    scoreLines.push(`${fdValue},${match.home.id},${match.scoreHome},${match.scoreAway},${match.away.id},x,x`);
                }
            });
        });
    });

    const emptyMsg = "ยังไม่มีคู่ใดถูกสุ่มผลการแข่งขัน กรุณากดสุ่มผลในแท็บที่ 3 ก่อนครับ";

    // อัปเดตข้อมูลลงกล่องข้อความ
    if (outputArea) outputArea.value = (exportLines.length === 0) ? emptyMsg : exportLines.join('\n');
    if (scoresArea) scoresArea.value = (scoreLines.length === 0) ? emptyMsg : scoreLines.join('\n');
}

// 2. ฟังก์ชันสำหรับปุ่มคัดลอกข้อมูล "รหัสอ้างอิงเดิม"
function copyExportData() {
    const outputArea = document.getElementById('exportDataOutput');
    const textToCopy = outputArea.value.trim();

    if (!textToCopy || textToCopy.includes("ยังไม่มีข้อมูล") || textToCopy.includes("ยังไม่มีคู่ใด")) {
        alert("ไม่มีข้อมูลสำหรับคัดลอกครับ");
        return;
    }

    outputArea.select();
    outputArea.setSelectionRange(0, 99999);

    navigator.clipboard.writeText(textToCopy).then(() => {
        const btn = document.querySelector('.btn-copy-code'); // เจาะจงปุ่มรหัสโค้ด
        const originalText = btn.innerText;
        btn.innerText = "✅ คัดลอกรหัสอ้างอิงสำเร็จ!";
        btn.style.backgroundColor = "#28a745";
        
        setTimeout(() => {
            btn.innerText = originalText;
            btn.style.backgroundColor = "";
        }, 2000);
    }).catch(err => {
        alert("เกิดข้อผิดพลาด ไม่สามารถคัดลอกได้ครับ");
    });
}

// 3. ฟังก์ชันสำหรับปุ่มคัดลอกข้อมูล "ผลการแข่งขันในเวลา" (เพิ่มใหม่)
function copyExportScores() {
    const scoresArea = document.getElementById('exportScoresOutput');
    const textToCopy = scoresArea.value.trim();

    if (!textToCopy || textToCopy.includes("ยังไม่มีข้อมูล") || textToCopy.includes("ยังไม่มีคู่ใด")) {
        alert("ไม่มีข้อมูลสำหรับคัดลอกครับ");
        return;
    }

    scoresArea.select();
    scoresArea.setSelectionRange(0, 99999);

    navigator.clipboard.writeText(textToCopy).then(() => {
        const btn = document.querySelector('.btn-copy-scores'); // เจาะจงปุ่มสกอร์คะแนน
        const originalText = btn.innerText;
        btn.innerText = "✅ คัดลอกผลสกอร์สำเร็จ!";
        btn.style.backgroundColor = "#28a745";
        
        setTimeout(() => {
            btn.innerText = originalText;
            btn.style.backgroundColor = "";
        }, 2000);
    }).catch(err => {
        alert("เกิดข้อผิดพลาด ไม่สามารถคัดลอกได้ครับ");
    });
}

// ... ฟังก์ชัน exportTournamentSave() ส่วนล่างสุดของไฟล์ให้คงไว้เหมือนเดิม ไม่ต้องลบครับ ...

// นำโค้ดชุดนี้ไปวางไว้ล่างสุดของไฟล์ tab5.js

// ฟังก์ชันส่งออกไฟล์เซฟ (Export Save File)
// ฟังก์ชันส่งออกไฟล์เซฟ (Export Save File) - อัปเดตรองรับระบบไฮไลท์
// ฟังก์ชันส่งออกไฟล์เซฟ (Export Save File) - เวอร์ชันอัปเดตระบบตั้งชื่อไฟล์ตามชื่อทัวร์นาเมนต์
function exportTournamentSave() {
    if (tournamentTeams.length === 0 && (!fixturesData || Object.keys(fixturesData).length === 0)) {
        alert("ยังไม่มีข้อมูลทัวร์นาเมนต์ให้บันทึกครับ");
        return;
    }

    const fifaDaysSaved = {};
    for (let r = 1; r <= maxRoundsGlobal; r++) {
        const input = document.getElementById(`fifaDayInput_R${r}`);
        if (input) fifaDaysSaved[r] = input.value;
    }

    let isHighlightEnabled = false;
    let hlConfig = {};
    const highlightCb = document.getElementById('enableBestHighlight');
    
    if (highlightCb) {
        isHighlightEnabled = highlightCb.checked;
        if (typeof getHighlightConfig === 'function') {
            hlConfig = getHighlightConfig();
        }
    }

    // ดึงค่าชื่อทัวร์นาเมนต์จากแท็บ 1 (ถ้าไม่ได้กรอกให้ใช้คำว่า tournament เป็นค่าเริ่มต้น)
    const tournamentNameInput = document.getElementById('tournamentName');
    const tournamentName = tournamentNameInput ? (tournamentNameInput.value.trim() || 'tournament') : 'tournament';

    const saveData = {
        settings: {
            tournamentName: tournamentName, // บันทึกชื่อทัวร์นาเมนต์ลงไฟล์เซฟ
            csvText: document.getElementById('csvInput').value,
            rounds: document.getElementById('rounds').value,
            coefficient: document.getElementById('coefficient').value,
            tiebreaker: document.getElementById('tiebreaker').value,
            enableBestHighlight: isHighlightEnabled,
            highlightConfig: hlConfig,
            enableAutoOvr: document.getElementById('enableAutoOvr') ? document.getElementById('enableAutoOvr').checked : false,
            ovrAdjWin: document.getElementById('ovr_adj_win') ? document.getElementById('ovr_adj_win').value : 0,
            ovrAdjDraw: document.getElementById('ovr_adj_draw') ? document.getElementById('ovr_adj_draw').value : 0,
            ovrAdjLoss: document.getElementById('ovr_adj_loss') ? document.getElementById('ovr_adj_loss').value : 0
        },
        tournamentTeams: tournamentTeams,
        fixturesData: fixturesData,
        maxRoundsGlobal: maxRoundsGlobal,
        fifaDays: fifaDaysSaved
    };

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(saveData, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    
    // คำนวณเวลาปัจจุบันเฉพาะ ชั่วโมง + นาที (เช่น 1015)
    const d = new Date();
    const hours = d.getHours().toString().padStart(2, '0');
    const minutes = d.getMinutes().toString().padStart(2, '0');
    const timeFormat = `(${hours}${minutes})`; // ได้รูปแบบ (ชมนาที) เช่น (1015)
    
    // ตั้งชื่อไฟล์ตามเงื่อนไข: ชื่อทัวร์นาเมนต์(ชมนาที).json
    downloadAnchorNode.setAttribute("download", `${tournamentName}${timeFormat}.json`);
    
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
}