const Storage = {
    // Ключ для хранения
    STORAGE_KEY: 'finance_app_data',
    
    // Получить все данные
    getData() {
        try {
            const data = localStorage.getItem(this.STORAGE_KEY);
            return data ? JSON.parse(data) : this.getDefaultData();
        } catch (error) {
            console.error('Ошибка загрузки данных:', error);
            return this.getDefaultData();
        }
    },
    
    // Сохранить данные
    saveData(data) {
        try {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
            return true;
        } catch (error) {
            console.error('Ошибка сохранения данных:', error);
            if (error.name === 'QuotaExceededError') {
                alert('Хранилище переполнено! Экспортируйте старые данные.');
            }
            return false;
        }
    },
    
    // Структура данных по умолчанию
    getDefaultData() {
        return {
            transactions: [],
            categories: {
                income: [
                    { id: 'inc_1', name: 'Зарплата', icon: '💰' },
                    { id: 'inc_2', name: 'Подработка', icon: '💼' },
                    { id: 'inc_3', name: 'Инвестиции', icon: '📈' },
                    { id: 'inc_4', name: 'Продажа', icon: '💵' },
                    { id: 'inc_5', name: 'Другое', icon: '💳' }
                ],
                expense: [
                    { id: 'exp_1', name: 'Продукты', icon: '🛒' },
                    { id: 'exp_2', name: 'Транспорт', icon: '🚗' },
                    { id: 'exp_3', name: 'Развлечения', icon: '🎮' },
                    { id: 'exp_4', name: 'Здоровье', icon: '💊' },
                    { id: 'exp_5', name: 'Жилье', icon: '🏠' },
                    { id: 'exp_6', name: 'Связь', icon: '📱' },
                    { id: 'exp_7', name: 'Одежда', icon: '👕' },
                    { id: 'exp_8', name: 'Образование', icon: '📚' },
                    { id: 'exp_9', name: 'Кафе/Рестораны', icon: '🍽️' },
                    { id: 'exp_10', name: 'Другое', icon: '💸' }
                ]
            },
            settings: {
                currency: '₽',
                language: 'ru'
            }
        };
    },
    
    // Очистить все данные
    clearAll() {
        if (confirm('Вы уверены? Все данные будут удалены!')) {
            localStorage.removeItem(this.STORAGE_KEY);
            return true;
        }
        return false;
    },
    
    // Экспорт в JSON
    exportData() {
        const data = this.getData();
        const json = JSON.stringify(data, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        const date = new Date().toISOString().split('T')[0];
        a.href = url;
        a.download = `finance_backup_${date}.json`;
        a.click();
        URL.revokeObjectURL(url);
    },
    
    // Импорт из JSON
    importData(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const data = JSON.parse(e.target.result);
                    // Простая валидация
                    if (data.transactions && data.categories) {
                        this.saveData(data);
                        resolve(true);
                    } else {
                        reject(new Error('Неверный формат файла'));
                    }
                } catch (error) {
                    reject(error);
                }
            };
            reader.onerror = () => reject(new Error('Ошибка чтения файла'));
            reader.readAsText(file);
        });
    }
};