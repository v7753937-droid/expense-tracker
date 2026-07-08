// Основные данные приложения
let expenses = JSON.parse(localStorage.getItem('expenses')) || [];
let filteredExpensesByPeriod = [...expenses];

// Категории с эмодзи
const categories = {
    'еда': '🍔',
    'транспорт': '🚗',
    'развлечения': '🎮',
    'покупки': '🛍️',
    'здоровье': '💊',
    'коммунальные': '🏠',
    'образование': '📚',
    'другое': '📦'
};

// Инициализация приложения
document.addEventListener('DOMContentLoaded', () => {
    // Установить сегодняшнюю дату по умолчанию
    document.getElementById('date').valueAsDate = new Date();
    
    // Загрузить данные
    renderExpenses();
    updateAnalytics();
    
    // Обработчики событий
    setupEventListeners();
});

// Настройка обработчиков событий
function setupEventListeners() {
    // Форма добавления траты
    document.getElementById('expenseForm').addEventListener('submit', handleAddExpense);
    
    // Навигация по вкладкам
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', handleTabSwitch);
    });
    
    // Фильтры
    document.getElementById('filterCategory').addEventListener('change', renderExpenses);
    document.getElementById('filterDate').addEventListener('change', renderExpenses);
    
    // Фильтрация по периоду в аналитике
    document.getElementById('applyPeriodFilter').addEventListener('click', applyPeriodFilter);
    document.getElementById('resetPeriodFilter').addEventListener('click', resetPeriodFilter);
}

// Обработка добавления траты
function handleAddExpense(e) {
    e.preventDefault();
    
    const amount = parseFloat(document.getElementById('amount').value);
    const category = document.getElementById('category').value;
    const description = document.getElementById('description').value;
    const date = document.getElementById('date').value;
    
    if (!amount || !category || !date) {
        alert('Пожалуйста, заполните все обязательные поля');
        return;
    }
    
    const expense = {
        id: Date.now(),
        amount,
        category,
        description: description || 'Без описания',
        date
    };
    
    expenses.push(expense);
    filteredExpensesByPeriod = [...expenses];
    saveExpenses();
    renderExpenses();
    updateAnalytics();
    
    // Сбросить форму
    document.getElementById('expenseForm').reset();
    document.getElementById('date').valueAsDate = new Date();
    
    alert('Трата успешно добавлена!');
}

// Переключение вкладок
function handleTabSwitch(e) {
    const tabId = e.target.dataset.tab;
    
    // Обновить кнопки навигации
    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
    e.target.classList.add('active');
    
    // Показать соответствующую вкладку
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    document.getElementById(tabId).classList.add('active');
    
    // Обновить аналитику при переключении
    if (tabId === 'analytics') {
        updateAnalytics();
    }
}

// Отображение списка трат
function renderExpenses() {
    const container = document.getElementById('expensesContainer');
    const filterCategory = document.getElementById('filterCategory').value;
    const filterDate = document.getElementById('filterDate').value;
    
    // Фильтрация трат
    let filteredExpenses = [...expenses];
    
    if (filterCategory) {
        filteredExpenses = filteredExpenses.filter(exp => exp.category === filterCategory);
    }
    
    if (filterDate) {
        filteredExpenses = filteredExpenses.filter(exp => exp.date === filterDate);
    }
    
    // Сортировка по дате (новые первые)
    filteredExpenses.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    if (filteredExpenses.length === 0) {
        container.innerHTML = '<p class="empty-state">Нет трат. Добавьте первую трату!</p>';
        return;
    }
    
    container.innerHTML = filteredExpenses.map(expense => `
        <div class="expense-item">
            <div class="expense-info">
                <div class="expense-amount">${expense.amount.toFixed(2)} ₽</div>
                <div class="expense-category">${categories[expense.category]} ${expense.category}</div>
                <div class="expense-description">${expense.description}</div>
                <div class="expense-date">${formatDate(expense.date)}</div>
            </div>
            <div class="expense-actions">
                <button class="btn btn-danger" onclick="deleteExpense(${expense.id})">Удалить</button>
            </div>
        </div>
    `).join('');
}

// Удаление траты
function deleteExpense(id) {
    if (confirm('Вы уверены, что хотите удалить эту трату?')) {
        expenses = expenses.filter(exp => exp.id !== id);
        filteredExpensesByPeriod = [...expenses];
        saveExpenses();
        renderExpenses();
        updateAnalytics();
    }
}

// Обновление аналитики
function updateAnalytics() {
    const totalAmount = filteredExpensesByPeriod.reduce((sum, exp) => sum + exp.amount, 0);
    const totalCount = filteredExpensesByPeriod.length;
    const averageAmount = totalCount > 0 ? totalAmount / totalCount : 0;
    
    // Обновить карточки
    document.getElementById('totalAmount').textContent = `${totalAmount.toFixed(2)} ₽`;
    document.getElementById('totalCount').textContent = totalCount;
    document.getElementById('averageAmount').textContent = `${averageAmount.toFixed(2)} ₽`;
    
    // Обновить разбивку по категориям
    updateCategoryBreakdown(totalAmount);
    
    // Обновить последние траты
    updateRecentExpenses();
}

// Обновление разбивки по категориям
function updateCategoryBreakdown(totalAmount) {
    const container = document.getElementById('categoryBreakdown');
    
    if (filteredExpensesByPeriod.length === 0) {
        container.innerHTML = '<p class="empty-state">Нет данных для анализа</p>';
        return;
    }
    
    // Подсчёт по категориям
    const categoryTotals = {};
    filteredExpensesByPeriod.forEach(exp => {
        if (!categoryTotals[exp.category]) {
            categoryTotals[exp.category] = 0;
        }
        categoryTotals[exp.category] += exp.amount;
    });
    
    // Сортировка по сумме
    const sortedCategories = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1]);
    
    container.innerHTML = sortedCategories.map(([category, amount]) => {
        const percentage = totalAmount > 0 ? (amount / totalAmount) * 100 : 0;
        return `
            <div class="category-item">
                <div>
                    <div class="category-name">${categories[category]} ${category}</div>
                    <div class="category-bar">
                        <div class="category-bar-fill" style="width: ${percentage}%"></div>
                    </div>
                </div>
                <div class="category-amount">${amount.toFixed(2)} ₽</div>
            </div>
        `;
    }).join('');
}

// Обновление последних трат
function updateRecentExpenses() {
    const container = document.getElementById('recentExpenses');
    
    if (filteredExpensesByPeriod.length === 0) {
        container.innerHTML = '<p class="empty-state">Нет недавних трат</p>';
        return;
    }
    
    // Получить последние 5 трат
    const recentExpenses = [...filteredExpensesByPeriod]
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 5);
    
    container.innerHTML = recentExpenses.map(expense => `
        <div class="expense-item">
            <div class="expense-info">
                <div class="expense-amount">${expense.amount.toFixed(2)} ₽</div>
                <div class="expense-category">${categories[expense.category]} ${expense.category}</div>
                <div class="expense-description">${expense.description}</div>
                <div class="expense-date">${formatDate(expense.date)}</div>
            </div>
        </div>
    `).join('');
}

// Форматирование даты
function formatDate(dateString) {
    const options = { day: 'numeric', month: 'long', year: 'numeric' };
    return new Date(dateString).toLocaleDateString('ru-RU', options);
}

// Сохранение в localStorage
function saveExpenses() {
    localStorage.setItem('expenses', JSON.stringify(expenses));
}

// Применить фильтр по периоду
function applyPeriodFilter() {
    const startDate = document.getElementById('startDate').value;
    const endDate = document.getElementById('endDate').value;
    
    if (!startDate && !endDate) {
        alert('Выберите хотя бы одну дату');
        return;
    }
    
    filteredExpensesByPeriod = expenses.filter(expense => {
        const expenseDate = new Date(expense.date);
        let matches = true;
        
        if (startDate) {
            matches = matches && expenseDate >= new Date(startDate);
        }
        
        if (endDate) {
            matches = matches && expenseDate <= new Date(endDate);
        }
        
        return matches;
    });
    
    updateAnalytics();
    alert('Фильтр применён');
}

// Сбросить фильтр по периоду
function resetPeriodFilter() {
    document.getElementById('startDate').value = '';
    document.getElementById('endDate').value = '';
    filteredExpensesByPeriod = [...expenses];
    updateAnalytics();
    alert('Фильтр сброшен');
}
