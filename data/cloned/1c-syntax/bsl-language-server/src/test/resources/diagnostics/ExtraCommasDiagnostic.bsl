
// хорошо
Результат = Метод(Парам1, , Парам2);
Результат = Метод(Парам1, Парам2);
Результат = Модуль.Метод(Парам1, Парам2, Парам3);
Результат = Модуль.Метод(Парам1, , Парам2);

// плохо
Результат = Метод1(Парам1, , Парам2,);
Результат = Метод2(Парам1, Парам2,,,);
Результат = Модуль.Метод3(Парам1, Парам2, Парам3,, );
Результат = Модуль.Метод4(Парам1, , Парам2,,,,);

Если Метод5(Парам1, , Парам2,,,,) Тогда

КонецЕсли;

Если Модуль.Метод6(Парам1, , Парам2,,,,) Тогда

КонецЕсли;