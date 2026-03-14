# Web Checklist (Uevent)

Отдельный чек-лист только для фронтенда: что уже сделано и что нужно реализовать.

## 1) Что уже реализовано (Web)

### Базовая архитектура
- [x] React Router v7 + SSR.
- [x] Feature-Sliced структура (`entities`, `features`, `pages`, `widgets`, `shared`).
- [x] Базовый API-слой на Axios (`shared/api`) и entity API-клиенты.

### UI/UX и инфраструктура фронта
- [x] Темная/светлая тема без FOUC (сохранение в cookie/localStorage).
- [x] i18n (`en`/`ua`) с SSR-совместимостью.
- [x] 30+ переиспользуемых UI-компонентов.
- [x] Адаптивный UI основных экранов (десктоп + мобильный drawer для фильтров).

### Страницы и фичи (UI)
- [x] Главная страница.
- [x] Список событий (Explore) с визуальными фильтрами.
- [x] Детальная страница события (галерея, карточки билетов, инфо).
- [x] Профили пользователя/организации и формы редактирования.
- [x] Auth modal (login/register user/org) на уровне интерфейса.
- [x] Search modal на уровне интерфейса.

## 2) Что не реализовано / требует доведения (Web)

### Интеграция с backend (критично)
- [ ] Убрать mock-данные на страницах и перейти на реальные API-запросы.
- [ ] Подключить React Query для получения/кэширования данных на ключевых страницах.
- [ ] Обработать loading/empty/error состояния везде, где есть запросы.
- [ ] Нормализовать типы ответов API и ошибки (единый контракт DTO <-> UI).
- [x] `COPILOT-DONE (partial)` Реальные API уже подключены для `/events`, `/events/:id`, `/organizations`, `/organizations/:id`.
- [x] `COPILOT-DONE (partial)` Для этих маршрутов включены React Query и базовые `loading/error` состояния.

### Формы (критично)
- [ ] Auth формы: реальный submit в backend (вместо `preventDefault()` без запросов).
- [ ] Event create/edit: отправка формы в backend, обработка ошибок валидации.
- [ ] Profile/org edit: реальное сохранение данных (вместо `alert()`).
- [ ] Единая схема клиентской валидации (zod/react-hook-form или эквивалент).

### Explore / Event pages (обязательная часть методички)
- [ ] Поиск по тексту в Explore, связанный с backend-параметрами.
- [ ] Сортировка в Explore (например: по дате, популярности, цене).
- [ ] Подписка на событие.
- [ ] Подписка на организатора.
- [ ] Комментарии на странице события (лента + создание).
- [ ] Блоки "Другие события организатора" и "Похожие события".
- [ ] Ввод и применение промокода перед покупкой билета.
- [ ] Интеграция карты (Map API) на странице события.

### Личный кабинет пользователя
- [ ] Раздел "Мои события" (реальные данные).
- [ ] Раздел "Мои билеты" (реальные данные).
- [ ] Раздел "Уведомления" (список + read/unread).
- [ ] Раздел "Настройки профиля" с сохранением.
- [ ] Настройка приватности: скрывать имя из публичного списка гостей.

### Организаторский функционал
- [ ] Загрузка изображений (лого организации, постер события).
- [ ] Постер по умолчанию, если изображение не загружено.
- [ ] Поля настроек события: лимит мест, приватность списка гостей, отложенная публикация.
- [ ] Создание промокодов.
- [ ] Редирект после успешной оплаты.
- [ ] Подсказки (hints) возле сложных полей.

### Покупка и post-purchase flow
- [ ] UI-flow оплаты (Stripe checkout/session).
- [ ] Экран/статус успешной оплаты.
- [ ] Отображение/доставка билета после оплаты.

### Качество и выпуск
- [ ] Полная проверка адаптивности (mobile/tablet/desktop) по чек-листу экранов.
- [ ] E2E smoke на критических user flow (login -> browse -> buy).
- [ ] Обновить README (web setup + env + сценарии).

## 3) Рекомендуемый порядок работ (с чего начать)

### Sprint 1 (самый высокий приоритет)
- [x] `COPILOT-DONE` Подключены реальные API на `/events`, `/events/:id`, `/organizations`, `/organizations/:id`.
- [x] `COPILOT-DONE` Переведены страницы и фильтры на React Query hooks и данные из API (без мок-констант для категорий/тегов/городов в этих флоу).
- [ ] `BLOCKED (backend)` Починить submit в AuthModal и базовый login flow (нужны auth endpoints на бэке).

### Sprint 1 — что именно сделано в коде (`COPILOT-DONE`)
- [x] `apps/web/src/entities/Event/api/event.api.ts`: `useEvents/useEvent` читают реальные данные из backend и мапят их в UI-модель.
- [x] `apps/web/src/entities/Organization/api/organization.api.ts`: `useOrgs/useOrg` читают реальные данные из backend и мапят их в UI-модель.
- [x] `apps/web/src/pages/Event/ui/EventPage.tsx`: страница события переведена с `MOCK_EVENTS` на `useEvent` с `loading/error` состояниями.
- [x] `apps/web/src/pages/Organizations/ui/OrgsPage.tsx`: категории больше не берутся из `MOCK_ORGS`, вычисляются из API.
- [x] `apps/web/src/pages/Events/ui/EventsPage.tsx`: опции тегов/городов теперь строятся из API-каталога.
- [x] `apps/web/src/pages/Events/model/useEventsFilters.ts`: удалена прямая зависимость от `MOCK_EVENTS`.
- [x] `apps/web/src/pages/Events/ui/EventsFilterBar.tsx`: принимает `tags/cities` из страницы.
- [x] `apps/web/src/pages/Events/ui/EventsMobileFilters.tsx`: принимает `tags/cities` из страницы.
- [x] `apps/web/src/app/event.tsx`: убрана meta-зависимость от моков.
- [x] `apps/web/src/app/organization.tsx`: убрана meta-зависимость от моков.
- [x] `apps/api/src/main.ts`: добавлен `app.enableCors()` — без него браузер блокировал все cross-origin запросы к API (CORS-заголовки отсутствовали).
- [x] `apps/web/src/pages/Event/ui/EventPage.tsx`: accessibility-фикс — gallery-триггер заменён с `<div role="button">` на `<button>`, убраны non-null assertions.
- [x] `apps/web/src/pages/Home/ui/HomePage.tsx`: блоки статистики и trending-событий переведены с моков на `useEvents/useOrgs`.
- [x] `apps/web/src/features/SearchModal/ui/SearchModal.tsx`: поиск событий и организаций переведён с моков на `useEvents/useOrgs` с состояниями загрузки/ошибки.
- [x] `apps/web/src/entities/User/api/user.api.ts`: чтение пользователей переведено на реальные `/users` и `/users/:id`, добавлены hooks `useUsers/useUser/useMe`.
- [x] `apps/web/src/pages/ProfileView/ui/ProfileViewPage.tsx`: профиль переведён с моков на `useMe` + `useEvents` с `loading/error` состояниями.
- [x] `apps/web/src/pages/UserProfile/ui/UserProfilePage.tsx`: публичный профиль переведён с моков на `useUser` + `useEvents` с `loading/error` состояниями.
- [x] `apps/web/src/features/EventCreate/ui/EventCreate.tsx`: выбор организации в форме создания события переведён с моков на `useOrgs`.
- [x] `apps/web/src/app/user.tsx`: убрана meta-зависимость от моков.
- [x] `apps/web/src/pages/ProfileEdit/ui/ProfileEditPage.tsx`: форма редактирования профиля переведена с моков на `useMe` с loading/error состояниями.

### Sprint 2
- [ ] Подключить profile/org edit формы.
- [ ] Сделать "Мои события", "Мои билеты", "Уведомления".
- [ ] Добавить комментарии + подписки (event/org).

### Sprint 3
- [ ] Карта, промокоды, похожие события, другие события организатора.
- [ ] UI-поток оплаты + success state + билет.

## 4) Definition of Done для Web MVP

- [ ] Ни одна ключевая страница не использует mock-данные.
- [ ] Все главные формы отправляют данные в backend и показывают ошибки.
- [ ] Критические user flow проходят: регистрация/логин, поиск события, открытие события, покупка билета.
- [ ] UI корректно работает на mobile/tablet/desktop.
