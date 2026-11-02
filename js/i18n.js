/*
 * Interface language: Ukrainian (the source texts) or Polish.
 * The program writes everything in Ukrainian; in Polish mode every text that appears on the page is translated
 * on the fly: whole known sentences first, then known phrases, then single words. Signal, track and section
 * names (Н1, Ч4, 15аП, М12 …) are names and stay as they are.
 */
(function () {
  "use strict";
  const LANGS = { uk: "Українська", pl: "Polski" };
  let lang = "uk";
  try { lang = localStorage.getItem("dsp-lang") || "uk"; } catch (e) { /* storage unavailable */ }
  if (!LANGS[lang]) lang = "uk";

  // ---------------------------------------------------------------- whole sentences (exact, trimmed)
  const EXACT = {
    "АРМ ДСП": "Stanowisko DR",
    "Навчальна симуляція. Не підключена до реальної залізничної інфраструктури. Час подій у графіку вигаданий, це не архівний графік руху станції.":
      "Symulacja szkoleniowa. Niepodłączona do rzeczywistej infrastruktury kolejowej. Czasy zdarzeń w rozkładzie są wymyślone, to nie jest archiwalny rozkład jazdy stacji.",
    "Клацніть світлофор, стрілку або секцію, щоб відкрити панель команд.": "Kliknij semafor, zwrotnicę lub odcinek, aby otworzyć panel poleceń.",
    "Клацніть рядок, щоб побачити відомості про поїзд.": "Kliknij wiersz, aby zobaczyć informacje o pociągu.",
    "Нічого не вибрано.": "Nic nie wybrano.",
    "Учбовий графік": "Rozkład szkoleniowy", "Історичні відомості": "Informacje historyczne",
    "Історичні відомості (окремо від моделі)": "Informacje historyczne (niezależnie od modelu)",
    "Найближча подія": "Najbliższe zdarzenie", "Розклад на добу": "Rozkład na dobę", "Журнал подій": "Dziennik zdarzeń", "Графік руху": "Wykres ruchu",
    "Панель об'єкта": "Panel obiektu", "Поїзд": "Pociąg", "АВАРІЯ": "WYPADEK", "Радіо · поїзні телефонограми": "Radio · telefonogramy ruchowe",
    "РЕЖИМ УПРАВЛ.": "TRYB STER.", "ОСНОВН.": "PODST.", "РЕЗЕРВН.": "REZERW.", "ДОПОМІЖ.": "POMOC.", "ПОЇЗД.": "POC.", "ВІЛЬН.": "WOLN.", "МАНЕВР.": "MANEWR.",
    "ВІДМІНА": "ODWOŁ.", "ІР": "SZ", "ЗАПОБІЖН.": "BEZPIECZN.", "УПОВІЛЬН. КОЛ.ПОВТ.": "ZWOLN. POWT. TOR.", "РЕЗЕРВ. КВ.": "REZERW. KW.", "РОЗРІЗ СТР.": "ROZPRUCIE ZWR.",
    "МІСЦЕ · РЕЖИМ": "MIEJSCE · TRYB", "РУЧНЕ": "RĘCZNY", "АВТО": "AUTO", "МАНЕВРИ": "MANEWRY", "ЛІЧИЛЬНИКИ": "LICZNIKI", "МАСШТАБ": "SKALA",
    "ЗС": "SZ", "ДП": "PP", "ШР": "SZW", "· ДП": "· PP", "· ШР": "· SZW",
    "Зрозуміло": "Rozumiem", "Виконати": "Wykonaj", "Відмінити": "Anuluj", "Заблокувати": "Zablokuj", "Скасувати": "Anuluj",
    "Причина блокування": "Przyczyna blokady", "Підтвердіть виконання команди": "Potwierdź wykonanie polecenia",
    "Підтвердіть виконання відповідальної команди": "Potwierdź wykonanie polecenia odpowiedzialnego",
    "Для підтвердження введіть число": "Aby potwierdzić, wpisz liczbę",
    "⏸ Пауза": "⏸ Pauza", "▶ Пуск": "▶ Start", "⏭ До події": "⏭ Do zdarzenia", "↺ Скинути добу": "↺ Zresetuj dobę", "⏱ Час": "⏱ Czas", "⚙ Налаштування": "⚙ Ustawienia",
    "▣ Лише пульт": "▣ Tylko pulpit", "▤ Показати все": "▤ Pokaż wszystko", "Радіо": "Radio", "Мережа": "Sieć", "Зараз": "Teraz", "доба": "doba",
    "Усі": "Wszystkie", "Команди": "Polecenia", "Поїзди": "Pociągi", "Затримки": "Opóźnienia", "Помилки": "Błędy",
    "№ поїзда": "Nr pociągu", "Дата": "Data", "Час": "Czas", "Тип": "Typ", "Стоянка": "Postój", "Від станції": "Ze stacji", "До станції": "Do stacji", "Зміст": "Treść",
    "план": "plan", "виконаний": "wykonany", "Мова": "Język", "Фон": "Tło", "чорно-білий": "czarno-biały", "сіро-білий": "szaro-biały",
    "Підказувати код": "Podpowiadaj kod", "Звукові сигнали": "Sygnały dźwiękowe", "Маневрові роботи": "Prace manewrowe", "Графік": "Rozkład", "генератор": "generator",
    "із завдання (JSON)": "z zadania (JSON)", "Рух": "Ruch", "рідкий": "rzadki", "середній": "średni", "інтенсивний": "intensywny", "Варіант": "Wariant", "Застосувати": "Zastosuj",
    "Новий варіант": "Nowy wariant", "Після 23:59": "Po 23:59", "новий день": "nowy dzień", "зупинка": "zatrzymanie", "Автодиспетчер": "Autodyspozytor",
    "вимкнено — усе задаєте ви": "wyłączony — wszystko ustawiasz ty", "лише поїзди — ви робите маневри": "tylko pociągi — ty wykonujesz manewry", "усе задає система": "wszystko ustawia system",
    "×1 — модельна доба за 1 год реального часу.": "×1 — doba modelowa w 1 godz. czasu rzeczywistego.",
    "Як працювати на АРМ ДСП": "Jak pracować na stanowisku dyżurnego ruchu",
    "Ефір": "Eter", "Станція": "Stacja", "Гра по мережі": "Gra sieciowa", "Маршрути": "Trasy",
    "Встановити поїзний маршрут": "Ustaw przebieg pociągowy", "Встановити маневровий маршрут": "Ustaw przebieg manewrowy",
    "Повторно відкрити світлофор": "Ponownie otwórz semafor", "Закрити світлофор": "Zamknij semafor", "Відмінити (скасувати) маршрут": "Odwołaj (anuluj) przebieg",
    "Увімкнути запрошувальний сигнал (до 90 с, поїзд ≤20 км/год)": "Włącz sygnał zastępczy (do 90 s, pociąg ≤20 km/h)",
    "Перевести стрілку в плюсове положення": "Przestaw zwrotnicę w położenie plusowe", "Перевести стрілку в мінусове положення": "Przestaw zwrotnicę w położenie minusowe",
    "Допоміжне переведення стрілки (секцію перевірено особисто)": "Pomocnicze przestawienie zwrotnicy (odcinek sprawdzony osobiście)",
    "Заблокувати положення стрілки": "Zablokuj położenie zwrotnicy", "Розблокувати положення стрілки": "Odblokuj położenie zwrotnicy",
    "Заблокувати стрілку": "Zablokuj zwrotnicę", "Розблокувати стрілку": "Odblokuj zwrotnicę", "Заблокувати світлофор": "Zablokuj semafor", "Розблокувати світлофор": "Odblokuj semafor",
    "Заблокувати ділянку": "Zablokuj odcinek", "Розблокувати ділянку": "Odblokuj odcinek", "Розблокувати": "Odblokuj",
    "Поставити маневровий локомотив": "Postaw lokomotywę manewrową", "Прибрати маневровий локомотив": "Usuń lokomotywę manewrową",
    "Виконано.": "Wykonano.", "Заблоковано.": "Zablokowano.", "Причеплено.": "Doczepiono.", "Відчеплено.": "Odczepiono.",
    "⛓ Причепити": "⛓ Doczep", "✂ Відчепити": "✂ Odczep", "Приклад, як можна виконати": "Przykład, jak można to wykonać",
    "Шлях і порядок маневрів обираєте ви; робота зараховується за результатом.": "Drogę i kolejność manewrów wybierasz ty; praca jest zaliczana według wyniku.",
    "Що має бути в результаті": "Co ma być w wyniku",
    "(шлях і порядок обираєте ви: будь-які маневрові маршрути в будь-який бік; причеплення до состава під відправлення — лише з боку відправлення):":
      "(drogę i kolejność wybierasz ty: dowolne przebiegi manewrowe w dowolną stronę; doczepienie do składu do odjazdu — tylko od strony odjazdu):",
    "модельний час": "czas modelowy", "уточнити": "do uzupełnienia", "зараз": "teraz", "вільно": "wolny", "одноколійна": "jednotorowy",
    "автодиспетчер": "autodyspozytor", "ви": "ty", "Маршрути": "Trasy", "Мамут — Генічеськ": "Mamut — Henicześk"
  };

  // ---------------------------------------------------------------- phrases (inside longer texts)
  const PHRASES = [
    ["АРМ ДСП", "Stanowisko DR"], ["АРМ", "stanowisko"], ["комп'ютер АРМ", "komputer stanowiska"], ["ЗАПОБІЖН. (ПРЕДОХР.)", "BEZPIECZN."], ["УПОВІЛЬН. КОЛ. ПОВТ. (ЗАМЕДЛ. ПУТ. ПОВТ.)", "ZWOLN. POWT. TOR."],
    ["УПОВІЛЬН. КОЛ.ПОВТ.", "ZWOLN. POWT. TOR."], ["РЕЗЕРВ. КВ.", "REZERW. KW."], ["РОЗРІЗ СТР.", "ROZPRUCIE ZWR."], ["ЗАПОБІЖН.", "BEZPIECZN."], ["ОСНОВН.", "PODST."], ["РЕЗЕРВН.", "REZERW."],
    ["ДОПОМІЖ.", "POMOC."], ["ПОЇЗД.", "POC."], ["ВІЛЬН.", "WOLN."], ["МАНЕВР.", "MANEWR."], ["РЕЖИМ УПРАВЛ.", "TRYB STER."], ["ВІДМІНА", "ODWOŁ."], ["РУЧНЕ", "RĘCZNY"], ["МАНЕВРИ", "MANEWRY"],
    ["СХІД З РЕЙОК", "WYKOLEJENIE"], ["ЗІТКНЕННЯ", "ZDERZENIE"], ["АВАРІЯ", "WYPADEK"], ["ЛІЧИЛЬНИКИ", "LICZNIKI"], ["МАСШТАБ", "SKALA"],
    ["поїзний маршрут", "przebieg pociągowy"], ["поїзного маршруту", "przebiegu pociągowego"], ["поїзним маршрутом", "przebiegiem pociągowym"], ["поїзні маршрути", "przebiegi pociągowe"],
    ["маневровий маршрут", "przebieg manewrowy"], ["маневрового маршруту", "przebiegu manewrowego"], ["маневровим маршрутом", "przebiegiem manewrowym"], ["маневрові маршрути", "przebiegi manewrowe"],
    ["маневровими маршрутами", "przebiegami manewrowymi"], ["маневровий рух на поїзд заборонено", "ruch manewrowy na pociąg zabroniony"],
    ["маневровий склад", "skład manewrowy"], ["маневрового складу", "składu manewrowego"], ["Маневровий склад", "Skład manewrowy"],
    ["маневровий світлофор", "tarcza manewrowa"], ["маневрові світлофори", "tarcze manewrowe"], ["вхідний світлофор", "semafor wjazdowy"], ["вихідний світлофор", "semafor wyjazdowy"],
    ["вихідного світлофора", "semafora wyjazdowego"], ["запрошувальний сигнал", "sygnał zastępczy"], ["запрошувальним сигналом", "na sygnał zastępczy"], ["запрошувальний", "sygnał zastępczy"],
    ["штучне розмикання", "sztuczne zwolnienie"], ["Штучне розмикання", "Sztuczne zwolnienie"], ["допоміжне переведення", "pomocnicze przestawienie"], ["Допоміжне переведення", "Pomocnicze przestawienie"],
    ["ділянка наближення", "odcinek zbliżania"], ["ділянку наближення", "odcinek zbliżania"], ["на ділянці наближення", "na odcinku zbliżania"], ["наближення", "zbliżanie"],
    ["відправлення", "odjazd"], ["кінець маршруту", "koniec przebiegu"], ["кінець маршруту відправлення на", "koniec przebiegu odjazdowego do"],
    ["відпр. на", "odj. do"], ["вхідний з", "wjazdowy z"], ["виїзд з колії", "wyjazd z toru"], ["виїзд з тупика", "wyjazd z toru zakończonego kozłem"], ["виїзд з", "wyjazd z"],
    ["Перегін з", "Szlak z"], ["Перегін на", "Szlak do"], ["1-й блок", "1. odstęp"], ["2-й блок", "2. odstęp"], ["1-а ділянка", "1. odcinek"],
    ["Подача вагонів", "Podstawienie wagonów"], ["Прибирання вагонів", "Zabranie wagonów"], ["Зміна локомотива", "Zmiana lokomotywy"],
    ["локомотив з боку відправлення", "lokomotywa od strony odjazdu"], ["з боку відправлення", "od strony odjazdu"], ["не з боку відправлення", "nie od strony odjazdu"],
    ["з лівого боку", "z lewej strony"], ["з правого боку", "z prawej strony"], ["лівий кінець", "lewy koniec"], ["правий кінець", "prawy koniec"],
    ["у депо", "do lokomotywowni"], ["в депо", "do lokomotywowni"], ["з депо", "z lokomotywowni"], ["вагонне депо", "wagonownia"], ["у вагонне депо", "do wagonowni"], ["з вагонного депо", "z wagonowni"],
    ["локомотивне депо", "lokomotywownia"], ["Локомотивне депо", "Lokomotywownia"], ["Вагонне депо", "Wagonownia"], ["екіпірувальний парк", "grupa torów zaplecza"], ["екіпірувальному парку", "grupie torów zaplecza"],
    ["в екіпірувальний парк", "do grupy torów zaplecza"], ["з екіпірувального парку", "z grupy torów zaplecza"], ["Екіпірувальний парк", "Grupa torów zaplecza"],
    ["за графіком", "zgodnie z rozkładem"], ["запізн.", "opóźn."], ["Запізнюється на", "Opóźniony o"], ["задана затримка", "zadane opóźnienie"],
    ["через", "za"], ["хв", "min"], ["год", "godz."], ["с", "s"], ["км/год", "km/h"], ["м", "m"], ["бл.", "odst."],
    ["Порада ДСП", "Porada dla DR"], ["Маневрова робота", "Praca manewrowa"], ["Локомотив з'явиться на ділянці", "Lokomotywa pojawi się na odcinku"], ["Локомотив на", "Lokomotywa na"],
    ["План складається, коли состав стоятиме на колії.", "Plan powstaje, gdy skład będzie stał na torze."], ["Порядок", "Kolejność"], ["потім", "potem"],
    ["зараз:", "teraz:"], ["чекати", "czekać"], ["виставити состав для відправлення", "wystawić skład do odjazdu"], ["відчепити й залишити вагони", "odczepić i zostawić wagony"],
    ["причепити вагони", "doczepić wagony"], ["причепитися до состава з боку відправлення", "doczepić się do składu od strony odjazdu"],
    ["Що має бути в результаті", "Co ma być w wyniku"], ["вагони причеплено і привезено", "wagony doczepione i przywiezione"], ["локомотив повернувся на", "lokomotywa wróciła na"],
    ["локомотив побував на", "lokomotywa była na"], ["локомотив з вагонами", "lokomotywa z wagonami"], ["готовий до відправлення", "gotowy do odjazdu"],
    ["локомотив причеплено до состава", "lokomotywa doczepiona do składu"], ["чекає маневрового маршруту", "czeka na przebieg manewrowy"], ["чекає відкриття", "czeka na otwarcie"],
    ["маневри завершено", "manewry zakończone"], ["роботу зараховано за результатом", "praca zaliczona według wyniku"], ["завершив маневри на", "zakończył manewry na"],
    ["з'явився на", "pojawił się na"], ["прибув на", "przybył na"], ["віддалився з", "oddalił się z"], ["проходить", "przejeżdża"], ["сформовано на", "zestawiony na"],
    ["потрібен обгін/перечеплення локомотива", "potrzebny objazd/przepięcie lokomotywy"], ["состав готовий до зворотного рейсу", "skład gotowy do kursu powrotnego"],
    ["на колії", "na torze"], ["на колію", "na tor"], ["з колії", "z toru"], ["до колії", "do toru"], ["колії", "toru"],
    ["відправлення о", "odjazd o"], ["посадка/огляд", "wsiadanie/oględziny"], ["стоїть:", "stoi:"], ["рух по", "jazda po"], ["відправлено", "wyprawiony"], ["проследував", "przejechał"],
    ["Маршрут", "Przebieg"], ["маршрут", "przebieg"], ["маршруту", "przebiegu"], ["маршрути", "przebiegi"], ["маршрутом", "przebiegiem"], ["маршруті", "przebiegu"],
    ["розімкнено після проходу", "zwolniony po przejeździe"], ["замкнено", "zamknięty"], ["набір", "nastawianie"], ["відмова", "odmowa"], ["відмінено", "odwołany"],
    ["Йде встановлення іншого маршруту — зачекайте кілька секунд", "Trwa nastawianie innego przebiegu — poczekaj kilka sekund"],
    ["замкнена у ворожому маршруті", "zamknięty w przebiegu wrogim"], ["зайнята вагонами", "zajęty przez wagony"], ["показує зайнятість", "pokazuje zajętość"],
    ["Радіо: понад 10 повідомлень без відповіді — відповіли автоматично", "Radio: ponad 10 wiadomości bez odpowiedzi — odpowiedziano automatycznie"],
    ["не передано телефонограму на ст.", "nie przekazano telefonogramu na st."], ["не повторено телефонограму від ст.", "nie powtórzono telefonogramu ze st."],
    ["Поїзд №", "Pociąg nr"], ["пройшов о", "przejechał o"], ["відправився о", "odjechał o"], ["прибув о", "przybył o"],
    ["Машиніст поїзда №", "Maszynista pociągu nr"], ["зрозумів, маршрут готую.", "zrozumiałem, przebieg przygotowuję."],
    ["Причина блокування", "Przyczyna blokady"], ["Вкажіть причину блокування", "Podaj przyczynę blokady"], ["причина:", "przyczyna:"],
    ["стрілки", "zwrotnicy"], ["світлофора", "semafora"], ["ділянки", "odcinka"],
    ["Стрілку", "Zwrotnicę"], ["Світлофор", "Semafor"], ["Ділянку", "Odcinek"], ["заблоковано", "zablokowano"], ["розблоковано", "odblokowano"],
    ["Код пильності не збігся", "Kod czujności nie zgadza się"], ["Команду відмінено ДСП", "Polecenie anulowane przez DR"],
    ["Добу перезапущено з 00:00", "Dobę uruchomiono ponownie od 00:00"], ["на всій ділянці", "na całym odcinku"], ["Перезапуск після аварії", "Restart po wypadku"],
    ["СХІД З РЕЙОК", "WYKOLEJENIE"], ["ЗІТКНЕННЯ", "ZDERZENIE"], ["у неправильному положенні", "w niewłaściwym położeniu"], ["стрілку переведено перед поїздом", "zwrotnicę przestawiono przed pociągiem"],
    ["Маршрут Мамут → Генічеськ", "Trasa Mamut → Henicześk"], ["Маршрут Дніпро-Головний → Пост Амур", "Trasa Dniepr Główny → Post Amur"],
    ["лише маневри на Дніпрі-Головному", "tylko manewry na stacji Dniepr Główny"], ["← Вийти з маршруту", "← Wyjdź z trasy"],
    ["Станції маршруту", "Stacje trasy"], ["ви тут", "jesteś tutaj"], ["клацніть, щоб перейти", "kliknij, aby przejść"], ["на підході", "na zbliżaniu"],
    ["Причина блокування", "Przyczyna blokady"], ["доба", "doba"], ["подій", "zdarzeń"], ["план від", "plan z"], ["Навчальна модель МПЦ", "Model szkoleniowy SRK"],
    ["Порада ДСП", "Porada dla DR"], ["Подій до кінця доби немає.", "Brak zdarzeń do końca doby."], ["Маневрових робіт до кінця доби немає.", "Brak prac manewrowych do końca doby."],
    ["Режим спостереження.", "Tryb obserwacji."], ["Відмова:", "Odmowa:"], ["Добу скинуто на 00:00:00.", "Doba zresetowana do 00:00:00."]
  ];

  // ---------------------------------------------------------------- single words (lower case)
  const W = `на=na|колія=tor|колії=toru|блок=odstęp|колію=tor|вагонів=wagonów|не=nie|перегін=szlak|відправлення=odjazd|колія=tor|до=do|за=za|маршруту=przebiegu|тупик=tor zakończony kozłem|депо=lokomotywownia|виїзд=wyjazd|подача=podstawienie|прибирання=zabranie|локомотив=lokomotywa|кінець=koniec|маршрут=przebieg|состав=skład|стрілки=zwrotnicy|біля=przy|світлофор=semafor|хв=min|вхідний=wjazdowy|відпр=odj|станції=stacji|через=przez|без=bez|або=lub|немає=brak|маневровий=manewrowy|головний=główny|платформи=peronu|поїзда=pociągu|поїзд=pociąg|ще=jeszcze|локомотива=lokomotywy|головна=główny|еп=ep|парний=parzysty|парк=grupa torów|діє=czynna|стрілку=zwrotnicę|по=po|горловину=głowicę|непарний=nieparzysty|порт=port|обгін=objazd|плані=planie|состава=składu|порту=portu|склад=skład|заблоковано=zablokowano|ділянка=odcinek|лише=tylko|витягування=wyciąganie|ст=st|зупинки=postoju|боку=strony|маневри=manewry|парку=grupy torów|переведення=przestawienie|прибув=przybył|від=od|для=dla|між=między|одноколійний=jednotorowy|готовий=gotowy|кінцева=końcowa|год=godz|зупинка=postój|моделі=modelu|після=po|вагони=wagony|секція=odcinek|стрілка=zwrotnica|положення=położenie|доба=doba|вхідним=wjazdowym|тупика=toru kozłowego|колій=torów|маршруті=przebiegu|розмикання=zwolnienie|сигнал=sygnał|зайнятість=zajętość|горловини=głowicy|поїзди=pociągi|база=baza|шлях=droga|екіпірувальний=zaplecza|стоїть=stoi|рейс=kurs|ви=ty|керує=kieruje|поїзний=pociągowy|рухомий=tabor|розблокувати=odblokuj|заблокувати=zablokuj|контролю=kontroli|допоміжне=pomocnicze|зайнята=zajęty|авто=auto|автодиспетчер=autodyspozytor|графік=rozkład|кімнату=pokój|ім=im|уже=już|зворотний=powrotny|чекає=czeka|вправо=w prawo|вліво=w lewo|ним=nim|вільну=wolny|ведучий=gospodarz|встановити=ustaw|секція=odcinek|ділянку=odcinek|зайнятий=zajęty|стрілками=zwrotnicami|екіпірувального=zaplecza|під'їзна=bocznica|ділянки=odcinka|прибуття=przyjazd|із=z|час=czas|бік=stronę|праву=prawą|спостереження=obserwacja|задано=zadano|вимкнено=wyłączony|бази=bazy|хід=tor|стрілка=zwrotnica|вже=już|відмова=odmowa|причеплено=doczepiono|горловині=głowicy|поїздів=pociągów|безстрілочна=bezzwrotnicowy|світлофора=semafora|радіо=radio|підтверджено=potwierdzono|журнал=dziennik|км=km|проміжна=pośrednia|двоколійна=dwutorowa|кінця=końca|графіком=rozkładem|відміна=odwołanie|набору=nastawiania|запрошувальний=zastępczy|показує=pokazuje|локомотив=lokomotywa|перед=przed|станцією=stacją|гравець=gracz|веде=prowadzi|сценарій=scenariusz|під=pod|станцій=stacji|вантажна=towarowa|середній=średni|керують=kierują|стоянка=postój|замкнена=zamknięty|рух=ruch|праворуч=w prawo|вихідного=wyjazdowego|назад=z powrotem|одноколійна=jednotorowa|вірно=zgadza się|пройшов=przejechał|довжина=długość|клацніть=kliknij|замкнено=zamknięto|вихідний=wyjazdowy|відмінити=anuluj|перевести=przestaw|навчання=szkolenie|штучне=sztuczne|хибну=fałszywą|відмінено=anulowano|код=kod|виконано=wykonano|режим=tryb|робота=praca|вагонами=wagonami|часу=czasu|доби=doby|дата=data|система=system|щоб=aby|станцію=stację|роботи=prace|маршрути=przebiegi|управління=sterowania|стрілок=zwrotnic|маршрутом=przebiegiem|план=plan|гравець=gracz|базу=bazę|зі=z|положенні=położeniu|розблоковано=odblokowano|секції=odcinka|інтерсіті=Intercity|завершено=zakończono|ліворуч=w lewo|наближення=zbliżanie|віддалення=oddalanie|та=i|дсп=DR|стрілкою=zwrotnicą|вантажний=towarowy|виходу=wyjazdu|відчепитися=odczepić się|виїхати=wyjechać|ліву=lewą|тупикова=czołowa|машиніст=maszynista|сигналу=sygnału|відкриття=otwarcie|відправився=odjechał|зміст=treść|переїзд=przejazd|майданчик=plac|виділено=wyróżniono|синім=niebieskim|кнопка=przycisk|перечеплення=przepięcie|зворотного=powrotnego|рейсу=kursu|потрібен=potrzebny|формується=zestawiany|часом=czasem|пульт=pulpit|поїзний=pociągowy|кінцевий=końcowy|виберіть=wybierz|замикання=zamknięcie|інший=inny|набір=nastawianie|відкрито=otwarto|білий=biały|заборонено=zabroniono|відкрити=otwórz|закрити=zamknij|переводиться=przestawia się|стрілочна=zwrotnicowa|як=jak|спершу=najpierw|витримка=zwłoka|команди=polecenia|пильності=czujności|ділянці=odcinku|перегоні=szlaku|модельний=modelowy|подій=zdarzeń|локомотивом=lokomotywą|маневрова=manewrowa|маневрів=manewrów|можна=można|потім=potem|порада=porada|станція=stacja|затримка=opóźnienie|пауза=pauza|добу=dobę|новий=nowy|маневрові=manewrowe|задає=ustawia|увімкнено=włączono|прокрутка=przewijanie|завдання=zadanie|замкнутим=zamkniętym|планом=planem|повністю=całkowicie|навчальна=szkoleniowa|модель=model|разом=razem|станції=stacji|вийти=wyjdź|поточна=bieżąca|завершиться=zakończy się|гравців=graczy|зв'язок=połączenie|вдалося=udało się|цього=tego|браузера=przeglądarki|напрямку=kierunku|далі=dalej|мостом=mostem|електропоїзд=EZT|господарський=gospodarczy|вузлова=węzłowa|перегону=szlaku|несправність=usterka|відкритий=otwarty|розімкнено=zwolniono|поставлено=postawiono|поїздом=pociągiem|маневрового=manewrowego|виставлено=wystawiono|знайдено=znaleziono|усе=wszystko|вантажні=towarowe|вантажну=towarową|вказана=wskazana|посібник=podręcznik|році=roku|про=o|це=to|відомості=informacje|повернення=powrót|парні=parzyste|обгін=objazd|сусідню=sąsiednią|свою=swoją|лінія=linia|телефонограма=telefonogram|вхідна=przychodzący|прийняв=przyjąłem|зрозумів=zrozumiałem|закритого=zamkniętego|готую=przygotowuję|телефонограму=telefonogram|понад=ponad|повідомлень=wiadomości|відповіді=odpowiedzi|відповіли=odpowiedziano|автоматично=automatycznie|передати=przekaż|ефір=eter|контейнерний=kontenerowy|стр=zwr|під'їзну=bocznicę|голову=czoło|правий=prawy|лівого=lewego|зайняті=zajęte|екіпірування=obsługa|відчепити=odczep|під'їзної=bocznicy|гри=gry|залишив=zostawił|переводяться=są przestawiane|ручне=ręczny|витримкою=zwłoką|схемі=schemacie|тут=tutaj|прийняти=przyjąć|відправити=wyprawić|повторно=ponownie|горить=świeci|контроль=kontrola|ні=nie|стан=stan|заблокована=zablokowany|плюс=plus|мінус=minus|несправності=usterki|відновити=przywróć|електромеханік=elektromechanik|ввести=wprowadź|втрату=utratę|поставити=postaw|прибрати=usuń|усунути=usuń|увімкнути=włącz|секцію=odcinek|перевірено=sprawdzono|підтвердіть=potwierdź|виконання=wykonanie|підтвердження=potwierdzenia|блокування=blokada|команду=polecenie|збігся=zgadza się|перезапущено=uruchomiono ponownie|відкладено=odłożono|затримано=zatrzymano|з'явиться=pojawi się|результатом=wynikiem|прийом=przyjęcie|сама=sam|зупинено=zatrzymano|спостерігати=obserwować|перейти=przejść|підході=zbliżaniu|пуск=start|день=dzień|налаштуваннях=ustawieniach|витримки=zwłoki|недоступна=niedostępna|події=zdarzenia|змінено=zmieniono|номер=numer|варіанта=wariantu|новий=nowy|наведено=podano|окремих=osobnych|окремі=osobne|кілька=kilka|ділянку=odcinek|той=ten|хто=kto|створив=utworzył|модельна=modelowa|реального=rzeczywistego|підключення=połączenie|кімната=pokój|мережа=sieć|більше=więcej|вкладки=karty|вкладках=kartach|кімнати=pokoju|інших=innych|іншим=innym|спостерігає=obserwuje|непар=niep|пар=parz|перестановка=przestawienie|зміна=zmiana|передатна=zdawczo-odbiorcza|синя=niebieska|платформа=peron|зміною=zmianą|вантажної=towarowej|територія=teren|території=terenie|невідомий=nieznany|ребра=krawędzi|модельної=modelowej|керування=sterowania|потребує=wymaga|уточнення=doprecyzowania|комплект=komplet|відміни=odwołania|але=ale|перекрито=zamknięto|втрата=utrata|переведено=przestawiono|тестовий=testowy|рухається=jedzie|проходу=przejazdu|коліях=torach|залишено=pozostawiono|завершив=zakończył|посадка=wsiadanie|правило=zasada|зупинкою=postojem|прийнято=przyjęto|локомотивного=lokomotywowego|прибулий=przybyły|вільної=wolnego|составом=składem|зміни=zmiany|підст=podst|команд=poleceń|сполучення=połączenie|року=roku|графіку=rozkładzie|вигаданий=wymyślony|руху=ruchu|тип=typ|головну=główny|обгінного=wyprzedzania|вихідна=wyjazdowa|стійте=stójcie|чекайте=czekajcie|передано=przekazano|повторено=powtórzono|стою=stoję|всі=wszyscy|повторити=powtórz|текст=tekst|дія=działanie|поїзних=ruchowych|телефонограм=telefonogramów|підписи=podpisy|під'їзна=bocznica|скорочено=skrót|короткий=krótki|повертає=zwraca|безстрілочної=bezzwrotnicowego|вільній=wolnym|прибулого=przybyłego|виставлення=wystawienie|локомотиву=lokomotywy|нема=nie ma|де=gdzie|стати=stanąć|контейнерного=kontenerowego|майданчика=placu|фактом=faktem|подачі=podstawienia|прибраних=zabranych|ваг=wag|голові=czole|підсвічені=podświetlone|підсвічений=podświetlony|задати=ustawić|відкриється=otworzy się|встановлено=ustawiono|закритий=zamknięty|обведені=obwiedzione|бірюзовим=turkusowym|показання=wskazanie|дозволено=dozwolone|зелений=zielony|синій=niebieski|червоний=czerwony|розріз=rozprucie|плюсовий=plusowy|мінусовий=minusowy|вільна=wolny|об'єкт=obiekt|її=go|натискають=naciska się|скасувати=anuluj|плюсове=plusowe|мінусове=minusowe|особисто=osobiście|відповідальної=odpowiedzialnego|команда=polecenie|введіть=wpisz|число=liczbę|вкажіть=podaj|причину=przyczynę|відповідальну=odpowiedzialne|всій=całym|перезапуск=restart|аварії=wypadku|проїхав=przejechał|активний=aktywny|пас=pas|тов=tow|ман=man|ел=ezt|тест=test|хоз=gosp|рез=rez|прим=podm|виставити=wystawić|залишити=zostawić|причепити=doczepić|причепитися=doczepić się|лівої=lewej|правої=prawej|що=co|складається=powstaje|коли=gdy|стоятиме=będzie stał|лівий=lewy|порядок=kolejność|обираєте=wybierasz|зараховується=jest zaliczana|приклад=przykład|виконати=wykonać|рушить=ruszy|раніше=wcześniej|залишиться=zostanie|маневрових=manewrowych|робіт=prac|задана=zadana|помилка=błąd|увага=uwaga|автодисп=autodysp|дивляться=oglądają|завершена=zakończona|скиньте=zresetuj|оберіть=wybierz|швидкість=prędkość|скинуто=zresetowano|виконує=wykonuje|згенеровано=wygenerowano|завантажено=wczytano|інтенсивність=intensywność|перегенеровано=wygenerowano ponownie|випадковий=losowy|задаються=są ustawiane|індивідуального=indywidualnego|навіть=nawet|може=może|призвести=doprowadzić|сходу=wykolejenia|зіткнення=zderzenia|показати=pokaż|все=wszystko|посібником=podręcznikiem|джерело=źródło|між=między|станціями=stacjami|перемикайтеся=przełączaj się|кнопкою=przyciskiem|поруч=obok|гравця=gracza|вихід=wyjście|вибір=wybór|спостерігаєте=obserwujesz|аварія=wypadek|швидкістю=prędkością|ведучим=gospodarzem|втрачено=utracono|повертаємось=wracamy|власної=własnej|грає=gra|іншу=inną|приєднатися=dołącz|сервера=serwera|створити=utwórz|спробуйте=spróbuj|грі=grze|кожен=każdy|своєю=swoją|решту=resztę|ваше=twoje|ім'я=imię|перевірки=sprawdzenia|гравці=gracze|інші=inni|напряму=bezpośrednio|браузерами=przeglądarkami|безкоштовний=darmowy|сервер=serwer|рахує=liczy|його=jego|їхні=ich|передайте=przekaż|гравцям=graczom|тягова=trakcyjna|підстанція=podstacja|моторвагонного=EZT|відкрита=otwarta|об'єднано=połączono|верхньої=górnej|мосту=mostu|ціла=cała|передатну=zdawczo-odbiorczą|моторвагонне=EZT|міст=most|електропоїзда=EZT|витягнути=wyciągnąć|составу=składu|бічній=bocznym|територію=teren|продовження=przedłużenie|скидальною=wykolejnicą|платформами=peronami|маневрова=manewrowa|скидальна=wykolejnica|колією=torem|відгалуження=odgałęzienie|виконуєте=wykonujesz|дорозі=drodze|того=tego|ребро=krawędź|вузол=węzeł|кореневого=głównego|вістря=iglicy|напрямок=kierunek|початок=początek|топологія=topologia|потрібне=potrzebne|йде=trwa|встановлення=ustawianie|іншого=innego|зачекайте=poczekaj|секунд=sekund|там=tam|ворожому=wrogim|визначене=określone|перевести=przestawić|переведіть=przestaw|індивідуально=indywidualnie|встановлюється=jest ustawiany|попутні=po drodze|закриття=zamknięcie|закрито=zamknięto|лишається=pozostaje|посекційне=sekcyjne|розмикається=zwalnia się|цьому=tym|режимі=trybie|можливе=możliwe|відповідальність=odpowiedzialność|фізично=fizycznie|неможливо=niemożliwe|увага=uwaga|основний=podstawowy|резервний=rezerwowy|допоміжний=pomocniczy|індикатор=wskaźnik|навчальна=szkoleniowa|норма=norma|замок=zamek|причина=przyczyna|закрийте=zamknij|йде=trwa|вхідних=wjazdowych|вихідних=wyjazdowych|лічильник=licznik|усунено=usunięto|відновлено=przywrócono|пасажирський=pasażerski|товарний=towarowy|приміський=podmiejski|дизель=spalinowy|сформовано=zestawiono|з'явився=pojawił się|прибрано=usunięto|схеми=schematu|поїзним=pociągowym|вільного=wolnego|шляху=drogi|маневрами=manewrami|які=które|проміжний=pośredni|завданням=zadaniem|нього=niego|поверніть=zawróć|правого=prawego|побував=był|привезено=przywieziono|повернувся=wrócił|складу=składu|зчіплення=sprzęganie|розчеплення=rozprzęganie|відправляється=odjeżdża|під'їдьте=podjedź|роботу=pracę|зараховано=zaliczono|огляд=oględziny|проследував=przejechał|віддалився=oddalił się|утворюють=tworzą|бічну=boczny|стрілці=zwrotnicy|відправлено=wyprawiono|переведену=przestawioną|зіткнувся=zderzył się|маневровим=manewrowym|складом=składem|рейок=szyn|неправильному=niewłaściwym|потрібні=potrzebne|чекають=czekają|витримку=zwłokę|скасовано=anulowano|симуляцію=symulację|почалася=zaczęła się|створено=utworzono|пропустити=przepuścić|головній=głównym|локомотивної=lokomotywowej|бригади=drużyny|очікування=oczekiwanie|висадка=wysiadanie|колійні=torowe|пріоритет=priorytet|завантажився=załadował się|завантажити=załadować|кімнаті=pokoju|приймають=przyjmują|вільних=wolnych|приєднався=dołączył|керуєте=kierujesz|цією=tą|зайнято=zajęte|вийшов=wyszedł|відповів=odpowiedział|локомотивне=lokomotywowe|вантажних=towarowych|вантажному=towarowym|ході=torze|вагонне=wagonowe|поїзді=pociągu|відійшов=odjechał|екіпірувальному=zaplecza|вагонного=wagonowego|відчеплення=odczepienie|велика=duża|лінії=linii|кор=kor|тяг=trakc|додатковий=dodatkowy|неправильну=niewłaściwą|непарну=nieparzystą|підписано=podpisano|правіше=bardziej w prawo|ними=nimi|окрема=osobny|позначено=oznaczono|знаком=znakiem|ніж=niż|світлофори=semafory|похилий=ukośny|штрих=kreska|ймовірно=prawdopodobnie|сигнальний=sygnałowy|знак=znak|пристрій=urządzenie|призначення=przeznaczenie|тому=dlatego|датою=datą|коригування=korekty|вхідні=wjazdowe|напрямки=kierunki|кілометр=kilometr|автоматизовані=zautomatyzowane|станційні=stacyjne|системи=systemy|рухом=ruchem|механіка=mechanika|початкового=początkowego|кінцевого=końcowego|три=trzy|комплекти=komplety|лічильниками=licznikami|кольори=kolory|станів=stanów|табл=tab|принципи=zasady|інтерфейсу=interfejsu|нитковий=jednokreskowy|контекстні=kontekstowe|меню=menu|об'єктів=obiektów|діалог=dialog|відповідальних=odpowiedzialnych|індивідуальне=indywidualne|секцій=odcinków|симулятор=symulator|запозичує=zapożycza|ці=te|графіка=rozkładu|копіюється=jest kopiowany|пасажирське=pasażerskie|кримом=Krymem|вихідному=wyjazdowym|завданні=zadaniu|курсували=kursowały|кримських=krymskich|маршрутів=tras|грудня=grudnia|їх=ich|обмежено=ograniczono|тут=tutaj|ця=ta|теза=teza|перевірялася=była sprawdzana|подано=podano|посилання=odnośnik|грудень=grudzień|українська=ukraińska|правда=prawda|крим=Krym|ускладнив=utrudnił|залізничне=kolejowe|материковою=kontynentalną|україною=Ukrainą|портал=portal|історична=historyczna|довідка=informacja|населений=zamieszkały|пункт=punkt|літопис=kronika|генічеського=henickiego|краю=kraju|номери=numery|пасажирських=pasażerskich|історично=historycznie|згадувані=wspominane|напрямком=kierunkiem|симуляторі=symulatorze|позначки=oznaczenia|модельних=modelowych|згенерований=wygenerowany|електропоїзди=EZT|обгони=wyprzedzania|генератор=generator|створює=tworzy|добовий=dobowy|правилами=zasadami|курсування=kursowanie|навчальний=szkoleniowy|правила=zasady|приймання=przyjmowania|головні=główne|платформ=peronów|бічних=bocznych|спрощено=uproszczono|загальної=ogólnej|практики=praktyki|взято=wzięto|вантажні=towarowe|рухи=ruchy|вигадані=wymyślone|навчальні=szkoleniowe|сценарії=scenariusze|відповідають=odpowiadają|реальним=rzeczywistym|перевезенням=przewozom|обгінна=wyprzedzania|зупиняються=zatrzymują się|пост=posterunek|мпц=SRK|гра=gra|мережі=sieci|налаштування=ustawienia|задаєте=ustawiasz|робите=wykonujesz|підказувати=podpowiadaj|звукові=dźwiękowe|сигнали=sygnały|фон=tło|маневрові=manewrowe|рідкий=rzadki|інтенсивний=intensywny|варіант=wariant|застосувати=zastosuj|скинути=zresetuj|симуляція=symulacja|підключена=podłączona|реальної=rzeczywistej|залізничної=kolejowej|інфраструктури=infrastruktury|архівний=archiwalny|учбовий=szkoleniowy|панель=panel|виконаний=wykonany|найближча=najbliższe|подія=zdarzenie|розклад=rozkład|рядок=wiersz|побачити=zobaczyć|окремо=osobno|описано=opisano|назви=nazwy|блоків=odstępów|поділ=podział|блоки=odstępy|довжини=długości|модельні=modelowe|об'єкта=obiektu|нічого=nic|вибрано=wybrano|телефонограми=telefonogramy|розділ=rozdział|і=i|й=i|а=a|в=w|у=w|з=z|о=o|чи=czy|поїзні=ruchowe|вагонів=wagonów|кінцеву=końcowy|прибуває=przybywa|станом=stanem|перехід=przejście|стоянку=postój|зупинку=postój|приймання=przyjmowanie|колій=torów|вхід=wjazd|звідси=stąd|хвилин=minut|хвилини=minuty|секунди=sekundy|станцію=stację|перегоні=szlaku|станцією=stacją|ділянок=odcinków|ділянках=odcinkach|дільниці=odcinku|ділянкою=odcinkiem|сусідньої=sąsiedniej|сусідня=sąsiednia|сусідньої=sąsiedniej|відправити=wyprawić|сигналі=sygnale|черговий=dyżurny|чергового=dyżurnego|вільний=wolny|зайнята=zajęty|рухомого=taboru|складу=składu|колією=torem|кінцевій=końcowej|ним=nim|ними=nimi|до=do|від=od|для=dla|при=przy|як=jak|так=tak|теж=też|також=także|якщо=jeśli|коли=gdy|поки=dopóki|доки=dopóki|лише=tylko|тільки=tylko|вже=już|ще=jeszcze|усі=wszystkie|кожна=każda|кожен=każdy|свій=swój|своєї=swojej|свого=swojego|його=jego|її=jej|їх=ich|цей=ten|ця=ta|це=to|ці=te|той=ten|та=i|або=lub|чи=czy|тому=dlatego|бо=bo|але=ale|ніж=niż|без=bez|над=nad|під=pod|між=między|біля=przy|після=po|перед=przed|через=przez|про=o|по=po|за=za|на=na|до=do|вагон=wagon|вагона=wagonu|вагоні=wagonie|ваг=wag|поїзду=pociągu|поїздів=pociągów|поїзди=pociągi|поїзде=pociągu|електропоїзду=EZT|електропоїздів=EZT|станція=stacja|станцій=stacji|станції=stacji|маршрут=przebieg|локомотиви=lokomotywy|локомотивів=lokomotyw|машиніста=maszynisty|машиністом=maszynistą|ліва=lewa|права=prawa|верхній=górny|нижній=dolny|верхня=górna|нижня=dolna|нижня=dolna|верх=góra|низ=dół|угорі=u góry|знизу=na dole|зліва=z lewej|справа=z prawej|наближенні=zbliżaniu|зайнятому=zajętym|вільному=wolnym|навчальному=szkoleniowym|вмикається=włącza się|кліком=kliknięciem|значення=znaczenie|посібнику=podręczniku|описане=opisane|точне=dokładne|рисунка=rysunku|пульта=pulpitu|повідомлення=wiadomość|комп'ютер=komputer|інструментів=narzędzi|своїй=swojej|вписується=jest wpisywany|поле=pole|звук=dźwięk|вступає=wjeżdża|дзвінок=dzwonek|кожне=każdą|однаковий=jednakowy|дає=daje|розтягнути=rozciągnąć|прокрутити=przewiń|появи=pojawienia się|наступного=następnego|легенда=legenda|вигляд=wygląd|змін=zmian|останнього=ostatniego|жовтий=żółty|триває=trwa|блимає=miga|запобіжників=bezpieczników|індикатора=wskaźnika|будь-якої=dowolnej|зменшити=zmniejsz|вся=cała|збільшити=zwiększ|пізніше=później|горизонталі=poziomie|вертикалі=pionie|примітка=uwaga|займає=zajmuje|наступний=następny|тиша=cisza|ефірі=eterze|відправить=wyprawi|вас=ciebie|місце=miejsce|передатної=zdawczo-odbiorczego|запорізьке=Zaporoska|кайдацький=kajdacki|історичні=historyczne|відчеплено=odczepiono|запрошувальним=zastępczym|сигналом=sygnałem|запізн=opóźn|зіставлено=zestawiono|працювати=pracować|поїзного=pociągowego|чорно=czarno|сіро=szaro|ж=ż|я=ja|є=jest|ф=f|гол=gł|нижньодн=Niżniodn|іваненко=Iwanenko|гончаренко=Honczarenko|марченко=Marczenko|литвиненко=Łytwynenko|бондар=Bondar|ткаченко=Tkaczenko|олійник=Olijnyk|мельник=Melnyk|коваленко=Kowalenko|шевченко=Szewczenko|литвин=Łytwyn|захарченко=Zacharczenko|кравченко=Krawczenko|кузьменко=Kuźmenko|кравець=Krawieć|ткачук=Tkaczuk|савченко=Sawczenko|петренко=Petrenko|бойко=Bojko|руденко=Rudenko|мороз=Moroz|поліщук=Poliszczuk|лисенко=Łysenko|клименко=Kłymenko|павленко=Pawlenko|сидоренко=Sydorenko|ліворуч=w lewo|праворуч=w prawo|уперед=naprzód|назад=wstecz|між=między|тягова=trakcyjna`;
  const WORDS = {};
  W.split("|").forEach((p) => { const i = p.indexOf("="); if (i > 0) WORDS[p.slice(0, i).toLowerCase()] = p.slice(i + 1); });
  // place names (their cases) — Polish forms
  const PLACES = {
    "Сокологірне": "Sokołohirne", "Бердянськ": "Berdiańsk", "Бердянська": "Berdiańska", "Запоріжжя": "Zaporoże", "Запоріжжя-1": "Zaporoże-1", "Запоріжжя-Ліве": "Zaporoże-Liwe", "Запоріжжя-Лівого": "Zaporoża-Liwego",
    "Мелітополь": "Melitopol", "Мелітополя": "Melitopola", "Джанкой": "Dżankoj", "Джанкоя": "Dżankoju", "Генічеськ": "Henicześk", "Генічеська": "Heniczeska", "Генічеську": "Heniczesku",
    "Новоолексіївка": "Nowooleksijiwka", "Новоолексіївки": "Nowooleksijiwki", "Новоолексіївку": "Nowooleksijiwkę", "Новоолексіївкою": "Nowooleksijiwką",
    "Салькове": "Salkowe", "Салькового": "Salkowego", "Сиваш": "Sywasz", "Сиваша": "Sywasza", "Солоне": "Sołone", "Солоного": "Sołonego", "Озеро": "Oziero", "Озера": "Oziera",
    "Мамут": "Mamut", "Мамута": "Mamuta", "Дніпро": "Dniepr", "Дніпра": "Dniepru", "Дніпрі": "Dnieprze", "Головний": "Główny", "Головного": "Głównego", "Головному": "Głównym",
    "Дніпро-Головний": "Dniepr Główny", "Дніпра-Головного": "Dniepru Głównego", "Дніпрі-Головному": "Dnieprze Głównym",
    "Пост": "Post", "Амур": "Amur", "Амура": "Amur", "Нижньодніпровськ": "Niżniodnieprowsk", "Нижньодніпровська": "Niżniodnieprowska", "Партизани": "Partyzany", "Партизан": "Partyzan",
    "Пологи": "Połohy", "Київ": "Kijów", "Харків": "Charków", "Горяїнове": "Horiajinowe", "Горяїнового": "Horiajinowego", "Ліве": "Liwe", "Лівого": "Liwego", "Сімферополь": "Symferopol",
    "Сімферополя": "Symferopola", "Нікополь": "Nikopol", "Дніпропетровськ": "Dniepropetrowsk", "Кайдацька": "Kajdacka", "Кайдацької": "Kajdackiej", "Кайдацьку": "Kajdacką", "Сухачівка": "Suchacziwka",
    "Сухачівки": "Suchacziwki", "Сухачівку": "Suchacziwkę", "Якимівка": "Jakymiwka", "Якимівки": "Jakymiwki", "Якимівку": "Jakymiwkę", "Севастополь": "Sewastopol", "Євпаторія": "Eupatoria",
    "Берда": "Berda", "Берди": "Berdy", "Берду": "Berdę", "Львів": "Lwów", "Львова": "Lwowa", "Феодосія": "Teodozja", "Федорівка": "Fedoriwka", "Херсон": "Chersoń", "Херсоном": "Chersoniem",
    "Кривий": "Krzywy", "Ріг": "Róg", "Марганець": "Marhaniec", "Москва": "Moskwa", "Новомосковськ": "Nowomoskowsk", "Павлоград": "Pawłohrad", "П'ятихатки": "Piatychatky", "Одеса": "Odessa",
    "Верхньодніпровськ": "Wierchniodnieprowsk", "Кам'янське": "Kamieńskie", "Синельникове": "Synelnykowe", "Анатолія": "Anatolija", "Алімова": "Alimowa", "Україна": "Ukraina", "Крим": "Krym",
    "Курська": "Kurska", "Вадим": "Wadym", "Владиславівка": "Władysławiwka", "Армянськ": "Armiańsk", "Богемка": "Bohemka", "Кримом": "Krymem", "Укрінформ": "Ukrinform"
  };
  Object.entries(PLACES).forEach(([k, v]) => (WORDS[k.toLowerCase()] = v));

  // ---------------------------------------------------------------- the translator
  const CYR = /[А-ЯҐЄІЇа-яґєії]/;
  const LD = "\\p{L}\\p{N}";
  const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  // phrases written in capitals (lamp captions, accident titles) match only in capitals; the rest — in any case
  const isCaps = (k) => /[А-ЯҐЄІЇ]/.test(k) && k === k.toUpperCase();
  const PH = {}, PHC = {};
  PHRASES.forEach(([a, b]) => { if (isCaps(a)) PHC[a] = b; else PH[a.toLowerCase()] = b; });
  const reOf = (keys, fl) => new RegExp("(?<![" + LD + "])(" + keys.sort((a, b) => b.length - a.length).map(esc).join("|") + ")(?![" + LD + "])", fl);
  const PHC_RE = reOf(Object.keys(PHC), "gu"), PH_RE = reOf(Object.keys(PH), "giu");
  const WORD_RE = new RegExp("(?<![" + LD + "])[А-ЯҐЄІЇа-яґєії'’]+(?:-[А-ЯҐЄІЇа-яґєії'’]+)*(?![" + LD + "])", "gu");
  const caseLike = (src, out) => {
    if (!out) return out;
    const letters = src.replace(/[^А-ЯҐЄІЇа-яґєії]/g, "");
    if (letters.length > 1 && letters === letters.toUpperCase()) return out.toUpperCase();
    if (src[0] !== src[0].toLowerCase()) return out[0].toUpperCase() + out.slice(1);
    return out;
  };
  const cache = new Map();
  function t(s) {
    if (lang === "uk" || s == null) return s;
    s = String(s);
    if (!CYR.test(s)) return s;
    const hit = cache.get(s); if (hit != null) return hit;
    const m = /^(\s*)([\s\S]*?)(\s*)$/.exec(s), core = m[2];
    let out = EXACT[core];
    if (out == null) {
      out = core.replace(PH_RE, (w) => caseLike(w, PH[w.toLowerCase()])).replace(PHC_RE, (w) => PHC[w]);
      out = out.replace(WORD_RE, (w) => {
        const k = w.toLowerCase().replace(/’/g, "'");
        let r = WORDS[k];
        if (r == null && k.includes("-")) { const parts = w.split("-").map((x) => WORDS[x.toLowerCase()]); if (parts.every((x) => x != null)) r = parts.join("-"); }
        // names of signals, tracks and sections (short capitals, letters with digits) stay as they are
        if (r == null) return w;
        return caseLike(w, r);
      });
    }
    out = m[1] + out + m[3];
    if (cache.size < 20000) cache.set(s, out);
    return out;
  }

  // ---------------------------------------------------------------- the page
  const ATTRS = ["title", "aria-label", "placeholder"];
  const skip = (el) => el && el.closest && el.closest("[data-noi18n], script, style, textarea");
  function trText(n) { if (skip(n.parentElement)) return; const v = n.data; if (!CYR.test(v)) return; const r = t(v); if (r !== v) n.data = r; }
  function trAttrs(el) { if (el.closest && el.closest("[data-noi18n], script, style")) return; ATTRS.forEach((a) => { const v = el.getAttribute && el.getAttribute(a); if (v && CYR.test(v)) { const r = t(v); if (r !== v) el.setAttribute(a, r); } }); }
  function apply(root) {
    if (lang === "uk" || !root) return;
    if (root.nodeType === 3) { trText(root); return; }
    if (root.nodeType !== 1 && root.nodeType !== 9) return;
    if (root.nodeType === 1) trAttrs(root);
    const tw = document.createTreeWalker(root, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT);
    for (let n = tw.nextNode(); n; n = tw.nextNode()) { if (n.nodeType === 3) trText(n); else trAttrs(n); }
  }
  function start() {
    document.documentElement.lang = lang;
    document.documentElement.setAttribute("data-lang", lang);
    const sel = document.getElementById("selLang");
    if (sel) { sel.value = lang; sel.addEventListener("change", () => setLang(sel.value)); }
    if (lang === "uk") return;
    apply(document.documentElement);
    new MutationObserver((ms) => {
      for (const m of ms) {
        if (m.type === "characterData") trText(m.target);
        else if (m.type === "attributes") trAttrs(m.target);
        else m.addedNodes.forEach((n) => apply(n));
      }
    }).observe(document.documentElement, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ATTRS });
  }
  function setLang(l) {
    if (!LANGS[l] || l === lang) return;
    try { localStorage.setItem("dsp-lang", l); } catch (e) { /* storage unavailable */ }
    location.reload();
  }
  window.I18N = { get lang() { return lang; }, LANGS, t, apply, setLang };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start); else start();
})();
