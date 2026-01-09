document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Запуск приложения...');
    
   
    if (typeof(Storage) === "undefined") {
        alert('Ваш браузер не поддерживает localStorage. Приложение не будет работать.');
        return;
    }
    
    
    UI.init();
    Charts.init();
    
    console.log('✅ Приложение готово к работе!');
});
