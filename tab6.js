// tab6.js - ระบบจัดอันดับรวม (Overall Ranking)

function renderOverallRanking() {
    const container = document.getElementById('overallStandingsContainer');
    const exportArea = document.getElementById('exportOverallRankingOutput');

    // ตรวจสอบว่ามีข้อมูลคะแนนจากแท็บ 4 ที่ถูกคำนวณไว้หรือยัง
    if (!window.globalAllGroupsStandings || Object.keys(window.globalAllGroupsStandings).length === 0) {
        const emptyMsg = '<p style="color: #666; text-align: center;">กรุณากดสุ่มผลแข่งขันในแท็บที่ 3 ก่อนครับ</p>';
        if(container) container.innerHTML = emptyMsg;
        if(exportArea) exportArea.value = "ยังไม่มีข้อมูล";
        return;
    }

    const allGroups = window.globalAllGroupsStandings;
    let overallRankedTeams = [];
    
    // 1. หาจำนวนทีมสูงสุดที่มีใน 1 กลุ่ม (เช่น กลุ่มนึงมีมากสุด 5 ทีม)
    let maxTeamsInGroup = 0;
    for (const group in allGroups) {
        if (allGroups[group].length > maxTeamsInGroup) {
            maxTeamsInGroup = allGroups[group].length;
        }
    }

    // 2. จัดอันดับรวม: ดึงอันดับ 1 ทุกกลุ่มมาก่อน -> ตามด้วยอันดับ 2 -> ...
    for (let rankIndex = 0; rankIndex < maxTeamsInGroup; rankIndex++) {
        let teamsAtThisRank = [];

        for (const group in allGroups) {
            if (allGroups[group].length > rankIndex) {
                // แนบข้อมูลกลุ่มและอันดับกลุ่มเดิมไปกับตัวทีมด้วย
                let teamData = { 
                    ...allGroups[group][rankIndex], 
                    fromGroup: group, 
                    groupRank: rankIndex + 1 
                };
                teamsAtThisRank.push(teamData);
            }
        }

        // เรียงลำดับทีมที่อยู่อันดับเดียวกันในกลุ่ม: คะแนน -> ผลต่าง -> ประตูได้
        teamsAtThisRank.sort((a, b) => {
            if (b.pts !== a.pts) return b.pts - a.pts;
            if (b.gd !== a.gd) return b.gd - a.gd;
            if (b.gf !== a.gf) return b.gf - a.gf;
            return 0;
        });

        // เปิดสถานะขีดเส้นขอบหนา (thick border) ให้กับ "ทีมสุดท้ายของกลุ่มอันดับนั้น" 
        if (teamsAtThisRank.length > 0 && rankIndex < maxTeamsInGroup - 1) {
            teamsAtThisRank[teamsAtThisRank.length - 1].isLastInRankGroup = true;
        }

        overallRankedTeams.push(...teamsAtThisRank);
    }

    // 3. วาดตาราง HTML ของแท็บที่ 6
    let tableHTML = `
        <table class="standings-table">
            <thead>
                <tr>
                    <th style="width: 8%;">อันดับรวม</th>
                    <th>ทีม</th>
                    <th style="width: 10%;">กลุ่ม (อันดับ)</th>
                    <th style="width: 8%;">แข่ง</th>
                    <th style="width: 8%;">ชนะ</th>
                    <th style="width: 8%;">เสมอ</th>
                    <th style="width: 8%;">แพ้</th>
                    <th style="width: 8%;">ได้</th>
                    <th style="width: 8%;">เสีย</th>
                    <th style="width: 8%;">ผลต่าง</th>
                    <th style="width: 12%;">คะแนน</th>
                </tr>
            </thead>
            <tbody>
    `;

    let exportIds = [];

    overallRankedTeams.forEach((team, index) => {
        const displayGD = team.gd > 0 ? `+${team.gd}` : team.gd;
        
        // เช็กคลาสใส่เส้นคั่นหนา
        const rowClass = team.isLastInRankGroup ? 'thick-bottom-border' : '';
        // เช็กคลาสไฮไลท์สีเขียวข้ามกลุ่มที่ถูกประมวลผลมาจากแท็บ 4
        const highlightClass = team.isBestHighlight ? 'highlight-best' : '';

        tableHTML += `
            <tr class="${rowClass} ${highlightClass}">
                <td>${index + 1}</td>
                <td class="team-cell">${team.name} (${team.id})</td>
                <td>${team.fromGroup} (${team.groupRank})</td>
                <td>${team.played}</td>
                <td>${team.won}</td>
                <td>${team.drawn}</td>
                <td>${team.lost}</td>
                <td>${team.gf}</td>
                <td>${team.ga}</td>
                <td>${displayGD}</td>
                <td class="pts-cell">${team.pts}</td>
            </tr>
        `;
        
        // เก็บ ID เข้าอาร์เรย์ในรูปแบบ "id"
        exportIds.push(`"${team.id}"`);
    });

    tableHTML += `</tbody></table>`;
    container.innerHTML = tableHTML;

    // 4. สร้างรูปแบบข้อความส่งออก: {"id1";"id2";...}
    if(exportArea) {
        exportArea.value = "{" + exportIds.join(";") + "}";
    }
}

// 5. ฟังก์ชันสำหรับคัดลอกรหัส ID
function copyExportRanking() {
    const area = document.getElementById('exportOverallRankingOutput');
    const textToCopy = area.value.trim();

    if (!textToCopy || textToCopy === "ยังไม่มีข้อมูล") {
        alert("ไม่มีข้อมูลสำหรับคัดลอกครับ");
        return;
    }

    area.select();
    area.setSelectionRange(0, 99999);

    navigator.clipboard.writeText(textToCopy).then(() => {
        const btn = document.querySelector('.btn-copy-ranking');
        const originalText = btn.innerText;
        btn.innerText = "✅ คัดลอก ID สำเร็จ!";
        btn.style.backgroundColor = "#28a745";
        
        setTimeout(() => {
            btn.innerText = originalText;
            btn.style.backgroundColor = "#17a2b8";
        }, 2000);
    });
}