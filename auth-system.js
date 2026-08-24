// --- PISO MUSIC CHILD ACCOUNTS & NOTE PROGRESS ENGINE ---
(function() {
    const USERS_KEY = 'piso_child_users_v1';
    const ACTIVE_USER_KEY = 'piso_active_child_v1';
    const GUEST_PROGRESS_KEY = 'piso_guest_progress_v1';

    let activeUser = null;

    // Load active user on boot
    function initAuth() {
        try {
            const saved = localStorage.getItem(ACTIVE_USER_KEY);
            if (saved) {
                activeUser = JSON.parse(saved);
            }
        } catch(e) {
            console.error('Error loading active user', e);
        }
        updateUserHeaderUI();
    }

    function getUsersDB() {
        try {
            const saved = localStorage.getItem(USERS_KEY);
            return saved ? JSON.parse(saved) : {};
        } catch(e) {
            return {};
        }
    }

    function saveUsersDB(db) {
        localStorage.setItem(USERS_KEY, JSON.stringify(db));
    }

    function getActiveUsername() {
        return activeUser ? activeUser.username : 'guest';
    }

    function getUserData() {
        const username = getActiveUsername();
        if (username === 'guest') {
            try {
                const saved = localStorage.getItem(GUEST_PROGRESS_KEY);
                return saved ? JSON.parse(saved) : { progress: {} };
            } catch(e) {
                return { progress: {} };
            }
        } else {
            const db = getUsersDB();
            return db[username] || { progress: {} };
        }
    }

    function saveUserData(userData) {
        const username = getActiveUsername();
        if (username === 'guest') {
            localStorage.setItem(GUEST_PROGRESS_KEY, JSON.stringify(userData));
        } else {
            const db = getUsersDB();
            if (db[username]) {
                db[username].progress = userData.progress;
                saveUsersDB(db);
            }
        }
        updateUserHeaderUI();
    }

    // --- AUTHENTICATION METHODS ---
    window.registerChildAccount = function(username, password, childName) {
        if (!username || !password || !childName) {
            return { success: false, message: 'Vui lòng điền đầy đủ Tên bé, Tên đăng nhập và Mật khẩu!' };
        }
        const db = getUsersDB();
        const cleanUser = username.trim().toLowerCase();
        if (db[cleanUser]) {
            return { success: false, message: 'Tên đăng nhập này đã tồn tại! Vui lòng chọn tên khác.' };
        }

        db[cleanUser] = {
            username: cleanUser,
            password: password,
            childName: childName.trim(),
            createdAt: new Date().toISOString(),
            progress: {}
        };
        saveUsersDB(db);

        // Auto login
        activeUser = { username: cleanUser, childName: childName.trim() };
        localStorage.setItem(ACTIVE_USER_KEY, JSON.stringify(activeUser));
        updateUserHeaderUI();
        return { success: true, message: `🎉 Đã tạo tài khoản thành công cho bé ${childName}!` };
    };

    window.loginChildAccount = function(username, password) {
        if (!username || !password) {
            return { success: false, message: 'Vui lòng nhập Tên đăng nhập và Mật khẩu!' };
        }
        const db = getUsersDB();
        const cleanUser = username.trim().toLowerCase();
        const user = db[cleanUser];
        if (!user || user.password !== password) {
            return { success: false, message: 'Tên đăng nhập hoặc mật khẩu không chính xác!' };
        }

        activeUser = { username: cleanUser, childName: user.childName };
        localStorage.setItem(ACTIVE_USER_KEY, JSON.stringify(activeUser));
        updateUserHeaderUI();
        if (window.renderGameUI) window.renderGameUI();
        return { success: true, message: `👋 Chào mừng bé ${user.childName} đã quay trở lại!` };
    };

    window.logoutChildAccount = function() {
        activeUser = null;
        localStorage.removeItem(ACTIVE_USER_KEY);
        updateUserHeaderUI();
        if (window.renderGameUI) window.renderGameUI();
    };

    window.getActiveChildUser = function() {
        return activeUser;
    };

    function updateUserHeaderUI() {
        const container = document.getElementById('user-profile-header-slot');
        if (!container) return;

        if (activeUser) {
            const master = window.getMasterProgress ? window.getMasterProgress() : { totalEarned: 0 };
            container.innerHTML = `
                <div style="display: flex; align-items: center; gap: 10px; background: rgba(255, 255, 255, 0.2); padding: 5px 14px; border-radius: 20px; border: 1.5px solid rgba(255,255,255,0.35);">
                    <span style="font-weight: 800; color: #fef08a; font-size: 0.95rem;">👤 Bé: ${activeUser.childName}</span>
                    <span style="background: #facc15; color: #431407; font-weight: 800; padding: 2px 10px; border-radius: 12px; font-size: 0.85rem;">🏆 ${master.totalEarned} pt</span>
                    <button onclick="window.logoutChildAccount()" style="background: #ef4444; color: white; border: none; padding: 4px 10px; border-radius: 12px; font-weight: 800; cursor: pointer; font-size: 0.8rem; box-shadow: 0 2px 6px rgba(239,68,68,0.4);">🚪 Đăng Xuất</button>
                </div>
            `;
        } else {
            container.innerHTML = `
                <button onclick="window.openAuthModal()" style="background: linear-gradient(135deg, #facc15, #eab308); color: #431407; border: 2px solid #fde047; font-weight: 800; padding: 7px 18px; border-radius: 20px; cursor: pointer; font-size: 0.9rem; box-shadow: 0 4px 12px rgba(250,204,21,0.4); transition: all 0.2s;" onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='none'">
                    👤 Đăng Nhập / Đăng Ký
                </button>
            `;
        }
    }

    // --- GAMIFIED NOTE PROGRESS TRACKER ---
    // Rules:
    // 🌱 Hạt (seed): Encountered in test (0 pts)
    // 🌿 Mầm (sprout): Correct 1 time (0 + 1 = 1 pt)
    // 🌳 Cây (tree): Correct 2 times in a row from sprout (1 + 2 = 3 pts)
    // 🌸 Hoa (flower): Correct 3 times in a row from tree (3 + 3 = 6 pts MAX)

    window.recordNoteTestResult = function(clef, level, noteObj, isCorrect) {
        const userData = getUserData();
        if (!userData.progress) userData.progress = {};

        const key = `${clef}_${level}_${noteObj.abc}`;
        let p = userData.progress[key] || {
            abc: noteObj.abc,
            name: noteObj.name,
            noteOnly: noteObj.noteOnly,
            clef: clef,
            level: level,
            stage: 'seed', // 'seed', 'sprout', 'tree', 'flower'
            score: 0,
            streak: 0,
            encountered: true
        };

        p.encountered = true;

        if (isCorrect) {
            if (p.stage === 'seed') {
                p.stage = 'sprout';
                p.score = 1;
                p.streak = 1;
            } else if (p.stage === 'sprout') {
                p.streak += 1;
                if (p.streak >= 2) {
                    p.stage = 'tree';
                    p.score = 3; // 1 + 2 = 3 pts
                    p.streak = 0; // reset stage streak counter for next stage
                }
            } else if (p.stage === 'tree') {
                p.streak += 1;
                if (p.streak >= 3) {
                    p.stage = 'flower';
                    p.score = 6; // 3 + 3 = 6 pts MAX
                    p.streak = 3;
                }
            } else if (p.stage === 'flower') {
                p.score = 6;
                p.streak += 1;
            }
        } else {
            // On wrong answer, reset current stage streak counter
            p.streak = 0;
        }

        userData.progress[key] = p;
        saveUserData(userData);
    };

    window.getNoteProgress = function(clef, level, abc) {
        const userData = getUserData();
        const key = `${clef}_${level}_${abc}`;
        return (userData.progress && userData.progress[key]) || {
            abc: abc,
            stage: 'unseen', // 'unseen', 'seed', 'sprout', 'tree', 'flower'
            score: 0,
            streak: 0,
            encountered: false
        };
    };

    window.getClefLevelProgress = function(clef, level, noteList) {
        let earnedPoints = 0;
        const maxPoints = noteList.length * 6; // 6 pts max per note

        noteList.forEach(note => {
            const p = window.getNoteProgress(clef, level, note.abc);
            earnedPoints += p.score || 0;
        });

        const percentage = maxPoints > 0 ? Math.round((earnedPoints / maxPoints) * 100) : 0;
        return { earnedPoints, maxPoints, percentage, notesCount: noteList.length };
    };

    window.getMasterProgress = function() {
        const userData = getUserData();
        let totalEarned = 0;
        if (userData.progress) {
            Object.values(userData.progress).forEach(p => {
                totalEarned += (p.score || 0);
            });
        }
        // Total notes across all levels:
        // Sol Lvl1 (14), Sol Lvl2 (7), Sol Lvl3 (7) = 28
        // Fa Lvl1 (14), Fa Lvl2 (7), Fa Lvl3 (7) = 28
        // Total notes = 56 notes * 6 max pts = 336 max pts
        const totalMax = 336;
        const percentage = Math.round((totalEarned / totalMax) * 100);
        return { totalEarned, totalMax, percentage };
    };

    // Auto init on DOM load
    document.addEventListener('DOMContentLoaded', initAuth);
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
        setTimeout(initAuth, 100);
    }
})();
