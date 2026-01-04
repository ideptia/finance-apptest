const Transactions = {
    
    // Получить все транзакции
    getAll() {
        const data = Storage.getData();
        return data.transactions || [];
    },
    
    // Получить транзакцию по ID
    getById(id) {
        const transactions = this.getAll();
        return transactions.find(t => t.id === id);
    },
    
    // Добавить транзакцию
    add(transaction) {
        const data = Storage.getData();
        
        // Генерируем уникальный ID
        transaction.id = 'txn_' + Date.now();
        transaction.timestamp = Date.now();
        
        // Валидация
        const errors = this.validate(transaction);
        if (errors.length > 0) {
            throw new Error(errors.join(', '));
        }
        
        data.transactions.push(transaction);
        Storage.saveData(data);
        return transaction;
    },
    
    // Обновить транзакцию
    update(id, updates) {
        const data = Storage.getData();
        const index = data.transactions.findIndex(t => t.id === id);
        
        if (index === -1) {
            throw new Error('Транзакция не найдена');
        }
        
        // Обновляем данные
        data.transactions[index] = {
            ...data.transactions[index],
            ...updates,
            id: id, // ID не меняем
            timestamp: data.transactions[index].timestamp // timestamp оригинальный
        };
        
        // Валидация
        const errors = this.validate(data.transactions[index]);
        if (errors.length > 0) {
            throw new Error(errors.join(', '));
        }
        
        Storage.saveData(data);
        return data.transactions[index];
    },
    
    // Удалить транзакцию
    delete(id) {
        if (!confirm('Удалить эту операцию?')) {
            return false;
        }
        
        const data = Storage.getData();
        data.transactions = data.transactions.filter(t => t.id !== id);
        Storage.saveData(data);
        return true;
    },
    
    validate(transaction) {
    const errors = [];
    
    if (!transaction.type || !['income', 'expense'].includes(transaction.type)) {
        errors.push('Неверный тип операции');
    }
    
    // ВАЖНО: parseFloat и проверка
    const amount = parseFloat(transaction.amount);
    if (!amount || isNaN(amount) || amount <= 0) {
        errors.push('Сумма должна быть больше 0');
    }
    
    if (!transaction.category || transaction.category === '') {
        errors.push('Выберите категорию');
    }
    
    if (!transaction.date) {
        errors.push('Укажите дату');
    }
    
    // Проверка что дата не в будущем
    const transactionDate = new Date(transaction.date);
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    
    if (transactionDate > today) {
        errors.push('Дата не может быть в будущем');
    }
    
    if (transaction.comment && transaction.comment.length > 200) {
        errors.push('Комментарий слишком длинный (макс. 200 символов)');
    }
    
    return errors;
},
    
    // Фильтрация
    filter(filters = {}) {
        let transactions = this.getAll();
        
        // Фильтр по типу
        if (filters.type && filters.type !== 'all') {
            transactions = transactions.filter(t => t.type === filters.type);
        }
        
        // Фильтр по категории
        if (filters.category && filters.category !== 'all') {
            transactions = transactions.filter(t => t.category === filters.category);
        }
        
        // Фильтр по периоду
        if (filters.period && filters.period !== 'all') {
            const now = new Date();
            const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            
            transactions = transactions.filter(t => {
                const transactionDate = new Date(t.date);
                
                switch (filters.period) {
                    case 'today':
                        return transactionDate >= today;
                    
                    case 'week':
                        const weekAgo = new Date(today);
                        weekAgo.setDate(weekAgo.getDate() - 7);
                        return transactionDate >= weekAgo;
                    
                    case 'month':
                        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
                        return transactionDate >= monthStart;
                    
                    case 'year':
                        const yearStart = new Date(now.getFullYear(), 0, 1);
                        return transactionDate >= yearStart;
                    
                    default:
                        return true;
                }
            });
        }
        
        // Сортировка по дате (новые первые)
        transactions.sort((a, b) => new Date(b.date) - new Date(a.date));
        
        return transactions;
    },
    
    // Расчет баланса
    calculateBalance(transactions = null) {
        if (!transactions) {
            transactions = this.getAll();
        }
        
        let income = 0;
        let expense = 0;
        
        transactions.forEach(t => {
            if (t.type === 'income') {
                income += parseFloat(t.amount);
            } else {
                expense += parseFloat(t.amount);
            }
        });
        
        return {
            income: income,
            expense: expense,
            balance: income - expense
        };
    },
    
    // Группировка по категориям (для диаграмм)
    groupByCategory(type = 'expense') {
        const transactions = this.getAll().filter(t => t.type === type);
        const groups = {};
        
        transactions.forEach(t => {
            if (!groups[t.category]) {
                groups[t.category] = 0;
            }
            groups[t.category] += parseFloat(t.amount);
        });
        
        // Преобразуем в массив и сортируем
        const result = Object.entries(groups)
            .map(([category, amount]) => ({ category, amount }))
            .sort((a, b) => b.amount - a.amount);
        
        return result;
    },
    
    // Статистика по месяцам
    getMonthlyStats(months = 6) {
        const transactions = this.getAll();
        const stats = [];
        const now = new Date();
        
        for (let i = months - 1; i >= 0; i--) {
            const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
            const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);
            
            const monthTransactions = transactions.filter(t => {
                const tDate = new Date(t.date);
                return tDate >= monthStart && tDate <= monthEnd;
            });
            
            const balance = this.calculateBalance(monthTransactions);
            
            stats.push({
                month: date.toLocaleDateString('ru-RU', { month: 'short', year: 'numeric' }),
                income: balance.income,
                expense: balance.expense,
                balance: balance.balance
            });
        }
        
        return stats;
    }
};