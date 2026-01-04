const UI = {
    
    // Элементы DOM
    elements: {
        // Навигация
        navBtns: document.querySelectorAll('.nav-btn'),
        pages: document.querySelectorAll('.page'),
        
        // Баланс
        totalBalance: document.getElementById('total-balance'),
        totalIncome: document.getElementById('total-income'),
        totalExpense: document.getElementById('total-expense'),
        
        // Списки транзакций
        recentList: document.getElementById('recent-list'),
        allTransactionsList: document.getElementById('all-transactions-list'),
        transactionsCount: document.getElementById('transactions-count'),
        
        // Кнопки быстрых действий
        btnAddIncome: document.getElementById('btn-add-income'),
        btnAddExpense: document.getElementById('btn-add-expense'),
        
        // Модальное окно
        modal: document.getElementById('transaction-modal'),
        modalTitle: document.getElementById('modal-title'),
        modalClose: document.getElementById('modal-close'),
        transactionForm: document.getElementById('transaction-form'),
        transactionId: document.getElementById('transaction-id'),
        
        // Поля формы
        typeRadios: document.querySelectorAll('input[name="type"]'),
        amountInput: document.getElementById('amount'),
        categorySelect: document.getElementById('category'),
        dateInput: document.getElementById('date'),
        commentInput: document.getElementById('comment'),
        charCount: document.getElementById('char-count'),
        
        // Кнопки формы
        btnCancel: document.getElementById('btn-cancel'),
        btnSave: document.getElementById('btn-save'),
        
        // Фильтры
        filterType: document.getElementById('filter-type'),
        filterCategory: document.getElementById('filter-category'),
        filterPeriod: document.getElementById('filter-period'),
        btnResetFilters: document.getElementById('btn-reset-filters'),
        
        // Настройки
        btnExport: document.getElementById('btn-export'),
        btnImport: document.getElementById('btn-import'),
        importFile: document.getElementById('import-file'),
        btnClearAll: document.getElementById('btn-clear-all'),
        
        // Уведомления
        notification: document.getElementById('notification')
    },
    
    // Инициализация
    init() {
        this.setupNavigation();
        this.setupModal();
        this.setupFilters();
        this.setupSettings();
        this.updateAll();
    },
    
    // ===== НАВИГАЦИЯ =====
    setupNavigation() {
        this.elements.navBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const page = btn.dataset.page;
                this.switchPage(page);
            });
        });
    },
    
    switchPage(pageName) {
        // Убираем active со всех кнопок и страниц
        this.elements.navBtns.forEach(btn => btn.classList.remove('active'));
        this.elements.pages.forEach(page => page.classList.remove('active'));
        
        // Добавляем active к нужным
        const activeBtn = document.querySelector(`[data-page="${pageName}"]`);
        const activePage = document.getElementById(`page-${pageName}`);
        
        if (activeBtn) activeBtn.classList.add('active');
        if (activePage) activePage.classList.add('active');
        
        // Обновляем контент страницы
        if (pageName === 'transactions') {
            this.renderAllTransactions();
        } else if (pageName === 'statistics') {
            if (window.Charts) {
                Charts.updateAll();
            }
        }
    },
    
    //ОБНОВЛЕНИЕ ВСЕГО
    updateAll() {
        this.updateBalance();
        this.renderRecentTransactions();
        this.populateCategorySelects();
    },
    
    //БАЛАНС
updateBalance() {
    const balance = Transactions.calculateBalance();
    const currency = Storage.getData().settings.currency;
    
    this.elements.totalBalance.textContent = this.formatMoney(balance.balance, currency);
    this.elements.totalIncome.textContent = this.formatMoney(balance.income, currency);
    this.elements.totalExpense.textContent = this.formatMoney(balance.expense, currency);
    
    // Цвет баланса - ИСПРАВЛЕНО!
    if (balance.balance > 0) {
        this.elements.totalBalance.style.color = '#fff'; // Белый 
        this.elements.totalBalance.style.textShadow = '0 2px 4px rgba(0,0,0,0.2)'; // Тень для читаемости
    } else if (balance.balance < 0) {
        this.elements.totalBalance.style.color = '#f44336';
        this.elements.totalBalance.style.textShadow = '0 2px 4px rgba(0,0,0,0.3)';
    } else {
        this.elements.totalBalance.style.color = '#fff';
        this.elements.totalBalance.style.textShadow = '0 2px 4px rgba(0,0,0,0.2)';
    }
},
    
    // ===== ПОСЛЕДНИЕ ОПЕРАЦИИ =====
    renderRecentTransactions() {
        const transactions = Transactions.getAll().slice(0, 5); // Последние 5
        this.renderTransactionsList(transactions, this.elements.recentList);
    },
    
    // ===== ВСЕ ОПЕРАЦИИ =====
    renderAllTransactions() {
        const filters = {
            type: this.elements.filterType.value,
            category: this.elements.filterCategory.value,
            period: this.elements.filterPeriod.value
        };
        
        const transactions = Transactions.filter(filters);
        this.renderTransactionsList(transactions, this.elements.allTransactionsList, true);
        
        // Обновляем счетчик
        this.elements.transactionsCount.textContent = `${transactions.length} операций`;
    },
    
    // ===== ОТРИСОВКА СПИСКА ОПЕРАЦИЙ =====
    renderTransactionsList(transactions, container, showActions = false) {
        if (transactions.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <p>Операций не найдено</p>
                    <p class="empty-hint">Добавьте первую операцию</p>
                </div>
            `;
            return;
        }
        
        const currency = Storage.getData().settings.currency;
        
        container.innerHTML = transactions.map(t => {
            const sign = t.type === 'income' ? '+' : '-';
            const date = new Date(t.date).toLocaleDateString('ru-RU');
            
            return `
                <div class="transaction-item ${t.type}" data-id="${t.id}">
                    <div class="transaction-info">
                        <div class="transaction-category">${t.category}</div>
                        ${t.comment ? `<div class="transaction-comment">${t.comment}</div>` : ''}
                        <div class="transaction-date">${date}</div>
                    </div>
                    <div class="transaction-amount">
                        <div class="transaction-value ${t.type}">
                            ${sign}${this.formatMoney(t.amount, currency)}
                        </div>
                        ${showActions ? `
                            <div class="transaction-actions">
                                <button class="btn-icon-only" onclick="UI.editTransaction('${t.id}')" title="Редактировать">✏️</button>
                                <button class="btn-icon-only" onclick="UI.deleteTransaction('${t.id}')" title="Удалить">🗑️</button>
                            </div>
                        ` : ''}
                    </div>
                </div>
            `;
        }).join('');
    },
    
    // ===== МОДАЛЬНОЕ ОКНО =====
    setupModal() {
        // Открытие модалки для дохода
        this.elements.btnAddIncome.addEventListener('click', () => {
            this.openModal('income');
        });
        
        // Открытие модалки для расхода
        this.elements.btnAddExpense.addEventListener('click', () => {
            this.openModal('expense');
        });
        
        // Закрытие модалки
        this.elements.modalClose.addEventListener('click', () => {
            this.closeModal();
        });
        
        this.elements.btnCancel.addEventListener('click', () => {
            this.closeModal();
        });
        
        // Закрытие по клику вне модалки
        this.elements.modal.addEventListener('click', (e) => {
            if (e.target === this.elements.modal) {
                this.closeModal();
            }
        });
        
        // Счетчик символов комментария
        this.elements.commentInput.addEventListener('input', (e) => {
            const length = e.target.value.length;
            this.elements.charCount.textContent = `${length}/200`;
        });
        
        // Изменение категорий при смене типа
        this.elements.typeRadios.forEach(radio => {
            radio.addEventListener('change', () => {
                this.populateCategorySelect(radio.value);
            });
        });
        
        // Отправка формы
        this.elements.transactionForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveTransaction();
        });
    },
    
    openModal(type = 'expense', transactionId = null) {
        // Заполняем категории
        this.populateCategorySelect(type);
        
        if (transactionId) {
            // Режим редактирования
            const transaction = Transactions.getById(transactionId);
            if (!transaction) return;
            
            this.elements.modalTitle.textContent = 'Редактировать операцию';
            this.elements.transactionId.value = transaction.id;
            
            // Заполняем форму
            document.querySelector(`input[name="type"][value="${transaction.type}"]`).checked = true;
            this.elements.amountInput.value = transaction.amount;
            this.elements.categorySelect.value = transaction.category;
            this.elements.dateInput.value = transaction.date;
            this.elements.commentInput.value = transaction.comment || '';
            this.elements.charCount.textContent = `${transaction.comment?.length || 0}/200`;
            
        } else {
            // Режим добавления
            this.elements.modalTitle.textContent = 'Добавить операцию';
            this.elements.transactionId.value = '';
            this.elements.transactionForm.reset();
            
            // Устанавливаем тип
            document.querySelector(`input[name="type"][value="${type}"]`).checked = true;
            
            // Устанавливаем сегодняшнюю дату
            this.elements.dateInput.value = new Date().toISOString().split('T')[0];
            this.elements.charCount.textContent = '0/200';
        }
        
        this.elements.modal.classList.add('active');
        this.elements.amountInput.focus();
    },
    
    closeModal() {
        this.elements.modal.classList.remove('active');
        this.elements.transactionForm.reset();
    },
    
    saveTransaction() {
    // Получаем данные напрямую из полей (не через FormData)
    const transactionId = this.elements.transactionId.value;
    
    // Получаем выбранный тип
    const typeRadio = document.querySelector('input[name="type"]:checked');
    
    const transaction = {
        type: typeRadio ? typeRadio.value : 'expense',
        amount: parseFloat(this.elements.amountInput.value),
        category: this.elements.categorySelect.value,
        date: this.elements.dateInput.value,
        comment: this.elements.commentInput.value.trim()
    };
    
    // Дополнительная проверка
    console.log('Сохраняем транзакцию:', transaction);
    
    try {
        if (transactionId) {
            // Обновление
            Transactions.update(transactionId, transaction);
            this.showNotification('Операция обновлена', 'success');
        } else {
            // Добавление
            Transactions.add(transaction);
            this.showNotification('Операция добавлена', 'success');
        }
        
        this.closeModal();
        this.updateAll();
        this.renderAllTransactions();
        
        // Обновляем диаграммы если на странице статистики
        if (window.Charts && document.getElementById('page-statistics').classList.contains('active')) {
            Charts.updateAll();
        }
        
    } catch (error) {
        console.error('Ошибка сохранения:', error);
        this.showNotification(error.message, 'error');
    }
},
    
    editTransaction(id) {
        const transaction = Transactions.getById(id);
        if (transaction) {
            this.openModal(transaction.type, id);
        }
    },
    
    deleteTransaction(id) {
        if (Transactions.delete(id)) {
            this.showNotification('Операция удалена', 'success');
            this.updateAll();
            this.renderAllTransactions();
            
            if (window.Charts) {
                Charts.updateAll();
            }
        }
    },
    
    // ===== КАТЕГОРИИ =====
    populateCategorySelects() {
        // Заполняем select для фильтра
        const data = Storage.getData();
        const allCategories = [...data.categories.income, ...data.categories.expense];
        
        this.elements.filterCategory.innerHTML = '<option value="all">Все категории</option>' +
            allCategories.map(cat => 
                `<option value="${cat.name}">${cat.icon} ${cat.name}</option>`
            ).join('');
    },
    
    populateCategorySelect(type) {
        const data = Storage.getData();
        const categories = type === 'income' ? data.categories.income : data.categories.expense;
        
        this.elements.categorySelect.innerHTML = '<option value="">Выберите категорию</option>' +
            categories.map(cat => 
                `<option value="${cat.name}">${cat.icon} ${cat.name}</option>`
            ).join('');
    },
    
    // ===== ФИЛЬТРЫ =====
    setupFilters() {
        this.elements.filterType.addEventListener('change', () => {
            this.renderAllTransactions();
        });
        
        this.elements.filterCategory.addEventListener('change', () => {
            this.renderAllTransactions();
        });
        
        this.elements.filterPeriod.addEventListener('change', () => {
            this.renderAllTransactions();
        });
        
        this.elements.btnResetFilters.addEventListener('click', () => {
            this.elements.filterType.value = 'all';
            this.elements.filterCategory.value = 'all';
            this.elements.filterPeriod.value = 'all';
            this.renderAllTransactions();
        });
    },
    
    // ===== НАСТРОЙКИ =====
    setupSettings() {
        // Экспорт
        this.elements.btnExport.addEventListener('click', () => {
            Storage.exportData();
            this.showNotification('Данные экспортированы', 'success');
        });
        
        // Импорт
        this.elements.btnImport.addEventListener('click', () => {
            this.elements.importFile.click();
        });
        
        this.elements.importFile.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (!file) return;
            
            try {
                await Storage.importData(file);
                this.showNotification('Данные импортированы', 'success');
                this.updateAll();
                this.renderAllTransactions();
                if (window.Charts) {
                    Charts.updateAll();
                }
            } catch (error) {
                this.showNotification('Ошибка импорта: ' + error.message, 'error');
            }
            
            // Очищаем input
            e.target.value = '';
        });
        
        // Очистка всех данных
        this.elements.btnClearAll.addEventListener('click', () => {
            if (Storage.clearAll()) {
                this.showNotification('Все данные удалены', 'success');
                this.updateAll();
                this.renderAllTransactions();
                if (window.Charts) {
                    Charts.updateAll();
                }
            }
        });
    },
    
    // ===== УВЕДОМЛЕНИЯ =====
    showNotification(message, type = 'success') {
        this.elements.notification.textContent = message;
        this.elements.notification.className = `notification ${type}`;
        this.elements.notification.classList.add('show');
        
        setTimeout(() => {
            this.elements.notification.classList.remove('show');
        }, 3000);
    },
    
    // ===== ФОРМАТИРОВАНИЕ =====
    formatMoney(amount, currency = '₽') {
        return new Intl.NumberFormat('ru-RU', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(amount) + ' ' + currency;
    }
};