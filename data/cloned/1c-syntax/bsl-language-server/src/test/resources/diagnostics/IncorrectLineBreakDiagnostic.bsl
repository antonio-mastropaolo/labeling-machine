// Pass
СуммаДокумента = СуммаБезСкидки
                 + СуммаРучнойСкидки
                 + СуммаАвтоматическойСкидки;

// Error
СуммаДокумента = СуммаБезСкидки +
                 СуммаРучнойСкидки +
                 СуммаАвтоматическойСкидки;
// Pass
СуммаДокумента = СуммаБезСкидки
    + СуммаРучнойСкидки
    + СуммаАвтоматическойСкидки;

// Error
СуммаДокумента = СуммаБезСкидки +
    СуммаРучнойСкидки +
    СуммаАвтоматическойСкидки;

// Error
ПоляОтбора = "Номенклатура,Характеристика,Склад" + // Дополнительный комментарий
   ДополнительныеПоляОтбора;

// Pass
ПоляОтбора = "Номенклатура,Характеристика,Склад"
   + ДополнительныеПоляОтбора;

// Pass
ТекстЗапроса = ТекстЗапроса +
"ВЫБРАТЬ
| Номенклатура.Ссылка КАК Ссылка
|ИЗ
| Справочник. Номенклатура КАК Номенклатура";

// Pass
ИменаДокументов = Новый СписокЗначений;
ИменаДокументов.Добавить(Метаданные.Документы.СтрокаВыпискиРасход.Имя,
                         Метаданные.Документы.СтрокаВыпискиРасход.Синоним);
ИменаДокументов.Добавить(Метаданные.Документы.РасходныйКассовыйОрдер.Имя,
                         Метаданные.Документы.РасходныйКассовыйОрдер.Синоним);

// Error
ИменаДокументов = Новый СписокЗначений;
ИменаДокументов.Добавить(Метаданные.Документы.СтрокаВыпискиРасход.Имя
                         ,Метаданные.Документы.СтрокаВыпискиРасход.Синоним);
ИменаДокументов.Добавить(Метаданные.Документы.РасходныйКассовыйОрдер.Имя
                         ,Метаданные.Документы.РасходныйКассовыйОрдер.Синоним);

// Pass
ИменаДокументов = Новый СписокЗначений;
ИменаДокументов.Добавить(Метаданные.Документы.СтрокаВыпискиРасход.Имя,
    Метаданные.Документы.СтрокаВыпискиРасход.Синоним);
ИменаДокументов.Добавить(Метаданные.Документы.РасходныйКассовыйОрдер.Имя,
    Метаданные.Документы.РасходныйКассовыйОрдер.Синоним);

// Error
ИменаДокументов = Новый СписокЗначений;
ИменаДокументов.Добавить(Метаданные.Документы.СтрокаВыпискиРасход.Имя
    ,Метаданные.Документы.СтрокаВыпискиРасход.Синоним);
ИменаДокументов.Добавить(Метаданные.Документы.РасходныйКассовыйОрдер.Имя
    ,Метаданные.Документы.РасходныйКассовыйОрдер.Синоним);

// Pass
Если (ВидОперации = Перечисления.ВидыОперацийПоступлениеМПЗ.ПоступлениеРозница)
  ИЛИ (ВидОперации = Перечисления.ВидыОперацийПоступлениеМПЗ.ПоступлениеРозницаКомиссия) Тогда
  Возврат Истина;
КонецЕсли;

// Error
Если (ВидОперации = Перечисления.ВидыОперацийПоступлениеМПЗ.ПоступлениеРозница) ИЛИ
  (ВидОперации = Перечисления.ВидыОперацийПоступлениеМПЗ.ПоступлениеРозницаКомиссия) Тогда
  Возврат Истина;
КонецЕсли;

// Pass
Если ((СтруктураМодуля[Индекс].Блок = Перечисления.ТипыБлоковМодулей.ЗаголовокПроцедуры)
  ИЛИ(СтруктураМодуля[Индекс].Блок = Перечисления.ТипыБлоковМодулей.ЗаголовокФункции))
  И(Найти(ВРЕГ(СтруктураМодуля[Индекс].Текст), КлючБлока)> 0) Тогда
  Возврат Истина;
КонецЕсли;

// Error
Если ((СтруктураМодуля[Индекс].Блок = Перечисления.ТипыБлоковМодулей.ЗаголовокПроцедуры) ИЛИ
  (СтруктураМодуля[Индекс].Блок = Перечисления.ТипыБлоковМодулей.ЗаголовокФункции))
  И(Найти(ВРЕГ(СтруктураМодуля[Индекс].Текст), КлючБлока)> 0) Тогда
  Возврат Истина;
КонецЕсли;

// Error
	Декоратор = Новый КонструкторДекоратора(Сущность)
		.ДобавитьИмпортПоИмени("decorator")
		.ДобавитьПриватноеПоле("_МенеджерСущностей", МенеджерСущностей)
		.ДобавитьПриватноеПоле("_ОбъектМодели", ОбъектМодели)
		.ДобавитьМетод(
			"Прочитать",
			"_ТипСущности = ОбработкаДекоратора.ИсходныйТип(ЭтотОбъект);
			|_ДанныеСущности = _МенеджерСущностей.ПолучитьОдно(
			|	_ТипСущности,
			|	_ОбъектМодели.ПолучитьЗначениеИдентификатора(ЭтотОбъект)
			|);
			|ОбработкаДекоратора.СинхронизироватьПоля(_ДанныеСущности, ЭтотОбъект);"
		)
		.ДобавитьМетод(
			"Сохранить",
			"_МенеджерСущностей.Сохранить(ЭтотОбъект);"
		)
		.ДобавитьМетод(
			"Удалить",
			"_МенеджерСущностей.Удалить(ЭтотОбъект);"
		)
		.Построить();

Запрос = Новый Запрос;
Запрос.Текст =
// Pass
"ВЫБРАТЬ *
|Истина";

// Pass
МногострочнаяСтрока = "что-то и
// Pass
|что-то и
// Pass
|что-то и";

// Pass
///////////////////////////////////////////////////////////////////

// Pass
// Структура -
