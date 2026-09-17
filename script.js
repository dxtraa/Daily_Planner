// ============================================================
// 📅 DATE + YEAR DISPLAY
// ============================================================
function initDate() {
    const now = new Date();
    const options = {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    };
    const dateEl = document.getElementById('dateDisplay');
    if (dateEl) dateEl.textContent = now.toLocaleDateString('en-US', options);

    const yearEl = document.getElementById('currentYear');
    if (yearEl) yearEl.textContent = now.getFullYear();
}
initDate();


// ============================================================
// ✅ TASK MANAGER
// ============================================================
class TaskManager {
    constructor() {
        this.tasks = JSON.parse(localStorage.getItem('tasks')) || [];
        this.currentFilter = 'all';

        this.inputEl     = document.getElementById('taskInput');
        this.priorityEl  = document.getElementById('prioritySelect');
        this.dueDateEl   = document.getElementById('dueDate');
        this.addBtn      = document.getElementById('addTaskBtn');
        this.listEl      = document.getElementById('taskList');
        this.emptyEl     = document.getElementById('emptyState');

        this.completedEl = document.getElementById('completedCount');
        this.pendingEl   = document.getElementById('pendingCount');
        this.scoreEl     = document.getElementById('productivityScore');

        this.filterBtns = document.querySelectorAll('.filter-btn');

        this.addBtn.addEventListener('click', () => this.addTask());
        this.inputEl.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addTask();
        });

        this.filterBtns.forEach((btn) => {
            btn.addEventListener('click', () => {
                this.filterBtns.forEach((b) => b.classList.remove('active'));
                btn.classList.add('active');
                this.currentFilter = btn.dataset.filter;
                this.render();
            });
        });

        this.render();
    }

    addTask() {
        const text = this.inputEl.value.trim();
        if (!text) return;

        this.tasks.unshift({
            id: Date.now(),
            text,
            priority: this.priorityEl.value,
            dueDate: this.dueDateEl.value || null,
            done: false,
            createdAt: new Date().toISOString(),
        });

        this.inputEl.value    = '';
        this.dueDateEl.value  = '';
        this.priorityEl.value = 'medium';

        this.save();
        this.render();
    }

    toggle(id) {
        const task = this.tasks.find((t) => t.id === id);
        if (task) task.done = !task.done;
        this.save();
        this.render();
    }

    remove(id) {
        if (!confirm('Are you sure you want to delete this task?')) return;
        this.tasks = this.tasks.filter((t) => t.id !== id);
        this.save();
        this.render();
    }

    save() {
        localStorage.setItem('tasks', JSON.stringify(this.tasks));
    }

    getFiltered() {
        switch (this.currentFilter) {
            case 'active':    return this.tasks.filter((t) => !t.done);
            case 'completed': return this.tasks.filter((t) => t.done);
            case 'high':      return this.tasks.filter((t) => t.priority === 'high');
            default:          return this.tasks;
        }
    }

    updateStats() {
        const total     = this.tasks.length;
        const completed = this.tasks.filter((t) => t.done).length;
        const pending   = total - completed;
        const score     = total === 0 ? 0 : Math.round((completed / total) * 100);

        this.completedEl.textContent = completed;
        this.pendingEl.textContent   = pending;
        this.scoreEl.textContent     = score + '%';
    }

    render() {
        const filtered = this.getFiltered();
        this.listEl.innerHTML = '';

        // Toggle empty state using `.show` class (matches your CSS)
        if (filtered.length === 0) {
            this.emptyEl.classList.add('show');
        } else {
            this.emptyEl.classList.remove('show');
        }

        filtered.forEach((task) => {
            const item = document.createElement('div');
            item.className = 'task-item' + (task.done ? ' completed' : '');

            // --- Custom checkbox (div, not input) ---
            const checkbox = document.createElement('div');
            checkbox.className = 'task-checkbox' + (task.done ? ' checked' : '');
            checkbox.addEventListener('click', () => this.toggle(task.id));

            // --- Content ---
            const content = document.createElement('div');
            content.className = 'task-content';

            const text = document.createElement('div');
            text.className = 'task-text';
            text.textContent = task.text;
            content.appendChild(text);

            const meta = document.createElement('div');
            meta.className = 'task-meta';

            const badge = document.createElement('span');
            badge.className = 'priority-badge priority-' + task.priority;
            badge.textContent =
                task.priority === 'high'   ? '❤️ High'
              : task.priority === 'low'    ? '💚 Low'
              : '💛 Medium';
            meta.appendChild(badge);

            if (task.dueDate) {
                const due = document.createElement('span');
                due.className = 'due-date';
                const d = new Date(task.dueDate);
                due.textContent = '📅 ' + d.toLocaleDateString('en-US', {
                    month: 'short', day: 'numeric'
                });
                meta.appendChild(due);
            }

            content.appendChild(meta);

            // --- Actions ---
            const actions = document.createElement('div');
            actions.className = 'task-actions';

            const del = document.createElement('button');
            del.className = 'delete-btn';
            del.innerHTML = '<i class="fas fa-trash"></i>';
            del.addEventListener('click', () => this.remove(task.id));
            actions.appendChild(del);

            item.appendChild(checkbox);
            item.appendChild(content);
            item.appendChild(actions);
            this.listEl.appendChild(item);
        });

        this.updateStats();
    }
}
new TaskManager();


// ============================================================
// 💰 MONEY MANAGER
// ============================================================
class MoneyManager {
    constructor() {
        this.tx = JSON.parse(localStorage.getItem('transactions')) || [];

        this.descEl   = document.getElementById('moneyDesc');
        this.amountEl = document.getElementById('moneyAmount');
        this.typeEl   = document.getElementById('moneyType');
        this.addBtn   = document.getElementById('addMoneyBtn');
        this.listEl   = document.getElementById('moneyList');

        this.incomeEl  = document.getElementById('totalIncome');
        this.expenseEl = document.getElementById('totalExpense');
        this.balanceEl = document.getElementById('balance');

        if (!this.addBtn) return;

        this.addBtn.addEventListener('click', () => this.add());
        this.amountEl.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.add();
        });

        this.render();
    }

    add() {
        const desc   = this.descEl.value.trim();
        const amount = parseFloat(this.amountEl.value);
        const type   = this.typeEl.value;

        if (!desc || isNaN(amount) || amount <= 0) {
            alert('Please enter a valid description and amount.');
            return;
        }

        this.tx.unshift({
            id: Date.now(),
            desc,
            amount,
            type,
            date: new Date().toISOString(),
        });

        this.descEl.value   = '';
        this.amountEl.value = '';

        this.save();
        this.render();
    }

    save() {
        localStorage.setItem('transactions', JSON.stringify(this.tx));
    }

    render() {
        const inc = this.tx.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);
        const exp = this.tx.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);

        this.incomeEl.textContent  = '$' + inc.toFixed(2);
        this.expenseEl.textContent = '$' + exp.toFixed(2);
        this.balanceEl.textContent = '$' + (inc - exp).toFixed(2);

        this.listEl.innerHTML = this.tx.map((t) => `
            <li class="${t.type}">
                <span>${t.desc}</span>
                <span>${t.type === 'income' ? '+' : '-'}$${t.amount.toFixed(2)}</span>
            </li>`).join('');
    }
}
new MoneyManager();


// ============================================================
// 🎓 CLASS MANAGER
// ============================================================
class ClassManager {
    constructor() {
        this.classes = JSON.parse(localStorage.getItem('classes')) || [];

        this.nameEl     = document.getElementById('className');
        this.locationEl = document.getElementById('classLocation');
        this.dayEl      = document.getElementById('classDay');
        this.startEl    = document.getElementById('classStart');
        this.endEl      = document.getElementById('classEnd');
        this.addBtn     = document.getElementById('addClassBtn');
        this.listEl     = document.getElementById('classList');

        if (!this.addBtn) return;

        this.addBtn.addEventListener('click', () => this.add());
        this.render();
    }

    add() {
        const name     = this.nameEl.value.trim();
        const location = this.locationEl.value.trim();
        const day      = this.dayEl.value;
        const start    = this.startEl.value;
        const end      = this.endEl.value;

        if (!name || !start || !end) {
            alert('Please fill in class name, start time, and end time.');
            return;
        }
        if (start >= end) {
            alert('End time must be after start time.');
            return;
        }

        this.classes.push({ id: Date.now(), name, location, day, start, end });

        this.nameEl.value     = '';
        this.locationEl.value = '';
        this.startEl.value    = '';
        this.endEl.value      = '';

        this.save();
        this.render();
    }

    remove(id) {
        if (!confirm('Delete this class?')) return;
        this.classes = this.classes.filter((c) => c.id !== id);
        this.save();
        this.render();
    }

    save() {
        localStorage.setItem('classes', JSON.stringify(this.classes));
    }

    render() {
        const dayNames = {
            MO: 'Monday', TU: 'Tuesday', WE: 'Wednesday',
            TH: 'Thursday', FR: 'Friday', SA: 'Saturday', SU: 'Sunday',
        };

        if (this.classes.length === 0) {
            this.listEl.innerHTML =
                '<li style="justify-content:center;color:#94a3b8;">No classes added yet.</li>';
            return;
        }

        this.listEl.innerHTML = this.classes.map((c) => `
            <li>
                <span>
                    <strong>${c.name}</strong><br>
                    <small>${dayNames[c.day]} · ${c.start} – ${c.end}${c.location ? ' · ' + c.location : ''}</small>
                </span>
                <button class="delete-btn" onclick="window._removeClass(${c.id})">
                    <i class="fas fa-trash"></i>
                </button>
            </li>`).join('');
    }
}

const classManagerInstance = new ClassManager();
window._removeClass = function (id) { classManagerInstance.remove(id); };
