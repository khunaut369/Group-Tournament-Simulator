// tab4.js

// 1. ฟังก์ชันหลักสำหรับประมวลผลและสร้างตารางคะแนน
// แทนที่ฟังก์ชันเดิมทั้งหมดใน tab4.js เฉพาะส่วน updateStandings และ renderGroupTableUI

function updateStandings() {
    const container = document.getElementById('standingsContainer');
    
    if (!fixturesData || Object.keys(fixturesData).length === 0) {
        container.innerHTML = '<p style="color: #666; text-align: center;">กรุณากดสุ่มจัดโปรแกรมการแข่งขันในแท็บที่ 3 ก่อนครับ</p>';
        return;
    }

    const tiebreakerMethod = document.getElementById('tiebreaker').value;
    container.innerHTML = ''; 

    // 1. ตัวแปรเก็บข้อมูลตารางคะแนนที่สมบูรณ์แล้วของ "ทุกกลุ่ม"
    const allGroupsStandings = {}; 

    // 2. คำนวณตารางคะแนนแต่ละกลุ่มปกติ
    for (const group in fixturesData) {
        let allGroupMatches = [];
        fixturesData[group].forEach(round => allGroupMatches.push(...round));

        let teamStatsMap = {};
        let groupTeams = tournamentTeams.filter(t => t.group === group).map(t => {
            return {
                id: t.id, name: t.name, played: 0, won: 0, drawn: 0, lost: 0,
                gf: 0, ga: 0, gd: 0, pts: 0, isBestHighlight: false // เพิ่ม Property ไฮไลท์
            };
        });

        groupTeams.forEach(t => teamStatsMap[t.id] = t);

        allGroupMatches.forEach(match => {
            if (match.scoreHome !== null && match.scoreAway !== null) {
                let home = teamStatsMap[match.home.id];
                let away = teamStatsMap[match.away.id];
                if(home && away) {
                    home.played++; away.played++;
                    home.gf += match.scoreHome; home.ga += match.scoreAway;
                    away.gf += match.scoreAway; away.ga += match.scoreHome;

                    if (match.scoreHome > match.scoreAway) { home.won++; home.pts += 3; away.lost++; }
                    else if (match.scoreHome < match.scoreAway) { away.won++; away.pts += 3; home.lost++; }
                    else { home.drawn++; home.pts += 1; away.drawn++; away.pts += 1; }
                    
                    home.gd = home.gf - home.ga; away.gd = away.gf - away.ga;
                }
            }
        });

        let sortedTeams = advancedTournamentSort(groupTeams, allGroupMatches, tiebreakerMethod);
        allGroupsStandings[group] = sortedTeams;
    }

    // 3. --- ระบบเปรียบเทียบทีมข้ามกลุ่ม (Cross-Group Highlight) ---
    const isHighlightEnabled = document.getElementById('enableBestHighlight') && document.getElementById('enableBestHighlight').checked;
    
    if (isHighlightEnabled && typeof getHighlightConfig === 'function') {
        const config = getHighlightConfig();
        
        // วนลูปตามอันดับ (เช่น อันดับ 1, อันดับ 2...)
        for (const rankStr in config) {
            const targetRank = parseInt(rankStr);
            const numToHighlight = config[targetRank];
            
            if (numToHighlight > 0) {
                const arrIndex = targetRank - 1; // Index ใน Array จะน้อยกว่าอันดับอยู่ 1
                let teamsAtThisRank = [];
                
                // ดึงทีมที่ได้อันดับเป้าหมายจากทุกกลุ่มมาไว้ในตระกร้าเดียวกัน
                for (const group in allGroupsStandings) {
                    if (allGroupsStandings[group].length > arrIndex) {
                        teamsAtThisRank.push(allGroupsStandings[group][arrIndex]);
                    }
                }
                
                // จัดอันดับข้ามกลุ่ม: คะแนน -> ผลต่าง -> ประตูได้
                teamsAtThisRank.sort((a, b) => {
                    if (b.pts !== a.pts) return b.pts - a.pts;
                    if (b.gd !== a.gd) return b.gd - a.gd;
                    if (b.gf !== a.gf) return b.gf - a.gf;
                    return 0; 
                });
                
                // เปิดสวิตช์ไฮไลท์ให้กับทีมที่ดีที่สุดตามจำนวนที่ผู้ใช้ตั้งค่าไว้
                for (let i = 0; i < Math.min(numToHighlight, teamsAtThisRank.length); i++) {
                    teamsAtThisRank[i].isBestHighlight = true;
                }
            }
        }
    }

    // 4. นำผลลัพธ์ที่ติดป้ายไฮไลท์แล้ว ส่งไปวาด UI
    for (const group in allGroupsStandings) {
        renderGroupTableUI(group, allGroupsStandings[group], container);
    }
}

// 2. อัลกอริทึมจัดหมวดหมู่แยกกลุ่มทีมที่แต้มเท่ากัน (Bucket Sort Structure)
function advancedTournamentSort(teams, matches, method) {
    // ขั้นแรก: เรียงลำดับคะแนนรวมหลักจากมากไปน้อยก่อน
    teams.sort((a, b) => b.pts - a.pts);

    // แบ่งกลุ่มทีมที่มีคะแนนดิบเท่ากันให้อยู่ในตระกร้า (Buckets) เดียวกัน
    let buckets = [];
    let currentBucket = [teams[0]];

    for (let i = 1; i < teams.length; i++) {
        if (teams[i].pts === currentBucket[0].pts) {
            currentBucket.push(teams[i]);
        } else {
            buckets.push(currentBucket);
            currentBucket = [teams[i]];
        }
    }
    buckets.push(currentBucket);

    // นำทีมในแต่ละตระกร้าที่มีคะแนนเท่ากันมาตัดสินด้วยกฎ Tiebreaker
    let finalSortedList = [];
    buckets.forEach(bucket => {
        if (bucket.length === 1) {
            finalSortedList.push(bucket[0]); // มีทีมเดียวไม่ต้องตัดสินเพิ่ม
        } else {
            let resolvedBucket = resolveGroupTiebreaker(bucket, matches, method);
            finalSortedList.push(...resolvedBucket);
        }
    });

    return finalSortedList;
}

// 3. ฟังก์ชันตัดสินไทเบรกเกอร์เมื่อมีทีมคะแนนเท่ากัน (Resolve Tie)
function resolveGroupTiebreaker(tiedTeams, matches, method) {
    if (tiedTeams.length <= 1) return tiedTeams;

    if (method === 'direct') {
        // กฎโดยตรง: พิจารณา ผลต่างประตูรวม -> ประตูได้รวม 
        tiedTeams.sort((a, b) => {
            if (b.gd !== a.gd) return b.gd - a.gd;
            if (b.gf !== a.gf) return b.gf - a.gf;
            return 0;
        });

        // เช็กเผื่อมีกรณีที่ ผลต่างและประตูได้รวมยังเท่ากันอีก ให้ส่งไปตัดสินด้วย มินิลีก (H2H) ต่อไป
        return breakRemainingTiesWithMiniLeague(tiedTeams, matches);
    } else {
        // กฎเฮดทูเฮด: พิจารณา มินิลีก (H2H) ก่อนเป็นอันดับแรก
        let h2hSorted = sortByMiniLeague(tiedTeams, matches);

        // เช็กเผื่อในมินิลีกยังเท่ากันทุกสถิติ ให้ตัดสินด้วยสถิติภาพรวม (ผลต่างรวม -> ประตูได้รวม)
        let subBuckets = [];
        let curr = [h2hSorted[0]];
        for (let i = 1; i < h2hSorted.length; i++) {
            if (h2hSorted[i].ml_pts === curr[0].ml_pts && h2hSorted[i].ml_gd === curr[0].ml_gd && h2hSorted[i].ml_gf === curr[0].ml_gf) {
                curr.push(h2hSorted[i]);
            } else {
                subBuckets.push(curr);
                curr = [h2hSorted[i]];
            }
        }
        subBuckets.push(curr);

        let finalResult = [];
        subBuckets.forEach(sb => {
            if (sb.length === 1) {
                finalResult.push(sb[0]);
            } else {
                // หากมินิลีกยังเท่ากัน ตัดสินด้วย ผลต่างรวม -> ประตูได้รวม
                sb.sort((a, b) => {
                    if (b.gd !== a.gd) return b.gd - a.gd;
                    if (b.gf !== a.gf) return b.gf - a.gf;
                    return 0;
                });
                finalResult.push(...sb);
            }
        });
        return finalResult;
    }
}

// 4. ฟังก์ชันย่อยสำหรับสกัดหาและคำนวณคะแนน "มินิลีก" (Mini-League / H2H สำหรับ 2 ทีมขึ้นไป)
function sortByMiniLeague(teams, matches) {
    let tiedIds = teams.map(t => t.id);
    let mlStats = {};
    tiedIds.forEach(id => mlStats[id] = { pts: 0, gd: 0, gf: 0 });

    // คำนวณสถิติเฉพาะการพบกันเองในกลุ่มทีมที่แต้มเท่ากันเท่านั้น
    matches.forEach(m => {
        if (tiedIds.includes(m.home.id) && tiedIds.includes(m.away.id)) {
            if (m.scoreHome !== null && m.scoreAway !== null) {
                mlStats[m.home.id].gf += m.scoreHome;
                mlStats[m.home.id].gd += (m.scoreHome - m.scoreAway);
                mlStats[m.away.id].gf += m.scoreAway;
                mlStats[m.away.id].gd += (m.scoreAway - m.scoreHome);

                if (m.scoreHome > m.scoreAway) {
                    mlStats[m.home.id].pts += 3;
                } else if (m.scoreHome < m.scoreAway) {
                    mlStats[m.away.id].pts += 3;
                } else {
                    mlStats[m.home.id].pts += 1;
                    mlStats[m.away.id].pts += 1;
                }
            }
        }
    });

    // บันทึกค่าคะแนนมินิลีกเข้าสู่ Object ชั่วคราวเพื่อส่งตรวจสอบขั้นตอนถัดไป
    teams.forEach(t => {
        t.ml_pts = mlStats[t.id].pts;
        t.ml_gd = mlStats[t.id].gd;
        t.ml_gf = mlStats[t.id].gf;
    });

    // เรียงตามเกณฑ์มินิลีก: คะแนนมินิลีก -> ผลต่างมินิลีก -> ประตูได้มินิลีก
    teams.sort((a, b) => {
        if (b.ml_pts !== a.ml_pts) return b.ml_pts - a.ml_pts;
        if (b.ml_gd !== a.ml_gd) return b.ml_gd - a.ml_gd;
        if (b.ml_gf !== a.ml_gf) return b.ml_gf - a.ml_gf;
        return 0;
    });

    return teams;
}

// 5. ฟังก์ชันสำหรับตัดเกณฑ์มินิลีกกรณีกฎแบบ "โดยตรง" ที่สถิติรวมเท่ากันเป๊ะ
function breakRemainingTiesWithMiniLeague(tiedTeams, matches) {
    let subBuckets = [];
    let curr = [tiedTeams[0]];
    for (let i = 1; i < tiedTeams.length; i++) {
        if (tiedTeams[i].gd === curr[0].gd && tiedTeams[i].gf === curr[0].gf) {
            curr.push(tiedTeams[i]);
        } else {
            subBuckets.push(curr);
            curr = [tiedTeams[i]];
        }
    }
    subBuckets.push(curr);

    let finalResult = [];
    subBuckets.forEach(sb => {
        if (sb.length === 1) {
            finalResult.push(sb[0]);
        } else {
            let mlSorted = sortByMiniLeague(sb, matches);
            finalResult.push(...mlSorted);
        }
    });
    return finalResult;
}

// 6. ฟังก์ชันสร้างตาราง HTML ตารางคะแนน
// อัปเดตฟังก์ชันนี้เพื่อรับคลาสไฮไลท์
function renderGroupTableUI(groupName, sortedTeams, parentContainer) {
    const groupWrapper = document.createElement('div');
    groupWrapper.className = 'group-container';
    
    let tableHTML = `
        <div class="group-header">ตารางคะแนน กลุ่มที่ ${groupName}</div>
        <table class="standings-table">
            <thead>
                <tr>
                    <th style="width: 8%;">อันดับ</th>
                    <th>ทีม</th>
                    <th style="width: 10%;">แข่ง</th>
                    <th style="width: 8%;">ชนะ</th>
                    <th style="width: 8%;">เสมอ</th>
                    <th style="width: 8%;">แพ้</th>
                    <th style="width: 10%;">ได้</th>
                    <th style="width: 10%;">เสีย</th>
                    <th style="width: 10%;">ผลต่าง</th>
                    <th style="width: 12%;">คะแนน</th>
                </tr>
            </thead>
            <tbody>
    `;

    sortedTeams.forEach((team, index) => {
        const displayGD = team.gd > 0 ? `+${team.gd}` : team.gd;
        // ตรวจสอบสถานะว่าทีมนี้ถูกทำสัญลักษณ์ไฮไลท์ไว้หรือไม่
        const rowHighlightClass = team.isBestHighlight ? 'highlight-best' : '';
        
        tableHTML += `
            <tr class="${rowHighlightClass}">
                <td>${index + 1}</td>
                <td class="team-cell">${team.name} (${team.id})</td>
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
    });

    tableHTML += `</tbody></table>`;
    groupWrapper.innerHTML = tableHTML;
    parentContainer.appendChild(groupWrapper);
}