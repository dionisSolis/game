# game
Level 21. Hackathon. 

## Структура проекта
```text
src/
├── main.ts                    # Точка входа (инициализация Phaser)
├── scenes/
│   ├── BootScene.ts           # Загрузка ресурсов (спрайты)
│   ├── HubScene.ts            # Хаб с дверями
│   └── LevelStackScene.ts     # Уровень "Стек"
├── objects/
│   ├── Book.ts                # Класс книги (позиция, анимации)
│   └── Door.ts                # Класс двери (для хаба)
├── ui/
│   └── CodeEditor.ts          # Обертка над CodeMirror (Настя)
├── utils
│   └── SaveManager.ts         # Реализация сохранения
└── code-execution/            # интеграция С++
    ├── Judge0Client.ts
    ├── OutputParser.ts
    └── ExecuteCode.ts
```
