// tab3.js

// ตัวแปรเก็บข้อมูลโปรแกรมแข่งขันและฟีฟ่าเดย์
let fixturesData = {}; 
let maxRoundsGlobal = 0; 

// 1. ฟังก์ชันหลักเมื่อกดปุ่ม "สุ่มจัดโปรแกรมการแข่งขัน"
// 1. ฟังก์ชันหลักเมื่อกดปุ่ม "สุ่มจัดโปรแกรมการแข่งขัน" (อัปเดตแก้บั๊คข้อมูล)
function generateFixtures() {
    // 🔥 แก้บั๊ค: บังคับให้ระบบประมวลผลดึงข้อมูล CSV จากแท็บ 1 ใหม่เสมอทันทีที่กดปุ่ม
    if (typeof parseCSVAndRenderTeams === 'function') {
        parseCSVAndRenderTeams();
    }

    // ตรวจสอบข้อมูลว่าโหลดมาครบถ้วนหรือไม่
    if (!tournamentTeams || tournamentTeams.length === 0) {
        alert("กรุณากรอกข้อมูลทีมในแท็บที่ 1 ให้ถูกต้องก่อนครับ\n(รูปแบบ: id,ชื่อทีม,กลุ่ม,ovr)");
        return;
    }

    const coefficient = document.getElementById('coefficient').value || 35;
    const playRoundsMultiplier = parseInt(document.getElementById('rounds').value) || 1;
    
    // จัดกลุ่มทีม (Group By Group)
    const groupedTeams = {};
    tournamentTeams.forEach(team => {
        if (!groupedTeams[team.group]) groupedTeams[team.group] = [];
        groupedTeams[team.group].push(team);
    });

    fixturesData = {};
    maxRoundsGlobal = 0;

    // สร้างโปรแกรมการแข่งขันของแต่ละกลุ่ม
    for (const group in groupedTeams) {
        let teamsInGroup = [...groupedTeams[group]];
        
        // สุ่มลำดับทีม (Shuffle) เพื่อให้การจับคู่เปลี่ยนไปทุกครั้งที่กด
        teamsInGroup = teamsInGroup.sort(() => Math.random() - 0.5);

        // สร้างการจับคู่แบบพบกันหมด (Round-Robin Algorithm)
        const groupFixtures = generateRoundRobin(teamsInGroup, playRoundsMultiplier);
        fixturesData[group] = groupFixtures;
        
        if (groupFixtures.length > maxRoundsGlobal) {
            maxRoundsGlobal = groupFixtures.length;
        }
    }

    renderFixturesUI();
    
    // อัปเดตล้างตารางคะแนนในแท็บ 4 ให้สอดคล้องกับโปรแกรมใหม่
    if (typeof updateStandings === 'function') {
        updateStandings();
    }
}

// 2. อัลกอริทึมจัดตารางแบบพบกันหมด (Round-Robin)
function generateRoundRobin(teams, multiplier) {
    let schedule = [];
    let isOdd = teams.length % 2 !== 0;
    let localTeams = [...teams];
    
    // ถ้ามีจำนวนทีมเป็นคี่ ให้เพิ่มทีมดัมมี่เข้าไปเพื่อทำหน้าที่เป็น "ทีมที่ได้พัก (Bye)"
    if (isOdd) {
        localTeams.push({ id: 'BYE', name: 'BYE' });
    }

    let numTeams = localTeams.length;
    let rounds = numTeams - 1;
    let halfSize = numTeams / 2;

    // วนลูปตามตัวคูณจำนวนรอบ (เช่น แข่งเหย้า-เยือน ตัวคูณ = 2)
    for (let m = 0; m < multiplier; m++) {
        // วนจัดคู่แต่ละรอบการแข่งขัน
        for (let round = 0; round < rounds; round++) {
            let roundMatches = [];
            
            for (let i = 0; i < halfSize; i++) {
                let home = localTeams[i];
                let away = localTeams[numTeams - 1 - i];
                
                // สลับเหย้าเยือนในการเจอกันรอบที่สอง
                if (m % 2 !== 0) {
                    let temp = home; home = away; away = temp;
                }

                // ข้ามการจับคู่ถ้าทีมใดทีมหนึ่งคือทีมดัมมี่ (ได้พัก)
                if (home.id !== 'BYE' && away.id !== 'BYE') {
                    roundMatches.push({
                        home: home,
                        away: away,
                        scoreHome: null,
                        scoreAway: null,
                        resultExport: "รอผลแข่ง"
                    });
                }
            }
            schedule.push(roundMatches);
            
            // หมุนเวียนทีม (Rotation) เพื่อจัดคู่ในรอบถัดไป
            localTeams.splice(1, 0, localTeams.pop());
        }
    }
    return schedule;
}

// 3. ฟังก์ชันสร้างหน้าตา UI สำหรับแท็บ 3
function renderFixturesUI() {
    const fifaContainer = document.getElementById('fifaDayContainer');
    const fixturesContainer = document.getElementById('fixturesContainer');
    
    // -- สร้างช่องกรอกฟีฟ่าเดย์ด้านบน --
    fifaContainer.style.display = 'block';
    fifaContainer.innerHTML = '<h4>ตั้งค่าฟีฟ่าเดย์</h4>';
    for (let r = 1; r <= maxRoundsGlobal; r++) {
        fifaContainer.innerHTML += `
            <div class="fifa-day-row">
                <label>รอบที่ ${r} :</label>
                <input type="text" id="fifaDayInput_R${r}" placeholder="เช่น 1, 2, 3..." onkeyup="updateFifaDayUI(${r}, this.value)">
            </div>
        `;
    }

    // -- สร้างรายการแข่ง --
    fixturesContainer.innerHTML = '';
    
    for (const group in fixturesData) {
        const groupDiv = document.createElement('div');
        groupDiv.className = 'group-container';
        
        // ชื่อกลุ่ม
        groupDiv.innerHTML += `<div class="group-header">กลุ่มที่ ${group}</div>`;
        
        // ดึงรอบของกลุ่มนั้น
        fixturesData[group].forEach((roundMatches, roundIndex) => {
            const actualRoundNum = roundIndex + 1;
            
            // หัวข้อของรอบนั้นๆ
            groupDiv.innerHTML += `<div class="round-header" id="roundHeader_${group}_R${actualRoundNum}">รอบที่ ${actualRoundNum} - ฟีฟ่าเดย์ที่ <span class="fd-display-r${actualRoundNum}">...</span></div>`;
            
            // รายชื่อคู่แข่งในรอบ
            // ค้นหาและแทนที่ส่วนนี้ใน renderFixturesUI 
roundMatches.forEach((match, matchIndex) => {
    const matchId = `match_${group}_R${actualRoundNum}_M${matchIndex}`;
    
    // ตรวจสอบว่าคู่นี้ถูกสุ่มผลไปแล้วหรือยัง เพื่อดึงตัวเลขสกอร์มาโชว์ตอนวาดหน้าจอใหม่
    const btnText = (match.scoreHome !== null && match.scoreAway !== null) 
        ? `${match.scoreHome} - ${match.scoreAway}` 
        : "สุ่มผล";

    groupDiv.innerHTML += `
        <div class="match-item">
            <div class="match-row">
                <span class="team-name home">${match.home.name}</span>
                <button id="btn_${matchId}" class="btn-simulate" onclick="simulateMatch('${group}', ${roundIndex}, ${matchIndex}, '${matchId}')">${btnText}</button>
                <span class="team-name away">${match.away.name}</span>
                <button class="btn-clear-match" onclick="clearMatchResult('${group}', ${roundIndex}, ${matchIndex}, '${matchId}')" title="ล้างผลคู่นี้">✖</button>
            </div>
            <div class="export-code" id="export_${matchId}">
                ${match.resultExport}
            </div>
        </div>
    `;
});
        });
        
        fixturesContainer.appendChild(groupDiv);
    }
}

// 4. ฟังก์ชันจัดการเมื่อผู้ใช้พิมพ์กำหนดฟีฟ่าเดย์ที่ส่วนบนสุด
function updateFifaDayUI(roundNum, value) {
    const displayValue = value.trim() === '' ? '...' : value;
    const coefficient = document.getElementById('coefficient').value || 35;
    
    // อัปเดตตัวหนังสือในหัวรอบ (เช่น ฟีฟ่าเดย์ที่ 1)
    const elements = document.querySelectorAll(`.fd-display-r${roundNum}`);
    elements.forEach(el => el.innerText = displayValue);

    // อัปเดต Export String เฉพาะคู่ที่มีการสุ่มผลไปแล้วในรอบนั้น
    for (const group in fixturesData) {
        const roundIndex = roundNum - 1;
        if(fixturesData[group][roundIndex]) {
            fixturesData[group][roundIndex].forEach((match, matchIndex) => {
                if (match.scoreHome !== null && match.scoreAway !== null) {
                    const matchId = `match_${group}_R${roundNum}_M${matchIndex}`;
                    updateExportString(match, value, coefficient, matchId);
                }
            });
        }
    }
}

// ฟังก์ชันจำลองผลสกอร์ (อัปเดตใช้อัลกอริทึม Poisson Distribution และ OVR)
// ค้นหาและแทนที่ฟังก์ชัน simulateMatch ทั้งหมดด้วยโค้ดนี้
function simulateMatch(group, roundIndex, matchIndex, matchId) {
    const match = fixturesData[group][roundIndex][matchIndex];
    
    // 1. ดึงค่าพลัง (OVR) อัปเดตล่าสุดจากฐานข้อมูลหลัก tournamentTeams โดยเทียบจาก ID ทีม
    const currentHome = tournamentTeams.find(t => t.id === match.home.id);
    const currentAway = tournamentTeams.find(t => t.id === match.away.id);
    
    // ค้นหาส่วนนี้ในฟังก์ชัน simulateMatch แล้วเปลี่ยนเป็น:
    
// 1. ดึงค่าพลัง (OVR) อัปเดตล่าสุดจากระบบ Dynamic OVR
    const homePower = getDynamicOvr(match.home.id);
    const awayPower = getDynamicOvr(match.away.id);
    
    // 2. คำนวณความต่างของค่าพลังและค่า Expected Goals (Poisson)
    const powerDiff = homePower - awayPower;
    const lambdaHome = Math.max(0.1, 1.3 + (powerDiff * 0.03));
    const lambdaAway = Math.max(0.1, 1.3 - (powerDiff * 0.03));
    
    // 3. สุ่มประตู
    match.scoreHome = poissonRandom(lambdaHome);
    match.scoreAway = poissonRandom(lambdaAway);

    // อัปเดตปุ่มสุ่มผลเป็นสกอร์
    const btn = document.getElementById(`btn_${matchId}`);
    btn.innerText = `${match.scoreHome} - ${match.scoreAway}`;

    // ส่งข้อมูลไปสร้างรหัส Export Text
    const roundNum = roundIndex + 1;
    const fdInput = document.getElementById(`fifaDayInput_R${roundNum}`);
    const fdValue = fdInput ? (fdInput.value || "...") : "...";
    const coefficient = document.getElementById('coefficient').value || 35;
    
    updateExportString(match, fdValue, coefficient, matchId);

    // อัปเดตตารางคะแนน
    if (typeof updateStandings === 'function') {
        updateStandings();
    }
}

// 6. ฟังก์ชันคำนวณและอัปเดต Export String (fd,id1,r,id2,c)
// ฟังก์ชันคำนวณและอัปเดต Export String
function updateExportString(match, fdValue, coefficient, matchId) {
    let resultHomeStr = "";
    if (match.scoreHome > match.scoreAway) {
        resultHomeStr = "w";
    } else if (match.scoreHome < match.scoreAway) {
        resultHomeStr = "l";
    } else {
        resultHomeStr = "d";
    }

    // อัปเดตรูปแบบการส่งออกให้มี ,g ต่อท้าย
    const exportStr = `${fdValue},${match.home.id},${resultHomeStr},${match.away.id},${coefficient},g`;
    match.resultExport = exportStr;

    // อัปเดต UI หน้าจอในแท็บที่ 3
    const exportDiv = document.getElementById(`export_${matchId}`);
    if (exportDiv) {
        exportDiv.innerText = exportStr;
    }
}

// ฟังก์ชันคณิตศาสตร์สำหรับสุ่มตัวเลขตามหลัก Poisson Distribution
function poissonRandom(expectedValue) {
    const L = Math.exp(-expectedValue);
    let k = 0;
    let p = 1.0;
    while (true) {
        p = p * Math.random();
        if (p <= L) {
            break;
        }
        k++;
    }
    return k;
}

// นำโค้ดนี้ไปต่อท้ายไฟล์ tab3.js
function updateCoefficientUI(newVal) {
    const coeff = newVal || 35;
    if (!fixturesData) return;
    
    // วนลูปอัปเดต Export String เฉพาะคู่ที่มีผลสกอร์แล้วในทุกกลุ่มและทุกรอบ
    for (const group in fixturesData) {
        fixturesData[group].forEach((roundMatches, roundIndex) => {
            const roundNum = roundIndex + 1;
            const fdInput = document.getElementById(`fifaDayInput_R${roundNum}`);
            const fdValue = fdInput ? (fdInput.value || "...") : "...";
            
            roundMatches.forEach((match, matchIndex) => {
                if (match.scoreHome !== null && match.scoreAway !== null) {
                    const matchId = `match_${group}_R${roundNum}_M${matchIndex}`;
                    updateExportString(match, fdValue, coeff, matchId);
                }
            });
        });
    }
}

// ฟังก์ชันล้างผลการแข่งขันรายคู่
function clearMatchResult(group, roundIndex, matchIndex, matchId) {
    const match = fixturesData[group][roundIndex][matchIndex];
    
    // เช็กว่าคู่นี้ยังไม่ได้สุ่มผล ก็ไม่ต้องทำอะไร
    if (match.scoreHome === null && match.scoreAway === null) return;

    // รีเซ็ตค่าสถิติ
    match.scoreHome = null;
    match.scoreAway = null;
    match.resultExport = "รอผลแข่ง";

    // อัปเดตหน้าจอเฉพาะคู่ที่ถูกกดล้างข้อมูล
    document.getElementById(`btn_${matchId}`).innerText = "สุ่มผล";
    document.getElementById(`export_${matchId}`).innerText = "รอผลแข่ง";

    // อัปเดตตารางคะแนน (แท็บ 4) ใหม่แบบเรียลไทม์
    if (typeof updateStandings === 'function') {
        updateStandings();
    }
}

// ฟังก์ชันคำนวณค่า OVR ปัจจุบัน ณ วินาทีนั้นแบบไดนามิก
function getDynamicOvr(teamId) {
    const team = tournamentTeams.find(t => t.id === teamId);
    if (!team) return 50; // กัน Error คืนค่ากลาง 50
    
    let currentOvr = team.ovr; // เริ่มต้นที่ OVR พื้นฐาน
    const isEnabled = document.getElementById('enableAutoOvr') && document.getElementById('enableAutoOvr').checked;
    
    if (isEnabled && fixturesData) {
        const winAdj = parseInt(document.getElementById('ovr_adj_win').value) || 0;
        const drawAdj = parseInt(document.getElementById('ovr_adj_draw').value) || 0;
        const lossAdj = parseInt(document.getElementById('ovr_adj_loss').value) || 0;
        
        let w = 0, d = 0, l = 0;
        
        // กวาดนับผลการแข่งขันทั้งหมดของทีมนั้นที่ถูกสุ่มไว้แล้วในระบบ
        for (const group in fixturesData) {
            fixturesData[group].forEach(roundMatches => {
                roundMatches.forEach(match => {
                    if (match.scoreHome !== null && match.scoreAway !== null) {
                        if (match.home.id === teamId) {
                            if (match.scoreHome > match.scoreAway) w++;
                            else if (match.scoreHome === match.scoreAway) d++;
                            else l++;
                        } else if (match.away.id === teamId) {
                            if (match.scoreAway > match.scoreHome) w++;
                            else if (match.scoreAway === match.scoreHome) d++;
                            else l++;
                        }
                    }
                });
            });
        }
        
        // ปรับค่าพลังสุทธิ (ไม่สนลำดับ สนแค่จำนวนรวม ณ ตอนนี้)
        currentOvr += (w * winAdj) + (d * drawAdj) + (l * lossAdj);
    }
    
    // บังคับไม่ให้เกิน 99 และไม่ให้ต่ำกว่า 1
    return Math.max(1, Math.min(99, currentOvr));
}