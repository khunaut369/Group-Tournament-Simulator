// script.js
let tournamentTeams = [];

function switchTab(tabId, buttonElement) {
    const contents = document.querySelectorAll('.tab-content');
    contents.forEach(content => content.classList.remove('active'));

    const buttons = document.querySelectorAll('.tab-button');
    buttons.forEach(btn => btn.classList.remove('active'));

    document.getElementById(tabId).classList.add('active');
    buttonElement.classList.add('active');

    // โหลดข้อมูลต่างๆ ตามแท็บที่เลือก
    if (tabId === 'tab2') {
    parseCSVAndRenderTeams();
    refreshDynamicOvrUI(); // เพิ่มบรรทัดนี้
    }
    
    if (tabId === 'tab4') {
        if (typeof updateStandings === 'function') {
            updateStandings();
        }
    }

    // หากเข้าแท็บ 5 ให้ดึงข้อมูลมาแสดงที่หน้าจอ Export ทันที
    if (tabId === 'tab5') {
        if (typeof renderExportData === 'function') {
            renderExportData();
        }
    }
    
    // หากเข้าแท็บ 6 ให้คำนวณคะแนนล่าสุดและวาดตารางจัดอันดับรวม
    if (tabId === 'tab6') {
        if (typeof updateStandings === 'function') updateStandings(); // อัปเดตข้อมูลตารางก่อน
        if (typeof renderOverallRanking === 'function') renderOverallRanking(); // วาดแท็บ 6
    }
    
}

function parseCSVAndRenderTeams() {
    const csvText = document.getElementById('csvInput').value.trim();
    const container = document.getElementById('teamListContainer');
    
    // ถ้ายังเป็นแท็บ 2 ค่อยล้างข้อมูล Container
    if(container) container.innerHTML = '';
    tournamentTeams = [];

    if (!csvText) return;

    const lines = csvText.split('\n');
    lines.forEach((line) => {
        if (!line.trim()) return;
        const parts = line.split(',');
        if (parts.length >= 4) {
            tournamentTeams.push({
                id: parts[0].trim(),
                name: parts[1].trim(),
                group: parts[2].trim(),
                ovr: parseInt(parts[3].trim()) || 0
            });
        }
    });

    // วาดหน้าต่างแท็บ 2 เฉพาะเมื่ออยู่ในแท็บ 2
    if(document.getElementById('tab2').classList.contains('active')) {
        if (tournamentTeams.length === 0) {
            container.innerHTML = '<p style="color: red;">รูปแบบข้อมูลไม่ถูกต้อง กรุณาใช้รูปแบบ: id,ชื่อทีม,กลุ่ม,ovr</p>';
            return;
        }

        tournamentTeams.forEach((team, index) => {
            const teamDiv = document.createElement('div');
            teamDiv.className = 'team-item';
            teamDiv.innerHTML = `
    <div class="team-info">
        <strong>${team.name}</strong> (${team.id})
        <span>กลุ่ม: ${team.group}</span>
    </div>
    <div class="team-ovr" style="text-align: right;">
        <label>OVR พื้นฐาน:</label>
        <input type="number" value="${team.ovr}" min="1" max="99" onchange="updateOvr(${index}, this.value)">
        <div id="dyn_ovr_${team.id}" style="font-size: 13px; margin-top: 5px; font-weight: bold; min-height: 18px;"></div>
    </div>
    `;
            container.appendChild(teamDiv);
        });
    }
}

function updateOvr(teamIndex, newValue) {
    // 1. อัปเดตค่าพลังใหม่ลงในตัวแปร Array หลัก
    const parsedValue = parseInt(newValue) || 0;
    tournamentTeams[teamIndex].ovr = parsedValue;
    
    // 2. อัปเดตข้อมูลกลับไปยังช่อง Textarea ในแท็บที่ 1
    updateCSVText();
}

// สร้างฟังก์ชันใหม่สำหรับแปลง Array กลับเป็นข้อความ CSV
function updateCSVText() {
    const csvInputArea = document.getElementById('csvInput');
    
    // นำข้อมูลทุกทีมมาต่อกันเป็นรูปแบบ "id,ชื่อทีม,กลุ่ม,ovr" และขึ้นบรรทัดใหม่
    const updatedCSVText = tournamentTeams.map(team => {
        return `${team.id},${team.name},${team.group},${team.ovr}`;
    }).join('\n');
    
    // อัปเดตข้อความกลับเข้าไปในช่องฟอร์ม
    if (csvInputArea) {
        csvInputArea.value = updatedCSVText;
    }
}

// นำโค้ดชุดนี้ไปวางไว้ล่างสุดของไฟล์ script.js

// 1. ฟังก์ชัน "ล้างข้อมูลทั้งหมด" (รีเซ็ตทุกอย่าง)
function clearAllData() {
    if (!confirm('คุณแน่ใจหรือไม่ที่จะล้างข้อมูลทั้งหมด?\n(ข้อมูลทีม การตั้งค่า และผลแข่งขันจะหายไปทั้งหมด)')) return;
    
    // ค้นหาและแทรกบรรทัดนี้ไว้ในส่วนบนของฟังก์ชัน clearAllData()
    document.getElementById('tournamentName').value = 'tournament';
    
    // คืนค่าเริ่มต้นให้ฟอร์มในแท็บ 1
    document.getElementById('csvInput').value = '';
    document.getElementById('rounds').value = '2';
    document.getElementById('coefficient').value = '35';
    document.getElementById('tiebreaker').value = 'direct';

    // ล้างค่าตัวแปรหลัก
    tournamentTeams = [];
    if (typeof fixturesData !== 'undefined') fixturesData = {};
    if (typeof maxRoundsGlobal !== 'undefined') maxRoundsGlobal = 0;

    // ล้างหน้าจอในแท็บอื่นๆ
    const teamList = document.getElementById('teamListContainer');
    if (teamList) teamList.innerHTML = '';
    
    const fifaContainer = document.getElementById('fifaDayContainer');
    if (fifaContainer) { fifaContainer.style.display = 'none'; fifaContainer.innerHTML = ''; }
    
    const fixturesContainer = document.getElementById('fixturesContainer');
    if (fixturesContainer) fixturesContainer.innerHTML = '';

    const standingsContainer = document.getElementById('standingsContainer');
    if (standingsContainer) standingsContainer.innerHTML = '<p style="color: #666; text-align: center;">กรุณากดสุ่มจัดโปรแกรมการแข่งขันและจำลองผลแข่งเพื่อดูตารางคะแนน</p>';

    const exportArea = document.getElementById('exportDataOutput');
    if (exportArea) exportArea.value = '';

    if(document.getElementById('enableBestHighlight')) {
    document.getElementById('enableBestHighlight').checked = false;
    toggleHighlightSettings();
    document.getElementById('highlightInputs').innerHTML = '';
    
    if(document.getElementById('enableAutoOvr')) {
    document.getElementById('enableAutoOvr').checked = false;
    document.getElementById('ovr_adj_win').value = 0;
    document.getElementById('ovr_adj_draw').value = 0;
    document.getElementById('ovr_adj_loss').value = 0;
    toggleAutoOvrSettings();
   }
   }
}

// 2. ฟังก์ชัน "ล้างผลการแข่งขัน" (เก็บโปรแกรมไว้ แต่ล้างเฉพาะสกอร์)
// 2. ฟังก์ชัน "ล้างผลการแข่งขัน" (เก็บโปรแกรมและฟีฟ่าเดย์ไว้ แต่ล้างเฉพาะสกอร์)
function clearAllResults() {
    if (!confirm('คุณแน่ใจหรือไม่ที่จะล้างผลการแข่งขันทั้งหมด?')) return;
    
    if (typeof fixturesData === 'undefined' || Object.keys(fixturesData).length === 0) {
        alert('ยังไม่มีผลการแข่งขันให้ล้างครับ');
        return;
    }

    // 1. **ดึงค่าฟีฟ่าเดย์ที่ผู้ใช้กรอกไว้มาเก็บสำรองก่อน**
    const savedFifaDays = {};
    if (typeof maxRoundsGlobal !== 'undefined') {
        for (let r = 1; r <= maxRoundsGlobal; r++) {
            const input = document.getElementById(`fifaDayInput_R${r}`);
            if (input) savedFifaDays[r] = input.value;
        }
    }

    // 2. วนลูปเคลียร์สกอร์ให้เป็น null ทุกกลุ่มและทุกรอบ
    for (const group in fixturesData) {
        fixturesData[group].forEach(round => {
            round.forEach(match => {
                match.scoreHome = null;
                match.scoreAway = null;
                match.resultExport = "รอผลแข่ง";
            });
        });
    }

    // 3. บังคับวาดหน้าจอใหม่ (ซึ่งมันจะล้างช่องฟีฟ่าเดย์เป็นค่าว่าง)
    if (typeof renderFixturesUI === 'function') renderFixturesUI();
    
    // 4. **นำค่าฟีฟ่าเดย์ที่สำรองไว้ หยอดกลับคืนลงไปในช่องกรอก และอัปเดตตัวหนังสือ**
    if (typeof maxRoundsGlobal !== 'undefined') {
        for (let r = 1; r <= maxRoundsGlobal; r++) {
            const input = document.getElementById(`fifaDayInput_R${r}`);
            if (input && savedFifaDays[r] !== undefined) {
                input.value = savedFifaDays[r];
                // เรียกฟังก์ชันเพื่ออัปเดตหัวข้อแต่ละรอบด้วย
                if (typeof updateFifaDayUI === 'function') {
                    updateFifaDayUI(r, savedFifaDays[r]);
                }
            }
        }
    }

    // อัปเดตตารางคะแนนและหน้าส่งออกข้อมูล
    if (typeof updateStandings === 'function') updateStandings();
    if (typeof renderExportData === 'function') {
        const exportDataOutput = document.getElementById('exportDataOutput');
        if (exportDataOutput) exportDataOutput.value = "ยังไม่มีคู่ใดถูกสุ่มผลการแข่งขัน กรุณากดสุ่มผลในแท็บที่ 3 ก่อนครับ";
    }
}

// นำโค้ดชุดนี้ไปวางไว้ล่างสุดของไฟล์ script.js

// ฟังก์ชันนำเข้าข้อมูล (Import Save File)
// ฟังก์ชันนำเข้าข้อมูล (Import Save File) - อัปเดตรองรับระบบไฮไลท์
function importTournamentData(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const saveData = JSON.parse(e.target.result);
            
            // 1. คืนค่าการตั้งค่าในแท็บ 1
            // ค้นหาส่วนนี้ใน importTournamentData แล้วแทรกโค้ดด้านล่างเข้าไป
if (saveData.settings) {
    // แทรกบรรทัดนี้: โหลดชื่อทัวร์นาเมนต์กลับคืนมาแสดงผลที่ช่องกรอก
    if (saveData.settings.tournamentName !== undefined) {
        document.getElementById('tournamentName').value = saveData.settings.tournamentName;
    }
    
    document.getElementById('csvInput').value = saveData.settings.csvText || '';
    // ... โค้ดเดิมที่เหลือ ...
                document.getElementById('rounds').value = saveData.settings.rounds || 2;
                document.getElementById('coefficient').value = saveData.settings.coefficient || 35;
                document.getElementById('tiebreaker').value = saveData.settings.tiebreaker || 'direct';
                
                const autoOvrCb = document.getElementById('enableAutoOvr');
if (autoOvrCb && saveData.settings.enableAutoOvr !== undefined) {
    autoOvrCb.checked = saveData.settings.enableAutoOvr;
    document.getElementById('ovr_adj_win').value = saveData.settings.ovrAdjWin || 0;
    document.getElementById('ovr_adj_draw').value = saveData.settings.ovrAdjDraw || 0;
    document.getElementById('ovr_adj_loss').value = saveData.settings.ovrAdjLoss || 0;
    if (typeof toggleAutoOvrSettings === 'function') toggleAutoOvrSettings();
   }

                // โหลดการตั้งค่าไฮไลท์กลับมา
                const highlightCb = document.getElementById('enableBestHighlight');
                if (highlightCb && saveData.settings.enableBestHighlight !== undefined) {
                    highlightCb.checked = saveData.settings.enableBestHighlight;
                    
                    // สั่งวาดกล่อง input ช่องกรอกจำนวนทีมขึ้นมาก่อน
                    if (typeof toggleHighlightSettings === 'function') {
                        toggleHighlightSettings();
                    }
                    
                    // หยอดตัวเลขจำนวนทีมที่เซฟไว้ กลับลงไปในกล่อง input ที่ถูกวาด
                    if (saveData.settings.highlightConfig) {
                        for (const rank in saveData.settings.highlightConfig) {
                            const input = document.getElementById(`best_rank_${rank}`);
                            if (input) {
                                input.value = saveData.settings.highlightConfig[rank];
                            }
                        }
                    }
                }
            }

            // 2. คืนค่าตัวแปรหลัก
            tournamentTeams = saveData.tournamentTeams || [];
            fixturesData = saveData.fixturesData || {};
            maxRoundsGlobal = saveData.maxRoundsGlobal || 0;

            // 3. วาด UI หน้าจอใหม่
            if (typeof renderFixturesUI === 'function' && Object.keys(fixturesData).length > 0) {
                renderFixturesUI(); 
                
                if (saveData.fifaDays) {
                    for (let r = 1; r <= maxRoundsGlobal; r++) {
                        const input = document.getElementById(`fifaDayInput_R${r}`);
                        if (input && saveData.fifaDays[r]) {
                            input.value = saveData.fifaDays[r];
                            if (typeof updateFifaDayUI === 'function') {
                                updateFifaDayUI(r, saveData.fifaDays[r]); 
                            }
                        }
                    }
                }
            }

            // 4. อัปเดตตารางคะแนน
            if (typeof updateStandings === 'function') {
                updateStandings();
            }

            alert('✅ นำเข้าข้อมูลสำเร็จ! ระบบโหลดการตั้งค่าไฮไลท์และผลการแข่งขันกลับมาครบถ้วนครับ');
            
        } catch (error) {
            console.error("Import Error:", error);
            alert("❌ เกิดข้อผิดพลาด: รูปแบบไฟล์ไม่ถูกต้อง หรือไฟล์อาจเสียหาย");
        }
        
        event.target.value = '';
    };
    
    reader.readAsText(file);
}

// --- ระบบตั้งค่าไฮไลท์ (แท็บ 1) ---

// เปิด-ปิด การแสดงผลตั้งค่าไฮไลท์
function toggleHighlightSettings() {
    const container = document.getElementById('highlightSettingsContainer');
    const isChecked = document.getElementById('enableBestHighlight').checked;
    container.style.display = isChecked ? 'block' : 'none';
    
    if (isChecked) {
        generateHighlightInputs();
    }
    
    // อัปเดตตารางคะแนนทันทีถ้าเปิดแท็บ 4 ค้างไว้
    if (typeof updateStandings === 'function') updateStandings();
}

// สร้างช่องกรอกจำนวนทีมอัตโนมัติอ้างอิงตามจำนวนทีมต่อกลุ่มที่มีใน CSV
function generateHighlightInputs() {
    const csvText = document.getElementById('csvInput').value.trim();
    const container = document.getElementById('highlightInputs');
    
    if (!csvText) {
        container.innerHTML = '<p style="color:red; font-size:14px;">กรุณากรอกข้อมูลทีมในช่องด้านบนก่อนครับ</p>';
        return;
    }

    // นับหาจำนวนทีมที่เยอะที่สุดใน 1 กลุ่ม
    const lines = csvText.split('\n');
    const groupCounts = {};
    lines.forEach(line => {
        if (!line.trim()) return;
        const parts = line.split(',');
        if (parts.length >= 4) {
            const group = parts[2].trim();
            groupCounts[group] = (groupCounts[group] || 0) + 1;
        }
    });

    const maxTeams = Math.max(...Object.values(groupCounts));
    if (maxTeams === -Infinity) return;

    // ดึงค่าเก่าที่ผู้ใช้เคยกรอกไว้มาเก็บก่อนวาดใหม่
    const oldValues = getHighlightConfig();

    let html = '';
    for (let i = 1; i <= maxTeams; i++) {
        const val = oldValues[i] || 0;
        html += `
            <div class="highlight-row">
                <label>อันดับ ${i} ดีที่สุด :</label>
                <input type="number" id="best_rank_${i}" min="0" value="${val}" onchange="if(typeof updateStandings === 'function') updateStandings();">
                <span style="margin-left: 10px; color: #666;">ทีม</span>
            </div>
        `;
    }
    container.innerHTML = html;
}

// ดึงค่าคอนฟิกจำนวนทีมที่ต้องการให้ไฮไลท์ทั้งหมด
function getHighlightConfig() {
    const config = {};
    for (let i = 1; i <= 20; i++) { // รองรับสูงสุด 20 ทีมต่อกลุ่ม
        const input = document.getElementById(`best_rank_${i}`);
        if (input) {
            config[i] = parseInt(input.value) || 0;
        }
    }
    return config;
}

// ระบบเปิด-ปิดหน้าต่างและแสดงผล OVR อัตโนมัติ (แท็บ 1 และ 2)
function toggleAutoOvrSettings() {
    const container = document.getElementById('autoOvrSettingsContainer');
    const isChecked = document.getElementById('enableAutoOvr').checked;
    container.style.display = isChecked ? 'block' : 'none';
    refreshDynamicOvrUI();
}

function refreshDynamicOvrUI() {
    // รีเฟรชเฉพาะเมื่อผู้ใช้อยู่ในแท็บที่ 2
    if (!document.getElementById('tab2').classList.contains('active')) return;
    
    const isEnabled = document.getElementById('enableAutoOvr') && document.getElementById('enableAutoOvr').checked;
    
    tournamentTeams.forEach(team => {
        const dynElement = document.getElementById(`dyn_ovr_${team.id}`);
        if (dynElement) {
            if (isEnabled && typeof getDynamicOvr === 'function') {
                const currentOvr = getDynamicOvr(team.id);
                const diff = currentOvr - team.ovr;
                let diffText = '';
                
                if (diff > 0) diffText = `(+${diff})`;
                else if (diff < 0) diffText = `(${diff})`;
                
                dynElement.innerText = `[ OVR สะสมปัจจุบัน: ${currentOvr} ${diffText} ]`;
                dynElement.style.color = diff > 0 ? '#28a745' : (diff < 0 ? '#dc3545' : '#007bff');
            } else {
                dynElement.innerText = '';
            }
        }
    });
}
