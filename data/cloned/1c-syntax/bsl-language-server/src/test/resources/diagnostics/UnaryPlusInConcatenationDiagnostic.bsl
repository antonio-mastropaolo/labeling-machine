
// Проверка не сработает
Хорошо = "Строка1" + "Строка2";

// Проверка сработает
Плохо = "Строка1" + + "Строка2";

// Проверка сработает
Плохо = "Строка0" + ("Строка1" + + "Строка2");

// Проверка не сработает
ОченьХорошо = Хорошо + Плохо;

// Проверка не сработает
Допустимо = Хорошо + + 5;

// Проверка не сработает
ТожеДопустимо = "Хорошо" + + 5;

// Проверка не сработает
ВообщеМинус = 5 + - 5;

// Проверка сработает
ОченьПлохо = Плохо + + Допустимо;
